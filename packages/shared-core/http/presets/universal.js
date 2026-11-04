/**
 * @telecom-http-client/presets/universal
 * Universal preset for HTTP client
 * Works in both browser and Node.js environments
 *
 * @module @telecom-http-client/presets/universal
 */

import createClient from '../factory/createClient.js'

/**
 * Detect if running in browser environment
 * @returns {boolean}
 */
function isBrowser() {
  return typeof window !== 'undefined' && typeof window.document !== 'undefined'
}

/**
 * Create a universal HTTP client
 * @param {Object} [options={}] - Client options
 * @returns {HttpClient} Universal-configured HTTP client
 */
function createUniversalClient(options = {}) {
  const config = {
    enableParser: true,
    ...options
  }

  // Auto-detect environment
  if (isBrowser()) {
    config.withCredentials = config.withCredentials !== false
  } else {
    config.withCredentials = false
  }

  return createClient(config)
}

export default createUniversalClient