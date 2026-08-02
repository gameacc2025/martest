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

export const dashboardMenu = [
  {
    section: 'پیشخوان',
    items: [
      {
        title: 'داشبورد مدیریت',
        icon: 'pi pi-home',
        route: 'admin-dashboard',
        roles: ['SUPER_ADMIN'],
        permission: 'dashboard.read',
      },
      {
        title: 'داشبورد شرکت',
        icon: 'pi pi-home',
        route: 'company-dashboard',
        roles: ['COMPANY_ADMIN'],
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
      { title: 'محصولات (ادمین)', icon: 'pi pi-box', route: 'admin-products', permission: 'products.read', roles: ['SUPER_ADMIN'] },
      { title: 'محصولات', icon: 'pi pi-box', route: 'manage-products', roles: ['COMPANY_ADMIN'] },
      { title: 'سفارشات', icon: 'pi pi-shopping-cart', route: 'admin-orders', permission: 'orders.read' },
      {
        title: 'استعلام‌ها',
        icon: 'pi pi-question-circle',
        route: 'admin-inquiries',
        permission: 'inquiries.read',
        badge: { value: 'جدید', severity: 'info' },
      },
    ],
  },
  {
    section: 'شرکت من',
    items: [
      { title: 'پروفایل شرکت', icon: 'pi pi-building', route: 'company-settings', roles: ['COMPANY_ADMIN'] },
      { title: 'محصولات شرکت', icon: 'pi pi-box', route: 'manage-products', roles: ['COMPANY_ADMIN'] },
      { title: 'استعلام‌ها', icon: 'pi pi-inbox', route: 'company-inquiries', roles: ['COMPANY_ADMIN'] },
      { title: 'کاربران شرکت', icon: 'pi pi-users', route: 'company-users', roles: ['COMPANY_ADMIN'] },
      { title: 'گزارش‌ها', icon: 'pi pi-chart-bar', route: 'company-reports', roles: ['COMPANY_ADMIN'] },
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
