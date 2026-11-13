# Project Worklog — Compact Index

این فایل شاخص وضعیت جاری و تحویل‌های تأییدشده است؛ تاریخچه کامل در Git نگهداری می‌شود.

## 2026-11-13 — CI-RUNTIME-RECOVERY

- **Status:** P0 CI, migration, runtime, seed and browser smoke acceptance PASS.
- **Code fix:** `e2e/tests/panels.spec.js` changed stale `.shop-page` selector to actual `.reference-home`; commit `4e5d25e38ecc63a40fe1477b9b47091340b5b298`.
- **CI:** run `43460213725` PASS — frozen install, architecture graph, Frontend/Shared tests, Prisma generation, Backend tests, all three app builds.
- **Migration validation:** run `43460213720` PASS — fresh PostgreSQL migration apply and migration state.
- **Runtime:** run `43460213998` PASS — Compose build/start, all service health endpoints, migration status, all development seeds twice, Chromium, browser smoke.
- **Browser:** 8/8 Playwright tests PASS — Website/Company/Admin SPA at five viewport widths, three API proxies, STAFF login → Admin handoff → logout, storefront responsive containment.
- **Docs:** backlog refreshed with evidence and priorities; commit `0c11f53f550b35eb3900c66b4fb60140a3dc1f58`.
- **Remaining:** CRM functional/schema/tenant/E2E acceptance; Support operational vertical slice; CMS public/admin acceptance + real SMS delivery; generic SMS dispatcher; Audit event coverage; dashboard sample data; visual/accessibility regression.
- **Gated:** Retail/Finance activation requires explicit owner commercial/legal decisions.
- **Local state:** Windows working tree, stashes/untracked files, Docker and user PostgreSQL NOT VERIFIED; no local destructive action taken.

## 2026-11-13 — PROJECT-SOURCE-AUDIT

- Remote source audit and prioritized backlog completed. Initial findings were corrected as new commits and CI evidence became available.
- See `docs/REMAINING_FEATURES_IMPLEMENTATION_BACKLOG.md` for current status matrix, evidence, risks and priorities.

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
