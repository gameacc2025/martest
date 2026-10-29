# Current Task — 2026-10-29

## Active handoff: Step 6 — Website About Us redesign

**Repository:** `gameacc2025/martest`  
**Canonical branch:** `main`  
**Feature branch:** `feat/website-about-us-redesign-step-6`  
**Base commit:** `72eb48ea97adbcc265462a1c8281cc03fa6896e9`  
**Status:** About Us redesign and regression tests are on the feature branch; CI/migration verification pending. Do not merge until feature checks pass.

## Completed UI steps

- **Step 1 Homepage:** PR #29 merged; feature CI/migration and post-merge checks passed.
- **Step 2 Product Listing:** PR #30 merged; feature CI/migration and post-merge checks passed.
- **Step 3 Product Details:** PR #31 merged; feature CI and migration checks, plus post-merge checks, passed.
- **Step 4 Categories:** PR #32 merged; feature and post-merge CI/migration checks passed.
- **Step 5 Search Results:** PR [#33](https://github.com/gameacc2025/martest/pull/33) merged as `1c58e2c2b01bbfdfe2e4b938e91b9199945ecc25`. Feature CI [40880947037](https://github.com/gameacc2025/martest/actions/runs/40880947037), migration [40880947043](https://github.com/gameacc2025/martest/actions/runs/40880947043), post-merge CI [40881378521](https://github.com/gameacc2025/martest/actions/runs/40881378521), and post-merge migration [40881378435](https://github.com/gameacc2025/martest/actions/runs/40881378435) passed. Runtime validation [40881262762](https://github.com/gameacc2025/martest/actions/runs/40881262762) failed at browser smoke after infrastructure health/migration checks passed; per owner instruction, do not debug browser smoke as the next task.
- **Step 6 About Us:** Reworked the static page with shared design tokens, responsive mission/value/how-it-works sections, and API-backed published products. Removed unverified hardcoded user/company/product/order statistics, invented team profiles, and partner claims. Preserved the existing `productsApi.list({ page: 1, limit: 6, status: 'PUBLISHED' })` request and `product-details` navigation. Added loading/error/empty states and `AboutUs.test.js` covering API request/render, no demo metrics, error/retry, empty state and navigation. CI/migration verification pending.

## Step 6 verification plan

1. Inspect PR CI: frontend/shared tests, backend tests, Prisma generation, architecture graph check and all three frontend builds.
2. Inspect migration validation separately.
3. Record runtime validation independently; do not pursue browser-smoke debugging as the next task.
4. Merge only after feature CI and migration validation pass; then inspect post-merge CI and migration validation before starting another page.

## Confirmed follow-up findings from source review

- Website `Companies.vue` is not registered in the current website router. It imports a `CompanyCard.vue` path that is absent from the current tree and calls company-store methods not exported by `apps/website/src/stores/companies.js`. Do not redesign it blindly; decide whether it should be routed and reconcile its API/store contract first.
- Routed `CompanyProfile.vue` calls `getProductsByCompany`, `getCompanyReviews`, `isFollowing`, `followCompany`, and `unfollowCompany`; these methods are absent from the current website products/company stores. Repair and test the actual contract before its visual redesign.
- Graphify MCP refresh remains blocked until a workspace is available and selected.

## Remaining cross-project backlog

1. Finish safe UI redesign page-by-page, with tests and builds before each next page.
2. Repair company directory/profile routing and store/API contract mismatches identified above.
3. Exhaustive company-owned route/tenant/IDOR review.
4. Complete SMS event-dispatch integration; Twilio adapter/worker/quota exist, but dispatcher does not enqueue SMS rows. Live delivery unverified.
5. Controlled live Zarinpal and SMTP verification.
6. Complete endpoint/schema/permission API documentation.
7. Refresh Graphify when a workspace is available.

## Constraints

- No mock data or auth bypass; preserve real APIs and route behavior.
- Do not add fake platform metrics, fake company/person identities, or unverified partner claims to production-facing copy.
- Preserve app-context/RBAC, tenant ownership, and inquiry permission/subscription constraints.
- Browser-smoke debugging is not the next task.
- Do not claim checks green without workflow evidence.
