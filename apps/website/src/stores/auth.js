import { createAuthStore } from '@telecom/auth'

// The router is NOT imported here. Importing '../router' created a circular
// dependency (router → layouts/pages → stores/auth → router) that produced
// "Cannot access 'router' before initialization". The router is injected
// separately via setAuthRouter() inside router/index.js.
export const useAuthStore = createAuthStore()

// Also re-export useAuthStore from @telecom/auth for direct imports
export { useAuthStore as useAuthStoreDefault } from '@telecom/auth'
