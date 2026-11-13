# Agent Coordination — Current Board

**Updated:** 2026-11-13  
**Repository:** `gameacc2025/martest`  
**Integration branch:** `main` only  
**Audited code baseline:** `48e73952e277703b70a351d4f0569fed48944b76`  
**Latest documentation handoff before this board update:** see Git history after `2b7ca663`  
**Coordinator:** Lead  
**Owner communication:** Persian

## Operating policy

- No new branches, worktrees, detached checkouts or pull requests.
- Workers do not commit or push. Lead alone integrates reviewed changes on `main`.
- No overlapping file ownership. Lead owns app registration, Prisma schema/migrations, permission registry, seed orchestrator, package manifests, shared API exports and global tokens.
- Preserve local edits, untracked files, stashes and database data.
- No destructive Git/Docker/DB actions without explicit approval. Never bypass Fact-Forcing Gate or Auto Mode.
- Browser automation is authorized for acceptance; run sequentially and record evidence.
- Read-only remote source audit is complete. Local Windows workspace, Docker and PostgreSQL remain NOT VERIFIED.

## Prioritized queue

| Priority | Lane | Status | Scope / exit criteria |
|---|---|---|---|
| P0-1 | Workspace dependency + CI recovery | READY | Fix Admin quill importer in pnpm-lock; frozen install; frontend/shared tests; three app builds; green CI |
| P0-2 | CMS FAQ/Page integrity | BLOCKER | Resolve missing Prisma FAQ/Page delegates; align schema/migration/services/routes/client/UI/seed/tests |
| P0-3 | Account recovery | BLOCKER | Public secure reset flow; real SMS/Email delivery; challenge limits/expiry/consume; reset + session invalidation |
| P0-4 | API/docs + agent-policy reconciliation | READY AFTER P0-1 | Add CMS/CRM route docs and inventory coverage; remove conflicting detached-worktree and stale palette guidance |
| P0-5 | Runtime/migration/seed verification | WAITING P0-1..P0-4 | Safe Docker/Postgres checks, migration status, seed run and two-run idempotency; preserve all data |
| P1-1 | CRM acceptance | WAITING P0 | Add request schemas and functional/security tests; seed idempotency; Playwright CRM workflows |
| P1-2 | Support vertical slice | WAITING P0 | Backend API/client, tenant isolation, messages/attachments/queues/SLA and real UI in all apps |
| P1-3 | Notifications + Audit | WAITING P0 | Generic SMS event dispatch and complete audit coverage/retention/redaction |
| P1-4 | Dashboards/reporting | WAITING P0 | Replace sample KPIs with real tenant-scoped aggregates |
| P1-5 | Three-app regression | WAITING CI | Frontend/shared tests, builds, browser journeys, RTL/accessibility/responsive checks |
| P2 | Retail/Inventory/Orders | HOLD — OWNER DECISION | No checkout/payment activation before commercial approval and full server-side lifecycle |
| P2 | Finance/Settlement | HOLD — OWNER DECISION | Depends on Retail plus currency/commission/tax/legal/payout policies |
| P3 | Enterprise future modules | DEFERRED | Procurement, HR, projects, advanced logistics/warehouse, marketing automation, BI and integrations need separate scope |

## Verified blockers / risks

1. Current code SHA `48e73952`: migration workflow PASS; backend tests and Prisma Client generation PASS; workspace dependency install FAIL; frontend/shared tests SKIPPED; frontend build FAILURE; runtime Compose/browser workflow skipped after install failure.
2. `apps/admin/package.json` includes quill but the apps/admin importer in `pnpm-lock.yaml` does not.
3. CMS FAQ/Page services use Prisma delegates absent from schema.
4. Forgot/reset password client endpoints are not registered in backend; AuthChallenge route requires authentication and provider send is TODO.
5. Support schema exists but no backend module/routes/API client; UI remains preview.
6. CRM API/UI/seed source exists, but request schemas, functional tests and CRM E2E are incomplete.
7. Retail/Finance are DB foundations only; UI contains preview/sample values.
8. API route docs/inventory omit CMS/CRM; route inventory test excludes them.
9. Generic SMS dispatch is explicitly not implemented.
10. Local runtime and seed status remain NOT VERIFIED.

## Required handoff

Persian summary; task/lane; exact base main SHA; exact paths; commands and exit codes; test counts; seed/browser evidence; risks/blockers; commit SHA and verified remote-main SHA.
