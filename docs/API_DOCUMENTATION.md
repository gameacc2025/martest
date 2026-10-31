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


## Company and category response contracts — step 16E (2026-10-31)

- Company list/detail/create/update/status/restore/verification/logo responses document company scalar fields, inquiry limits, key/value limits and relation counts. Company detail includes up to ten flattened user summaries; it does not expose password or auth-secret fields.
- Company settings responses document `inquiryLimit` and ordered `limits`. Company statistics document aggregate counts and up to five recent products/inquiries. Company product listing documents pagination and compact category/subcategory/company projections.
- Public category list/detail and management category list document category fields and nested subcategory summaries. Subcategory detail documents category and specification-template/field projections.
- Category product listing documents only published/public products and the actual paginated `{data,meta}` response.
- Company/category/subcategory DELETE endpoints document HTTP 204 with no response body (rather than a fictitious JSON message envelope).


## Users, RBAC, authentication and profile response contracts — step 16F (2026-10-31)

- User list/detail/create/update/access-state/company-move responses document safe identity fields, profile and access-profile context, plus role/permission arrays. Password hashes are excluded. List roles/permissions are names; detailed user reads and mutations return detailed role/permission records.
- Role CRUD documents role scope, permission-link projections and assigned-user counts. Assignable roles are intentionally compact (`id/name/label/scope`) and filtered by caller access type.
- Permission list documents its three actual modes: unpaginated array, `{all,grouped}` grouping, and paginated `{data,meta}`. Permission CRUD documents scalar permission fields.
- Login, refresh, current-user context, customer registration, company registration and PKCE handoff responses are modeled. Refresh tokens are never in JSON; they are carried only by the httpOnly cookie. Handoff create returns a one-time code with 60-second TTL; redeem returns a new access token and context.
- Profile settings document user identity, personal profile, access profile/company and role links; avatar upload returns `avatarUrl`; password/avatar operations return message receipts. Admin dashboard/settings include counts, five recent users, twenty pending products and review threshold.


## Admin monitoring and inquiry dashboard responses — step 16D (2026-10-31)

- `GET /admin/inquiry-subscriptions` returns `{data: [...]}` with at most 100 newest rows. Each row includes subscription scalar fields, a deliberately narrow plan projection (`id`, `code`, `name`, `price`, `durationDays`), company (`id`, `name`) and user (`id`, `phone`, `email`) projections. Expired ACTIVE subscriptions are marked EXPIRED before listing.
- `GET /admin/notifications/delivery-stats` returns `{data: {total, byStatus, byChannel, recentFailures}}`; status/channel buckets are complete zero-filled maps, and recent failures are capped at 10 with their operational error/retry fields.
- `GET /admin/notifications/deliveries` returns `{data, meta}`; delivery rows follow the complete `NotificationDelivery` Prisma model, including retry, provider, recipient snapshot and idempotency fields. `nextAttemptAt` is non-null.
- `GET /inquiries/stats` returns sent/received/response aggregates, a selected-vs-decided success rate, and at most five recent inquiries and five recent responses. It is scoped to buyer, supplier company or authorized STAFF context; buyer-facing sealed/anonymous-sealed response visibility/redaction follows the service rules.
- Runtime validation on PR #49 failed in the browser-smoke stage because the admin/company SPA origins returned `chrome-error://chromewebdata/` / `#app` never attached; API/CI unit and build checks passed. This is tracked separately as a compose/runtime startup issue, not misreported as a passing browser check.


## Step 16D merge — admin monitoring and inquiry dashboard contracts (2026-10-31)

PR #53 merged at `da0478df49eb256fdb5f40c179818a02a6f706fa`. CI passed with 1,389 backend tests and 18 frontend/shared tests; frontend builds and Prisma migration validation passed. Runtime compose/browser validation was still running at merge time and is not reported as passing.

Admin inquiry subscription list, notification delivery statistics/list, and inquiry dashboard statistics now have concrete response schemas grounded in their service projections. Subscription list cap is 100; delivery statistics include zero-filled status/channel buckets and ten recent failures; inquiry dashboard returns five recent inquiry/response records and preserves buyer-specific sealed/anonymous-sealed redaction.


## Core resource response contracts — step 16E (2026-10-31)

- Product management list/detail/create/update now describe the actual management `productInclude`: product scalars, compact company/category/subcategory projections, ordered price tiers/images/documents and up to ten status-history rows. Public catalog responses remain separate and do not inherit management-only creator/edit/moderation fields.
- Company list/detail/create/update now describe Company scalars, inquiry limit, usage limits and counts; detail flattens at most ten recent AccessProfile users into a safe user projection (id/email/status/timestamps/context/active/profile names/avatar).
- Inquiry list omits `buyerUserId`, keeps `_count.responses` optional because sealed views may redact it, and allows company identity to be null/omitted under confidentiality. Inquiry detail/create/update/status describe included items/products, supplier responses, status history, responseCount and responsesHidden while preserving sealed/anonymous-sealed filtering and identity redaction.
- Inquiry item list/create/update describe the compact requested-product/company projection.
- Admin notification folder list/create/update describe the full folder model. Announcement 202 response describes resolved recipients and per-channel in-app/email/SMS summary counts.
- Create endpoints use their actual `{data}` envelope and 201 status; announcement dispatch uses `{data}` with 202.


## Step 16E merge — core product, company, inquiry and notification responses (2026-10-31)

PR #54 merged at `8ab9acf25c1380e51fc840fa7d69ea42377971b4`. CI passed with 1,390 backend tests and 18 frontend/shared tests; all frontend builds and Prisma migration validation passed. Runtime compose/browser validation was still running at merge time and is not reported as passed.

Product management, company CRUD/list/detail, caller-shaped inquiry and inquiry item operations, notification folder management and admin announcement acceptance now have source-backed response contracts. Buyer identity and sealed/anonymous-sealed inquiry privacy rules remain explicit in the schemas.


## Company/category/product auxiliary responses — step 16F (2026-10-31)

- Company settings GET/PATCH return `{data: {inquiryLimit, limits}}`; company statistics return counts plus at most five recent products and five recent inquiries; company products return paginated Product rows with compact category/subcategory/company projections.
- Category public/manage lists include their respective active/all subcategory sets. Category detail includes full subcategory rows; subcategory detail includes its full category and optional specification template with ordered fields. Category products are paginated published/public Product rows with compact relations.
- Category/subcategory create/update responses now use their actual `{data}` envelopes; delete operations return HTTP 204 with no body.
- Specification-library search returns selected field metadata only (id/title/slug/type/defaultUnit/description), capped at 50; `/all` returns the same selected shape for all active fields.
- Product price-tier create/update, image upload/primary/sort, document upload and workflow transitions now describe their actual response DTOs. Product tier/image/document delete endpoints return HTTP 204 without a body. Retail price snapshot behavior is noted for tier mutations.


## Step 16F merge — company/category/product auxiliary responses (2026-10-31)

PR #55 merged at `306a82047e3226bf93660598dfcc1b29dcf0e1c5`. CI passed with 1,391 backend tests and 18 frontend/shared tests; frontend builds and Prisma migration validation passed. Runtime compose/browser validation was still running at merge time and is not reported as passed.

Company settings/statistics/products, category/subcategory CRUD and public browsing, specification-library search/all, and product price-tier/image/document/workflow response contracts are now documented. Delete operations for these auxiliary resources return 204 with no body.


## User/RBAC/settings/admin response contracts — step 16G (2026-10-31)

- User list returns `{data,meta}` with safe identity/profile/access fields and role/permission name arrays. User detail/create/update/access changes return detailed role and permission records. `passwordHash` and refresh-token data are never selected or documented.
- Role list supports either a plain `{data:[...]}` envelope or paginated `{data,meta}`. Role records follow `ROLE_SELECT`, including compact permission joins and `_count.users`; assignable roles are restricted to the caller scope and return only id/name/label/scope.
- Permission list supports plain, paginated and grouped forms. Permission records follow `PERMISSION_SELECT`; deletion returns a message envelope.
- Current-user settings profile returns user identity, profile, access profile/company and compact role assignments. Password change, avatar upload and avatar delete return their actual message/avatarUrl envelopes.
- Admin stats returns eight aggregate counts, up to five recent users and up to twenty pending products with compact company/category/creator projections. Admin settings expose only `productReviewEditThreshold`; inquiry monetization settings expose only `subscriptionEnforcement`.
- Admin inquiry plan CRUD follows the full InquiryPlan scalar model. Manual subscription grant/activate/reject responses include the full plan and only compact company/user owner projections. Online gateway payment cannot be manually activated.


## Step 16G merge — user/RBAC/settings/admin responses (2026-10-31)

PR #56 merged at `bebc3192440c9f3b66080a78384d627fdabb4e24`. CI passed with 1,392 backend tests and 18 frontend/shared tests; frontend builds and Prisma migration validation passed. Runtime compose/browser validation was pending at merge time and is not reported as passing.

User and role/permission response variants, current-user settings profile/password/avatar responses, admin stats/system settings/inquiry monetization, inquiry plan CRUD and manual subscription action responses now have source-backed schemas. Password hashes and refresh tokens are explicitly excluded.


## Step 16H — auth, notification and lifecycle response contracts (2026-10-31)

- Customer registration returns `data.message`, safe user identity, personal profile, `accessProfile: null` and `roles: [CUSTOMER_USER]`. Company registration returns pending company/manager plus inactive COMPANY access profile; roles are not assigned during public registration. Password hashes are never returned.
- PKCE handoff creation returns a 60-second one-time code. Redeem returns access token and safe user/access context; refresh token is only set as an httpOnly cookie. Logout and logout-all return `data.message`.
- Notification preference GET/PATCH return direct `{data,smsAvailable}` (not the standard nested success envelope); SMS availability is currently false. Folder listing includes `isSystem` and `sortOrder`.
- Company restore/status/verification/logo operations return a success envelope around the company scalar record. Company DELETE is 204 with no body.
- Product submit-review/approve/reject/publish/hide/archive/restore-draft return the updated managed product projection with related company/category/prices/images/documents and latest ten status-history rows. Product DELETE is 204 with no body.
- Structural tests assert response envelopes, critical fields, secret omissions and no-body delete statuses. CI/migration validation pending.


## Step 16H merge — auth, notifications and lifecycle (2026-10-31)

PR #57 merged at `415b6858a9f34235f6cf726a558d76afb5b92af4`. CI passed with 1,393 backend tests and 18 frontend/shared tests; all frontend builds and Prisma migration validation passed. Runtime compose/browser validation was queued at merge and is not reported as passing.

Customer registration, company registration, PKCE handoff create/redeem and logout response DTOs now match the auth controllers/services. Refresh tokens are documented as httpOnly-cookie-only. Notification preferences document the direct `{data,smsAvailable:false}` response; folder list includes `isSystem` and `sortOrder`. Company restore/status/verification/logo and product status workflow responses are source-backed. Company and product soft deletes correctly document 204 with no body. Structural response contract tests cover these cases.


## Step 16I — global error and status response contracts (2026-10-31)

- Global error responses document 409 conflicts (including Prisma duplicate keys), 413 oversized request/file uploads, and 429 rate limits.
- Standard application errors use `{error:{code,message,details?}}`; development-only 500 diagnostics may include `debug` and `stack`, while production never returns those fields.
- Rate limiting is normalized by the central error handler to the standard `{error:{code:'APP_ERROR',message}}` envelope with HTTP 429; it does not expose Fastify's internal rate-limit Error object.
- Swagger and security tests cover the response status/schema contracts. CI/migration validation pending.


## Step 16I merge — global error/status responses (2026-10-31)

PR #58 merged at `4ee4dbca6486588af34eda4ed9a22a809a7cb73d`. CI passed 1,393 backend tests and 18 frontend/shared tests; all frontend builds and Prisma migration validation passed.

OpenAPI global responses now include 409 conflicts, 413 oversized request/file uploads and 429 rate limits. All use the standard ErrorResponse schema. Rate-limit exceptions pass through the central handler and return HTTP 429 with `error.code=APP_ERROR` and the rate-limit message. Optional debug/stack fields are documented for development-only 500 responses and are never returned in production.


## Step 16J — generated OpenAPI route coverage audit (2026-10-31)

An app-level integration test now compares the generated `/docs/json` document from the real Fastify plugin/route registration chain against all 149 route inventory entries. It checks method/path coverage, parameter path normalization, effective bearer/cookie/public security metadata, global error response status coverage, and bodyless 204 operations.


## Step 16J merge — generated OpenAPI route verification (2026-10-31)

PR #59 merged at `28b9d1035689b099f18cbd711c56bd4b8bae7e3e`. CI passed 1,394 backend tests and 18 frontend/shared tests; all frontend builds and Prisma migration validation passed.

The real Fastify `/docs/json` output is now checked against all 149 route inventory entries, effective auth/security metadata, global error statuses and empty-body 204 responses. Fastify root routes may render with a trailing slash (for example `/users/`). All 13 204 responses use `type: 'null'`, the supported `@fastify/swagger` empty-body response form.


## Step 16K — admin notification delivery query filters (2026-10-31)

Both GET `/api/v1/admin/notifications/delivery-stats` and GET `/api/v1/admin/notifications/deliveries` document the query fields actually consumed by the controller: `status`, `channel`, `eventType`, `userId`, `page`, and `limit`. Status/channel values are enumerated; page/limit are positive integers with defaults 1/20. `from` and `to` are intentionally excluded because the controller does not pass them to the delivery service. No maximum limit is documented because the service does not enforce one.


## احراز هویت، اعلان‌ها و چرخه عمر منابع — مرحله ۱۶H (2026-10-31)

- ثبت‌نام مشتری با `201` و envelope استاندارد `data` برمی‌گردد؛ مشتری `AccessProfile` ندارد و نقش پیش‌فرض `CUSTOMER_USER` است. ثبت‌نام شرکت نیز `201` است؛ شرکت و کاربر مدیر در وضعیت انتظار ساخته می‌شوند و `AccessProfile` شرکت غیرفعال است. هیچ‌یک از پاسخ‌ها hash رمز عبور یا refresh token را افشا نمی‌کنند.
- ورود، تمدید نشست، `GET /auth/me` و handoff/redeem دارای schema پاسخ مجزا هستند. access token فقط در بدنه JSON است؛ refresh token فقط در کوکی `httpOnly` قرار می‌گیرد. کد handoff یک‌بارمصرف و ۶۰ ثانیه‌ای است.
- تنظیمات اعلان‌ها عمداً envelope متفاوتی دارد: `{ data, smsAvailable }` مستقیم، نه `{ data: ... }` تو در تو. کانال‌های `IN_APP`، `EMAIL` و `SMS` همراه مقدار مؤثر و پیش‌فرض مستند شده‌اند؛ `smsAvailable` فعلاً `false` است.
- فهرست اعلان‌ها مستقیم `{ data, meta }` برمی‌گرداند؛ شمارنده خوانده‌نشده مستقیم `{ count }` است؛ عملیات گروهی `{ success, count }` و تغییر پوشه `{ success, action, notificationId, folderId }` برمی‌گرداند. پوشه‌های کاربر بر اساس دامنه توکن فیلتر می‌شوند و شامل `isSystem` و `sortOrder` هستند.
- تغییر وضعیت، بازیابی و تغییر لوگوی شرکت، رکورد شرکت را در `data` برمی‌گردانند. حذف شرکت و حذف نرم محصول هر دو `204` بدون بدنه‌اند. عملیات گردش وضعیت محصول `200` و محصول مدیریت‌شده با تاریخچه وضعیت را برمی‌گردانند.
- تست‌های قرارداد پاسخ، نبود refresh token/hash رمز در خروجی، envelopeهای مستقیم اعلان‌ها، و کدهای `204` بدون بدنه را پوشش می‌دهند.
