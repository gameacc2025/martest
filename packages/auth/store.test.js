import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { createAuthStore } from './store.js'
import { getAccessToken, setAccessToken as setMemoryToken, clearAccessToken } from '@telecom/shared-core/http/tokenMemory.js'

vi.mock('@telecom/shared-core/http/apiClient', () => ({
  apiGet: vi.fn(),
  apiPost: vi.fn(),
  apiPatch: vi.fn(),
  apiDelete: vi.fn(),
}))

vi.mock('@telecom/api-client', () => ({
  endpoints: {
    auth: {
      login: '/auth/login',
      register: '/auth/register',
      registerCompany: '/auth/register-company',
      logout: '/auth/logout',
      logoutAll: '/auth/logout-all',
      refresh: '/auth/refresh',
      me: '/auth/me',
      forgotPassword: '/auth/forgot-password',
      resetPassword: '/auth/reset-password',
    },
    settings: { profile: '/settings/profile', changePassword: '/settings/password' },
  },
  // What the real handler contributes to the store: a human-readable message.
  handleApiError: vi.fn((err) => ({
    status: err?.status ?? null,
    code: 'MOCK_ERROR',
    message: err?.serverMessage || err?.message || 'خطا',
    details: null,
  })),
  showSessionToast: vi.fn(),
}))

import { apiGet, apiPost, apiPatch } from '@telecom/shared-core/http/apiClient'
import { showSessionToast } from '@telecom/api-client'

/**
 * Auth store: the single owner of authentication state for every app.
 *
 * The invariants under test:
 *   - login/getProfile funnel into one canonical context shape persisted to
 *     localStorage, while the ACCESS TOKEN lives only in memory.
 *   - refresh() is idempotent (concurrent 401s share one /auth/refresh —
 *     dual refresh would rotate a one-time token twice and log the user out).
 *   - ensureAuthenticated() transparently recovers a session (page reload with
 *     an httpOnly cookie) or performs a full logout with a single toast.
 *   - permission checks are purely permission-driven: '*' grants everything;
 *     roles gate in-app visibility but never app selection (accessType only).
 *
 * Network boundary: the four API helpers are module mocks. localStorage and
 * tokenMemory are real (happy-dom), which is exactly the surface whose
 * secrecy these tests police.
 */

// ── Helpers ──────────────────────────────────────────────────

/** A structurally valid JWT with an `exp` we control (signature never checked). */
function makeJwt({ expInSeconds = 3600, sub = 'user-1' } = {}) {
  const payload = { sub, exp: Math.floor(Date.now() / 1000) + expInSeconds }
  const b64 = btoa(JSON.stringify(payload)).replace(/=+$/, '')
  return `header.${b64}.signature`
}

function loginContext(overrides = {}) {
  return {
    user: { id: 1, email: 'user@example.com' },
    profile: { firstName: 'User', lastName: 'Example' },
    accessProfile: { type: 'COMPANY', companyId: 7 },
    roles: ['COMPANY_MANAGER'],
    permissions: ['products.read', 'products.update'],
    tokens: { accessToken: makeJwt(), expiresIn: 3600 },
    ...overrides,
  }
}

/** Route the mocked apiPost by URL, like one shared HTTP boundary would. */
function routeApiPost(impl) {
  apiPost.mockImplementation(async (url, data, config) => impl(url, data, config))
}

let useAuthStore

beforeEach(() => {
  vi.clearAllMocks()
  localStorage.clear()
  window.sessionStorage.clear()
  clearAccessToken()

  setActivePinia(createPinia())
  useAuthStore = createAuthStore()

  // Default happy path: every endpoint answers; refresh mints a fresh token.
  routeApiPost((url) => {
    if (url.includes('/auth/refresh')) return { tokens: { accessToken: makeJwt(), expiresIn: 900 } }
    return { ok: true }
  })
  apiGet.mockResolvedValue({})
})

afterEach(() => {
  vi.useRealTimers()
  clearAccessToken()
})

const storageUser = () => JSON.parse(localStorage.getItem('user') ?? 'null')

describe('login', () => {
  it('stores the full auth context, persists it, and holds the token in memory only', async () => {
    const ctx = loginContext()
    apiPost.mockResolvedValueOnce(ctx)

    const store = useAuthStore()
    const result = await store.login({ email: 'user@example.com', password: 'pw' })

    expect(result).toEqual(ctx)
    expect(apiPost).toHaveBeenCalledWith('/auth/login', {
      email: 'user@example.com',
      password: 'pw',
    })

    // Identity → state and localStorage
    expect(store.user.email).toBe('user@example.com')
    expect(storageUser()).toEqual(ctx.user)
    expect(JSON.parse(localStorage.getItem('accessProfile'))).toEqual(ctx.accessProfile)
    expect(store.roles).toEqual(['COMPANY_MANAGER'])
    expect(store.permissions).toEqual(['products.read', 'products.update'])

    // Token flows: memory yes, storage never
    expect(store.isAuthenticated).toBe(true)
    expect(getAccessToken()).toBe(ctx.tokens.accessToken)
    storedTokensWithoutSecrets(ctx.tokens.accessToken)
    expect(store.loading).toBe(false)
    expect(store.error).toBeNull()
  })

  it('reports the error and never half-authenticates on failure', async () => {
    apiPost.mockRejectedValueOnce({ status: 401, serverMessage: 'bad credentials', message: 'x' })

    const store = useAuthStore()
    await expect(store.login({ email: 'a@b.c', password: 'nope' })).rejects.toBeTruthy()

    expect(store.error).toBe('bad credentials')
    expect(store.isAuthenticated).toBe(false)
    expect(store.user).toBeNull()
    expect(localStorage.getItem('user')).toBeNull()
    expect(store.loading).toBe(false)
    expect(getAccessToken()).toBeNull()
  })
})

function storedTokensWithoutSecrets(secretToken) {
  const persisted = JSON.parse(localStorage.getItem('tokens') ?? 'null')
  expect(persisted).not.toBeNull()
  // Metadata may be persisted — secrets never.
  expect(persisted.accessToken).toBeUndefined()
  expect(persisted.refreshToken).toBeUndefined()
  expect(localStorage.getItem('token')).toBeNull() // legacy raw-token key
  expect(secretToken).toBeTruthy()
}

describe('secret hygiene at rest', () => {
  it('persists token metadata but strips the access token from storage', async () => {
    apiPost.mockResolvedValueOnce(loginContext({ tokens: { accessToken: 'THE-SECRET', expiresIn: 60 } }))
    const store = useAuthStore()
    await store.login({ email: 'a', password: 'b' })

    storedTokensWithoutSecrets('THE-SECRET')
    // The bundle itself survives so restoreSession knows a session exists.
    const persisted = JSON.parse(localStorage.getItem('tokens'))
    expect(persisted.expiresIn).toBe(60)
    expect(localStorage.getItem('user')).toBeTruthy()
    expect(store.isAuthenticated).toBe(true)
  })

  it('migrates a legacy persisted raw token into memory and wipes it from disk', () => {
    localStorage.setItem('tokens', JSON.stringify({ accessToken: 'legacy-secret', expiresIn: 30 }))
    localStorage.setItem('token', 'legacy-secret') // pre-migration raw key

    const store = useAuthStore()

    expect(getAccessToken()).toBe('legacy-secret') // adopted into memory
    expect(localStorage.getItem('token')).toBeNull() // raw key gone
    const persisted = JSON.parse(localStorage.getItem('tokens'))
    expect(persisted.accessToken).toBeUndefined() // stripped from the bundle
    expect(store.isAuthenticated).toBe(true)
  })
})

describe('permission checks', () => {
  it("grants everything through the '*' wildcard", () => {
    localStorage.setItem('permissions', JSON.stringify(['*']))
    const store = useAuthStore()

    expect(store.userPermissions).toEqual(['*'])
    expect(store.hasPermission('anything.at.all')).toBe(true)
    expect(store.hasAnyPermission(['a', 'b'])).toBe(true)
    expect(store.hasAllPermissions(['a', 'b'])).toBe(true)
  })

  it('is exact-match driven without the wildcard', () => {
    localStorage.setItem('permissions', JSON.stringify(['products.read', 'orders.read']))
    const store = useAuthStore()

    expect(store.hasPermission('products.read')).toBe(true)
    expect(store.hasPermission('products.delete')).toBe(false)
    expect(store.userPermissions).toEqual(['products.read', 'orders.read'])
  })

  it('hasAnyPermission needs one match; hasAllPermissions needs every match', () => {
    localStorage.setItem('permissions', JSON.stringify(['products.read']))
    const store = useAuthStore()

    expect(store.hasAnyPermission(['products.read', 'orders.read'])).toBe(true)
    expect(store.hasAllPermissions(['products.read', 'orders.read'])).toBe(false)
    expect(store.hasAllPermissions(['products.read'])).toBe(true)
  })

  it('treats empty inputs as "no restriction" (matches the shipped contract)', () => {
    localStorage.setItem('permissions', JSON.stringify([]))
    const store = useAuthStore()

    expect(store.hasPermission('')).toBe(true)
    expect(store.hasPermission(null)).toBe(true)
    expect(store.hasAnyPermission([])).toBe(true)
    expect(store.hasAllPermissions([])).toBe(true)
    expect(store.hasPermission('x')).toBe(false) // but a real ask still fails
  })
})

describe('roles and application selection (rbac conventions)', () => {
  it('derives role labels from strings or objects and flags SUPER_ADMIN', () => {
    localStorage.setItem('roles', JSON.stringify([{ name: 'SUPER_ADMIN' }, 'ORDER_MANAGER']))
    const store = useAuthStore()

    expect(store.hasRole('SUPER_ADMIN')).toBe(true) // labels are private; probe via API
    expect(store.isSuperAdmin).toBe(true)
    expect(store.isCompanyAdmin).toBe(false)
    expect(store.isAdmin).toBe(true)
    expect(store.hasRole('ORDER_MANAGER')).toBe(true)
    expect(store.hasRole('NOPE')).toBe(false)
  })

  it('resolves COMPANY_ADMIN/COMPANY legacy aliases to real backend roles', () => {
    localStorage.setItem('roles', JSON.stringify(['COMPANY_MANAGER']))
    const store = useAuthStore()

    expect(store.isCompanyAdmin).toBe(true) // real backend role name
    expect(store.isSuperAdmin).toBe(false)
    expect(store.hasRole('COMPANY_ADMIN')).toBe(true) // legacy alias
    expect(store.hasRole('COMPANY')).toBe(true) // legacy alias bucket
    expect(store.hasAnyRole(['SUPER_ADMIN', 'COMPANY'])).toBe(true)
    expect(store.hasAnyRole(['SUPER_ADMIN'])).toBe(false)
  })

  it('selects the app ONLY from accessProfile.type — roles never select', () => {
    localStorage.setItem('accessProfile', JSON.stringify({
      type: 'STAFF',
      companyId: null,
      company: { id: 3, name: 'ACME' },
    }))
    localStorage.setItem('roles', JSON.stringify(['COMPANY_MANAGER']))
    const store = useAuthStore()

    expect(store.accessType).toBe('STAFF')
    expect(store.isStaff).toBe(true)
    expect(store.isCompany).toBe(false)
    expect(store.isCustomer).toBe(false)
    expect(store.company).toEqual({ id: 3, name: 'ACME' })
    expect(store.companyId).toBe(3)
    // Company role does not turn a STAFF session into a company session.
    expect(store.isCompany).toBe(false)
  })

  it('marks a COMPANY session correctly', () => {
    localStorage.setItem('accessProfile', JSON.stringify({ type: 'COMPANY', companyId: 9 }))
    const store = useAuthStore()

    expect(store.isCompany).toBe(true)
    expect(store.isStaff).toBe(false)
    expect(store.companyId).toBe(9)
  })
})

describe('refresh (idempotent session renewal)', () => {
  it('shares ONE refresh between concurrent callers', async () => {
    const freshToken = makeJwt({ expInSeconds: 900 })
    routeApiPost((url) => {
      if (url.includes('/auth/refresh')) return { tokens: { accessToken: freshToken, expiresIn: 900 } }
      return { ok: true }
    })
    const store = useAuthStore()

    const [a, b, c] = await Promise.all([store.refresh(), store.refresh(), store.refresh()])

    expect(a).toBe(freshToken)
    expect(b).toBe(freshToken)
    expect(c).toBe(freshToken)
    expect(apiPost).toHaveBeenCalledTimes(1) // one rotation, not three
    expect(apiPost).toHaveBeenCalledWith('/auth/refresh', {}, { _skipAuth: true })
    expect(getAccessToken()).toBe(freshToken)
  })

  it('strips the fresh token from storage while keeping it in memory', async () => {
    const store = useAuthStore()
    await store.refresh()

    expect(getAccessToken()).not.toBeNull()
    const persisted = JSON.parse(localStorage.getItem('tokens') ?? 'null')
    expect(persisted?.accessToken).toBeUndefined()
  })

  it('surfaces a failed refresh and allows the NEXT attempt to try again', async () => {
    const store = useAuthStore()
    apiPost.mockRejectedValueOnce({ status: 401, serverMessage: 'refresh rejected', message: 'x' })

    await expect(store.refresh()).rejects.toBeTruthy()

    // The in-flight promise was released, so expiry can recover later.
    await expect(store.refresh()).resolves.toMatch(/[a-zA-Z0-9_-]/)
    expect(apiPost).toHaveBeenCalledTimes(2)
  })
})

describe('ensureAuthenticated (router guard contract)', () => {
  it('passes straight through when the in-memory token is still fresh', async () => {
    setMemoryToken(makeJwt({ expInSeconds: 3600 }))
    const store = useAuthStore()

    await expect(store.ensureAuthenticated('/admin/products')).resolves.toBe(true)
    expect(apiPost).not.toHaveBeenCalled() // no refresh, no logout
  })

  it('mints the FIRST token after a page reload (persisted context + httpOnly cookie)', async () => {
    localStorage.setItem('user', JSON.stringify({ id: 1, email: 'x@y.z' }))
    const store = useAuthStore()
    expect(store.token).toBeNull() // memory dies with the tab

    await expect(store.ensureAuthenticated('/admin')).resolves.toBe(true)

    expect(apiPost).toHaveBeenCalledWith('/auth/refresh', {}, { _skipAuth: true })
    expect(getAccessToken()).not.toBeNull()
    expect(store.isAuthenticated).toBe(true)
  })

  it('sends an anonymous visitor to logout, never touching the network auth flow', async () => {
    const store = useAuthStore()

    await expect(store.ensureAuthenticated('/secret')).resolves.toBe(false)

    expect(apiPost).toHaveBeenCalledWith('/auth/logout', {}, { _skipAuth: true })
    expect(apiPost).not.toHaveBeenCalledWith('/auth/refresh', expect.anything(), expect.anything())
    expect(store.isAuthenticated).toBe(false)
  })

  it('recovers an expired-token session via refresh', async () => {
    setMemoryToken(makeJwt({ expInSeconds: -30 }))
    const store = useAuthStore()
    expect(store.isAuthenticated).toBe(true)

    await expect(store.ensureAuthenticated()).resolves.toBe(true)
    // Old expired token replaced by the refreshed one.
    expect(getAccessToken()).not.toBeNull()
    expect(apiPost).toHaveBeenCalledWith('/auth/refresh', {}, { _skipAuth: true })
    expect(store.error).toBeNull()
  })

  it('logs out with a SINGLE session-expired toast when refresh fails', async () => {
    vi.useFakeTimers()
    setMemoryToken(makeJwt({ expInSeconds: -30 }))
    localStorage.setItem('user', JSON.stringify({ id: 1 }))
    localStorage.setItem('roles', JSON.stringify(['ADMIN']))
    const store = useAuthStore()
    apiPost.mockImplementation(async (url) => {
      if (url.includes('/auth/refresh')) throw { status: 401, serverMessage: 'refresh gone' }
      return { ok: true }
    })

    await expect(store.ensureAuthenticated('/admin/users')).resolves.toBe(false)

    // Full teardown happened.
    expect(store.user).toBeNull()
    expect(store.roles).toEqual([])
    expect(localStorage.getItem('user')).toBeNull()
    expect(getAccessToken()).toBeNull()

    // Exactly one toast for the expiry…:
    expect(showSessionToast).toHaveBeenCalledTimes(1)
    expect(showSessionToast).toHaveBeenCalledWith(
      'warn',
      'پایان نشست',
      'نشست شما به پایان رسیده است. لطفاً دوباره وارد شوید.',
    )
    // …and a second expiry inside the cooldown window stays silent.
    await store.logout({ reason: 'session_expired' })
    expect(showSessionToast).toHaveBeenCalledTimes(1)

    // Once the 4s cooldown releases, a genuinely new expiry notifies again.
    vi.advanceTimersByTime(4100)
    await store.logout({ reason: 'session_expired' })
    expect(showSessionToast).toHaveBeenCalledTimes(2)
  })
})

describe('logout (single owner of teardown)', () => {
  it('revokes the session and wipes every auth key from storage', async () => {
    apiPost.mockResolvedValueOnce(loginContext())
    const store = useAuthStore()
    await store.login({ email: 'a', password: 'b' })
    expect(localStorage.length).toBeGreaterThan(0)

    await store.logout()

    expect(apiPost).toHaveBeenCalledWith('/auth/logout', {}, { _skipAuth: true })
    expect(store.user).toBeNull()
    expect(store.profile).toBeNull()
    expect(store.accessProfile).toBeNull()
    expect(store.roles).toEqual([])
    expect(store.permissions).toEqual([])
    expect(store.isAuthenticated).toBe(false)
    expect(getAccessToken()).toBeNull()
    expect(localStorage.length).toBe(0)
    expect(store.tokens).toBeNull()
  })

  it('still tears down locally when the backend revocation fails', async () => {
    apiPost.mockResolvedValueOnce(loginContext())
    const store = useAuthStore()
    await store.login({ email: 'a', password: 'b' })
    apiPost.mockRejectedValueOnce(new Error('network down')) // /logout fails

    await expect(store.logout()).resolves.toBeUndefined()

    expect(store.isAuthenticated).toBe(false)
    expect(localStorage.length).toBe(0)
  })

  it('logs out every device with an explicit Bearer header', async () => {
    apiPost.mockResolvedValueOnce(loginContext())
    const store = useAuthStore()
    await store.login({ email: 'a', password: 'b' })
    const tokenUsed = getAccessToken()

    await store.logout({ allDevices: true })

    expect(apiPost).toHaveBeenCalledWith('/auth/logout-all', {}, {
      _skipAuth: true,
      headers: { Authorization: `Bearer ${tokenUsed}` },
    })
    expect(store.isAuthenticated).toBe(false)
  })

  it('does not throw when no router has been injected (framework-agnostic guard)', async () => {
    const store = useAuthStore()
    await expect(store.logout({ reason: null })).resolves.toBeUndefined() // getAuthRouter() → null
  })
})

describe('restoreSession (boot-time silent recovery)', () => {
  it('short-circuits when a token is already in memory', async () => {
    vi.useFakeTimers()
    setMemoryToken(makeJwt())
    const store = useAuthStore()

    await expect(store.restoreSession()).resolves.toBe(true)
    expect(apiPost).not.toHaveBeenCalled()
  })

  it('reports logged-out for an anonymous first visit without calling the API', async () => {
    vi.useFakeTimers()
    const store = useAuthStore()

    await expect(store.restoreSession()).resolves.toBe(false)
    expect(apiPost).not.toHaveBeenCalled()
  })

  it('silently recovers — and never throws — when the peer is broken', async () => {
    vi.useFakeTimers()

    // Happy path: persisted context + working refresh cookie.
    localStorage.setItem('user', JSON.stringify({ id: 1 }))
    let store = useAuthStore()
    await expect(store.restoreSession()).resolves.toBe(true)
    expect(getAccessToken()).not.toBeNull()

    // Broken path: refresh rejects → app starts logged out, no exception.
    clearAccessToken()
    setActivePinia(createPinia())
    const store2 = useAuthStore()
    localStorage.setItem('user', JSON.stringify({ id: 1 }))
    apiPost.mockImplementation(async (url) => {
      if (url.includes('/auth/refresh')) throw { status: 401, serverMessage: 'cookie gone' }
      return {}
    })
    await expect(store2.restoreSession()).resolves.toBe(false)
  })
})

describe('updateProfile', () => {
  it('stores only the nested personal profile returned by the settings API', async () => {
    const store = useAuthStore()
    const personalProfile = { id: 5, firstName: 'نرگس', lastName: 'رضایی', avatar: null, metadata: null }
    apiPatch.mockResolvedValueOnce({
      id: 1,
      email: 'buyer@example.com',
      phone: '09120000000',
      profile: personalProfile,
      accessProfile: null,
      roles: [{ role: { name: 'CUSTOMER_USER' } }],
    })

    const updated = await store.updateProfile({ firstName: 'نرگس' })

    expect(apiPatch).toHaveBeenCalledWith('/settings/profile', { firstName: 'نرگس' })
    expect(updated).toEqual(personalProfile)
    expect(store.profile).toEqual(personalProfile)
    expect(store.profile).not.toHaveProperty('email')
    expect(store.accessProfile).toBeNull()
  })
})

describe('getProfile', () => {
  it('refreshes identity state WITHOUT touching the session token', async () => {
    apiPost.mockResolvedValueOnce(loginContext())
    const store = useAuthStore()
    await store.login({ email: 'a', password: 'b' })
    const tokenBefore = getAccessToken()

    apiGet.mockResolvedValueOnce({
      user: { id: 1, email: 'changed@example.com' },
      profile: { firstName: 'New' },
      accessProfile: { type: 'STAFF' },
      roles: ['SUPPORT'],
      permissions: [],
    })
    const context = await store.getProfile()

    expect(apiGet).toHaveBeenCalledWith('/auth/me')
    expect(context.user.email).toBe('changed@example.com')
    expect(store.accessType).toBe('STAFF') // app selection can change server-side
    expect(getAccessToken()).toBe(tokenBefore) // keepTokens: true
    expect(storageUser().email).toBe('changed@example.com')
    expect(store.error).toBeNull()
  })

  it('exposes a readable error when /auth/me fails and rethrows for the caller', async () => {
    const store = useAuthStore()
    apiGet.mockRejectedValueOnce({ status: 500, serverMessage: 'boom', message: 'x' })

    await expect(store.getProfile()).rejects.toBeTruthy()
    expect(store.error).toBe('boom')
  })
})