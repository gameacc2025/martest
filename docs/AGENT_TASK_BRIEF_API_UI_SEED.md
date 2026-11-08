# Agent Task Brief — API + UI + Realistic Seed

Use this document as the common instruction block when launching a coding agent for one lane in `docs/API_UI_SEED_EXECUTION_ROADMAP.md`.

## Assignment header

Fill these values before starting the agent:

- **Task ID:** `API-UI-SEED-<LANE>-<SEQUENCE>`
- **Lane:** `M0 | API-1 | API-2 | API-3 | API-4 | API-5 | API-6 | INT`
- **Base main SHA:** exact SHA from `git rev-parse origin/main` (or latest fetched main ref)
- **Owner:** agent name
- **Allowed files:** exact paths/directories assigned in `.ai/agent-coordination/ACTIVE.md`
- **Forbidden files:** shared files owned by INT and every other lane's paths
- **Acceptance tests:** exact test files/commands copied from the domain contract

## Copyable agent instruction

You are an implementation agent for the Telecom Marketplace monorepo. Complete only the assigned lane and task ID. Do not expand scope.

### 1. Required context before editing
1. Read root `AGENTS.md` and `.ai/PROTOCOL.md` completely.
2. Read `.ai/current-task.md`, the latest 10 relevant entries in `.ai/WORKLOG.md`, `.ai/project-context.md`, `.ai/decisions.md` and `.ai/decisions-and-open-questions.md`.
3. Read `.ai/UI_SKILLS.md` and the relevant installed UI skill instructions before any UI change.
4. Read `docs/API_UI_SEED_EXECUTION_ROADMAP.md`, `.ai/agent-coordination/ACTIVE.md`, and the existing canonical domain design/API/database documents.
5. Inspect the actual Prisma schema/migrations, backend routes/services, permissions, API-client conventions, Vue pages/components, package scripts and tests. Do not trust stale documentation over source.
6. Record the exact base `main` SHA and inspect the working tree before edits.

### 2. Branch and parallel-work policy
- The owner requires direct-to-`main` work. Do not create a local or remote branch, temporary branch, or PR.
- If multiple agents run in parallel, work in an isolated detached worktree/checkout pinned to the recorded main SHA. Do not share a mutable checkout with another agent.
- Do not commit your isolated worktree to a branch. Return a patch/diff and a list of changed files to INT.
- Only INT integrates reviewed patches. INT fetches the latest main, applies one patch at a time, runs checks and creates small direct-to-main commits.
- Never force-push, reset user changes, or edit another lane's owned files.

### 3. Scope and implementation rules
- Deliver a complete vertical slice: backend API + validation + authorization + persistence + API client/store + actual UI + realistic synthetic seed + tests + docs.
- Use existing Fastify/Prisma/Vue/Pinia/PrimeVue/JavaScript architecture. Do not introduce TypeScript, Axios, a new UI kit or unnecessary dependencies.
- Reuse existing Prisma models. Do not create duplicate tables/models. If a schema gap exists, provide evidence and a migration proposal to INT; schema/migrations are serialized by INT.
- Keep STAFF, COMPANY and CUSTOMER contexts separate. Authorization and ownership checks must run server-side; hiding a UI action is not security.
- Use the existing shared fetch/API client. Do not add direct fetch/Axios paths around the project's client.
- Use real APIs in final UI. Mock data is allowed only in tests or explicitly isolated demo previews; never make a prototype-only UI look complete.
- Preserve current business decisions and the AD-4 B2C commerce freeze. API-5 and API-6 stay blocked until their approval gates are satisfied.

### 4. Palette contract — mandatory for all UI work
- The Website's approved visual language is the source of truth for Website, Admin and Company.
- `packages/shared-ui/assets/design-system/newtemp-reference.scss` owns shared root tokens and must be loaded last by all three app entrypoints.
- Website `apps/website/src/assets/marketplace-theme.scss` is component/layout styling only; do not reintroduce root-level brand/surface/typography/radius/shadow/status tokens there.
- Use semantic shared tokens for primary/secondary actions, page/surface hierarchy, text, borders, navigation, focus, disabled/loading states, status states and shadows.
- Do not invent a panel-specific palette or paste raw hex values into shared dashboard components/pages. Scoped color literals are permitted only for intentional artwork/illustration.
- Keep RTL, Vazirmatn, light/dark parity, responsive layouts, keyboard focus and reduced-motion behavior.

### 5. Synthetic seed requirements
- Add a domain module under `backend/prisma/seeds/<domain>.js`; request INT to wire the global seed orchestrator.
- Model realistic telecom operations with fictional companies, fictional contacts, believable equipment/specifications, RFQ/support/CRM/CMS/inventory/finance scenarios as relevant.
- Clearly mark demo records with stable `DEMO-`/`SYN-` identifiers and use `example.test` email domains. Do not impersonate real organizations or people.
- Never seed usable passwords, OTPs, tokens, payment credentials, live SMS/email destinations, real personal phone numbers or production data. Use provider fakes/test adapters and reserved documentation IP ranges.
- Seed must be deterministic and idempotent, use stable unique keys, respect FKs and business invariants, and refuse production execution.
- Include multiple synthetic companies/users and lifecycle/error states to exercise ownership, tenant isolation and permissions.
- Test idempotency, production refusal, relational integrity and private-field serialization.

### 6. Contract-first API
Before implementation, update/create the domain contract doc. It must state:
- method/path, auth context, permission key and ownership scope;
- request/response schemas and stable error codes;
- validation, pagination, filtering, sorting and date/timezone rules;
- transaction boundaries, idempotency and state-transition rules;
- audit, notification, attachment and redaction behavior;
- UI routes/screens and all loading/empty/error/success states;
- exact Prisma models/enums reused and whether a migration is needed;
- seed scenarios and test cases.

Freeze the contract with INT before building dependent UI. Do not silently invent unresolved business, MFA, session, SLA, publishing, CRM or accounting policies.

### 7. Verification and handoff
- Run targeted tests first, then relevant package/app tests and builds. Use repository scripts; record exact commands, exit status and summary.
- Do not claim browser/runtime/database verification if not actually performed. Use `NOT RUN` or `NOT VERIFIED` with a reason.
- Fix failures caused by your changes. Do not weaken/delete tests to obtain green status.
- Review the full diff for secrets, unrelated edits, authorization gaps, tenant leakage and documentation drift.
- Append a WORKLOG entry and return:
  1. Task ID/lane/base main SHA/status.
  2. Exact changed files and excluded shared files.
  3. API contract and permissions/ownership.
  4. Prisma models and migration proposal or `NONE`.
  5. UI screens and real API integration.
  6. Seed scenarios, fixture counts, idempotency and production guard.
  7. Exact test commands/results and unverified checks.
  8. Risks, decisions needed and patch/integration instructions.

## Lane-specific reading and dependencies

| Lane | Read first | Gate |
|---|---|---|
| M0 | Design-system docs, NewTemp reference, shared tokens, all app entrypoints, dashboard/layout components | Must pass before API UI work |
| API-1 | AuthChallenge, AuditLog, RefreshToken, auth routes/services/plugins, permissions, auth seed | MFA and concurrent-session policies must be explicit |
| API-2 | Support schema/models, notification/file infrastructure, TicketDeskWorkspace and existing support prototypes | SLA/attachment/notification contracts frozen |
| API-3 | CMS schema, current static FAQ/magazine/pages, media storage and public routes | Editorial roles, locales and publish workflow frozen |
| API-4 | CRM schema, Company/User/Inquiry identities, current CRM prototypes | Ownership, deduplication and conversion semantics frozen |
| API-5 | Retail/inventory/order/payment/fulfillment/return schema and AD-4 decision | Blocked pending commercial approval |
| API-6 | Finance/commission/ledger/settlement schema and accounting docs | Blocked pending accounting/legal/provider approval |
| INT | Shared app registration, permissions, seed orchestrator, Prisma schema/migrations, package manifests | Serializes all shared-file integrations |
