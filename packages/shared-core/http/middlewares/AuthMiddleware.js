/**
 * @telecom-http-client/middlewares/AuthMiddleware
 *
 * Reactive authentication middleware.
 *
 * Responsibilities:
 *   1. Inject the Authorization header on outgoing requests.
 *   2. On a 401 with code TOKEN_EXPIRED, transparently refresh the access
 *      token (exactly once per request) and retry the original request.
 *   3. Never refresh the refresh request itself (avoids deadlock).
 *   4. Never loop: a request is retried at most once.
 *
 * Design notes (agreed plan):
 *   - This middleware is registered OUTER to the ParserMiddleware, so by the
 *     time we inspect the response its body is already parsed and we can read
 *     the server error `code`.
 *   - Token refresh and logout are delegated to the auth store through the
 *     authBridge. This middleware NEVER touches localStorage or the router.
 *   - Requests to /auth/refresh (or any request flagged `_skipAuth`) pass
 *     straight through: no Authorization header is added and no retry logic
 *     runs on them.
 *
 * @module @telecom-http-client/middlewares/AuthMiddleware
 */

import { bridgeRefresh, bridgeLogout } from '../authBridge.js'

const REFRESH_URL_FRAGMENT = '/auth/refresh'

/**
 * AuthMiddleware class - Handles authentication for requests
 * @class
 */
class AuthMiddleware {
  /**
   * @param {Object} [options={}]
   * @param {Function} [options.getToken] - returns the current access token
   * @param {string} [options.tokenHeader='Authorization']
   * @param {string} [options.tokenType='Bearer']
   */
  constructor(options = {}) {
    this.getToken = options.getToken || (() => localStorage.getItem('token'))
    this.tokenHeader = options.tokenHeader || 'Authorization'
    this.tokenType = options.tokenType || 'Bearer'
  }

  /** @returns {string|null} */
  getCurrentToken() {
    try {
      return this.getToken()
    } catch {
      return null
    }
  }

  /**
   * Inject the Authorization header into a request config.
   * @private
   */
  _injectToken(config, token) {
    if (!token) return
    config.headers = {
      ...config.headers,
      [this.tokenHeader]: `${this.tokenType} ${token}`,
    }
  }

  /**
   * Should this request bypass all auth logic?
   * True for the refresh request itself and anything flagged _skipAuth.
   * @private
   */
  _shouldBypass(config) {
    if (config && config._skipAuth) return true
    const url = config?.url || ''
    return typeof url === 'string' && url.includes(REFRESH_URL_FRAGMENT)
  }

  /**
   * Read the server error `code` from a parsed response body.
   * Handles both flat `{ error:true, code }` and nested `{ error:{ code } }`.
   * @private
   */
  _extractCode(response) {
    const body = response?.data
    if (!body || typeof body !== 'object') return null
    if (body.error && typeof body.error === 'object' && body.error.code) {
      return body.error.code
    }
    if (body.code) return body.code
    return null
  }

  /**
   * Middleware entry point.
   * @param {Object} config - Request configuration
   * @param {Function} next - Next middleware in the chain
   * @returns {Promise<any>} Response
   */
  async handle(config, next) {
    // ── Bypass: refresh request or explicitly flagged requests ──
    // These pass straight through with NO Authorization header and NO
    // retry logic. This is what breaks the refresh-refreshes-itself
    // deadlock.
    if (this._shouldBypass(config)) {
      return next(config)
    }

    // ── Normal request: inject token, then execute ──
    const token = this.getCurrentToken()
    if (token) {
      this._injectToken(config, token)
    }

    const response = await next(config)

    // ── Reactive refresh on expired access token ──
    // Only an expired access token (401 + TOKEN_EXPIRED) is refreshable, and
    // only if we haven't already retried this request once.
    if (
      response &&
      response.status === 401 &&
      !config._retry &&
      this._extractCode(response) === 'TOKEN_EXPIRED'
    ) {
      let newToken
      try {
        // refresh() is idempotent in the store: concurrent 401s share a
        // single /auth/refresh call.
        newToken = await bridgeRefresh()
      } catch {
        // Refresh failed → the session has truly ended.
        await bridgeLogout({ reason: 'session_expired' })
        return response
      }

      // Retry the original request exactly once with the new token.
      config._retry = true
      this._injectToken(config, newToken)
      const retryResponse = await next(config)

      // Retried with a fresh token and STILL got 401 → session is done.
      // Do NOT refresh again (prevents an infinite refresh/retry loop).
      if (retryResponse && retryResponse.status === 401) {
        await bridgeLogout({ reason: 'session_expired' })
      }

      return retryResponse
    }

    return response
  }
}

export default AuthMiddleware
