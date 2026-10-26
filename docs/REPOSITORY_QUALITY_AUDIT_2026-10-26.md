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