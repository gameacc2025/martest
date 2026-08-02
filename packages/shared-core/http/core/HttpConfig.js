/**
 * @telecom-http-client/core/HttpConfig
 * HTTP client configuration class
 * Handles default configuration and merging with request-specific config
 *
 * @module @telecom-http-client/core/HttpConfig
 */

import { HTTP_METHODS } from '../types/index.js'

/**
 * Default configuration values
 * @constant {Object}
 */
const DEFAULT_CONFIG = {
  method: HTTP_METHODS.GET,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 0,
  responseType: 'json',
  withCredentials: false,
  baseURL: '',
  params: {},
  data: null,
  signal: null,
  auth: null,
  onUploadProgress: null,
  onDownloadProgress: null,
  meta: {}
}

/**
 * HttpConfig class - Manages HTTP client configuration
 * @class
 */
class HttpConfig {
  /**
   * Create a new HttpConfig instance
   * @param {Object} [config={}] - Initial configuration
   */
  constructor(config = {}) {
    this.defaults = { ...DEFAULT_CONFIG, ...config }
    this._interceptors = {
      request: [],
      response: [],
      error: []
    }
    this._middlewares = []
  }

  /**
   * Get the default configuration
   * @returns {Object} Default configuration
   */
  getDefaults() {
    return { ...this.defaults }
  }

  /**
   * Set default configuration
   * @param {Object} config - Configuration to set
   * @returns {HttpConfig} Returns this for chaining
   */
  setDefaults(config) {
    this.defaults = { ...this.defaults, ...config }
    return this
  }

  /**
   * Merge request-specific config with defaults
   * @param {Object} requestConfig - Request-specific configuration
   * @returns {Object} Merged configuration
   */
  merge(requestConfig) {
    const merged = { ...this.getDefaults(), ...requestConfig }

    // Deep merge headers
    merged.headers = {
      ...this.defaults.headers,
      ...(requestConfig.headers || {})
    }

    // Deep merge params
    merged.params = {
      ...this.defaults.params,
      ...(requestConfig.params || {})
    }

    // Deep merge meta
    merged.meta = {
      ...this.defaults.meta,
      ...(requestConfig.meta || {})
    }

    return merged
  }

  /**
   * Add a request interceptor
   * @param {Function} interceptor - Interceptor function
   * @returns {HttpConfig} Returns this for chaining
   */
  addRequestInterceptor(interceptor) {
    this._interceptors.request.push(interceptor)
    return this
  }

  /**
   * Add a response interceptor
   * @param {Function} interceptor - Interceptor function
   * @returns {HttpConfig} Returns this for chaining
   */
  addResponseInterceptor(interceptor) {
    this._interceptors.response.push(interceptor)
    return this
  }

  /**
   * Add an error interceptor
   * @param {Function} interceptor - Interceptor function
   * @returns {HttpConfig} Returns this for chaining
   */
  addErrorInterceptor(interceptor) {
    this._interceptors.error.push(interceptor)
    return this
  }

  /**
   * Get all interceptors
   * @returns {Object} All interceptors
   */
  getInterceptors() {
    return { ...this._interceptors }
  }

  /**
   * Add a middleware
   * @param {Function} middleware - Middleware function
   * @returns {HttpConfig} Returns this for chaining
   */
  addMiddleware(middleware) {
    this._middlewares.push(middleware)
    return this
  }

  /**
   * Get all middlewares
   * @returns {Array<Function>} All middlewares
   */
  getMiddlewares() {
    return [...this._middlewares]
  }

  /**
   * Remove a request interceptor
   * @param {Function} interceptor - Interceptor to remove
   * @returns {boolean} True if removed, false otherwise
   */
  removeRequestInterceptor(interceptor) {
    const index = this._interceptors.request.indexOf(interceptor)
    if (index !== -1) {
      this._interceptors.request.splice(index, 1)
      return true
    }
    return false
  }

  /**
   * Remove a response interceptor
   * @param {Function} interceptor - Interceptor to remove
   * @returns {boolean} True if removed, false otherwise
   */
  removeResponseInterceptor(interceptor) {
    const index = this._interceptors.response.indexOf(interceptor)
    if (index !== -1) {
      this._interceptors.response.splice(index, 1)
      return true
    }
    return false
  }

  /**
   * Remove an error interceptor
   * @param {Function} interceptor - Interceptor to remove
   * @returns {boolean} True if removed, false otherwise
   */
  removeErrorInterceptor(interceptor) {
    const index = this._interceptors.error.indexOf(interceptor)
    if (index !== -1) {
      this._interceptors.error.splice(index, 1)
      return true
    }
    return false
  }

  /**
   * Remove a middleware
   * @param {Function} middleware - Middleware to remove
   * @returns {boolean} True if removed, false otherwise
   */
  removeMiddleware(middleware) {
    const index = this._middlewares.indexOf(middleware)
    if (index !== -1) {
      this._middlewares.splice(index, 1)
      return true
    }
    return false
  }

  /**
   * Clear all interceptors
   * @returns {HttpConfig} Returns this for chaining
   */
  clearInterceptors() {
    this._interceptors = {
      request: [],
      response: [],
      error: []
    }
    return this
  }

  /**
   * Clear all middlewares
   * @returns {HttpConfig} Returns this for chaining
   */
  clearMiddlewares() {
    this._middlewares = []
    return this
  }

  /**
   * Reset to default configuration
   * @returns {HttpConfig} Returns this for chaining
   */
  reset() {
    this.defaults = { ...DEFAULT_CONFIG }
    this.clearInterceptors()
    this.clearMiddlewares()
    return this
  }

  /**
   * Create a new HttpConfig instance with the same defaults
   * @returns {HttpConfig} New HttpConfig instance
   */
  clone() {
    const clone = new HttpConfig(this.getDefaults())
    clone._interceptors = {
      request: [...this._interceptors.request],
      response: [...this._interceptors.response],
      error: [...this._interceptors.error]
    }
    clone._middlewares = [...this._middlewares]
    return clone
  }
}

export default HttpConfig