# Current Task / Agent Handoff

## AUTH-CONTEXT-01 — Review legacy SUPER_ADMIN app-context bypass

- **Started:** 2026-10-27
- **Status:** NEEDS_POLICY_REVIEW
- **Context:** `TENANT-ISOLATION-01` is complete for the audited user-management, company-profile, product, inquiry, role/permission, category, and admin surfaces. CI and fresh PostgreSQL migration validation passed on `e5b6900532b9a20ae92d581f5a2bde4647de4db2`.
- **Observed conflict:** Project context says application selection is driven by `AccessProfile.type`, but existing `requireAccessType` and auth-service tests explicitly codify a SUPER_ADMIN bypass across app contexts.
- **Guardrail:** Do not silently change the global auth contract without confirming intended behavior. A strict helper now protects high-risk admin surfaces, while service-level ownership checks protect user/product/inquiry/company operations.
- **Next action:** Audit the exact auth-service and middleware behavior, enumerate endpoints affected by a global change, and propose a minimal migration/test plan before modifying the existing cross-app SUPER_ADMIN contract.
