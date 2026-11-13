# Current Task — CRM / Support Acceptance and Remaining Domains

**Updated:** 2026-11-13  
**Status:** P0 CI / migration / Runtime / seed / browser PASS. CRM and Support are PARTIAL operational vertical slices; remaining acceptance is tracked below.  
**Repository:** `gameacc2025/martest`  
**Canonical branch:** `main` only.  
**Verified code baseline:** `0d0a3866c6ff387978f8c5244f6ca936248f508d`  
**Latest CI:** [43474183592](https://github.com/gameacc2025/martest/actions/runs/43474183592)  
**Latest migration validation:** [43474183157](https://github.com/gameacc2025/martest/actions/runs/43474183157)  
**Latest Runtime:** [43474183935](https://github.com/gameacc2025/martest/actions/runs/43474183935)  
**Backlog:** `docs/REMAINING_FEATURES_IMPLEMENTATION_BACKLOG.md`  
**Owner communication:** Persian.

## Verified completed work

1. CI PASS: frozen install, architecture graph, all Frontend/Shared tests, Prisma Client generation, Backend tests and Website/Company/Admin builds.
2. Migration Validation PASS: fresh PostgreSQL migration apply and migration-state verification.
3. Runtime PASS: disposable Compose configuration/build/start; Backend + three panels healthy; migrations current; all development seeds run twice; Chromium installed; browser smoke PASS.
4. Playwright 8/8 PASS: STAFF login → PKCE handoff to Admin → CRM Leads seeded rows visible; Support ticket creation and reply; Website/Company/Admin render and API proxies; storefront responsive containment.
5. Fixed stale route-count assertion in `backend/src/app.test.js`: expected registered API routes corrected from 256 to 264.
6. Support is now an operational partial slice: module/routes/service, RBAC, API client, shared workspace in all three apps, migration and seed; E2E create/reply passes.
7. Fixed Support SLA fallback for uncategorized tickets: category-specific policy → global policy → active policy for the same priority. Added unit tests for fallback and precedence.
8. Support seed is idempotent in CI and creates 5 categories, 3 queues and 20 category/priority SLA policies.
9. CRM lead schemas exist for create/update/assign/status/merge; service tests cover normalization, score bounds, active STAFF ownership, terminal lead protection and state transitions; Playwright confirms Leads list rendering.
10. CMS FAQ/Page models, migration, services/routes and seeds exist; runtime seed passes. Account recovery routes/service exist with hashed one-time OTP controls; actual SMS provider delivery remains unverified.
11. Admin CMS source audit: all five management pages (articles, categories, tags, FAQs, static pages), their Admin routes, permission metadata and navigation entries are present on `main`. This confirms source/UI presence only; API-backed CRUD, permission matrix and browser acceptance for these screens are still NOT VERIFIED.
12. CMS Backend source audit: five route modules expose public reads and STAFF-only management CRUD with per-resource permissions and request schemas. A likely featured-filter type mismatch is identified: `article.routes.js` declares a boolean query but `article.controller.js` compares it to the string `'true'` while Fastify coercion is enabled. Regression test and fix remain pending.

## Remaining execution queue

### P1 — CRM acceptance
- Add Fastify JSON schemas to remaining CRM route families (accounts, contacts, pipelines/stages, opportunities, tasks, activities, notes, sources and query filters).
- Add functional CRUD/service tests, permission matrix and STAFF isolation.
- Prove conversion and merge idempotency/transaction safety.
- Add Playwright create/update/assign/status journey; preserve current CRM implementation.

### P1 — Support completion
- Add private attachment upload/download with authorization, storage validation and scanning lifecycle.
- Connect ticket/message/status events to notifications with retry/idempotency.
- Implement SLA working calendars, pause/resume, escalation worker and metrics; current SLA deadlines are calculated but no worker/calendar is verified.
- Add queue-level visibility and agent assignment UX; improve list pagination (current shared UI fetches at most 100).
- Expand service tests for create/message/status/assignment and tenant/permission isolation.

### P1 — CMS / Recovery / Notifications / Audit
- FAQ/Page public/admin CRUD, permission and browser E2E.
- Real SMS provider configuration and password-reset E2E in staging.
- Generic SMS outbox, consent/quota, retries and idempotency.
- Audit event coverage, redaction and retention.

### P1 — Dashboards and regression
- Replace or explicitly label sample Company/Settlement/Operations metrics.
- Use tenant/date/currency-scoped aggregate APIs.
- Expand RTL, keyboard/accessibility and visual QA beyond smoke.

### P2 — gated by owner decision
- Retail/Inventory/Orders/Payments/Fulfillment/Returns: no checkout activation before explicit commercial approval.
- Finance/Settlement: wait for currency, tax, commission, legal and payout policies plus Retail lifecycle.

### P3 — deferred
Procurement, HR, projects, advanced logistics/warehouse, marketing automation, BI and integrations need separately approved scope.

## Git / safety rules

- Main only; no new branch, worktree, detached checkout or PR.
- Lead alone stages/commits/pushes; no worker commits or pushes.
- Preserve local edits, untracked files, stashes and DB data.
- No reset/clean/force push, local DB reset/drop, or volume deletion.
- Do not bypass Fact-Forcing Gate or Auto Mode.
- GitHub Runtime is proven only on disposable Actions infrastructure; local Windows working tree/Docker/PostgreSQL remain NOT VERIFIED.

## Handoff requirements

Persian report with exact main SHA, changed paths, workflow URLs, test counts, migration/seed idempotency, browser evidence and blockers. Never report local environment as PASS without direct access.
