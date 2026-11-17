## 2026-11-17 — POLICY-AUDIT-2026-11-17 — Repository rules reconciliation

- **Status:** PARTIAL — confirmed rule conflicts and architecture-graph CI failure corrected; final CI/Runtime reruns are pending.
- **Application-code baseline:** `344a2ee049ac9a28eab48b53ce96b118d8224fc3`; all policy/documentation changes published directly to `main`.
- **Findings fixed:** Copilot English-only rule; stale English decision; blanket browser-test prohibition; ambiguous startup/push rules; non-main workflow triggers; detached-worktree instructions; stale Tailwind stack references; old palette; contradictory Support/CMS status; obsolete project-context snapshots; unmarked legacy prompt archives.
- **CI defect fixed:** architecture graph generator missed plugin-style CMS/CRM/Support modules and Inventory. Updated generator and generated graph; graph-check PASS observed on subsequent CI run.
- **Files:** `AGENTS.md`, `CLAUDE.md`, `.github/copilot-instructions.md`, `.ai/PROTOCOL.md`, `.ai/UI_SKILLS.md`, `.ai/decisions.md`, `.ai/project-context.md`, `.ai/agent-coordination/ACTIVE.md`, `.ai/current-task.md`, `.ai/WORKLOG.md`, `PROMPTS.md`, `.ai/PROMPTS.md`, `.github/workflows/database-migration-validation.yml`, `.github/workflows/runtime-validation.yml`, `docs/AI_AGENT_WORKFLOW.md`, `docs/AGENT_TASK_BRIEF_API_UI_SEED.md`, `docs/API_UI_SEED_EXECUTION_ROADMAP.md`, `Telecom_Marketplace_Project_Architecture_and_Roadmap.md`, `scripts/generate-architecture-graph.mjs`, `docs/architecture/DEPENDENCY_GRAPH.generated.mmd`.
- **Verification:** repository tree inventory (5,098 blobs; not all file contents read); canonical design tokens checked. CI on `8f9993f2` PASS (graph, frontend/shared tests, backend tests, three builds): https://github.com/gameacc2025/martest/actions/runs/44022899028 . Migration validation on `f12782af` PASS: https://github.com/gameacc2025/martest/actions/runs/44023060315 . CI and Runtime on `f12782af` still running at handoff.
- **Local verification:** no local Windows shell, Docker, or developer PostgreSQL access; these remain `NOT VERIFIED`. No local tests/builds were run.
- **Next:** wait for latest CI/Runtime; inspect remaining source-backed Audit retention, dashboard aggregate, and three-app regression gaps. Keep all writes serialized on `main`.

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
