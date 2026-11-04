/**
 * @telecom-http-client/presets/node
 * Node.js preset for HTTP client
 * Configured for Node.js environments
 *
 * @module @telecom-http-client/presets/node
 */

import createClient from '../factory/createClient.js'

/**
 * Create a Node.js-optimized HTTP client
 * @param {Object} [options={}] - Client options
 * @returns {HttpClient} Node.js-configured HTTP client
 */
function createNodeClient(options = {}) {
  return createClient({
    withCredentials: false,
    enableParser: true,
    ...options
  })
}

export default createNodeClient