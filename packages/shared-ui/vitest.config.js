import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'

/**
 * Vitest configuration for @telecom/shared-ui (design-system components).
 *
 * - `vue()` compiles the `.vue` SFCs through exactly the same plugin that the
 *   app builds use, so a green test means the component compiles in production.
 * - `happy-dom` provides the browser surface (window, document, DOM events)
 *   without a headless-chromium dependency.
 * - No aliases are needed: tests import package-relative paths or the
 *   workspace package names that `pnpm` links into `node_modules`.
 */
export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'happy-dom',
    include: ['components/**/*.test.js', 'composables/**/*.test.js', 'utils/**/*.test.js'],
    exclude: ['**/node_modules/**', 'assets/**'],
  },
})