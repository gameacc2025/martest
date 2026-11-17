# POLICY-AUDIT-2026-11-17 — Repository Rules and Agent Workflow Reconciliation

**Task ID:** POLICY-AUDIT-2026-11-17  
**Status:** IN_PROGRESS — policy contradictions corrected; CI and Runtime validation on the latest main revision are still running.  
**Repository:** `gameacc2025/martest`  
**Integration branch:** `main` only  
**Reviewed application-code baseline:** `344a2ee049ac9a28eab48b53ce96b118d8224fc3`  
**Latest observed rules revision before this handoff:** `f12782aff8b4264dda975810194cd3cb99fe09cb`  
**Owner communication:** Persian

## Objective

Audit authoritative AI/developer instructions, agent coordination, workflow triggers, design-system constraints, and project-state documents. Remove contradictions, make the main-only/lead-only workflow executable, and prevent stale historical notes from being mistaken for current verification.

## Confirmed findings corrected

- Copilot had an English-only communication rule contradicting root `AGENTS.md`; it now requires Persian owner communication.
- `.ai/decisions.md` contained an obsolete English-language decision; it now records Persian communication as the current decision.
- `.ai/UI_SKILLS.md` prohibited browser testing broadly while root rules authorized Playwright for acceptance. It now makes browser testing conditional on acceptance criteria/explicit authorization.
- `AGENTS.md`, `.ai/PROTOCOL.md`, `CLAUDE.md`, and `docs/AI_AGENT_WORKFLOW.md` had inconsistent startup/push language. They now agree: read only relevant context sections and 3–5 recent worklog entries; workers never commit/push; lead publishes each reviewed, verified slice to `origin/main` under the owner's standing direct-to-main workflow; no force-push.
- Migration and Runtime workflow triggers now target `main` only.
- Old prompts in `PROMPTS.md` and `.ai/PROMPTS.md` are explicitly marked historical archives, not active policy.
- Removed detached-worktree instructions from the task brief and project context; parallel reads may run concurrently, writes are serialized in the existing `main` checkout.
- Corrected stale Tailwind references in root UI rules and API/UI roadmap; project stack is Vue 3, PrimeVue 4, SCSS, JavaScript (Tailwind-free).
- Corrected the old architecture roadmap palette using the canonical values from `newtemp-reference.scss`.
- Reconciled `.ai/agent-coordination/ACTIVE.md`: old CI runs are historical, Support/CMS contradictions removed, open Audit/Dashboard/Regression/Retail/Finance/local-verification gaps separated.
- Added a current-state reconciliation to `.ai/project-context.md`; old dated snapshots are explicitly historical.
- CI exposed a stale generated dependency graph and a generator bug: it missed plugin-style CMS/CRM/Support modules and Inventory. Updated `scripts/generate-architecture-graph.mjs` and `docs/architecture/DEPENDENCY_GRAPH.generated.mmd`.

## Files changed

- `AGENTS.md`, `CLAUDE.md`, `.github/copilot-instructions.md`
- `.ai/PROTOCOL.md`, `.ai/UI_SKILLS.md`, `.ai/decisions.md`, `.ai/project-context.md`
- `.ai/agent-coordination/ACTIVE.md`, `.ai/current-task.md`, `.ai/WORKLOG.md`
- `PROMPTS.md`, `.ai/PROMPTS.md`
- `.github/workflows/database-migration-validation.yml`, `.github/workflows/runtime-validation.yml`
- `docs/AI_AGENT_WORKFLOW.md`, `docs/AGENT_TASK_BRIEF_API_UI_SEED.md`, `docs/API_UI_SEED_EXECUTION_ROADMAP.md`
- `Telecom_Marketplace_Project_Architecture_and_Roadmap.md`
- `scripts/generate-architecture-graph.mjs`, `docs/architecture/DEPENDENCY_GRAPH.generated.mmd`

## Verification and limitations

- Repository tree inventory: 5,098 tracked blobs at application-code baseline `344a2ee0`; this is an inventory, not a claim that every source file's contents were read.
- Canonical light/dark tokens were checked directly in `packages/shared-ui/assets/design-system/newtemp-reference.scss`.
- CI on `8f9993f2`: PASS — architecture graph check, frontend/shared tests, backend tests, and all three frontend builds. Run: https://github.com/gameacc2025/martest/actions/runs/44022899028
- Migration validation on `f12782af`: PASS. Run: https://github.com/gameacc2025/martest/actions/runs/44023060315
- CI on `f12782af`: IN PROGRESS; architecture graph check has passed, frontend/shared tests were running at last inspection. Run: https://github.com/gameacc2025/martest/actions/runs/44023060507
- Runtime Validation on `f12782af`: IN PROGRESS. Run: https://github.com/gameacc2025/martest/actions/runs/44023060311
- No local Windows shell, Docker daemon, or developer PostgreSQL access in this review. Local status/runtime remains `NOT VERIFIED`.
- No local tests/builds were run; verification evidence above comes from GitHub Actions only.

## Remaining audit work

1. Wait for CI and Runtime Validation on the final documentation revision; fix any failures caused by these changes.
2. Review any remaining tool-specific instruction entrypoints and ensure archived prompts cannot be mistaken for current policy.
3. Inspect source/tests for open Audit retention/coverage, dashboard aggregation, and three-app regression items before changing their status.
4. Continue the implementation audit by bounded domain; do not infer completion from old roadmap prose or commit messages.
5. Keep all changes on `main`; lead-only commits/pushes; no destructive Git commands.

