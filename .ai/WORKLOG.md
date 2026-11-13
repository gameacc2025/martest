## 2026-11-13 — CROSS-DOMAIN-SOURCE-AUDIT-REFRESH

- **Inspected main HEAD:** `ace67cccc6a4b09b8cf8258dc814aedbb5d0b71b`; latest inspected code-bearing commit `e0cdfdd3006cfe68c86aa280b2a7aabdb008f4a9`.
- **CMS:** `e0cdfdd` corrected Boolean handling for category/FAQ/page admin filters. Article `featured` remains defective/incomplete: boolean schema + AJV coercion + string comparison in controller; service does not filter and Article has no `featured` field.
- **CRM:** exact STAFF/per-action guards are present. Request schemas cover lead operations only; other CRM route families omit schemas. Inspected route tests cover access denial and lead validation; service tests are lead-focused. Conversion/merge concurrency/idempotency lacks inspected test coverage.
- **Support:** customer/company ownership scopes, INTERNAL note denial and SLA fallback/precedence are tested. Current SLA is elapsed-minute arithmetic; no business-hours calendar/escalation worker or attachment upload/download path found in inspected service/routes.
- **Notifications:** central transactional IN_APP/EMAIL dispatch, dedupe and email retry/backoff worker exist. SMS is explicitly unimplemented; preferences report `smsAvailable: false`.
- **Audit:** model and STAFF-only read/search/stats/export routes exist; inspected service is read/export only. Full event producer coverage, redaction and retention remain unverified.
- **Dashboards:** Admin OperationsHub CRM/Finance/Support values are hard-coded; CompanyDashboard primary inquiry/product KPIs are API-backed but some panels are labeled sample. Admin `orders` statistic currently maps to inquiry count.
- **Verification:** GitHub source inspection only. No tests/builds/migration/seed/Actions/local Docker/PostgreSQL executed. Earlier P0 green evidence belongs to `0d0a386`, not current HEAD.
- **Next:** resolve CMS featured contract; complete CRM schemas and transactional tests; Support attachments/SLA worker; event coverage; replace dashboard samples; rerun all P0 gates on current main.

## 2026-11-13 — CMS-API-CONTRACT-SOURCE-AUDIT

- **Status:** PARTIAL source audit; no runtime acceptance claimed.
- **Verified:** five CMS backend route modules (articles/categories/tags/FAQs/pages) register public read and STAFF-only management CRUD routes with per-resource permissions and request schemas.
- **Finding:** featured article query is declared boolean; Fastify AJV coercion is enabled; article controller compares the received value to string `'true'`. A boolean `true` can be converted to false before service filtering. Regression test/fix required.
- **Not run:** CMS route/service tests, browser CRUD, public rendering, XSS/media authorization checks. Local runtime remains NOT VERIFIED.
- **Next:** add focused regression coverage and fix the featured filter, then test CMS CRUD and publication journeys.

## 2026-11-13 — PROJECT-SOURCE-AUDIT-CMS-CLARIFICATION

- **Status:** SOURCE AUDIT UPDATE — CMS Admin UI presence verified; functional acceptance remains open.
- **Base:** `main` code baseline `0d0a3866c6ff387978f8c5244f6ca936248f508d`.
- **Verified source:** five CMS management pages, five Admin routes with `cms.*.read` metadata, and five permission-gated navigation entries exist.
- **Not proven:** live CRUD behavior for every CMS resource, complete backend permission matrix, public FAQ/Page rendering, publish/visibility workflow and dedicated Playwright journeys.
- **Documentation:** `docs/REMAINING_FEATURES_IMPLEMENTATION_BACKLOG.md` and `.ai/current-task.md` clarified so existing screens are not mislabeled as missing.
- **Verification:** GitHub source inspection only; tests/builds NOT RUN in this documentation-only audit. Local Windows/Docker/PostgreSQL remain NOT VERIFIED.
- **Published documentation commits:** `1c4bc94e` (current-task CMS UI clarification), `0e2f7d96` (backlog CMS UI correction), `b985fd94` (worklog audit entry), `d4bc17ab` (coordination board), `fa8df04e` (CMS API audit and featured-filter finding), `d88f98c9` (current-task Backend finding), `00f210c2` (CMS API audit worklog). All updates were written to `main` and re-fetched successfully.
- **Next:** audit CMS route/service/API contract parity and then continue CRM/Support/Audit/Notifications/dashboard coverage.

## 2026-11-13 — SUPPORT-SLA-FALLBACK-AND-ACCEPTANCE

- **Code baseline:** `0d0a3866c6ff387978f8c5244f6ca936248f508d`.
- **CI:** [43474183592](https://github.com/gameacc2025/martest/actions/runs/43474183592) PASS — Frontend/Shared, Backend, Prisma and all three builds.
- **Migration:** [43474183157](https://github.com/gameacc2025/martest/actions/runs/43474183157) PASS — fresh PostgreSQL migration validation.
- **Runtime:** [43474183935](https://github.com/gameacc2025/martest/actions/runs/43474183935) PASS — Compose, health, migration status, seeds twice and 8/8 Playwright tests.
- **Support:** backend module, routes, service, API client and three-app workspace exist; browser test creates a ticket and posts a reply. SLA fallback for uncategorized tickets fixed; two unit tests cover fallback and category precedence.
- **Support remaining:** secure attachments, notification events, SLA calendar/worker/escalation, queue-level authorization and broader functional tests.
- **CRM remaining:** schemas/tests for non-lead route families, complete permission/tenant tests, conversion/merge idempotency and mutation E2E.
- **CMS/Recovery:** source and seeds exist; FAQ/Page CRUD acceptance and real SMS/reset E2E remain.
- **Local Windows/Docker/PostgreSQL:** NOT VERIFIED; no local destructive action taken.

# Project Worklog — Compact Index

این فایل شاخص وضعیت جاری و تحویل‌های تأییدشده است؛ تاریخچه کامل در Git نگهداری می‌شود.

## 2026-11-13 — CRM-LEAD-END-TO-END-ACCEPTANCE

- **Status:** CRM lead request/service/UI smoke acceptance PARTIAL and verified; broader CRM route coverage remains.
- **Request schemas:** Fastify schemas for lead create/update/assign/status/merge. Tests cover required fields, score bounds, ID format, assignment/status/merge contracts and permission denial.
- **Service tests:** lead normalization, score validation, active STAFF ownership, terminal lead protection and state-machine transitions.
- **UI bug fixed:** CRMWorkspace had unwrapped paginated API data into an array, then attempted to read `.data`, resulting in an empty Leads/Accounts view despite HTTP 200 and seeded rows. Added `unwrapPage` and applied it to lead/account lists.
- **Browser acceptance:** 8/8 Playwright tests PASS; STAFF login → PKCE handoff → CRM Leads; API returns seeded rows and the table is visible. Run `43463018256`.
- **CI:** run `43463018169` PASS — frozen install, Frontend/Shared tests, Prisma generation, Backend tests and all three builds.
- **Migration validation:** run `43463018358` PASS.
- **Code baseline:** `a281e3fb84978457e34d816b519ba2f664ea8caa`.
- **Docs:** backlog updated with CRM service/UI evidence; commit `db4d7dea29aa323c4061965e1b620b52f9960691`.
- **Still required for CRM:** schemas for remaining endpoint families, broader CRUD/service/permission/STAFF isolation, conversion/merge idempotency and create/update/assign/status Playwright journeys.
- **Other remaining:** Support vertical slice; CMS public/admin acceptance and real SMS delivery; generic SMS dispatcher; Audit event coverage; dashboard sample data; visual/accessibility regression.
- **Gated:** Retail/Finance activation requires explicit owner commercial/legal decisions.
- **Local state:** Windows working tree, stashes/untracked files, Docker and user PostgreSQL NOT VERIFIED; no local destructive action taken.

## 2026-11-13 — CI-RUNTIME-RECOVERY

- P0 CI, migration, runtime, seed and browser smoke acceptance PASS.
- E2E stale selector corrected from `.shop-page` to `.reference-home`; commit `4e5d25e38ecc63a40fe1477b9b47091340b5b298`.
- See `docs/REMAINING_FEATURES_IMPLEMENTATION_BACKLOG.md` for evidence and priorities.

## Current verified project facts

- Monorepo: Vue 3/Vite/Pinia/PrimeVue; Fastify/Prisma/PostgreSQL; JS/pnpm.
- Apps: Website/CUSTOMER, Company/COMPANY, Admin/STAFF.
- Core Auth/PKCE, company/product/catalog, B2B Inquiry/RFQ, CMS and CRM source exist.
- Support, Retail and Finance are not yet complete operational vertical slices.
- Canonical branch: `main`; no branches/worktrees/detached checkouts/PRs.
- Browser automation is authorized for acceptance; run sequentially and record evidence.
- Preserve local edits, untracked files, stashes and database state.

## Worklog rules

Append only concise verified entries: task ID, exact source SHA, changed paths, checks/results, commit SHA, blockers and next action. Never store credentials, secrets, personal data or raw logs.
