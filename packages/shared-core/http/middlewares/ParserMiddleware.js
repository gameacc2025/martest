/**
 * @telecom-http-client/middlewares/ParserMiddleware
 * Response parsing middleware
 * Handles JSON response parsing with error handling
 *
 * @module @telecom-http-client/middlewares/ParserMiddleware
 */

import ErrorFactory from '../errors/ErrorFactory.js'
import { ERROR_TYPES } from '../types/index.js'

/**
 * ParserMiddleware class - Parses response data
 * @class
 */
class ParserMiddleware {
  /**
   * Create a new ParserMiddleware instance
   * @param {Object} [options={}] - Middleware options
   * @param {string} [options.defaultResponseType='json'] - Default response type
   * @param {boolean} [options.parseErrors=true] - Parse error responses
   * @param {boolean} [options.throwOnParseError=true] - Throw on parse errors
   */
  constructor(options = {}) {
    this.defaultResponseType = options.defaultResponseType || 'json'
    this.parseErrors = options.parseErrors !== false
    this.throwOnParseError = options.throwOnParseError !== false
  }

  /**
   * Parse response based on responseType
   * @private
   * @param {Response} response - Fetch API response
   * @param {string} responseType - Response type
   * @returns {Promise<any>} Parsed data
   */
  async _parseResponse(response, responseType) {
    const type = responseType.toLowerCase()

    try {
      switch (type) {
        case 'json':
          return await response.json()
        case 'text':
          return await response.text()
        case 'blob':
          return await response.blob()
        case 'arraybuffer':
          return await response.arrayBuffer()
        case 'formdata':
          return await response.formData()
        default:
          // Try JSON first, then text
          try {
            return await response.json()
          } catch (e) {
            return await response.text()
          }
      }
    } catch (error) {
      if (this.throwOnParseError) {
        throw ErrorFactory.parse(`Failed to parse response as ${type}`, {
          config: { responseType: type },
          error
        })
      }
      return null
    }
  }

  /**
   * Parse error response
   * @private
   * @param {Response} response - Fetch API response
   * @returns {Promise<Object>} Parsed error data
   */
  async _parseErrorResponse(response) {
    try {
      const contentType = response.headers.get('content-type') || ''
      if (contentType.includes('application/json')) {
        return await response.json()
      }
      return await response.text()
    } catch (error) {
      return { message: response.statusText }
    }
  }

  /**
   * Middleware function
   * @param {Object} config - Request configuration
   * @param {Function} next - Next middleware function
   * @returns {Promise<any>} Response
   */
  async handle(config, next) {
    // Set default response type if not specified
    const responseType = config.responseType || this.defaultResponseType

    // Execute the request
    const response = await next({
      ...config,
      responseType
    })

    // Parse the response data
    let data
    try {
      data = await this._parseResponse(response.raw, responseType)
    } catch (error) {
      if (this.throwOnParseError) {
        throw ErrorFactory.parse(`Failed to parse response: ${error.message}`, {
          config,
          error
        })
      }
      data = null
    }

    // Set parsed data directly on the HttpResponse instance
    // so that `response.data` getter returns the parsed data
    // and `instanceof HttpResponse` still holds true
    response._data = data
    response._parsed = true

    return response
  }
}

export default ParserMiddleware