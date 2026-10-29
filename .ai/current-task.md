# Current Task — 2026-10-29

## Active handoff: Step 8 — Companies directory routing/API contract

**Repository:** `gameacc2025/martest`  
**Canonical branch:** `main`  
**Latest merged feature:** Company Profile PR #35, squash commit `59c9dc201e6bd896a7a1ca5e599d9b4f31426659`.  
**Status:** Step 7 feature and post-merge CI/migration checks passed. The next task is to determine whether the Website Companies directory is intended to be public/routed and reconcile its API/store/component contract before redesigning it.

## Completed UI steps

- **Step 1 Homepage:** PR #29 merged; feature CI/migration and post-merge checks passed.
- **Step 2 Product Listing:** PR #30 merged; feature CI/migration and post-merge checks passed.
- **Step 3 Product Details:** PR #31 merged; feature and post-merge CI/migration checks passed.
- **Step 4 Categories:** PR #32 merged; feature and post-merge CI/migration checks passed.
- **Step 5 Search Results:** PR [#33](https://github.com/gameacc2025/martest/pull/33) merged as `1c58e2c2b01bbfdfe2e4b938e91b9199945ecc25`. Feature and post-merge CI/migration checks passed. Runtime validation [40881262762](https://github.com/gameacc2025/martest/actions/runs/40881262762) failed at browser smoke after infrastructure/migration checks passed; per owner instruction, do not debug browser smoke as the next task.
- **Step 6 About Us:** PR [#34](https://github.com/gameacc2025/martest/pull/34) merged as `503bbe8af65e1b787a64a7d53aa50ff9bba3bf7f`. Feature CI [40882370960](https://github.com/gameacc2025/martest/actions/runs/40882370960), migration [40882371076](https://github.com/gameacc2025/martest/actions/runs/40882371076), post-merge CI [40882547737](https://github.com/gameacc2025/martest/actions/runs/40882547737), and post-merge migration [40882547667](https://github.com/gameacc2025/martest/actions/runs/40882547667) passed. Runtime validation [40882371017](https://github.com/gameacc2025/martest/actions/runs/40882371017) failed at browser smoke; do not debug it as the next task.
- **Step 7 Company Profile:** PR [#35](https://github.com/gameacc2025/martest/pull/35) merged as `59c9dc201e6bd896a7a1ca5e599d9b4f31426659`. Feature CI [40883463184](https://github.com/gameacc2025/martest/actions/runs/40883463184), migration [40883463227](https://github.com/gameacc2025/martest/actions/runs/40883463227), post-merge CI [40883640234](https://github.com/gameacc2025/martest/actions/runs/40883640234), and post-merge migration [40883640581](https://github.com/gameacc2025/martest/actions/runs/40883640581) passed. The page now uses the existing public product catalog filtered by company ID, only displays PUBLISHED + PUBLIC products, and removes unsupported reviews/follows. Runtime validation [40883463183](https://github.com/gameacc2025/martest/actions/runs/40883463183) was still in progress at last check; no result is claimed.

## Step 8 — Companies directory contract audit

Confirmed source findings:
- `apps/website/src/pages/public/Companies.vue` exists but is not registered in `apps/website/src/router/index.js`.
- It imports `../../components/companies/CompanyCard.vue`, which is absent from the current complete Git tree.
- It calls `getFeaturedCompanies`, `followCompany`, and `unfollowCompany`, which are not exported by `apps/website/src/stores/companies.js`.
- Backend `GET /companies` requires STAFF context and `companies.read`; it is not a public directory endpoint.

Next actions:
1. Confirm from existing architecture/product decisions whether the public Website should list companies. Do not make the current staff-only endpoint public.
2. If no public directory is approved, keep the page unrouted and remove/avoid links to it; document that decision.
3. If a public directory is a required product feature, design a public-safe endpoint with explicit field allowlisting and tests as a separately reviewed backend change before wiring the page.
4. Do not invent frontend methods or add mock companies. Add tests for the selected contract, then style only once routing/data behavior is settled.

## Remaining cross-project backlog

1. Decide/fix the Companies directory public-vs-staff contract.
2. Continue safe redesign of remaining targeted pages, one at a time.
3. Exhaustive company-owned route/tenant/IDOR review.
4. Complete SMS event-dispatch integration; Twilio adapter/worker/quota exist, but dispatcher does not enqueue SMS rows. Live delivery unverified.
5. Controlled live Zarinpal and SMTP verification.
6. Complete endpoint/schema/permission API documentation.
7. Refresh Graphify when a workspace is available.

## Constraints

- No mock data, auth bypass, or invented endpoints.
- Never make `GET /companies` public without an explicit public-safe API design and regression tests.
- Preserve app-context/RBAC, tenant ownership, and inquiry permission/subscription constraints.
- Browser-smoke debugging is not the next task.
- Do not claim checks green without workflow evidence.
