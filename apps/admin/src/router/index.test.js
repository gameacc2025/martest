import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { setAuthRouter } from '@telecom/auth'
import { setAccessToken as setMemoryToken, clearAccessToken } from '@telecom/shared-core/http/tokenMemory.js'
import router from './index.js'
import { useAuthStore } from '../stores/auth'

/**
 * Admin app route guards — permission-dependent navigation.
 *
 * Rules under test (see the guard block at the bottom of index.js):
 *   1. `requiresAuth` routes demand a live session (ensureAuthenticated).
 *   2. Authenticated users are bounced off `guestOnly` routes.
 *   3. App selection is driven solely by accessProfile.type: a non-STAFF user
 *      may never land on an admin page, no matter what roles they hold.
 *   4. The login route hands an already-authenticated STAFF user straight to
 *      the dashboard instead of the website (no redirect loop).
 *   5. Unknown paths fall back to the root gate.
 *
 * Seeding goes through the store's own `setAuthContext` (+ the memory token),
 * because the store snapshots persisted identity when it is created — exactly
 * as it does at real boot.
 *
 * `setAuthRouter(null)` isolates pure guard decisions from browser-exit side
 * effects (logout pushing to /login, `window.location.href = <other app>`),
 * which happy-dom cannot perform and which are covered by the auth store's
 * own logout tests instead. `fetch` is stubbed in beforeEach: no test may
 * depend on a live server (the logout/refresh calls the guards trigger would
 * otherwise hit whatever is listening on the dev port).
 */

function makeJwt({ expInSeconds = 3600 } = {}) {
  const payload = { sub: 'u1', exp: Math.floor(Date.now() / 1000) + expInSeconds }
  return `h.${btoa(JSON.stringify(payload)).replace(/=+$/, '')}.s`
}

/** Load a live session into the already-created store (login-equivalent). */
function seedSession(store, { type = 'STAFF', roles = ['SUPER_ADMIN'], permissions = ['*'], expInSeconds = 3600 } = {}) {
  store.setAuthContext({
    user: { id: 1, email: 'staff@x.io' },
    profile: { firstName: 'Staff' },
    accessProfile: { type },
    roles,
    permissions,
  })
  setMemoryToken(makeJwt({ expInSeconds }))
}

let fetchMock

beforeEach(async () => {
  vi.unstubAllGlobals()
  localStorage.clear()
  window.sessionStorage.clear()
  clearAccessToken()
  setActivePinia(createPinia())
  useAuthStore() // instantiate with the (empty) storage above
  setAuthRouter(null) // guard decisions only — see file header
  // Deterministic network boundary: every guard-triggered HTTP call is stubbed.
  fetchMock = vi.fn(async () =>
    new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }),
  )
  vi.stubGlobal('fetch', fetchMock)
  await router.replace('/') // reset to a known route between tests
})

afterEach(() => {
  vi.unstubAllGlobals()
  clearAccessToken()
})

describe('route table', () => {
  it('exposes the critical admin routes by name', () => {
    const required = [
      'root',
      'login',
      'auth-start',
      'auth-callback',
      'admin-dashboard',
      'admin-users',
      'admin-companies',
      'admin-products',
      'admin-roles',
      'admin-permissions',
      'admin-orders',
      'admin-settings',
      'not-found',
    ]
    for (const name of required) {
      expect(router.hasRoute(name), `missing route: ${name}`).toBe(true)
    }
  })

  it('marks every dashboard child as requiresAuth', () => {
    for (const name of ['admin-dashboard', 'admin-users', 'admin-roles', 'admin-permissions']) {
      expect(router.resolve({ name }).meta.requiresAuth).toBe(true)
    }
    expect(router.resolve({ name: 'root' }).meta.requiresAuth).toBeUndefined()
    expect(router.resolve({ name: 'auth-callback' }).meta.requiresAuth).toBeUndefined()
  })

  it('redirects unknown paths to the root gate', async () => {
    await router.push('/definitely/not/a/route')
    expect(router.currentRoute.value.name).toBe('root')
  })
})

describe('authentication gate', () => {
  it('lets a live STAFF session into the dashboard and sets the page title', async () => {
    seedSession(useAuthStore(), { type: 'STAFF' })

    await router.push('/admin-dashboard')

    expect(router.currentRoute.value.name).toBe('admin-dashboard')
    expect(document.title).toContain('داشبورد مدیریت')
    expect(document.title).toContain('Telecom Marketplace')
  })

  it('blocks an anonymous visitor from a protected route (navigation aborted, session absent)', async () => {
    const store = useAuthStore()

    await router.push('/admin-users').catch(() => {})

    expect(router.currentRoute.value.name).not.toBe('admin-users')
    expect(store.isAuthenticated).toBe(false)
    expect(localStorage.getItem('user')).toBeNull()
  })

  it('rejects a stored context whose refresh cookie is gone (expired, unrefreshable session)', async () => {
    // Persisted context exists but the access token is expired and no backend
    // is reachable (fetch stub declines) → ensureAuthenticated must log out
    // rather than let the guard through.
    const store = useAuthStore()
    seedSession(store, { type: 'STAFF', expInSeconds: -60 })
    fetchMock.mockImplementation(() => Promise.reject(new Error('network down')))

    await router.push('/admin-dashboard').catch(() => {})

    expect(router.currentRoute.value.name).not.toBe('admin-dashboard')
    expect(store.isAuthenticated).toBe(false)
  })
})

describe('guest-only bounce', () => {
  it('sends an authenticated user away from forgot-password to the dashboard', async () => {
    seedSession(useAuthStore(), { type: 'STAFF' })

    await router.push('/forgot-password')

    expect(router.currentRoute.value.name).toBe('admin-dashboard')
  })
})

describe('app selection (accessProfile.type only — roles never select the app)', () => {
  it('routes an already-authenticated STAFF user from /login to the dashboard', async () => {
    seedSession(useAuthStore(), { type: 'STAFF' })

    await router.push('/login')

    // beforeEnter decides: session alive for THIS app → no website bounce.
    expect(router.currentRoute.value.name).toBe('admin-dashboard')
  })

  it('honours the ?redirect= target when the session is alive', async () => {
    seedSession(useAuthStore(), { type: 'STAFF' })

    await router.push({ path: '/login', query: { redirect: '/orders' } })

    expect(router.currentRoute.value.path).toBe('/orders')
  })

  it('never lets a COMPANY user reach an admin page — logs them out and exits', async () => {
    const store = useAuthStore()
    seedSession(store, { type: 'COMPANY', roles: ['COMPANY_MANAGER'], permissions: ['products.read'] })

    await router.push('/admin-dashboard').catch(() => {})

    expect(router.currentRoute.value.name).not.toBe('admin-dashboard')
    // The mismatch session was torn down, not silently reused.
    expect(store.isAuthenticated).toBe(false)
    expect(localStorage.getItem('user')).toBeNull()
    expect(localStorage.getItem('accessProfile')).toBeNull()
  })
})