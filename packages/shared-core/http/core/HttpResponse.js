/**
 * @telecom-http-client/core/HttpResponse
 * HTTP response class
 * Handles response parsing and transformation
 *
 * @module @telecom-http-client/core/HttpResponse
 */

/**
 * HttpResponse class - Represents an HTTP response
 * @class
 */
class HttpResponse {
  /**
   * Create a new HttpResponse instance
   * @param {Response} fetchResponse - Fetch API response
   * @param {Object} config - Original request configuration
   * @param {number} [duration=0] - Request duration in milliseconds
   */
  constructor(fetchResponse, config, duration = 0) {
    this._fetchResponse = fetchResponse
    this.config = config
    this.duration = duration
    this.timestamp = new Date()
    this._parsed = false
    this._data = null
    this._error = null
  }

  /**
   * Get the HTTP status code
   * @returns {number} Status code
   */
  get status() {
    return this._fetchResponse.status
  }

  /**
   * Get the HTTP status text
   * @returns {string} Status text
   */
  get statusText() {
    return this._fetchResponse.statusText
  }

  /**
   * Get response headers as an object
   * @returns {Object} Response headers
   */
  get headers() {
    const headers = {}
    this._fetchResponse.headers.forEach((value, key) => {
      headers[key] = value
    })
    return headers
  }

  /**
   * Get the raw fetch response
   * @returns {Response} Fetch API response
   */
  get raw() {
    return this._fetchResponse
  }

  /**
   * Get the response data (parsed based on responseType)
   * @returns {any} Parsed response data
   */
  get data() {
    if (this._parsed) {
      return this._data
    }
    return this._parseData()
  }

  /**
   * Get any parsing error
   * @returns {Error|null} Parsing error
   */
  get parseError() {
    return this._error
  }

  /**
   * Check if the response was successful (2xx status)
   * @returns {boolean} True if successful
   */
  get ok() {
    return this.status >= 200 && this.status < 300
  }

  /**
   * Check if the response was a client error (4xx status)
   * @returns {boolean} True if client error
   */
  get clientError() {
    return this.status >= 400 && this.status < 500
  }

  /**
   * Check if the response was a server error (5xx status)
   * @returns {boolean} True if server error
   */
  get serverError() {
    return this.status >= 500 && this.status < 600
  }

  /**
   * Check if the response was a redirect (3xx status)
   * @returns {boolean} True if redirect
   */
  get redirect() {
    return this.status >= 300 && this.status < 400
  }

  /**
   * Parse the response data based on responseType
   * @private
   * @returns {any} Parsed data
   */
  _parseData() {
    if (this._parsed) {
      return this._data
    }

    const responseType = this.config.responseType || 'json'
    this._parsed = true

    try {
      switch (responseType.toLowerCase()) {
        case 'json':
          return this._parseJSON()
        case 'text':
          return this._parseText()
        case 'blob':
          return this._parseBlob()
        case 'arraybuffer':
          return this._parseArrayBuffer()
        case 'formdata':
          return this._parseFormData()
        case 'stream':
          return this._parseStream()
        default:
          return this._parseJSON()
      }
    } catch (error) {
      this._error = error
      throw error
    }
  }

  /**
   * Parse response as JSON
   * @private
   * @returns {Promise<any>} Parsed JSON data
   */
  async _parseJSON() {
    if (this._data !== null) {
      return this._data
    }
    this._data = await this._fetchResponse.json()
    return this._data
  }

  /**
   * Parse response as text
   * @private
   * @returns {Promise<string>} Text data
   */
  async _parseText() {
    if (this._data !== null) {
      return this._data
    }
    this._data = await this._fetchResponse.text()
    return this._data
  }

  /**
   * Parse response as Blob
   * @private
   * @returns {Promise<Blob>} Blob data
   */
  async _parseBlob() {
    if (this._data !== null) {
      return this._data
    }
    this._data = await this._fetchResponse.blob()
    return this._data
  }

  /**
   * Parse response as ArrayBuffer
   * @private
   * @returns {Promise<ArrayBuffer>} ArrayBuffer data
   */
  async _parseArrayBuffer() {
    if (this._data !== null) {
      return this._data
    }
    this._data = await this._fetchResponse.arrayBuffer()
    return this._data
  }

  /**
   * Parse response as FormData
   * @private
   * @returns {Promise<FormData>} FormData
   */
  async _parseFormData() {
    if (this._data !== null) {
      return this._data
    }
    this._data = await this._fetchResponse.formData()
    return this._data
  }

  /**
   * Parse response as ReadableStream
   * @private
   * @returns {ReadableStream} Stream
   */
  _parseStream() {
    if (this._data !== null) {
      return this._data
    }
    this._data = this._fetchResponse.body
    return this._data
  }

  /**
   * Get header value by name (case-insensitive)
   * @param {string} name - Header name
   * @returns {string|null} Header value or null
   */
  getHeader(name) {
    const lowerName = name.toLowerCase()
    for (const [key, value] of this._fetchResponse.headers.entries()) {
      if (key.toLowerCase() === lowerName) {
        return value
      }
    }
    return null
  }

  /**
   * Check if response has a specific header
   * @param {string} name - Header name
   * @returns {boolean} True if header exists
   */
  hasHeader(name) {
    return this.getHeader(name) !== null
  }

  /**
   * Get all header names
   * @returns {Array<string>} Array of header names
   */
  getHeaderNames() {
    return Array.from(this._fetchResponse.headers.keys())
  }

  /**
   * Clone the response
   * @returns {HttpResponse} New HttpResponse instance
   */
  clone() {
    return new HttpResponse(this._fetchResponse.clone(), this.config, this.duration)
  }

  /**
   * Convert to plain object
   * @returns {Object} Plain object representation
   */
  toJSON() {
    return {
      data: this._data,
      status: this.status,
      statusText: this.statusText,
      headers: this.headers,
      config: this.config,
      duration: this.duration,
      timestamp: this.timestamp.toISOString()
    }
  }

  /**
   * Get string representation
   * @returns {string} String representation
   */
  toString() {
    return `[HttpResponse: ${this.status} ${this.statusText}]`
  }
}

export default HttpResponse