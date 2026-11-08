# فرهنگ داده پایگاه داده — Telecom Marketplace

این سند از `backend/prisma/schema.prisma` تولید و با توضیحات منبع همگام شده است. توضیحات فارسی در خود Prisma و در metadata بومی PostgreSQL ثبت می‌شوند؛ بنابراین در IDE و ابزارهایی مانند DBeaver و pgAdmin قابل مشاهده‌اند.

- تعداد مدل/جدول‌ها: **97**
- این مرحله فقط مستندسازی است و هیچ ستون، نوع داده، رابطه، constraint یا داده‌ای را تغییر نمی‌دهد.
- فیلدهای رابطه‌ای Prisma در مستندات کد توضیح داده شده‌اند اما ستون مستقل PostgreSQL نیستند؛ بنابراین برای آن‌ها `COMMENT ON COLUMN` ساخته نمی‌شود.

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
| `permissions` | `RolePermission[]` | ارتباط Prisma با جدول RolePermission (اتصال نقش و مجوز): مجموعه رکوردهای وابسته مرتبط با نقش؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |
| `users` | `UserRole[]` | ارتباط Prisma با جدول UserRole (تخصیص نقش): مجموعه رکوردهای وابسته مرتبط با نقش؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |

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
| `roles` | `RolePermission[]` | ارتباط Prisma با جدول RolePermission (اتصال نقش و مجوز): مجموعه رکوردهای وابسته مرتبط با مجوز؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |

## RolePermission — اتصال نقش و مجوز

رابط چندبه‌چند نقش و مجوز؛ هر رکورد یک مجوز اعطاشده به یک نقش را ثبت می‌کند.

| فیلد | نوع Prisma | توضیح |
|---|---|---|
| `roleId` | `Int` | شناسه نقش مرتبط با این اتصال نقش و مجوز؛ کلید خارجی به جدول Role است. |
| `permissionId` | `Int` | شناسه مجوز مرتبط با این اتصال نقش و مجوز؛ کلید خارجی به جدول Permission است. |
| `assignedAt` | `DateTime` | زمان assigned این اتصال نقش و مجوز را ثبت می‌کند. |
| `permission` | `Permission` | ارتباط Prisma با جدول Permission (مجوز): رکورد مرتبط مرتبط با اتصال نقش و مجوز؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |
| `role` | `Role` | ارتباط Prisma با جدول Role (نقش): رکورد مرتبط مرتبط با اتصال نقش و مجوز؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |

## UserRole — تخصیص نقش

رابط تخصیص نقش به کاربر و زمان اعطای نقش.

| فیلد | نوع Prisma | توضیح |
|---|---|---|
| `userId` | `Int` | شناسه کاربر مرتبط با این تخصیص نقش؛ کلید خارجی به جدول User است. |
| `roleId` | `Int` | شناسه نقش مرتبط با این تخصیص نقش؛ کلید خارجی به جدول Role است. |
| `assignedAt` | `DateTime` | زمان assigned این تخصیص نقش را ثبت می‌کند. |
| `role` | `Role` | ارتباط Prisma با جدول Role (نقش): رکورد مرتبط مرتبط با تخصیص نقش؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |
| `user` | `User` | ارتباط Prisma با جدول User (کاربر): رکورد مرتبط مرتبط با تخصیص نقش؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |

## AccessProfile — زمینه دسترسی

زمینه دسترسی کاربر به برنامه و شرکت وابسته به آن، در صورت وجود.

| فیلد | نوع Prisma | توضیح |
|---|---|---|
| `id` | `Int` | شناسه یکتای رکورد و کلید اصلی جدول. |
| `userId` | `Int` | شناسه کاربر مرتبط با این زمینه دسترسی؛ کلید خارجی به جدول User است. |
| `type` | `AccessProfileType` | مقدار type برای نگهداری اطلاعات مرتبط با زمینه دسترسی. |
| `companyId` | `Int?` | شناسه شرکت مرتبط با این زمینه دسترسی؛ کلید خارجی به جدول Company است. |
| `isActive` | `Boolean` | فعال یا غیرفعال بودن رکورد. |
| `createdAt` | `DateTime` | زمان ایجاد رکورد. |
| `updatedAt` | `DateTime` | آخرین زمان ویرایش رکورد. |
| `user` | `User` | ارتباط Prisma با جدول User (کاربر): رکورد مرتبط مرتبط با زمینه دسترسی؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |
| `company` | `Company?` | ارتباط Prisma با جدول Company (شرکت): رکورد مرتبط مرتبط با زمینه دسترسی؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |

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
| `user` | `User` | ارتباط Prisma با جدول User (کاربر): رکورد مرتبط مرتبط با پروفایل؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |

## Company — شرکت

اطلاعات هویتی، ثبتی، تماس، نوع فعالیت و وضعیت شرکت‌های عضو بازارگاه.

| فیلد | نوع Prisma | توضیح |
|---|---|---|
| `id` | `Int` | شناسه یکتای رکورد و کلید اصلی جدول. |
| `name` | `String` | نام قابل نمایش موجودیت. |
| `nameEn` | `String?` | نام انگلیسی موجودیت. |
| `nationalId` | `String?` | شناسه ملی شرکت/شخص برای شناسایی و تطبیق. |
| `registrationNumber` | `String?` | شماره ثبت قانونی شرکت. |
| `type` | `CompanyType?` | مقدار type برای نگهداری اطلاعات مرتبط با شرکت. |
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
| `deletedAt` | `DateTime?` | زمان حذف نرم؛ مقدار NULL یعنی رکورد حذف نرم نشده است. |
| `accessProfiles` | `AccessProfile[]` | ارتباط Prisma با جدول AccessProfile (زمینه دسترسی): مجموعه رکوردهای وابسته مرتبط با شرکت؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |
| `products` | `Product[]` | ارتباط Prisma با جدول Product (محصول): مجموعه رکوردهای وابسته مرتبط با شرکت؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |
| `inquiries` | `Inquiry[]` | ارتباط Prisma با جدول Inquiry (استعلام): مجموعه رکوردهای وابسته مرتبط با شرکت؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |
| `responses` | `InquiryResponse[]` | ارتباط Prisma با جدول InquiryResponse (InquiryResponse): مجموعه رکوردهای وابسته مرتبط با شرکت؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |
| `inquiryLimit` | `CompanyInquiryLimit?` | ارتباط Prisma با جدول CompanyInquiryLimit (CompanyInquiryLimit): رکورد مرتبط مرتبط با شرکت؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |
| `limits` | `CompanyLimit[]` | ارتباط Prisma با جدول CompanyLimit (CompanyLimit): مجموعه رکوردهای وابسته مرتبط با شرکت؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |
| `inquirySubscriptions` | `InquirySubscription[]` | ارتباط Prisma با جدول InquirySubscription (InquirySubscription): مجموعه رکوردهای وابسته مرتبط با شرکت؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |
| `sentInquiryMessages` | `InquiryMessage[]` | ارتباط Prisma با جدول InquiryMessage (InquiryMessage): مجموعه رکوردهای وابسته مرتبط با شرکت؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |
| `receivedInquiryMessages` | `InquiryMessage[]` | ارتباط Prisma با جدول InquiryMessage (InquiryMessage): مجموعه رکوردهای وابسته مرتبط با شرکت؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |
| `auditLogs` | `AuditLog[]` | ارتباط Prisma با جدول AuditLog (AuditLog): مجموعه رکوردهای وابسته مرتبط با شرکت؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |
| `supportTickets` | `SupportTicket[]` | ارتباط Prisma با جدول SupportTicket (تیکت پشتیبانی): مجموعه رکوردهای وابسته مرتبط با شرکت؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |
| `crmAccounts` | `CRMAccount[]` | ارتباط Prisma با جدول CRMAccount (CRMAccount): مجموعه رکوردهای وابسته مرتبط با شرکت؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |
| `sellerOrders` | `SellerOrder[]` | ارتباط Prisma با جدول SellerOrder (سفارش فروشنده): مجموعه رکوردهای وابسته مرتبط با شرکت؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |
| `commissionRules` | `CommissionRule[]` | ارتباط Prisma با جدول CommissionRule (CommissionRule): مجموعه رکوردهای وابسته مرتبط با شرکت؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |
| `sellerPayables` | `SellerPayable[]` | ارتباط Prisma با جدول SellerPayable (SellerPayable): مجموعه رکوردهای وابسته مرتبط با شرکت؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |
| `settlements` | `Settlement[]` | ارتباط Prisma با جدول Settlement (تسویه): مجموعه رکوردهای وابسته مرتبط با شرکت؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |
| `financeInvoices` | `FinanceInvoice[]` | ارتباط Prisma با جدول FinanceInvoice (FinanceInvoice): مجموعه رکوردهای وابسته مرتبط با شرکت؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |

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
| `profile` | `Profile?` | ارتباط Prisma با جدول Profile (پروفایل): رکورد مرتبط مرتبط با کاربر؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |
| `accessProfile` | `AccessProfile?` | ارتباط Prisma با جدول AccessProfile (زمینه دسترسی): رکورد مرتبط مرتبط با کاربر؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |
| `roles` | `UserRole[]` | ارتباط Prisma با جدول UserRole (تخصیص نقش): مجموعه رکوردهای وابسته مرتبط با کاربر؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |
| `refreshTokens` | `RefreshToken[]` | ارتباط Prisma با جدول RefreshToken (RefreshToken): مجموعه رکوردهای وابسته مرتبط با کاربر؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |
| `handoffCodes` | `HandoffCode[]` | ارتباط Prisma با جدول HandoffCode (HandoffCode): مجموعه رکوردهای وابسته مرتبط با کاربر؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |
| `notifications` | `Notification[]` | ارتباط Prisma با جدول Notification (اعلان): مجموعه رکوردهای وابسته مرتبط با کاربر؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |
| `notificationPreferences` | `NotificationPreference[]` | ارتباط Prisma با جدول NotificationPreference (NotificationPreference): مجموعه رکوردهای وابسته مرتبط با کاربر؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |
| `notificationDeliveries` | `NotificationDelivery[]` | ارتباط Prisma با جدول NotificationDelivery (NotificationDelivery): مجموعه رکوردهای وابسته مرتبط با کاربر؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |
| `products` | `Product[]` | ارتباط Prisma با جدول Product (محصول): مجموعه رکوردهای وابسته مرتبط با کاربر؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |
| `productStatusChanges` | `ProductStatusHistory[]` | ارتباط Prisma با جدول ProductStatusHistory (ProductStatusHistory): مجموعه رکوردهای وابسته مرتبط با کاربر؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |
| `productActivityLogs` | `ProductActivityLog[]` | ارتباط Prisma با جدول ProductActivityLog (ProductActivityLog): مجموعه رکوردهای وابسته مرتبط با کاربر؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |
| `inquiryStatusChanges` | `InquiryStatusHistory[]` | ارتباط Prisma با جدول InquiryStatusHistory (InquiryStatusHistory): مجموعه رکوردهای وابسته مرتبط با کاربر؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |
| `buyerInquiries` | `Inquiry[]` | ارتباط Prisma با جدول Inquiry (استعلام): مجموعه رکوردهای وابسته مرتبط با کاربر؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |
| `inquirySubscriptions` | `InquirySubscription[]` | ارتباط Prisma با جدول InquirySubscription (InquirySubscription): مجموعه رکوردهای وابسته مرتبط با کاربر؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |
| `sentInquiryMessages` | `InquiryMessage[]` | ارتباط Prisma با جدول InquiryMessage (InquiryMessage): مجموعه رکوردهای وابسته مرتبط با کاربر؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |
| `receivedInquiryMessages` | `InquiryMessage[]` | ارتباط Prisma با جدول InquiryMessage (InquiryMessage): مجموعه رکوردهای وابسته مرتبط با کاربر؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |
| `addresses` | `Address[]` | ارتباط Prisma با جدول Address (نشانی): مجموعه رکوردهای وابسته مرتبط با کاربر؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |
| `authChallenges` | `AuthChallenge[]` | ارتباط Prisma با جدول AuthChallenge (AuthChallenge): مجموعه رکوردهای وابسته مرتبط با کاربر؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |
| `auditLogs` | `AuditLog[]` | ارتباط Prisma با جدول AuditLog (AuditLog): مجموعه رکوردهای وابسته مرتبط با کاربر؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |
| `supportRequestedTickets` | `SupportTicket[]` | ارتباط Prisma با جدول SupportTicket (تیکت پشتیبانی): مجموعه رکوردهای وابسته مرتبط با کاربر؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |
| `supportCurrentAssignments` | `SupportTicket[]` | ارتباط Prisma با جدول SupportTicket (تیکت پشتیبانی): مجموعه رکوردهای وابسته مرتبط با کاربر؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |
| `supportMessages` | `SupportMessage[]` | ارتباط Prisma با جدول SupportMessage (SupportMessage): مجموعه رکوردهای وابسته مرتبط با کاربر؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |
| `supportAttachments` | `SupportAttachment[]` | ارتباط Prisma با جدول SupportAttachment (SupportAttachment): مجموعه رکوردهای وابسته مرتبط با کاربر؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |
| `supportAssignmentsReceived` | `SupportAssignment[]` | ارتباط Prisma با جدول SupportAssignment (SupportAssignment): مجموعه رکوردهای وابسته مرتبط با کاربر؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |
| `supportAssignmentsMade` | `SupportAssignment[]` | ارتباط Prisma با جدول SupportAssignment (SupportAssignment): مجموعه رکوردهای وابسته مرتبط با کاربر؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |
| `supportStatusChanges` | `SupportStatusHistory[]` | ارتباط Prisma با جدول SupportStatusHistory (SupportStatusHistory): مجموعه رکوردهای وابسته مرتبط با کاربر؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |
| `supportEvents` | `SupportEvent[]` | ارتباط Prisma با جدول SupportEvent (SupportEvent): مجموعه رکوردهای وابسته مرتبط با کاربر؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |
| `authoredArticles` | `Article[]` | ارتباط Prisma با جدول Article (مقاله): مجموعه رکوردهای وابسته مرتبط با کاربر؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |
| `publishedArticles` | `Article[]` | ارتباط Prisma با جدول Article (مقاله): مجموعه رکوردهای وابسته مرتبط با کاربر؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |
| `articleRevisions` | `ArticleRevision[]` | ارتباط Prisma با جدول ArticleRevision (ArticleRevision): مجموعه رکوردهای وابسته مرتبط با کاربر؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |
| `uploadedArticleMedia` | `ArticleMedia[]` | ارتباط Prisma با جدول ArticleMedia (ArticleMedia): مجموعه رکوردهای وابسته مرتبط با کاربر؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |
| `crmAccounts` | `CRMAccount[]` | ارتباط Prisma با جدول CRMAccount (CRMAccount): مجموعه رکوردهای وابسته مرتبط با کاربر؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |
| `ownedCrmAccounts` | `CRMAccount[]` | ارتباط Prisma با جدول CRMAccount (CRMAccount): مجموعه رکوردهای وابسته مرتبط با کاربر؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |
| `crmContacts` | `CRMContact[]` | ارتباط Prisma با جدول CRMContact (CRMContact): مجموعه رکوردهای وابسته مرتبط با کاربر؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |
| `ownedLeads` | `Lead[]` | ارتباط Prisma با جدول Lead (سرنخ فروش): مجموعه رکوردهای وابسته مرتبط با کاربر؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |
| `convertedLeads` | `Lead[]` | ارتباط Prisma با جدول Lead (سرنخ فروش): مجموعه رکوردهای وابسته مرتبط با کاربر؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |
| `ownedOpportunities` | `Opportunity[]` | ارتباط Prisma با جدول Opportunity (فرصت فروش): مجموعه رکوردهای وابسته مرتبط با کاربر؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |
| `crmActivities` | `CRMActivity[]` | ارتباط Prisma با جدول CRMActivity (CRMActivity): مجموعه رکوردهای وابسته مرتبط با کاربر؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |
| `assignedCrmTasks` | `CRMTask[]` | ارتباط Prisma با جدول CRMTask (CRMTask): مجموعه رکوردهای وابسته مرتبط با کاربر؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |
| `createdCrmTasks` | `CRMTask[]` | ارتباط Prisma با جدول CRMTask (CRMTask): مجموعه رکوردهای وابسته مرتبط با کاربر؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |
| `crmNotes` | `CRMNote[]` | ارتباط Prisma با جدول CRMNote (CRMNote): مجموعه رکوردهای وابسته مرتبط با کاربر؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |
| `inventoryMovements` | `InventoryMovement[]` | ارتباط Prisma با جدول InventoryMovement (InventoryMovement): مجموعه رکوردهای وابسته مرتبط با کاربر؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |
| `retailOrders` | `RetailOrder[]` | ارتباط Prisma با جدول RetailOrder (سفارش): مجموعه رکوردهای وابسته مرتبط با کاربر؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |
| `inventoryReservations` | `InventoryReservation[]` | ارتباط Prisma با جدول InventoryReservation (InventoryReservation): مجموعه رکوردهای وابسته مرتبط با کاربر؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |
| `retailRefunds` | `RetailRefund[]` | ارتباط Prisma با جدول RetailRefund (RetailRefund): مجموعه رکوردهای وابسته مرتبط با کاربر؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |
| `returnRequests` | `ReturnRequest[]` | ارتباط Prisma با جدول ReturnRequest (ReturnRequest): مجموعه رکوردهای وابسته مرتبط با کاربر؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |
| `journalEntries` | `JournalEntry[]` | ارتباط Prisma با جدول JournalEntry (JournalEntry): مجموعه رکوردهای وابسته مرتبط با کاربر؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |
| `settlementRequests` | `Settlement[]` | ارتباط Prisma با جدول Settlement (تسویه): مجموعه رکوردهای وابسته مرتبط با کاربر؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |
| `settlementApprovals` | `SettlementApproval[]` | ارتباط Prisma با جدول SettlementApproval (SettlementApproval): مجموعه رکوردهای وابسته مرتبط با کاربر؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |
| `payoutExecutions` | `SettlementPayout[]` | ارتباط Prisma با جدول SettlementPayout (SettlementPayout): مجموعه رکوردهای وابسته مرتبط با کاربر؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |
| `financeInvoices` | `FinanceInvoice[]` | ارتباط Prisma با جدول FinanceInvoice (FinanceInvoice): مجموعه رکوردهای وابسته مرتبط با کاربر؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |
| `opportunityStageChanges` | `OpportunityStageHistory[]` | ارتباط Prisma با جدول OpportunityStageHistory (OpportunityStageHistory): مجموعه رکوردهای وابسته مرتبط با کاربر؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |

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
| `user` | `User` | ارتباط Prisma با جدول User (کاربر): رکورد مرتبط مرتبط با نشانی؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |
| `retailOrders` | `RetailOrder[]` | ارتباط Prisma با جدول RetailOrder (سفارش): مجموعه رکوردهای وابسته مرتبط با نشانی؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |

## RefreshToken — RefreshToken

توکن‌های نوسازی نشست کاربر برای کنترل انقضا و ابطال نشست.

| فیلد | نوع Prisma | توضیح |
|---|---|---|
| `id` | `Int` | شناسه یکتای رکورد و کلید اصلی جدول. |
| `token` | `String` | توکن نشست/نوسازی؛ دسترسی به آن باید محدود و امن باشد. |
| `userId` | `Int` | شناسه کاربر مرتبط با این RefreshToken؛ کلید خارجی به جدول User است. |
| `expiresAt` | `DateTime` | زمان انقضای اعتبار رکورد یا توکن. |
| `createdAt` | `DateTime` | زمان ایجاد رکورد. |
| `user` | `User` | ارتباط Prisma با جدول User (کاربر): رکورد مرتبط مرتبط با RefreshToken؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |

## HandoffCode — HandoffCode

کد موقت انتقال امن نشست میان وب‌سایت و پنل‌ها؛ کد خام ذخیره نمی‌شود.

| فیلد | نوع Prisma | توضیح |
|---|---|---|
| `id` | `Int` | شناسه یکتای رکورد و کلید اصلی جدول. |
| `codeHash` | `String` | هش کد انتقال؛ کد خام ذخیره نمی‌شود. |
| `userId` | `Int` | شناسه کاربر مرتبط با این HandoffCode؛ کلید خارجی به جدول User است. |
| `app` | `String` | مقدار متنی app برای توصیف یا شناسایی HandoffCode. |
| `challenge` | `String` | مقدار challenge رمزنگاری‌شده مرتبط با جریان PKCE. |
| `expiresAt` | `DateTime` | زمان انقضای اعتبار رکورد یا توکن. |
| `createdAt` | `DateTime` | زمان ایجاد رکورد. |
| `user` | `User` | ارتباط Prisma با جدول User (کاربر): رکورد مرتبط مرتبط با HandoffCode؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |

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
| `showInMenu` | `Boolean` | پرچم منطقی showInMenu برای کنترل رفتار Category. |
| `sortOrder` | `Int` | ترتیب نمایش رکورد. |
| `createdAt` | `DateTime` | زمان ایجاد رکورد. |
| `updatedAt` | `DateTime` | آخرین زمان ویرایش رکورد. |
| `subcategories` | `Subcategory[]` | ارتباط Prisma با جدول Subcategory (Subcategory): مجموعه رکوردهای وابسته مرتبط با Category؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |
| `products` | `Product[]` | ارتباط Prisma با جدول Product (محصول): مجموعه رکوردهای وابسته مرتبط با Category؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |
| `commissionRules` | `CommissionRule[]` | ارتباط Prisma با جدول CommissionRule (CommissionRule): مجموعه رکوردهای وابسته مرتبط با Category؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |

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
| `sortOrder` | `Int` | ترتیب نمایش رکورد. |
| `createdAt` | `DateTime` | زمان ایجاد رکورد. |
| `updatedAt` | `DateTime` | آخرین زمان ویرایش رکورد. |
| `category` | `Category` | ارتباط Prisma با جدول Category (Category): رکورد مرتبط مرتبط با Subcategory؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |
| `specificationTemplate` | `SpecificationTemplate?` | ارتباط Prisma با جدول SpecificationTemplate (SpecificationTemplate): رکورد مرتبط مرتبط با Subcategory؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |
| `products` | `Product[]` | ارتباط Prisma با جدول Product (محصول): مجموعه رکوردهای وابسته مرتبط با Subcategory؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |

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
| `subcategory` | `Subcategory` | ارتباط Prisma با جدول Subcategory (Subcategory): رکورد مرتبط مرتبط با SpecificationTemplate؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |
| `fields` | `SpecificationField[]` | ارتباط Prisma با جدول SpecificationField (SpecificationField): مجموعه رکوردهای وابسته مرتبط با SpecificationTemplate؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |

## SpecificationField — SpecificationField

تعریف هر فیلد مشخصات فنی شامل نوع، واحد، اجباری بودن و گزینه‌ها.

| فیلد | نوع Prisma | توضیح |
|---|---|---|
| `id` | `Int` | شناسه یکتای رکورد و کلید اصلی جدول. |
| `templateId` | `Int` | شناسه SpecificationTemplate مرتبط با این SpecificationField؛ کلید خارجی به جدول SpecificationTemplate است. |
| `name` | `String` | نام قابل نمایش موجودیت. |
| `key` | `String` | کلید ماشینی تنظیم یا گزینه. |
| `type` | `SpecificationFieldType` | مقدار type برای نگهداری اطلاعات مرتبط با SpecificationField. |
| `isRequired` | `Boolean` | اجباری بودن تکمیل این فیلد. |
| `unit` | `String?` | واحد اندازه‌گیری یا فروش. |
| `options` | `Json?` | داده ساختاریافته تکمیلی options برای SpecificationField؛ ساختار آن باید در لایه سرویس اعتبارسنجی شود. |
| `sortOrder` | `Int` | ترتیب نمایش رکورد. |
| `createdAt` | `DateTime` | زمان ایجاد رکورد. |
| `updatedAt` | `DateTime` | آخرین زمان ویرایش رکورد. |
| `template` | `SpecificationTemplate` | ارتباط Prisma با جدول SpecificationTemplate (SpecificationTemplate): رکورد مرتبط مرتبط با SpecificationField؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |

## SpecificationLibraryField — SpecificationLibraryField

کتابخانه فیلدهای مشخصات فنی قابل استفاده مجدد در قالب‌های مختلف.

| فیلد | نوع Prisma | توضیح |
|---|---|---|
| `id` | `Int` | شناسه یکتای رکورد و کلید اصلی جدول. |
| `title` | `String` | عنوان اصلی قابل نمایش. |
| `slug` | `String` | شناسه متنی خوانا و یکتای مناسب URL. |
| `type` | `SpecificationFieldType` | مقدار type برای نگهداری اطلاعات مرتبط با SpecificationLibraryField. |
| `defaultUnit` | `String?` | مقدار متنی defaultUnit برای توصیف یا شناسایی SpecificationLibraryField. |
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
| `retailEnabled` | `Boolean` | پرچم منطقی retailEnabled برای کنترل رفتار محصول. |
| `isFeatured` | `Boolean` | ویژه بودن محصول برای جایگاه‌های تبلیغاتی/برجسته. |
| `editsSinceApproval` | `Int` | مقدار عددی editsSinceApproval برای محصول. |
| `companyId` | `Int` | شناسه شرکت مرتبط با این محصول؛ کلید خارجی به جدول Company است. |
| `categoryId` | `Int` | شناسه Category مرتبط با این محصول؛ کلید خارجی به جدول Category است. |
| `subcategoryId` | `Int` | شناسه Subcategory مرتبط با این محصول؛ کلید خارجی به جدول Subcategory است. |
| `createdByUserId` | `Int` | شناسه کاربر مرتبط با این محصول؛ کلید خارجی به جدول User است. |
| `createdAt` | `DateTime` | زمان ایجاد رکورد. |
| `updatedAt` | `DateTime` | آخرین زمان ویرایش رکورد. |
| `deletedAt` | `DateTime?` | زمان حذف نرم؛ مقدار NULL یعنی رکورد حذف نرم نشده است. |
| `company` | `Company` | ارتباط Prisma با جدول Company (شرکت): رکورد مرتبط مرتبط با محصول؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |
| `category` | `Category` | ارتباط Prisma با جدول Category (Category): رکورد مرتبط مرتبط با محصول؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |
| `subcategory` | `Subcategory` | ارتباط Prisma با جدول Subcategory (Subcategory): رکورد مرتبط مرتبط با محصول؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |
| `createdBy` | `User` | ارتباط Prisma با جدول User (کاربر): رکورد مرتبط مرتبط با محصول؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |
| `images` | `ProductImage[]` | ارتباط Prisma با جدول ProductImage (ProductImage): مجموعه رکوردهای وابسته مرتبط با محصول؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |
| `documents` | `ProductDocument[]` | ارتباط Prisma با جدول ProductDocument (ProductDocument): مجموعه رکوردهای وابسته مرتبط با محصول؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |
| `prices` | `ProductPriceTier[]` | ارتباط Prisma با جدول ProductPriceTier (ProductPriceTier): مجموعه رکوردهای وابسته مرتبط با محصول؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |
| `priceSnapshots` | `ProductPriceSnapshot[]` | ارتباط Prisma با جدول ProductPriceSnapshot (ProductPriceSnapshot): مجموعه رکوردهای وابسته مرتبط با محصول؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |
| `statusHistory` | `ProductStatusHistory[]` | ارتباط Prisma با جدول ProductStatusHistory (ProductStatusHistory): مجموعه رکوردهای وابسته مرتبط با محصول؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |
| `activityLog` | `ProductActivityLog[]` | ارتباط Prisma با جدول ProductActivityLog (ProductActivityLog): مجموعه رکوردهای وابسته مرتبط با محصول؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |
| `inquiryItems` | `InquiryItem[]` | ارتباط Prisma با جدول InquiryItem (InquiryItem): مجموعه رکوردهای وابسته مرتبط با محصول؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |
| `inventoryBalance` | `InventoryBalance?` | ارتباط Prisma با جدول InventoryBalance (InventoryBalance): رکورد مرتبط مرتبط با محصول؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |
| `inventoryMovements` | `InventoryMovement[]` | ارتباط Prisma با جدول InventoryMovement (InventoryMovement): مجموعه رکوردهای وابسته مرتبط با محصول؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |
| `inventoryReservations` | `InventoryReservation[]` | ارتباط Prisma با جدول InventoryReservation (InventoryReservation): مجموعه رکوردهای وابسته مرتبط با محصول؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |
| `retailOrderItems` | `RetailOrderItem[]` | ارتباط Prisma با جدول RetailOrderItem (RetailOrderItem): مجموعه رکوردهای وابسته مرتبط با محصول؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |

## ProductStatusHistory — ProductStatusHistory

تاریخچه تغییر وضعیت محصول، عامل تغییر و توضیح آن.

| فیلد | نوع Prisma | توضیح |
|---|---|---|
| `id` | `Int` | شناسه یکتای رکورد و کلید اصلی جدول. |
| `productId` | `Int` | شناسه محصول مرتبط با این ProductStatusHistory؛ کلید خارجی به جدول Product است. |
| `previousStatus` | `ProductStatus` | مقدار previousStatus برای نگهداری اطلاعات مرتبط با ProductStatusHistory. |
| `newStatus` | `ProductStatus` | مقدار newStatus برای نگهداری اطلاعات مرتبط با ProductStatusHistory. |
| `changedByUserId` | `Int` | شناسه کاربر مرتبط با این ProductStatusHistory؛ کلید خارجی به جدول User است. |
| `comment` | `String?` | توضیح ثبت‌شده درباره عملیات یا تغییر. |
| `createdAt` | `DateTime` | زمان ایجاد رکورد. |
| `product` | `Product` | ارتباط Prisma با جدول Product (محصول): رکورد مرتبط مرتبط با ProductStatusHistory؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |
| `changedBy` | `User` | ارتباط Prisma با جدول User (کاربر): رکورد مرتبط مرتبط با ProductStatusHistory؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |

## ProductActivityLog — ProductActivityLog

رویدادها و فعالیت‌های انجام‌شده روی محصول برای پیگیری و ممیزی.

| فیلد | نوع Prisma | توضیح |
|---|---|---|
| `id` | `Int` | شناسه یکتای رکورد و کلید اصلی جدول. |
| `productId` | `Int` | شناسه محصول مرتبط با این ProductActivityLog؛ کلید خارجی به جدول Product است. |
| `actorUserId` | `Int` | شناسه کاربر مرتبط با این ProductActivityLog؛ کلید خارجی به جدول User است. |
| `action` | `ProductActivityAction` | نوع اقدام انجام‌شده. |
| `detail` | `String?` | مقدار متنی detail برای توصیف یا شناسایی ProductActivityLog. |
| `comment` | `String?` | توضیح ثبت‌شده درباره عملیات یا تغییر. |
| `createdAt` | `DateTime` | زمان ایجاد رکورد. |
| `product` | `Product` | ارتباط Prisma با جدول Product (محصول): رکورد مرتبط مرتبط با ProductActivityLog؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |
| `actor` | `User` | ارتباط Prisma با جدول User (کاربر): رکورد مرتبط مرتبط با ProductActivityLog؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |

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
| `sortOrder` | `Int` | ترتیب نمایش رکورد. |
| `createdAt` | `DateTime` | زمان ایجاد رکورد. |
| `updatedAt` | `DateTime` | آخرین زمان ویرایش رکورد. |
| `product` | `Product` | ارتباط Prisma با جدول Product (محصول): رکورد مرتبط مرتبط با ProductImage؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |

## ProductDocument — ProductDocument

اسناد و فایل‌های پیوست محصول مانند دیتاشیت و کاتالوگ.

| فیلد | نوع Prisma | توضیح |
|---|---|---|
| `id` | `Int` | شناسه یکتای رکورد و کلید اصلی جدول. |
| `productId` | `Int` | شناسه محصول مرتبط با این ProductDocument؛ کلید خارجی به جدول Product است. |
| `type` | `ProductDocumentType` | مقدار type برای نگهداری اطلاعات مرتبط با ProductDocument. |
| `title` | `String?` | عنوان اصلی قابل نمایش. |
| `url` | `String` | نشانی فایل یا منبع مرتبط. |
| `sortOrder` | `Int` | ترتیب نمایش رکورد. |
| `createdAt` | `DateTime` | زمان ایجاد رکورد. |
| `updatedAt` | `DateTime` | آخرین زمان ویرایش رکورد. |
| `product` | `Product` | ارتباط Prisma با جدول Product (محصول): رکورد مرتبط مرتبط با ProductDocument؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |

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
| `product` | `Product` | ارتباط Prisma با جدول Product (محصول): رکورد مرتبط مرتبط با ProductPriceTier؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |

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
| `product` | `Product` | ارتباط Prisma با جدول Product (محصول): رکورد مرتبط مرتبط با ProductPriceSnapshot؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |

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
| `visibilityMode` | `InquiryVisibilityMode` | مقدار visibilityMode برای نگهداری اطلاعات مرتبط با استعلام. |
| `confidential` | `Boolean` | پرچم منطقی confidential برای کنترل رفتار استعلام. |
| `publishDate` | `DateTime?` | زمان مرتبط با publishDate در چرخه عمر استعلام. |
| `responseDeadline` | `DateTime?` | زمان مرتبط با responseDeadline در چرخه عمر استعلام. |
| `autoClose` | `Boolean` | پرچم منطقی autoClose برای کنترل رفتار استعلام. |
| `allowEarlyReveal` | `Boolean` | مشخص می‌کند آیا allowEarlyReveal برای این استعلام فعال یا مجاز است. |
| `revealedAt` | `DateTime?` | زمان revealed این استعلام را ثبت می‌کند. |
| `allowEditResponse` | `Boolean` | مشخص می‌کند آیا allowEditResponse برای این استعلام فعال یا مجاز است. |
| `allowWithdrawResponse` | `Boolean` | مشخص می‌کند آیا allowWithdrawResponse برای این استعلام فعال یا مجاز است. |
| `closedAt` | `DateTime?` | زمان بسته‌شدن پرونده یا فرآیند. |
| `createdAt` | `DateTime` | زمان ایجاد رکورد. |
| `updatedAt` | `DateTime` | آخرین زمان ویرایش رکورد. |
| `company` | `Company?` | ارتباط Prisma با جدول Company (شرکت): رکورد مرتبط مرتبط با استعلام؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |
| `buyerUser` | `User?` | ارتباط Prisma با جدول User (کاربر): رکورد مرتبط مرتبط با استعلام؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |
| `items` | `InquiryItem[]` | ارتباط Prisma با جدول InquiryItem (InquiryItem): مجموعه رکوردهای وابسته مرتبط با استعلام؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |
| `responses` | `InquiryResponse[]` | ارتباط Prisma با جدول InquiryResponse (InquiryResponse): مجموعه رکوردهای وابسته مرتبط با استعلام؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |
| `messages` | `InquiryMessage[]` | ارتباط Prisma با جدول InquiryMessage (InquiryMessage): مجموعه رکوردهای وابسته مرتبط با استعلام؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |
| `statusHistory` | `InquiryStatusHistory[]` | ارتباط Prisma با جدول InquiryStatusHistory (InquiryStatusHistory): مجموعه رکوردهای وابسته مرتبط با استعلام؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |

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
| `inquiry` | `Inquiry` | ارتباط Prisma با جدول Inquiry (استعلام): رکورد مرتبط مرتبط با InquiryMessage؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |
| `senderUser` | `User?` | ارتباط Prisma با جدول User (کاربر): رکورد مرتبط مرتبط با InquiryMessage؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |
| `senderCompany` | `Company?` | ارتباط Prisma با جدول Company (شرکت): رکورد مرتبط مرتبط با InquiryMessage؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |
| `recipientUser` | `User?` | ارتباط Prisma با جدول User (کاربر): رکورد مرتبط مرتبط با InquiryMessage؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |
| `recipientCompany` | `Company?` | ارتباط Prisma با جدول Company (شرکت): رکورد مرتبط مرتبط با InquiryMessage؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |

## InquiryStatusHistory — InquiryStatusHistory

تاریخچه تغییر وضعیت استعلام همراه با عامل و دلیل تغییر.

| فیلد | نوع Prisma | توضیح |
|---|---|---|
| `id` | `Int` | شناسه یکتای رکورد و کلید اصلی جدول. |
| `inquiryId` | `Int` | شناسه استعلام مرتبط با این InquiryStatusHistory؛ کلید خارجی به جدول Inquiry است. |
| `previousStatus` | `InquiryStatus` | مقدار previousStatus برای نگهداری اطلاعات مرتبط با InquiryStatusHistory. |
| `newStatus` | `InquiryStatus` | مقدار newStatus برای نگهداری اطلاعات مرتبط با InquiryStatusHistory. |
| `changedByUserId` | `Int?` | شناسه کاربر مرتبط با این InquiryStatusHistory؛ کلید خارجی به جدول User است. |
| `source` | `String` | منبع ایجاد یا ثبت رکورد. |
| `comment` | `String?` | توضیح ثبت‌شده درباره عملیات یا تغییر. |
| `createdAt` | `DateTime` | زمان ایجاد رکورد. |
| `inquiry` | `Inquiry` | ارتباط Prisma با جدول Inquiry (استعلام): رکورد مرتبط مرتبط با InquiryStatusHistory؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |
| `changedBy` | `User?` | ارتباط Prisma با جدول User (کاربر): رکورد مرتبط مرتبط با InquiryStatusHistory؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |

## InquiryItem — InquiryItem

اقلام و محصولات درخواست‌شده در یک استعلام به همراه تعداد و توضیح.

| فیلد | نوع Prisma | توضیح |
|---|---|---|
| `id` | `Int` | شناسه یکتای رکورد و کلید اصلی جدول. |
| `inquiryId` | `Int` | شناسه استعلام مرتبط با این InquiryItem؛ کلید خارجی به جدول Inquiry است. |
| `productId` | `Int` | شناسه محصول مرتبط با این InquiryItem؛ کلید خارجی به جدول Product است. |
| `description` | `String?` | شرح تکمیلی موجودیت. |
| `quantity` | `Int` | تعداد واحدهای کالا یا مقدار موردنظر. |
| `attachment` | `String?` | مقدار متنی attachment برای توصیف یا شناسایی InquiryItem. |
| `createdAt` | `DateTime` | زمان ایجاد رکورد. |
| `inquiry` | `Inquiry` | ارتباط Prisma با جدول Inquiry (استعلام): رکورد مرتبط مرتبط با InquiryItem؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |
| `product` | `Product` | ارتباط Prisma با جدول Product (محصول): رکورد مرتبط مرتبط با InquiryItem؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |
| `responseItems` | `InquiryResponseItem[]` | ارتباط Prisma با جدول InquiryResponseItem (InquiryResponseItem): مجموعه رکوردهای وابسته مرتبط با InquiryItem؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |

## InquiryResponse — InquiryResponse

پاسخ یا پیشنهاد یک شرکت تأمین‌کننده به یک استعلام.

| فیلد | نوع Prisma | توضیح |
|---|---|---|
| `id` | `Int` | شناسه یکتای رکورد و کلید اصلی جدول. |
| `inquiryId` | `Int` | شناسه استعلام مرتبط با این InquiryResponse؛ کلید خارجی به جدول Inquiry است. |
| `companyId` | `Int` | شناسه شرکت مرتبط با این InquiryResponse؛ کلید خارجی به جدول Company است. |
| `status` | `InquiryResponseStatus` | وضعیت چرخه عمر رکورد؛ مقادیر مجاز در Enum مربوط تعریف شده‌اند. |
| `withdrawnAt` | `DateTime?` | زمان withdrawn این InquiryResponse را ثبت می‌کند. |
| `createdAt` | `DateTime` | زمان ایجاد رکورد. |
| `updatedAt` | `DateTime` | آخرین زمان ویرایش رکورد. |
| `inquiry` | `Inquiry` | ارتباط Prisma با جدول Inquiry (استعلام): رکورد مرتبط مرتبط با InquiryResponse؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |
| `company` | `Company` | ارتباط Prisma با جدول Company (شرکت): رکورد مرتبط مرتبط با InquiryResponse؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |
| `items` | `InquiryResponseItem[]` | ارتباط Prisma با جدول InquiryResponseItem (InquiryResponseItem): مجموعه رکوردهای وابسته مرتبط با InquiryResponse؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |
| `attachments` | `InquiryResponseAttachment[]` | ارتباط Prisma با جدول InquiryResponseAttachment (InquiryResponseAttachment): مجموعه رکوردهای وابسته مرتبط با InquiryResponse؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |

## InquiryResponseAttachment — InquiryResponseAttachment

فایل‌های پیوست یک پاسخ استعلام به همراه مشخصات فایل.

| فیلد | نوع Prisma | توضیح |
|---|---|---|
| `id` | `Int` | شناسه یکتای رکورد و کلید اصلی جدول. |
| `responseId` | `Int` | شناسه InquiryResponse مرتبط با این InquiryResponseAttachment؛ کلید خارجی به جدول InquiryResponse است. |
| `url` | `String` | نشانی فایل یا منبع مرتبط. |
| `filename` | `String` | نام فایل. |
| `mimetype` | `String?` | مقدار متنی mimetype برای توصیف یا شناسایی InquiryResponseAttachment. |
| `size` | `Int?` | اندازه فایل بر حسب بایت. |
| `createdAt` | `DateTime` | زمان ایجاد رکورد. |
| `response` | `InquiryResponse` | ارتباط Prisma با جدول InquiryResponse (InquiryResponse): رکورد مرتبط مرتبط با InquiryResponseAttachment؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |

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
| `deliveryTime` | `String?` | مقدار متنی deliveryTime برای توصیف یا شناسایی InquiryResponseItem. |
| `description` | `String?` | شرح تکمیلی موجودیت. |
| `response` | `InquiryResponse` | ارتباط Prisma با جدول InquiryResponse (InquiryResponse): رکورد مرتبط مرتبط با InquiryResponseItem؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |
| `inquiryItem` | `InquiryItem` | ارتباط Prisma با جدول InquiryItem (InquiryItem): رکورد مرتبط مرتبط با InquiryResponseItem؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |

## CompanyInquiryLimit — CompanyInquiryLimit

محدودیت‌های کلی تعداد استعلام باز و پاسخ فعال هر شرکت در ساختار قدیمی.

| فیلد | نوع Prisma | توضیح |
|---|---|---|
| `id` | `Int` | شناسه یکتای رکورد و کلید اصلی جدول. |
| `companyId` | `Int` | شناسه شرکت مرتبط با این CompanyInquiryLimit؛ کلید خارجی به جدول Company است. |
| `maxOpenInquiries` | `Int` | حد یا تعداد مجاز/ثبت‌شده برای CompanyInquiryLimit. |
| `maxActiveResponses` | `Int` | حد یا تعداد مجاز/ثبت‌شده برای CompanyInquiryLimit. |
| `createdAt` | `DateTime` | زمان ایجاد رکورد. |
| `updatedAt` | `DateTime` | آخرین زمان ویرایش رکورد. |
| `company` | `Company` | ارتباط Prisma با جدول Company (شرکت): رکورد مرتبط مرتبط با CompanyInquiryLimit؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |

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
| `company` | `Company` | ارتباط Prisma با جدول Company (شرکت): رکورد مرتبط مرتبط با CompanyLimit؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |

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
| `inquiriesPerPeriod` | `Int` | مقدار عددی inquiriesPerPeriod برای InquiryPlan. |
| `responsesPerPeriod` | `Int` | مقدار عددی responsesPerPeriod برای InquiryPlan. |
| `internalMessagesPerPeriod` | `Int` | مقدار عددی internalMessagesPerPeriod برای InquiryPlan. |
| `smsPerPeriod` | `Int` | مقدار عددی smsPerPeriod برای InquiryPlan. |
| `isActive` | `Boolean` | فعال یا غیرفعال بودن رکورد. |
| `createdAt` | `DateTime` | زمان ایجاد رکورد. |
| `updatedAt` | `DateTime` | آخرین زمان ویرایش رکورد. |
| `subscriptions` | `InquirySubscription[]` | ارتباط Prisma با جدول InquirySubscription (InquirySubscription): مجموعه رکوردهای وابسته مرتبط با InquiryPlan؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |

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
| `activatedBy` | `Int?` | مقدار عددی activatedBy برای InquirySubscription. |
| `paymentReference` | `String?` | مقدار متنی paymentReference برای توصیف یا شناسایی InquirySubscription. |
| `paymentProvider` | `String?` | مقدار متنی paymentProvider برای توصیف یا شناسایی InquirySubscription. |
| `paymentAuthority` | `String?` | مقدار متنی paymentAuthority برای توصیف یا شناسایی InquirySubscription. |
| `paymentRefId` | `String?` | شناسه رکورد مرتبط برای اتصال این InquirySubscription به موجودیت مرجع. |
| `paymentAmount` | `Int?` | مبلغ paymentAmount برای این InquirySubscription؛ واحد پول در فیلد currency مشخص می‌شود. |
| `paymentVerifiedAt` | `DateTime?` | زمان paymentVerified این InquirySubscription را ثبت می‌کند. |
| `notes` | `String?` | یادداشت‌های تکمیلی درباره رکورد. |
| `createdAt` | `DateTime` | زمان ایجاد رکورد. |
| `updatedAt` | `DateTime` | آخرین زمان ویرایش رکورد. |
| `plan` | `InquiryPlan` | ارتباط Prisma با جدول InquiryPlan (InquiryPlan): رکورد مرتبط مرتبط با InquirySubscription؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |
| `company` | `Company?` | ارتباط Prisma با جدول Company (شرکت): رکورد مرتبط مرتبط با InquirySubscription؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |
| `user` | `User?` | ارتباط Prisma با جدول User (کاربر): رکورد مرتبط مرتبط با InquirySubscription؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |
| `usage` | `InquiryUsageEvent[]` | ارتباط Prisma با جدول InquiryUsageEvent (InquiryUsageEvent): مجموعه رکوردهای وابسته مرتبط با InquirySubscription؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |

## InquiryUsageEvent — InquiryUsageEvent

رویداد مصرف سهمیه اشتراک و مرجع عملیاتی آن برای محاسبه مصرف.

| فیلد | نوع Prisma | توضیح |
|---|---|---|
| `id` | `BigInt` | شناسه یکتای رکورد و کلید اصلی جدول. |
| `subscriptionId` | `Int` | شناسه InquirySubscription مرتبط با این InquiryUsageEvent؛ کلید خارجی به جدول InquirySubscription است. |
| `usageType` | `InquiryUsageType` | مقدار usageType برای نگهداری اطلاعات مرتبط با InquiryUsageEvent. |
| `quantity` | `Int` | تعداد واحدهای کالا یا مقدار موردنظر. |
| `referenceType` | `String?` | مقدار متنی referenceType برای توصیف یا شناسایی InquiryUsageEvent. |
| `referenceId` | `String?` | شناسه رکورد مرتبط برای اتصال این InquiryUsageEvent به موجودیت مرجع. |
| `idempotencyKey` | `String?` | کلید یکتای جلوگیری از اجرای تکراری درخواست/عملیات. |
| `metadata` | `Json?` | داده‌های تکمیلی ساختاریافته و وابسته به دامنه در قالب JSON. |
| `createdAt` | `DateTime` | زمان ایجاد رکورد. |
| `subscription` | `InquirySubscription` | ارتباط Prisma با جدول InquirySubscription (InquirySubscription): رکورد مرتبط مرتبط با InquiryUsageEvent؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |

## SystemSetting — SystemSetting

تنظیمات سراسری سامانه به شکل کلید و مقدار.

| فیلد | نوع Prisma | توضیح |
|---|---|---|
| `id` | `Int` | شناسه یکتای رکورد و کلید اصلی جدول. |
| `key` | `String` | کلید ماشینی تنظیم یا گزینه. |
| `value` | `String` | مقدار تنظیم یا محدودیت؛ مفهوم آن با key مشخص می‌شود. |
| `updatedByUserId` | `Int?` | شناسه رکورد مرتبط برای اتصال این SystemSetting به موجودیت مرجع. |
| `createdAt` | `DateTime` | زمان ایجاد رکورد. |
| `updatedAt` | `DateTime` | آخرین زمان ویرایش رکورد. |

## Notification — اعلان

اعلان اصلی متعلق به کاربر، شامل عنوان، متن، نوع و وضعیت خوانده‌شدن.

| فیلد | نوع Prisma | توضیح |
|---|---|---|
| `id` | `Int` | شناسه یکتای رکورد و کلید اصلی جدول. |
| `userId` | `Int` | شناسه کاربر مرتبط با این اعلان؛ کلید خارجی به جدول User است. |
| `type` | `String?` | مقدار متنی type برای توصیف یا شناسایی اعلان. |
| `data` | `Json?` | داده تکمیلی اعلان/رویداد در قالب JSON. |
| `title` | `String` | عنوان اصلی قابل نمایش. |
| `message` | `String` | مقدار متنی message برای توصیف یا شناسایی اعلان. |
| `isRead` | `Boolean` | خوانده‌شدن اعلان توسط کاربر. |
| `createdAt` | `DateTime` | زمان ایجاد رکورد. |
| `user` | `User` | ارتباط Prisma با جدول User (کاربر): رکورد مرتبط مرتبط با اعلان؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |
| `folderMemberships` | `NotificationFolderMembership[]` | ارتباط Prisma با جدول NotificationFolderMembership (NotificationFolderMembership): مجموعه رکوردهای وابسته مرتبط با اعلان؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |

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
| `sortOrder` | `Int` | ترتیب نمایش رکورد. |
| `createdAt` | `DateTime` | زمان ایجاد رکورد. |
| `updatedAt` | `DateTime` | آخرین زمان ویرایش رکورد. |
| `memberships` | `NotificationFolderMembership[]` | ارتباط Prisma با جدول NotificationFolderMembership (NotificationFolderMembership): مجموعه رکوردهای وابسته مرتبط با NotificationFolder؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |

## NotificationFolderMembership — NotificationFolderMembership

ارتباط اعلان با پوشه؛ امکان عضویت یک اعلان در پوشه‌ها را ثبت می‌کند.

| فیلد | نوع Prisma | توضیح |
|---|---|---|
| `id` | `Int` | شناسه یکتای رکورد و کلید اصلی جدول. |
| `notificationId` | `Int` | شناسه اعلان مرتبط با این NotificationFolderMembership؛ کلید خارجی به جدول Notification است. |
| `folderId` | `Int` | شناسه NotificationFolder مرتبط با این NotificationFolderMembership؛ کلید خارجی به جدول NotificationFolder است. |
| `createdAt` | `DateTime` | زمان ایجاد رکورد. |
| `notification` | `Notification` | ارتباط Prisma با جدول Notification (اعلان): رکورد مرتبط مرتبط با NotificationFolderMembership؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |
| `folder` | `NotificationFolder` | ارتباط Prisma با جدول NotificationFolder (NotificationFolder): رکورد مرتبط مرتبط با NotificationFolderMembership؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |

## NotificationPreference — NotificationPreference

ترجیحات هر کاربر برای دریافت نوع مشخصی از اعلان از طریق یک کانال.

| فیلد | نوع Prisma | توضیح |
|---|---|---|
| `id` | `Int` | شناسه یکتای رکورد و کلید اصلی جدول. |
| `userId` | `Int` | شناسه کاربر مرتبط با این NotificationPreference؛ کلید خارجی به جدول User است. |
| `eventType` | `String` | نوع رویداد ثبت‌شده. |
| `channel` | `NotificationChannel` | کانال ارسال یا دریافت. |
| `enabled` | `Boolean` | پرچم منطقی enabled برای کنترل رفتار NotificationPreference. |
| `createdAt` | `DateTime` | زمان ایجاد رکورد. |
| `updatedAt` | `DateTime` | آخرین زمان ویرایش رکورد. |
| `user` | `User` | ارتباط Prisma با جدول User (کاربر): رکورد مرتبط مرتبط با NotificationPreference؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |

## NotificationDelivery — NotificationDelivery

تلاش‌ها و وضعیت تحویل اعلان از طریق ایمیل، پیامک یا کانال دیگر.

| فیلد | نوع Prisma | توضیح |
|---|---|---|
| `id` | `Int` | شناسه یکتای رکورد و کلید اصلی جدول. |
| `userId` | `Int` | شناسه کاربر مرتبط با این NotificationDelivery؛ کلید خارجی به جدول User است. |
| `notificationId` | `Int?` | شناسه رکورد مرتبط برای اتصال این NotificationDelivery به موجودیت مرجع. |
| `eventType` | `String` | نوع رویداد ثبت‌شده. |
| `channel` | `NotificationChannel` | کانال ارسال یا دریافت. |
| `status` | `NotificationDeliveryStatus` | وضعیت چرخه عمر رکورد؛ مقادیر مجاز در Enum مربوط تعریف شده‌اند. |
| `recipient` | `String?` | مقدار متنی recipient برای توصیف یا شناسایی NotificationDelivery. |
| `subject` | `String?` | مقدار متنی subject برای توصیف یا شناسایی NotificationDelivery. |
| `body` | `String?` | متن کامل پیام، یادداشت یا محتوای رکورد. |
| `provider` | `String?` | نام درگاه یا سرویس بیرونی انجام‌دهنده عملیات. |
| `attempts` | `Int` | تعداد تلاش‌های ارسال یا پردازش. |
| `maxAttempts` | `Int` | حداکثر تعداد تلاش مجاز. |
| `nextAttemptAt` | `DateTime` | زمان nextAttempt این NotificationDelivery را ثبت می‌کند. |
| `lastError` | `String?` | آخرین خطای رخ‌داده هنگام پردازش/ارسال. |
| `sentAt` | `DateTime?` | زمان ارسال موفق پیام. |
| `dedupeKey` | `String?` | کلید تشخیص و جلوگیری از ثبت/پردازش تکراری رویداد. |
| `createdAt` | `DateTime` | زمان ایجاد رکورد. |
| `updatedAt` | `DateTime` | آخرین زمان ویرایش رکورد. |
| `user` | `User` | ارتباط Prisma با جدول User (کاربر): رکورد مرتبط مرتبط با NotificationDelivery؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |

## Banner — Banner

بنرهای وب‌سایت همراه با محتوا، مقصد کلیک، جایگاه و بازه نمایش.

| فیلد | نوع Prisma | توضیح |
|---|---|---|
| `id` | `Int` | شناسه یکتای رکورد و کلید اصلی جدول. |
| `title` | `String` | عنوان اصلی قابل نمایش. |
| `description` | `String?` | شرح تکمیلی موجودیت. |
| `imageUrl` | `String` | نشانی تصویر. |
| `targetUrl` | `String?` | مقدار متنی targetUrl برای توصیف یا شناسایی Banner. |
| `ctaLabel` | `String?` | مقدار متنی ctaLabel برای توصیف یا شناسایی Banner. |
| `placement` | `String` | مقدار متنی placement برای توصیف یا شناسایی Banner. |
| `sortOrder` | `Int` | ترتیب نمایش رکورد. |
| `status` | `BannerStatus` | وضعیت چرخه عمر رکورد؛ مقادیر مجاز در Enum مربوط تعریف شده‌اند. |
| `isActive` | `Boolean` | فعال یا غیرفعال بودن رکورد. |
| `startsAt` | `DateTime?` | زمان شروع اعتبار یا فعال‌بودن. |
| `endsAt` | `DateTime?` | زمان پایان اعتبار یا فعال‌بودن. |
| `createdAt` | `DateTime` | زمان ایجاد رکورد. |
| `updatedAt` | `DateTime` | آخرین زمان ویرایش رکورد. |
| `deletedAt` | `DateTime?` | زمان حذف نرم؛ مقدار NULL یعنی رکورد حذف نرم نشده است. |

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
| `consumedAt` | `DateTime?` | زمان consumed این AuthChallenge را ثبت می‌کند. |
| `attemptCount` | `Int` | تعداد دفعات تلاش انجام‌شده. |
| `maxAttempts` | `Int` | حداکثر تعداد تلاش مجاز. |
| `invalidatedAt` | `DateTime?` | زمان invalidated این AuthChallenge را ثبت می‌کند. |
| `createdAt` | `DateTime` | زمان ایجاد رکورد. |
| `user` | `User` | ارتباط Prisma با جدول User (کاربر): رکورد مرتبط مرتبط با AuthChallenge؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |

## AuditLog — AuditLog

رخدادهای ممیزی عملیات؛ عامل، شرکت، موجودیت هدف، نتیجه و مشخصات درخواست را به‌صورت ثبت غیرقابل‌ویرایش نگه می‌دارد.

| فیلد | نوع Prisma | توضیح |
|---|---|---|
| `id` | `BigInt` | شناسه یکتای رکورد و کلید اصلی جدول. |
| `actorUserId` | `Int?` | شناسه کاربر مرتبط با این AuditLog؛ کلید خارجی به جدول User است. |
| `actorAccessType` | `String?` | مقدار متنی actorAccessType برای توصیف یا شناسایی AuditLog. |
| `companyId` | `Int?` | شناسه شرکت مرتبط با این AuditLog؛ کلید خارجی به جدول Company است. |
| `action` | `String` | نوع اقدام انجام‌شده. |
| `entityType` | `String` | مقدار متنی entityType برای توصیف یا شناسایی AuditLog. |
| `entityId` | `String` | شناسه رکورد مرتبط برای اتصال این AuditLog به موجودیت مرجع. |
| `requestId` | `String?` | شناسه هم‌بستگی درخواست برای ردگیری در لاگ‌ها. |
| `source` | `String?` | منبع ایجاد یا ثبت رکورد. |
| `outcome` | `String` | نتیجه فعالیت یا عملیات. |
| `ipAddress` | `String?` | نشانی IP مبدأ درخواست برای ممیزی/امنیت. |
| `userAgent` | `String?` | مشخصات مرورگر یا کلاینت درخواست‌دهنده. |
| `metadata` | `Json?` | داده‌های تکمیلی ساختاریافته و وابسته به دامنه در قالب JSON. |
| `occurredAt` | `DateTime` | زمان وقوع رویداد در منبع. |
| `actor` | `User?` | ارتباط Prisma با جدول User (کاربر): رکورد مرتبط مرتبط با AuditLog؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |
| `company` | `Company?` | ارتباط Prisma با جدول Company (شرکت): رکورد مرتبط مرتبط با AuditLog؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |

## SupportQueue — SupportQueue

صف‌های کاری تیم پشتیبانی برای دسته‌بندی و ارجاع تیکت‌ها.

| فیلد | نوع Prisma | توضیح |
|---|---|---|
| `id` | `Int` | شناسه یکتای رکورد و کلید اصلی جدول. |
| `key` | `String` | کلید ماشینی تنظیم یا گزینه. |
| `name` | `String` | نام قابل نمایش موجودیت. |
| `description` | `String?` | شرح تکمیلی موجودیت. |
| `isActive` | `Boolean` | فعال یا غیرفعال بودن رکورد. |
| `sortOrder` | `Int` | ترتیب نمایش رکورد. |
| `createdAt` | `DateTime` | زمان ایجاد رکورد. |
| `updatedAt` | `DateTime` | آخرین زمان ویرایش رکورد. |
| `tickets` | `SupportTicket[]` | ارتباط Prisma با جدول SupportTicket (تیکت پشتیبانی): مجموعه رکوردهای وابسته مرتبط با SupportQueue؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |
| `assignments` | `SupportAssignment[]` | ارتباط Prisma با جدول SupportAssignment (SupportAssignment): مجموعه رکوردهای وابسته مرتبط با SupportQueue؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |

## SupportCategory — SupportCategory

دسته‌بندی موضوعی تیکت‌های پشتیبانی و مبنای اتصال سیاست SLA.

| فیلد | نوع Prisma | توضیح |
|---|---|---|
| `id` | `Int` | شناسه یکتای رکورد و کلید اصلی جدول. |
| `key` | `String` | کلید ماشینی تنظیم یا گزینه. |
| `name` | `String` | نام قابل نمایش موجودیت. |
| `description` | `String?` | شرح تکمیلی موجودیت. |
| `isActive` | `Boolean` | فعال یا غیرفعال بودن رکورد. |
| `sortOrder` | `Int` | ترتیب نمایش رکورد. |
| `createdAt` | `DateTime` | زمان ایجاد رکورد. |
| `updatedAt` | `DateTime` | آخرین زمان ویرایش رکورد. |
| `tickets` | `SupportTicket[]` | ارتباط Prisma با جدول SupportTicket (تیکت پشتیبانی): مجموعه رکوردهای وابسته مرتبط با SupportCategory؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |
| `slaPolicies` | `SupportSlaPolicy[]` | ارتباط Prisma با جدول SupportSlaPolicy (SupportSlaPolicy): مجموعه رکوردهای وابسته مرتبط با SupportCategory؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |

## SupportSlaPolicy — SupportSlaPolicy

زمان هدف پاسخ اولیه و حل تیکت بر اساس دسته و اولویت.

| فیلد | نوع Prisma | توضیح |
|---|---|---|
| `id` | `Int` | شناسه یکتای رکورد و کلید اصلی جدول. |
| `categoryId` | `Int?` | شناسه SupportCategory مرتبط با این SupportSlaPolicy؛ کلید خارجی به جدول SupportCategory است. |
| `priority` | `SupportPriority` | اولویت رسیدگی یا پردازش. |
| `firstResponseMinutes` | `Int` | مقدار عددی firstResponseMinutes برای SupportSlaPolicy. |
| `resolutionMinutes` | `Int` | مقدار عددی resolutionMinutes برای SupportSlaPolicy. |
| `workingCalendar` | `Json?` | تعریف تقویم/ساعات کاری مورد استفاده برای محاسبه SLA. |
| `isActive` | `Boolean` | فعال یا غیرفعال بودن رکورد. |
| `createdAt` | `DateTime` | زمان ایجاد رکورد. |
| `updatedAt` | `DateTime` | آخرین زمان ویرایش رکورد. |
| `category` | `SupportCategory?` | ارتباط Prisma با جدول SupportCategory (SupportCategory): رکورد مرتبط مرتبط با SupportSlaPolicy؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |

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
| `createdFrom` | `SupportCreatedFrom` | مقدار createdFrom برای نگهداری اطلاعات مرتبط با تیکت پشتیبانی. |
| `status` | `SupportTicketStatus` | وضعیت چرخه عمر رکورد؛ مقادیر مجاز در Enum مربوط تعریف شده‌اند. |
| `priority` | `SupportPriority` | اولویت رسیدگی یا پردازش. |
| `subject` | `String` | مقدار متنی subject برای توصیف یا شناسایی تیکت پشتیبانی. |
| `firstResponseDueAt` | `DateTime?` | مهلت هدف اولین پاسخ طبق SLA. |
| `resolveDueAt` | `DateTime?` | مهلت هدف حل تیکت طبق SLA. |
| `firstRespondedAt` | `DateTime?` | زمان اولین پاسخ کارشناسی به تیکت. |
| `resolvedAt` | `DateTime?` | زمان resolved این تیکت پشتیبانی را ثبت می‌کند. |
| `closedAt` | `DateTime?` | زمان بسته‌شدن پرونده یا فرآیند. |
| `lastActivityAt` | `DateTime` | زمان lastActivity این تیکت پشتیبانی را ثبت می‌کند. |
| `createdAt` | `DateTime` | زمان ایجاد رکورد. |
| `updatedAt` | `DateTime` | آخرین زمان ویرایش رکورد. |
| `requester` | `User` | ارتباط Prisma با جدول User (کاربر): رکورد مرتبط مرتبط با تیکت پشتیبانی؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |
| `requesterCompany` | `Company?` | ارتباط Prisma با جدول Company (شرکت): رکورد مرتبط مرتبط با تیکت پشتیبانی؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |
| `category` | `SupportCategory?` | ارتباط Prisma با جدول SupportCategory (SupportCategory): رکورد مرتبط مرتبط با تیکت پشتیبانی؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |
| `assignedQueue` | `SupportQueue?` | ارتباط Prisma با جدول SupportQueue (SupportQueue): رکورد مرتبط مرتبط با تیکت پشتیبانی؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |
| `assignedUser` | `User?` | ارتباط Prisma با جدول User (کاربر): رکورد مرتبط مرتبط با تیکت پشتیبانی؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |
| `messages` | `SupportMessage[]` | ارتباط Prisma با جدول SupportMessage (SupportMessage): مجموعه رکوردهای وابسته مرتبط با تیکت پشتیبانی؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |
| `assignments` | `SupportAssignment[]` | ارتباط Prisma با جدول SupportAssignment (SupportAssignment): مجموعه رکوردهای وابسته مرتبط با تیکت پشتیبانی؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |
| `statusHistory` | `SupportStatusHistory[]` | ارتباط Prisma با جدول SupportStatusHistory (SupportStatusHistory): مجموعه رکوردهای وابسته مرتبط با تیکت پشتیبانی؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |
| `events` | `SupportEvent[]` | ارتباط Prisma با جدول SupportEvent (SupportEvent): مجموعه رکوردهای وابسته مرتبط با تیکت پشتیبانی؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |

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
| `ticket` | `SupportTicket` | ارتباط Prisma با جدول SupportTicket (تیکت پشتیبانی): رکورد مرتبط مرتبط با SupportMessage؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |
| `sender` | `User` | ارتباط Prisma با جدول User (کاربر): رکورد مرتبط مرتبط با SupportMessage؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |
| `attachments` | `SupportAttachment[]` | ارتباط Prisma با جدول SupportAttachment (SupportAttachment): مجموعه رکوردهای وابسته مرتبط با SupportMessage؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |

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
| `message` | `SupportMessage` | ارتباط Prisma با جدول SupportMessage (SupportMessage): رکورد مرتبط مرتبط با SupportAttachment؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |
| `uploadedBy` | `User` | ارتباط Prisma با جدول User (کاربر): رکورد مرتبط مرتبط با SupportAttachment؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |

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
| `assignedAt` | `DateTime` | زمان assigned این SupportAssignment را ثبت می‌کند. |
| `endedAt` | `DateTime?` | زمان ended این SupportAssignment را ثبت می‌کند. |
| `ticket` | `SupportTicket` | ارتباط Prisma با جدول SupportTicket (تیکت پشتیبانی): رکورد مرتبط مرتبط با SupportAssignment؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |
| `queue` | `SupportQueue?` | ارتباط Prisma با جدول SupportQueue (SupportQueue): رکورد مرتبط مرتبط با SupportAssignment؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |
| `assignee` | `User?` | ارتباط Prisma با جدول User (کاربر): رکورد مرتبط مرتبط با SupportAssignment؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |
| `assignedBy` | `User` | ارتباط Prisma با جدول User (کاربر): رکورد مرتبط مرتبط با SupportAssignment؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |

## SupportStatusHistory — SupportStatusHistory

تاریخچه تغییر وضعیت تیکت همراه با عامل و دلیل تغییر.

| فیلد | نوع Prisma | توضیح |
|---|---|---|
| `id` | `Int` | شناسه یکتای رکورد و کلید اصلی جدول. |
| `ticketId` | `Int` | شناسه تیکت پشتیبانی مرتبط با این SupportStatusHistory؛ کلید خارجی به جدول SupportTicket است. |
| `previous` | `SupportTicketStatus?` | مقدار previous برای نگهداری اطلاعات مرتبط با SupportStatusHistory. |
| `next` | `SupportTicketStatus` | مقدار next برای نگهداری اطلاعات مرتبط با SupportStatusHistory. |
| `actorUserId` | `Int?` | شناسه کاربر مرتبط با این SupportStatusHistory؛ کلید خارجی به جدول User است. |
| `reason` | `String?` | علت درخواست، تغییر وضعیت یا تصمیم. |
| `createdAt` | `DateTime` | زمان ایجاد رکورد. |
| `ticket` | `SupportTicket` | ارتباط Prisma با جدول SupportTicket (تیکت پشتیبانی): رکورد مرتبط مرتبط با SupportStatusHistory؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |
| `actor` | `User?` | ارتباط Prisma با جدول User (کاربر): رکورد مرتبط مرتبط با SupportStatusHistory؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |

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
| `ticket` | `SupportTicket?` | ارتباط Prisma با جدول SupportTicket (تیکت پشتیبانی): رکورد مرتبط مرتبط با SupportEvent؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |
| `actor` | `User?` | ارتباط Prisma با جدول User (کاربر): رکورد مرتبط مرتبط با SupportEvent؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |

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
| `type` | `ArticleType` | مقدار type برای نگهداری اطلاعات مرتبط با مقاله. |
| `status` | `ArticleStatus` | وضعیت چرخه عمر رکورد؛ مقادیر مجاز در Enum مربوط تعریف شده‌اند. |
| `coverImageKey` | `String?` | مقدار متنی coverImageKey برای توصیف یا شناسایی مقاله. |
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
| `author` | `User` | ارتباط Prisma با جدول User (کاربر): رکورد مرتبط مرتبط با مقاله؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |
| `publishedBy` | `User?` | ارتباط Prisma با جدول User (کاربر): رکورد مرتبط مرتبط با مقاله؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |
| `categories` | `ArticleCategoryAssignment[]` | ارتباط Prisma با جدول ArticleCategoryAssignment (ArticleCategoryAssignment): مجموعه رکوردهای وابسته مرتبط با مقاله؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |
| `tags` | `ArticleTagAssignment[]` | ارتباط Prisma با جدول ArticleTagAssignment (ArticleTagAssignment): مجموعه رکوردهای وابسته مرتبط با مقاله؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |
| `revisions` | `ArticleRevision[]` | ارتباط Prisma با جدول ArticleRevision (ArticleRevision): مجموعه رکوردهای وابسته مرتبط با مقاله؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |
| `media` | `ArticleMedia[]` | ارتباط Prisma با جدول ArticleMedia (ArticleMedia): مجموعه رکوردهای وابسته مرتبط با مقاله؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |

## ArticleCategory — ArticleCategory

دسته‌بندی مطالب مجله برای گروه‌بندی و فیلتر محتوا.

| فیلد | نوع Prisma | توضیح |
|---|---|---|
| `id` | `Int` | شناسه یکتای رکورد و کلید اصلی جدول. |
| `slug` | `String` | شناسه متنی خوانا و یکتای مناسب URL. |
| `name` | `String` | نام قابل نمایش موجودیت. |
| `sortOrder` | `Int` | ترتیب نمایش رکورد. |
| `isActive` | `Boolean` | فعال یا غیرفعال بودن رکورد. |
| `createdAt` | `DateTime` | زمان ایجاد رکورد. |
| `updatedAt` | `DateTime` | آخرین زمان ویرایش رکورد. |
| `articles` | `ArticleCategoryAssignment[]` | ارتباط Prisma با جدول ArticleCategoryAssignment (ArticleCategoryAssignment): مجموعه رکوردهای وابسته مرتبط با ArticleCategory؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |

## ArticleTag — ArticleTag

برچسب‌های موضوعی مطالب برای جست‌وجو و ارتباط محتوایی.

| فیلد | نوع Prisma | توضیح |
|---|---|---|
| `id` | `Int` | شناسه یکتای رکورد و کلید اصلی جدول. |
| `slug` | `String` | شناسه متنی خوانا و یکتای مناسب URL. |
| `name` | `String` | نام قابل نمایش موجودیت. |
| `createdAt` | `DateTime` | زمان ایجاد رکورد. |
| `articles` | `ArticleTagAssignment[]` | ارتباط Prisma با جدول ArticleTagAssignment (ArticleTagAssignment): مجموعه رکوردهای وابسته مرتبط با ArticleTag؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |

## ArticleCategoryAssignment — ArticleCategoryAssignment

رابط مقاله و دسته‌بندی به همراه ترتیب نمایش مقاله در دسته.

| فیلد | نوع Prisma | توضیح |
|---|---|---|
| `articleId` | `Int` | شناسه مقاله مرتبط با این ArticleCategoryAssignment؛ کلید خارجی به جدول Article است. |
| `categoryId` | `Int` | شناسه ArticleCategory مرتبط با این ArticleCategoryAssignment؛ کلید خارجی به جدول ArticleCategory است. |
| `sortOrder` | `Int` | ترتیب نمایش رکورد. |
| `article` | `Article` | ارتباط Prisma با جدول Article (مقاله): رکورد مرتبط مرتبط با ArticleCategoryAssignment؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |
| `category` | `ArticleCategory` | ارتباط Prisma با جدول ArticleCategory (ArticleCategory): رکورد مرتبط مرتبط با ArticleCategoryAssignment؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |

## ArticleTagAssignment — ArticleTagAssignment

رابط چندبه‌چند مقاله و برچسب.

| فیلد | نوع Prisma | توضیح |
|---|---|---|
| `articleId` | `Int` | شناسه مقاله مرتبط با این ArticleTagAssignment؛ کلید خارجی به جدول Article است. |
| `tagId` | `Int` | شناسه ArticleTag مرتبط با این ArticleTagAssignment؛ کلید خارجی به جدول ArticleTag است. |
| `article` | `Article` | ارتباط Prisma با جدول Article (مقاله): رکورد مرتبط مرتبط با ArticleTagAssignment؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |
| `tag` | `ArticleTag` | ارتباط Prisma با جدول ArticleTag (ArticleTag): رکورد مرتبط مرتبط با ArticleTagAssignment؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |

## ArticleRevision — ArticleRevision

نسخه‌های محتوای مقاله به‌صورت snapshot برای نگهداری سابقه ویرایش.

| فیلد | نوع Prisma | توضیح |
|---|---|---|
| `id` | `BigInt` | شناسه یکتای رکورد و کلید اصلی جدول. |
| `articleId` | `Int` | شناسه مقاله مرتبط با این ArticleRevision؛ کلید خارجی به جدول Article است. |
| `editorUserId` | `Int` | شناسه کاربر مرتبط با این ArticleRevision؛ کلید خارجی به جدول User است. |
| `revisionNo` | `Int` | مقدار عددی revisionNo برای ArticleRevision. |
| `snapshot` | `Json` | تصویر ثابت داده در زمان ثبت برای حفظ سابقه. |
| `changeNote` | `String?` | مقدار متنی changeNote برای توصیف یا شناسایی ArticleRevision. |
| `createdAt` | `DateTime` | زمان ایجاد رکورد. |
| `article` | `Article` | ارتباط Prisma با جدول Article (مقاله): رکورد مرتبط مرتبط با ArticleRevision؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |
| `editor` | `User` | ارتباط Prisma با جدول User (کاربر): رکورد مرتبط مرتبط با ArticleRevision؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |

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
| `article` | `Article` | ارتباط Prisma با جدول Article (مقاله): رکورد مرتبط مرتبط با ArticleMedia؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |
| `uploadedBy` | `User` | ارتباط Prisma با جدول User (کاربر): رکورد مرتبط مرتبط با ArticleMedia؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |

## CRMAccount — CRMAccount

پرونده حساب مشتری/سازمان در CRM و پیوند آن به شرکت یا کاربر موجود.

| فیلد | نوع Prisma | توضیح |
|---|---|---|
| `id` | `Int` | شناسه یکتای رکورد و کلید اصلی جدول. |
| `accountType` | `CRMAccountType` | ماهیت یا نوع حساب. |
| `displayName` | `String` | مقدار متنی displayName برای توصیف یا شناسایی CRMAccount. |
| `companyId` | `Int?` | شناسه شرکت مرتبط با این CRMAccount؛ کلید خارجی به جدول Company است. |
| `userId` | `Int?` | شناسه کاربر مرتبط با این CRMAccount؛ کلید خارجی به جدول User است. |
| `ownerUserId` | `Int` | شناسه کاربر مرتبط با این CRMAccount؛ کلید خارجی به جدول User است. |
| `lifecycle` | `String` | مقدار متنی lifecycle برای توصیف یا شناسایی CRMAccount. |
| `source` | `String?` | منبع ایجاد یا ثبت رکورد. |
| `notes` | `String?` | یادداشت‌های تکمیلی درباره رکورد. |
| `createdAt` | `DateTime` | زمان ایجاد رکورد. |
| `updatedAt` | `DateTime` | آخرین زمان ویرایش رکورد. |
| `company` | `Company?` | ارتباط Prisma با جدول Company (شرکت): رکورد مرتبط مرتبط با CRMAccount؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |
| `user` | `User?` | ارتباط Prisma با جدول User (کاربر): رکورد مرتبط مرتبط با CRMAccount؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |
| `owner` | `User` | ارتباط Prisma با جدول User (کاربر): رکورد مرتبط مرتبط با CRMAccount؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |
| `contacts` | `CRMContact[]` | ارتباط Prisma با جدول CRMContact (CRMContact): مجموعه رکوردهای وابسته مرتبط با CRMAccount؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |
| `leads` | `Lead[]` | ارتباط Prisma با جدول Lead (سرنخ فروش): مجموعه رکوردهای وابسته مرتبط با CRMAccount؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |
| `opportunities` | `Opportunity[]` | ارتباط Prisma با جدول Opportunity (فرصت فروش): مجموعه رکوردهای وابسته مرتبط با CRMAccount؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |
| `activities` | `CRMActivity[]` | ارتباط Prisma با جدول CRMActivity (CRMActivity): مجموعه رکوردهای وابسته مرتبط با CRMAccount؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |
| `tasks` | `CRMTask[]` | ارتباط Prisma با جدول CRMTask (CRMTask): مجموعه رکوردهای وابسته مرتبط با CRMAccount؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |
| `notesLog` | `CRMNote[]` | ارتباط Prisma با جدول CRMNote (CRMNote): مجموعه رکوردهای وابسته مرتبط با CRMAccount؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |

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
| `account` | `CRMAccount` | ارتباط Prisma با جدول CRMAccount (CRMAccount): رکورد مرتبط مرتبط با CRMContact؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |
| `user` | `User?` | ارتباط Prisma با جدول User (کاربر): رکورد مرتبط مرتبط با CRMContact؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |

## LeadSource — LeadSource

منابع ورود سرنخ‌های فروش به شکل کد و عنوان قابل مدیریت.

| فیلد | نوع Prisma | توضیح |
|---|---|---|
| `id` | `Int` | شناسه یکتای رکورد و کلید اصلی جدول. |
| `code` | `String` | کد ماشینی یا تجاری این موجودیت. |
| `label` | `String` | برچسب یا عنوان کوتاه قابل نمایش. |
| `isActive` | `Boolean` | فعال یا غیرفعال بودن رکورد. |
| `sortOrder` | `Int` | ترتیب نمایش رکورد. |
| `createdAt` | `DateTime` | زمان ایجاد رکورد. |
| `updatedAt` | `DateTime` | آخرین زمان ویرایش رکورد. |
| `leads` | `Lead[]` | ارتباط Prisma با جدول Lead (سرنخ فروش): مجموعه رکوردهای وابسته مرتبط با LeadSource؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |

## Lead — سرنخ فروش

سرنخ بالقوه فروش تا زمان تبدیل یا رد، شامل منبع، امتیاز و مسئول پیگیری.

| فیلد | نوع Prisma | توضیح |
|---|---|---|
| `id` | `Int` | شناسه یکتای رکورد و کلید اصلی جدول. |
| `leadNumber` | `String` | مقدار متنی leadNumber برای توصیف یا شناسایی سرنخ فروش. |
| `displayName` | `String` | مقدار متنی displayName برای توصیف یا شناسایی سرنخ فروش. |
| `companyName` | `String?` | مقدار متنی companyName برای توصیف یا شناسایی سرنخ فروش. |
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
| `source` | `LeadSource?` | ارتباط Prisma با جدول LeadSource (LeadSource): رکورد مرتبط مرتبط با سرنخ فروش؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |
| `owner` | `User` | ارتباط Prisma با جدول User (کاربر): رکورد مرتبط مرتبط با سرنخ فروش؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |
| `convertedAccount` | `CRMAccount?` | ارتباط Prisma با جدول CRMAccount (CRMAccount): رکورد مرتبط مرتبط با سرنخ فروش؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |
| `convertedBy` | `User?` | ارتباط Prisma با جدول User (کاربر): رکورد مرتبط مرتبط با سرنخ فروش؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |
| `activities` | `CRMActivity[]` | ارتباط Prisma با جدول CRMActivity (CRMActivity): مجموعه رکوردهای وابسته مرتبط با سرنخ فروش؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |
| `tasks` | `CRMTask[]` | ارتباط Prisma با جدول CRMTask (CRMTask): مجموعه رکوردهای وابسته مرتبط با سرنخ فروش؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |
| `notesLog` | `CRMNote[]` | ارتباط Prisma با جدول CRMNote (CRMNote): مجموعه رکوردهای وابسته مرتبط با سرنخ فروش؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |

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
| `stages` | `PipelineStage[]` | ارتباط Prisma با جدول PipelineStage (PipelineStage): مجموعه رکوردهای وابسته مرتبط با Pipeline؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |
| `opportunities` | `Opportunity[]` | ارتباط Prisma با جدول Opportunity (فرصت فروش): مجموعه رکوردهای وابسته مرتبط با Pipeline؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |

## PipelineStage — PipelineStage

مراحل هر قیف فروش با ترتیب و احتمال موفقیت و نشانگر برد/باخت.

| فیلد | نوع Prisma | توضیح |
|---|---|---|
| `id` | `Int` | شناسه یکتای رکورد و کلید اصلی جدول. |
| `pipelineId` | `Int` | شناسه Pipeline مرتبط با این PipelineStage؛ کلید خارجی به جدول Pipeline است. |
| `code` | `String` | کد ماشینی یا تجاری این موجودیت. |
| `label` | `String` | برچسب یا عنوان کوتاه قابل نمایش. |
| `sortOrder` | `Int` | ترتیب نمایش رکورد. |
| `probability` | `Int` | مقدار عددی probability برای PipelineStage. |
| `isWon` | `Boolean` | مشخص می‌کند آیا isWon برای این PipelineStage فعال یا مجاز است. |
| `isLost` | `Boolean` | مشخص می‌کند آیا isLost برای این PipelineStage فعال یا مجاز است. |
| `pipeline` | `Pipeline` | ارتباط Prisma با جدول Pipeline (Pipeline): رکورد مرتبط مرتبط با PipelineStage؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |
| `opportunities` | `Opportunity[]` | ارتباط Prisma با جدول Opportunity (فرصت فروش): مجموعه رکوردهای وابسته مرتبط با PipelineStage؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |
| `fromHistories` | `OpportunityStageHistory[]` | ارتباط Prisma با جدول OpportunityStageHistory (OpportunityStageHistory): مجموعه رکوردهای وابسته مرتبط با PipelineStage؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |
| `toHistories` | `OpportunityStageHistory[]` | ارتباط Prisma با جدول OpportunityStageHistory (OpportunityStageHistory): مجموعه رکوردهای وابسته مرتبط با PipelineStage؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |

## Opportunity — فرصت فروش

فرصت فروش مرتبط با حساب CRM، مبلغ، ارز، مرحله و مسئول آن.

| فیلد | نوع Prisma | توضیح |
|---|---|---|
| `id` | `Int` | شناسه یکتای رکورد و کلید اصلی جدول. |
| `opportunityNumber` | `String` | مقدار متنی opportunityNumber برای توصیف یا شناسایی فرصت فروش. |
| `accountId` | `Int` | شناسه CRMAccount مرتبط با این فرصت فروش؛ کلید خارجی به جدول CRMAccount است. |
| `pipelineId` | `Int` | شناسه PipelineStage مرتبط با این فرصت فروش؛ کلید خارجی به جدول PipelineStage است. |
| `stageId` | `Int` | شناسه PipelineStage مرتبط با این فرصت فروش؛ کلید خارجی به جدول PipelineStage است. |
| `ownerUserId` | `Int` | شناسه کاربر مرتبط با این فرصت فروش؛ کلید خارجی به جدول User است. |
| `title` | `String` | عنوان اصلی قابل نمایش. |
| `amount` | `Decimal` | مبلغ مالی این رکورد. |
| `currency` | `String` | کد سه‌حرفی ارز (ISO 4217) مبالغ این رکورد. |
| `expectedCloseAt` | `DateTime?` | زمان expectedClose این فرصت فروش را ثبت می‌کند. |
| `status` | `CRMOpportunityStatus` | وضعیت چرخه عمر رکورد؛ مقادیر مجاز در Enum مربوط تعریف شده‌اند. |
| `closedAt` | `DateTime?` | زمان بسته‌شدن پرونده یا فرآیند. |
| `createdAt` | `DateTime` | زمان ایجاد رکورد. |
| `updatedAt` | `DateTime` | آخرین زمان ویرایش رکورد. |
| `account` | `CRMAccount` | ارتباط Prisma با جدول CRMAccount (CRMAccount): رکورد مرتبط مرتبط با فرصت فروش؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |
| `pipeline` | `Pipeline` | ارتباط Prisma با جدول Pipeline (Pipeline): رکورد مرتبط مرتبط با فرصت فروش؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |
| `stage` | `PipelineStage` | ارتباط Prisma با جدول PipelineStage (PipelineStage): رکورد مرتبط مرتبط با فرصت فروش؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |
| `owner` | `User` | ارتباط Prisma با جدول User (کاربر): رکورد مرتبط مرتبط با فرصت فروش؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |
| `stageHistory` | `OpportunityStageHistory[]` | ارتباط Prisma با جدول OpportunityStageHistory (OpportunityStageHistory): مجموعه رکوردهای وابسته مرتبط با فرصت فروش؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |
| `activities` | `CRMActivity[]` | ارتباط Prisma با جدول CRMActivity (CRMActivity): مجموعه رکوردهای وابسته مرتبط با فرصت فروش؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |
| `tasks` | `CRMTask[]` | ارتباط Prisma با جدول CRMTask (CRMTask): مجموعه رکوردهای وابسته مرتبط با فرصت فروش؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |
| `notesLog` | `CRMNote[]` | ارتباط Prisma با جدول CRMNote (CRMNote): مجموعه رکوردهای وابسته مرتبط با فرصت فروش؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |

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
| `opportunity` | `Opportunity` | ارتباط Prisma با جدول Opportunity (فرصت فروش): رکورد مرتبط مرتبط با OpportunityStageHistory؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |
| `fromStage` | `PipelineStage?` | ارتباط Prisma با جدول PipelineStage (PipelineStage): رکورد مرتبط مرتبط با OpportunityStageHistory؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |
| `toStage` | `PipelineStage` | ارتباط Prisma با جدول PipelineStage (PipelineStage): رکورد مرتبط مرتبط با OpportunityStageHistory؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |
| `actor` | `User` | ارتباط Prisma با جدول User (کاربر): رکورد مرتبط مرتبط با OpportunityStageHistory؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |

## CRMActivity — CRMActivity

فعالیت‌های ارتباطی و فروش مانند تماس، جلسه یا پیگیری و نتیجه آن.

| فیلد | نوع Prisma | توضیح |
|---|---|---|
| `id` | `BigInt` | شناسه یکتای رکورد و کلید اصلی جدول. |
| `type` | `CRMActivityType` | مقدار type برای نگهداری اطلاعات مرتبط با CRMActivity. |
| `subject` | `String` | مقدار متنی subject برای توصیف یا شناسایی CRMActivity. |
| `body` | `String?` | متن کامل پیام، یادداشت یا محتوای رکورد. |
| `occurredAt` | `DateTime` | زمان وقوع رویداد در منبع. |
| `durationMinutes` | `Int?` | مدت فعالیت بر حسب دقیقه. |
| `outcome` | `String?` | نتیجه فعالیت یا عملیات. |
| `actorUserId` | `Int` | شناسه کاربر مرتبط با این CRMActivity؛ کلید خارجی به جدول User است. |
| `accountId` | `Int?` | شناسه CRMAccount مرتبط با این CRMActivity؛ کلید خارجی به جدول CRMAccount است. |
| `leadId` | `Int?` | شناسه سرنخ فروش مرتبط با این CRMActivity؛ کلید خارجی به جدول Lead است. |
| `opportunityId` | `Int?` | شناسه فرصت فروش مرتبط با این CRMActivity؛ کلید خارجی به جدول Opportunity است. |
| `createdAt` | `DateTime` | زمان ایجاد رکورد. |
| `actor` | `User` | ارتباط Prisma با جدول User (کاربر): رکورد مرتبط مرتبط با CRMActivity؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |
| `account` | `CRMAccount?` | ارتباط Prisma با جدول CRMAccount (CRMAccount): رکورد مرتبط مرتبط با CRMActivity؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |
| `lead` | `Lead?` | ارتباط Prisma با جدول Lead (سرنخ فروش): رکورد مرتبط مرتبط با CRMActivity؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |
| `opportunity` | `Opportunity?` | ارتباط Prisma با جدول Opportunity (فرصت فروش): رکورد مرتبط مرتبط با CRMActivity؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |

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
| `assignee` | `User` | ارتباط Prisma با جدول User (کاربر): رکورد مرتبط مرتبط با CRMTask؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |
| `createdBy` | `User` | ارتباط Prisma با جدول User (کاربر): رکورد مرتبط مرتبط با CRMTask؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |
| `account` | `CRMAccount?` | ارتباط Prisma با جدول CRMAccount (CRMAccount): رکورد مرتبط مرتبط با CRMTask؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |
| `lead` | `Lead?` | ارتباط Prisma با جدول Lead (سرنخ فروش): رکورد مرتبط مرتبط با CRMTask؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |
| `opportunity` | `Opportunity?` | ارتباط Prisma با جدول Opportunity (فرصت فروش): رکورد مرتبط مرتبط با CRMTask؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |

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
| `author` | `User` | ارتباط Prisma با جدول User (کاربر): رکورد مرتبط مرتبط با CRMNote؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |
| `account` | `CRMAccount?` | ارتباط Prisma با جدول CRMAccount (CRMAccount): رکورد مرتبط مرتبط با CRMNote؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |
| `lead` | `Lead?` | ارتباط Prisma با جدول Lead (سرنخ فروش): رکورد مرتبط مرتبط با CRMNote؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |
| `opportunity` | `Opportunity?` | ارتباط Prisma با جدول Opportunity (فرصت فروش): رکورد مرتبط مرتبط با CRMNote؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |

## InventoryBalance — InventoryBalance

مانده فعلی موجودی هر محصول شامل تعداد موجود و تعداد رزروشده.

| فیلد | نوع Prisma | توضیح |
|---|---|---|
| `id` | `Int` | شناسه یکتای رکورد و کلید اصلی جدول. |
| `productId` | `Int` | شناسه محصول مرتبط با این InventoryBalance؛ کلید خارجی به جدول Product است. |
| `onHand` | `Int` | مقدار عددی onHand برای InventoryBalance. |
| `reserved` | `Int` | مقدار عددی reserved برای InventoryBalance. |
| `createdAt` | `DateTime` | زمان ایجاد رکورد. |
| `updatedAt` | `DateTime` | آخرین زمان ویرایش رکورد. |
| `product` | `Product` | ارتباط Prisma با جدول Product (محصول): رکورد مرتبط مرتبط با InventoryBalance؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |

## InventoryMovement — InventoryMovement

دفتر تغییرات موجودی شامل نوع حرکت، تعداد، مرجع و عامل عملیات.

| فیلد | نوع Prisma | توضیح |
|---|---|---|
| `id` | `BigInt` | شناسه یکتای رکورد و کلید اصلی جدول. |
| `productId` | `Int` | شناسه محصول مرتبط با این InventoryMovement؛ کلید خارجی به جدول Product است. |
| `actorUserId` | `Int?` | شناسه کاربر مرتبط با این InventoryMovement؛ کلید خارجی به جدول User است. |
| `movementType` | `InventoryMovementType` | نوع حرکت یا رویداد تغییر موجودی. |
| `quantityDelta` | `Int` | مقدار عددی quantityDelta برای InventoryMovement. |
| `referenceType` | `String?` | مقدار متنی referenceType برای توصیف یا شناسایی InventoryMovement. |
| `referenceId` | `String?` | شناسه رکورد مرتبط برای اتصال این InventoryMovement به موجودیت مرجع. |
| `idempotencyKey` | `String?` | کلید یکتای جلوگیری از اجرای تکراری درخواست/عملیات. |
| `reason` | `String?` | علت درخواست، تغییر وضعیت یا تصمیم. |
| `metadata` | `Json?` | داده‌های تکمیلی ساختاریافته و وابسته به دامنه در قالب JSON. |
| `createdAt` | `DateTime` | زمان ایجاد رکورد. |
| `product` | `Product` | ارتباط Prisma با جدول Product (محصول): رکورد مرتبط مرتبط با InventoryMovement؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |
| `actor` | `User?` | ارتباط Prisma با جدول User (کاربر): رکورد مرتبط مرتبط با InventoryMovement؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |

## RetailOrder — سفارش

سفارش اصلی خریدار، وضعیت سفارش و پرداخت، مبالغ، ارز و snapshot نشانی گیرنده.

| فیلد | نوع Prisma | توضیح |
|---|---|---|
| `id` | `Int` | شناسه یکتای رکورد و کلید اصلی جدول. |
| `orderNumber` | `String` | مقدار متنی orderNumber برای توصیف یا شناسایی سفارش. |
| `buyerUserId` | `Int` | شناسه کاربر مرتبط با این سفارش؛ کلید خارجی به جدول User است. |
| `status` | `RetailOrderStatus` | وضعیت چرخه عمر رکورد؛ مقادیر مجاز در Enum مربوط تعریف شده‌اند. |
| `paymentStatus` | `RetailPaymentStatus` | مقدار paymentStatus برای نگهداری اطلاعات مرتبط با سفارش. |
| `currency` | `String` | کد سه‌حرفی ارز (ISO 4217) مبالغ این رکورد. |
| `subtotal` | `Decimal` | مبلغ subtotal برای این سفارش؛ واحد پول در فیلد currency مشخص می‌شود. |
| `discountTotal` | `Decimal` | مبلغ discountTotal برای این سفارش؛ واحد پول در فیلد currency مشخص می‌شود. |
| `shippingTotal` | `Decimal` | مبلغ shippingTotal برای این سفارش؛ واحد پول در فیلد currency مشخص می‌شود. |
| `taxTotal` | `Decimal` | مبلغ taxTotal برای این سفارش؛ واحد پول در فیلد currency مشخص می‌شود. |
| `grandTotal` | `Decimal` | مبلغ grandTotal برای این سفارش؛ واحد پول در فیلد currency مشخص می‌شود. |
| `addressId` | `Int?` | شناسه نشانی مرتبط با این سفارش؛ کلید خارجی به جدول Address است. |
| `address` | `Address?` | ارتباط Prisma با جدول Address (نشانی): رکورد مرتبط مرتبط با سفارش؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |
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
| `buyer` | `User` | ارتباط Prisma با جدول User (کاربر): رکورد مرتبط مرتبط با سفارش؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |
| `items` | `RetailOrderItem[]` | ارتباط Prisma با جدول RetailOrderItem (RetailOrderItem): مجموعه رکوردهای وابسته مرتبط با سفارش؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |
| `sellerOrders` | `SellerOrder[]` | ارتباط Prisma با جدول SellerOrder (سفارش فروشنده): مجموعه رکوردهای وابسته مرتبط با سفارش؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |
| `paymentAttempts` | `PaymentAttempt[]` | ارتباط Prisma با جدول PaymentAttempt (PaymentAttempt): مجموعه رکوردهای وابسته مرتبط با سفارش؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |
| `paymentTransactions` | `PaymentTransaction[]` | ارتباط Prisma با جدول PaymentTransaction (PaymentTransaction): مجموعه رکوردهای وابسته مرتبط با سفارش؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |
| `refunds` | `RetailRefund[]` | ارتباط Prisma با جدول RetailRefund (RetailRefund): مجموعه رکوردهای وابسته مرتبط با سفارش؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |
| `reservations` | `InventoryReservation[]` | ارتباط Prisma با جدول InventoryReservation (InventoryReservation): مجموعه رکوردهای وابسته مرتبط با سفارش؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |
| `returns` | `ReturnRequest[]` | ارتباط Prisma با جدول ReturnRequest (ReturnRequest): مجموعه رکوردهای وابسته مرتبط با سفارش؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |
| `invoices` | `FinanceInvoice[]` | ارتباط Prisma با جدول FinanceInvoice (FinanceInvoice): مجموعه رکوردهای وابسته مرتبط با سفارش؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |

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
| `subtotal` | `Decimal` | مبلغ subtotal برای این سفارش فروشنده؛ واحد پول در فیلد currency مشخص می‌شود. |
| `discountTotal` | `Decimal` | مبلغ discountTotal برای این سفارش فروشنده؛ واحد پول در فیلد currency مشخص می‌شود. |
| `shippingTotal` | `Decimal` | مبلغ shippingTotal برای این سفارش فروشنده؛ واحد پول در فیلد currency مشخص می‌شود. |
| `taxTotal` | `Decimal` | مبلغ taxTotal برای این سفارش فروشنده؛ واحد پول در فیلد currency مشخص می‌شود. |
| `sellerNetTotal` | `Decimal` | مبلغ sellerNetTotal برای این سفارش فروشنده؛ واحد پول در فیلد currency مشخص می‌شود. |
| `companyNameSnapshot` | `String` | مقدار متنی companyNameSnapshot برای توصیف یا شناسایی سفارش فروشنده. |
| `companyIdSnapshot` | `String?` | مقدار متنی companyIdSnapshot برای توصیف یا شناسایی سفارش فروشنده. |
| `acceptedAt` | `DateTime?` | زمان accepted این سفارش فروشنده را ثبت می‌کند. |
| `shippedAt` | `DateTime?` | زمان shipped این سفارش فروشنده را ثبت می‌کند. |
| `deliveredAt` | `DateTime?` | زمان delivered این سفارش فروشنده را ثبت می‌کند. |
| `createdAt` | `DateTime` | زمان ایجاد رکورد. |
| `updatedAt` | `DateTime` | آخرین زمان ویرایش رکورد. |
| `order` | `RetailOrder` | ارتباط Prisma با جدول RetailOrder (سفارش): رکورد مرتبط مرتبط با سفارش فروشنده؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |
| `company` | `Company` | ارتباط Prisma با جدول Company (شرکت): رکورد مرتبط مرتبط با سفارش فروشنده؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |
| `items` | `RetailOrderItem[]` | ارتباط Prisma با جدول RetailOrderItem (RetailOrderItem): مجموعه رکوردهای وابسته مرتبط با سفارش فروشنده؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |
| `shipments` | `Shipment[]` | ارتباط Prisma با جدول Shipment (Shipment): مجموعه رکوردهای وابسته مرتبط با سفارش فروشنده؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |
| `returns` | `ReturnRequest[]` | ارتباط Prisma با جدول ReturnRequest (ReturnRequest): مجموعه رکوردهای وابسته مرتبط با سفارش فروشنده؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |
| `refunds` | `RetailRefund[]` | ارتباط Prisma با جدول RetailRefund (RetailRefund): مجموعه رکوردهای وابسته مرتبط با سفارش فروشنده؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |
| `commissionSnapshot` | `CommissionSnapshot?` | ارتباط Prisma با جدول CommissionSnapshot (CommissionSnapshot): رکورد مرتبط مرتبط با سفارش فروشنده؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |
| `sellerPayable` | `SellerPayable?` | ارتباط Prisma با جدول SellerPayable (SellerPayable): رکورد مرتبط مرتبط با سفارش فروشنده؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |
| `invoices` | `FinanceInvoice[]` | ارتباط Prisma با جدول FinanceInvoice (FinanceInvoice): مجموعه رکوردهای وابسته مرتبط با سفارش فروشنده؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |

## RetailOrderItem — RetailOrderItem

اقلام سفارش با snapshot محصول/فروشنده، تعداد، قیمت، تخفیف و مالیات.

| فیلد | نوع Prisma | توضیح |
|---|---|---|
| `id` | `Int` | شناسه یکتای رکورد و کلید اصلی جدول. |
| `orderId` | `Int` | شناسه سفارش فروشنده مرتبط با این RetailOrderItem؛ کلید خارجی به جدول SellerOrder است. |
| `sellerOrderId` | `Int` | شناسه سفارش فروشنده مرتبط با این RetailOrderItem؛ کلید خارجی به جدول SellerOrder است. |
| `productId` | `Int?` | شناسه محصول مرتبط با این RetailOrderItem؛ کلید خارجی به جدول Product است. |
| `productTitleSnapshot` | `String` | مقدار متنی productTitleSnapshot برای توصیف یا شناسایی RetailOrderItem. |
| `skuSnapshot` | `String?` | مقدار متنی skuSnapshot برای توصیف یا شناسایی RetailOrderItem. |
| `brandSnapshot` | `String?` | مقدار متنی brandSnapshot برای توصیف یا شناسایی RetailOrderItem. |
| `modelSnapshot` | `String?` | مقدار متنی modelSnapshot برای توصیف یا شناسایی RetailOrderItem. |
| `imageUrlSnapshot` | `String?` | مقدار متنی imageUrlSnapshot برای توصیف یا شناسایی RetailOrderItem. |
| `companyNameSnapshot` | `String` | مقدار متنی companyNameSnapshot برای توصیف یا شناسایی RetailOrderItem. |
| `quantity` | `Int` | تعداد واحدهای کالا یا مقدار موردنظر. |
| `unitPrice` | `Decimal` | مبلغ unitPrice برای این RetailOrderItem؛ واحد پول در فیلد currency مشخص می‌شود. |
| `discountAmount` | `Decimal` | مبلغ discountAmount برای این RetailOrderItem؛ واحد پول در فیلد currency مشخص می‌شود. |
| `taxAmount` | `Decimal` | مبلغ taxAmount برای این RetailOrderItem؛ واحد پول در فیلد currency مشخص می‌شود. |
| `lineTotal` | `Decimal` | مبلغ lineTotal برای این RetailOrderItem؛ واحد پول در فیلد currency مشخص می‌شود. |
| `currency` | `String` | کد سه‌حرفی ارز (ISO 4217) مبالغ این رکورد. |
| `createdAt` | `DateTime` | زمان ایجاد رکورد. |
| `order` | `RetailOrder` | ارتباط Prisma با جدول RetailOrder (سفارش): رکورد مرتبط مرتبط با RetailOrderItem؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |
| `sellerOrder` | `SellerOrder` | ارتباط Prisma با جدول SellerOrder (سفارش فروشنده): رکورد مرتبط مرتبط با RetailOrderItem؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |
| `product` | `Product?` | ارتباط Prisma با جدول Product (محصول): رکورد مرتبط مرتبط با RetailOrderItem؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |
| `returnItems` | `ReturnItem[]` | ارتباط Prisma با جدول ReturnItem (ReturnItem): مجموعه رکوردهای وابسته مرتبط با RetailOrderItem؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |

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
| `checkoutKey` | `String` | مقدار متنی checkoutKey برای توصیف یا شناسایی InventoryReservation. |
| `expiresAt` | `DateTime` | زمان انقضای اعتبار رکورد یا توکن. |
| `consumedAt` | `DateTime?` | زمان consumed این InventoryReservation را ثبت می‌کند. |
| `releasedAt` | `DateTime?` | زمان released این InventoryReservation را ثبت می‌کند. |
| `createdAt` | `DateTime` | زمان ایجاد رکورد. |
| `product` | `Product` | ارتباط Prisma با جدول Product (محصول): رکورد مرتبط مرتبط با InventoryReservation؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |
| `buyer` | `User` | ارتباط Prisma با جدول User (کاربر): رکورد مرتبط مرتبط با InventoryReservation؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |
| `order` | `RetailOrder?` | ارتباط Prisma با جدول RetailOrder (سفارش): رکورد مرتبط مرتبط با InventoryReservation؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |

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
| `authority` | `String?` | مقدار متنی authority برای توصیف یا شناسایی PaymentAttempt. |
| `redirectUrl` | `String?` | مقدار متنی redirectUrl برای توصیف یا شناسایی PaymentAttempt. |
| `expiresAt` | `DateTime?` | زمان انقضای اعتبار رکورد یا توکن. |
| `completedAt` | `DateTime?` | زمان تکمیل عملیات. |
| `createdAt` | `DateTime` | زمان ایجاد رکورد. |
| `updatedAt` | `DateTime` | آخرین زمان ویرایش رکورد. |
| `order` | `RetailOrder` | ارتباط Prisma با جدول RetailOrder (سفارش): رکورد مرتبط مرتبط با PaymentAttempt؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |
| `transactions` | `PaymentTransaction[]` | ارتباط Prisma با جدول PaymentTransaction (PaymentTransaction): مجموعه رکوردهای وابسته مرتبط با PaymentAttempt؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |
| `webhookEvents` | `PaymentWebhookEvent[]` | ارتباط Prisma با جدول PaymentWebhookEvent (PaymentWebhookEvent): مجموعه رکوردهای وابسته مرتبط با PaymentAttempt؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |

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
| `verifiedAt` | `DateTime?` | زمان verified این PaymentTransaction را ثبت می‌کند. |
| `createdAt` | `DateTime` | زمان ایجاد رکورد. |
| `order` | `RetailOrder` | ارتباط Prisma با جدول RetailOrder (سفارش): رکورد مرتبط مرتبط با PaymentTransaction؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |
| `attempt` | `PaymentAttempt?` | ارتباط Prisma با جدول PaymentAttempt (PaymentAttempt): رکورد مرتبط مرتبط با PaymentTransaction؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |
| `refunds` | `RetailRefund[]` | ارتباط Prisma با جدول RetailRefund (RetailRefund): مجموعه رکوردهای وابسته مرتبط با PaymentTransaction؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |
| `reconciliations` | `ReconciliationRecord[]` | ارتباط Prisma با جدول ReconciliationRecord (ReconciliationRecord): مجموعه رکوردهای وابسته مرتبط با PaymentTransaction؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |

## PaymentWebhookEvent — PaymentWebhookEvent

رویداد دریافتی webhook درگاه با اعتبار امضا و نتیجه پردازش.

| فیلد | نوع Prisma | توضیح |
|---|---|---|
| `id` | `BigInt` | شناسه یکتای رکورد و کلید اصلی جدول. |
| `provider` | `String` | نام درگاه یا سرویس بیرونی انجام‌دهنده عملیات. |
| `providerEventId` | `String` | شناسه رکورد مرتبط برای اتصال این PaymentWebhookEvent به موجودیت مرجع. |
| `attemptId` | `Int?` | شناسه PaymentAttempt مرتبط با این PaymentWebhookEvent؛ کلید خارجی به جدول PaymentAttempt است. |
| `status` | `PaymentWebhookStatus` | وضعیت چرخه عمر رکورد؛ مقادیر مجاز در Enum مربوط تعریف شده‌اند. |
| `signatureValid` | `Boolean` | اعتبارسنجی امضای دیجیتال webhook را مشخص می‌کند. |
| `payload` | `Json` | بدنه ساختاریافته یا خام رویداد دریافتی/داخلی. |
| `receivedAt` | `DateTime` | زمان دریافت رویداد یا درخواست. |
| `processedAt` | `DateTime?` | زمان پایان پردازش رویداد/عملیات. |
| `lastError` | `String?` | آخرین خطای رخ‌داده هنگام پردازش/ارسال. |
| `attempt` | `PaymentAttempt?` | ارتباط Prisma با جدول PaymentAttempt (PaymentAttempt): رکورد مرتبط مرتبط با PaymentWebhookEvent؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |

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
| `order` | `RetailOrder` | ارتباط Prisma با جدول RetailOrder (سفارش): رکورد مرتبط مرتبط با RetailRefund؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |
| `sellerOrder` | `SellerOrder?` | ارتباط Prisma با جدول SellerOrder (سفارش فروشنده): رکورد مرتبط مرتبط با RetailRefund؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |
| `paymentTransaction` | `PaymentTransaction?` | ارتباط Prisma با جدول PaymentTransaction (PaymentTransaction): رکورد مرتبط مرتبط با RetailRefund؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |
| `requestedBy` | `User` | ارتباط Prisma با جدول User (کاربر): رکورد مرتبط مرتبط با RetailRefund؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |

## Shipment — Shipment

اطلاعات ارسال سفارش فروشنده شامل شرکت حمل، کد رهگیری و وضعیت.

| فیلد | نوع Prisma | توضیح |
|---|---|---|
| `id` | `Int` | شناسه یکتای رکورد و کلید اصلی جدول. |
| `sellerOrderId` | `Int` | شناسه سفارش فروشنده مرتبط با این Shipment؛ کلید خارجی به جدول SellerOrder است. |
| `carrier` | `String?` | مقدار متنی carrier برای توصیف یا شناسایی Shipment. |
| `trackingNumber` | `String?` | مقدار متنی trackingNumber برای توصیف یا شناسایی Shipment. |
| `status` | `ShipmentStatus` | وضعیت چرخه عمر رکورد؛ مقادیر مجاز در Enum مربوط تعریف شده‌اند. |
| `shippedAt` | `DateTime?` | زمان shipped این Shipment را ثبت می‌کند. |
| `deliveredAt` | `DateTime?` | زمان delivered این Shipment را ثبت می‌کند. |
| `createdAt` | `DateTime` | زمان ایجاد رکورد. |
| `updatedAt` | `DateTime` | آخرین زمان ویرایش رکورد. |
| `sellerOrder` | `SellerOrder` | ارتباط Prisma با جدول SellerOrder (سفارش فروشنده): رکورد مرتبط مرتبط با Shipment؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |
| `trackingEvents` | `TrackingEvent[]` | ارتباط Prisma با جدول TrackingEvent (TrackingEvent): مجموعه رکوردهای وابسته مرتبط با Shipment؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |

## TrackingEvent — TrackingEvent

رویدادهای رهگیری مرسوله شامل شرح، موقعیت و زمان وقوع.

| فیلد | نوع Prisma | توضیح |
|---|---|---|
| `id` | `BigInt` | شناسه یکتای رکورد و کلید اصلی جدول. |
| `shipmentId` | `Int` | شناسه Shipment مرتبط با این TrackingEvent؛ کلید خارجی به جدول Shipment است. |
| `eventCode` | `String?` | مقدار متنی eventCode برای توصیف یا شناسایی TrackingEvent. |
| `description` | `String` | شرح تکمیلی موجودیت. |
| `location` | `String?` | مقدار متنی location برای توصیف یا شناسایی TrackingEvent. |
| `occurredAt` | `DateTime` | زمان وقوع رویداد در منبع. |
| `createdAt` | `DateTime` | زمان ایجاد رکورد. |
| `shipment` | `Shipment` | ارتباط Prisma با جدول Shipment (Shipment): رکورد مرتبط مرتبط با TrackingEvent؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |

## ReturnRequest — ReturnRequest

درخواست مرجوعی خریدار برای سفارش یا بخش فروشنده.

| فیلد | نوع Prisma | توضیح |
|---|---|---|
| `id` | `Int` | شناسه یکتای رکورد و کلید اصلی جدول. |
| `orderId` | `Int` | شناسه سفارش فروشنده مرتبط با این ReturnRequest؛ کلید خارجی به جدول SellerOrder است. |
| `sellerOrderId` | `Int` | شناسه سفارش فروشنده مرتبط با این ReturnRequest؛ کلید خارجی به جدول SellerOrder است. |
| `buyerUserId` | `Int` | شناسه کاربر مرتبط با این ReturnRequest؛ کلید خارجی به جدول User است. |
| `returnNumber` | `String` | مقدار متنی returnNumber برای توصیف یا شناسایی ReturnRequest. |
| `status` | `ReturnStatus` | وضعیت چرخه عمر رکورد؛ مقادیر مجاز در Enum مربوط تعریف شده‌اند. |
| `reason` | `String` | علت درخواست، تغییر وضعیت یا تصمیم. |
| `requestedAt` | `DateTime` | زمان ثبت درخواست. |
| `receivedAt` | `DateTime?` | زمان دریافت رویداد یا درخواست. |
| `closedAt` | `DateTime?` | زمان بسته‌شدن پرونده یا فرآیند. |
| `createdAt` | `DateTime` | زمان ایجاد رکورد. |
| `updatedAt` | `DateTime` | آخرین زمان ویرایش رکورد. |
| `order` | `RetailOrder` | ارتباط Prisma با جدول RetailOrder (سفارش): رکورد مرتبط مرتبط با ReturnRequest؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |
| `sellerOrder` | `SellerOrder` | ارتباط Prisma با جدول SellerOrder (سفارش فروشنده): رکورد مرتبط مرتبط با ReturnRequest؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |
| `buyer` | `User` | ارتباط Prisma با جدول User (کاربر): رکورد مرتبط مرتبط با ReturnRequest؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |
| `items` | `ReturnItem[]` | ارتباط Prisma با جدول ReturnItem (ReturnItem): مجموعه رکوردهای وابسته مرتبط با ReturnRequest؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |

## ReturnItem — ReturnItem

اقلام و تعدادهای مشمول درخواست مرجوعی و نتیجه بازرسی آن‌ها.

| فیلد | نوع Prisma | توضیح |
|---|---|---|
| `id` | `Int` | شناسه یکتای رکورد و کلید اصلی جدول. |
| `returnRequestId` | `Int` | شناسه ReturnRequest مرتبط با این ReturnItem؛ کلید خارجی به جدول ReturnRequest است. |
| `orderItemId` | `Int` | شناسه RetailOrderItem مرتبط با این ReturnItem؛ کلید خارجی به جدول RetailOrderItem است. |
| `quantity` | `Int` | تعداد واحدهای کالا یا مقدار موردنظر. |
| `disposition` | `ReturnItemDisposition?` | نحوه تعیین تکلیف کالای برگشتی. |
| `inspectionNote` | `String?` | مقدار متنی inspectionNote برای توصیف یا شناسایی ReturnItem. |
| `createdAt` | `DateTime` | زمان ایجاد رکورد. |
| `returnRequest` | `ReturnRequest` | ارتباط Prisma با جدول ReturnRequest (ReturnRequest): رکورد مرتبط مرتبط با ReturnItem؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |
| `orderItem` | `RetailOrderItem` | ارتباط Prisma با جدول RetailOrderItem (RetailOrderItem): رکورد مرتبط مرتبط با ReturnItem؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |

## LedgerAccount — LedgerAccount

حساب دفتر کل با کد، نام، ماهیت حساب و ارز.

| فیلد | نوع Prisma | توضیح |
|---|---|---|
| `id` | `Int` | شناسه یکتای رکورد و کلید اصلی جدول. |
| `code` | `String` | کد ماشینی یا تجاری این موجودیت. |
| `name` | `String` | نام قابل نمایش موجودیت. |
| `accountType` | `LedgerAccountType` | ماهیت یا نوع حساب. |
| `currency` | `String` | کد سه‌حرفی ارز (ISO 4217) مبالغ این رکورد. |
| `isSystem` | `Boolean` | سیستمی بودن رکورد و محدودیت مدیریت عادی آن. |
| `isActive` | `Boolean` | فعال یا غیرفعال بودن رکورد. |
| `createdAt` | `DateTime` | زمان ایجاد رکورد. |
| `updatedAt` | `DateTime` | آخرین زمان ویرایش رکورد. |
| `lines` | `JournalLine[]` | ارتباط Prisma با جدول JournalLine (JournalLine): مجموعه رکوردهای وابسته مرتبط با LedgerAccount؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |

## JournalEntry — JournalEntry

سند حسابداری دفتر کل با منبع، وضعیت ثبت و ارتباط با سند معکوس.

| فیلد | نوع Prisma | توضیح |
|---|---|---|
| `id` | `BigInt` | شناسه یکتای رکورد و کلید اصلی جدول. |
| `entryNumber` | `String` | مقدار متنی entryNumber برای توصیف یا شناسایی JournalEntry. |
| `sourceType` | `String?` | مقدار متنی sourceType برای توصیف یا شناسایی JournalEntry. |
| `sourceId` | `String?` | شناسه رکورد مرتبط برای اتصال این JournalEntry به موجودیت مرجع. |
| `currency` | `String` | کد سه‌حرفی ارز (ISO 4217) مبالغ این رکورد. |
| `description` | `String?` | شرح تکمیلی موجودیت. |
| `status` | `JournalEntryStatus` | وضعیت چرخه عمر رکورد؛ مقادیر مجاز در Enum مربوط تعریف شده‌اند. |
| `occurredAt` | `DateTime` | زمان وقوع رویداد در منبع. |
| `postedAt` | `DateTime?` | زمان posted این JournalEntry را ثبت می‌کند. |
| `createdByUserId` | `Int?` | شناسه کاربر مرتبط با این JournalEntry؛ کلید خارجی به جدول User است. |
| `reversalOfId` | `BigInt?` | شناسه JournalEntry مرتبط با این JournalEntry؛ کلید خارجی به جدول JournalEntry است. |
| `createdAt` | `DateTime` | زمان ایجاد رکورد. |
| `lines` | `JournalLine[]` | ارتباط Prisma با جدول JournalLine (JournalLine): مجموعه رکوردهای وابسته مرتبط با JournalEntry؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |
| `createdBy` | `User?` | ارتباط Prisma با جدول User (کاربر): رکورد مرتبط مرتبط با JournalEntry؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |
| `reversalOf` | `JournalEntry?` | ارتباط Prisma با جدول JournalEntry (JournalEntry): رکورد مرتبط مرتبط با JournalEntry؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |
| `reversals` | `JournalEntry[]` | ارتباط Prisma با جدول JournalEntry (JournalEntry): مجموعه رکوردهای وابسته مرتبط با JournalEntry؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |

## JournalLine — JournalLine

سطر بدهکار/بستانکار سند حسابداری و حساب دفتر کل مربوط.

| فیلد | نوع Prisma | توضیح |
|---|---|---|
| `id` | `BigInt` | شناسه یکتای رکورد و کلید اصلی جدول. |
| `journalEntryId` | `BigInt` | شناسه JournalEntry مرتبط با این JournalLine؛ کلید خارجی به جدول JournalEntry است. |
| `accountId` | `Int` | شناسه LedgerAccount مرتبط با این JournalLine؛ کلید خارجی به جدول LedgerAccount است. |
| `debit` | `Decimal` | مبلغ debit برای این JournalLine؛ واحد پول در فیلد currency مشخص می‌شود. |
| `credit` | `Decimal` | مبلغ credit برای این JournalLine؛ واحد پول در فیلد currency مشخص می‌شود. |
| `memo` | `String?` | شرح کوتاه سطر یا عملیات. |
| `createdAt` | `DateTime` | زمان ایجاد رکورد. |
| `journalEntry` | `JournalEntry` | ارتباط Prisma با جدول JournalEntry (JournalEntry): رکورد مرتبط مرتبط با JournalLine؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |
| `account` | `LedgerAccount` | ارتباط Prisma با جدول LedgerAccount (LedgerAccount): رکورد مرتبط مرتبط با JournalLine؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |

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
| `company` | `Company?` | ارتباط Prisma با جدول Company (شرکت): رکورد مرتبط مرتبط با CommissionRule؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |
| `category` | `Category?` | ارتباط Prisma با جدول Category (Category): رکورد مرتبط مرتبط با CommissionRule؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |
| `snapshots` | `CommissionSnapshot[]` | ارتباط Prisma با جدول CommissionSnapshot (CommissionSnapshot): مجموعه رکوردهای وابسته مرتبط با CommissionRule؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |

## CommissionSnapshot — CommissionSnapshot

snapshot کمیسیون محاسبه‌شده برای سفارش فروشنده تا تغییر بعدی قانون، مبلغ تاریخی را عوض نکند.

| فیلد | نوع Prisma | توضیح |
|---|---|---|
| `id` | `Int` | شناسه یکتای رکورد و کلید اصلی جدول. |
| `sellerOrderId` | `Int` | شناسه سفارش فروشنده مرتبط با این CommissionSnapshot؛ کلید خارجی به جدول SellerOrder است. |
| `ruleId` | `Int?` | شناسه CommissionRule مرتبط با این CommissionSnapshot؛ کلید خارجی به جدول CommissionRule است. |
| `calculation` | `CommissionCalculationType` | روش محاسبه مقدار یا کمیسیون. |
| `rate` | `Decimal` | نرخ یا درصد مورد استفاده در محاسبه. |
| `baseAmount` | `Decimal` | مبلغ baseAmount برای این CommissionSnapshot؛ واحد پول در فیلد currency مشخص می‌شود. |
| `commissionAmount` | `Decimal` | مبلغ commissionAmount برای این CommissionSnapshot؛ واحد پول در فیلد currency مشخص می‌شود. |
| `currency` | `String` | کد سه‌حرفی ارز (ISO 4217) مبالغ این رکورد. |
| `createdAt` | `DateTime` | زمان ایجاد رکورد. |
| `sellerOrder` | `SellerOrder` | ارتباط Prisma با جدول SellerOrder (سفارش فروشنده): رکورد مرتبط مرتبط با CommissionSnapshot؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |
| `rule` | `CommissionRule?` | ارتباط Prisma با جدول CommissionRule (CommissionRule): رکورد مرتبط مرتبط با CommissionSnapshot؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |

## SellerPayable — SellerPayable

بدهی خالص بازارگاه به فروشنده برای سفارش، پس از کمیسیون و کسورات.

| فیلد | نوع Prisma | توضیح |
|---|---|---|
| `id` | `BigInt` | شناسه یکتای رکورد و کلید اصلی جدول. |
| `sellerOrderId` | `Int` | شناسه سفارش فروشنده مرتبط با این SellerPayable؛ کلید خارجی به جدول SellerOrder است. |
| `companyId` | `Int` | شناسه شرکت مرتبط با این SellerPayable؛ کلید خارجی به جدول Company است. |
| `settlementId` | `Int?` | شناسه تسویه مرتبط با این SellerPayable؛ کلید خارجی به جدول Settlement است. |
| `currency` | `String` | کد سه‌حرفی ارز (ISO 4217) مبالغ این رکورد. |
| `grossAmount` | `Decimal` | مبلغ grossAmount برای این SellerPayable؛ واحد پول در فیلد currency مشخص می‌شود. |
| `commissionAmount` | `Decimal` | مبلغ commissionAmount برای این SellerPayable؛ واحد پول در فیلد currency مشخص می‌شود. |
| `deductionAmount` | `Decimal` | مبلغ deductionAmount برای این SellerPayable؛ واحد پول در فیلد currency مشخص می‌شود. |
| `netAmount` | `Decimal` | مبلغ netAmount برای این SellerPayable؛ واحد پول در فیلد currency مشخص می‌شود. |
| `status` | `SellerPayableStatus` | وضعیت چرخه عمر رکورد؛ مقادیر مجاز در Enum مربوط تعریف شده‌اند. |
| `eligibleAt` | `DateTime?` | زمان eligible این SellerPayable را ثبت می‌کند. |
| `paidAt` | `DateTime?` | زمان پرداخت موفق. |
| `createdAt` | `DateTime` | زمان ایجاد رکورد. |
| `updatedAt` | `DateTime` | آخرین زمان ویرایش رکورد. |
| `sellerOrder` | `SellerOrder` | ارتباط Prisma با جدول SellerOrder (سفارش فروشنده): رکورد مرتبط مرتبط با SellerPayable؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |
| `company` | `Company` | ارتباط Prisma با جدول Company (شرکت): رکورد مرتبط مرتبط با SellerPayable؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |
| `settlement` | `Settlement?` | ارتباط Prisma با جدول Settlement (تسویه): رکورد مرتبط مرتبط با SellerPayable؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |

## Settlement — تسویه

پرونده تسویه مالی شرکت در یک دوره همراه با مبالغ و وضعیت تأیید/پرداخت.

| فیلد | نوع Prisma | توضیح |
|---|---|---|
| `id` | `Int` | شناسه یکتای رکورد و کلید اصلی جدول. |
| `settlementNumber` | `String` | مقدار متنی settlementNumber برای توصیف یا شناسایی تسویه. |
| `companyId` | `Int` | شناسه شرکت مرتبط با این تسویه؛ کلید خارجی به جدول Company است. |
| `currency` | `String` | کد سه‌حرفی ارز (ISO 4217) مبالغ این رکورد. |
| `periodStart` | `DateTime` | زمان مرتبط با periodStart در چرخه عمر تسویه. |
| `periodEnd` | `DateTime` | زمان مرتبط با periodEnd در چرخه عمر تسویه. |
| `grossAmount` | `Decimal` | مبلغ grossAmount برای این تسویه؛ واحد پول در فیلد currency مشخص می‌شود. |
| `deductionAmount` | `Decimal` | مبلغ deductionAmount برای این تسویه؛ واحد پول در فیلد currency مشخص می‌شود. |
| `netAmount` | `Decimal` | مبلغ netAmount برای این تسویه؛ واحد پول در فیلد currency مشخص می‌شود. |
| `status` | `SettlementStatus` | وضعیت چرخه عمر رکورد؛ مقادیر مجاز در Enum مربوط تعریف شده‌اند. |
| `requestedByUserId` | `Int` | شناسه کاربر مرتبط با این تسویه؛ کلید خارجی به جدول User است. |
| `requestedAt` | `DateTime` | زمان ثبت درخواست. |
| `approvedAt` | `DateTime?` | زمان تأیید. |
| `paidAt` | `DateTime?` | زمان پرداخت موفق. |
| `createdAt` | `DateTime` | زمان ایجاد رکورد. |
| `updatedAt` | `DateTime` | آخرین زمان ویرایش رکورد. |
| `company` | `Company` | ارتباط Prisma با جدول Company (شرکت): رکورد مرتبط مرتبط با تسویه؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |
| `requestedBy` | `User` | ارتباط Prisma با جدول User (کاربر): رکورد مرتبط مرتبط با تسویه؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |
| `payables` | `SellerPayable[]` | ارتباط Prisma با جدول SellerPayable (SellerPayable): مجموعه رکوردهای وابسته مرتبط با تسویه؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |
| `approvals` | `SettlementApproval[]` | ارتباط Prisma با جدول SettlementApproval (SettlementApproval): مجموعه رکوردهای وابسته مرتبط با تسویه؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |
| `payouts` | `SettlementPayout[]` | ارتباط Prisma با جدول SettlementPayout (SettlementPayout): مجموعه رکوردهای وابسته مرتبط با تسویه؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |

## SettlementApproval — SettlementApproval

تصمیم تأیید/رد پرونده تسویه، تأییدکننده و زمان تصمیم.

| فیلد | نوع Prisma | توضیح |
|---|---|---|
| `id` | `Int` | شناسه یکتای رکورد و کلید اصلی جدول. |
| `settlementId` | `Int` | شناسه تسویه مرتبط با این SettlementApproval؛ کلید خارجی به جدول Settlement است. |
| `approverUserId` | `Int` | شناسه کاربر مرتبط با این SettlementApproval؛ کلید خارجی به جدول User است. |
| `decision` | `SettlementApprovalDecision` | نتیجه تصمیم ثبت‌شده. |
| `reason` | `String?` | علت درخواست، تغییر وضعیت یا تصمیم. |
| `decidedAt` | `DateTime` | زمان decided این SettlementApproval را ثبت می‌کند. |
| `settlement` | `Settlement` | ارتباط Prisma با جدول Settlement (تسویه): رکورد مرتبط مرتبط با SettlementApproval؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |
| `approver` | `User` | ارتباط Prisma با جدول User (کاربر): رکورد مرتبط مرتبط با SettlementApproval؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |

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
| `executedAt` | `DateTime?` | زمان executed این SettlementPayout را ثبت می‌کند. |
| `failureReason` | `String?` | علت شکست عملیات. |
| `createdAt` | `DateTime` | زمان ایجاد رکورد. |
| `updatedAt` | `DateTime` | آخرین زمان ویرایش رکورد. |
| `settlement` | `Settlement` | ارتباط Prisma با جدول Settlement (تسویه): رکورد مرتبط مرتبط با SettlementPayout؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |
| `executedBy` | `User?` | ارتباط Prisma با جدول User (کاربر): رکورد مرتبط مرتبط با SettlementPayout؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |
| `reconciliations` | `ReconciliationRecord[]` | ارتباط Prisma با جدول ReconciliationRecord (ReconciliationRecord): مجموعه رکوردهای وابسته مرتبط با SettlementPayout؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |

## ReconciliationRecord — ReconciliationRecord

تطبیق تراکنش یا پرداخت خروجی با گزارش ارائه‌دهنده مالی.

| فیلد | نوع Prisma | توضیح |
|---|---|---|
| `id` | `BigInt` | شناسه یکتای رکورد و کلید اصلی جدول. |
| `provider` | `String` | نام درگاه یا سرویس بیرونی انجام‌دهنده عملیات. |
| `externalReference` | `String` | شناسه مرجع رکورد در سامانه بیرونی. |
| `amount` | `Decimal` | مبلغ مالی این رکورد. |
| `currency` | `String` | کد سه‌حرفی ارز (ISO 4217) مبالغ این رکورد. |
| `matched` | `Boolean` | پرچم منطقی matched برای کنترل رفتار ReconciliationRecord. |
| `paymentTransactionId` | `Int?` | شناسه PaymentTransaction مرتبط با این ReconciliationRecord؛ کلید خارجی به جدول PaymentTransaction است. |
| `payoutId` | `Int?` | شناسه SettlementPayout مرتبط با این ReconciliationRecord؛ کلید خارجی به جدول SettlementPayout است. |
| `notes` | `String?` | یادداشت‌های تکمیلی درباره رکورد. |
| `reconciledAt` | `DateTime` | زمان reconciled این ReconciliationRecord را ثبت می‌کند. |
| `paymentTransaction` | `PaymentTransaction?` | ارتباط Prisma با جدول PaymentTransaction (PaymentTransaction): رکورد مرتبط مرتبط با ReconciliationRecord؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |
| `payout` | `SettlementPayout?` | ارتباط Prisma با جدول SettlementPayout (SettlementPayout): رکورد مرتبط مرتبط با ReconciliationRecord؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |

## FinanceInvoice — FinanceInvoice

سربرگ فاکتور مالی مرتبط با خریدار، شرکت یا سفارش.

| فیلد | نوع Prisma | توضیح |
|---|---|---|
| `id` | `Int` | شناسه یکتای رکورد و کلید اصلی جدول. |
| `invoiceNumber` | `String` | مقدار متنی invoiceNumber برای توصیف یا شناسایی FinanceInvoice. |
| `companyId` | `Int?` | شناسه شرکت مرتبط با این FinanceInvoice؛ کلید خارجی به جدول Company است. |
| `buyerUserId` | `Int?` | شناسه کاربر مرتبط با این FinanceInvoice؛ کلید خارجی به جدول User است. |
| `orderId` | `Int?` | شناسه سفارش مرتبط با این FinanceInvoice؛ کلید خارجی به جدول RetailOrder است. |
| `sellerOrderId` | `Int?` | شناسه سفارش فروشنده مرتبط با این FinanceInvoice؛ کلید خارجی به جدول SellerOrder است. |
| `status` | `InvoiceStatus` | وضعیت چرخه عمر رکورد؛ مقادیر مجاز در Enum مربوط تعریف شده‌اند. |
| `currency` | `String` | کد سه‌حرفی ارز (ISO 4217) مبالغ این رکورد. |
| `subtotal` | `Decimal` | مبلغ subtotal برای این FinanceInvoice؛ واحد پول در فیلد currency مشخص می‌شود. |
| `taxTotal` | `Decimal` | مبلغ taxTotal برای این FinanceInvoice؛ واحد پول در فیلد currency مشخص می‌شود. |
| `grandTotal` | `Decimal` | مبلغ grandTotal برای این FinanceInvoice؛ واحد پول در فیلد currency مشخص می‌شود. |
| `issuedAt` | `DateTime?` | زمان issued این FinanceInvoice را ثبت می‌کند. |
| `createdAt` | `DateTime` | زمان ایجاد رکورد. |
| `updatedAt` | `DateTime` | آخرین زمان ویرایش رکورد. |
| `company` | `Company?` | ارتباط Prisma با جدول Company (شرکت): رکورد مرتبط مرتبط با FinanceInvoice؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |
| `buyer` | `User?` | ارتباط Prisma با جدول User (کاربر): رکورد مرتبط مرتبط با FinanceInvoice؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |
| `order` | `RetailOrder?` | ارتباط Prisma با جدول RetailOrder (سفارش): رکورد مرتبط مرتبط با FinanceInvoice؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |
| `sellerOrder` | `SellerOrder?` | ارتباط Prisma با جدول SellerOrder (سفارش فروشنده): رکورد مرتبط مرتبط با FinanceInvoice؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |
| `lines` | `FinanceInvoiceLine[]` | ارتباط Prisma با جدول FinanceInvoiceLine (FinanceInvoiceLine): مجموعه رکوردهای وابسته مرتبط با FinanceInvoice؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |

## FinanceInvoiceLine — FinanceInvoiceLine

ردیف جزئیات فاکتور شامل شرح، تعداد، قیمت، مالیات و جمع ردیف.

| فیلد | نوع Prisma | توضیح |
|---|---|---|
| `id` | `Int` | شناسه یکتای رکورد و کلید اصلی جدول. |
| `invoiceId` | `Int` | شناسه FinanceInvoice مرتبط با این FinanceInvoiceLine؛ کلید خارجی به جدول FinanceInvoice است. |
| `description` | `String` | شرح تکمیلی موجودیت. |
| `quantity` | `Decimal` | تعداد واحدهای کالا یا مقدار موردنظر. |
| `unitPrice` | `Decimal` | مبلغ unitPrice برای این FinanceInvoiceLine؛ واحد پول در فیلد currency مشخص می‌شود. |
| `taxAmount` | `Decimal` | مبلغ taxAmount برای این FinanceInvoiceLine؛ واحد پول در فیلد currency مشخص می‌شود. |
| `lineTotal` | `Decimal` | مبلغ lineTotal برای این FinanceInvoiceLine؛ واحد پول در فیلد currency مشخص می‌شود. |
| `invoice` | `FinanceInvoice` | ارتباط Prisma با جدول FinanceInvoice (FinanceInvoice): رکورد مرتبط مرتبط با FinanceInvoiceLine؛ این فیلد رابطه‌ای است و ستون مستقل در PostgreSQL ایجاد نمی‌کند. |

