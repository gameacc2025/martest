# Website B2C Cart, Checkout and Orders — Current Status

**Last verified:** 2026-11-24  
**Decision:** The owner superseded the former AD-4 freeze. B2C retail must operate in parallel with existing B2B product discovery and Inquiry/RFQ. Do not disable B2C routes or remove the B2B inquiry flow.

## Implemented Website routes

| Route | Access | Behavior |
|---|---|---|
| `/cart` | Guest / CUSTOMER | Local cart intent list; not an order or stock reservation |
| `/checkout` | CUSTOMER only | Saved-address selection, server price/stock preview, policy blockers and gated order placement |
| `/orders` | CUSTOMER only | Buyer-scoped order history from Retail API |
| `/orders/:id` | CUSTOMER only | Buyer-scoped order details, seller split, delivery snapshot and payment status |
| `/sandbox-payment/:authority` | CUSTOMER only | Server-confirmed sandbox payment simulation; no bank charge |
| `/wishlist` | Guest / CUSTOMER | Local preference list; not an order or stock reservation |

The Website header and mobile navigation expose cart and wishlist to guest/customer contexts and order history to CUSTOMER accounts. Existing B2B product browsing, customer/company inquiry, RFQ and inquiry-management routes remain registered.

## Retail catalog and checkout API

- `GET /api/v1/retail/catalog` and `GET /api/v1/retail/catalog/:id` expose only public, published, retail-enabled products with a valid positive retail tier and active seller.
- Public catalog responses do not expose exact available stock.
- `POST /api/v1/retail/checkout/preview` re-reads current prices, price-tier coverage and stock from PostgreSQL. It returns seller subtotals and explicit policy blockers. It does not create an order, payment or reservation.
- The local cart price is display-only. The server is authoritative for checkout and order placement.

## Order and sandbox payment API

All routes below require authenticated CUSTOMER context:

- `POST /api/v1/retail/orders` — requires an `Idempotency-Key` header, addressId and product/quantity lines.
- `GET /api/v1/retail/orders` — paginated, buyer-scoped order history.
- `GET /api/v1/retail/orders/:id` — buyer-scoped order details.
- `GET /api/v1/retail/payments/sandbox/:authority` — returns the authenticated buyer's sandbox payment details.
- `POST /api/v1/retail/payments/sandbox/:authority/confirm` — confirms only the sandbox attempt on the server.

Order placement is one serializable transaction: current product/seller/price/stock validation; RetailOrder creation; one SellerOrder per seller; immutable product, seller and delivery-address snapshots; CommissionSnapshot; inventory reservations; PaymentAttempt; and AuditLog. The transaction uses bounded retry for serializable/deadlock conflicts. Idempotent replay returns the original order; a key owned by another buyer returns conflict.

A successful sandbox confirmation creates a PaymentTransaction, transitions the order/payment state and consumes the reservations transactionally. Expired sandbox attempts transition the order to PAYMENT_EXPIRED and release reserved stock through a scheduled worker. Buyer ownership is checked on order and payment reads/actions.

## Explicit configuration gate

Order placement remains fail-closed unless all of the following are valid:

- `RETAIL_ORDER_PLACEMENT_ENABLED=true`
- `RETAIL_PAYMENT_PROVIDER=sandbox`
- `RETAIL_SHIPPING_FLAT_AMOUNT` is a non-negative decimal
- `RETAIL_TAX_RATE_BPS` is an integer from 0 through 10,000
- `RETAIL_TAX_BASE` is `PRODUCT_SUBTOTAL` or `SUBTOTAL_PLUS_SHIPPING`
- `RETAIL_COMMISSION_RATE_BPS` is an integer from 0 through 10,000

The reservation TTL is configurable through `RETAIL_ORDER_RESERVATION_TTL_MINUTES` (bounded to 5–60 minutes; default 15). The platform currency remains the configured retail currency (default IRR). Do not infer tax jurisdiction, shipping allocation, commission policy, refund rules or payout/accounting treatment from these technical defaults. The values above must be supplied and approved by the owner before enabling a non-disposable environment.

Sandbox confirmation is a test-only server workflow and does not call a live provider or debit a payment instrument. Live payment provider integration, signed webhooks, refunds and payouts remain disabled.

## Verification evidence

- CI [run 45393558283](https://github.com/gameacc2025/martest/actions/runs/45393558283): 1,871 backend tests, 429 frontend/shared tests across 74 files, 18 architecture/session tests; Website, Company and Admin builds passed.
- Migration [run 45393558372](https://github.com/gameacc2025/martest/actions/runs/45393558372): migration validation and Prisma model/table parity passed.
- Runtime [run 45393558304](https://github.com/gameacc2025/martest/actions/runs/45393558304): disposable PostgreSQL order lifecycle probe verifies idempotent replay, buyer IDOR isolation, sandbox confirmation, inventory consumption and payment-expiry release; all existing runtime probes and 8/8 browser smoke tests passed.
- Runtime script: `backend/scripts/verify-retail-order-lifecycle.js`.

## Remaining B2C work

1. Admin retail oversight, exception queues, reconciliation and audit visibility. Company seller inbox/fulfillment and read-only tenant-scoped inventory are implemented; stock adjustment remains gated pending inventory-ownership approval.
2. Admin retail oversight, exception queues, reconciliation and audit visibility.
3. Explicit customer cancellation/return/refund state machine and seller/admin transitions.
4. Real payment-provider adapter, signed callback/webhook validation, replay/out-of-order handling and provider sandbox credentials.
5. Full authenticated B2C browser E2E for add-to-cart → checkout → order → sandbox payment → order history, alongside B2B Inquiry/RFQ regression.
6. Owner-local Windows/Docker/PostgreSQL migration and runtime preflight; GitHub CI does not prove the local database is upgraded.

## Key implementation files

- `apps/website/src/stores/cart.js`
- `apps/website/src/stores/products.js`
- `apps/website/src/pages/public/ShoppingCart.vue`
- `apps/website/src/pages/public/Checkout.vue`
- `apps/website/src/pages/public/Orders.vue`
- `apps/website/src/pages/public/OrderDetails.vue`
- `apps/website/src/pages/public/SandboxPayment.vue`
- `apps/website/src/pages/public/Wishlist.vue`
- `backend/src/modules/retail/retail.service.js`
- `backend/src/modules/retail/retail-order.service.js`
- `backend/src/modules/retail/retail-order.controller.js`
- `backend/src/modules/retail/retail.routes.js`
- `backend/src/workers/..` and `backend/src/server.js` (sandbox payment expiry scheduling)
