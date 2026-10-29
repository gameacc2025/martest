# Current Task — 2026-10-29

## Active task: Step 1 — Website homepage redesign

- **Repository:** `gameacc2025/martest`
- **Base:** `main` at `d91b3961e3c775def84d0efe634a4fa82271b9f4`
- **Working branch:** `feat/website-homepage-redesign-step-1`
- **Scope:** homepage visual refinement, keyboard accessibility for category/product tiles, focused source-contract tests, and documentation.
- **Constraints:** preserve API calls, data shape, routes, loading/error/empty states and mutations; no mock data or auth bypass; do not pursue browser-smoke debugging in this step.

## Acceptance criteria

1. Homepage uses the merged shared design system for surface, spacing, typography and responsive behavior.
2. Existing API calls remain `productsApi.list` and `productsStore.getCategories`.
3. Existing `products`, `categories`, `search`, and `product-details` route contracts remain unchanged.
4. Keyboard users can activate category/product tiles.
5. Source-contract regression tests pass.
6. Website production build passes in CI before the page is marked complete.
7. AI memory and redesign/audit docs record actual verification results.

## Current status

**CI tests and all three frontend production builds PASS** on commit `0d33036dfe8480e0b63279ad42b4bf39787e844e` ([run 40839667461](https://github.com/gameacc2025/martest/actions/runs/40839667461)). The new homepage source-contract suite passed as part of frontend/shared tests. Database migration validation and runtime validation are separate workflows and were still pending at the last check. No local test/build execution is claimed; verification is from GitHub Actions.

## Remaining backlog after this step

- Continue the UI port page by page, starting with Product Listing after this step is verified.
- Continue company-owned route/tenant/IDOR review.
- Wire the existing SMS provider/worker/quota path into event dispatch; live Twilio remains unverified.
- Verify live Zarinpal and SMTP with safe staging credentials.
- Complete endpoint/schema/permission API documentation.
- Graphify MCP refresh remains blocked until a workspace is available and selected.
