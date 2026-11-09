/**
 * @telecom/api-client — API Endpoints
 *
 * Centralized endpoint definitions used by all apps.
 */

export const endpoints = {
  // Public contact form
  contact: { submit: '/contact/messages' },
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
    // Session management
    sessions: '/auth/sessions',
    revokeSession: (id) => `/auth/sessions/${id}`,
    forgotPassword: '/auth/forgot-password',
    resetPassword: '/auth/reset-password',
    verifyEmail: '/auth/verify-email',
    challenges: {
      request: '/auth/challenges',
      verify: '/auth/challenges/verify',
      consume: '/auth/challenges/consume',
      me: '/auth/challenges/me',
    }
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
    publicProfile: (id) => `/companies/public/${id}`,
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
  // Independent promotional banners / campaigns
  banners: {
    active: '/banners/active',
    manage: '/banners/manage',
    get: (id) => `/banners/manage/${id}`,
    create: '/banners/manage',
    update: (id) => `/banners/manage/${id}`,
    archive: (id) => `/banners/manage/${id}`,
    upload: '/banners/manage/upload',
  },
  // CMS - Articles
  cmsArticles: {
    list: '/cms/articles',
    getBySlug: (slug) => `/cms/articles/${slug}`,
    getById: (id) => `/cms/articles/id/${id}`,
    manage: '/cms/articles/manage',
    getManage: (id) => `/cms/articles/manage/${id}`,
    create: '/cms/articles/manage',
    update: (id) => `/cms/articles/manage/${id}`,
    changeStatus: (id) => `/cms/articles/manage/${id}/status`,
    delete: (id) => `/cms/articles/manage/${id}`,
    listRevisions: (id) => `/cms/articles/manage/${id}/revisions`,
    getRevision: (id, revisionNo) => `/cms/articles/manage/${id}/revisions/${revisionNo}`,
  },
  // CMS - Categories
  cmsCategories: {
    list: '/cms/categories',
    manage: '/cms/categories/manage',
    get: (id) => `/cms/categories/manage/${id}`,
    create: '/cms/categories/manage',
    update: (id) => `/cms/categories/manage/${id}`,
    delete: (id) => `/cms/categories/manage/${id}`,
  },
  // CMS - Tags
  cmsTags: {
    list: '/cms/tags',
    manage: '/cms/tags/manage',
    get: (id) => `/cms/tags/manage/${id}`,
    create: '/cms/tags/manage',
    update: (id) => `/cms/tags/manage/${id}`,
    delete: (id) => `/cms/tags/manage/${id}`,
  },
  // CMS - FAQs
  cmsFaqs: {
    list: '/cms/faqs',
    categories: '/cms/faqs/categories',
    manage: '/cms/faqs/manage',
    get: (id) => `/cms/faqs/manage/${id}`,
    create: '/cms/faqs/manage',
    update: (id) => `/cms/faqs/manage/${id}`,
    delete: (id) => `/cms/faqs/manage/${id}`,
  },
  // CMS - Pages
  cmsPages: {
    list: '/cms/pages',
    get: (slug) => `/cms/pages/${slug}`,
    manage: '/cms/pages/manage',
    getManage: (id) => `/cms/pages/manage/${id}`,
    getBySlug: (slug) => `/cms/pages/manage/slug/${slug}`,
    create: '/cms/pages/manage',
    update: (id) => `/cms/pages/manage/${id}`,
    upsert: (slug) => `/cms/pages/manage/slug/${slug}`,
    delete: (id) => `/cms/pages/manage/${id}`,
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
  // DEPRECATED LEGACY CONTRACT: backend/src/app.js has no /orders routes and
  // backend/prisma/schema.prisma has no Order model. Do not call these paths.
  // Replace this block only when /retail/* domain APIs are implemented.
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
    folders: '/settings/notifications/folders',
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
  // Audit Logs (STAFF only)
  audit: {
    logs: '/audit/logs',
    stats: '/audit/logs/stats',
    get: (id) => `/audit/logs/${id}`,
    export: '/audit/logs/export',
  },

  // CRM — STAFF-only customer relationship management
  crm: {
    dashboard: '/crm/dashboard',
    sources: '/crm/lead-sources', source: (id) => `/crm/lead-sources/${id}`,
    leads: '/crm/leads', leadsExport: '/crm/leads/export', lead: (id) => `/crm/leads/${id}`,
    assignLead: (id) => `/crm/leads/${id}/assign`, leadStatus: (id) => `/crm/leads/${id}/status`, convertLead: (id) => `/crm/leads/${id}/convert`,
    leadDuplicates: (id) => `/crm/leads/${id}/duplicates`, leadTimeline: (id) => `/crm/leads/${id}/timeline`, mergeLead: (id) => `/crm/leads/${id}/merge`,
    accounts: '/crm/accounts', account: (id) => `/crm/accounts/${id}`, accountContacts: (id) => `/crm/accounts/${id}/contacts`, contact: (id) => `/crm/contacts/${id}`,
    tasks: '/crm/tasks', task: (id) => `/crm/tasks/${id}`, assignTask: (id) => `/crm/tasks/${id}/assign`, completeTask: (id) => `/crm/tasks/${id}/complete`, activities: '/crm/activities', notes: '/crm/notes',
    pipelines: '/crm/pipelines', pipeline: (id) => `/crm/pipelines/${id}`, pipelineStages: (id) => `/crm/pipelines/${id}/stages`, pipelineStage: (id, stageId) => `/crm/pipelines/${id}/stages/${stageId}`,
    opportunities: '/crm/opportunities', opportunity: (id) => `/crm/opportunities/${id}`, opportunityStage: (id) => `/crm/opportunities/${id}/stage`,
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
    downloadResponseAttachment: (id, responseId, attachmentId) => `/inquiries/${id}/responses/${responseId}/attachments/${attachmentId}/download`,
    deleteResponseAttachment: (id, responseId, attachmentId) => `/inquiries/${id}/responses/${responseId}/attachments/${attachmentId}`,
  }
}