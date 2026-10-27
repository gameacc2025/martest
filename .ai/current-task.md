# Current Task / Agent Handoff

Updated: 2026-10-27

## Current status

The user authorized fixing the remaining repository issues, merging safe branches into `main`, keeping automated tests in the repository without waiting for browser execution, and continuously updating documentation and AI handoff files.

### Completed in this continuation

- PR #14 merged into `main` as commit `92501f206ab16b163d8d4605e685cbe3396dd2aa`.
- Added Docker runtime validation and Playwright smoke tests for all three panels, protected API proxy reachability, responsive initial rendering, and STAFF login → Admin handoff → logout.
- Configured `VITE_COMPANY_APP_URL` and `VITE_ADMIN_APP_URL` as build-time Vite arguments across the three Dockerfiles and Compose.
- On the PR branch, CI run `40555574784` and fresh PostgreSQL migration run `40555574786` completed successfully. Runtime run `40555575064` passed Compose config, image build/start, service health endpoints, and migration status. The Playwright browser step was still in progress at last observation and is intentionally not a blocker per the user.
- Removed the global `SUPER_ADMIN` app-context bypass from login, `requireAccessType`, and PKCE handoff. Added/updated unit tests for login and RBAC and added `backend/src/modules/auth/handoff.service.test.js`.
- Updated `docs/role-access-matrix.md`, `docs/ARCHITECTURE_DECISIONS.md`, and `.ai/decisions.md` to record the strict AccessProfile context rule.

## Remaining work — continue without asking for routine approval

1. Verify/fix CI regressions from strict auth-context enforcement; keep tests aligned with the rule that `AccessProfile.type` is the app boundary.
2. Port useful customer-address/dashboard changes selectively from PR #9 / PR #11 onto current `main`. Do not merge their old base wholesale: PR #9 became non-mergeable after new main commits, and PR #11 is based on `docs-runtime-e2e-hardening`, not `main`.
3. Audit the existing product price-history snapshot/API/tests and the product → inquiry → supplier quote → buyer decision flow. Fix missing behavior and add backend/API/UI regression tests where implementation is incomplete.
4. Review wishlist state and its documented disabled/future-B2C status. Do not reactivate cart/checkout/orders/wishlist UI against the frozen architecture decision without a clear existing implementation contract.
5. Verify inquiry monetization subscription/payment callback replay/idempotency/retry paths from code and tests. Clearly document integrations that cannot be verified without staging credentials.
6. Verify notification inbox regression tests and current CI coverage; preserve folder/read-state semantics already recorded in `.ai/decisions.md`.
7. Update the relevant API, database, frontend, Docker, role-access, quality-audit and agent documents for every behavior/schema/test change. Append facts to `.ai/WORKLOG.md`; keep this file accurate.
8. Capture the Admin bundle warning as a tracked performance item only after tracing current Vite/Rolldown output; avoid speculative chunking changes.

## Branch/PR handling

- PR #14 is merged.
- PR #9 remains open but is no longer mergeable against current main. It contains useful address, token, architecture-graph and code-splitting changes, but its diff must be ported selectively to avoid reverting current docs/Docker/security work.
- PR #11 is based on PR #9's branch. Port its customer profile change only after checking API contract and missing order-domain dependencies; do not claim order history/statistics are implemented because no order backend module exists.
- The connected GitHub actions currently available here do not expose branch deletion. Do not claim stale branches were deleted.

## Security contract

- `AccessProfile.type` selects the application context: STAFF → Admin, COMPANY → Company Portal, CUSTOMER → Website.
- `SUPER_ADMIN` wildcard permission does not bypass app-context checks. Cross-app role membership is not a grant of access to another panel.
- Keep resource ownership checks in services in addition to route guards.
- SMTP delivery cannot be certified without live credentials and a test recipient. SMS is not implemented; keep it documented as such rather than reporting delivery success.

## Verification discipline

- Distinguish unit/CI pass, Prisma migration pass, Docker runtime pass, browser E2E pass, and live third-party integration checks.
- Browser E2E tests remain committed, but do not wait for their live execution as a blocker for continuing work.
- Never label a test as passed unless a completed run or local result is actually observed.
