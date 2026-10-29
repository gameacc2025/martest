# Current Task — 2026-10-29

## Active handoff: Step 7 — Company Profile public-catalog contract

**Repository:** `gameacc2025/martest`  
**Canonical branch:** `main`  
**Feature branch:** `fix/website-company-profile-api-contract-step-7`  
**Base commit:** `e7d9a50d6fe86097d1286507d5249c026467b483`  
**Status:** Company Profile now uses the existing public product-catalog contract and has regression tests. Feature CI/migration validation pending; do not merge until they pass.

## Completed UI steps

- **Step 1 Homepage:** PR #29 merged; feature CI/migration and post-merge checks passed.
- **Step 2 Product Listing:** PR #30 merged; feature CI/migration and post-merge checks passed.
- **Step 3 Product Details:** PR #31 merged; feature and post-merge CI/migration checks passed.
- **Step 4 Categories:** PR #32 merged; feature and post-merge CI/migration checks passed.
- **Step 5 Search Results:** PR #33 merged as `1c58e2c2b01bbfdfe2e4b938e91b9199945ecc25`; feature and post-merge CI/migration checks passed. Runtime validation [40881262762](https://github.com/gameacc2025/martest/actions/runs/40881262762) failed at browser smoke after infrastructure/migration checks passed; do not debug browser smoke as the next task.
- **Step 6 About Us:** PR #34 merged as `503bbe8af65e1b787a64a7d53aa50ff9bba3bf7f`; feature CI [40882370960](https://github.com/gameacc2025/martest/actions/runs/40882370960), migration [40882371076](https://github.com/gameacc2025/martest/actions/runs/40882371076), post-merge CI [40882547737](https://github.com/gameacc2025/martest/actions/runs/40882547737), and post-merge migration [40882547667](https://github.com/gameacc2025/martest/actions/runs/40882547667) passed. Runtime validation was still in progress at the last check.
- **Step 7 Company Profile:** Routed page calls to missing store methods, and backend company read/reviews/follows are not publicly exposed. Updated `CompanyProfile.vue` to use the existing public products endpoint via `productsStore.getProducts({ page, limit, companyId })`. Backend explicitly supports filtering the public catalog by company ID and clamps it to `PUBLISHED + PUBLIC`; public product payloads include company id/name/type. Removed unsupported reviews/follow actions rather than inventing endpoints. Added responsive shared-design layout, loading/error/empty/retry states, product normalization, route-ID watching, pagination and product navigation. Regression tests added in `CompanyProfile.test.js`. CI/migration validation pending.

## Step 7 verification plan

1. Inspect feature CI for frontend/shared tests, backend tests, Prisma generation, architecture graph and all frontend builds.
2. Inspect migration validation separately.
3. Do not debug browser smoke as the next task; record its result independently if available.
4. Merge only after feature CI and migration validation pass.
5. Inspect post-merge CI and migration validation before proceeding.

## Remaining cross-project backlog

1. Complete safe page-by-page redesign of remaining targeted pages, one at a time.
2. Decide whether to expose/repair the Companies directory: it is not registered in the website router, references a missing CompanyCard path and store methods not exported by the current company store.
3. Exhaustive company-owned route/tenant/IDOR review.
4. Complete SMS event-dispatch integration; Twilio adapter/worker/quota exist, but dispatcher does not enqueue SMS rows. Live delivery unverified.
5. Controlled live Zarinpal and SMTP verification.
6. Complete endpoint/schema/permission API documentation.
7. Refresh Graphify when a workspace is available.

## Constraints

- No mock data, auth bypass, or invented backend endpoints.
- Public company pages must use only the public catalog contract and show only PUBLISHED + PUBLIC products.
- Do not expose reviews, follows, private company details, or unverified company metrics without a supported API/security contract.
- Preserve app-context/RBAC, tenant ownership, and inquiry permission/subscription constraints.
- Browser-smoke debugging is not the next task.
- Do not claim checks green without workflow evidence.
