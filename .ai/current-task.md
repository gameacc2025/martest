# POLICY-AUDIT-2026-11-17 — Repository Rules and Agent Workflow Reconciliation

**Task ID:** POLICY-AUDIT-2026-11-17  
**Status:** IN_PROGRESS — confirmed contradictions corrected and published; latest CI validation pending.  
**Repository:** `gameacc2025/martest`  
**Integration branch:** `main` only  
**Application-code baseline reviewed:** `344a2ee049ac9a28eab48b53ce96b118d8224fc3`  
**Owner communication:** Persian

## Objective

Audit the repository's authoritative AI/developer instructions, agent coordination rules, workflow triggers, design-system constraints, and project-state documents. Remove contradictions, make the main-only/lead-only workflow executable, and prevent stale historical notes from being mistaken for current verification.

## Confirmed findings and changes published

- Corrected `.github/copilot-instructions.md`: it previously required English communication, directly contradicting `AGENTS.md` and `.ai/PROTOCOL.md`.
- Corrected the stale English-language architectural decision in `.ai/decisions.md`; Persian owner communication is now the current decision.
- Reconciled browser-testing rules in `.ai/UI_SKILLS.md`: removed the blanket prohibition and made browser testing conditional on acceptance criteria/explicit authorization, consistent with `AGENTS.md`.
- Reconciled push authorization in `AGENTS.md`, `.ai/PROTOCOL.md`, and `docs/AI_AGENT_WORKFLOW.md`: workers never commit/push; the lead publishes each reviewed, verified slice to `origin/main` under the owner's standing direct-to-main workflow; no force-push.
- Removed non-main branch triggers from database-migration and runtime-validation workflows.
- Corrected `.ai/agent-coordination/ACTIVE.md`: historical workflow runs are labelled historical; conflicting Support/CMS blocker statements were removed; open Audit, Dashboard, Regression, Retail/Finance and local-verification gaps are stated separately.
- Added a dated current-state reconciliation to `.ai/project-context.md` and removed its obsolete detached-worktree instruction.
- Aligned the architecture roadmap palette with the canonical `newtemp-reference.scss` tokens.

## Files changed

- `.github/copilot-instructions.md`
- `.ai/UI_SKILLS.md`
- `.ai/decisions.md`
- `.ai/PROTOCOL.md`
- `AGENTS.md`
- `.github/workflows/database-migration-validation.yml`
- `.github/workflows/runtime-validation.yml`
- `.ai/agent-coordination/ACTIVE.md`
- `.ai/project-context.md`
- `Telecom_Marketplace_Project_Architecture_and_Roadmap.md`
- `docs/AI_AGENT_WORKFLOW.md`

## Verification and limitations

- Repository tree inventory: 5,098 tracked blobs at application-code baseline `344a2ee0`; this is a file inventory, not a claim that every source file has been read.
- Confirmed canonical light/dark palette directly against `packages/shared-ui/assets/design-system/newtemp-reference.scss`.
- Latest workflow checks must be read from GitHub Actions for the latest `main` SHA. The older run IDs in ACTIVE.md are historical and do not certify the current HEAD.
- No local Windows shell, Docker daemon, or developer PostgreSQL access in this review. Local status/runtime remains `NOT VERIFIED`.
- No source-code tests were run by this remote documentation-only pass.

## Remaining audit work

1. Reconcile the full current-task/worklog index and check all tool-specific instruction entrypoints for contradictions.
2. Inspect the actual source/tests for the open Audit retention/coverage, dashboard aggregation, and three-app regression items before changing their status.
3. Review the remaining implementation and CI evidence by bounded domain; do not infer completion from old roadmap prose or commit messages.
4. Wait for CI, migration, and runtime workflows on the final documentation commit; fix any failures caused by the rule/workflow edits.
5. Keep all changes on `main`; lead-only commits/pushes; no destructive Git commands.

## Latest integration history for this audit

- Copilot: `6399106b78a31ffd205122964c61b6be92c5f717`
- UI skill verification policy: `9dab428cd28bad80ac317c4b3290390842e3c857`
- Language decision: `0d32abc220a64f14bc639141b88218f51019c175`
- Shared publishing protocol: `bf67c53741c13db5f9234c3af001f99fc3f0e627`
- Root agent rules: `5562f41f605638bf318204e191adcf909eeac61a`
- Migration workflow: `32a8ed10a230a187d7861448f6e7559922ad1fb1`
- Runtime workflow: `e7bd021876a754cbeea0e58d0cd5fac841126f9e`
- Coordination board: `4ce322e44ebc9144c174ec76ddf34c80beeffcd1`
- Project context: `f05efee5adf029c3b58a36a8bcab0043459c4209`
- Architecture palette: `6ea90955a023884331e7748d4762f1cf3033d9dc`
- Human-facing agent workflow: `092c85ab8afefb8def544f1be7cf683f3d557641`

