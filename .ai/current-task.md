# Current Task / Agent Handoff

## REPOSITORY-QUALITY-AUDIT-2026-10-26-01 — Full pre-development audit

- **Status:** IN_PROGRESS — initial source/document review and CI evidence collected; remediation and operational verification remain.
- **Canonical branch:** `main`.
- **Audit report:** [docs/REPOSITORY_QUALITY_AUDIT_2026-10-26.md](../docs/REPOSITORY_QUALITY_AUDIT_2026-10-26.md).
- **Verified CI:** Run [40309510309](https://github.com/gameacc2025/martest/actions/runs/40309510309) passed on HEAD `1dd1434d1c78b4a0fb0e51cd5695b6653f1d4e35`, including frontend/shared tests, backend tests, Prisma Client generation, and production builds for Website/Company/Admin.
- **Initial findings:** Several docs are stale (Docker/Next.js paths and versions, API base paths/legacy roles, frontend tree, database model inventory, role/access matrix). CI build emits an Admin chunk >500 kB and ineffective dynamic-import warning.
- **Unverified:** Local test rerun, PostgreSQL migration application, Docker/Compose build/startup, browser E2E and visual validation, company ownership/IDOR sign-off, live SMTP, and generated dependency graph.
- **Next actions:** Reconcile docs with current source and registered routes; review auth/RBAC and company-owned resource paths; add/run isolated migration and Docker smoke checks; validate high-value browser flows; re-run CI and review changes. Do not begin unrelated feature development until P1 findings are resolved or explicitly documented as accepted risks.
