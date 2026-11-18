# Agent Coordination — Current Board

**Updated:** 2026-11-18  
**Repository:** `gameacc2025/martest`  
**Integration branch:** `main` only  
**Reviewed application-code baseline:** `344a2ee049ac9a28eab48b53ce96b118d8224fc3`  
**Latest main HEAD:** `3e66fe8f751f4b4eebd45d0a604cbc3b34b8acdd`  
**Rules-audit integration:** follow the latest `main` HEAD; this board is documentation and may advance independently of the application-code baseline.  
**Coordinator:** Lead  
**Owner communication:** Persian

## 2026-11-18 — Project-wide audit and repair

**Task:** `PROJECT-WIDE-AUDIT-AND-REPAIR-2026-11-18` — IN_PROGRESS  
**Latest recorded main:** `c2c0c8afc4ad1d157410b498fac347b9cf4c9a17`

| Slice | Status | Evidence / scope | Verification |
|---|---|---|---|
| Audit redaction | IMPLEMENTED | Case-insensitive sensitive-key normalization + nested tests | CI running |
| CRM status actor | IMPLEMENTED | Route forwards authenticated actor ID + route test | CI running |
| CRM audit writer | IMPLEMENTED | Lead merge uses transaction-aware central writer; redaction/request-context tests | CI running |
| Support SLA worker | IMPLEMENTED | Exported `runOnce`; no import-time duplicate loop; active queue-assignee scope; no broad staff broadcast | CI running |
| Support SLA pause/resume | IMPLEMENTED | Working-minute pause accounting, persisted due-date extension, duplicate-pause guards | CI running |
| AD-1 | IMPLEMENTED | CUSTOMER cannot create RFQ; existing buyer-owned inquiry actions remain permission/ownership checked | CI + runtime seed check running |
| AD-3 | IMPLEMENTED | COMPANY user-management grants removed and stale rows revoked by seed | Runtime seed check running |
| AD-4 | IMPLEMENTED | B2C routes and active cart/wishlist UI disabled; future components/stores retained dormant | CI running |
| SMS notifications | IMPLEMENTED | Default OFF, provider-aware preference and queue gates, opt-in and quota checks | CI running; live Twilio NOT VERIFIED |
| DB schema parity | IMPLEMENTED | Forward migration for four missing models; all-model parity script and runtime/DB workflow checks | Migration/runtime workflows running |

**Current GitHub Actions runs for the latest tested revision:** CI `44227272875`; Database Migration Validation `44227272649`; Runtime Validation `44227272595`. All were observed **IN_PROGRESS** at the latest poll; frontend/shared tests and Compose configuration were still running, migration and runtime checks had not completed.

**Open work:** timezone-aware SLA calendar calculations; audit producer coverage and an owner-approved retention/archival policy; dashboard sample metrics and tenant-scoped aggregates; continued auth/RBAC/CMS/catalog/retail/finance review; full Website/Company/Admin regression. Do not claim completion until CI and database/runtime checks pass.

**Execution boundary:** GitHub-connected source only. Local Windows workspace and local Docker/browser remain NOT VERIFIED. Continue on `main` only; no branches/worktrees/detached checkouts; workers never commit/push; no destructive Git/DB operations.

## Operating policy

- No new branches, worktrees, detached checkouts or pull requests.
- Workers do not commit or push. Lead alone integrates reviewed changes on `main`.
- No overlapping file ownership. Lead owns app registration, Prisma schema/migrations, permission registry, seed orchestrator, package manifests, shared API exports and global tokens.
- Preserve local edits, untracked files, stashes and database data.
- No destructive Git/Docker/DB actions. Never bypass Fact-Forcing Gate or Auto Mode.
- Browser automation is authorized for acceptance; run sequentially and record evidence.
- Local Windows workspace, Docker and PostgreSQL remain NOT VERIFIED.

## CI evidence and verification boundary

The historical workflow runs listed below were executed against their own recorded commit, not automatically against the current `main` HEAD. They are historical evidence only; never treat them as proof that the latest commit is green.

| Check | Latest observed run | Interpretation |
|---|---|---|
| CI + build | [44024957523](https://github.com/gameacc2025/martest/actions/runs/44024957523) on 56536dc | PASS — graph, frontend/shared, backend and three builds |
| Migration validation | [44024957659](https://github.com/gameacc2025/martest/actions/runs/44024957659) on 56536dc | PASS — fresh PostgreSQL deploy/status; does not prove Prisma schema parity |
| Runtime + seeds + browser | [44024957549](https://github.com/gameacc2025/martest/actions/runs/44024957549) on 56536dc | CANCELLED at health wait; migration verify, seed twice and browser smoke skipped |

The exact pre-audit HEAD cab169e has no combined-status contexts. Only Worklog changed between 56536dc and cab169e; app code is identical, but do not label exact-HEAD checks independently green.

`main` is the only integration branch. Local Windows workspace, Docker daemon, and any developer PostgreSQL instance cannot be inspected through the GitHub repository connection and must remain `NOT VERIFIED` unless checked locally.

## Initial 9 Tasks — implementation outputs with current acceptance blockers (reviewed 2026-11-17)

| Task | Status | Tests | Key Findings |
|---|---|---|---|
| WH-00 Warehouse | ✅ COMPLETED | 49 PASS (18 unit + 31 integration) | Atomic stock ops, row-level locking, idempotency, invariants enforced (onHand≥0, reserved≥0, available≥0) |
| CRM-00 Lead Lifecycle | IMPLEMENTED / BLOCKED | 13 tests (6 service + 7 routes) | Lead lifecycle source exists; 2 required tables missing from migrations; status route omits actorUserId; route success and non-Lead CRUD coverage incomplete |
| SUP-01 Support Foundation | IMPLEMENTED / PARTIAL ACCEPTANCE | 45 service tests + 5 route tests | Attachments/calendar/worker exist; pause/resume is event-only, worker pause check is placeholder, queue notification fan-out is too broad |
| CMS-01 Content Inventory | IMPLEMENTED / DB BLOCKED | Models and seed source present | Faq/Page tables are absent from migration chain although cms seed upserts both; do not claim fresh-DB seed acceptance |
| NTF-01 Notifications | IMPLEMENTED / CONSENT MISMATCH | Dispatcher SMS queue tests exist | Preference API says smsAvailable=false while SUPPORT_SLA_ESCALATED defaults SMS=true; provider delivery unverified |
| AUD-01 Audit Log | PARTIAL ACCEPTANCE | 17 read/query/export tests | DB append-only trigger exists; mixed-case redaction keys can escape; writer tests and retention/archival are missing |
| DASH-00 Design System | ✅ COMPLETED | 60+ files, 3 apps build + unit tests PASS | Semantic --ds-* tokens, newtemp-reference.scss last, RTL/Vazirmatn preserved |
| WEB-00 Website Tokens | ✅ COMPLETED | 8 files, 371 tests PASS | marketplace-theme.scss component-only, legacy --tm-* removed |
| COMPANY-00 Company Tokens | ✅ COMPLETED | 10 files, build PASS, 371 tests PASS | Visual parity with Admin, CSS fixes in InquiryDetail.vue |

## Prioritized queue

| Priority | Lane | Status | Scope / exit criteria |
|---|---|---|---|
| P0 | Prisma migration parity | **BLOCKED** | Schema declares 101 models/58 enums; migrations create 97 tables. Missing: Faq, Page, LeadStatusHistory, CRMFieldAudit. Forward-only migration + comments + fresh/upgrade DB + seed-twice validation required. |
| P1-1 | CRM acceptance | **PARTIAL** | 41 route handlers, 21 named schemas. POST /leads/:id/status omits actorUserId; LeadStatusHistory/CRMFieldAudit tables are missing from migrations; only 6 service + 7 route tests and no valid status-route success test. |
| P1-2 | Support completion | **PARTIAL** | Attachments and calendar/worker exist; pause/resume does not affect due dates and worker checkPausedSlas is a placeholder. SLA notifications query all active STAFF instead of queue-specific assignments. |
| P1-3 | CMS + password recovery | **PARTIAL** | CMS source/seed exists, but Faq and Page have no migration tables; fresh-DB seed acceptance is blocked until forward migration. |
| P1-4 | Notifications + Audit | PARTIAL | SMS preference/default consent mismatch; audit redaction case mismatch, writer tests, producer coverage and retention/archival remain open |
| P1-5 | Dashboards/reporting | PARTIAL | replace sample KPIs with tenant/date/currency-scoped aggregates |
| P1-6 | Three-app regression | PARTIAL | expand beyond smoke to visual, RTL, accessibility, keyboard and feature journeys |
| P2 | Retail/Inventory/Orders | HOLD — OWNER DECISION | no checkout/payment activation before commercial approval |
| P2 | Finance/Settlement | HOLD — OWNER DECISION | requires Retail lifecycle and currency/tax/commission/legal/payout rules |
| P3 | Enterprise future modules | DEFERRED | separately approved scope required |

## Current risks / open acceptance

1. Commit 344a2ee0 contains substantial CRM/Support/CMS implementation, but current source audit found acceptance blockers: missing four migration tables (including two CRM and two CMS), a CRM status-route actor argument defect, and ineffective Support SLA pause/resume.
2. P1-4 Audit/Notifications remains PARTIAL: AuditLog DB trigger is append-only, but redaction matching misses several mixed-case sensitive keys; current 17 audit tests do not cover writer/redaction; no retention/archival implementation found. SMS preference API and event defaults conflict.
3. P1-5 dashboards/reporting remains PARTIAL until KPIs are backed by tenant/date/currency-scoped persisted aggregates.
4. P1-6 three-app regression remains PARTIAL beyond smoke coverage: visual, RTL, accessibility, keyboard, and feature-journey coverage still needs evidence.
5. Retail checkout/orders and Finance/settlement remain HOLD pending explicit commercial, tax, currency, commission, legal, and payout decisions.
6. Local Windows workspace, Docker, and developer PostgreSQL state remain NOT VERIFIED from this remote-only review.
7. AD-4 implementation drift: Website /cart, /checkout, /orders and Company /retail/orders remain registered. Cart is local-only and checkout submit is disabled; owner must decide disablement versus prototype exception.
8. AD-1 implementation drift: CUSTOMER_USER seed grants `leads.create` and `inquiries.create`; the inquiry POST route and service support customer-originated RFQs. Owner must choose whether to keep RFQ creation and revise AD-1 or disable it.
9. AD-3 seed drift: COMPANY_MANAGER receives `users.create`, `users.update`, and `users.assign_roles` even though user.service.js and tests deny these operations in COMPANY context. Explicit security/permission approval is required before reconciling existing role grants.

10. P0 migration parity: Prisma declares 101 models/58 enums; current migration SQL creates 97 tables. Missing model tables/comments are Faq, Page, LeadStatusHistory and CRMFieldAudit. CMS seed and CRM service already query/write them. Migration CI does not detect this drift and Runtime was cancelled before seed.
11. CRM route defect: backend/src/modules/crm/index.js:223 omits r.user.id when calling changeLeadStatus; service requires actorId. Existing route test only exercises an invalid payload.
12. Support SLA/queue: pause/resume only appends events; worker pause check returns zero as a placeholder. Queue escalation/warning queries all active STAFF, not queue-specific active assignments.
13. Audit redaction: mixed-case sensitive field names are compared to a lowercased key without lowercasing the set entries; add writer/redaction tests and a retention policy.
14. Notifications SMS: dispatcher queues SMS, but preferences say unavailable; SUPPORT_SLA_ESCALATED defaults SMS on when no preference row exists. Require explicit owner-approved consent semantics.
15. Dashboard data: admin orders is actually Inquiry count; OperationsHub and retail-order pages use hardcoded rows; Company sales chart is sample.

## Active Task Assignments

### WH-00 — انبار و موجودی (Warehouse/Inventory) — API-5 Retail Lane
- **Status:** ✅ COMPLETED (Verified 2026-11-16)
- **Assigned Agent:** backend + database (paired) — AG-WH
- **Base main SHA:** `0d0a3866c6ff387978f8c5244f6ca936248f508d`
- **Scope:** InventoryBalance, InventoryMovement, InventoryReservation, eligibility resolver, atomic stock operations
- **File Ownership:** `backend/src/modules/inventory/**`, `backend/prisma/seeds/retail.js`, `apps/admin/src/pages/admin/inventory/**`, `apps/company/src/pages/company/inventory/**`
- **Dependencies:** Commercial approval required (AD-4 gate); M0 design tokens
- **First Task:** Reconcile commercial decisions with Retail models; implement inventory balance/movement services with atomic conditional stock updates — **COMPLETED**
- **Findings:** Full implementation verified — service (adjustStock, reserveStock, releaseReservation, consumeReservation, expireReservations), routes (read: COMPANY/STAFF, write: STAFF only), duplicate route registration fixed, retail seed created (InventoryBalance with 50-250 units, RECEIPT movements, sample reservations, expired reservations), seed orchestrator updated. **49 tests PASS** (18 unit + 31 integration). Atomic conditional stock updates with row-level locking, idempotency keys, movement audit trail, onHand>=0, reserved>=0, available>=0 invariants enforced. AD-4 freeze respected — only inventory foundation, no checkout/payment.

### CRM-00 — CRM — API-4 CRM Lane
- **Status:** IMPLEMENTED — ACCEPTANCE BLOCKED (2026-11-17)
- **Assigned Agent:** backend + frontend (paired) — AG-CRM
- **Base main SHA:** `0d0a3866c6ff387978f8c5244f6ca936248f508d`
- **Scope:** Lead/account/contact/pipeline/opportunity/activity/task/note CRUD, STAFF-only access, conversion idempotency, Kanban UI
- **File Ownership:** `backend/src/modules/crm/**`, `backend/prisma/seeds/crm.js`, `apps/admin/src/pages/admin/crm/**`
- **Dependencies:** Company/User/Inquiry identity contract; M0 design tokens
- **Lead Lifecycle (T1):** ✅ COMPLETED — create/list/detail/update/assign/status/convert/merge/timeline, CRMFieldAudit + LeadStatusHistory, 13 tests PASS
- **Remaining Route Families (P1-1):** ✅ COMPLETED (2026-11-16) — 7 families implemented:
  - CRMAccount: CRUD + canonical links to Company/User
  - CRMContact: CRUD linked to Account/User
  - Pipeline & PipelineStage: Management with stages
  - Opportunity: CRUD + stage history, currency-safe
  - CRMTask: CRUD + assign/complete, due dates, reminders
  - CRMActivity: Completed interactions/timeline
  - CRMNote: Visibility-controlled (TEAM/PRIVATE)
- **Implementation:** 21 named Fastify schema constants and 41 route handlers are present with granular crm.* guards. The status route omits actorUserId; the 6 service + 7 route tests do not exercise a successful status request or all non-Lead CRUD families. LeadStatusHistory/CRMFieldAudit are missing from migration SQL.

### SUP-01 — پشتیبانی (Support) — API-2 Support Lane
- **Status:** IMPLEMENTED — SLA/QUEUE ACCEPTANCE PARTIAL (2026-11-17)
- **Assigned Agent:** backend + frontend + database (triad) — AG-SUP
- **Base main SHA:** `0d0a3866c6ff387978f8c5244f6ca936248f508d`
- **Scope:** Ticket lifecycle, queues/SLA, private attachments, notifications, Admin/Company/Customer UI, assignment, pagination
- **File Ownership:** `backend/src/modules/support/**`, `backend/prisma/seeds/support.js`, `apps/admin/src/pages/admin/support/**`, `apps/company/src/pages/company/support/**`, `apps/website/src/pages/public/support/**`
- **Dependencies:** Shared API conventions; M0 design tokens; notification/file infrastructure
- **Foundation (T1):** ✅ COMPLETED — Ticket create/list/detail, tenant isolation, SLA fallback, internal notes STAFF-only, 12 tests PASS
- **Attachments (T2):** ✅ COMPLETED — upload/download/delete with ownership checks, MIME/size validation (10MB), secure storage, SHA-256 checksums, internal message restrictions, 18 new tests PASS
- **SLA Calendar/Worker/Escalation (T3):** PARTIAL — working calendar and escalation/warning worker exist, but pauseSla/resumeSla only append events, getSlaDetails does not account for paused time, and checkPausedSlas() is a placeholder. The worker's queue fan-out queries all active STAFF without filtering by queue/active SupportAssignment; no dedicated worker tests found.
- **Queue-level Authorization & Visibility (T3+):** STAFF-only queue routes and stats exist, but service/worker do not establish queue-member scoping; notification fan-out is currently STAFF-wide. Confirm intended queue membership policy and test it.
- **API Client & Endpoints:** ✅ COMPLETED — All new endpoints in endpoints.js and apiClient.js
- **Test Results:** 45 support service tests PASS, 5 support route tests PASS, 10 notification events tests PASS, **1646/1646 backend tests PASS**

### CMS-01 — CMS — API-3 CMS Lane
- **Status:** IMPLEMENTED — FRESH-DB ACCEPTANCE BLOCKED (2026-11-17)
- **Assigned Agent:** backend + frontend (paired) — AG-CMS
- **Base main SHA:** `0d0a3866c6ff387978f8c5244f6ca936248f508d`
- **Scope:** Article/Page/FAQ/Banner CRUD, draft→review→scheduled/published→archived, revisions, SEO, public read APIs, Admin editor, Website rendering
- **File Ownership:** `backend/src/modules/cms/**`, `backend/prisma/seeds/cms.js`, `apps/admin/src/pages/admin/cms/**`, `apps/website/src/pages/public/cms/**`
- **Dependencies:** Shared media/API conventions; M0 design tokens
- **Content Inventory (T1):** IMPLEMENTED — Models, slug strategy, lifecycle, admin UI, seed and public APIs; Faq/Page migration tables are missing although the seed upserts them.
- **Scheduled Publish Worker (T3):** ✅ COMPLETED — `cms-scheduled-publish.worker.js`: auto-publishes SCHEDULED articles when `scheduledAt <= now`, creates revision, configurable interval/batch. Registered in `server.js`.
- **Revision Restore API (T3):** ✅ COMPLETED — `POST /cms/articles/manage/:id/revisions/:revisionNo/restore`, restores title/content/status/categories/tags/SEO from snapshot, creates new revision.
- **Preview System (T3):** ✅ COMPLETED — `preview.service.js`: signed tokens (1hr TTL, single-use), `generatePreviewToken`, `validatePreviewToken`, `cleanupExpiredTokens`. Routes: POST `/cms/articles/manage/:id/preview-token` (admin), GET `/cms/articles/preview/:token` (public). Admin UI: Preview button. Website: `/magazine/preview/:token` route.
- **Sitemap Generator (T3):** ✅ COMPLETED — `sitemap.service.js`: dynamic XML with 1hr cache, articles/categories/tags/pages/static routes. Routes: `GET /cms/sitemap/sitemap.xml` and `GET /cms/sitemap`.
- **Password Recovery (P1):** ✅ COMPLETED — `forgot-password` / `reset-password` endpoints, generic responses, OTP hash (bcrypt), rate limits, 15-min expiry, 5 attempts, single-use, session invalidation. Website: `ForgotPassword.vue` with `authStore.forgotPassword()`/`resetPassword()`.
- **Remaining Gaps (Not in P1-3 Scope):** Media Library UI, Multi-language, Concurrent Edit Protection (optimistic locking), Banner registration in cms/index.js.
- **Test Results:** **1646/1646 backend tests PASS**

### NTF-01 — اعلان‌ها (Notifications) — API-1 Auth/Audit Lane (part)
- **Status:** IMPLEMENTED — PREFERENCE/CONSENT ACCEPTANCE PARTIAL (2026-11-17)
- **Assigned Agent:** backend + frontend (paired) — AG-NTF
- **Base main SHA:** `0d0a3866c6ff387978f8c5244f6ca936248f508d`
- **Scope:** Generic SMS outbox, retry/idempotency/consent/quota, notification event dispatch, inbox/folders/preferences
- **File Ownership:** `backend/src/modules/notifications/**`, `backend/prisma/seeds/auth-audit.js` (notification events), `apps/admin/src/pages/admin/notifications/**`, `apps/company/src/pages/company/notifications/**`, `apps/website/src/pages/public/notifications/**`
- **Dependencies:** AuthChallenge foundation; M0 design tokens
- **First Task:** Implement generic SMS outbox with retry/idempotency/consent/quota; connect ticket/message/status events to notifications idempotently — **COMPLETED**
- **Findings:** Dispatcher queues SMS with quota/dedupe and tests cover queue/quota. However preference service returns smsAvailable=false while SUPPORT_SLA_ESCALATED defaults SMS=true; missing stored preference falls back to event default. Explicit consent semantics and provider delivery remain unverified. Delivery-worker comments still describe SMS as inquiry-only although dispatcher queues generic event SMS.

### AUD-01 — Audit — API-1 Auth/Audit Lane (part)
- **Status:** IMPLEMENTED — REDACTION/RETENTION ACCEPTANCE PARTIAL (2026-11-17)
- **Assigned Agent:** backend + database (paired) — AG-AUD
- **Base main SHA:** `0d0a3866c6ff387978f8c5244f6ca936248f508d`
- **Scope:** AuditLog module/service, append-only semantics, actor context capture, staff search API, redaction/retention
- **File Ownership:** `backend/src/modules/audit/**`, `backend/prisma/seeds/auth-audit.js`
- **Dependencies:** AuthChallenge foundation; security policy; correlationId middleware (WH-00)
- **First Task:** Implement AuditLog module/service; capture actor context, target, action, safe before/after metadata, source/IP/user-agent policy, request correlation ID — **COMPLETED**
- **Findings:** STAFF-only read/export routes and DB append-only trigger prevent_audit_log_mutation exist. Redaction helper is called by writers, but mixed-case keys such as apiKey/privateKey/creditCard/cardNumber/nationalId/bankAccount evade the lowercased comparison. The 17 current tests cover read/query/export, not writer/redaction; no retention/archival worker or policy found.

### DASH-00 — داشبورد مدیریت (Admin Dashboard) — M0 Design System Lane
- **Status:** ✅ COMPLETED — Design System Alignment (Verified 2026-11-16)
- **Assigned Agent:** ui-ux + frontend (paired)
- **Base main SHA:** `0d0a3866c6ff387978f8c5244f6ca936248f508d`
- **Scope:** Shared palette/tokens, dashboard shell components (sidebar, header, cards, tables, charts), RTL/accessibility, light/dark parity
- **File Ownership:** `packages/shared-ui/assets/design-system/**` (coordinator patch), `apps/admin/src/**`, `apps/company/src/**`, `packages/shared-ui/components/ui/**`
- **Dependencies:** Website approved palette (source of truth)
- **First Task:** Read Website's approved light/dark palette in newtemp-reference.scss; audit import order in all three apps; replace retired palette values with semantic tokens — **COMPLETED**
- **Findings:** Source of truth confirmed: `newtemp-reference.scss` loaded last in all 3 apps. 60+ files updated replacing legacy `--tm-*`, `--primary-color`, `--surface-*`, `--text-color*`, `--p-*` with semantic `--ds-*` tokens. Build & unit tests PASS for all 3 apps. Import order verified. Status tokens preserved as semantic `--ds-status-*`. RTL/Persian/Vazirmatn unchanged.

### WEB-00 — وب‌سایت (Website) — M0 + API-3 (public CMS)
- **Status:** ✅ COMPLETED — Design Token Alignment (Verified 2026-11-16)
- **Assigned Agent:** frontend + ui-ux (paired)
- **Base main SHA:** `0d0a3866c6ff387978f8c5244f6ca936248f508d`
- **Scope:** Public storefront, CMS-backed content rendering, responsive/RTL, Vazirmatn, design token consumption
- **File Ownership:** `apps/website/src/**`, `packages/shared-ui/assets/design-system/**` (coordinator patch)
- **Dependencies:** M0 design tokens; CMS public APIs (API-3)
- **First Task:** Ensure Website consumes shared tokens correctly; verify marketplace-theme.scss only has component/layout styling; align any remaining hardcoded colors to semantic tokens — **COMPLETED**
- **Findings:** Website correctly consumes shared tokens. 8 files updated (PublicLayout, Home, Categories, ProductListing, ProductDetails, ContactUs, Notifications, marketplace-theme.test.js). All legacy `--tm-*` tokens and hardcoded colors replaced with semantic `--ds-*` tokens. 371 tests PASS. marketplace-theme.scss verified as component/layout only. Import order correct (marketplace-theme.scss before newtemp-reference.scss).

### COMPANY-00 — پنل شرکت (Company Panel) — M0 + API-2/3/4
- **Status:** ✅ COMPLETED — Design Token Alignment (Verified 2026-11-16)
- **Assigned Agent:** frontend + ui-ux (paired)
- **Base main SHA:** `0d0a3866c6ff387978f8c5244f6ca936248f508d`
- **Scope:** Company portal, support center, CMS content, CRM (if applicable), dashboard, design token alignment
- **File Ownership:** `apps/company/src/**`, `packages/shared-ui/assets/design-system/**` (coordinator patch)
- **Dependencies:** M0 design tokens; Support/CMS/CRM APIs
- **First Task:** Verify Company app loads shared tokens correctly; align any hardcoded colors to semantic tokens; ensure visual parity with Admin dashboard shell — **COMPLETED (2 passes: discovery + implementation)**
- **Findings:** Import order verified (newtemp-reference.scss last). 10 files updated replacing all legacy `--tm-*` tokens with semantic `--ds-*` tokens. Build PASS for all 3 apps. 371 unit tests PASS. No `--tm-*` tokens remain in target files. CSS syntax errors fixed in InquiryDetail.vue. Visual parity with Admin dashboard confirmed via shared components (DashboardSidebar, DashboardHeader, TemPanel, etc.).

## Required handoff

Persian summary; task/lane; exact base and resulting main SHA; changed paths; workflow URLs; test counts; migration/seed/browser evidence; risks and blockers.
