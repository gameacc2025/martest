/**
 * @telecom-http-client
 * A production-ready HTTP client library based on Fetch API
 * Modular, SOLID-compliant, with comprehensive features
 *
 * @module @telecom-http-client
 * @author Telecom Marketplace Team
 * @license MIT
 */

// Core
export { default as HttpClient } from './core/HttpClient.js'
export { default as HttpRequest } from './core/HttpRequest.js'
export { default as HttpResponse } from './core/HttpResponse.js'
export { default as HttpConfig } from './core/HttpConfig.js'

// Errors
export { default as HttpError } from './errors/HttpError.js'
export { default as NetworkError } from './errors/NetworkError.js'
export { default as TimeoutError } from './errors/TimeoutError.js'
export { default as AuthError } from './errors/AuthError.js'
export { default as ErrorFactory } from './errors/ErrorFactory.js'

// Middlewares
export { default as AuthMiddleware } from './middlewares/AuthMiddleware.js'
export { default as ParserMiddleware } from './middlewares/ParserMiddleware.js'
export { default as LoggerMiddleware } from './middlewares/LoggerMiddleware.js'

// Interceptors
export { default as RequestInterceptor } from './interceptors/RequestInterceptor.js'
export { default as ResponseInterceptor } from './interceptors/ResponseInterceptor.js'

// Utilities
export { default as ContentParser } from './utils/ContentParser.js'
export { default as EventEmitter } from './utils/EventEmitter.js'

// Types
export * from './types/index.js'

// Factory
export { default as createClient } from './factory/createClient.js'

// Presets
export { default as createBrowserClient } from './presets/browser.js'
export { default as createNodeClient } from './presets/node.js'
export { default as createUniversalClient } from './presets/universal.js'
