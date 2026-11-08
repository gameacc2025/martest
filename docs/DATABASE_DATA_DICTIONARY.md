# فرهنگ داده پایگاه داده — Telecom Marketplace

این مرجع فیلدبه‌فیلد از Prisma Schema تهیه شده است. توضیحات فارسی در کد Prisma و در metadata بومی PostgreSQL درج شده‌اند تا در محیط توسعه و نرم‌افزارهای مدیریت دیتابیس نیز قابل مشاهده باشند.

- مدل‌ها/جدول‌ها: **97**
- فیلدهای تعریف‌شده در Prisma: **1294** (شامل رابطه‌های Prisma)
- ستون‌های فیزیکی PostgreSQL: **962**
- رابطه‌های Prisma که ستون مستقل نیستند، در توضیحات Schema مشخص شده‌اند.

## Role — نقش

نقش‌های قابل تخصیص به کاربران و زمینه مجاز هر نقش (کارمند، شرکت یا مشتری).

| فیلد | نوع Prisma | توضیح |
|---|---|---|
| `id` | `Int` | شناسه یکتای رکورد و کلید اصلی جدول. |
| `name` | `String` | نام قابل نمایش موجودیت. |
| `label` | `String` | برچسب یا عنوان کوتاه قابل نمایش. |
| `description` | `String?` | شرح تکمیلی موجودیت. |
| `isSystem` | `Boolean` | سیستمی بودن رکورد و محدودیت مدیریت عادی آن. |
| `scope` | `RoleScope` | محدوده اعتبار یا نمایش رکورد. |
| `createdAt` | `DateTime` | زمان ایجاد رکورد. |
| `updatedAt` | `DateTime` | آخرین زمان ویرایش رکورد. |
| `permissions` | `RolePermission[]` | رابطه Prisma با جدول RolePermission (اتصال نقش و مجوز)؛ مجموعه رکوردهای وابسته را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |
| `users` | `UserRole[]` | رابطه Prisma با جدول UserRole (تخصیص نقش)؛ مجموعه رکوردهای وابسته را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |

## Permission — مجوز

فهرست مجوزهای ریزدانه و عملیات قابل کنترل در بخش‌های مختلف سامانه.

| فیلد | نوع Prisma | توضیح |
|---|---|---|
| `id` | `Int` | شناسه یکتای رکورد و کلید اصلی جدول. |
| `name` | `String` | نام قابل نمایش موجودیت. |
| `label` | `String` | برچسب یا عنوان کوتاه قابل نمایش. |
| `description` | `String?` | شرح تکمیلی موجودیت. |
| `group` | `String?` | گروه منطقی برای دسته‌بندی این مجوز/مقدار. |
| `createdAt` | `DateTime` | زمان ایجاد رکورد. |
| `updatedAt` | `DateTime` | آخرین زمان ویرایش رکورد. |
| `roles` | `RolePermission[]` | رابطه Prisma با جدول RolePermission (اتصال نقش و مجوز)؛ مجموعه رکوردهای وابسته را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |

## RolePermission — اتصال نقش و مجوز

رابط چندبه‌چند نقش و مجوز؛ هر رکورد یک مجوز اعطاشده به یک نقش را ثبت می‌کند.

| فیلد | نوع Prisma | توضیح |
|---|---|---|
| `roleId` | `Int` | شناسه نقش مرتبط با این اتصال نقش و مجوز؛ کلید خارجی به جدول Role است. |
| `permissionId` | `Int` | شناسه مجوز مرتبط با این اتصال نقش و مجوز؛ کلید خارجی به جدول Permission است. |
| `assignedAt` | `DateTime` | زمان شروع تخصیص این نقش یا مسئولیت. |
| `permission` | `Permission` | رابطه Prisma با جدول Permission (مجوز)؛ رکورد مرتبط را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |
| `role` | `Role` | رابطه Prisma با جدول Role (نقش)؛ رکورد مرتبط را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |

## UserRole — تخصیص نقش

رابط تخصیص نقش به کاربر و زمان اعطای نقش.

| فیلد | نوع Prisma | توضیح |
|---|---|---|
| `userId` | `Int` | شناسه کاربر مرتبط با این تخصیص نقش؛ کلید خارجی به جدول User است. |
| `roleId` | `Int` | شناسه نقش مرتبط با این تخصیص نقش؛ کلید خارجی به جدول Role است. |
| `assignedAt` | `DateTime` | زمان شروع تخصیص این نقش یا مسئولیت. |
| `role` | `Role` | رابطه Prisma با جدول Role (نقش)؛ رکورد مرتبط را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |
| `user` | `User` | رابطه Prisma با جدول User (کاربر)؛ رکورد مرتبط را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |

## AccessProfile — زمینه دسترسی

زمینه دسترسی کاربر به برنامه و شرکت وابسته به آن، در صورت وجود.

| فیلد | نوع Prisma | توضیح |
|---|---|---|
| `id` | `Int` | شناسه یکتای رکورد و کلید اصلی جدول. |
| `userId` | `Int` | شناسه کاربر مرتبط با این زمینه دسترسی؛ کلید خارجی به جدول User است. |
| `type` | `AccessProfileType` | نوع یا طبقه‌بندی رکورد؛ مقادیر مجاز در Enum یا قرارداد دامنه تعریف شده‌اند. |
| `companyId` | `Int?` | شناسه شرکت مرتبط با این زمینه دسترسی؛ کلید خارجی به جدول Company است. |
| `isActive` | `Boolean` | فعال یا غیرفعال بودن رکورد. |
| `createdAt` | `DateTime` | زمان ایجاد رکورد. |
| `updatedAt` | `DateTime` | آخرین زمان ویرایش رکورد. |
| `user` | `User` | رابطه Prisma با جدول User (کاربر)؛ رکورد مرتبط را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |
| `company` | `Company?` | رابطه Prisma با جدول Company (شرکت)؛ رکورد مرتبط را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |

## Profile — پروفایل

اطلاعات شخصی و نمایشی کاربر که از اطلاعات ورود جدا نگهداری می‌شود.

| فیلد | نوع Prisma | توضیح |
|---|---|---|
| `id` | `Int` | شناسه یکتای رکورد و کلید اصلی جدول. |
| `userId` | `Int` | شناسه کاربر مرتبط با این پروفایل؛ کلید خارجی به جدول User است. |
| `firstName` | `String?` | نام کوچک کاربر. |
| `lastName` | `String?` | نام خانوادگی کاربر. |
| `avatar` | `String?` | نشانی یا کلید تصویر نمایه کاربر. |
| `metadata` | `Json?` | داده‌های تکمیلی ساختاریافته و وابسته به دامنه در قالب JSON. |
| `createdAt` | `DateTime` | زمان ایجاد رکورد. |
| `updatedAt` | `DateTime` | آخرین زمان ویرایش رکورد. |
| `user` | `User` | رابطه Prisma با جدول User (کاربر)؛ رکورد مرتبط را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |

## Company — شرکت

اطلاعات هویتی، ثبتی، تماس، نوع فعالیت و وضعیت شرکت‌های عضو بازارگاه.

| فیلد | نوع Prisma | توضیح |
|---|---|---|
| `id` | `Int` | شناسه یکتای رکورد و کلید اصلی جدول. |
| `name` | `String` | نام قابل نمایش موجودیت. |
| `nameEn` | `String?` | نام انگلیسی موجودیت. |
| `nationalId` | `String?` | شناسه ملی شرکت/شخص برای شناسایی و تطبیق. |
| `registrationNumber` | `String?` | شماره ثبت قانونی شرکت. |
| `type` | `CompanyType?` | نوع یا طبقه‌بندی رکورد؛ مقادیر مجاز در Enum یا قرارداد دامنه تعریف شده‌اند. |
| `description` | `String?` | شرح تکمیلی موجودیت. |
| `logo` | `String?` | نشانی یا کلید فایل لوگو. |
| `email` | `String?` | نشانی ایمیل مرتبط. |
| `phone` | `String?` | شماره تماس مرتبط. |
| `address` | `String?` | نشانی متنی یا اطلاعات آدرس. |
| `website` | `String?` | نشانی وب‌سایت رسمی. |
| `status` | `CompanyStatus` | وضعیت چرخه عمر رکورد؛ مقادیر مجاز در Enum مربوط تعریف شده‌اند. |
| `isVerified` | `Boolean` | تأیید شدن هویت یا اطلاعات این موجودیت. |
| `createdAt` | `DateTime` | زمان ایجاد رکورد. |
| `updatedAt` | `DateTime` | آخرین زمان ویرایش رکورد. |
| `deletedAt` | `DateTime?` | زمان حذف نرم؛ NULL یعنی رکورد حذف نرم نشده است. |
| `accessProfiles` | `AccessProfile[]` | رابطه Prisma با جدول AccessProfile (زمینه دسترسی)؛ مجموعه رکوردهای وابسته را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |
| `products` | `Product[]` | رابطه Prisma با جدول Product (محصول)؛ مجموعه رکوردهای وابسته را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |
| `inquiries` | `Inquiry[]` | رابطه Prisma با جدول Inquiry (استعلام)؛ مجموعه رکوردهای وابسته را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |
| `responses` | `InquiryResponse[]` | رابطه Prisma با جدول InquiryResponse (InquiryResponse)؛ مجموعه رکوردهای وابسته را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |
| `inquiryLimit` | `CompanyInquiryLimit?` | رابطه Prisma با جدول CompanyInquiryLimit (CompanyInquiryLimit)؛ رکورد مرتبط را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |
| `limits` | `CompanyLimit[]` | رابطه Prisma با جدول CompanyLimit (CompanyLimit)؛ مجموعه رکوردهای وابسته را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |
| `inquirySubscriptions` | `InquirySubscription[]` | رابطه Prisma با جدول InquirySubscription (InquirySubscription)؛ مجموعه رکوردهای وابسته را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |
| `sentInquiryMessages` | `InquiryMessage[]` | رابطه Prisma با جدول InquiryMessage (InquiryMessage)؛ مجموعه رکوردهای وابسته را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |
| `receivedInquiryMessages` | `InquiryMessage[]` | رابطه Prisma با جدول InquiryMessage (InquiryMessage)؛ مجموعه رکوردهای وابسته را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |
| `auditLogs` | `AuditLog[]` | رابطه Prisma با جدول AuditLog (AuditLog)؛ مجموعه رکوردهای وابسته را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |
| `supportTickets` | `SupportTicket[]` | رابطه Prisma با جدول SupportTicket (تیکت پشتیبانی)؛ مجموعه رکوردهای وابسته را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |
| `crmAccounts` | `CRMAccount[]` | رابطه Prisma با جدول CRMAccount (CRMAccount)؛ مجموعه رکوردهای وابسته را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |
| `sellerOrders` | `SellerOrder[]` | رابطه Prisma با جدول SellerOrder (سفارش فروشنده)؛ مجموعه رکوردهای وابسته را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |
| `commissionRules` | `CommissionRule[]` | رابطه Prisma با جدول CommissionRule (CommissionRule)؛ مجموعه رکوردهای وابسته را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |
| `sellerPayables` | `SellerPayable[]` | رابطه Prisma با جدول SellerPayable (SellerPayable)؛ مجموعه رکوردهای وابسته را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |
| `settlements` | `Settlement[]` | رابطه Prisma با جدول Settlement (تسویه)؛ مجموعه رکوردهای وابسته را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |
| `financeInvoices` | `FinanceInvoice[]` | رابطه Prisma با جدول FinanceInvoice (FinanceInvoice)؛ مجموعه رکوردهای وابسته را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |

## User — کاربر

هویت ورود حساب کاربری، وضعیت حساب و ارتباط آن با فعالیت‌های سامانه.

| فیلد | نوع Prisma | توضیح |
|---|---|---|
| `id` | `Int` | شناسه یکتای رکورد و کلید اصلی جدول. |
| `email` | `String?` | نشانی ایمیل مرتبط. |
| `phone` | `String` | شماره تماس مرتبط. |
| `passwordHash` | `String` | هش رمز عبور؛ رمز خام نباید ذخیره شود. |
| `status` | `UserStatus` | وضعیت چرخه عمر رکورد؛ مقادیر مجاز در Enum مربوط تعریف شده‌اند. |
| `createdAt` | `DateTime` | زمان ایجاد رکورد. |
| `updatedAt` | `DateTime` | آخرین زمان ویرایش رکورد. |
| `profile` | `Profile?` | رابطه Prisma با جدول Profile (پروفایل)؛ رکورد مرتبط را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |
| `accessProfile` | `AccessProfile?` | رابطه Prisma با جدول AccessProfile (زمینه دسترسی)؛ رکورد مرتبط را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |
| `roles` | `UserRole[]` | رابطه Prisma با جدول UserRole (تخصیص نقش)؛ مجموعه رکوردهای وابسته را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |
| `refreshTokens` | `RefreshToken[]` | رابطه Prisma با جدول RefreshToken (RefreshToken)؛ مجموعه رکوردهای وابسته را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |
| `handoffCodes` | `HandoffCode[]` | رابطه Prisma با جدول HandoffCode (HandoffCode)؛ مجموعه رکوردهای وابسته را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |
| `notifications` | `Notification[]` | رابطه Prisma با جدول Notification (اعلان)؛ مجموعه رکوردهای وابسته را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |
| `notificationPreferences` | `NotificationPreference[]` | رابطه Prisma با جدول NotificationPreference (NotificationPreference)؛ مجموعه رکوردهای وابسته را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |
| `notificationDeliveries` | `NotificationDelivery[]` | رابطه Prisma با جدول NotificationDelivery (NotificationDelivery)؛ مجموعه رکوردهای وابسته را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |
| `products` | `Product[]` | رابطه Prisma با جدول Product (محصول)؛ مجموعه رکوردهای وابسته را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |
| `productStatusChanges` | `ProductStatusHistory[]` | رابطه Prisma با جدول ProductStatusHistory (ProductStatusHistory)؛ مجموعه رکوردهای وابسته را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |
| `productActivityLogs` | `ProductActivityLog[]` | رابطه Prisma با جدول ProductActivityLog (ProductActivityLog)؛ مجموعه رکوردهای وابسته را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |
| `inquiryStatusChanges` | `InquiryStatusHistory[]` | رابطه Prisma با جدول InquiryStatusHistory (InquiryStatusHistory)؛ مجموعه رکوردهای وابسته را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |
| `buyerInquiries` | `Inquiry[]` | رابطه Prisma با جدول Inquiry (استعلام)؛ مجموعه رکوردهای وابسته را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |
| `inquirySubscriptions` | `InquirySubscription[]` | رابطه Prisma با جدول InquirySubscription (InquirySubscription)؛ مجموعه رکوردهای وابسته را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |
| `sentInquiryMessages` | `InquiryMessage[]` | رابطه Prisma با جدول InquiryMessage (InquiryMessage)؛ مجموعه رکوردهای وابسته را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |
| `receivedInquiryMessages` | `InquiryMessage[]` | رابطه Prisma با جدول InquiryMessage (InquiryMessage)؛ مجموعه رکوردهای وابسته را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |
| `addresses` | `Address[]` | رابطه Prisma با جدول Address (نشانی)؛ مجموعه رکوردهای وابسته را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |
| `authChallenges` | `AuthChallenge[]` | رابطه Prisma با جدول AuthChallenge (AuthChallenge)؛ مجموعه رکوردهای وابسته را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |
| `auditLogs` | `AuditLog[]` | رابطه Prisma با جدول AuditLog (AuditLog)؛ مجموعه رکوردهای وابسته را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |
| `supportRequestedTickets` | `SupportTicket[]` | رابطه Prisma با جدول SupportTicket (تیکت پشتیبانی)؛ مجموعه رکوردهای وابسته را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |
| `supportCurrentAssignments` | `SupportTicket[]` | رابطه Prisma با جدول SupportTicket (تیکت پشتیبانی)؛ مجموعه رکوردهای وابسته را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |
| `supportMessages` | `SupportMessage[]` | رابطه Prisma با جدول SupportMessage (SupportMessage)؛ مجموعه رکوردهای وابسته را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |
| `supportAttachments` | `SupportAttachment[]` | رابطه Prisma با جدول SupportAttachment (SupportAttachment)؛ مجموعه رکوردهای وابسته را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |
| `supportAssignmentsReceived` | `SupportAssignment[]` | رابطه Prisma با جدول SupportAssignment (SupportAssignment)؛ مجموعه رکوردهای وابسته را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |
| `supportAssignmentsMade` | `SupportAssignment[]` | رابطه Prisma با جدول SupportAssignment (SupportAssignment)؛ مجموعه رکوردهای وابسته را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |
| `supportStatusChanges` | `SupportStatusHistory[]` | رابطه Prisma با جدول SupportStatusHistory (SupportStatusHistory)؛ مجموعه رکوردهای وابسته را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |
| `supportEvents` | `SupportEvent[]` | رابطه Prisma با جدول SupportEvent (SupportEvent)؛ مجموعه رکوردهای وابسته را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |
| `authoredArticles` | `Article[]` | رابطه Prisma با جدول Article (مقاله)؛ مجموعه رکوردهای وابسته را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |
| `publishedArticles` | `Article[]` | رابطه Prisma با جدول Article (مقاله)؛ مجموعه رکوردهای وابسته را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |
| `articleRevisions` | `ArticleRevision[]` | رابطه Prisma با جدول ArticleRevision (ArticleRevision)؛ مجموعه رکوردهای وابسته را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |
| `uploadedArticleMedia` | `ArticleMedia[]` | رابطه Prisma با جدول ArticleMedia (ArticleMedia)؛ مجموعه رکوردهای وابسته را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |
| `crmAccounts` | `CRMAccount[]` | رابطه Prisma با جدول CRMAccount (CRMAccount)؛ مجموعه رکوردهای وابسته را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |
| `ownedCrmAccounts` | `CRMAccount[]` | رابطه Prisma با جدول CRMAccount (CRMAccount)؛ مجموعه رکوردهای وابسته را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |
| `crmContacts` | `CRMContact[]` | رابطه Prisma با جدول CRMContact (CRMContact)؛ مجموعه رکوردهای وابسته را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |
| `ownedLeads` | `Lead[]` | رابطه Prisma با جدول Lead (سرنخ فروش)؛ مجموعه رکوردهای وابسته را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |
| `convertedLeads` | `Lead[]` | رابطه Prisma با جدول Lead (سرنخ فروش)؛ مجموعه رکوردهای وابسته را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |
| `ownedOpportunities` | `Opportunity[]` | رابطه Prisma با جدول Opportunity (فرصت فروش)؛ مجموعه رکوردهای وابسته را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |
| `crmActivities` | `CRMActivity[]` | رابطه Prisma با جدول CRMActivity (CRMActivity)؛ مجموعه رکوردهای وابسته را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |
| `assignedCrmTasks` | `CRMTask[]` | رابطه Prisma با جدول CRMTask (CRMTask)؛ مجموعه رکوردهای وابسته را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |
| `createdCrmTasks` | `CRMTask[]` | رابطه Prisma با جدول CRMTask (CRMTask)؛ مجموعه رکوردهای وابسته را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |
| `crmNotes` | `CRMNote[]` | رابطه Prisma با جدول CRMNote (CRMNote)؛ مجموعه رکوردهای وابسته را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |
| `inventoryMovements` | `InventoryMovement[]` | رابطه Prisma با جدول InventoryMovement (InventoryMovement)؛ مجموعه رکوردهای وابسته را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |
| `retailOrders` | `RetailOrder[]` | رابطه Prisma با جدول RetailOrder (سفارش)؛ مجموعه رکوردهای وابسته را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |
| `inventoryReservations` | `InventoryReservation[]` | رابطه Prisma با جدول InventoryReservation (InventoryReservation)؛ مجموعه رکوردهای وابسته را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |
| `retailRefunds` | `RetailRefund[]` | رابطه Prisma با جدول RetailRefund (RetailRefund)؛ مجموعه رکوردهای وابسته را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |
| `returnRequests` | `ReturnRequest[]` | رابطه Prisma با جدول ReturnRequest (ReturnRequest)؛ مجموعه رکوردهای وابسته را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |
| `journalEntries` | `JournalEntry[]` | رابطه Prisma با جدول JournalEntry (JournalEntry)؛ مجموعه رکوردهای وابسته را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |
| `settlementRequests` | `Settlement[]` | رابطه Prisma با جدول Settlement (تسویه)؛ مجموعه رکوردهای وابسته را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |
| `settlementApprovals` | `SettlementApproval[]` | رابطه Prisma با جدول SettlementApproval (SettlementApproval)؛ مجموعه رکوردهای وابسته را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |
| `payoutExecutions` | `SettlementPayout[]` | رابطه Prisma با جدول SettlementPayout (SettlementPayout)؛ مجموعه رکوردهای وابسته را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |
| `financeInvoices` | `FinanceInvoice[]` | رابطه Prisma با جدول FinanceInvoice (FinanceInvoice)؛ مجموعه رکوردهای وابسته را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |
| `opportunityStageChanges` | `OpportunityStageHistory[]` | رابطه Prisma با جدول OpportunityStageHistory (OpportunityStageHistory)؛ مجموعه رکوردهای وابسته را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |

## Address — نشانی

نشانی‌های تماس یا تحویل ثبت‌شده توسط کاربر.

| فیلد | نوع Prisma | توضیح |
|---|---|---|
| `id` | `Int` | شناسه یکتای رکورد و کلید اصلی جدول. |
| `userId` | `Int` | شناسه کاربر مرتبط با این نشانی؛ کلید خارجی به جدول User است. |
| `label` | `String` | برچسب یا عنوان کوتاه قابل نمایش. |
| `recipientName` | `String` | نام شخص دریافت‌کننده. |
| `recipientPhone` | `String` | شماره تماس شخص دریافت‌کننده. |
| `province` | `String` | استان نشانی. |
| `city` | `String` | شهر نشانی. |
| `addressLine` | `String` | جزئیات نشانی پستی. |
| `postalCode` | `String?` | کد پستی. |
| `isDefault` | `Boolean` | پیش‌فرض بودن این گزینه یا رکورد. |
| `createdAt` | `DateTime` | زمان ایجاد رکورد. |
| `updatedAt` | `DateTime` | آخرین زمان ویرایش رکورد. |
| `user` | `User` | رابطه Prisma با جدول User (کاربر)؛ رکورد مرتبط را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |
| `retailOrders` | `RetailOrder[]` | رابطه Prisma با جدول RetailOrder (سفارش)؛ مجموعه رکوردهای وابسته را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |

## RefreshToken — RefreshToken

توکن‌های نوسازی نشست کاربر برای کنترل انقضا و ابطال نشست.

| فیلد | نوع Prisma | توضیح |
|---|---|---|
| `id` | `Int` | شناسه یکتای رکورد و کلید اصلی جدول. |
| `token` | `String` | توکن نشست/نوسازی؛ دسترسی به آن باید محدود و امن باشد. |
| `userId` | `Int` | شناسه کاربر مرتبط با این RefreshToken؛ کلید خارجی به جدول User است. |
| `expiresAt` | `DateTime` | زمان انقضای اعتبار رکورد یا توکن. |
| `createdAt` | `DateTime` | زمان ایجاد رکورد. |
| `user` | `User` | رابطه Prisma با جدول User (کاربر)؛ رکورد مرتبط را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |

## HandoffCode — HandoffCode

کد موقت انتقال امن نشست میان وب‌سایت و پنل‌ها؛ کد خام ذخیره نمی‌شود.

| فیلد | نوع Prisma | توضیح |
|---|---|---|
| `id` | `Int` | شناسه یکتای رکورد و کلید اصلی جدول. |
| `codeHash` | `String` | هش کد انتقال؛ کد خام ذخیره نمی‌شود. |
| `userId` | `Int` | شناسه کاربر مرتبط با این HandoffCode؛ کلید خارجی به جدول User است. |
| `app` | `String` | شناسه برنامه مقصد برای انتقال نشست (مانند admin یا company). |
| `challenge` | `String` | مقدار challenge رمزنگاری‌شده مرتبط با جریان PKCE. |
| `expiresAt` | `DateTime` | زمان انقضای اعتبار رکورد یا توکن. |
| `createdAt` | `DateTime` | زمان ایجاد رکورد. |
| `user` | `User` | رابطه Prisma با جدول User (کاربر)؛ رکورد مرتبط را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |

## Category — Category

دسته‌بندی‌های اصلی کاتالوگ محصولات و تنظیمات نمایش آن‌ها.

| فیلد | نوع Prisma | توضیح |
|---|---|---|
| `id` | `Int` | شناسه یکتای رکورد و کلید اصلی جدول. |
| `slug` | `String` | شناسه متنی خوانا و یکتای مناسب URL. |
| `nameFa` | `String` | نام فارسی موجودیت. |
| `nameEn` | `String` | نام انگلیسی موجودیت. |
| `image` | `String?` | نشانی یا کلید تصویر مرتبط. |
| `status` | `CategoryStatus` | وضعیت چرخه عمر رکورد؛ مقادیر مجاز در Enum مربوط تعریف شده‌اند. |
| `showInMenu` | `Boolean` | نمایش دسته‌بندی در منوی عمومی را کنترل می‌کند. |
| `sortOrder` | `Int` | ترتیب نمایش رکورد در میان موارد هم‌گروه. |
| `createdAt` | `DateTime` | زمان ایجاد رکورد. |
| `updatedAt` | `DateTime` | آخرین زمان ویرایش رکورد. |
| `subcategories` | `Subcategory[]` | رابطه Prisma با جدول Subcategory (Subcategory)؛ مجموعه رکوردهای وابسته را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |
| `products` | `Product[]` | رابطه Prisma با جدول Product (محصول)؛ مجموعه رکوردهای وابسته را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |
| `commissionRules` | `CommissionRule[]` | رابطه Prisma با جدول CommissionRule (CommissionRule)؛ مجموعه رکوردهای وابسته را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |

## Subcategory — Subcategory

زیر‌دسته هر دسته اصلی و ارتباط آن با قالب مشخصات و محصولات.

| فیلد | نوع Prisma | توضیح |
|---|---|---|
| `id` | `Int` | شناسه یکتای رکورد و کلید اصلی جدول. |
| `categoryId` | `Int` | شناسه Category مرتبط با این Subcategory؛ کلید خارجی به جدول Category است. |
| `slug` | `String` | شناسه متنی خوانا و یکتای مناسب URL. |
| `nameFa` | `String` | نام فارسی موجودیت. |
| `nameEn` | `String` | نام انگلیسی موجودیت. |
| `status` | `CategoryStatus` | وضعیت چرخه عمر رکورد؛ مقادیر مجاز در Enum مربوط تعریف شده‌اند. |
| `sortOrder` | `Int` | ترتیب نمایش رکورد در میان موارد هم‌گروه. |
| `createdAt` | `DateTime` | زمان ایجاد رکورد. |
| `updatedAt` | `DateTime` | آخرین زمان ویرایش رکورد. |
| `category` | `Category` | رابطه Prisma با جدول Category (Category)؛ رکورد مرتبط را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |
| `specificationTemplate` | `SpecificationTemplate?` | رابطه Prisma با جدول SpecificationTemplate (SpecificationTemplate)؛ رکورد مرتبط را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |
| `products` | `Product[]` | رابطه Prisma با جدول Product (محصول)؛ مجموعه رکوردهای وابسته را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |

## SpecificationTemplate — SpecificationTemplate

قالب مشخصات فنی قابل استفاده برای محصولات یک زیر‌دسته.

| فیلد | نوع Prisma | توضیح |
|---|---|---|
| `id` | `Int` | شناسه یکتای رکورد و کلید اصلی جدول. |
| `subcategoryId` | `Int` | شناسه Subcategory مرتبط با این SpecificationTemplate؛ کلید خارجی به جدول Subcategory است. |
| `name` | `String` | نام قابل نمایش موجودیت. |
| `description` | `String?` | شرح تکمیلی موجودیت. |
| `isActive` | `Boolean` | فعال یا غیرفعال بودن رکورد. |
| `createdAt` | `DateTime` | زمان ایجاد رکورد. |
| `updatedAt` | `DateTime` | آخرین زمان ویرایش رکورد. |
| `subcategory` | `Subcategory` | رابطه Prisma با جدول Subcategory (Subcategory)؛ رکورد مرتبط را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |
| `fields` | `SpecificationField[]` | رابطه Prisma با جدول SpecificationField (SpecificationField)؛ مجموعه رکوردهای وابسته را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |

## SpecificationField — SpecificationField

تعریف هر فیلد مشخصات فنی شامل نوع، واحد، اجباری بودن و گزینه‌ها.

| فیلد | نوع Prisma | توضیح |
|---|---|---|
| `id` | `Int` | شناسه یکتای رکورد و کلید اصلی جدول. |
| `templateId` | `Int` | شناسه SpecificationTemplate مرتبط با این SpecificationField؛ کلید خارجی به جدول SpecificationTemplate است. |
| `name` | `String` | نام قابل نمایش موجودیت. |
| `key` | `String` | کلید ماشینی تنظیم یا گزینه. |
| `type` | `SpecificationFieldType` | نوع یا طبقه‌بندی رکورد؛ مقادیر مجاز در Enum یا قرارداد دامنه تعریف شده‌اند. |
| `isRequired` | `Boolean` | اجباری بودن تکمیل این فیلد. |
| `unit` | `String?` | واحد اندازه‌گیری یا فروش. |
| `options` | `Json?` | فهرست گزینه‌های مجاز برای فیلد انتخابی، در قالب JSON. |
| `sortOrder` | `Int` | ترتیب نمایش رکورد در میان موارد هم‌گروه. |
| `createdAt` | `DateTime` | زمان ایجاد رکورد. |
| `updatedAt` | `DateTime` | آخرین زمان ویرایش رکورد. |
| `template` | `SpecificationTemplate` | رابطه Prisma با جدول SpecificationTemplate (SpecificationTemplate)؛ رکورد مرتبط را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |

## SpecificationLibraryField — SpecificationLibraryField

کتابخانه فیلدهای مشخصات فنی قابل استفاده مجدد در قالب‌های مختلف.

| فیلد | نوع Prisma | توضیح |
|---|---|---|
| `id` | `Int` | شناسه یکتای رکورد و کلید اصلی جدول. |
| `title` | `String` | عنوان اصلی قابل نمایش. |
| `slug` | `String` | شناسه متنی خوانا و یکتای مناسب URL. |
| `type` | `SpecificationFieldType` | نوع یا طبقه‌بندی رکورد؛ مقادیر مجاز در Enum یا قرارداد دامنه تعریف شده‌اند. |
| `defaultUnit` | `String?` | واحد پیش‌فرض این فیلد مشخصات فنی. |
| `description` | `String?` | شرح تکمیلی موجودیت. |
| `isActive` | `Boolean` | فعال یا غیرفعال بودن رکورد. |
| `createdAt` | `DateTime` | زمان ایجاد رکورد. |
| `updatedAt` | `DateTime` | آخرین زمان ویرایش رکورد. |

## Product — محصول

اطلاعات اصلی محصول فروشنده شامل مشخصات، دسته‌بندی، مالکیت و وضعیت انتشار.

| فیلد | نوع Prisma | توضیح |
|---|---|---|
| `id` | `Int` | شناسه یکتای رکورد و کلید اصلی جدول. |
| `title` | `String` | عنوان اصلی قابل نمایش. |
| `slug` | `String` | شناسه متنی خوانا و یکتای مناسب URL. |
| `shortDescription` | `String?` | خلاصه کوتاه برای نمایش در فهرست‌ها و کارت‌ها. |
| `description` | `String?` | شرح تکمیلی موجودیت. |
| `sku` | `String?` | کد داخلی محصول نزد فروشنده. |
| `catalogCode` | `String?` | شناسه مشترک سازنده/مدل برای تطبیق فهرست‌های هم‌مدل. |
| `brand` | `String?` | نام برند سازنده یا عرضه‌کننده. |
| `model` | `String?` | نام یا شماره مدل محصول. |
| `specifications` | `Json?` | مقادیر ساختاریافته مشخصات فنی محصول در قالب JSON. |
| `status` | `ProductStatus` | وضعیت چرخه عمر رکورد؛ مقادیر مجاز در Enum مربوط تعریف شده‌اند. |
| `visibility` | `ProductVisibility` | سطح مشاهده و دسترسی به محتوا. |
| `retailEnabled` | `Boolean` | مجاز بودن عرضه محصول در مسیر خرده‌فروشی را مشخص می‌کند. |
| `isFeatured` | `Boolean` | ویژه بودن محصول برای جایگاه‌های برجسته. |
| `editsSinceApproval` | `Int` | تعداد ویرایش‌های ثبت‌شده پس از آخرین تأیید محصول. |
| `companyId` | `Int` | شناسه شرکت مرتبط با این محصول؛ کلید خارجی به جدول Company است. |
| `categoryId` | `Int` | شناسه Category مرتبط با این محصول؛ کلید خارجی به جدول Category است. |
| `subcategoryId` | `Int` | شناسه Subcategory مرتبط با این محصول؛ کلید خارجی به جدول Subcategory است. |
| `createdByUserId` | `Int` | شناسه کاربر مرتبط با این محصول؛ کلید خارجی به جدول User است. |
| `createdAt` | `DateTime` | زمان ایجاد رکورد. |
| `updatedAt` | `DateTime` | آخرین زمان ویرایش رکورد. |
| `deletedAt` | `DateTime?` | زمان حذف نرم؛ NULL یعنی رکورد حذف نرم نشده است. |
| `company` | `Company` | رابطه Prisma با جدول Company (شرکت)؛ رکورد مرتبط را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |
| `category` | `Category` | رابطه Prisma با جدول Category (Category)؛ رکورد مرتبط را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |
| `subcategory` | `Subcategory` | رابطه Prisma با جدول Subcategory (Subcategory)؛ رکورد مرتبط را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |
| `createdBy` | `User` | رابطه Prisma با جدول User (کاربر)؛ رکورد مرتبط را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |
| `images` | `ProductImage[]` | رابطه Prisma با جدول ProductImage (ProductImage)؛ مجموعه رکوردهای وابسته را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |
| `documents` | `ProductDocument[]` | رابطه Prisma با جدول ProductDocument (ProductDocument)؛ مجموعه رکوردهای وابسته را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |
| `prices` | `ProductPriceTier[]` | رابطه Prisma با جدول ProductPriceTier (ProductPriceTier)؛ مجموعه رکوردهای وابسته را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |
| `priceSnapshots` | `ProductPriceSnapshot[]` | رابطه Prisma با جدول ProductPriceSnapshot (ProductPriceSnapshot)؛ مجموعه رکوردهای وابسته را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |
| `statusHistory` | `ProductStatusHistory[]` | رابطه Prisma با جدول ProductStatusHistory (ProductStatusHistory)؛ مجموعه رکوردهای وابسته را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |
| `activityLog` | `ProductActivityLog[]` | رابطه Prisma با جدول ProductActivityLog (ProductActivityLog)؛ مجموعه رکوردهای وابسته را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |
| `inquiryItems` | `InquiryItem[]` | رابطه Prisma با جدول InquiryItem (InquiryItem)؛ مجموعه رکوردهای وابسته را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |
| `inventoryBalance` | `InventoryBalance?` | رابطه Prisma با جدول InventoryBalance (InventoryBalance)؛ رکورد مرتبط را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |
| `inventoryMovements` | `InventoryMovement[]` | رابطه Prisma با جدول InventoryMovement (InventoryMovement)؛ مجموعه رکوردهای وابسته را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |
| `inventoryReservations` | `InventoryReservation[]` | رابطه Prisma با جدول InventoryReservation (InventoryReservation)؛ مجموعه رکوردهای وابسته را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |
| `retailOrderItems` | `RetailOrderItem[]` | رابطه Prisma با جدول RetailOrderItem (RetailOrderItem)؛ مجموعه رکوردهای وابسته را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |

## ProductStatusHistory — ProductStatusHistory

تاریخچه تغییر وضعیت محصول، عامل تغییر و توضیح آن.

| فیلد | نوع Prisma | توضیح |
|---|---|---|
| `id` | `Int` | شناسه یکتای رکورد و کلید اصلی جدول. |
| `productId` | `Int` | شناسه محصول مرتبط با این ProductStatusHistory؛ کلید خارجی به جدول Product است. |
| `previousStatus` | `ProductStatus` | وضعیت قبلی رکورد پیش از تغییر. |
| `newStatus` | `ProductStatus` | وضعیت جدید رکورد پس از تغییر. |
| `changedByUserId` | `Int` | شناسه کاربر مرتبط با این ProductStatusHistory؛ کلید خارجی به جدول User است. |
| `comment` | `String?` | توضیح ثبت‌شده درباره عملیات یا تغییر. |
| `createdAt` | `DateTime` | زمان ایجاد رکورد. |
| `product` | `Product` | رابطه Prisma با جدول Product (محصول)؛ رکورد مرتبط را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |
| `changedBy` | `User` | رابطه Prisma با جدول User (کاربر)؛ رکورد مرتبط را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |

## ProductActivityLog — ProductActivityLog

رویدادها و فعالیت‌های انجام‌شده روی محصول برای پیگیری و ممیزی.

| فیلد | نوع Prisma | توضیح |
|---|---|---|
| `id` | `Int` | شناسه یکتای رکورد و کلید اصلی جدول. |
| `productId` | `Int` | شناسه محصول مرتبط با این ProductActivityLog؛ کلید خارجی به جدول Product است. |
| `actorUserId` | `Int` | شناسه کاربر مرتبط با این ProductActivityLog؛ کلید خارجی به جدول User است. |
| `action` | `ProductActivityAction` | نوع اقدام انجام‌شده. |
| `detail` | `String?` | شرح تکمیلی اقدام یا رویداد ثبت‌شده. |
| `comment` | `String?` | توضیح ثبت‌شده درباره عملیات یا تغییر. |
| `createdAt` | `DateTime` | زمان ایجاد رکورد. |
| `product` | `Product` | رابطه Prisma با جدول Product (محصول)؛ رکورد مرتبط را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |
| `actor` | `User` | رابطه Prisma با جدول User (کاربر)؛ رکورد مرتبط را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |

## ProductImage — ProductImage

تصاویر محصول و فراداده لازم برای نمایش و دسترس‌پذیری.

| فیلد | نوع Prisma | توضیح |
|---|---|---|
| `id` | `Int` | شناسه یکتای رکورد و کلید اصلی جدول. |
| `productId` | `Int` | شناسه محصول مرتبط با این ProductImage؛ کلید خارجی به جدول Product است. |
| `url` | `String` | نشانی فایل یا منبع مرتبط. |
| `thumbnailUrl` | `String?` | نشانی تصویر بندانگشتی. |
| `altText` | `String?` | متن جایگزین تصویر برای دسترس‌پذیری و سئو. |
| `isPrimary` | `Boolean` | اصلی بودن این مورد در میان موارد مرتبط. |
| `sortOrder` | `Int` | ترتیب نمایش رکورد در میان موارد هم‌گروه. |
| `createdAt` | `DateTime` | زمان ایجاد رکورد. |
| `updatedAt` | `DateTime` | آخرین زمان ویرایش رکورد. |
| `product` | `Product` | رابطه Prisma با جدول Product (محصول)؛ رکورد مرتبط را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |

## ProductDocument — ProductDocument

اسناد و فایل‌های پیوست محصول مانند دیتاشیت و کاتالوگ.

| فیلد | نوع Prisma | توضیح |
|---|---|---|
| `id` | `Int` | شناسه یکتای رکورد و کلید اصلی جدول. |
| `productId` | `Int` | شناسه محصول مرتبط با این ProductDocument؛ کلید خارجی به جدول Product است. |
| `type` | `ProductDocumentType` | نوع یا طبقه‌بندی رکورد؛ مقادیر مجاز در Enum یا قرارداد دامنه تعریف شده‌اند. |
| `title` | `String?` | عنوان اصلی قابل نمایش. |
| `url` | `String` | نشانی فایل یا منبع مرتبط. |
| `sortOrder` | `Int` | ترتیب نمایش رکورد در میان موارد هم‌گروه. |
| `createdAt` | `DateTime` | زمان ایجاد رکورد. |
| `updatedAt` | `DateTime` | آخرین زمان ویرایش رکورد. |
| `product` | `Product` | رابطه Prisma با جدول Product (محصول)؛ رکورد مرتبط را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |

## ProductPriceTier — ProductPriceTier

قیمت جاری محصول بر اساس بازه حداقل و حداکثر تعداد سفارش.

| فیلد | نوع Prisma | توضیح |
|---|---|---|
| `id` | `Int` | شناسه یکتای رکورد و کلید اصلی جدول. |
| `productId` | `Int` | شناسه محصول مرتبط با این ProductPriceTier؛ کلید خارجی به جدول Product است. |
| `minQuantity` | `Int` | حداقل تعداد مشمول این سطح یا بازه. |
| `maxQuantity` | `Int?` | حداکثر تعداد مشمول این سطح؛ NULL یعنی سقف مشخص نشده است. |
| `price` | `Decimal` | مبلغ قیمت واحد یا پیشنهادی. |
| `unit` | `String?` | واحد اندازه‌گیری یا فروش. |
| `validFrom` | `DateTime` | شروع اعتبار قیمت یا قاعده. |
| `validTo` | `DateTime?` | پایان اعتبار؛ NULL یعنی تاریخ پایان تعیین نشده است. |
| `createdAt` | `DateTime` | زمان ایجاد رکورد. |
| `updatedAt` | `DateTime` | آخرین زمان ویرایش رکورد. |
| `product` | `Product` | رابطه Prisma با جدول Product (محصول)؛ رکورد مرتبط را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |

## ProductPriceSnapshot — ProductPriceSnapshot

تصویر تاریخی قیمت هر سطح در زمان ثبت برای گزارش و نمودار تغییرات.

| فیلد | نوع Prisma | توضیح |
|---|---|---|
| `id` | `Int` | شناسه یکتای رکورد و کلید اصلی جدول. |
| `productId` | `Int` | شناسه محصول مرتبط با این ProductPriceSnapshot؛ کلید خارجی به جدول Product است. |
| `priceTierId` | `Int?` | شناسه رکورد مرتبط برای اتصال این ProductPriceSnapshot به موجودیت مرجع. |
| `minQuantity` | `Int` | حداقل تعداد مشمول این سطح یا بازه. |
| `maxQuantity` | `Int?` | حداکثر تعداد مشمول این سطح؛ NULL یعنی سقف مشخص نشده است. |
| `price` | `Decimal` | مبلغ قیمت واحد یا پیشنهادی. |
| `unit` | `String?` | واحد اندازه‌گیری یا فروش. |
| `action` | `String` | نوع اقدام انجام‌شده. |
| `recordedAt` | `DateTime` | زمان ثبت snapshot یا داده تاریخی. |
| `product` | `Product` | رابطه Prisma با جدول Product (محصول)؛ رکورد مرتبط را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |

## Inquiry — استعلام

درخواست خرید یا استعلام (RFQ) همراه با خریدار، وضعیت، محرمانگی و مهلت پاسخ.

| فیلد | نوع Prisma | توضیح |
|---|---|---|
| `id` | `Int` | شناسه یکتای رکورد و کلید اصلی جدول. |
| `title` | `String` | عنوان اصلی قابل نمایش. |
| `description` | `String?` | شرح تکمیلی موجودیت. |
| `companyId` | `Int?` | شناسه شرکت مرتبط با این استعلام؛ کلید خارجی به جدول Company است. |
| `buyerUserId` | `Int?` | شناسه کاربر مرتبط با این استعلام؛ کلید خارجی به جدول User است. |
| `status` | `InquiryStatus` | وضعیت چرخه عمر رکورد؛ مقادیر مجاز در Enum مربوط تعریف شده‌اند. |
| `priority` | `InquiryPriority` | اولویت رسیدگی یا پردازش. |
| `visibilityMode` | `InquiryVisibilityMode` | حالت مشاهده و محرمانگی استعلام (عادی، مهروموم‌شده یا ناشناس). |
| `confidential` | `Boolean` | محرمانه بودن استعلام را مشخص می‌کند. |
| `publishDate` | `DateTime?` | زمان انتشار استعلام برای شرکت‌های واجد شرایط. |
| `responseDeadline` | `DateTime?` | آخرین مهلت ثبت پاسخ به استعلام. |
| `autoClose` | `Boolean` | بسته‌شدن خودکار استعلام پس از رسیدن به شرایط/مهلت را کنترل می‌کند. |
| `allowEarlyReveal` | `Boolean` | اجازه آشکارسازی زودتر پاسخ‌های مهروموم‌شده را مشخص می‌کند. |
| `revealedAt` | `DateTime?` | زمان آشکارسازی پاسخ‌های محرمانه استعلام. |
| `allowEditResponse` | `Boolean` | اجازه ویرایش پاسخ ثبت‌شده توسط تأمین‌کننده را کنترل می‌کند. |
| `allowWithdrawResponse` | `Boolean` | اجازه انصراف از پاسخ ثبت‌شده را کنترل می‌کند. |
| `closedAt` | `DateTime?` | زمان بسته‌شدن پرونده یا فرآیند. |
| `createdAt` | `DateTime` | زمان ایجاد رکورد. |
| `updatedAt` | `DateTime` | آخرین زمان ویرایش رکورد. |
| `company` | `Company?` | رابطه Prisma با جدول Company (شرکت)؛ رکورد مرتبط را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |
| `buyerUser` | `User?` | رابطه Prisma با جدول User (کاربر)؛ رکورد مرتبط را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |
| `items` | `InquiryItem[]` | رابطه Prisma با جدول InquiryItem (InquiryItem)؛ مجموعه رکوردهای وابسته را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |
| `responses` | `InquiryResponse[]` | رابطه Prisma با جدول InquiryResponse (InquiryResponse)؛ مجموعه رکوردهای وابسته را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |
| `messages` | `InquiryMessage[]` | رابطه Prisma با جدول InquiryMessage (InquiryMessage)؛ مجموعه رکوردهای وابسته را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |
| `statusHistory` | `InquiryStatusHistory[]` | رابطه Prisma با جدول InquiryStatusHistory (InquiryStatusHistory)؛ مجموعه رکوردهای وابسته را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |

## InquiryMessage — InquiryMessage

پیام‌های میان خریدار و شرکت‌های پاسخ‌دهنده درباره یک استعلام.

| فیلد | نوع Prisma | توضیح |
|---|---|---|
| `id` | `Int` | شناسه یکتای رکورد و کلید اصلی جدول. |
| `inquiryId` | `Int` | شناسه استعلام مرتبط با این InquiryMessage؛ کلید خارجی به جدول Inquiry است. |
| `senderUserId` | `Int?` | شناسه کاربر مرتبط با این InquiryMessage؛ کلید خارجی به جدول User است. |
| `senderCompanyId` | `Int?` | شناسه شرکت مرتبط با این InquiryMessage؛ کلید خارجی به جدول Company است. |
| `recipientUserId` | `Int?` | شناسه کاربر مرتبط با این InquiryMessage؛ کلید خارجی به جدول User است. |
| `recipientCompanyId` | `Int?` | شناسه شرکت مرتبط با این InquiryMessage؛ کلید خارجی به جدول Company است. |
| `body` | `String` | متن کامل پیام، یادداشت یا محتوای رکورد. |
| `createdAt` | `DateTime` | زمان ایجاد رکورد. |
| `readAt` | `DateTime?` | زمان خوانده‌شدن پیام/اعلان. |
| `inquiry` | `Inquiry` | رابطه Prisma با جدول Inquiry (استعلام)؛ رکورد مرتبط را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |
| `senderUser` | `User?` | رابطه Prisma با جدول User (کاربر)؛ رکورد مرتبط را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |
| `senderCompany` | `Company?` | رابطه Prisma با جدول Company (شرکت)؛ رکورد مرتبط را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |
| `recipientUser` | `User?` | رابطه Prisma با جدول User (کاربر)؛ رکورد مرتبط را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |
| `recipientCompany` | `Company?` | رابطه Prisma با جدول Company (شرکت)؛ رکورد مرتبط را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |

## InquiryStatusHistory — InquiryStatusHistory

تاریخچه تغییر وضعیت استعلام همراه با عامل و دلیل تغییر.

| فیلد | نوع Prisma | توضیح |
|---|---|---|
| `id` | `Int` | شناسه یکتای رکورد و کلید اصلی جدول. |
| `inquiryId` | `Int` | شناسه استعلام مرتبط با این InquiryStatusHistory؛ کلید خارجی به جدول Inquiry است. |
| `previousStatus` | `InquiryStatus` | وضعیت قبلی رکورد پیش از تغییر. |
| `newStatus` | `InquiryStatus` | وضعیت جدید رکورد پس از تغییر. |
| `changedByUserId` | `Int?` | شناسه کاربر مرتبط با این InquiryStatusHistory؛ کلید خارجی به جدول User است. |
| `source` | `String` | منبع ایجاد یا ثبت رکورد. |
| `comment` | `String?` | توضیح ثبت‌شده درباره عملیات یا تغییر. |
| `createdAt` | `DateTime` | زمان ایجاد رکورد. |
| `inquiry` | `Inquiry` | رابطه Prisma با جدول Inquiry (استعلام)؛ رکورد مرتبط را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |
| `changedBy` | `User?` | رابطه Prisma با جدول User (کاربر)؛ رکورد مرتبط را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |

## InquiryItem — InquiryItem

اقلام و محصولات درخواست‌شده در یک استعلام به همراه تعداد و توضیح.

| فیلد | نوع Prisma | توضیح |
|---|---|---|
| `id` | `Int` | شناسه یکتای رکورد و کلید اصلی جدول. |
| `inquiryId` | `Int` | شناسه استعلام مرتبط با این InquiryItem؛ کلید خارجی به جدول Inquiry است. |
| `productId` | `Int` | شناسه محصول مرتبط با این InquiryItem؛ کلید خارجی به جدول Product است. |
| `description` | `String?` | شرح تکمیلی موجودیت. |
| `quantity` | `Int` | تعداد واحدهای کالا یا مقدار موردنظر. |
| `attachment` | `String?` | نشانی یا کلید فایل پیوست. |
| `createdAt` | `DateTime` | زمان ایجاد رکورد. |
| `inquiry` | `Inquiry` | رابطه Prisma با جدول Inquiry (استعلام)؛ رکورد مرتبط را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |
| `product` | `Product` | رابطه Prisma با جدول Product (محصول)؛ رکورد مرتبط را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |
| `responseItems` | `InquiryResponseItem[]` | رابطه Prisma با جدول InquiryResponseItem (InquiryResponseItem)؛ مجموعه رکوردهای وابسته را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |

## InquiryResponse — InquiryResponse

پاسخ یا پیشنهاد یک شرکت تأمین‌کننده به یک استعلام.

| فیلد | نوع Prisma | توضیح |
|---|---|---|
| `id` | `Int` | شناسه یکتای رکورد و کلید اصلی جدول. |
| `inquiryId` | `Int` | شناسه استعلام مرتبط با این InquiryResponse؛ کلید خارجی به جدول Inquiry است. |
| `companyId` | `Int` | شناسه شرکت مرتبط با این InquiryResponse؛ کلید خارجی به جدول Company است. |
| `status` | `InquiryResponseStatus` | وضعیت چرخه عمر رکورد؛ مقادیر مجاز در Enum مربوط تعریف شده‌اند. |
| `withdrawnAt` | `DateTime?` | زمان انصراف از پاسخ یا پیشنهاد استعلام. |
| `createdAt` | `DateTime` | زمان ایجاد رکورد. |
| `updatedAt` | `DateTime` | آخرین زمان ویرایش رکورد. |
| `inquiry` | `Inquiry` | رابطه Prisma با جدول Inquiry (استعلام)؛ رکورد مرتبط را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |
| `company` | `Company` | رابطه Prisma با جدول Company (شرکت)؛ رکورد مرتبط را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |
| `items` | `InquiryResponseItem[]` | رابطه Prisma با جدول InquiryResponseItem (InquiryResponseItem)؛ مجموعه رکوردهای وابسته را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |
| `attachments` | `InquiryResponseAttachment[]` | رابطه Prisma با جدول InquiryResponseAttachment (InquiryResponseAttachment)؛ مجموعه رکوردهای وابسته را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |

## InquiryResponseAttachment — InquiryResponseAttachment

فایل‌های پیوست یک پاسخ استعلام به همراه مشخصات فایل.

| فیلد | نوع Prisma | توضیح |
|---|---|---|
| `id` | `Int` | شناسه یکتای رکورد و کلید اصلی جدول. |
| `responseId` | `Int` | شناسه InquiryResponse مرتبط با این InquiryResponseAttachment؛ کلید خارجی به جدول InquiryResponse است. |
| `url` | `String` | نشانی فایل یا منبع مرتبط. |
| `filename` | `String` | نام فایل. |
| `mimetype` | `String?` | نوع رسانه‌ای فایل (MIME type). |
| `size` | `Int?` | اندازه فایل بر حسب بایت. |
| `createdAt` | `DateTime` | زمان ایجاد رکورد. |
| `response` | `InquiryResponse` | رابطه Prisma با جدول InquiryResponse (InquiryResponse)؛ رکورد مرتبط را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |

## InquiryResponseItem — InquiryResponseItem

قیمت و شرایط تأمین پیشنهادی شرکت برای یک قلم استعلام.

| فیلد | نوع Prisma | توضیح |
|---|---|---|
| `id` | `Int` | شناسه یکتای رکورد و کلید اصلی جدول. |
| `responseId` | `Int` | شناسه InquiryResponse مرتبط با این InquiryResponseItem؛ کلید خارجی به جدول InquiryResponse است. |
| `inquiryItemId` | `Int` | شناسه InquiryItem مرتبط با این InquiryResponseItem؛ کلید خارجی به جدول InquiryItem است. |
| `price` | `Decimal` | مبلغ قیمت واحد یا پیشنهادی. |
| `currency` | `String` | کد سه‌حرفی ارز (ISO 4217) مبالغ این رکورد. |
| `availableQuantity` | `Int` | تعداد قابل تأمین در این پیشنهاد. |
| `deliveryTime` | `String?` | زمان یا بازه تحویل پیشنهادی تأمین‌کننده. |
| `description` | `String?` | شرح تکمیلی موجودیت. |
| `response` | `InquiryResponse` | رابطه Prisma با جدول InquiryResponse (InquiryResponse)؛ رکورد مرتبط را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |
| `inquiryItem` | `InquiryItem` | رابطه Prisma با جدول InquiryItem (InquiryItem)؛ رکورد مرتبط را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |

## CompanyInquiryLimit — CompanyInquiryLimit

محدودیت‌های کلی تعداد استعلام باز و پاسخ فعال هر شرکت در ساختار قدیمی.

| فیلد | نوع Prisma | توضیح |
|---|---|---|
| `id` | `Int` | شناسه یکتای رکورد و کلید اصلی جدول. |
| `companyId` | `Int` | شناسه شرکت مرتبط با این CompanyInquiryLimit؛ کلید خارجی به جدول Company است. |
| `maxOpenInquiries` | `Int` | حداکثر تعداد استعلام‌های باز مجاز برای شرکت. |
| `maxActiveResponses` | `Int` | حداکثر تعداد پاسخ‌های فعال مجاز برای شرکت. |
| `createdAt` | `DateTime` | زمان ایجاد رکورد. |
| `updatedAt` | `DateTime` | آخرین زمان ویرایش رکورد. |
| `company` | `Company` | رابطه Prisma با جدول Company (شرکت)؛ رکورد مرتبط را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |

## CompanyLimit — CompanyLimit

سقف‌ها و محدودیت‌های قابل پیکربندی هر شرکت به شکل کلید و مقدار.

| فیلد | نوع Prisma | توضیح |
|---|---|---|
| `id` | `Int` | شناسه یکتای رکورد و کلید اصلی جدول. |
| `companyId` | `Int` | شناسه شرکت مرتبط با این CompanyLimit؛ کلید خارجی به جدول Company است. |
| `key` | `String` | کلید ماشینی تنظیم یا گزینه. |
| `value` | `Int` | مقدار تنظیم یا محدودیت؛ مفهوم آن با key مشخص می‌شود. |
| `createdAt` | `DateTime` | زمان ایجاد رکورد. |
| `updatedAt` | `DateTime` | آخرین زمان ویرایش رکورد. |
| `company` | `Company` | رابطه Prisma با جدول Company (شرکت)؛ رکورد مرتبط را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |

## InquiryPlan — InquiryPlan

تعریف بسته اشتراک استعلام و سهمیه‌های قابل مصرف در هر دوره.

| فیلد | نوع Prisma | توضیح |
|---|---|---|
| `id` | `Int` | شناسه یکتای رکورد و کلید اصلی جدول. |
| `code` | `String` | کد ماشینی یا تجاری این موجودیت. |
| `name` | `String` | نام قابل نمایش موجودیت. |
| `description` | `String?` | شرح تکمیلی موجودیت. |
| `durationDays` | `Int` | مدت دوره بر حسب روز. |
| `price` | `Decimal` | مبلغ قیمت واحد یا پیشنهادی. |
| `currency` | `String` | کد سه‌حرفی ارز (ISO 4217) مبالغ این رکورد. |
| `inquiriesPerPeriod` | `Int` | سهمیه ایجاد استعلام در هر دوره اشتراک. |
| `responsesPerPeriod` | `Int` | سهمیه پاسخ به استعلام در هر دوره اشتراک. |
| `internalMessagesPerPeriod` | `Int` | سهمیه پیام داخلی در هر دوره اشتراک. |
| `smsPerPeriod` | `Int` | سهمیه پیامک در هر دوره اشتراک. |
| `isActive` | `Boolean` | فعال یا غیرفعال بودن رکورد. |
| `createdAt` | `DateTime` | زمان ایجاد رکورد. |
| `updatedAt` | `DateTime` | آخرین زمان ویرایش رکورد. |
| `subscriptions` | `InquirySubscription[]` | رابطه Prisma با جدول InquirySubscription (InquirySubscription)؛ مجموعه رکوردهای وابسته را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |

## InquirySubscription — InquirySubscription

اشتراک تخصیص‌یافته یا خریداری‌شده توسط شرکت/کاربر و بازه اعتبار آن.

| فیلد | نوع Prisma | توضیح |
|---|---|---|
| `id` | `Int` | شناسه یکتای رکورد و کلید اصلی جدول. |
| `planId` | `Int` | شناسه InquiryPlan مرتبط با این InquirySubscription؛ کلید خارجی به جدول InquiryPlan است. |
| `companyId` | `Int?` | شناسه شرکت مرتبط با این InquirySubscription؛ کلید خارجی به جدول Company است. |
| `userId` | `Int?` | شناسه کاربر مرتبط با این InquirySubscription؛ کلید خارجی به جدول User است. |
| `status` | `InquirySubscriptionStatus` | وضعیت چرخه عمر رکورد؛ مقادیر مجاز در Enum مربوط تعریف شده‌اند. |
| `startsAt` | `DateTime?` | زمان شروع اعتبار یا فعال‌بودن. |
| `endsAt` | `DateTime?` | زمان پایان اعتبار یا فعال‌بودن. |
| `activatedBy` | `Int?` | شناسه کاربری که اشتراک را فعال کرده است. |
| `paymentReference` | `String?` | شناسه مرجع پرداخت. |
| `paymentProvider` | `String?` | نام ارائه‌دهنده پرداخت. |
| `paymentAuthority` | `String?` | کد authority درگاه پرداخت. |
| `paymentRefId` | `String?` | شناسه پرداخت در سامانه ارائه‌دهنده. |
| `paymentAmount` | `Int?` | مبلغ پرداخت‌شده برای خرید یا فعال‌سازی اشتراک. |
| `paymentVerifiedAt` | `DateTime?` | زمان تأیید پرداخت. |
| `notes` | `String?` | یادداشت‌های تکمیلی درباره رکورد. |
| `createdAt` | `DateTime` | زمان ایجاد رکورد. |
| `updatedAt` | `DateTime` | آخرین زمان ویرایش رکورد. |
| `plan` | `InquiryPlan` | رابطه Prisma با جدول InquiryPlan (InquiryPlan)؛ رکورد مرتبط را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |
| `company` | `Company?` | رابطه Prisma با جدول Company (شرکت)؛ رکورد مرتبط را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |
| `user` | `User?` | رابطه Prisma با جدول User (کاربر)؛ رکورد مرتبط را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |
| `usage` | `InquiryUsageEvent[]` | رابطه Prisma با جدول InquiryUsageEvent (InquiryUsageEvent)؛ مجموعه رکوردهای وابسته را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |

## InquiryUsageEvent — InquiryUsageEvent

رویداد مصرف سهمیه اشتراک و مرجع عملیاتی آن برای محاسبه مصرف.

| فیلد | نوع Prisma | توضیح |
|---|---|---|
| `id` | `BigInt` | شناسه یکتای رکورد و کلید اصلی جدول. |
| `subscriptionId` | `Int` | شناسه InquirySubscription مرتبط با این InquiryUsageEvent؛ کلید خارجی به جدول InquirySubscription است. |
| `usageType` | `InquiryUsageType` | نوع سهمیه مصرف‌شده در این رویداد. |
| `quantity` | `Int` | تعداد واحدهای کالا یا مقدار موردنظر. |
| `referenceType` | `String?` | نوع موجودیت مرجع عملیات. |
| `referenceId` | `String?` | شناسه موجودیت مرجع عملیات. |
| `idempotencyKey` | `String?` | کلید یکتای جلوگیری از اجرای تکراری درخواست/عملیات. |
| `metadata` | `Json?` | داده‌های تکمیلی ساختاریافته و وابسته به دامنه در قالب JSON. |
| `createdAt` | `DateTime` | زمان ایجاد رکورد. |
| `subscription` | `InquirySubscription` | رابطه Prisma با جدول InquirySubscription (InquirySubscription)؛ رکورد مرتبط را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |

## SystemSetting — SystemSetting

تنظیمات سراسری سامانه به شکل کلید و مقدار.

| فیلد | نوع Prisma | توضیح |
|---|---|---|
| `id` | `Int` | شناسه یکتای رکورد و کلید اصلی جدول. |
| `key` | `String` | کلید ماشینی تنظیم یا گزینه. |
| `value` | `String` | مقدار تنظیم یا محدودیت؛ مفهوم آن با key مشخص می‌شود. |
| `updatedByUserId` | `Int?` | شناسه کاربری که آخرین بار تنظیم را ویرایش کرده است. |
| `createdAt` | `DateTime` | زمان ایجاد رکورد. |
| `updatedAt` | `DateTime` | آخرین زمان ویرایش رکورد. |

## Notification — اعلان

اعلان اصلی متعلق به کاربر، شامل عنوان، متن، نوع و وضعیت خوانده‌شدن.

| فیلد | نوع Prisma | توضیح |
|---|---|---|
| `id` | `Int` | شناسه یکتای رکورد و کلید اصلی جدول. |
| `userId` | `Int` | شناسه کاربر مرتبط با این اعلان؛ کلید خارجی به جدول User است. |
| `type` | `String?` | نوع یا طبقه‌بندی رکورد؛ مقادیر مجاز در Enum یا قرارداد دامنه تعریف شده‌اند. |
| `data` | `Json?` | داده تکمیلی اعلان/رویداد در قالب JSON. |
| `title` | `String` | عنوان اصلی قابل نمایش. |
| `message` | `String` | متن اعلان قابل نمایش به کاربر. |
| `isRead` | `Boolean` | خوانده‌شدن اعلان توسط کاربر. |
| `createdAt` | `DateTime` | زمان ایجاد رکورد. |
| `user` | `User` | رابطه Prisma با جدول User (کاربر)؛ رکورد مرتبط را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |
| `folderMemberships` | `NotificationFolderMembership[]` | رابطه Prisma با جدول NotificationFolderMembership (NotificationFolderMembership)؛ مجموعه رکوردهای وابسته را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |

## NotificationFolder — NotificationFolder

تعریف پوشه‌های سیستمی یا مدیریتی اعلان و محدوده نمایش آن‌ها.

| فیلد | نوع Prisma | توضیح |
|---|---|---|
| `id` | `Int` | شناسه یکتای رکورد و کلید اصلی جدول. |
| `key` | `String` | کلید ماشینی تنظیم یا گزینه. |
| `name` | `String` | نام قابل نمایش موجودیت. |
| `scope` | `NotificationFolderScope` | محدوده اعتبار یا نمایش رکورد. |
| `isSystem` | `Boolean` | سیستمی بودن رکورد و محدودیت مدیریت عادی آن. |
| `isActive` | `Boolean` | فعال یا غیرفعال بودن رکورد. |
| `sortOrder` | `Int` | ترتیب نمایش رکورد در میان موارد هم‌گروه. |
| `createdAt` | `DateTime` | زمان ایجاد رکورد. |
| `updatedAt` | `DateTime` | آخرین زمان ویرایش رکورد. |
| `memberships` | `NotificationFolderMembership[]` | رابطه Prisma با جدول NotificationFolderMembership (NotificationFolderMembership)؛ مجموعه رکوردهای وابسته را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |

## NotificationFolderMembership — NotificationFolderMembership

ارتباط اعلان با پوشه؛ امکان عضویت یک اعلان در پوشه‌ها را ثبت می‌کند.

| فیلد | نوع Prisma | توضیح |
|---|---|---|
| `id` | `Int` | شناسه یکتای رکورد و کلید اصلی جدول. |
| `notificationId` | `Int` | شناسه اعلان مرتبط با این NotificationFolderMembership؛ کلید خارجی به جدول Notification است. |
| `folderId` | `Int` | شناسه NotificationFolder مرتبط با این NotificationFolderMembership؛ کلید خارجی به جدول NotificationFolder است. |
| `createdAt` | `DateTime` | زمان ایجاد رکورد. |
| `notification` | `Notification` | رابطه Prisma با جدول Notification (اعلان)؛ رکورد مرتبط را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |
| `folder` | `NotificationFolder` | رابطه Prisma با جدول NotificationFolder (NotificationFolder)؛ رکورد مرتبط را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |

## NotificationPreference — NotificationPreference

ترجیحات هر کاربر برای دریافت نوع مشخصی از اعلان از طریق یک کانال.

| فیلد | نوع Prisma | توضیح |
|---|---|---|
| `id` | `Int` | شناسه یکتای رکورد و کلید اصلی جدول. |
| `userId` | `Int` | شناسه کاربر مرتبط با این NotificationPreference؛ کلید خارجی به جدول User است. |
| `eventType` | `String` | نوع رویداد ثبت‌شده. |
| `channel` | `NotificationChannel` | کانال ارسال یا دریافت. |
| `enabled` | `Boolean` | فعال بودن این ترجیح یا کانال برای کاربر. |
| `createdAt` | `DateTime` | زمان ایجاد رکورد. |
| `updatedAt` | `DateTime` | آخرین زمان ویرایش رکورد. |
| `user` | `User` | رابطه Prisma با جدول User (کاربر)؛ رکورد مرتبط را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |

## NotificationDelivery — NotificationDelivery

تلاش‌ها و وضعیت تحویل اعلان از طریق ایمیل، پیامک یا کانال دیگر.

| فیلد | نوع Prisma | توضیح |
|---|---|---|
| `id` | `Int` | شناسه یکتای رکورد و کلید اصلی جدول. |
| `userId` | `Int` | شناسه کاربر مرتبط با این NotificationDelivery؛ کلید خارجی به جدول User است. |
| `notificationId` | `Int?` | شناسه اعلان اصلی که این رکورد تحویل/ارسال آن را دنبال می‌کند. |
| `eventType` | `String` | نوع رویداد ثبت‌شده. |
| `channel` | `NotificationChannel` | کانال ارسال یا دریافت. |
| `status` | `NotificationDeliveryStatus` | وضعیت چرخه عمر رکورد؛ مقادیر مجاز در Enum مربوط تعریف شده‌اند. |
| `recipient` | `String?` | مقدار متنی recipient برای توصیف یا شناسایی NotificationDelivery. |
| `subject` | `String?` | موضوع پیام، تیکت یا فعالیت برای نمایش و جست‌وجو. |
| `body` | `String?` | متن کامل پیام، یادداشت یا محتوای رکورد. |
| `provider` | `String?` | نام درگاه یا سرویس بیرونی انجام‌دهنده عملیات. |
| `attempts` | `Int` | تعداد تلاش‌های ارسال یا پردازش. |
| `maxAttempts` | `Int` | حداکثر تعداد تلاش مجاز. |
| `nextAttemptAt` | `DateTime` | زمان برنامه‌ریزی‌شده تلاش بعدی برای ارسال اعلان. |
| `lastError` | `String?` | آخرین خطای رخ‌داده هنگام پردازش/ارسال. |
| `sentAt` | `DateTime?` | زمان ارسال موفق پیام. |
| `dedupeKey` | `String?` | کلید تشخیص و جلوگیری از ثبت/پردازش تکراری رویداد. |
| `createdAt` | `DateTime` | زمان ایجاد رکورد. |
| `updatedAt` | `DateTime` | آخرین زمان ویرایش رکورد. |
| `user` | `User` | رابطه Prisma با جدول User (کاربر)؛ رکورد مرتبط را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |

## Banner — Banner

بنرهای وب‌سایت همراه با محتوا، مقصد کلیک، جایگاه و بازه نمایش.

| فیلد | نوع Prisma | توضیح |
|---|---|---|
| `id` | `Int` | شناسه یکتای رکورد و کلید اصلی جدول. |
| `title` | `String` | عنوان اصلی قابل نمایش. |
| `description` | `String?` | شرح تکمیلی موجودیت. |
| `imageUrl` | `String` | نشانی تصویر. |
| `targetUrl` | `String?` | نشانی مقصدی که با کلیک روی بنر باز می‌شود. |
| `ctaLabel` | `String?` | متن برچسب دکمه فراخوان اقدام روی بنر. |
| `placement` | `String` | جایگاه نمایش بنر در رابط کاربری. |
| `sortOrder` | `Int` | ترتیب نمایش رکورد در میان موارد هم‌گروه. |
| `status` | `BannerStatus` | وضعیت چرخه عمر رکورد؛ مقادیر مجاز در Enum مربوط تعریف شده‌اند. |
| `isActive` | `Boolean` | فعال یا غیرفعال بودن رکورد. |
| `startsAt` | `DateTime?` | زمان شروع اعتبار یا فعال‌بودن. |
| `endsAt` | `DateTime?` | زمان پایان اعتبار یا فعال‌بودن. |
| `createdAt` | `DateTime` | زمان ایجاد رکورد. |
| `updatedAt` | `DateTime` | آخرین زمان ویرایش رکورد. |
| `deletedAt` | `DateTime?` | زمان حذف نرم؛ NULL یعنی رکورد حذف نرم نشده است. |

## AuthChallenge — AuthChallenge

چالش یک‌بارمصرف احراز هویت/بازیابی حساب؛ فقط هش راز ذخیره و انقضا و تعداد تلاش کنترل می‌شود.

| فیلد | نوع Prisma | توضیح |
|---|---|---|
| `id` | `Int` | شناسه یکتای رکورد و کلید اصلی جدول. |
| `userId` | `Int` | شناسه کاربر مرتبط با این AuthChallenge؛ کلید خارجی به جدول User است. |
| `purpose` | `AuthChallengePurpose` | هدف استفاده از چالش/کد. |
| `channel` | `AuthChallengeChannel` | کانال ارسال یا دریافت. |
| `destination` | `String` | مقصد ارسال کد یا پیام مانند شماره تلفن یا ایمیل. |
| `secretHash` | `String` | هش راز/کد یک‌بارمصرف؛ مقدار خام ذخیره نمی‌شود. |
| `expiresAt` | `DateTime` | زمان انقضای اعتبار رکورد یا توکن. |
| `consumedAt` | `DateTime?` | زمان مصرف‌شدن چالش یک‌بارمصرف یا رزرو موجودی. |
| `attemptCount` | `Int` | تعداد تلاش‌های انجام‌شده. |
| `maxAttempts` | `Int` | حداکثر تعداد تلاش مجاز. |
| `invalidatedAt` | `DateTime?` | زمان باطل‌شدن چالش احراز هویت پیش از مصرف یا انقضا. |
| `createdAt` | `DateTime` | زمان ایجاد رکورد. |
| `user` | `User` | رابطه Prisma با جدول User (کاربر)؛ رکورد مرتبط را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |

## AuditLog — AuditLog

رخدادهای ممیزی عملیات؛ عامل، شرکت، موجودیت هدف، نتیجه و مشخصات درخواست را به‌صورت ثبت غیرقابل‌ویرایش نگه می‌دارد.

| فیلد | نوع Prisma | توضیح |
|---|---|---|
| `id` | `BigInt` | شناسه یکتای رکورد و کلید اصلی جدول. |
| `actorUserId` | `Int?` | شناسه کاربر مرتبط با این AuditLog؛ کلید خارجی به جدول User است. |
| `actorAccessType` | `String?` | نوع زمینه دسترسی عامل ثبت‌کننده رخداد ممیزی. |
| `companyId` | `Int?` | شناسه شرکت مرتبط با این AuditLog؛ کلید خارجی به جدول Company است. |
| `action` | `String` | نوع اقدام انجام‌شده. |
| `entityType` | `String` | نام نوع موجودیت هدف عملیات ممیزی. |
| `entityId` | `String` | شناسه رکورد هدف در موجودیت ثبت‌شده در entityType. |
| `requestId` | `String?` | شناسه هم‌بستگی درخواست برای ردگیری در لاگ‌ها. |
| `source` | `String?` | منبع ایجاد یا ثبت رکورد. |
| `outcome` | `String` | نتیجه فعالیت یا عملیات. |
| `ipAddress` | `String?` | نشانی IP مبدأ درخواست برای ممیزی/امنیت. |
| `userAgent` | `String?` | مشخصات مرورگر یا کلاینت درخواست‌دهنده. |
| `metadata` | `Json?` | داده‌های تکمیلی ساختاریافته و وابسته به دامنه در قالب JSON. |
| `occurredAt` | `DateTime` | زمان وقوع رویداد در منبع. |
| `actor` | `User?` | رابطه Prisma با جدول User (کاربر)؛ رکورد مرتبط را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |
| `company` | `Company?` | رابطه Prisma با جدول Company (شرکت)؛ رکورد مرتبط را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |

## SupportQueue — SupportQueue

صف‌های کاری تیم پشتیبانی برای دسته‌بندی و ارجاع تیکت‌ها.

| فیلد | نوع Prisma | توضیح |
|---|---|---|
| `id` | `Int` | شناسه یکتای رکورد و کلید اصلی جدول. |
| `key` | `String` | کلید ماشینی تنظیم یا گزینه. |
| `name` | `String` | نام قابل نمایش موجودیت. |
| `description` | `String?` | شرح تکمیلی موجودیت. |
| `isActive` | `Boolean` | فعال یا غیرفعال بودن رکورد. |
| `sortOrder` | `Int` | ترتیب نمایش رکورد در میان موارد هم‌گروه. |
| `createdAt` | `DateTime` | زمان ایجاد رکورد. |
| `updatedAt` | `DateTime` | آخرین زمان ویرایش رکورد. |
| `tickets` | `SupportTicket[]` | رابطه Prisma با جدول SupportTicket (تیکت پشتیبانی)؛ مجموعه رکوردهای وابسته را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |
| `assignments` | `SupportAssignment[]` | رابطه Prisma با جدول SupportAssignment (SupportAssignment)؛ مجموعه رکوردهای وابسته را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |

## SupportCategory — SupportCategory

دسته‌بندی موضوعی تیکت‌های پشتیبانی و مبنای اتصال سیاست SLA.

| فیلد | نوع Prisma | توضیح |
|---|---|---|
| `id` | `Int` | شناسه یکتای رکورد و کلید اصلی جدول. |
| `key` | `String` | کلید ماشینی تنظیم یا گزینه. |
| `name` | `String` | نام قابل نمایش موجودیت. |
| `description` | `String?` | شرح تکمیلی موجودیت. |
| `isActive` | `Boolean` | فعال یا غیرفعال بودن رکورد. |
| `sortOrder` | `Int` | ترتیب نمایش رکورد در میان موارد هم‌گروه. |
| `createdAt` | `DateTime` | زمان ایجاد رکورد. |
| `updatedAt` | `DateTime` | آخرین زمان ویرایش رکورد. |
| `tickets` | `SupportTicket[]` | رابطه Prisma با جدول SupportTicket (تیکت پشتیبانی)؛ مجموعه رکوردهای وابسته را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |
| `slaPolicies` | `SupportSlaPolicy[]` | رابطه Prisma با جدول SupportSlaPolicy (SupportSlaPolicy)؛ مجموعه رکوردهای وابسته را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |

## SupportSlaPolicy — SupportSlaPolicy

زمان هدف پاسخ اولیه و حل تیکت بر اساس دسته و اولویت.

| فیلد | نوع Prisma | توضیح |
|---|---|---|
| `id` | `Int` | شناسه یکتای رکورد و کلید اصلی جدول. |
| `categoryId` | `Int?` | شناسه SupportCategory مرتبط با این SupportSlaPolicy؛ کلید خارجی به جدول SupportCategory است. |
| `priority` | `SupportPriority` | اولویت رسیدگی یا پردازش. |
| `firstResponseMinutes` | `Int` | حداکثر زمان هدف برای پاسخ اولیه بر حسب دقیقه. |
| `resolutionMinutes` | `Int` | حداکثر زمان هدف برای حل تیکت بر حسب دقیقه. |
| `workingCalendar` | `Json?` | تعریف تقویم/ساعات کاری مورد استفاده برای محاسبه SLA. |
| `isActive` | `Boolean` | فعال یا غیرفعال بودن رکورد. |
| `createdAt` | `DateTime` | زمان ایجاد رکورد. |
| `updatedAt` | `DateTime` | آخرین زمان ویرایش رکورد. |
| `category` | `SupportCategory?` | رابطه Prisma با جدول SupportCategory (SupportCategory)؛ رکورد مرتبط را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |

## SupportTicket — تیکت پشتیبانی

پرونده اصلی درخواست پشتیبانی شامل درخواست‌کننده، موضوع، وضعیت، اولویت، مسئول و مهلت‌های SLA.

| فیلد | نوع Prisma | توضیح |
|---|---|---|
| `id` | `Int` | شناسه یکتای رکورد و کلید اصلی جدول. |
| `ticketNumber` | `String` | مقدار متنی ticketNumber برای توصیف یا شناسایی تیکت پشتیبانی. |
| `requesterUserId` | `Int` | شناسه کاربر مرتبط با این تیکت پشتیبانی؛ کلید خارجی به جدول User است. |
| `requesterCompanyId` | `Int?` | شناسه شرکت مرتبط با این تیکت پشتیبانی؛ کلید خارجی به جدول Company است. |
| `categoryId` | `Int?` | شناسه SupportCategory مرتبط با این تیکت پشتیبانی؛ کلید خارجی به جدول SupportCategory است. |
| `assignedQueueId` | `Int?` | شناسه SupportQueue مرتبط با این تیکت پشتیبانی؛ کلید خارجی به جدول SupportQueue است. |
| `assignedUserId` | `Int?` | شناسه کاربر مرتبط با این تیکت پشتیبانی؛ کلید خارجی به جدول User است. |
| `createdFrom` | `SupportCreatedFrom` | کانال ایجاد تیکت. |
| `status` | `SupportTicketStatus` | وضعیت چرخه عمر رکورد؛ مقادیر مجاز در Enum مربوط تعریف شده‌اند. |
| `priority` | `SupportPriority` | اولویت رسیدگی یا پردازش. |
| `subject` | `String` | موضوع پیام، تیکت یا فعالیت برای نمایش و جست‌وجو. |
| `firstResponseDueAt` | `DateTime?` | مهلت هدف اولین پاسخ طبق SLA. |
| `resolveDueAt` | `DateTime?` | مهلت هدف حل تیکت طبق SLA. |
| `firstRespondedAt` | `DateTime?` | زمان اولین پاسخ کارشناسی به تیکت. |
| `resolvedAt` | `DateTime?` | زمان حل‌شدن تیکت. |
| `closedAt` | `DateTime?` | زمان بسته‌شدن پرونده یا فرآیند. |
| `lastActivityAt` | `DateTime` | زمان آخرین فعالیت ثبت‌شده روی تیکت. |
| `createdAt` | `DateTime` | زمان ایجاد رکورد. |
| `updatedAt` | `DateTime` | آخرین زمان ویرایش رکورد. |
| `requester` | `User` | رابطه Prisma با جدول User (کاربر)؛ رکورد مرتبط را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |
| `requesterCompany` | `Company?` | رابطه Prisma با جدول Company (شرکت)؛ رکورد مرتبط را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |
| `category` | `SupportCategory?` | رابطه Prisma با جدول SupportCategory (SupportCategory)؛ رکورد مرتبط را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |
| `assignedQueue` | `SupportQueue?` | رابطه Prisma با جدول SupportQueue (SupportQueue)؛ رکورد مرتبط را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |
| `assignedUser` | `User?` | رابطه Prisma با جدول User (کاربر)؛ رکورد مرتبط را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |
| `messages` | `SupportMessage[]` | رابطه Prisma با جدول SupportMessage (SupportMessage)؛ مجموعه رکوردهای وابسته را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |
| `assignments` | `SupportAssignment[]` | رابطه Prisma با جدول SupportAssignment (SupportAssignment)؛ مجموعه رکوردهای وابسته را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |
| `statusHistory` | `SupportStatusHistory[]` | رابطه Prisma با جدول SupportStatusHistory (SupportStatusHistory)؛ مجموعه رکوردهای وابسته را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |
| `events` | `SupportEvent[]` | رابطه Prisma با جدول SupportEvent (SupportEvent)؛ مجموعه رکوردهای وابسته را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |

## SupportMessage — SupportMessage

پیام‌های تیکت پشتیبانی با مشخص بودن نویسنده و سطح مشاهده عمومی/داخلی.

| فیلد | نوع Prisma | توضیح |
|---|---|---|
| `id` | `Int` | شناسه یکتای رکورد و کلید اصلی جدول. |
| `ticketId` | `Int` | شناسه تیکت پشتیبانی مرتبط با این SupportMessage؛ کلید خارجی به جدول SupportTicket است. |
| `senderUserId` | `Int` | شناسه کاربر مرتبط با این SupportMessage؛ کلید خارجی به جدول User است. |
| `visibility` | `SupportMessageVisibility` | سطح مشاهده و دسترسی به محتوا. |
| `body` | `String` | متن کامل پیام، یادداشت یا محتوای رکورد. |
| `createdAt` | `DateTime` | زمان ایجاد رکورد. |
| `ticket` | `SupportTicket` | رابطه Prisma با جدول SupportTicket (تیکت پشتیبانی)؛ رکورد مرتبط را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |
| `sender` | `User` | رابطه Prisma با جدول User (کاربر)؛ رکورد مرتبط را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |
| `attachments` | `SupportAttachment[]` | رابطه Prisma با جدول SupportAttachment (SupportAttachment)؛ مجموعه رکوردهای وابسته را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |

## SupportAttachment — SupportAttachment

فراداده فایل پیوست پیام پشتیبانی شامل مسیر ذخیره، نوع، اندازه و وضعیت بررسی.

| فیلد | نوع Prisma | توضیح |
|---|---|---|
| `id` | `Int` | شناسه یکتای رکورد و کلید اصلی جدول. |
| `messageId` | `Int` | شناسه SupportMessage مرتبط با این SupportAttachment؛ کلید خارجی به جدول SupportMessage است. |
| `uploadedByUserId` | `Int` | شناسه کاربر مرتبط با این SupportAttachment؛ کلید خارجی به جدول User است. |
| `storageKey` | `String` | کلید فایل در فضای ذخیره‌سازی؛ خود فایل در دیتابیس ذخیره نمی‌شود. |
| `originalName` | `String` | نام اصلی فایل پیش از ذخیره‌سازی. |
| `mimeType` | `String` | نوع رسانه‌ای فایل (MIME type). |
| `sizeBytes` | `BigInt` | اندازه فایل بر حسب بایت. |
| `checksum` | `String?` | چکیده محتوای فایل برای بررسی یکپارچگی. |
| `status` | `SupportAttachmentStatus` | وضعیت چرخه عمر رکورد؛ مقادیر مجاز در Enum مربوط تعریف شده‌اند. |
| `createdAt` | `DateTime` | زمان ایجاد رکورد. |
| `message` | `SupportMessage` | رابطه Prisma با جدول SupportMessage (SupportMessage)؛ رکورد مرتبط را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |
| `uploadedBy` | `User` | رابطه Prisma با جدول User (کاربر)؛ رکورد مرتبط را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |

## SupportAssignment — SupportAssignment

تاریخچه ارجاع تیکت به صف یا کارشناس با زمان شروع و پایان تخصیص.

| فیلد | نوع Prisma | توضیح |
|---|---|---|
| `id` | `Int` | شناسه یکتای رکورد و کلید اصلی جدول. |
| `ticketId` | `Int` | شناسه تیکت پشتیبانی مرتبط با این SupportAssignment؛ کلید خارجی به جدول SupportTicket است. |
| `queueId` | `Int?` | شناسه SupportQueue مرتبط با این SupportAssignment؛ کلید خارجی به جدول SupportQueue است. |
| `assignedUserId` | `Int?` | شناسه کاربر مرتبط با این SupportAssignment؛ کلید خارجی به جدول User است. |
| `assignedByUserId` | `Int` | شناسه کاربر مرتبط با این SupportAssignment؛ کلید خارجی به جدول User است. |
| `reason` | `String?` | علت درخواست، تغییر وضعیت یا تصمیم. |
| `assignedAt` | `DateTime` | زمان شروع تخصیص این نقش یا مسئولیت. |
| `endedAt` | `DateTime?` | زمان ended این SupportAssignment را ثبت می‌کند. |
| `ticket` | `SupportTicket` | رابطه Prisma با جدول SupportTicket (تیکت پشتیبانی)؛ رکورد مرتبط را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |
| `queue` | `SupportQueue?` | رابطه Prisma با جدول SupportQueue (SupportQueue)؛ رکورد مرتبط را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |
| `assignee` | `User?` | رابطه Prisma با جدول User (کاربر)؛ رکورد مرتبط را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |
| `assignedBy` | `User` | رابطه Prisma با جدول User (کاربر)؛ رکورد مرتبط را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |

## SupportStatusHistory — SupportStatusHistory

تاریخچه تغییر وضعیت تیکت همراه با عامل و دلیل تغییر.

| فیلد | نوع Prisma | توضیح |
|---|---|---|
| `id` | `Int` | شناسه یکتای رکورد و کلید اصلی جدول. |
| `ticketId` | `Int` | شناسه تیکت پشتیبانی مرتبط با این SupportStatusHistory؛ کلید خارجی به جدول SupportTicket است. |
| `previous` | `SupportTicketStatus?` | مقدار/وضعیت قبلی پیش از تغییر. |
| `next` | `SupportTicketStatus` | مقدار/وضعیت جدید پس از تغییر. |
| `actorUserId` | `Int?` | شناسه کاربر مرتبط با این SupportStatusHistory؛ کلید خارجی به جدول User است. |
| `reason` | `String?` | علت درخواست، تغییر وضعیت یا تصمیم. |
| `createdAt` | `DateTime` | زمان ایجاد رکورد. |
| `ticket` | `SupportTicket` | رابطه Prisma با جدول SupportTicket (تیکت پشتیبانی)؛ رکورد مرتبط را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |
| `actor` | `User?` | رابطه Prisma با جدول User (کاربر)؛ رکورد مرتبط را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |

## SupportEvent — SupportEvent

رویدادهای دامنه پشتیبانی برای پردازش و جلوگیری از اجرای تکراری.

| فیلد | نوع Prisma | توضیح |
|---|---|---|
| `id` | `BigInt` | شناسه یکتای رکورد و کلید اصلی جدول. |
| `ticketId` | `Int?` | شناسه تیکت پشتیبانی مرتبط با این SupportEvent؛ کلید خارجی به جدول SupportTicket است. |
| `actorUserId` | `Int?` | شناسه کاربر مرتبط با این SupportEvent؛ کلید خارجی به جدول User است. |
| `eventType` | `String` | نوع رویداد ثبت‌شده. |
| `dedupeKey` | `String?` | کلید تشخیص و جلوگیری از ثبت/پردازش تکراری رویداد. |
| `payload` | `Json?` | بدنه ساختاریافته یا خام رویداد دریافتی/داخلی. |
| `occurredAt` | `DateTime` | زمان وقوع رویداد در منبع. |
| `processedAt` | `DateTime?` | زمان پایان پردازش رویداد/عملیات. |
| `ticket` | `SupportTicket?` | رابطه Prisma با جدول SupportTicket (تیکت پشتیبانی)؛ رکورد مرتبط را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |
| `actor` | `User?` | رابطه Prisma با جدول User (کاربر)؛ رکورد مرتبط را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |

## Article — مقاله

محتوای مقاله/مجله شامل متن، وضعیت انتشار، نویسنده، زمان‌بندی و فراداده SEO.

| فیلد | نوع Prisma | توضیح |
|---|---|---|
| `id` | `Int` | شناسه یکتای رکورد و کلید اصلی جدول. |
| `slug` | `String` | شناسه متنی خوانا و یکتای مناسب URL. |
| `title` | `String` | عنوان اصلی قابل نمایش. |
| `excerpt` | `String?` | چکیده کوتاه محتوا برای پیش‌نمایش. |
| `content` | `String` | محتوای اصلی متن یا مقاله. |
| `contentFormat` | `String` | قالب یا نحوه تفسیر محتوای مقاله. |
| `type` | `ArticleType` | نوع یا طبقه‌بندی رکورد؛ مقادیر مجاز در Enum یا قرارداد دامنه تعریف شده‌اند. |
| `status` | `ArticleStatus` | وضعیت چرخه عمر رکورد؛ مقادیر مجاز در Enum مربوط تعریف شده‌اند. |
| `coverImageKey` | `String?` | کلید فایل تصویر جلد مقاله در فضای ذخیره‌سازی. |
| `authorUserId` | `Int` | شناسه کاربر مرتبط با این مقاله؛ کلید خارجی به جدول User است. |
| `publishedByUserId` | `Int?` | شناسه کاربر مرتبط با این مقاله؛ کلید خارجی به جدول User است. |
| `publishedAt` | `DateTime?` | زمان انتشار عمومی محتوا. |
| `scheduledAt` | `DateTime?` | زمان برنامه‌ریزی‌شده انتشار. |
| `metaTitle` | `String?` | عنوان SEO صفحه. |
| `metaDescription` | `String?` | توضیح SEO صفحه. |
| `canonicalUrl` | `String?` | نشانی canonical صفحه برای موتورهای جست‌وجو. |
| `isIndexable` | `Boolean` | اجازه ایندکس‌شدن صفحه توسط موتورهای جست‌وجو. |
| `createdAt` | `DateTime` | زمان ایجاد رکورد. |
| `updatedAt` | `DateTime` | آخرین زمان ویرایش رکورد. |
| `author` | `User` | رابطه Prisma با جدول User (کاربر)؛ رکورد مرتبط را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |
| `publishedBy` | `User?` | رابطه Prisma با جدول User (کاربر)؛ رکورد مرتبط را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |
| `categories` | `ArticleCategoryAssignment[]` | رابطه Prisma با جدول ArticleCategoryAssignment (ArticleCategoryAssignment)؛ مجموعه رکوردهای وابسته را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |
| `tags` | `ArticleTagAssignment[]` | رابطه Prisma با جدول ArticleTagAssignment (ArticleTagAssignment)؛ مجموعه رکوردهای وابسته را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |
| `revisions` | `ArticleRevision[]` | رابطه Prisma با جدول ArticleRevision (ArticleRevision)؛ مجموعه رکوردهای وابسته را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |
| `media` | `ArticleMedia[]` | رابطه Prisma با جدول ArticleMedia (ArticleMedia)؛ مجموعه رکوردهای وابسته را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |

## ArticleCategory — ArticleCategory

دسته‌بندی مطالب مجله برای گروه‌بندی و فیلتر محتوا.

| فیلد | نوع Prisma | توضیح |
|---|---|---|
| `id` | `Int` | شناسه یکتای رکورد و کلید اصلی جدول. |
| `slug` | `String` | شناسه متنی خوانا و یکتای مناسب URL. |
| `name` | `String` | نام قابل نمایش موجودیت. |
| `sortOrder` | `Int` | ترتیب نمایش رکورد در میان موارد هم‌گروه. |
| `isActive` | `Boolean` | فعال یا غیرفعال بودن رکورد. |
| `createdAt` | `DateTime` | زمان ایجاد رکورد. |
| `updatedAt` | `DateTime` | آخرین زمان ویرایش رکورد. |
| `articles` | `ArticleCategoryAssignment[]` | رابطه Prisma با جدول ArticleCategoryAssignment (ArticleCategoryAssignment)؛ مجموعه رکوردهای وابسته را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |

## ArticleTag — ArticleTag

برچسب‌های موضوعی مطالب برای جست‌وجو و ارتباط محتوایی.

| فیلد | نوع Prisma | توضیح |
|---|---|---|
| `id` | `Int` | شناسه یکتای رکورد و کلید اصلی جدول. |
| `slug` | `String` | شناسه متنی خوانا و یکتای مناسب URL. |
| `name` | `String` | نام قابل نمایش موجودیت. |
| `createdAt` | `DateTime` | زمان ایجاد رکورد. |
| `articles` | `ArticleTagAssignment[]` | رابطه Prisma با جدول ArticleTagAssignment (ArticleTagAssignment)؛ مجموعه رکوردهای وابسته را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |

## ArticleCategoryAssignment — ArticleCategoryAssignment

رابط مقاله و دسته‌بندی به همراه ترتیب نمایش مقاله در دسته.

| فیلد | نوع Prisma | توضیح |
|---|---|---|
| `articleId` | `Int` | شناسه مقاله مرتبط با این ArticleCategoryAssignment؛ کلید خارجی به جدول Article است. |
| `categoryId` | `Int` | شناسه ArticleCategory مرتبط با این ArticleCategoryAssignment؛ کلید خارجی به جدول ArticleCategory است. |
| `sortOrder` | `Int` | ترتیب نمایش رکورد در میان موارد هم‌گروه. |
| `article` | `Article` | رابطه Prisma با جدول Article (مقاله)؛ رکورد مرتبط را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |
| `category` | `ArticleCategory` | رابطه Prisma با جدول ArticleCategory (ArticleCategory)؛ رکورد مرتبط را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |

## ArticleTagAssignment — ArticleTagAssignment

رابط چندبه‌چند مقاله و برچسب.

| فیلد | نوع Prisma | توضیح |
|---|---|---|
| `articleId` | `Int` | شناسه مقاله مرتبط با این ArticleTagAssignment؛ کلید خارجی به جدول Article است. |
| `tagId` | `Int` | شناسه ArticleTag مرتبط با این ArticleTagAssignment؛ کلید خارجی به جدول ArticleTag است. |
| `article` | `Article` | رابطه Prisma با جدول Article (مقاله)؛ رکورد مرتبط را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |
| `tag` | `ArticleTag` | رابطه Prisma با جدول ArticleTag (ArticleTag)؛ رکورد مرتبط را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |

## ArticleRevision — ArticleRevision

نسخه‌های محتوای مقاله به‌صورت snapshot برای نگهداری سابقه ویرایش.

| فیلد | نوع Prisma | توضیح |
|---|---|---|
| `id` | `BigInt` | شناسه یکتای رکورد و کلید اصلی جدول. |
| `articleId` | `Int` | شناسه مقاله مرتبط با این ArticleRevision؛ کلید خارجی به جدول Article است. |
| `editorUserId` | `Int` | شناسه کاربر مرتبط با این ArticleRevision؛ کلید خارجی به جدول User است. |
| `revisionNo` | `Int` | شماره ترتیبی نسخه مقاله. |
| `snapshot` | `Json` | تصویر ثابت داده در زمان ثبت برای حفظ سابقه. |
| `changeNote` | `String?` | توضیحی که ویرایشگر برای تغییرات این نسخه مقاله ثبت کرده است. |
| `createdAt` | `DateTime` | زمان ایجاد رکورد. |
| `article` | `Article` | رابطه Prisma با جدول Article (مقاله)؛ رکورد مرتبط را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |
| `editor` | `User` | رابطه Prisma با جدول User (کاربر)؛ رکورد مرتبط را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |

## ArticleMedia — ArticleMedia

فراداده رسانه‌های مقاله شامل کلید ذخیره‌سازی و مشخصات فایل.

| فیلد | نوع Prisma | توضیح |
|---|---|---|
| `id` | `Int` | شناسه یکتای رکورد و کلید اصلی جدول. |
| `articleId` | `Int` | شناسه مقاله مرتبط با این ArticleMedia؛ کلید خارجی به جدول Article است. |
| `uploadedByUserId` | `Int` | شناسه کاربر مرتبط با این ArticleMedia؛ کلید خارجی به جدول User است. |
| `storageKey` | `String` | کلید فایل در فضای ذخیره‌سازی؛ خود فایل در دیتابیس ذخیره نمی‌شود. |
| `originalName` | `String` | نام اصلی فایل پیش از ذخیره‌سازی. |
| `mimeType` | `String` | نوع رسانه‌ای فایل (MIME type). |
| `sizeBytes` | `BigInt` | اندازه فایل بر حسب بایت. |
| `altText` | `String?` | متن جایگزین تصویر برای دسترس‌پذیری و سئو. |
| `createdAt` | `DateTime` | زمان ایجاد رکورد. |
| `article` | `Article` | رابطه Prisma با جدول Article (مقاله)؛ رکورد مرتبط را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |
| `uploadedBy` | `User` | رابطه Prisma با جدول User (کاربر)؛ رکورد مرتبط را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |

## CRMAccount — CRMAccount

پرونده حساب مشتری/سازمان در CRM و پیوند آن به شرکت یا کاربر موجود.

| فیلد | نوع Prisma | توضیح |
|---|---|---|
| `id` | `Int` | شناسه یکتای رکورد و کلید اصلی جدول. |
| `accountType` | `CRMAccountType` | نوع حساب CRM (شرکت یا شخص) را مشخص می‌کند. |
| `displayName` | `String` | نام کامل/نمایشی این حساب یا سرنخ برای نمایش در CRM. |
| `companyId` | `Int?` | شناسه شرکت مرتبط با این CRMAccount؛ کلید خارجی به جدول Company است. |
| `userId` | `Int?` | شناسه کاربر مرتبط با این CRMAccount؛ کلید خارجی به جدول User است. |
| `ownerUserId` | `Int` | شناسه کاربر مرتبط با این CRMAccount؛ کلید خارجی به جدول User است. |
| `lifecycle` | `String` | وضعیت چرخه عمر حساب در فرایند CRM. |
| `source` | `String?` | منبع ایجاد یا ثبت رکورد. |
| `notes` | `String?` | یادداشت‌های تکمیلی درباره رکورد. |
| `createdAt` | `DateTime` | زمان ایجاد رکورد. |
| `updatedAt` | `DateTime` | آخرین زمان ویرایش رکورد. |
| `company` | `Company?` | رابطه Prisma با جدول Company (شرکت)؛ رکورد مرتبط را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |
| `user` | `User?` | رابطه Prisma با جدول User (کاربر)؛ رکورد مرتبط را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |
| `owner` | `User` | رابطه Prisma با جدول User (کاربر)؛ رکورد مرتبط را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |
| `contacts` | `CRMContact[]` | رابطه Prisma با جدول CRMContact (CRMContact)؛ مجموعه رکوردهای وابسته را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |
| `leads` | `Lead[]` | رابطه Prisma با جدول Lead (سرنخ فروش)؛ مجموعه رکوردهای وابسته را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |
| `opportunities` | `Opportunity[]` | رابطه Prisma با جدول Opportunity (فرصت فروش)؛ مجموعه رکوردهای وابسته را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |
| `activities` | `CRMActivity[]` | رابطه Prisma با جدول CRMActivity (CRMActivity)؛ مجموعه رکوردهای وابسته را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |
| `tasks` | `CRMTask[]` | رابطه Prisma با جدول CRMTask (CRMTask)؛ مجموعه رکوردهای وابسته را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |
| `notesLog` | `CRMNote[]` | رابطه Prisma با جدول CRMNote (CRMNote)؛ مجموعه رکوردهای وابسته را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |

## CRMContact — CRMContact

اشخاص رابط یک حساب CRM و اطلاعات تماس آن‌ها.

| فیلد | نوع Prisma | توضیح |
|---|---|---|
| `id` | `Int` | شناسه یکتای رکورد و کلید اصلی جدول. |
| `accountId` | `Int` | شناسه CRMAccount مرتبط با این CRMContact؛ کلید خارجی به جدول CRMAccount است. |
| `userId` | `Int?` | شناسه کاربر مرتبط با این CRMContact؛ کلید خارجی به جدول User است. |
| `name` | `String` | نام قابل نمایش موجودیت. |
| `title` | `String?` | عنوان اصلی قابل نمایش. |
| `email` | `String?` | نشانی ایمیل مرتبط. |
| `phone` | `String?` | شماره تماس مرتبط. |
| `isPrimary` | `Boolean` | اصلی بودن این مورد در میان موارد مرتبط. |
| `notes` | `String?` | یادداشت‌های تکمیلی درباره رکورد. |
| `createdAt` | `DateTime` | زمان ایجاد رکورد. |
| `updatedAt` | `DateTime` | آخرین زمان ویرایش رکورد. |
| `account` | `CRMAccount` | رابطه Prisma با جدول CRMAccount (CRMAccount)؛ رکورد مرتبط را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |
| `user` | `User?` | رابطه Prisma با جدول User (کاربر)؛ رکورد مرتبط را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |

## LeadSource — LeadSource

منابع ورود سرنخ‌های فروش به شکل کد و عنوان قابل مدیریت.

| فیلد | نوع Prisma | توضیح |
|---|---|---|
| `id` | `Int` | شناسه یکتای رکورد و کلید اصلی جدول. |
| `code` | `String` | کد ماشینی یا تجاری این موجودیت. |
| `label` | `String` | برچسب یا عنوان کوتاه قابل نمایش. |
| `isActive` | `Boolean` | فعال یا غیرفعال بودن رکورد. |
| `sortOrder` | `Int` | ترتیب نمایش رکورد در میان موارد هم‌گروه. |
| `createdAt` | `DateTime` | زمان ایجاد رکورد. |
| `updatedAt` | `DateTime` | آخرین زمان ویرایش رکورد. |
| `leads` | `Lead[]` | رابطه Prisma با جدول Lead (سرنخ فروش)؛ مجموعه رکوردهای وابسته را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |

## Lead — سرنخ فروش

سرنخ بالقوه فروش تا زمان تبدیل یا رد، شامل منبع، امتیاز و مسئول پیگیری.

| فیلد | نوع Prisma | توضیح |
|---|---|---|
| `id` | `Int` | شناسه یکتای رکورد و کلید اصلی جدول. |
| `leadNumber` | `String` | مقدار متنی leadNumber برای توصیف یا شناسایی سرنخ فروش. |
| `displayName` | `String` | نام کامل/نمایشی این حساب یا سرنخ برای نمایش در CRM. |
| `companyName` | `String?` | نام شرکت مرتبط با سرنخ. |
| `email` | `String?` | نشانی ایمیل مرتبط. |
| `phone` | `String?` | شماره تماس مرتبط. |
| `sourceId` | `Int?` | شناسه LeadSource مرتبط با این سرنخ فروش؛ کلید خارجی به جدول LeadSource است. |
| `status` | `CRMLeadStatus` | وضعیت چرخه عمر رکورد؛ مقادیر مجاز در Enum مربوط تعریف شده‌اند. |
| `score` | `Int` | مقدار عددی score برای سرنخ فروش. |
| `ownerUserId` | `Int` | شناسه کاربر مرتبط با این سرنخ فروش؛ کلید خارجی به جدول User است. |
| `convertedAccountId` | `Int?` | شناسه CRMAccount مرتبط با این سرنخ فروش؛ کلید خارجی به جدول CRMAccount است. |
| `convertedByUserId` | `Int?` | شناسه کاربر مرتبط با این سرنخ فروش؛ کلید خارجی به جدول User است. |
| `convertedAt` | `DateTime?` | زمان converted این سرنخ فروش را ثبت می‌کند. |
| `disqualifiedReason` | `String?` | مقدار متنی disqualifiedReason برای توصیف یا شناسایی سرنخ فروش. |
| `createdAt` | `DateTime` | زمان ایجاد رکورد. |
| `updatedAt` | `DateTime` | آخرین زمان ویرایش رکورد. |
| `source` | `LeadSource?` | رابطه Prisma با جدول LeadSource (LeadSource)؛ رکورد مرتبط را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |
| `owner` | `User` | رابطه Prisma با جدول User (کاربر)؛ رکورد مرتبط را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |
| `convertedAccount` | `CRMAccount?` | رابطه Prisma با جدول CRMAccount (CRMAccount)؛ رکورد مرتبط را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |
| `convertedBy` | `User?` | رابطه Prisma با جدول User (کاربر)؛ رکورد مرتبط را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |
| `activities` | `CRMActivity[]` | رابطه Prisma با جدول CRMActivity (CRMActivity)؛ مجموعه رکوردهای وابسته را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |
| `tasks` | `CRMTask[]` | رابطه Prisma با جدول CRMTask (CRMTask)؛ مجموعه رکوردهای وابسته را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |
| `notesLog` | `CRMNote[]` | رابطه Prisma با جدول CRMNote (CRMNote)؛ مجموعه رکوردهای وابسته را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |

## Pipeline — Pipeline

تعریف قیف فروش CRM و تعیین قیف فعال یا پیش‌فرض.

| فیلد | نوع Prisma | توضیح |
|---|---|---|
| `id` | `Int` | شناسه یکتای رکورد و کلید اصلی جدول. |
| `name` | `String` | نام قابل نمایش موجودیت. |
| `isDefault` | `Boolean` | پیش‌فرض بودن این گزینه یا رکورد. |
| `isActive` | `Boolean` | فعال یا غیرفعال بودن رکورد. |
| `createdAt` | `DateTime` | زمان ایجاد رکورد. |
| `updatedAt` | `DateTime` | آخرین زمان ویرایش رکورد. |
| `stages` | `PipelineStage[]` | رابطه Prisma با جدول PipelineStage (PipelineStage)؛ مجموعه رکوردهای وابسته را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |
| `opportunities` | `Opportunity[]` | رابطه Prisma با جدول Opportunity (فرصت فروش)؛ مجموعه رکوردهای وابسته را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |

## PipelineStage — PipelineStage

مراحل هر قیف فروش با ترتیب و احتمال موفقیت و نشانگر برد/باخت.

| فیلد | نوع Prisma | توضیح |
|---|---|---|
| `id` | `Int` | شناسه یکتای رکورد و کلید اصلی جدول. |
| `pipelineId` | `Int` | شناسه Pipeline مرتبط با این PipelineStage؛ کلید خارجی به جدول Pipeline است. |
| `code` | `String` | کد ماشینی یا تجاری این موجودیت. |
| `label` | `String` | برچسب یا عنوان کوتاه قابل نمایش. |
| `sortOrder` | `Int` | ترتیب نمایش رکورد در میان موارد هم‌گروه. |
| `probability` | `Int` | احتمال موفقیت فرصت در این مرحله به‌صورت درصد. |
| `isWon` | `Boolean` | نشانگر مرحله موفق/برد قیف فروش. |
| `isLost` | `Boolean` | نشانگر مرحله از دست‌رفته قیف فروش. |
| `pipeline` | `Pipeline` | رابطه Prisma با جدول Pipeline (Pipeline)؛ رکورد مرتبط را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |
| `opportunities` | `Opportunity[]` | رابطه Prisma با جدول Opportunity (فرصت فروش)؛ مجموعه رکوردهای وابسته را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |
| `fromHistories` | `OpportunityStageHistory[]` | رابطه Prisma با جدول OpportunityStageHistory (OpportunityStageHistory)؛ مجموعه رکوردهای وابسته را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |
| `toHistories` | `OpportunityStageHistory[]` | رابطه Prisma با جدول OpportunityStageHistory (OpportunityStageHistory)؛ مجموعه رکوردهای وابسته را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |

## Opportunity — فرصت فروش

فرصت فروش مرتبط با حساب CRM، مبلغ، ارز، مرحله و مسئول آن.

| فیلد | نوع Prisma | توضیح |
|---|---|---|
| `id` | `Int` | شناسه یکتای رکورد و کلید اصلی جدول. |
| `opportunityNumber` | `String` | شماره یکتای قابل نمایش فرصت فروش. |
| `accountId` | `Int` | شناسه CRMAccount مرتبط با این فرصت فروش؛ کلید خارجی به جدول CRMAccount است. |
| `pipelineId` | `Int` | شناسه PipelineStage مرتبط با این فرصت فروش؛ کلید خارجی به جدول PipelineStage است. |
| `stageId` | `Int` | شناسه PipelineStage مرتبط با این فرصت فروش؛ کلید خارجی به جدول PipelineStage است. |
| `ownerUserId` | `Int` | شناسه کاربر مرتبط با این فرصت فروش؛ کلید خارجی به جدول User است. |
| `title` | `String` | عنوان اصلی قابل نمایش. |
| `amount` | `Decimal` | مبلغ مالی این رکورد. |
| `currency` | `String` | کد سه‌حرفی ارز (ISO 4217) مبالغ این رکورد. |
| `expectedCloseAt` | `DateTime?` | تاریخ پیش‌بینی‌شده نهایی‌شدن فرصت فروش. |
| `status` | `CRMOpportunityStatus` | وضعیت چرخه عمر رکورد؛ مقادیر مجاز در Enum مربوط تعریف شده‌اند. |
| `closedAt` | `DateTime?` | زمان بسته‌شدن پرونده یا فرآیند. |
| `createdAt` | `DateTime` | زمان ایجاد رکورد. |
| `updatedAt` | `DateTime` | آخرین زمان ویرایش رکورد. |
| `account` | `CRMAccount` | رابطه Prisma با جدول CRMAccount (CRMAccount)؛ رکورد مرتبط را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |
| `pipeline` | `Pipeline` | رابطه Prisma با جدول Pipeline (Pipeline)؛ رکورد مرتبط را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |
| `stage` | `PipelineStage` | رابطه Prisma با جدول PipelineStage (PipelineStage)؛ رکورد مرتبط را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |
| `owner` | `User` | رابطه Prisma با جدول User (کاربر)؛ رکورد مرتبط را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |
| `stageHistory` | `OpportunityStageHistory[]` | رابطه Prisma با جدول OpportunityStageHistory (OpportunityStageHistory)؛ مجموعه رکوردهای وابسته را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |
| `activities` | `CRMActivity[]` | رابطه Prisma با جدول CRMActivity (CRMActivity)؛ مجموعه رکوردهای وابسته را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |
| `tasks` | `CRMTask[]` | رابطه Prisma با جدول CRMTask (CRMTask)؛ مجموعه رکوردهای وابسته را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |
| `notesLog` | `CRMNote[]` | رابطه Prisma با جدول CRMNote (CRMNote)؛ مجموعه رکوردهای وابسته را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |

## OpportunityStageHistory — OpportunityStageHistory

تاریخچه جابه‌جایی فرصت فروش میان مراحل قیف.

| فیلد | نوع Prisma | توضیح |
|---|---|---|
| `id` | `Int` | شناسه یکتای رکورد و کلید اصلی جدول. |
| `opportunityId` | `Int` | شناسه فرصت فروش مرتبط با این OpportunityStageHistory؛ کلید خارجی به جدول Opportunity است. |
| `fromStageId` | `Int?` | شناسه PipelineStage مرتبط با این OpportunityStageHistory؛ کلید خارجی به جدول PipelineStage است. |
| `toStageId` | `Int` | شناسه PipelineStage مرتبط با این OpportunityStageHistory؛ کلید خارجی به جدول PipelineStage است. |
| `actorUserId` | `Int` | شناسه کاربر مرتبط با این OpportunityStageHistory؛ کلید خارجی به جدول User است. |
| `reason` | `String?` | علت درخواست، تغییر وضعیت یا تصمیم. |
| `createdAt` | `DateTime` | زمان ایجاد رکورد. |
| `opportunity` | `Opportunity` | رابطه Prisma با جدول Opportunity (فرصت فروش)؛ رکورد مرتبط را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |
| `fromStage` | `PipelineStage?` | رابطه Prisma با جدول PipelineStage (PipelineStage)؛ رکورد مرتبط را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |
| `toStage` | `PipelineStage` | رابطه Prisma با جدول PipelineStage (PipelineStage)؛ رکورد مرتبط را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |
| `actor` | `User` | رابطه Prisma با جدول User (کاربر)؛ رکورد مرتبط را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |

## CRMActivity — CRMActivity

فعالیت‌های ارتباطی و فروش مانند تماس، جلسه یا پیگیری و نتیجه آن.

| فیلد | نوع Prisma | توضیح |
|---|---|---|
| `id` | `BigInt` | شناسه یکتای رکورد و کلید اصلی جدول. |
| `type` | `CRMActivityType` | نوع یا طبقه‌بندی رکورد؛ مقادیر مجاز در Enum یا قرارداد دامنه تعریف شده‌اند. |
| `subject` | `String` | موضوع پیام، تیکت یا فعالیت برای نمایش و جست‌وجو. |
| `body` | `String?` | متن کامل پیام، یادداشت یا محتوای رکورد. |
| `occurredAt` | `DateTime` | زمان وقوع رویداد در منبع. |
| `durationMinutes` | `Int?` | مدت فعالیت بر حسب دقیقه. |
| `outcome` | `String?` | نتیجه فعالیت یا عملیات. |
| `actorUserId` | `Int` | شناسه کاربر مرتبط با این CRMActivity؛ کلید خارجی به جدول User است. |
| `accountId` | `Int?` | شناسه CRMAccount مرتبط با این CRMActivity؛ کلید خارجی به جدول CRMAccount است. |
| `leadId` | `Int?` | شناسه سرنخ فروش مرتبط با این CRMActivity؛ کلید خارجی به جدول Lead است. |
| `opportunityId` | `Int?` | شناسه فرصت فروش مرتبط با این CRMActivity؛ کلید خارجی به جدول Opportunity است. |
| `createdAt` | `DateTime` | زمان ایجاد رکورد. |
| `actor` | `User` | رابطه Prisma با جدول User (کاربر)؛ رکورد مرتبط را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |
| `account` | `CRMAccount?` | رابطه Prisma با جدول CRMAccount (CRMAccount)؛ رکورد مرتبط را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |
| `lead` | `Lead?` | رابطه Prisma با جدول Lead (سرنخ فروش)؛ رکورد مرتبط را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |
| `opportunity` | `Opportunity?` | رابطه Prisma با جدول Opportunity (فرصت فروش)؛ رکورد مرتبط را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |

## CRMTask — CRMTask

وظایف پیگیری CRM با مسئول، اولویت، وضعیت و مهلت انجام.

| فیلد | نوع Prisma | توضیح |
|---|---|---|
| `id` | `Int` | شناسه یکتای رکورد و کلید اصلی جدول. |
| `title` | `String` | عنوان اصلی قابل نمایش. |
| `description` | `String?` | شرح تکمیلی موجودیت. |
| `status` | `CRMTaskStatus` | وضعیت چرخه عمر رکورد؛ مقادیر مجاز در Enum مربوط تعریف شده‌اند. |
| `priority` | `CRMTaskPriority` | اولویت رسیدگی یا پردازش. |
| `assigneeUserId` | `Int` | شناسه کاربر مرتبط با این CRMTask؛ کلید خارجی به جدول User است. |
| `createdByUserId` | `Int` | شناسه کاربر مرتبط با این CRMTask؛ کلید خارجی به جدول User است. |
| `dueAt` | `DateTime?` | مهلت انجام یا سررسید عملیات. |
| `completedAt` | `DateTime?` | زمان تکمیل عملیات. |
| `accountId` | `Int?` | شناسه CRMAccount مرتبط با این CRMTask؛ کلید خارجی به جدول CRMAccount است. |
| `leadId` | `Int?` | شناسه سرنخ فروش مرتبط با این CRMTask؛ کلید خارجی به جدول Lead است. |
| `opportunityId` | `Int?` | شناسه فرصت فروش مرتبط با این CRMTask؛ کلید خارجی به جدول Opportunity است. |
| `createdAt` | `DateTime` | زمان ایجاد رکورد. |
| `updatedAt` | `DateTime` | آخرین زمان ویرایش رکورد. |
| `assignee` | `User` | رابطه Prisma با جدول User (کاربر)؛ رکورد مرتبط را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |
| `createdBy` | `User` | رابطه Prisma با جدول User (کاربر)؛ رکورد مرتبط را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |
| `account` | `CRMAccount?` | رابطه Prisma با جدول CRMAccount (CRMAccount)؛ رکورد مرتبط را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |
| `lead` | `Lead?` | رابطه Prisma با جدول Lead (سرنخ فروش)؛ رکورد مرتبط را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |
| `opportunity` | `Opportunity?` | رابطه Prisma با جدول Opportunity (فرصت فروش)؛ رکورد مرتبط را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |

## CRMNote — CRMNote

یادداشت‌های مرتبط با حساب، سرنخ یا فرصت همراه با سطح مشاهده.

| فیلد | نوع Prisma | توضیح |
|---|---|---|
| `id` | `BigInt` | شناسه یکتای رکورد و کلید اصلی جدول. |
| `body` | `String` | متن کامل پیام، یادداشت یا محتوای رکورد. |
| `visibility` | `CRMNoteVisibility` | سطح مشاهده و دسترسی به محتوا. |
| `authorUserId` | `Int` | شناسه کاربر مرتبط با این CRMNote؛ کلید خارجی به جدول User است. |
| `accountId` | `Int?` | شناسه CRMAccount مرتبط با این CRMNote؛ کلید خارجی به جدول CRMAccount است. |
| `leadId` | `Int?` | شناسه سرنخ فروش مرتبط با این CRMNote؛ کلید خارجی به جدول Lead است. |
| `opportunityId` | `Int?` | شناسه فرصت فروش مرتبط با این CRMNote؛ کلید خارجی به جدول Opportunity است. |
| `createdAt` | `DateTime` | زمان ایجاد رکورد. |
| `author` | `User` | رابطه Prisma با جدول User (کاربر)؛ رکورد مرتبط را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |
| `account` | `CRMAccount?` | رابطه Prisma با جدول CRMAccount (CRMAccount)؛ رکورد مرتبط را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |
| `lead` | `Lead?` | رابطه Prisma با جدول Lead (سرنخ فروش)؛ رکورد مرتبط را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |
| `opportunity` | `Opportunity?` | رابطه Prisma با جدول Opportunity (فرصت فروش)؛ رکورد مرتبط را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |

## InventoryBalance — InventoryBalance

مانده فعلی موجودی هر محصول شامل تعداد موجود و تعداد رزروشده.

| فیلد | نوع Prisma | توضیح |
|---|---|---|
| `id` | `Int` | شناسه یکتای رکورد و کلید اصلی جدول. |
| `productId` | `Int` | شناسه محصول مرتبط با این InventoryBalance؛ کلید خارجی به جدول Product است. |
| `onHand` | `Int` | تعداد فیزیکی موجود محصول در انبار. |
| `reserved` | `Int` | تعداد موجودی که برای سفارش‌ها رزرو شده و فعلاً قابل فروش مجدد نیست. |
| `createdAt` | `DateTime` | زمان ایجاد رکورد. |
| `updatedAt` | `DateTime` | آخرین زمان ویرایش رکورد. |
| `product` | `Product` | رابطه Prisma با جدول Product (محصول)؛ رکورد مرتبط را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |

## InventoryMovement — InventoryMovement

دفتر تغییرات موجودی شامل نوع حرکت، تعداد، مرجع و عامل عملیات.

| فیلد | نوع Prisma | توضیح |
|---|---|---|
| `id` | `BigInt` | شناسه یکتای رکورد و کلید اصلی جدول. |
| `productId` | `Int` | شناسه محصول مرتبط با این InventoryMovement؛ کلید خارجی به جدول Product است. |
| `actorUserId` | `Int?` | شناسه کاربر مرتبط با این InventoryMovement؛ کلید خارجی به جدول User است. |
| `movementType` | `InventoryMovementType` | نوع حرکت یا رویداد تغییر موجودی. |
| `quantityDelta` | `Int` | میزان تغییر موجودی؛ علامت مثبت افزایش و علامت منفی کاهش موجودی را نشان می‌دهد. |
| `referenceType` | `String?` | نوع موجودیت مرجع عملیات. |
| `referenceId` | `String?` | شناسه موجودیت مرجع عملیات. |
| `idempotencyKey` | `String?` | کلید یکتای جلوگیری از اجرای تکراری درخواست/عملیات. |
| `reason` | `String?` | علت درخواست، تغییر وضعیت یا تصمیم. |
| `metadata` | `Json?` | داده‌های تکمیلی ساختاریافته و وابسته به دامنه در قالب JSON. |
| `createdAt` | `DateTime` | زمان ایجاد رکورد. |
| `product` | `Product` | رابطه Prisma با جدول Product (محصول)؛ رکورد مرتبط را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |
| `actor` | `User?` | رابطه Prisma با جدول User (کاربر)؛ رکورد مرتبط را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |

## RetailOrder — سفارش

سفارش اصلی خریدار، وضعیت سفارش و پرداخت، مبالغ، ارز و snapshot نشانی گیرنده.

| فیلد | نوع Prisma | توضیح |
|---|---|---|
| `id` | `Int` | شناسه یکتای رکورد و کلید اصلی جدول. |
| `orderNumber` | `String` | مقدار متنی orderNumber برای توصیف یا شناسایی سفارش. |
| `buyerUserId` | `Int` | شناسه کاربر مرتبط با این سفارش؛ کلید خارجی به جدول User است. |
| `status` | `RetailOrderStatus` | وضعیت چرخه عمر رکورد؛ مقادیر مجاز در Enum مربوط تعریف شده‌اند. |
| `paymentStatus` | `RetailPaymentStatus` | وضعیت پرداخت سفارش، مستقل از وضعیت پردازش/ارسال سفارش. |
| `currency` | `String` | کد سه‌حرفی ارز (ISO 4217) مبالغ این رکورد. |
| `subtotal` | `Decimal` | جمع مبالغ پیش از تخفیف/مالیات/هزینه‌های افزوده. |
| `discountTotal` | `Decimal` | جمع تخفیف‌های سفارش. |
| `shippingTotal` | `Decimal` | جمع هزینه ارسال سفارش. |
| `taxTotal` | `Decimal` | جمع مالیات سفارش یا فاکتور. |
| `grandTotal` | `Decimal` | مبلغ نهایی قابل پرداخت پس از اعمال اجزا و تعدیلات. |
| `addressId` | `Int?` | شناسه نشانی مرتبط با این سفارش؛ کلید خارجی به جدول Address است. |
| `address` | `Address?` | رابطه Prisma با جدول Address (نشانی)؛ رکورد مرتبط را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |
| `recipientName` | `String` | نام شخص دریافت‌کننده. |
| `recipientPhone` | `String` | شماره تماس شخص دریافت‌کننده. |
| `province` | `String` | استان نشانی. |
| `city` | `String` | شهر نشانی. |
| `addressLine` | `String` | جزئیات نشانی پستی. |
| `postalCode` | `String?` | کد پستی. |
| `idempotencyKey` | `String` | کلید یکتای جلوگیری از اجرای تکراری درخواست/عملیات. |
| `placedAt` | `DateTime` | زمان placed این سفارش را ثبت می‌کند. |
| `paidAt` | `DateTime?` | زمان پرداخت موفق. |
| `completedAt` | `DateTime?` | زمان تکمیل عملیات. |
| `cancelledAt` | `DateTime?` | زمان cancelled این سفارش را ثبت می‌کند. |
| `createdAt` | `DateTime` | زمان ایجاد رکورد. |
| `updatedAt` | `DateTime` | آخرین زمان ویرایش رکورد. |
| `buyer` | `User` | رابطه Prisma با جدول User (کاربر)؛ رکورد مرتبط را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |
| `items` | `RetailOrderItem[]` | رابطه Prisma با جدول RetailOrderItem (RetailOrderItem)؛ مجموعه رکوردهای وابسته را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |
| `sellerOrders` | `SellerOrder[]` | رابطه Prisma با جدول SellerOrder (سفارش فروشنده)؛ مجموعه رکوردهای وابسته را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |
| `paymentAttempts` | `PaymentAttempt[]` | رابطه Prisma با جدول PaymentAttempt (PaymentAttempt)؛ مجموعه رکوردهای وابسته را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |
| `paymentTransactions` | `PaymentTransaction[]` | رابطه Prisma با جدول PaymentTransaction (PaymentTransaction)؛ مجموعه رکوردهای وابسته را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |
| `refunds` | `RetailRefund[]` | رابطه Prisma با جدول RetailRefund (RetailRefund)؛ مجموعه رکوردهای وابسته را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |
| `reservations` | `InventoryReservation[]` | رابطه Prisma با جدول InventoryReservation (InventoryReservation)؛ مجموعه رکوردهای وابسته را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |
| `returns` | `ReturnRequest[]` | رابطه Prisma با جدول ReturnRequest (ReturnRequest)؛ مجموعه رکوردهای وابسته را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |
| `invoices` | `FinanceInvoice[]` | رابطه Prisma با جدول FinanceInvoice (FinanceInvoice)؛ مجموعه رکوردهای وابسته را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |

## SellerOrder — سفارش فروشنده

بخش سفارش متعلق به یک فروشنده از سفارش اصلی، همراه با وضعیت و مبالغ فروشنده.

| فیلد | نوع Prisma | توضیح |
|---|---|---|
| `id` | `Int` | شناسه یکتای رکورد و کلید اصلی جدول. |
| `orderId` | `Int` | شناسه سفارش مرتبط با این سفارش فروشنده؛ کلید خارجی به جدول RetailOrder است. |
| `companyId` | `Int` | شناسه شرکت مرتبط با این سفارش فروشنده؛ کلید خارجی به جدول Company است. |
| `sellerOrderNumber` | `String` | مقدار متنی sellerOrderNumber برای توصیف یا شناسایی سفارش فروشنده. |
| `status` | `SellerOrderStatus` | وضعیت چرخه عمر رکورد؛ مقادیر مجاز در Enum مربوط تعریف شده‌اند. |
| `currency` | `String` | کد سه‌حرفی ارز (ISO 4217) مبالغ این رکورد. |
| `subtotal` | `Decimal` | جمع مبالغ پیش از تخفیف/مالیات/هزینه‌های افزوده. |
| `discountTotal` | `Decimal` | جمع تخفیف‌های سفارش. |
| `shippingTotal` | `Decimal` | جمع هزینه ارسال سفارش. |
| `taxTotal` | `Decimal` | جمع مالیات سفارش یا فاکتور. |
| `sellerNetTotal` | `Decimal` | مبلغ خالص قابل پرداخت به فروشنده برای این سفارش. |
| `companyNameSnapshot` | `String` | نام شرکت در زمان ثبت سفارش؛ snapshot تاریخی و مستقل از تغییر نام بعدی شرکت. |
| `companyIdSnapshot` | `String?` | شناسه ثبتی/نمایشی شرکت در زمان ثبت سفارش؛ snapshot تاریخی فروشنده. |
| `acceptedAt` | `DateTime?` | زمان accepted این سفارش فروشنده را ثبت می‌کند. |
| `shippedAt` | `DateTime?` | زمان shipped این سفارش فروشنده را ثبت می‌کند. |
| `deliveredAt` | `DateTime?` | زمان delivered این سفارش فروشنده را ثبت می‌کند. |
| `createdAt` | `DateTime` | زمان ایجاد رکورد. |
| `updatedAt` | `DateTime` | آخرین زمان ویرایش رکورد. |
| `order` | `RetailOrder` | رابطه Prisma با جدول RetailOrder (سفارش)؛ رکورد مرتبط را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |
| `company` | `Company` | رابطه Prisma با جدول Company (شرکت)؛ رکورد مرتبط را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |
| `items` | `RetailOrderItem[]` | رابطه Prisma با جدول RetailOrderItem (RetailOrderItem)؛ مجموعه رکوردهای وابسته را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |
| `shipments` | `Shipment[]` | رابطه Prisma با جدول Shipment (Shipment)؛ مجموعه رکوردهای وابسته را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |
| `returns` | `ReturnRequest[]` | رابطه Prisma با جدول ReturnRequest (ReturnRequest)؛ مجموعه رکوردهای وابسته را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |
| `refunds` | `RetailRefund[]` | رابطه Prisma با جدول RetailRefund (RetailRefund)؛ مجموعه رکوردهای وابسته را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |
| `commissionSnapshot` | `CommissionSnapshot?` | رابطه Prisma با جدول CommissionSnapshot (CommissionSnapshot)؛ رکورد مرتبط را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |
| `sellerPayable` | `SellerPayable?` | رابطه Prisma با جدول SellerPayable (SellerPayable)؛ رکورد مرتبط را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |
| `invoices` | `FinanceInvoice[]` | رابطه Prisma با جدول FinanceInvoice (FinanceInvoice)؛ مجموعه رکوردهای وابسته را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |

## RetailOrderItem — RetailOrderItem

اقلام سفارش با snapshot محصول/فروشنده، تعداد، قیمت، تخفیف و مالیات.

| فیلد | نوع Prisma | توضیح |
|---|---|---|
| `id` | `Int` | شناسه یکتای رکورد و کلید اصلی جدول. |
| `orderId` | `Int` | شناسه سفارش فروشنده مرتبط با این RetailOrderItem؛ کلید خارجی به جدول SellerOrder است. |
| `sellerOrderId` | `Int` | شناسه سفارش فروشنده مرتبط با این RetailOrderItem؛ کلید خارجی به جدول SellerOrder است. |
| `productId` | `Int?` | شناسه محصول مرتبط با این RetailOrderItem؛ کلید خارجی به جدول Product است. |
| `productTitleSnapshot` | `String` | عنوان محصول در زمان ثبت سفارش. |
| `skuSnapshot` | `String?` | کد SKU محصول در زمان ثبت سفارش. |
| `brandSnapshot` | `String?` | نام برند محصول در زمان ثبت سفارش. |
| `modelSnapshot` | `String?` | مدل محصول در زمان ثبت سفارش. |
| `imageUrlSnapshot` | `String?` | نشانی تصویر محصول در زمان ثبت سفارش. |
| `companyNameSnapshot` | `String` | نام شرکت در زمان ثبت سفارش؛ snapshot تاریخی و مستقل از تغییر نام بعدی شرکت. |
| `quantity` | `Int` | تعداد واحدهای کالا یا مقدار موردنظر. |
| `unitPrice` | `Decimal` | قیمت هر واحد کالا یا خدمت در این ردیف. |
| `discountAmount` | `Decimal` | مبلغ تخفیف اعمال‌شده روی این ردیف. |
| `taxAmount` | `Decimal` | مبلغ مالیات محاسبه‌شده برای این ردیف. |
| `lineTotal` | `Decimal` | مبلغ نهایی این ردیف پس از تخفیف و مالیات. |
| `currency` | `String` | کد سه‌حرفی ارز (ISO 4217) مبالغ این رکورد. |
| `createdAt` | `DateTime` | زمان ایجاد رکورد. |
| `order` | `RetailOrder` | رابطه Prisma با جدول RetailOrder (سفارش)؛ رکورد مرتبط را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |
| `sellerOrder` | `SellerOrder` | رابطه Prisma با جدول SellerOrder (سفارش فروشنده)؛ رکورد مرتبط را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |
| `product` | `Product?` | رابطه Prisma با جدول Product (محصول)؛ رکورد مرتبط را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |
| `returnItems` | `ReturnItem[]` | رابطه Prisma با جدول ReturnItem (ReturnItem)؛ مجموعه رکوردهای وابسته را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |

## InventoryReservation — InventoryReservation

رزرو موقت موجودی برای خریدار/فرآیند سفارش همراه با انقضا و وضعیت.

| فیلد | نوع Prisma | توضیح |
|---|---|---|
| `id` | `BigInt` | شناسه یکتای رکورد و کلید اصلی جدول. |
| `productId` | `Int` | شناسه محصول مرتبط با این InventoryReservation؛ کلید خارجی به جدول Product است. |
| `buyerUserId` | `Int` | شناسه کاربر مرتبط با این InventoryReservation؛ کلید خارجی به جدول User است. |
| `orderId` | `Int?` | شناسه سفارش مرتبط با این InventoryReservation؛ کلید خارجی به جدول RetailOrder است. |
| `quantity` | `Int` | تعداد واحدهای کالا یا مقدار موردنظر. |
| `status` | `InventoryReservationStatus` | وضعیت چرخه عمر رکورد؛ مقادیر مجاز در Enum مربوط تعریف شده‌اند. |
| `checkoutKey` | `String` | کلید یکتای فرآیند checkout برای جلوگیری از رزرو تکراری. |
| `expiresAt` | `DateTime` | زمان انقضای اعتبار رکورد یا توکن. |
| `consumedAt` | `DateTime?` | زمان مصرف‌شدن چالش یک‌بارمصرف یا رزرو موجودی. |
| `releasedAt` | `DateTime?` | زمان آزادسازی رزرو موجودی یا تخصیص. |
| `createdAt` | `DateTime` | زمان ایجاد رکورد. |
| `product` | `Product` | رابطه Prisma با جدول Product (محصول)؛ رکورد مرتبط را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |
| `buyer` | `User` | رابطه Prisma با جدول User (کاربر)؛ رکورد مرتبط را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |
| `order` | `RetailOrder?` | رابطه Prisma با جدول RetailOrder (سفارش)؛ رکورد مرتبط را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |

## PaymentAttempt — PaymentAttempt

تلاش آغاز یا تکمیل پرداخت سفارش، درگاه، وضعیت و شناسه‌های پیگیری.

| فیلد | نوع Prisma | توضیح |
|---|---|---|
| `id` | `Int` | شناسه یکتای رکورد و کلید اصلی جدول. |
| `orderId` | `Int` | شناسه سفارش مرتبط با این PaymentAttempt؛ کلید خارجی به جدول RetailOrder است. |
| `provider` | `String` | نام درگاه یا سرویس بیرونی انجام‌دهنده عملیات. |
| `status` | `PaymentAttemptStatus` | وضعیت چرخه عمر رکورد؛ مقادیر مجاز در Enum مربوط تعریف شده‌اند. |
| `amount` | `Decimal` | مبلغ مالی این رکورد. |
| `currency` | `String` | کد سه‌حرفی ارز (ISO 4217) مبالغ این رکورد. |
| `idempotencyKey` | `String` | کلید یکتای جلوگیری از اجرای تکراری درخواست/عملیات. |
| `authority` | `String?` | شناسه مجوز/authority پرداخت صادرشده توسط درگاه. |
| `redirectUrl` | `String?` | نشانی هدایت کاربر به صفحه پرداخت درگاه. |
| `expiresAt` | `DateTime?` | زمان انقضای اعتبار رکورد یا توکن. |
| `completedAt` | `DateTime?` | زمان تکمیل عملیات. |
| `createdAt` | `DateTime` | زمان ایجاد رکورد. |
| `updatedAt` | `DateTime` | آخرین زمان ویرایش رکورد. |
| `order` | `RetailOrder` | رابطه Prisma با جدول RetailOrder (سفارش)؛ رکورد مرتبط را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |
| `transactions` | `PaymentTransaction[]` | رابطه Prisma با جدول PaymentTransaction (PaymentTransaction)؛ مجموعه رکوردهای وابسته را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |
| `webhookEvents` | `PaymentWebhookEvent[]` | رابطه Prisma با جدول PaymentWebhookEvent (PaymentWebhookEvent)؛ مجموعه رکوردهای وابسته را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |

## PaymentTransaction — PaymentTransaction

تراکنش پرداخت/بازپرداخت مرتبط با سفارش یا تلاش پرداخت.

| فیلد | نوع Prisma | توضیح |
|---|---|---|
| `id` | `Int` | شناسه یکتای رکورد و کلید اصلی جدول. |
| `orderId` | `Int` | شناسه سفارش مرتبط با این PaymentTransaction؛ کلید خارجی به جدول RetailOrder است. |
| `attemptId` | `Int?` | شناسه PaymentAttempt مرتبط با این PaymentTransaction؛ کلید خارجی به جدول PaymentAttempt است. |
| `provider` | `String` | نام درگاه یا سرویس بیرونی انجام‌دهنده عملیات. |
| `providerTransactionId` | `String?` | شناسه تراکنش نزد درگاه پرداخت. |
| `transactionType` | `PaymentTransactionType` | نوع تراکنش مالی. |
| `status` | `PaymentTransactionStatus` | وضعیت چرخه عمر رکورد؛ مقادیر مجاز در Enum مربوط تعریف شده‌اند. |
| `amount` | `Decimal` | مبلغ مالی این رکورد. |
| `currency` | `String` | کد سه‌حرفی ارز (ISO 4217) مبالغ این رکورد. |
| `verifiedAt` | `DateTime?` | زمان تأیید تراکنش یا اطلاعات توسط سامانه/درگاه. |
| `createdAt` | `DateTime` | زمان ایجاد رکورد. |
| `order` | `RetailOrder` | رابطه Prisma با جدول RetailOrder (سفارش)؛ رکورد مرتبط را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |
| `attempt` | `PaymentAttempt?` | رابطه Prisma با جدول PaymentAttempt (PaymentAttempt)؛ رکورد مرتبط را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |
| `refunds` | `RetailRefund[]` | رابطه Prisma با جدول RetailRefund (RetailRefund)؛ مجموعه رکوردهای وابسته را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |
| `reconciliations` | `ReconciliationRecord[]` | رابطه Prisma با جدول ReconciliationRecord (ReconciliationRecord)؛ مجموعه رکوردهای وابسته را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |

## PaymentWebhookEvent — PaymentWebhookEvent

رویداد دریافتی webhook درگاه با اعتبار امضا و نتیجه پردازش.

| فیلد | نوع Prisma | توضیح |
|---|---|---|
| `id` | `BigInt` | شناسه یکتای رکورد و کلید اصلی جدول. |
| `provider` | `String` | نام درگاه یا سرویس بیرونی انجام‌دهنده عملیات. |
| `providerEventId` | `String` | شناسه یکتای رویداد webhook نزد ارائه‌دهنده. |
| `attemptId` | `Int?` | شناسه PaymentAttempt مرتبط با این PaymentWebhookEvent؛ کلید خارجی به جدول PaymentAttempt است. |
| `status` | `PaymentWebhookStatus` | وضعیت چرخه عمر رکورد؛ مقادیر مجاز در Enum مربوط تعریف شده‌اند. |
| `signatureValid` | `Boolean` | اعتبارسنجی امضای دیجیتال webhook را مشخص می‌کند. |
| `payload` | `Json` | بدنه ساختاریافته یا خام رویداد دریافتی/داخلی. |
| `receivedAt` | `DateTime` | زمان دریافت رویداد یا درخواست. |
| `processedAt` | `DateTime?` | زمان پایان پردازش رویداد/عملیات. |
| `lastError` | `String?` | آخرین خطای رخ‌داده هنگام پردازش/ارسال. |
| `attempt` | `PaymentAttempt?` | رابطه Prisma با جدول PaymentAttempt (PaymentAttempt)؛ رکورد مرتبط را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |

## RetailRefund — RetailRefund

درخواست و نتیجه بازپرداخت وجه سفارش.

| فیلد | نوع Prisma | توضیح |
|---|---|---|
| `id` | `Int` | شناسه یکتای رکورد و کلید اصلی جدول. |
| `orderId` | `Int` | شناسه سفارش مرتبط با این RetailRefund؛ کلید خارجی به جدول RetailOrder است. |
| `sellerOrderId` | `Int?` | شناسه سفارش فروشنده مرتبط با این RetailRefund؛ کلید خارجی به جدول SellerOrder است. |
| `paymentTransactionId` | `Int?` | شناسه PaymentTransaction مرتبط با این RetailRefund؛ کلید خارجی به جدول PaymentTransaction است. |
| `requestedByUserId` | `Int` | شناسه کاربر مرتبط با این RetailRefund؛ کلید خارجی به جدول User است. |
| `amount` | `Decimal` | مبلغ مالی این رکورد. |
| `currency` | `String` | کد سه‌حرفی ارز (ISO 4217) مبالغ این رکورد. |
| `status` | `RefundStatus` | وضعیت چرخه عمر رکورد؛ مقادیر مجاز در Enum مربوط تعریف شده‌اند. |
| `reason` | `String` | علت درخواست، تغییر وضعیت یا تصمیم. |
| `idempotencyKey` | `String` | کلید یکتای جلوگیری از اجرای تکراری درخواست/عملیات. |
| `providerRefundId` | `String?` | شناسه رکورد مرتبط برای اتصال این RetailRefund به موجودیت مرجع. |
| `processedAt` | `DateTime?` | زمان پایان پردازش رویداد/عملیات. |
| `createdAt` | `DateTime` | زمان ایجاد رکورد. |
| `updatedAt` | `DateTime` | آخرین زمان ویرایش رکورد. |
| `order` | `RetailOrder` | رابطه Prisma با جدول RetailOrder (سفارش)؛ رکورد مرتبط را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |
| `sellerOrder` | `SellerOrder?` | رابطه Prisma با جدول SellerOrder (سفارش فروشنده)؛ رکورد مرتبط را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |
| `paymentTransaction` | `PaymentTransaction?` | رابطه Prisma با جدول PaymentTransaction (PaymentTransaction)؛ رکورد مرتبط را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |
| `requestedBy` | `User` | رابطه Prisma با جدول User (کاربر)؛ رکورد مرتبط را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |

## Shipment — Shipment

اطلاعات ارسال سفارش فروشنده شامل شرکت حمل، کد رهگیری و وضعیت.

| فیلد | نوع Prisma | توضیح |
|---|---|---|
| `id` | `Int` | شناسه یکتای رکورد و کلید اصلی جدول. |
| `sellerOrderId` | `Int` | شناسه سفارش فروشنده مرتبط با این Shipment؛ کلید خارجی به جدول SellerOrder است. |
| `carrier` | `String?` | نام شرکت حمل‌ونقل یا سرویس ارسال. |
| `trackingNumber` | `String?` | کد رهگیری مرسوله نزد شرکت حمل. |
| `status` | `ShipmentStatus` | وضعیت چرخه عمر رکورد؛ مقادیر مجاز در Enum مربوط تعریف شده‌اند. |
| `shippedAt` | `DateTime?` | زمان shipped این Shipment را ثبت می‌کند. |
| `deliveredAt` | `DateTime?` | زمان delivered این Shipment را ثبت می‌کند. |
| `createdAt` | `DateTime` | زمان ایجاد رکورد. |
| `updatedAt` | `DateTime` | آخرین زمان ویرایش رکورد. |
| `sellerOrder` | `SellerOrder` | رابطه Prisma با جدول SellerOrder (سفارش فروشنده)؛ رکورد مرتبط را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |
| `trackingEvents` | `TrackingEvent[]` | رابطه Prisma با جدول TrackingEvent (TrackingEvent)؛ مجموعه رکوردهای وابسته را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |

## TrackingEvent — TrackingEvent

رویدادهای رهگیری مرسوله شامل شرح، موقعیت و زمان وقوع.

| فیلد | نوع Prisma | توضیح |
|---|---|---|
| `id` | `BigInt` | شناسه یکتای رکورد و کلید اصلی جدول. |
| `shipmentId` | `Int` | شناسه Shipment مرتبط با این TrackingEvent؛ کلید خارجی به جدول Shipment است. |
| `eventCode` | `String?` | کد نوع رویداد رهگیری. |
| `description` | `String` | شرح تکمیلی موجودیت. |
| `location` | `String?` | موقعیت یا شهر ثبت‌شده برای رویداد رهگیری. |
| `occurredAt` | `DateTime` | زمان وقوع رویداد در منبع. |
| `createdAt` | `DateTime` | زمان ایجاد رکورد. |
| `shipment` | `Shipment` | رابطه Prisma با جدول Shipment (Shipment)؛ رکورد مرتبط را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |

## ReturnRequest — ReturnRequest

درخواست مرجوعی خریدار برای سفارش یا بخش فروشنده.

| فیلد | نوع Prisma | توضیح |
|---|---|---|
| `id` | `Int` | شناسه یکتای رکورد و کلید اصلی جدول. |
| `orderId` | `Int` | شناسه سفارش فروشنده مرتبط با این ReturnRequest؛ کلید خارجی به جدول SellerOrder است. |
| `sellerOrderId` | `Int` | شناسه سفارش فروشنده مرتبط با این ReturnRequest؛ کلید خارجی به جدول SellerOrder است. |
| `buyerUserId` | `Int` | شناسه کاربر مرتبط با این ReturnRequest؛ کلید خارجی به جدول User است. |
| `returnNumber` | `String` | شماره یکتای درخواست مرجوعی. |
| `status` | `ReturnStatus` | وضعیت چرخه عمر رکورد؛ مقادیر مجاز در Enum مربوط تعریف شده‌اند. |
| `reason` | `String` | علت درخواست، تغییر وضعیت یا تصمیم. |
| `requestedAt` | `DateTime` | زمان ثبت درخواست. |
| `receivedAt` | `DateTime?` | زمان دریافت رویداد یا درخواست. |
| `closedAt` | `DateTime?` | زمان بسته‌شدن پرونده یا فرآیند. |
| `createdAt` | `DateTime` | زمان ایجاد رکورد. |
| `updatedAt` | `DateTime` | آخرین زمان ویرایش رکورد. |
| `order` | `RetailOrder` | رابطه Prisma با جدول RetailOrder (سفارش)؛ رکورد مرتبط را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |
| `sellerOrder` | `SellerOrder` | رابطه Prisma با جدول SellerOrder (سفارش فروشنده)؛ رکورد مرتبط را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |
| `buyer` | `User` | رابطه Prisma با جدول User (کاربر)؛ رکورد مرتبط را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |
| `items` | `ReturnItem[]` | رابطه Prisma با جدول ReturnItem (ReturnItem)؛ مجموعه رکوردهای وابسته را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |

## ReturnItem — ReturnItem

اقلام و تعدادهای مشمول درخواست مرجوعی و نتیجه بازرسی آن‌ها.

| فیلد | نوع Prisma | توضیح |
|---|---|---|
| `id` | `Int` | شناسه یکتای رکورد و کلید اصلی جدول. |
| `returnRequestId` | `Int` | شناسه ReturnRequest مرتبط با این ReturnItem؛ کلید خارجی به جدول ReturnRequest است. |
| `orderItemId` | `Int` | شناسه RetailOrderItem مرتبط با این ReturnItem؛ کلید خارجی به جدول RetailOrderItem است. |
| `quantity` | `Int` | تعداد واحدهای کالا یا مقدار موردنظر. |
| `disposition` | `ReturnItemDisposition?` | نحوه تعیین تکلیف کالای برگشتی. |
| `inspectionNote` | `String?` | نتیجه بررسی و توضیح کارشناس درباره کالای مرجوعی. |
| `createdAt` | `DateTime` | زمان ایجاد رکورد. |
| `returnRequest` | `ReturnRequest` | رابطه Prisma با جدول ReturnRequest (ReturnRequest)؛ رکورد مرتبط را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |
| `orderItem` | `RetailOrderItem` | رابطه Prisma با جدول RetailOrderItem (RetailOrderItem)؛ رکورد مرتبط را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |

## LedgerAccount — LedgerAccount

حساب دفتر کل با کد، نام، ماهیت حساب و ارز.

| فیلد | نوع Prisma | توضیح |
|---|---|---|
| `id` | `Int` | شناسه یکتای رکورد و کلید اصلی جدول. |
| `code` | `String` | کد ماشینی یا تجاری این موجودیت. |
| `name` | `String` | نام قابل نمایش موجودیت. |
| `accountType` | `LedgerAccountType` | نوع حساب CRM (شرکت یا شخص) را مشخص می‌کند. |
| `currency` | `String` | کد سه‌حرفی ارز (ISO 4217) مبالغ این رکورد. |
| `isSystem` | `Boolean` | سیستمی بودن رکورد و محدودیت مدیریت عادی آن. |
| `isActive` | `Boolean` | فعال یا غیرفعال بودن رکورد. |
| `createdAt` | `DateTime` | زمان ایجاد رکورد. |
| `updatedAt` | `DateTime` | آخرین زمان ویرایش رکورد. |
| `lines` | `JournalLine[]` | رابطه Prisma با جدول JournalLine (JournalLine)؛ مجموعه رکوردهای وابسته را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |

## JournalEntry — JournalEntry

سند حسابداری دفتر کل با منبع، وضعیت ثبت و ارتباط با سند معکوس.

| فیلد | نوع Prisma | توضیح |
|---|---|---|
| `id` | `BigInt` | شناسه یکتای رکورد و کلید اصلی جدول. |
| `entryNumber` | `String` | شماره یکتای سند حسابداری. |
| `sourceType` | `String?` | نوع منبع کسب‌وکاری ایجادکننده سند/رویداد. |
| `sourceId` | `String?` | شناسه منبع کسب‌وکاری ایجادکننده سند/رویداد. |
| `currency` | `String` | کد سه‌حرفی ارز (ISO 4217) مبالغ این رکورد. |
| `description` | `String?` | شرح تکمیلی موجودیت. |
| `status` | `JournalEntryStatus` | وضعیت چرخه عمر رکورد؛ مقادیر مجاز در Enum مربوط تعریف شده‌اند. |
| `occurredAt` | `DateTime` | زمان وقوع رویداد در منبع. |
| `postedAt` | `DateTime?` | زمان قطعی و ثبت‌شدن سند حسابداری در دفتر کل. |
| `createdByUserId` | `Int?` | شناسه کاربر مرتبط با این JournalEntry؛ کلید خارجی به جدول User است. |
| `reversalOfId` | `BigInt?` | شناسه JournalEntry مرتبط با این JournalEntry؛ کلید خارجی به جدول JournalEntry است. |
| `createdAt` | `DateTime` | زمان ایجاد رکورد. |
| `lines` | `JournalLine[]` | رابطه Prisma با جدول JournalLine (JournalLine)؛ مجموعه رکوردهای وابسته را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |
| `createdBy` | `User?` | رابطه Prisma با جدول User (کاربر)؛ رکورد مرتبط را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |
| `reversalOf` | `JournalEntry?` | رابطه Prisma با جدول JournalEntry (JournalEntry)؛ رکورد مرتبط را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |
| `reversals` | `JournalEntry[]` | رابطه Prisma با جدول JournalEntry (JournalEntry)؛ مجموعه رکوردهای وابسته را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |

## JournalLine — JournalLine

سطر بدهکار/بستانکار سند حسابداری و حساب دفتر کل مربوط.

| فیلد | نوع Prisma | توضیح |
|---|---|---|
| `id` | `BigInt` | شناسه یکتای رکورد و کلید اصلی جدول. |
| `journalEntryId` | `BigInt` | شناسه JournalEntry مرتبط با این JournalLine؛ کلید خارجی به جدول JournalEntry است. |
| `accountId` | `Int` | شناسه LedgerAccount مرتبط با این JournalLine؛ کلید خارجی به جدول LedgerAccount است. |
| `debit` | `Decimal` | مبلغ بدهکار این سطر سند حسابداری. |
| `credit` | `Decimal` | مبلغ بستانکار این سطر سند حسابداری. |
| `memo` | `String?` | شرح کوتاه سطر یا عملیات. |
| `createdAt` | `DateTime` | زمان ایجاد رکورد. |
| `journalEntry` | `JournalEntry` | رابطه Prisma با جدول JournalEntry (JournalEntry)؛ رکورد مرتبط را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |
| `account` | `LedgerAccount` | رابطه Prisma با جدول LedgerAccount (LedgerAccount)؛ رکورد مرتبط را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |

## CommissionRule — CommissionRule

قاعده محاسبه کمیسیون بر اساس درصد/مبلغ ثابت، شرکت/دسته و بازه اعتبار.

| فیلد | نوع Prisma | توضیح |
|---|---|---|
| `id` | `Int` | شناسه یکتای رکورد و کلید اصلی جدول. |
| `code` | `String` | کد ماشینی یا تجاری این موجودیت. |
| `name` | `String` | نام قابل نمایش موجودیت. |
| `calculation` | `CommissionCalculationType` | روش محاسبه مقدار یا کمیسیون. |
| `rate` | `Decimal` | نرخ یا درصد مورد استفاده در محاسبه. |
| `currency` | `String?` | کد سه‌حرفی ارز (ISO 4217) مبالغ این رکورد. |
| `companyId` | `Int?` | شناسه شرکت مرتبط با این CommissionRule؛ کلید خارجی به جدول Company است. |
| `categoryId` | `Int?` | شناسه Category مرتبط با این CommissionRule؛ کلید خارجی به جدول Category است. |
| `priority` | `Int` | اولویت رسیدگی یا پردازش. |
| `validFrom` | `DateTime` | شروع اعتبار قیمت یا قاعده. |
| `validTo` | `DateTime?` | پایان اعتبار؛ NULL یعنی تاریخ پایان تعیین نشده است. |
| `isActive` | `Boolean` | فعال یا غیرفعال بودن رکورد. |
| `createdAt` | `DateTime` | زمان ایجاد رکورد. |
| `updatedAt` | `DateTime` | آخرین زمان ویرایش رکورد. |
| `company` | `Company?` | رابطه Prisma با جدول Company (شرکت)؛ رکورد مرتبط را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |
| `category` | `Category?` | رابطه Prisma با جدول Category (Category)؛ رکورد مرتبط را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |
| `snapshots` | `CommissionSnapshot[]` | رابطه Prisma با جدول CommissionSnapshot (CommissionSnapshot)؛ مجموعه رکوردهای وابسته را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |

## CommissionSnapshot — CommissionSnapshot

snapshot کمیسیون محاسبه‌شده برای سفارش فروشنده تا تغییر بعدی قانون، مبلغ تاریخی را عوض نکند.

| فیلد | نوع Prisma | توضیح |
|---|---|---|
| `id` | `Int` | شناسه یکتای رکورد و کلید اصلی جدول. |
| `sellerOrderId` | `Int` | شناسه سفارش فروشنده مرتبط با این CommissionSnapshot؛ کلید خارجی به جدول SellerOrder است. |
| `ruleId` | `Int?` | شناسه CommissionRule مرتبط با این CommissionSnapshot؛ کلید خارجی به جدول CommissionRule است. |
| `calculation` | `CommissionCalculationType` | روش محاسبه مقدار یا کمیسیون. |
| `rate` | `Decimal` | نرخ یا درصد مورد استفاده در محاسبه. |
| `baseAmount` | `Decimal` | مبلغ مبنای محاسبه کمیسیون. |
| `commissionAmount` | `Decimal` | مبلغ کمیسیون محاسبه‌شده. |
| `currency` | `String` | کد سه‌حرفی ارز (ISO 4217) مبالغ این رکورد. |
| `createdAt` | `DateTime` | زمان ایجاد رکورد. |
| `sellerOrder` | `SellerOrder` | رابطه Prisma با جدول SellerOrder (سفارش فروشنده)؛ رکورد مرتبط را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |
| `rule` | `CommissionRule?` | رابطه Prisma با جدول CommissionRule (CommissionRule)؛ رکورد مرتبط را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |

## SellerPayable — SellerPayable

بدهی خالص بازارگاه به فروشنده برای سفارش، پس از کمیسیون و کسورات.

| فیلد | نوع Prisma | توضیح |
|---|---|---|
| `id` | `BigInt` | شناسه یکتای رکورد و کلید اصلی جدول. |
| `sellerOrderId` | `Int` | شناسه سفارش فروشنده مرتبط با این SellerPayable؛ کلید خارجی به جدول SellerOrder است. |
| `companyId` | `Int` | شناسه شرکت مرتبط با این SellerPayable؛ کلید خارجی به جدول Company است. |
| `settlementId` | `Int?` | شناسه تسویه مرتبط با این SellerPayable؛ کلید خارجی به جدول Settlement است. |
| `currency` | `String` | کد سه‌حرفی ارز (ISO 4217) مبالغ این رکورد. |
| `grossAmount` | `Decimal` | مبلغ ناخالص پیش از کسر کمیسیون و کسورات. |
| `commissionAmount` | `Decimal` | مبلغ کمیسیون محاسبه‌شده. |
| `deductionAmount` | `Decimal` | جمع کسورات از مبلغ فروشنده/تسویه. |
| `netAmount` | `Decimal` | مبلغ خالص پس از کسر کمیسیون و کسورات. |
| `status` | `SellerPayableStatus` | وضعیت چرخه عمر رکورد؛ مقادیر مجاز در Enum مربوط تعریف شده‌اند. |
| `eligibleAt` | `DateTime?` | زمان eligible این SellerPayable را ثبت می‌کند. |
| `paidAt` | `DateTime?` | زمان پرداخت موفق. |
| `createdAt` | `DateTime` | زمان ایجاد رکورد. |
| `updatedAt` | `DateTime` | آخرین زمان ویرایش رکورد. |
| `sellerOrder` | `SellerOrder` | رابطه Prisma با جدول SellerOrder (سفارش فروشنده)؛ رکورد مرتبط را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |
| `company` | `Company` | رابطه Prisma با جدول Company (شرکت)؛ رکورد مرتبط را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |
| `settlement` | `Settlement?` | رابطه Prisma با جدول Settlement (تسویه)؛ رکورد مرتبط را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |

## Settlement — تسویه

پرونده تسویه مالی شرکت در یک دوره همراه با مبالغ و وضعیت تأیید/پرداخت.

| فیلد | نوع Prisma | توضیح |
|---|---|---|
| `id` | `Int` | شناسه یکتای رکورد و کلید اصلی جدول. |
| `settlementNumber` | `String` | شماره یکتای پرونده تسویه. |
| `companyId` | `Int` | شناسه شرکت مرتبط با این تسویه؛ کلید خارجی به جدول Company است. |
| `currency` | `String` | کد سه‌حرفی ارز (ISO 4217) مبالغ این رکورد. |
| `periodStart` | `DateTime` | شروع دوره مالی/تسویه. |
| `periodEnd` | `DateTime` | پایان دوره مالی/تسویه. |
| `grossAmount` | `Decimal` | مبلغ ناخالص پیش از کسر کمیسیون و کسورات. |
| `deductionAmount` | `Decimal` | جمع کسورات از مبلغ فروشنده/تسویه. |
| `netAmount` | `Decimal` | مبلغ خالص پس از کسر کمیسیون و کسورات. |
| `status` | `SettlementStatus` | وضعیت چرخه عمر رکورد؛ مقادیر مجاز در Enum مربوط تعریف شده‌اند. |
| `requestedByUserId` | `Int` | شناسه کاربر مرتبط با این تسویه؛ کلید خارجی به جدول User است. |
| `requestedAt` | `DateTime` | زمان ثبت درخواست. |
| `approvedAt` | `DateTime?` | زمان تأیید. |
| `paidAt` | `DateTime?` | زمان پرداخت موفق. |
| `createdAt` | `DateTime` | زمان ایجاد رکورد. |
| `updatedAt` | `DateTime` | آخرین زمان ویرایش رکورد. |
| `company` | `Company` | رابطه Prisma با جدول Company (شرکت)؛ رکورد مرتبط را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |
| `requestedBy` | `User` | رابطه Prisma با جدول User (کاربر)؛ رکورد مرتبط را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |
| `payables` | `SellerPayable[]` | رابطه Prisma با جدول SellerPayable (SellerPayable)؛ مجموعه رکوردهای وابسته را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |
| `approvals` | `SettlementApproval[]` | رابطه Prisma با جدول SettlementApproval (SettlementApproval)؛ مجموعه رکوردهای وابسته را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |
| `payouts` | `SettlementPayout[]` | رابطه Prisma با جدول SettlementPayout (SettlementPayout)؛ مجموعه رکوردهای وابسته را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |

## SettlementApproval — SettlementApproval

تصمیم تأیید/رد پرونده تسویه، تأییدکننده و زمان تصمیم.

| فیلد | نوع Prisma | توضیح |
|---|---|---|
| `id` | `Int` | شناسه یکتای رکورد و کلید اصلی جدول. |
| `settlementId` | `Int` | شناسه تسویه مرتبط با این SettlementApproval؛ کلید خارجی به جدول Settlement است. |
| `approverUserId` | `Int` | شناسه کاربر مرتبط با این SettlementApproval؛ کلید خارجی به جدول User است. |
| `decision` | `SettlementApprovalDecision` | نتیجه تصمیم ثبت‌شده. |
| `reason` | `String?` | علت درخواست، تغییر وضعیت یا تصمیم. |
| `decidedAt` | `DateTime` | زمان ثبت تصمیم تأییدکننده. |
| `settlement` | `Settlement` | رابطه Prisma با جدول Settlement (تسویه)؛ رکورد مرتبط را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |
| `approver` | `User` | رابطه Prisma با جدول User (کاربر)؛ رکورد مرتبط را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |

## SettlementPayout — SettlementPayout

اجرای پرداخت یک تسویه به فروشنده و نتیجه آن.

| فیلد | نوع Prisma | توضیح |
|---|---|---|
| `id` | `Int` | شناسه یکتای رکورد و کلید اصلی جدول. |
| `settlementId` | `Int` | شناسه تسویه مرتبط با این SettlementPayout؛ کلید خارجی به جدول Settlement است. |
| `provider` | `String?` | نام درگاه یا سرویس بیرونی انجام‌دهنده عملیات. |
| `providerReference` | `String?` | شناسه مرجع عملیات نزد ارائه‌دهنده بیرونی. |
| `amount` | `Decimal` | مبلغ مالی این رکورد. |
| `currency` | `String` | کد سه‌حرفی ارز (ISO 4217) مبالغ این رکورد. |
| `status` | `PayoutStatus` | وضعیت چرخه عمر رکورد؛ مقادیر مجاز در Enum مربوط تعریف شده‌اند. |
| `idempotencyKey` | `String` | کلید یکتای جلوگیری از اجرای تکراری درخواست/عملیات. |
| `executedByUserId` | `Int?` | شناسه کاربر مرتبط با این SettlementPayout؛ کلید خارجی به جدول User است. |
| `executedAt` | `DateTime?` | زمان اجرای واقعی عملیات پرداخت. |
| `failureReason` | `String?` | علت شکست عملیات. |
| `createdAt` | `DateTime` | زمان ایجاد رکورد. |
| `updatedAt` | `DateTime` | آخرین زمان ویرایش رکورد. |
| `settlement` | `Settlement` | رابطه Prisma با جدول Settlement (تسویه)؛ رکورد مرتبط را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |
| `executedBy` | `User?` | رابطه Prisma با جدول User (کاربر)؛ رکورد مرتبط را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |
| `reconciliations` | `ReconciliationRecord[]` | رابطه Prisma با جدول ReconciliationRecord (ReconciliationRecord)؛ مجموعه رکوردهای وابسته را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |

## ReconciliationRecord — ReconciliationRecord

تطبیق تراکنش یا پرداخت خروجی با گزارش ارائه‌دهنده مالی.

| فیلد | نوع Prisma | توضیح |
|---|---|---|
| `id` | `BigInt` | شناسه یکتای رکورد و کلید اصلی جدول. |
| `provider` | `String` | نام درگاه یا سرویس بیرونی انجام‌دهنده عملیات. |
| `externalReference` | `String` | شناسه مرجع رکورد در سامانه بیرونی. |
| `amount` | `Decimal` | مبلغ مالی این رکورد. |
| `currency` | `String` | کد سه‌حرفی ارز (ISO 4217) مبالغ این رکورد. |
| `matched` | `Boolean` | مشخص می‌کند رکورد با تراکنش/پرداخت متناظر تطبیق داده شده است. |
| `paymentTransactionId` | `Int?` | شناسه PaymentTransaction مرتبط با این ReconciliationRecord؛ کلید خارجی به جدول PaymentTransaction است. |
| `payoutId` | `Int?` | شناسه SettlementPayout مرتبط با این ReconciliationRecord؛ کلید خارجی به جدول SettlementPayout است. |
| `notes` | `String?` | یادداشت‌های تکمیلی درباره رکورد. |
| `reconciledAt` | `DateTime` | زمان انجام تطبیق با گزارش ارائه‌دهنده مالی. |
| `paymentTransaction` | `PaymentTransaction?` | رابطه Prisma با جدول PaymentTransaction (PaymentTransaction)؛ رکورد مرتبط را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |
| `payout` | `SettlementPayout?` | رابطه Prisma با جدول SettlementPayout (SettlementPayout)؛ رکورد مرتبط را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |

## FinanceInvoice — FinanceInvoice

سربرگ فاکتور مالی مرتبط با خریدار، شرکت یا سفارش.

| فیلد | نوع Prisma | توضیح |
|---|---|---|
| `id` | `Int` | شناسه یکتای رکورد و کلید اصلی جدول. |
| `invoiceNumber` | `String` | شماره یکتای فاکتور مالی. |
| `companyId` | `Int?` | شناسه شرکت مرتبط با این FinanceInvoice؛ کلید خارجی به جدول Company است. |
| `buyerUserId` | `Int?` | شناسه کاربر مرتبط با این FinanceInvoice؛ کلید خارجی به جدول User است. |
| `orderId` | `Int?` | شناسه سفارش مرتبط با این FinanceInvoice؛ کلید خارجی به جدول RetailOrder است. |
| `sellerOrderId` | `Int?` | شناسه سفارش فروشنده مرتبط با این FinanceInvoice؛ کلید خارجی به جدول SellerOrder است. |
| `status` | `InvoiceStatus` | وضعیت چرخه عمر رکورد؛ مقادیر مجاز در Enum مربوط تعریف شده‌اند. |
| `currency` | `String` | کد سه‌حرفی ارز (ISO 4217) مبالغ این رکورد. |
| `subtotal` | `Decimal` | جمع مبالغ پیش از تخفیف/مالیات/هزینه‌های افزوده. |
| `taxTotal` | `Decimal` | جمع مالیات سفارش یا فاکتور. |
| `grandTotal` | `Decimal` | مبلغ نهایی قابل پرداخت پس از اعمال اجزا و تعدیلات. |
| `issuedAt` | `DateTime?` | زمان صدور رسمی فاکتور. |
| `createdAt` | `DateTime` | زمان ایجاد رکورد. |
| `updatedAt` | `DateTime` | آخرین زمان ویرایش رکورد. |
| `company` | `Company?` | رابطه Prisma با جدول Company (شرکت)؛ رکورد مرتبط را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |
| `buyer` | `User?` | رابطه Prisma با جدول User (کاربر)؛ رکورد مرتبط را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |
| `order` | `RetailOrder?` | رابطه Prisma با جدول RetailOrder (سفارش)؛ رکورد مرتبط را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |
| `sellerOrder` | `SellerOrder?` | رابطه Prisma با جدول SellerOrder (سفارش فروشنده)؛ رکورد مرتبط را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |
| `lines` | `FinanceInvoiceLine[]` | رابطه Prisma با جدول FinanceInvoiceLine (FinanceInvoiceLine)؛ مجموعه رکوردهای وابسته را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |

## FinanceInvoiceLine — FinanceInvoiceLine

ردیف جزئیات فاکتور شامل شرح، تعداد، قیمت، مالیات و جمع ردیف.

| فیلد | نوع Prisma | توضیح |
|---|---|---|
| `id` | `Int` | شناسه یکتای رکورد و کلید اصلی جدول. |
| `invoiceId` | `Int` | شناسه FinanceInvoice مرتبط با این FinanceInvoiceLine؛ کلید خارجی به جدول FinanceInvoice است. |
| `description` | `String` | شرح تکمیلی موجودیت. |
| `quantity` | `Decimal` | تعداد واحدهای کالا یا مقدار موردنظر. |
| `unitPrice` | `Decimal` | قیمت هر واحد کالا یا خدمت در این ردیف. |
| `taxAmount` | `Decimal` | مبلغ مالیات محاسبه‌شده برای این ردیف. |
| `lineTotal` | `Decimal` | مبلغ نهایی این ردیف پس از تخفیف و مالیات. |
| `invoice` | `FinanceInvoice` | رابطه Prisma با جدول FinanceInvoice (FinanceInvoice)؛ رکورد مرتبط را در کد در دسترس قرار می‌دهد و ستون مستقل PostgreSQL نیست. |

