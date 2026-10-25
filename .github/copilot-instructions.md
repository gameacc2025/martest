# GitHub Copilot Instructions

Before changing this repository, read and follow root `AGENTS.md`. Then read `.ai/PROTOCOL.md`, recent `.ai/WORKLOG.md` entries, `.ai/current-task.md`, `.ai/project-context.md`, and `.ai/decisions.md`. Read open questions when relevant and inspect the actual implementation.

Mandatory expectations:
- Inspect `git status --short --branch` before edits and preserve user changes.
- Claim the task and record durable progress/results in `.ai/WORKLOG.md`.
- Diagnose before editing; wait for approval for destructive, security, schema/data, or ambiguous changes.
- Follow existing JavaScript, Vue 3, PrimeVue, Fastify, Prisma, and API-client patterns.
- Add/update tests and docs; never claim checks passed unless actually run.
- Review the complete diff and stage explicit paths only.
- `main` is the canonical long-lived branch. Do not create branches by default, rewrite history, discard user changes, or push without authorization.
- Record commit SHA, verification evidence, blockers, and next step in project memory.
