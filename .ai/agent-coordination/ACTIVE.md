# Multi-Agent Coordination Board

**Task:** API-UI-SEED-01  
**Date:** 2026-11-08  
**Canonical integration target:** `main` only  
**Branch/PR policy:** No feature branches, temporary branches or pull requests. Agents work in isolated detached worktrees/checkouts pinned to a recorded main SHA and return patches. Coordinator integrates one patch at a time directly to the latest main.

## Active assignments

| Lane | Status | Owner | Scope / owned paths | Dependencies |
|---|---|---|---|---|
| M0 — Shared Website palette | IN_PROGRESS | Design-system agent (assign) | `packages/shared-ui/assets/design-system/**`, shared dashboard components, Admin/Company page-level styling, design-system tests/docs; Website token ownership in `apps/website/src/assets/marketplace-theme.scss` | None |
| API-1 — Auth + Audit | READY_FOR_CONTRACT | Auth/Audit agent (assign) | `backend/src/modules/auth-challenges/**`, `backend/src/modules/audit/**`, domain API-client files, security pages/components, `backend/prisma/seeds/auth-audit.js`, domain tests/docs | M0 token contract; MFA/session policy decisions |
| API-2 — Support | READY_FOR_CONTRACT | Support agent (assign) | `backend/src/modules/support/**`, support API-client module, support UI workspaces/pages, `backend/prisma/seeds/support.js`, domain tests/docs | M0; shared attachment/notification contract |
| API-3 — CMS | READY_FOR_CONTRACT | CMS agent (assign) | `backend/src/modules/cms/**`, CMS API-client module, Admin content editor and Website CMS rendering, `backend/prisma/seeds/cms.js`, domain tests/docs | M0; media/slug/publication contract |
| API-4 — CRM | READY_FOR_CONTRACT | CRM agent (assign) | `backend/src/modules/crm/**`, CRM API-client module, Admin CRM pages, `backend/prisma/seeds/crm.js`, domain tests/docs | M0; Company/User/Inquiry identity contract |
| API-5 — Retail | BLOCKED_BY_DECISION | Not assigned | Inventory/order/reservation/fulfillment APIs, Admin/Website UI, `backend/prisma/seeds/retail.js` | Owner approval for seller eligibility, stock ownership, reservation, cancellation/returns, shipping/tax/pricing/payment and AD-4 |
| API-6 — Finance | BLOCKED_BY_DECISION | Not assigned | Commission/ledger/reconciliation/settlement APIs and Admin finance UI, `backend/prisma/seeds/finance.js` | Owner approval for accounting basis, commission, tax, currency, invoice, reconciliation, payout and legal/provider boundaries |
| INT — Integration | ACTIVE | Coordinator | `backend/src/app.js`, Prisma schema/migrations, permissions registry, global seed orchestrator, shared API-client exports, package manifests, global route/menu registration, global design tokens and cross-domain docs | All lanes |

## File ownership and no-overlap rules

- The lane paths above are proposed ownership boundaries. An agent must list exact files in its claim before editing.
- Shared files are owned by INT. Domain agents submit a precise patch request for shared registries rather than editing them independently.
- Do not allow two agents to edit one file concurrently. If an overlap appears, pause the lower-priority task and ask INT to sequence it.
- Prisma schema and migrations are serialized by INT. Domain agents submit schema gap evidence, model/field proposal, relation/constraint implications and migration SQL proposal; no duplicate model creation.
- Permission names are proposed by domain agents but registered by INT after checking existing permissions and app-context rules.
- Seed modules are domain-owned; the root seed orchestrator and dependency order are INT-owned.

## Contract gate

Before implementation, each domain agent writes or updates its domain contract under `docs/api-contracts/<domain>.md` (or the existing canonical domain design doc if one exists). The contract must specify:
- endpoints/methods, request and response schemas, error codes and pagination/filter rules;
- allowed access contexts, permission keys, record ownership and tenant scoping;
- state transitions and transactional/idempotency behavior;
- audit/notification/file behavior and sensitive-field redaction;
- UI routes/screens and loading/empty/error/success states;
- Prisma models/enums reused and whether a migration is actually required;
- demo-seed scenarios, deterministic keys, production guard and fixture counts;
- tests and acceptance criteria.

## Integration checklist for each slice

- [ ] Agent claim and exact file ownership recorded.
- [ ] Existing schema/routes/permissions/API-client/UI/tests inspected.
- [ ] Contract reviewed and frozen.
- [ ] Backend validation, authorization, ownership and service tests pass.
- [ ] API-client/store uses the real API, no mock response in production UI.
- [ ] UI has complete loading/empty/error/success states and follows Website palette.
- [ ] Synthetic seed is realistic, idempotent, production-guarded and tested.
- [ ] Domain docs, WORKLOG and current-task updated.
- [ ] Coordinator reviews patch against latest main; no conflicting changes.
- [ ] Targeted tests/builds run and exact outcomes recorded.
- [ ] Direct-to-main commit created; main SHA recorded.
- [ ] No live database migration without baseline/status/backup/runbook verification.

## Current blockages and decisions

- API-1: decide whether LOGIN_MFA is required and for which access contexts; decide concurrent device/session policy. Do not change existing refresh-token revocation behavior without approval.
- API-2: confirm initial SLA defaults, requester attachment limits and notification behavior against current schema and existing provider constraints.
- API-3: confirm editorial roles, approval/publishing permissions, Persian/English locale policy and media storage limits.
- API-4: confirm lead ownership/assignment policy, duplicate handling and conversion semantics.
- API-5: blocked until explicit commercial approval.
- API-6: blocked until explicit accounting/legal/provider policy approval.

## Agent handoff format

Each agent must append a WORKLOG entry and return a concise handoff with: task ID/lane, base main SHA, exact files, API contract, Prisma/migration notes, permissions/ownership, UI screens, seed scenarios/idempotency/production guard, exact test commands/results, risks and next action.
