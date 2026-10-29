# Current Task — 2026-10-29

## Active handoff: Step 5 — Website Search Results redesign

**Repository:** `gameacc2025/martest`  
**Canonical branch:** `main`  
**Latest merged feature:** Categories PR #32, merge commit `50745aa1c83bfb01fe6a7db5cb87c8f33af7b178`  
**Next focused branch:** `feat/website-search-results-redesign-step-5`.

## Completed UI steps

- **Step 1 Homepage:** PR #29 merged; feature CI/migration and post-merge checks passed.
- **Step 2 Product Listing:** PR #30 merged; feature CI/migration and post-merge checks passed.
- **Step 3 Product Details:** PR #31 merged; feature CI [40841432392](https://github.com/gameacc2025/martest/actions/runs/40841432392), migration [40841432249](https://github.com/gameacc2025/martest/actions/runs/40841432249), post-merge CI [40841579985](https://github.com/gameacc2025/martest/actions/runs/40841579985), and post-merge migration [40841579967](https://github.com/gameacc2025/martest/actions/runs/40841579967) passed.
- **Step 4 Categories:** PR #32 merged as `50745aa1c83bfb01fe6a7db5cb87c8f33af7b178`. Feature CI [40842352640](https://github.com/gameacc2025/martest/actions/runs/40842352640) and migration [40842352602](https://github.com/gameacc2025/martest/actions/runs/40842352602) passed. The first test run failed because shallow-mounted Card stubs did not render named slots; explicit slot/button stubs were added and the corrected tests passed. Post-merge CI [40842534524](https://github.com/gameacc2025/martest/actions/runs/40842534524) and migration [40842534511](https://github.com/gameacc2025/martest/actions/runs/40842534511) passed.

## Step 5 scope — Search Results

1. Inspect `apps/website/src/pages/public/SearchResults.vue`, search API/store calls, query parsing, loading/error/empty states, and navigation.
2. Apply shared design-system styling and accessibility changes only.
3. Preserve search query semantics, API parameters, product-detail route, and current state behavior.
4. Add component regression tests for query-to-API behavior, result rendering, empty/error states, and product navigation.
5. Run frontend/shared tests, backend tests, all three frontend builds and migration validation.
6. Update AI memory, worklog, redesign guide and quality audit with actual evidence.
7. Do not begin another page until checks are inspected.

## Remaining cross-project backlog

- Exhaustive company-owned route/tenant/IDOR review.
- Complete SMS event-dispatch integration; Twilio adapter/worker/quota exist, but dispatcher does not enqueue SMS rows. Live delivery unverified.
- Controlled live Zarinpal and SMTP verification.
- Complete endpoint/schema/permission API documentation.
- Graphify MCP refresh remains blocked until a workspace is available and selected.

## Constraints

No mock data, auth bypass, or local-only replacement for API behavior. Preserve app-context/RBAC and tenant ownership. Browser-smoke debugging is not the next task. Do not claim checks green without workflow evidence.
