/**
 * @telecom/auth
 *
 * Barrel exports for authentication store, bridge, and permission composables.
 */
export { createAuthStore } from './store.js'

// Router injection helpers — re-exported so apps can wire their router into
// the auth layer without reaching into @telecom/shared-core directly.
export { setAuthRouter, getAuthRouter } from '@telecom/shared-core/http/authBridge'
