import { defineConfig } from 'vitest/config'

/**
 * Vitest configuration for @telecom/api-client (endpoint map, error handling,
 * API wrappers).
 *
 * Pure-JS package: the default `node` environment is enough. Network calls in
 * tests are stubbed at the `fetch` boundary (see http tests in
 * @telecom/shared-core for the transport layer itself).
 */
export default defineConfig({
  test: {
    environment: 'node',
    include: ['*.test.js'],
    exclude: ['**/node_modules/**'],
  },
})