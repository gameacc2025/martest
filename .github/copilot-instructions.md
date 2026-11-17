# GitHub Copilot Instructions

## Mandatory communication language and role

- Communicate directly with the human project owner in Persian (Farsi), regardless of the language of the prompt, repository, code, or tools.
- The owner is the human decision-maker, never another AI agent. Do not address or treat the owner as an agent.
- Keep source code, identifiers, API contracts, and technical artifacts in English where repository conventions require it. Explain technical matters to the owner in Persian.
- Product deliverables must follow their explicit localization requirements; this does not change the communication language.

## Required startup

Before any repository change:
1. Read root `AGENTS.md` completely.
2. Read `.ai/PROTOCOL.md`, the current `.ai/current-task.md`, and the latest 3–5 relevant concise entries in `.ai/WORKLOG.md`.
3. Read relevant sections of `.ai/project-context.md`, `.ai/decisions.md`, `.ai/UI_SKILLS.md` (for UI work), and applicable architecture/domain docs. Missing files must be reported, not assumed.
4. Inspect the actual implementation, tests, package scripts, and CI relevant to the task. Documentation is not proof of current behavior.
5. Inspect `git status --short --branch`, current branch, and recent commits. Preserve all existing changes.

## Mandatory project constraints

- `main` is the only integration branch. Do not create branches, worktrees, detached checkouts, or pull requests unless the owner explicitly changes this policy.
- Workers do not commit or push. The lead/coordinator alone reviews, integrates, commits, and pushes scoped, verified work to `origin/main`.
- Never use `git reset --hard`, `git clean -fd`, force-push, history rewriting, or destructive checkout commands. Never discard user changes or stage all files blindly.
- Assign non-overlapping file ownership before parallel work. Shared hotspots (Prisma schema/migrations, permission registry, seed orchestrator, package manifests, app registration, shared API exports, and global design tokens) are lead-owned. Parallelize read-only audits; serialize writes.
- Follow the established stack: Vue 3/Vite/Pinia/PrimeVue frontend, JavaScript, Fastify/Prisma/PostgreSQL backend, pnpm workspace plus standalone `backend/`. Do not introduce TypeScript, another UI kit, or dependencies without explicit approval.
- `@telecom/api-client` is the canonical frontend API client; inspect existing usage before adding direct HTTP calls.
- Backend authorization and resource ownership are authoritative. Keep CUSTOMER, COMPANY, and STAFF contexts distinct.
- Preserve the established brand, RTL/Persian support, Vazirmatn, accessibility, API contracts, and business rules.
- Consequential changes to schema/data, migrations, authentication/security, permissions, payments/finance, deployment, or business rules require a written plan and explicit owner approval.

## Verification and handoff

- Add/update tests for changed behavior. Inspect actual scripts and CI before selecting commands.
- Run targeted checks first, then broader tests/builds appropriate to the scope. Never claim a check passed unless it was run and its result observed; mark unrun checks `NOT RUN` and unverified behavior `NOT VERIFIED`.
- Review the complete diff, whitespace, secrets, generated files, authorization, regressions, and documentation. Stage explicit paths only.
- Update `.ai/WORKLOG.md`, `.ai/current-task.md`, and relevant durable docs. Record exact files, commands/results, commit SHA, push/remote SHA, blockers, risks, and next action.
- Each independently verifiable task/slice is committed and published by the lead to `main` after review and successful applicable checks, under the owner's standing direct-to-main workflow. If blocked, preserve the patch and report `NOT COMMITTED` / `NOT PUSHED` truthfully.
- Never expose credentials, tokens, private user data, or secrets in logs, commits, fixtures, or documentation.

## UI/UX work

For meaningful UI/UX changes, read `.ai/UI_SKILLS.md` and the relevant installed `SKILL.md` files before editing. Follow the project's Vue/PrimeVue design system, current brand, RTL/Persian requirements, responsive behavior, keyboard access, and accessibility. Skill recommendations never override explicit product decisions or backend/API contracts. Browser testing is allowed when required by acceptance criteria or explicitly authorized; run sessions sequentially when resource limits require it and record actual evidence.

For conflicts, follow this order: explicit owner instruction and accepted product decisions; root `AGENTS.md`; `.ai/PROTOCOL.md`; relevant architecture/domain docs; tool-specific guidance. Report unresolved contradictions instead of silently choosing.
