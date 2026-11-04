/**
 * @telecom-http-client/interceptors/ResponseInterceptor
 * Response interceptor base class
 *
 * @module @telecom-http-client/interceptors/ResponseInterceptor
 */

/**
 * ResponseInterceptor class - Base class for response interceptors
 * @class
 */
class ResponseInterceptor {
  /**
   * Create a new ResponseInterceptor instance
   * @param {Function} [interceptor] - Interceptor function
   */
  constructor(interceptor) {
    this.interceptor = interceptor || this.handle.bind(this)
  }

  /**
   * Intercept the response
   * @param {Object} response - Response object
   * @returns {Object|Promise<Object>} Modified or new response
   */
  handle(response) {
    return response
  }

  /**
   * Execute the interceptor
   * @param {Object} response - Response object
   * @returns {Promise<Object>} Modified response
   */
  async execute(response) {
    try {
      const result = this.interceptor(response)
      if (result instanceof Promise) {
        return await result
      }
      return result
    } catch (error) {
      throw error
    }
  }
}

export default ResponseInterceptor