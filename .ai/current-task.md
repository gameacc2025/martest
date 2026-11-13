# Current Task — Agent Delegation / Phase 0 Baseline

**Updated:** 2026-11-14  
**Status:** READY FOR DELEGATION — documentation and task breakdown published; no code implementation ticket has started.  
**Repository:** `gameacc2025/martest`  
**Branch:** existing `main` only.  
**Source-audit code baseline:** `ace67cccc6a4b09b8cf8258dc814aedbb5d0b71b`  
**Phased task plan:** [`docs/AGENT_TASKS_PHASED_PLAN.md`](../docs/AGENT_TASKS_PHASED_PLAN.md)  
**Coordination / claims:** [`.ai/agent-coordination/ACTIVE.md`](agent-coordination/ACTIVE.md)  
**Domain backlog:** [`docs/REMAINING_FEATURES_IMPLEMENTATION_BACKLOG.md`](../docs/REMAINING_FEATURES_IMPLEMENTATION_BACKLOG.md)

## Immediate next action

**BASE-01 — Current-main workflow evidence audit (read-only).**

Inspect the current remote `main` HEAD and GitHub Actions runs. For each CI, migration, runtime, seed and Playwright result, record the exact tested SHA and classify it as current-HEAD evidence or historical. Do not edit application code and do not infer success from an older commit.

After BASE-01 begins, independent read-only inventories may proceed: SUP-01, CMS-01, NTF-01, AUD-01 and DASH-05. CRM implementation starts at CRM-01 only after the baseline gate and an explicit file-ownership assignment.

## Known open work

- **CRM:** route schemas outside Leads, complete permission/tenant tests, conversion/merge transactional safety and mutation E2E.
- **Support:** private attachments, business-hours SLA/pause-resume/escalation, queue/assignment coverage and notification integration.
- **CMS:** resolve Featured contract without assuming a new DB column; test five Admin workspaces, public FAQ/static pages, sanitization and media authorization.
- **Notifications:** IN_APP/EMAIL pipeline exists; SMS is explicitly unavailable.
- **Audit:** read/search/export exists; event producer coverage, redaction and retention remain unproven.
- **Dashboards:** Admin sample values and orders/inquiries semantic mismatch; some Company panels are sample data.
- **Regression:** all P0 quality gates must be rerun against the current code SHA. Previous green runs belong to baseline `0d0a386` only.
- **Local environment:** Windows working tree, local Docker and PostgreSQL are `NOT VERIFIED`.

## Delegation rules

1. One bounded ticket per agent at a time; use the IDs and dependencies in the phased plan.
2. Claim the ticket in ACTIVE.md and WORKLOG before editing; no duplicate claims.
3. Parallelize read-only audits. Serialize writes to shared files and shared main working tree.
4. Workers do not commit/push and do not create branches, worktrees, detached checkouts or PRs. Lead alone reviews and integrates each verified task directly on `main`.
5. No destructive Git/DB/Docker action, no user-data deletion, and no migration/security/financial change without required approval.
6. Report exact commands and observed test results. Mark unrun/unavailable checks `NOT RUN` / `NOT VERIFIED`.

## Historical verification note

The previously recorded CI, fresh PostgreSQL migration, runtime/seed and 8/8 Playwright PASS evidence is tied to code baseline `0d0a3866c6ff387978f8c5244f6ca936248f508d` (Actions: [CI](https://github.com/gameacc2025/martest/actions/runs/43474183592), [Migration](https://github.com/gameacc2025/martest/actions/runs/43474183157), [Runtime](https://github.com/gameacc2025/martest/actions/runs/43474183935)). It is not current-HEAD validation. The current task is to re-establish that evidence, not to repeat old PASS claims.
