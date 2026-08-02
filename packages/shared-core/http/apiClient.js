/**
 * API Client Helpers
 *
 * Unwraps the standard response envelope { data, meta } automatically.
 * All API methods return the unwrapped data, not the raw HTTP response.
 *
 * Usage:
 *   import { apiGet, apiGetPaginated } from '@/http/apiClient'
 *
 *   // Single object: returns the data directly
 *   const user = await apiGet('/auth/me')
 *
 *   // Paginated list: returns { data, meta }
 *   const { data, meta } = await apiGetPaginated('/users?page=1&limit=20')
 *
 *   // Mutation: returns the data directly
 *   const newRole = await apiPost('/roles', { name: 'ADMIN', label: 'Admin' })
 */

import createBrowserClient from './presets/browser.js'

const _apiBaseURL = import.meta.env.VITE_API_BASE_URL || import.meta.env.NEXT_PUBLIC_API_URL || '/api/v1'
const api = createBrowserClient({
  baseURL: _apiBaseURL,
  defaultTimeout: 30000,
  defaultHeaders: { 'Content-Type': 'application/json' },
  enableParser: true,
  enableAuth: true,
  auth: { getToken: () => localStorage.getItem('token'), tokenHeader: 'Authorization', tokenType: 'Bearer' },
})

/**
 * Unwrap the response envelope and return the data field.
 * Handles both old format (raw) and new format ({ data: ... }).
 * @param {Object} response - HTTP response object (HttpResponse)
 * @returns {*} The unwrapped data
 */
function unwrapResponse(response) {
  const body = response.data

  // New envelope format: { data: ... }
  if (body && typeof body === 'object' && 'data' in body) {
    return body.data
  }

  // Legacy format: body is the data directly
  return body
}

/**
 * Unwrap the response envelope for paginated responses.
 * Returns { data, meta } directly.
 * @param {Object} response - HTTP response object (HttpResponse)
 * @returns {{ data: *, meta: Object }} The unwrapped data and meta
 */
function unwrapPaginatedResponse(response) {
  const body = response.data

  // New envelope format: { data: [...], meta: { ... } }
  if (body && typeof body === 'object' && 'data' in body && 'meta' in body) {
    return { data: body.data, meta: body.meta }
  }

  // Legacy format: body is the data directly
  return { data: body, meta: null }
}

// ── GET ──────────────────────────────────────────────────────

/**
 * GET request that returns unwrapped data.
 * @param {string} url - API endpoint
 * @param {Object} [config] - Additional config (params, headers, etc.)
 * @returns {Promise<*>} The unwrapped data
 */
export async function apiGet(url, config = {}) {
  const response = await api.get(url, config)
  return unwrapResponse(response)
}

/**
 * GET request that returns unwrapped paginated data.
 * @param {string} url - API endpoint
 * @param {Object} [config] - Additional config (params, headers, etc.)
 * @returns {Promise<{ data: *, meta: Object }>} The unwrapped data and meta
 */
export async function apiGetPaginated(url, config = {}) {
  const response = await api.get(url, config)
  return unwrapPaginatedResponse(response)
}

// ── POST ─────────────────────────────────────────────────────

/**
 * POST request that returns unwrapped data.
 * @param {string} url - API endpoint
 * @param {*} [data] - Request body
 * @param {Object} [config] - Additional config (params, headers, etc.)
 * @returns {Promise<*>} The unwrapped data
 */
export async function apiPost(url, data, config = {}) {
  const response = await api.post(url, data, config)
  return unwrapResponse(response)
}

// ── PUT ──────────────────────────────────────────────────────

/**
 * PUT request that returns unwrapped data.
 * @param {string} url - API endpoint
 * @param {*} [data] - Request body
 * @param {Object} [config] - Additional config (params, headers, etc.)
 * @returns {Promise<*>} The unwrapped data
 */
export async function apiPut(url, data, config = {}) {
  const response = await api.put(url, data, config)
  return unwrapResponse(response)
}

// ── PATCH ────────────────────────────────────────────────────

/**
 * PATCH request that returns unwrapped data.
 * @param {string} url - API endpoint
 * @param {*} [data] - Request body
 * @param {Object} [config] - Additional config (params, headers, etc.)
 * @returns {Promise<*>} The unwrapped data
 */
export async function apiPatch(url, data, config = {}) {
  const response = await api.patch(url, data, config)
  return unwrapResponse(response)
}

// ── DELETE ───────────────────────────────────────────────────

/**
 * DELETE request that returns unwrapped data.
 * @param {string} url - API endpoint
 * @param {Object} [config] - Additional config (params, headers, etc.)
 * @returns {Promise<*>} The unwrapped data
 */
export async function apiDelete(url, config = {}) {
  const response = await api.delete(url, config)
  return unwrapResponse(response)
}

// ── Error helpers ────────────────────────────────────────────
//
// Error flow:
//   HttpClient._createErrorFromResponse sets:
//     error.status, error.code, error.serverMessage, error.details,
//     error.data (full body), error.response (HttpResponse)
//
//   These helpers read from the error instance first (direct props),
//   then fallback to error.response.data.error.* for cases where
//   the error wasn't created by _createErrorFromResponse.

/**
 * Get the HTTP status code from an error.
 * @param {Error} error - The caught error
 * @returns {number|null} The HTTP status code
 */
export function getErrorStatus(error) {
  return error?.status ?? error?.response?.status ?? null
}

/**
 * Get the error code from an error.
 * Priority: error.code → error.data.error.code → error.response.data.error.code
 * @param {Error} error - The caught error
 * @returns {string} The error code
 */
export function getErrorCode(error) {
  // Direct prop (set by HttpClient._createErrorFromResponse)
  if (error?.code) return error.code
  // Full body envelope
  if (error?.data?.error?.code) return error.data.error.code
  // HttpResponse wrapper
  if (error?.response?.data?.error?.code) return error.response.data.error.code
  // Legacy flat format
  if (error?.data?.code) return error.data.code
  if (error?.response?.data?.code) return error.response.data.code
  return 'UNKNOWN_ERROR'
}

/**
 * Get the error message from an error.
 * Priority: error.serverMessage → error.message → error.data.error.message → ...
 * @param {Error} error - The caught error
 * @returns {string} The error message
 */
export function getErrorMessage(error) {
  // Direct prop (server-provided message, set by HttpClient)
  if (error?.serverMessage) return error.serverMessage
  // Error instance message
  if (error?.message) return error.message
  // Full body envelope
  if (error?.data?.error?.message) return error.data.error.message
  // HttpResponse wrapper
  if (error?.response?.data?.error?.message) return error.response.data.error.message
  // Legacy flat format
  if (error?.data?.message) return error.data.message
  if (error?.response?.data?.message) return error.response.data.message
  return 'An unexpected error occurred'
}

/**
 * Get error details from an error.
 * Priority: error.details → error.data.error.details → error.response.data.error.details
 * @param {Error} error - The caught error
 * @returns {Array|Object|null} The error details
 */
export function getErrorDetails(error) {
  // Direct prop (set by HttpClient._createErrorFromResponse)
  if (error?.details) return error.details
  // Full body envelope
  if (error?.data?.error?.details) return error.data.error.details
  // HttpResponse wrapper
  if (error?.response?.data?.error?.details) return error.response.data.error.details
  // Legacy flat format
  if (error?.data?.details) return error.data.details
  if (error?.response?.data?.details) return error.response.data.details
  return null
}

export default {
  apiGet,
  apiGetPaginated,
  apiPost,
  apiPut,
  apiPatch,
  apiDelete,
  getErrorStatus,
  getErrorCode,
  getErrorMessage,
  getErrorDetails,
}
