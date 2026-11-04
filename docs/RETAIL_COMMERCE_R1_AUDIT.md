# Retail Commerce R1 — Backend Readiness Audit

**Date:** 2026-11-04  
**Status:** Audit complete; no retail schema/API activation in this phase.  
**Branch:** main

## Executive result

The current backend is a product catalogue + B2B inquiry platform, not a retail commerce backend. The Website cart remains local-only and checkout intentionally cannot create an order or payment. The existing domain contract in `RETAIL_COMMERCE_AND_SETTLEMENT_DESIGN.md` remains the correct target, but the first implementation step needs a safe product/stock foundation before any order endpoint is enabled.

## Verified current state

| Area | Current implementation | Retail implication |
|---|---|---|
| Product identity | Product has title, SKU, company/category, status, visibility and media | No retail-specific enable/disable flag |
| Product workflow | DRAFT → PENDING_REVIEW → APPROVED → PUBLISHED; company publishes after staff approval | Retail must require published/public state, not just product existence |
| Company state | Company has PENDING/ACTIVE/INACTIVE/SUSPENDED and soft-delete | Retail eligibility must require ACTIVE and not deleted |
| Price | ProductPriceTier uses Decimal(18,2), min/max quantity, validFrom/validTo | A minQuantity=1 tier is a retail-price candidate, but no checkout resolver enforces validity windows/range selection yet |
| Price history | ProductPriceSnapshot records minQuantity=1 changes | Useful audit/chart data; not an authoritative checkout quote |
| Inventory | No inventory balance, movement or reservation models found | Cannot safely sell or reserve stock |
| Orders | No Order/SellerOrder models; legacy /orders backend module is removed | Cannot persist retail orders |
| Payments | No retail payment attempt/provider/webhook implementation found | Cannot accept or confirm retail payment |
| Shipping/returns/ledger | No retail fulfillment, return, or seller ledger models found | These must remain disabled until later phases |

## Additional catalogue risk to resolve in R1

Public product list/detail queries enforce `PUBLISHED` and `PUBLIC`, but the inspected query does not additionally scope the related company to `ACTIVE` and `deletedAt: null`. Retail eligibility must explicitly enforce active seller status and must not assume that public catalogue visibility alone is enough.

## R1 implementation contract (safe defaults)

These defaults let the backend be built without accidentally turning every existing product into a retail item:

1. **Retail is opt-in:** new boolean `retailEnabled` defaults to `false`; existing products remain unavailable for B2C until explicitly enabled by an authorized company/staff actor.
2. **No stock means no sale:** inventory starts at zero. No implicit or unlimited stock. Stock adjustments must be explicit, attributable, reasoned and audited.
3. **Eligibility is server-derived:** product must be not deleted, `PUBLISHED`, `PUBLIC`, `retailEnabled=true`, seller company `ACTIVE` and not deleted, and have one currently valid retail price tier with `minQuantity=1`.
4. **Price is resolved on server:** checkout never trusts local cart price. Price tier validity dates and quantity bounds must be checked at request time. No retail quote if no valid tier exists.
5. **Atomic reservation:** available stock is `onHand - reserved`; conditional update/reservation must be atomic and available stock may never go negative. Reservation expiration and release must be explicit.
6. **No payment/order shortcut:** R1 does not enable checkout, orders, payment success, refunds or payouts. Those remain later phases with idempotency and payment-provider contracts.
7. **Auditability:** stock adjustment/reservation/release/consume events must be traceable to actor and reason; tenant scope comes from authenticated AccessProfile.companyId, never from a trusted body companyId.

## Open engineering decisions to carry into implementation

- Use integer stock quantities for telecom equipment in MVP; fractional/serialized inventory is out of scope unless a current product family requires it.
- Keep one stock balance per product for MVP; warehouse/location support is deferred.
- Use the existing Decimal(18,2) convention for prices. The project does not currently store an explicit currency on ProductPriceTier; before R2 multi-item checkout, the single-currency policy must be made explicit (current UI defaults to IRR, but UI defaults are not a backend contract).
- Reservation TTL must be configurable and the expiration worker/cleanup mechanism must be specified before R2 checkout.
- Stock adjustment permissions and whether a company user may increase stock without staff approval must be encoded in the permission catalogue and server routes.

## Next implementation slices

- **R1a — Eligibility:** Prisma migration for `retailEnabled=false`; service-level eligibility resolver and public retail catalogue/detail endpoints; company-active/deleted checks; tests.
- **R1b — Inventory:** InventoryBalance, InventoryMovement, InventoryReservation; audited stock adjustment commands; atomic reserve/release/consume operations; concurrency tests.
- **R1 exit:** Existing products remain retail-disabled; no checkout endpoint is enabled until eligibility, price resolution, inventory reservation and tenant/security tests pass.

## Verification

Source audit performed against current `main`: Prisma Product/ProductPriceTier/ProductPriceSnapshot/Company/User/AccessProfile/Address models, product service/routes, app route registration, and the retail domain design. No schema, migration, API, or UI behavior was changed in this audit. Runtime tests/build/browser were not run.
