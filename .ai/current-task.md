# Current Task — CI / Runtime Recovery and Project Backlog

**Updated:** 2026-11-13  
**Status:** SOURCE FIXES IN PROGRESS; CI/RUNTIME RE-RUNS PENDING.  
**Repository:** `gameacc2025/martest`  
**Canonical branch:** `main` only.  
**Current source baseline:** `06daab07ff446aab577b885092a45c382ccd11ad` (docs updates follow in Git history).  
**Audit/backlog:** `docs/REMAINING_FEATURES_IMPLEMENTATION_BACKLOG.md`  
**Owner communication:** Persian.

## Confirmed progress

1. Frozen workspace install now passes; `apps/admin` quill is present in its lockfile importer. The earlier lockfile-mismatch diagnosis was incorrect.
2. Last completed CI run on `f8baed460b443270c0b6bd7532d55a99f8714b5a`: Prisma Client generation, Backend tests and Website/Company/Admin build PASS. Frontend/shared tests still had 7 failures; follow-up test and source fixes were pushed through `06daab0`; rerun is pending.
3. Audit route mounting is normalized to `/api/v1/audit/*`; stale duplicate OpenAPI keys removed. Backend route inventory/OpenAPI tests passed in the previous completed CI run.
4. CMS FAQ/Page models, migration `20261113000100_restore_cms_faq_pages`, service/routes and seed now exist. Runtime verification is pending.
5. Public password recovery routes and SMS OTP service exist, including hashed single-use challenge, rate limits, expiry, attempt limits, atomic password update and refresh-session revocation. Real SMS provider configuration and browser acceptance remain unverified.
6. Runtime failure was traced to PostgreSQL enum drift: schema included `LOGIN_MFA`, but DB enum did not. Added additive migration `20261113000300_add_login_mfa_challenge_purpose`. Migration validation and runtime/seed reruns are pending.
7. Support is still DB foundation only; CRM source exists but request schemas/functional tests/E2E are incomplete. Retail and Finance remain gated by owner decisions.

## Current execution queue

### P0 — Establish reliable CI and runtime
1. **P0-1 Frontend tests:** get all Vitest suites green; then CI and three-app builds.
2. **P0-2 Runtime:** apply all migrations on disposable PostgreSQL; all Compose services healthy; run seeds twice; complete Chromium/browser smoke for Website/Company/Admin.
3. **P0-3 CMS/Recovery acceptance:** FAQ/Page public/admin CRUD and permissions; SMS provider config and reset flow E2E.
4. **P0-4 Docs/policy:** keep API inventory/OpenAPI aligned; remove conflicting worktree/detached checkout rules and stale palette references.

### P1 — Operational domain completion
- CRM Fastify schemas, CRUD/service/tenant/permission tests, seed idempotency and Playwright workflow.
- Support backend/service/API client plus tenant-safe Website/Company/Admin ticket journeys, private attachments, queues, assignment and SLA.
- Generic SMS outbox/retry/consent/quota/idempotency; Audit event coverage, redaction and retention.
- Replace sample Company dashboard/Settlement/Operations KPIs with real tenant-scoped aggregates.
- Three-app RTL, responsive, keyboard/accessibility and browser regression.

### P2 — Explicitly gated
- Retail/Inventory/Orders/Payments/Fulfillment/Returns: do not activate checkout until owner approves commercial rules.
- Finance/Settlement: wait for currency, tax, commission, legal and payout decisions plus Retail lifecycle.

### P3 — Deferred
Procurement, HR, projects, advanced logistics/warehouse, marketing automation, BI and integrations need separate approved scope.

## Git / safety rules

- Main only; no new branch, worktree, detached checkout or PR.
- Lead alone stages/commits/pushes; no worker commits or pushes.
- Preserve local edits, untracked files, stashes and DB data.
- No reset/clean/force push, local DB reset/drop, or volume deletion.
- Do not bypass Fact-Forcing Gate or Auto Mode.
- Report PASS only with exact observed CI/runtime/browser evidence.

## Handoff requirements

Persian report with exact base/resulting main SHA, changed paths, workflow URLs, test counts, migration/seed idempotency, browser evidence and blockers. Local Windows Git/Docker/PostgreSQL remain NOT VERIFIED until directly observed.
