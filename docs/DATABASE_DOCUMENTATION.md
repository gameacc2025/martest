# مستندات پایگاه داده — Telecom Marketplace

## منبع حقیقت

مدل‌های زیر از `backend/prisma/schema.prisma` فعلی فهرست شده‌اند. در صورت اختلاف با این سند، Prisma schema و migrationهای `backend/prisma/migrations/` مرجع نهایی هستند. این پروژه از PostgreSQL و Prisma Client استفاده می‌کند؛ image فعلی production در `docker-compose.yml` برابر PostgreSQL 18.4 است.

اتصال با متغیر `DATABASE_URL` انجام می‌شود:

```text
postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public
```

هرگز مقدار واقعی credential را در مستندات یا commit قرار ندهید.

## هویت، زمینه دسترسی و RBAC

| مدل | مسئولیت |
|---|---|
| `User` | هویت ورود و وضعیت حساب |
| `Profile` | اطلاعات شخصی مانند نام و تصویر |
| `AccessProfile` | زمینه دسترسی برنامه، نوع CUSTOMER/COMPANY/STAFF، وضعیت فعال و companyId |
| `Role` / `RoleScope` | نقش و زمینه‌ای که نقش به آن تعلق دارد |
| `Permission` | مجوز عملیاتی |
| `RolePermission` | رابطه نقش و مجوز |
| `UserRole` | نقش‌های اختصاص‌یافته به کاربر |
| `RefreshToken` | نشست/refresh token ذخیره‌شده |
| `HandoffCode` | کدهای handoff نشست بین برنامه‌ها |
| `Address` | آدرس‌های تحویل/تماس متعلق به مشتری؛ با حذف کاربر حذف می‌شوند |

نقش نباید جایگزین `AccessProfile.type` یا کنترل مالکیت resource شود. کاربر COMPANY باید به شرکت مربوط به access profile محدود بماند.

## مدل‌های کسب‌وکار

| حوزه | مدل‌ها |
|---|---|
| شرکت و حساب | `Company`، `CompanyLimit`، `CompanyInquiryLimit` |
| آدرس مشتری | `Address` با مالکیت `userId`، نشانی، گیرنده و `isDefault` |
| دسته‌بندی و مشخصات | `Category`، `Subcategory`، `SpecificationTemplate`، `SpecificationField`، `SpecificationLibraryField` |
| محصول | `Product`، `ProductStatusHistory`، `ProductActivityLog`، `ProductImage`، `ProductDocument` |
| قیمت محصول | `ProductPriceTier`، `ProductPriceSnapshot` |
| استعلام | `Inquiry`، `InquiryItem`، `InquiryStatusHistory` |
| پاسخ و پیشنهاد تأمین‌کننده | `InquiryResponse`، `InquiryResponseItem`، `InquiryResponseAttachment` |
| پیام خصوصی استعلام | `InquiryMessage` |
| درآمدزایی استعلام | `InquiryPlan`، `InquirySubscription`، `InquiryUsageEvent` |
| تنظیمات | `SystemSetting` |
| اعلان‌ها | `Notification`، `NotificationFolder`، `NotificationFolderMembership`، `NotificationPreference`، `NotificationDelivery` |

## Enums موجود

Enums تعریف‌شده در schema شامل این موارد هستند:

- زمینه و نقش: `AccessProfileType`، `RoleScope`
- حساب و شرکت: `UserStatus`، `CompanyType`، `CompanyStatus`
- محصول: `CategoryStatus`، `SpecificationFieldType`، `ProductStatus`، `ProductActivityAction`، `ProductVisibility`، `ProductDocumentType`
- استعلام: `InquiryStatus`، `InquiryResponseStatus`، `InquiryPriority`، `InquiryVisibilityMode`
- اشتراک: `InquirySubscriptionStatus`، `InquiryUsageType`
- اعلان: `NotificationFolderScope`، `NotificationChannel`، `NotificationDeliveryStatus`

مقادیر مجاز هر enum را از schema بخوانید؛ مقدار جدید باید همراه با migration و بررسی سازگاری کد اضافه شود.

## تاریخچه قیمت

- `ProductPriceTier` قیمت‌های جاری/سطحی را نگه می‌دارد.
- `ProductPriceSnapshot` رکوردهای تغییر قیمت را برای نمودار تاریخچه ذخیره می‌کند.
- نمودار قیمت خرده‌فروشی بر اساس tier با `minQuantity = 1` ساخته می‌شود؛ تغییر عمده‌فروشی به‌تنهایی نباید نقطه‌ای در نمودار خرده‌فروشی بسازد.
- snapshotها باید در همان transaction تغییر قیمت ذخیره شوند.
- داده تاریخی قدیمی که snapshot معتبر ندارد نباید به‌صورت تخمینی backfill شود.

## Migration و استقرار

Migrationها در `backend/prisma/migrations/` قرار دارند. migration `20261027200000_customer_addresses` جدول `Address`، foreign key مالکیت و index یکتای جزئی برای حداکثر یک آدرس پیش‌فرض برای هر کاربر را ایجاد می‌کند. چون Prisma schema یکتایی جزئی را مدل نمی‌کند، index جزئی فقط در SQL migration تعریف شده و نباید از migration حذف شود. در production، Dockerfile بک‌اند `prisma migrate deploy` را قبل از seed و شروع سرور اجرا می‌کند.

قبل از migration محیط واقعی:
1. مقصد دیتابیس و نسخه schema را بررسی کنید.
2. backup قابل بازیابی تهیه کنید.
3. migration را ابتدا روی PostgreSQL آزمایشی اجرا کنید.
4. `prisma migrate status` و smoke testهای برنامه را بررسی کنید.
5. نتیجه واقعی را ثبت کنید؛ موفقیت `prisma generate` به معنی اجرای موفق migration نیست.

## کنترل دسترسی و مالکیت

Prisma queryها باید مالکیت و visibility را در خود شرط query یا در service enforce کنند. داده‌های شرکت، استعلام و پاسخ آن‌ها نباید تنها بر اساس ID دریافتی از client قابل دسترسی باشند. بررسی مجوز در UI جایگزین کنترل backend نیست.
