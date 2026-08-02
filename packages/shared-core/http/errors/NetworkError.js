/**
 * @telecom-http-client/errors/NetworkError
 * Network error class
 *
 * @module @telecom-http-client/errors/NetworkError
 */

import HttpError from './HttpError.js'
import { ERROR_TYPES } from '../types/index.js'

/**
 * NetworkError class - Network-related errors
 * @class
 * @extends HttpError
 */
class NetworkError extends HttpError {
  /**
   * Create a new NetworkError instance
   * @param {string} message - Error message
   * @param {Object} [options={}] - Error options
   */
  constructor(message, options = {}) {
    super(message, {
      type: ERROR_TYPES.NETWORK,
      ...options
    })

    this.name = 'NetworkError'
    this.code = options.code || 'NETWORK_ERROR'

    // Maintain proper stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, NetworkError)
    }
  }
}

export default NetworkError