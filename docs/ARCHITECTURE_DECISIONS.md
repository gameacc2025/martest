# Architecture Decisions and Current Contracts

> این سند تصمیم‌های معماری و قراردادهای جاری را خلاصه می‌کند. اگر سند با کد تفاوت داشت، route/service/schema/test جاری مرجع است و باید اختلاف در همین سند اصلاح شود. این سند مانع بازبینی امنیتی یا معماری مستندشده نیست.

## AD-1 — دامنه دسترسی مستقل از نقش است

- `AccessProfile.type` دامنه برنامه را مشخص می‌کند: `STAFF`, `COMPANY`, `CUSTOMER`.
- `Role.scope` دامنه نقش قابل‌تخصیص را مشخص می‌کند.
- Roleها permissionهای عملیاتی را اعطا می‌کنند؛ نام role به‌تنهایی مرز امنیتی نیست.
- `SUPER_ADMIN` دارای bypassهای مشخص در middleware مرکزی است؛ هر تغییر این رفتار باید تست مثبت/منفی داشته باشد.

## AD-2 — اتصال کاربر به شرکت از AccessProfile می‌آید

- `AccessProfile` حداکثر یک رکورد برای هر user دارد و می‌تواند `companyId` داشته باشد.
- سرویس‌ها باید مالکیت tenant را از پروفایل معتبر احراز کنند و companyId ارسالی کاربر را به‌تنهایی معتبر ندانند.
- هر تغییر به مدل عضویت شرکت باید با schema، migration و تست‌های isolation همراه شود.

## AD-3 — فرانت‌اند مرز امنیتی نیست

- Router guards و کنترل‌های UI برای تجربه کاربری‌اند.
- Backend route middleware و service-level ownership/permission checks مرجع تصمیم دسترسی‌اند.
- برای عملیات tenant-scoped تست با دو شرکت مستقل و شناسه متعلق به شرکت دیگر الزامی است.

## AD-4 — استعلام B2B دامنه جاری است

- مدل‌های `Inquiry`, `InquiryItem`, `InquiryResponse` و پیوست‌های پاسخ بخشی از schema فعلی هستند.
- Routeها بعضی جریان‌های inquiry را برای STAFF، COMPANY و CUSTOMER ثبت می‌کنند؛ ادعای «CUSTOMER هیچ استعلامی ایجاد نمی‌کند» با قرارداد فعلی سازگار نیست.
- مجوز دقیق create/read/update/respond و مالکیت هر استعلام باید از route، service و تست‌ها بررسی شود.

## AD-5 — تاریخچه قیمت فقط برای tier خرده‌فروشی است

- `ProductPriceTier` قیمت جاری را نگه می‌دارد.
- `ProductPriceSnapshot` فقط تغییرات tier با `minQuantity = 1` را برای نمودار ثبت می‌کند.
- تغییرات tier عمده‌فروشی و تغییر metadata بدون تغییر قیمت، نقطه نمودار ایجاد نمی‌کنند.
- endpoint عمومی تاریخچه فقط برای محصول منتشرشده و عمومی داده می‌دهد؛ تاریخچه پیش از فعال‌سازی snapshotها بازسازی نمی‌شود.

## AD-6 — سه اپ فرانت‌اند

- `apps/website`: سایت عمومی و CUSTOMER
- `apps/company`: پنل COMPANY
- `apps/admin`: پنل STAFF
- packageهای مشترک در `packages/` نگهداری می‌شوند؛ API در `backend/` و prefix آن `/api/v1` است.

## AD-7 — مرز قابلیت‌های تجارت

- Inquiry و پاسخ تأمین‌کننده جزو جریان B2B جاری هستند.
- وجود کد یا مسیر قدیمی cart/orders به‌تنهایی به معنی قابلیت فعال/پشتیبانی‌شده نیست؛ وضعیت هر قابلیت باید از route ثبت‌شده، UI متصل و تست‌ها تأیید شود.
- تغییر دامنه cart/checkout/payment نیازمند تصمیم جداگانه محصول و تست است.

## روال تغییر

1. کد route/service/schema و تست‌های موجود را بررسی کنید.
2. تغییر را با تست regression و تست منفی امنیتی همراه کنید.
3. migrationها را روی PostgreSQL واقعی آزمایش کنید.
4. گراف معماری را با `node scripts/generate-architecture-graph.mjs --write` بازسازی کنید.
5. مستندات، `.ai/WORKLOG.md` و `.ai/current-task.md` را به‌روز کنید.
