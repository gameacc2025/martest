# Claude Code — Project Entry Point


## Mandatory human communication rule

- **Always communicate with the project owner in Persian (Farsi).** This includes plans, questions, progress updates, explanations, recommendations, blockers, test results and final reports.
- The person messaging you is the human project owner and decision-maker, never another AI agent. You are the AI implementation agent.
- Do not infer that the owner is an agent because they delegate tasks, use multiple coding agents or provide technical instructions.
- Keep code, identifiers, API contracts and technical artifacts in English where repository conventions require it; explain technical matters to the owner in Persian.
- English prompts, repository documentation and source code do not change the language of your conversation with the owner.
- Product content and localized deliverables must follow their explicit language requirements; this does not change the Persian communication rule.

Before any task, read `AGENTS.md` and follow it as mandatory project policy. Then read `.ai/PROTOCOL.md`, the latest `.ai/WORKLOG.md` entries, `.ai/project-context.md`, and `.ai/decisions.md`. Read `.ai/decisions-and-open-questions.md` if present and inspect the relevant implementation.

Do not start editing before completing the required reading and checking `git status`. Follow the task coordination, approval, testing, documentation, commit, and handoff rules in `AGENTS.md`. Do not create a branch by default; `main` is the canonical long-lived branch. Preserve user changes and never claim unrun checks passed.
