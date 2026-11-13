# Remaining Features — Implementation Backlog and Database-First Plan

## آخرین اعتبارسنجی و ممیزی — 2026-11-13

> **کد مبنا:** `main`، commit `0d0a3866c6ff387978f8c5244f6ca936248f508d`. این ممیزی از سورس GitHub و GitHub Actions است. working tree ویندوز، Docker محلی، PostgreSQL محلی، stashها و فایل‌های untracked دستگاه کاربر قابل مشاهده نیستند و NOT VERIFIED باقی می‌مانند.

### نتایج قابل استناد

| کنترل | نتیجه | اجرای GitHub Actions |
|---|---|---|
| CI | PASS — frozen install، architecture graph، Frontend/Shared tests، Prisma Client، Backend tests و build هر سه اپ | [43474183592](https://github.com/gameacc2025/martest/actions/runs/43474183592) |
| Migration Validation | PASS — اعمال همه migrationها روی PostgreSQL تازه و بررسی وضعیت migration | [43474183157](https://github.com/gameacc2025/martest/actions/runs/43474183157) |
| Runtime Validation | PASS — Compose، سلامت Backend و سه پنل، migration status، اجرای seedها دو بار، Chromium و Playwright | [43474183935](https://github.com/gameacc2025/martest/actions/runs/43474183935) |
| Browser acceptance | PASS — 8/8 تست؛ ورود STAFF و PKCE handoff، CRM Leads، ایجاد تیکت و ارسال پاسخ، render/proxy سه پنل و viewportهای storefront | همان Runtime بالا |

### وضعیت واقعی دامنه‌ها

| دامنه | وضعیت سورس و شواهد | نتیجه |
|---|---|---|
| هسته بازارگاه، شرکت، کاتالوگ، محصول و B2B Inquiry/RFQ | مدل، API، UI و تست‌های اصلی وجود دارند؛ CI و Runtime سبز | پیاده‌سازی‌شده در سورس؛ تست‌های عمیق tenant/IDOR و مرورگری بیشتر لازم است |
| Auth/Session/PKCE | login، refresh، logout، session management و handoff موجود؛ browser handoff سبز | هسته پیاده‌سازی‌شده |
| Account Recovery | routeهای عمومی forgot/reset، OTP hash، rate limit، expiry، attempt limit، single-use و ابطال session وجود دارند | پیاده‌سازی در سورس؛ تحویل واقعی SMS و reset E2E تأیید نشده |
| Audit | مدل و API خواندن/آمار/export و route inventory موجود | پوشش کامل eventها، redaction و retention باقی است |
| CMS | Article/Category/Tag/Revision/Media و مدل‌های Faq/Page، migration، service/routes و seed وجود دارند؛ seed/runtime سبز | پیاده‌سازی در سورس؛ CRUD عمومی/ادمین، permission و browser E2E اختصاصی هنوز باید پذیرفته شوند |
| CRM | routes/services، API client، seed و Admin UI متصل؛ schema و validation برای lead create/update/assign/status/merge؛ service tests؛ Playwright مشاهده Leads | PARTIAL؛ schema و functional/permission/tenant tests برای سایر endpointها و E2E mutationها باقی است |
| Support | migration/schema، module و route registration، service، RBAC، API client، workspace مشترک در Website/Company/Admin و seed وجود دارند؛ E2E ایجاد تیکت و پاسخ سبز | PARTIAL operational vertical slice؛ attachment امن، notification، SLA worker/calendar، صف‌بندی/assignment کامل و تست‌های جامع باقی است |
| Notifications | inbox/folders/preferences و email/in-app موجود؛ adapter پیامک موجود | dispatcher عمومی SMS به outbox/retry/consent/quota/idempotency متصل نیست |
| Retail/Inventory/Orders/Payments/Returns | مدل و migration DB وجود دارد؛ checkout/payment API عملیاتی کامل نیست | HOLD تا تصمیم تجاری مالک؛ checkout فعال نشود |
| Finance/Settlement | مدل‌های ledger/commission/settlement موجود؛ posting/payout/reconciliation عملیاتی کامل نیست | HOLD تا تصمیم Retail و قواعد مالی/حقوقی |
| Dashboards/Reports | Admin عمدتاً API-backed؛ بعضی Company/Settlement/Operations ارقام نمونه دارند | ناقص؛ KPI نمونه حذف یا Demo برچسب‌گذاری و aggregate واقعی اضافه شود |
| Design System | palette جدید در سه app؛ build و viewport smoke سبز | بررسی بصری، RTL و accessibility کامل هنوز انجام نشده |

### تغییرات و یافته‌های تازه

1. **CI regression:** یک assertion قدیمی در `backend/src/app.test.js` تعداد routeها را 256 انتظار داشت، در حالی که inventory واقعی 264 مسیر داشت. مقدار به 264 اصلاح شد؛ CI جدید سبز است.
2. **SLA پشتیبانی:** seed سیاست‌های SLA را برای دسته‌بندی‌ها می‌سازد، اما تیکت بدون category قبلاً policy متناظر نداشت و deadline دریافت نمی‌کرد. `getSla` اکنون پس از جست‌وجوی category-specific و global، policy فعال همان priority را fallback می‌کند. دو تست برای fallback و precedence اضافه شد؛ CI و Runtime جدید سبز شدند.
3. **Support acceptance:** Runtime دو بار seed را اجرا کرد و هر بار 5 دسته، 3 صف و 20 سیاست SLA را گزارش کرد. Playwright با STAFF وارد Admin شد، تیکت ایجاد کرد و پاسخ را در مکالمه دید. این شواهد upload/download پیوست، اعلان، worker SLA یا isolation کامل صف‌ها را اثبات نمی‌کند.
4. **CRM acceptance:** browser flow ورود و مشاهده Leads را تأیید می‌کند، نه چرخه کامل create/update/assign/status/convert/merge. routeهای غیر Lead هنوز schema و functional coverage یکسان ندارند.
5. **CMS/Recovery:** مدل‌ها، migrationها، routeها و seedها در سورس موجودند و Runtime سبز است؛ این امر جایگزین تست مرورگری CRUD و تأیید credential/provider واقعی SMS نیست.
6. **Local state:** هیچ reset/clean/force push، حذف volume یا تغییر دیتابیس محلی انجام نشده است. وضعیت local HEAD، تغییرات unstaged، stashها و untrackedها نامعلوم است.

### اولویت اجرایی بعدی

| اولویت | کار | معیار خروج |
|---|---|---|
| **P0** | CI، migration، Runtime و seed | **PASS** روی commit بالا؛ هر تغییر بعدی باید همین سه workflow را دوباره سبز کند |
| **P1-1** | CRM acceptance | schema تمام endpointها، CRUD/service tests، permission و STAFF isolation، conversion/merge idempotency، Playwright create/update/assign/status |
| **P1-2** | Support completion | attachment upload/download خصوصی و مجوزمحور، notification eventها، SLA calendar/worker/escalation/metrics، queue-level access، assignment کارشناس، pagination و تست‌های service/tenant/E2E |
| **P1-3** | CMS/Recovery acceptance | FAQ/Page CRUD عمومی و ادمین، permission matrix، reset-password E2E و SMS واقعی در staging |
| **P1-4** | Audit و Notification | event matrix، redaction/retention، generic SMS outbox با retry/idempotency/consent/quota |
| **P1-5** | داشبورد واقعی | aggregate API tenant/date/currency-scoped؛ حذف یا برچسب‌گذاری تمام ارقام نمونه |
| **P1-6** | Regression سه اپ | feature-level journeys، RTL، keyboard/accessibility و visual QA |
| **P2** | Retail و Finance | فقط پس از تصمیم صریح مالک درباره B2C، ارز، مالیات، پرداخت، کمیسیون، مرجوعی و payout |
| **P3** | ماژول‌های سازمانی آینده | فقط با scope و تأیید مالک |

### محدودیت شواهد

- GitHub Actions روی محیط disposable اجرا شده؛ این PASS به معنی اجرای Docker/PostgreSQL روی Windows کاربر نیست.
- SMS واقعی، payment provider، visual QA دستی و دیتابیس محلی هنوز تأیید نشده‌اند.
- شاخه canonical فقط `main` است؛ هیچ branch/worktree/PR جدیدی ایجاد نشود.


---

**Document ID:** REMAINING-FEATURES-01  
**Status:** Source-backed planning baseline; not an implementation claim  
**Last reviewed:** 2026-11-13  
**Canonical branch:** `main`

> This document reconciles the current implementation with the existing domain designs. It is intentionally written in English for coding agents. A feature listed here is not considered implemented merely because a route, menu item, UI prototype, API-client constant, or design document exists.

## 1. Executive summary

The marketplace core is already substantial. The current Prisma schema contains 42 models and 21 enums covering identity/RBAC, companies, product catalog and lifecycle, pricing history, B2B inquiries and supplier responses, inquiry subscriptions/quotas, notifications, customer addresses, settings and banners.

The remaining work is not a rewrite of that core. It is the completion of several adjacent domains and the operationalization of existing UI prototypes:

1. Platform foundation and documentation/contract reconciliation.
2. Password recovery and account-verification flows.
3. Support and ticketing.
4. Editorial CMS for the magazine/news area.
5. Real aggregate dashboards and operational reporting.
6. Retail inventory, orders, payments, fulfillment and returns — gated by the unresolved B2C activation decision.
7. Marketplace finance, ledger, commissions and seller settlements — dependent on retail/payment business rules.
8. Internal CRM — STAFF-only in its first release.
9. Longer-term enterprise modules (procurement, HR, projects, advanced warehouse/logistics, documents/assets, BI and integrations) — explicitly deferred until business requirements are approved.

**Recommended principle:** complete the database design for the approved near-term domains first, using separate additive migrations per bounded context. Then implement real APIs and finally connect each UI area. Do not create one enormous migration for every long-term enterprise idea.

## 2. Status definitions

- **IMPLEMENTED:** persisted model + real backend behavior/API + authorization and tests exist. Verify current source before changing it.
- **PARTIAL:** some real behavior exists, but the end-to-end capability is incomplete.
- **PROTOTYPE:** UI/navigation exists, but it uses sample data or has no operational API/domain model.
- **LEGACY / DRIFT:** stale endpoint constants, old pages/stores or documentation that must not be treated as a live contract.
- **DEFERRED:** intentionally frozen or outside the approved current scope.
- **PROPOSED:** recommended capability; requires product approval before schema implementation.

## 3. Implemented core — do not rebuild

| Domain | Current implementation evidence | Backlog treatment |
|---|---|---|
| Identity and access | User, Profile, AccessProfile, Role, Permission, RolePermission, UserRole, refresh tokens, PKCE handoff; strict STAFF / COMPANY / CUSTOMER contexts | Preserve; only add missing account-recovery lifecycle |
| Company management | Company profile/status/verification, company users and limits | Preserve; extend only for a confirmed requirement |
| Product catalog | Category/subcategory, specification templates/library, Product, media/documents, approval/publication lifecycle, activity/status history | Preserve |
| Pricing | ProductPriceTier and ProductPriceSnapshot; retail price history is separate from wholesale tiers | Preserve; retail checkout must use a server-side price resolver |
| B2B RFQ | Inquiry, items, status history, response/items/attachments, messages, visibility modes and ownership rules | Core business capability; stabilize and extend only from real gaps |
| Inquiry monetization | InquiryPlan, InquirySubscription, InquiryUsageEvent, CompanyLimit and legacy CompanyInquiryLimit | Preserve; audit payment/renewal integration separately if needed |
| Notifications | Notification, folders/membership, preferences, delivery records; existing in-app/email and selected inquiry-message SMS flows | Preserve schema; complete provider/event coverage only where required |
| Customer address book | Address with customer ownership and default-address constraint | Preserve; retail orders need immutable address snapshots |
| Platform settings and banners | SystemSetting and Banner domain | Preserve |

## 4. Remaining work — prioritized backlog

### P0 — Platform foundation and contract reconciliation

These are prerequisites for reliable domain expansion, not new customer-facing modules.

#### P0.1 — Reconcile schema, migration history and database documentation
- Compare the complete Prisma schema with every SQL migration and the actual migration directory.
- Reconcile `docs/DATABASE_DOCUMENTATION.md` with the current baseline and incremental migrations. The document currently describes an older address migration history; the current repository audit identified a consolidated baseline, so this must be checked against the actual tree before any new migration.
- Preserve SQL-only constraints, partial unique indexes, triggers and CHECK constraints that Prisma schema cannot fully represent.
- Validate both a fresh database and an anonymized representative upgrade path.
- Never use `db push` as a substitute for migration history.

**Database output:** no new business tables until drift is reconciled; then a verified migration baseline for all later work.

#### P0.2 — Reconcile registered API routes and the API client
- Regenerate `docs/API_ROUTE_INVENTORY.md` from actual Fastify registrations; its header says it was generated on 2026-11-03.
- Compare every entry in `packages/api-client/endpoints.js` against registered routes and actual request/response contracts.
- Explicitly quarantine stale paths for password recovery, orders, invoices, dashboard, uploads, company search/preferences and any other legacy definitions. Do not delete an endpoint constant until its consumers are traced.
- Preserve the existing custom API-client architecture; do not introduce a second HTTP convention or refactor the two existing clients without a separate decision.

**Output:** one accurate route inventory and a parity report identifying live, missing and deprecated client contracts.

#### P0.3 — Restore and protect the quality gates
- Fix known frontend test regressions and browser-smoke failures recorded in the latest audit before treating the repository as a stable foundation.
- Re-run backend tests, frontend/shared tests, all three builds and migration validation after fixes.
- Add tenant-isolation and permission regression coverage for every new domain.
- Browser checks remain subject to the owner's current testing authorization.

#### P0.4 — Cross-domain audit trail (PROPOSED, strongly recommended)
مدل AuditLog، سرویس و routeهای خواندن/آمار/خروجی در شاخه فعلی وجود دارند. آنچه هنوز تأیید نشده، پوشش کامل ثبت رویداد در همه دامنه‌ها، سیاست نگهداری/حذف، redaction و دسترسی عملیاتی به لاگ‌هاست.

Proposed minimum:
- AuditLog: actorUserId, actorAccessType, action, entityType/entityId, company/tenant scope where applicable, occurredAt, request/correlation ID, source, outcome and a sanitized metadata/diff payload.
- Append-only semantics; no ordinary update/delete API.
- Explicit redaction and retention rules. Never store passwords, tokens, full payment credentials or unbounded sensitive payloads.
- Keep domain-specific histories (InquiryStatusHistory, ProductStatusHistory, OpportunityStageHistory, etc.) as the authoritative state-machine record; the generic log is a cross-domain security/operations trail, not a replacement.

Approval is required before deciding the exact payload and retention policy.

### P1 — Account recovery and verification

**وضعیت ممیزی 2026-11-13:** routeهای عمومی `/auth/forgot-password` و `/auth/reset-password` به سرویس بازیابی رمز متصل‌اند. OTP به‌صورت hash ذخیره می‌شود، محدودیت درخواست/انقضا/سقف تلاش و مصرف single-use وجود دارد و sessionهای قبلی پس از reset باطل می‌شوند. هنوز ارسال واقعی از SMS provider و مسیر کامل reset در مرورگر تأیید نشده است.

**Database design:**
- Prefer one reusable AuthChallenge / VerificationChallenge model with a purpose enum (PASSWORD_RESET, PHONE_VERIFICATION, EMAIL_VERIFICATION), destination, hashed one-time secret/OTP, expiry, consumedAt, attemptCount, createdAt and minimal delivery metadata.
- Store only a hash of the token/OTP, never the raw secret.
- Add rate-limit/abuse controls and an explicit invalidation policy for older challenges.
- Do not add email-verification as mandatory without deciding whether email is optional or required; current identity/login is phone-centric.

**API/UI after DB:**
- Public request and confirmation endpoints; generic responses that do not reveal whether a phone/email exists.
- Secure notification delivery through the configured provider; single-use, expiring challenge; throttling and audit.
- Complete Website and panel handoff/reset screens against the real contract.

**Open decision:** Is recovery phone OTP, email link, or both? The data model can support both, but the first released channel must match configured providers and operational policy.

### P1 — Support and ticketing

**وضعیت ممیزی 2026-11-13:** Support از حالت DB-only خارج شده است: `backend/src/modules/support` ثبت شده، service و routeهای category/ticket/message/status/assignment/queue وجود دارند، API client و `TicketDeskWorkspace` به سه اپ متصل‌اند و Playwright ایجاد تیکت و پاسخ را تأیید می‌کند. بااین‌حال attachment upload/download خصوصی، notification، SLA worker/calendar، queue-level scope و assignment کامل کارشناس هنوز وجود ندارد یا پذیرش نشده است؛ بنابراین دامنه PARTIAL است.

**Database design (detailed source: `docs/SUPPORT_TICKETING_DOMAIN_DESIGN.md`):**
- SupportTicket
- SupportMessage
- SupportAttachment
- SupportQueue
- SupportAssignment
- SupportStatusHistory
- SupportCategory
- SupportSlaPolicy
- SupportEvent (only if required for reliable event processing/reporting)

**Important rules:**
- CUSTOMER sees only tickets created by that user.
- COMPANY sees only tickets scoped to its active AccessProfile company.
- STAFF sees only queues/records allowed by explicit permissions.
- PUBLIC messages and STAFF-only INTERNAL notes must be separate visibility paths.
- Attachments must be private and downloaded through authorization-checked endpoints.
- Status changes are command-based and recorded in history; no unrestricted status PATCH.
- SLA pause/resume and first-response calculations must be auditable.
- Link tickets to Inquiry and Retail Order only when those target domains exist; do not use unvalidated arbitrary IDs as permanent relations.

**API/UI sequence:** customer/company ticket CRUD and messages → STAFF queues/assignment/internal notes → attachments and notifications → SLA worker/metrics → replace all sample data in the three apps.

### P1 — Editorial CMS for Magazine / News

**وضعیت ممیزی 2026-11-13:** مدل‌های مستقل `Faq` و `Page`، migration بازیابی، services/routes و seed متناظر در سورس موجودند؛ CI و Runtime/seed سبز است. یافته قدیمی نبودن مدل‌ها دیگر معتبر نیست. هنوز تست اختصاصی CRUD عمومی/ادمین، permission و Playwright برای FAQ/Page لازم است.

**Recommended database domain:**
- Article: slug, title, excerpt, body/content format, cover media, author, status, content type, publishedAt, scheduledAt, createdAt/updatedAt.
- ArticleCategory and ArticleTag (many-to-many).
- ArticleRevision: immutable or versioned draft history, editor and timestamp.
- ArticleMedia: safe references to managed media, alt text and metadata.
- Optional ArticleAuthor relation to existing User/Profile; do not duplicate identity.
- SEO metadata: meta title/description, canonical URL and indexability.
- Content type/audience should allow future Help Center articles only if editorial and support ownership rules are intentionally shared.

**Workflow:** DRAFT → IN_REVIEW (optional) → SCHEDULED / PUBLISHED → ARCHIVED. Only authorized STAFF can create/review/publish. Public API returns only published content.

**API/UI sequence:** public article list/detail/search/category APIs → Admin create/edit/preview/publish/schedule → Website replaces static data with API content.

### P1 — Real dashboards and reporting

**Current state:** Admin has some real aggregate statistics; Company dashboard mixes live product/inquiry data with sample sales-style metrics. Some list KPI chips are calculated from the currently loaded page, not from platform-wide aggregates. No Retail or Finance metrics are real before those domains exist.

**Database recommendation:** do not create duplicated KPI tables as the first solution. Build authorized aggregate queries over the canonical domain tables and return:
- Explicit date range and timezone.
- Explicit unit/currency and aggregation rules.
- Tenant-scoped Company metrics versus STAFF platform metrics.
- Pagination-independent totals.
- Clear definitions for conversion, response rate, response time, product lifecycle and active company counts.

Add a persisted reporting snapshot/event store only when measured query cost or historical point-in-time reporting requires it. Never label a current-page count as a global KPI.

### P2 — Retail inventory and B2C commerce (GATED)

**وضعیت ممیزی 2026-11-13:** مدل‌ها و migrationهای Inventory/Order/Payment/Shipment/Return در Prisma وجود دارند، اما route/service بک‌اند و API client عملیاتی برای `/retail/*` وجود ندارد؛ تعریف `/orders` در API client legacy/deprecated است. سبد فقط localStorage است و ثبت checkout غیرفعال مانده. دکمه افزودن به سبد در برخی بخش‌های Home برای محصول retail فعال است، اما صرفاً cart محلی را تغییر می‌دهد؛ این رفتار با یادداشت ایمنی UI درباره غیرفعال بودن CTA فروش خرده‌فروشی باید یکسان‌سازی شود.

**Critical architecture conflict:** AD-4 in `.ai/decisions.md` freezes Cart / Checkout / Orders / Wishlist as dormant, while the current Website router registers `/cart`, `/checkout` and `/orders`. The routes/UI do not prove commerce is approved. Resolve this explicitly before enabling retail actions. Until then, keep checkout, payment, reservation and order actions disabled and clearly label previews.

**R1 — Retail eligibility and inventory**
- InventoryBalance (MVP one balance per product; warehouse dimension deferred)
- InventoryMovement (append-only stock ledger with actor/reason/source)
- InventoryReservation (quantity, expiry, status, order/checkout reference)
- Server-side eligibility resolver: Product PUBLISHED + PUBLIC + retailEnabled; seller Company ACTIVE and not deleted; current valid retail price tier with minQuantity=1; available stock greater than zero.
- Start stock at zero. No implicit unlimited stock. No negative available stock.
- Atomic reserve/release/consume operations and concurrency tests.
- Explicit stock adjustment permissions and audit.

**R2 — Cart, checkout and order snapshots**
- Cart / CartItem only if persistent cross-device carts are required; otherwise local cart may remain a disposable client convenience.
- Order, OrderItem, SellerOrder.
- OrderAddressSnapshot and seller/product/price snapshots; order history must not change when catalog/address data changes.
- Idempotency key for checkout and protection against duplicate submissions.
- One currency per checkout in MVP; multi-seller checkout creates one Order and one SellerOrder per seller.

**R3 — Payments**
- PaymentAttempt
- PaymentTransaction
- PaymentWebhookEvent (verified signature, replay protection, unique provider event/transaction IDs)
- Refund / RefundItem (full and partial)
- Provider adapter and server-to-server verification. Never store card number, CVV or raw card data.

**R4 — Fulfillment, shipping and returns**
- Shipment and TrackingEvent
- ReturnRequest and ReturnItem
- Delivery confirmation, seller acceptance/rejection, cancellation and return-window rules.
- Inventory movement and financial reversal must be transactionally consistent.

**Activation rules:** no real checkout before server-side eligibility, stock reservation, immutable snapshots, payment verification, idempotency, refund/reconciliation and security tests are ready.

**Existing detailed contract:** `docs/RETAIL_COMMERCE_AND_SETTLEMENT_DESIGN.md` and `docs/RETAIL_COMMERCE_R1_AUDIT.md`.

### P2 — Marketplace finance and seller settlements (DEPENDENT ON RETAIL)

**وضعیت ممیزی 2026-11-13:** مدل‌های Ledger/Journal/Commission/Payable/Settlement/Payout و migration آن‌ها در Prisma وجود دارند، اما route/service/API-client عملیاتی برای Finance یا Settlement در بک‌اند ثبت نشده است. صفحه Company Settlements و بخش‌های مالی/سفارش در Operations Hub داده نمونه نمایش می‌دهند. بنابراین DB foundation موجود است؛ فرآیند مالی واقعی وجود ندارد و همچنان به تصمیم‌های تجاری/حقوقی و تکمیل Retail وابسته است.

**Recommended database domain (detailed source: Retail/Settlement design):**
- LedgerAccount
- JournalEntry and JournalLine (double-entry, balanced per currency, immutable after posting)
- CommissionRule and CommissionSnapshot
- SellerPayable
- Settlement and SettlementApproval
- Payout / SettlementPayout
- ReconciliationRecord
- Invoice / InvoiceLine (only after deciding legal document and tax requirements)
- Optional FinancePeriod / AccountingPeriod when period-close requirements are defined.

**Non-negotiable controls:**
- Do not use a mutable Company.balance as the source of truth.
- Every posted journal entry balances debit and credit per currency.
- Corrections use reversal/adjustment entries; posted entries are not edited or deleted.
- Commission is snapshotted at order time.
- Settlement eligibility depends on fulfillment, returns, disputes and hold policy.
- Separate maker/checker approval from payout execution.
- Idempotent provider/bank callbacks and reconciliation.
- Currency, rounding, tax, gateway fee and legal invoice policy must be decided before migration.

**Dependency:** Order + Payment + Shipment/Return lifecycle and the commercial commission policy. Do not implement seller payouts ahead of a trustworthy ledger.

### P2 — Internal CRM (STAFF-only MVP)

**وضعیت ممیزی 2026-11-13:** مدل‌های CRM، route/service، API client، seed و Admin `CRMWorkspace.vue` متصل به API وجود دارند؛ بنابراین توصیف Prototype-only قدیمی دیگر درست نیست. بااین‌حال پذیرش کامل نشده: `crm.routes.test.js` فقط چهار سناریوی رد دسترسی را پوشش می‌دهد، routeها schemaهای Fastify برای body/query/params ندارند و E2E واقعی CRM در `e2e/tests` وجود ندارد. Activities/Notes نیز در API فعلی عمدتاً create/list هستند. وضعیت: IMPLEMENTED IN SOURCE / ACCEPTANCE NOT VERIFIED.

**Database design (detailed source: `docs/CRM_DOMAIN_DESIGN.md`):**
- CRMAccount — canonical optional link to existing Company/User; do not create a duplicate identity.
- CRMContact — contact people and roles linked to Account and optionally User.
- Lead and LeadSource — capture, ownership, scoring and conversion lifecycle.
- Pipeline and PipelineStage.
- Opportunity and OpportunityStageHistory.
- CRMActivity — completed interactions/timeline.
- CRMTask — future actions, due dates, assignment and reminders.
- CRMNote — visibility-controlled internal notes.
- CRMFieldAudit or the shared AuditLog where sufficient; avoid duplicate audit mechanisms.

**Rules:** first release is STAFF-only; Lead conversion must be transactional/idempotent; deduplication and merges require explicit policy/audit; Opportunity WON does not itself mean paid revenue; currency aggregation must never mix currencies.

**Dependencies:** canonical User/Company identity, shared audit strategy and notification/task reminders. Links to Inquiry, Ticket and Retail Order are added only when target contracts exist.

### P3 — Additional marketplace and enterprise domains (DEFERRED)

These are in the long-term product blueprint, but should not be included in the first database batch without a concrete owner-approved use case and scope.

| Domain | Future capabilities | Suggested prerequisite |
|---|---|---|
| Procurement | Purchase requests, purchase orders, supplier quotations, approvals | Confirm internal purchasing workflow; distinguish internal procurement from customer RFQ |
| Multi-warehouse | Warehouses, bins, transfers, cycle counts, serialized/batch stock | Validate warehouse/location needs after single-product inventory MVP |
| Advanced logistics | Carrier accounts, shipping rates, labels, reverse logistics, delivery exceptions | Complete basic Shipment/TrackingEvent first |
| HR | Employee records, departments, positions, contracts, leave, attendance, payroll | Separate HR identity/permissions and legal/payroll requirements |
| Projects and workflow | Projects, milestones, tasks, approvals, workflow definitions/executions | Define internal operating model and ownership |
| Document management | Folders, versions, access policies, retention, signatures | Define storage provider, retention and legal requirements |
| Asset management | Company assets, assignment, maintenance and lifecycle | Define asset ownership and inventory boundary |
| Marketing automation | Campaigns, audience segments, consent, suppression, delivery and attribution | Consent/privacy policy and provider limits |
| Knowledge base | Public/private help articles and feedback | Can reuse CMS only after editorial/support ownership is agreed |
| BI/report builder | Saved reports, scheduled exports, governed datasets | Stable domain aggregates, field-level permissions and audit |
| Integrations | API credentials, webhooks, ERP/CRM connectors and delivery logs | Secret storage, rotation, signature, retries and scopes |
| Security/compliance | Data retention, consent records, access reviews and incident workflows | Jurisdiction and compliance requirements |

Wishlist/favorites are also deferred under AD-4. A persistent FavoriteProduct model should be added only after the owner explicitly reactivates the feature and confirms CUSTOMER-only semantics.

## 5. Recommended database-first implementation order

The database stage should produce a coherent, reviewed schema for approved near-term domains, but each bounded context must have its own additive migration and rollback/forward-fix plan.

| DB batch | Scope | Main dependencies | Exit criteria |
|---|---|---|---|
| DB-0 | Migration/schema/doc reconciliation; API route/client parity; agree audit and idempotency conventions | Current source only | Fresh DB + upgrade path validated; no undocumented SQL constraints lost |
| DB-1 | AuthChallenge + cross-domain AuditLog (if approved) | Existing User, notification delivery, security policy | Hash-only one-time challenges; retention/redaction policy; append-only audit |
| DB-2 | Support ticketing | User, AccessProfile, Company, Notification | Complete relations, state history, queue/SLA ownership and private attachment metadata |
| DB-3 | Editorial CMS | User/Profile, media storage convention | Draft/revision/publish/schedule model, public-safe projection and indexes |
| DB-4 | CRM | User, Company, audit, notification/task conventions | Canonical links, Lead conversion constraints, pipeline history, activities/tasks |
| DB-5 | Retail inventory + order + payment + fulfillment + return | Product, Company, PriceTier, Address; business activation decision | Atomic inventory, immutable snapshots, idempotent payment events, lifecycle and refund model |
| DB-6 | Finance ledger + commission + seller payable + settlement | Retail order/payment/shipment/return; currency and legal policy | Balanced immutable ledger, maker-checker, payout and reconciliation constraints |
| DB-7 | Optional enterprise domains | Approved requirements per module | Separate domain design and migration plan; no speculative mega-schema |

**Suggested sequencing adjustment:** DB-5 and DB-6 are one business program but not one migration. Inventory/order/payment must exist before finance can derive reliable seller payables; finance ledger can be designed in parallel but should be migrated/activated against settled event contracts.

## 6. API and UI stage after the database stage

Do not implement guessed endpoints while the schema is still changing. After DB-0 through the approved domain batches are reviewed:

1. Implement API contracts and services one bounded context at a time.
2. Add server-side RBAC, AccessProfile boundary, tenant ownership, validation, idempotency and audit before exposing routes.
3. Add API-client methods only for routes that are actually registered and tested.
4. Replace prototype sample data with real loading/empty/error/permission states.
5. Run domain tests, migration tests, tenant-isolation tests, app builds and approved workflow checks.
6. Remove sample-data labels only after the entire workflow is operational and verified.

Recommended API/UI order:
- Account recovery.
- Support ticketing.
- CMS.
- Real dashboard aggregates.
- CRM.
- Retail inventory → orders → payments → fulfillment/returns.
- Finance/settlement UI after ledger and payout APIs are verified.
- Deferred enterprise modules only after separate approval.

## 7. Open product and architecture decisions

These decisions must remain OPEN until the owner confirms them. Do not infer an answer from a prototype.

### Required before retail database activation
1. Is B2C retail being launched now, or should RFQ remain the only live commercial flow for this release? This explicitly revisits AD-4.
2. Which payment provider and settlement/banking mechanism are supported in the target market?
3. Which currency is canonical in storage and API (IRR, toman display, or another currency)? Define precision and rounding.
4. Is the marketplace merchant of record, an intermediary, or only a lead/referral platform? This changes payment, tax and liability design.
5. Who ships goods — seller, marketplace or carrier — and who bears loss/damage cost?
6. What are seller acceptance, shipping, delivery, cancellation and return windows?
7. What commission model applies (percentage, fixed, tiered, category-specific, or negotiated)? Who pays gateway fees, discounts, tax and shipping?
8. Is multi-seller checkout required in the first release?
9. Are stock quantities integer-only for MVP? Is one balance per product sufficient, or are warehouse/location dimensions immediately required?

### Required before support/CMS/CRM
10. Support SLA working calendar, holidays, queues and assignment policy.
11. Which staff roles may read internal notes, export tickets and manage attachments?
12. Who can author/review/publish magazine content, and is scheduled publication required?
13. Is the magazine expected to support multiple languages, authors, revisions and editorial approval?
14. Is CRM strictly internal STAFF-only for the first release? Which teams own accounts/leads?
15. What are the lead sources, deduplication rules, default pipeline stages and currencies?

### Cross-cutting
16. Which password recovery channel is operationally supported (SMS OTP, email link, or both)?
17. Audit retention duration, access, export and redaction requirements.
18. Which external providers are actually configured and monitored (SMTP, SMS, payment, file/object storage)?

## 8. Explicit exclusions for the first implementation wave

Unless the owner changes scope, do not add these to the first schema wave:
- Full HR/payroll, procurement, project management, workflow builder, asset management and broad ERP.
- Advanced multi-warehouse, serial/batch tracking and carrier-rate shopping.
- Marketing automation, loyalty, survey engine and full BI/report builder.
- Wishlist/favorites while AD-4 remains frozen.
- A second identity system or duplicate Company/User records.
- Generic mutable balances in place of a ledger.
- Speculative tables for features with no confirmed workflow or owner.

## 9. Definition of ready for the first database implementation

Before writing the first business migration:
- [ ] Confirm current main revision and clean working state.
- [ ] Reconcile the actual migration tree against Prisma schema and database docs.
- [ ] Resolve or explicitly preserve the AD-4 retail freeze.
- [ ] Approve the near-term modules to include in the database wave.
- [ ] Review entity diagrams, field definitions, ownership, delete behavior, indexes, unique constraints and state machines.
- [ ] Define tenant scope, permissions, audit, retention and privacy for every model.
- [ ] Define seed behavior and backward compatibility for existing data.
- [ ] Prepare migration validation on fresh and representative existing PostgreSQL databases.
- [ ] Keep each domain in a separate additive migration; never reset or rebuild production data.

## 10. Existing domain design references

These documents contain deeper contracts and should be updated rather than duplicated when a decision or implementation changes:

- `docs/FUTURE_MODULES_BLUEPRINT.md` — long-term module taxonomy and activation policy.
- `docs/OPERATIONS_UI_ROADMAP.md` — current prototype inventory and operationalization phases.
- `docs/SUPPORT_TICKETING_DOMAIN_DESIGN.md` — support entity model, SLA, permissions and API contract.
- `docs/CRM_DOMAIN_DESIGN.md` — CRM entities, lifecycle, permissions and API contract.
- `docs/RETAIL_COMMERCE_AND_SETTLEMENT_DESIGN.md` — retail, payments, returns, ledger and settlements.
- `docs/RETAIL_COMMERCE_R1_AUDIT.md` — retail eligibility and inventory prerequisites.
- `docs/WEBSITE_CART_CHECKOUT_STATUS.md` — current local cart and disabled checkout behavior.
- `docs/DATABASE_DOCUMENTATION.md` — schema and migration reference; reconcile before the next migration.
- `docs/API_ROUTE_INVENTORY.md` and `packages/api-client/endpoints.js` — registered route/client parity.

---

**Current recommendation:** do not start by adding every table from the enterprise blueprint. First finish DB-0, then implement the approved operational domains (Support, CMS, account recovery and CRM) as bounded contexts. Treat Retail + Finance as a gated, policy-heavy program. Once the owner approves the database scope, finish the database layer in that order; only then proceed to API and UI work.


## 2026-11-08 implementation update — DB-0 through DB-6 schema stage

**Status:** Implemented in the database branch; pending Prisma/CI execution and review before merge. This is not an API/UI completion claim.

- DB-0 migration-tree reconciliation: the actual tree contains the consolidated `20261106000000_init` baseline (not the obsolete standalone address migration referenced by older documentation). The baseline already includes Address, its default-address partial unique index, inquiry ownership CHECK constraints and the notification INBOX trigger. A migration runbook now records the baseline requirement and deployment procedure.
- DB-1 through DB-6 add 55 Prisma models and 37 enums: account challenges/audit, support, CMS, CRM, retail inventory/order/payment/fulfillment/returns, and finance ledger/settlement.
- Total Prisma schema after the change: 97 models and 58 enums.
- Six additive migrations are timestamp-ordered from `20261108000100_auth_audit` through `20261108000600_finance`.
- No existing model/table was removed or renamed; no existing data backfill was introduced.
- Retail and finance tables are storage foundations only. AD-4 remains in force: no active cart/checkout/order/payment API or public commerce action is introduced. Retail currency is required at order creation rather than silently defaulted.
- No API routes, API-client methods, permissions, workers, seeds or UI workflows were implemented in this database-only stage.
- Static repository-side checks confirmed 97 models/58 enums, 55 new tables, 37 new enum types, all expected relation FK targets, and database defaults for all new `@default(now())` fields. Prisma validation, migration execution against PostgreSQL, tests and builds remain pending CI/runtime verification.

**Runbook:** `docs/DATABASE_MIGRATION_RUNBOOK.md`.  
**Schema reference:** `docs/DATABASE_DOCUMENTATION.md`.

**Next:** run Prisma schema validation, fresh-database migration validation and backend regression tests; fix all migration/schema errors before merging. Then proceed to API implementation in the same domain order.


### Database hardening follow-up
- Added a partial unique index allowing only one unconsumed, non-invalidated AuthChallenge per user/purpose/channel; the issuing API must invalidate the previous challenge transactionally.
- Added SupportAssignment invariants: every assignment needs a queue or assignee, and a ticket can have at most one open assignment.
- Prisma schema validation and Client generation passed on the first CI attempt. Fresh-database migration execution then exposed a composite unique-key ordering/definition issue in DB-4; it was corrected by creating the referenced composite unique constraint before the FK. The next CI attempt exposed a dollar-quote delimiter typo in the DB-6 journal immutability function; this is corrected in the current branch revision and the full migration run is being repeated.

## Final verification — 2026-11-08

**Database migration validation: PASS**
- Prisma 7.10.1 schema validation: passed.
- Prisma Client generation: passed.
- Fresh PostgreSQL 18.4: baseline plus all six DB-1..DB-6 migrations applied successfully.
- Prisma migration status: passed; no pending migrations.
- Runtime Compose: PostgreSQL/backend/Website/Company/Admin started healthy and runtime migration verification passed.

**Other CI results**
- Backend tests: passed.
- All three frontend builds: passed.
- Architecture graph check: passed.
- Frontend/shared unit tests: failed (23 assertions across 9 files). No frontend files are part of this PR; this matches the previously recorded repository test debt and is outside the database scope.
- Browser smoke: 6 passed / 2 failed. Both failures are Website-only pre-existing checks (Website SPA/storefront selector/viewport containment); no Website files were changed by this PR.

**Delivery state:** PR [#90](https://github.com/gameacc2025/martest/pull/90) remains open and unmerged because unrelated frontend/browser checks are red. Database-specific validation is green. No migration was applied to the user's local or production database; only the disposable CI PostgreSQL database was migrated.

**Next implementation stage:** API implementation, beginning with AuthChallenge/AuditLog and Support, then CMS, CRM, and finally gated Retail/Finance. Keep AD-4 in force until the retail commercial decisions are explicitly approved.
