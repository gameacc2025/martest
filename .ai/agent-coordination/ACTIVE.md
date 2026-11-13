# Agent Coordination — Current Board

**Updated:** 2026-11-13  
**Repository:** `gameacc2025/martest`  
**Integration branch:** `main` only  
**Verified code baseline:** `a281e3fb84978457e34d816b519ba2f664ea8caa`  
**Latest docs commit:** `db4d7dea29aa323c4061965e1b620b52f9960691`  
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
| P0-1 | Frontend tests + CI + build | PASS | Run `43463018169`: install, Frontend/Shared tests, Backend tests, Prisma generation and all three builds |
| P0-2 | Migration validation | PASS | Run `43463018358`: fresh PostgreSQL migration apply and state verification |
| P0-3 | Runtime + seeds + browser smoke | PASS | Run `43463018256`: Compose, all health checks, migration status, seed twice, Chromium and 8/8 Playwright tests including CRM Leads |
| P0-4 | E2E selector + CRM pagination fix + evidence docs | PASS | `4e5d25e3` fixed stale homepage selector; `a281e3fb` fixed paginated CRM lists; `db4d7dea` refreshed backlog |
| P1-1 | CRM acceptance | PARTIAL | Lead mutation schemas/service tests and CRM Leads Playwright smoke pass; remaining endpoint schemas, full CRUD/permission/STAFF tests, conversion/merge idempotency and create/update/assign/status E2E |
| P1-2 | Support vertical slice | NOT STARTED | Backend API/client, tenant isolation, messages/attachments/queues/SLA and real UI in all apps |
| P1-3 | CMS + password recovery acceptance | SOURCE PRESENT / ACCEPTANCE PARTIAL | Public/admin CRUD and permissions, actual SMS provider delivery, reset flow E2E |
| P1-4 | Notifications + Audit | PARTIAL | Generic SMS outbox/retry/consent/quota/idempotency; audit event matrix, redaction, retention |
| P1-5 | Dashboards/reporting | PARTIAL | Replace sample KPIs with tenant-scoped real aggregates |
| P1-6 | Three-app regression | PARTIAL | Expand beyond smoke to visual, RTL, accessibility, keyboard and feature-level journeys |
| P2 | Retail/Inventory/Orders | HOLD — OWNER DECISION | No checkout/payment activation before commercial approval |
| P2 | Finance/Settlement | HOLD — OWNER DECISION | Requires Retail lifecycle and currency/tax/commission/legal/payout policies |
| P3 | Enterprise future modules | DEFERRED | Separate approved scope required |

## Verified blockers / risks

1. All P0 automated checks are green on the verified SHA and run IDs above.
2. Runtime is proven only on disposable GitHub Actions infrastructure; local Windows/Docker/PostgreSQL remain NOT VERIFIED.
3. Real SMS provider delivery and password recovery end-to-end are not proven by unit tests/seeds.
4. CRM lead route schemas, service tests and list UI smoke are partial; full CRUD/permission/STAFF/E2E acceptance remains incomplete.
5. Support still has DB models only; no operational backend/API/UI vertical slice.
6. Generic SMS dispatch is still not implemented; Retail/Finance remain gated.
7. Sample Company dashboard/Settlement/Operations values require replacement or explicit Demo labeling.

## Required handoff

Persian summary; lane/task; exact base and resulting main SHA; exact changed paths; workflow URLs; test counts; migration/seed/browser evidence; risks and blockers.
