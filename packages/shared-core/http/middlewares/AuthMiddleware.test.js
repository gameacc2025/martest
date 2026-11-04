import { describe, it, expect, vi, beforeEach } from 'vitest'
import AuthMiddleware from './AuthMiddleware.js'
import { bridgeRefresh, bridgeLogout } from '../authBridge.js'

/**
 * The four guarantees AuthMiddleware makes to every app:
 *
 *   1. Outgoing requests carry `Authorization: Bearer <token>` when a token is
 *      held in memory.
 *   2. The refresh request itself (and `_skipAuth` requests) bypass the
 *      middleware entirely — no header, no retry, which is what prevents a
 *      refresh-from-refresh deadlock.
 *   3. Only 401 + `TOKEN_EXPIRED` triggers a refresh, and the original request
 *      is retried exactly once with the new token.
 *   4. When the session is truly over (refresh failed, or the retry is 401
 *      again) the store is told to log out — never a refresh loop.
 *
 * The network is NOT involved: `next()` is a controllable fake, and the auth
 * bridge (the only outbound session call) is mocked at its module boundary.
 */

vi.mock('../authBridge.js', () => ({
  bridgeRefresh: vi.fn(),
  bridgeLogout: vi.fn(async () => {}),
}))

/** A parsed, non-OK response as the middleware sees it (post-ParserMiddleware). */
function expiredResponse(extra = {}) {
  return {
    status: 401,
    data: { error: { code: 'TOKEN_EXPIRED', message: 'access token expired' } },
    ...extra,
  }
}

function okResponse(extra = {}) {
  return { status: 200, data: { id: 1 }, ...extra }
}

function makeMiddleware(token = 'token-1') {
  return new AuthMiddleware({ getToken: () => token })
}

beforeEach(() => {
  vi.clearAllMocks()
  bridgeRefresh.mockResolvedValue('fresh-token')
  bridgeLogout.mockResolvedValue(undefined)
})

describe('Authorization header injection', () => {
  it('adds a Bearer header from the in-memory token before calling next', async () => {
    const middleware = makeMiddleware('token-1')
    const next = vi.fn(async () => okResponse())

    await middleware.handle({ url: '/users', headers: { 'X-Trace': 't' } }, next)

    expect(next).toHaveBeenCalledTimes(1)
    const sent = next.mock.calls[0][0]
    expect(sent.headers.Authorization).toBe('Bearer token-1')
    // Pre-existing headers survive the injection.
    expect(sent.headers['X-Trace']).toBe('t')
  })

  it('does not add an Authorization header when no token is held', async () => {
    const middleware = makeMiddleware(null)
    const next = vi.fn(async () => okResponse())

    await middleware.handle({ url: '/public', headers: {} }, next)

    expect(next.mock.calls[0][0].headers.Authorization).toBeUndefined()
  })

  it('keeps going even if the token source throws', async () => {
    const middleware = new AuthMiddleware({
      getToken: () => {
        throw new Error('storage blocked')
      },
    })
    const next = vi.fn(async () => okResponse())

    await expect(middleware.handle({ url: '/x', headers: {} }, next)).resolves.toBeTruthy()
    expect(next.mock.calls[0][0].headers.Authorization).toBeUndefined()
  })

  it('replaces (not duplicates) the header on the retry', async () => {
    const middleware = makeMiddleware('old-token')
    const next = vi.fn(async () => expiredResponse())
    const config = { url: '/x', headers: {} }

    await middleware.handle(config, next)

    expect(next.mock.calls[1][0].headers.Authorization).toBe('Bearer fresh-token')
    expect(Object.keys(next.mock.calls[1][0].headers).filter((h) => h === 'Authorization')).toHaveLength(1)
  })
})

describe('bypass rules (no refresh-refreshes-itself deadlock)', () => {
  it('sends the refresh request through untouched: no header, no retry', async () => {
    const middleware = makeMiddleware('token-1')
    const next = vi.fn(async () => expiredResponse())

    const response = await middleware.handle({ url: '/auth/refresh', headers: {} }, next)

    expect(next).toHaveBeenCalledTimes(1)
    expect(next.mock.calls[0][0].headers.Authorization).toBeUndefined()
    expect(bridgeRefresh).not.toHaveBeenCalled()
    expect(bridgeLogout).not.toHaveBeenCalled()
    expect(response.status).toBe(401)
  })

  it('honours the _skipAuth flag for opt-out requests', async () => {
    const middleware = makeMiddleware('token-1')
    const next = vi.fn(async () => expiredResponse())

    await middleware.handle({ url: '/anything', headers: {}, _skipAuth: true }, next)

    expect(next).toHaveBeenCalledTimes(1)
    expect(next.mock.calls[0][0].headers.Authorization).toBeUndefined()
    expect(bridgeRefresh).not.toHaveBeenCalled()
  })
})

describe('token refresh on 401 TOKEN_EXPIRED', () => {
  it('refreshes once and retries the original request with the new token', async () => {
    const middleware = makeMiddleware('old-token')
    const next = vi
      .fn()
      .mockResolvedValueOnce(expiredResponse())
      .mockResolvedValueOnce(okResponse())
    const config = { url: '/orders', headers: {} }

    const response = await middleware.handle(config, next)

    expect(bridgeRefresh).toHaveBeenCalledTimes(1)
    expect(next).toHaveBeenCalledTimes(2)
    expect(config._retry).toBe(true)
    expect(next.mock.calls[1][0].headers.Authorization).toBe('Bearer fresh-token')
    expect(response.status).toBe(200)
    expect(bridgeLogout).not.toHaveBeenCalled()
  })

  it('reads the nested { error: { code } } envelope too', async () => {
    const middleware = makeMiddleware('old')
    const nested = expiredResponse({
      data: { error: { code: 'TOKEN_EXPIRED', message: 'expired' } },
    })
    const next = vi.fn().mockResolvedValueOnce(nested).mockResolvedValueOnce(okResponse())

    await middleware.handle({ url: '/nested', headers: {} }, next)

    expect(bridgeRefresh).toHaveBeenCalledTimes(1)
    expect(next).toHaveBeenCalledTimes(2)
  })

  it('logs out (and returns the 401) when the refresh itself fails', async () => {
    bridgeRefresh.mockRejectedValue(new Error('refresh token invalid'))
    const middleware = makeMiddleware('old-token')
    const next = vi.fn(async () => expiredResponse())
    const config = { url: '/profile', headers: {} }

    const response = await middleware.handle(config, next)

    expect(bridgeRefresh).toHaveBeenCalledTimes(1)
    expect(bridgeLogout).toHaveBeenCalledWith({ reason: 'session_expired' })
    // The response is still surfaced so callers can render an error state.
    expect(response.status).toBe(401)
    expect(next).toHaveBeenCalledTimes(1)
    expect(config._retry).toBeUndefined()
  })

  it('logs out when the retried request is STILL 401 — no refresh loop', async () => {
    const middleware = makeMiddleware('old-token')
    const next = vi.fn(async () => expiredResponse())
    const config = { url: '/still-broken', headers: {} }

    const response = await middleware.handle(config, next)

    expect(bridgeRefresh).toHaveBeenCalledTimes(1) // exactly one refresh attempt
    expect(next).toHaveBeenCalledTimes(2) // exactly one retry
    expect(bridgeLogout).toHaveBeenCalledTimes(1)
    expect(bridgeLogout).toHaveBeenCalledWith({ reason: 'session_expired' })
    expect(response.status).toBe(401)
  })

  it('never retries a request that already had its one retry (_retry flag)', async () => {
    const middleware = makeMiddleware('old-token')
    const next = vi.fn(async () => expiredResponse())
    const config = { url: '/x', headers: {}, _retry: true }

    await middleware.handle(config, next)

    expect(next).toHaveBeenCalledTimes(1)
    expect(bridgeRefresh).not.toHaveBeenCalled()
  })
})

describe('401s that are NOT refreshable', () => {
  it('leaves a bad-credentials 401 alone (no refresh, no logout)', async () => {
    const middleware = makeMiddleware('token-1')
    const next = vi.fn(async () => ({
      status: 401,
      data: { error: { code: 'BAD_CREDENTIALS', message: 'wrong password' } },
    }))

    const response = await middleware.handle({ url: '/auth/login', headers: {} }, next)

    expect(bridgeRefresh).not.toHaveBeenCalled()
    expect(bridgeLogout).not.toHaveBeenCalled()
    expect(next).toHaveBeenCalledTimes(1)
    expect(response.data.error.code).toBe('BAD_CREDENTIALS')
  })

  it('passes non-401 responses straight through', async () => {
    const middleware = makeMiddleware('token-1')
    const next = vi.fn(async () => ({ status: 403, data: { error: { code: 'FORBIDDEN' } } }))

    await middleware.handle({ url: '/admin', headers: {} }, next)

    expect(next).toHaveBeenCalledTimes(1)
    expect(bridgeRefresh).not.toHaveBeenCalled()
    expect(bridgeLogout).not.toHaveBeenCalled()
  })

  it('handles the flat { code } error body variant', async () => {
    const middleware = makeMiddleware('token-1')
    const next = vi.fn(async () => ({
      status: 401,
      data: { error: true, code: 'SESSION_REVOKED' },
    }))

    await middleware.handle({ url: '/x', headers: {} }, next)

    expect(bridgeRefresh).not.toHaveBeenCalled()
    expect(next).toHaveBeenCalledTimes(1)
  })
})