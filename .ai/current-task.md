# Current Task — 2026-10-29

## Active task: Step 2 — Website Product Listing redesign

**Repository:** `gameacc2025/martest`  
**Canonical branch:** `main`  
**Working branch:** `feat/website-product-listing-redesign-step-2`  
**Base:** `main` at `55d99f59ed6ee5c8938507beeb861897dbadb335`

## Step 1 completed — Website homepage

PR [#29](https://github.com/gameacc2025/martest/pull/29) merged as `520d590b51b7d4be49772dd44cc3f5dc96f45351`. Feature-branch CI [40839895731](https://github.com/gameacc2025/martest/actions/runs/40839895731) and migration validation [40839895740](https://github.com/gameacc2025/martest/actions/runs/40839895740) passed. Post-merge main CI and migration validation also passed on the merge commit; docs-only follow-up commit CI is separate.

## Step 2 scope — Product Listing

- File: `apps/website/src/pages/public/ProductListing.vue`
- Current changes: shared design-system page/header/surface styling, explicit labels for search/category/price inputs, live-state accessibility semantics, keyboard activation and focus visibility for product tiles, improved responsive product grid and pagination surface.
- Preserved: `productsStore.getCategories()`, `productsStore.getProducts(params)`, initial `route.query.category` handling, category query watcher, current filter and pagination semantics, `product-details` route contract, and loading/error/empty branches.
- Tests added: `apps/website/src/pages/public/ProductListing.test.js` covers initial category/API params, keyboard navigation, error/empty states, and route-query changes.
- **Status:** implementation and regression tests committed on the focused branch; CI/build verification pending. Do not merge until frontend/shared tests, backend tests, all three frontend builds, and migration validation have been inspected.

## Non-negotiable constraints

- No mock data, auth bypass, or replacing server data with local-only behavior.
- Do not change API contract, query/filter/pagination semantics, route parameters, or state handling as part of visual redesign.
- Browser-smoke debugging is not the next task per owner instruction; do not claim runtime validation passed.
- After Step 2 is verified and merged, move to the next page one at a time.
- Remaining non-UI work: exhaustive company-owned route/tenant/IDOR review; finish SMS event-dispatch integration (provider/worker/quota exist but dispatcher does not queue SMS); controlled live Zarinpal/SMTP verification; endpoint/schema/permission API documentation; Graphify MCP refresh after workspace access is restored.
