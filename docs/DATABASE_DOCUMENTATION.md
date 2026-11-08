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

Migrationها در `backend/prisma/migrations/` قرار دارند و با Prisma ORM 7.10.1 مدیریت می‌شوند. تاریخچه فعلی از baseline تجمیعی `20261106000000_init` آغاز می‌شود؛ این baseline از قبل شامل جدول `Address`، partial unique index آدرس پیش‌فرض، CHECK constraintهای مالکیت Inquiry و trigger عضویت INBOX اعلان‌هاست. در درخت فعلی migration، فایل مستقلی با نام `20261027200000_customer_addresses` وجود ندارد؛ ارجاع قدیمی به آن حذف شده است. پس از baseline، شش migration افزایشی DB-1 تا DB-6 برای احراز هویت/ممیزی، پشتیبانی، CMS، CRM، موجودی/سفارش/پرداخت و امور مالی اضافه شده‌اند. فهرست دقیق و ترتیب اجرا در `docs/DATABASE_MIGRATION_RUNBOOK.md` ثبت شده است. در توسعه و استقرار، `prisma migrate deploy` migrationهای ثبت‌شده را اعمال می‌کند. Prisma CLI تنظیمات اتصال و seed را از `backend/prisma.config.ts` می‌خواند؛ اتصال runtime با PrismaPg و node-postgres انجام می‌شود. نسخه Prisma CLI، Client و PostgreSQL adapter روی 7.10.1 قفل شده‌اند.

قبل از migration محیط واقعی:
1. مقصد دیتابیس و نسخه schema را بررسی کنید.
2. backup قابل بازیابی تهیه کنید.
3. migration را ابتدا روی PostgreSQL آزمایشی اجرا کنید.
4. `prisma migrate status` و smoke testهای برنامه را بررسی کنید.
5. نتیجه واقعی را ثبت کنید؛ موفقیت `prisma generate` به معنی اجرای موفق migration نیست.

## کنترل دسترسی و مالکیت

Prisma queryها باید مالکیت و visibility را در خود شرط query یا در service enforce کنند. داده‌های شرکت، استعلام و پاسخ آن‌ها نباید تنها بر اساس ID دریافتی از client قابل دسترسی باشند. بررسی مجوز در UI جایگزین کنترل backend نیست.

## توسعه محلی و داده‌های آزمایشی

- سرویس توسعه هنگام راه‌اندازی، `prisma migrate deploy` و سپس `prisma db seed` را اجرا می‌کند؛ راه‌اندازی عادی دیتابیس را reset نمی‌کند.
- برای بازسازی کامل دیتابیس توسعه، ابتدا بک‌اند فعال را متوقف کنید، سپس reset را در کانتینر یک‌بارمصرف اجرا و بک‌اند را دوباره بالا بیاورید:

  docker compose -f docker-compose.dev.yml stop backend
  docker compose -f docker-compose.dev.yml run --rm --build backend npm run db:reset:dev
  docker compose -f docker-compose.dev.yml up -d backend
- این دستور فقط با NODE_ENV=development و مقصد telecom_marketplace مجاز است و تمام داده‌های فعلی همان دیتابیس را حذف می‌کند.
- Seed توسعه قابل تکرار است و در production داده آزمایشی ایجاد نمی‌کند. رمز حساب‌های آزمایشی از DEMO_USER_PASSWORD قابل تنظیم است و مقدار پیش‌فرض توسعه A123@456 است؛ این رمز را در production استفاده نکنید.
- Seed شامل ۱۰ شرکت نمایشی (علاوه بر Main و شرکت‌های پیش‌فرض)، سه کاربر با نقش‌های مدیریتی/کاتالوگ/فروش برای هر شرکت، پنج مشتری و پنج خانواده محصول برای هر یک از ۱۵ دسته‌بندی سطح اول است. هر خانواده محصول برای دو تأمین‌کننده ثبت می‌شود.
- Product.sku کد داخلی فروشنده است. Product.catalogCode شناسه مشترک سازنده/مدل است و برای چند فهرست فروشنده می‌تواند تکرار شود. اعلان انتشار استعلام برای تمام شرکت‌های فعال دارای فهرست منتشرشده با همان catalogCode ارسال می‌شود؛ شرکت خریدار از گیرندگان حذف می‌شود.
- قیمت‌های Seed صرفاً داده نمایشی و تخمینی برای محیط توسعه‌اند و پیش از استفاده تجاری باید با استعلام واقعی تأمین‌کننده تأیید شوند. مشخصات مرجع نیز باید با نسخه دقیق دیتاشیت سازنده تطبیق داده شود.

## سیاست تاریخچه Migration

مخزن از baseline تجمیعی `20261106000000_init` و migrationهای افزایشی مستقل استفاده می‌کند. تغییر schema فقط با migration جدید انجام می‌شود؛ `db push` در startup یا reset روزمره استفاده نمی‌شود. Reset توسعه با `prisma migrate reset` و سپس `prisma db seed` انجام می‌شود و اسکریپت `db:reset:dev` مقصد را به development و دیتابیس `telecom_marketplace` محدود می‌کند. قاعده‌های PostgreSQL که Prisma Schema Language مدل نمی‌کند (CHECK constraintهای مالکیت، partial unique index آدرس پیش‌فرض، trigger عضویت INBOX، append-only historyها و کنترل توازن دفتر کل) باید به‌صورت SQL صریح در migration مربوط نگه‌داری شوند.


### حساب‌های ورود آزمایشی

- مدیر شرکت، مدیر کاتالوگ و کارشناس فروش هر شرکت به‌ترتیب در گروه‌های سه‌تایی شماره دارند: 09911000001 تا 09911000030.
- پنج مشتری عادی: 09912000001 تا 09912000005.
- مدیر کل توسعه نیز از شماره پیش‌فرض Seed استفاده می‌کند و در صورت نبود SUPER_ADMIN_PASSWORD، رمز آن در محیط development برابر A123@456 است.
- ترتیب شماره‌های شرکت‌ها مطابق ترتیب DEMO_COMPANIES در فایل backend/prisma/seeds/demo-marketplace.js است. Seed شماره‌ها و رمزها را در لاگ بک‌اند چاپ می‌کند.


## وضعیت دیتابیس پس از DB-0 تا DB-6

در شاخه پیاده‌سازی، schema شامل **۹۷ مدل و ۵۸ Enum** است: ۴۲ مدل و ۲۱ Enum هسته قبلی، به‌علاوه ۵۵ مدل و ۳۷ Enum جدید. شش migration افزایشی زیر به‌ترتیب زمانی اجرا می‌شوند. هیچ جدول یا داده‌ای از هسته قبلی حذف یا بازسازی نمی‌شود.

| Migration | دامنه | مدل‌های جدید |
|---|---|---|
| `20261108000100_auth_audit` | بازیابی حساب و ممیزی | `AuthChallenge`, `AuditLog` |
| `20261108000200_support` | پشتیبانی و SLA | `SupportQueue`, `SupportCategory`, `SupportSlaPolicy`, `SupportTicket`, `SupportMessage`, `SupportAttachment`, `SupportAssignment`, `SupportStatusHistory`, `SupportEvent` |
| `20261108000300_cms` | مجله و مدیریت محتوا | `Article`, `ArticleCategory`, `ArticleTag`, `ArticleCategoryAssignment`, `ArticleTagAssignment`, `ArticleRevision`, `ArticleMedia` |
| `20261108000400_crm` | CRM داخلی | `CRMAccount`, `CRMContact`, `LeadSource`, `Lead`, `Pipeline`, `PipelineStage`, `Opportunity`, `OpportunityStageHistory`, `CRMActivity`, `CRMTask`, `CRMNote` |
| `20261108000500_retail` | موجودی، سفارش، پرداخت و مرجوعی | `InventoryBalance`, `InventoryMovement`, `InventoryReservation`, `RetailOrder`, `SellerOrder`, `RetailOrderItem`, `PaymentAttempt`, `PaymentTransaction`, `PaymentWebhookEvent`, `RetailRefund`, `Shipment`, `TrackingEvent`, `ReturnRequest`, `ReturnItem` |
| `20261108000600_finance` | دفتر کل و تسویه | `LedgerAccount`, `JournalEntry`, `JournalLine`, `CommissionRule`, `CommissionSnapshot`, `SellerPayable`, `Settlement`, `SettlementApproval`, `SettlementPayout`, `ReconciliationRecord`, `FinanceInvoice`, `FinanceInvoiceLine` |

### قواعد مهم دامنه‌های جدید

- `AuthChallenge.secretHash` فقط hash توکن/OTP را نگه می‌دارد؛ secret خام نباید ذخیره شود. چالش دارای purpose، channel، expiry، مصرف یک‌باره و شمارنده تلاش است. CHECK دیتابیس تضمین می‌کند expiry بعد از creation باشد و partial unique index اجازه بیش از یک challenge باز برای هر user/purpose/channel نمی‌دهد؛ API باید challenge قبلی را پیش از صدور جدید invalidate کند.
- `AuditLog` append-only است. FKهای actor و company از حذف سخت جلوگیری می‌کنند؛ حذف/ویرایش رکورد ممیزی مجاز نیست.
- در پشتیبانی، یادداشت داخلی از پیام عمومی با `SupportMessageVisibility` جدا شده است. پیام و تاریخچه وضعیت immutable هستند؛ Ticket باید بسته/آرشیو شود و حذف فیزیکی ندارد. فایل‌ها با storage key خصوصی و وضعیت اسکن ثبت می‌شوند. هر Ticket حداکثر یک assignment باز دارد و هر assignment باید queue یا assignee داشته باشد؛ به‌روزرسانی فیلدهای assigned جاری و تاریخچه assignment باید در یک تراکنش API انجام شود.
- CMS نسخه‌های مقاله را در `ArticleRevision` نگه می‌دارد. انتشار عمومی فقط باید رکوردهای PUBLISHED را ارائه کند؛ وضعیت SCHEDULED نیازمند `scheduledAt` است.
- CRM به User و Company موجود لینک می‌شود و هویت تکراری ایجاد نمی‌کند. این دامنه برای STAFF طراحی شده و محدودیت دسترسی باید در API enforce شود.
- موجودی MVP یک balance برای هر Product دارد؛ `onHand` و `reserved` نمی‌توانند منفی شوند و reserved از onHand بیشتر نمی‌شود. `InventoryMovement` و `TrackingEvent` append-only هستند. رزرو اتمیک و تطبیق موجودی با رزروها مسئولیت transaction/service در API آینده است.
- سفارش، اقلام سفارش، فروشنده، قیمت و نشانی گیرنده snapshot دارند. `RetailOrderItem` و `ReturnRequest` با composite FK به همان SellerOrder/Order محدود می‌شوند. ارز سفارش اجباری است و default تجاری تحمیل نشده است.
- در این مرحله Cart/CartItem دائمی ساخته نشده است؛ سبد فعلی local-only می‌ماند و تصمیم AD-4 درباره غیرفعال بودن B2C تغییر نکرده است. تمام جداول Retail/Payment/Shipment/Return فقط زیرساخت ذخیره‌سازی‌اند؛ هیچ API یا مسیر پرداختی فعال نشده است.
- دفتر کل از سند دوطرفه استفاده می‌کند. JournalLine باید بدهکار/بستانکار یک‌طرفه و غیرمنفی باشد؛ trigger deferred توازن سند، حداقل دو خط و یکسان بودن ارز حساب‌ها با ارز سند را هنگام commit کنترل می‌کند. خطوط و اسناد POSTED قابل ویرایش/حذف نیستند؛ اصلاح با سند معکوس انجام می‌شود.
- تأیید تسویه و اجرای payout دارای maker-checker هستند. درخواست‌دهنده نمی‌تواند تسویه خودش را تأیید یا پرداخت کند و تأییدکننده نمی‌تواند همان payout را اجرا کند.

### Seed و راه‌اندازی اولیه

هیچ Queue/Category/SLA، CRM LeadSource/Pipeline/Stage، LedgerAccount، CommissionRule یا تنظیم تجاری پیش‌فرض در migrationها seed نشده است؛ این داده‌ها باید در مرحله API/seed با سیاست و نقش‌های مجاز ایجاد شوند. این کار عمدی است تا بدون توافق SLA، pipeline فروش یا chart of accounts، مقدار پیش‌فرض تجاری تحمیل نشود.

### محدوده‌ای که هنوز اجرا نشده است

این تغییرات فقط **لایه دیتابیس** را آماده می‌کنند. هنوز هیچ route، service، API-client method، permission seed، worker، provider adapter، CMS admin workflow یا UI عملیاتی برای مدل‌های جدید اضافه نشده است. برای فعال‌سازی Retail/Finance، تصمیم‌های تجاری ثبت‌شده در backlog (درگاه، ارز، نقش بازارگاه، مالیات، کمیسیون، حمل و مرجوعی) همچنان لازم‌اند.
### آخرین اعتبارسنجی اجرایی
در CI، Prisma validate و generate موفق بوده و PostgreSQL 18.4 روی دیتابیس کاملاً خالی، baseline و هر شش migration افزایشی را با موفقیت اعمال کرده است؛ `prisma migrate status` نیز موفق است. این نتیجه فقط دیتابیس موقت CI را پوشش می‌دهد و به معنی اجرای migration روی دیتابیس توسعه/عملیاتی مالک نیست.


## فرهنگ داده و توضیحات قابل مشاهده در ابزارهای دیتابیس

برای توضیح کامل هر ۹۷ جدول و همه ۱۲۹۴ فیلد Prisma (شامل فیلدهای رابطه‌ای)، به [`docs/DATABASE_DATA_DICTIONARY.md`](./DATABASE_DATA_DICTIONARY.md) مراجعه کنید. در خود `backend/prisma/schema.prisma` نیز برای تمام مدل‌ها و فیلدها مستندات فارسی `///` درج شده است. Migration افزایشی `20261108000700_database_comments` توضیحات بومی PostgreSQL را با ۹۷ دستور `COMMENT ON TABLE` و ۹۶۲ دستور `COMMENT ON COLUMN` ثبت می‌کند؛ این توضیحات در DBeaver، pgAdmin و سایر کلاینت‌های سازگار با PostgreSQL قابل مشاهده‌اند. این Migration فقط metadata توضیحی را تغییر می‌دهد و هیچ جدول، ستون، constraint یا داده‌ای را ایجاد، حذف یا تغییر نمی‌دهد.
