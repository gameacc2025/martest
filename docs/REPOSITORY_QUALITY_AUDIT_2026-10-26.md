# Repository Quality Audit — 2026-10-26

## Status

**IN PROGRESS — source review and CI evidence collected; this is not a release sign-off.**

Repository: `gameacc2025/martest`  
Branch: `main`  
Audited HEAD at start: `1dd1434d1c78b4a0fb0e51cd5695b6653f1d4e35`

## Evidence checked

- GitHub Actions CI run [40309510309](https://github.com/gameacc2025/martest/actions/runs/40309510309) completed successfully on the audited HEAD.
- CI steps completed: pnpm frozen-lockfile install, frontend/shared tests, backend dependency install, Prisma client generation, backend tests, and production builds for Website, Company, and Admin.
- Repository tree contains 1,230 paths, 78 files matching test/spec filename patterns, 8 Prisma SQL migrations, and 10 files under `docs/`.
- Reviewed root README, workspace/package manifests, CI workflow, current task handoff, project context, notification contract, role-access matrix, API/Frontend/Database/Docker docs, Docker Compose manifests, frontend Dockerfiles, backend Dockerfile, Prisma schema, and key product/notification route registration.
- No local checkout or live deployment/browser/SMTP/database environment was available in this review. Those checks are NOT VERIFIED.

## Findings

### P1 — Documentation materially diverges from current implementation

1. `docs/DOCKER_DEPLOYMENT.md` still describes a Next.js frontend, `frontend/Dockerfile`, Node 18 images and old port/layout assumptions. Actual deployment uses three Vue/Vite apps under `apps/website`, `apps/company`, and `apps/admin`, served by nginx; current production Compose maps them to host ports 3001, 3002 and 3003, with backend on 3000. The actual backend Dockerfile uses Node 22 and runs `prisma migrate deploy`, seed, then the server.
2. `docs/README.md` still describes Next.js, PostgreSQL 16, Prisma 5, Tailwind and a single frontend, which conflicts with current manifests and root README (Vue 3, Vite, PrimeVue, Prisma 6, PostgreSQL 18 image, three frontends).
3. `docs/FRONTEND_DOCUMENTATION.md` contains the obsolete `frontend/src/` layout and references pages/stores not matching the current monorepo paths.
4. `docs/API_DOCUMENTATION.md` documents base URLs ending in `/api`, legacy `/api/auth` paths, old role names such as `COMPANY_ADMIN`, and a flattened user response shape. Current code registers the API under `/api/v1` and uses distinct `user`, `profile`, and `accessProfile` contexts. This document must be reconciled against registered routes and schemas, not patched by blanket path replacement.
5. `docs/DATABASE_DOCUMENTATION.md` has an old model overview that omits current models such as `AccessProfile`, `ProductPriceSnapshot`, inquiry response entities, and notification entities. It must be compared with `backend/prisma/schema.prisma` and migrations.

### P1 — Access matrix needs reconciliation

`docs/role-access-matrix.md` says SUPER_ADMIN bypasses app-type checks and lists roles as the primary app boundary. The current project context says app selection is driven by `accessProfile.type` (STAFF / COMPANY / CUSTOMER), while roles grant permissions within that context. Reconcile this document against the current auth service, frontend router guards, central RBAC middleware, and seed data. Do not change authorization behavior without a separate security plan and tests.

### P1 — Production bundle warnings

The latest successful CI build emits a warning that the Admin entry bundle is larger than 500 kB after minification (the observed main JS chunk is approximately 730 kB), plus an ineffective dynamic import warning for `src/stores/auth.js`. These do not fail CI but should be tracked as performance improvements. Avoid changing code-splitting until route/store import dependencies are inspected and a baseline is captured.

### P1 — Migration and external integration checks remain operationally unverified

The latest CI generates the Prisma client but does not start PostgreSQL or apply all migrations against a real database. The newly added `ProductPriceSnapshot` migration must be applied in a configured environment before using the feature in deployment. SMTP delivery is not verified without valid SMTP configuration; SMS remains not implemented per current handoff.

### P2 — Deployment and runtime validation gap

CI builds all three frontends and runs automated tests, but the reviewed workflow does not build or start Docker images/Compose services, exercise real HTTP journeys against PostgreSQL, or run browser end-to-end tests. These checks should be added or run in a configured environment before release.

### P2 — Architecture/dependency graph is not yet validated as a generated artifact

The repository has architecture diagrams embedded in prose documents, but this audit has not found a clearly canonical generated dependency graph with a reproducible generation/validation command. Confirm whether a graph artifact is expected; if so, establish one source of truth and verify it against workspace dependencies and runtime imports rather than maintaining a manually stale picture.

## Verification matrix

| Area | Status | Evidence / next action |
|---|---|---|
| Frontend/shared automated tests | PASS in CI | Current workflow completed successfully; obtain exact suite counts from CI output if needed |
| Backend automated tests | PASS in CI | Current workflow completed successfully |
| Website/Company/Admin production builds | PASS with warnings | Admin bundle-size and ineffective dynamic-import warnings need triage |
| Prisma client generation | PASS in CI | Does not prove migrations apply to a live database |
| Full migration application against PostgreSQL | NOT VERIFIED | Run in disposable PostgreSQL test environment |
| Docker image build and Compose startup | NOT VERIFIED | Build all four images and smoke-test health/readiness and proxy paths |
| Browser workflows across all three apps | NOT VERIFIED | Exercise auth, products, inquiry, notification folders/read state, RBAC and mobile layout |
| Company data isolation / IDOR | NOT SIGNED OFF | Trace and test each company-owned read/write service and route |
| SMTP delivery | NOT VERIFIED | Send a controlled test in a configured environment |
| SMS delivery | NOT IMPLEMENTED | Keep out of release acceptance unless separately scoped |
| API, database, frontend and deployment docs | FAIL — stale content found | Reconcile each against implementation and CI/deployment configuration |
| Dependency/architecture graph | NOT VERIFIED | Determine canonical graph source and regenerate/compare |

## Recommended order before feature development

1. Reconcile documentation with current code (API, database, frontend, Docker, role-access matrix).
2. Run focused security review of access-profile boundaries, company ownership/IDOR, notification ownership/folder operations, inquiry access and product price-history visibility.
3. Add or run Docker/Compose and database migration smoke tests in an isolated environment.
4. Add browser end-to-end coverage for the three apps and high-value journeys.
5. Resolve or consciously defer Admin bundle warnings.
6. Re-run CI, inspect the full diff, and only then mark the audit complete and begin the next feature phase.

## Explicit limitation

This report records verified repository and CI evidence plus findings from source/document review. It does **not** claim the entire application has been manually tested, deployed, security-certified, or visually validated.

## Progress update — 2026-10-27

### Documentation reconciliation

The P1 stale-documentation finding has been addressed at the main-branch document level for the core guide set:

- `docs/README.md` — current pnpm/Vue monorepo and docs index.
- `docs/FRONTEND_DOCUMENTATION.md` — three Vue/Vite applications and shared packages.
- `docs/DOCKER_DEPLOYMENT.md` — current production Compose topology, ports, PostgreSQL 18 image and Node 22 backend.
- `docs/API_DOCUMENTATION.md` — current `/api/v1` module index and source-of-truth route references.
- `docs/DATABASE_DOCUMENTATION.md` — current Prisma model inventory.
- `docs/role-access-matrix.md` — access-profile boundaries and unresolved legacy SUPER_ADMIN bypass.

Commits: `3e9bacbafd4905ddcce35622a66fc9d0abad8573`, `e3e5e7f49c501d0d899c882d6b896418ca51bbfe`, `d0518ebce8c313fa1b8ccaac963133bc313dff95`, `bf43f91d014cb7353933aea4874c7955370e94ec`, `eab7069c6c15a9521fcede18ddec5bcd2b8af3eb`, `7587c4953f7e04042fa1044c5926477c5214a89d`.

These are source-aligned summary documents, not a claim that every endpoint request/response schema has been exhaustively documented. Markdown lint and a fresh CI result for these documentation commits are NOT VERIFIED.

### Runtime/browser validation follow-up

The runtime/browser workflow exists on the open `docs-runtime-e2e-hardening` PR branch (PR #9), not in the current main workflow. Its previous run `40339211695` was cancelled during the service-health wait. The cancelled job was re-run as job `122194361685`.

As of this update, the re-run has successfully completed:
- generated architecture graph verification;
- disposable Compose configuration validation;
- Docker build/start for PostgreSQL, backend and all three frontend panels;
- all service health endpoint checks;
- Prisma migration status against the disposable PostgreSQL database;
- installation of the isolated browser-test dependency.

Historical snapshot at the time this audit was first written: Chromium installation was in progress and browser tests had not started. PR #14 was later merged to main. The owner explicitly instructed that browser execution must not block further work; Playwright tests remain committed, but their live completion is not claimed.

### Security-policy impact inventory

Security finding (remediated on 2026-10-27): the SUPER_ADMIN cross-app bypass was removed from login app selection, generic `requireAccessType`, and PKCE handoff. Regression tests now cover a mismatched STAFF/COMPANY context and the CUSTOMER default-Website exception. `AccessProfile.type` remains the strict Admin/Company boundary; `CUSTOMER_USER` without AccessProfile may access Website-only CUSTOMER endpoints and cannot use that fallback for Admin/Company or SUPER_ADMIN.

### Remaining priority order

Updated priority order after the 2026-10-27 follow-up:
1. Run the current backend/frontend CI against the latest main snapshot; fix failures without waiting for the live browser job.
2. Keep customer address/profile APIs, route ownership, and profile response normalization covered by unit tests.
3. Keep price-history transformation, inquiry response decisions, and payment callback/retry idempotency covered by regression tests.
4. Treat Cart / Checkout / Orders / Wishlist as dormant future B2C pages; do not expose active routes or controls until the architecture decision changes.
5. Verify notification inbox/read-state regressions and document SMTP as not live-verified and SMS as not implemented.
6. Track Vite vendor chunking and architecture graph generation; verify builds through CI.


## Progress update — 2026-10-27 (runtime and auth-context follow-up)

- PR #14 was squash-merged into `main` as `92501f206ab16b163d8d4605e685cbe3396dd2aa`. It adds Docker/Compose runtime validation, Playwright smoke tests, and explicit Vite build-time origins for the Company/Admin panels.
- Observed on the PR head: CI run `40555574784` passed; PostgreSQL migration validation `40555574786` passed. Runtime run `40555575064` passed Compose configuration, Docker build/start, health endpoints, and migration status. Its browser step was still running at the last observation; per the owner instruction, do not block subsequent work waiting for it and do not claim browser E2E passed.
- The legacy SUPER_ADMIN cross-app bypass was removed from auth app selection, generic `requireAccessType`, and PKCE handoff. Tests were updated for login and RBAC, and a handoff unit test was added. The CUSTOMER-without-AccessProfile default Website behavior is explicitly tested so strict panel isolation does not break existing customer registrations.
- `docs/role-access-matrix.md`, `docs/ARCHITECTURE_DECISIONS.md`, `.ai/decisions.md`, and `.ai/current-task.md` now state that `AccessProfile.type` is the strict app-context boundary and wildcard permissions do not override it.
- PR #9 is non-mergeable after main advanced. Its useful address/token/architecture/code-splitting changes have now been ported selectively, along with the customer profile/API contract fix. PR #11's profile change is redundant against current main; close both stale PRs rather than force-merging an old base.
- Additional 2026-10-27 changes: added the customer Address model/migration/API/UI and ownership/default-address tests; normalized auth-store profile updates to store only the nested personal profile; added refresh-token `jti` uniqueness and regression tests; added price-history transformation tests; added payment callback/retry idempotency tests; disabled active Cart/Checkout/Orders/Wishlist routes and controls per AD-4; added Vite vendor chunk splitting, deterministic Prisma CLI availability in the runtime image, and generated architecture graph tooling. Latest test edits still need a completed CI result; live SMTP remains unverified and SMS is not implemented.


## Progress update — 2026-10-28 — validation checkpoint merged

- Validation PR #16 was merged into \`main\` at \`90a8f36be5c4281c999515206b099b894d2da75d\`.
- CI run [40629289205](https://github.com/gameacc2025/martest/actions/runs/40629289205) passed architecture graph consistency, frontend/shared tests, backend tests, Prisma client generation and all three frontend production builds.
- Fresh PostgreSQL migration validation run [40629289194](https://github.com/gameacc2025/martest/actions/runs/40629289194) passed schema/client validation, applying migrations to an empty database and checking migration state.
- The first validation run found the generated Mermaid graph was stale. The graph was regenerated and the graph check subsequently passed.
- Frontend tests found one false-negative test in the notification inbox folder-count suite across Website, Company and Admin. The tests had included the “all categories” button, which has no count element. Added \`data-folder-id\` to actual folder buttons and updated tests to query those explicit controls; the next complete CI run passed.
- Notification implementation notes now cover folder membership, counts, read-state behavior, bulk actions, and the page-scoped search/category limitation.
- Browser E2E is explicitly non-blocking per owner instruction. This update does not claim the browser tests passed.
- **Remaining audit work:** source-level review of notification folder/read-state authorization and app scope; inquiry permission/quota/response-decision coverage; ensure API/database/frontend/Docker/notification docs remain aligned with current source; review and track Admin bundle warnings; keep external SMTP NOT VERIFIED without credentials and a test recipient, and SMS NOT IMPLEMENTED.


## Follow-up finding — notification folder app-scope authorization (2026-10-28)

- **Severity:** P1 authorization-boundary hardening.
- **Finding:** The folder list and copy/move endpoints accepted an app scope from client query/body values, and folder-list filtering accepted a numeric folder ID without checking whether that folder belonged to the caller's authenticated app context.
- **Fix under validation:** Derive scope server-side from the verified access token (\`STAFF\` → \`ADMIN\`, \`COMPANY\` → \`COMPANY\`, \`CUSTOMER\` → \`WEBSITE\`); ignore client-supplied scope; fail closed for unknown context; verify a requested folder is available in that scope before listing its notifications; reject moves from inactive source folders.
- **Regression tests added:** Controller tests cover forged \`app\` values, missing context, cross-app folder IDs and scope mapping. Service tests cover inactive source folders and cross-scope destinations.
- **Status:** Pending CI and migration validation. Do not close the finding until the tests pass and the fix is merged.


## Follow-up finding closure — notification folder app-scope authorization (2026-10-28)

- **Status:** FIXED and merged in PR #17 at \`6c936fbf89b62febdf8122ac854fb53d93049ed4\`.
- **CI:** [40630173240](https://github.com/gameacc2025/martest/actions/runs/40630173240) passed; fresh PostgreSQL migration validation [40630173261](https://github.com/gameacc2025/martest/actions/runs/40630173261) passed.
- **Verified changes:** scope now comes from authenticated \`accessType\`, client-supplied scope is ignored, cross-app folder IDs are rejected, unknown contexts fail closed, and inactive source folders cannot be moved from.
- **Regression coverage:** controller tests cover forged scope values, missing context, folder-ID scope validation and mapping; service tests cover inactive source folders and cross-scope destinations.
- **Browser E2E:** not required for this closure and not claimed passed.


## Follow-up — canonical notification folder API contract (2026-10-28)

- **Status:** Pending CI and merge.
- Removed the obsolete client-selected app parameter from the shared endpoint helper and all three inboxes.
- Removed the app field from the folder action request schema and made folderId/action the only required body fields. The controller continues to derive authorization scope exclusively from the verified token.
- Updated notification API docs and route test fixture to match the canonical contract.


## Follow-up closure — canonical notification folder API contract (2026-10-28)

- **Status:** FIXED and merged in PR #18 at \`fd6515426d7cc5d6ed1c7d02589c46e940e35fde\`.
- **CI:** [40630881073](https://github.com/gameacc2025/martest/actions/runs/40630881073) passed; migration validation [40630881119](https://github.com/gameacc2025/martest/actions/runs/40630881119) passed.
- **Verified changes:** Frontend apps no longer send client-selected app scope for folder listing/move/copy; the shared endpoint helper and backend route schema match that contract. Authorization remains derived from the verified access token.


## Follow-up finding — pending inquiry subscription invariant (2026-10-28)

- **Severity:** P1 business-rule consistency for monetization.
- **Finding:** The self-service UI blocks a new subscription request while any pending request exists, but the backend only checked pending requests for the same plan. A direct API caller could create pending requests for different plans.
- **Fix under validation:** Backend pending-subscription lookup is now owner-scoped and independent of plan ID. Regression tests cover the different-plan duplicate and first valid request. The payment flow already locks the owner row before creation.
- **Status:** Pending CI and migration validation; do not close until green and merged.


## Follow-up closure — pending inquiry subscription invariant (2026-10-28)

- **Status:** FIXED and merged in PR #19 at \`695b61861b39f840eefa24660541d4d61143943d\`.
- **CI:** [40631325212](https://github.com/gameacc2025/martest/actions/runs/40631325212) passed; migration validation [40631325206](https://github.com/gameacc2025/martest/actions/runs/40631325206) passed.
- **Verified change:** Backend checks pending subscription requests by owner regardless of plan, matching the self-service UI rule. The payment flow locks the owner row before creating the pending request.
- **Regression coverage:** A pending request for another plan blocks a duplicate; an owner with no pending/active subscription can create the first request.
- **External provider verification:** These tests do not verify a live payment with Zarinpal. Live provider payment remains NOT VERIFIED without configured staging credentials.


## Follow-up finding — inquiry response concurrency (2026-10-28)

- **Severity:** P1 consistency / race-condition hardening.
- **Finding:** A supplier submission and buyer selection could both read an inquiry as OPEN under separate READ COMMITTED transactions. A submission that had already read OPEN could otherwise commit a new PENDING response after the buyer closed the inquiry and rejected existing pending responses.
- **Fix prepared:** Response submission, response edit/withdrawal, buyer response decision, and manual inquiry status transitions now lock the parent Inquiry row inside their transaction before reading current status.
- **Regression coverage prepared:** Service tests assert that response submission and buyer selection issue the parent-row `FOR UPDATE` lock.
- **Validation:** CI and fresh PostgreSQL migration validation must be observed on the PR head before merge. Browser E2E remains non-blocking per owner instruction and is not claimed passed.


## Closure — inquiry response concurrency (2026-10-28)

- **Status:** FIXED and merged in PR #20 at `afe468c62d674ec675e4d7e9264e4850403fdb21`.
- **CI:** [40633476868](https://github.com/gameacc2025/martest/actions/runs/40633476868) passed graph validation, frontend/shared tests, backend tests, Prisma generation and all three production builds.
- **Database:** [40633476941](https://github.com/gameacc2025/martest/actions/runs/40633476941) passed fresh PostgreSQL migration validation. No schema changes were introduced.
- **Regression coverage:** Service tests assert parent-row locking for successful response submission and buyer selection.
- **Browser E2E:** Not awaited or claimed passed, per owner instruction.


## Follow-up — Admin production bundle warning (2026-10-28)

- **Evidence:** CI build `40633476868` completed successfully. The generated Admin chunks shown in its build output are below the previous approximately 730 kB entry chunk; the largest displayed JavaScript chunk is approximately 196 kB (uncompressed), consistent with the configured 300 KiB vendor split target.
- **Remaining warning found:** CI on the first fix branch confirmed the same `INEFFECTIVE_DYNAMIC_IMPORT` warning in Website and Company as well as Admin: each router dynamically imported `src/stores/auth.js` while layouts/pages and `main.js` also statically imported it.
- **Fix prepared:** All three routers now import `useAuthStore` statically and call it inside route callbacks. This matches each module's actual usage and avoids pretending the store can be split into a separate chunk. Page components remain lazy-loaded.
- **Validation:** CI production builds must be rerun on the PR head. Browser E2E is not required for this cleanup and is not claimed passed.
