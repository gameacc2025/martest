# Agent Coordination — Current Board

**Updated:** 2026-11-16  
**Repository:** `gameacc2025/martest`  
**Integration branch:** `main` only  
**Verified code baseline:** `0d0a3866c6ff387978f8c5244f6ca936248f508d`  
**Coordinator:** Lead  
**Owner communication:** Persian

## Operating policy

- No new branches, worktrees, detached checkouts or pull requests.
- Workers do not commit or push. Lead alone integrates reviewed changes on `main`.
- No overlapping file ownership. Lead owns app registration, Prisma schema/migrations, permission registry, seed orchestrator, package manifests, shared API exports and global tokens.
- Preserve local edits, untracked files, stashes and database data.
- No destructive Git/Docker/DB actions. Never bypass Fact-Forcing Gate or Auto Mode.
- Browser automation is authorized for acceptance; run sequentially and record evidence.
- Local Windows workspace, Docker and PostgreSQL remain NOT VERIFIED.

## Verified P0 checks

| Lane | Status | Evidence |
|---|---|---|
| CI + build | PASS | [43474183592](https://github.com/gameacc2025/martest/actions/runs/43474183592): install, architecture graph, Frontend/Shared, Backend, Prisma and all three builds |
| Migration validation | PASS | [43474183157](https://github.com/gameacc2025/martest/actions/runs/43474183157): fresh PostgreSQL migration apply |
| Runtime + seeds + browser | PASS | [43474183935](https://github.com/gameacc2025/martest/actions/runs/43474183935): Compose, health, migrations, seed twice, Chromium, 8/8 Playwright |

## Initial 9 Tasks — VERIFIED (2026-11-16)

| Task | Status | Tests | Key Findings |
|---|---|---|---|
| WH-00 Warehouse | ✅ COMPLETED | 49 PASS (18 unit + 31 integration) | Atomic stock ops, row-level locking, idempotency, invariants enforced (onHand≥0, reserved≥0, available≥0) |
| CRM-00 Lead Lifecycle | ✅ COMPLETED | 13 PASS (6 service + 7 routes), 1606 backend | Full Lead CRUD, CRMFieldAudit + LeadStatusHistory, STAFF-only, conversion idempotent |
| SUP-01 Support Foundation | ✅ COMPLETED | 12 PASS | Ticket lifecycle, tenant isolation, SLA fallback, internal notes STAFF-only |
| CMS-01 Content Inventory | ✅ COMPLETED | Models/Seed verified | Article/Category/Tag/Page/Faq/Banner/Revision/Media models, slug strategy, lifecycle. Gaps: scheduled worker, preview, sitemap |
| NTF-01 Notifications | ✅ COMPLETED | 69 notification + 1608 backend PASS | Generic SMS outbox, retry/idempotency/consent/quota, 4 Support events, Iranian phone validation |
| AUD-01 Audit Log | ✅ COMPLETED | 17 audit + 1608 backend PASS | Actor context, safe metadata, redaction, correlation ID, STAFF-only /api/v1/audit |
| DASH-00 Design System | ✅ COMPLETED | 60+ files, 3 apps build + unit tests PASS | Semantic --ds-* tokens, newtemp-reference.scss last, RTL/Vazirmatn preserved |
| WEB-00 Website Tokens | ✅ COMPLETED | 8 files, 371 tests PASS | marketplace-theme.scss component-only, legacy --tm-* removed |
| COMPANY-00 Company Tokens | ✅ COMPLETED | 10 files, build PASS, 371 tests PASS | Visual parity with Admin, CSS fixes in InquiryDetail.vue |

## Prioritized queue

| Priority | Lane | Status | Scope / exit criteria |
|---|---|---|---|
| P1-1 | CRM acceptance | ✅ **COMPLETED (2026-11-16)** | All 7 remaining route families implemented: Account, Contact, Pipeline, PipelineStage, Opportunity, Task, Activity, Note. 27 endpoints, 16 schemas, STAFF-only + granular permissions. 8 CRM tests PASS, 1646/1646 backend PASS. |
| P1-2 | Support completion | ✅ **COMPLETED (2026-11-16)** | Private attachments, SLA calendar/worker/escalation, queue-level authorization, API client integration. 45 service + 5 route + 10 notification tests PASS. 1646/1646 backend PASS. |
| P1-3 | CMS + password recovery | ✅ **COMPLETED (2026-11-16)** | Scheduled publish worker, revision restore API, preview system, sitemap generator, password recovery (forgot/reset). 1646/1646 backend PASS. |
| P1-4 | Notifications + Audit | PARTIAL | generic SMS outbox/retry/consent/quota/idempotency ✅; audit event matrix, redaction and retention |
| P1-5 | Dashboards/reporting | PARTIAL | replace sample KPIs with tenant/date/currency-scoped aggregates |
| P1-6 | Three-app regression | PARTIAL | expand beyond smoke to visual, RTL, accessibility, keyboard and feature journeys |
| P2 | Retail/Inventory/Orders | HOLD — OWNER DECISION | no checkout/payment activation before commercial approval |
| P2 | Finance/Settlement | HOLD — OWNER DECISION | requires Retail lifecycle and currency/tax/commission/legal/payout rules |
| P3 | Enterprise future modules | DEFERRED | separately approved scope required |

## Verified blockers / risks

1. All P0 automated checks are green on the verified SHA and run IDs above.
2. Support create/reply browser journey passes, but secure attachments, notifications and SLA worker/calendar are not implemented/verified.
3. CRM Leads list browser journey passes; full mutation and permission/tenant matrix acceptance remains.
4. CMS FAQ/Page CRUD browser acceptance and real SMS delivery remain unverified.
5. Generic SMS dispatch, audit coverage and sample dashboard data remain open.
6. Retail/Finance remain gated by owner decisions.
7. Local Windows/Docker/PostgreSQL remain NOT VERIFIED.

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
- **Status:** ✅ COMPLETED — Full Route Families (Verified 2026-11-16)
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
- **Implementation:** 16 Fastify schemas, 27 new routes, all STAFF-only + granular `crm.*` permissions, Note visibility filtering, 8 CRM tests PASS, **1646/1646 backend tests PASS**.

### SUP-01 — پشتیبانی (Support) — API-2 Support Lane
- **Status:** ✅ COMPLETED — Full Vertical Slice (Verified 2026-11-16)
- **Assigned Agent:** backend + frontend + database (triad) — AG-SUP
- **Base main SHA:** `0d0a3866c6ff387978f8c5244f6ca936248f508d`
- **Scope:** Ticket lifecycle, queues/SLA, private attachments, notifications, Admin/Company/Customer UI, assignment, pagination
- **File Ownership:** `backend/src/modules/support/**`, `backend/prisma/seeds/support.js`, `apps/admin/src/pages/admin/support/**`, `apps/company/src/pages/company/support/**`, `apps/website/src/pages/public/support/**`
- **Dependencies:** Shared API conventions; M0 design tokens; notification/file infrastructure
- **Foundation (T1):** ✅ COMPLETED — Ticket create/list/detail, tenant isolation, SLA fallback, internal notes STAFF-only, 12 tests PASS
- **Attachments (T2):** ✅ COMPLETED — upload/download/delete with ownership checks, MIME/size validation (10MB), secure storage, SHA-256 checksums, internal message restrictions, 18 new tests PASS
- **SLA Calendar/Worker/Escalation (T3):** ✅ COMPLETED — Working calendar (Mon-Fri 09-18 Iran), holidays, addWorkingMinutes, isWorkingDay, calculateSlaRemaining, isSlaBreached/AtRisk, getSlaDetails, pauseSla/resumeSla events. **SLA Monitor Worker** implemented (5-min interval), escalation to assignee+queue members, warning at 20% threshold. **Notification events**: SUPPORT_SLA_ESCALATED (SMS enabled), SUPPORT_SLA_WARNING. 20 new tests PASS.
- **Queue-level Authorization & Visibility (T3+):** ✅ COMPLETED — listTicketsByQueue, getQueueStats (SLA breached/at-risk counts, priority breakdown), getQueueAssignments. Routes: GET /queues/:queueId/tickets, GET /queues/:queueId/stats. API client: listQueueTickets, getQueueStats.
- **API Client & Endpoints:** ✅ COMPLETED — All new endpoints in endpoints.js and apiClient.js
- **Test Results:** 45 support service tests PASS, 5 support route tests PASS, 10 notification events tests PASS, **1646/1646 backend tests PASS**

### CMS-01 — CMS — API-3 CMS Lane
- **Status:** ✅ COMPLETED — Full Vertical Slice + Password Recovery (Verified 2026-11-16)
- **Assigned Agent:** backend + frontend (paired) — AG-CMS
- **Base main SHA:** `0d0a3866c6ff387978f8c5244f6ca936248f508d`
- **Scope:** Article/Page/FAQ/Banner CRUD, draft→review→scheduled/published→archived, revisions, SEO, public read APIs, Admin editor, Website rendering
- **File Ownership:** `backend/src/modules/cms/**`, `backend/prisma/seeds/cms.js`, `apps/admin/src/pages/admin/cms/**`, `apps/website/src/pages/public/cms/**`
- **Dependencies:** Shared media/API conventions; M0 design tokens
- **Content Inventory (T1):** ✅ COMPLETED — Models, slug strategy, lifecycle, admin UI, seed, public APIs
- **Scheduled Publish Worker (T3):** ✅ COMPLETED — `cms-scheduled-publish.worker.js`: auto-publishes SCHEDULED articles when `scheduledAt <= now`, creates revision, configurable interval/batch. Registered in `server.js`.
- **Revision Restore API (T3):** ✅ COMPLETED — `POST /cms/articles/manage/:id/revisions/:revisionNo/restore`, restores title/content/status/categories/tags/SEO from snapshot, creates new revision.
- **Preview System (T3):** ✅ COMPLETED — `preview.service.js`: signed tokens (1hr TTL, single-use), `generatePreviewToken`, `validatePreviewToken`, `cleanupExpiredTokens`. Routes: POST `/cms/articles/manage/:id/preview-token` (admin), GET `/cms/articles/preview/:token` (public). Admin UI: Preview button. Website: `/magazine/preview/:token` route.
- **Sitemap Generator (T3):** ✅ COMPLETED — `sitemap.service.js`: dynamic XML with 1hr cache, articles/categories/tags/pages/static routes. Routes: `GET /cms/sitemap/sitemap.xml` and `GET /cms/sitemap`.
- **Password Recovery (P1):** ✅ COMPLETED — `forgot-password` / `reset-password` endpoints, generic responses, OTP hash (bcrypt), rate limits, 15-min expiry, 5 attempts, single-use, session invalidation. Website: `ForgotPassword.vue` with `authStore.forgotPassword()`/`resetPassword()`.
- **Remaining Gaps (Not in P1-3 Scope):** Media Library UI, Multi-language, Concurrent Edit Protection (optimistic locking), Banner registration in cms/index.js.
- **Test Results:** **1646/1646 backend tests PASS**

### NTF-01 — اعلان‌ها (Notifications) — API-1 Auth/Audit Lane (part)
- **Status:** ✅ COMPLETED — Generic SMS Outbox (Verified 2026-11-16)
- **Assigned Agent:** backend + frontend (paired) — AG-NTF
- **Base main SHA:** `0d0a3866c6ff387978f8c5244f6ca936248f508d`
- **Scope:** Generic SMS outbox, retry/idempotency/consent/quota, notification event dispatch, inbox/folders/preferences
- **File Ownership:** `backend/src/modules/notifications/**`, `backend/prisma/seeds/auth-audit.js` (notification events), `apps/admin/src/pages/admin/notifications/**`, `apps/company/src/pages/company/notifications/**`, `apps/website/src/pages/public/notifications/**`
- **Dependencies:** AuthChallenge foundation; M0 design tokens
- **First Task:** Implement generic SMS outbox with retry/idempotency/consent/quota; connect ticket/message/status events to notifications idempotently — **COMPLETED**
- **Findings:** Generic SMS outbox implemented with retry/idempotency/consent/quota. 4 Support events added (TICKET_CREATED, MESSAGE_RECEIVED, STATUS_CHANGED, TICKET_ASSIGNED). Support service dispatches notifications transactionally with dedupeKey. Phone validation/normalization for Iranian formats (09X, +989X, 989X). Quota enforcement via consumeUsage (forceEnforcement: true). **69 notification tests + 1608 backend tests PASS**.

### AUD-01 — Audit — API-1 Auth/Audit Lane (part)
- **Status:** ✅ COMPLETED — AuditLog Module (Verified 2026-11-16)
- **Assigned Agent:** backend + database (paired) — AG-AUD
- **Base main SHA:** `0d0a3866c6ff387978f8c5244f6ca936248f508d`
- **Scope:** AuditLog module/service, append-only semantics, actor context capture, staff search API, redaction/retention
- **File Ownership:** `backend/src/modules/audit/**`, `backend/prisma/seeds/auth-audit.js`
- **Dependencies:** AuthChallenge foundation; security policy; correlationId middleware (WH-00)
- **First Task:** Implement AuditLog module/service; capture actor context, target, action, safe before/after metadata, source/IP/user-agent policy, request correlation ID — **COMPLETED**
- **Findings:** Full implementation verified — 7 service functions, 4 routes (search, stats, byId, export CSV/JSON), append-only with DB trigger `prevent_audit_log_mutation`, 50+ sensitive fields redacted recursively, correlation ID from WH-00 middleware. **17 audit service tests + 1608 backend tests PASS**. STAFF-only /api/v1/audit with audit_logs.read/export permissions.

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
