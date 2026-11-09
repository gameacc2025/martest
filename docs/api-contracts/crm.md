# CRM and Lead Management API Contract

**Task ID:** API-4-CRM-01  
**Status:** PARTIALLY IMPLEMENTED — backend lead workflows, CRM API client, Admin lead workspace and synthetic seed are present; remaining acceptance criteria and runtime verification are open  
**Owner lane:** API-4  
**Base branch:** main  
**Scope:** STAFF-only CRM workflows in Admin; reuse existing Company, User and Inquiry identities without rewriting those domains.

## 1. Existing foundation (verified on main)

The following Prisma models and enums already exist in `backend/prisma/schema.prisma` and were introduced by migration `20261108000400_crm`:

- `CRMAccount`, `CRMContact`, `LeadSource`, `Lead`
- `Pipeline`, `PipelineStage`, `Opportunity`, `OpportunityStageHistory`
- `CRMActivity`, `CRMTask`, `CRMNote`
- Enums: `CRMAccountType`, `CRMLeadStatus`, `CRMOpportunityStatus`, `CRMActivityType`, `CRMTaskStatus`, `CRMTaskPriority`, `CRMNoteVisibility`

No new model or migration is justified by the current roadmap requirements. Reconcile every field and relation against the schema before implementation. Do not recreate or rename existing tables.

The current backend module registry has no CRM module and `backend/src/app.js` does not register CRM routes. The API client has no CRM endpoints/API methods. The Admin OperationsHub contains sample-only CRM lead, pipeline and activity rows; these must not be represented as live data.

## 2. Critical permission separation

The existing `leads.*` permissions are already used by the Inquiry/RFQ workflow and are granted to COMPANY and CUSTOMER roles in the base seed. They are NOT CRM permissions.

CRM endpoints MUST use a new `crm.*` permission namespace and strict STAFF access context. Never authorize CRM using `leads.read`, `leads.create`, `inquiries.*`, role name, wildcard alone, or frontend visibility.

Proposed permission keys (INT must register these in the shared permission catalogue and STAFF role assignments):

- `crm.dashboard.read`
- `crm.leads.read`, `crm.leads.create`, `crm.leads.update`, `crm.leads.assign`, `crm.leads.convert`, `crm.leads.merge`, `crm.leads.export`
- `crm.accounts.read`, `crm.accounts.create`, `crm.accounts.update`
- `crm.contacts.read`, `crm.contacts.create`, `crm.contacts.update`
- `crm.sources.read`, `crm.sources.manage`
- `crm.pipelines.read`, `crm.pipelines.manage`
- `crm.opportunities.read`, `crm.opportunities.create`, `crm.opportunities.update`
- `crm.activities.read`, `crm.activities.create`
- `crm.tasks.read`, `crm.tasks.create`, `crm.tasks.update`, `crm.tasks.assign`
- `crm.notes.read`, `crm.notes.create`

The exact catalogue registration and role grants are coordinator-owned because `backend/prisma/seed.js` is a shared hotspot. Until these keys are registered and assigned to intended STAFF roles, endpoints must fail closed (403), not fall back to legacy permissions.

## 3. Access, ownership and privacy rules

- CRM is STAFF-only. Every route must combine `requireExactAccessType('STAFF')` (or the repository's equivalent strict helper) with its specific `crm.*` permission.
- Reject COMPANY and CUSTOMER contexts even if they hold wildcard or legacy `leads.*` permissions.
- Every owner/assignee ID must resolve to an active STAFF AccessProfile. Never assign CRM work to COMPANY or CUSTOMER users.
- All CRM list/detail queries must apply authorization in the service layer as well as route guards.
- `CRMNote.visibility=PRIVATE` is visible only to its author and explicitly privileged STAFF users; TEAM notes require CRM read access. Never leak private note bodies through dashboard aggregates or unrelated account/lead projections.
- Do not return password hashes, refresh tokens, access tokens, OTP/challenge material, or unrelated profile metadata.
- Use safe allowlisted projections; never serialize Prisma records wholesale.

## 4. Conservative lifecycle rules

- Lead statuses use the existing enum: NEW → CONTACTED → QUALIFIED → CONVERTED, with terminal DISQUALIFIED, DUPLICATE and LOST states. Validate allowed transitions in a service command; do not accept arbitrary status changes via generic PATCH.
- Every lead has one STAFF owner. On creation default owner to the authenticated STAFF actor; reassignment requires `crm.leads.assign`.
- Score is an integer from 0 through 100. Do not infer a score from personal/sensitive attributes.
- Duplicate detection is advisory only (normalized email/phone and name/company similarity). Never auto-merge or auto-delete. Explicit merge requires `crm.leads.merge`, an audit trail, and preservation of the surviving lead's history.
- Lead conversion is an explicit transactional command. It creates or links one CRMAccount and its primary CRMContact, records converter/time, and transitions the lead to CONVERTED. Enforce idempotency: repeated conversion of the same lead returns the already-linked account rather than creating duplicates. A lead cannot be converted twice into different accounts.
- Link an existing Company/User only after exact ID selection and validation. Do not silently create or modify marketplace Company/User identities during CRM lead conversion.
- Opportunity stage changes must validate that the target stage belongs to the same pipeline and append immutable `OpportunityStageHistory` in the same transaction. WON/LOST stage flags and `CRMOpportunityStatus` must remain consistent.
- Activity records are append-only interaction history (CALL, EMAIL, MEETING, NOTE, OTHER). Correct mistakes by recording a follow-up/correction, not rewriting historical events.
- Tasks have an assigned STAFF user, creator STAFF user, status, priority and optional due date. Completion sets `completedAt`; reopening clears it consistently.
- Amounts in dashboard analytics must be grouped by currency. Never add different currencies into one total.

## 5. Proposed REST contract

Base path: `/api/v1/crm`. Use the existing Fastify response/error envelope and pagination helpers.

### Dashboard
- `GET /dashboard?from=&to=&timezone=` — CRM counts, lead conversion funnel, overdue/open task counts, opportunity totals grouped by currency and stage. All aggregates are live and permission-scoped.

### Lead sources
- `GET /lead-sources` — active sources for forms and filters.
- `POST /lead-sources`, `PATCH /lead-sources/:id` — STAFF source management.

### Leads
- `GET /leads?page=&limit=&search=&status=&sourceId=&ownerUserId=&scoreMin=&scoreMax=&createdFrom=&createdTo=&sortBy=&sortOrder=`
- `POST /leads`
- `GET /leads/:id`
- `PATCH /leads/:id` — editable contact/display fields and score only; not owner/status/conversion fields.
- `POST /leads/:id/assign` — explicit owner change.
- `POST /leads/:id/status` — validated lifecycle transition.
- `GET /leads/:id/duplicates` — advisory candidates only.
- `POST /leads/:id/merge` — explicit merge with target lead ID and reason; preserve related activities/tasks/notes/history.
- `POST /leads/:id/convert` — transactional/idempotent conversion to account/contact.
- `GET /leads/:id/timeline` — chronological activities, tasks and notes, with private-note filtering.

### Accounts and contacts
- `GET /accounts`, `POST /accounts`, `GET /accounts/:id`, `PATCH /accounts/:id`
- `GET /accounts/:id/contacts`, `POST /accounts/:id/contacts`, `PATCH /contacts/:id`
- Validate unique Company/User links and avoid duplicate CRM account identities.

### Pipelines and opportunities
- `GET /pipelines`, `POST /pipelines`, `PATCH /pipelines/:id`
- `POST /pipelines/:id/stages`, `PATCH /pipelines/:id/stages/:stageId`
- `GET /opportunities`, `POST /opportunities`, `GET /opportunities/:id`, `PATCH /opportunities/:id`
- `POST /opportunities/:id/stage` — atomic stage update + immutable history.

### Activities, notes and tasks
- `GET /activities`, `POST /activities`
- `GET /tasks?status=&assigneeUserId=&dueBefore=&overdue=`, `POST /tasks`, `PATCH /tasks/:id`, `POST /tasks/:id/assign`, `POST /tasks/:id/complete`
- `POST /notes`, `GET /notes?leadId=&accountId=&opportunityId=`
- Each child record must reference at least one valid CRM parent and must not reference unrelated parents outside the same CRM context.

## 6. Admin UI acceptance

Replace sample-only CRM arrays currently exposed through OperationsHub CRM modules with real API-backed workflows. Keep the Website-approved shared palette and Persian RTL patterns.

Required surfaces:
- Lead inbox: search, filters, pagination, owner, source, score, status and created date.
- Lead detail: contact/company info, lifecycle, owner assignment, duplicate suggestions, timeline, notes/tasks and explicit conversion.
- Pipeline Kanban: opportunities grouped by stages; keyboard-accessible stage change and visible pending/error states.
- Account/contact detail and opportunity CRUD.
- Activity/task agenda with overdue and upcoming queues.
- Dashboard with real aggregates and separate currency totals.

Every screen must have loading, empty, error, success and permission-denied states. Do not display seeded/example metrics as live production values.

## 7. Seed contract

Add `backend/prisma/seeds/crm.js` only after confirming the seed entrypoint contract. Use deterministic unique identifiers (for example `DEMO-CRM-LEAD-001`, `DEMO-CRM-OPP-001`) and `example.test` addresses. Seed plausible telecom leads from web forms, trade events, referrals, inbound calls and RFQ signals; synthetic accounts/contacts, multiple pipeline stages, opportunities in open/won/lost states, activities and overdue/upcoming tasks.

Requirements:
- Idempotent upserts using stable unique keys.
- Use existing synthetic STAFF users and Company/User records only after verifying their AccessProfile contexts.
- Demo records clearly marked; no real personal data, credentials, OTPs or routable contact details.
- Production guard must refuse demo fixtures in production.
- Never create fake audit actors or impossible status combinations.
- Add tests for repeated-run idempotency, relation integrity, production refusal and private-note redaction.

## 8. Tests and acceptance criteria

- Route tests: unauthenticated 401; COMPANY/CUSTOMER denied even with legacy `leads.*`; STAFF without the exact `crm.*` permission denied; authorized STAFF succeeds.
- Service tests: filters/pagination; active STAFF assignment; lead lifecycle; duplicate suggestions without automatic merge; explicit merge preserving relations; conversion idempotency/concurrency; pipeline stage ownership and history; task completion; private-note visibility.
- Dashboard tests: date/timezone boundaries, no cross-currency aggregation, no private note/body leakage.
- Seed tests: deterministic/idempotent, production guard, valid FKs and multiple STAFF owners.
- Admin page/store/API client tests: no mock data fallback, loading/error/empty/permission states, mutation and filter behavior.
- Run targeted tests and backend/admin builds where available. Record exact commands and outcomes; never claim unrun checks passed.

## 9. Shared integration requests (INT-owned)

The API-4 agent must submit explicit patch requests for:
1. Registering `crm.routes.js` in `backend/src/app.js`.
2. Adding `crm.*` definitions and STAFF role assignments in `backend/prisma/seed.js`.
3. Registering CRM API client exports in the shared API-client barrel/module.
4. Registering Admin CRM routes/menu/permission metadata.
5. Registering `backend/prisma/seeds/crm.js` in the global seed orchestrator.

Do not edit these shared files independently. No Prisma migration is expected unless a verified schema gap is found.

## 10. Completion handoff

Report exact base main SHA, changed files, endpoints and permission matrix, models reused, migration decision, seed/idempotency behavior, tests and exact results, unresolved blockers, and integration requests. Any test/build/runtime check not actually executed must be marked NOT RUN.


## 11. Implementation snapshot — 2026-11-09

The following first vertical slice has been added to `main`:

- Backend module: `backend/src/modules/crm/crm.service.js` and `backend/src/modules/crm/index.js`; registered at `/api/v1/crm` in `backend/src/app.js`.
- Implemented routes: dashboard; lead sources list/create/update; lead list/create/detail/update; lead assignment; validated lead status changes; lead conversion; duplicate suggestions; lead timeline; account list/create; task list/create; activity list/create; note list/create.
- Route guards combine `requireExactAccessType('STAFF')` with the corresponding `crm.*` permission. CRM never uses the RFQ `leads.*` permissions. Lead/task/account owners and activity/note authors are checked against active STAFF AccessProfiles. New leads default to the authenticated STAFF creator; assignment is a separate permission-gated command.
- Lead conversion is transactional and returns the already-linked CRMAccount on a repeat request. It creates a primary CRMContact and does not create or mutate marketplace Company/User identities.
- Private notes are returned only to their author; TEAM notes are available to CRM readers.
- API client methods are registered in `packages/api-client/endpoints.js`, `apiClient.js` and `index.js`.
- Admin routes now use `apps/admin/src/pages/admin/crm/CRMWorkspace.vue` for overview, lead inbox and interaction history. The CRM navigation is permission-gated. The CRM pipeline route now renders a live opportunity board using real pipeline stages and opportunities; stage changes are persisted through the API and append stage history. Explicit lead merge moves related activities/tasks/notes to the surviving lead and writes an AuditLog entry; CSV export is bounded to 5,000 rows and mitigates spreadsheet formula injection.
- Synthetic CRM fixtures are in `backend/prisma/seeds/crm.js` and invoked from the existing seed orchestrator. Stable lead/source/opportunity keys are used; the module skips production and skips safely if no active STAFF profile exists.

### Remaining before API-4 can be marked DONE

- Complete Admin CRM UI for account/contact create/edit, opportunity detail/edit, task creation/editing/assignment, source management and owner assignment; add full interaction forms for activities and notes and a conversion confirmation step.
- Expand automated service/authorization/privacy/idempotency/seed/UI tests. The initial route-boundary test file covers unauthenticated, COMPANY wildcard, CUSTOMER legacy-lead permission and STAFF-without-CRM-permission denial.
- Run backend/Admin test suites and builds in a real checkout; validate Prisma Client compatibility and execute the guarded seed against a development database.
- Verify the UI using the project's permitted non-browser test workflow and document any unavailable visual checks.

**Verification status:** GitHub source review only. No Node.js syntax check, Prisma validation, database seed execution, unit tests or app build has been run in this remote-only session. All are `NOT RUN`; API-4 remains `PARTIAL`, not complete.
