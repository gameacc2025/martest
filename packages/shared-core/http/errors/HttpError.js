/**
 * @telecom-http-client/errors/HttpError
 * Base HTTP error class
 *
 * @module @telecom-http-client/errors/HttpError
 */

import { ERROR_TYPES } from '../types/index.js'

/**
 * HttpError class - Base HTTP error
 * @class
 * @extends Error
 */
class HttpError extends Error {
  /**
   * Create a new HttpError instance
   * @param {string} message - Error message
   * @param {Object} [options={}] - Error options
   * @param {number} [options.status] - HTTP status code
   * @param {string} [options.statusText] - HTTP status text
   * @param {Object} [options.config] - Request configuration
   * @param {Object} [options.response] - Response object
   * @param {any} [options.data] - Response data
   * @param {string} [options.type=ERROR_TYPES.UNKNOWN] - Error type
   * @param {string} [options.code] - Error code
   */
  constructor(message, options = {}) {
    super(message)

    this.name = 'HttpError'
    this.type = options.type || ERROR_TYPES.UNKNOWN
    this.status = options.status
    this.statusText = options.statusText
    this.config = options.config
    this.response = options.response
    this.data = options.data
    this.code = options.code
    this.timestamp = new Date()

    // Maintain proper stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, HttpError)
    }
  }

  /**
   * Check if error is a network error
   * @returns {boolean}
   */
  isNetworkError() {
    return this.type === ERROR_TYPES.NETWORK
  }

  /**
   * Check if error is a timeout error
   * @returns {boolean}
   */
  isTimeoutError() {
    return this.type === ERROR_TYPES.TIMEOUT
  }

  /**
   * Check if error is an auth error
   * @returns {boolean}
   */
  isAuthError() {
    return this.type === ERROR_TYPES.AUTH
  }

  /**
   * Check if error is a validation error
   * @returns {boolean}
   */
  isValidationError() {
    return this.type === ERROR_TYPES.VALIDATION
  }

  /**
   * Check if error is a rate limit error
   * @returns {boolean}
   */
  isRateLimitError() {
    return this.type === ERROR_TYPES.RATE_LIMIT
  }

  /**
   * Check if error is a server error
   * @returns {boolean}
   */
  isServerError() {
    return this.type === ERROR_TYPES.SERVER
  }

  /**
   * Check if error is a client error
   * @returns {boolean}
   */
  isClientError() {
    return this.type === ERROR_TYPES.CLIENT
  }

  /**
   * Convert to plain object
   * @returns {Object}
   */
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      type: this.type,
      status: this.status,
      statusText: this.statusText,
      code: this.code,
      data: this.data,
      timestamp: this.timestamp.toISOString(),
      stack: this.stack
    }
  }

  /**
   * Get string representation
   * @returns {string}
   */
  toString() {
    return `[${this.name}: ${this.status || 'N/A'} - ${this.message}]`
  }
}

export default HttpError