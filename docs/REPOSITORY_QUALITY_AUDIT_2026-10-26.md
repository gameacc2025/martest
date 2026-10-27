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

Chromium installation is still in progress; Playwright browser smoke tests have not started yet. Do not mark runtime/browser validation as complete until the workflow's final conclusion and browser-test result are observed. This run is on the PR branch's older commit, not the latest main head.

### Security-policy impact inventory

The unresolved global SUPER_ADMIN cross-app bypass is present in:
- login app selection in `backend/src/modules/auth/auth.service.js` (test: `login: SUPER_ADMIN bypasses the app-type guard entirely`);
- generic `requireAccessType` in `backend/src/middlewares/rbac.js` (test explicitly expects the bypass);
- session handoff target-app validation in `backend/src/modules/auth/handoff.service.js`;
- several product and inquiry routes that still use generic `requireAccessType`.

Strict `requireExactAccessType` already protects role/permission, category and admin-management surfaces; service-level ownership/context checks were added for the audited user, company, product and inquiry paths. A global change needs a deliberate policy decision and targeted regression tests; this audit has not changed that contract.

### Remaining priority order

1. Confirm the runtime/browser workflow result and port any validated runtime checks to main without overwriting newer documentation.
2. Finish the auth-context policy review; keep the global bypass unchanged until policy is explicit.
3. Complete browser E2E journeys for product → inquiry → supplier quote → buyer decision, notification folders/read state, and company isolation.
4. Verify monetization PR/merge status and test payment callback/replay/retry plus Twilio delivery in staging.
5. Resume the deferred customer dashboard/address work after higher-priority validation; orders still need a real backend domain.
6. Address Admin bundle warnings after capturing a baseline and tracing imports.


## Progress update — 2026-10-27 (runtime and auth-context follow-up)

- PR #14 was squash-merged into `main` as `92501f206ab16b163d8d4605e685cbe3396dd2aa`. It adds Docker/Compose runtime validation, Playwright smoke tests, and explicit Vite build-time origins for the Company/Admin panels.
- Observed on the PR head: CI run `40555574784` passed; PostgreSQL migration validation `40555574786` passed. Runtime run `40555575064` passed Compose configuration, Docker build/start, health endpoints, and migration status. Its browser step was still running at the last observation; per the owner instruction, do not block subsequent work waiting for it and do not claim browser E2E passed.
- The legacy SUPER_ADMIN cross-app bypass was removed from auth app selection, generic `requireAccessType`, and PKCE handoff. Tests were updated for login and RBAC, and a handoff unit test was added. These newest test edits have not yet been confirmed by a completed CI run.
- `docs/role-access-matrix.md`, `docs/ARCHITECTURE_DECISIONS.md`, `.ai/decisions.md`, and `.ai/current-task.md` now state that `AccessProfile.type` is the strict app-context boundary and wildcard permissions do not override it.
- PR #9 became non-mergeable after main advanced. Do not merge its old branch wholesale. Port useful address/token/architecture/performance changes selectively after comparing them with current main. PR #11 is based on that branch and must also be ported selectively.
- Remaining audit work: validate the strict-context regression tests; reconcile customer address/profile behavior with actual APIs; review product price-history and inquiry quote/decision workflows; verify monetization callback idempotency/retry coverage; check notification inbox tests; and document SMTP (not live-verified) / SMS (not implemented) boundaries.
