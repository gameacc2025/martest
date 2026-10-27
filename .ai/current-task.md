# Current Task / Agent Handoff

## P0 — AUTH-CONTEXT-01: Review legacy SUPER_ADMIN app-context bypass

- **Started:** 2026-10-27
- **Status:** NEEDS_POLICY_REVIEW
- **Completed prerequisite:** `TENANT-ISOLATION-01` hardened the audited user-management, company-profile, product, inquiry, role/permission, category and selected admin surfaces. CI and fresh PostgreSQL migration validation passed on `e5b6900532b9a20ae92d581f5a2bde4647de4db2`.
- **Policy conflict:** The architecture decision says `AccessProfile.type` selects the app context, but legacy auth login and `requireAccessType` tests still codify a `SUPER_ADMIN` cross-app bypass.
- **Guardrail:** Do not change the global login/middleware/handoff contract until the intended policy is explicit. Keep strict context guards and service ownership checks on sensitive surfaces.
- **Next:** Continue with safe verification work while the policy remains unresolved. If a global behavior change is proposed, enumerate affected endpoints and tests first.

## P1 — REPOSITORY-QUALITY-AUDIT-2026-10-26-01: Runtime and browser verification

- **Status:** IN PROGRESS — PR-branch validation passed; current main still unverified.
- **Documentation:** Core README, frontend, Docker, API, database, role-access matrix and quality-audit documents were reconciled on main. See WORKLOG entries dated 2026-10-27.
- **Observed runtime result:** Workflow run `40339211695`, job `122194361685` on branch `docs-runtime-e2e-hardening` completed successfully, including Compose config, Docker build/start for PostgreSQL/backend/all three panels, health checks, Prisma migration status, Chromium installation and Playwright browser smoke tests.
- **Scope limitation:** PR #9's branch is 61 commits ahead and 77 behind main and includes unrelated schema/migration/address/Docker/frontend changes. Do not merge the full PR just to obtain its workflow. Current main CI for latest documentation head has not been independently verified.
- **Next action:** Create a minimal runtime/browser validation change based on current main, port/adapt only the workflow and smoke tests, then run it and inspect the final CI result. Do not claim main runtime validation passes until that run is green.
- **Known open work:** PR #11 (customer dashboard/address work) must be rechecked after higher-priority runtime/security work. Global SUPER_ADMIN policy remains unresolved and must not be silently changed.
