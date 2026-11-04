import { defineConfig } from 'vitest/config'

/**
 * Vitest configuration for @telecom/shared-core (HTTP client, auth bridge,
 * token store, API wrappers).
 *
 * - `happy-dom` environment: `HttpRequest.buildURL()` resolves a relative
 *   baseURL (`/api/v1`) against `window.location.origin`, so a DOM window must
 *   exist even though no component is mounted here.
 * - Network boundary: tests stub the global `fetch`; nothing ever leaves the
 *   process.
 * - `sessionHandoff.test.js` lives in another package and runs on `node:test`.
 */
export default defineConfig({
  test: {
    environment: 'happy-dom',
    include: ['http/**/*.test.js', '*.test.js'],
    exclude: ['**/node_modules/**'],
  },
})