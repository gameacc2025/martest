import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  apiGet,
  apiGetPaginated,
  apiPost,
  apiPut,
  apiPatch,
  apiDelete,
  getErrorStatus,
  getErrorCode,
  getErrorMessage,
  getErrorDetails,
} from './apiClient.js'
import { setAccessToken, clearAccessToken } from './tokenMemory.js'
import { ERROR_TYPES } from './types/index.js'

/**
 * Behaviour of the request layer every app actually consumes (apiGet/apiPost/...).
 *
 * Network boundary: `fetch` is stubbed globally — no server, no DNS, fully
 * deterministic. Everything else (URL building, headers, body serialization,
 * envelope unwrapping, status→error mapping) runs through the REAL
 * HttpClient/AuthMiddleware/ParserMiddleware stack.
 */

const fetchMock = vi.fn()

function jsonResponse(body, init = {}) {
  return new Response(JSON.stringify(body), {
    status: init.status ?? 200,
    statusText: init.statusText ?? '',
    headers: { 'Content-Type': 'application/json', ...(init.headers || {}) },
  })
}

/** Last (url, options) pair handed to fetch. */
function lastCall() {
  const [url, options] = fetchMock.mock.calls[fetchMock.mock.calls.length - 1]
  return { url, options }
}

beforeEach(() => {
  fetchMock.mockReset()
  clearAccessToken()
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  vi.unstubAllGlobals()
  clearAccessToken()
})

describe('request configuration', () => {
  it('prefixes relative paths with the configured API base URL', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ data: { id: 1 } }))

    await apiGet('/auth/me')

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(lastCall().url).toMatch(/\/api\/v1\/auth\/me$/)
  })

  it('serializes query params and drops null/undefined ones', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ data: [] }))

    await apiGet('/users', { params: { page: 2, q: 'car', sort: undefined, missing: undefined } })

    const { url } = lastCall()
    expect(url).toContain('page=2')
    expect(url).toContain('q=car')
    expect(url).not.toContain('sort')
    expect(url).not.toContain('missing')
  })

  it('sends JSON content type and includes credentials on every request', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ data: null }))

    await apiGet('/ping')

    const { options } = lastCall()
    expect(options.headers.get('Content-Type')).toBe('application/json')
    expect(options.credentials).toBe('include')
    expect(options.method).toBe('GET')
    expect('body' in options).toBe(false)
  })

  it('serializes POST bodies as JSON', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ data: { ok: true } }))

    await apiPost('/auth/login', { email: 'a@b.c', password: 'secret' })

    const { options } = lastCall()
    expect(options.method).toBe('POST')
    expect(JSON.parse(options.body)).toEqual({ email: 'a@b.c', password: 'secret' })
  })

  it('carries the correct method for PUT/PATCH/DELETE', async () => {
    // A Response body may only be consumed once, so every call gets a fresh one.
    fetchMock.mockImplementation(() => Promise.resolve(jsonResponse({ data: null })))
    await apiPut('/a', { x: 1 })
    await apiPatch('/b', { y: 2 })
    await apiDelete('/c')

    const methods = fetchMock.mock.calls.map(([, options]) => options.method)
    expect(methods).toEqual(['PUT', 'PATCH', 'DELETE'])
    // DELETE sends no body; PUT does.
    expect(fetchMock.mock.calls[1][1].body).toBe(JSON.stringify({ y: 2 }))
    expect(fetchMock.mock.calls[2][1].body).toBeUndefined()
  })

  it('never forces a Content-Type header for FormData uploads', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ data: { avatarUrl: 'x' } }))
    const form = new FormData()
    form.append('avatar', new Blob(['x']), 'a.png')

    await apiPost('/users/me/avatar', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })

    // A pre-set multipart content-type without a boundary corrupts uploads.
    const { options } = lastCall()
    expect(options.headers.get('Content-Type')).toBeNull()
  })

  it('attaches the in-memory access token as a Bearer header', async () => {
    setAccessToken('test-access-token')
    fetchMock.mockResolvedValue(jsonResponse({ data: null }))

    await apiGet('/auth/me')

    expect(lastCall().options.headers.get('Authorization')).toBe('Bearer test-access-token')
  })

  it('omits the Authorization header when no token is held', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ data: null }))

    await apiGet('/auth/me')

    expect(lastCall().options.headers.get('Authorization')).toBeNull()
  })
})

describe('response parsing (envelope unwrapping)', () => {
  it('unwraps the { data } envelope for GET', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ data: { id: 7, name: 'Router' } }))
    await expect(apiGet('/products/7')).resolves.toEqual({ id: 7, name: 'Router' })
  })

  it('passes a legacy raw body through untouched', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ id: 5 }))
    await expect(apiGet('/legacy')).resolves.toEqual({ id: 5 })
  })

  it('returns { data, meta } for paginated responses', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ data: [{ id: 1 }], meta: { page: 1, total: 42 } }),
    )
    await expect(apiGetPaginated('/users?page=1')).resolves.toEqual({
      data: [{ id: 1 }],
      meta: { page: 1, total: 42 },
    })
  })

  it('reports meta: null for a legacy pagination body', async () => {
    fetchMock.mockResolvedValue(jsonResponse([{ id: 1 }]))
    await expect(apiGetPaginated('/legacy')).resolves.toEqual({
      data: [{ id: 1 }],
      meta: null,
    })
  })

  it('unwraps mutation responses too', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ data: { id: 9 }, meta: {} }, { status: 201 }))
    await expect(apiPost('/items', { name: 'x' })).resolves.toEqual({ id: 9 })
  })
})

describe('HTTP errors', () => {
  it('maps 404 to a CLIENT error carrying the server envelope', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(
        { error: { code: 'NOT_FOUND', message: 'محصول یافت نشد', details: { id: 3 } } },
        { status: 404 },
      ),
    )

    const error = await apiGet('/products/3').catch((e) => e)
    expect(error).toMatchObject({ status: 404, code: 'NOT_FOUND', type: ERROR_TYPES.CLIENT })
    expect(error.serverMessage).toBe('محصول یافت نشد')
    expect(error.details).toEqual({ id: 3 })
  })

  it('maps 403 to an AUTH error with status attached', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ error: { code: 'FORBIDDEN', message: 'no access' } }, { status: 403 }),
    )

    const error = await apiGet('/admin/users').catch((e) => e)
    expect(error).toMatchObject({
      status: 403,
      code: 'FORBIDDEN',
      type: ERROR_TYPES.AUTH,
      serverMessage: 'no access',
    })
  })

  it('maps 429 to RATE_LIMIT and 500 to SERVER', async () => {
    fetchMock.mockResolvedValue(jsonResponse({}, { status: 429 }))
    const rate = await apiGet('/a').catch((e) => e)
    expect(rate).toMatchObject({ status: 429, type: ERROR_TYPES.RATE_LIMIT })

    fetchMock.mockResolvedValue(jsonResponse({}, { status: 500 }))
    const server = await apiGet('/b').catch((e) => e)
    expect(server).toMatchObject({ status: 500, type: ERROR_TYPES.SERVER })
  })

  it('does not retry or refresh on a generic 401 without TOKEN_EXPIRED', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ error: { code: 'BAD_CREDENTIALS', message: 'wrong' } }, { status: 401 }),
    )

    const error = await apiPost('/auth/login', {}).catch((e) => e)
    expect(error).toMatchObject({ status: 401, code: 'BAD_CREDENTIALS', type: ERROR_TYPES.AUTH })
    // Exactly one round trip: authentication failure is NOT refreshable.
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
})

describe('network failures and timeouts', () => {
  it('surfaces a fetch rejection as a NETWORK error', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'))

    const error = await apiGet('/anything').catch((e) => e)
    expect(error).toMatchObject({
      type: ERROR_TYPES.NETWORK,
      message: 'Network error: Failed to fetch',
    })
    expect(error.status).toBeUndefined()
  })

  it('aborts and reports a TIMEOUT error when the deadline passes', async () => {
    fetchMock.mockImplementation(
      (_url, options) =>
        new Promise((_, reject) => {
          options.signal.addEventListener('abort', () => {
            const abortError = new Error('This operation was aborted')
            abortError.name = 'AbortError'
            reject(abortError)
          })
        }),
    )

    const error = await apiGet('/slow', { timeout: 5 }).catch((e) => e)
    expect(error).toMatchObject({ type: ERROR_TYPES.TIMEOUT })
    expect(error.message).toContain('5ms')
  })
})

describe('error accessor helpers (priority chains)', () => {
  it('prefers direct props set by the HTTP layer', () => {
    const error = { status: 409, code: 'DUPLICATE', serverMessage: 'dup', details: ['x'] }
    expect(getErrorStatus(error)).toBe(409)
    expect(getErrorCode(error)).toBe('DUPLICATE')
    expect(getErrorMessage(error)).toBe('dup')
    expect(getErrorDetails(error)).toEqual(['x'])
  })

  it('falls back to the _{ error } envelope when direct props absent', () => {
    const error = { response: { data: { error: { code: 'E1', message: 'm', details: [1] } } } }
    expect(getErrorStatus(error)).toBeNull()
    expect(getErrorCode(error)).toBe('E1')
    expect(getErrorMessage(error)).toBe('m')
    expect(getErrorDetails(error)).toEqual([1])
  })

  it('understands the legacy flat body format', () => {
    const error = { data: { code: 'FLAT', message: 'flat message' } }
    expect(getErrorCode(error)).toBe('FLAT')
    expect(getErrorMessage(error)).toBe('flat message')
  })

  it('returns safe defaults for a completely unknown error', () => {
    expect(getErrorStatus(undefined)).toBeNull()
    expect(getErrorCode(undefined)).toBe('UNKNOWN_ERROR')
    expect(getErrorMessage(undefined)).toBe('An unexpected error occurred')
    expect(getErrorDetails(null)).toBeNull()
  })
})