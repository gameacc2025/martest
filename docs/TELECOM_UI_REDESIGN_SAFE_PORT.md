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

The shared foundation described here has been merged in PR #28. The remaining page-level port must be performed separately; do not assume this initial slice represents the entire 32-file redesign.

## Verification record

- GitHub Actions CI run [40832326705](https://github.com/gameacc2025/martest/actions/runs/40832326705): **PASS** — architecture graph check, frontend/shared tests (including the new MegaMenu tests), backend tests, Prisma client generation, and builds for all three frontend apps.
- Database migration validation run [40832326749](https://github.com/gameacc2025/martest/actions/runs/40832326749): **PASS**.
- Runtime validation run [40832326683](https://github.com/gameacc2025/martest/actions/runs/40832326683): still running when recorded; not claimed passed. Browser smoke-test outcome is not verified here.
- No local build/test command was run in this session; verification above is from the actual GitHub Actions runs.

## Merge record

- PR [#28](https://github.com/gameacc2025/martest/pull/28) was squash-merged to `main` as `23576cb1a22f80fea2d245cf10e5915794d4a15c`.
- The safe shared UI foundation is merged; the broader page-by-page redesign remains incomplete.
- Branch cleanup is pending manual deletion because the available GitHub connector actions do not include branch deletion.
