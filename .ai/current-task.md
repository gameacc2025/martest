# Current Task — 2026-10-29

## Active task: Step 3 — Website Product Details redesign

**Repository:** `gameacc2025/martest`  
**Canonical branch:** `main`  
**Working branch:** `feat/website-product-details-redesign-step-3`  
**Base:** `main` at `bccbe4c30c44fe11d071731ea5f19e0af13b3eca`

## Completed UI steps

### Step 1 — Homepage
- PR [#29](https://github.com/gameacc2025/martest/pull/29) merged as `520d590b51b7d4be49772dd44cc3f5dc96f45351`.
- Feature CI [40839895731](https://github.com/gameacc2025/martest/actions/runs/40839895731) and migration [40839895740](https://github.com/gameacc2025/martest/actions/runs/40839895740) passed.
- Post-merge CI and migration validation passed.

### Step 2 — Product Listing
- PR [#30](https://github.com/gameacc2025/martest/pull/30) merged as `91c64bb1a43553ecb1214b4a50c1bb0efa5f7ac2`.
- Feature CI [40840764762](https://github.com/gameacc2025/martest/actions/runs/40840764762) and migration [40840764653](https://github.com/gameacc2025/martest/actions/runs/40840764653) passed.
- Post-merge CI [40840922441](https://github.com/gameacc2025/martest/actions/runs/40840922441) and migration validation [40840922446](https://github.com/gameacc2025/martest/actions/runs/40840922446) passed.

## Step 3 scope — Product Details

- File: `apps/website/src/pages/public/ProductDetails.vue`.
- Current changes: use shared page/container and design tokens for color/surface/border/shadow/spacing; mark loading/not-found/error and price-history states for assistive technology; expose selected thumbnail state via `aria-pressed`.
- Preserved: `productsStore.getProductById(route.params.id)`, product route-id watcher, image selection, pricing/sorting, company profile navigation, price-history API, inquiry submission, and permission gate `isAuthenticated && hasAnyPermission(['inquiries.create', 'leads.create'])`.
- Tests added: `apps/website/src/pages/public/ProductDetails.test.js` covers route-ID loading, product details/image, not-found/error states, route ID changes, thumbnail selection, and permission-gated inquiry action.
- **Status:** implementation/tests on focused branch; CI/build/migration verification pending. Do not merge until tests, builds, and migration checks are inspected.

## Constraints

- No mock data or auth bypass. Preserve product API/store, route ID, price history, inquiry and company navigation behavior.
- Do not weaken the inquiry permission gate or backend authorization.
- Browser-smoke debugging is not the next task per owner instruction.
- Remaining cross-project work: exhaustive company-owned route/tenant/IDOR review; finish SMS event-dispatch integration; controlled live Zarinpal/SMTP verification; complete endpoint/schema/permission API docs; Graphify MCP refresh when a workspace is available.
