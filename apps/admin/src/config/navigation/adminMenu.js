/**
 * Admin Sidebar Navigation Configuration
 *
 * Each menu item supports:
 *   - title:     Display label (Persian)
 *   - icon:      PrimeIcons class
 *   - route:     Named route (must exist in router)
 *   - url:       External URL for links outside the SPA
 *   - external:  Open URL outside the router, preferably in a new tab
 *   - permission: Permission string for access control
 */

export const PUBLIC_SITE_URL = import.meta.env.VITE_PUBLIC_SITE_URL || '/'

export const adminMenu = [
  {
    title: 'داشبورد',
    icon: 'pi pi-home',
    route: 'admin-dashboard',
    permission: 'dashboard.read',
  },
  {
    title: 'مدیریت کاربران',
    icon: 'pi pi-users',
    route: 'admin-users',
    permission: 'users.read',
  },
  {
    title: 'نقش‌ها',
    icon: 'pi pi-shield',
    route: 'admin-roles',
    permission: 'roles.read',
  },
  {
    title: 'مجوزها',
    icon: 'pi pi-lock',
    route: 'admin-permissions',
    permission: 'permissions.read',
  },
  {
    title: 'شرکت‌ها',
    icon: 'pi pi-building',
    route: 'admin-companies',
    permission: 'companies.read',
  },
  {
    title: 'دسته‌بندی‌ها',
    icon: 'pi pi-folder',
    route: 'admin-categories',
    permission: 'categories.read',
  },
  {
    title: 'محصولات',
    icon: 'pi pi-box',
    route: 'admin-products',
    permission: 'products.read',
  },
  {
    title: 'سفارشات',
    icon: 'pi pi-shopping-cart',
    route: 'admin-orders',
    permission: 'orders.read',
  },
  {
    title: 'درخواست‌های استعلام',
    icon: 'pi pi-question-circle',
    route: 'admin-inquiries',
    permission: 'inquiries.read',
  },
  {
    title: 'مشاهده سایت',
    icon: 'pi pi-external-link',
    url: PUBLIC_SITE_URL,
    external: true,
    permission: 'dashboard.read',
  },
]

export default adminMenu