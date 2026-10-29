# Current Task — 2026-10-29

## Active handoff: Step 4 — Website Categories page redesign

**Repository:** `gameacc2025/martest`  
**Canonical branch:** `main`  
**Latest merged feature:** Product Details PR #31, merge commit `daf47ff282a2e81162ff0e8e5047337b1973b26e`  
**Next focused branch:** `feat/website-categories-redesign-step-4`.

## Completed UI steps

### Step 1 — Homepage
- PR [#29](https://github.com/gameacc2025/martest/pull/29) merged as `520d590b51b7d4be49772dd44cc3f5dc96f45351`.
- Feature CI [40839895731](https://github.com/gameacc2025/martest/actions/runs/40839895731) and migration [40839895740](https://github.com/gameacc2025/martest/actions/runs/40839895740) passed; post-merge CI/migration also passed.

### Step 2 — Product Listing
- PR [#30](https://github.com/gameacc2025/martest/pull/30) merged as `91c64bb1a43553ecb1214b4a50c1bb0efa5f7ac2`.
- Feature CI [40840764762](https://github.com/gameacc2025/martest/actions/runs/40840764762) and migration [40840764653](https://github.com/gameacc2025/martest/actions/runs/40840764653) passed; post-merge CI [40840922441](https://github.com/gameacc2025/martest/actions/runs/40840922441) and migration [40840922446](https://github.com/gameacc2025/martest/actions/runs/40840922446) passed.

### Step 3 — Product Details
- PR [#31](https://github.com/gameacc2025/martest/pull/31) merged as `daf47ff282a2e81162ff0e8e5047337b1973b26e`.
- Feature CI [40841432392](https://github.com/gameacc2025/martest/actions/runs/40841432392): **PASS** — architecture graph, frontend/shared tests including Product Details component tests, backend tests, Prisma generation, and all three frontend builds.
- Feature migration validation [40841432249](https://github.com/gameacc2025/martest/actions/runs/40841432249): **PASS**.
- Post-merge CI [40841579985](https://github.com/gameacc2025/martest/actions/runs/40841579985): **PASS**.
- Post-merge migration validation [40841579967](https://github.com/gameacc2025/martest/actions/runs/40841579967): **PASS**.
- Runtime/browser smoke is separate and not claimed green; do not debug it as the next task per owner instruction.

## Step 4 scope — Categories

1. Inspect `apps/website/src/pages/public/Categories.vue`, its product store/API, category data shape, navigation/query contracts, and loading/error/empty states.
2. Apply shared design-system styling and accessibility changes only.
3. Preserve `productsStore.getCategories()`, category IDs, `products` route query semantics, and all current states.
4. Add component regression tests for live category loading, empty/error states, and category navigation.
5. Run frontend/shared tests, backend tests, all three production builds and separate migration validation.
6. Update this file, worklog, project context, safe-port guide and quality audit with actual evidence.
7. Do not start another page until checks are inspected.

## Remaining cross-project backlog

- Exhaustive company-owned route/tenant/IDOR review.
- Complete SMS event-dispatch integration; Twilio adapter/worker/quota exist, but dispatcher does not enqueue SMS rows. Live delivery unverified.
- Controlled live Zarinpal and SMTP verification.
- Complete endpoint/schema/permission API documentation.
- Graphify MCP refresh remains blocked until a workspace is available and selected.

## Constraints

No mock data, auth bypass, or local-only replacement for API behavior. Preserve app-context/RBAC and tenant ownership. Browser-smoke debugging is not the next task. Do not claim any check is green without workflow evidence.
