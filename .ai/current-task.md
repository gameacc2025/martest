# Current Task — 2026-10-29

## Active handoff: Step 9 — Website FAQ redesign

**Repository:** `gameacc2025/martest`  
**Canonical branch:** `main`  
**Feature branch:** `feat/website-faq-redesign-step-9`  
**Base commit:** `264d8863060d142a74fb37119167b4d4e670f3fd`  
**Status:** FAQ redesign and regression tests are on the feature branch; CI/migration verification pending.

## Completed UI steps

- **Step 1 Homepage:** PR #29 merged; feature CI/migration and post-merge checks passed.
- **Step 2 Product Listing:** PR #30 merged; feature CI/migration and post-merge checks passed.
- **Step 3 Product Details:** PR #31 merged; feature and post-merge CI/migration checks passed.
- **Step 4 Categories:** PR #32 merged; feature and post-merge CI/migration checks passed.
- **Step 5 Search Results:** PR #33 merged; feature and post-merge CI/migration checks passed. Runtime validation [40881262762](https://github.com/gameacc2025/martest/actions/runs/40881262762) failed at browser smoke after infrastructure/migration checks passed.
- **Step 6 About Us:** PR #34 merged; feature CI [40882370960](https://github.com/gameacc2025/martest/actions/runs/40882370960), migration [40882371076](https://github.com/gameacc2025/martest/actions/runs/40882371076), post-merge CI [40882547737](https://github.com/gameacc2025/martest/actions/runs/40882547737), and post-merge migration [40882547667](https://github.com/gameacc2025/martest/actions/runs/40882547667) passed. Runtime validation [40882371017](https://github.com/gameacc2025/martest/actions/runs/40882371017) failed at browser smoke.
- **Step 7 Company Profile:** PR #35 merged as `59c9dc201e6bd896a7a1ca5e599d9b4f31426659`. Feature CI [40883463184](https://github.com/gameacc2025/martest/actions/runs/40883463184), migration [40883463227](https://github.com/gameacc2025/martest/actions/runs/40883463227), post-merge CI [40883640234](https://github.com/gameacc2025/martest/actions/runs/40883640234), and post-merge migration [40883640581](https://github.com/gameacc2025/martest/actions/runs/40883640581) passed. Runtime validation [40883463183](https://github.com/gameacc2025/martest/actions/runs/40883463183) failed at browser smoke.
- **Step 8 Companies directory decision:** Keep `Companies.vue` unrouted/dormant. Backend `GET /companies` is STAFF-only; the current page also references a missing component and store methods. Do not expose it publicly until a separate public-safe endpoint and field allowlist are explicitly designed and tested. This is a security-preserving decision, not a claim that the directory is implemented.
- **Step 9 FAQ:** Reworked the FAQ with shared design tokens, responsive accordion layout and accessible expanded/region semantics. Replaced outdated claims about returns, installments, order tracking and seller contact with guidance consistent with the current B2B inquiry flow, company approval and product publication lifecycle. Added tests for accordion behavior, contact route and absence of unsupported promises. CI/migration validation pending.

## Step 9 verification plan

1. Inspect feature CI for frontend/shared tests, backend tests, Prisma generation, architecture graph and all frontend builds.
2. Inspect database migration validation separately.
3. Do not debug browser smoke as the next task; record its result independently.
4. Merge only after feature CI and migration validation pass.
5. Inspect post-merge CI and migration validation before proceeding.

## Remaining cross-project backlog

1. Continue safe redesign of remaining targeted pages, one at a time.
2. Exhaustive company-owned route/tenant/IDOR review.
3. Complete SMS event-dispatch integration; Twilio adapter/worker/quota exist, but dispatcher does not enqueue SMS rows. Live delivery unverified.
4. Controlled live Zarinpal and SMTP verification.
5. Complete endpoint/schema/permission API documentation.
6. Refresh Graphify when a workspace is available.

## Constraints

- No mock data, auth bypass, or invented endpoints.
- Do not make `GET /companies` public without an explicit public-safe API design and regression tests.
- Do not promise checkout, installment, return, or order-tracking functionality unless implemented and verified.
- Preserve app-context/RBAC, tenant ownership, and inquiry permission/subscription constraints.
- Browser-smoke debugging is not the next task.
- Do not claim checks green without workflow evidence.
