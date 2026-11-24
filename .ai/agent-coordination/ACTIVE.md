# Agent Coordination — Active Board

## Active task

**PROJECT-WIDE-AUDIT-AND-REPAIR-2026-11-19**  
**Lead:** main coordinator  
**Branch:** `main` only  
**Latest fully verified code SHA:** `692a64498d276fd91006717845a7d105920d5ed7`  
**Owner decision update (2026-11-24):** B2C retail must operate alongside B2B; prior AD-4 freeze on Cart/Checkout/Orders/Wishlist is superseded. See Workstream H in `.ai/current-task.md` and the dated decision in `.ai/decisions.md`.

## Exact-main acceptance evidence

| Gate | Result | Evidence |
|---|---|---|
| CI | **PASS** | [Run 45121208916](https://github.com/gameacc2025/martest/actions/runs/45121208916) — 1,851 backend tests, 413 frontend/shared tests, 18 architecture/session tests, all three production builds |
| Fresh PostgreSQL migrations | **PASS** | [Run 45121209002](https://github.com/gameacc2025/martest/actions/runs/45121209002) — 19 migrations, Prisma model/table parity |
| Docker Runtime + E2E | **PASS** | [Run 45121208967](https://github.com/gameacc2025/martest/actions/runs/45121208967) — all services healthy, 19 migrations and 101/102 Prisma model/table parity, seeds twice, real PostgreSQL Price Tier concurrency/max-Int probe, notification idempotency/exclusive-claim probes, AD-1/AD-3 grant checks, 8/8 Playwright tests and Compose teardown |

## Completed executable work

- **A — Product security:** cross-company ownership, nested Price Tier/Image/Document authorization, direct-service permission parity, parent-child mismatch and cleanup coverage. Product documents are currently public static catalog assets under `/uploads`; there is no private product-document download route. Confirm this public-file policy before accepting confidential supplier documents.
- **B — Price Tier integrity:** non-overlap database exclusion, inclusive max-Int boundary, HTTP 409 consistency and real concurrent PostgreSQL verification.
- **C — CMS lifecycle:** category activation/deactivation, article category/tag integrity, revision restore, public filters, Persian slug generation and route-length limits.
- **D — AuditLog:** CMS, Product, Auth/session/PKCE, notification lifecycle/preferences, roles/permissions, settings/admin, addresses/contact and related sensitive mutations; actor propagation, transaction binding and PII minimization.
- **Notification delivery:** email/SMS workers now claim rows atomically with a recoverable five-minute lease; PostgreSQL verifies that only one concurrent claim wins. Delivery remains at-least-once across the unavoidable provider-accepted/process-crash window unless the provider supports idempotency.
- **Dashboard foundations:** Admin service-health states and Company dashboard API error states/recent-product ordering corrected. Company reports now load every product page (not only the API's 100-row cap), reconcile all seven product and seven inquiry statuses against API totals, reject inconsistent aggregate payloads, export every fetched row, and neutralize spreadsheet formula injection. Company product statistics exclude soft-deleted products, and product list pagination has deterministic ID tie-breaking. Shared design tokens match the approved palette; cross-panel accessibility-name, keyboard-focus and responsive smoke checks run in Playwright.
- **Runtime reliability:** seed import/runtime failure fixed; all seeds execute twice; migrations and schema parity pass.

## Remaining work / blockers

1. **F1–F2 — Dashboard/reporting:** finish the remaining KPI/API contract matrix, date/time boundaries and tenant-scoped reporting tests. Pagination/export completeness and status reconciliation have been repaired but still need broader date/filter/tenant acceptance coverage. Do not redefine KPIs without owner approval.
2. **F3–F5 — UI verification:** broader component-level empty/error-state coverage, full light/dark screen audit, contrast/zoom/reduced-motion checks and dialog/dropdown/accordion keyboard testing remain incomplete. Existing Playwright checks cover accessible names, visible focus, JS errors and responsive overflow at 360/768/1366/1920/2560px.
3. **B4 / G1 — Existing owner environment:** GitHub-hosted Docker/PostgreSQL validation is green; the owner's Windows workspace and any already-deployed/shared database migration preflight have not been accessed or verified.
4. **E2–E3 — AuditLog retention:** E1 decision brief is prepared in `.ai/decisions.md`; retention period, archive location, legal hold and deletion/anonymization require explicit owner/legal approval. No automated purge is authorized.
5. **H — B2C retail (APPROVED, P0):** activate a real B2C purchase journey alongside existing B2B Inquiry/RFQ. Current UI is placeholder/localStorage-only, Website routes and backend retail/order routes are not registered, and retail seed has unsafe random/non-idempotent behavior. Execute Workstream H; preserve B2B. Live payment, tax/shipping/returns policies and Finance/commission/settlement remain gated by explicit configuration/owner decisions.
6. **G2–G8 — External/Production:** real SMTP/Twilio delivery, payment sandbox/live validation, production backup/restore, deployment/rollback and post-deployment smoke tests remain unverified. No production deployment or live charge/message was performed.

## Git governance

- Only existing `main` is used.
- No branches, worktrees, detached checkouts, force-pushes or history rewrites.
- Only the lead creates commits and pushes.
- Each completed slice is committed directly to `main`; no destructive cleanup or user-change discard.
- The exact final remote SHA and its CI/migration/runtime evidence must be rechecked after documentation synchronization.

## Active parallel execution lanes — 2026-11-24

- **H — B2C Retail (P0, owner approved):** map schema and existing UI/API; repair inventory controller and concurrency; make retail seeds deterministic/non-destructive; implement buyer checkout/order/payment-sandbox journey; add Company seller and Admin operations; preserve B2B. Detailed tasks: `.ai/current-task.md` Workstream H.
- **F — Dashboard/Reporting:** continue KPI contract, date/time, tenant authorization and export acceptance.
- **CRM / Support:** complete acceptance of existing implementations; do not rebuild modules.
- **UI:** continue broad accessibility, responsive, contrast and keyboard audit.
- **Release gates:** owner Windows/shared DB, SMTP/Twilio, payment sandbox and Production backup/deploy/rollback remain environment-dependent and separately reported.
