/**
 * @module http/authBridge
 *
 * A tiny decoupling layer between the HTTP client, the auth store, and the
 * app's Vue Router instance.
 *
 * Why this exists:
 *   1. HTTP ↔ store decoupling:
 *      The HTTP layer (AuthMiddleware) needs to trigger `refresh()` and
 *      `logout()` when it sees a 401. But importing the Pinia store directly
 *      into the HTTP layer creates a circular dependency:
 *          store/auth.js → http/apiClient → http/AuthMiddleware → store/auth.js
 *      The auth store registers its handlers here once it is created, and the
 *      HTTP layer calls them through this neutral module. No circular import.
 *
 *   2. store ↔ router decoupling (router injection pattern):
 *      The auth store needs a Vue Router instance to redirect on logout, but
 *      the framework-agnostic @telecom/auth package MUST NOT import an app
 *      router directly. Doing so created a circular dependency chain:
 *          app/router/index.js → (layouts/pages) → app/stores/auth.js
 *          → import router from '../router' → app/router/index.js
 *      which triggered:
 *          Uncaught ReferenceError: Cannot access 'router' before initialization
 *      Instead, each app calls `setAuthRouter(router)` once, right after
 *      `createRouter()`, and the auth store reads it lazily via
 *      `getAuthRouter()` only at the moment it needs to redirect.
 *
 * Contract:
 *   - Only the auth store may register auth handlers.
 *   - Only the auth store performs storage clearing / redirects / toasts.
 *     The HTTP layer merely *asks* the store to refresh or log out.
 *   - Only the app's router module registers the router via setAuthRouter().
 *   - The auth package never imports vue-router or an app router directly.
 */

let _handlers = {
  refresh: null,
  logout: null,
}

// The app's Vue Router instance, injected after createRouter().
let _router = null

/**
 * Register the auth handlers. Called once by the auth store on creation.
 * @param {{ refresh: Function, logout: Function }} handlers
 */
export function registerAuthBridge(handlers) {
  _handlers = { ..._handlers, ...handlers }
}

/**
 * Inject the app's Vue Router instance into the auth layer.
 * Called once by each app's router/index.js right after createRouter(),
 * BEFORE any navigation happens. This is the router injection pattern that
 * keeps @telecom/auth framework-agnostic and free of circular imports.
 * @param {import('vue-router').Router} router
 */
export function setAuthRouter(router) {
  _router = router
}

/**
 * Retrieve the injected Vue Router instance.
 * The auth store calls this lazily (only when it actually needs to redirect),
 * never at module-evaluation time, so there is no import-time coupling.
 * @returns {import('vue-router').Router|null}
 */
export function getAuthRouter() {
  return _router
}

/**
 * Trigger a token refresh via the auth store.
 * Idempotency / request de-duplication is handled inside the store.
 * @returns {Promise<string>} the new access token
 */
export function bridgeRefresh() {
  if (!_handlers.refresh) {
    return Promise.reject(new Error('Auth bridge: refresh handler not registered'))
  }
  return _handlers.refresh()
}

/**
 * Trigger a logout via the auth store (single owner of the logout flow).
 * @param {object} [options] - forwarded to authStore.logout()
 * @returns {Promise<void>}
 */
export function bridgeLogout(options) {
  if (!_handlers.logout) {
    return Promise.resolve()
  }
  return _handlers.logout(options)
}

export default {
  registerAuthBridge,
  bridgeRefresh,
  bridgeLogout,
  setAuthRouter,
  getAuthRouter,
}
