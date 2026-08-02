/**
 * @telecom-http-client/errors/ErrorFactory
 * Factory for creating HTTP errors
 *
 * @module @telecom-http-client/errors/ErrorFactory
 */

import HttpError from './HttpError.js'
import NetworkError from './NetworkError.js'
import TimeoutError from './TimeoutError.js'
import AuthError from './AuthError.js'
import { ERROR_TYPES, HTTP_STATUS } from '../types/index.js'

/**
 * ErrorFactory class - Creates appropriate error instances based on conditions
 * @class
 */
class ErrorFactory {
  /**
   * Create a parse error
   * @param {string} message - Error message
   * @param {Object} [options={}] - Error options
   * @returns {HttpError} Parse error instance
   */
  static parse(message, options = {}) {
    return new HttpError(message, {
      type: ERROR_TYPES.PARSE,
      ...options
    })
  }
  /**
   * Create an error from a response
   * @param {Response} response - Fetch API response
   * @param {Object} config - Request configuration
   * @param {Object} [body] - Parsed response body (optional, for envelope extraction)
   * @returns {HttpError} Appropriate error instance
   */
  static fromResponse(response, config, body = null) {
    const { status, statusText } = response

    // Extract error envelope from body: { error: { code, message, details? } }
    const errorEnvelope = (body && typeof body === 'object' && 'error' in body) ? body.error : null
    const serverCode = errorEnvelope?.code || null
    const serverMessage = errorEnvelope?.message || null
    const serverDetails = errorEnvelope?.details || null

    let error

    switch (status) {
      case HTTP_STATUS.UNAUTHORIZED:
        error = new AuthError(serverMessage || `Unauthorized: ${statusText}`, {
          status,
          statusText,
          config,
          tokenInvalid: true
        })
        break

      case HTTP_STATUS.FORBIDDEN:
        error = new AuthError(serverMessage || `Forbidden: ${statusText}`, {
          status,
          statusText,
          config,
          tokenExpired: true
        })
        break

      case HTTP_STATUS.NOT_FOUND:
        error = new HttpError(serverMessage || `Not Found: ${statusText}`, {
          type: ERROR_TYPES.CLIENT,
          status,
          statusText,
          config
        })
        break

      case HTTP_STATUS.TOO_MANY_REQUESTS:
        error = new HttpError(serverMessage || `Too Many Requests: ${statusText}`, {
          type: ERROR_TYPES.RATE_LIMIT,
          status,
          statusText,
          config
        })
        break

      case HTTP_STATUS.BAD_REQUEST:
      case HTTP_STATUS.UNPROCESSABLE_ENTITY:
      case HTTP_STATUS.CONFLICT:
      case HTTP_STATUS.PRECONDITION_FAILED:
        error = new HttpError(serverMessage || `Client Error: ${status} ${statusText}`, {
          type: ERROR_TYPES.VALIDATION,
          status,
          statusText,
          config
        })
        break

      default:
        if (status >= HTTP_STATUS.INTERNAL_SERVER_ERROR) {
          error = new HttpError(serverMessage || `Server Error: ${status} ${statusText}`, {
            type: ERROR_TYPES.SERVER,
            status,
            statusText,
            config
          })
        } else if (status >= HTTP_STATUS.BAD_REQUEST) {
          error = new HttpError(serverMessage || `Client Error: ${status} ${statusText}`, {
            type: ERROR_TYPES.CLIENT,
            status,
            statusText,
            config
          })
        } else {
          error = new HttpError(serverMessage || `HTTP Error: ${status} ${statusText}`, {
            type: ERROR_TYPES.UNKNOWN,
            status,
            statusText,
            config
          })
        }
    }

    // Attach server error envelope properties directly on the error instance
    if (serverCode) error.code = serverCode
    if (serverMessage) error.serverMessage = serverMessage
    if (serverDetails) error.details = serverDetails

    return error
  }

  /**
   * Create a network error
   * @param {string} message - Error message
   * @param {Object} [options={}] - Error options
   * @returns {NetworkError} Network error instance
   */
  static network(message, options = {}) {
    return new NetworkError(message, options)
  }

  /**
   * Create a timeout error
   * @param {string} message - Error message
   * @param {Object} [options={}] - Error options
   * @returns {TimeoutError} Timeout error instance
   */
  static timeout(message, options = {}) {
    return new TimeoutError(message, options)
  }

  /**
   * Create an auth error
   * @param {string} message - Error message
   * @param {Object} [options={}] - Error options
   * @returns {AuthError} Auth error instance
   */
  static auth(message, options = {}) {
    return new AuthError(message, options)
  }

  /**
   * Create an error from a fetch error
   * @param {Error} error - Original error
   * @param {Object} config - Request configuration
   * @returns {HttpError} Appropriate error instance
   */
  static fromFetchError(error, config) {
    if (error.name === 'AbortError') {
      return new TimeoutError(`Request timeout`, {
        config,
        timeout: config.timeout
      })
    }

    if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
      return new NetworkError('Network error: Failed to fetch', { config })
    }

    if (error.message.includes('network') || error.message.includes('fetch')) {
      return new NetworkError(error.message, { config })
    }

    return new HttpError(error.message, {
      type: ERROR_TYPES.NETWORK,
      config,
      code: error.code
    })
  }

  /**
   * Create an error from a fetch error with response
   * @param {Error} error - Original error
   * @param {Response} response - Fetch API response
   * @param {Object} config - Request configuration
   * @returns {HttpError} Appropriate error instance
   */
  static fromErrorWithResponse(error, response, config) {
    const httpError = ErrorFactory.fromResponse(response, config)
    httpError.message = error.message || httpError.message
    httpError.stack = error.stack
    return httpError
  }
}

export default ErrorFactory