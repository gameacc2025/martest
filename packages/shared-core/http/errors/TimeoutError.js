/**
 * @telecom-http-client/errors/TimeoutError
 * Timeout error class
 *
 * @module @telecom-http-client/errors/TimeoutError
 */

import HttpError from './HttpError.js'
import { ERROR_TYPES } from '../types/index.js'

/**
 * TimeoutError class - Request timeout errors
 * @class
 * @extends HttpError
 */
class TimeoutError extends HttpError {
  /**
   * Create a new TimeoutError instance
   * @param {string} message - Error message
   * @param {Object} [options={}] - Error options
   * @param {number} [options.timeout] - Timeout value in milliseconds
   */
  constructor(message, options = {}) {
    super(message, {
      type: ERROR_TYPES.TIMEOUT,
      ...options
    })

    this.name = 'TimeoutError'
    this.code = options.code || 'TIMEOUT_ERROR'
    this.timeout = options.timeout

    // Maintain proper stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, TimeoutError)
    }
  }
}

export default TimeoutError