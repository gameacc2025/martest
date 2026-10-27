# Current Task / Agent Handoff

## P0 — AUTH-CONTEXT-01: Review legacy SUPER_ADMIN app-context bypass

- **Started:** 2026-10-27
- **Status:** NEEDS_POLICY_REVIEW
- **Completed prerequisite:** `TENANT-ISOLATION-01` hardened the audited user-management, company-profile, product, inquiry, role/permission, category and selected admin surfaces. CI and fresh PostgreSQL migration validation passed on `e5b6900532b9a20ae92d581f5a2bde4647de4db2`.
- **Policy conflict:** The architecture decision says `AccessProfile.type` selects the app context, but legacy auth login and `requireAccessType` tests still codify a `SUPER_ADMIN` cross-app bypass.
- **Guardrail:** Do not change the global login/middleware/handoff contract until the intended policy is explicit. Keep strict context guards and service ownership checks on sensitive surfaces.
- **Next:** Continue with safe verification work while the policy remains unresolved. If a global behavior change is proposed, enumerate affected endpoints and tests first.

## P1 — REPOSITORY-QUALITY-AUDIT-2026-10-26-01: Runtime and browser verification

- **Status:** IN_PROGRESS
- **Latest documentation work:** Core README, frontend, Docker, API, database and role-access matrix documents were reconciled with the current monorepo/source on 2026-10-27. See the appended WORKLOG entry and commits `3e9bacb`, `e3e5e7f`, `d0518eb`, `bf43f91`, `eab7069`, `7587c49`.
- **Not verified:** CI for the latest documentation commits, Docker image build/Compose startup, real PostgreSQL migration deployment, browser E2E/visual flows, live SMTP/Twilio delivery and payment provider acceptance.
- **Known open work:** PR #9 is listed as open for documentation/runtime/browser validation; PR #11 is listed as open for customer dashboard alignment. Confirm current PR/CI state before doing overlapping work.
- **Next action:** Inspect the latest CI and runtime-validation workflow result; complete the highest-priority runtime/browser gaps where a supported environment exists. Do not claim a runtime or provider check passed unless its actual result is observed.
