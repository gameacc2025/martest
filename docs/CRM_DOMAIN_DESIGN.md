# طراحی دامنه CRM بازارگاه

**شناسه:** CRM-DOMAIN-01  
**وضعیت:** قرارداد پیشنهادی؛ API و migration هنوز پیاده‌سازی نشده  
**تاریخ:** 2026-11-04

## 1. هدف و مرز CRM

CRM ابزار داخلی تیم STAFF برای مدیریت رابطه تجاری، سرنخ، فرصت فروش و پیگیری است. CRM جایگزین مدل‌های هویتی موجود نیست و نباید برای یک Company یا User رکورد هویتی موازی و متناقض بسازد.

- User و AccessProfile منبع حقیقت هویت و نوع دسترسی‌اند.
- Company منبع حقیقت اطلاعات شرکت بازارگاه است.
- Lead سرنخ هنوز تبدیل‌نشده است؛ ممکن است شخص یا سازمان باشد.
- CRMAccount پرونده تجاری و وضعیت رابطه با مشتری است و در صورت وجود، به User/Company canonical link می‌شود.
- Opportunity یک امکان فروش مشخص با مبلغ احتمالی، مرحله و تاریخ پیش‌بینی است.
- Activity تماس، پیام، جلسه، یادداشت یا اقدام مرتبط با Account/Lead/Opportunity است.
- Task اقدام دارای مسئول، موعد، وضعیت و یادآوری است.

CRM داخلی در نسخه اول فقط برای STAFF است. Company users و CUSTOMER نباید از این مسیر به اطلاعات سرنخ‌ها، pipeline یا یادداشت‌های فروش داخلی دسترسی داشته باشند.

## 2. مدل داده پیشنهادی

| موجودیت | فیلدهای کلیدی | نکته طراحی |
|---|---|---|
| CRMAccount | accountType, displayName, companyId?, userId?, ownerUserId, lifecycle, source | لینک canonical اختیاری و یکتا؛ اطلاعات هویتی را کپی نکن |
| CRMContact | accountId, userId?, name, title, email, phone, isPrimary | اطلاعات تماس تجاری؛ داده حساس و permission-scoped |
| Lead | leadNumber, person/company details, source, status, score, ownerUserId, convertedAccountId? | قبل از تبدیل؛ dedupe بر اساس قواعد قابل ممیزی |
| LeadSource | code, label, isActive | فرم سایت، تماس، رویداد، معرفی، استعلام و غیره |
| Pipeline | name, isDefault, isActive | امکان چند pipeline در آینده؛ MVP یک pipeline پیش‌فرض |
| PipelineStage | pipelineId, code, label, sortOrder, probability, isWon, isLost | احتمال و مرحله قابل تنظیم؛ stage transition history |
| Opportunity | opportunityNumber, accountId, pipelineId, stageId, ownerUserId, amount, currency, expectedCloseAt, status | مبلغ و ارز دقیق؛ لینک به Inquiry/Order فقط با reference معتبر |
| OpportunityStageHistory | opportunityId, fromStageId, toStageId, actorUserId, reason | تاریخچه immutable |
| CRMActivity | type, subject, body, occurredAt, ownerUserId, accountId?, leadId?, opportunityId? | timeline واحد؛ سطح visibility |
| CRMTask | title, assigneeUserId, dueAt, status, priority, related entity | وظایف و پیگیری با اعلان |
| CRMNote | body, visibility, authorUserId, relation | یادداشت داخلی با کنترل محرمانگی |
| CRMFieldAudit | entityType, entityId, action, before/after, actor | audit برای تغییرات تجاری حساس |

### قواعد تبدیل Lead
- تبدیل Lead باید در یک transaction انجام شود: ساخت/اتصال Account، ساخت Contact در صورت نیاز، و ثبت convertedAt/convertedBy.
- تبدیل دوباره همان Lead idempotent باشد و Account تکراری نسازد.
- اگر Company/User موجود match شد، به canonical record لینک شود؛ merge خودکار بر اساس نام مشابه ممنوع.
- ادغام رکوردهای تکراری نیازمند مجوز جداگانه، پیش‌نمایش اثر و audit است.

## 3. چرخه‌های کاری

### Lead
NEW → CONTACTED → QUALIFIED → CONVERTED
- مسیرهای خروج: DISQUALIFIED, DUPLICATE, LOST.
- هر تغییر status باید actor، timestamp و reason اختیاری/اجباری طبق transition ثبت کند.
- امتیاز lead باید rule-based و explainable باشد؛ در MVP ویرایش دستی با ثبت عامل کافی است.

### Opportunity
- مراحل پیشنهادی: DISCOVERY → QUALIFICATION → PROPOSAL → NEGOTIATION → WON / LOST.
- تغییر مرحله، مبلغ، احتمال موفقیت و expected close date در history ثبت شود.
- Opportunity Won به معنی سفارش پرداخت‌شده نیست؛ تحقق درآمد فقط از Retail Order/Inquiry قراردادشده و رویداد مالی مرجع محاسبه می‌شود.
- در صورت اتصال به استعلام، Opportunity به Inquiry ID reference می‌دهد؛ وضعیت Inquiry را مستقیماً تغییر نمی‌دهد.

### Activity و Task
- Activity رویداد انجام‌شده است؛ Task اقدام آینده/باز است. این دو در UI timeline مشترک ولی در مدل جدا می‌مانند.
- Task باید assignee، dueAt، priority، status، completedAt و reminder policy داشته باشد.
- overdue و due-today شاخص dashboard از Taskهای باز محاسبه شود.
- ثبت تماس/جلسه باید duration و outcome اختیاری داشته باشد.

## 4. امنیت و دسترسی

CRM در نسخه اول STAFF-only:
- crm.accounts.read, crm.accounts.create, crm.accounts.update
- crm.leads.read, crm.leads.create, crm.leads.assign, crm.leads.convert
- crm.opportunities.read, crm.opportunities.create, crm.opportunities.update, crm.opportunities.assign, crm.opportunities.close
- crm.activities.read, crm.activities.create
- crm.tasks.read, crm.tasks.create, crm.tasks.assign, crm.tasks.complete
- crm.notes.read_internal, crm.notes.create_internal
- crm.reports.read, crm.export, crm.merge

محدودسازی دسترسی به رکوردهای assigned/team در صورت نیاز با scope جدا پیاده شود؛ SUPER_ADMIN فقط bypass مجوز است و audit همچنان برقرار می‌ماند. اطلاعات تماس و یادداشت‌های محرمانه نباید از endpointهای عمومی Company/Website serialize شوند.

## 5. API پیشنهادی

- GET/POST /api/v1/admin/crm/accounts
- GET/PATCH /api/v1/admin/crm/accounts/:id
- GET/POST /api/v1/admin/crm/leads
- GET/PATCH /api/v1/admin/crm/leads/:id
- POST /api/v1/admin/crm/leads/:id/assign
- POST /api/v1/admin/crm/leads/:id/convert
- GET/POST /api/v1/admin/crm/opportunities
- GET/PATCH /api/v1/admin/crm/opportunities/:id
- POST /api/v1/admin/crm/opportunities/:id/stage
- GET/POST /api/v1/admin/crm/activities
- GET/POST /api/v1/admin/crm/tasks
- POST /api/v1/admin/crm/tasks/:id/complete
- GET /api/v1/admin/crm/dashboard?from=&to=&timezone=

برای آمار dashboard، بازه زمانی و timezone اجباری یا دارای default مستند باشد. currency aggregation فقط برای ارز یکسان انجام شود؛ جمع کردن IRR و ارز دیگر بدون conversion policy ممنوع است.

## 6. شاخص‌های CRM

- تعداد Lead جدید، Qualified، Converted و Disqualified در بازه.
- نرخ تبدیل = Leadهای تبدیل‌شده از cohort ایجادشده در همان بازه / Leadهای واجد شرایط همان cohort؛ صورت و مخرج باید روشن باشد.
- ارزش Pipeline بر اساس stage و currency؛ weighted pipeline = amount × probability، فقط در هر currency جدا.
- فرصت‌های Won/Lost و win rate بر اساس فرصت‌های بسته‌شده در cohort مشخص.
- Taskهای overdue، due today و تکمیل‌شده.
- زمان اولین تماس/اولین فعالیت و زمان تبدیل؛ محاسبه با timezone و حذف موارد test/deleted.
- dashboard هرگز با sample data و API واقعی در یک مجموعه مخلوط نشود.

## 7. سناریوهای پذیرش

1. Lead با Company موجود به Account canonical متصل شود، Company تکراری نسازد.
2. تبدیل هم‌زمان یک Lead از دو درخواست، فقط یک Account/Opportunity بسازد.
3. Company user با دستکاری URL یا API به CRM داخلی دسترسی نداشته باشد.
4. تغییر stage فرصت، history و audit را ثبت کند.
5. Opportunity Won، پرداخت یا تسویه مالی تولید نکند.
6. حذف/غیرفعال‌شدن User مالک، رکوردهای CRM را orphan نکند؛ assignment مجدد طبق policy.
7. اعداد dashboard از endpoint aggregate و بازه زمانی واحد بیایند؛ pagination list منبع KPI کل نباشد.
8. export فقط با مجوز crm.export، audit و محدودیت نرخ انجام شود.

## 8. فازهای اجرایی

| فاز | خروجی |
|---|---|
| C0 | تأیید entity model، pipeline، permissions و ownership |
| C1 | Account/Contact/Lead، dedupe و تبدیل Lead |
| C2 | Pipeline/Opportunity و stage history |
| C3 | Activity/Task، reminder و notification |
| C4 | Dashboard aggregate و گزارش‌ها |
| C5 | اتصال کنترل‌شده به Inquiry، Retail Order و Ticket |

## 9. وضعیت فعلی

صفحات CRM در Admin (overview، leads، pipeline و activities) پیش‌نمایش UI با داده نمونه هستند. در backend هنوز CRMAccount، Lead، Opportunity، Activity یا Task model/API وجود ندارد. این سند قرارداد پیشنهادی C0 است و نباید به‌عنوان پیاده‌سازی فعال تفسیر شود.
