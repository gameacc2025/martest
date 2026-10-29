# Current Task — 2026-10-29

## Active handoff: Step 2 — Website Product Listing redesign

**Repository:** `gameacc2025/martest`  
**Canonical branch:** `main`  
**Latest merged feature:** PR #29, merge commit `520d590b51b7d4be49772dd44cc3f5dc96f45351`  
**Next focused branch:** `feat/website-product-listing-redesign-step-2` (create from main only after current main CI/migration validation is inspected).

## Step 1 completed — Website homepage

PR [#29](https://github.com/gameacc2025/martest/pull/29) is merged. It applies shared design-system styling and keyboard activation/focus treatment to homepage category/product tiles without changing API, routes, or data flow.

- CI run [40839895731](https://github.com/gameacc2025/martest/actions/runs/40839895731): **PASS** on branch commit `e5d82f833e0d069b687b99b8436db85d9fe74554`. Architecture graph validation, frontend/shared tests (including the new homepage source-contract tests), backend tests, Prisma generation, and all three frontend builds passed.
- Database migration validation [40839895740](https://github.com/gameacc2025/martest/actions/runs/40839895740): **PASS** on the same branch commit.
- The merged main commit triggered new CI, migration, and runtime workflows. Inspect the main-commit CI and migration results before beginning Step 2.
- Runtime/browser smoke is a separate check. Per owner instruction, do not spend the next task debugging browser tests and do not claim runtime validation passed.
- No local test/build commands were run; verification evidence is from GitHub Actions.

## Step 2 scope — Product Listing page

1. Inspect `apps/website/src/pages/public/ProductListing.vue`, its API/store contract, route/query behavior, loading/error/empty states, pagination, and filter semantics.
2. Apply only safe template/style/accessibility changes from the shared design system.
3. Preserve API calls, permissions, route params/query, loading/error/empty states, and all existing mutations.
4. Add focused regression tests for API/route/state/filter contracts and any keyboard interaction changed.
5. Run frontend/shared tests, backend tests, and all three frontend production builds via CI; inspect migration validation as a separate workflow.
6. Update this file, `.ai/WORKLOG.md`, `.ai/project-context.md`, the quality audit, and `docs/TELECOM_UI_REDESIGN_SAFE_PORT.md` with actual results.
7. Do not begin another page until Step 2 checks are inspected.

## Non-negotiable constraints

- No `USE_MOCK`, demo fixtures in production flows, authentication bypasses, or local-only behavior replacing real APIs.
- Preserve app-context and RBAC boundaries, tenant/ownership checks, and inquiry/payment/quota invariants.
- Do not claim tests/builds/live providers/production readiness are verified unless the relevant evidence exists.
- Graphify MCP refresh remains blocked until a workspace is available and selected; repository architecture graph CI is a separate check.
- Remaining backlog after UI slices: exhaustive company-owned route/tenant/IDOR review; wire existing SMS provider/worker/quota into event dispatch; controlled live Zarinpal and SMTP verification; complete endpoint/schema/permission API documentation.
