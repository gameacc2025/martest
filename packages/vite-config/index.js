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

    build: {
      // Vite 8 uses Rolldown's codeSplitting API. Keep large framework/UI
      // dependencies out of each app's entry chunk and cap vendor group sizes.
      // Browser smoke tests in Runtime Validation guard against ordering regressions.
      rolldownOptions: {
        output: {
          codeSplitting: {
            groups: [
              {
                name: 'primevue',
                test: /node_modules[\\/]primevue[\\/]/,
                priority: 30,
                maxSize: 300 * 1024,
              },
              {
                name: 'framework',
                test: /node_modules[\\/](vue|vue-router|pinia)[\\/]/,
                priority: 25,
                maxSize: 300 * 1024,
              },
              {
                name: 'primevue-theme-icons',
                test: /node_modules[\\/](@primevue|primeicons)[\\/]/,
                priority: 20,
                maxSize: 300 * 1024,
              },
              {
                name: 'vendor',
                test: /node_modules[\\/]/,
                priority: 10,
                maxSize: 300 * 1024,
              },
            ],
          },
        },
      },
    },

    server: {
      host: '0.0.0.0',
      port,
      watch: { usePolling: true, interval: 1000 },
      proxy: {
        '/api': { target: apiTarget, changeOrigin: true },
        // Uploaded product/category media is served by Fastify at /uploads.
        // Proxy it in development just like API calls so images work across app ports.
        '/uploads': { target: apiTarget, changeOrigin: true },
      },
    },

    ...extra,
  })
}

export default createAppConfig
