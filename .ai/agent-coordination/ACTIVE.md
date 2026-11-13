# Agent Coordination — Current Board

**Updated:** 2026-11-13  
**Repository:** `gameacc2025/martest`  
**Integration branch:** `main` only  
**Verified code baseline:** `0d0a3866c6ff387978f8c5244f6ca936248f508d`  
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

## Verified P0 checks

| Lane | Status | Evidence |
|---|---|---|
| CI + build | PASS | [43474183592](https://github.com/gameacc2025/martest/actions/runs/43474183592): install, architecture graph, Frontend/Shared, Backend, Prisma and all three builds |
| Migration validation | PASS | [43474183157](https://github.com/gameacc2025/martest/actions/runs/43474183157): fresh PostgreSQL migration apply |
| Runtime + seeds + browser | PASS | [43474183935](https://github.com/gameacc2025/martest/actions/runs/43474183935): Compose, health, migrations, seed twice, Chromium, 8/8 Playwright |

## Prioritized queue

| Priority | Lane | Status | Scope / exit criteria |
|---|---|---|---|
| P1-1 | CRM acceptance | PARTIAL | schemas for all remaining route families; CRUD/service/permission/STAFF tests; conversion/merge idempotency; Playwright mutations |
| P1-2 | Support completion | PARTIAL | secure attachments, notifications, SLA calendar/worker/escalation, queue-level visibility, agent assignment, pagination and deeper tests |
| P1-3 | CMS + password recovery | SOURCE PRESENT / ACCEPTANCE PARTIAL | FAQ/Page CRUD and permissions; real SMS provider and reset E2E |
| P1-4 | Notifications + Audit | PARTIAL | generic SMS outbox/retry/consent/quota/idempotency; audit event matrix, redaction and retention |
| P1-5 | Dashboards/reporting | PARTIAL | replace sample KPIs with tenant/date/currency-scoped aggregates |
| P1-6 | Three-app regression | PARTIAL | expand beyond smoke to visual, RTL, accessibility, keyboard and feature journeys |
| P2 | Retail/Inventory/Orders | HOLD — OWNER DECISION | no checkout/payment activation before commercial approval |
| P2 | Finance/Settlement | HOLD — OWNER DECISION | requires Retail lifecycle and currency/tax/commission/legal/payout rules |
| P3 | Enterprise future modules | DEFERRED | separately approved scope required |

## Verified blockers / risks

1. All P0 automated checks are green on the verified SHA and run IDs above.
2. Support create/reply browser journey passes, but secure attachments, notifications and SLA worker/calendar are not implemented/verified.
3. CRM Leads list browser journey passes; full mutation and permission/tenant matrix acceptance remains.
4. CMS FAQ/Page CRUD browser acceptance and real SMS delivery remain unverified.
5. Generic SMS dispatch, audit coverage and sample dashboard data remain open.
6. Retail/Finance remain gated by owner decisions.
7. Local Windows/Docker/PostgreSQL remain NOT VERIFIED.

## Required handoff

Persian summary; task/lane; exact base and resulting main SHA; changed paths; workflow URLs; test counts; migration/seed/browser evidence; risks and blockers.
