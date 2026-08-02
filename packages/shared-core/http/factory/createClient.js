/**
 * @telecom-http-client/factory/createClient
 * Factory function for creating HTTP client instances
 *
 * @module @telecom-http-client/factory/createClient
 */

import HttpClient from '../core/HttpClient.js'
import AuthMiddleware from '../middlewares/AuthMiddleware.js'
import LoggerMiddleware from '../middlewares/LoggerMiddleware.js'
import ParserMiddleware from '../middlewares/ParserMiddleware.js'

/**
 * Create a new HTTP client with common configuration
 * @param {Object} [options={}] - Client options
 * @param {string} [options.baseURL=''] - Base URL for all requests
 * @param {Object} [options.defaultHeaders={}] - Default headers
 * @param {number} [options.timeout=0] - Default timeout
 * @param {boolean} [options.withCredentials=false] - Enable credentials
 * @param {boolean} [options.enableAuth=false] - Enable auth middleware
 * @param {Object} [options.auth={}] - Auth middleware options
 * @param {boolean} [options.enableLogging=false] - Enable logging middleware
 * @param {Object} [options.logging={}] - Logging middleware options
 * @param {boolean} [options.enableParser=true] - Enable parser middleware
 * @param {Object} [options.parser={}] - Parser middleware options
 * @returns {HttpClient} Configured HTTP client
 */
function createClient(options = {}) {
  const {
    baseURL = '',
    defaultHeaders = {},
    timeout = 0,
    withCredentials = false,
    enableAuth = false,
    auth = {},
    enableLogging = false,
    logging = {},
    enableParser = true,
    parser = {}
  } = options

  // Create client
  const client = new HttpClient({
    baseURL,
    defaultHeaders: {
      'Content-Type': 'application/json',
      ...defaultHeaders
    },
    defaultTimeout: timeout,
    withCredentials
  })

  // Middleware order matters. Middlewares run in the order they are added:
  // the FIRST-added middleware is the OUTERMOST (it wraps the rest).
  //
  // We add AuthMiddleware BEFORE ParserMiddleware so auth is OUTER to parser.
  // That way, when auth inspects the response, the body has already been
  // parsed by the (inner) parser and auth can read the server error `code`
  // to decide whether to refresh + retry.

  // Add auth middleware if enabled (outermost)
  if (enableAuth) {
    const authMiddleware = new AuthMiddleware(auth)
    client.addMiddleware(authMiddleware.handle.bind(authMiddleware))
  }

  // Add parser middleware (enabled by default, inner to auth)
  if (enableParser) {
    const parserMiddleware = new ParserMiddleware(parser)
    client.addMiddleware(parserMiddleware.handle.bind(parserMiddleware))
  }

  // Add logging middleware if enabled
  if (enableLogging) {
    const loggerMiddleware = new LoggerMiddleware(logging)
    client.addMiddleware(loggerMiddleware.handle.bind(loggerMiddleware))
  }

  return client
}

export default createClient