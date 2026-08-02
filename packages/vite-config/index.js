import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

/**
 * Create a Vite configuration for a telecom marketplace app.
 *
 * @param {object} options
 * @param {string} options.appDir - Absolute path to the app directory (contains src/)
 * @param {number} options.port - Development server port
 * @param {string} [options.apiTarget='http://localhost:3000'] - Backend API target for proxy
 * @param {object} [options.extra] - Additional Vite config to merge
 * @returns {object} Vite configuration
 */
export function createAppConfig({ appDir, port, apiTarget = 'http://localhost:3000', extra = {} }) {
  const packagesDir = resolve(appDir, '../../packages')

  return defineConfig({
    plugins: [vue()],

    // The dev containers export `VITE_API_BASE_URL=http://backend:3000/api/v1`
    // (an INTERNAL Docker hostname the browser can't resolve). We can't touch
    // the Docker files, so we hard-override the value the client bundle sees to
    // a RELATIVE path. The browser then calls "/api/v1/..." on the Vite dev
    // origin, and the proxy below forwards it to the backend container. This
    // guarantees no hardcoded backend URL ever reaches the browser.
    define: {
      'import.meta.env.VITE_API_BASE_URL': JSON.stringify('/api/v1'),
    },


    resolve: {
      alias: {
        '@': resolve(appDir, 'src'),
        '@telecom/shared-core': resolve(packagesDir, 'shared-core'),
        '@telecom/shared-ui': resolve(packagesDir, 'shared-ui'),
        '@telecom/auth': resolve(packagesDir, 'auth'),
        '@telecom/api-client': resolve(packagesDir, 'api-client'),
        '@telecom/permissions': resolve(packagesDir, 'permissions'),
      },
      dedupe: ['vue', 'primevue', '@primevue/themes'],
    },

    server: {
      host: '0.0.0.0',
      port,
      watch: { usePolling: true, interval: 1000 },
      proxy: {
        '/api': { target: apiTarget, changeOrigin: true },
      },
    },

    ...extra,
  })
}

export default createAppConfig
