# Current Task — CRM Acceptance and Remaining Domain Work

**Updated:** 2026-11-13  
**Status:** P0 CI / Runtime / Seed / Browser PASS; CRM lead request/service/UI smoke acceptance PARTIAL and verified; broader P1 work remains.  
**Repository:** `gameacc2025/martest`  
**Canonical branch:** `main` only.  
**Verified code baseline:** `a281e3fb84978457e34d816b519ba2f664ea8caa`  
**Latest docs commit:** `db4d7dea29aa323c4061965e1b620b52f9960691`  
**Backlog:** `docs/REMAINING_FEATURES_IMPLEMENTATION_BACKLOG.md`  
**Owner communication:** Persian.

## Verified completed work

1. CI `43463018169`: frozen workspace install, architecture graph, all Frontend/Shared tests, Prisma Client generation, Backend tests and Website/Company/Admin builds PASS.
2. Database migration validation `43463018358`: fresh PostgreSQL migration apply and migration-state verification PASS.
3. Runtime `43463018256`: Compose configuration/build/start, Backend + three panel health checks, migration status, all development seeds run twice, Chromium and browser smoke PASS.
4. All 8 Playwright tests PASS. STAFF login → PKCE handoff to Admin → CRM Leads route; CRM list endpoint returns 200 and the seeded lead table is visible. Website/Company/Admin rendering, API proxies and storefront viewport checks remain green.
5. Fixed stale E2E selector `.shop-page` to actual homepage root `.reference-home`; commit `4e5d25e38ecc63a40fe1477b9b47091340b5b298`.
6. CRM lead mutation validation: Fastify schemas for create/update/assign/status/merge and request validation tests.
7. CRM service tests: lead normalization, score bounds, active STAFF owner, terminal lead protection and valid/invalid status transitions.
8. CRM UI pagination fix: `unwrapPage` preserves both rows and metadata for lead/account list responses. The Playwright CRM journey caught the prior empty-table bug; after fix, the seeded rows are visible.
9. CRM code commits include `724d603744443377ed52b20221928eb5f04f1aab`, `a6b36a58a66b2850dc0c2c6b8880cb13418095bd`, `430e74edcf866b57fd5961731cf1480f5c93c5a8`, `369500e0659a508eb371a16dd226220de78c45b6`, `0b78ae7ff24e55e9beec55a53739d059952bab56`, `2be13ce77d5c37cf6c4bf355cbe88d1fe9c60b31`, `82dee880ad974f746bc16b612fe470f853623ab3`, `a281e3fb84978457e34d816b519ba2f664ea8caa`.
10. Backlog refreshed with the CRM service/UI evidence; docs commit `db4d7dea29aa323c4061965e1b620b52f9960691`.

## Remaining execution queue

### P1 — operational domain completion
- **CRM acceptance:** complete request schemas for remaining route families; add broader functional CRUD/service tests, full permission matrix, STAFF isolation, conversion/merge idempotency and Playwright create/update/assign/status journey. Preserve existing CRM implementation; do not rewrite from scratch.
- **Support vertical slice:** implement tenant-safe backend routes/services, public/internal messages, queues/assignment/state machine, private authorized attachments, SLA, notifications, API client and real Website/Company/Admin screens. Existing support UI is preview-only and DB models alone are not completion.
- **CMS/Recovery acceptance:** source includes FAQ/Page models/migrations/services/routes/seeds and password-recovery OTP flow. Add/verify public/admin CRUD and permissions, real SMS provider configuration, and full password-reset browser test. CI seed success does not prove live SMS delivery.
- **Notifications/Audit:** generic SMS outbox/retry/consent/quota/idempotency; audit event coverage, redaction and retention.
- **Dashboards:** replace or clearly mark sample Company/Settlement/Operations KPIs; use tenant/date/currency-scoped aggregates.
- **UI regression:** expand beyond smoke to visual, RTL, keyboard/accessibility and feature-level journeys.

### P2 — explicitly gated
- Retail/Inventory/Orders/Payments/Fulfillment/Returns: do not activate checkout until owner approves commercial rules.
- Finance/Settlement: wait for currency, tax, commission, legal and payout decisions plus Retail lifecycle.

### P3 — deferred
Procurement, HR, projects, advanced logistics/warehouse, marketing automation, BI and integrations need separate approved scope.

## Git / safety rules

- Main only; no new branch, worktree, detached checkout or PR.
- Lead alone stages/commits/pushes; no worker commits or pushes.
- Preserve local edits, untracked files, stashes and DB data.
- No reset/clean/force push, local DB reset/drop, or volume deletion.
- Do not bypass Fact-Forcing Gate or Auto Mode.
- CI Runtime was tested on disposable GitHub Actions infrastructure; local Windows working tree/Docker/PostgreSQL remain NOT VERIFIED.

## Handoff requirements

Persian report with exact main SHA, changed paths, workflow URLs, test counts, migration/seed idempotency, browser evidence and blockers. Local environment remains NOT VERIFIED until directly observed.
