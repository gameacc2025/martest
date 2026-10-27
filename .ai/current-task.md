# Current Task / Agent Handoff

## TENANT-ISOLATION-01 — Phase 0 RBAC and tenant-isolation audit

- **Started:** 2026-10-27
- **Goal:** Continue the project security stabilization by auditing tenant boundaries and authorization outside the completed inquiry/quote path.
- **Scope:** Product ownership and visibility, company-user management boundaries, STAFF/COMPANY/CUSTOMER access separation, route permission guards, backend ownership checks, and regression tests for confirmed vulnerabilities.
- **Baseline:** `MARKETPLACE-E2E-01` is complete. CI and fresh-PostgreSQL migration validation passed after the supplier quote authorization and concurrent decision fixes. See the latest completion entry in `.ai/WORKLOG.md`.
- **Guardrails:** Read `AGENTS.md`, `.ai/PROTOCOL.md`, project context, decisions, and roadmap before edits. Backend is the authorization boundary. COMPANY users may only manage their own company data; STAFF is not a seller. Do not allow Company users to create/delete other company users, change roles/permissions, or transfer users. Do not resume deferred B2C cart/checkout/orders or the customer dashboard task.
- **Method:** Map route → controller → service → ownership predicate → permission middleware → tests. Reproduce → regression test → fix only confirmed defects. Preserve current behavior and UI unless a verified issue requires change.
- **Verification target:** Targeted backend authorization tests, full backend tests, frontend/shared tests and builds, and fresh-PostgreSQL migration validation if applicable.
- **Status:** IN_PROGRESS
- **Next action:** Inspect product and company-user mutation routes/services and their existing tests; prioritize caller-supplied companyId, cross-company IDs, and missing route permission guards.
