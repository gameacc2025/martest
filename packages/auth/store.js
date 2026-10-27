import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { apiGet, apiPost, apiPatch, apiDelete } from '@telecom/shared-core/http/apiClient'
import { handleApiError } from '@telecom/api-client'
import { endpoints } from '@telecom/api-client'
import { registerAuthBridge, getAuthRouter } from '@telecom/shared-core/http/authBridge'
import { getAccessToken, setAccessToken as setMemoryToken, clearAccessToken, onAccessTokenChange } from '@telecom/shared-core/http/tokenMemory.js'
import { showSessionToast } from '@telecom/api-client'
import { STORAGE_KEYS, LEGACY_RAW_TOKEN_KEY, readStored, writeStored } from './storageKeys.js'

// `isExternalUrl` is re-exported here so any existing
// `import { isExternalUrl } from './store.js'` keeps working. The rest of
// the cross-app handoff (now a PKCE code flow — never a token in a URL)
// lives in sessionHandoff.js (pure helpers) and handoffClient.js (the two
// API calls), re-exported from index.js. See those files' headers.
export { isExternalUrl } from './sessionHandoff.js'


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
//   auth.tokens          — { accessToken?, expiresIn } metadata persisted
//                          WITHOUT secrets: the access token is mirrored
//                          into tokenMemory (memory only) and the refresh
//                          token only ever exists in the httpOnly cookie
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

    // ── Access token: MEMORY ONLY ──────────────────────────────
    // The raw token is never persisted (Web Storage is readable by any
    // XSS). It lives in tokenMemory and every HTTP client reads it from
    // there. This ref is a reactive mirror so Vue state (isAuthenticated,
    // guards, header UI) updates whenever the memory token changes.
    const accessToken = ref(getAccessToken())
    onAccessTokenChange((next) => { accessToken.value = next })

    // One-time upgrade path: older builds persisted the raw token in Web
    // Storage. Pull it into memory, strip it from the bundle, and wipe the
    // legacy key so no secret survives on disk.
    if (tokens.value?.accessToken) {
      setMemoryToken(tokens.value.accessToken)
    }
    localStorage.removeItem(LEGACY_RAW_TOKEN_KEY)
    if (tokens.value && ('accessToken' in tokens.value || 'refreshToken' in tokens.value)) {
      const { accessToken: _legacyAccess, refreshToken: _legacyRefresh, ...rest } = tokens.value
      tokens.value = rest
      persistTokens()
    }

    // ── Derived identity ──────────────────────────────────────

    // Raw access token (for the HTTP layer + local expiry checks).
    const token = computed(() => accessToken.value || null)
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

    // Persist the token bundle WITHOUT its secrets: the access token goes
    // to memory only (tokenMemory) and the refresh token never leaves the
    // httpOnly cookie, so the stored copy is just non-secret metadata.
    function persistTokens() {
      if (!tokens.value) {
        writeStored(STORAGE_KEYS.tokens, null)
        return
      }
      const { accessToken: _a, refreshToken: _r, ...safe } = tokens.value
      writeStored(STORAGE_KEYS.tokens, safe)
    }

    function setTokens(newTokens) {
      tokens.value = newTokens || null
      setMemoryToken(newTokens?.accessToken || null)
      persistTokens()
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
      clearAccessToken()
      Object.values(STORAGE_KEYS).forEach(key => localStorage.removeItem(key))
      localStorage.removeItem(LEGACY_RAW_TOKEN_KEY)
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
        const response = await apiPatch(endpoints.settings.profile, data)
        // The backend returns the user identity with a nested `profile`.
        // Persist only the personal-profile domain in this store slot.
        const updatedProfile = response?.profile ?? response?.data?.profile ?? response
        profile.value = updatedProfile
        writeStored(STORAGE_KEYS.profile, profile.value)
        return updatedProfile
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

        // Response: { tokens: { accessToken, expiresIn },   (refresh token
        //             user, profile, accessProfile, roles, permissions }  ←
        //             never in the body; httpOnly cookie only)
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

    // ── restoreSession (called once at app boot) ──────────────
    //
    // The access token lives in memory only, so every page load starts with
    // none. If we still hold a persisted auth context, there is (or was) an
    // httpOnly refresh cookie — try to silently mint a fresh access token
    // before the router guard judges us logged-out.
    //
    // Never throws, never blocks boot for long: on failure the app simply
    // starts logged-out (the guard then routes to login as usual).
    async function restoreSession() {
      if (accessToken.value) return true
      if (!readStored(STORAGE_KEYS.user, null)) return false
      try {
        // Hard cap so a hung API can't stall the app's first paint. The
        // underlying refresh keeps running and populates memory when/if it
        // resolves (refresh() is shared/idempotent, so the guard's own call
        // would await the very same promise).
        await Promise.race([
          refresh(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('restore timeout')), 5000)),
        ])
        return true
      } catch {
        return false
      }
    }

    // ── ensureAuthenticated (called by router guard) ─────────
    //
    // Returns true if the user is authenticated with a usable token.
    // Transparently refreshes an expired token — or obtains the FIRST token
    // of the session after a page reload (memory-only token ⇒ none yet).
    // On refresh failure it performs a full logout (with session_expired
    // toast) and returns false.
    async function ensureAuthenticated(intendedPath = null) {
      if (!token.value) {
        // Could be a plain anonymous visitor, or a reload of a live session.
        // A persisted auth context means "try the cookie first".
        if (readStored(STORAGE_KEYS.user, null)) {
          try {
            await refresh()
            return true
          } catch {
            // Cookie gone/expired → real logout below.
          }
        }
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
      restoreSession,
      // Used by the PKCE handoff callback: the redeem response has exactly
      // the same shape as a login response, so it funnels through here.
      setAuthContext,
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