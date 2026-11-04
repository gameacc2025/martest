# ماتریس دسترسی برنامه‌ها و نقش‌ها

> این سند باید با `backend/prisma/schema.prisma`، `backend/src/modules/auth/auth.service.js`، `backend/src/middlewares/rbac.js`، routeهای هر ماژول و seed فعلی تطبیق داده شود. کد بک‌اند مرجع اجرای مجوزهاست.

## اصل معماری

**زمینه دسترسی برنامه از `AccessProfile.type` می‌آید، نه از نام نقش.**

| زمینه | برنامه | مرز داده |
|---|---|---|
| `CUSTOMER` | Website | داده‌های مشتری و استعلام‌هایی که خودش مالک آن‌هاست |
| `COMPANY` | Company Portal | شرکت مرتبط با access profile و منابع متعلق به همان شرکت |
| `STAFF` | Admin | عملیات مدیریتی فقط با permissionهای لازم |

نقش‌ها دارای `Role.scope` هستند (`STAFF`، `COMPANY` یا `CUSTOMER`). تخصیص نقش باید با زمینه کاربر و محدوده مجاز آن سازگار باشد. ثبت‌نام CUSTOMER طبق قرارداد فعلی `AccessProfile` نمی‌سازد؛ در این حالت فقط `CUSTOMER_USER` می‌تواند به‌عنوان زمینه پیش‌فرض Website عمل کند. این استثنا فقط برای CUSTOMER است و هرگز زمینه STAFF/COMPANY یا نقش SUPER_ADMIN را دور نمی‌زند. داشتن permission یا wildcard به‌تنهایی نباید کنترل مالکیت رکورد را حذف کند.

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

## نقش SUPER_ADMIN و مرز زمینه

از 2026-10-27، نقش `SUPER_ADMIN` دیگر زمینه برنامه را دور نمی‌زند. `AccessProfile.type` مرز امنیتی مستقل از permissionهاست:
- ورود به Admin فقط با زمینه `STAFF` مجاز است.
- ورود به Company فقط با زمینه `COMPANY` مجاز است.
- `requireAccessType` حتی برای `SUPER_ADMIN` زمینه را بررسی می‌کند.
- انتقال نشست PKCE در زمان ایجاد و redeem کد، زمینه و فعال‌بودن AccessProfile را دوباره بررسی می‌کند.
- wildcard permission (`*`) می‌تواند کنترل permission را برآورده کند، اما مجوز تغییر زمینه یا عبور از مالکیت tenant نیست.

برای عملیات سراسری، از یک AccessProfile در زمینه STAFF و permissionهای مناسب استفاده شود؛ نقش به‌تنهایی مجوز عبور به پنل دیگر نیست. این تغییر عمداً رفتار legacy cross-app را حذف می‌کند و باید با تست‌های مثبت و منفی ورود، middleware و handoff نگهداری شود.

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


## محدوده استعلام — تفکیک خریدار و تأمین‌کننده

- scope استعلام‌های «دریافتی» (scope=received) فقط برای زمینه برنامه COMPANY مجاز است؛ وجود companyId به‌تنهایی کافی نیست.
- STAFF حتی با permission خواندن استعلام یا شناسه شرکت باقی‌مانده/اشتباه، نباید به فهرست دریافتی تأمین‌کننده دسترسی پیدا کند.
- سرویس باید این مرز را مستقل از route guard enforce کند؛ فیلتر نهایی دریافتی‌ها نیز باید بر اساس مالکیت محصول شرکت احراز‌شده اعمال شود.
- مشتری فاقد AccessProfile با نقش CUSTOMER_USER و accessType: null فقط در محدوده Website و استعلام‌های متعلق به buyerUserId خودش عمل می‌کند.


### اشتراک و سهمیه استعلام

- مالک اشتراک COMPANY فقط از AccessProfile در زمینه COMPANY و companyId همان نشست استخراج می‌شود.
- مالک اشتراک CUSTOMER برای حساب‌های دارای AccessProfile نوع CUSTOMER از userId و برای ثبت‌نام CUSTOMER_USER فاقد AccessProfile از شناسه همان کاربر احراز‌شده استخراج می‌شود؛ این fallback هرگز برای STAFF/SUPER_ADMIN اعمال نمی‌شود.
- سهمیهٔ شرکت برای STAFF قابل مشاهده نیست؛ وجود companyId در توکن STAFF مجوز یا زمینهٔ مالکیت شرکت ایجاد نمی‌کند.
- آمار پنل STAFF با permission خواندن استعلام به‌صورت تجمیعی پلتفرم محاسبه می‌شود؛ آمار شرکت فقط در زمینه COMPANY به companyId همان زمینه محدود می‌شود.
