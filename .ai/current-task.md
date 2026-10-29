# Current Task — 2026-10-29

## Active handoff: Step 3 — Website Product Details redesign

**Repository:** `gameacc2025/martest`  
**Canonical branch:** `main`  
**Latest merged feature:** Product Listing PR #30, merge commit `91c64bb1a43553ecb1214b4a50c1bb0efa5f7ac2`  
**Next focused branch:** `feat/website-product-details-redesign-step-3` (create only after post-merge CI and migration results for Step 2 are inspected).

## Completed UI steps

### Step 1 — Homepage
- PR [#29](https://github.com/gameacc2025/martest/pull/29) merged as `520d590b51b7d4be49772dd44cc3f5dc96f45351`.
- CI [40839895731](https://github.com/gameacc2025/martest/actions/runs/40839895731) and migration validation [40839895740](https://github.com/gameacc2025/martest/actions/runs/40839895740) passed on final feature-branch commit.
- Post-merge CI and migration validation passed on the merge commit.

### Step 2 — Product Listing
- PR [#30](https://github.com/gameacc2025/martest/pull/30) merged as `91c64bb1a43553ecb1214b4a50c1bb0efa5f7ac2`.
- Feature-branch CI [40840764762](https://github.com/gameacc2025/martest/actions/runs/40840764762): **PASS** — architecture graph validation, frontend/shared tests (including Product Listing component tests), backend tests, Prisma generation, and all three frontend builds.
- Feature-branch migration validation [40840764653](https://github.com/gameacc2025/martest/actions/runs/40840764653): **PASS**.
- Post-merge main CI/migration/runtime workflows have been queued and must be inspected before Step 3 starts.
- Runtime/browser smoke remains separate; per owner instruction, do not debug browser tests as the next task or claim runtime passed.

## Step 3 scope — Product Details

1. Inspect `apps/website/src/pages/public/ProductDetails.vue`, its store/API calls, route parameter handling, image/price rendering, inquiry/cart actions, loading/not-found/error states, and existing tests.
2. Port only safe template/style/accessibility changes from the shared design system.
3. Preserve product API/store contracts, route params, inquiry/cart behavior, permission checks, and every existing state.
4. Add component regression tests for data loading, route IDs, error/not-found states and any keyboard interaction changed.
5. Run CI frontend/shared tests, backend tests and all three frontend production builds; inspect migration validation separately.
6. Update current-task, worklog, project context, redesign guide and quality audit with actual results.
7. Do not begin another page until the current page's checks are inspected.

## Remaining cross-project backlog

- Exhaustive company-owned route/tenant/IDOR review.
- Complete SMS event-dispatch integration; Twilio adapter/worker/quota exist, but dispatcher does not enqueue SMS rows. Live delivery unverified.
- Controlled live Zarinpal and SMTP verification.
- Complete endpoint/schema/permission API documentation.
- Graphify MCP refresh remains blocked until a workspace is available and selected.

## Constraints

No mock data, auth bypass, or local-only replacement for API behavior. Preserve access-context/RBAC and tenant ownership. Browser smoke debugging is not the next task per owner instruction. Never claim checks are green without workflow evidence.
