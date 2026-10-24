import { defineConfig } from 'vitest/config'
import appConfig from './vite.config.js'

/**
 * Vitest for the company app.
 *
 * Reuses the app's OWN vite.config.js (the @telecom/vite-config factory), so
 * tests compile `.vue` files and resolve `@/` aliases with exactly the plugin
 * and alias setup the production build uses. Only the `test` section is added.
 *
 * Scope: router guards, permission helpers, and a boot smoke test — see
 * TESTING.md for what smoke tests do and do NOT verify.
 */
export default defineConfig({
  ...appConfig,
  test: {
    environment: 'happy-dom',
    include: ['src/**/*.test.js'],
    exclude: ['**/node_modules/**'],
  },
})