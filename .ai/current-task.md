# Current Task — 2026-10-29

## Current repository state

**Canonical repository:** `gameacc2025/martest`  
**Canonical branch:** `main`  
**Reviewed main HEAD before this documentation refresh:** `384459502d0913350e4920e5aeeb2aef5360e553`  
**Remote branch inventory:** the GitHub branch search returned only `main`. This is the latest observed inventory, not a claim about local branches on the owner's computer.

This handoff supersedes earlier entries in this file that say PR #28 is open, the safe redesign work is unmerged, or multiple remote branches still exist.

## Latest verification observed

- CI run [40833114382](https://github.com/gameacc2025/martest/actions/runs/40833114382): **PASS** on main HEAD `384459502d0913350e4920e5aeeb2aef5360e553` — architecture check, frontend/shared tests, backend tests, Prisma generation, and Website/Company/Admin production builds.
- Database migration validation [40833114529](https://github.com/gameacc2025/martest/actions/runs/40833114529): **PASS** on the same commit.
- Runtime validation [40833114464](https://github.com/gameacc2025/martest/actions/runs/40833114464): **FAIL** at the Playwright browser-smoke step. Compose validation, image build/start, service health checks, and migration-state verification passed before that step. Per owner instruction, do not spend the next task chasing browser tests; do not describe the runtime workflow as fully green.
- No local checkout or dependency-equipped environment was used for this audit. CI evidence is remote evidence, not a claim that local commands ran.
- Graphify MCP could not be inspected or updated: `list_workspaces` returned no available workspaces and Graphify tools rejected calls because no workspace is selected. This is separate from the repository's generated architecture graph, which passed the CI check.

## Completed and merged work that should not be reopened without new evidence

- PRs #20–#25: inquiry response concurrency, frontend auth-store import/build warning, duplicate supplier response handling, payment callback idempotency, quota period-boundary handling, and RBAC comment correction.
- PR #27: supplier response actions enforce COMPANY context plus `inquiries.respond`; STAFF permission alone cannot submit/edit/withdraw supplier responses or manage their attachments.
- PR #28: [safe shared UI redesign foundation](https://github.com/gameacc2025/martest/pull/28), squash commit `23576cb1a22f80fea2d245cf10e5915794d4a15c`. It added design-token aliases, opt-in page primitives, shared MegaMenu styling, tests, and documentation. The original patch was **not** applied wholesale.
- Existing merged work covers notification folder/app scoping, canonical folder API contract, customer addresses/profile, product lifecycle/access/privacy controls, RFQ subscription/quota invariants, architecture graph validation, and core documentation reconciliation.
- Current branch search lists only `main`; do not claim local branches have been removed.

## Remaining tasks — prioritized backlog

### P1 — Complete the production-safe UI redesign
- Port the redesign from the current `main` implementation page by page, starting with the Website homepage.
- Preserve existing API contracts, auth/permission gates, route parameters, real data, loading/empty/error states, and mutation behavior.
- Do not introduce `USE_MOCK`, demo fixtures in production flows, auth bypasses, or local-only cart/wishlist/order behavior.
- Add focused regression tests for every changed interaction; run targeted unit tests and the relevant production build before moving to the next page.
- Update `docs/TELECOM_UI_REDESIGN_SAFE_PORT.md` after each meaningful page batch.

### P1 — Finish the security review boundary
- Continue the source-level, route-by-route review of company-owned reads/writes and tenant/IDOR boundaries. Existing targeted review is useful evidence, **not** exhaustive security sign-off.
- For every confirmed gap, add a regression test and update the access matrix/API docs. Do not infer security from frontend gating alone.

### P1 — Verify external operations when safe credentials exist
- Live Zarinpal payment: **NOT VERIFIED**; requires staging credentials and controlled test transactions.
- SMTP delivery: **NOT VERIFIED**; requires valid credentials and a controlled recipient.
- SMS: **PARTIALLY IMPLEMENTED**. Twilio adapter, delivery-worker processing, quota enforcement, and unit tests exist. However, `notification.dispatch.service.js` explicitly never queues SMS rows, so end-to-end event-driven SMS is not wired. Finish dispatch/queue integration with recipient opt-in, paid-quota consumption, phone validation, deduplication/retry tests, and controlled provider verification. Live Twilio delivery remains NOT VERIFIED.
- Production deployment/readiness: **NOT SIGNED OFF**; no deployment claim is supported by the current audit.

### P2 — Documentation completeness and maintenance
- API docs are source-aligned at the module/contract level, but exhaustive endpoint-by-endpoint schema/permission documentation is not complete.
- Keep `.ai/current-task.md` concise and authoritative; append task history to `.ai/WORKLOG.md`; maintain `.ai/project-context.md`, the architecture roadmap, API/role/notification docs, and the quality audit with material changes.
- Review GitHub Actions action-version/deprecation notices separately; the observed `url.parse`/`punycode` traces were attributed to bundled GitHub Actions tooling, not application dependencies. Do not upgrade blindly.

## Non-negotiable constraints

- Backend authorization and ownership checks are authoritative. `AccessProfile.type` app context cannot be bypassed by SUPER_ADMIN or wildcard permissions.
- Inquiry and subscription row-lock/idempotency invariants must remain intact.
- Do not merge stale, heavily diverged branches wholesale.
- Browser E2E is not the next task per owner instruction. Report the observed failure honestly, but do not claim it passed or spend the next task debugging it.
- Separate unit/CI tests, builds, database migration validation, runtime infrastructure checks, browser smoke, live provider checks, and production deployment in all reports.

## Next action

Start the first page-level redesign slice on a new focused branch from current `main`: inspect Website homepage implementation, API/data contract, loading/error states, and tests; port template/style only; add regression tests; run CI-equivalent targeted tests and Website build; update docs and AI memory; then review before proceeding.
