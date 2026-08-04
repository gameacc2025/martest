/**
 * @telecom/api-client — API Endpoints
 *
 * Centralized endpoint definitions used by all apps.
 */

export const endpoints = {
  // Authentication
  auth: {
    login: '/auth/login',
    register: '/auth/register',
    registerCompany: '/auth/register-company',
    logout: '/auth/logout',
    logoutAll: '/auth/logout-all',
    refresh: '/auth/refresh',
    me: '/auth/me',
    forgotPassword: '/auth/forgot-password',
    resetPassword: '/auth/reset-password',
    verifyEmail: '/auth/verify-email'
  },
  // Users
  users: {
    list: '/users',
    get: (id) => `/users/${id}`,
    create: '/users',
    update: (id) => `/users/${id}`,
    delete: (id) => `/users/${id}`,
    access: (id) => `/users/${id}/access`,
    accessActive: (id) => `/users/${id}/access-active`,
    resetPassword: (id) => `/auth/users/${id}/password`
  },

  // Companies
  companies: {
    list: '/companies',
    get: (id) => `/companies/${id}`,
    products: (id) => `/companies/${id}/products`,
    create: '/companies',
    update: (id) => `/companies/${id}`,
    delete: (id) => `/companies/${id}`,
    restore: (id) => `/companies/${id}/restore`,
    status: (id) => `/companies/${id}/status`,
    verify: (id) => `/companies/${id}/verify`,
    logo: (id) => `/companies/${id}/logo`,
    settings: (id) => `/companies/${id}/settings`,
    statistics: (id) => `/companies/${id}/statistics`,
    search: '/companies/search',
    myCompanies: '/companies/me'
  },
  // Products
  products: {
    list: '/products',
    myProducts: '/products/my-products',
    get: (id) => `/products/${id}`,
    manage: (id) => `/products/${id}/manage`,
    create: '/products',
    update: (id) => `/products/${id}`,
    delete: (id) => `/products/${id}`,
    price: (id) => `/products/${id}/price`,
    submitReview: (id) => `/products/${id}/submit-review`,
    approve: (id) => `/products/${id}/approve`,
    reject: (id) => `/products/${id}/reject`,
    publish: (id) => `/products/${id}/publish`,
    hide: (id) => `/products/${id}/hide`,
    archive: (id) => `/products/${id}/archive`,
    restoreDraft: (id) => `/products/${id}/restore-draft`,
    byCompany: (companyId) => `/products?companyId=${companyId}`
  },
  // Categories
  categories: {
    list: '/categories',
    manage: '/categories/manage',
    get: (id) => `/categories/${id}`,
    products: (id) => `/categories/${id}/products`,
    subcategories: (id) => `/categories/${id}/subcategories`,
    subcategory: (id, subId) => `/categories/${id}/subcategories/${subId}`,
    create: '/categories',
    update: (id) => `/categories/${id}`,
    delete: (id) => `/categories/${id}`
  },
  // Orders
  orders: {
    list: '/orders',
    get: (id) => `/orders/${id}`,
    create: '/orders',
    update: (id) => `/orders/${id}`,
    delete: (id) => `/orders/${id}`,
    myOrders: '/orders/me',
    byCompany: (companyId) => `/companies/${companyId}/orders`
  },
  // Invoices
  invoices: {
    list: '/invoices',
    get: (id) => `/invoices/${id}`,
    create: '/invoices',
    update: (id) => `/invoices/${id}`,
    delete: (id) => `/invoices/${id}`,
    myInvoices: '/invoices/me',
    byCompany: (companyId) => `/companies/${companyId}/invoices`
  },
  // Dashboard
  dashboard: {
    stats: '/dashboard/stats',
    analytics: '/dashboard/analytics',
    recentActivity: '/dashboard/recent-activity'
  },
  // Settings
  settings: {
    profile: '/settings/profile',
    preferences: '/settings/preferences',
    notifications: '/settings/notifications',
    changePassword: '/settings/change-password'
  },
  // Admin
  admin: {
    stats: '/admin/stats',
    roles: '/roles',
    getRole: (id) => `/roles/${id}`,
    assignableRoles: '/roles/assignable',
    permissions: '/permissions',
    getPermission: (id) => `/permissions/${id}`,
  },
  // File Uploads
  uploads: {
    upload: '/uploads',
    get: (id) => `/uploads/${id}`,
    delete: (id) => `/uploads/${id}`
  },
  // Inquiries (RFQ)
  inquiries: {
    create: '/inquiries',
    list: '/inquiries',
    stats: '/inquiries/stats',
    getById: (id) => `/inquiries/${id}`,
    changeStatus: (id) => `/inquiries/${id}/status`,
    listItems: (id) => `/inquiries/${id}/items`,
    addItem: (id) => `/inquiries/${id}/items`,
    updateItem: (id, itemId) => `/inquiries/${id}/items/${itemId}`,
    deleteItem: (id, itemId) => `/inquiries/${id}/items/${itemId}`,
    listResponses: (id) => `/inquiries/${id}/responses`,
    submitResponse: (id) => `/inquiries/${id}/responses`,
    updateResponse: (id, responseId) => `/inquiries/${id}/responses/${responseId}`,
    withdrawResponse: (id, responseId) => `/inquiries/${id}/responses/${responseId}/withdraw`,
    responseAttachments: (id, responseId) => `/inquiries/${id}/responses/${responseId}/attachments`,
    deleteResponseAttachment: (id, responseId, attachmentId) => `/inquiries/${id}/responses/${responseId}/attachments/${attachmentId}`,
  }
}