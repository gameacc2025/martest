/**
 * Unified Dashboard Navigation
 *
 * A SINGLE menu definition shared by every dashboard user (Super Admin and
 * Company users). Visibility is permission/role based — the layout renders the
 * exact same shell for everyone and only the visible menu items change.
 *
 * Each item supports:
 *   - title:       Display label (Persian)
 *   - icon:        PrimeIcons class
 *   - route:       Named route (must already exist in the router)
 *   - url:         External URL (use with `external`)
 *   - external:    Open the URL outside the SPA in a new tab
 *   - permission:  Permission string required to see the item
 *   - roles:       Array of role names allowed to see the item
 *   - badge:       Optional badge shown next to the label ({ value, severity })
 *   - children:    Optional nested items (same shape) → renders a submenu
 *
 * Visibility rule (see useDashboardMenu):
 *   visible = matchesRole AND matchesPermission
 *   - SUPER_ADMIN bypasses permission checks (handled by the auth store).
 *   - An item with neither `roles` nor `permission` is visible to everyone.
 *   - A parent with children is visible when at least one child is visible.
 *
 * Sections are just visual groups; a section with no visible items is hidden.
 */

export const PUBLIC_SITE_URL = import.meta.env.VITE_PUBLIC_SITE_URL || '/'

// Real backend role names (see backend/prisma/seed.js → ROLES):
//   STAFF:    SUPER_ADMIN, ADMIN, MODERATOR
//   COMPANY:  COMPANY_MANAGER, COMPANY_USER
//   CUSTOMER: CUSTOMER_USER
// NOTE: There is no "COMPANY_ADMIN" role in the system — using it here made
// every `roles: ['COMPANY_ADMIN']` item invisible to real company users.
export const dashboardMenu = [
  {
    section: 'پیشخوان',
    items: [
      {
        title: 'داشبورد مدیریت',
        icon: 'pi pi-home',
        route: 'admin-dashboard',
        roles: ['SUPER_ADMIN', 'ADMIN', 'MODERATOR'],
        permission: 'dashboard.read',
      },
      {
        title: 'داشبورد شرکت',
        icon: 'pi pi-home',
        route: 'company-dashboard',
        roles: ['COMPANY_MANAGER', 'COMPANY_USER'],
      },
    ],
  },
  {
    section: 'مدیریت پلتفرم',
    items: [
      { title: 'کاربران', icon: 'pi pi-users', route: 'admin-users', permission: 'users.read' },
      { title: 'شرکت‌ها', icon: 'pi pi-building', route: 'admin-companies', permission: 'companies.read' },
      { title: 'دسته‌بندی‌ها', icon: 'pi pi-folder', route: 'admin-categories', permission: 'categories.read' },
      {
        title: 'دسترسی‌ها',
        icon: 'pi pi-shield',
        children: [
          { title: 'نقش‌ها', icon: 'pi pi-id-card', route: 'admin-roles', permission: 'roles.read' },
          { title: 'مجوزها', icon: 'pi pi-lock', route: 'admin-permissions', permission: 'permissions.read' },
        ],
      },
    ],
  },
  {
    section: 'بازرگانی',
    items: [
      // Was scoped to `roles: ['SUPER_ADMIN']` in addition to the permission
      // check, which hid it from ADMIN/MODERATOR even though they hold
      // `products.read` in the backend role→permission table. The permission
      // check alone is the correct (and already sufficient) gate here.
      { title: 'محصولات', icon: 'pi pi-box', route: 'admin-products', permission: 'products.read' },
      {
        title: 'استعلام‌ها',
        icon: 'pi pi-question-circle',
        route: 'admin-inquiries',
        permission: 'inquiries.read',
        badge: { value: 'جدید', severity: 'info' },
      },
      // "سفارشات" (Orders) was removed here: the Orders backend module no
      // longer exists (no Order model, no /api/v1/orders routes — see
      // BACKEND_AUDIT_REPORT.md and backend/src/app.js), and `orders.read`
      // isn't even a permission in the catalogue anymore. The item still
      // rendered for SUPER_ADMIN (wildcard bypass) and led to a dead page
      // that only threw 404s. RFQ/order-equivalent flows live under
      // "استعلام‌ها" (Inquiries) instead.
    ],
  },
  {
    section: 'شرکت من',
    items: [
      // Management-only: requires company_profile.update / users.* which
      // COMPANY_USER does not hold.
      { title: 'پروفایل شرکت', icon: 'pi pi-building', route: 'company-settings', roles: ['COMPANY_MANAGER'] },
      { title: 'کاربران شرکت', icon: 'pi pi-users', route: 'company-users', roles: ['COMPANY_MANAGER'] },
      { title: 'گزارش‌ها', icon: 'pi pi-chart-bar', route: 'company-reports', roles: ['COMPANY_MANAGER'] },
      // Operational: both COMPANY_MANAGER and COMPANY_USER hold
      // products.read/inquiries.read in the backend role→permission table.
      { title: 'محصولات شرکت', icon: 'pi pi-box', route: 'manage-products', roles: ['COMPANY_MANAGER', 'COMPANY_USER'] },
      { title: 'استعلام‌ها', icon: 'pi pi-inbox', route: 'company-inquiries', roles: ['COMPANY_MANAGER', 'COMPANY_USER'] },
    ],
  },
  {
    section: 'حساب کاربری',
    items: [
      { title: 'پروفایل من', icon: 'pi pi-user', route: 'profile' },
      { title: 'اعلان‌ها', icon: 'pi pi-bell', route: 'notifications' },
      {
        title: 'تنظیمات',
        icon: 'pi pi-cog',
        children: [
          { title: 'تغییر رمز عبور', icon: 'pi pi-key', route: 'change-password' },
          { title: 'مشاهده سایت', icon: 'pi pi-external-link', url: PUBLIC_SITE_URL, external: true },
        ],
      },
    ],
  },
]

export default dashboardMenu