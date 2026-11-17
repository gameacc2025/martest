# POLICY-AUDIT-2026-11-17 — Repository Rules, Decisions and Agent Workflow Reconciliation

**Task ID:** POLICY-AUDIT-2026-11-17  
**Status:** PARTIAL — governance conflicts corrected; three implementation/decision mismatches require owner decisions; Runtime Validation is still running.  
**Repository:** `gameacc2025/martest`  
**Integration branch:** `main` only  
**Application-code baseline:** `344a2ee049ac9a28eab48b53ce96b118d8224fc3`  
**Latest reviewed rules/source revision at this checkpoint:** `822f6cb445df731fd3aefc7a25d987b8a63c67c0`  
**Owner communication:** Persian

## Objective and review boundary

Review the repository's authoritative AI/developer instructions, agent coordination, architecture decisions, security/role matrix, workflow triggers, stack/design constraints, and the source code directly relevant to those decisions. Reconcile contradictions without silently changing approved business or security decisions.

The repository tree contains 5,098 tracked blobs at the application-code baseline. This was a full tree inventory plus targeted source/document review, **not** a claim that the contents of all 5,098 files have been read. Local Windows files, Docker, and developer PostgreSQL are not accessible through the GitHub connection.

## Governance corrections published

- Copilot's English-only communication rule replaced with Persian owner communication.
- The obsolete English-language decision in `.ai/decisions.md` superseded by the current Persian-language rule.
- Browser testing changed from blanket prohibition to acceptance/risk-based verification; no false E2E claims.
- Startup reading is token-efficient and consistent: read `AGENTS.md`/`.ai/PROTOCOL.md`, current task, 3–5 relevant recent worklog entries, and only relevant sections of large context/decision files.
- Lead-only direct-to-main commit/push authority reconciled across AGENTS, Protocol, Claude, Copilot and workflow docs. Workers never commit/push; no force-push/history rewriting/destructive reset/clean.
- CI and migration workflows now trigger on direct `main` updates only. Runtime validation is restricted to the `main` push branch but still retains a PR validation trigger; it does not create branches or PRs.
- Detached-worktree guidance removed from project context and task brief.
- Historical prompt files `PROMPTS.md` and `.ai/PROMPTS.md` marked as archives, not active instructions.
- Tailwind references corrected against actual package manifests: the apps use Vue 3, PrimeVue 4, SCSS and JavaScript; no Tailwind dependency is present.
- Architecture roadmap palette aligned to `newtemp-reference.scss`; docs README Prisma version aligned to backend manifest (7.10.1).
- Old October quality audit marked historical.
- Architecture decisions are now reviewable; accepted decisions may be changed only with owner approval. Blanket ban on analysis/review removed.
- Coordination board and project context now distinguish historical evidence from current verification.
- Architecture dependency graph generator fixed to detect plugin-style modules (CMS/CRM/Support) and graph refreshed to include CMS, CRM, Support and Inventory.

## Source-backed decision/implementation mismatches — owner action required

1. **AD-1 — CUSTOMER inquiry creation:** `CUSTOMER_USER` receives `leads.create` and `inquiries.create` in `backend/prisma/seed.js`; `POST /api/v1/inquiries` allows CUSTOMER with those permissions; `createInquiry()` creates a buyer-owned OPEN inquiry for CUSTOMER. This contradicts AD-1's explicit prohibition. Decide whether customer-originated RFQs remain supported (revise AD-1) or must be disabled (remove permission/UI/route behavior).
2. **AD-3 — COMPANY_MANAGER user permissions:** the seed grants `users.create`, `users.update`, and `users.assign_roles` to `COMPANY_MANAGER`, while `user.service.js` explicitly denies COMPANY create/edit/role assignment and unit tests verify those denials. This is an over-broad/stale seed grant, not a confirmed service-level bypass. The seed should revoke these grants idempotently, but this changes security permissions and needs explicit approval; existing database grants must also be reconciled.
3. **AD-4 — B2C routes:** Website router registers `/cart`, `/checkout`, and `/orders`, while AD-4 requires B2C routes/UI disabled. The order/payment backend was not verified in this targeted review. Decide whether to disable these frontend routes/UI or amend AD-4 to permit clearly labelled prototypes.

These mismatches are documented in `docs/ARCHITECTURE_DECISIONS.md`, `docs/README.md`, `docs/role-access-matrix.md`, `.ai/project-context.md`, and `.ai/agent-coordination/ACTIVE.md`. No business/permission route behavior was changed in this audit.

## Files changed

- Core entrypoints: `AGENTS.md`, `CLAUDE.md`, `.github/copilot-instructions.md`
- AI governance: `.ai/PROTOCOL.md`, `.ai/UI_SKILLS.md`, `.ai/decisions.md`, `.ai/project-context.md`, `.ai/current-task.md`, `.ai/WORKLOG.md`, `.ai/agent-coordination/ACTIVE.md`
- Historical prompt archives: `PROMPTS.md`, `.ai/PROMPTS.md`
- CI: `.github/workflows/ci.yml`, `.github/workflows/database-migration-validation.yml`, `.github/workflows/runtime-validation.yml`
- Agent workflow/task brief: `docs/AI_AGENT_WORKFLOW.md`, `docs/AGENT_TASK_BRIEF_API_UI_SEED.md`, `docs/API_UI_SEED_EXECUTION_ROADMAP.md`
- Architecture/security decisions: `docs/ARCHITECTURE_DECISIONS.md`, `docs/role-access-matrix.md`, `docs/README.md`, `docs/REPOSITORY_QUALITY_AUDIT_2026-10-26.md`, `Telecom_Marketplace_Project_Architecture_and_Roadmap.md`
- Generated architecture graph: `scripts/generate-architecture-graph.mjs`, `docs/architecture/DEPENDENCY_GRAPH.generated.mmd`

## Verification evidence

- CI on `822f6cb4`: PASS — architecture graph check, frontend/shared tests, backend tests and three frontend builds. https://github.com/gameacc2025/martest/actions/runs/44024556530
- Database Migration Validation on `822f6cb4`: PASS. https://github.com/gameacc2025/martest/actions/runs/44024556605
- Runtime Validation on `822f6cb4`: IN PROGRESS at last inspection; Compose validation passed and PostgreSQL/backend/three-panel startup was in progress. https://github.com/gameacc2025/martest/actions/runs/44024556526
- Canonical light/dark design tokens checked against `packages/shared-ui/assets/design-system/newtemp-reference.scss`.
- Tailwind absence confirmed in root, Website, Admin, Company and shared-UI package manifests.
- Prisma 7.10.1 confirmed in `backend/package.json`.
- Company user-management service tests confirm COMPANY create/edit/role-assignment denials.
- No local Windows tests/builds/Docker/database checks were run; local runtime remains `NOT VERIFIED`.

## Remaining work

1. Wait for Runtime Validation on the latest `main` revision and record its final result.
2. Obtain owner decisions for AD-1, AD-3 and AD-4 before changing business or permission behavior.
3. After approval, implement the chosen policy, add/update tests and reconcile existing database permissions/routes safely.
4. Continue source-level audit of Audit retention/coverage, dashboard aggregates, and three-app visual/RTL/accessibility/keyboard/user-journey regression.
5. Keep all changes serialized on `main`; workers never commit/push; no destructive Git commands.
