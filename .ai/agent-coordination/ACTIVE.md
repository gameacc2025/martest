# Agent Coordination — Current Board

**Updated:** 2026-11-13  
**Repository:** `gameacc2025/martest`  
**Integration branch:** `main` only  
**Current code-fix baseline:** `06daab07ff446aab577b885092a45c382ccd11ad`  
**Coordinator:** Lead  
**Owner communication:** Persian

## Operating policy

- No new branches, worktrees, detached checkouts or pull requests.
- Workers do not commit or push. Lead alone integrates reviewed changes on `main`.
- No overlapping file ownership. Lead owns app registration, Prisma schema/migrations, permission registry, seed orchestrator, package manifests, shared API exports and global tokens.
- Preserve local edits, untracked files, stashes and database data.
- No destructive Git/Docker/DB actions. Never bypass Fact-Forcing Gate or Auto Mode.
- Browser automation is authorized for acceptance; run sequentially and record evidence.
- Local Windows workspace, Docker and PostgreSQL remain NOT VERIFIED.

## Prioritized queue

| Priority | Lane | Status | Scope / exit criteria |
|---|---|---|---|
| P0-1 | Frontend test recovery | IN PROGRESS | Resolve remaining Website test failures; all Vitest suites green; then verify three app builds |
| P0-2 | Runtime/migration/seed | IN PROGRESS | Added missing `LOGIN_MFA` enum migration after runtime seed failure; verify all health checks, migration deploy, seed twice/idempotency and Chromium smoke |
| P0-3 | CMS + account recovery acceptance | SOURCE PRESENT / RUNTIME PENDING | Faq/Page models/migration/services/routes/seed and public SMS OTP reset flow exist; verify CRUD, permissions, provider config and browser flow |
| P0-4 | Docs + policy parity | IN PROGRESS | Backlog/current-task/worklog refreshed; finish contradictory worktree and palette instructions; keep API/OpenAPI inventory aligned |
| P1-1 | CRM acceptance | WAITING P0 | Add Fastify schemas, functional/service/tenant/permission tests, seed idempotency and Playwright CRM workflows |
| P1-2 | Support vertical slice | NOT STARTED | Backend API/client, tenant isolation, messages/attachments/queues/SLA and real UI in all apps |
| P1-3 | Notifications + Audit | PARTIAL | Generic SMS outbox and event delivery; audit event matrix, redaction, retention |
| P1-4 | Dashboards/reporting | PARTIAL | Replace sample KPIs with tenant-scoped real aggregates |
| P1-5 | Three-app regression | WAITING P0 | Browser journeys, RTL/accessibility/responsive and permission matrix |
| P2 | Retail/Inventory/Orders | HOLD — OWNER DECISION | No checkout/payment activation before commercial approval |
| P2 | Finance/Settlement | HOLD — OWNER DECISION | Requires Retail lifecycle and currency/tax/commission/legal/payout policies |
| P3 | Enterprise future modules | DEFERRED | Separate approved scope required |

## Verified blockers / risks

1. Frozen dependency install passes; previous quill/lockfile mismatch finding was incorrect.
2. Latest completed CI evidence: Prisma generation, Backend tests and three-app build PASS; frontend suite had 7 Website failures. Follow-up fixes are committed; latest rerun pending.
3. Runtime Compose build/start passed, but health failed because PostgreSQL enum lacked `LOGIN_MFA`; additive migration `20261113000300_add_login_mfa_challenge_purpose` was added. Runtime rerun pending.
4. CMS FAQ/Page models and migration are now present; do not repeat prior stale finding that Prisma delegates are missing.
5. Public password recovery routes/service are present; real SMS provider and browser acceptance remain unverified.
6. Audit mount path normalized; backend route inventory/OpenAPI tests passed in prior CI run.
7. Support still has DB models only; CRM functional schemas/tests/E2E remain incomplete.
8. Generic SMS dispatch is still not implemented; Retail/Finance remain gated.
9. Local runtime, working tree, stash/untracked and database status remain NOT VERIFIED.

## Required handoff

Persian summary; lane/task; exact base and resulting main SHA; exact changed paths; workflow URLs; test counts; migration/seed/browser evidence; risks and blockers.
