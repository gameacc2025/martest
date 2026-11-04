import { createAppConfig } from '@telecom/vite-config'
import { fileURLToPath } from 'url'

export default createAppConfig({
  appDir: fileURLToPath(new URL('.', import.meta.url)),
  port: 3003,
  // Inside Docker the browser hits the Vite dev server (localhost:3003) with a
  // relative "/api/v1" URL; Vite proxies it to the backend container over the
  // Docker network. The browser never sees the internal "backend" hostname.
  apiTarget: 'http://backend:3000',
})
