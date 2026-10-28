# Current Task / Agent Handoff

Updated: 2026-10-28

## User direction

The owner authorized fixing the remaining issues, merging safe work into `main`, writing regression tests without waiting for live browser execution, proceeding through the remaining work, and keeping all relevant docs and AI handoff files updated.

## Completed on main in this continuation

- PR #14 was squash-merged into `main` as `92501f206ab16b163d8d4605e685cbe3396dd2aa`. It adds Docker runtime validation and Playwright smoke tests. The browser step was not awaited and must not be reported as passed.
- Runtime validation on the PR head observed successful Compose config validation, Docker build/start, all service health endpoints, and Prisma migration status. CI run `40555574784` and migration run `40555574786` passed on that PR head.
- Strict security context: removed the SUPER_ADMIN cross-app bypass from auth login, generic `requireAccessType`, and PKCE handoff. Customer registrations intentionally have no AccessProfile; only `CUSTOMER_USER` can use the default Website context, and that fallback does not permit Admin/Company or SUPER_ADMIN.
- Added regression tests for auth login/RBAC/handoff and customer default Website context.
- Ported the customer Address feature selectively: Prisma model and migration `20261027200000_customer_addresses`, API route/controller/service, ownership/default-address tests, shared API endpoints, Website page and routes, profile/menu links.
- Fixed address default invariants: a customer cannot end up without a default when an address exists; ownership remains scoped by authenticated user.
- Fixed the customer profile contract: `GET /auth/me` response is mapped from `user` + `profile` + `accessProfile`; profile update sends only backend-supported first/last name fields; password change excludes confirmation from API payload and validates it client-side; errors are visible.
- Fixed auth-store profile normalization so `/settings/profile` response stores only the nested personal profile instead of the full user object. Added a store regression test.
- Added `jti` to refresh JWTs and a uniqueness regression test to prevent identical refresh tokens issued in the same second.
- Extracted the six-month price-history transformation into `apps/website/src/utils/priceHistory.js` and added Vitest coverage for date filtering, ordering, widths, and invalid records. Backend price snapshot/API/service tests already exist.
- Added payment callback replay and verified-retry idempotency tests. Provider verification remains server-side; do not mark live payment as verified without credentials/staging.
- Enforced frozen AD-4: Cart / Checkout / Orders / Wishlist remain dormant future B2C pages. Their routes and active product/profile controls were removed; files remain for future development.
- Added Rolldown vendor chunk splitting and architecture graph generation/check scripts.
- Fixed the backend Docker runtime image to include Prisma CLI and OpenSSL so startup migrations do not rely on an implicit `npx` download.
- Updated API/database/frontend/Docker/architecture/security docs, `.ai/project-context.md`, `.ai/decisions.md`, this task file, worklog and quality audit.

## Immediate remaining work

1. PR #16 merged as `90a8f36be5c4281c999515206b099b894d2da75d`; CI `40629289205` and PostgreSQL migration validation `40629289194` passed.
2. PR #17 merged as `6c936fbf89b62febdf8122ac854fb53d93049ed4`; CI `40630173240` and migration validation `40630173261` passed. Notification folder scope is derived from verified `request.user.accessType`, and cross-app folders/unknown contexts are rejected.
3. PR #18 merged as `fd6515426d7cc5d6ed1c7d02589c46e940e35fde`; CI `40630881073` and migration validation `40630881119` passed. Frontends and endpoint helper no longer send client-selected app scope; the backend schema no longer requires it.
4. PR #19 merged as `695b61861b39f840eefa24660541d4d61143943d`; CI `40631325212` and migration validation `40631325206` passed. Backend now enforces one pending subscription per owner regardless of plan; tests cover duplicate-different-plan and first valid request.
5. Continue source review of inquiry response decisions, access/ownership checks, quota transaction semantics and payment callback idempotency; then resolve source/doc conflicts and review the Admin bundle warning. Browser E2E is non-blocking per owner instruction and is not claimed passed.
6. SMTP is NOT VERIFIED without live credentials and a test recipient. SMS is NOT IMPLEMENTED.

## Branch/PR handling

- PR #14 merged as `92501f206ab16b163d8d4605e685cbe3396dd2aa`.
- PR #16 merged as `90a8f36be5c4281c999515206b099b894d2da75d`.
- PR #9, PR #11 and superseded validation PR #15 are closed.
- Remaining remote branches include legacy/feature branches. Do not blindly merge divergent branches without comparing them with main and checking for unique work. The GitHub connector does not expose a branch-delete action; do not claim remote branches were deleted.

## Security and architecture contract

- `AccessProfile.type` is the strict Admin/Company boundary: STAFF → Admin, COMPANY → Company Portal.
- Customer registration intentionally has no AccessProfile; `CUSTOMER_USER` may access only the default Website/CUSTOMER context. This fallback cannot grant STAFF/COMPANY access and cannot be used by SUPER_ADMIN.
- Role/permission wildcard does not override app context or resource ownership. Ownership remains enforced in backend services.
- Product price history uses persisted snapshots; never fabricate history for periods with no data.
- Inquiry permissions, subscription quotas, response decisions, and payment callbacks must be checked in backend services as well as UI.
- B2C Cart / Checkout / Orders / Wishlist remain disabled per AD-4 until the owner explicitly changes the architecture decision.

## Verification discipline

- Distinguish backend unit tests, frontend Vitest tests, Prisma migration validation, Docker runtime checks, browser E2E, and live third-party integration tests.
- Browser E2E tests remain committed; their live completion is not a blocker per owner instruction.
- Never label a test as passed unless a completed run or local result is actually observed.


## Current stage — inquiry response concurrency hardening (2026-10-28)

- **Branch:** `fix/inquiry-response-concurrency-20261028`.
- **Finding:** Supplier response submission could race buyer selection/closure: both transactions could read OPEN, then a new pending response might commit after the buyer closed the RFQ.
- **Code:** Added a shared parent-row lock helper using `SELECT id FROM "Inquiry" WHERE id = $1 FOR UPDATE` inside transactions. Applied it before reading status in response submit/edit/withdraw/decision paths and manual inquiry status transitions.
- **Tests:** Inquiry service test mock records raw queries; regression assertions require the parent inquiry lock for successful response submission and buyer selection.
- **Docs:** API documentation, quality audit, worklog, project context and decision notes are updated for this invariant.
- **Validation:** Do not mark the stage complete until CI and fresh PostgreSQL migration validation finish. Browser E2E is intentionally non-blocking and must not be chased or claimed passed.
- **Branch policy:** Never merge legacy branches wholesale when they are heavily diverged. Port useful work to a fresh branch from current main, validate code/tests, then merge that PR; close/leave stale branch references as appropriate.


## Closure — inquiry response concurrency hardening (2026-10-28)

- **Status:** COMPLETE — PR #20 squash-merged into `main` as `afe468c62d674ec675e4d7e9264e4850403fdb21`.
- **CI:** Run [40633476868](https://github.com/gameacc2025/martest/actions/runs/40633476868) passed architecture graph validation, frontend/shared tests, backend tests, Prisma generation and all three production builds.
- **Database:** Fresh PostgreSQL migration validation [40633476941](https://github.com/gameacc2025/martest/actions/runs/40633476941) passed. This PR introduces no schema changes.
- **Fix:** Response submission, editing, withdrawal, buyer decision and manual status transitions lock the parent Inquiry row before reading its state inside the transaction.
- **Regression tests:** Successful response submission and buyer selection assert that the parent-row `FOR UPDATE` lock is issued.
- **Browser E2E:** Intentionally not awaited per owner instruction. No browser pass is claimed.
- **Next active stage:** Review Admin production bundle warning and confirm chunk splitting is effective; then continue source-level audit of quota usage/idempotency and payment callback edge cases. Keep tests and docs/AI files current and merge safe fixes after CI + migration validation.


## Current stage — Admin bundle warning cleanup (2026-10-28)

- **Branch:** `perf/admin-auth-import-warning-20261028`.
- **Evidence from CI run 40633476868:** production builds passed; current split chunks shown in logs are below the previous ~730 kB Admin entry chunk, with the largest displayed JS chunk ~196 kB. Do not report a specific performance improvement beyond these observed artifact sizes.
- **Finding:** `INEFFECTIVE_DYNAMIC_IMPORT` was emitted because `apps/admin/src/router/index.js` dynamically imported `src/stores/auth.js` even though the store was statically imported by app layouts/pages and main.
- **Fix:** Import `useAuthStore` statically in the router and call it inside the route callbacks. Route page components remain lazy-loaded.
- **Docs:** Updated frontend documentation, quality audit and AI handoff/context/worklog.
- **Validation:** Wait for CI build/tests. Browser E2E is not a blocker per owner instruction.
