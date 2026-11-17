# Architecture Decisions — Accepted Constraints (Reviewable, Changes Require Approval)

> تصمیم‌های زیر مصوبات پذیرفته‌شده محصول/معماری هستند و تا زمان تغییر رسمی باید رعایت شوند. **بازبینی، ممیزی و بررسی تناقض با کد همیشه مجاز است**؛ اما تغییر یک تصمیم پذیرفته‌شده، به‌ویژه در حوزه کسب‌وکار، امنیت، داده یا معماری، فقط پس از ارائه شواهد، طرح اثرات و تأیید صریح مالک پروژه مجاز است.

## Frozen Rules

### AD-1 — CUSTOMER فقط خریدار است
- CUSTOMER هیچ Inquiry ثبت **نمی‌کند**.
- نقش `CUSTOMER_USER` نباید permissionهای `inquiries.create` یا `leads.create` داشته باشد.
- هیچ Route یا UI برای ثبت Inquiry توسط CUSTOMER نباید فعال باشد.

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

### AD-4 — Commerce فاز آینده B2C است (Disabled، نه Deleted)
- Cart / Checkout / Orders / Wishlist مربوط به فاز آینده B2C هستند.
- فعلاً **حذف نمی‌شوند**، فقط **غیرفعال** می‌شوند.
- هیچ Route فعال، هیچ UI فعال، و هیچ لینک/ارجاع فعالی به آن‌ها نباید وجود داشته باشد.

**Implementation drift found (2026-11-17):** `apps/website/src/router/index.js` currently registers the `/cart`, `/checkout`, and `/orders` routes. These active frontend route registrations conflict with this accepted decision even though the operational order/payment backend is not established by this inspection. Do not silently change the business decision or remove these routes as part of a documentation audit. The owner must decide whether to disable the routes/UI to enforce AD-4 or formally revise AD-4 to permit a clearly labelled prototype.

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
