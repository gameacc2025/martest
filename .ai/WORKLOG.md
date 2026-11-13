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
