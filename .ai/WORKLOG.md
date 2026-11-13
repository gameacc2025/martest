# Project Worklog — Compact Index

این فایل شاخص وضعیت جاری و تحویل‌های تأییدشده است؛ تاریخچه کامل در Git نگهداری می‌شود.

## 2026-11-13 — CRM-LEAD-REQUEST-VALIDATION

- **Status:** PARTIAL implementation; request validation tests PASS in full CI.
- **Changes:** Fastify JSON schemas added for CRM lead create/update/assign/status/merge; tests cover required fields, score bounds, id format, assignment/status/merge contracts and permission denial.
- **Implementation commits:** `724d603744443377ed52b20221928eb5f04f1aab`, `a6b36a58a66b2850dc0c2c6b8880cb13418095bd`, `430e74edcf866b57fd5961731cf1480f5c93c5a8`, `369500e0659a508eb371a16dd226220de78c45b6`, `0b78ae7ff24e55e9beec55a53739d059952bab56`.
- **Validation detail:** Fastify removes additional body properties by default; tests assert actual validation behavior. Nullable fields use JSON Schema `anyOf` to avoid Ajv strict-union warnings.
- **CI:** run `43461538717` PASS — frozen install, frontend/shared tests, Prisma generation, backend tests and all three builds.
- **Migration validation:** run `43461538821` PASS.
- **Runtime:** run `43461538743` PASS — Compose, health, migration status, seeds twice, Chromium and browser smoke 8/8.
- **Docs:** backlog refreshed with CRM partial state and current workflow evidence; commit `c00307d9e27b7898833a3a6f3bae16903e60a205`.
- **Still required for CRM:** schemas for remaining endpoint families, functional CRUD/service tests, STAFF/tenant isolation, conversion/merge idempotency and CRM Playwright journey.
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
