# Agent Coordination — Active Board

## Active task

**PROJECT-WIDE-AUDIT-AND-REPAIR-2026-11-19**  
**Lead:** main coordinator  
**Branch:** `main` only  
**Latest fully verified code SHA:** `c86b28b09aa8aa009beb49ffb7f730c6cfda0661`
**Owner decision update (2026-11-24):** B2C retail must operate alongside B2B; prior AD-4 freeze on Cart/Checkout/Orders/Wishlist is superseded. See Workstream H in `.ai/current-task.md` and the dated decision in `.ai/decisions.md`.

## Exact-main acceptance evidence

| Gate | Result | Evidence |
|---|---|---|
| CI | **PASS** | [Run 45459275211](https://github.com/gameacc2025/martest/actions/runs/45459275211) — 1,891 backend tests, 75 frontend/shared test files, 18 architecture/session tests, Website/Company/Admin builds |
| Fresh PostgreSQL migrations | **PASS** | [Run 45459275397](https://github.com/gameacc2025/martest/actions/runs/45459275397) — 19 migrations and Prisma model/table parity |
| Docker Runtime + E2E | **PASS** | [Run 45459275260](https://github.com/gameacc2025/martest/actions/runs/45459275260) — services healthy, seeds twice, retail catalog/order/sandbox payment/reservation lifecycle, Company seller fulfillment and tenant isolation, inventory/notification concurrency and AD-1/AD-3 grants; 9/9 Playwright tests including B2C order → sandbox payment → order history and B2B Company RFQ in the same run; teardown successful |

## Completed executable work

- **A — Product security:** cross-company ownership, nested Price Tier/Image/Document authorization, direct-service permission parity, parent-child mismatch and cleanup coverage. Product documents are currently public static catalog assets under `/uploads`; there is no private product-document download route. Confirm this public-file policy before accepting confidential supplier documents.
- **B — Price Tier integrity:** non-overlap database exclusion, inclusive max-Int boundary, HTTP 409 consistency and real concurrent PostgreSQL verification.
- **C — CMS lifecycle:** category activation/deactivation, article category/tag integrity, revision restore, public filters, Persian slug generation and route-length limits.
- **D — AuditLog:** CMS, Product, Auth/session/PKCE, notification lifecycle/preferences, roles/permissions, settings/admin, addresses/contact and related sensitive mutations; actor propagation, transaction binding and PII minimization.
- **Notification delivery:** email/SMS workers now claim rows atomically with a recoverable five-minute lease; PostgreSQL verifies that only one concurrent claim wins. Delivery remains at-least-once across the unavoidable provider-accepted/process-crash window unless the provider supports idempotency.
- **Dashboard foundations:** Admin service-health states and Company dashboard API error states/recent-product ordering corrected. Company reports now load every product page (not only the API's 100-row cap), reconcile all seven product and seven inquiry statuses against API totals, reject inconsistent aggregate payloads, export every fetched row, and neutralize spreadsheet formula injection. Company product statistics exclude soft-deleted products, and product list pagination has deterministic ID tie-breaking. Shared design tokens match the approved palette; cross-panel accessibility-name, keyboard-focus and responsive smoke checks run in Playwright.
- **Runtime reliability:** seed import/runtime failure fixed; all seeds execute twice; migrations and schema parity pass.
- **Inventory controller first repair:** missing Prisma Client import fixed; controller transaction/actor regression test added; exact-main CI, fresh migration and runtime/browser validation PASS on `af1bd11e1bad74f4a3b430b770adbe7b7913f2c7` (1,852 backend / 413 frontend-shared / 18 architecture tests; 8/8 Playwright).
- **Inventory concurrency:** namespaced advisory locks, exact checkout replay checks, reserved-stock invariant, CAS terminal transitions and stable movement idempotency implemented. Real PostgreSQL competing-reservation and release/consume race probe PASS on `52a828076751fc29f14a6685a8cfc70275b1884a` (1,854 backend tests; 8/8 Playwright).
- **Retail seed:** 90 demo products are explicitly retail-enabled; deterministic demo-only initial stock and immutable receipt ledger are idempotent and non-destructive. Dedicated PostgreSQL probe confirms a repeated seed leaves all 90 balances and movements unchanged. Runtime PASS on `3b52d79a1008f90d7b47bbb214359392e4715bf0`.
- **Inventory API + Website B2C:** registered 8 tenant/role-scoped Inventory endpoints, app-level 401 probes, route/OpenAPI count 293 and architecture graph updated. Website now recognizes public `prices` minQuantity=1 retail tier; Wishlist storage and add-to-cart integration fixed/tested. CI 1,855 backend, 73 frontend/shared files, 18 architecture; 19 migrations/101 models; 8/8 Playwright PASS on `351f218d1f7f41949d4cb6cd52334e50e253e252`.
- **Retail API:** public retail catalog/detail and CUSTOMER-only checkout preview are registered (296 total API routes). Server filters current positive minQuantity=1 tiers, hides exact stock publicly, revalidates price/stock for preview and returns explicit unconfigured policy blockers without creating orders/payments/reservations. Real PostgreSQL probe validates 24 eligible products and zero preview mutations. CI 1,864 backend / 73 frontend-shared / 18 architecture; migration 19/101; 8/8 Playwright PASS on `ecbaa485fca8ebfd328abc2e658acf49c733ea1e`.
- **B2C + Company seller lifecycle:** Website cart/checkout/address/order history/details and sandbox payment are wired to real Retail APIs. Backend creates idempotent multi-seller orders, reservations, PaymentAttempt and audit; sandbox confirmation consumes stock and expiry releases it. Company seller inbox now reads paid company-owned SellerOrders and supports explicit accept/process/ready/ship/deliver transitions with tracking events. Company inventory is read-only and company-scoped; cross-company inventory/order IDs return 404. Live provider and company stock adjustment remain gated.
- **B2C/B2B auth and checkout browser acceptance:** CUSTOMER_USER is recognized as the default Website context when no STAFF/COMPANY AccessProfile exists; this fixes authenticated customer Add-to-Cart visibility. Checkout suppresses the empty-cart redirect after successful order placement so payment navigation is not raced back to `/cart`. The combined Playwright journey now passes B2C cart/address/checkout/order/sandbox payment/order history and B2B Company RFQ creation in one run (9/9 total browser tests).
- **Admin retail oversight:** STAFF-permission-gated read-only order list/detail is wired to Admin navigation and real API; seller splits, shipment/tracking, payment attempts/transactions and inventory reservation state are visible. Exception filtering now includes failed/rejected/invalid-signature webhook events; order detail exposes minimized provider/event/status/signature/timestamp metadata and a boolean error flag, never raw payload/error text. No retry/mutation is exposed. Live provider callback ingestion/reconciliation and return/refund queue remain gated by provider credentials and owner policy.

## Remaining work / blockers

1. **F1–F2 — Dashboard/reporting:** finish the remaining KPI/API contract matrix, date/time boundaries and tenant-scoped reporting tests. Pagination/export completeness and status reconciliation have been repaired but still need broader date/filter/tenant acceptance coverage. Do not redefine KPIs without owner approval.
2. **F3–F5 — UI verification:** broader component-level empty/error-state coverage, full light/dark screen audit, contrast/zoom/reduced-motion checks and dialog/dropdown/accordion keyboard testing remain incomplete. Existing Playwright checks cover accessible names, visible focus, JS errors and responsive overflow at 360/768/1366/1920/2560px.
3. **B4 / G1 — Existing owner environment:** GitHub-hosted Docker/PostgreSQL validation is green; the owner's Windows workspace and any already-deployed/shared database migration preflight have not been accessed or verified.
4. **E2–E3 — AuditLog retention:** E1 decision brief is prepared in `.ai/decisions.md`; retention period, archive location, legal hold and deletion/anonymization require explicit owner/legal approval. No automated purge is authorized.
5. **H — B2C retail (APPROVED, P0):** buyer checkout/order/sandbox payment and Company seller fulfillment/read-only inventory are implemented and PostgreSQL-verified alongside B2B Inquiry/RFQ. Combined authenticated B2C purchase/payment/order-history and B2B RFQ browser journey now passes in the same Runtime run. Read-only Admin order oversight MVP is also implemented. Next: Admin exception/reconciliation/webhook visibility; customer cancellation/returns/refunds and live provider after explicit owner decisions. Company stock adjustment remains gated pending inventory ownership policy.
6. **G2–G8 — External/Production:** real SMTP/Twilio delivery, payment sandbox/live validation, production backup/restore, deployment/rollback and post-deployment smoke tests remain unverified. No production deployment or live charge/message was performed.

## Git governance

- Only existing `main` is used.
- No branches, worktrees, detached checkouts, force-pushes or history rewrites.
- Only the lead creates commits and pushes.
- Each completed slice is committed directly to `main`; no destructive cleanup or user-change discard.
- The exact final remote SHA and its CI/migration/runtime evidence must be rechecked after documentation synchronization.

## Active parallel execution lanes — 2026-11-24

- **H — B2C Retail (P0, owner approved):** buyer order/payment and Company seller fulfillment are implemented and PostgreSQL-verified; the combined B2C purchase/payment/order-history + B2B RFQ Playwright journey passes 9/9 Runtime tests on `8f4866e33e76e5d164e4b3c7674c8dcc883139d5`. Admin read-only order oversight and stored webhook exception/status visibility are implemented. Live provider webhook ingestion, returns/refunds and stock adjustment remain gated by provider credentials or explicit owner policy. Detailed tasks: `.ai/current-task.md` Workstream H.
- **F — Dashboard/Reporting:** F1 API/KPI contract inventory is complete and recorded in `.ai/current-task.md`; F2 remains partial because current reports are all-time with no date-range/timezone contract and no large-dataset performance target. Admin stale-KPI clearing and retryable errors for failed company/product/approval-queue lists are implemented and tested as an F3 slice. Continue the broader all-panel loading/empty/error, palette, contrast, keyboard and dialog audit without inferring business definitions or timezone.
- **CRM / Support:** complete acceptance of existing implementations; do not rebuild modules.
- **UI:** continue broad accessibility, responsive, contrast and keyboard audit.
- **Release gates:** owner Windows/shared DB, SMTP/Twilio, payment sandbox and Production backup/deploy/rollback remain environment-dependent and separately reported.
