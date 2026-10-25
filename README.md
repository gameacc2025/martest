# Telecom Marketplace


**Language rule for agents:** Always respond to the user in English, regardless of the language they use. Only explicitly requested localized deliverable content may use another language; agent explanations and reports remain English.

A Persian B2B telecom equipment marketplace built as a pnpm monorepo with three Vue frontend applications and a shared Fastify/Prisma backend.

## Start here — mandatory for every AI agent

1. Read [`AGENTS.md`](AGENTS.md) before doing anything.
2. Read [`.ai/PROTOCOL.md`](.ai/PROTOCOL.md), recent [`.ai/WORKLOG.md`](.ai/WORKLOG.md) entries, and [`.ai/current-task.md`](.ai/current-task.md).
3. Read [`.ai/project-context.md`](.ai/project-context.md), [`.ai/decisions.md`](.ai/decisions.md), and the relevant architecture/domain docs.
4. Inspect the actual code and `git status --short --branch` before editing.

**Do not begin implementation before this reading and repository-state check.** High-impact or ambiguous changes require a plan and explicit approval. Every task must record tests, changes, commit/push state, blockers, and next steps in project memory.

## Project layout

- `apps/website` — public Website / CUSTOMER experience
- `apps/company` — Company Portal / COMPANY experience
- `apps/admin` — Admin backoffice / STAFF experience
- `packages/` — shared API client, auth, permissions, core and UI packages
- `backend/` — Fastify API, Prisma, PostgreSQL integration
- `docs/` — API, database, deployment, frontend, architecture and feature docs
- `.ai/` — durable agent memory, project context, decisions, task journal and handoffs

## Technology

- Frontend: Vue 3, Vite, Pinia where used, PrimeVue for Admin/Company, JavaScript
- Backend: Node.js, Fastify, Prisma, PostgreSQL, JavaScript
- Workspace: pnpm; backend has its own package manifest/lockfile
- API prefix: `/api/v1`

## Canonical project documents

- [Architecture and roadmap](Telecom_Marketplace_Project_Architecture_and_Roadmap.md)
- [Agent workflow](docs/AI_AGENT_WORKFLOW.md)
- [Notification system](docs/NOTIFICATION_SYSTEM.md)
- [API documentation](docs/API_DOCUMENTATION.md)
- [Architecture decisions](docs/ARCHITECTURE_DECISIONS.md)
- [Backend audit report](BACKEND_AUDIT_REPORT.md)
- [Testing guide](TESTING.md)

## Core guardrails

- `main` is the only intended long-lived branch.
- Backend authorization and resource ownership are authoritative.
- CUSTOMER, COMPANY and STAFF are distinct access contexts.
- Use `@telecom/api-client` for frontend API access; follow existing project patterns.
- Do not introduce TypeScript, a second UI kit, or broad redesign without an approved reason.
- Do not claim tests, live SMTP, or deployment checks passed unless actually verified.

## Commands

Inspect the scripts before running commands. Typical workspace commands include:

```powershell
pnpm install --frozen-lockfile
pnpm test
pnpm build
npm ci --prefix backend
pnpm --dir backend test
```

Some commands may require environment variables or services such as PostgreSQL. See [Testing](TESTING.md) and [Docker deployment](docs/DOCKER_DEPLOYMENT.md).

## Working with agents

Use the shared, version-controlled memory rather than relying on chat history:
- `.ai/WORKLOG.md` — append-only task history and verification evidence
- `.ai/current-task.md` — current focus / handoff
- `.ai/project-context.md` — durable architecture and current-state facts
- `.ai/decisions.md` — accepted decisions and rationale
- `.ai/PROTOCOL.md` — task, test, commit and handoff lifecycle
