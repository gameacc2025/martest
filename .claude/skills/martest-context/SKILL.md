---
name: martest-context
description: "Persistent project-memory layer for the martest repository. Use before exploring the repo for any normal engineering task, so Claude does not repeatedly re-scan or re-read the whole codebase across sessions. Trigger on any task touching this repo, and on the conceptual commands /context, /context-update, /context-save, /context-reset (or their natural-language equivalents: 'show project status', 'update the project context', 'save current task state', 'rebuild the project context')."
---

# martest-context

## A. Primary objective

This skill is the persistent memory/context layer for the `martest` repository
(a pnpm monorepo: Fastify+Prisma backend, 3 Vue 3 frontend apps, shared
packages).

Read `.ai/project-context.md` BEFORE exploring the repository for any normal
task. It is authoritative for high-level architecture and recent project
state. Source code remains authoritative for implementation details — see
Section L.

**Default rule: do NOT scan the entire repository for normal tasks.** Only
inspect files directly relevant to the current task. Use the context to
decide where to look, then read only that.

## B. Before every normal task

1. Read `.ai/project-context.md`.
2. Read `.ai/current-task.md` if the task continues or relates to in-flight work.
3. Inspect only files related to the task (use the Architecture/Applications/
   Backend/Frontend sections of project-context.md to find the right
   directory — don't `find` or `grep` the whole repo first).
4. If the task modifies code, run `git status` (not a full diff) to see
   what's already dirty before starting.
5. Do not scan unrelated apps/packages. Example: a question about
   authentication → read the Authentication section of project-context.md,
   then inspect only `packages/auth/`, `backend/src/plugins/auth.plugin.js`,
   and `backend/src/modules/auth/` — never the whole frontend or backend tree.

## C. Token optimization (critical)

- Never read a file unless it's relevant to the current task.
- Never re-read a file already read earlier in the same session.
- Never explain information already present in project-context.md — cite it, don't restate it at length.
- Never dump large command outputs into the conversation; summarize.
- Prefer `git log --oneline -n` over full history, `git diff --stat` before a full `git diff`.
- Never inspect `node_modules`, `dist`, `build`, `coverage`, `.git` internals, or `project-structure.txt` (a 2MB generated dump — ignore it entirely).
- Never recursively read the whole repository after this skill's context exists — that defeats its purpose.
- Do not reproduce source code in reports.

## D. Conceptual commands

**`/context`** — Print a very short project status: read `.ai/current-task.md`
and the CURRENT DEVELOPMENT STATE section of `.ai/project-context.md`, report
in ≤5 lines. No file exploration.

**`/context-update`** — Incremental update, NOT a full rebuild:
1. `git status` and `git diff --stat` (not full diffs) to see what changed.
2. Read only the changed files.
3. Update ONLY the affected section(s) of `.ai/project-context.md` (e.g. a
   backend auth change → update only the Authentication section). Never
   rewrite unrelated sections.
4. If the change reflects an architectural decision worth remembering, append
   one entry to `.ai/decisions.md` (see format in that file).

**`/context-save`** — Write current state to `.ai/current-task.md` (task,
status, files changed, test result, blockers, next step) and, if relevant,
append to `.ai/decisions.md`. Does not touch project-context.md unless
something architectural changed.

**`/context-reset`** — The ONLY operation allowed to do a full repository
scan. Re-run the full initial analysis (root config, apps, backend, packages,
DB schema, Docker, auth/RBAC, recent git history — same scope as the original
initialization) and regenerate `.ai/project-context.md` from scratch. Use
only when the user explicitly asks, or when project-context.md is
demonstrably stale/wrong in a way an incremental update can't fix.

If Claude Code's slash-command mechanism isn't available in a given session,
treat the natural-language phrasings above as equivalent triggers.

## E. Source code authority (hierarchy of truth)

1. Current source code
2. Current configuration
3. Current database/schema definitions (`backend/prisma/schema.prisma`)
4. Git history
5. `.ai/project-context.md`
6. `.ai/decisions.md`

If `.ai/project-context.md` conflicts with actual source code: **trust the
source code**, fix the context file, and mention the correction briefly in
the reply (one line — not a lecture).

## F. Safety rules for this repo

- Don't change architecture without explicit user approval.
- Don't introduce new dependencies without justification.
- Don't introduce a new frontend framework or replace PrimeVue/Tailwind — see project-context.md Frontend section for the current stack.
- Don't introduce TypeScript — this repo is plain JS throughout.
- Reuse existing shared packages (`@telecom/shared-ui`, `@telecom/shared-core`, `@telecom/auth`, `@telecom/permissions`, `@telecom/api-client`) — don't duplicate a component/helper that belongs in one of them.
- Don't modify backend APIs while doing unrelated frontend work, or vice versa.
- Don't change authentication or RBAC behavior without explicitly calling out the impact to the user first.
- Don't do broad refactors during feature work unless explicitly requested.
- Prefer the smallest safe change.
- Run relevant tests after backend code changes (`cd backend && npm test`) when practical.

## G. Reporting format

Keep reports concise — target under 10 lines. After completing a task that
touched the repo, use this structure (omit any section with nothing to say):

```
DONE
- <what changed, one line>

FILES
- <changed files, most important first>

TEST
- <actual result — only if tests were actually run>

CONTEXT
- updated: <section name> | unchanged

NEXT
- <next step, only if there is one>
```

Do not repeat the user's request back. Do not explain implementation details
unless asked. Do not provide long prose explanations by default.

## H. Failure / uncertainty

- Never claim the repo was verified if it wasn't actually inspected this session.
- Uncertain about something → say `UNKNOWN: <short reason>`, don't guess and present it as fact.
- Didn't run tests → say `NOT VERIFIED: <reason>`. Never claim tests passed without having run them.

## I. Initialization / reset process (used by /context-reset too)

1. Inspect root structure, package manager, workspace config.
2. Inspect each app (`apps/*`) — stack, purpose, structure.
3. Inspect backend (`backend/src`) — architecture, modules, auth/RBAC, DB.
4. Inspect shared packages (`packages/*`) — purpose of each.
5. Inspect `backend/prisma/schema.prisma` — models only, not every field.
6. Inspect Docker/dev setup (`docker-compose*.yml`).
7. Inspect testing setup (what has tests, what doesn't, how to run them).
8. `git log --oneline -20` and `git status` for recent state — not full history.
9. Write/overwrite `.ai/project-context.md`, compact, factual, no source code dumps.
10. Update `.ai/decisions.md` only if something in step 1–8 revealed an undocumented but clearly load-bearing architectural decision.
11. Report using the format in Section G, or the CONTEXT INITIALIZED format on first-ever init:

```
CONTEXT INITIALIZED
- Architecture: <one line>
- Apps: <one line>
- Backend: <one line>
- Frontend: <one line>
- Auth/RBAC: <one line>
- Tests: <one line>
- Context files: created
```

Never commit or push automatically. Never modify unrelated source code during
initialization.
