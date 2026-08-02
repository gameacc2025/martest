/**
 * @telecom-http-client/presets/browser
 * Browser preset for HTTP client
 * Configured for browser environments
 *
 * @module @telecom-http-client/presets/browser
 */

import createClient from '../factory/createClient.js'

/**
 * Create a browser-optimized HTTP client
 * @param {Object} [options={}] - Client options
 * @returns {HttpClient} Browser-configured HTTP client
 */
function createBrowserClient(options = {}) {
  return createClient({
    withCredentials: true,
    enableParser: true,
    ...options
  })
}

export default createBrowserClient