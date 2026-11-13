# Current Task — CI / Runtime Recovery and Project Backlog

**Updated:** 2026-11-13  
**Status:** P0 CI / Runtime / Seed / Browser acceptance PASS; P1 implementation remains.  
**Repository:** `gameacc2025/martest`  
**Canonical branch:** `main` only.  
**Verified code baseline:** `4e5d25e38ecc63a40fe1477b9b47091340b5b298`  
**Latest docs commit:** `0c11f53f550b35eb3900c66b4fb60140a3dc1f58`  
**Backlog:** `docs/REMAINING_FEATURES_IMPLEMENTATION_BACKLOG.md`  
**Owner communication:** Persian.

## Verified completed work

1. CI `43460213725`: frozen workspace install, architecture graph, all Frontend/Shared tests, Prisma Client generation, Backend tests, and Website/Company/Admin builds all PASS.
2. Database migration validation `43460213720`: fresh PostgreSQL migration apply and migration-state verification PASS.
3. Runtime `43460213998`: Compose configuration/build/start, Backend + three panel health checks, migration status, all development seeds run twice, Chromium install and browser smoke PASS.
4. All 8 Playwright tests PASS: Website/Company/Admin SPA rendering at 360/768/1366/1920/2560, API proxy checks for all three panels, STAFF login → PKCE handoff to Admin → logout, and storefront viewport containment.
5. Fixed stale E2E selector `.shop-page` to actual homepage root `.reference-home`; commit `4e5d25e38ecc63a40fe1477b9b47091340b5b298`.
6. Updated prioritized backlog with exact CI/runtime evidence; docs commit `0c11f53f550b35eb3900c66b4fb60140a3dc1f58`.

## Remaining execution queue

### P1 — operational domain completion
- **CRM acceptance:** add Fastify request/response schemas, functional CRUD/service/permission tests, STAFF/tenant isolation checks, conversion/merge idempotency coverage and a real Playwright CRM journey. Preserve existing CRM implementation; do not rewrite from scratch.
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
