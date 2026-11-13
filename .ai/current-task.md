# Current Task — PROJECT SOURCE AUDIT & PRIORITIZED BACKLOG

**Updated:** 2026-11-13  
**Status:** REMOTE SOURCE AUDIT COMPLETE; CI NOT GREEN; LOCAL RUNTIME NOT VERIFIED.  
**Canonical repository:** `gameacc2025/martest`  
**Canonical branch:** `main` only.  
**Audited code baseline:** `48e73952e277703b70a351d4f0569fed48944b76`  
**Audit document:** `docs/REMAINING_FEATURES_IMPLEMENTATION_BACKLOG.md`  
**Owner communication:** Persian.

## Verified current state

1. The GitHub `main` branch was verified at code baseline `48e73952`; this audit updated the backlog directly on `main`.
2. GitHub Actions for the audited code baseline:
   - Database migration validation: PASS.
   - Backend tests and Prisma Client generation: PASS.
   - Workspace dependency installation: FAIL.
   - Frontend/shared tests: SKIPPED because installation failed.
   - Frontend build step: FAILURE.
   - Runtime/Compose/browser workflow: failed at dependency installation; Compose and browser steps SKIPPED.
3. `apps/admin/package.json` declares `quill`, but the `apps/admin` importer in `pnpm-lock.yaml` does not. Resolve the lockfile mismatch first; do not assume the remaining build errors are independent until installation succeeds.
4. CMS Article/Category/Tag APIs and UI exist, but FAQ/Page services call `prisma.faq` and `prisma.page` although those models are absent from Prisma schema. The FAQ/Page routes are therefore not accepted as operational.
5. Auth self-service recovery is incomplete: client calls `/auth/forgot-password` and `/auth/reset-password`, but backend routes are absent. AuthChallenge routes require authentication and code delivery remains TODO.
6. Support models/migration exist; no Support backend module/routes/API-client methods exist. Three app surfaces use sample data and disabled controls.
7. CRM models, service/routes, API client, seed and Admin workspace exist. Acceptance is incomplete: only four route authorization tests were found, CRM routes lack Fastify request schemas, and no CRM Playwright workflow exists.
8. Retail and Finance schema/migrations exist, but operational API/services do not. Retail cart is local-only and checkout is disabled; Finance/Settlement UI still contains sample values.
9. Generic notification dispatch does not queue SMS. Twilio adapter presence does not prove event-driven SMS delivery.
10. API documentation/inventory omits mounted CMS and CRM routes; the inventory test does not scan those modules.
11. Root agent docs contain conflicting detached-worktree instructions; AGENTS also retains the old primary color while the current shared token file uses the new cyan palette.
12. Local Windows Git status, untracked files, stashes, Docker, PostgreSQL and local seed outcome are NOT VERIFIED.

## Current execution queue

### P0 — Restore a trustworthy baseline
1. **P0-1 — Lockfile and CI:** reconcile the Admin quill dependency with pnpm-lock; run frozen install; frontend/shared tests; all three app builds; inspect resulting CI.
2. **P0-2 — CMS integrity:** choose and implement one consistent FAQ/Page data model strategy; align Prisma, migrations, services, routes, API client, admin/public UI and seeds; add tests.
3. **P0-3 — Account recovery:** implement a public, secure recovery flow using an approved channel, real provider delivery, rate limits, single-use challenges, password reset and session invalidation.
4. **P0-4 — Contracts/docs:** document CMS/CRM routes; extend route inventory tests; remove conflicting worktree policy and stale design-token guidance.
5. **P0-5 — Runtime/seed:** after P0 fixes, verify safe migration status, seed execution and two-run idempotency. Preserve all local data; no destructive reset/drop/volume actions.

### P1 — Complete operational domains
- CRM functional/security validation, request schemas, seed idempotency and Playwright workflows.
- Support backend/API/client and real Website/Company/Admin workflows.
- SMS event dispatch, opt-in/quota/rate limit/retry/idempotency and Audit coverage.
- Replace sample dashboard/settlement metrics with authorized real aggregates.
- Full three-app regression, responsive/RTL/accessibility and browser workflows.

### P2 — Gated programs
- Retail/Inventory/Orders/Payments/Fulfillment/Returns only after explicit commercial approval.
- Finance/Settlement only after Retail lifecycle, currency, commission, tax, legal and payout policies are approved.

### P3 — Deferred
Procurement, HR, advanced warehouse/logistics, projects, marketing automation, BI and integrations require separate approved scope.

## Agent / Git rules

- No Claude-specific dependency is required for this audit; remote repository inspection and documentation updates were performed directly.
- Main only. No branches, worktrees, detached checkouts or PRs.
- Preserve local edits, untracked files, stashes and DB data.
- No worker commits/pushes; lead alone integrates approved changes.
- Do not bypass Fact-Forcing Gate or Auto Mode.
- Report PASS only with observed evidence; distinguish FAIL, SKIPPED, BLOCKED and NOT VERIFIED.

## Required handoff

Persian report with task/lane, exact base and resulting main SHA, exact paths, commands/exit codes, test counts, seed/browser evidence, risks and blockers. Local/runtime facts must remain NOT VERIFIED until observed on the user's environment.
