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

1. Validation PR #16 (`validate-current-main-final-20261027`) is open from the latest main snapshot and runs CI + Prisma migration validation. The previous snapshot passed both, but the latest notification tests still need their own completed CI result.
2. Fix any CI failures surfaced by PR #16, then merge it. Do not wait for the Playwright runtime/browser step; the user explicitly instructed not to chase it, and no browser pass is claimed.
3. Review notification folder/read-state regression tests and confirm docs match the current implementation.
4. Verify architecture graph with `pnpm architecture:check` in CI; fix the generated graph if stale.
5. Keep SMTP status as NOT VERIFIED without live credentials and a test recipient. SMS is NOT IMPLEMENTED. Do not report third-party delivery as successful based only on unit tests.

## Branch/PR handling

- PR #14 is merged.
- PR #9, PR #11, and superseded validation PR #15 are closed.
- Final validation PR #16 is open from the latest main snapshot. Their useful code was ported to current main: customer addresses, profile contract fix, refresh-token uniqueness, architecture graph, Vite chunk splitting and Docker runtime hardening.
- No stale branch was force-merged. The connected GitHub actions do not expose branch deletion; do not claim remote branches were deleted.

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
