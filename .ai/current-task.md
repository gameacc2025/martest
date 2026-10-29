# Current Task Handoff — 2026-10-28

## Current state

**Core code-level findings from the current audit are fixed and merged into `main`.** This is not a release sign-off: live deployment and external integrations are not verified, browser E2E is intentionally not awaited per owner instruction, and an exhaustive route-by-route IDOR certification has not been completed.

Latest known source merge: PR #25 at `6fc10282a29a836ca84987eb4cec93fecce54774`. Follow-up direct commits refreshed the quality audit and AI handoff; CI push trigger was subsequently narrowed to canonical main.

## Recently completed and merged

- **PR #20 — Inquiry response concurrency:** parent `Inquiry` row lock serializes response submission/edit/withdraw, buyer decisions and manual status changes.
- **PR #21 — Frontend bundle warning:** Website, Company and Admin routers statically import auth stores; route-level page lazy loading remains. CI logs no longer show `INEFFECTIVE_DYNAMIC_IMPORT`; largest displayed JS chunk is about 195 kB instead of the prior oversized Admin entry chunk.
- **PR #22 — Duplicate supplier response:** duplicate company/inquiry submissions return HTTP 409 `RESPONSE_ALREADY_EXISTS` with existing response ID/status; no second response or notification is created.
- **PR #23 — Payment callback concurrency:** callback re-reads subscription state after owner-row lock and returns an already verified ACTIVE subscription without reactivation/extension.
- **PR #24 — Quota period boundary:** quota consumption revalidates the active subscription after row lock and rejects if the paid period expired while waiting.
- **PR #25 — RBAC comment accuracy:** corrected the stale claim that SUPER_ADMIN bypasses `requireAccessType`; application context remains strict.
- Earlier merged work includes strict app-context checks, notification folder scope, pending-subscription uniqueness, customer addresses/profile, price-history tests, Docker build-time panel origins, architecture graph validation, and core documentation reconciliation.

## CI / database evidence

- CI run `40635937015`: PASS — architecture graph check, frontend/shared tests, backend tests, Prisma generation, and all three production builds.
- Fresh PostgreSQL migration run `40635936924`: PASS.
- Recent feature PRs #20–#25 also had successful CI and migration checks:
  - #20: CI `40633476868`, migration `40633476941`
  - #21: CI `40634032996`, migration `40634032923`
  - #22: CI `40634407695`, migration `40634407696`
  - #23: CI `40634806585`, migration `40634806668`
  - #24: CI `40635157043`, migration `40635157013`
  - #25: CI `40635937015`, migration `40635936924`
- Browser E2E was not awaited and is not claimed passed. Runtime workflow checks observed successful Compose validation, image build/start, health endpoints and migration status, but this is not a full release acceptance run.

## Remaining limitations / follow-up

1. **CI action deprecations:** A temporary trace in closed PR #26 identified `url.parse()` in `pnpm/action-setup@v4`'s bundled pnpm self-installer and `punycode` in `actions/setup-node@v4` setup/cache bundles. These are GitHub Actions toolchain notices, not workspace dependencies. No app package upgrade is needed; action-version updates can be considered separately.
2. **Tenant review:** Targeted review of company, product, address, inquiry and notification ownership found no additional confirmed cross-tenant path. This is not an exhaustive route-by-route IDOR certification.
3. **External services:** Live Zarinpal payment is NOT VERIFIED without staging credentials. SMTP is NOT VERIFIED without credentials and a controlled recipient. SMS is NOT IMPLEMENTED.
4. **Deployment:** No claim of production deployment, live operational readiness, or visual/browser verification.
5. **Legacy branches:** Do not force-merge old, heavily diverged branches. PR #9/#11 were closed after useful changes were ported selectively; stale branch references are not a reason to reintroduce old snapshots.

## Working rules

- Work on one focused stage/PR at a time.
- Write regression tests for code fixes; wait for ordinary CI and migration validation before merging.
- Browser E2E is intentionally non-blocking per owner instruction; never claim it passed without observed results.
- Keep `.ai/current-task.md` concise and current; append history to `.ai/WORKLOG.md`; update relevant API/frontend/database/Docker/notification docs and the quality audit with each material change.
- Distinguish unit tests, CI builds, migration validation, Docker runtime checks, browser E2E, and live provider tests.

## 2026-10-28 branch/CI follow-up

- **CI cleanup:** Removed the stale `feat/notifications-complete` push trigger; CI push validation now runs only on canonical `main`, while pull requests targeting `main` remain covered.
- **Branch inventory:** GitHub currently exposes multiple historical/feature branches, including inquiry/payment/notification fixes, customer dashboard/address work, runtime validation, and RFQ monetization. Several compare as heavily diverged from `main` (some over 100 commits behind) despite overlapping changes already present in main.
- **Merge safety:** No blanket merge or force update was performed. Do not merge old snapshots solely to make branch names disappear; compare and port any genuinely unique, still-needed changes into `main` with tests. Branch deletion remains separate and was not performed.
- **Verification:** CI workflow file changed on main in commit `a518d061ded03ab82db3b62368489b1f9efdc6f5`. Automated workflow execution is pending; no browser tests were run or awaited.
- **Next task:** Continue the company/product/inquiry authorization and lifecycle audit from current `main`, then address any confirmed gaps with regression tests and docs. Keep external payment/SMTP and deployment checks marked NOT VERIFIED without credentials/environment.


## 2026-10-29 supplier-context hardening

- Opened PR #27 to make supplier response creation, editing, withdrawal, and attachment management require COMPANY context plus `inquiries.respond`.
- Regression tests cover STAFF with `leads.update` being denied supplier response submission/edit/withdrawal/attachment deletion.
- CI and database migration workflows are queued for PR #27. Browser E2E is intentionally not run. Do not mark this task complete until required CI/migration checks pass and the PR is merged.
