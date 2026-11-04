/**
 * @telecom-http-client/errors/AuthError
 * Authentication error class
 *
 * @module @telecom-http-client/errors/AuthError
 */

import HttpError from './HttpError.js'
import { ERROR_TYPES, HTTP_STATUS } from '../types/index.js'

/**
 * AuthError class - Authentication-related errors
 * @class
 * @extends HttpError
 */
class AuthError extends HttpError {
  /**
   * Create a new AuthError instance
   * @param {string} message - Error message
   * @param {Object} [options={}] - Error options
   * @param {boolean} [options.tokenExpired=false] - Whether the token has expired
   * @param {boolean} [options.tokenInvalid=false] - Whether the token is invalid
   * @param {boolean} [options.requiresRefresh=false] - Whether a token refresh is required
   */
  constructor(message, options = {}) {
    const status = options.status || HTTP_STATUS.UNAUTHORIZED

    super(message, {
      type: ERROR_TYPES.AUTH,
      status,
      statusText: options.statusText || 'Unauthorized',
      ...options
    })

    this.name = 'AuthError'
    this.code = options.code || 'AUTH_ERROR'
    this.tokenExpired = options.tokenExpired || false
    this.tokenInvalid = options.tokenInvalid || false
    this.requiresRefresh = options.requiresRefresh || false

    // Maintain proper stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AuthError)
    }
  }

  /**
   * Check if token refresh is required
   * @returns {boolean}
   */
  needsRefresh() {
    return this.requiresRefresh || this.tokenExpired
  }
}

export default AuthError