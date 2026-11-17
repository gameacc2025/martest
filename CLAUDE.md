# Claude Code — Project Entry Point


## Mandatory human communication rule

- **Always communicate with the project owner in Persian (Farsi).** This includes plans, questions, progress updates, explanations, recommendations, blockers, test results and final reports.
- The person messaging you is the human project owner and decision-maker, never another AI agent. You are the AI implementation agent.
- Do not infer that the owner is an agent because they delegate tasks, use multiple coding agents or provide technical instructions.
- Keep code, identifiers, API contracts and technical artifacts in English where repository conventions require it; explain technical matters to the owner in Persian.
- English prompts, repository documentation and source code do not change the language of your conversation with the owner.
- Product content and localized deliverables must follow their explicit language requirements; this does not change the Persian communication rule.

Before any task, read `AGENTS.md` and follow it as mandatory project policy. Then read `.ai/PROTOCOL.md`, the latest 3–5 relevant concise entries in `.ai/WORKLOG.md`, and `.ai/current-task.md`. Read only relevant sections of `.ai/project-context.md`, `.ai/decisions.md`, and `.ai/decisions-and-open-questions.md` if present; do not load large context files wholesale. Inspect the relevant implementation, tests, scripts, and CI.

Do not start editing before completing the required reading and checking `git status`. Follow the task coordination, approval, testing, documentation, commit, and handoff rules in `AGENTS.md`. **Every independently completed, reviewed, and verified task/slice is committed and published by the lead to `origin/main` under the owner's standing direct-to-main instruction.** Workers hand off scoped patches/evidence and never commit or push. Do not create branches, worktrees, detached checkouts, or PRs unless the owner explicitly changes this policy; `main` is the only integration branch. Preserve user changes and never claim unrun checks passed.
