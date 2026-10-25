# AI Agent Workflow and Project Memory

**Mandatory companion:** [`AGENTS.md`](../AGENTS.md). All agents must read it and [`.ai/PROTOCOL.md`](../.ai/PROTOCOL.md) before work.

## Why this exists

The repository is the shared memory for all coding agents. Conversations and model-specific memories are not durable project state. Decisions, task progress, verification evidence, and handoffs belong in version-controlled Markdown.

## Start every task

1. Read root `AGENTS.md`, `.ai/PROTOCOL.md`, recent `.ai/WORKLOG.md` entries, and `.ai/current-task.md`.
2. Read `.ai/project-context.md`, `.ai/decisions.md`, and any applicable open questions.
3. Read relevant architecture, API, database, deployment, and frontend docs plus the actual implementation.
4. Inspect `git status --short --branch` and recent commits. Preserve existing changes.
5. Claim the task, define acceptance criteria, and plan before implementation. For high-impact or ambiguous work, wait for approval.

## Shared memory map

- `AGENTS.md`: universal repository rules.
- `CLAUDE.md`: Claude Code entrypoint that points to the universal rules.
- `.github/copilot-instructions.md`: GitHub Copilot entrypoint.
- `.ai/PROTOCOL.md`: task lifecycle and completion checklist.
- `.ai/WORKLOG.md`: append-only history of tasks, tests, commits, pushes, blockers, and next steps.
- `.ai/current-task.md`: active task/handoff, not a replacement for history.
- `.ai/project-context.md`: durable architecture and current implementation facts.
- `.ai/decisions.md`: accepted architectural decisions and their rationale.
- `.ai/decisions-and-open-questions.md`: open questions and explicit decisions, when present.
- `Telecom_Marketplace_Project_Architecture_and_Roadmap.md`: product/domain vision and roadmap.

## Completion is not just code

A task is complete only when applicable tests/checks have been run and reported honestly, the diff is reviewed, relevant documentation is updated, and the worklog records the outcome and commit. Push state must be explicit. External integrations such as SMTP are not considered live-verified by unit tests alone.

## Branch and commit discipline

`main` is the only intended long-lived branch. Do not create feature branches by default. Never rewrite history or discard user work. Commit verified, scoped changes with a descriptive message. Push only when authorized. Never delete a branch without verifying that its work is safely integrated and that deletion is authorized and supported.

## Agent handoff

At the end of a session, record what changed, commands and results, commit SHA, push state, open risks, and one actionable next step in `.ai/WORKLOG.md` and `.ai/current-task.md`. The next agent must read that handoff before continuing.
