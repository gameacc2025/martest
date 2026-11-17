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
