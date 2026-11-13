# Agent Coordination — Current Board

**Updated:** 2026-11-13 (cross-domain source audit refresh)  
**Repository:** `gameacc2025/martest`  
**Integration branch:** `main` only  
**Code baseline inspected before documentation updates:** `ace67cccc6a4b09b8cf8258dc814aedbb5d0b71b`  
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

## Agent task assignments — 2026-11-14

**Task plan:** [docs/AGENT_TASKS_PHASED_PLAN.md](../../docs/AGENT_TASKS_PHASED_PLAN.md)

| Ticket | Lane / role | Status | Exclusive ownership / output | Dependency |
|---|---|---|---|---|
| BASE-01 | Agent A — read-only baseline auditor | READY | GitHub Actions/workflow evidence only; no code writes | None |
| BASE-02 | Agent B — read-only DB verifier | WAITING | Migration workflow evidence only; no Prisma/schema writes | BASE-01 |
| BASE-03 | Agent C — read-only seed verifier | WAITING | Seed workflow/test evidence only; no seed writes | BASE-01 |
| BASE-04 | Agent D — read-only E2E verifier | WAITING | Playwright workflow/spec evidence only; no test edits | BASE-01 |
| CRM-01 | CRM backend agent | WAITING | CRM account/contact schemas + focused route tests; exclusive lock on shared `crm/index.js` | BASE-01 |
| SUP-01 | Support security analyst | READY — read-only | New attachment threat-model/API-contract note only | BASE-01 |
| CMS-01 | CMS contract analyst | READY — read-only | New Featured decision note only; no schema/migration | BASE-01 |
| NTF-01 | Notifications analyst | READY — read-only | New event-to-producer/channel matrix only | BASE-01 |
| AUD-01 | Audit analyst | READY — read-only | New audit producer coverage matrix only | BASE-01 |
| DASH-05 | Company dashboard analyst | READY — read-only | Inventory sample panels and backing APIs; no UI writes | BASE-01 |

**Coordination constraints:** Agent A–D and analysts may inspect in parallel. Only read-only tickets may start concurrently before BASE-01 closes. Code writers must wait for an explicit lead assignment and exact file ownership. The shared main working tree is not a multi-writer lock; serialize writes. Do not claim a ticket already assigned. No agent commits/pushes.

## Previously verified P0 checks — baseline `0d0a386` only

> These workflow results predate later CMS code commits on `main`; they are not evidence for the current HEAD. Rerun all gates before release.

| Lane | Status | Evidence |
|---|---|---|
| CI + build | PASS on `0d0a386`; current HEAD NOT VERIFIED | [43474183592](https://github.com/gameacc2025/martest/actions/runs/43474183592): install, architecture graph, Frontend/Shared, Backend, Prisma and all three builds |
| Migration validation | PASS on `0d0a386`; current HEAD NOT VERIFIED | [43474183157](https://github.com/gameacc2025/martest/actions/runs/43474183157): fresh PostgreSQL migration apply |
| Runtime + seeds + browser | PASS on `0d0a386`; current HEAD NOT VERIFIED | [43474183935](https://github.com/gameacc2025/martest/actions/runs/43474183935): Compose, health, migrations, seed twice, Chromium, 8/8 Playwright |

## Prioritized queue

| Priority | Lane | Status | Scope / exit criteria |
|---|---|---|---|
| P1-1 | CRM acceptance | PARTIAL — schemas only cover Leads | exact STAFF/per-action guards exist; add schemas for accounts/contacts/pipelines/opportunities/tasks/activities/notes; broaden permission/service tests; prove convert/merge concurrency and Playwright mutations |
| P1-2 | Support completion | PARTIAL | requester/company scopes and SLA fallback tests exist; no upload/download route found; add secure attachments, notification events, business-hours calendar/worker/escalation and queue-level visibility tests |
| P1-3 | CMS + password recovery | ADMIN UI PRESENT / ACCEPTANCE PARTIAL | Five Admin CMS screens/routes/navigation exist; verify API CRUD, backend permission matrix, public FAQ/Page and browser E2E; real SMS provider and reset E2E |
| P1-4 | Notifications + Audit | PARTIAL | IN_APP/EMAIL dispatch + email retry/dedupe exist; SMS unavailable; prove audit event producers, redaction and retention |
| P1-5 | Dashboards/reporting | PARTIAL | Admin OperationsHub has hard-coded CRM/Finance/Support data; Company main KPIs are API-backed with some sample panels; fix orders/inquiries metric mismatch |
| P1-6 | Three-app regression | PARTIAL | expand beyond smoke to visual, RTL, accessibility, keyboard and feature journeys |
| P2 | Retail/Inventory/Orders | HOLD — OWNER DECISION | no checkout/payment activation before commercial approval |
| P2 | Finance/Settlement | HOLD — OWNER DECISION | requires Retail lifecycle and currency/tax/commission/legal/payout rules |
| P3 | Enterprise future modules | DEFERRED | separately approved scope required |

## Verified blockers / risks

1. P0 automated checks passed on baseline `0d0a386`; current main contains later code commits and was NOT revalidated in this audit.
2. Support create/reply browser journey passes, but secure attachments, notifications and SLA worker/calendar are not implemented/verified.
3. CRM Leads list browser journey passes; full mutation and permission/tenant matrix acceptance remains.
4. CMS FAQ/Page CRUD browser acceptance and real SMS delivery remain unverified.
5. SMS is explicitly unimplemented (`smsAvailable: false`); Audit event producer coverage is unproven; Admin OperationsHub still contains hard-coded sample data.
6. Retail/Finance remain gated by owner decisions.
7. No tests/builds/migrations/Actions were run in the current source audit. Local Windows/Docker/PostgreSQL remain NOT VERIFIED.

## Required handoff

Persian summary; task/lane; exact base and resulting main SHA; changed paths; workflow URLs; test counts; migration/seed/browser evidence; risks and blockers.
