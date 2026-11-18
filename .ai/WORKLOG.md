## 2026-11-17 — DAILY-SOURCE-AUDIT — Application, Security and Database Acceptance

- **Application-code baseline:** 344a2ee049ac9a28eab48b53ce96b118d8224fc3; **main HEAD before this audit:** cab169e497248d5cd8c8f5fe193638977b964de9.
- **Progress check:** 43 commits / 25 files after the code baseline are governance, docs, workflows and generated architecture graph only. No application code, Prisma schema or migration changed. 56536dc → cab169e is Worklog-only.
- **CI:** PASS on 56536dc, run [44024957523](https://github.com/gameacc2025/martest/actions/runs/44024957523); architecture graph, frontend/shared tests, backend tests and three builds completed.
- **Database Migration:** PASS on 56536dc, run [44024957659](https://github.com/gameacc2025/martest/actions/runs/44024957659); fresh PostgreSQL migration deploy and status passed.
- **Runtime:** run [44024957549](https://github.com/gameacc2025/martest/actions/runs/44024957549) was CANCELLED at service-health wait. Compose validation and build/start passed; health, migration verification, seed-twice and browser smoke were cancelled/skipped. Do not treat this as Runtime PASS.
- **P0 schema drift:** Prisma declares 101 models / 58 enums; migration SQL creates 97 tables. Missing tables and comments: Faq, Page, LeadStatusHistory, CRMFieldAudit. CMS seed uses Faq/Page; CRM service writes LeadStatusHistory/CRMFieldAudit. Migration CI does not check live schema parity or run seeds.
- **CRM:** 41 route handlers / 21 named schemas. POST /leads/:id/status omits actorUserId although service requires it. 6 service + 7 route tests do not exercise valid status-route success or all non-Lead CRUD/transaction paths.
- **Support:** attachments and working-calendar tests exist (45 service tests). Pause/resume only records events; worker pause check is a placeholder. SLA warning/escalation recipient lookup sends to all active STAFF when a queue is assigned; no queue filter or worker test was found.
- **Audit:** PostgreSQL append-only trigger confirmed. Redaction matcher has mixed-case key mismatch for apiKey/privateKey/creditCard/cardNumber/nationalId/bankAccount. Existing 17 service tests cover reads/queries/export, not writer/redaction. Retention/archival not found.
- **Notifications:** SMS outbox and quota/dedupe tests exist, but preference service still returns smsAvailable=false while SUPPORT_SLA_ESCALATED defaults SMS=true; missing preference falls back to that event default. Provider delivery not verified.
- **Dashboards / Website / Company:** admin orders count aliases inquiries; OperationsHub and retail-order pages contain sample rows; Company sales chart is sample. Website Cart/Checkout/Orders routes remain registered despite AD-4, though checkout submission is disabled and cart is local-only.
- **Owner decisions:** AD-1 CUSTOMER RFQ, AD-3 COMPANY_MANAGER user permissions, AD-4 B2C routes remain unchanged pending approval.
- **Local verification:** no local Windows/Docker/PostgreSQL/tests/builds were available or run. No product code or database was changed.
- **Documentation:** current-task, ACTIVE, backlog and migration runbook updated with this audit.

---

## 2026-11-17 — Validation refresh after decision-drift findings

- **Reviewed main SHA:** `56536dc1e6cbcea3f5ae295102a008c470360c7b`.
- **CI:** PASS — run 3422, including architecture graph check, frontend/shared tests, backend tests, and three app builds: https://github.com/gameacc2025/martest/actions/runs/44024957523
- **Database Migration Validation:** PASS — run 2998: https://github.com/gameacc2025/martest/actions/runs/44024957659
- **Runtime Validation:** IN PROGRESS — run 2801. Compose configuration passed; build/start of PostgreSQL, backend, and three frontend panels was running at last inspection: https://github.com/gameacc2025/martest/actions/runs/44024957549
- **Decision drift:** AD-1 CUSTOMER RFQ creation, AD-3 COMPANY_MANAGER over-broad seed permissions, and AD-4 active B2C routes are now recorded in Architecture Decisions, role-access matrix, project context and ACTIVE board. No business or permission behavior changed without owner approval.
- **Next:** wait for Runtime Validation; request owner decisions for AD-1/AD-3/AD-4 before changing behavior.

---

## 2026-11-17 — POLICY-AUDIT-2026-11-17 — Governance and source-backed decision audit

- **Status:** PARTIAL — governance rules reconciled; three source/decision mismatches documented for owner decision; Runtime Validation was still running at last check.
- **Main-only policy:** all changes committed directly to `main`; no local branch/worktree/force-push operations were performed.
- **Governance conflicts fixed:** Copilot language; stale English decision; browser-test prohibition; inconsistent startup-reading and lead-push wording; detached-worktree instructions; stale Tailwind references; Prisma version documentation; old palette; historical prompt instructions; obsolete October quality report; frozen architecture review wording.
- **CI defect fixed:** generated architecture graph missed plugin-style CMS/CRM/Support modules and Inventory. Updated generator and graph; architecture graph check now passes.
- **Source-backed mismatches recorded (no behavior changed):**
  1. AD-1 prohibits CUSTOMER Inquiry creation, but CUSTOMER_USER seed grants `leads.create`/`inquiries.create`, the POST route allows CUSTOMER, and the service creates buyer-owned OPEN inquiries.
  2. AD-3 prohibits COMPANY user creation/edit/role assignment, but COMPANY_MANAGER seed still grants `users.create`/`users.update`/`users.assign_roles`; service guard and tests deny those operations. Permission cleanup needs explicit approval.
  3. AD-4 says B2C routes/UI are disabled, but Website router registers `/cart`, `/checkout`, `/orders`. Owner decision needed; no route behavior changed.
- **Other source checks:** Vue/PrimeVue/SCSS/JavaScript stack and absence of Tailwind confirmed from all app/shared package manifests; backend manifest confirms Prisma 7.10.1; Company user-service tests confirm service-level denials.
- **Files:** `AGENTS.md`, `CLAUDE.md`, `.github/copilot-instructions.md`, `.ai/PROTOCOL.md`, `.ai/UI_SKILLS.md`, `.ai/decisions.md`, `.ai/project-context.md`, `.ai/agent-coordination/ACTIVE.md`, `.ai/current-task.md`, `.ai/WORKLOG.md`, `PROMPTS.md`, `.ai/PROMPTS.md`, `.github/workflows/ci.yml`, `.github/workflows/database-migration-validation.yml`, `.github/workflows/runtime-validation.yml`, `docs/AI_AGENT_WORKFLOW.md`, `docs/AGENT_TASK_BRIEF_API_UI_SEED.md`, `docs/API_UI_SEED_EXECUTION_ROADMAP.md`, `docs/ARCHITECTURE_DECISIONS.md`, `docs/role-access-matrix.md`, `docs/README.md`, `docs/REPOSITORY_QUALITY_AUDIT_2026-10-26.md`, `Telecom_Marketplace_Project_Architecture_and_Roadmap.md`, `scripts/generate-architecture-graph.mjs`, `docs/architecture/DEPENDENCY_GRAPH.generated.mmd`.
- **Verification:** CI on `822f6cb4` PASS (graph, frontend/shared tests, backend tests, three builds): https://github.com/gameacc2025/martest/actions/runs/44024556530 . Migration validation on `822f6cb4` PASS: https://github.com/gameacc2025/martest/actions/runs/44024556605 . Runtime on `822f6cb4` still in progress; Compose config passed and service startup was running: https://github.com/gameacc2025/martest/actions/runs/44024556526 .
- **Local verification:** no local Windows shell, Docker, or developer PostgreSQL access; these remain `NOT VERIFIED`. No local tests/builds were run.
- **Next:** wait for Runtime Validation; get owner decisions for AD-1/AD-3/AD-4; only then implement any approved business/permission changes. Continue Audit retention, dashboards and three-app regression source audits.

---

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


---

## 2026-11-18 — PROJECT-WIDE-AUDIT-AND-REPAIR

- **Status:** IN_PROGRESS — project-wide source audit and staged repairs underway.
- **Baseline:** `cef559d4ffa9dc3c5c3c98967ea08cd4e522060d`; all changes below were committed directly to existing `main`.
- **Fixes:** Audit redaction key normalization + nested/case-variant test (`3cb9f940`, `2316e552`); CRM lead-status route now passes actor ID + route contract test (`0281b639`, `849df765`); corrected stale Tailwind architecture description (`c4590a27`); added forward-only migration for Faq, Page, LeadStatusHistory and CRMFieldAudit with indexes/FKs/comments (`784999f1`); updated DB runbook (`3403c0d1`) and migration CI table-existence assertion (`eb1511a2`).
- **Verification:** No local tests/builds/DB commands were run. GitHub push-triggered CI and migration workflow for the new HEAD are **PENDING / NOT VERIFIED**; fresh DB, seed-twice and existing DB upgrade remain unverified.
- **Scope boundary:** GitHub connector only; Windows working tree, Docker daemon and local PostgreSQL are inaccessible. No production DB or secrets were accessed.
- **Open blockers:** Support SLA pause/resume and queue recipient scoping; audit writer coverage and retention; SMS event-default/consent mismatch; misleading dashboard sample data; source drift against accepted AD-1/AD-3/AD-4; three-app regression and remaining domain audits.
- **Next:** Inspect Support SLA worker/assignment schema and implement a tested, queue-scoped pause/resume slice. Continue the whole-repository audit in bounded slices.


---

## 2026-11-18 — PROJECT-WIDE-AUDIT-AND-REPAIR (second slice)

- **Status:** IN_PROGRESS — multiple source-backed repairs committed; three GitHub Actions workflows are running for current main.
- **Main SHA:** `58c8de6102181630903883cf56a2adb8535e21f5`.
- **Support SLA:** fixed worker import/startup behavior and exported `runOnce` used by server; scoped recipients to active STAFF assignees in the same queue and removed broad all-staff fallback; implemented pause/resume by elapsed working minutes and persisted deadline shifts. Added worker/service tests.
- **AD-1 / AD-3:** CUSTOMER RFQ creation denied in route and service; seed removes create grants and reconciles stale COMPANY user-management grants; customers retain owner-checked actions on existing inquiries. Added backend tests.
- **AD-4:** removed active cart/checkout/orders routes and global cart UI; removed cart actions from Home/ProductListing/SearchResults/CompanyProfile; shared ProductCard cart/wishlist controls are opt-in and default off. Added Website/shared UI tests; dormant future-phase components/stores retained.
- **Audit:** CRM lead merge now calls transaction-aware central audit writer; added HTTP/explicit writer tests for request context and sensitive-field redaction. Audit retention period/archival remains unresolved and is not being guessed.
- **Notifications:** all event SMS defaults are OFF; Twilio configuration is validated and required before preferences or queueing; SMS remains explicit opt-in + quota. Added provider/default/quota tests and corrected notification docs. Live Twilio delivery is NOT VERIFIED.
- **Database:** added complete Prisma-model-to-PostgreSQL table parity checker and tests; migration and runtime workflows now invoke it. Runbook updated.
- **CI evidence:** CI run `44227272875`, Database Migration Validation `44227272649`, Runtime Validation `44227272595` are **IN_PROGRESS** for the current main SHA. Frontend/shared tests are running; migration and Compose checks have not completed. No local test command was run in this session.
- **Remaining:** make SLA working-calendar calculations respect the configured timezone; verify all audit producers use the central writer and decide retention/archival; replace dashboard sample metrics with scoped real aggregates; continue auth/RBAC/CMS/catalog/retail/finance and three-app regression audits.
- **Next:** poll the three current workflow runs, fix any failures, then continue the timezone-aware SLA and audit-producer slices.
