# مستندات پایگاه داده — Telecom Marketplace

## مرجع و نسخه

- مرجع مدل‌ها: `backend/prisma/schema.prisma`
- مرجع تغییرات قابل اعمال: `backend/prisma/migrations/*/migration.sql`
- provider: PostgreSQL
- ORM/client: Prisma / `@prisma/client` 6.x
- image فعلی Compose: `postgres:18.4-bookworm`
- هر تغییر schema باید migration متناظر داشته باشد؛ ویرایش schema به‌تنهایی دیتابیس را تغییر نمی‌دهد.

## مدل‌های جاری

مدل‌های تعریف‌شده در schema فعلی:

- **RBAC و نشست:** `Role`, `Permission`, `RolePermission`, `UserRole`, `AccessProfile`, `Profile`, `RefreshToken`, `HandoffCode`
- **شرکت و کاربران:** `User`, `Company`
- **کاتالوگ:** `Category`, `Subcategory`, `SpecificationTemplate`, `SpecificationField`, `SpecificationLibraryField`
- **محصول و audit:** `Product`, `ProductStatusHistory`, `ProductActivityLog`, `ProductImage`, `ProductDocument`, `ProductPriceTier`, `ProductPriceSnapshot`
- **استعلام B2B:** `Inquiry`, `InquiryStatusHistory`, `InquiryItem`, `InquiryResponse`, `InquiryResponseAttachment`, `InquiryResponseItem`, `CompanyInquiryLimit`, `CompanyLimit`
- **تنظیمات و اعلان:** `SystemSetting`, `Notification`, `NotificationFolder`, `NotificationFolderMembership`, `NotificationPreference`, `NotificationDelivery`

Enums نیز در schema تعریف شده‌اند؛ برای مقادیر دقیق و جاری به خود schema رجوع کنید و enumهای قدیمی مستندات را کپی نکنید.

## مدل دسترسی

- `AccessProfile.type` از نوع `AccessProfileType` و یکی از دامنه‌های STAFF / COMPANY / CUSTOMER است.
- `AccessProfile.companyId` محدوده شرکت را برای پروفایل COMPANY مشخص می‌کند.
- `Role.scope` از نوع `RoleScope` است و دامنه نقش را مستقل از نام نمایشی/ماشین‌خوان نگه می‌دارد.
- `RolePermission` و `UserRole` روابط چندبه‌چند را نگه می‌دارند.
- ساختار واقعی ستون‌ها، nullable بودن، کلیدهای خارجی، cascade و indexها فقط از schema/migration قابل تعیین است؛ مثال‌های قدیمی این سند مرجع schema نیستند.

## قیمت محصول و تاریخچه

- `ProductPriceTier` ردیف قیمت فعلی را نگه می‌دارد؛ هر tier دارای `minQuantity`، قیمت و فیلدهای بازه/واحد تعریف‌شده در schema است.
- `ProductPriceSnapshot` رویدادهای تاریخچه قیمت را نگه می‌دارد.
- برای نمودار عمومی، فقط tier خرده‌فروشی با `minQuantity = 1` ثبت می‌شود.
- تغییر قیمت عمده‌فروشی و ویرایش metadata بدون تغییر مبلغ، نقطه نمودار نمی‌سازد.
- create/update/delete و جایگزینی tier در مسیرهای قیمت با منطق تراکنشی سرویس محصول هماهنگ شده‌اند تا رویداد تکراری تولید نشود.
- API عمومی تاریخچه فقط برای محصول منتشرشده و با visibility عمومی پاسخ می‌دهد و کل سری ذخیره‌شده را صعودی برمی‌گرداند؛ UI می‌تواند پنجره شش‌ماهه را نمایش دهد.
- تاریخچه قبل از فعال‌شدن snapshotها قابل بازیابی خودکار نیست و نباید با داده ساختگی پر شود.

## اعلان‌ها و پوشه‌ها

- `Notification` پیام/اعلان داخل برنامه را نگه می‌دارد.
- `NotificationFolder` و `NotificationFolderMembership` مدل پوشه و عضویت اعلان در پوشه‌ها را پیاده می‌کنند.
- `NotificationPreference` ترجیحات کاربر را برای event/channel نگه می‌دارد.
- `NotificationDelivery` وضعیت تحویل کانال‌های بیرونی از جمله email را ردیابی می‌کند.
- وجود فیلدهای پیکربندی SMS به معنی پیاده‌سازی dispatch واقعی SMS نیست؛ سرویس فعلی SMS را not implemented گزارش می‌کند.

## Migration workflow

### توسعه

```bash
cd backend
npm ci
npx prisma validate
npx prisma generate
npx prisma migrate dev --name describe_change
```

### محیط آزمایشی/عملیاتی

```bash
cd backend
npx prisma migrate deploy
npx prisma migrate status
```

`migrate deploy` migrationهای version-control شده را اعمال می‌کند و migration جدید تولید نمی‌کند. پیش از production، backup و plan بازگشت مستقل از migration تهیه کنید. از `migrate reset` روی داده‌های واقعی استفاده نکنید.

## تأیید migrationها روی PostgreSQL واقعی

تست unit و `prisma generate` اثبات نمی‌کند SQL migrationها روی PostgreSQL اجرا می‌شوند. روند قابل تکرار پیشنهادی:

1. دیتابیس PostgreSQL ایزوله با همان major version هدف بالا بیاورید.
2. `DATABASE_URL` آزمایشی را تنظیم کنید.
3. `npx prisma migrate deploy` را اجرا کنید.
4. `npx prisma migrate status` و `npx prisma validate` را بررسی کنید.
5. همین مراحل در CI اجرا شوند؛ موفقیت تنها پس از دیدن خروجی واقعی ثبت شود.

## اصول تغییر schema

- مدل/field/enum را در `schema.prisma` اصلاح کنید.
- migration ایجاد و SQL آن را بازبینی کنید.
- برای تغییرات مخرب، migration سازگار مرحله‌ای طراحی کنید.
- seed باید idempotent بماند و از ثبت secret در git خودداری شود.
- تست‌های سرویس و CI را اجرا و این سند را در صورت تغییر رفتار دامنه به‌روزرسانی کنید.
