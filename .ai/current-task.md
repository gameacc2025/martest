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

1. Validation PR #16 merged as `90a8f36be5c4281c999515206b099b894d2da75d`. CI `40629289205` and PostgreSQL migration validation `40629289194` passed.
2. Current follow-up branch `fix/notification-app-scope-20261028` closes a notification authorization gap: clients could submit `app=ADMIN` to folder endpoints regardless of their authenticated app context. The controller now derives scope from verified `request.user.accessType` (`STAFF` → `ADMIN`, `COMPANY` → `COMPANY`, `CUSTOMER` → `WEBSITE`), validates folder IDs against that scope, and fails closed when context is unknown.
3. Added controller regression tests for forged app scopes, cross-app folder IDs, and scope mapping; added service tests for inactive source folders and cross-scope destinations. Notification docs now list the folder/bulk endpoints and the app-scope contract.
4. Run CI and migration validation for this security follow-up; fix failures and merge after green CI/database checks. Browser E2E remains non-blocking per owner instruction and is not claimed passed.
5. Continue quality-audit items after this fix: inquiry permission/quota/response decision coverage, docs/source alignment, and bundle-size warning review. SMTP is NOT VERIFIED without live credentials and a test recipient; SMS is NOT IMPLEMENTED.

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
