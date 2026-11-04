/**
 * @telecom/permissions — Shared Permission Constants
 *
 * SINGLE SOURCE OF TRUTH for permission constants across every frontend app
 * (Admin portal, Company portal, Website). Previously each app kept its own
 * copy under `src/config/permissions.js`; those copies have been removed and
 * now re-map to this package.
 *
 * The object below is the UNION of every permission used by any portal, so an
 * app that only needs a subset still resolves the exact same string constants
 * it used before. These are the exact permission strings returned by the
 * backend. Use with usePermissions().can() / canAny().
 *
 * SUPER_ADMIN bypasses all checks automatically (handled in the auth store).
 */

export const PERMISSIONS = {
  // ── Dashboard ──────────────────────────────────────────────
  DASHBOARD: {
    READ: 'dashboard.read',
  },

  // ── Users ──────────────────────────────────────────────────
  USERS: {
    CREATE: 'users.create',
    READ: 'users.read',
    UPDATE: 'users.update',
    DELETE: 'users.delete',
    ACTIVATE: 'users.activate',
    DEACTIVATE: 'users.deactivate',
    ASSIGN_ROLES: 'users.assign_roles',
    RESET_PASSWORD: 'users.reset_password',
    IMPERSONATE: 'users.impersonate',
  },

  // ── Roles ──────────────────────────────────────────────────
  ROLES: {
    CREATE: 'roles.create',
    READ: 'roles.read',
    UPDATE: 'roles.update',
    DELETE: 'roles.delete',
  },

  // ── Permissions ────────────────────────────────────────────
  PERMISSIONS: {
    READ: 'permissions.read',
    ASSIGN: 'permissions.assign',
  },

  // ── Companies ──────────────────────────────────────────────
  COMPANIES: {
    CREATE: 'companies.create',
    READ: 'companies.read',
    UPDATE: 'companies.update',
    DELETE: 'companies.delete',
    ACTIVATE: 'companies.activate',
    DEACTIVATE: 'companies.deactivate',
    MANAGE_SETTINGS: 'companies.manage_settings',
    VIEW_STATISTICS: 'companies.view_statistics',
    CHANGE_OWNER: 'companies.change_owner',
    RESTORE: 'companies.restore',
  },

  // ── Company Profile (self) ─────────────────────────────────
  COMPANY_PROFILE: {
    READ: 'company_profile.read',
    UPDATE: 'company_profile.update',
  },

  // ── Categories ─────────────────────────────────────────────
  CATEGORIES: {
    CREATE: 'categories.create',
    READ: 'categories.read',
    UPDATE: 'categories.update',
    DELETE: 'categories.delete',
  },

  // ── Products ───────────────────────────────────────────────
  PRODUCTS: {
    CREATE: 'products.create',
    READ: 'products.read',
    UPDATE: 'products.update',
    DELETE: 'products.delete',
    SUBMIT_REVIEW: 'products.submit_review',
    REVIEW: 'products.review',
    PUBLISH: 'products.publish',
    HIDE: 'products.hide',
    ARCHIVE: 'products.archive',
    UNPUBLISH: 'products.unpublish',
    APPROVE: 'products.approve',
    REJECT: 'products.reject',
    FEATURE: 'products.feature',
    RESTORE: 'products.restore',
    IMPORT: 'products.import',
    EXPORT: 'products.export',
    CHANGE_STATUS: 'products.change_status',
  },

  // ── Product Images ─────────────────────────────────────────
  PRODUCT_IMAGES: {
    READ: 'product_images.read',
    CREATE: 'product_images.create',
    UPDATE: 'product_images.update',
    DELETE: 'product_images.delete',
  },

  // ── Product Documents ──────────────────────────────────────
  PRODUCT_DOCUMENTS: {
    CREATE: 'product_documents.create',
    UPDATE: 'product_documents.update',
    DELETE: 'product_documents.delete',
  },

  // ── Product Reviews ────────────────────────────────────────
  PRODUCT_REVIEWS: {
    READ: 'product_reviews.read',
    APPROVE: 'product_reviews.approve',
    REJECT: 'product_reviews.reject',
    DELETE: 'product_reviews.delete',
  },

  // ── Inquiries / RFQ ────────────────────────────────────────
  INQUIRIES: {
    CREATE: 'inquiries.create',
    READ: 'inquiries.read',
    RESPOND: 'inquiries.respond',
  },

  // ── Leads ──────────────────────────────────────────────────
  LEADS: {
    READ: 'leads.read',
    UPDATE: 'leads.update',
    CHANGE_STATUS: 'leads.change_status',
  },

  // ── Sales ──────────────────────────────────────────────────
  SALES: {
    CREATE: 'sales.create',
    READ: 'sales.read',
    UPDATE: 'sales.update',
    DELETE: 'sales.delete',
    APPROVE: 'sales.approve',
    REJECT: 'sales.reject',
    EXPORT: 'sales.export',
  },

  // ── Commissions ────────────────────────────────────────────
  COMMISSIONS: {
    READ: 'commissions.read',
    UPDATE: 'commissions.update',
    APPROVE: 'commissions.approve',
    REJECT: 'commissions.reject',
    PAY: 'commissions.pay',
    EXPORT: 'commissions.export',
  },

  // ── Reports ────────────────────────────────────────────────
  REPORTS: {
    READ: 'reports.read',
    EXPORT: 'reports.export',
  },

  // ── Notifications ──────────────────────────────────────────
  NOTIFICATIONS: {
    READ: 'notifications.read',
    SEND: 'notifications.send',
    DELETE: 'notifications.delete',
  },

  // ── Settings ───────────────────────────────────────────────
  SETTINGS: {
    READ: 'settings.read',
    UPDATE: 'settings.update',
  },

  // ── System ─────────────────────────────────────────────────
  SYSTEM: {
    JOBS_READ: 'system.jobs.read',
    JOBS_RETRY: 'system.jobs.retry',
    CACHE_CLEAR: 'system.cache.clear',
    MAINTENANCE: 'system.maintenance',
  },
}

/**
 * Convenience: flat list of all permission strings.
 */
export const ALL_PERMISSIONS = Object.values(PERMISSIONS)
  .flatMap(group => Object.values(group))

/**
 * Permission groups for UI display.
 */
export const PERMISSION_GROUPS = [
  { key: 'DASHBOARD', label: 'داشبورد', permissions: Object.values(PERMISSIONS.DASHBOARD) },
  { key: 'USERS', label: 'کاربران', permissions: Object.values(PERMISSIONS.USERS) },
  { key: 'ROLES', label: 'نقش‌ها', permissions: Object.values(PERMISSIONS.ROLES) },
  { key: 'COMPANIES', label: 'شرکت‌ها', permissions: Object.values(PERMISSIONS.COMPANIES) },
  { key: 'COMPANY_PROFILE', label: 'پروفایل شرکت', permissions: Object.values(PERMISSIONS.COMPANY_PROFILE) },
  { key: 'CATEGORIES', label: 'دسته‌بندی‌ها', permissions: Object.values(PERMISSIONS.CATEGORIES) },
  { key: 'PRODUCTS', label: 'محصولات', permissions: Object.values(PERMISSIONS.PRODUCTS) },
  { key: 'INQUIRIES', label: 'درخواست‌ها', permissions: Object.values(PERMISSIONS.INQUIRIES) },
  { key: 'LEADS', label: 'لیدها', permissions: Object.values(PERMISSIONS.LEADS) },
  { key: 'SALES', label: 'فروش', permissions: Object.values(PERMISSIONS.SALES) },
  { key: 'REPORTS', label: 'گزارش‌ها', permissions: Object.values(PERMISSIONS.REPORTS) },
  { key: 'SETTINGS', label: 'تنظیمات', permissions: Object.values(PERMISSIONS.SETTINGS) },
]

export default PERMISSIONS
