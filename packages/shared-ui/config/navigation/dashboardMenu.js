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

export const PUBLIC_SITE_URL = import.meta.env.VITE_PUBLIC_SITE_URL || import.meta.env.VITE_WEBSITE_APP_URL || '/'

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
        title: 'داشبورد',
        icon: 'pi pi-home',
        route: 'admin-dashboard',
        roles: ['SUPER_ADMIN', 'ADMIN', 'MODERATOR'],
      },

    ],
  },
  {
    section: 'پیشخوان',
    items: [
      { title: 'داشبورد', icon: 'pi pi-home', route: 'company-dashboard', roles: ['COMPANY_MANAGER', 'COMPANY_USER'] },
    ],
  },
  {
    section: 'مدیریت پلتفرم',
    items: [
      { title: 'کاربران', icon: 'pi pi-users', route: 'admin-users', permission: 'users.read' },
      { title: 'شرکت‌ها', icon: 'pi pi-building', route: 'admin-companies', permission: 'companies.read' },
      { title: 'دسته‌بندی‌ها', icon: 'pi pi-folder', route: 'admin-categories', permission: 'categories.read' },
      { title: 'بنرهای تبلیغاتی', icon: 'pi pi-images', route: 'admin-banners', permission: 'banners.read' },
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
    section: '',
    items: [
      { title: 'محصولات', icon: 'pi pi-box', route: 'admin-products', permission: 'products.read' },
      {
        title: 'استعلام‌ها',
        icon: 'pi pi-question-circle',
        route: 'admin-inquiries',
        permission: 'inquiries.read',
        badge: { value: 'جدید', severity: 'info' },
      },
      // Retail order navigation is a UI prototype only. The destination route
      // uses clearly labelled sample data until an authoritative Orders API
      // and backend domain are implemented. Do not infer live order records.
    ],
  },
  {
    section: '',
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
    section: 'ماژول‌های آینده',
    items: [
      { title: 'منابع انسانی (HR)', icon: 'pi pi-users', planned: true, roles: ['SUPER_ADMIN', 'ADMIN', 'MODERATOR'], badge: { value: 'آینده', severity: 'secondary' } },
      { title: 'تدارکات و خرید', icon: 'pi pi-shopping-bag', planned: true, roles: ['SUPER_ADMIN', 'ADMIN', 'MODERATOR', 'COMPANY_MANAGER'], badge: { value: 'آینده', severity: 'secondary' } },
      { title: 'انبار و لجستیک', icon: 'pi pi-box', planned: true, roles: ['SUPER_ADMIN', 'ADMIN', 'MODERATOR', 'COMPANY_MANAGER'], badge: { value: 'آینده', severity: 'secondary' } },
      { title: 'پروژه‌ها و عملیات', icon: 'pi pi-sitemap', planned: true, roles: ['SUPER_ADMIN', 'ADMIN', 'MODERATOR', 'COMPANY_MANAGER'], badge: { value: 'آینده', severity: 'secondary' } },
      { title: 'هوش تجاری و تحلیل (BI)', icon: 'pi pi-chart-line', planned: true, roles: ['SUPER_ADMIN', 'ADMIN', 'MODERATOR', 'COMPANY_MANAGER'], badge: { value: 'آینده', severity: 'secondary' } },
      { title: 'یکپارچه‌سازی و امنیت', icon: 'pi pi-shield', planned: true, roles: ['SUPER_ADMIN', 'ADMIN', 'MODERATOR'], badge: { value: 'آینده', severity: 'secondary' } },

      { title: 'تقویم و وظایف', icon: 'pi pi-calendar', planned: true, roles: ['SUPER_ADMIN', 'ADMIN', 'MODERATOR', 'COMPANY_MANAGER', 'COMPANY_USER'], badge: { value: 'آینده', severity: 'secondary' } },
      { title: 'اسناد و دارایی‌ها', icon: 'pi pi-folder-open', planned: true, roles: ['SUPER_ADMIN', 'ADMIN', 'MODERATOR', 'COMPANY_MANAGER'], badge: { value: 'آینده', severity: 'secondary' } },
      { title: 'ارتباطات سازمانی و کمپین‌ها', icon: 'pi pi-comments', planned: true, roles: ['SUPER_ADMIN', 'ADMIN', 'MODERATOR', 'COMPANY_MANAGER'], badge: { value: 'آینده', severity: 'secondary' } },
      { title: 'مرکز دانش و محتوا', icon: 'pi pi-book', planned: true, roles: ['SUPER_ADMIN', 'ADMIN', 'MODERATOR', 'COMPANY_MANAGER', 'COMPANY_USER'], badge: { value: 'آینده', severity: 'secondary' } },
      { title: 'ممیزی و انطباق', icon: 'pi pi-check-circle', planned: true, roles: ['SUPER_ADMIN', 'ADMIN', 'MODERATOR'], badge: { value: 'آینده', severity: 'secondary' } },
    ],
  },
  {
    section: 'CRM و مشتریان',
    items: [
      {
        title: 'مدیریت ارتباط با مشتری',
        icon: 'pi pi-address-book',
        permission: 'crm.dashboard.read',
        children: [
          { title: 'نمای کلی CRM', icon: 'pi pi-th-large', route: 'admin-crm', permission: 'crm.dashboard.read' },
          { title: 'سرنخ‌ها و مشتریان بالقوه', icon: 'pi pi-user-plus', route: 'admin-crm-leads', permission: 'crm.leads.read' },
          { title: 'حساب‌ها و مخاطبان', icon: 'pi pi-building', route: 'admin-crm-accounts', permission: 'crm.accounts.read' },
          { title: 'وظایف و پیگیری‌ها', icon: 'pi pi-calendar-clock', route: 'admin-crm-tasks', permission: 'crm.tasks.read' },
          { title: 'قیف فرصت‌های فروش', icon: 'pi pi-filter', route: 'admin-crm-pipeline', permission: 'crm.pipelines.read' },
          { title: 'تعاملات و پیگیری‌ها', icon: 'pi pi-calendar-clock', route: 'admin-crm-activities', permission: 'crm.activities.read' },
        ],
      },
    ],
  },
  {
    section: 'پشتیبانی',
    items: [
      {
        title: 'تیکت‌ها',
        icon: 'pi pi-headphones',
        roles: ['SUPER_ADMIN', 'ADMIN', 'MODERATOR'],
        children: [
          { title: 'همه تیکت‌ها', icon: 'pi pi-list', route: 'admin-tickets', query: { status: 'ALL' }, roles: ['SUPER_ADMIN', 'ADMIN', 'MODERATOR'] },
          { title: 'تیکت‌های باز', icon: 'pi pi-envelope', route: 'admin-tickets', query: { status: 'OPEN' }, roles: ['SUPER_ADMIN', 'ADMIN', 'MODERATOR'] },
          { title: 'تیکت‌های بسته‌شده', icon: 'pi pi-check-circle', route: 'admin-tickets', query: { status: 'CLOSED' }, roles: ['SUPER_ADMIN', 'ADMIN', 'MODERATOR'] },
        ],
      },
      {
        title: 'تیکت‌ها',
        icon: 'pi pi-comments',
        roles: ['COMPANY_MANAGER', 'COMPANY_USER'],
        children: [
          { title: 'همه تیکت‌ها', icon: 'pi pi-list', route: 'company-tickets', query: { status: 'ALL' }, roles: ['COMPANY_MANAGER', 'COMPANY_USER'] },
          { title: 'تیکت‌های باز', icon: 'pi pi-envelope', route: 'company-tickets', query: { status: 'OPEN' }, roles: ['COMPANY_MANAGER', 'COMPANY_USER'] },
          { title: 'تیکت‌های بسته‌شده', icon: 'pi pi-check-circle', route: 'company-tickets', query: { status: 'CLOSED' }, roles: ['COMPANY_MANAGER', 'COMPANY_USER'] },
        ],
      },
    ],
  },
  {
    section: 'مالی',
    items: [
      {
        title: 'مالی و حسابداری',
        icon: 'pi pi-wallet',
        roles: ['SUPER_ADMIN', 'ADMIN'],
        children: [
          { title: 'نمای کلی مالی', icon: 'pi pi-chart-pie', route: 'admin-finance' },
          { title: 'تسویه با شرکت‌ها', icon: 'pi pi-building', route: 'admin-finance-settlements' },
          { title: 'تراکنش‌ها و گردش حساب', icon: 'pi pi-arrow-right-arrow-left', route: 'admin-finance-transactions' },
          { title: 'صورتحساب‌ها و اسناد', icon: 'pi pi-file-invoice', route: 'admin-finance-invoices' },
        ],
      },
    ],
  },
  {
    section: 'فروش خرده‌فروشی',
    items: [
      {
        title: 'سفارشات',
        icon: 'pi pi-shopping-cart',
        roles: ['SUPER_ADMIN', 'ADMIN', 'MODERATOR'],
        children: [
          { title: 'همه سفارش‌ها', icon: 'pi pi-list', route: 'admin-retail-orders', query: { status: 'همه' }, roles: ['SUPER_ADMIN', 'ADMIN', 'MODERATOR'] },
          { title: 'در انتظار پردازش', icon: 'pi pi-hourglass', route: 'admin-retail-orders', query: { status: 'در انتظار پردازش' }, roles: ['SUPER_ADMIN', 'ADMIN', 'MODERATOR'] },
          { title: 'ارسال‌شده', icon: 'pi pi-truck', route: 'admin-retail-orders', query: { status: 'ارسال‌شده' }, roles: ['SUPER_ADMIN', 'ADMIN', 'MODERATOR'] },
          { title: 'تحویل‌شده', icon: 'pi pi-check-circle', route: 'admin-retail-orders', query: { status: 'تحویل‌شده' }, roles: ['SUPER_ADMIN', 'ADMIN', 'MODERATOR'] },
          { title: 'مرجوعی', icon: 'pi pi-replay', route: 'admin-retail-orders', query: { status: 'مرجوعی' }, roles: ['SUPER_ADMIN', 'ADMIN', 'MODERATOR'] },
        ],
      },
    ],
  },
  {
    section: 'فروش خرده‌فروشی شرکت',
    items: [
      {
        title: 'سفارشات',
        icon: 'pi pi-shopping-cart',
        roles: ['COMPANY_MANAGER', 'COMPANY_USER'],
        children: [
          { title: 'همه سفارش‌ها', icon: 'pi pi-list', route: 'company-retail-orders', query: { status: 'همه' }, roles: ['COMPANY_MANAGER', 'COMPANY_USER'] },
          { title: 'جدید؛ نیازمند پذیرش', icon: 'pi pi-inbox', route: 'company-retail-orders', query: { status: 'جدید؛ نیازمند پذیرش' }, roles: ['COMPANY_MANAGER', 'COMPANY_USER'] },
          { title: 'در حال آماده‌سازی', icon: 'pi pi-box', route: 'company-retail-orders', query: { status: 'در حال آماده‌سازی' }, roles: ['COMPANY_MANAGER', 'COMPANY_USER'] },
          { title: 'ارسال‌شده', icon: 'pi pi-truck', route: 'company-retail-orders', query: { status: 'ارسال‌شده' }, roles: ['COMPANY_MANAGER', 'COMPANY_USER'] },
          { title: 'تحویل‌شده', icon: 'pi pi-check-circle', route: 'company-retail-orders', query: { status: 'تحویل‌شده' }, roles: ['COMPANY_MANAGER', 'COMPANY_USER'] },
        ],
      },
      { title: 'موجودی محصولات', icon: 'pi pi-box', planned: true, roles: ['COMPANY_MANAGER', 'COMPANY_USER'], badge: { value: 'پس از اتصال سرویس', severity: 'secondary' } },
    ],
  },
  {
    section: 'مالی شرکت',
    items: [
      { title: 'وضعیت تسویه‌ها', icon: 'pi pi-wallet', route: 'company-finance-settlements', roles: ['COMPANY_MANAGER', 'COMPANY_USER'] },
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