# Architecture Decisions — Accepted Constraints (Reviewable, Changes Require Approval)

> تصمیم‌های زیر مصوبات پذیرفته‌شده محصول/معماری هستند و تا زمان تغییر رسمی باید رعایت شوند. **بازبینی، ممیزی و بررسی تناقض با کد همیشه مجاز است**؛ اما تغییر یک تصمیم پذیرفته‌شده، به‌ویژه در حوزه کسب‌وکار، امنیت، داده یا معماری، فقط پس از ارائه شواهد، طرح اثرات و تأیید صریح مالک پروژه مجاز است.

## Frozen Rules

### AD-1 — CUSTOMER فقط خریدار است
- CUSTOMER هیچ Inquiry ثبت **نمی‌کند**.
- نقش `CUSTOMER_USER` نباید permissionهای `inquiries.create` یا `leads.create` داشته باشد.
- هیچ Route یا UI برای ثبت Inquiry توسط CUSTOMER نباید فعال باشد.

**Owner authorization and remediation (2026-11-18):** The owner authorized project-wide correction against accepted decisions. `CUSTOMER_USER` no longer receives `leads.create` / `inquiries.create`; the inquiry POST route accepts only STAFF/COMPANY; `createInquiry()` independently rejects CUSTOMER contexts; the Website product CTA is hidden for CUSTOMER; and the empty state no longer directs customers to create an RFQ. Customers retain read/ownership-checked actions on existing inquiries using `inquiries.read`. AD-1 itself is unchanged.

### AD-2 — هر User فقط متعلق به یک Company است
- Multi Company Membership وجود **ندارد**.
- رابطه User→Company یک‌به‌چند از سمت Company است (هر User حداکثر یک `companyId`).
- هیچ ساختار عضویت چندگانه (membership table چند‌شرکتی) اضافه نمی‌شود.

### AD-3 — Company Panel اجازه مدیریت کاربران را ندارد
- Company Panel **نمی‌تواند** کاربر ایجاد، حذف یا ویرایش کند.
- فقط می‌تواند:
  - لیست کاربران شرکت را **مشاهده** کند (`users.read` محدود به شرکت خود).
  - کاربران را **فعال/غیرفعال** کند (`users.activate` / `users.deactivate` محدود به شرکت خود).
- permissionهای `users.create`، `users.update`، `users.delete`، `users.assign_roles` نباید در نقش‌های COMPANY باشند.

**Owner authorization and remediation (2026-11-18):** The seed no longer grants `users.create`, `users.update`, `users.delete`, or `users.assign_roles` to COMPANY roles. It also idempotently deletes any existing COMPANY `RolePermission` rows for those permissions, so previously seeded databases are reconciled on the next seed run. `users.read`, `users.activate`, and `users.deactivate` remain available within the service's company-ownership checks. Existing service guards and tests remain in place. AD-3 is unchanged.

### AD-4 — Commerce فاز آینده B2C است (Disabled، نه Deleted)
- Cart / Checkout / Orders / Wishlist مربوط به فاز آینده B2C هستند.
- فعلاً **حذف نمی‌شوند**، فقط **غیرفعال** می‌شوند.
- هیچ Route فعال، هیچ UI فعال، و هیچ لینک/ارجاع فعالی به آن‌ها نباید وجود داشته باشد.

**Owner authorization and remediation (2026-11-18):** The Website no longer registers `/cart`, `/checkout`, or `/orders`; its global cart drawer, header entry points and order-menu link were removed. Cart actions were also removed from Home, ProductListing, SearchResults and CompanyProfile; the shared ProductCard hides cart/wishlist controls by default and the Website opts out explicitly. Admin `/orders` and `/retail/orders` routes, Company `/retail/orders`, and their dashboard quick links were also disabled. `ShoppingCart.vue`, `Checkout.vue`, both retail-order page components, cart/wishlist stores and related components remain dormant future-phase code. No active Wishlist route was present. AD-4 is unchanged.

### AD-5 — بدون تغییر معماریِ تأییدنشده
- ممیزی، تحلیل، مقایسه تصمیم‌ها با کد واقعی و پیشنهاد اصلاح همواره مجاز است؛ به‌ویژه وقتی مالک پروژه آن را درخواست کرده باشد.
- تغییر معماری یا Refactor پرریسک بدون شواهد، برنامه اثرات، طرح بازگشت و تأیید صریح مالک انجام نمی‌شود.
- در صورت اختلاف این سند با implementation، تناقض باید گزارش شود؛ این سند به‌تنهایی اثبات‌کننده رفتار فعلی کد نیست.

### AD-6 — AccessProfile.type مرز قطعی پنل است
- نقش `SUPER_ADMIN` نمی‌تواند با وجود wildcard permission از بررسی زمینه برنامه عبور کند.
- ورود به Admin نیازمند `AccessProfile.type = STAFF` و ورود به Company نیازمند `AccessProfile.type = COMPANY` است.
- ثبت‌نام CUSTOMER طبق قرارداد فعلی `AccessProfile` ندارد؛ فقط `CUSTOMER_USER` بدون AccessProfile می‌تواند از زمینه پیش‌فرض Website استفاده کند. این fallback هرگز دسترسی STAFF/COMPANY نمی‌دهد و برای SUPER_ADMIN معتبر نیست.
- middleware عمومی `requireAccessType` و PKCE handoff باید این مرز را در هر مرحله enforce کنند.
- عملیات سراسری با AccessProfile مناسب STAFF و permissionهای لازم انجام می‌شود؛ role membership به‌تنهایی زمینه کاربر را تغییر نمی‌دهد.
- تست‌های auth، RBAC و handoff باید دسترسی مجاز، زمینه ناسازگار، AccessProfile غایب و access غیرفعال را پوشش دهند.

## Workflow اجرای کار
برای هر Task/Slice:
1. دامنه، مالک فایل‌ها، معیار پذیرش و شواهد موردنیاز ثبت می‌شود.
2. کد، تست‌ها، API/permission contract و تصمیم‌های مرتبط بررسی می‌شوند.
3. برای تغییرات پرریسک یا مبهم (schema/data، migration، auth/security، permission، payment/finance، deployment، business rules یا refactor گسترده) برنامه اثرات و rollback ارائه و پیش از اجرا تأیید مالک گرفته می‌شود.
4. تغییرات کوچک، برگشت‌پذیر و روشن پس از ثبت برنامه کوتاه اجرا می‌شوند؛ تأیید اضافی غیرضروری ایجاد نمی‌شود.
5. تست‌های متناسب اجرا، diff بازبینی و مستندات/WORKLOG به‌روز می‌شوند.
6. Lead تغییر تأییدشده و تست‌شده را طبق سیاست main-only در شاخه `main` ثبت و منتشر می‌کند؛ Workerها commit/push نمی‌کنند.
