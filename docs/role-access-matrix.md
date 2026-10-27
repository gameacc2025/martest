# ماتریس دسترسی برنامه‌ها و نقش‌ها

> این سند باید با `backend/prisma/schema.prisma`، `backend/src/modules/auth/auth.service.js`، `backend/src/middlewares/rbac.js`، routeهای هر ماژول و seed فعلی تطبیق داده شود. کد بک‌اند مرجع اجرای مجوزهاست.

## اصل معماری

**زمینه دسترسی برنامه از `AccessProfile.type` می‌آید، نه از نام نقش.**

| زمینه | برنامه | مرز داده |
|---|---|---|
| `CUSTOMER` | Website | داده‌های مشتری و استعلام‌هایی که خودش مالک آن‌هاست |
| `COMPANY` | Company Portal | شرکت مرتبط با access profile و منابع متعلق به همان شرکت |
| `STAFF` | Admin | عملیات مدیریتی فقط با permissionهای لازم |

نقش‌ها دارای `Role.scope` هستند (`STAFF`، `COMPANY` یا `CUSTOMER`). تخصیص نقش باید با زمینه کاربر و محدوده مجاز آن سازگار باشد. داشتن permission یا wildcard به‌تنهایی نباید کنترل مالکیت رکورد را حذف کند.

## کنترل‌های اصلی

| عملیات | کنترل مورد انتظار |
|---|---|
| ورود به Admin | زمینه STAFF و قواعد احراز هویت؛ بررسی مجوز برای هر عملیات مدیریتی |
| عملیات شرکت | زمینه COMPANY و مالکیت شرکت، یا زمینه STAFF همراه با permission دقیق برای عملیات سراسری |
| مدیریت کاربران شرکت | فقط مشاهده کاربران شرکت خود و فعال/غیرفعال‌سازی با permission دقیق؛ ایجاد/حذف/تغییر نقش یا انتقال شرکت برای COMPANY ممنوع |
| مدیریت نقش‌ها و permissionها | فقط STAFF؛ تطبیق scope نقش با زمینه کاربر هدف |
| محصولات | محصول عمومی فقط در وضعیت/visibility مجاز؛ نوشتن COMPANY محدود به شرکت خودش؛ STAFF برای عملیات بین‌شرکتی به permission مربوط نیاز دارد |
| استعلام و پیشنهاد | CUSTOMER فقط استعلام‌های خودش؛ COMPANY فقط پاسخ‌های مجاز به‌عنوان تأمین‌کننده؛ STAFF نباید با جعل companyId به‌جای تأمین‌کننده یا خریدار عمل کند |
| تاریخچه قیمت | فقط محصول منتشرشده و عمومی؛ تاریخچه از snapshotهای ذخیره‌شده می‌آید |
| اعلان‌ها | اعلان‌ها، folder associationها و عملیات read/delete باید با مالکیت گیرنده و scope پوشه بررسی شوند |

## نقش SUPER_ADMIN و وضعیت سیاست

در کد فعلی، بعضی مسیرهای legacy هنوز اجازه می‌دهند نقش `SUPER_ADMIN` از بررسی عمومی `requireAccessType` یا انتخاب app در login عبور کند. در عین حال، تعدادی از مسیرهای حساس اکنون از guard دقیق STAFF و کنترل مالکیت سرویس استفاده می‌کنند.

این تفاوت **هنوز تصمیم نهایی محصول نیست**. تا زمان تعیین سیاست نهایی:
- به استثنای عمومی SUPER_ADMIN به‌عنوان سیاست مطلوب یا تضمین‌شده تکیه نکنید.
- برای endpointهای حساس از guard زمینه دقیق و کنترل مالکیت سمت سرویس استفاده کنید.
- قرارداد سراسری ورود، middleware و handoff را بدون تست رگرسیون و تعیین سیاست صریح تغییر ندهید.

## فایل‌های مرجع

- `backend/prisma/schema.prisma` — `AccessProfileType`، `RoleScope` و مدل‌های مالکیت
- `backend/src/modules/auth/auth.service.js` — ورود و انتخاب برنامه
- `backend/src/middlewares/rbac.js` — guardهای زمینه و permission
- `backend/src/modules/users/user.routes.js` و `user.service.js` — مدیریت کاربران
- `backend/src/modules/companies/company.routes.js` و سرویس مربوطه — مالکیت شرکت
- `backend/src/modules/products/product.routes.js` و `product.service.js` — محصولات
- `backend/src/modules/inquiries/inquiry.routes.js` و `inquiry.service.js` — استعلام و پاسخ
- `backend/src/modules/notifications/notification.routes.js` — اعلان‌ها

## تست پذیرش امنیتی

- درخواست بدون هویت باید 401 برگرداند.
- کاربر COMPANY نباید با تغییر ID به داده یا عملیات شرکت دیگر دسترسی بگیرد.
- CUSTOMER نباید عملیات تأمین‌کننده یا مدیریت STAFF انجام دهد.
- STAFF بدون permission دقیق نباید عملیات بین‌شرکتی/مالی/مدیریتی را اجرا کند.
- role با scope ناسازگار نباید به کاربر تخصیص یابد.
- هر اصلاح مجوز باید تست منفی و مثبت متناسب با route و service داشته باشد.
