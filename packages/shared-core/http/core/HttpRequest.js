/**
 * @telecom-http-client/core/HttpRequest
 * HTTP request class
 * Handles request creation, URL building, and fetch execution
 *
 * @module @telecom-http-client/core/HttpRequest
 */

import { HTTP_METHODS } from '../types/index.js'

/**
 * HttpRequest class - Represents an HTTP request
 * @class
 */
class HttpRequest {
  /**
   * Create a new HttpRequest instance
   * @param {Object} config - Request configuration
   */
  constructor(config) {
    this.config = config
    this._abortController = null
    this._timeoutId = null
    this._startTime = null
    this._endTime = null
  }


/**
 * Build the full URL from baseURL and url with query parameters
 * @returns {URL} URL object
 */
buildURL() {
  const { baseURL, url, params } = this.config

  let fullUrl

  // Absolute URL (http:// or https://)
  if (/^https?:\/\//i.test(url)) {
    fullUrl = url
  } else if (baseURL) {
    // Relative baseURL (/api/v1)
    if (baseURL.startsWith('/')) {
      const origin = window.location.origin

      const base = `${origin}${baseURL}`.replace(/\/+$/, '')
      const path = String(url).replace(/^\/+/, '')

      fullUrl = `${base}/${path}`
    } else {
      // Absolute baseURL (http://localhost:3000/api/v1)
      const base = baseURL.replace(/\/+$/, '')
      const path = String(url).replace(/^\/+/, '')

      fullUrl = `${base}/${path}`
    }
  } else {
    fullUrl = url
  }

  // Create URL object
  const urlObj = new URL(fullUrl)

  // Append query parameters
  if (params && Object.keys(params).length > 0) {
    Object.entries(params).forEach(([key, value]) => {
      if (value === undefined || value === null) return

      if (Array.isArray(value)) {
        value.forEach(item => {
          if (item !== undefined && item !== null) {
            urlObj.searchParams.append(key, String(item))
          }
        })
      } else {
        urlObj.searchParams.append(key, String(value))
      }
    })
  }

  return urlObj
}

  /**
   * Build request headers
   * @returns {Headers} Headers object
   */
  buildHeaders() {
    const { headers = {}, withCredentials, data } = this.config
    const requestHeaders = new Headers()

    // When sending FormData, let the browser set Content-Type (including the
    // multipart boundary). A pre-set 'application/json' (or any manual
    // Content-Type) would corrupt the request, so we skip it here.
    const isFormData = typeof FormData !== 'undefined' && data instanceof FormData

    // Add default headers
    Object.entries(headers).forEach(([key, value]) => {
      if (value === undefined || value === null) return
      if (isFormData && key.toLowerCase() === 'content-type') return
      requestHeaders.set(key, String(value))
    })


    // Handle credentials
    if (withCredentials) {
      requestHeaders.set('Credentials', 'include')
    }

    return requestHeaders
  }

  /**
   * Build request body
   * @returns {BodyInit|undefined} Request body
   */
  buildBody() {
    const { data, headers } = this.config

    if (data === null || data === undefined) {
      return undefined
    }

    // Handle FormData
    if (data instanceof FormData) {
      return data
    }

    // Handle URLSearchParams
    if (data instanceof URLSearchParams) {
      return data
    }

    // Handle string
    if (typeof data === 'string') {
      return data
    }

    // Handle Blob, ArrayBuffer, etc.
    if (data instanceof Blob || data instanceof ArrayBuffer) {
      return data
    }

    // Handle object - check content type
    const contentType = headers?.['Content-Type'] || headers?.['content-type'] || 'application/json'

    if (contentType.includes('application/json')) {
      return JSON.stringify(data)
    }

    if (contentType.includes('application/x-www-form-urlencoded')) {
      return new URLSearchParams(data).toString()
    }

    // Default to JSON
    return JSON.stringify(data)
  }

  /**
   * Get the HTTP method
   * @returns {string} HTTP method
   */
  getMethod() {
    return (this.config.method || HTTP_METHODS.GET).toUpperCase()
  }

  /**
   * Create fetch options from configuration
   * @returns {RequestInit} Fetch options
   */
  createFetchOptions() {
    const method = this.getMethod()
    const headers = this.buildHeaders()
    const body = this.buildBody()

    const options = {
      method,
      headers,
      credentials: this.config.withCredentials ? 'include' : 'same-origin'
    }

    // Add body for methods that support it
    if (body !== undefined && method !== HTTP_METHODS.GET && method !== HTTP_METHODS.HEAD) {
      options.body = body
    }

    // Add signal for cancellation
    if (this._abortController) {
      options.signal = this._abortController.signal
    }

    return options
  }

  /**
   * Create a new AbortController for timeout
   * @param {number} timeout - Timeout in milliseconds
   */
  createTimeoutController(timeout) {
    if (this._timeoutId) {
      clearTimeout(this._timeoutId)
      this._timeoutId = null
    }

    if (this._abortController) {
      this._abortController.abort()
    }

    this._abortController = new AbortController()

    if (timeout > 0) {
      this._timeoutId = setTimeout(() => {
        this._abortController.abort()
      }, timeout)
    }
  }

  /**
   * Start timing the request
   */
  startTiming() {
    this._startTime = Date.now()
    this._endTime = null
  }

  /**
   * End timing the request
   */
  endTiming() {
    this._endTime = Date.now()
  }

  /**
   * Get request duration
   * @returns {number} Duration in milliseconds
   */
  getDuration() {
    if (this._startTime && this._endTime) {
      return this._endTime - this._startTime
    }
    return 0
  }

  /**
   * Cancel the request
   */
  cancel() {
    if (this._abortController) {
      this._abortController.abort()
    }
    if (this._timeoutId) {
      clearTimeout(this._timeoutId)
    }
  }

  /**
   * Cleanup resources
   */
  cleanup() {
    this.cancel()
    this._abortController = null
    this._timeoutId = null
    this._startTime = null
    this._endTime = null
  }

  /**
   * Execute the request using fetch
   * @returns {Promise<Response>} Fetch response
   */
  async execute() {
    this.startTiming()
    const url = this.buildURL()
    const options = this.createFetchOptions()

    // Setup timeout
    const timeout = this.config.timeout || 0
    this.createTimeoutController(timeout)

    try {
      const response = await fetch(url.toString(), options)
      this.endTiming()
      return response
    } catch (error) {
      this.endTiming()
      throw error
    } finally {
      this.cleanup()
    }
  }

  /**
   * Clone the request with new configuration
   * @param {Object} newConfig - New configuration to merge
   * @returns {HttpRequest} New HttpRequest instance
   */
  clone(newConfig) {
    return new HttpRequest({ ...this.config, ...newConfig })
  }
}

export default HttpRequest