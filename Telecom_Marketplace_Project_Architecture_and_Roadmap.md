# Telecom Marketplace — Project Architecture, Product Vision & Roadmap

## 1. سند این سند

این سند مرجع اصلی برای هر توسعه‌دهنده، مهندس ارشد، AI Agent و عضو جدید تیم است که روی پروژه Telecom Marketplace کار می‌کند.

هدف آن این است که قبل از هر تغییر در کد، فرد بداند:

- پروژه دقیقاً چه مسئله‌ای را حل می‌کند.
- کاربران چه نوع‌هایی دارند.
- مرز مسئولیت Website، Company Portal و Admin/CRM چیست.
- جریان محصول و استعلام چگونه کار می‌کند.
- چه قابلیت‌هایی فعلاً فعال هستند و چه قابلیت‌هایی برای آینده در نظر گرفته شده‌اند.
- چه تصمیمات معماری نباید بدون بررسی تغییر کنند.
- هنگام refactor چه چیزهایی نباید شکسته شوند.
- ترتیب منطقی توسعه در فازهای بعدی چیست.

**این سند جایگزین بررسی کد واقعی نیست.** هر AI یا developer باید قبل از تغییر، implementation فعلی را با این سند تطبیق دهد و در صورت تناقض، ابتدا گزارش بدهد؛ نه اینکه کورکورانه یکی را انتخاب کند.

---

# 2. معرفی پروژه

Telecom Marketplace یک پلتفرم چندشرکتی برای حوزه تجهیزات و محصولات مخابراتی است.

پروژه در نهایت یک Marketplace ترکیبی B2B + B2C خواهد بود.

در فاز فعلی تمرکز اصلی روی:

- مدیریت شرکت‌ها
- مدیریت محصولات
- بررسی و تأیید محصولات
- انتشار محصولات
- استعلام B2B
- مدیریت کاربران و دسترسی‌ها
- عملیات داخلی Marketplace

است.

در فازهای آینده، بخش B2C نیز فعال خواهد شد و کاربران عادی می‌توانند:

- محصول را به سبد خرید اضافه کنند.
- سفارش ثبت کنند.
- آدرس داشته باشند.
- پرداخت انجام دهند.
- سفارش را پیگیری کنند.

بنابراین معماری فعلی نباید به شکلی طراحی شود که فعال کردن B2C در آینده نیازمند بازنویسی اساسی سیستم باشد.

---

# 3. مدل کسب‌وکار

سیستم سه گروه اصلی کاربر دارد.

## 3.1 CUSTOMER

کاربر عادی Marketplace است.

در Website فعالیت می‌کند.

### اکنون

- مشاهده Marketplace
- جستجوی محصول
- فیلتر محصولات
- مشاهده جزئیات
- مشاهده محصولات منتشرشده
- در صورت فعال بودن قابلیت، ثبت استعلام طبق قوانین سیستم

### آینده

- حساب کاربری
- آدرس‌ها
- سبد خرید
- Checkout
- سفارش
- پرداخت
- تاریخچه سفارش
- پیگیری سفارش

CUSTOMER نباید به Company Portal یا Admin/CRM دسترسی داشته باشد.

---

# 4. COMPANY

شرکت‌های فروشنده/ارائه‌دهنده محصول هستند.

هر Company می‌تواند چند کاربر داشته باشد.

کاربران Company در Company Portal کار می‌کنند.

### مسئولیت‌های Company

- ایجاد محصول
- تکمیل اطلاعات محصول
- افزودن تصویر
- افزودن مشخصات
- تعیین قیمت طبق مدل فعلی سیستم
- ارسال محصول برای بررسی
- مشاهده وضعیت محصولات خود
- مدیریت استعلام‌های مربوط به شرکت
- مدیریت کاربران شرکت طبق مجوزهای تعریف‌شده

### اصل مهم

کاربر Company فقط باید به داده‌های شرکت خودش دسترسی مدیریتی داشته باشد.

نباید بتواند:

- محصول شرکت دیگر را مدیریت کند.
- داده‌های داخلی شرکت دیگر را مشاهده کند.
- companyId را برای دور زدن ownership تغییر دهد.

Ownership باید در Backend enforce شود و صرفاً به UI یا route frontend وابسته نباشد.

---

# 5. STAFF / Main Employees

STAFF کارکنان مجموعه Main هستند که Marketplace را مدیریت می‌کنند.

آن‌ها فروشنده Marketplace نیستند.

### مسئولیت STAFF

- مدیریت شرکت‌ها
- مدیریت کاربران
- بررسی محصولات
- تأیید محصول
- رد محصول
- انتشار محصول
- مخفی کردن محصول
- مدیریت استعلام‌ها
- پشتیبانی
- عملیات داخلی
- مدیریت سفارش‌ها در آینده
- Ticketing در آینده
- Finance در آینده
- CRM در آینده
- گزارش‌های عملیاتی در آینده

## اصل مهم

STAFF نباید Company Dashboard داشته باشد.

STAFF نباید صرفاً به خاطر داشتن حساب کاربری، شرکت فروشنده محسوب شود.

STAFF همچنین نباید محصولی برای خودش ایجاد کند.

اگر یکی از کارکنان Main در آینده واقعاً بخواهد فروشنده باشد:

1. یک Company واقعی برای او/مجموعه او ایجاد می‌شود.
2. اطلاعات Company ثبت می‌شود.
3. کاربر به آن Company متصل می‌شود.
4. از آن نقطه به بعد، او به عنوان COMPANY رفتار می‌کند.

این دو مفهوم نباید با هم مخلوط شوند.

---

# 6. تفکیک سه محیط اصلی Frontend

معماری هدف:

```text
apps/
├── website/
├── company/
└── admin/
```

## Website

مخصوص CUSTOMER و Marketplace عمومی.

## Company

مخصوص کاربران COMPANY.

## Admin

مخصوص STAFF و در آینده هسته CRM/Backoffice.

این تفکیک از نظر معماری مهم است، چون Admin در آینده بسیار بزرگ‌تر از یک Dashboard ساده خواهد شد.

Admin به سمت:

- CRM
- Ticketing
- Finance
- Operations
- Orders
- Reports

حرکت می‌کند.

بنابراین نباید رشد Admin باعث coupling شدید با Website یا Company Portal شود.

---

# 7. Backend

Backend در حال حاضر یک API مشترک است.

معماری هدف:

```text
Website ─────┐
Company ─────┼──> Backend API ──> PostgreSQL
Admin ───────┘
```

سه frontend مستقل هستند، اما Backend و domain logic مشترک باقی می‌ماند.

این کار باعث می‌شود:

- business ruleها یکجا باشند.
- ownership در یک محل enforce شود.
- APIها بین frontendها consistency داشته باشند.
- منطق محصول در سه frontend تکرار نشود.

---

# 8. تکنولوژی فعلی

## Backend

- Node.js
- Fastify
- Prisma
- PostgreSQL
- JavaScript

API prefix:

```text
/api/v1
```

## Frontend

- Vue 3
- Vite
- Pinia
- PrimeVue
- Tailwind / CSS موجود پروژه
- JavaScript

### اصل

پروژه JavaScript است.

بدون تصمیم معماری جدید نباید TypeScript به صورت پراکنده وارد پروژه شود.

---

# 9. Repository Structure

ساختار هدف کلی:

```text
telecom-marketplace/
│
├── apps/
│   ├── website/
│   ├── company/
│   └── admin/
│
├── packages/
│   ├── shared-core/
│   └── api-client/
│
├── backend/
│
├── docker-compose.yml
├── docker-compose.dev.yml
├── pnpm-workspace.yaml
└── pnpm-lock.yaml
```

### نقش‌ها

`apps/website`
- Marketplace
- CUSTOMER experience

`apps/company`
- Seller/company portal

`apps/admin`
- STAFF
- عملیات داخلی
- آینده CRM

`packages/api-client`
- client رسمی ارتباط frontend با API

`packages/shared-core`
- کدهای واقعاً مشترک

`backend`
- API
- authentication
- authorization
- business rules
- persistence

---

# 10. معماری هویت و دسترسی

مدل مفهومی:

```text
User
 │
 ├── Profile
 │
 └── AccessProfile
       │
       ├── CUSTOMER
       ├── COMPANY
       └── STAFF
```

AccessProfile مشخص می‌کند کاربر متعلق به کدام application context است.

Role و Permission مشخص می‌کنند در آن context چه کارهایی مجاز است.

مدل باید از hard-code کردن مفاهیمی مثل SUPER_ADMIN برای تعیین application جلوگیری کند.

به طور کلی:

```text
AccessProfile = در کدام محیط؟
Role           = چه نوع دسترسی؟
Permission     = چه عملیات مشخصی؟
Company        = متعلق به کدام شرکت؟
```

---

# 11. اصل مهم Authorization

Frontend فقط UI را کنترل می‌کند.

Backend مرجع نهایی authorization است.

هیچ‌وقت نباید صرفاً به این اعتماد کنیم:

```js
if (user.hasPermission(...))
```

در frontend.

برای mutationها و داده‌های حساس، Backend باید دوباره بررسی کند.

مثلاً:

```text
Company A user
    ↓
PUT /products/123
    ↓
Backend
    ↓
product.companyId === caller.companyId ?
    ↓
YES → continue
NO  → 403
```

---

# 12. Product Domain

Product یکی از domainهای اصلی پروژه است.

چرخه فعلی:

```text
DRAFT
   ↓
PENDING_REVIEW
   ↓
APPROVED
   ↓
PUBLISHED
```

مسیرهای دیگر شامل:

```text
REJECTED
HIDDEN
ARCHIVED
```

و بازگردانی Draft طبق قوانین موجود سیستم انجام می‌شود.

## معنی وضعیت‌ها

### DRAFT

محصول هنوز توسط Company در حال تکمیل است.

### PENDING_REVIEW

Company محصول را برای بررسی ارسال کرده است.

### APPROVED

STAFF محصول را تأیید کرده است ولی هنوز الزاماً در Marketplace عمومی منتشر نشده است.

### PUBLISHED

محصول برای نمایش عمومی آماده و منتشر شده است.

### REJECTED

محصول توسط بررسی‌کننده رد شده است.

### HIDDEN

محصول از نمایش عمومی خارج شده ولی لزوماً حذف نشده است.

### ARCHIVED

محصول از چرخه فعال خارج شده است.

---

# 13. Product Visibility

Status با Visibility یکی نیست.

Product می‌تواند status مشخصی داشته باشد و visibility نیز جداگانه کنترل شود.

Visibilityهای موجود در طراحی:

```text
PUBLIC
PRIVATE
COMPANY_ONLY
```

این دو مفهوم نباید در frontend با هم یکی فرض شوند.

مثلاً:

```text
status = PUBLISHED
visibility = PUBLIC
```

برای Marketplace عمومی قابل نمایش است.

اما:

```text
status = PUBLISHED
visibility = COMPANY_ONLY
```

لزومی ندارد برای همه کاربران عمومی نمایش داده شود.

---

# 14. Product Workflow

فرآیند استاندارد:

```text
COMPANY
  │
  │ Create
  ▼
DRAFT
  │
  │ Submit for review
  ▼
PENDING_REVIEW
  │
  ├── Reject ──> REJECTED
  │
  └── Approve
          ▼
       APPROVED
          │
          │ Publish
          ▼
       PUBLISHED
```

در هر مرحله باید authorization و transition rule در Backend enforce شود.

Frontend نباید خودش status transition را معتبر فرض کند.

---

# 15. STAFF و Product

STAFF مدیر Marketplace است، نه Seller.

بنابراین:

- STAFF محصول شخصی ندارد.
- STAFF نباید Product Management به معنی seller ownership داشته باشد.
- STAFF باید بتواند محصولات شرکت‌ها را بررسی و مدیریت عملیاتی کند.
- STAFF نباید در UI به اشتباه به عنوان Company نمایش داده شود.

این تفاوت باید در:

- AccessProfile
- navigation
- permissions
- API authorization
- route guards
- UI

حفظ شود.

---

# 16. Product Creation

ایجاد محصول باید از Company context انجام شود.

مثلاً:

```text
COMPANY USER
   ↓
Company Portal
   ↓
Create Product
   ↓
Backend
   ↓
resolve company from caller
   ↓
Product.companyId = caller.companyId
```

نباید Company user بتواند با ارسال یک companyId دلخواه محصولی برای شرکت دیگر بسازد.

SUPER_ADMIN/STAFF در صورت داشتن permission مناسب می‌تواند طبق business rule روی محصولات شرکت‌ها عملیات مدیریتی انجام دهد، اما این نباید به معنای تبدیل شدن STAFF به Seller باشد.

---

# 17. Inquiry Domain

استعلام یکی از قابلیت‌های اصلی B2B است.

در مدل فعلی:

- کاربر/شرکت محصول را انتخاب می‌کند.
- محصولات موردنظر را مانند یک لیست انتخاب می‌کند.
- فرم استعلام ارسال می‌شود.
- استعلام ثبت می‌شود.
- Company مربوطه آن را بررسی می‌کند.
- STAFF می‌تواند در نقش Marketplace عملیات مدیریتی و نظارتی انجام دهد.

این سیستم فعلاً Chat negotiation نیست.

---

# 18. Sealed Bid / Inquiry Modes

مدل‌های استعلام می‌تواند شامل:

```text
NORMAL
SEALED
ANONYMOUS_SEALED
```

باشد.

قوانین visibility و دسترسی این بخش باید در Backend enforce شود.

---

# 19. B2C Future Architecture

در آینده Marketplace خرید عمومی فعال می‌شود.

Domainهای آینده:

```text
Cart
Address
Order
OrderItem
Payment
Shipment
OrderStatus
Refund
```

جریان احتمالی:

```text
CUSTOMER
   ↓
Product
   ↓
Add to Cart
   ↓
Cart
   ↓
Checkout
   ↓
Address
   ↓
Payment
   ↓
Order
   ↓
Fulfillment
```

### نکته مهم

Product نباید از ابتدا با فرض اینکه فقط برای Inquiry است طراحی شود.

Product در آینده می‌تواند هم برای:

- B2B Inquiry
- B2C Purchase

استفاده شود.

---

# 20. قیمت

قیمت محصول در مدل فعلی با IRR مدیریت می‌شود.

در آینده ممکن است pricing پیچیده‌تر شود:

- قیمت عمومی
- قیمت شرکت
- تخفیف
- قیمت عمده
- قیمت کمپین
- مالیات
- هزینه ارسال

اما این قابلیت‌ها نباید قبل از نیاز واقعی وارد مدل شوند.

اصل:

> ابتدا domain requirement، سپس model.

نه برعکس.

---

# 21. Admin آینده

Admin نباید به یک Dashboard ساده محدود شود.

هدف:

```text
Admin
│
├── Dashboard
├── Companies
├── Users
├── Products
├── Inquiries
├── Orders
├── Customers
├── Tickets
├── CRM
├── Finance
├── Reports
└── System Management
```

Admin در واقع Backoffice سیستم است.

---

# 22. CRM آینده

CRM می‌تواند شامل:

- Customer management
- Company management
- interaction history
- inquiry history
- order history
- support history
- ticketing
- internal notes
- follow-up
- activity timeline

باشد.

اما CRM نباید زودتر از نیاز واقعی domain ساخته شود.

---

# 23. Ticketing آینده

Ticketing برای عملیات پشتیبانی:

```text
Customer / Company
       ↓
     Ticket
       ↓
    STAFF
       ↓
Assignment
       ↓
Replies / Internal Notes
       ↓
Resolution
```

Ticketing باید domain مستقل داشته باشد و با User/Company/Order/Inquiry از طریق relation به هم متصل شود.

---

# 24. Finance آینده

Finance در آینده می‌تواند شامل:

- payments
- invoices
- refunds
- settlement
- seller accounting
- commissions

باشد.

Finance باید domain مستقل و audit-friendly باشد.

هیچ AI نباید بدون requirement دقیق، مدل مالی را طراحی یا تغییر دهد.

---

# 25. Docker / Deployment Architecture

هدف:

```text
website container
company container
admin container
backend container
postgres container
```

در development و production configuration باید جدا باشد.

Frontendها می‌توانند lifecycle مستقل داشته باشند.

مزیت:

- تغییر Website بدون build مجدد Admin
- توسعه مستقل CRM
- deployment مستقل
- کاهش blast radius
- scale مستقل

Backend همچنان API مشترک است.

---

# 26. Design System

هویت فعلی Marketplace نباید در refactorها نابود شود.

Design tokens فعلی:

```text
Primary: #01bec2
Font: Vazirmatn
Spacing base: 4px
Radius: 8px
```

اصل:

> Refactor ≠ Redesign

اگر task مربوط به architecture/backend است، نباید بدون requirement UI را redesign کرد.

---

# 27. اصل UI

UI باید:

- سبک
- سریع
- قابل فهم
- consistent
- responsive
- مناسب زبان فارسی

باشد.

از over-engineering و component abstraction بی‌دلیل پرهیز شود.

---

# 28. API Client

`@telecom/api-client` مسیر canonical ارتباط frontend با API است.

Frontend نباید برای هر صفحه implementation جدید fetch/HTTP بسازد مگر اینکه دلیل معماری مشخصی وجود داشته باشد.

هدف:

```text
UI
 ↓
API Client
 ↓
Backend API
```

و نه:

```text
هر صفحه
 ↓
fetch مخصوص خودش
 ↓
endpointهای پراکنده
```

---

# 29. قواعد مهم برای AI Agent

هر AI که وارد پروژه می‌شود باید این workflow را رعایت کند:

## مرحله 1 — Understand

قبل از تغییر:

- فایل‌های مرتبط را بخوان.
- architecture موجود را بررسی کن.
- domain rule را پیدا کن.
- caller/access model را بررسی کن.
- API endpoint را بررسی کن.
- frontend usage را بررسی کن.

## مرحله 2 — Diagnose

مشکل را دقیقاً مشخص کن:

```text
Observed behavior
↓
Expected behavior
↓
Root cause
↓
Affected layer
```

## مرحله 3 — Plan

قبل از implementation حتماً اعلام کن:

1. چه فایل‌هایی تغییر می‌کنند.
2. در هر فایل چه تغییری انجام می‌شود.
3. چرا این تغییر لازم است.
4. چه فایل‌هایی عمداً تغییر نمی‌کنند.
5. چه ریسک‌هایی وجود دارد.
6. چگونه تست می‌شود.

**بدون ارائه Plan و تأیید، implementation را شروع نکن.**

## مرحله 4 — Implement

کوچک‌ترین تغییر لازم را انجام بده.

## مرحله 5 — Verify

حداقل:

- build
- lint/test در صورت وجود
- بررسی API
- بررسی authorization
- بررسی regression

## مرحله 6 — Report

در پایان:

```text
Changed:
...

Not changed:
...

Root cause:
...

Verification:
...

Remaining risks:
...
```

---

# 30. قانون بسیار مهم برای AI

AI نباید از روی یک فایل نتیجه‌گیری معماری کند.

مثلاً اگر مشکل Product وجود دارد، حداقل این‌ها باید بررسی شوند:

```text
product.routes
product.controller
product.service
product model
auth
permissions
frontend API client
frontend page
navigation
```

در صورت نیاز:

```text
seed
roles
permissions
database
```

---

# 31. قانون عدم حدس

اگر AI چیزی را نمی‌داند:

نباید حدس بزند.

باید:

```text
Need to inspect X before changing Y.
```

بگوید.

خصوصاً درباره:

- permission
- role
- ownership
- database relation
- API response shape
- status transition
- authentication

---

# 32. قانون Backend First برای Security

هر rule امنیتی باید در Backend enforce شود.

مثلاً:

```text
Frontend hides button
```

به تنهایی security نیست.

باید:

```text
Frontend hides button
+
Backend rejects unauthorized request
```

وجود داشته باشد.

---

# 33. قانون Ownership

هرجا داده متعلق به Company است:

```text
caller.companyId
```

باید مرجع اصلی ownership باشد.

نه:

```text
URL companyId
```

و نه:

```text
frontend selected company
```

مگر در عملیات مدیریتی STAFF که صراحتاً اجازه آن وجود دارد.

---

# 34. قانون STAFF

هیچ feature جدیدی نباید فرض کند:

```text
Every authenticated user = Company user
```

این فرض ممنوع است.

همیشه distinction زیر را در نظر بگیر:

```text
CUSTOMER
COMPANY
STAFF
```

---

# 35. Navigation

Navigation باید بر اساس application context و permission ساخته شود.

نباید صرفاً بر اساس login بودن کاربر menu نمایش داده شود.

مثلاً:

```text
STAFF
→ Admin

COMPANY
→ Company

CUSTOMER
→ Website
```

و permissionها عملیات داخل application را کنترل می‌کنند.

---

# 36. Migration / Refactor Strategy

پروژه قبلاً featureهای زیادی دریافت کرده است.

بنابراین قرار نیست همه‌چیز را یک‌باره rewrite کنیم.

روش استاندارد:

```text
Understand
↓
Freeze current behavior
↓
Identify boundary
↓
Refactor one domain
↓
Verify
↓
Move to next domain
```

هر phase باید مستقل و قابل تست باشد.

---

# 37. Roadmap کلی

## Phase 0 — Architecture Stabilization

هدف:

- تثبیت User / AccessProfile / Company / Role / Permission
- تفکیک STAFF / COMPANY / CUSTOMER
- حذف فرض‌های اشتباه
- مشخص کردن application boundaries
- بررسی frontend architecture

---

## Phase 1 — Product Management Stabilization

- Company product creation
- Product editing
- Product images
- Product specifications
- Product pricing
- Submit for review
- Admin review
- Approve
- Reject
- Publish
- Hide
- Archive
- Ownership
- Visibility
- Product list
- Status filtering

---

## Phase 2 — Company Portal

- Company dashboard
- Products
- Inquiries
- Company users
- Permissions
- Company-level reporting where required

STAFF functionality نباید وارد این portal شود.

---

## Phase 3 — Admin / Backoffice

- Admin dashboard
- Companies
- Users
- Products
- Product review queue
- Inquiries
- Operational reports
- Auditability

---

## Phase 4 — B2B Inquiry

- Inquiry creation
- Inquiry items
- Company handling
- STAFF supervision
- Normal inquiry
- Sealed inquiry
- Anonymous sealed inquiry
- Status lifecycle
- Notifications

---

## Phase 5 — Customer Identity

- Customer profile
- Addresses
- Customer dashboard
- Order history foundation

---

## Phase 6 — B2C Commerce

- Cart
- Cart items
- Checkout
- Order
- Order items
- Payment
- Shipment
- Order lifecycle

---

## Phase 7 — CRM

Admin expands into:

- Customer CRM
- Company CRM
- Activity timeline
- Follow-up
- Internal notes
- Support history

---

## Phase 8 — Ticketing

- Tickets
- Assignment
- Priority
- Status
- Replies
- Internal notes
- Attachments
- SLA-oriented capabilities if required

---

## Phase 9 — Finance

- Payment records
- Invoice
- Refund
- Seller settlement
- Commission
- Financial reports

---

## Phase 10 — Scale & Operations

- observability
- audit logs
- performance
- caching where justified
- background jobs
- notifications
- search improvements
- analytics
- deployment optimization

---

# 38. اولویت فعلی پروژه

در وضعیت فعلی، اولویت نباید اضافه کردن feature جدید باشد.

اولویت:

```text
1. Architecture cleanup
2. Access model stabilization
3. STAFF / COMPANY separation
4. Product workflow correctness
5. Admin product visibility
6. Company product management
7. Inquiry correctness
8. Regression testing
9. سپس featureهای جدید
```

---

# 39. Definition of Done

یک feature زمانی Done است که:

- Backend rule درست باشد.
- Authorization درست باشد.
- Frontend رفتار صحیح داشته باشد.
- وضعیت‌های edge case بررسی شده باشد.
- build موفق باشد.
- testهای مرتبط موفق باشند.
- ownership بررسی شده باشد.
- regression مهم بررسی شده باشد.
- مستندات لازم به‌روزرسانی شده باشد.

صرفاً:

```text
UI works
```

به معنی Done نیست.

---

# 40. Definition of Done برای Product

برای Product حداقل این سناریو باید سالم باشد:

```text
Company User
   ↓
Create Product
   ↓
DRAFT
   ↓
Edit
   ↓
Submit
   ↓
PENDING_REVIEW
   ↓
STAFF sees it
   ↓
Approve
   ↓
APPROVED
   ↓
Publish
   ↓
PUBLISHED
   ↓
Customer sees it
```

و:

```text
Company A
   X
Company B products
```

باید غیرممکن باشد.

---

# 41. Definition of Done برای STAFF

STAFF باید بتواند طبق permission:

- شرکت‌ها را مدیریت کند.
- کاربران را مدیریت کند.
- محصولات شرکت‌ها را ببیند.
- pending products را ببیند.
- محصول را بررسی کند.
- approve/reject/publish کند.
- استعلام‌ها را مدیریت کند.

اما:

- Company dashboard ندارد.
- Seller profile ندارد.
- محصول شخصی ندارد.
- Company ownership fictitious ندارد.

---

# 42. Definition of Done برای CUSTOMER

در فاز فعلی:

- Marketplace را می‌بیند.
- Productهای public و منتشرشده را می‌بیند.

در فاز commerce:

```text
Browse
→ Cart
→ Checkout
→ Payment
→ Order
→ Tracking
```

---

# 43. قوانین غیرقابل مذاکره پروژه

### Rule 1

Backend مرجع business rule است.

### Rule 2

Frontend محل authorization واقعی نیست.

### Rule 3

STAFF با COMPANY یکی نیست.

### Rule 4

CUSTOMER با COMPANY یکی نیست.

### Rule 5

Product ownership باید server-side enforce شود.

### Rule 6

Status و Visibility دو مفهوم جدا هستند.

### Rule 7

Refactor نباید بدون بررسی regression انجام شود.

### Rule 8

هر تغییر معماری ابتدا Plan دارد.

### Rule 9

AI نباید بدون بررسی codebase حدس بزند.

### Rule 10

Feature جدید نباید architecture فعلی را بدون دلیل بشکند.

### Rule 11

Redesign بدون درخواست انجام نشود.

### Rule 12

Abstraction فقط زمانی ایجاد شود که واقعاً shared behavior وجود داشته باشد.

---

# 44. دستورالعمل شروع کار برای Developer جدید

قبل از اولین commit:

1. Repository را بررسی کن.
2. apps را بررسی کن.
3. backend modules را بررسی کن.
4. Prisma schema را بخوان.
5. authentication را بررسی کن.
6. AccessProfile را بررسی کن.
7. Role/Permission را بررسی کن.
8. Product domain را کامل بخوان.
9. Inquiry domain را بخوان.
10. API client را بررسی کن.
11. navigation را بررسی کن.
12. Docker/dev environment را بررسی کن.
13. build را اجرا کن.
14. testهای موجود را اجرا کن.
15. وضعیت فعلی را ثبت کن.

بعد از آن تازه اولین task را شروع کن.

---

# 45. دستورالعمل شروع کار برای AI

Prompt پایه پیشنهادی:

> You are a senior software architect and engineer joining the Telecom Marketplace project.
>
> Read the project architecture documentation before making any change.
>
> Treat CUSTOMER, COMPANY and STAFF as separate business contexts.
>
> STAFF are Main Marketplace employees, not sellers. They must not receive Company Portal behavior unless explicitly required.
>
> COMPANY users manage their own company's products and data.
>
> CUSTOMER users belong to the public marketplace and will gain B2C commerce capabilities in future phases.
>
> Backend is the source of truth for authorization, ownership and business rules.
>
> Do not guess. Inspect the relevant backend, frontend, database, auth, permission and API-client code before changing anything.
>
> Before implementation, always provide:
> 1. Current behavior
> 2. Expected behavior
> 3. Root cause
> 4. Files to inspect
> 5. Files to modify
> 6. Detailed implementation plan
> 7. Risks
> 8. Verification plan
>
> Do not start implementation until the plan is presented.
>
> Make the smallest safe change that solves the root cause.
>
> Do not redesign the UI unless explicitly requested.
>
> After implementation, run appropriate build/tests and report exactly what changed and what was verified.

---

# 46. چشم‌انداز نهایی

در نهایت سیستم باید به این ساختار برسد:

```text
                    TELECOM MARKETPLACE
                           │
            ┌──────────────┼──────────────┐
            │              │              │
            ▼              ▼              ▼
        CUSTOMER        COMPANY         STAFF
            │              │              │
        Website         Company         Admin
                         Portal        / CRM
            │              │              │
            │              │       ┌──────┼──────┐
            │              │       │      │      │
            │              │      CRM  Tickets Finance
            │              │
            │              │
            └───────┬──────┘
                    │
                Marketplace
                    │
             Shared Backend API
                    │
                PostgreSQL
```

این معماری اجازه می‌دهد پروژه از یک Marketplace مخابراتی اولیه، بدون تغییر بنیادین در هویت سیستم، به یک پلتفرم کامل:

**Marketplace + B2B + B2C + CRM + Support + Commerce + Finance**

تکامل پیدا کند.

---

# 47. اصل نهایی مدیریت پروژه

پروژه نباید با این سؤال توسعه داده شود:

> «این صفحه را چطور درست کنیم؟»

بلکه باید پرسید:

> «این قابلیت متعلق به کدام business context است، مالک داده چه کسی است، business rule آن چیست، و کدام layer باید مسئول enforce کردن آن باشد؟»

این سؤال باید مبنای تصمیم‌های معماری آینده باشد.


---

# 30. AI Agent Workflow and Persistent Project Memory

The repository's binding instructions live in the root `AGENTS.md`. Every AI agent must read that file before starting any task, then follow `.ai/PROTOCOL.md` and check the latest entries in `.ai/WORKLOG.md`.

Persistent project memory is version-controlled:
- `.ai/WORKLOG.md`: append-only record of completed/in-progress tasks, tests, commit SHAs, blockers, and next steps.
- `.ai/current-task.md`: current focus and handoff; completed history must first be moved into WORKLOG.
- `.ai/project-context.md`: durable architecture and implementation facts.
- `.ai/decisions.md`: accepted decisions and rationale.
- `docs/AI_AGENT_WORKFLOW.md`: human-facing workflow.
- `CLAUDE.md` and `.github/copilot-instructions.md`: tool-specific entrypoints pointing back to the same rules.

Agents must inspect Git state before edits, preserve user changes, diagnose before implementing, run applicable tests, review diffs, update docs, and record the actual commit/push state. Do not claim checks passed if they were not run. `main` is the only intended long-lived branch; do not create branches by default, rewrite history, or delete branches without authorization and safe-integration verification.

# 31. Notification System Documentation

The current notification route inventory, user preferences, admin announcement endpoints, frontend entry points, and SMTP verification requirements are documented in `docs/NOTIFICATION_SYSTEM.md`. When notification implementation changes, update that document and the relevant API docs in the same task. Live SMTP delivery must be marked NOT VERIFIED unless tested with configured credentials and a real delivery path.


---

# 44. وضعیت واقعی پروژه و برنامه کار بعدی — 2026-10-29

این بخش وضعیت اجرایی فعلی را مشخص می‌کند و برای وضعیت تکمیل قابلیت‌ها از حدس یا صرفاً از roadmap قدیمی استفاده نمی‌کند. در صورت اختلاف با فازهای برنامه‌ریزی‌شده قدیمی، وضعیت مشاهده‌شده در سورس، تست‌ها و گزارش کیفیت ملاک است.

## وضعیت تأییدشده

- شاخه مرجع `main` است. آخرین جست‌وجوی شاخه‌های ریموت فقط `main` را برگرداند؛ این مشاهده، وضعیت شاخه‌های محلی کاربر را مشخص نمی‌کند.
- PR #28 فقط زیربنای مشترک بازطراحی UI را ادغام کرده است: design tokenها، primitiveهای اختیاری صفحه، ظاهر MegaMenu، تست رگرسیون و راهنمای انتقال امن. بازطراحی کامل فایل‌های patch انجام نشده است.
- CI اجراشده روی commit بررسی‌شده موفق بوده است: تست‌های frontend/shared، backend، تولید Prisma Client، بررسی گراف معماری و build هر سه پنل.
- اعتبارسنجی migration دیتابیس موفق بوده است.
- Runtime validation در مرحله browser smoke شکست خورده؛ مراحل Compose، ساخت/اجرای سرویس‌ها، health check و بررسی migration پیش از آن موفق بوده‌اند. طبق دستور مالک پروژه، این مورد در حال حاضر کار بعدی برای عیب‌یابی نیست و نباید موفق گزارش شود.
- Graphify MCP به دلیل نبود workspace قابل انتخاب بررسی یا به‌روزرسانی نشد. این محدودیت از architecture graph تولیدشده داخل repository جداست؛ بررسی آن در CI موفق بوده است.

## کارهای باقی‌مانده به ترتیب اولویت

### اولویت ۱ — انتقال امن بازطراحی UI
1. صفحه اصلی Website را از روی `main` فعلی بررسی کن.
2. فقط تغییرات template/style سازگار را انتقال بده؛ API، مجوزها، routeها، داده واقعی، loading/error/empty states و mutationها باید حفظ شوند.
3. برای رفتارهای تغییرکرده تست رگرسیون بنویس و تست‌های هدفمند و build همان پنل را اجرا کن.
4. سپس صفحه بعدی را شروع کن؛ patch قدیمی را یک‌جا اعمال نکن و mock data یا auth bypass وارد محصول نکن.

### اولویت ۱ — تکمیل بازبینی امنیت و مالکیت داده
- بررسی route به route برای endpointهای شرکت و خطر IDOR/tenant leakage ادامه یابد.
- بررسی هدفمند قبلی به معنی تأیید امنیت کامل نیست. هر شکاف تأییدشده باید با تست رگرسیون بسته شود.

### اولویت ۱ — سرویس‌های بیرونی و آمادگی عملیاتی
- پرداخت زرين‌پال: **تأیید زنده نشده**؛ به staging و اعتبارنامه معتبر نیاز دارد.
- ارسال SMTP: **تأیید زنده نشده**؛ به اعتبارنامه و گیرنده آزمایشی کنترل‌شده نیاز دارد.
- SMS: **پیاده‌سازی ناقص**؛ adapter و worker مربوط به Twilio، quota پولی و تست‌ها وجود دارند، اما dispatcher هنوز SMS row ایجاد نمی‌کند. کار باقی‌مانده: اتصال event dispatch به صف پیامک با opt-in، اعتبارسنجی شماره، مصرف quota، dedupe/retry tests و تأیید زنده با credential کنترل‌شده.
- استقرار production و آمادگی عملیاتی: **تأیید نهایی نشده**.

### اولویت ۲ — تکمیل مستندات و نگهداری
- مستندات API در سطح ماژول و منبع فعلی همگام شده‌اند؛ پوشش کامل همه endpointها، schemaها و مجوزها هنوز ادعا نمی‌شود.
- هشدارهای deprecation مربوط به ابزارهای GitHub Actions را جداگانه بررسی کن؛ dependencyهای برنامه را صرفاً به خاطر هشدارهای کد bundled اکشن‌ها ارتقا نده.
- فایل‌های `.ai/current-task.md`، `.ai/WORKLOG.md`، `.ai/project-context.md`، این roadmap و گزارش کیفیت را در هر تغییر مهم به‌روز نگه دار.

## محدودیت‌های غیرقابل مذاکره

- مرز AccessProfile/app context با نقش SUPER_ADMIN یا wildcard دور زده نمی‌شود.
- invariants مربوط به قفل‌گذاری پاسخ استعلام، جلوگیری از پاسخ تکراری، idempotency پرداخت و انقضای سهمیه باید حفظ شوند.
- سبد خرید، checkout، سفارش و wishlist طبق تصمیم معماری فعلی قابلیت‌های آینده/غیرفعال هستند و نباید ناخواسته فعال شوند.
- تست مرورگر در این مرحله کار بعدی نیست؛ نتیجه شکست‌خورده باید صادقانه ثبت شود، نه اینکه موفق اعلام شود.


---

# وضعیت اجرایی 2026-10-30 — پس از مرحله 10

## بازطراحی رابط کاربری

مرحله 10، بازطراحی ظاهری و دسترس‌پذیری صفحه قوانین و حریم خصوصی، در PR #37 با commit `0da4960d026aa6be532777c5dd66afacca3430de` ادغام شد. CI و اعتبارسنجی migration در شاخه و پس از ادغام موفق شدند. نتیجه runtime در زمان ثبت این یادداشت هنوز در حال اجرا بود؛ موفقیت browser smoke ادعا نمی‌شود.

صفحات هدف فعلی که بازطراحی امن آن‌ها ادغام شده است: خانه، فهرست محصولات، جزئیات محصول، دسته‌بندی‌ها، نتایج جستجو، درباره ما، پروفایل شرکت، سوالات متداول و قوانین/حریم خصوصی. فهرست شرکت‌ها به دلیل STAFF-only بودن API و نبود قرارداد عمومی امن، غیرفعال باقی می‌ماند. صفحه تماس با ما به دلیل ارسال نمایشی پیام و اطلاعات تماس تأییدنشده، تا تعریف API و داده معتبر به تعویق افتاده است.

## مرحله بعد — ممیزی امنیتی چندمستاجری

بررسی route به route برای منابع متعلق به شرکت‌ها ادامه یابد: مرز AccessProfile، کنترل مجوز، tenant scoping، مالکیت منبع و منابع تو‌در‌تو مانند پیوست‌ها. فقط شکاف‌های بازتولیدشده با تست رگرسیون اصلاح شوند. تا پوشش کامل routeها، تأیید امنیت کامل اعلام نشود.
