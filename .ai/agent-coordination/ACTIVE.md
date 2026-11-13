# Agent Coordination — Current Board

**Updated:** 2026-11-13  
**Repository:** `gameacc2025/martest`  
**Integration branch:** `main` only  
**Verified code baseline:** `0b78ae7ff24e55e9beec55a53739d059952bab56`  
**Latest docs commit:** `c00307d9e27b7898833a3a6f3bae16903e60a205`  
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
| P0-1 | Frontend tests + CI + build | PASS | Run `43461538717`: install, Frontend/Shared tests, Backend tests, Prisma generation and all three builds |
| P0-2 | Migration validation | PASS | Run `43461538821`: fresh PostgreSQL migration apply and state verification |
| P0-3 | Runtime + seeds + browser smoke | PASS | Run `43461538743`: Compose, all health checks, migration status, seed twice, Chromium and 8/8 Playwright tests |
| P0-4 | E2E selector fix + evidence docs | PASS | `4e5d25e3` corrected stale selector; `c00307d9` refreshed backlog |
| P1-1 | CRM acceptance | PARTIAL | Lead mutation schemas/tests added and verified; remaining endpoint schemas, functional CRUD/service/tenant tests, conversion/merge idempotency and Playwright CRM journey |
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
4. CRM lead mutation schemas and request validation tests are partial; full CRUD/service/tenant/E2E acceptance remains incomplete.
5. Support still has DB models only; no operational backend/API/UI vertical slice.
6. Generic SMS dispatch is still not implemented; Retail/Finance remain gated.
7. Sample Company dashboard/Settlement/Operations values require replacement or explicit Demo labeling.

## Required handoff

Persian summary; lane/task; exact base and resulting main SHA; exact changed paths; workflow URLs; test counts; migration/seed/browser evidence; risks and blockers.
