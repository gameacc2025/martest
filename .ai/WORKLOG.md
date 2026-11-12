# Project Worklog — Compact Index

This file is a concise navigation and current-state index, not a raw transcript archive. Detailed historical implementation and commit evidence remains in Git history. Append only concise, verified entries (target 10–25 lines per task); never paste raw logs or duplicate full reports.

## 2026-11-13 — PHASE-0-DOC-AUDIT — Documentation and agent-memory normalization
- **Status:** DONE for remote documentation edits; local workspace/runtime verification remains NOT RUN.
- **Repository:** `gameacc2025/martest`, branch `main`.
- **Audited base:** `928c221e50f8470f60b1a475c90cebf21b8b16f7`.
- **Confirmed:** current-task was 153,075 chars / 1,368 lines and contained merge-conflict markers; WORKLOG was 547,035 chars / 4,393 lines; README language contradicted AGENTS; AI workflow contradicted itself and owner branch policy; browser-testing prohibition was stale relative to owner's later explicit Playwright authorization; ACTIVE board was stale.
- **Changes:** compacted current-task and WORKLOG; reset ACTIVE board to audit-first; aligned Persian communication, main-only/no-worktree policy, and explicit Playwright authorization in root instructions.
- **Verification:** remote source files fetched from main and inspected. No local Git commands, Docker commands, database commands, builds, unit tests, or browser tests were run in this remote documentation pass.
- **Commit/push:** see commits created by this documentation update; verify remote main after each update.
- **Next:** local/runtime reconciliation and CRM acceptance; see `.ai/current-task.md`.

## Current verified project facts (source-level only)
- Monorepo: Vue 3/Vite/Pinia/PrimeVue frontend apps; Fastify/Prisma/PostgreSQL backend; JavaScript.
- Apps: `apps/website` CUSTOMER, `apps/company` COMPANY, `apps/admin` STAFF.
- Shared packages: `api-client`, `auth`, `permissions`, `shared-core`, `shared-ui`, `vite-config`.
- API prefix: `/api/v1`.
- Canonical branch: `main`; no branches, worktrees, detached checkouts or PRs.
- Browser automation is authorized for the current CRM acceptance workflow; run sequentially and record evidence.
- Retail/API-5 and Finance/API-6 require explicit owner business-policy approval.

## Latest reported CRM state — NOT independently re-verified here
- Agent recap reported 1,531 backend tests, Admin build and API client tests passing, and Docker seed running.
- Remaining reported work: Playwright PKCE/session persistence and real CRM visual/browser workflows.
- Earlier observed Docker failure: `backend/prisma/seeds/cms.js` could not resolve `../src/utils/password`. A later agent recap claimed the seed runs; resolve this discrepancy by inspecting current code and rerunning safely against development DB.
- Treat all above as reported claims until exact current-run output and exit codes are recorded.

## Worklog rules
- Keep each new entry concise: task ID, status, scope, changed paths, exact checks/results, commit SHA, push verification, blockers, next action.
- Do not store credentials, secrets, personal data, full command logs, or repeated implementation summaries.
- Use Git history for detailed historical task chronology; link commit SHAs rather than copying old entries.
