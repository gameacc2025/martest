# Safe adaptation of the Telecom UI redesign patch

## Scope and status

The merged implementation is a **production-safe partial port** of `telecom-ui-redesign.patch`, not a claim that all 32 changed files have been ported. The shared foundation is PR #28; the first page-level slice (Website homepage) is PR #29. The uploaded patch is based on an older page implementation and contains demo-only data paths. The following visual foundation is adapted here:

- shared semantic design tokens for brand surfaces, focus, status labels and touch targets;
- opt-in page layout primitives in `packages/shared-ui/assets/design-system/pages.scss`;
- visual refinement of the existing shared category mega-menu;
- regression tests for menu visibility and category navigation.

## Production behavior deliberately preserved

- Existing page API calls, endpoint contracts and domain behavior are untouched.
- The Website router's `requiresAuth` guard is untouched.
- No `USE_MOCK` switch or `mockData.js` file is added.
- No fake product, company, order, inquiry, notification, account, cart or wishlist data is wired into production pages.
- The mega-menu keeps its existing `categories` prop contract and routes to the existing `products` route with `category` / `subcategory` query parameters.

## Why the patch is not applied wholesale

The source patch introduces `USE_MOCK = true`, replaces API-backed page state with local arrays, and bypasses route authentication when mock mode is enabled. It also changes several large page files against an older version of the repository; blindly applying those replacements would risk losing current API, permissions, and recently merged behavior.

## Follow-up porting plan

Port one page at a time from the current `main` implementation. For each page:
1. retain its current imports, API calls, loading/error states, permissions, route parameters, and mutations;
2. port only template and style changes that can be reconciled with the current data shape;
3. add regression tests for its existing behavior and any changed interaction;
4. run targeted tests and the Website production build before proceeding.

The shared foundation described here has been merged in PR #28. The remaining page-level port must be performed separately; do not assume this initial slice represents the entire 32-file redesign.

## Verification record

- Latest main CI run [40833114382](https://github.com/gameacc2025/martest/actions/runs/40833114382): **PASS** — architecture graph check, frontend/shared tests (including MegaMenu regression tests), backend tests, Prisma client generation, and builds for all three frontend apps.
- Latest database migration validation [40833114529](https://github.com/gameacc2025/martest/actions/runs/40833114529): **PASS**.
- Latest runtime validation [40833114464](https://github.com/gameacc2025/martest/actions/runs/40833114464): **FAIL** at the browser-smoke step. Compose configuration, image build/start, service health endpoints and migration-state checks passed before browser smoke. Per owner instruction, browser tests are not the next debugging task; this workflow must not be described as green.
- No local build/test command was run during this review; the evidence above is from GitHub Actions.
- Graphify MCP review/update is blocked because no workspace is available/selected for this agent. This is distinct from the repository-generated architecture graph, whose CI check passed.

## Merge record

- PR [#28](https://github.com/gameacc2025/martest/pull/28) was squash-merged to `main` as `23576cb1a22f80fea2d245cf10e5915794d4a15c`.
- The safe shared UI foundation is merged; the broader page-by-page redesign remains incomplete.
- Branch cleanup is pending manual deletion because the available GitHub connector actions do not include branch deletion.


## Current follow-up status — 2026-10-29

- Only `main` appeared in the latest remote branch inventory.
- The next port should begin with the current Website homepage and be delivered as a separate focused change. The patch is not complete until the intended page-level visual changes have been reconciled with current API-backed code.
- Treat the latest runtime browser-smoke failure as recorded evidence, not as a passing check. Do not pursue browser-test debugging as the next task under the current owner instruction.


## Step 1 — Website homepage redesign

Branch: `feat/website-homepage-redesign-step-1`

- Updated `apps/website/src/pages/public/Home.vue` to use the merged shared design-system primitives and tokens for page surface, container, sections, hero contrast, typography and responsive spacing.
- Added keyboard activation and focus visibility for category/product tiles.
- Preserved the current `productsApi.list` and `productsStore.getCategories` data flow, existing named routes, filters, loading/error/empty states, and cart store wiring.
- Added Website Vitest script and focused source-contract tests for API/route/state/accessibility invariants.
- No backend, API contract, authentication guard, authorization policy, or mock-data behavior changed.
- **Status:** CI test and production-build verification **PASS** on commit `0d33036dfe8480e0b63279ad42b4bf39787e844e` (run [40839667461](https://github.com/gameacc2025/martest/actions/runs/40839667461)). The source-contract test file passed with the full frontend/shared suite; backend tests and all three frontend production builds also passed. Database migration validation is still running at the time of this update. Runtime validation remains separate; browser smoke is not being debugged in this step. Source-contract tests are not a substitute for component interaction tests.


## Step 1 completion — Website homepage (2026-10-29)

- PR [#29](https://github.com/gameacc2025/martest/pull/29) merged as `520d590b51b7d4be49772dd44cc3f5dc96f45351`.
- Feature-branch CI [40839895731](https://github.com/gameacc2025/martest/actions/runs/40839895731) passed: architecture graph, frontend/shared tests including homepage source-contract tests, backend tests, Prisma generation, and Website/Company/Admin production builds.
- Feature-branch migration validation [40839895740](https://github.com/gameacc2025/martest/actions/runs/40839895740) passed.
- The source-contract test initially failed due to Vitest's transformed `import.meta.url`; the test now searches both root-relative and app-relative paths and passed in the final CI run.
- The homepage keeps its existing API/store data flow, routes, filter semantics and loading/error/empty states. Keyboard activation and focus visibility were added to category/product tiles.
- Post-merge workflows on `main` are separate and must be inspected before the next page starts. Runtime/browser smoke is not claimed green and is not the next debugging task.
- **Next page:** `apps/website/src/pages/public/ProductListing.vue`, one focused branch/PR at a time.


## Step 2 — Product Listing (in progress, 2026-10-29)

- Branch: `feat/website-product-listing-redesign-step-2`.
- Updated page header, filter card, product grid, price badge, pagination surface, accessible filter labels and product-tile keyboard interaction.
- Preserved store/API calls, category query initialization and watcher, filter/pagination parameters, and the existing product-details route.
- Added component tests for API params, route query updates, keyboard navigation, error and empty states.
- **Verification pending:** do not mark this step complete or merge until CI tests and all frontend builds pass; inspect database migration validation separately.


## Step 2 completion — Website Product Listing (2026-10-29)

- PR [#30](https://github.com/gameacc2025/martest/pull/30) merged as `91c64bb1a43553ecb1214b4a50c1bb0efa5f7ac2`.
- Feature-branch CI [40840764762](https://github.com/gameacc2025/martest/actions/runs/40840764762) passed architecture graph, frontend/shared tests including Product Listing component tests, backend tests, Prisma generation and all three frontend builds.
- Feature-branch migration validation [40840764653](https://github.com/gameacc2025/martest/actions/runs/40840764653) passed.
- Product Listing preserves the existing store/API contract, category query initialization/watch, filters, pagination and product-details route. Keyboard activation/focus and accessible state semantics were added.
- Post-merge main workflows are separate and must be inspected before Step 3 starts.
- **Next page:** `apps/website/src/pages/public/ProductDetails.vue`.


## Step 3 — Product Details (in progress, 2026-10-29)

- Branch: `feat/website-product-details-redesign-step-3`.
- Shared design tokens are being applied to the page shell and existing product surfaces; loading/not-found/error and price-history states expose accessible roles; selected gallery thumbnail exposes `aria-pressed`.
- Existing product store/API, route ID watcher, image/price logic, company profile navigation, price-history API, inquiry submission and permission gate are preserved.
- Component regression tests cover route IDs, render, not-found/error, thumbnail selection and permission-gated inquiry.
- **Verification pending:** do not mark complete or merge until CI tests/builds and migration validation are inspected.


## Step 3 completion — Website Product Details (2026-10-29)

- PR [#31](https://github.com/gameacc2025/martest/pull/31) merged as `daf47ff282a2e81162ff0e8e5047337b1973b26e`.
- Feature CI [40841432392](https://github.com/gameacc2025/martest/actions/runs/40841432392) and migration [40841432249](https://github.com/gameacc2025/martest/actions/runs/40841432249) passed. Post-merge CI [40841579985](https://github.com/gameacc2025/martest/actions/runs/40841579985) and migration [40841579967](https://github.com/gameacc2025/martest/actions/runs/40841579967) passed.
- Product Details now consumes shared design tokens for page/surface/text/border/shadow/spacing. Accessible state roles and thumbnail `aria-pressed` were added.
- Existing product route ID, image selection, price tier logic, company route, price-history API and permission-gated inquiry behavior were preserved.
- **Next page:** `apps/website/src/pages/public/Categories.vue`.


## Step 4 — Categories (in progress, 2026-10-29)

- Branch: `feat/website-categories-redesign-step-4`.
- Added shared design-system page/header/container/surface styling, responsive category grid, accessible loading/error states and explicit empty state.
- Preserved category store call/data contract and existing products route query.
- Added component regression tests for loading/render, category navigation, empty and error states.
- **Verification pending:** do not merge until CI tests/builds and migration validation are inspected.


## Step 4 completion — Website Categories (2026-10-29)

- PR [#32](https://github.com/gameacc2025/martest/pull/32) merged as `50745aa1c83bfb01fe6a7db5cb87c8f33af7b178`.
- Feature CI [40842352640](https://github.com/gameacc2025/martest/actions/runs/40842352640), migration [40842352602](https://github.com/gameacc2025/martest/actions/runs/40842352602), post-merge CI [40842534524](https://github.com/gameacc2025/martest/actions/runs/40842534524), and post-merge migration [40842534511](https://github.com/gameacc2025/martest/actions/runs/40842534511) passed.
- The page uses shared design tokens, a responsive category grid and accessible loading/error/empty states. Existing category store and products route/query are preserved.
- The first test run exposed missing slot rendering in shallow-mount stubs; explicit component stubs fixed the test setup and the corrected tests passed.
- **Next page:** `apps/website/src/pages/public/SearchResults.vue`.


## Step 5 — Website Search Results (2026-10-29)

- **Branch:** `feat/website-search-results-redesign-step-5`.
- **Files:** `apps/website/src/pages/public/SearchResults.vue` and new `apps/website/src/pages/public/SearchResults.test.js`.
- **Changes:** Adopted shared `ds-*` tokens/primitives for the page shell, headings and surfaces; improved responsive filter/results layout; added accessible search/controls, loading/error/empty states and retry action.
- **Behavior preserved:** Existing `productsStore.searchProducts(query, params)` contract, query route watcher/URL synchronization, category and price filter parameters, sorting/pagination, cart/wishlist handlers and product-details navigation.
- **Tests:** Added regression coverage for query-to-API behavior, result rendering/normalization, empty/error/retry states, route query changes and product navigation.
- **Status:** Awaiting feature CI and database migration validation. Do not merge or mark complete until checks are inspected.


## Step 5 completion — Website Search Results (2026-10-29)

- PR [#33](https://github.com/gameacc2025/martest/pull/33) merged as `1c58e2c2b01bbfdfe2e4b938e91b9199945ecc25`.
- Feature CI [40880947037](https://github.com/gameacc2025/martest/actions/runs/40880947037) passed frontend/shared tests, backend tests, Prisma generation, architecture graph check, and all three frontend production builds.
- Feature database migration validation [40880947043](https://github.com/gameacc2025/martest/actions/runs/40880947043) passed.
- Search query/store API contract, route query synchronization, filters, sort/pagination, cart/wishlist handlers and product-details navigation were preserved. Regression tests cover query/API behavior, result rendering/normalization, empty/error/retry states, route query updates and product navigation.
- Post-merge CI [40881378521](https://github.com/gameacc2025/martest/actions/runs/40881378521) and migration validation [40881378435](https://github.com/gameacc2025/martest/actions/runs/40881378435) passed. Runtime validation [40881262762](https://github.com/gameacc2025/martest/actions/runs/40881262762) failed at browser smoke after Compose/build/start, service health, and migration checks passed. Per owner instruction, browser smoke is not the next debugging task.


### Step 5 verification correction — 2026-10-29

The final post-merge checks supersede any earlier “pending” status above: CI run [40881378521](https://github.com/gameacc2025/martest/actions/runs/40881378521) and migration validation [40881378435](https://github.com/gameacc2025/martest/actions/runs/40881378435) both passed on main. Runtime validation [40881262762](https://github.com/gameacc2025/martest/actions/runs/40881262762) failed at the browser-smoke step after infrastructure and migration checks passed. Do not report the runtime workflow as green.


## Step 6 — Website About Us (2026-10-29)

- **Branch:** `feat/website-about-us-redesign-step-6`.
- **Files:** `apps/website/src/pages/public/AboutUs.vue` and new `apps/website/src/pages/public/AboutUs.test.js`.
- **Changes:** Uses shared design-system tokens, responsive mission/value/how-it-works sections, and an API-backed published-products section with accessible loading/error/empty states.
- **Content integrity:** Removed unverified hardcoded statistics, fictional team-member details, and partner claims rather than replacing them with another mock dataset.
- **Behavior preserved:** Existing `productsApi.list({ page: 1, limit: 6, status: 'PUBLISHED' })` request and product-details route.
- **Tests:** Cover API contract/product rendering, absence of demo content, empty/error/retry behavior and product navigation.
- **Status:** Feature CI and migration validation pending; do not merge until they pass.
