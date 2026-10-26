# مرجع API — Telecom Marketplace

> مرجع این سند: ثبت مسیرها در `backend/src/app.js`، فایل‌های `*.routes.js` و schemaهای همان ماژول. در صورت اختلاف، کد جاری مرجع نهایی است. این سند مسیرهای ثبت‌شده و قراردادهای سطح بالا را خلاصه می‌کند؛ برای جزئیات دقیق اعتبارسنجی، Swagger/OpenAPI تولیدشده از route schemaها را در محیط اجرا بررسی کنید.

## پایه و قرارداد عمومی

- پایه API: `/api/v1`
- سلامت سرویس: `GET /health` (بدون احراز هویت)
- مستندات OpenAPI/Swagger توسط `backend/src/plugins/swagger.plugin.js` ثبت می‌شود؛ آدرس دقیق UI را از همان فایل/تنظیمات runtime بگیرید.
- بدنه‌های JSON با `Content-Type: application/json` ارسال شوند؛ آپلودها از multipart استفاده می‌کنند.
- مسیرهای محافظت‌شده به access token نیاز دارند؛ معمولاً در `Authorization: Bearer <token>`.
- refresh/logout از cookie و محافظت Origin نیز استفاده می‌کنند؛ به قرارداد route و تنظیمات `ALLOWED_ORIGINS` توجه کنید.
- CORS در production از `ALLOWED_ORIGINS` و در توسعه از تنظیم توسعه پیروی می‌کند.
- خطاها به‌وسیله error-handler مرکزی قالب‌بندی می‌شوند؛ پاسخ و کد HTTP واقعی route را مبنا قرار دهید و قالب قدیمی `status/data/meta` را برای همه endpointها فرض نکنید.
- validation مبتنی بر Fastify schema است؛ فیلدهای ناشناخته در body ممکن است حذف شوند و queryها می‌توانند به نوع تعریف‌شده تبدیل شوند.

## احراز هویت — `/auth`

| Method | Path | کاربرد |
|---|---|---|
| POST | `/auth/login` | ورود با شماره تلفن و رمز |
| POST | `/auth/register` | ثبت‌نام CUSTOMER |
| POST | `/auth/register-company` | ثبت‌نام شرکت و مدیر آن؛ نیازمند تأیید |
| POST | `/auth/refresh` | تمدید access token با refresh cookie |
| POST | `/auth/logout` | خروج از نشست فعلی |
| POST | `/auth/logout-all` | خروج از همه نشست‌ها |
| POST | `/auth/handoff` | صدور کد handoff یک‌بارمصرف |
| POST | `/auth/handoff/redeem` | مصرف کد handoff |
| GET | `/auth/me` | کاربر و دسترسی فعلی |
| PATCH | `/auth/users/:id/password` | تغییر رمز کاربر دیگر طبق مجوز route |

ورود و ثبت‌نام rate limit اختصاصی دارند. پاسخ ورود از user/profile/accessProfile/roles/permissions تشکیل می‌شود؛ پاسخ قدیمی با user تخت‌شده و نقش‌های قدیمی را فرض نکنید.

## کاربران — `/users`

- `GET /` فهرست کاربران
- `POST /` ایجاد کاربر
- `GET /:id` جزئیات
- `PATCH /:id` ویرایش
- `PATCH /:id/access` تغییر دسترسی/نقش‌ها
- `PATCH /:id/access-active` فعال/غیرفعال‌کردن access profile
- `PATCH /:id/company` تغییر اتصال شرکت
- `DELETE /:id` حذف طبق منطق سرویس و مجوزها

جزئیات pagination، فیلترها و schema بدنه را از `backend/src/modules/users/user.routes.js` و `user.schemas.js` بگیرید.

## آدرس‌های مشتری — `/addresses`

تمام مسیرهای این بخش نیازمند احراز هویت و `AccessProfile.type = CUSTOMER` هستند. هر درخواست با شناسه کاربر جاری scope می‌شود؛ شناسه آدرس به‌تنهایی دسترسی به داده کاربر دیگر نمی‌دهد.

| Method | Path | کاربرد |
|---|---|---|
| GET | `/addresses` | فهرست آدرس‌های کاربر جاری؛ آدرس پیش‌فرض ابتدا نمایش داده می‌شود |
| POST | `/addresses` | ایجاد آدرس؛ اولین آدرس به‌طور خودکار پیش‌فرض می‌شود |
| GET | `/addresses/:id` | مشاهده آدرس متعلق به کاربر جاری |
| PATCH | `/addresses/:id` | ویرایش فیلدهای آدرس |
| PATCH | `/addresses/:id/default` | انتخاب آدرس پیش‌فرض |
| DELETE | `/addresses/:id` | حذف آدرس؛ در صورت حذف آدرس پیش‌فرض، یکی از آدرس‌های باقی‌مانده جایگزین می‌شود |

فیلدهای آدرس شامل عنوان، نام و شماره تماس تحویل‌گیرنده، استان، شهر، نشانی کامل، کد پستی و نشانگر پیش‌فرض هستند. حذف کاربر باعث حذف آدرس‌های وابسته از طریق foreign key با cascade می‌شود.

## نقش‌ها و مجوزها

- `/roles`: `GET /`, `GET /assignable`, `POST /`, `GET /:id`, `PATCH /:id`, `DELETE /:id`
- `/permissions`: `GET /`, `GET /:id`, `POST /`, `PATCH /:id`, `DELETE /:id`

RBAC بر دو مفهوم مستقل استوار است: `AccessProfile.type` (STAFF / COMPANY / CUSTOMER) مرز پنل/دامنه را مشخص می‌کند و مجوزهای role دسترسی عملیاتی را می‌دهند. در کد فعلی middleware مرکزی برای routeهای محافظت‌شده استفاده می‌شود؛ مجوزها را صرفاً از نام role استنتاج نکنید.

## شرکت‌ها — `/companies`

مسیرهای ثبت‌شده شامل فهرست و جزئیات، محصولات شرکت، تنظیمات و آمار، ایجاد/ویرایش/حذف، restore، تغییر status، تأیید، لوگو و تنظیمات شرکت است. مسیرهای مدیریتی و محدودیت مالکیت در `company.routes.js` و `company.service.js` تعیین می‌شوند؛ دسترسی به شناسه شرکت به‌تنهایی مجوز دسترسی به داده نیست.

## دسته‌بندی‌ها — `/categories`

- `GET /`, `GET /:id`, `GET /:id/products`
- `GET /:id/subcategories`, `GET /:id/subcategories/:subId`
- مسیرهای مدیریت دسته‌بندی و زیردسته‌ها در route ثبت شده‌اند و نیازمند STAFF و مجوزهای مربوط هستند.

## محصولات — `/products`

- مسیرهای عمومی/مدیریتی فهرست و جزئیات در `product.routes.js` تعریف شده‌اند.
- `GET /:id/price-history`: سری کامل snapshotهای ذخیره‌شده قیمت خرده‌فروشی برای محصول منتشرشده و عمومی، به ترتیب زمانی صعودی. این endpoint تاریخچه‌ای را که قبل از فعال‌شدن snapshotها وجود نداشته بازسازی نمی‌کند.
- قیمت تاریخچه نمودار فقط tier خرده‌فروشی با `minQuantity = 1` است؛ تغییرات عمده‌فروشی و تغییر metadata بدون تغییر قیمت، نقطه جدید ایجاد نمی‌کنند.
- مسیرهای create/update/status/publication/media/documents و مجوزهای آن‌ها را مستقیماً در `product.routes.js` و سرویس محصول بررسی کنید. مالکیت شرکت در لایه سرویس نیز کنترل می‌شود.

## کتابخانه مشخصات — `/specification-library`

- `GET /`
- `GET /all`

مدل‌های template/field و مجوزهای مدیریتی در route و schema مربوط تعیین می‌شوند.

## استعلام‌های B2B — `/inquiries`

مسیرهای ثبت‌شده شامل list/stats/detail، create/update، مدیریت آیتم‌ها، تغییر وضعیت، دریافت/ثبت/ویرایش/انصراف از پاسخ و آپلود/حذف attachment پاسخ هستند. قرارداد دقیق وضعیت‌ها و visibility در `inquiry.routes.js` و `inquiry.service.js` است. مالکیت و دسترسی به استعلام/پاسخ باید از سرویس پیروی کند؛ نقش CUSTOMER در برخی جریان‌های inquiry مجاز است، بنابراین از اسناد قدیمی که این دامنه را به‌طور مطلق ممنوع می‌کنند پیروی نکنید.

## اعلان‌ها

مسیر کاربر: `/settings/notifications`

- `GET /`, `GET /unread-count`, `GET /folders`
- `POST /bulk-read-state`, `POST /bulk-delete`
- `POST /:id/folders` برای copy/move با app و folder مشخص
- `PATCH /:id/read-state`, `PATCH /:id/read`, `PATCH /read-all`, `DELETE /:id`
- `GET /preferences`, `PATCH /preferences`

مسیرهای مدیریتی اعلان زیر `/admin` قرار دارند: ارسال اعلان، مدیریت folderها، آمار تحویل و فهرست delivery. کانال SMS در وضعیت فعلی پیاده‌سازی‌شده محسوب نمی‌شود؛ پیکربندی Twilio به‌تنهایی به معنی ارسال SMS نیست.

## تنظیمات و داشبورد مدیریت

- `/settings/profile`: GET/PATCH
- `/settings/profile/avatar`: POST/DELETE
- `/settings/change-password`: PATCH
- `/admin/stats`: GET
- `/admin/settings`: GET
- `/admin/settings/product-review-threshold`: PATCH

## نمونه درخواست سلامت

```bash
curl -i http://localhost:3000/health
```

## قواعد نگهداری سند

1. مسیرها را از `backend/src/app.js` و فایل‌های `*.routes.js` استخراج و با Swagger مقایسه کنید.
2. نمونه پاسخ را فقط پس از بررسی controller/schema بنویسید؛ شکل واحدی برای تمام پاسخ‌ها فرض نکنید.
3. تغییر مجوزها باید همراه با تست route/service و بازبینی `docs/role-access-matrix.md` باشد.
4. برای تاریخچه قیمت، معیار حقیقت `ProductPriceSnapshot`، سرویس محصول و تست‌های آن هستند.
