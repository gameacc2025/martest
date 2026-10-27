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
    // Cross-app session handoff (PKCE): mint a one-time code on the
    // website, redeem it in the admin/company panel.
    handoff: '/auth/handoff',
    handoffRedeem: '/auth/handoff/redeem',
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

  // Customer addresses (always scoped to the authenticated customer's identity)
  addresses: {
    list: '/addresses',
    get: (id) => `/addresses/${id}`,
    create: '/addresses',
    update: (id) => `/addresses/${id}`,
    setDefault: (id) => `/addresses/${id}/default`,
    delete: (id) => `/addresses/${id}`,
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
    activity: (id) => `/products/${id}/activity`,
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
  // Notifications (user-facing inbox and preferences)
  notifications: {
    list: '/settings/notifications',
    folders: (app) => `/settings/notifications/folders?app=${app}`,
    changeFolder: (id) => `/settings/notifications/${id}/folders`,
    unreadCount: '/settings/notifications/unread-count',
    read: (id) => `/settings/notifications/${id}/read`,
    readState: (id) => `/settings/notifications/${id}/read-state`,
    bulkReadState: '/settings/notifications/bulk-read-state',
    bulkDelete: '/settings/notifications/bulk-delete',
    readAll: '/settings/notifications/read-all',
    remove: (id) => `/settings/notifications/${id}`,
    preferences: '/settings/notifications/preferences',
  },
  // Admin
  admin: {
    stats: '/admin/stats',
    settings: '/admin/settings',
    productReviewThreshold: '/admin/settings/product-review-threshold',
    notifications: {
      send: '/admin/notifications/send',
      deliveryStats: '/admin/notifications/delivery-stats',
      deliveries: '/admin/notifications/deliveries',
      folders: '/admin/notifications/folders',
      folder: (id) => `/admin/notifications/folders/${id}`,
    },
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
  // Inquiry subscription monetization
  inquirySubscriptions: {
    plans: '/inquiries/plans',
    mine: '/inquiries/subscription/me',
    request: '/inquiries/subscription',
    verifyPayment: (id) => `/inquiries/subscription/${id}/verify-payment`,
    quota: '/inquiries/quota',
    adminSettings: '/admin/inquiry-monetization/settings',
    adminPlans: '/admin/inquiry-plans',
    adminPlan: (id) => `/admin/inquiry-plans/${id}`,
    adminSubscriptions: '/admin/inquiry-subscriptions',
    activate: (id) => `/admin/inquiry-subscriptions/${id}/activate`,
    reject: (id) => `/admin/inquiry-subscriptions/${id}/reject`,
    grant: '/admin/inquiry-subscriptions/grant',
  },
  // Inquiries (RFQ)
  inquiries: {
    create: '/inquiries',
    list: '/inquiries',
    stats: '/inquiries/stats',
    getById: (id) => `/inquiries/${id}`,
    changeStatus: (id) => `/inquiries/${id}/status`,
    revealResponses: (id) => `/inquiries/${id}/reveal`,
    listItems: (id) => `/inquiries/${id}/items`,
    addItem: (id) => `/inquiries/${id}/items`,
    updateItem: (id, itemId) => `/inquiries/${id}/items/${itemId}`,
    deleteItem: (id, itemId) => `/inquiries/${id}/items/${itemId}`,
    listMessages: (id) => `/inquiries/${id}/messages`,
    sendMessage: (id) => `/inquiries/${id}/messages`,
    listResponses: (id) => `/inquiries/${id}/responses`,
    submitResponse: (id) => `/inquiries/${id}/responses`,
    updateResponse: (id, responseId) => `/inquiries/${id}/responses/${responseId}`,
    decideResponse: (id, responseId) => `/inquiries/${id}/responses/${responseId}/decision`,
    withdrawResponse: (id, responseId) => `/inquiries/${id}/responses/${responseId}/withdraw`,
    responseAttachments: (id, responseId) => `/inquiries/${id}/responses/${responseId}/attachments`,
    deleteResponseAttachment: (id, responseId, attachmentId) => `/inquiries/${id}/responses/${responseId}/attachments/${attachmentId}`,
  }
}