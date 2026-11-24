# PROJECT-WIDE-AUDIT-AND-REPAIR-2026-11-19

**Status:** 2026-11-23 — Workstreams A, B (integrity), C and D executable slices completed; latest exact-main CI, fresh PostgreSQL migration and Docker/E2E validation all PASS. Dashboard/reporting is partially hardened; remaining KPI/date/tenant acceptance and broad UI accessibility verification remain open. Owner/environment decisions remain open.
**Repository:** gameacc2025/martest  
**Integration branch:** main only; lead owns serialized writes/commits/pushes.  
**Latest fully tested code SHA:** `ecbaa485fca8ebfd328abc2e658acf49c733ea1e`

## 2026-11-24 — Retail catalog and checkout preview API acceptance

- Added the Retail backend module with public `GET /api/v1/retail/catalog` and `GET /api/v1/retail/catalog/:id`, plus CUSTOMER-context-only `POST /api/v1/retail/checkout/preview`.
- Catalog filters to published/public products with `retailEnabled=true`, an active positive minQuantity=1 tier, and returns an in-stock flag without exposing exact supplier stock quantities.
- Checkout preview re-reads current product price tiers and inventory from PostgreSQL, computes Decimal-safe line/seller subtotals, rejects unavailable stock, and returns explicit policy blockers. It does not create orders, reservations, payments or movements; shipping/tax/grand total remain null rather than fabricated.
- Added Products API service filter `retailPurchasable`, Retail service/controller/routes/tests, API client endpoints, app registration, OpenAPI/route inventory and architecture graph updates.
- Added a real PostgreSQL catalog/preview probe. It found 24 eligible products, reconciled current price and stock, confirmed exact stock is not public, and confirmed preview causes no order/payment/reservation/inventory mutation.
- **Verified code SHA:** `ecbaa485fca8ebfd328abc2e658acf49c733ea1e`.
- **CI PASS:** [45357202796](https://github.com/gameacc2025/martest/actions/runs/45357202796) — 1,864 backend tests, 73 frontend/shared test files, 18 architecture/session tests and all three production builds.
- **Fresh PostgreSQL migration PASS:** [45357202714](https://github.com/gameacc2025/martest/actions/runs/45357202714) — 19 migrations and 101 Prisma model/table parity.
- **Runtime PASS:** [45357202762](https://github.com/gameacc2025/martest/actions/runs/45357202762) — 90 retail seed balances/receipts unchanged on repeat; 24-product catalog and checkout preview probe; Price Tier and Inventory concurrency; notification idempotency; 8/8 Playwright; teardown.

## 2026-11-24 — Inventory API registration and Website retail discovery fixes

- Registered the existing, tenant-scoped Inventory API at `/api/v1/inventory` (8 routes). STAFF-only stock writes remain protected; Company/STAFF reads remain service-scoped. Added app-level unauthenticated 401 probes for all routes and updated route count/OpenAPI inventory from 285 to 293.
- Added Inventory entries to the generated architecture dependency graph and updated the generated graph artifact.
- Fixed Website retail sales-mode detection: public Product API returns the `prices` projection and does not synthesize `finalPrice`; retail price is now selected from the current minQuantity=1 tier only when `retailEnabled=true`. Added ProductListing regression coverage.
- Fixed Wishlist localStorage handling for SSR/unavailable storage, malformed JSON and numeric/string IDs; Wishlist now calls the real Cart Store `addItem` API and only adds retail-enabled items with a valid retail tier. Added store tests.
- **Verified code SHA:** `351f218d1f7f41949d4cb6cd52334e50e253e252`.
- **CI PASS:** [45354911089](https://github.com/gameacc2025/martest/actions/runs/45354911089) — 1,855 backend tests, 73 frontend/shared test files, 18 architecture/session tests and all three production builds; architecture graph check PASS.
- **Fresh PostgreSQL migration PASS:** [45354911207](https://github.com/gameacc2025/martest/actions/runs/45354911207) — 19 migrations and 101 Prisma model/table parity.
- **Runtime PASS:** [45354911067](https://github.com/gameacc2025/martest/actions/runs/45354911067) — all services healthy, seeds twice, 90 retail seed balances/immutable receipts unchanged on repeat, Price Tier concurrency/max-Int, Inventory reservation/transition concurrency, notification idempotency, 8/8 Playwright smoke tests and teardown.

## 2026-11-24 — Retail seed activation and idempotency acceptance

- Replaced the random retail seed with deterministic, demo-only stock initialization. Only explicitly retail-enabled `demo-*` products receive synthetic stock; existing balances are skipped and never overwritten; no fake active reservations or random movement history are created.
- The demo marketplace seed now marks a deterministic subset of sample products `retailEnabled=true` so CI exercises the active B2C retail fixture path. Other demo products remain B2B-only.
- Added `backend/scripts/verify-retail-seed-idempotency.js` and wired it into Runtime Validation. It verifies all demo retail products have one balance and one immutable receipt, then reruns the seed and confirms balances and movement history are unchanged.
- **Verified code SHA:** `3b52d79a1008f90d7b47bbb214359392e4715bf0`.
- **CI PASS:** [45352600584](https://github.com/gameacc2025/martest/actions/runs/45352600584) — 1,854 backend tests, 413 frontend/shared tests across 72 files, 18 architecture/session tests and all three production builds.
- **Fresh PostgreSQL migration PASS:** [45352600590](https://github.com/gameacc2025/martest/actions/runs/45352600590) — 19 migrations and 101 Prisma model/table parity.
- **Runtime PASS:** [45352600586](https://github.com/gameacc2025/martest/actions/runs/45352600586) — all services healthy; 19 migrations; all seeds twice; 90 demo retail balances and 90 immutable receipt movements unchanged on a repeated retail seed; Price Tier and Inventory PostgreSQL concurrency probes; notification idempotency; 8/8 Playwright smoke tests; successful teardown.

## 2026-11-24 — Inventory concurrency hardening and real PostgreSQL probe

- Added namespaced PostgreSQL transaction advisory locking for every inventory balance mutation path (adjust, reserve, release, consume, expiry and atomic adjustment).
- Added compare-and-set reservation transitions, exact checkout-key replay validation, stable movement idempotency keys, and the invariant that physical stock cannot fall below active reservations.
- Fixed Prisma advisory-lock query projection to return a scalar (Prisma cannot deserialize PostgreSQL `void`).
- Added a disposable PostgreSQL runtime probe covering concurrent reservations against five units, exact checkout replay, reserved-stock adjustment rejection, and a release-vs-consume race. The probe verifies one winner per race, one reservation ledger entry, a terminal reservation, zero reserved stock and consistent physical stock.
- InventoryMovement is append-only. The runtime probe therefore keeps its immutable test ledger in the disposable CI database, deletes mutable reservation/balance rows and soft-deletes its private draft product; the workflow destroys the entire database at teardown.
- **Verified code SHA:** `52a828076751fc29f14a6685a8cfc70275b1884a`.
- **CI PASS:** [45351848869](https://github.com/gameacc2025/martest/actions/runs/45351848869) — 1,854 backend tests, 413 frontend/shared tests across 72 files, 18 architecture/session tests and all three production builds.
- **Fresh PostgreSQL migration PASS:** [45351848765](https://github.com/gameacc2025/martest/actions/runs/45351848765) — 19 migrations and 101 Prisma model/table parity.
- **Runtime PASS:** [45351848650](https://github.com/gameacc2025/martest/actions/runs/45351848650) — all services healthy, seeds twice, Price Tier concurrency/max-Int, Inventory reservation/transition concurrency, notification idempotency, 8/8 Playwright smoke tests and successful teardown.

## 2026-11-24 — B2C decision and inventory controller first repair

- Owner approved simultaneous B2C retail and B2B Inquiry/RFQ operation; previous AD-4 freeze is superseded and Workstream H is active.
- Fixed missing Prisma Client import in `backend/src/modules/inventory/inventory.controller.js` and added `inventory.controller.test.js` proving the stock-adjustment handler opens a transaction and forwards the authenticated actor.
- **Verified code SHA:** `af1bd11e1bad74f4a3b430b770adbe7b7913f2c7`.
- **CI PASS:** [45349603821](https://github.com/gameacc2025/martest/actions/runs/45349603821) — 1,852 backend tests, 413 frontend/shared tests across 72 files, 18 architecture/session tests and all three production builds.
- **Fresh PostgreSQL migration PASS:** [45349603792](https://github.com/gameacc2025/martest/actions/runs/45349603792) — all 19 migrations and 101 Prisma model/table parity.
- **Runtime PASS:** [45349603776](https://github.com/gameacc2025/martest/actions/runs/45349603776) — all services healthy, 19 migrations, seed command twice, Price Tier concurrency/max-Int and notification idempotency probes, 8/8 Playwright smoke tests and successful teardown.
- **Important coverage gap:** both runtime seed passes log `No retail-enabled published products found; retail fixtures skipped.` Therefore the green generic seed-idempotency gate does not exercise the retail seed's data path. The demo marketplace seed currently does not mark demo products `retailEnabled`.

## Exact-main verification — 2026-11-23

- **CI PASS:** [45121208916](https://github.com/gameacc2025/martest/actions/runs/45121208916) — 1,851 backend tests, 413 frontend/shared tests, 18 architecture/session tests; Website, Company and Admin production builds all succeed.
- **Fresh PostgreSQL migration PASS:** [45121209002](https://github.com/gameacc2025/martest/actions/runs/45121209002) — all 19 migrations, Prisma validation/client generation and model/table parity.
- **Runtime PASS:** [45121208967](https://github.com/gameacc2025/martest/actions/runs/45121208967) — Docker services healthy, 19 migrations, 101 Prisma models/102 database tables with parity PASS, seeds twice, PostgreSQL Price Tier overlap race and max-Int boundary, notification delivery claim/idempotency probes, AD-1/AD-3 grant checks, 8/8 Playwright tests and teardown.
- **Verified code SHA:** `692a64498d276fd91006717845a7d105920d5ed7`.

## Owner decision update — 2026-11-24: parallel B2C + B2B

The owner has explicitly approved B2C retail commerce operating simultaneously with the existing B2B Inquiry/RFQ marketplace. This supersedes the earlier AD-4 freeze that disabled Cart / Checkout / Orders / Wishlist. Do not restart or weaken B2B workflows. Execute the new B2C workstream appended below in parallel with the existing dashboard, CRM and Support acceptance work. The approval does not authorize live charges, payouts, production deployment, or invented tax/shipping/commission/returns policy.

## 2026-11-23 — Dashboard/reporting correctness repairs

Verified application-code SHA: `692a64498d276fd91006717845a7d105920d5ed7`.

- Company product reports no longer request `limit: 500` (the backend silently caps list pages at 100). The report fetcher now walks every page, validates page metadata and total row count, and fails visibly if the dataset changes or the result is incomplete.
- Product pagination now has a unique ID tie-breaker after the selected sort field, avoiding nondeterministic ordering between rows with equal sort values.
- Product report metrics and charts include all seven Product lifecycle states. Inquiry report metrics and CSV exports include all seven InquiryStatus values; the status-group sums must reconcile with sent/received totals or the UI reports an API contract error.
- CSV export quotes cells and prefixes spreadsheet-formula-like values, including values with leading whitespace, to prevent formula injection.
- Company statistics now exclude soft-deleted products from total/published counts and recent-product lists.
- Exact-main CI: [45121208916](https://github.com/gameacc2025/martest/actions/runs/45121208916) — 1,851 backend tests, 413 frontend/shared tests across 72 files, 18 architecture/session tests, all three production builds.
- Fresh PostgreSQL migration: [45121209002](https://github.com/gameacc2025/martest/actions/runs/45121209002) — 19 migrations; 101 Prisma models and 102 database tables; schema parity PASS.
- Docker runtime: [45121208967](https://github.com/gameacc2025/martest/actions/runs/45121208967) — all services healthy, all seeds twice, real PostgreSQL Price Tier overlap/max-Int probes, notification delivery/idempotency probes, AD-1/AD-3 role checks, 8/8 Playwright smoke tests and successful teardown.
- Still open in F1/F2: full KPI contract inventory, explicit date/time boundary policy, tenant-scoped reporting/export authorization matrix, large-dataset performance and broader filter/export reconciliation. F3-F5 visual, contrast, zoom, reduced-motion and keyboard audits remain incomplete.

## First ten scoped audit slices — 2026-11-20

1. Main baseline and evidence separation.
2. FAQ create/update/delete central transactional AuditLog.
3. Static Page create/update/delete central transactional AuditLog.
4. Article Category mutations: actor forwarding, transactional events and snapshots.
5. Article Tag mutations: actor forwarding, transactional events and snapshots.
6. CMS preview-token issue/consume audit; conditional transactional single-use claim; token secret excluded.
7. Settings profile/password audit; password update and refresh-token revocation atomic.
8. Avatar upload/delete audit; file cleanup after DB success.
9. Product status transition audit alongside existing domain history.
10. Product soft-delete audit plus test alignment and final exact-main CI/migration/runtime reconciliation.

Final code source SHA: `db7b170ff308032053c46f6ff891be9fdac0e800`. Broader audit remains open for Product price/image/document subresources, CMS Article revision/relationships, remaining auth/admin sensitive actions, retention/legal direction, public seller visibility and dashboard/accessibility completeness.


## Second ten scoped audit slices — 2026-11-20

11. Product price-tier create/update/delete: central transactional AuditLog with before/after snapshots.
12. Product image upload/delete/primary/reorder: central transactional AuditLog.
13. Product document upload/delete: central transactional AuditLog.
14. Product Service now checks COMPANY operation permissions and ownership, not just route middleware.
15. CMS Article create/update category assignments now map categoryId and sortOrder as declared by route schema.
16. Article revision restore tests verify categories/tags are restored and audit is transaction-bound.
17. Product uploads validate JPEG/PNG/GIF/WebP/PDF file signatures and reject spoofed MIME/extension content.
18. Upload audit failures reject and clean the stored file; failure behavior is covered by tests.
19. Product create/update now write central transactional AuditLog events with minimized snapshots.
20. Update this task/ACTIVE/WORKLOG evidence to exact tested source SHA.

Exact tested code source SHA: `c78e6d950b54695030518c8963053f8fc13be6f5`. CI: [44655876783](https://github.com/gameacc2025/martest/actions/runs/44655876783); migration: [44655876652](https://github.com/gameacc2025/martest/actions/runs/44655876652); runtime: [44655876772](https://github.com/gameacc2025/martest/actions/runs/44655876772).


## Additional hardening — 2026-11-22

- Fixed the Price Tier range migration with int8range and an unbounded NULL upper bound; the max Int inclusive boundary is valid.
- Resolved the Seed P2020 failure; all seed modules execute twice successfully on fresh PostgreSQL.
- Added a Runtime Validation probe using two actual concurrent Prisma inserts. PostgreSQL accepts one overlapping range and rejects the other through the exclusion constraint; the max-Int inclusive boundary also passes.
- Mapped Prisma P2039 wrapping SQLSTATE 23P01 for ProductPriceTier_no_overlapping_ranges to HTTP 409 PRICE_TIER_OVERLAP in both API error paths.
- Address AuditLog snapshots omit recipient name/phone and delivery address details.
- Notification read/unread, bulk read/unread, delete, bulk delete, folder copy and move now record AuditLog in the same transaction; snapshots omit notification title/message content.
- Category/Subcategory and Permission mutations now record AuditLog in the same mutation transaction; permission controllers forward the authenticated actor.
- Admin review/monetization settings, inquiry plan create/update and notification-folder create/update are transaction-bound to AuditLog; controllers forward the actor.
- The normalized self-name Permission update edge case is covered.
- Exact-main verification: CI [45045151898](https://github.com/gameacc2025/martest/actions/runs/45045151898), migration [45045151757](https://github.com/gameacc2025/martest/actions/runs/45045151757), runtime [45045151713](https://github.com/gameacc2025/martest/actions/runs/45045151713).

## Repairs verified in this audit

- Public CMS article search now combines search terms with the publication-time window using AND; regression tests prevent early exposure of future-dated published records.
- Auth challenge verify/consume ownership checks are regression-tested against cross-user access.
- COMPANY login and refresh now reject inactive, suspended or soft-deleted companies while preserving each user's independent AccessProfile.isActive state.
- User lifecycle AuditLog events cover create/update/role changes/delete/panel access/company transfer. Metadata excludes contact values and credentials; company scope is attached.
- User updates now return 409 for duplicate email/phone; company creation validates the target company.
- Company lifecycle/profile/settings mutations now write transactional AuditLog events; controllers pass the authenticated actor.
- CRM lead create/update/assign/status/convert/merge use the central action registry and transactional AuditLog writer.
- Inquiry create/update/status/reveal and Support ticket create/message/status/assignment now write minimal, redaction-safe central AuditLog events in their existing transactions; focused service tests verify transaction binding and metadata.
- The central audit action registry now has automated immutability, uniqueness, and identifier-format checks.
- Frontend component-test setup now registers the Tooltip directive and stubs RouterLink where required; latest CI has zero unresolved tooltip/router-link warnings.
- Audit metadata redaction normalizes snake_case/kebab-case keys and truncates over-depth objects.
- Product service enforces company ownership for management mutations; public listing and detail both require PUBLISHED + PUBLIC products whose seller is ACTIVE and not soft-deleted. Product service tests cover cross-company reads/writes and inactive/deleted seller visibility.
- Notification reads, unread counts, updates and deletes are scoped to authenticated userId; folder IDs are validated against app scope derived from the verified token, and body/query app overrides are ignored. Service/controller tests cover cross-user IDs and folder scope.
- Notification preferences are user-scoped; SMS is OFF by default and requires explicit per-event opt-in plus a configured provider. Dispatch and preference tests cover opt-in, provider absence and quota failure.
- CMS FAQ/Page/Category/Tag routes require exact STAFF access plus resource-specific cms.* permissions; Article routes use the same STAFF boundary.
- AD-3 wording and the duplicated main-only/publishing instructions were clarified; current task handoff no longer contains literal escaped newline text.

## Remaining work

1. Finish exhaustive Product nested-resource IDOR checks for every cross-company Price Tier/Image/Document read, download, upload, delete, primary and reorder operation. Actual Price Tier concurrency and max-Int boundary integrity are now verified, but the complete authorization sign-off remains open.
2. Review CMS category activation/deactivation semantics and remaining Article revision/relationship/public-cache edge cases.
3. Complete the global AuditLog coverage matrix, especially Auth/session and outbound admin notification dispatch/idempotency semantics. Category, Permission, notification mutations, settings and inquiry-plan/folder mutations have received additional transaction/actor hardening.
4. Obtain owner/legal direction for AuditLog retention, archival and deletion policy. Do not invent a retention period.
5. Finish dashboard/reporting correctness and broader visual, keyboard, accessibility and responsive regression.
6. Live SMTP/Twilio/payment-provider delivery, production deployment, backup/restore and rollback remain NOT VERIFIED.
7. Owner's Windows working tree, local Docker daemon and developer PostgreSQL remain NOT VERIFIED by GitHub Actions.
8. Preserve AD-1 through AD-3. B2C retail/cart/checkout/orders are approved under Workstream H; live payment, tax/shipping/returns policy and Finance/commission/settlement remain gated by their required configuration and owner decisions.

## Governance and handoff

- Repository rulesets endpoint returned an empty list; branch-protection read returned 403 to the GitHub integration. Server-side branch protection is NOT VERIFIED. Repository policy documents main-only work; Git refs observed during this audit expose only main.
- Preserve AD-1 through AD-3. B2C retail, cart, checkout, orders and wishlist are approved for parallel implementation under Workstream H. Live provider use and Finance/commission/settlement remain gated.
- **Next action:** finish Product nested-resource IDOR and CMS category/revision/public-cache edge cases, then complete Auth/session and outbound-notification AuditLog review. Dashboard/accessibility and environment gates follow; retention and AD-1..AD-3 remain owner-dependent; AD-4 B2C freeze is superseded, while Finance decisions remain owner-dependent.

---

# Detailed agent execution instructions and remaining-work checklist

## 1. Mandatory instruction to the coordinating agent

Read this entire task document before changing anything. Then execute every actionable work item in the order and dependency model below. Do not stop after producing an audit report: for each confirmed defect, implement the smallest safe fix, add regression tests, run the required checks, and continue to the next item. If a task is blocked by missing owner/legal decisions or unavailable external environments, complete all safe preparatory work, record the exact blocker, and continue with independent tasks.

The human operator should only need to instruct the agent:

> Read `.ai/current-task.md` completely and execute the remaining work fully. Follow the repository's agent instructions and this task document. Continue until every executable task is completed, every blocker is explicitly documented, and the final verification/report is produced.

### 1.1 Source-of-truth and instruction precedence

Before work begins, read and obey the current versions of:

1. `AGENTS.md`
2. `.ai/PROTOCOL.md`
3. `.ai/agent-coordination/ACTIVE.md`
4. `.ai/current-task.md`
5. `.ai/UI_SKILLS.md` when touching UI
6. `docs/AI_AGENT_WORKFLOW.md`
7. Relevant architecture decisions, API contracts, feature documentation, tests and migrations.

If any instruction conflicts, stop the affected operation, identify the conflict, and follow the repository's highest-priority active instruction. Do not silently rewrite project policy.

### 1.2 Non-negotiable Git and collaboration rules

- Work only on the existing `main` branch.
- Never create a branch, worktree, detached checkout, or alternate integration branch.
- Never force-push, hard-reset, clean the working tree, delete stashes, or discard uninspected user changes.
- Never assume the local Windows working tree is clean. Inspect and preserve it if an authorized local environment is available.
- Worker/subagents may inspect, test, and prepare isolated patches, but must not commit or push.
- The main coordinating agent is the sole writer/integrator and the only agent allowed to stage, commit, or push.
- Serialize all writes to shared files. Parallelize independent analysis and isolated patch preparation, not concurrent Git writes.
- Before each write, verify the current `main` SHA. Integrate with a fast-forward/expected-SHA guard. If the remote head changed, stop, fetch and inspect the new head, then reconcile; never overwrite it.
- Commit each small, reviewed, independently testable slice directly to `main`. Do not combine unrelated fixes into a large commit.
- After each commit, verify the remote `main` SHA and inspect relevant CI runs. A commit is not considered verified merely because it was created or pushed.
- Do not claim tests passed unless the exact commit/SHA has successful evidence. Distinguish source-level review, unit tests, CI, migration tests, runtime tests, provider tests and production verification.
- Preserve AD-1 through AD-3. Implement B2C retail/cart/checkout/orders/wishlist under approved Workstream H; do not invent accounting, commission, settlement, tax, shipping or returns policy.
- Do not invent commercial rules, legal obligations, data-retention periods, billing behavior, or provider credentials.
- Do not expose secrets, tokens, passwords, personal data or full content in logs, test output, audit metadata or reports.

### 1.3 Required execution loop for every task

For every task ID:

1. **Inspect:** read the relevant routes, middleware/preHandlers, controllers, services, schemas, Prisma models, migrations, tests, UI consumers and existing domain-history mechanisms.
2. **Map:** document the current behavior and trust boundaries before changing code.
3. **Confirm:** distinguish a proven defect from a hypothesis or missing evidence.
4. **Scope:** define the smallest file/function/test scope. Avoid unrelated cleanup.
5. **Fix:** implement only the confirmed defect, preserving existing contracts and owner decisions.
6. **Test:** add a regression test that fails before the fix and passes after it. Include negative authorization cases and transaction/error cases where relevant.
7. **Verify:** run focused tests first, then relevant package tests/builds, and required CI/migration/runtime workflows for the final integrated source.
8. **Review:** inspect the diff for security, data loss, API compatibility, duplicate events, migration risks and accidental policy changes.
9. **Integrate:** the lead serially commits the reviewed slice to `main).
10. **Record:** update the work log/current task/ACTIVE board with task ID, files, commit SHA, test commands/results, workflow links, remaining risks and status.

Allowed task statuses: `NOT STARTED`, `IN PROGRESS`, `PASS`, `FAIL`, `BLOCKED — OWNER DECISION`, `BLOCKED — ENVIRONMENT`, `NOT APPLICABLE — EVIDENCE`. Never convert a blocker or untested assumption into PASS.

---

## 2. Verified baseline and completed work

The previous 20 scoped audit slices are recorded as completed in the project coordination files. The latest fully tested application-code SHA recorded there is:

`c78e6d950b54695030518c8963053f8fc13be6f5`

Recorded successful evidence for that exact code SHA:

- CI: [44655876783](https://github.com/gameacc2025/martest/actions/runs/44655876783)
  - 69 Frontend/Shared test files and 390 tests
  - 18/18 architecture/session tests
  - 1,775/1,775 backend tests
  - Website, Company and Admin production builds
- Fresh PostgreSQL migration validation: [44655876652](https://github.com/gameacc2025/martest/actions/runs/44655876652)
  - Prisma validation/client generation
  - fresh migrations and Prisma model/table parity
- Runtime validation: [44655876772](https://github.com/gameacc2025/martest/actions/runs/44655876772)
  - Compose/service health, migrations, model parity
  - all development seeds run twice
  - AD-1/AD-3 role-grant checks
  - 8/8 Playwright smoke tests across Website/Company/Admin and API proxies
  - teardown succeeded

The coordination documentation commit after that code baseline is `ae9215d502297fe00aa6fa4b7e909f77951698ad`.

These results are historical baseline evidence, not proof that new work is complete. Re-run the required checks after integrating new code. Do not claim local Windows, local Docker/PostgreSQL, live SMTP/Twilio/payment-provider delivery or Production deployment has been verified; those were explicitly NOT VERIFIED in the baseline.

---

## 3. Priority and dependency overview

| Workstream | Priority | Depends on | Parallelizable with |
|---|---|---|---|
| A. Product nested-resource authorization / IDOR | P0 | Current Product service and route contracts | CMS, AuditLog inventory, Dashboard audit |
| B. Product price-range concurrency | P0 | A's Price Tier ownership/operation map; database behavior inspection | CMS, AuditLog inventory, UI audit |
| C. CMS category and revision edge cases | P1 | Current CMS contracts and category semantics | A/B, D inventory, F |
| D. Remaining central AuditLog coverage | P1 | Existing event registry and domain-history inventory | A/B, C, F |
| E. AuditLog retention/archival policy | BLOCKED for policy implementation | Explicit owner/legal decision | Technical options assessment can run in parallel |
| F. Dashboard/reporting and visual/accessibility regression | P1/P2 | API contracts and permission behavior for data correctness | A/B, C, D |
| G. Real environment, external provider and Production validation | Release gate | Environment access, credentials, owner-approved deployment window | Preparation/checklist can run in parallel |

### 3.1 Critical path

1. A — complete Product nested-resource authorization review and fixes.
2. B — close the Product price-range concurrency/integrity risk.
3. C — close CMS category/revision correctness gaps.
4. D — complete the sensitive-operation AuditLog inventory and required producers.
5. F — finish dashboard/reporting and broad UI/accessibility regression.
6. Run integrated exact-main CI, migration and runtime acceptance.
7. G — perform owner-environment, real-provider and Production verification when authorized and available.

E is a policy-dependent stream. Do not block unrelated work while waiting for owner/legal direction.

### 3.2 Safe parallel work

The following can be investigated in parallel if agents have isolated scopes and the lead serializes integration:

- A: Product nested-resource IDOR and route/service permission matrix.
- C: CMS category activation/deactivation and revision edge cases.
- D: inventory of missing AuditLog producers in roles/settings/Auth/session.
- F: dashboard/reporting contract inventory and accessibility/UI audit.
- E: technical options and cost/risk assessment only; no retention/deletion policy implementation.
- G: deployment/provider readiness checklist and configuration inventory; no live external actions without authorization.

Do not let two workers edit the same service, shared registry, Prisma schema/migration, shared test fixture, or coordination document concurrently. Parallel analysis is encouraged; shared-file writes are serialized by the lead.

---

## 4. Workstream A — Product nested-resource authorization and IDOR

**Priority:** P0 / security  
**Goal:** Prove that every Product nested-resource operation enforces both the correct actor permission and the correct tenant/resource ownership boundary at the route and service layers.

### A1. Build a complete operation inventory

Inspect Product routes, preHandlers, controllers, services and tests. Enumerate every operation for:

- Product read/detail/list and management.
- Price Tier read/create/update/delete and any history/snapshot endpoints.
- Image list/read/upload/delete/set-primary/reorder.
- Document list/read/download/upload/delete.
- Product status transitions and soft deletion/restore if supported.
- Any nested resource endpoint that accepts a product ID, price-tier ID, image ID or document ID.

For each operation, record:

| Field | Required evidence |
|---|---|
| HTTP route and method | Exact route declaration |
| Actor/app context | STAFF, COMPANY, CUSTOMER or other supported context |
| Required permission | Exact permission key and role grant |
| Resource ownership | How product/company/resource relationship is established |
| Route guard | Exact preHandler or middleware |
| Service guard | Exact service-level check |
| Query scope | Whether lookup is scoped before returning or mutating data |
| Negative test | Cross-company or insufficient-permission regression test |
| Result | PASS, defect, or evidence gap |

Do not assume a route guard is sufficient. Direct service calls, background jobs and internal callers must not bypass tenant authorization where the service is an authorization boundary.

### A2. Price Tier cross-tenant authorization

Test all Price Tier operations using at least two distinct companies and products:

- Company A can operate on its own eligible product with the exact required permission.
- Company A cannot read, create, update or delete a Price Tier belonging to Company B.
- Replacing only a nested resource ID with a foreign ID must not expose or mutate that resource.
- A Price Tier ID must be verified against its parent Product; do not trust a caller-supplied product ID independently.
- STAFF behavior must follow the existing exact STAFF permission and app-context contract; do not broaden STAFF or COMPANY access.
- Insufficient COMPANY permissions must be denied even when the product belongs to that company.
- Verify not-found/forbidden behavior does not leak foreign resource details beyond the established API contract.

Add service-level and route/controller tests where each layer owns a distinct guarantee.

### A3. Image cross-tenant authorization

Cover image listing, upload, deletion, primary-image changes and reordering:

- A foreign image ID cannot be deleted, promoted, reordered or otherwise mutated by another company.
- A supplied product ID and image ID must refer to the same product.
- Upload authorization must be checked before persistent side effects.
- Failed authorization must not leave files on disk or create database rows/audit events.
- Verify cleanup behavior when database writes or AuditLog writes fail.
- Verify the image's tenant ownership through the parent Product, not only through a client-provided identifier.

### A4. Document cross-tenant authorization

Cover document listing, metadata reads, downloads, upload and deletion:

- Foreign document IDs cannot be read, downloaded, replaced or deleted by another company.
- Document ID and parent Product ID must match.
- File paths/storage keys must be derived from trusted database records or server-generated values, never arbitrary client paths.
- Failed authorization must not disclose file existence, storage paths or metadata beyond the established API contract.
- Failed writes/audit operations must not leave orphaned files or database records.

### A5. Route/service permission parity

For every operation, compare exact route permission with the service permission. Test:
- authorized COMPANY actor;
- same-company actor missing the exact permission;
- foreign-company actor with the permission;
- STAFF actor with and without the relevant STAFF permission;
- CUSTOMER/unsupported actor where applicable;
- direct service invocation without route middleware.

Do not add wildcard permission shortcuts or weaken role checks to make tests pass.

### A6. Product IDOR completion criteria

A is complete only when:
- The inventory covers every nested resource operation found in source.
- Every operation has an explicit route guard, service authorization decision and ownership check (or a documented justified exception).
- Cross-company tests cover read and mutation paths for Price Tier, Image and Document.
- Parent-child ID mismatch cases are covered.
- Failed operations have no unintended database, file-system or AuditLog side effects.
- Focused tests and the relevant backend suite pass.
- The lead records exact file paths, test evidence and unresolved exceptions.

Do not describe the entire Product domain as IDOR-safe based only on a few representative tests.

---

## 5. Workstream B — Product Price Tier concurrency and range integrity

**Priority:** P0 / data integrity  
**Dependency:** Complete A's Price Tier operation/ownership map first. This work may be analyzed in parallel but final design must use A's confirmed resource model.

### B1. Confirm the current invariant

Inspect the Price Tier schema, service validation, date/range semantics, uniqueness constraints, indexes and all create/update/delete paths. Determine:
- Whether range endpoints are inclusive or exclusive.
- How open-ended/null endpoints are interpreted.
- Whether ranges are scoped by product, currency, customer/quantity tier, or another dimension.
- Whether disabled/deleted tiers participate in overlap checks.
- Whether update excludes the current record correctly.
- Whether time zones/date precision affect comparison.
- Whether any other writer bypasses the service check.

Do not invent or change business semantics. Derive them from existing contracts and tests; if ambiguous, document the ambiguity and request owner clarification before changing semantics.

### B2. Prove or disprove the concurrency race

The recorded concern is that overlap validation may run before the transaction. Verify the exact current implementation and reproduce the scenario conceptually or with an integration test:

- Two concurrent requests create overlapping ranges for the same conflict scope.
- Two concurrent requests update different tiers into overlapping ranges.
- Create and update race against each other.
- Boundary-touching ranges follow the existing inclusive/exclusive contract.
- Null/open-ended boundaries are covered.

A race is confirmed only with a test or a database-level proof. Do not label it a confirmed defect solely from the previous note.

### B3. Select the database-safe solution

Evaluate options against the actual Prisma/PostgreSQL version and project migration conventions, including:
- Transaction isolation/serialization with retry handling.
- Row/advisory locking scoped to the exact conflict domain.
- PostgreSQL exclusion constraints where the range model and deployment compatibility support them.
- A safe combination of database constraint and service validation.

Choose the smallest robust approach. Avoid global locks if a narrower lock is possible. Handle serialization/constraint errors with the established API error contract. Ensure retries are bounded and do not duplicate AuditLog events or side effects.

### B4. Migration and operational safety

If a database migration is required:
- Check existing production-like data for overlaps before adding the constraint.
- Provide a safe preflight/report or migration guard; do not silently delete or rewrite existing business data.
- Use the repository's migration naming and rollback/forward-fix conventions.
- Verify fresh database migration and migration from the current schema.
- Do not change unrelated Prisma models.

### B5. Completion criteria

- The overlap invariant is documented from the actual business contract.
- Concurrent create/create, update/update and create/update tests demonstrate that conflicting writes cannot both commit.
- Boundary and null endpoint tests pass.
- Existing valid ranges remain accepted.
- Error mapping is deterministic and does not leak database internals.
- AuditLog and price-history writes remain transactionally correct.
- Fresh PostgreSQL migration validation and backend tests pass.

---

## 6. Workstream C — CMS category activation and Article revision/relationship edge cases

**Priority:** P1 / content correctness

### C1. Establish category lifecycle semantics

Inspect Article Category schema, service, routes, public queries, admin UI and existing documentation. Determine the intended meaning of active/inactive, deletion, slug changes and category assignment. Do not invent behavior where the product contract is silent.

Test and document:
- Activating an inactive category.
- Deactivating a category currently assigned to published articles.
- Creating/updating an article assigned to an inactive category.
- Public listing/detail/search for articles whose category becomes inactive.
- Category deletion/archive behavior if supported.
- Re-activating a category and the resulting visibility/assignment behavior.
- STAFF permission requirements for each mutation.

If semantics are ambiguous or require a product decision, preserve existing safe behavior and mark the exact question as owner-blocked; continue other CMS tasks.

### C2. Article relationship integrity

Review Article create/update and category/tag assignment code:
- Category assignments use the declared `{ categoryId, sortOrder }` contract.
- Duplicate category/tag assignments are rejected or normalized according to existing API contract.
- Invalid, deleted or inactive related records are handled consistently.
- Relationship replacement does not unintentionally drop unrelated assignments.
- Ordering is preserved across create, update and restore.
- Cross-tenant or unauthorized category/tag IDs cannot be attached if the data model is scoped.

Add tests for each confirmed edge case.

### C3. Revision lifecycle

Inspect revision creation, list/read, restore, ownership, authorization and transactional behavior:
- Revision belongs to the expected Article.
- A revision ID from another Article cannot be restored into the current Article.
- Restore handles deleted/inactive category and tag relations safely.
- Restore preserves category IDs, tag IDs and sort order where valid.
- Restore does not unintentionally overwrite fields outside the revision contract.
- Concurrent restore/update behavior is deterministic.
- AuditLog event is committed atomically with the restore.
- Failed restore leaves the Article and relationships unchanged.

### C4. Public visibility and cache behavior

Verify public Article routes/search only expose content allowed by publication status/time and category lifecycle rules. Ensure category activation changes do not create stale public visibility through caches or search queries. Keep the existing publication-window/search AND behavior intact.

### C5. Completion criteria

- Category lifecycle semantics are evidenced by current contracts or explicitly owner-blocked.
- Article/category/tag relationship edge cases have regression tests.
- Revision ownership and restore integrity are covered.
- Public visibility is correct for active/inactive and publication states.
- CMS permission and AuditLog behavior remain correct.
- CMS focused tests and relevant backend/frontend builds pass.

---

## 7. Workstream D — Remaining central AuditLog coverage

**Priority:** P1 / security and accountability

### D1. Inventory before implementation

Search all mutation routes/services for sensitive operations in:
- Roles and permission grants/revocations.
- User access profiles and panel access.
- Company settings and administrative settings.
- Authentication, MFA/challenge/session lifecycle and refresh-token revocation.
- Security configuration and credential rotation metadata (never secret values).
- Remaining administrative mutations identified by source inspection.

For each mutation, record:
- Existing central AuditLog event, if any.
- Existing domain-specific history/activity record.
- Actor identity and app context.
- Company/resource scope.
- Transaction boundary.
- Sensitive fields that must be excluded.
- Whether a new central event is necessary.

Do not add duplicate central events where an existing central event already fully covers the operation. Do not delete existing domain history.

### D2. Roles and permissions

Check role creation/update/assignment, permission grant/revoke, role activation/deactivation and any built-in role restrictions:
- The authenticated actor is passed from the controller.
- The affected subject and scope are recorded safely.
- Before/after metadata contains only minimized identifiers and safe changed-field names.
- No credential, token, secret or unnecessary personal data is recorded.
- Audit write is transaction-bound to the mutation where supported.
- Unauthorized attempts do not create success events; failed-attempt security logging must follow an explicit existing convention.

### D3. Settings and administrative configuration

Inventory user, company and global settings separately. Add events only for sensitive mutations not already covered. Ensure settings values are classified before inclusion; never dump entire settings objects into metadata. Exclude secrets and private values. Record changed keys and safe non-sensitive state only.

### D4. Auth/session

Review security-sensitive state changes such as challenge issue/consume/revoke, session revocation, password/security setting changes, role/panel access changes and recovery flows. Preserve existing atomicity and ownership checks. Never store passwords, password hashes, OTP values, access/refresh tokens, session secrets or raw challenge secrets in AuditLog.

### D5. Registry, redaction and transaction integrity

- Verify every emitted action exists in the central action registry.
- Verify action names are unique and follow the existing format.
- Verify key normalization/redaction cannot be bypassed with snake_case, kebab-case or nested objects.
- Verify metadata depth/size limits.
- Verify actor and company scope are attached correctly.
- Verify the audit write uses the same transaction client as the primary mutation where atomicity is required.
- Verify an AuditLog failure rolls back the primary mutation where the operation promises atomic audit.
- Avoid duplicate events from nested service calls or retries.

### D6. Completion criteria

- A source-backed inventory exists for all sensitive mutations inspected.
- Each operation is marked covered, newly instrumented, intentionally excluded with reason, or owner-blocked.
- Required producers have focused service tests for actor/scope, safe metadata, transaction binding and failure behavior.
- Existing domain-specific histories remain intact.
- Relevant backend tests and exact-main CI pass.

---

## 8. Workstream E — AuditLog retention, archival and deletion policy

**Priority:** BLOCKED for policy decisions; technical assessment may proceed.

### E1. Prepare decision brief only

Prepare a short owner/legal decision document covering:
- Data categories stored in AuditLog.
- Operational, security, legal and business use cases.
- Potential retention periods as options, not recommendations presented as legal facts.
- Storage growth and archival cost implications.
- Access controls and access logging for archived records.
- Backup and restore implications.
- Legal hold and deletion exceptions, if applicable.
- Privacy/data minimization and applicable jurisdiction questions.
- Whether immutable/tamper-evident storage is required.

### E2. Do not implement unapproved policy

Until explicit owner/legal approval:
- Do not set a retention duration.
- Do not schedule automatic deletion.
- Do not archive or purge existing AuditLog records.
- Do not add a destructive cleanup job.
- Do not infer legal requirements.
- Do not change existing audit availability.

### E3. After approval

Record the exact approved policy and approval reference. Then design and implement retention/archival in a separate reviewed task with dry-run reporting, observability, backup/recovery plan, tests and a non-destructive rollout. Require explicit approval before any production deletion or purge.

---

## 9. Workstream F — Dashboard, reporting, visual and accessibility regression

**Priority:** P1 for data correctness; P2 for broader polish

### F1. Dashboard/API contract audit

Inspect Admin and Company dashboard components, API clients, backend endpoints, response schemas and tests. For every KPI/chart/table:
- Identify the exact API field and aggregation.
- Confirm date/time boundaries and timezone assumptions.
- Confirm filters and pagination.
- Confirm loading, empty, partial and error states.
- Confirm values are not fabricated from fallback totals or unrelated counters.
- Confirm Company users only receive their own tenant data.
- Confirm Admin-only metrics require correct permissions.
- Confirm currency, quantity and percentage formatting.
- Confirm chart labels and totals reconcile with API data.

Do not change business definitions of KPIs without owner approval. If a metric's definition is missing, document the question and avoid presenting a misleading number.

### F2. Reporting correctness

Test:
- Date range boundaries, including same-day and month/year transitions.
- Empty datasets and zero values.
- Pagination/export consistency.
- Filter composition.
- Timezone conversion.
- Aggregation totals against source records.
- Unauthorized cross-company access.
- Large result handling and performance where measurable.

### F3. Visual consistency

Use the approved palette and existing design tokens. Do not invent a new design system.

Approved palette:
- Primary `#22D3EE`
- Hover `#06B6D4`
- Active `#0891B2`
- Subtle `#CFFAFE`
- Secondary `#6366F1`
- Accent `#8B5CF6`
- Light page `#F0F7FA`; light surfaces `#FFFFFF`; light card hover `#F0FDFF`
- Dark page `#0A1625`; dark sidebar/header `#0D1B2A`; dark card `#122438`; dark card hover `#193149`

Verify Website, Admin and Company experiences follow the established product design. Avoid broad restyling unrelated to confirmed defects.

### F4. Accessibility and responsive regression

Review:
- Semantic headings and landmarks.
- Accessible names/labels for inputs and icon-only controls.
- Keyboard navigation and visible focus.
- Dialog, dropdown and accordion keyboard behavior.
- Color contrast in light and dark themes.
- Form errors and status announcements.
- Table semantics and chart alternatives.
- Responsive layout at mobile, tablet and desktop breakpoints.
- Zoom/reflow and overflow.
- Reduced-motion behavior where animations exist.

Fix concrete defects and add component tests where practical. Use browser tests for critical user journeys.

### F5. Completion criteria

- KPI/report contract matrix is complete for inspected dashboards.
- Tenant/role access is verified at API level, not merely hidden in UI.
- Critical loading/empty/error states work.
- Visual palette is consistent with approved tokens.
- Keyboard/focus/labels/contrast and responsive checks are recorded.
- Relevant frontend tests and all three production builds pass.

---

## 10. Workstream G — Environment, provider and Production readiness

**Priority:** Release gate; some work is environment-blocked.

### G1. Local Windows / Docker / PostgreSQL

When authorized access to the owner's environment is available:
- Inspect Git branch, current SHA, uncommitted changes and stashes without altering them.
- Verify the owner is on the intended `main) branch and identify divergence before any sync.
- Inspect Docker daemon and Compose configuration.
- Start only the intended development stack using documented commands.
- Verify PostgreSQL health, backend health and Website/Company/Admin panels.
- Run migrations and seeds according to the runbook; verify seed idempotency.
- Run focused tests and browser smoke tests.
- Do not delete volumes, databases, files, containers or stashes as a cleanup shortcut.
- If local access is unavailable, record `BLOCKED — ENVIRONMENT`; do not claim local validation.

### G2. SMTP

- Inspect provider configuration and environment-variable names without printing secret values.
- Verify sender/domain configuration and TLS requirements.
- Use a provider sandbox/test mode if available.
- Perform a real delivery test only with explicit authorization and a designated test recipient.
- Record message/provider IDs safely; never record credentials or message contents containing personal data.
- Distinguish configuration validation from successful external delivery.

### G3. Twilio/SMS

- Confirm SMS remains explicit opt-in and provider-gated.
- Inspect quota, subscription, consent and failure behavior.
- Use a test number/sandbox where supported.
- Send a real SMS only with explicit authorization and an approved test recipient.
- Verify provider response, delivery status callback if configured, quota behavior and fail-closed behavior.
- Do not use real customer numbers for testing.

### G4. Payment provider

- B2C checkout, cart and retail operation are approved under Workstream H. Live billing/provider calls, tax/shipping/returns policy and Finance/commission/settlement remain gated until approved and configured.
- If payment integration is already present but dormant, inspect configuration and code without initiating a charge.
- Use sandbox-only tests when authorized.
- Never run a live charge/refund/payout without explicit owner approval and a controlled test plan.

### G5. Production deployment

Before any deployment:
- Obtain explicit deployment authorization and target environment.
- Verify release SHA, CI, migrations, backup, secrets, health checks, observability and rollback plan.
- Confirm migrations are backward-compatible or have an approved maintenance plan.
- Perform a pre-deployment backup and verify restore procedure.
- Deploy only through the repository's approved process.
- Verify health and critical journeys after deployment.
- Do not claim Production readiness solely from GitHub Actions or local Docker tests.
- Do not deploy automatically as part of this audit without explicit authorization.

### G6. Completion criteria

G is complete only for the environments actually tested, with evidence and exact SHA. Separate statuses must be reported for:
- Owner Windows workspace.
- Local Docker/Compose.
- Developer PostgreSQL.
- SMTP delivery.
- Twilio delivery.
- Payment sandbox/live status.
- Production deployment and post-deployment smoke tests.

---

## 11. Integrated final acceptance

After A, B, C, D and F code changes are integrated, the lead must run or verify the repository's required acceptance workflows on the exact final `main` SHA.

Minimum acceptance:
1. Focused tests for each changed domain.
2. Full backend test suite.
3. Frontend/shared tests.
4. Architecture/session tests.
5. Website, Company and Admin production builds.
6. Prisma schema validation and client generation.
7. Fresh PostgreSQL migration deployment and model/table parity.
8. Runtime Compose health and seed idempotency checks.
9. AD-1/AD-3 role-grant checks where covered by the existing workflow.
10. Playwright smoke tests across Website, Company, Admin and API proxies.
11. Review of workflow logs for warnings/errors; classify non-blocking deprecations separately.
12. Verify all commits are on `main` and the final remote SHA matches the tested SHA.

If any workflow fails:
- Inspect the failing job logs.
- Determine whether the failure is a code defect, test-fixture issue, environment issue or infrastructure issue.
- Fix only the smallest relevant slice.
- Add/adjust tests without weakening assertions or authorization.
- Commit the fix on `main`, then rerun the affected and required acceptance workflows.
- Do not report the failed gate as PASS.

---

## 12. Documentation and reporting requirements

Keep these documents accurate and concise:
- `.ai/agent-coordination/ACTIVE.md`
- `.ai/current-task.md`
- `.ai/WORKLOG.md
- Relevant feature/API/architecture documentation.
- This plan: update task statuses and evidence without deleting unresolved risks.

For each completed task, record:
- Task ID and concise title.
- Status.
- Exact files changed.
- Defect confirmed and evidence.
- Fix summary.
- Tests actually executed and results.
- CI/migration/runtime workflow URLs and exact tested SHA.
- Commit SHA on `main`.
- Remaining risks and explicit non-verifications.

Final report must be in Persian and include:
1. Completed tasks grouped by workstream.
2. Blocked tasks and the exact reason/required decision.
3. Parallel workstreams completed and any integration conflicts.
4. Changed files and commit links.
5. Test commands and actual results.
6. Exact final `main` SHA and matching CI/migration/runtime evidence.
7. Explicit list of environments/providers/Production items not verified.
8. Remaining risks; never hide failures or partial coverage.

---

## 13. Execution checklist

The lead must maintain this checklist and update it as work progresses.

### P0 — Product security and data integrity
- [x] A1 — Inventory all Product nested-resource operations.
- [x] A2 — Price Tier cross-company read/write authorization.
- [x] A3 — Image cross-company read/upload/delete/primary/reorder authorization.
- [x] A4 — Document cross-company read/download/upload/delete authorization.
- [x] A5 — Route/service permission parity and direct-service tests.
- [x] A6 — Parent-child ID mismatch and side-effect cleanup tests.
- [x] A7 — Product authorization acceptance evidence.
- [x] B1 — Confirm Price Tier range semantics.
- [x] B2 — Reproduce or disprove concurrent overlap race.
- [x] B3 — Implement database-safe concurrency protection if defect is confirmed.
- [ ] B4 — Migration/data preflight and compatibility checks if needed.
- [x] B5 — Concurrent and boundary regression tests.
- [x] B6 — Price integrity acceptance evidence.

### P1 — CMS and AuditLog
- [x] C1 — Category activation/deactivation semantics.
- [x] C2 — Category/tag relationship integrity.
- [x] C3 — Article revision ownership and restore edge cases.
- [x] C4 — Public visibility and search/cache behavior.
- [x] C5 — CMS permission and AuditLog acceptance.
- [x] D1 — Inventory sensitive mutation coverage.
- [x] D2 — Role/permission AuditLog coverage.
- [x] D3 — Settings/admin AuditLog coverage.
- [x] D4 — Auth/session AuditLog coverage.
- [x] D5 — Registry/redaction/transaction integrity.
- [x] D6 — AuditLog coverage matrix and tests.

### Policy-dependent
- [x] E1 — Prepare retention/archival decision brief.
- [ ] E2 — Obtain explicit owner/legal decision.
- [ ] E3 — Implement only the approved policy in a separately reviewed change.

### P1/P2 — Dashboard and UI
- [ ] F1 — Admin/Company dashboard API contract matrix.
- [ ] F2 — KPI/reporting correctness and tenant authorization.
- [ ] F3 — Loading/empty/error states.
- [ ] F4 — Palette and design consistency.
- [ ] F5 — Accessibility and keyboard/focus checks.
- [x] F6 — Responsive and browser regression.
- [x] F7 — Frontend test/build acceptance.

### Release/environment gates
- [ ] G1 — Owner Windows workspace verification.
- [ ] G2 — Local Docker/Compose verification.
- [ ] G3 — Developer PostgreSQL verification.
- [ ] G4 — SMTP test delivery.
- [ ] G5 — Twilio test delivery.
- [ ] G6 — Payment sandbox validation, only if approved and applicable.
- [ ] G7 — Production backup/deployment/rollback authorization and verification.
- [ ] G8 — Post-deployment smoke tests, only if deployment is explicitly authorized.

### Final closeout
- [x] All completed slices committed to existing `main` by the lead only.
- [x] No branches, worktrees, detached checkouts, force-pushes or destructive cleanup.
- [ ] Exact final SHA matches the successful required workflows.
- [ ] ACTIVE/current-task/WORKLOG reflect the actual final state.
- [ ] Final Persian report lists all completed, blocked and unverified items.

**Definition of done:** all executable work is completed and verified on the exact final `main` SHA; all remaining blockers have a named reason and required next action; no unresolved failure is presented as success; and the final Persian report is delivered.


## 14. Latest verified state and owner-dependent decisions

- Product nested-resource permissions now include exact direct-service checks for COMPANY and STAFF image/document operations; cross-company and parent-child mismatch tests remain part of A acceptance. Product documents are public static catalog assets under `/uploads`; no private document download endpoint exists, so confidential document use requires a separate protected-storage design.
- Price Tier range migration is additive: the earlier int4 exclusion constraint is replaced by a follow-up int8range migration with a genuinely unbounded NULL upper range. Fresh PostgreSQL and live concurrency/boundary probes pass. Existing production/shared DB application state remains unverified.
- Notification delivery workers use a conditional five-minute lease stored in `nextAttemptAt`. Concurrent email and SMS unit tests plus a real PostgreSQL CAS claim probe pass. This prevents simultaneous workers from sending the same pending row; it does not guarantee exactly-once delivery if a process crashes after provider acceptance but before recording SENT.
- Notification preference changes, including SMS consent, are transaction-bound to AuditLog. Role permission additions/removals are individually audited. Contact-form AuditLog snapshots no longer contain names, email addresses, phone numbers or message content; public contact events are sourced as WEBSITE. PKCE handoff events now carry the actual user access context.
- CMS-generated Persian slugs preserve Unicode letters and are bounded to the public route length.
- Company Dashboard now shows explicit API failure states for inquiry statistics, product summaries and deadline lists; stale metrics are cleared instead of being presented as empty data. Remaining executable gaps are the broader F1–F5 dashboard/reporting and accessibility audit. E2/E3 and AD-1–AD-3 require owner/legal decisions; B2C activation is approved under Workstream H, while Finance policy remains owner-dependent. G1–G8 require access to the relevant local/provider/payment/production environments and explicit authorization.

---

## 16. Workstream H — Activate real B2C retail commerce alongside B2B (OWNER APPROVED 2026-11-24)

**Priority:** P0 — execute as an independent vertical lane in parallel with B2B acceptance. Do not disable, replace or regress B2B Inquiry/RFQ and supplier-response flows.

**Owner decision:** B2C must operate at the same time as B2B in the same marketplace. This explicitly supersedes the 2026-10-27 decision and prior AD-4 freeze that kept Cart / Checkout / Orders / Wishlist dormant. See the dated overriding decision in `.ai/decisions.md`.

### H0. Verified current-state findings (from main source inspection)

- Prisma already contains Product.retailEnabled (default false), InventoryBalance, InventoryMovement, InventoryReservation, RetailOrder, SellerOrder, RetailOrderItem, PaymentAttempt, PaymentTransaction, PaymentWebhookEvent, Shipment, ReturnRequest and ReturnItem models.
- The Website currently contains ShoppingCart.vue and Checkout.vue, but the checkout explicitly says ordering/payment are disabled and creates no order. The Website router does not currently register cart, checkout, order-history, order-detail or wishlist routes.
- The cart store is localStorage-only and trusts cached product prices for display; it must never be treated as a price, stock or order authority.
- The legacy Website Orders page/store references removed legacy order endpoints; RetailOrders.vue contains hard-coded sample rows. Replace these with real Retail APIs; never display sample rows as customer orders.
- Inventory routes are now registered at `/api/v1/inventory` (8 endpoints) with authentication and tenant/role guards; app-level probes verify unauthenticated requests receive 401. RetailOrder/SellerOrder/Payment modules are still not registered and remain the next backend implementation gap.
- Inventory routes currently expose authenticated COMPANY/STAFF reads and STAFF-only adjustments. Company tenant ownership and CUSTOMER checkout access are not yet provided by this route contract.
- Inventory service comments describe row locking, but the reviewed getOrCreateBalance/reserve/release paths use Prisma findUnique/update calls without an explicit SQL row lock. The Serializable helper must be tested for serialization retry behavior and must not be assumed to protect every caller transaction.
- The current retail seed uses Math.random(), overwrites existing InventoryBalance on every run, and creates fixed-key movement/reservation records with non-idempotent create calls. This can reset real stock or fail/repeat incorrectly when retail-enabled products exist. Rewrite before enabling retail seeds; never seed over real operational balances.
- The demo marketplace seed now marks 90 deterministic demo products as retail-enabled in the clean CI fixture. Retail seed creates one initial balance/receipt per demo product and repeated execution skips all 90 without changing stock or appending duplicate movements; the dedicated PostgreSQL idempotency probe passes.
- Real PostgreSQL inventory concurrency probe now passes on 2026-11-24: two competing reservations and release-vs-consume transition races serialize correctly; the append-only movement ledger is retained only in the disposable CI DB and the private draft probe product is soft-deleted.
- The old Company router explicitly keeps retail inventory/orders dormant. Company seller inventory/order actions and Admin operations are not wired as a live retail workflow.

### H1. Product eligibility and B2B/B2C coexistence

- Define one explicit server-side eligibility predicate for B2C: published, public, active/non-deleted seller, non-deleted product, retailEnabled=true, valid active price and sellable inventory.
- Preserve B2B inquiry eligibility and permissions independently; a product may support both B2B Inquiry and B2C retail when explicitly configured.
- Confirm ProductPriceTier currency, minQuantity, validity windows and price-selection rules. Do not use a client-supplied price or cached localStorage price as authoritative.
- Ensure all B2B and B2C allocations share the same inventory ledger/balance and cannot oversell or double-allocate stock.
- Add tests for products that are B2B-only, B2C-only, both, unpublished, private, inactive seller, soft-deleted and out-of-stock.

### H2. Inventory correctness and operational ownership

- Review every InventoryBalance/InventoryMovement/InventoryReservation operation and prove the locking/isolation strategy under concurrent requests.
- Add bounded retry handling for PostgreSQL serialization/deadlock conflicts where appropriate; never silently retry non-idempotent external side effects.
- Enforce onHand >= 0, reserved >= 0 and available = onHand - reserved >= 0 at service and database levels where practical.
- Enforce reservation ownership, checkoutKey uniqueness, expiry, release, consume and cancellation semantics; prevent replay after terminal reservation states.
- Add company-scoped inventory read and stock-management operations for the owning seller with exact permissions; STAFF operations remain explicitly permission-gated. CUSTOMER cannot read other buyers' or sellers' operational inventory details.
- Inventory controller Prisma import and direct handler regression test are complete. Inventory routes are registered and app-level auth probes pass; Company/STAFF reads remain scoped and stock mutation is STAFF-only. Keep CUSTOMER direct inventory-management access denied; checkout uses the internal service.
- Implement safe inventory adjustment history and audit actor context. Seller adjustments must be scoped to the authenticated COMPANY AccessProfile, never a supplied companyId.

### H3. Retail order domain and API

- Add a dedicated retail/orders module (or the repository-approved module boundary) and register it only after its tests and guards exist.
- Implement authenticated CUSTOMER checkout preview that re-reads product eligibility, price, currency, seller status and available quantity from the database.
- Implement idempotent order placement using the client idempotency key, server-generated order number, immutable price/product/seller/address snapshots and a single transaction for order + seller-order split + item rows + stock reservations + audit/outbox records.
- Support multi-seller carts by creating one RetailOrder and correctly grouped SellerOrder records; preserve same-currency invariants and never sum unlike currencies.
- Reject stale prices, unavailable products, invalid quantities, mixed unsupported currencies and insufficient stock with stable API errors; return updated checkout data rather than trusting the browser.
- Scope order list/detail to buyerUserId for CUSTOMER and to companyId for seller views. Cross-buyer/cross-company IDs must not disclose order, address, payment or shipment data.
- Implement allowed state transitions as explicit commands, not generic status PATCH. Make cancellation race-safe against payment, seller acceptance, reservation consumption and shipment.

### H4. Payment integration — sandbox first

- Inspect existing provider configuration and any legacy payment code. Define a provider adapter/interface and a fake deterministic test provider for automated tests.
- Create PaymentAttempt before redirecting; use a server-generated idempotency key and amount/currency from the persisted order.
- Verify callback/webhook signatures and provider transaction status server-to-server. Never trust browser redirect query parameters as proof of payment.
- Persist each provider event using unique provider/event ID; handle duplicate, out-of-order, invalid-signature and replayed webhooks safely.
- Reconcile payment/order/reservation transitions transactionally and make successful callbacks idempotent.
- Add timeout/expiry handling that releases stock only after the verified payment-attempt state allows it.
- Keep live provider calls disabled until provider choice, sandbox credentials and a controlled test recipient/account are supplied. Never make a live charge/refund/payout without explicit approval.

### H5. Customer Website journey

- Register /cart, /checkout, /orders, /orders/:id and /wishlist routes with correct CUSTOMER authentication/AccessProfile guards; preserve public browsing and B2B inquiry routes.
- Convert cart into a client-side intent list only; refresh product name/price/currency/availability from the server before checkout and clearly reconcile changed prices or stock.
- Replace UI-only Checkout with real address selection/validation, server checkout preview, seller split and payment initiation; no fake success state.
- Replace deprecated Orders store/endpoints and sample RetailOrders.vue data with real buyer-scoped Retail APIs.
- Implement order details, payment state, seller fulfillment/tracking, cancellation/return eligibility and empty/loading/error/retry states.
- Make Wishlist resilient to unavailable localStorage/SSR, normalize IDs and clearly treat it as a customer preference, not an order or stock reservation.
- Preserve RTL, responsive behavior, accessible labels/focus and approved shared design tokens.

### H6. Company seller workflow

- Add company-scoped inventory balance/movement view and permitted stock adjustment workflow.
- Add seller-order queue with acceptance/rejection only where approved, processing, shipment/tracking and delivery updates.
- Enforce that COMPANY actors see and mutate only SellerOrder records for their own company; no access based only on role name or client companyId.
- Show buyer PII only where necessary for fulfillment and according to the existing access/audit policy.
- Add loading/empty/error/permission states and audit every sensitive seller mutation.

### H7. Admin operational workflow

- Add STAFF permission-gated retail order search, seller split visibility, inventory adjustment oversight, payment state, webhook failures and returns queue.
- Require explicit granular permissions for each operation; no wildcard or role-only bypass of STAFF AccessProfile context.
- Do not implement commission, seller settlement or accounting postings as part of this workstream. Those remain governed by separate Finance decisions.

### H8. Shipping, tax, cancellation and returns policy boundaries

- Inventory current schema and existing address data before adding migrations.
- Do not invent shipping rates, tax jurisdiction/rates, delivery promises, return windows, refund responsibility or cancellation penalties.
- Build explicit configuration/policy interfaces and fail closed for unavailable required policy. Record owner questions and continue independent work.
- Separate order cancellation, return authorization, receipt/inspection, refund and stock disposition; returned stock is not sellable until disposition explicitly marks it resalable.

### H9. Seed and test requirements

- Rewrite backend/prisma/seeds/retail.js to deterministic, idempotent fixtures with stable keys and no Math.random().
- Never overwrite an existing non-demo InventoryBalance, live reservation, movement ledger or order. Mark demo fixtures explicitly and isolate them from production/reporting totals.
- Use dedicated synthetic CUSTOMER/COMPANY fixtures; do not attach reservations to arbitrary active users.
- Test repeat seed execution twice, referential integrity, production skip, no stock reset, and no duplicate movements/reservations.
- Add service/route tests for concurrency, insufficient stock, cross-tenant IDOR, order idempotency, multi-seller split, price/currency snapshots, reservation expiry, cancellation races, payment webhook verification/replay and audit/outbox atomicity.
- Add Website/Company/Admin component and Playwright journeys: B2C browse → cart → checkout preview → sandbox payment → order history; seller accepts/fulfills; B2B inquiry/RFQ remains operational in the same run.

### H10. Activation and Definition of Done

- B2C routes and real API flows may be enabled in development/test once H1-H5 security and inventory invariants pass.
- Production payment activation requires an approved provider, configured secrets, verified sandbox, shipping/tax/returns policy and explicit live-operation approval.
- Company seller and Admin operations require their own permission/tenant tests before route/navigation exposure.
- Full acceptance requires backend + Website + Company + Admin builds/tests, fresh PostgreSQL migrations/model parity, runtime Docker/seed idempotency, Playwright B2C and B2B journeys, and exact-main SHA evidence.
- The B2B Inquiry/RFQ journey must pass regression tests alongside every B2C release gate.

### H11. Immediate first slices

1. Verify all historical AD-4 freeze references are explicitly superseded by the 2026-11-24 owner decision and synchronized across current project docs.
2. Map the complete current retail schema, APIs, routes, client endpoints and frontend consumers.
3. Fix inventory controller Prisma dependency and add a test proving actual handler execution, not only mocked route wiring.
4. Prove and repair inventory concurrency/transaction semantics before exposing checkout.
5. Replace unsafe retail seed behavior with deterministic demo-only idempotent seeding.
6. Implement and test customer checkout/order API before enabling Website routes.
7. Integrate payment sandbox adapter and seller/Admin operations after core order/inventory tests pass.

---
