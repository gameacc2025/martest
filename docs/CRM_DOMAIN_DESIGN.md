# طراحی دامنه CRM بازارگاه

**شناسه:** CRM-DOMAIN-01  
**وضعیت:** دامنه پیاده‌سازی‌شده؛ این سند اکنون قرارداد و وضعیت as-built را ثبت می‌کند  
**تاریخ بازبینی:** 2026-11-26

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

## 5. API پیاده‌سازی‌شده

Base path: /api/v1/crm. تمام routeها به احراز هویت و exact STAFF access type محدودند و permissionهای crm.* را در لایه route بررسی می‌کنند.

- Dashboard و منابع: GET /dashboard، GET/POST/PATCH /lead-sources.
- Leads: GET/POST /leads، GET/PATCH /leads/:id، GET /leads/:id/duplicates، GET /leads/:id/timeline، POST /leads/:id/merge، /assign، /status و /convert، و GET /leads/export.
- Accounts/Contacts: GET/POST/PATCH /accounts، GET/POST /accounts/:id/contacts و PATCH /contacts/:id.
- Pipeline/Opportunities: GET/POST/PATCH /pipelines، POST /pipelines/:id/stages، PATCH /pipelines/:id/stages/:stageId، GET/POST /opportunities، PATCH /opportunities/:id و POST /opportunities/:id/stage.
- Tasks/Activities/Notes: GET/POST/PATCH /tasks، POST /tasks/:id/assign و /complete، GET/POST /activities و GET/POST /notes.
- Export فقط با crm.leads.export انجام می‌شود و CSV در برابر formula injection خنثی‌سازی شده است.

UI اصلی در apps/admin/src/pages/admin/crm/CRMWorkspace.vue قرار دارد و از crmApi واقعی استفاده می‌کند؛ این صفحه prototype یا داده نمونه نیست.

## 6. شاخص‌های CRM

- تعداد Lead جدید، Qualified، Converted و Disqualified در بازه.
- نرخ تبدیل = Leadهای تبدیل‌شده از cohort ایجادشده در همان بازه / Leadهای واجد شرایط همان cohort؛ صورت و مخرج باید روشن باشد.
- ارزش Pipeline بر اساس stage و currency؛ weighted pipeline = amount × probability، فقط در هر currency جدا.
- فرصت‌های Won/Lost و win rate بر اساس فرصت‌های بسته‌شده در cohort مشخص.
- Taskهای overdue، due today و تکمیل‌شده.
- زمان اولین تماس/اولین فعالیت و زمان تبدیل؛ محاسبه با timezone و حذف موارد test/deleted.
- dashboard هرگز با sample data و API واقعی در یک مجموعه مخلوط نشود.

## 7. سناریوهای پذیرش

1. Lead به CRMAccount تبدیل می‌شود؛ تطبیق خودکار با Company canonical هنوز فعال نیست و به سیاست روشن تطبیق/رفع ابهام نیاز دارد. تا آن زمان Company تکراری یا اتصال حدسی ساخته نشود.
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

## 9. وضعیت پیاده‌سازی فعلی — 2026-11-26

این دامنه پیاده‌سازی شده و نباید دوباره از ابتدا ساخته شود.

- مدل‌های Prisma فعال: CRMAccount، CRMContact، Lead، LeadStatusHistory، CRMFieldAudit، LeadSource، Pipeline، PipelineStage، Opportunity، OpportunityStageHistory، CRMTask، CRMActivity و CRMNote.
- Backend در backend/src/modules/crm قرار دارد و routeها زیر /api/v1/crm ثبت شده‌اند. دسترسی همه routeهای CRM exact STAFF است؛ هر عملیات permission اختصاصی crm.* دارد.
- چرخه Lead شامل ایجاد، تغییر وضعیت، امتیاز، مالک، timeline، duplicate candidates، merge، conversion به CRMAccount/primary Contact و idempotent replay است.
- merge به‌صورت transaction انجام می‌شود، Activity/Task/Note را منتقل می‌کند، Lead مبدا را DUPLICATE می‌کند و history/field audit می‌نویسد. دلیل آزاد ادغام در LeadStatusHistory داخلی می‌ماند؛ در AuditLog مرکزی فقط شناسه‌ها و نام فیلدهای تغییرکرده ثبت می‌شوند.
- Opportunity/Pipeline/Stage، Account/Contact، Task/assignment/completion، Activity و Note دارای API و mutation audit هستند. Noteهای PRIVATE فقط طبق سیاست author/STAFF قابل مشاهده‌اند.
- Opportunity با وضعیت WON به‌تنهایی سفارش Retail، پرداخت یا تسویه مالی ایجاد نمی‌کند.
- Playwright در e2e/tests/crm-acceptance.spec.js مسیر Lead → conversion → Account/Contact → Opportunity → Task → Activity → Note را اجرا می‌کند.
- backend/scripts/verify-crm-postgres-lifecycle.js در PostgreSQL واقعی رقابت conversion و merge، ایجاد یک Account/primary Contact، انتقال child records و rollback کامل در شکست AuditLog را بررسی می‌کند.

### موارد باز و مرزهای تصمیم

- تطبیق Lead با Company موجود و اتصال canonical باید با قاعده قابل اعتماد (شناسه مالیاتی/شناسه تأییدشده) و سیاست رفع چند تطبیق تعریف شود؛ تطبیق صرفاً بر اساس نام یا ایمیل مجاز فرض نشود.
- تاریخ، timezone، currency و تعریف cohort برای KPIهای CRM باید در قرارداد Dashboard مشخص شوند؛ جمع ارزهای متفاوت ممنوع است.
- Export و permissionهای CRM در تست route/service پوشش دارند؛ پذیرش کامل همه نقش‌ها و تمام صفحات/فیلترها همچنان بخشی از ممیزی گسترده‌تر است.
- اتصال CRM به Inquiry، Retail Order و Support Ticket فقط پس از تثبیت قراردادهای هر دامنه انجام شود.
