# مستندات API — Telecom Marketplace

## وضعیت و منبع حقیقت

این راهنما با route registration فعلی بک‌اند تطبیق داده شده است. API روی Fastify پیاده‌سازی شده و prefix اصلی آن **`/api/v1`** است. نسخه‌های قدیمی این سند از `/api`، نقش‌های قدیمی مانند `COMPANY_ADMIN` و مدل User تخت استفاده می‌کردند؛ آن قراردادها معتبر نیستند.

برای جزئیات دقیق schema، validation، permission و پاسخ هر endpoint، route و schema مربوطه در سورس مرجع است. در صورت اختلاف، سورس اجراشونده و تست‌های آن بر این خلاصه مقدم‌اند.

## پایه و پاسخ‌ها

- Local API: `http://localhost:3000/api/v1`
- Health endpoint: `GET /health`
- احراز هویت: در مسیرهای محافظت‌شده از access token طبق قرارداد auth plugin استفاده می‌شود.
- پاسخ‌های صفحه‌بندی‌شده ممکن است به شکل `{ data, meta }` باشند؛ از helper متناسب با پاسخ صفحه‌بندی‌شده استفاده کنید و فرض نکنید همه API helperها envelope یکسانی برمی‌گردانند.
- هر endpoint ممکن است schema و مجوز جداگانه داشته باشد؛ این فهرست به معنی عمومی بودن یا مجاز بودن endpoint نیست.

## زمینه‌های دسترسی

- `CUSTOMER`: تجربه Website و استعلام‌هایی که کاربر خودش مالک آن‌هاست. ثبت‌نام CUSTOMER در قرارداد فعلی AccessProfile نمی‌سازد؛ middleware فقط نقش `CUSTOMER_USER` را در نبود access type به‌عنوان زمینه پیش‌فرض Website می‌پذیرد، نه برای Admin یا Company.
- `COMPANY`: پنل شرکت و عملیات محدود به شرکت مربوط به access profile.
- `STAFF`: پنل مدیریت؛ عملیات مدیریتی همچنان به permission و محدوده هر عملیات نیاز دارد.

پروفایل هویتی، اطلاعات شخصی و زمینه برنامه در مدل‌های جدا هستند: `User`، `Profile` و `AccessProfile`. نام role به‌تنهایی مرز برنامه یا مالکیت داده نیست.

## فهرست ماژول‌ها و مسیرهای ثبت‌شده

تمام prefixهای زیر زیر `/api/v1` قرار دارند.

| ماژول | Prefix | سورس مرجع |
|---|---|---|
| احراز هویت و session | `/auth` | `backend/src/modules/auth/auth.routes.js` |
| کاربران | `/users` | `backend/src/modules/users/user.routes.js` |
| آدرس مشتری | `/addresses` | `backend/src/modules/addresses/address.routes.js` |
| نقش‌ها | `/roles` | `backend/src/modules/roles/role.routes.js` |
| مجوزها | `/permissions` | `backend/src/modules/permissions/permission.routes.js` |
| مدیریت سامانه | `/admin` | `backend/src/modules/admin/admin.routes.js` |
| تنظیمات | `/settings` | `backend/src/modules/settings/settings.routes.js` |
| شرکت‌ها | `/companies` | `backend/src/modules/companies/company.routes.js` |
| دسته‌بندی‌ها | `/categories` | `backend/src/modules/categories/category.routes.js` |
| محصولات | `/products` | `backend/src/modules/products/product.routes.js` |
| کتابخانه مشخصات | `/specification-library` | `backend/src/modules/specification-library/specification-library.routes.js` |
| استعلام، پاسخ و اشتراک | `/inquiries` | `backend/src/modules/inquiries/inquiry.routes.js` |
| اعلان‌ها و ترجیحات | `/settings/notifications` | `backend/src/modules/notifications/notification.routes.js` |

## عملیات مهم موجود

### احراز هویت

در `/api/v1/auth` مسیرهای ورود، ثبت‌نام مشتری/شرکت، refresh، logout، handoff/redeem، دریافت کاربر جاری و تغییر رمز عبور ثبت شده‌اند. قرارداد دقیق body، cookie و token را از `auth.routes.js` و `auth.schemas.js` بخوانید.

### کاربران و دسترسی‌ها

در `/api/v1/users` عملیات فهرست، ایجاد، مشاهده، ویرایش، حذف، تغییر وضعیت دسترسی و عملیات مربوط به شرکت ثبت شده‌اند. محدودیت مالکیت و زمینه دسترسی باید در route و service هر عملیات بررسی شود؛ پنهان‌کردن دکمه در frontend کافی نیست.

### آدرس‌های مشتری

- `GET /api/v1/addresses` فهرست آدرس‌های مشتری احراز هویت‌شده را می‌دهد.
- `POST /api/v1/addresses` آدرس جدید می‌سازد؛ نخستین آدرس به‌صورت خودکار پیش‌فرض می‌شود.
- `GET/PATCH/DELETE /api/v1/addresses/:id` فقط روی آدرس متعلق به همان کاربر کار می‌کند.
- `PATCH /api/v1/addresses/:id/default` آدرس پیش‌فرض را تغییر می‌دهد. حذف یا ویرایش پیش‌فرض نباید کاربر را بدون یک آدرس پیش‌فرض باقی بگذارد، اگر آدرس دیگری وجود داشته باشد.

### محصولات و قیمت

- `GET /api/v1/products` برای فهرست محصولات
- `GET /api/v1/products/:id` برای جزئیات محصول
- `GET /api/v1/products/:id/price-history` برای تاریخچه قیمت عمومی محصول مجاز

تاریخچه قیمت از snapshotهای ذخیره‌شده خوانده می‌شود؛ تاریخچه‌ای که پیش از ذخیره snapshot وجود نداشته نباید به‌صورت ساختگی بازسازی شود. دسترسی عمومی به محصول به وضعیت انتشار و visibility وابسته است.

### استعلام، پیشنهاد قیمت و درآمدزایی

ماژول `/api/v1/inquiries` مسیرهای فهرست/جزئیات استعلام، ایجاد و ویرایش، تغییر وضعیت، اقلام، پیام‌های خصوصی، پاسخ تأمین‌کننده، تصمیم خریدار، پیوست‌ها، طرح‌ها، سهمیه و وضعیت اشتراک را دربرمی‌گیرد. endpointها بر اساس نقش، مالکیت استعلام، زمینه COMPANY/CUSTOMER/STAFF، وضعیت lifecycle و در موارد مربوط entitlement اشتراک محدود می‌شوند.

درگاه پرداخت اشتراک فقط زمانی فعال است که تنظیمات معتبر محیطی فراهم باشد؛ تست CI جایگزین آزمون واقعی provider در staging نیست.

### اعلان‌ها

ماژول `/api/v1/settings/notifications` عملیات inbox، شمارنده خوانده‌نشده، تغییر وضعیت خواندن، حذف گروهی، پوشه‌ها و ترجیحات را ارائه می‌کند. مدیریت ارسال و پایش تحویل در مسیرهای مدیریتی قرار دارد. مالکیت گیرنده و scope پوشه باید در هر عملیات حفظ شود.

## امنیت و قراردادهای ضروری

1. permission سمت backend باید برای هر عملیات بررسی شود.
2. کنترل مالکیت resource باید در service هم برقرار باشد؛ `companyId` ارسالی از client به‌تنهایی قابل اعتماد نیست.
3. نقش SUPER_ADMIN مجوز عبور از زمینه برنامه یا مرزهای داده نیست. ورود به Admin به `AccessProfile.type=STAFF` و ورود به Company به `AccessProfile.type=COMPANY` نیاز دارد؛ `requireAccessType` و PKCE handoff این زمینه را حتی با wildcard permission بررسی می‌کنند. مالکیت tenant نیز باید در service کنترل شود.
4. حالت‌های SEALED و ANONYMOUS_SEALED نباید داده پاسخ رقبا را زودتر از زمان مجاز افشا کنند.
5. endpointهای عمومی باید فیلدهای مجاز را برگردانند و فیلدهای داخلی moderation/audit را حذف کنند.
6. تغییر schema یا مسیر باید با تست رگرسیون و مستندات متناظر همراه باشد.

## اجرای تست‌ها

از ریشه پروژه:

```bash
pnpm test
pnpm build
```

برای تست بک‌اند:

```bash
pnpm --dir backend test
```

این دستورات باید واقعاً اجرا شوند؛ درج آن‌ها در سند یا سبز بودن build به‌تنهایی اثبات‌کننده عملکرد محیط واقعی، ارسال ایمیل/SMS یا پرداخت نیست.
