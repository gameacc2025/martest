import { defineConfig } from 'vitest/config'

/**
 * Vitest configuration for @telecom/auth.
 *
 * - `happy-dom`: the store reads/writes localStorage (persisted auth context,
 *   legacy-token cleanup) so a window is required.
 * - `sessionHandoff.test.js` is EXCLUDED: it is an existing `node:test` suite
 *   that must keep running on Node's built-in runner untouched. The package's
 *   `test` script runs both runners, and root `pnpm test` does too.
 */
export default defineConfig({
  test: {
    environment: 'happy-dom',
    include: ['*.test.js'],
    exclude: ['sessionHandoff.test.js', '**/node_modules/**'],
  },
})