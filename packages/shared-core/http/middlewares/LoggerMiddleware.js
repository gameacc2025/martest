/**
 * @telecom-http-client/middlewares/LoggerMiddleware
 * Logging middleware for HTTP client
 * Provides request/response logging with configurable levels
 *
 * @module @telecom-http-client/middlewares/LoggerMiddleware
 */

import { EVENT_TYPES } from '../types/index.js'

/**
 * LoggerMiddleware class - Logs HTTP requests and responses
 * @class
 */
class LoggerMiddleware {
  /**
   * Create a new LoggerMiddleware instance
   * @param {Object} [options={}] - Middleware options
   * @param {string} [options.level='info'] - Log level (debug, info, warn, error)
   * @param {Function} [options.logger=console] - Logger object
   * @param {boolean} [options.logRequest=true] - Log request details
   * @param {boolean} [options.logResponse=true] - Log response details
   * @param {boolean} [options.logError=true] - Log errors
   * @param {boolean} [options.logHeaders=false] - Log headers
   * @param {boolean} [options.logBody=false] - Log request/response bodies
   * @param {number} [options.maxBodyLength=1000] - Max body length to log
   */
  constructor(options = {}) {
    this.level = options.level || 'info'
    this.logger = options.logger || console
    this.logRequest = options.logRequest !== false
    this.logResponse = options.logResponse !== false
    this.logError = options.logError !== false
    this.logHeaders = options.logHeaders || false
    this.logBody = options.logBody || false
    this.maxBodyLength = options.maxBodyLength || 1000
  }

  /**
   * Log a message with the appropriate level
   * @private
   * @param {string} level - Log level
   * @param {string} message - Message to log
   * @param {Object} [data={}] - Additional data to log
   */
  _log(level, message, data = {}) {
    const logMethod = this.logger[level] || this.logger.log

    if (typeof logMethod === 'function') {
      if (Object.keys(data).length > 0) {
        logMethod(`[HTTP ${level.toUpperCase()}] ${message}`, data)
      } else {
        logMethod(`[HTTP ${level.toUpperCase()}] ${message}`)
      }
    }
  }

  /**
   * Format URL for logging
   * @private
   * @param {string} url - URL to format
   * @returns {string} Formatted URL
   */
  _formatURL(url) {
    try {
      const urlObj = new URL(url)
      return `${urlObj.method || 'GET'} ${urlObj.pathname}${urlObj.search}`
    } catch (error) {
      return url
    }
  }

  /**
   * Format headers for logging
   * @private
   * @param {Object} headers - Headers to format
   * @returns {Object} Formatted headers
   */
  _formatHeaders(headers) {
    if (!this.logHeaders) return {}

    const formatted = {}
    const sensitiveHeaders = ['authorization', 'cookie', 'set-cookie', 'token']

    for (const [key, value] of Object.entries(headers || {})) {
      const lowerKey = key.toLowerCase()
      if (sensitiveHeaders.includes(lowerKey)) {
        formatted[key] = '[REDACTED]'
      } else {
        formatted[key] = value
      }
    }

    return formatted
  }

  /**
   * Format body for logging
   * @private
   * @param {any} body - Body to format
   * @returns {any} Formatted body
   */
  _formatBody(body) {
    if (!this.logBody || !body) return undefined

    if (typeof body === 'string') {
      return body.length > this.maxBodyLength
        ? `${body.substring(0, this.maxBodyLength)}...`
        : body
    }

    if (typeof body === 'object') {
      const str = JSON.stringify(body)
      return str.length > this.maxBodyLength
        ? `${str.substring(0, this.maxBodyLength)}...`
        : str
    }

    return body
  }

  /**
   * Log request details
   * @private
   * @param {Object} config - Request configuration
   */
  _logRequest(config) {
    if (!this.logRequest) return

    const { method, url, headers, data } = config

    const logData = {
      method: method?.toUpperCase() || 'GET',
      url: this._formatURL(url),
      ...(this.logHeaders && { headers: this._formatHeaders(headers) }),
      ...(this.logBody && { body: this._formatBody(data) })
    }

    this._log('info', `Request: ${method?.toUpperCase() || 'GET'} ${url}`, logData)
  }

  /**
   * Log response details
   * @private
   * @param {Object} response - Response object
   * @param {number} duration - Request duration
   */
  _logResponse(response, duration) {
    if (!this.logResponse) return

    const { status, statusText, headers } = response
    const config = response.config || {}

    const logData = {
      status,
      statusText,
      duration: `${duration}ms`,
      url: this._formatURL(config.url),
      method: config.method?.toUpperCase() || 'GET',
      ...(this.logHeaders && { headers: this._formatHeaders(headers) }),
      ...(this.logBody && { body: this._formatBody(response.data) })
    }

    if (status >= 400) {
      this._log('warn', `Response: ${status} ${statusText}`, logData)
    } else {
      this._log('info', `Response: ${status} ${statusText}`, logData)
    }
  }

  /**
   * Log error details
   * @private
   * @param {Error} error - Error to log
   * @param {Object} config - Request configuration
   */
  _logError(error, config) {
    if (!this.logError) return

    const logData = {
      message: error.message,
      type: error.type,
      status: error.status,
      code: error.code,
      url: this._formatURL(config.url),
      method: config.method?.toUpperCase() || 'GET'
    }

    if (error.stack) {
      logData.stack = error.stack.split('\n').slice(0, 5).join('\n')
    }

    this._log('error', `Error: ${error.message}`, logData)
  }

  /**
   * Middleware function
   * @param {Object} config - Request configuration
   * @param {Function} next - Next middleware function
   * @returns {Promise<any>} Response
   */
  async handle(config, next) {
    const startTime = Date.now()

    // Log request
    this._logRequest(config)

    try {
      // Execute the request
      const response = await next(config)

      // Log response
      const duration = Date.now() - startTime
      this._logResponse(response, duration)

      return response
    } catch (error) {
      // Log error
      this._logError(error, config)
      throw error
    }
  }
}

export default LoggerMiddleware