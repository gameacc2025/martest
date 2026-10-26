# Current Task / Agent Handoff

## REPO-HARDENING-TASKS-3-7 — Documentation, architecture, runtime, browser smoke, and release readiness

- **Status:** IMPLEMENTED ON WORKING BRANCH; automated CI/runtime verification is running. Do not mark release-ready until the latest workflow runs finish green.
- **Branch:** `docs-runtime-e2e-hardening`
- **Base branch:** `main` at `98cdbb1390e6fff50099e14fd64b277db7876974`.
- **User authorization:** User explicitly authorized completing Tasks 3–7 autonomously without further questions.

### Task 3 — Documentation
- Rewrote `docs/API_DOCUMENTATION.md` around actual `/api/v1` route registration and current route modules; removed legacy `/api`, old role names, and universal response-shape assumptions.
- Rewrote `docs/DATABASE_DOCUMENTATION.md` from current Prisma models and migrations, including AccessProfile/RBAC, inquiry/notification models, ProductPriceTier and retail-only ProductPriceSnapshot semantics.
- Rewrote `docs/FRONTEND_DOCUMENTATION.md` for `apps/website`, `apps/company`, `apps/admin` and `packages/*`.
- Rewrote `docs/DOCKER_DEPLOYMENT.md` around current Compose services, Node 22, PostgreSQL 18.4 image, ports 3000–3003, nginx and required env files.
- Corrected `docs/role-access-matrix.md` and `docs/ARCHITECTURE_DECISIONS.md` to reflect AccessProfile types and actual inquiry route behavior; refreshed `docs/README.md` and root `.env.example`.
- Replaced old Testing guide with current unit/build/runtime/browser coverage and explicitly listed what's not verified.

### Task 4 — Architecture graph
- Added `scripts/generate-architecture-graph.mjs` and `docs/architecture/DEPENDENCY_GRAPH.generated.mmd`.
- Added `docs/architecture/README.md` describing source-of-truth files and repeatable `--write` / `--check` workflow.
- Runtime CI has confirmed the graph validation step passed on a recent commit.

### Task 5 — Database and Compose runtime
- Added `.github/workflows/runtime-validation.yml`: validates Compose config, builds and starts all services with a disposable PostgreSQL volume, waits for backend and all panel health endpoints, then checks `prisma migrate status`.
- This is intended to verify migrations against a real PostgreSQL container, not just `prisma generate`. Final result is pending in GitHub Actions; do not claim pass until latest run concludes green.

### Task 6 — Browser tests
- Added isolated Playwright config and tests under `e2e/`.
- Coverage currently is browser smoke, not full business acceptance: all three SPA entrypoints render at desktop/mobile viewport; no uncaught initial JS errors; each panel's nginx proxy forwards an unauthenticated protected API request and receives 401.
- Successful login/logout, role-specific denial, product approval/publication, inquiry ownership/response, notification folder/count behavior, and full visual parity still require dedicated fixtures/assertions. Do not describe those flows as covered.

### Task 7 — Optimization and delivery
- Fixed the ineffective dynamic import warning in `apps/admin/src/router/index.js` by using the already shared auth store as a static import.
- Admin bundle size warning still needs review after the latest build logs; do not silence it by merely increasing the warning threshold.
- Real SMTP delivery is not verified: no provider credentials/recipient are available in this workflow. SMS remains unimplemented in the current dispatch service.
- CI workflow now also runs on this branch. Latest CI/runtime workflow results are pending; see Actions for this branch.

### Required final checks
1. Confirm latest CI and Runtime Validation runs conclude successfully.
2. Fix any migration, Compose, Playwright, unit-test, or build failure revealed by those runs.
3. Re-fetch final branch HEAD and compare with `main`; create/merge a PR only after green checks.
4. Update this file and `.ai/WORKLOG.md` with exact run IDs, final commit, and truthful verification boundaries.
