# DAILY-SOURCE-AUDIT-2026-11-17 — Application, Security and Database Acceptance

**Task ID:** DAILY-SOURCE-AUDIT-2026-11-17  
**Status:** PARTIAL — source audit found one P0 schema/migration parity blocker and several P1 acceptance/security gaps; no product code or database was changed.  
**Repository:** gameacc2025/martest  
**Integration branch:** main only  
**Application-code baseline:** 344a2ee049ac9a28eab48b53ce96b118d8224fc3  
**Latest main HEAD before this audit:** cab169e497248d5cd8c8f5fe193638977b964de9  
**Owner communication:** Persian

## Scope and evidence boundary

This is a targeted source audit of CRM, Support, Audit, Notifications, Admin/Company dashboards, Website/Company routes, Prisma schema and migrations. It is not a claim that all 5,098 tracked blobs were read. All repository reads and later documentation writes use the existing main branch. No branch, worktree, detached checkout, force-push, destructive reset, local database command or product-code change was made.

The comparison from application baseline 344a2ee to pre-audit HEAD cab169e contains 43 commits and 25 changed files, all governance/docs/workflow/architecture-graph files. No application source, Prisma schema or migration changed. The comparison from tested SHA 56536dc to cab169e contains one Worklog-only change.

## CI and runtime evidence

- **CI:** PASS on 56536dc1e6cbcea3f5ae295102a008c470360c7b, run [44024957523](https://github.com/gameacc2025/martest/actions/runs/44024957523). The observed steps for architecture graph, frontend/shared tests, Prisma client generation, backend tests and all three frontend builds completed successfully.
- **Database Migration Validation:** PASS on the same SHA, run [44024957659](https://github.com/gameacc2025/martest/actions/runs/44024957659). It validated Prisma, generated the client, applied migrations to a fresh PostgreSQL service and checked migration status.
- **Runtime Validation:** NOT PASS. Run [44024957549](https://github.com/gameacc2025/martest/actions/runs/44024957549) was cancelled at “Wait for all service health endpoints”. Compose validation and build/start completed; health verification was cancelled and migration-state, seed-twice and browser-smoke steps were skipped. The workflow has cancel-in-progress enabled; a later main push can supersede a run.
- **Exact current HEAD:** the combined-status endpoint returned no status contexts for cab169e. The CI/DB pass above is on 56536dc; code is unchanged between that SHA and cab169e, but do not label the exact latest HEAD as independently green.
- **Local environment:** Windows working tree, local Docker daemon and developer PostgreSQL are inaccessible from this GitHub-only audit. No local test/build/migration/seed/Playwright command was run.

## P0 — Prisma schema and migration drift

The current backend/prisma/schema.prisma declares **101 models and 58 enums**. The baseline plus DB-1..DB-6 migrations create only **97 tables**. Four models have no corresponding CREATE TABLE statement in any current migration and are also absent from the 97-table comments migration:

- Faq
- Page
- LeadStatusHistory
- CRMFieldAudit

This is confirmed by comparing the model declarations with all eight migration SQL files. The impact is direct:

- backend/prisma/seeds/cms.js calls prisma.faq.upsert() and prisma.page.upsert().
- backend/src/modules/crm/crm.service.js writes leadStatusHistory and cRMFieldAudit during assignment, update, status change, conversion and merge.
- A fresh database created only by the current migration chain will not have those four tables. The current migration workflow does not compare the migrated database catalog against all Prisma models and does not run seeds. The latest Runtime run was cancelled before seed execution.

**Required:** create a new forward-only migration for the four missing tables and their constraints/indexes, add four table/column comments, then verify fresh PostgreSQL, existing-database upgrade safety, seeds twice and affected CRM/CMS tests. Do not edit applied migrations, use db push, reset or rewrite existing user data.

## Confirmed source findings

### CRM

- backend/src/modules/crm/index.js contains 41 route handlers and 21 named request-schema constants across Lead, Account, Contact, Pipeline/Stage, Opportunity, Task, Activity and Note.
- LeadStatusHistory and CRMFieldAudit are used by the service, but their tables are missing from migrations (P0 above).
- **Route defect:** POST /leads/:id/status at line 223 calls changeLeadStatus(id, status, reason) without r.user.id; the service signature requires actorId and calls assertStaff(prisma, actorId). The route-level test only checks an invalid status payload and does not exercise a valid status transition through the route.
- Existing CRM tests are 6 service tests and 7 route tests. Service tests are Lead-focused; successful CRUD, tenant/permission behavior and transaction/idempotency paths for the other route families are not comprehensively covered.

### Support

- Attachment upload/download/delete routes and private storage/ownership checks exist. The service suite contains 45 tests, including attachment and working-calendar cases.
- Working-calendar calculation and the SLA monitor/escalation worker exist.
- **Pause/resume is not functional:** pauseSla and resumeSla only append events; getSlaDetails does not adjust deadlines for paused intervals; worker checkPausedSlas() is an explicit placeholder returning { resumed: 0 }.
- **Queue recipient over-breadth:** the SLA worker treats every active STAFF user as a queue member when assignedQueueId is present; the query does not filter by queue or active SupportAssignment. The same pattern exists in warning and escalation fan-out. No dedicated SLA-worker test file was found.

### Audit

- Audit routes enforce STAFF access and explicit audit_logs.read/export permissions.
- AuditLog has a PostgreSQL trigger that rejects UPDATE and DELETE; the append-only invariant is database-enforced.
- Redaction is called by both audit writer methods, but the matcher lowercases the incoming key while some SENSITIVE_FIELDS entries remain mixed-case. Keys such as apiKey, privateKey, creditCard, cardNumber, nationalId and bankAccount can therefore evade those exact entries.
- The 17 tests in audit.service.test.js cover search, filters, stats, detail and export; they do not test the writer/redaction paths. No retention/archival worker or retention policy was found in the audited module/migration.

### Notifications

- The central dispatcher can enqueue SMS with preference, phone validation, quota consumption and dedupe; dispatcher tests explicitly cover SMS queueing and quota rejection.
- In conflict, notification.preference.service.js still returns smsAvailable: false, and its test asserts false.
- SUPPORT_SLA_ESCALATED declares SMS enabled by default. When no stored preference exists, dispatcher fallback uses the event default, so this event can queue SMS without an explicit stored opt-in while the preferences API says SMS is unavailable. Resolve consent/default semantics before enabling real provider delivery.
- Twilio provider delivery was not verified; no provider credentials or real send result were inspected.

### Dashboards, Website and Company

- admin.service.js maps counts.orders to totalInquiries; this is not an order count.
- OperationsHub.vue contains hardcoded CRM, Finance, Support and Retail Orders metrics/rows.
- CompanyDashboard's main Inquiry/Product metrics use APIs, but its Sales chart is explicitly sample data. Company and Website retail-order pages contain hardcoded sample rows.
- Website registers /cart, /checkout and /orders. Cart data is a local browser preview and checkout's final submit button is disabled; no operational Order/Payment API was found in app registration. This remains inconsistent with AD-4's “routes/UI disabled” wording, although checkout does not place an order.
- Company /retail/orders is also a sample page, not an operational order workflow.

## Owner decisions still pending

- **AD-1:** CUSTOMER RFQ creation is allowed by seed, route and service despite the accepted decision prohibiting it.
- **AD-3:** COMPANY_MANAGER seed grants user-management permissions, but service guards and unit tests reject COMPANY create/edit/role assignment. Permission reconciliation still requires owner approval.
- **AD-4:** B2C routes/prototypes remain registered despite the accepted disabled decision. Owner must choose disablement or an explicit prototype exception.

## Next actions

1. Treat migration parity as P0; prepare a forward-only migration and add a live-schema parity check to CI before accepting CMS/CRM on a fresh database.
2. Fix the CRM status-route actor argument and add a successful route-level test.
3. Implement effective SLA pause/resume and scope queue notification recipients; add worker tests.
4. Normalize audit sensitive-key matching, add writer/redaction tests and define retention/archival.
5. Reconcile SMS preference availability, event defaults and explicit consent; test provider absence and real staging delivery separately.
6. Replace misleading dashboard aggregates/sample operational rows or label them explicitly.
7. Keep AD-1/AD-3/AD-4 behavior unchanged until owner approval.

**Result:** no product code, migration, seed or database was changed in this audit. The documentation updates record findings only.
