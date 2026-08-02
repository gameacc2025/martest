/**
 * User Sidebar Navigation Configuration
 * 
 * For normal customers and company users.
 * Separate from admin navigation.
 */

export const userMenu = [
  {
    title: 'حساب کاربری',
    icon: 'pi pi-user',
    items: [
      { title: 'پروفایل من', icon: 'pi pi-user', route: 'profile' },
      { title: 'تغییر رمز عبور', icon: 'pi pi-lock', route: 'change-password' },
      { title: 'محصولات من', icon: 'pi pi-box', route: 'my-products' },
      { title: 'درخواست‌های من', icon: 'pi pi-question-circle', route: 'my-inquiries' },
      { title: 'سفارشات من', icon: 'pi pi-shopping-cart', route: 'orders' },
      { title: 'لیست علاقه‌مندی‌ها', icon: 'pi pi-heart', route: 'wishlist' },
      { title: 'اعلان‌ها', icon: 'pi pi-bell', route: 'notifications' },
    ],
  },
  {
    title: 'شرکت',
    icon: 'pi pi-building',
    items: [
      { title: 'تنظیمات شرکت', icon: 'pi pi-cog', route: 'company-settings' },
      { title: 'محصولات شرکت', icon: 'pi pi-box', route: 'company-products' },
    ],
  },
  {
    title: 'بازارگاه',
    icon: 'pi pi-shop',
    items: [
      { title: 'صفحه اصلی', icon: 'pi pi-home', route: 'home' },
      { title: 'دسته‌بندی‌ها', icon: 'pi pi-folder', route: 'categories' },
      { title: 'محصولات', icon: 'pi pi-box', route: 'products' },
      { title: 'جستجو', icon: 'pi pi-search', route: 'search' },
    ],
  },
  {
    title: 'سبد خرید',
    icon: 'pi pi-shopping-cart',
    items: [
      { title: 'سبد خرید', icon: 'pi pi-cart', route: 'cart' },
      { title: 'تسویه حساب', icon: 'pi pi-credit-card', route: 'checkout' },
    ],
  },
  {
    title: 'پشتیبانی',
    icon: 'pi pi-info-circle',
    items: [
      { title: 'تماس با ما', icon: 'pi pi-phone', route: 'contact' },
      { title: 'درباره ما', icon: 'pi pi-info', route: 'about' },
      { title: 'سوالات متداول', icon: 'pi pi-question', route: 'faq' },
      { title: 'قوانین و حریم خصوصی', icon: 'pi pi-file', route: 'terms' },
    ],
  },
]

export default userMenu