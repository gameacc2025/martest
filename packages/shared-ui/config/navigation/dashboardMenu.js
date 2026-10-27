/**
 * Unified Dashboard Navigation
 *
 * A SINGLE menu definition shared by every dashboard user (Staff and Company
 * users). Visibility is permission based — the layout renders the exact same
 * shell for everyone and only the visible menu items change.
 *
 * Each item supports:
 *   - title:       Display label (Persian)
 *   - icon:        PrimeIcons class
 *   - route:       Named route (must already exist in the router)
 *   - url:         External URL (use with `external`)
 *   - external:    Open the URL outside the SPA in a new tab
 *   - permission:  Permission string (or array of strings, ANY match) required
 *                  to see the item. This is the PRIMARY gate — prefer this
 *                  over `roles` so that any future custom role automatically
 *                  gets the right menu items just by holding the right
 *                  permissions, with no menu-file edit required.
 *   - roles:       Array of role names. Use ONLY to separate "which
 *                  dashboard/app area does this belong to" (e.g. the Staff
 *                  home vs the Company home) — never as a substitute for a
 *                  real permission check.
 *   - badge:       Optional badge shown next to the label ({ value, severity })
 *   - children:    Optional nested items (same shape) → renders a submenu.
 *                  Avoid unless items are genuinely a sub-group; prefer flat,
 *                  independent top-level links.
 *
 * Visibility rule (see useDashboardMenu):
 *   visible = matchesRole AND matchesPermission AND routeExists
 *   - SUPER_ADMIN bypasses permission checks (handled by the auth store).
 *   - An item with neither `roles` nor `permission` is visible to everyone
 *     who is authenticated.
 *   - A parent with children is visible when at least one child is visible.
 *
 * Sections are just visual groups; a section with no visible items is hidden.
 */

export const PUBLIC_SITE_URL = import.meta.env.VITE_PUBLIC_SITE_URL || '/'

// Real backend role names (see backend/prisma/seed.js → ROLES):
//   STAFF:    SUPER_ADMIN, ADMIN, MODERATOR
//   COMPANY:  COMPANY_MANAGER, COMPANY_USER
//   CUSTOMER: CUSTOMER_USER
// NOTE: There is no "COMPANY_ADMIN" role in the system.
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
        permission: 'dashboard.read',
      },
    ],
  },
  {
    section: 'مدیریت پلتفرم',
    items: [
      { title: 'کاربران', icon: 'pi pi-users', route: 'admin-users', permission: 'users.read' },
      { title: 'شرکت‌ها', icon: 'pi pi-building', route: 'admin-companies', permission: 'companies.read' },
      { title: 'دسته‌بندی‌ها', icon: 'pi pi-folder', route: 'admin-categories', permission: 'categories.read' },
      // Flattened: was a "دسترسی‌ها" submenu with 2 children. A 2-item
      // dropdown adds a click for no grouping benefit — each is now its own
      // top-level link.
      { title: 'نقش‌ها', icon: 'pi pi-id-card', route: 'admin-roles', permission: 'roles.read' },
      { title: 'مجوزها', icon: 'pi pi-lock', route: 'admin-permissions', permission: 'permissions.read' },
      { title: 'تنظیمات سیستم', icon: 'pi pi-cog', route: 'admin-settings', permission: 'system_settings.manage' },
      { title: 'اشتراک‌های استعلام', icon: 'pi pi-wallet', route: 'admin-inquiry-subscriptions', permission: 'system_settings.manage' },
    ],
  },
  {
    section: 'بازرگانی',
    items: [
      { title: 'محصولات', icon: 'pi pi-box', route: 'admin-products', permission: 'products.read' },
      {
        title: 'استعلام‌ها',
        icon: 'pi pi-question-circle',
        route: 'admin-inquiries',
        permission: 'inquiries.read',
        badge: { value: 'جدید', severity: 'info' },
      },
      // "سفارشات" (Orders) intentionally absent: the Orders backend module no
      // longer exists (no Order model, no /api/v1/orders routes — see
      // BACKEND_AUDIT_REPORT.md and backend/src/app.js), and `orders.read`
      // isn't a permission in the catalogue anymore either.
    ],
  },
  {
    section: 'شرکت من',
    items: [
      // Every item below is gated purely by permission — NOT by hardcoding
      // "COMPANY_MANAGER" / "COMPANY_USER". This means: the day you create a
      // third company role (e.g. "COMPANY_VIEWER") and grant it a subset of
      // these permissions, the correct menu items appear automatically with
      // zero changes to this file.
      { title: 'محصولات شرکت', icon: 'pi pi-box', route: 'manage-products', permission: 'products.read' },
      { title: 'استعلام‌ها', icon: 'pi pi-inbox', route: 'company-inquiries', permission: 'inquiries.read' },
      { title: 'اشتراک استعلام', icon: 'pi pi-wallet', route: 'company-inquiry-subscription', permission: ['inquiries.create', 'inquiries.respond'] },
      // Only COMPANY_MANAGER holds company_profile.update today.
      { title: 'پروفایل شرکت', icon: 'pi pi-building', route: 'company-settings', permission: 'company_profile.update' },
      // Only COMPANY_MANAGER holds users.read (COMPANY_USER has no users.*
      // permission at all — see backend/prisma/seed.js ROLE_PERMISSIONS).
      { title: 'کاربران شرکت', icon: 'pi pi-users', route: 'company-users', permission: 'users.read' },
      // reports.read was added to COMPANY_MANAGER's permission set
      // specifically so this item could be permission-gated like everything
      // else here (previously it was hardcoded to a role name).
      { title: 'گزارش‌ها', icon: 'pi pi-chart-bar', route: 'company-reports', permission: 'reports.read' },
    ],
  },
  {
    section: 'ارتباط با کاربران',
    items: [
      { title: 'ارسال و پایش اعلان‌ها', icon: 'pi pi-send', route: 'admin-notification-management', roles: ['SUPER_ADMIN', 'ADMIN', 'MODERATOR'], permission: 'notifications.send' },
      { title: 'مدیریت پوشه‌های اعلان', icon: 'pi pi-folder-open', route: 'admin-notification-folders', roles: ['SUPER_ADMIN', 'ADMIN', 'MODERATOR'], permission: 'system_settings.manage' },
    ],
  },
  {
    section: 'حساب کاربری',
    items: [
      { title: 'پروفایل من', icon: 'pi pi-user', route: 'profile' },
      { title: 'اعلان‌ها', icon: 'pi pi-bell', route: 'notifications' },
      { title: 'تنظیمات اعلان‌ها', icon: 'pi pi-sliders-h', route: 'notification-preferences' },
      { title: 'تغییر رمز عبور', icon: 'pi pi-key', route: 'change-password' },
      // Flattened out of a "تنظیمات" submenu it didn't belong under — this
      // is a link out of the app, not a setting.
      { title: 'مشاهده سایت', icon: 'pi pi-external-link', url: PUBLIC_SITE_URL, external: true },
    ],
  },
]

export default dashboardMenu