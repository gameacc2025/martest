# Agent Coordination — Current Board

**Updated:** 2026-11-13
**Repository:** `gameacc2025/martest`
**Integration branch:** `main` only
**Base audited remote SHA:** `928c221e50f8470f60b1a475c90cebf21b8b16f7`
**Coordinator:** Main/lead agent
**Owner communication:** Persian

## Operating policy
- No new branches, worktrees, detached checkouts or pull requests.
- No worker commits or pushes. Agents inspect and return scoped patches/evidence; lead alone integrates serially on main.
- No overlapping file ownership. Lead owns shared files: app registration, Prisma schema/migrations, permission registry, seed orchestrator, package manifests, shared API exports and global design tokens.
- Preserve all local changes and database data. No destructive Git, Docker or DB operations without explicit approval.
- Browser automation is authorized for CRM acceptance; run heavy tasks sequentially and close browser sessions after use.
- Agents must inspect actual code/runtime, not infer completion from docs or prior summaries. Persian user-facing reports only.

## Queue (do not start parallel implementation until local state is reconciled)

| Priority | Lane | Status | Owner | Scope |
|---|---|---|---|---|
| P0 | Local Git/runtime reconciliation | READY | Lead | Local HEAD/status/stashes, Docker, PostgreSQL, migrations, seed import resolution |
| P1 | CRM acceptance | WAITING P0 | CRM agent | Backend/API permissions, seed/idempotency, PKCE, Playwright end-to-end flows |
| P2 | Backend inventory | WAITING P0 | Backend audit agent | All domain modules, authz/ownership, tests, seed coverage |
| P2 | Website audit | WAITING P0 | Website agent | Routes/pages, real API integration, RFQ, CMS, auth, RTL/responsive |
| P2 | Company audit | WAITING P0 | Company agent | Dashboard, products, company users, inquiries, ownership and API integration |
| P2 | Admin audit | WAITING P0 | Admin agent | Admin routes/modules, CRUD, permissions, loading/error/empty states |
| P2 | Shared architecture/UI | WAITING P0 | Lead + audit agent | Shared packages, design tokens, auth/API client, RTL and cross-app consistency |
| P3 | Roadmap contracts | BLOCKED/REVIEW | Lead | API-1, API-2, API-3 and Marketplace/RFQ priorities |
| HOLD | API-5 Retail | BLOCKED_BY_OWNER_DECISION | Unassigned | Requires commercial policy approval |
| HOLD | API-6 Finance | BLOCKED_BY_OWNER_DECISION | Unassigned | Requires accounting/legal/payment policy approval |

## P0 acceptance
- [ ] Local main and origin/main relationship recorded; local edits/stashes preserved.
- [ ] Docker containers and health inspected with bounded commands.
- [ ] PostgreSQL connectivity and migration status checked read-only.
- [ ] Every seed import resolves to a real file; CMS password import discrepancy resolved.
- [ ] No destructive operation performed.
- [ ] Concise evidence added to WORKLOG and current-task.

## P1 CRM acceptance
- [ ] Prisma validation and migration status verified.
- [ ] Development seed succeeds and safe rerun/idempotency verified.
- [ ] Backend CRM routes/services/validation and access boundaries verified.
- [ ] Admin build and API client tests pass.
- [ ] PKCE/session persistence works in Playwright.
- [ ] Sources, Accounts, Contacts, Leads/conversion, Opportunities, Tasks, Activities and Notes browser workflows pass.
- [ ] Screenshots/trace or equivalent evidence retained; failures fixed and retested.

## Handoff format
Persian summary; task/lane; base main SHA; exact changed paths; commands and exit codes; tests and counts; seed/browser evidence; risks/blockers; commit SHA and remote-main verification.
