import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { setAuthRouter } from '@telecom/auth'
import { setAccessToken as setMemoryToken, clearAccessToken } from '@telecom/shared-core/http/tokenMemory.js'
import router from './index.js'
import { useAuthStore } from '../stores/auth'

/**
 * Company app route guards — permission-dependent navigation.
 *
 * Rules under test (see the guard block at the bottom of index.js):
 *   1. `requiresAuth` routes demand a live session (ensureAuthenticated).
 *   2. Authenticated users are bounced off `guestOnly` routes.
 *   3. App selection is driven solely by accessProfile.type: only a COMPANY
 *      session may land here — a STAFF user is logged out and exited (roles
 *      never select the app).
 *   4. The login route hands an already-authenticated COMPANY user straight to
 *      the dashboard instead of the website (no redirect loop).
 *   5. Unknown paths fall back to the root gate.
 *
 * Seeding goes through the store's own `setAuthContext` (+ the memory token),
 * because the store snapshots persisted identity when it is created — exactly
 * as it does at real boot. `setAuthRouter(null)` isolates guard decisions from
 * browser-exit side effects (happy-dom cannot navigate away), and `fetch` is
 * stubbed in beforeEach so no test can reach a live server.
 */

function makeJwt({ expInSeconds = 3600 } = {}) {
  const payload = { sub: 'u1', exp: Math.floor(Date.now() / 1000) + expInSeconds }
  return `h.${btoa(JSON.stringify(payload)).replace(/=+$/, '')}.s`
}

function seedSession(store, { type = 'COMPANY', roles = ['COMPANY_MANAGER'], permissions = ['products.read'], expInSeconds = 3600 } = {}) {
  store.setAuthContext({
    user: { id: 1, email: 'partner@x.io' },
    profile: { firstName: 'Partner' },
    accessProfile: { type, companyId: 7 },
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
  useAuthStore()
  setAuthRouter(null) // guard decisions only — see file header
  fetchMock = vi.fn(async () =>
    new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }),
  )
  vi.stubGlobal('fetch', fetchMock)
  await router.replace('/')
})

afterEach(() => {
  vi.unstubAllGlobals()
  clearAccessToken()
})

describe('route table', () => {
  it('exposes the critical company routes by name', () => {
    const required = [
      'root',
      'login',
      'register',
      'auth-start',
      'auth-callback',
      'company-dashboard',
      'company-settings',
      'company-products',
      'my-products',
      'manage-products',
      'company-users',
      'company-inquiries',
      'company-reports',
      'not-found',
    ]
    for (const name of required) {
      expect(router.hasRoute(name), `missing route: ${name}`).toBe(true)
    }
  })

  it('marks every partner-portal child as requiresAuth', () => {
    for (const name of ['company-dashboard', 'company-users', 'company-reports', 'manage-products']) {
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
  it('lets a live COMPANY session into the dashboard and titles the page', async () => {
    seedSession(useAuthStore(), { type: 'COMPANY' })

    await router.push('/company-dashboard')

    expect(router.currentRoute.value.name).toBe('company-dashboard')
    expect(document.title).toContain('داشبورد شرکت')
    expect(document.title).toContain('Telecom Marketplace')
  })

  it('blocks an anonymous visitor from a protected route (navigation aborted, session absent)', async () => {
    const store = useAuthStore()

    await router.push('/company-users').catch(() => {})

    expect(router.currentRoute.value.name).not.toBe('company-users')
    expect(store.isAuthenticated).toBe(false)
    expect(localStorage.getItem('user')).toBeNull()
  })

  it('rejects a stored context whose refresh cookie is gone (expired, unrefreshable session)', async () => {
    const store = useAuthStore()
    seedSession(store, { type: 'COMPANY', expInSeconds: -60 })
    fetchMock.mockImplementation(() => Promise.reject(new Error('network down')))

    await router.push('/company-dashboard').catch(() => {})

    expect(router.currentRoute.value.name).not.toBe('company-dashboard')
    expect(store.isAuthenticated).toBe(false)
  })
})

describe('guest-only bounce', () => {
  it('sends an authenticated user away from forgot-password to the dashboard', async () => {
    seedSession(useAuthStore(), { type: 'COMPANY' })

    await router.push('/forgot-password')

    expect(router.currentRoute.value.name).toBe('company-dashboard')
  })
})

describe('app selection (accessProfile.type only — roles never select the app)', () => {
  it('routes an already-authenticated COMPANY user from /login to the dashboard', async () => {
    seedSession(useAuthStore(), { type: 'COMPANY' })

    await router.push('/login')

    expect(router.currentRoute.value.name).toBe('company-dashboard')
  })

  it('honours the ?redirect= target when the session is alive', async () => {
    seedSession(useAuthStore(), { type: 'COMPANY' })

    await router.push({ path: '/login', query: { redirect: '/reports' } })

    expect(router.currentRoute.value.path).toBe('/reports')
  })

  it('never lets a STAFF user reach a company page — logs them out and exits', async () => {
    const store = useAuthStore()
    seedSession(store, { type: 'STAFF', roles: ['SUPPORT'], permissions: ['users.read'] })

    await router.push('/company-dashboard').catch(() => {})

    expect(router.currentRoute.value.name).not.toBe('company-dashboard')
    expect(store.isAuthenticated).toBe(false)
    expect(localStorage.getItem('user')).toBeNull()
    expect(localStorage.getItem('accessProfile')).toBeNull()
  })
})