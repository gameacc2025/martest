# Current Task / Agent Handoff

## Active task
- **ID:** REPO-AGENT-RULES
- **Status:** IN_PROGRESS until all documentation commits and branch status are verified
- **Objective:** Establish mandatory agent rules, durable project memory, verification/commit workflow, and update repository documentation.
- **Canonical repository/branch:** `gameacc2025/martest` / `main`
- **Main HEAD at task start:** `ef0bda86f455ac0ea76ad0ebbcb8f4b76acde335`
- **Related feature:** Notification system merged through PR #1. GitHub Actions run `40167701297` previously passed on merged main; live SMTP connectivity/credentials were not verified by CI.
- **Required reading:** `AGENTS.md`, `.ai/PROTOCOL.md`, latest `.ai/WORKLOG.md`, `.ai/project-context.md`, `.ai/decisions.md`, and relevant docs.
- **Next steps:** Finish documentation updates, inspect branch list, verify all created files on main, then update WORKLOG with exact commits and check results.
- **Branch cleanup limitation:** Available GitHub connector actions may not include branch deletion. Do not claim `feat/notifications-complete` was deleted unless the branch list confirms it.

## Handoff rules
Before starting another task, read the latest WORKLOG entries and inspect current Git state. When this task is finished, move its durable details into WORKLOG and replace this section with the next actionable task. Never erase historical worklog entries.
