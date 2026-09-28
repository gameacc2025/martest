# مستندات Frontend - Telecom Marketplace

## مقدمه
این مستندات ساختار و کامپوننتهای frontend پروژه Telecom Marketplace را شرح میدهد. این پروژه با **Vue 3** (Composition API) و **PrimeVue** برای UI و **Vite** برای build tool ساخته شده است.

---

## جدول محتوا
1. [معماری کلی](#معماری-کلی)
2. [ساختار پوشهها](#ساختار-پوشهها)
3. [صفحات اصلی](#صفحات-اصلی)
4. [کامپوننتهای عمومی](#کامپوننتهای-عمومی)
5. [State Management (Pinia)](#state-management)
6. [مسیرها و ناوبری](#مسیرها-و-ناوبری)
7. [اتصال به API](#اتصال-به-api)
8. [احراز هویت](#احراز-هویت)

---

## معماری کلی

### مشخصات فنی
- **Framework**: Vue 3 (Composition API)
- **UI Library**: PrimeVue
- **Build Tool**: Vite
- **State Management**: Pinia
- **Styling**: PrimeVue Themes (Lara) + Custom SCSS
- **HTTP Client**: Custom Fetch-based client

---

## ساختار پوشهها

```
frontend/src/
├── api/                    # API client configuration
│   └── index.js           # API endpoints + methods
├── assets/                 # استایلها و آیکونها
│   ├── main.scss          # استایلهای اصلی
│   └── NewCSS/            # Layout styles
├── components/             # کامپوننتهای shared
│   ├── common/            # Badge, Button, Card, MegaMenu, etc.
│   ├── products/          # ProductCard
│   └── reviews/           # ReviewCard
├── composables/            # Vue composables
│   └── usePermissions.js  # Permission checking
├── config/                 # تنظیمات
│   └── navigation/        # Admin/User menu configs
├── http/                   # HTTP client
│   ├── apiClient.js       # API helper functions
│   ├── core/              # HttpClient, HttpRequest, HttpResponse
│   ├── errors/            # Error classes
│   ├── middlewares/        # Auth, Parser middlewares
│   └── presets/            # Browser/Node presets
├── layouts/                # Layout components
│   ├── PublicLayout.vue   # لایوت عمومی سایت
│   └── AdminLayout.vue    # لایوت پنل ادمین
├── pages/                  # صفحات
│   ├── public/            # صفحات عمومی
│   ├── admin/             # پنل ادمین
│   └── user/              # صفحات کاربر
├── router/                 # مسیرها
│   └── index.js           # Vue Router config
└── stores/                 # Pinia stores
    ├── auth.js            # احراز هویت
    ├── cart.js            # سبد خرید
    └── admin/             # استورهای ادمین
```

---

## صفحات اصلی

### صفحات عمومی (pages/public/)
- `Home.vue` - صفحه اصلی با محصولات ویژه
- `ProductListing.vue` - لیست محصولات با فیلتر
- `ProductDetails.vue` - جزئیات محصول
- `Categories.vue` - دسته‌بندی‌ها
- `Login.vue` - ورود
- `Register.vue` - ثبت نام
- `ContactUs.vue` - تماس با ما
- `AboutUs.vue` - درباره ما

### پنل ادمین (pages/admin/)
- `Dashboard.vue` - داشبورد با آمار و محصولات در انتظار تأیید
- `users/UserList.vue` - مدیریت کاربران
- `roles/RoleList.vue` - مدیریت نقش‌ها
- `permissions/PermissionList.vue` - مدیریت مجوزها
- `products/ProductList.vue` - مدیریت محصولات
- `products/ProductForm.vue` - ایجاد/ویرایش محصول
- `categories/CategoryList.vue` - مدیریت دسته‌بندی‌ها
- `orders/OrderList.vue` - مدیریت سفارشات
- `companies/CompanyList.vue` - مدیریت شرکت‌ها
- `inquiries/InquiryList.vue` - درخواست‌های استعلام
- `inquiries/InquiryDetail.vue` - جزئیات درخواست
- `inquiries/InquiryCreate.vue` - ایجاد درخواست

### صفحات کاربر (pages/user/)
- `MyProducts.vue` - محصولات من
- `MyInquiries.vue` - درخواست‌های من
- `UserProfile.vue` - پروفایل من
- `ChangePassword.vue` - تغییر رمز عبور
- `Notifications.vue` - اعلان‌ها
- `company/CompanySettings.vue` - تنظیمات شرکت
- `company/CompanyProducts.vue` - محصولات شرکت

---

## State Management (Pinia)

### استورهای اصلی
- `auth.js` - احراز هویت (login, logout, register, profile)
- `cart.js` - سبد خرید
- `stats.js` - آمار داشبورد
- `admin.js` - عملیات ادمین
- `admin/users.js` - مدیریت کاربران
- `admin/roles.js` - مدیریت نقش‌ها
- `admin/permissions.js` - مدیریت مجوزها
- `companies.js` - مدیریت شرکت‌ها
- `products.js` - مدیریت محصولات
- `orders.js` - مدیریت سفارشات

---

## اتصال به API

### API Client Helper Functions
```javascript
import { apiGet, apiGetPaginated, apiPost, apiPatch, apiDelete } from '@/http/apiClient'
import { handleApiError } from '@/api/errorHandler'

// GET request
const data = await apiGet('/users')

// Paginated GET
const { data, meta } = await apiGetPaginated('/products', { params: { page: 1 } })

// POST request
const result = await apiPost('/users', userData)

// Error handling
try {
  await apiPost('/users', data)
} catch (err) {
  const { status, message } = handleApiError(err)
}
```

---

## احراز هویت

### فلوی احراز هویت
1. کاربر فرم ثبت‌نام را تکمیل می‌کند (تلفن اجباری، ایمیل اختیاری)
2. کاربر عادی بلافاصله ACTIVE می‌شود؛ شرکت نیاز به تأیید ادمین دارد
3. کاربر با شماره تلفن و رمز عبور وارد می‌شود → دریافت JWT token
4. توکن در localStorage ذخیره می‌شود
5. تمام درخواست‌های API با هدر Authorization ارسال می‌شوند

### سیستم وضعیت کاربران
- **PENDING**: در انتظار تأیید ادمین
- **ACTIVE**: فعال و قابل استفاده
- **REJECTED**: رد شده توسط ادمین
