# Current Task — 2026-10-29

## Active handoff: Step 7 — Company Profile API/store contract repair

**Repository:** `gameacc2025/martest`  
**Canonical branch:** `main`  
**Latest merged feature:** About Us PR #34, squash commit `503bbe8af65e1b787a64a7d53aa50ff9bba3bf7f`.  
**Status:** Step 6 is merged; feature and post-merge CI/migration checks passed. The next task is to reconcile the routed Company Profile page with the actual website stores/backend contracts before applying a visual redesign.

## Completed UI steps

- **Step 1 Homepage:** PR #29 merged; feature CI/migration and post-merge checks passed.
- **Step 2 Product Listing:** PR #30 merged; feature CI/migration and post-merge checks passed.
- **Step 3 Product Details:** PR #31 merged; feature CI and migration checks, plus post-merge checks, passed.
- **Step 4 Categories:** PR #32 merged; feature and post-merge CI/migration checks passed.
- **Step 5 Search Results:** PR [#33](https://github.com/gameacc2025/martest/pull/33) merged as `1c58e2c2b01bbfdfe2e4b938e91b9199945ecc25`. Feature CI [40880947037](https://github.com/gameacc2025/martest/actions/runs/40880947037), migration [40880947043](https://github.com/gameacc2025/martest/actions/runs/40880947043), post-merge CI [40881378521](https://github.com/gameacc2025/martest/actions/runs/40881378521), and post-merge migration [40881378435](https://github.com/gameacc2025/martest/actions/runs/40881378435) passed. Runtime validation [40881262762](https://github.com/gameacc2025/martest/actions/runs/40881262762) failed at browser smoke after infrastructure/migration checks passed; per owner instruction, do not debug browser smoke as the next task.
- **Step 6 About Us:** PR [#34](https://github.com/gameacc2025/martest/pull/34) merged as `503bbe8af65e1b787a64a7d53aa50ff9bba3bf7f`. Feature CI [40882370960](https://github.com/gameacc2025/martest/actions/runs/40882370960), migration [40882371076](https://github.com/gameacc2025/martest/actions/runs/40882371076), post-merge CI [40882547737](https://github.com/gameacc2025/martest/actions/runs/40882547737), and post-merge migration [40882547667](https://github.com/gameacc2025/martest/actions/runs/40882547667) passed. About Us uses shared design primitives, real published products, accessible loading/error/empty/retry states; unverified static metrics, fictional team profiles and partner claims were removed. Runtime validation [40882371017](https://github.com/gameacc2025/martest/actions/runs/40882371017) was still in progress at last check; do not claim a result or debug browser smoke as the next task.

## Step 7 — Company Profile contract audit and repair

Before visual redesign, inspect the existing route, store exports, API client endpoints and backend routes/services/tests. Source review found these calls in routed `apps/website/src/pages/public/CompanyProfile.vue` that do not exist in current store exports:
- `productsStore.getProductsByCompany`
- `companyStore.getCompanyReviews`
- `companyStore.isFollowing`
- `companyStore.followCompany`
- `companyStore.unfollowCompany`

Determine whether backend/API support exists under different names. Implement only a source-supported contract; do not invent endpoints or mock data. Add tests for company/product/review loading, follow behavior only if the backend contract exists, route ID handling, and error/empty states. Then apply the page-level design-system styling without changing authorization or route behavior. Run CI/build and migration validation; inspect post-merge checks before proceeding.

## Other confirmed follow-up findings

- Website `Companies.vue` is not registered in the current website router. It imports a `CompanyCard.vue` path absent from the current Git tree and calls `getFeaturedCompanies`, `followCompany`, and `unfollowCompany` methods not exported by `apps/website/src/stores/companies.js`. Treat as a separate directory routing/API contract decision, not a blind UI port.
- Graphify MCP refresh remains blocked until a workspace is available and selected. The repository-generated architecture graph CI check is separate and has passed on prior verified commits.

## Remaining cross-project backlog

1. Repair Company Profile API/store behavior, then safely redesign the page.
2. Decide whether to expose/repair the Companies directory and reconcile its API/store/component contract.
3. Exhaustive company-owned route/tenant/IDOR review.
4. Complete SMS event-dispatch integration; Twilio adapter/worker/quota exist, but dispatcher does not enqueue SMS rows. Live delivery unverified.
5. Controlled live Zarinpal and SMTP verification.
6. Complete endpoint/schema/permission API documentation.
7. Refresh Graphify when a workspace is available.

## Constraints

- No mock data or authentication bypass; preserve real API contracts and route behavior.
- Do not add fabricated metrics, people, or partner claims to production-facing content.
- Preserve app-context/RBAC, tenant ownership, and inquiry permission/subscription constraints.
- Browser-smoke debugging is not the next task.
- Do not claim checks green without workflow evidence.
