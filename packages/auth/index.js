/**
 * @telecom/auth
 *
 * Barrel exports for authentication store, bridge, and permission composables.
 */
export { createAuthStore } from './store.js'

// Cross-app session handoff — used by the website's Login/Register pages
// to send an authenticated STAFF/COMPANY user to the admin/company app
// already signed in, and by those apps on boot to consume it.
export { buildSessionHandoffUrl, bootstrapSessionFromUrl, isExternalUrl } from './store.js'

// Router injection helpers — re-exported so apps can wire their router into
// the auth layer without reaching into @telecom/shared-core directly.
export { setAuthRouter, getAuthRouter } from '@telecom/shared-core/http/authBridge'