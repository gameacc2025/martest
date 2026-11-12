# Current Task — PHASE-0 Repository Audit & Agent Handoff

**Status:** PARTIAL — remote documentation/GitHub audit completed; local Windows workspace, Docker runtime and PostgreSQL state NOT VERIFIED.
**Canonical repository:** `gameacc2025/martest`
**Canonical branch:** `main`
**Audited remote HEAD:** `928c221e50f8470f60b1a475c90cebf21b8b16f7` (2026-11-10)
**Owner communication:** Persian.
**Integration policy:** main only; no feature branches, worktrees, detached checkouts or PRs. Only the lead integrates, commits and pushes after review.

## Confirmed findings

1. Previous version of this file was 153,075 characters / 1,368 lines and contained unresolved Git conflict markers (`<<<<<<<`, `=======`, `>>>>>>>`). Replaced with this canonical handoff.
2. Previous WORKLOG was 547,035 characters / 4,393 lines. Historical task detail is preserved in Git commit history; WORKLOG is now a concise current-state index.
3. README.md contradicted AGENTS.md on communication language. Persian is canonical.
4. docs/AI_AGENT_WORKFLOW.md contradicted itself on response language and instructed detached worktrees, conflicting with owner policy.
5. AGENTS.md and .ai/PROTOCOL.md prohibited browser testing based on an older instruction. Owner has since explicitly authorized Playwright/browser validation for the current CRM acceptance work.
6. ACTIVE.md described stale API-1..API-4 statuses and an old 2026-11-08 assignment board; it is reset to an audit-first queue.
7. .ai/project-context.md is 106 KB / 998 lines. Do not read it wholesale on every task; use its headings and retrieve only relevant sections.
8. .ai/decisions.md is the accepted-decision source. Do not convert open questions into decisions.

## Current work queue

### P0 — Local/runtime reconciliation (BLOCKED on local agent execution)
- Inspect local `git status --short --branch`, HEAD, origin/main, stashes and untracked files.
- Preserve all local modifications; reconcile local HEAD with audited remote SHA.
- Inspect Docker health and bounded logs; no `docker logs -f` long-running sessions.
- Verify PostgreSQL connectivity and current migration status read-only.
- Inspect all seed imports, especially the historical `prisma/seeds/cms.js` password utility import failure.
- Never reset, truncate, drop, delete volumes or destroy user data.

### P1 — CRM acceptance (highest implementation priority)
- Verify Prisma schema and migrations.
- Run the development seed and prove idempotency using safe checks.
- Verify backend tests, CRM API authorization and role/tenant boundaries.
- Fix Playwright PKCE/session persistence and run real Admin CRM browser workflows.
- Capture exact commands, exit codes and concise evidence. Report blocked checks honestly.

### P2 — Whole-project audit
- Backend modules: Auth, Users/Roles/Permissions, Companies, Products/Categories/Specs, Inquiries/Responses, Notifications, CMS, CRM, Support, Audit, Retail, Finance.
- Frontends: Website, Company, Admin; classify pages REAL API / PARTIAL / MOCK / STATIC / MISSING.
- Shared packages, design tokens, RTL, auth, permissions, API client and responsive behavior.
- Build/test/CI inventory with actual evidence.

### P3 — Roadmap execution
- M0 design-system reconciliation; API-1 Auth/Audit; API-2 Support; API-3 CMS verification; Marketplace/RFQ audit.
- API-5 Retail and API-6 Finance remain blocked until explicit commercial/accounting/legal approval.

## Agent execution rules

- Work autonomously; do not ask the owner to collect logs or run routine commands.
- Execute heavy checks sequentially to control memory. Avoid persistent log-following processes.
- No concurrent edits to shared files. Lead owns shared registries, app registration, Prisma schema/migrations, seed orchestrator, package manifests, shared exports and global tokens.
- Do not create branches/worktrees/PRs. Domain agents return scoped patches; lead integrates serially on main.
- Do not claim PASS without observed successful output. Distinguish PASS / FAIL / BLOCKED / NOT RUN.
- No destructive database, Docker or Git operations without explicit owner approval.

## Required handoff

Persian report with: phase, exact SHA, files changed, commands and exit codes, test counts, seed outcome, browser evidence, blockers, commit SHA and remote main verification.

## Source of truth

Code + observed runtime > current contracts/decisions > this handoff > historical WORKLOG entries. Older claims are not proof of current behavior.
