/**
 * @telecom-http-client/core/HttpClient
 * Main HTTP client class
 * Orchestrates requests, middlewares, interceptors, and plugins
 *
 * @module @telecom-http-client/core/HttpClient
 */

import HttpConfig from './HttpConfig.js'
import HttpRequest from './HttpRequest.js'
import HttpResponse from './HttpResponse.js'
import { HTTP_METHODS, ERROR_TYPES, HTTP_STATUS, EVENT_TYPES } from '../types/index.js'
import EventEmitter from '../utils/EventEmitter.js'

/**
 * HttpClient class - Main HTTP client
 * @class
 */
class HttpClient {
  /**
   * Create a new HttpClient instance
   * @param {Object} [config={}] - Client configuration
   */
  constructor(config = {}) {
    this.config = new HttpConfig(config)
    this.events = new EventEmitter()
    this._plugins = []
    this._initialized = false
    this._destroyed = false

    // Setup default interceptors and middlewares
    this._setupDefaults()
  }

  /**
   * Setup default interceptors and middlewares
   * @private
   */
  _setupDefaults() {
    // Add default response interceptor for error handling
    this.config.addResponseInterceptor((response) => {
      if (!response.ok) {
        const error = this._createErrorFromResponse(response)
        throw error
      }
      return response
    })

    // Add default error interceptor
    this.config.addErrorInterceptor((error) => {
      this.events.emit(EVENT_TYPES.REQUEST_ERROR, {
        error,
        config: error.config,
        timestamp: new Date()
      })
      throw error
    })
  }

  /**
   * Initialize the client
   * @returns {Promise<HttpClient>} Returns this for chaining
   */
  async init() {
    if (this._initialized) {
      return this
    }

    // Initialize plugins
    for (const plugin of this._plugins) {
      if (plugin.setup && typeof plugin.setup === 'function') {
        try {
          await plugin.setup(this)
        } catch (error) {
          console.error(`Plugin ${plugin.name} setup failed:`, error)
        }
      }
    }

    this._initialized = true
    return this
  }

  /**
   * Destroy the client and cleanup resources
   * @returns {Promise<void>}
   */
  async destroy() {
    if (this._destroyed) {
      return
    }

    // Teardown plugins
    for (const plugin of this._plugins) {
      if (plugin.teardown && typeof plugin.teardown === 'function') {
        try {
          await plugin.teardown(this)
        } catch (error) {
          console.error(`Plugin ${plugin.name} teardown failed:`, error)
        }
      }
    }

    this._destroyed = true
    this._initialized = false
    this.events.removeAllListeners()
  }

  /**
   * Add a plugin
   * @param {Object} plugin - Plugin to add
   * @returns {HttpClient} Returns this for chaining
   */
  use(plugin) {
    this._plugins.push(plugin)
    return this
  }

  /**
   * Remove a plugin
   * @param {Object|string} plugin - Plugin or plugin name to remove
   * @returns {boolean} True if removed, false otherwise
   */
  removePlugin(plugin) {
    const name = typeof plugin === 'string' ? plugin : plugin.name
    const index = this._plugins.findIndex(p => p.name === name)
    if (index !== -1) {
      this._plugins.splice(index, 1)
      return true
    }
    return false
  }

  /**
   * Get all plugins
   * @returns {Array<Object>} All plugins
   */
  getPlugins() {
    return [...this._plugins]
  }

  /**
   * Add a middleware
   * @param {Function} middleware - Middleware function
   * @returns {HttpClient} Returns this for chaining
   */
  addMiddleware(middleware) {
    this.config.addMiddleware(middleware)
    return this
  }

  /**
   * Add a request interceptor
   * @param {Function} interceptor - Request interceptor function
   * @returns {HttpClient} Returns this for chaining
   */
  addRequestInterceptor(interceptor) {
    this.config.addRequestInterceptor(interceptor)
    return this
  }

  /**
   * Add a response interceptor
   * @param {Function} interceptor - Response interceptor function
   * @returns {HttpClient} Returns this for chaining
   */
  addResponseInterceptor(interceptor) {
    this.config.addResponseInterceptor(interceptor)
    return this
  }

  /**
   * Add an error interceptor
   * @param {Function} interceptor - Error interceptor function
   * @returns {HttpClient} Returns this for chaining
   */
  addErrorInterceptor(interceptor) {
    this.config.addErrorInterceptor(interceptor)
    return this
  }

  /**
   * Set base URL
   * @param {string} baseURL - Base URL
   * @returns {HttpClient} Returns this for chaining
   */
  setBaseURL(baseURL) {
    this.config.setDefaults({ baseURL })
    return this
  }

  /**
   * Set default headers
   * @param {Object} headers - Default headers
   * @returns {HttpClient} Returns this for chaining
   */
  setDefaultHeaders(headers) {
    this.config.setDefaults({ headers })
    return this
  }

  /**
   * Set default timeout
   * @param {number} timeout - Timeout in milliseconds
   * @returns {HttpClient} Returns this for chaining
   */
  setDefaultTimeout(timeout) {
    this.config.setDefaults({ timeout })
    return this
  }

  /**
   * Set default response type
   * @param {string} responseType - Response type
   * @returns {HttpClient} Returns this for chaining
   */
  setDefaultResponseType(responseType) {
    this.config.setDefaults({ responseType })
    return this
  }

  /**
   * Enable/disable credentials
   * @param {boolean} enabled - Enable credentials
   * @returns {HttpClient} Returns this for chaining
   */
  setWithCredentials(enabled) {
    this.config.setDefaults({ withCredentials: enabled })
    return this
  }

  /**
   * Create an error from a response
   * @private
   * @param {HttpResponse} response - Response object
   * @returns {Error} Error instance
   */
  _createErrorFromResponse(response) {
    const { status, statusText, config } = response
    let error

    // Extract error envelope from body: { error: { code, message, details? } }
    const body = response.data
    const errorEnvelope = (body && typeof body === 'object' && 'error' in body) ? body.error : null
    const serverCode = errorEnvelope?.code || null
    const serverMessage = errorEnvelope?.message || null
    const serverDetails = errorEnvelope?.details || null

    // Create appropriate error based on status
    if (status === HTTP_STATUS.UNAUTHORIZED) {
      error = new Error(serverMessage || `Unauthorized: ${statusText}`)
      error.type = ERROR_TYPES.AUTH
      error.status = status
    } else if (status === HTTP_STATUS.FORBIDDEN) {
      error = new Error(serverMessage || `Forbidden: ${statusText}`)
      error.type = ERROR_TYPES.AUTH
      error.status = status
    } else if (status === HTTP_STATUS.NOT_FOUND) {
      error = new Error(serverMessage || `Not Found: ${statusText}`)
      error.type = ERROR_TYPES.CLIENT
      error.status = status
    } else if (status === HTTP_STATUS.TOO_MANY_REQUESTS) {
      error = new Error(serverMessage || `Too Many Requests: ${statusText}`)
      error.type = ERROR_TYPES.RATE_LIMIT
      error.status = status
    } else if (status >= HTTP_STATUS.INTERNAL_SERVER_ERROR) {
      error = new Error(serverMessage || `Server Error: ${status} ${statusText}`)
      error.type = ERROR_TYPES.SERVER
      error.status = status
    } else if (status >= HTTP_STATUS.BAD_REQUEST && status < HTTP_STATUS.INTERNAL_SERVER_ERROR) {
      error = new Error(serverMessage || `Client Error: ${status} ${statusText}`)
      error.type = ERROR_TYPES.CLIENT
      error.status = status
    } else {
      error = new Error(serverMessage || `HTTP Error: ${status} ${statusText}`)
      error.type = ERROR_TYPES.UNKNOWN
      error.status = status
    }

    // Attach server error envelope properties directly on the error
    if (serverCode) error.code = serverCode
    if (serverMessage) error.serverMessage = serverMessage
    if (serverDetails) error.details = serverDetails
    error.config = config
    error.response = response
    error.data = body
    error.name = `HttpError_${status}`

    return error
  }

  /**
   * Execute a request through the middleware chain
   * @private
   * @param {HttpRequest} request - Request to execute
   * @param {Array<Function>} middlewares - Middleware chain
   * @param {number} index - Current middleware index
   * @returns {Promise<any>} Response
   */
  async _executeMiddlewareChain(request, middlewares, index = 0) {
    if (index >= middlewares.length) {
      // End of middleware chain, execute the request
      return this._executeRequest(request)
    }

    const middleware = middlewares[index]
    const next = async (config) => {
      const newRequest = config !== request.config ? new HttpRequest(config) : request
      return this._executeMiddlewareChain(newRequest, middlewares, index + 1)
    }

    try {
      return await middleware(request.config, next)
    } catch (error) {
      throw error
    }
  }

  /**
   * Execute a request
   * @private
   * @param {HttpRequest} request - Request to execute
   * @returns {Promise<HttpResponse>} Response
   */
  async _executeRequest(request) {
    const { config } = request

    // Emit request start event
    this.events.emit(EVENT_TYPES.REQUEST_START, {
      config,
      timestamp: new Date()
    })

    try {
      // Execute fetch
      const fetchResponse = await request.execute()

      // Create HttpResponse
      const response = new HttpResponse(fetchResponse, config, request.getDuration())

      // Emit request end event
      this.events.emit(EVENT_TYPES.REQUEST_END, {
        response,
        config,
        duration: request.getDuration(),
        timestamp: new Date()
      })

      return response
    } catch (error) {
      // Handle fetch errors
      if (error.name === 'AbortError') {
        error.type = ERROR_TYPES.TIMEOUT
        error.message = `Request timeout after ${config.timeout}ms`
      } else if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
        error.type = ERROR_TYPES.NETWORK
        error.message = 'Network error: Failed to fetch'
      } else {
        error.type = ERROR_TYPES.NETWORK
      }

      error.config = config
      throw error
    }
  }

  /**
   * Apply request interceptors
   * @private
   * @param {Object} config - Request configuration
   * @returns {Promise<Object>} Modified configuration
   */
  async _applyRequestInterceptors(config) {
    let currentConfig = { ...config }

    for (const interceptor of this.config.getInterceptors().request) {
      try {
        const result = await interceptor(currentConfig)
        if (result !== undefined) {
          currentConfig = result
        }
      } catch (error) {
        throw error
      }
    }

    return currentConfig
  }

  /**
   * Apply response interceptors
   * @private
   * @param {HttpResponse} response - Response object
   * @returns {Promise<HttpResponse>} Modified response
   */
  async _applyResponseInterceptors(response) {
    let currentResponse = response

    for (const interceptor of this.config.getInterceptors().response) {
      try {
        const result = await interceptor(currentResponse)
        if (result !== undefined) {
          currentResponse = result
        }
      } catch (error) {
        throw error
      }
    }

    return currentResponse
  }

  /**
   * Apply error interceptors
   * @private
   * @param {Error} error - Error object
   * @returns {Promise<Error>} Modified error
   */
  async _applyErrorInterceptors(error) {
    let currentError = error

    for (const interceptor of this.config.getInterceptors().error) {
      try {
        const result = await interceptor(currentError)
        if (result !== undefined) {
          currentError = result
        }
      } catch (interceptorError) {
        currentError = interceptorError
      }
    }

    return currentError
  }

  /**
   * Make an HTTP request
   * @param {string} url - Request URL
   * @param {Object} [config={}] - Request configuration
   * @returns {Promise<HttpResponse>} Response
   */
  async request(url, config = {}) {
    if (this._destroyed) {
      throw new Error('HttpClient has been destroyed')
    }

    // Merge config with defaults
    const mergedConfig = this.config.merge({
      url,
      ...config
    })

    // Apply request interceptors
    const interceptedConfig = await this._applyRequestInterceptors(mergedConfig)

    // Create request
    const request = new HttpRequest(interceptedConfig)

    // Execute through middleware chain
    const middlewares = this.config.getMiddlewares()
    let response

    try {
      const result = await this._executeMiddlewareChain(request, middlewares)

      // Ensure we have a proper Response object for HttpResponse constructor
      if (result instanceof HttpResponse) {
        response = result
      } else if (result instanceof Response) {
        response = new HttpResponse(result, interceptedConfig, request.getDuration())
      } else {
        // If result is not a Response or HttpResponse, execute the request directly
        // to get a proper fetch Response object
        const fetchResponse = await request.execute()
        response = new HttpResponse(fetchResponse, interceptedConfig, request.getDuration())
      }
    } catch (error) {
      // Apply error interceptors
      const processedError = await this._applyErrorInterceptors(error)
      throw processedError
    }

    // Apply response interceptors
    const processedResponse = await this._applyResponseInterceptors(response)

    return processedResponse
  }

  /**
   * Make a GET request
   * @param {string} url - Request URL
   * @param {Object} [config={}] - Request configuration
   * @returns {Promise<HttpResponse>} Response
   */
  get(url, config = {}) {
    return this.request(url, { method: HTTP_METHODS.GET, ...config })
  }

  /**
   * Make a POST request
   * @param {string} url - Request URL
   * @param {Object} [data=null] - Request body
   * @param {Object} [config={}] - Request configuration
   * @returns {Promise<HttpResponse>} Response
   */
  post(url, data = null, config = {}) {
    return this.request(url, { method: HTTP_METHODS.POST, data, ...config })
  }

  /**
   * Make a PUT request
   * @param {string} url - Request URL
   * @param {Object} [data=null] - Request body
   * @param {Object} [config={}] - Request configuration
   * @returns {Promise<HttpResponse>} Response
   */
  put(url, data = null, config = {}) {
    return this.request(url, { method: HTTP_METHODS.PUT, data, ...config })
  }

  /**
   * Make a PATCH request
   * @param {string} url - Request URL
   * @param {Object} [data=null] - Request body
   * @param {Object} [config={}] - Request configuration
   * @returns {Promise<HttpResponse>} Response
   */
  patch(url, data = null, config = {}) {
    return this.request(url, { method: HTTP_METHODS.PATCH, data, ...config })
  }

  /**
   * Make a DELETE request
   * @param {string} url - Request URL
   * @param {Object} [config={}] - Request configuration
   * @returns {Promise<HttpResponse>} Response
   */
  delete(url, config = {}) {
    return this.request(url, { method: HTTP_METHODS.DELETE, ...config })
  }

  /**
   * Make a HEAD request
   * @param {string} url - Request URL
   * @param {Object} [config={}] - Request configuration
   * @returns {Promise<HttpResponse>} Response
   */
  head(url, config = {}) {
    return this.request(url, { method: HTTP_METHODS.HEAD, ...config })
  }

  /**
   * Make an OPTIONS request
   * @param {string} url - Request URL
   * @param {Object} [config={}] - Request configuration
   * @returns {Promise<HttpResponse>} Response
   */
  options(url, config = {}) {
    return this.request(url, { method: HTTP_METHODS.OPTIONS, ...config })
  }

  /**
   * Create a new HttpClient instance with the same configuration
   * @returns {HttpClient} New HttpClient instance
   */
  clone() {
    return new HttpClient(this.config.getDefaults())
  }

  /**
   * Get client configuration
   * @returns {HttpConfig} Client configuration
   */
  getConfig() {
    return this.config
  }

  /**
   * Get string representation
   * @returns {string} String representation
   */
  toString() {
    return `[HttpClient: baseURL=${this.config.getDefaults().baseURL}]`
  }
}

export default HttpClient