/**
 * @telecom/api-client — API Client
 *
 * Centralized API client setup using the shared HTTP abstraction.
 * All apps import this to get a pre-configured client.
 */

import createBrowserClient from '@telecom/shared-core/http/presets/browser.js'
import { getAccessToken } from '@telecom/shared-core/http/tokenMemory.js'
import { endpoints } from './endpoints.js'

// API base URL - will be configured from environment variables
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || import.meta.env.NEXT_PUBLIC_API_URL || '/api/v1'

// Create API client instance with browser preset.
//
// Auth handling:
//   - The AuthMiddleware only READS the token here and injects the header.
//     The token comes from shared tokenMemory (in-memory only — Web Storage
//     never holds secrets), the single source of truth for both this client
//     and the one in @telecom/shared-core/http/apiClient.
//   - Token refresh + logout are owned entirely by the auth store and are
//     invoked by the middleware through the authBridge. This module no longer
//     performs refresh or touches window.location — that keeps the auth store
//     as the single source of truth (and avoids the previous deadlock where
//     refresh tried to refresh itself).
export const apiClient = createBrowserClient({
  baseURL: API_BASE_URL,
  defaultTimeout: 30000,
  defaultHeaders: {
    'Content-Type': 'application/json'
  },
  enableParser: true,
  enableAuth: true,
  auth: {
    getToken: () => getAccessToken(),
    tokenHeader: 'Authorization',
    tokenType: 'Bearer'
  }
})

// API Methods
export const api = {
  get: (url, config = {}) => apiClient.get(url, config),
  post: (url, data, config = {}) => apiClient.post(url, data, config),
  put: (url, data, config = {}) => apiClient.put(url, data, config),
  patch: (url, data, config = {}) => apiClient.patch(url, data, config),
  delete: (url, config = {}) => apiClient.delete(url, config)
}

// Auth API
export const authApi = {
  login: (credentials) => api.post(endpoints.auth.login, credentials),
  register: (data) => api.post(endpoints.auth.register, data),
  logout: () => api.post(endpoints.auth.logout),
  refresh: () => api.post(endpoints.auth.refresh),
  getMe: () => api.get(endpoints.auth.me),
  updateMe: (data) => api.patch(endpoints.settings.profile, data),
  changePassword: (data) => api.patch(endpoints.settings.changePassword, data),
  uploadAvatar: (file) => {
    const formData = new FormData();
    formData.append('avatar', file);
    return api.post(`${endpoints.settings.profile}/avatar`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  deleteAvatar: () => api.delete(`${endpoints.settings.profile}/avatar`),
  forgotPassword: (email) => api.post(endpoints.auth.forgotPassword, { email }),
  resetPassword: (data) => api.post(endpoints.auth.resetPassword, data),
  verifyEmail: (token) => api.post(endpoints.auth.verifyEmail, { token })
}

// Products API
export const productsApi = {
  list: (params = {}) => api.get(endpoints.products.list, { params }),
  myProducts: (params = {}) => api.get(endpoints.products.myProducts, { params }),
  getById: (id) => api.get(endpoints.products.get(id)),
  getForEdit: (id) => api.get(endpoints.products.manage(id)),
  create: (data) => api.post(endpoints.products.create, data),
  update: (id, data) => api.patch(endpoints.products.update(id), data),
  delete: (id) => api.delete(endpoints.products.delete(id)),
  upsertPrice: (id, data) => api.put(endpoints.products.price(id), data),
  submitReview: (id, comment) => api.post(endpoints.products.submitReview(id), { comment }),
  approve: (id, comment) => api.post(endpoints.products.approve(id), { comment }),
  reject: (id, comment) => api.post(endpoints.products.reject(id), { comment }),
  publish: (id, comment) => api.post(endpoints.products.publish(id), { comment }),
  hide: (id, comment) => api.post(endpoints.products.hide(id), { comment }),
  archive: (id, comment) => api.post(endpoints.products.archive(id), { comment }),
  restoreDraft: (id, comment) => api.post(endpoints.products.restoreDraft(id), { comment }),
  getFeatured: (limit = 5) => api.get(endpoints.products.list, { params: { featured: true, limit } }),
  getByCompany: (companyId) => api.get(endpoints.products.list, { params: { companyId } }),
  uploadImage: (id, formData) => api.post(`${endpoints.products.get(id)}/images`, formData),
  deleteImage: (id, imageId) => api.delete(`${endpoints.products.get(id)}/images/${imageId}`),
  setPrimaryImage: (id, imageId) => api.patch(`${endpoints.products.get(id)}/images/${imageId}/primary`),
  sortImages: (id, images) => api.patch(`${endpoints.products.get(id)}/images/sort`, { images }),
  uploadDocument: (id, formData) => api.post(`${endpoints.products.get(id)}/documents`, formData),
  deleteDocument: (id, documentId) => api.delete(`${endpoints.products.get(id)}/documents/${documentId}`),
  getActivity: (id) => api.get(endpoints.products.activity(id)),
}

// Companies API
export const companiesApi = {
  list: (params = {}) => api.get(endpoints.companies.list, { params }),
  getById: (id, params = {}) => api.get(endpoints.companies.get(id), { params }),
  getProducts: (id, params = {}) => api.get(endpoints.companies.products(id), { params }),
  create: (data) => api.post(endpoints.companies.create, data),
  update: (id, data) => api.patch(endpoints.companies.update(id), data),
  delete: (id) => api.delete(endpoints.companies.delete(id)),
  restore: (id) => api.patch(endpoints.companies.restore(id)),
  changeStatus: (id, status) => api.patch(endpoints.companies.status(id), { status }),
  toggleVerify: (id, isVerified) => api.patch(endpoints.companies.verify(id), { isVerified }),
  updateLogo: (id, logo) => api.patch(endpoints.companies.logo(id), { logo }),
  getSettings: (id) => api.get(endpoints.companies.settings(id)),
  updateSettings: (id, data) => api.patch(endpoints.companies.settings(id), data),
  getStatistics: (id) => api.get(endpoints.companies.statistics(id)),
}

// Categories API
export const categoriesApi = {
  list: (params = {}) => api.get(endpoints.categories.list, { params }),
  // Authenticated STAFF-only listing — includes inactive categories, unlike
  // the public `list` above. Used by the admin management page.
  listForManagement: (params = {}) => api.get(endpoints.categories.manage, { params }),
  getById: (id) => api.get(endpoints.categories.get(id)),
  getProducts: (id, params = {}) => api.get(endpoints.categories.products(id), { params }),
  getSubcategories: (id) => api.get(endpoints.categories.subcategories(id)),
  getSubcategory: (id, subId) => api.get(endpoints.categories.subcategory(id, subId)),
  create: (data) => api.post(endpoints.categories.create, data),
  update: (id, data) => api.patch(endpoints.categories.update(id), data),
  delete: (id) => api.delete(endpoints.categories.delete(id))
}

// Specification Library API
export const specificationLibraryApi = {
  search: (q, limit = 20) => api.get('/specification-library', { params: { q, limit } }),
  listAll: () => api.get('/specification-library/all'),
}

// Orders API
export const ordersApi = {
  getRecentOrders: (limit = 5) => api.get(endpoints.orders.myOrders, { params: { limit } }),
  getUserStats: () => api.get(`${endpoints.orders.myOrders}/stats`),
  list: (params = {}) => api.get(endpoints.orders.list, { params }),
  getById: (id) => api.get(endpoints.orders.get(id)),
  create: (data) => api.post(endpoints.orders.create, data),
  update: (id, data) => api.put(endpoints.orders.update(id), data),
  delete: (id) => api.delete(endpoints.orders.delete(id))
}

// Dashboard/Stats API
export const statsApi = {
  getDashboardStats: () => api.get(endpoints.dashboard.stats),
  getAnalytics: () => api.get(endpoints.dashboard.analytics),
  getRecentActivity: () => api.get(endpoints.dashboard.recentActivity)
}

// Admin API
export const adminApi = {
  getAdminStats: () => api.get(endpoints.admin.stats),
  getUsers: (params = {}) => api.get(endpoints.users.list, { params }),
  getUserById: (id) => api.get(endpoints.users.get(id)),
  createUser: (data) => api.post(endpoints.users.create, data),
  updateUser: (id, data) => api.patch(endpoints.users.update(id), data),
  deleteUser: (id) => api.delete(endpoints.users.delete(id)),
  updateUserStatus: (id, data) => api.patch(endpoints.users.update(id), data),
  setUserAccess: (id, data) => api.patch(endpoints.users.access(id), data),
  getRoles: (params = {}) => api.get(endpoints.admin.roles, { params }),
  getRoleById: (id) => api.get(endpoints.admin.getRole(id)),
  createRole: (data) => api.post(endpoints.admin.roles, data),
  updateRole: (id, data) => api.patch(endpoints.admin.getRole(id), data),
  deleteRole: (id) => api.delete(endpoints.admin.getRole(id)),
  getPermissions: (params = {}) => api.get(endpoints.admin.permissions, { params }),
  getPermissionById: (id) => api.get(endpoints.admin.getPermission(id)),
  createPermission: (data) => api.post(endpoints.admin.permissions, data),
  updatePermission: (id, data) => api.patch(endpoints.admin.getPermission(id), data),
  deletePermission: (id) => api.delete(endpoints.admin.getPermission(id)),
  getSystemSettings: () => api.get(endpoints.admin.settings),
  updateProductReviewThreshold: (value) => api.patch(endpoints.admin.productReviewThreshold, { value }),
  getInquiryMonetizationSettings: () => api.get(endpoints.inquirySubscriptions.adminSettings),
  updateInquiryMonetizationSettings: (subscriptionEnforcement) => api.patch(endpoints.inquirySubscriptions.adminSettings, { subscriptionEnforcement }),
  listInquiryPlans: () => api.get(endpoints.inquirySubscriptions.adminPlans),
  createInquiryPlan: (data) => api.post(endpoints.inquirySubscriptions.adminPlans, data),
  updateInquiryPlan: (id, data) => api.patch(endpoints.inquirySubscriptions.adminPlan(id), data),
  listInquirySubscriptions: () => api.get(endpoints.inquirySubscriptions.adminSubscriptions),
  activateInquirySubscription: (id, notes = '') => api.post(endpoints.inquirySubscriptions.activate(id), { paymentConfirmed: true, notes }),
  rejectInquirySubscription: (id, notes = '') => api.post(endpoints.inquirySubscriptions.reject(id), { notes }),
  grantInquirySubscription: (data) => api.post(endpoints.inquirySubscriptions.grant, data),
}

// Inquiries API
export const inquiriesApi = {
  list: (params = {}) => api.get(endpoints.inquiries.list, { params }),
  getStats: () => api.get(endpoints.inquiries.stats),
  listPlans: () => api.get(endpoints.inquirySubscriptions.plans),
  getMySubscriptions: () => api.get(endpoints.inquirySubscriptions.mine),
  requestSubscription: (data) => api.post(endpoints.inquirySubscriptions.request, data),
  getQuota: () => api.get(endpoints.inquirySubscriptions.quota),
  listMessages: (id) => api.get(endpoints.inquiries.listMessages(id)),
  sendMessage: (id, data) => api.post(endpoints.inquiries.sendMessage(id), data),
  getById: (id) => api.get(endpoints.inquiries.getById(id)),
  create: (data) => api.post(endpoints.inquiries.create, data),
  changeStatus: (id, data) => api.patch(endpoints.inquiries.changeStatus(id), data),
  revealResponses: (id) => api.post(endpoints.inquiries.revealResponses(id)),
  listItems: (id) => api.get(endpoints.inquiries.listItems(id)),
  addItem: (id, data) => api.post(endpoints.inquiries.addItem(id), data),
  updateItem: (id, itemId, data) => api.patch(endpoints.inquiries.updateItem(id, itemId), data),
  deleteItem: (id, itemId) => api.delete(endpoints.inquiries.deleteItem(id, itemId)),
  listResponses: (id) => api.get(endpoints.inquiries.listResponses(id)),
  submitResponse: (id, data) => api.post(endpoints.inquiries.submitResponse(id), data),
  updateResponse: (id, responseId, data) => api.patch(endpoints.inquiries.updateResponse(id, responseId), data),
  decideResponse: (id, responseId, data) => api.patch(endpoints.inquiries.decideResponse(id, responseId), data),
  withdrawResponse: (id, responseId, data = {}) => api.post(endpoints.inquiries.withdrawResponse(id, responseId), data),
  uploadResponseAttachment: (id, responseId, formData) => api.post(endpoints.inquiries.responseAttachments(id, responseId), formData),
  deleteResponseAttachment: (id, responseId, attachmentId) => api.delete(endpoints.inquiries.deleteResponseAttachment(id, responseId, attachmentId)),
}