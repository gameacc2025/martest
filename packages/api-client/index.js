/**
 * @telecom/api-client
 *
 * Barrel exports for API endpoints, HTTP client, and error handling.
 */
export { endpoints } from './endpoints.js'
export {
  api,
  apiClient,
  API_BASE_URL,
  authApi,
  productsApi,
  companiesApi,
  categoriesApi,
  specificationLibraryApi,
  ordersApi,
  statsApi,
  adminApi,
  inquiriesApi
} from './apiClient.js'
export {
  handleApiError,
  setDefaultToast,
  showSessionToast
} from './errorHandler.js'
