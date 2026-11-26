# Website B2C Cart, Checkout and Orders — Current Status

**Last verified:** 2026-11-26  
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

**Latest verified application code SHA:** 1c6bd48dcec14bef4c3099ec4c2736a542cfd577.

- CI [run 45765344378](https://github.com/gameacc2025/martest/actions/runs/45765344378): PASS — 1,934 backend tests, 468 frontend/shared tests across 80 files, 18 architecture/session tests; Website, Company and Admin builds passed.
- Migration [run 45765344384](https://github.com/gameacc2025/martest/actions/runs/45765344384): PASS — 19 migrations; 101 Prisma models / 102 PostgreSQL tables; schema parity PASS.
- Runtime [run 45765344399](https://github.com/gameacc2025/martest/actions/runs/45765344399): PASS — all services healthy; seeds twice; retail catalog/checkout, multi-seller order, sandbox payment/reservation, Price Tier and Inventory concurrency, notification idempotency, CRM PostgreSQL lifecycle and 11/11 Playwright tests; teardown successful.
- Combined browser journey: authenticated CUSTOMER completes cart/address/checkout/sandbox payment/order history while a separate COMPANY manager creates B2B Inquiry/RFQ; CRM STAFF journey and Support CUSTOMER/COMPANY/STAFF isolation also pass in the same Runtime gate.
- Customer context regression: CUSTOMER_USER with no AccessProfile is recognized as the default Website context; STAFF/COMPANY panel selection remains AccessProfile-based.
- Checkout regression: clearing the local cart after a successful order no longer races navigation back to /cart before sandbox payment.
- Runtime scripts include backend/scripts/verify-retail-order-lifecycle.js and backend/scripts/verify-crm-postgres-lifecycle.js.
## Remaining B2C work

1. Extend the Admin read-only order oversight MVP with exception queues, webhook failure/reconciliation visibility and a returns/refund queue. STAFF permission and order list/detail APIs are already connected.
2. Implement customer cancellation, return authorization, inspection/disposition and refund state transitions only after return windows, refund responsibility and seller policy are explicitly approved.
3. Implement a real payment-provider adapter, signed callback/webhook validation, replay/out-of-order handling and provider sandbox validation after provider selection and credentials are supplied. Current payment remains sandbox-only; no live charge is possible.
4. Keep Company stock adjustments/receipts/transfers disabled until inventory ownership and approval policy are decided.
5. Owner-local Windows/Docker/PostgreSQL migration and runtime preflight remains unverified; GitHub CI does not prove the local database is upgraded.
6. Production backup/restore, deployment/rollback and post-deployment validation remain separate release gates.

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
