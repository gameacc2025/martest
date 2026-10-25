# Mandatory AI Agent Rules — Telecom Marketplace


## Mandatory user-facing language

- **Always communicate with the user in English, regardless of the language the user uses to message you.** This applies to plans, clarifying questions, progress updates, explanations, recommendations, commit summaries, and final reports.
- Do not switch the conversation language just because the user writes in Persian or another language.
- This rule governs agent-to-user communication, not the language required inside the product: when implementing localized UI, translations, sample content, or other explicitly requested deliverables, follow the product requirements and the user's requested deliverable language while keeping explanations to the user in English.
- Keep code identifiers, API names, logs, and quoted source text unchanged when necessary for accuracy; explain them in English.

**Read this file before doing anything else in this repository.** These rules apply to every AI agent, coding assistant, automated worker, and human following the agent workflow. If another instruction conflicts, follow the more restrictive rule and explain the conflict.

## Required reading order

Before planning, editing, running migrations, or executing write commands:

1. Read this file completely.
2. Read `.ai/PROTOCOL.md` and the latest entries in `.ai/WORKLOG.md`.
3. Read `.ai/project-context.md`, `.ai/decisions.md`, and `.ai/decisions-and-open-questions.md` if that file exists.
4. Read `Telecom_Marketplace_Project_Architecture_and_Roadmap.md` and the relevant area of `docs/`.
5. Inspect the actual implementation, tests, package scripts, and configuration relevant to the task. Documentation is not proof of current behavior.
6. Run `git status --short --branch` and inspect the current branch and recent commits before changing anything.

If any required file is missing, record that fact and continue with the remaining sources; never pretend it was read.

## Source of truth and project memory

- The canonical remote repository is `gameacc2025/martest`; the canonical branch is `main`.
- The repository files and tested implementation are the source of truth for current behavior. Documentation records intended behavior and decisions; report conflicts instead of silently choosing.
- `.ai/WORKLOG.md` is the durable task journal. Update it after claiming a task, after meaningful milestones when useful, and before handing work off.
- `.ai/current-task.md` records the current focus and must be updated when the active task changes; do not overwrite useful history—move completed task details into WORKLOG first.
- `.ai/project-context.md` captures durable architecture/current-state facts. Update it only when the facts actually change.
- `.ai/decisions.md` and `.ai/decisions-and-open-questions.md` capture decisions and unresolved questions. Do not convert an assumption into an accepted decision.
- Never claim to have updated ChatGPT's private memory. Project memory means version-controlled files in this repository.

## Task coordination and planning

1. Search WORKLOG and current-task for an existing task or another agent's active claim. Do not duplicate or overwrite an active task. If coordination is unclear, document the conflict and stop before overlapping edits.
2. Write a short task claim with ID, objective, scope, owner/agent, start date, and expected verification in WORKLOG/current-task.
3. Inspect call sites, API contracts, authorization, data ownership, tests, and related frontend/backend layers before proposing implementation.
4. State the observed behavior, expected behavior, evidence/root cause, files likely to change, risks, and verification plan.
5. For destructive, schema/data, security/auth, permission, deployment, broad refactor, or materially ambiguous changes, present the plan and wait for explicit user approval. For small, reversible, clearly requested changes, proceed after recording a concise plan; do not create needless approval gates.
6. Keep changes minimal and scoped. Do not opportunistically redesign, reformat unrelated files, add dependencies, or change business rules.

## Repository and branch discipline

- Work from the canonical `main` branch unless the user explicitly authorizes a different branch or an environment requires a temporary branch. Do not create feature branches by default; the repository owner currently wants a single long-lived branch.
- Before editing, check for uncommitted changes. Preserve user changes. Never use `git reset --hard`, `git clean -fd`, force-push, history rewriting, or destructive checkout commands to make the workspace convenient.
- If uncommitted changes exist, inspect and isolate them. Do not stage unrelated files or commit another person's work.
- Never delete a branch or repository without explicit confirmation. If the task is to retain only main, first verify that any other branch's unique commits are safely integrated and explain whether deletion is actually available.
- Use small, meaningful commits after verification. Do not amend or rewrite existing commits unless explicitly requested.
- Push only when the user has authorized pushing in the current task/workflow, the intended target is confirmed, and verification is complete. Never push secrets or environment files.
- If multiple agents share one checkout, use WORKLOG claims and coordinate before editing or committing. Avoid simultaneous writes to the same files.

## Implementation and quality gates

- Follow existing stack and patterns: Vue 3/Vite/Pinia/PrimeVue frontend, JavaScript (do not introduce TypeScript without approval), Fastify/Prisma/PostgreSQL backend, pnpm workspace plus standalone `backend/`.
- `@telecom/api-client` is the canonical frontend API client; inspect existing usage before adding direct HTTP calls.
- Backend authorization is authoritative. Check ownership and permissions in backend services/routes, not only in UI.
- Preserve established domain boundaries: CUSTOMER in Website, COMPANY in Company Portal, STAFF in Admin. STAFF is not automatically a seller/company.
- Preserve existing visual identity unless a UI redesign is explicitly requested: primary `#01bec2`, Vazirmatn, 4px spacing base, 8px radius. Admin/Company use the established PrimeVue system.
- Do not alter migrations, production data, authentication/security, permissions, payment/financial rules, or public commerce/RFQ rules without tracing the relevant decisions and getting approval when the change is consequential.
- Add or update tests for changed behavior. Run the narrowest relevant tests first, then appropriate package/backend tests and builds. Inspect actual scripts before assuming commands.
- Never state a test, build, SMTP delivery, migration, or deployment passed unless it was actually run and its result observed. Mark unrun checks as `NOT RUN` and unknown behavior as `NOT VERIFIED`.
- Do not expose credentials, tokens, private user data, or secrets in logs, commits, test fixtures, or documentation.

## Documentation and memory updates are part of the task

Before declaring a task complete:
- Update WORKLOG with summary, files, commit SHA(s), tests and exact outcomes, unresolved issues, and next steps.
- Update `.ai/current-task.md` to the current state or next actionable task.
- Update project-context, architecture docs, API docs, or decisions only where the implementation/decision changed; link to the relevant source files.
- If a task changes a domain or contract, document compatibility and migration implications.
- Ensure the final report distinguishes completed, tested, not tested, and blocked work.

## Commit protocol

1. Review `git diff --check`, `git diff --stat`, and the full diff.
2. Check for secrets, accidental generated files, unrelated changes, and updated tests/docs.
3. Run applicable tests/builds and record command + result.
4. Stage explicit file paths only; inspect `git diff --cached`.
5. Commit using a clear conventional message, e.g. `fix: enforce company ownership for product updates` or `docs: define mandatory agent workflow`.
6. Record the commit SHA and validation evidence in WORKLOG.
7. Push only when authorized and safe; verify remote HEAD after pushing.

## Handoff / final response format

Always report:
- Task and outcome
- Key files changed
- Tests/builds actually run and results
- Commit SHA and push/PR status, if applicable
- Risks, blocked items, and `NOT VERIFIED` items
- Exact next step, if any

Do not say “done” for partially implemented or unverified work. If context is running low, first write a durable handoff in WORKLOG and current-task, then report the remaining work.
