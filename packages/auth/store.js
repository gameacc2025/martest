import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { apiGet, apiPost, apiPatch, apiDelete } from '@telecom/shared-core/http/apiClient'
import { handleApiError } from '@telecom/api-client'
import { endpoints } from '@telecom/api-client'
import { registerAuthBridge, getAuthRouter } from '@telecom/shared-core/http/authBridge'
import { showSessionToast } from '@telecom/api-client'

// ─────────────────────────────────────────────────────────────
// Auth store — state mirrors the backend auth context EXACTLY.
//
// The backend intentionally exposes six independent domains and this
// store keeps them separate (never merged into one `user` blob):
//
//   auth.user            — authentication identity only
//   auth.profile         — personal profile (firstName/lastName/avatar) for
//                          EVERY human user (STAFF, COMPANY, CUSTOMER)
//   auth.accessProfile   — application context { type, companyId, company }
//   auth.roles           — string[] (permission source inside the app)
//   auth.permissions     — string[] (page/feature access; '*' = all)
//   auth.tokens          — { accessToken, refreshToken, expiresIn }
//
// APPLICATION SELECTION uses ONLY accessProfile.type:
//   STAFF    → Admin App
//   COMPANY  → Company App
//   CUSTOMER → Website
//
// Roles NEVER select the application. Roles only grant permissions, and
// permissions control page/feature access within the selected app.
// ─────────────────────────────────────────────────────────────

// Module-level singletons (shared across all store usages)
//
// refreshPromise: ensures refresh() is idempotent. If a refresh is
//   already in flight, concurrent callers await the SAME promise
//   instead of firing a second /auth/refresh (which would rotate the
//   token twice and revoke the first one — a race that logs the user
//   out). Reset to null in finally so the next expiry can refresh again.
//
// isShowingSessionExpiredToast: ensures that when many concurrent
//   requests all hit session_expired at once, the user sees exactly
//   ONE toast, not one per failed request.
let refreshPromise = null
let isShowingSessionExpiredToast = false

// localStorage keys for each persisted domain.
const STORAGE_KEYS = {
  user: 'user',
  profile: 'profile',
  accessProfile: 'accessProfile',
  roles: 'roles',
  permissions: 'permissions',
  tokens: 'tokens',
  // Raw access token, kept in sync for the HTTP layer (AuthMiddleware reads
  // localStorage.getItem('token') directly to attach the Authorization header).
  token: 'token',
}

/**
 * Safely parse a JSON value from localStorage. Returns `fallback` on any
 * missing / "undefined" / "null" / malformed value, and cleans the slot.
 */
function readStored(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    if (!raw || raw === 'undefined' || raw === 'null') {
      if (raw === 'undefined' || raw === 'null') localStorage.removeItem(key)
      return fallback
    }
    return JSON.parse(raw)
  } catch {
    return fallback
  }
}

function writeStored(key, value) {
  if (value === null || value === undefined) {
    localStorage.removeItem(key)
  } else {
    localStorage.setItem(key, JSON.stringify(value))
  }
}

// ─────────────────────────────────────────────────────────────
// Cross-app session handoff
//
// Login/Register are now centralized on the website app. When a
// STAFF or COMPANY user logs in there, they need to land already
// authenticated on the admin/company app (a different origin), not
// on that app's own (now-removed) login page.
//
// Only the access token + auth context travel, via a URL fragment
// (never sent to a server, stripped from history immediately on
// arrival). The refresh token is never included here — it always
// lives in the httpOnly cookie set by the backend, scoped to the API
// host, so it is already sent by the browser on API calls made from
// ANY frontend origin. That's what lets the receiving app silently
// refresh once the handed-off access token expires, with no further
// handoff needed.
// ─────────────────────────────────────────────────────────────

const SESSION_HANDOFF_HASH_PREFIX = '#session='

/**
 * True if `url` points at a different origin (i.e. a separate frontend
 * app) rather than an internal path on the current app.
 * @param {string} url
 */
export function isExternalUrl(url) {
  return typeof url === 'string' && /^https?:\/\//i.test(url)
}

/**
 * Build a "go to this other app, already signed in" URL.
 * @param {string} targetUrl - absolute URL of the destination (e.g. `${adminAppUrl}/admin`)
 * @param {object} ctx - the auth context returned by login()/registerCompany() etc: { user, profile, accessProfile, roles, permissions, tokens }
 */
export function buildSessionHandoffUrl(targetUrl, ctx) {
  const payload = {
    user: ctx.user,
    profile: ctx.profile,
    accessProfile: ctx.accessProfile,
    roles: ctx.roles,
    permissions: ctx.permissions,
    tokens: ctx.tokens?.accessToken
      ? { accessToken: ctx.tokens.accessToken, expiresIn: ctx.tokens.expiresIn }
      : null,
  }
  const encoded = btoa(encodeURIComponent(JSON.stringify(payload)))
  const [base] = targetUrl.split('#')
  return `${base}${SESSION_HANDOFF_HASH_PREFIX}${encoded}`
}

/**
 * Call once, as early as possible on app boot (before mounting — see
 * each app's main.js), to consume an incoming session handoff
 * fragment produced by buildSessionHandoffUrl(). Writes straight to
 * localStorage (no Pinia instance needed yet) using the same
 * STORAGE_KEYS every app already reads on startup, and strips the
 * fragment from the URL so it never lingers in browser history.
 * @returns {boolean} true if a handoff was found and applied
 */
export function bootstrapSessionFromUrl() {
  const hash = window.location.hash
  if (!hash || !hash.startsWith(SESSION_HANDOFF_HASH_PREFIX)) return false

  let applied = false
  try {
    const encoded = hash.slice(SESSION_HANDOFF_HASH_PREFIX.length)
    const payload = JSON.parse(decodeURIComponent(atob(encoded)))
    if (payload?.tokens?.accessToken) {
      writeStored(STORAGE_KEYS.user, payload.user ?? null)
      writeStored(STORAGE_KEYS.profile, payload.profile ?? null)
      writeStored(STORAGE_KEYS.accessProfile, payload.accessProfile ?? null)
      writeStored(STORAGE_KEYS.roles, payload.roles ?? [])
      writeStored(STORAGE_KEYS.permissions, payload.permissions ?? [])
      writeStored(STORAGE_KEYS.tokens, payload.tokens)
      localStorage.setItem(STORAGE_KEYS.token, payload.tokens.accessToken)
      applied = true
    }
  } catch {
    applied = false
  } finally {
    // Always strip the fragment — even on failure — so a malformed or
    // stale payload never lingers in the URL/history.
    window.history.replaceState(null, '', window.location.pathname + window.location.search)
  }
  return applied
}

/**
 * Decode a JWT payload without verifying the signature.
 * Used only to read the `exp` claim for local expiry checks.
 * @param {string} token
 * @returns {object|null}
 */
function decodeJwtPayload(token) {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    const decoded = atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'))
    return JSON.parse(decoded)
  } catch {
    return null
  }
}

/**
 * Check whether a JWT access token is expired (or about to expire).
 * A small skew (5s) avoids sending a request that will expire mid-flight.
 * @param {string} token
 * @returns {boolean} true if expired/invalid
 */
function isTokenExpired(token) {
  if (!token) return true
  const payload = decodeJwtPayload(token)
  if (!payload || !payload.exp) return true
  const expiresAtMs = payload.exp * 1000
  const skewMs = 5000
  return Date.now() >= (expiresAtMs - skewMs)
}

/**
 * Create the auth store.
 *
 * The store no longer takes a router argument. To stay framework-agnostic and
 * free of circular imports, it reads the app's Vue Router lazily via
 * getAuthRouter() (injected by each app's router/index.js through
 * setAuthRouter()) only at the moment it needs to redirect.
 *
 * @returns {Function} Pinia store definition
 */
export function createAuthStore() {
  return defineStore('auth', () => {
    // ── State: one ref per backend domain ─────────────────────
    const user = ref(readStored(STORAGE_KEYS.user, null))
    const profile = ref(readStored(STORAGE_KEYS.profile, null))
    const accessProfile = ref(readStored(STORAGE_KEYS.accessProfile, null))
    const roles = ref(readStored(STORAGE_KEYS.roles, []) || [])
    const permissions = ref(readStored(STORAGE_KEYS.permissions, []) || [])
    const tokens = ref(readStored(STORAGE_KEYS.tokens, null))

    const loading = ref(false)
    const error = ref(null)

    // ── Derived identity ──────────────────────────────────────

    // Raw access token (for the HTTP layer + local expiry checks).
    const token = computed(() => tokens.value?.accessToken || null)
    const isAuthenticated = computed(() => !!token.value)

    // APPLICATION CONTEXT — the ONLY thing that selects the app.
    const accessType = computed(() => accessProfile.value?.type || null)
    const isStaff = computed(() => accessType.value === 'STAFF')
    const isCompany = computed(() => accessType.value === 'COMPANY')
    const isCustomer = computed(() => accessType.value === 'CUSTOMER')

    // Company associated with the access profile (if any). This is the single
    // source of company info now that `user` is identity-only.
    const company = computed(() => accessProfile.value?.company || null)
    const companyId = computed(() =>
      accessProfile.value?.companyId ?? accessProfile.value?.company?.id ?? null
    )

    // ── Role labels (UI only — never for app selection) ───────
    // Roles are plain strings from the backend. SUPER_ADMIN is a permission
    // concept (it carries the '*' wildcard); we expose a label helper only.
    const roleNames = computed(() =>
      (Array.isArray(roles.value) ? roles.value : [])
        .map(r => (typeof r === 'string' ? r : r?.name || r?.role?.name))
        .filter(Boolean)
    )
    const isSuperAdmin = computed(() => roleNames.value.includes('SUPER_ADMIN'))
    // Real backend role name is COMPANY_MANAGER (see backend/prisma/seed.js →
    // ROLES). 'COMPANY_ADMIN'/'COMPANY' never exist as role names, so this
    // previously never matched a real company user.
    const isCompanyAdmin = computed(() => roleNames.value.includes('COMPANY_MANAGER'))
    // Convenience label: any administrative role (platform or company admin).
    // UI-only, mirrors the two role labels above; never used for app selection.
    const isAdmin = computed(() => isSuperAdmin.value || isCompanyAdmin.value)

    // ── Permissions ───────────────────────────────────────────
    // Permissions come straight from the backend as a flat string[]. The
    // SUPER_ADMIN role is delivered as the wildcard '*', so no hardcoded role
    // bypass is needed — permission checks are purely permission-driven.
    const userPermissions = computed(() =>
      Array.isArray(permissions.value) ? permissions.value : []
    )
    const hasWildcard = computed(() => userPermissions.value.includes('*'))

    function hasPermission(permission) {
      if (!permission) return true
      if (hasWildcard.value) return true
      return userPermissions.value.includes(permission)
    }

    function hasAnyPermission(list) {
      if (!list || list.length === 0) return true
      if (hasWildcard.value) return true
      return list.some(p => userPermissions.value.includes(p))
    }

    function hasAllPermissions(list) {
      if (!list || list.length === 0) return true
      if (hasWildcard.value) return true
      return list.every(p => userPermissions.value.includes(p))
    }

    // ── Role checks (menu/feature visibility inside the app) ──
    // NOTE: roles gate *visibility inside the selected app*, they do NOT
    // choose the app. App choice is accessProfile.type only.
    function hasRole(roleName) {
      if (!roleName) return true
      // Legacy aliases kept for callers still passing the old placeholder
      // names; real backend roles are COMPANY_MANAGER / COMPANY_USER.
      const aliases = {
        COMPANY_ADMIN: ['COMPANY_MANAGER'],
        COMPANY: ['COMPANY_MANAGER', 'COMPANY_USER'],
      }
      const namesToCheck = aliases[roleName] || [roleName]
      return roleNames.value.some(r => namesToCheck.includes(r))
    }

    function hasAnyRole(roleNames = []) {
      if (!roleNames || roleNames.length === 0) return true
      return roleNames.some(name => hasRole(name))
    }

    // ── Auth data helpers ─────────────────────────────────────

    /**
     * Replace the full auth context from a backend response. Every entry point
     * (login / getProfile) funnels through here so the state shape is identical
     * regardless of how the user became authenticated.
     *
     * @param {object} ctx - { user, profile, accessProfile, roles,
     *                          permissions, tokens }
     * @param {boolean} keepTokens - when true (getProfile), don't touch tokens.
     */
    function setAuthContext(ctx = {}, { keepTokens = false } = {}) {
      user.value = ctx.user ?? null
      profile.value = ctx.profile ?? null
      accessProfile.value = ctx.accessProfile ?? null
      roles.value = Array.isArray(ctx.roles) ? ctx.roles : []
      permissions.value = Array.isArray(ctx.permissions) ? ctx.permissions : []

      writeStored(STORAGE_KEYS.user, user.value)
      writeStored(STORAGE_KEYS.profile, profile.value)
      writeStored(STORAGE_KEYS.accessProfile, accessProfile.value)
      writeStored(STORAGE_KEYS.roles, roles.value)
      writeStored(STORAGE_KEYS.permissions, permissions.value)

      if (!keepTokens && ctx.tokens) {
        setTokens(ctx.tokens)
      }
    }

    // Persist the token bundle and keep the raw access token mirrored for the
    // HTTP layer (AuthMiddleware reads localStorage 'token' directly).
    function setTokens(newTokens) {
      tokens.value = newTokens || null
      writeStored(STORAGE_KEYS.tokens, tokens.value)
      const accessToken = newTokens?.accessToken || null
      if (accessToken) {
        localStorage.setItem(STORAGE_KEYS.token, accessToken)
      } else {
        localStorage.removeItem(STORAGE_KEYS.token)
      }
    }

    // Update only the access token (used by refresh()), preserving the rest of
    // the token bundle where possible.
    function setAccessToken(accessToken, extra = {}) {
      const next = { ...(tokens.value || {}), ...extra, accessToken }
      setTokens(next)
    }

    // Clears in-memory + storage state. Does NOT redirect or toast — the
    // public logout() is the single owner of the full logout flow.
    function clearAuthData() {
      user.value = null
      profile.value = null
      accessProfile.value = null
      roles.value = []
      permissions.value = []
      tokens.value = null
      Object.values(STORAGE_KEYS).forEach(key => localStorage.removeItem(key))
    }

    // ── Profile ──────────────────────────────────────────────

    async function getProfile() {
      try {
        // GET /auth/me → { user, profile, accessProfile, roles, permissions }
        const context = await apiGet(endpoints.auth.me)
        setAuthContext(context, { keepTokens: true })
        return context
      } catch (err) {
        error.value = handleApiError(err).message || 'خطا در دریافت پروفایل کاربر'
        throw err
      }
    }

    async function updateProfile(data) {
      try {
        loading.value = true
        error.value = null
        const updated = await apiPatch(endpoints.settings.profile, data)
        // The profile endpoint updates the personal profile fields.
        profile.value = updated
        writeStored(STORAGE_KEYS.profile, profile.value)
        return updated
      } catch (err) {
        error.value = handleApiError(err).message || 'خطا در بروزرسانی پروفایل'
        throw err
      } finally {
        loading.value = false
      }
    }

    async function changePassword(data) {
      try {
        loading.value = true
        error.value = null
        await apiPatch(endpoints.settings.changePassword, data)
        return true
      } catch (err) {
        error.value = handleApiError(err).message || 'خطا در تغییر رمز عبور'
        throw err
      } finally {
        loading.value = false
      }
    }

    // ── Login ────────────────────────────────────────────────

    async function login(credentials) {
      try {
        loading.value = true
        error.value = null

        // Response: { tokens: { accessToken, refreshToken, expiresIn },
        //             user, profile, accessProfile, roles, permissions }
        const loginData = await apiPost(endpoints.auth.login, credentials)
        setAuthContext(loginData)
        return loginData
      } catch (err) {
        error.value = handleApiError(err).message || 'خطا در ورود'
        throw err
      } finally {
        loading.value = false
      }
    }

    async function register(data) {
      try {
        loading.value = true
        error.value = null
        const result = await apiPost(endpoints.auth.register, data)
        // Registration doesn't log user in — they need admin approval first
        return result
      } catch (err) {
        error.value = handleApiError(err).message || 'خطا در ثبت نام'
        throw err
      } finally {
        loading.value = false
      }
    }

    async function registerCompany(data) {
      try {
        loading.value = true
        error.value = null
        const result = await apiPost(endpoints.auth.registerCompany, data)
        // Registration doesn't log user in — they need admin approval first
        return result
      } catch (err) {
        error.value = handleApiError(err).message || 'خطا در ثبت نام شرکت'
        throw err
      } finally {
        loading.value = false
      }
    }

    // ── Refresh (idempotent) ─────────────────────────────────
    //
    // Returns the new access token on success, throws on failure.
    // Concurrent callers share the same in-flight promise so only ONE
    // /auth/refresh request is sent (the backend rotates one-time tokens,
    // so a double refresh would revoke a valid token).
    async function refresh() {
      if (refreshPromise) {
        return refreshPromise
      }

      refreshPromise = (async () => {
        // `_skipAuth` tells AuthMiddleware to pass this request straight
        // through (no Authorization header, no retry logic) — avoids the
        // deadlock where refresh would try to refresh itself.
        //
        // We pass `{}` (not undefined) as the body: the default Content-Type is
        // application/json and Fastify rejects an empty body with that header
        // (FST_ERR_CTP_EMPTY_JSON_BODY). The refresh token travels in the
        // httpOnly cookie, so the body itself is irrelevant.
        const body = await apiPost(endpoints.auth.refresh, {}, { _skipAuth: true })

        // apiPost unwraps the envelope → body = { tokens: { accessToken, ... } }
        const newTokens = body?.tokens || body
        const accessToken = newTokens?.accessToken
        if (!accessToken) {
          throw new Error('No access token in refresh response')
        }
        setTokens(newTokens)
        return accessToken
      })()
        .finally(() => {
          refreshPromise = null
        })

      return refreshPromise
    }

    // ── Logout (single owner of storage clear + redirect + toast) ──
    //
    // Options:
    //   allDevices: call /logout-all instead of /logout
    //   reason:      if set (e.g. 'session_expired'), show exactly one toast
    //   redirectTo:  where to send the user; defaults to /login while
    //                preserving the current path in ?redirect=
    //   intendedPath: the path the user was trying to reach (passed by the
    //                router guard, since router.currentRoute still points at
    //                the previous route mid-navigation). Takes precedence over
    //                the current route when building ?redirect=.
    async function logout({ allDevices = false, reason = null, redirectTo = null, intendedPath = null } = {}) {

      // Best-effort backend revocation; ignore failures (token may already
      // be gone / network down). We still clear local state regardless.
      //
      // We flag these requests `_skipAuth` so the interceptor does NOT try to
      // refresh/retry them (we're tearing the session down anyway). /logout
      // authenticates via the httpOnly refresh cookie, so it needs no header.
      // /logout-all authenticates via the access token, so we attach it
      // manually here (skip-auth would otherwise omit it).
      try {
        const endpoint = allDevices ? endpoints.auth.logoutAll : endpoints.auth.logout
        const config = { _skipAuth: true }
        if (allDevices && token.value) {
          config.headers = { Authorization: `Bearer ${token.value}` }
        }
        // Send `{}` (not undefined): with the default application/json header,
        // Fastify rejects an empty body (FST_ERR_CTP_EMPTY_JSON_BODY), which
        // would prevent the server from actually revoking the session.
        await apiPost(endpoint, {}, config)
      } catch { /* ignore */ }



      clearAuthData()

      // Show a single session toast if a reason was provided.
      if (reason) {
        if (!isShowingSessionExpiredToast) {
          isShowingSessionExpiredToast = true
          if (reason === 'session_expired') {
            showSessionToast('warn', 'پایان نشست', 'نشست شما به پایان رسیده است. لطفاً دوباره وارد شوید.')
          }
          // Release the lock shortly after so a later, genuinely new
          // session expiry can notify again.
          setTimeout(() => { isShowingSessionExpiredToast = false }, 4000)
        }
      }

      // Redirect. Preserve the destination so the user returns after re-login.
      // Priority: explicit redirectTo → intendedPath (from the router guard) →
      // the current route (for a 401 that happens while already on a page).
      //
      // The router is retrieved lazily via getAuthRouter() (injected by the
      // app through setAuthRouter()) so this framework-agnostic package never
      // imports an app router directly. If no router was injected yet, we skip
      // the redirect gracefully rather than throwing.
      const router = getAuthRouter()
      if (!router) return

      const current = router.currentRoute.value
      const currentPath = current?.fullPath && current.name !== 'login' ? current.fullPath : null
      const target = redirectTo || intendedPath || currentPath


      if (current?.name !== 'login') {
        router.push({
          name: 'login',
          query: target && target !== '/login' ? { redirect: target } : {},
        })
      }
    }

    // ── ensureAuthenticated (called by router guard) ─────────
    //
    // Returns true if the user is authenticated with a usable token.
    // Transparently refreshes an expired token. On refresh failure it
    // performs a full logout (with session_expired toast) and returns false.
    async function ensureAuthenticated(intendedPath = null) {
      if (!token.value) {
        // Not logged in at all. Send them to login, preserving the target so
        // they land back here after signing in.
        await logout({ redirectTo: null, reason: null, intendedPath })
        return false
      }

      if (!isTokenExpired(token.value)) {
        return true
      }

      // Token expired — try to refresh.
      try {
        await refresh()
        return true
      } catch {
        // `intendedPath` is passed so the ?redirect= points at the page the
        // user was trying to reach (during navigation, router.currentRoute
        // still reflects the PREVIOUS route, so we can't rely on it here).
        await logout({ reason: 'session_expired', intendedPath })
        return false
      }
    }


    // ── Password recovery ────────────────────────────────────

    async function forgotPassword(email) {
      try {
        loading.value = true
        error.value = null
        await apiPost(endpoints.auth.forgotPassword, { email })
        return true
      } catch (err) {
        error.value = handleApiError(err).message || 'خطا در ارسال ایمیل'
        throw err
      } finally {
        loading.value = false
      }
    }

    async function resetPassword(data) {
      try {
        loading.value = true
        error.value = null
        await apiPost(endpoints.auth.resetPassword, data)
        return true
      } catch (err) {
        error.value = handleApiError(err).message || 'خطا در تغییر رمز عبور'
        throw err
      } finally {
        loading.value = false
      }
    }

    // ── Avatar ───────────────────────────────────────────────

    async function uploadAvatar(file) {
      try {
        loading.value = true
        error.value = null
        const formData = new FormData()
        formData.append('avatar', file)
        const avatarData = await apiPost(`${endpoints.settings.profile}/avatar`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        // Avatar lives on the personal profile.
        if (profile.value) {
          profile.value = { ...profile.value, avatar: avatarData.avatarUrl || avatarData.avatar }
          writeStored(STORAGE_KEYS.profile, profile.value)
        }
        return avatarData
      } catch (err) {
        error.value = handleApiError(err).message || 'خطا در آپلود آواتار'
        throw err
      } finally {
        loading.value = false
      }
    }

    async function deleteAvatar() {
      try {
        loading.value = true
        error.value = null
        await apiDelete(`${endpoints.settings.profile}/avatar`)
        if (profile.value) {
          profile.value = { ...profile.value, avatar: null }
          writeStored(STORAGE_KEYS.profile, profile.value)
        }
        return true
      } catch (err) {
        error.value = handleApiError(err).message || 'خطا در حذف آواتار'
        throw err
      } finally {
        loading.value = false
      }
    }

    // Expose refresh/logout to the HTTP layer through the bridge so the
    // interceptor can trigger them WITHOUT importing the store directly
    // (avoids a circular dependency: store → http → store).
    registerAuthBridge({
      refresh,
      logout,
    })

    return {
      // State (mirrors backend exactly)
      user,
      profile,
      accessProfile,
      roles,
      permissions,
      tokens,

      // Derived
      token,
      loading,
      error,
      isAuthenticated,

      // Application context (the ONLY source of app selection)
      accessType,
      isStaff,
      isCompany,
      isCustomer,
      company,
      companyId,

      // Role labels (UI only)
      isSuperAdmin,
      isCompanyAdmin,
      isAdmin,

      // Permissions
      userPermissions,
      hasPermission,
      hasAnyPermission,
      hasAllPermissions,

      // Roles (in-app visibility)
      hasRole,
      hasAnyRole,

      // Actions
      login,
      register,
      registerCompany,
      logout,
      refresh,
      ensureAuthenticated,
      forgotPassword,
      resetPassword,
      getProfile,
      updateProfile,
      changePassword,
      uploadAvatar,
      deleteAvatar,
    }
  })
}