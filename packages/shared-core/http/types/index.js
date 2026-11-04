/**
 * @telecom-http-client/types
 * Type definitions for the HTTP client library
 *
 * @module @telecom-http-client/types
 */

// ============================================================================
// HTTP Methods
// ============================================================================

/**
 * HTTP method constants
 * @enum {string}
 */
export const HTTP_METHODS = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  PATCH: 'PATCH',
  DELETE: 'DELETE',
  HEAD: 'HEAD',
  OPTIONS: 'OPTIONS',
  CONNECT: 'CONNECT',
  TRACE: 'TRACE'
}

/**
 * @typedef {Object} HttpRequestConfig
 * @property {string} [method='GET'] - HTTP method
 * @property {string} url - Request URL
 * @property {Object} [headers={}] - Request headers
 * @property {Object|string|FormData|URLSearchParams} [data=null] - Request body
 * @property {Object} [params={}] - URL query parameters
 * @property {number} [timeout=0] - Request timeout in milliseconds
 * @property {string} [responseType='json'] - Expected response type
 * @property {AbortSignal} [signal=null] - AbortSignal for request cancellation
 * @property {boolean} [withCredentials=false] - Include credentials in CORS requests
 * @property {string} [baseURL=''] - Base URL for relative requests
 * @property {Object} [auth=null] - Authentication credentials
 * @property {Function} [onUploadProgress=null] - Upload progress callback
 * @property {Function} [onDownloadProgress=null] - Download progress callback
 * @property {Object} [meta={}] - Custom metadata
 */

/**
 * @typedef {Object} HttpClientConfig
 * @property {string} [baseURL=''] - Base URL for all requests
 * @property {Object} [defaultHeaders={}] - Default headers for all requests
 * @property {number} [defaultTimeout=0] - Default timeout for all requests
 * @property {string} [defaultResponseType='json'] - Default response type
 * @property {boolean} [withCredentials=false] - Default credentials setting
 * @property {Array<Function>} [middlewares=[]] - Array of middleware functions
 * @property {Array<Function>} [requestInterceptors=[]] - Array of request interceptors
 * @property {Array<Function>} [responseInterceptors=[]] - Array of response interceptors
 * @property {Object} [cache={}] - Cache configuration
 * @property {Object} [retry={}] - Retry configuration
 * @property {Object} [auth={}] - Authentication configuration
 * @property {boolean} [deduplication=true] - Enable request deduplication
 * @property {Object} [plugins={}] - Plugins configuration
 * @property {Object} [events={}] - Event emitter configuration
 */

/**
 * @typedef {Object} HttpResponse
 * @property {any} data - Response data (parsed based on responseType)
 * @property {number} status - HTTP status code
 * @property {string} statusText - HTTP status text
 * @property {Object} headers - Response headers
 * @property {HttpRequestConfig} config - Original request configuration
 * @property {number} [duration=0] - Request duration in milliseconds
 * @property {Date} [timestamp=null] - Response timestamp
 */

// ============================================================================
// Middleware Types
// ============================================================================

/**
 * Middleware function type
 * @callback HttpMiddleware
 * @param {HttpRequestConfig} config - Request configuration
 * @param {Function} next - Next middleware function
 * @returns {Promise<any>} - Processed response
 */

/**
 * @typedef {Object} MiddlewareContext
 * @property {HttpRequestConfig} config - Request configuration
 * @property {HttpResponse} [response=null] - Response object
 * @property {Error} [error=null] - Error object
 * @property {number} [retryCount=0] - Current retry count
 * @property {Object} [meta={}] - Custom metadata
 */

// ============================================================================
// Interceptor Types
// ============================================================================

/**
 * Request interceptor function
 * @callback RequestInterceptor
 * @param {HttpRequestConfig} config - Request configuration
 * @returns {HttpRequestConfig|Promise<HttpRequestConfig>} - Modified or new config
 */

/**
 * Response interceptor function
 * @callback ResponseInterceptor
 * @param {HttpResponse} response - Response object
 * @returns {HttpResponse|Promise<HttpResponse>} - Modified or new response
 */

/**
 * Error interceptor function
 * @callback ErrorInterceptor
 * @param {Error} error - Error object
 * @returns {Error|Promise<Error>} - Modified or new error
 */

// ============================================================================
// Cache Types
// ============================================================================

/**
 * Cache configuration
 * @typedef {Object} CacheConfig
 * @property {number} [ttl=300000] - Time to live in milliseconds (default: 5 minutes)
 * @property {number} [maxSize=100] - Maximum number of cached items
 * @property {string} [keyPrefix='http-cache:'] - Prefix for cache keys
 * @property {boolean} [enabled=true] - Enable/disable caching
 * @property {Function} [shouldCache] - Function to determine if request should be cached
 * @property {Function} [getCacheKey] - Function to generate cache key
 */

/**
 * Cache entry structure
 * @typedef {Object} CacheEntry
 * @property {any} data - Cached data
 * @property {number} timestamp - Cache timestamp
 * @property {number} ttl - Time to live
 * @property {HttpRequestConfig} config - Original request configuration
 */

// ============================================================================
// Retry Types
// ============================================================================

/**
 * Retry configuration
 * @typedef {Object} RetryConfig
 * @property {number} [maxRetries=3] - Maximum number of retry attempts
 * @property {number} [initialDelay=1000] - Initial delay in milliseconds
 * @property {number} [maxDelay=30000] - Maximum delay in milliseconds
 * @property {number} [multiplier=2] - Delay multiplier for exponential backoff
 * @property {number} [jitter=0.1] - Jitter factor (0-1)
 * @property {Array<number>} [retryableStatuses] - HTTP status codes to retry
 * @property {Array<string>} [retryableErrors] - Network errors to retry
 * @property {Function} [shouldRetry] - Custom retry condition
 * @property {Function} [onRetry] - Callback when retry occurs
 */

/**
 * Backoff strategy types
 * @enum {string}
 */
export const BACKOFF_STRATEGIES = {
  EXPONENTIAL: 'exponential',
  LINEAR: 'linear',
  FIXED: 'fixed',
  CUSTOM: 'custom'
}

// ============================================================================
// Auth Types
// ============================================================================

/**
 * Authentication configuration
 * @typedef {Object} AuthConfig
 * @property {string} [token=null] - Current authentication token
 * @property {string} [tokenType='Bearer'] - Token type (Bearer, Basic, etc.)
 * @property {string} [tokenHeader='Authorization'] - Header name for token
 * @property {Function} [getToken] - Function to get current token
 * @property {Function} [setToken] - Function to set new token
 * @property {Function} [refreshToken] - Function to refresh token
 * @property {boolean} [autoRefresh=true] - Enable automatic token refresh
 * @property {number} [refreshThreshold=60000] - Refresh threshold in milliseconds
 */

/**
 * Token refresh queue item
 * @typedef {Object} RefreshQueueItem
 * @property {Function} resolve - Resolve function for the promise
 * @property {Function} reject - Reject function for the promise
 * @property {HttpRequestConfig} config - Original request configuration
 * @property {number} timestamp - Queue timestamp
 */

// ============================================================================
// Error Types
// ============================================================================

/**
 * Error types
 * @enum {string}
 */
export const ERROR_TYPES = {
  NETWORK: 'NETWORK_ERROR',
  TIMEOUT: 'TIMEOUT_ERROR',
  PARSE: 'PARSE_ERROR',
  AUTH: 'AUTH_ERROR',
  VALIDATION: 'VALIDATION_ERROR',
  RATE_LIMIT: 'RATE_LIMIT_ERROR',
  SERVER: 'SERVER_ERROR',
  CLIENT: 'CLIENT_ERROR',
  UNKNOWN: 'UNKNOWN_ERROR'
}

/**
 * HTTP status code groups
 * @enum {Object}
 */
export const HTTP_STATUS = {
  CONTINUE: 100,
  SWITCHING_PROTOCOLS: 101,
  PROCESSING: 102,
  EARLY_HINTS: 103,
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NON_AUTHORITATIVE_INFORMATION: 203,
  NO_CONTENT: 204,
  RESET_CONTENT: 205,
  PARTIAL_CONTENT: 206,
  MULTI_STATUS: 207,
  ALREADY_REPORTED: 208,
  IM_USED: 226,
  MULTIPLE_CHOICES: 300,
  MOVED_PERMANENTLY: 301,
  FOUND: 302,
  SEE_OTHER: 303,
  NOT_MODIFIED: 304,
  USE_PROXY: 305,
  TEMPORARY_REDIRECT: 307,
  PERMANENT_REDIRECT: 308,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  PAYMENT_REQUIRED: 402,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  NOT_ACCEPTABLE: 406,
  PROXY_AUTHENTICATION_REQUIRED: 407,
  REQUEST_TIMEOUT: 408,
  CONFLICT: 409,
  GONE: 410,
  LENGTH_REQUIRED: 411,
  PRECONDITION_FAILED: 412,
  PAYLOAD_TOO_LARGE: 413,
  URI_TOO_LONG: 414,
  UNSUPPORTED_MEDIA_TYPE: 415,
  RANGE_NOT_SATISFIABLE: 416,
  EXPECTATION_FAILED: 417,
  IM_A_TEAPOT: 418,
  MISDIRECTED_REQUEST: 421,
  UNPROCESSABLE_ENTITY: 422,
  LOCKED: 423,
  FAILED_DEPENDENCY: 424,
  TOO_EARLY: 425,
  UPGRADE_REQUIRED: 426,
  PRECONDITION_REQUIRED: 428,
  TOO_MANY_REQUESTS: 429,
  REQUEST_HEADER_FIELDS_TOO_LARGE: 431,
  UNAVAILABLE_FOR_LEGAL_REASONS: 451,
  INTERNAL_SERVER_ERROR: 500,
  NOT_IMPLEMENTED: 501,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504,
  HTTP_VERSION_NOT_SUPPORTED: 505,
  VARIANT_ALSO_NEGOTIATES: 506,
  INSUFFICIENT_STORAGE: 507,
  LOOP_DETECTED: 508,
  NOT_EXTENDED: 510,
  NETWORK_AUTHENTICATION_REQUIRED: 511
}

// ============================================================================
// Event Types
// ============================================================================

/**
 * Event types
 * @enum {string}
 */
export const EVENT_TYPES = {
  REQUEST_START: 'request:start',
  REQUEST_END: 'request:end',
  REQUEST_ERROR: 'request:error',
  RETRY: 'retry',
  CACHE_HIT: 'cache:hit',
  CACHE_MISS: 'cache:miss',
  TOKEN_REFRESH: 'auth:token_refresh',
  TOKEN_REFRESH_START: 'auth:token_refresh_start',
  TOKEN_REFRESH_END: 'auth:token_refresh_end'
}

/**
 * Event payload structure
 * @typedef {Object} EventPayload
 * @property {string} type - Event type
 * @property {Date} timestamp - Event timestamp
 * @property {any} [data=null] - Event data
 * @property {Error} [error=null] - Error if applicable
 * @property {Object} [meta={}] - Additional metadata
 */

// ============================================================================
// Plugin Types
// ============================================================================

/**
 * Plugin interface
 * @typedef {Object} HttpPlugin
 * @property {string} name - Plugin name
 * @property {Function} [setup] - Setup function called during client initialization
 * @property {Function} [teardown] - Teardown function called during client destruction
 * @property {Object} [config={}] - Plugin configuration
 */

// ============================================================================
// Deduplication Types
// ============================================================================

/**
 * Request deduplication configuration
 * @typedef {Object} DeduplicationConfig
 * @property {boolean} [enabled=true] - Enable/disable deduplication
 * @property {Function} [getKey] - Function to generate deduplication key
 * @property {number} [ttl=5000] - Time to live for deduplication keys
 */

// ============================================================================
// Upload/Download Types
// ============================================================================

/**
 * Progress event
 * @typedef {Object} ProgressEvent
 * @property {string} type - Event type ('upload' or 'download')
 * @property {number} loaded - Bytes loaded
 * @property {number} total - Total bytes
 * @property {number} percent - Percentage complete
 * @property {Date} timestamp - Event timestamp
 */

/**
 * Upload configuration
 * @typedef {Object} UploadConfig
 * @property {Function} [onProgress] - Progress callback
 * @property {number} [chunkSize=8192] - Chunk size in bytes
 * @property {boolean} [parallel=false] - Enable parallel upload
 * @property {number} [maxParallel=3] - Maximum parallel uploads
 */

/**
 * Download configuration
 * @typedef {Object} DownloadConfig
 * @property {Function} [onProgress] - Progress callback
 * @property {string} [destination] - Download destination path
 * @property {boolean} [stream=false] - Enable streaming download
 */

// ============================================================================
// Export all types
// ============================================================================

export default {
  HTTP_METHODS,
  BACKOFF_STRATEGIES,
  ERROR_TYPES,
  HTTP_STATUS,
  EVENT_TYPES
}