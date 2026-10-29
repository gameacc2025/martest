# Safe adaptation of the Telecom UI redesign patch

## Scope and status

This branch is a **production-safe first slice** of `telecom-ui-redesign.patch`, not a claim that all 32 changed files have been ported. The uploaded patch is based on an older page implementation and contains demo-only data paths. The following visual foundation is adapted here:

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

Do not merge this branch until CI and review confirm that the selected visual changes do not alter production flows.
