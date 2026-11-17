## 2026-11-17 — POLICY-AUDIT-2026-11-17 — Repository rules reconciliation

- **Status:** PARTIAL — confirmed policy conflicts corrected and published; repository-wide source audit and latest CI verification remain open.
- **Baseline:** application code `344a2ee049ac9a28eab48b53ce96b118d8224fc3`; all edits remain on `main`.
- **Findings fixed:** Copilot English-only rule; stale English decision; blanket browser-test prohibition; ambiguous lead push authorization; feature-branch CI triggers; detached-worktree instruction; stale/contradictory coordination blockers; outdated project context and design palette.
- **Files:** `AGENTS.md`, `.ai/PROTOCOL.md`, `.ai/UI_SKILLS.md`, `.ai/decisions.md`, `.ai/current-task.md`, `.ai/agent-coordination/ACTIVE.md`, `.ai/project-context.md`, `.github/copilot-instructions.md`, `.github/workflows/database-migration-validation.yml`, `.github/workflows/runtime-validation.yml`, `docs/AI_AGENT_WORKFLOW.md`, `Telecom_Marketplace_Project_Architecture_and_Roadmap.md`.
- **Commits:** `6399106b`, `9dab428c`, `0d32abc2`, `bf67c537`, `5562f41f`, `32a8ed10`, `e7bd0218`, `4ce322e4`, `f05efee5`, `6ea90955`, `092c85ab`, followed by this handoff update.
- **Verification:** Confirmed token values from `newtemp-reference.scss`; inspected the 5,098-blob repository tree and key governance documents. No local tests/builds were run. Latest CI/migration/runtime checks must be verified on the final HEAD; local Windows/Docker/PostgreSQL remain `NOT VERIFIED`.
- **Next:** Check latest GitHub Actions results; audit all remaining tool-specific entrypoints and source-backed open lanes (Audit retention, dashboards, three-app regression); update this task only with observed evidence.

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
