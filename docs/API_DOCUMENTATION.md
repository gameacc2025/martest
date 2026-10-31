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

## فهرست کامل endpointها

فهرست تمام routeهای ثبت‌شده Fastify شامل متد HTTP، مسیر کامل زیر `/api/v1` و خلاصه guardهای دسترسی در [API_ROUTE_INVENTORY.md](./API_ROUTE_INVENTORY.md) قرار دارد. این فهرست از فایل‌های route ماژول‌ها استخراج شده و تست `backend/src/utils/api-route-inventory.test.js` بررسی می‌کند که هر route ثبت‌شده در مستندات حضور داشته باشد.

این inventory جایگزین schema اجرایی نیست: جزئیات body/query/params، response schema و validation همچنان در route/schemaهای منبع نگهداری می‌شوند.

## عملیات مهم موجود

### احراز هویت

در `/api/v1/auth` مسیرهای ورود، ثبت‌نام مشتری/شرکت، refresh، logout، handoff/redeem، دریافت کاربر جاری و تغییر رمز عبور ثبت شده‌اند. قرارداد دقیق body، cookie و token را از `auth.routes.js` و `auth.schemas.js` بخوانید. هر refresh JWT شامل `jti` تصادفی است تا صدورهای تکراری در یک ثانیه توکن یکسان نسازند؛ hash توکن refresh در دیتابیس ذخیره می‌شود.

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

درگاه پرداخت اشتراک فقط زمانی فعال است که تنظیمات معتبر محیطی فراهم باشد؛ callback باید authority را سمت سرور verify کند و replay برای اشتراک فعال/تأییدشده باید idempotent باشد. endpoint بررسی مجدد نیز فقط برای اشتراک متعلق به همان مالک و در وضعیت قابل بررسی مجاز است. تست CI جایگزین آزمون واقعی provider در staging نیست.

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


## اشتراک و پرداخت استعلام

- طرح‌ها از مسیرهای عمومی مجاز ماژول استعلام خوانده می‌شوند؛ ایجاد درخواست اشتراک فقط برای مالک مشتق‌شده از زمینه احراز هویت انجام می‌شود و شناسه مالک از body دریافت نمی‌شود.
- هر مالک (کاربر یا شرکت) می‌تواند هم‌زمان فقط یک درخواست اشتراک با وضعیت `PENDING_PAYMENT` داشته باشد؛ این قاعده در سرویس بک‌اند اجرا می‌شود و به محدودیت UI وابسته نیست.
- شماره پیگیری دستی به‌تنهایی پرداخت را تأیید نمی‌کند. فعال‌سازی آنلاین فقط پس از تأیید server-to-server درگاه انجام می‌شود؛ فعال‌سازی دستی مدیر نیز باید با تأیید صریح بررسی پرداخت همراه باشد.
- مسیر callback پرداخت عمومی است، اما فقط نتیجه‌ای را می‌پذیرد که با `Authority` ذخیره‌شده و پاسخ تأییدشدهٔ سمت سرور درگاه تطبیق داشته باشد. خطای موقت تأیید نباید اشتراک را فعال کند.


## یکپارچگی هم‌زمانی پاسخ‌های استعلام

عملیات ثبت، ویرایش، انصراف و تصمیم‌گیری درباره پاسخ استعلام باید در تراکنش، ردیف والد استعلام را با `SELECT ... FOR UPDATE` قفل کنند و سپس وضعیت استعلام را بخوانند. این ترتیب از ثبت پاسخ جدید یا تغییر پاسخ هم‌زمان با انتخاب پیشنهاد و بسته‌شدن استعلام جلوگیری می‌کند. انتخاب یک پیشنهاد، استعلام را می‌بندد و پاسخ‌های در انتظار دیگر را رد می‌کند؛ عملیات هم‌زمانی که پس از بسته‌شدن نوبت اجرا می‌گیرد باید وضعیت جدید را بخواند و رد شود.

این قفل‌گذاری جایگزین کنترل مجوز، مالکیت، مهلت پاسخ یا compare-and-set وضعیت پاسخ نیست؛ همه این کنترل‌ها همچنان لازم‌اند. تست‌های سرویس باید وجود قفل ردیف والد را برای ثبت پاسخ و تصمیم خریدار بررسی کنند.


### پاسخ تکراری شرکت به استعلام

برای هر ترکیب استعلام و شرکت فقط یک رکورد پاسخ مجاز است؛ این محدودیت در دیتابیس نیز با قید یکتای `(inquiryId, companyId)` اعمال می‌شود. ارسال دوباره از مسیر ایجاد پاسخ باید پیش از درج، پاسخ قبلی را بررسی کند و در صورت وجود آن با HTTP `409` و کد `RESPONSE_ALREADY_EXISTS` برگردد؛ خطای یکتایی Prisma نباید به خطای عمومی `500` تبدیل شود. اگر پاسخ قبلی هنوز قابل ویرایش باشد، باید از مسیر ویرایش پاسخ استفاده شود.


### هم‌زمانی callback پرداخت اشتراک

پس از تأیید سمت سرور زرین‌پال، callbackها برای یک مالک با قفل ردیف شرکت/کاربر سریال می‌شوند. وضعیت اشتراک باید **پس از گرفتن قفل** دوباره خوانده شود؛ callback دومی که هنگام انتظار، توسط callback اول فعال شده است باید همان اشتراک فعال و رسید پرداخت را با موفقیت برگرداند، نه اینکه تلاش کند اشتراک را دوباره فعال یا تمدید کند. قفل و خواندن مجدد مکمل compare-and-set روی وضعیت اشتراک و `paymentVerifiedAt` هستند.


### اعتبارسنجی دوره اشتراک هنگام مصرف سهمیه

مصرف سهمیه ابتدا اشتراک فعال را پیدا می‌کند، سپس ردیف اشتراک را قفل می‌کند و **پس از قفل** دوباره فعال‌بودن بازه زمانی را بررسی می‌کند. اگر اشتراک در حین انتظار برای قفل منقضی شده باشد، مصرف باید رد شود و هیچ رویداد مصرفی ثبت نشود. اگر اشتراک فعال مالک در مرز زمانی تغییر کرده باشد، ردیف جدید نیز باید قفل و دوباره بررسی شود؛ محدودیت سهمیه باید بر اساس اشتراک فعلی محاسبه شود، نه نتیجه خواندن پیش از قفل.


### مجوزهای چرخه پاسخ تأمین‌کننده

عملیات ایجاد پاسخ (`POST /api/v1/inquiries/:id/responses`)، ویرایش (`PATCH /api/v1/inquiries/:id/responses/:responseId`)، انصراف (`POST .../withdraw`)، بارگذاری پیوست (`POST .../attachments`) و حذف پیوست (`DELETE .../attachments/:attachmentId`) فقط در زمینه `COMPANY` و با مجوز `inquiries.respond` مجازند. مجوز مدیریتی `leads.update` یا wildcard نقش SUPER_ADMIN در زمینه STAFF به‌تنهایی اجازه ارسال پیشنهاد از طرف تأمین‌کننده را نمی‌دهد. این مرز پیش از اجرای controller اعمال می‌شود و کنترل مالکیت/شرکت در service نیز باید حفظ شود. تست‌های رگرسیون در `backend/src/modules/inquiries/inquiry.routes.test.js` این رد دسترسی را بررسی می‌کنند.


## Swagger/OpenAPI وضعیت پوشش — 2026-10-31

- تمام 149 route ماژولی در [API_ROUTE_INVENTORY.md](./API_ROUTE_INVENTORY.md) فهرست شده‌اند.
- در `openapi-route-docs.js` برای 89 از 149 مسیر توضیحات اختصاصی وجود دارد؛ 60 مسیر هنوز از summary/tagهای route source یا توضیحات عمومی استفاده می‌کنند و باید در مرحله بعد تکمیل شوند.
- 9 ورودی قدیمی که به مسیرهای ثبت‌نشده `orders` و `settings/preferences` اشاره می‌کردند حذف شدند. مسیر واقعی ترجیحات اعلان‌ها `/settings/notifications/preferences` است.
- مسیرهای بدون metadata اختصاصی اکنون به‌صورت پیش‌فرض bearerAuth می‌گیرند؛ مسیرهای عمومی در allow-list مشخص شده‌اند و refresh/logout از refresh-cookie scheme استفاده می‌کنند. Handoff redeem و callback پرداخت به‌عنوان مسیرهای بدون Bearer مستند شده‌اند.
- تست‌ها اکنون هم stale route-doc entries را رد می‌کنند و هم security schemeهای cookie/public/default را بررسی می‌کنند.


## OpenAPI route metadata coverage — 2026-10-31

- Dedicated OpenAPI prose metadata now covers all 149 registered module routes in `docs/API_ROUTE_INVENTORY.md`; no inventory route is missing a registry entry and no registry key points to an unregistered route.
- The 60 newly documented routes cover user access/company actions, customer addresses, assignable roles, category/subcategory browsing and management, product management/history/price history, specification library, inquiry subscription/admin workflows, private inquiry messaging/response decisions/attachments, and user/admin notification operations.
- Request schemas were copied only where route registration defines them. Routes without a source JSON schema are documented with their actual path/context/permission contract without fabricating a request schema. Response shapes remain generic where the handler does not expose a reusable response schema; this is route-description coverage, not a claim that every response is fully modeled.
- Added a reverse-coverage regression test: every route in the 149-row inventory must have an OpenAPI metadata entry. Existing tests also reject stale docs, duplicate keys, malformed entries and missing responses.


## Source-backed response contract pass — step 16B (2026-10-31)

- Added concrete OpenAPI response schemas derived from controller envelopes, Prisma selects and service return projections for customer address CRUD, notification list/read/bulk/folder operations, admin notification folders and delivery monitoring, inquiry plans/quota, and inquiry subscription/payment verification.
- Address responses now document the selected `Address` projection and the `{ data }` success envelope; address deletion remains 204 with no body.
- Notification list documents `{ data, meta }`, including nested folder memberships; unread count documents `{ count }`; read/delete and bulk actions document their exact `{ success }` / `{ success, count }` payloads; folder changes document the returned action and IDs.
- Delivery statistics document the exact totals/status/channel aggregates and recent failure projection. Delivery listing documents `{ data, meta }` while keeping row internals extensible until a stable public DTO is defined.
- Inquiry plan, quota, subscription, and payment retry responses document the service's selected fields and nullable ownership/payment states. Payment result includes success, failed, pending and cancelled outcomes.
- Generic response schemas remain only where the service/controller does not yet expose a stable projection or where raw model output is intentionally extensible.


## Response schema pass 16B — merged (2026-10-31)

PR #48 merged at `462aad8a518fea47025d116ccb8fc7e095b708b4`. CI passed 1,384 backend tests and 18 frontend/shared tests; frontend builds and migration validation passed.

The OpenAPI registry now contains source-backed response schemas for address CRUD, notification pagination/read/bulk/folder actions, admin notification folders and delivery statistics, inquiry active plans, quota, caller-owned subscriptions and payment verification. Contracts follow controller response envelopes, Prisma selects and service projections. The subscription creation response documents the narrower included plan fields returned by the payment service, distinct from the plan projection in subscription listing.


## Product and inquiry response contracts — step 16C (2026-10-31)

- Product price history documents the complete chronological public retail snapshot series (id, tier reference, quantity bounds, Decimal price, unit, action, recordedAt). It is not artificially limited to six months; the service returns all stored retail snapshots.
- Product status history and activity log document their actor/profile projections and their distinct status-transition vs immutable-activity fields.
- Inquiry messages document sender/recipient identity projections, read timestamps, the 500-message list cap, and optional SMS queue/skip outcome on send.
- Inquiry response list/create/update/withdraw schemas document response status, company projection, response items, requested product projection and attachment metadata. Anonymous sealed buyer responses may omit companyId and product companyId; the schema does not require either.
- Buyer decision endpoints return a minimal receipt `{ id, inquiryId, status }`, not a full supplier response. Attachment upload returns stored relative URL metadata; delete remains 204 without a body.


## Product and inquiry response schema pass 16C — merged (2026-10-31)

PR #49 merged at `d79b1908d899fc8569495e8925a00a3a0650080d`. CI passed 1,385 backend tests and 18 frontend/shared tests; builds and migration validation passed.

Product price snapshot/history/activity and inquiry messages/responses/items/attachments/decision receipts now have concrete response schemas derived from Prisma projections and services. Anonymous sealed buyer response projections omit supplier company IDs and nested product company IDs. Decision returns a minimal receipt; attachment URLs are relative upload paths.


## Admin, inquiry dashboard and product management response contracts — step 16D (2026-10-31)

- Admin inquiry subscription list documents its 100 newest rows and selected plan/company/user projections. Manual grant, offline activation and rejection return the corresponding subscription with its plan and compact owner projection.
- Notification delivery statistics document total counts, normalized status/channel maps and up to ten recent failure rows. Delivery listing documents persisted scalar `NotificationDelivery` fields and `{data,meta}` pagination.
- Inquiry statistics document caller-scoped sent/received/response aggregates, calculated response success rate and up to five recent inquiries/responses. STAFF aggregates are platform-wide; CUSTOMER/COMPANY results are scoped by the service.
- Inquiry listing documents pagination and company/count projections, including nullable company identity and optional response counts where confidential/sealed views redact them.
- Product management list/detail documents the management product projection and its relations; list pagination uses the shared `{data,meta}` envelope.


Step 16D merge verification: PR #50 merged at `96a972cb6c663952cb09d6c7a3d9c3d8b90ef2a1`. CI passed 1,386 backend tests and 18 frontend/shared tests; all frontend builds and database migration validation passed. Static route inventory coverage remains 149/149 with no missing or duplicate route keys.
