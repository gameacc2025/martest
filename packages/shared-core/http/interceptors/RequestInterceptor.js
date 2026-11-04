/**
 * @telecom-http-client/interceptors/RequestInterceptor
 * Request interceptor base class
 *
 * @module @telecom-http-client/interceptors/RequestInterceptor
 */

/**
 * RequestInterceptor class - Base class for request interceptors
 * @class
 */
class RequestInterceptor {
  /**
   * Create a new RequestInterceptor instance
   * @param {Function} [interceptor] - Interceptor function
   */
  constructor(interceptor) {
    this.interceptor = interceptor || this.handle.bind(this)
  }

  /**
   * Intercept the request
   * @param {Object} config - Request configuration
   * @returns {Object|Promise<Object>} Modified or new configuration
   */
  handle(config) {
    return config
  }

  /**
   * Execute the interceptor
   * @param {Object} config - Request configuration
   * @returns {Promise<Object>} Modified configuration
   */
  async execute(config) {
    try {
      const result = this.interceptor(config)
      if (result instanceof Promise) {
        return await result
      }
      return result
    } catch (error) {
      throw error
    }
  }
}

export default RequestInterceptor