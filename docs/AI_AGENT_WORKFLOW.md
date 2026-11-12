# AI Agent Workflow and Project Memory


## Language of communication

All agents must communicate with the project owner in **Persian (Farsi)**, including plans, questions, progress updates, explanations, recommendations, blockers, test results and final reports. The project owner is the human decision-maker, never another AI agent. The language of product deliverables (for example, Persian UI copy or translation files) should follow the product requirements or explicit deliverable request; the agent's explanations to the user must still be in Persian.

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


## Mandatory UI/UX skills

Every meaningful UI change must follow `.ai/UI_SKILLS.md` and load the relevant installed skill instructions before editing. The shared toolkit is UI UX Pro Max, Taste Skill, Impeccable, and Vercel Web Design Guidelines. Use each skill according to the surface and task type, while preserving the repository's Vue/PrimeVue/Tailwind architecture, current design system, Persian/RTL support, accessibility, API contracts, and business behavior. Do not follow a generic recommendation that conflicts with an explicit product decision.

Install/update the agent skills from the repository root in PowerShell with:

```powershell
.\scripts\install-ui-skills.ps1
```

Browser automation is explicitly authorized for the current CRM acceptance workflow. Use Playwright CLI for real workflows, run browser sessions sequentially to control memory, close them after use, and record evidence. For unrelated tasks, use browser testing when the acceptance criteria require it; do not assume a blanket prohibition. See `.ai/UI_SKILLS.md` for the complete routing and verification policy.


## Mandatory per-task Git and GitHub publishing

Every independently completable task or subtask must be committed and published to GitHub immediately after it is completed, reviewed, and its relevant checks/documentation are updated. Do not batch several finished tasks into a later commit.

Parallel agents must not create branches, worktrees, detached checkouts or PRs. They work in the existing main checkout only under lead-assigned, non-overlapping file ownership. To avoid concurrent working-tree conflicts, execute independent inspection tasks in parallel only when read-only; serialize all writes. Workers do not commit or push. The lead reviews and integrates one scoped change at a time on `main`, then verifies the remote SHA.

A task is not fully handed off until its commit SHA and GitHub push status are recorded in `.ai/WORKLOG.md`, and `.ai/current-task.md` plus relevant docs are synchronized. If commit/push cannot happen, explicitly mark `NOT COMMITTED` / `NOT PUSHED`, explain the blocker, preserve the patch, and never claim synchronization. Apply this cycle to each independently verifiable slice, not only at the end of an entire feature lane.
