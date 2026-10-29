# Repository Quality Audit — 2026-10-26

## Current status (history refreshed 2026-10-29; see final current-state addendum)

**Core source fixes are merged.** The latest verified source commit before the documentation-only refresh passed CI and database migration validation; the subsequent documentation commits have fresh CI/migration/runtime workflows running. The latest completed runtime workflow failed at browser smoke. This is still not a release sign-off: live deployment, external provider checks, SMTP delivery, SMS, exhaustive tenant review, and browser smoke are not signed off.

Repository: `gameacc2025/martest`  
Branch: `main`  
Audit baseline at start: `1dd1434d1c78b4a0fb0e51cd5695b6653f1d4e35`

## Evidence checked

- CI runs `40634032996`, `40634407695`, `40634806585`, and `40635157043` passed architecture graph validation, frontend/shared tests, backend tests, Prisma client generation and all three production builds.
- Fresh PostgreSQL migration validation runs `40634032923`, `40634407696`, `40634806668`, and `40635157013` passed.
- Latest build output no longer shows `INEFFECTIVE_DYNAMIC_IMPORT`; the largest displayed JS chunk after code splitting was approximately 195 kB, not the prior approximately 730 kB entry chunk.
- Runtime workflow evidence includes successful Compose validation, Docker build/start, service health checks and migration status; browser E2E was intentionally not awaited per owner instruction and is not claimed passed.
- Relevant documentation and AI handoff files have been updated alongside the fixes. The generated architecture graph is checked in CI.
- Live Zarinpal, SMTP delivery, SMS delivery, production deployment, and browser journey validation are not claimed verified.

## Current findings and disposition

### Resolved — documentation/source drift

The core README, API, database, frontend, Docker deployment, role-access matrix and notification docs were reconciled against the current Vue/Vite + Fastify/Prisma implementation. Endpoint-by-endpoint exhaustive schema documentation is still a separate completeness task; do not describe the docs as a fully formal API specification.

### Resolved — application context and notification scope

The `AccessProfile.type` app boundary is enforced in login, RBAC and handoff. Notification folder scope is derived from the authenticated token context; client-provided app scope is not trusted. Regression tests cover these boundaries. A full manual audit of every company-owned endpoint is not claimed complete.

### Resolved — production bundle import warning

Website, Company and Admin routers now import their auth stores statically while route pages remain lazy-loaded. CI build logs no longer emit `INEFFECTIVE_DYNAMIC_IMPORT`; split JavaScript chunks are below the prior oversized entry bundle.

### Resolved — inquiry response consistency

Parent inquiry row locking serializes response submission/edit/withdrawal, buyer decisions and manual status transitions. Duplicate supplier submissions return HTTP 409 `RESPONSE_ALREADY_EXISTS` rather than surfacing a generic Prisma unique-constraint failure. Regression tests are in place.

### Resolved — subscription monetization consistency

- A pending subscription request is checked by owner, independent of selected plan.
- Payment callbacks re-read state after acquiring the owner lock, returning an already verified ACTIVE subscription without duplicate activation/extension.
- Quota consumption revalidates the active subscription after the subscription-row lock and fails closed when the paid period has expired.

### Remaining — operational and dependency verification

- CI deprecation traces attribute `url.parse()` to the bundled pnpm self-installer in `pnpm/action-setup@v4` and `punycode` to bundled `actions/setup-node@v4` setup/cache code. These are GitHub Actions toolchain notices, not workspace runtime dependencies. No project dependency upgrade is justified; consider action-version updates separately and validate them.
- Live Zarinpal payment remains NOT VERIFIED without staging credentials.
- SMTP remains NOT VERIFIED without credentials and a controlled test recipient.
- SMS is PARTIALLY IMPLEMENTED: Twilio adapter, worker processing, quota enforcement and unit tests exist; the dispatcher explicitly does not queue SMS rows, so end-to-end event-driven SMS remains incomplete. Live Twilio delivery is NOT VERIFIED.
- Browser E2E is intentionally not awaited per owner instruction; no browser pass is claimed.
- Production deployment and exhaustive company-owned endpoint IDOR review are not release-signed-off.

## Verification matrix

| Area | Current status | Evidence / limitation |
|---|---|---|
| Frontend/shared tests | PASS | CI run `40635157043` |
| Backend tests | PASS | CI run `40635157043` |
| Website/Company/Admin production builds | PASS | CI run `40635157043`; no ineffective auth dynamic-import warning |
| Prisma client generation | PASS | CI run `40635157043` |
| Fresh PostgreSQL migration application | PASS | Migration run `40635157013` |
| Architecture graph generation/check | PASS | CI architecture check in `40635157043` |
| Docker Compose build/start + service health | PARTIAL PASS | Successful steps observed; full runtime workflow not used as a release gate |
| Browser workflows across all apps | NOT VERIFIED | Intentionally not awaited per owner instruction |
| Targeted auth/notification/inquiry RBAC tests | PASS | Regression tests in CI |
| Exhaustive company-owned endpoint IDOR review | NOT SIGNED OFF | Continue source-level audit before release sign-off |
| API/database/frontend/deployment docs | CORE DOCS ALIGNED | Exhaustive endpoint-schema completeness is not claimed |
| Live Zarinpal payment | NOT VERIFIED | Requires staging credentials |
| SMTP delivery | NOT VERIFIED | Requires credentials and controlled recipient |
| SMS delivery | PARTIAL / NOT VERIFIED | Twilio adapter, worker processing and paid quota/tests exist; dispatcher never queues SMS rows; live provider not verified |
| Node deprecation warnings in CI | IDENTIFIED, NON-BLOCKING | Call sites are bundled code in `pnpm/action-setup@v4` and `actions/setup-node@v4`; no app dependency change required |

## Next actions

1. Continue source-level audit of company-owned read/write routes for owner scoping and IDOR, adding tests for any uncovered boundary.
2. Trace the `url.parse()` / `punycode` warning call sites before considering dependency updates; do not upgrade blindly.
3. Verify live payment and SMTP only when staging credentials and controlled test accounts are available. SMS delivery is only partially wired: complete event dispatch/queue integration, opt-in/quota enforcement at queue time, recipient validation, idempotency/retry coverage and controlled Twilio verification.
4. Keep `.ai/current-task.md`, `.ai/WORKLOG.md`, project context, API docs and this audit updated at every material change.
5. Browser E2E is not a blocker per owner instruction and must not be reported as passed.

## Explicit limitation

This report records observed CI results and source-level changes. It does **not** claim that the whole application has been manually tested, deployed, security-certified, or visually validated.


## Progress update — 2026-10-27

### Documentation reconciliation

The P1 stale-documentation finding has been addressed at the main-branch document level for the core guide set:

- `docs/README.md` — current pnpm/Vue monorepo and docs index.
- `docs/FRONTEND_DOCUMENTATION.md` — three Vue/Vite applications and shared packages.
- `docs/DOCKER_DEPLOYMENT.md` — current production Compose topology, ports, PostgreSQL 18 image and Node 22 backend.
- `docs/API_DOCUMENTATION.md` — current `/api/v1` module index and source-of-truth route references.
- `docs/DATABASE_DOCUMENTATION.md` — current Prisma model inventory.
- `docs/role-access-matrix.md` — access-profile boundaries and unresolved legacy SUPER_ADMIN bypass.

Commits: `3e9bacbafd4905ddcce35622a66fc9d0abad8573`, `e3e5e7f49c501d0d899c882d6b896418ca51bbfe`, `d0518ebce8c313fa1b8ccaac963133bc313dff95`, `bf43f91d014cb7353933aea4874c7955370e94ec`, `eab7069c6c15a9521fcede18ddec5bcd2b8af3eb`, `7587c4953f7e04042fa1044c5926477c5214a89d`.

These are source-aligned summary documents, not a claim that every endpoint request/response schema has been exhaustively documented. Markdown lint and a fresh CI result for these documentation commits are NOT VERIFIED.

### Runtime/browser validation follow-up

The runtime/browser workflow exists on the open `docs-runtime-e2e-hardening` PR branch (PR #9), not in the current main workflow. Its previous run `40339211695` was cancelled during the service-health wait. The cancelled job was re-run as job `122194361685`.

As of this update, the re-run has successfully completed:
- generated architecture graph verification;
- disposable Compose configuration validation;
- Docker build/start for PostgreSQL, backend and all three frontend panels;
- all service health endpoint checks;
- Prisma migration status against the disposable PostgreSQL database;
- installation of the isolated browser-test dependency.

Historical snapshot at the time this audit was first written: Chromium installation was in progress and browser tests had not started. PR #14 was later merged to main. The owner explicitly instructed that browser execution must not block further work; Playwright tests remain committed, but their live completion is not claimed.

### Security-policy impact inventory

Security finding (remediated on 2026-10-27): the SUPER_ADMIN cross-app bypass was removed from login app selection, generic `requireAccessType`, and PKCE handoff. Regression tests now cover a mismatched STAFF/COMPANY context and the CUSTOMER default-Website exception. `AccessProfile.type` remains the strict Admin/Company boundary; `CUSTOMER_USER` without AccessProfile may access Website-only CUSTOMER endpoints and cannot use that fallback for Admin/Company or SUPER_ADMIN.

### Remaining priority order

Updated priority order after the 2026-10-27 follow-up:
1. Run the current backend/frontend CI against the latest main snapshot; fix failures without waiting for the live browser job.
2. Keep customer address/profile APIs, route ownership, and profile response normalization covered by unit tests.
3. Keep price-history transformation, inquiry response decisions, and payment callback/retry idempotency covered by regression tests.
4. Treat Cart / Checkout / Orders / Wishlist as dormant future B2C pages; do not expose active routes or controls until the architecture decision changes.
5. Verify notification inbox/read-state regressions and document SMTP as not live-verified and SMS as not implemented.
6. Track Vite vendor chunking and architecture graph generation; verify builds through CI.


## Progress update — 2026-10-27 (runtime and auth-context follow-up)

- PR #14 was squash-merged into `main` as `92501f206ab16b163d8d4605e685cbe3396dd2aa`. It adds Docker/Compose runtime validation, Playwright smoke tests, and explicit Vite build-time origins for the Company/Admin panels.
- Observed on the PR head: CI run `40555574784` passed; PostgreSQL migration validation `40555574786` passed. Runtime run `40555575064` passed Compose configuration, Docker build/start, health endpoints, and migration status. Its browser step was still running at the last observation; per the owner instruction, do not block subsequent work waiting for it and do not claim browser E2E passed.
- The legacy SUPER_ADMIN cross-app bypass was removed from auth app selection, generic `requireAccessType`, and PKCE handoff. Tests were updated for login and RBAC, and a handoff unit test was added. The CUSTOMER-without-AccessProfile default Website behavior is explicitly tested so strict panel isolation does not break existing customer registrations.
- `docs/role-access-matrix.md`, `docs/ARCHITECTURE_DECISIONS.md`, `.ai/decisions.md`, and `.ai/current-task.md` now state that `AccessProfile.type` is the strict app-context boundary and wildcard permissions do not override it.
- PR #9 is non-mergeable after main advanced. Its useful address/token/architecture/code-splitting changes have now been ported selectively, along with the customer profile/API contract fix. PR #11's profile change is redundant against current main; close both stale PRs rather than force-merging an old base.
- Additional 2026-10-27 changes: added the customer Address model/migration/API/UI and ownership/default-address tests; normalized auth-store profile updates to store only the nested personal profile; added refresh-token `jti` uniqueness and regression tests; added price-history transformation tests; added payment callback/retry idempotency tests; disabled active Cart/Checkout/Orders/Wishlist routes and controls per AD-4; added Vite vendor chunk splitting, deterministic Prisma CLI availability in the runtime image, and generated architecture graph tooling. Latest test edits still need a completed CI result; live SMTP remains unverified and SMS is not implemented.


## Progress update — 2026-10-28 — validation checkpoint merged

- Validation PR #16 was merged into \`main\` at \`90a8f36be5c4281c999515206b099b894d2da75d\`.
- CI run [40629289205](https://github.com/gameacc2025/martest/actions/runs/40629289205) passed architecture graph consistency, frontend/shared tests, backend tests, Prisma client generation and all three frontend production builds.
- Fresh PostgreSQL migration validation run [40629289194](https://github.com/gameacc2025/martest/actions/runs/40629289194) passed schema/client validation, applying migrations to an empty database and checking migration state.
- The first validation run found the generated Mermaid graph was stale. The graph was regenerated and the graph check subsequently passed.
- Frontend tests found one false-negative test in the notification inbox folder-count suite across Website, Company and Admin. The tests had included the “all categories” button, which has no count element. Added \`data-folder-id\` to actual folder buttons and updated tests to query those explicit controls; the next complete CI run passed.
- Notification implementation notes now cover folder membership, counts, read-state behavior, bulk actions, and the page-scoped search/category limitation.
- Browser E2E is explicitly non-blocking per owner instruction. This update does not claim the browser tests passed.
- **Remaining audit work:** source-level review of notification folder/read-state authorization and app scope; inquiry permission/quota/response-decision coverage; ensure API/database/frontend/Docker/notification docs remain aligned with current source; review and track Admin bundle warnings; keep external SMTP NOT VERIFIED without credentials and a test recipient, and SMS NOT IMPLEMENTED.


## Follow-up finding — notification folder app-scope authorization (2026-10-28)

- **Severity:** P1 authorization-boundary hardening.
- **Finding:** The folder list and copy/move endpoints accepted an app scope from client query/body values, and folder-list filtering accepted a numeric folder ID without checking whether that folder belonged to the caller's authenticated app context.
- **Fix under validation:** Derive scope server-side from the verified access token (\`STAFF\` → \`ADMIN\`, \`COMPANY\` → \`COMPANY\`, \`CUSTOMER\` → \`WEBSITE\`); ignore client-supplied scope; fail closed for unknown context; verify a requested folder is available in that scope before listing its notifications; reject moves from inactive source folders.
- **Regression tests added:** Controller tests cover forged \`app\` values, missing context, cross-app folder IDs and scope mapping. Service tests cover inactive source folders and cross-scope destinations.
- **Status:** Pending CI and migration validation. Do not close the finding until the tests pass and the fix is merged.


## Follow-up finding closure — notification folder app-scope authorization (2026-10-28)

- **Status:** FIXED and merged in PR #17 at \`6c936fbf89b62febdf8122ac854fb53d93049ed4\`.
- **CI:** [40630173240](https://github.com/gameacc2025/martest/actions/runs/40630173240) passed; fresh PostgreSQL migration validation [40630173261](https://github.com/gameacc2025/martest/actions/runs/40630173261) passed.
- **Verified changes:** scope now comes from authenticated \`accessType\`, client-supplied scope is ignored, cross-app folder IDs are rejected, unknown contexts fail closed, and inactive source folders cannot be moved from.
- **Regression coverage:** controller tests cover forged scope values, missing context, folder-ID scope validation and mapping; service tests cover inactive source folders and cross-scope destinations.
- **Browser E2E:** not required for this closure and not claimed passed.


## Follow-up — canonical notification folder API contract (2026-10-28)

- **Status:** Pending CI and merge.
- Removed the obsolete client-selected app parameter from the shared endpoint helper and all three inboxes.
- Removed the app field from the folder action request schema and made folderId/action the only required body fields. The controller continues to derive authorization scope exclusively from the verified token.
- Updated notification API docs and route test fixture to match the canonical contract.


## Follow-up closure — canonical notification folder API contract (2026-10-28)

- **Status:** FIXED and merged in PR #18 at \`fd6515426d7cc5d6ed1c7d02589c46e940e35fde\`.
- **CI:** [40630881073](https://github.com/gameacc2025/martest/actions/runs/40630881073) passed; migration validation [40630881119](https://github.com/gameacc2025/martest/actions/runs/40630881119) passed.
- **Verified changes:** Frontend apps no longer send client-selected app scope for folder listing/move/copy; the shared endpoint helper and backend route schema match that contract. Authorization remains derived from the verified access token.


## Follow-up finding — pending inquiry subscription invariant (2026-10-28)

- **Severity:** P1 business-rule consistency for monetization.
- **Finding:** The self-service UI blocks a new subscription request while any pending request exists, but the backend only checked pending requests for the same plan. A direct API caller could create pending requests for different plans.
- **Fix under validation:** Backend pending-subscription lookup is now owner-scoped and independent of plan ID. Regression tests cover the different-plan duplicate and first valid request. The payment flow already locks the owner row before creation.
- **Status:** Pending CI and migration validation; do not close until green and merged.


## Follow-up closure — pending inquiry subscription invariant (2026-10-28)

- **Status:** FIXED and merged in PR #19 at \`695b61861b39f840eefa24660541d4d61143943d\`.
- **CI:** [40631325212](https://github.com/gameacc2025/martest/actions/runs/40631325212) passed; migration validation [40631325206](https://github.com/gameacc2025/martest/actions/runs/40631325206) passed.
- **Verified change:** Backend checks pending subscription requests by owner regardless of plan, matching the self-service UI rule. The payment flow locks the owner row before creating the pending request.
- **Regression coverage:** A pending request for another plan blocks a duplicate; an owner with no pending/active subscription can create the first request.
- **External provider verification:** These tests do not verify a live payment with Zarinpal. Live provider payment remains NOT VERIFIED without configured staging credentials.


## Follow-up finding — inquiry response concurrency (2026-10-28)

- **Severity:** P1 consistency / race-condition hardening.
- **Finding:** A supplier submission and buyer selection could both read an inquiry as OPEN under separate READ COMMITTED transactions. A submission that had already read OPEN could otherwise commit a new PENDING response after the buyer closed the inquiry and rejected existing pending responses.
- **Fix prepared:** Response submission, response edit/withdrawal, buyer response decision, and manual inquiry status transitions now lock the parent Inquiry row inside their transaction before reading current status.
- **Regression coverage prepared:** Service tests assert that response submission and buyer selection issue the parent-row `FOR UPDATE` lock.
- **Validation:** CI and fresh PostgreSQL migration validation must be observed on the PR head before merge. Browser E2E remains non-blocking per owner instruction and is not claimed passed.


## Closure — inquiry response concurrency (2026-10-28)

- **Status:** FIXED and merged in PR #20 at `afe468c62d674ec675e4d7e9264e4850403fdb21`.
- **CI:** [40633476868](https://github.com/gameacc2025/martest/actions/runs/40633476868) passed graph validation, frontend/shared tests, backend tests, Prisma generation and all three production builds.
- **Database:** [40633476941](https://github.com/gameacc2025/martest/actions/runs/40633476941) passed fresh PostgreSQL migration validation. No schema changes were introduced.
- **Regression coverage:** Service tests assert parent-row locking for successful response submission and buyer selection.
- **Browser E2E:** Not awaited or claimed passed, per owner instruction.


## Follow-up — Admin production bundle warning (2026-10-28)

- **Evidence:** CI build `40633476868` completed successfully. The generated Admin chunks shown in its build output are below the previous approximately 730 kB entry chunk; the largest displayed JavaScript chunk is approximately 196 kB (uncompressed), consistent with the configured 300 KiB vendor split target.
- **Remaining warning found:** CI on the first fix branch confirmed the same `INEFFECTIVE_DYNAMIC_IMPORT` warning in Website and Company as well as Admin: each router dynamically imported `src/stores/auth.js` while layouts/pages and `main.js` also statically imported it.
- **Fix prepared:** All three routers now import `useAuthStore` statically and call it inside route callbacks. This matches each module's actual usage and avoids pretending the store can be split into a separate chunk. Page components remain lazy-loaded.
- **Validation:** CI production builds must be rerun on the PR head. Browser E2E is not required for this cleanup and is not claimed passed.


## Closure — frontend auth-store dynamic import warning (2026-10-28)

- **Status:** FIXED and merged in PR #21 at `a6c24627b640b6154cfe6277332673b021299371`.
- **CI:** [40634032996](https://github.com/gameacc2025/martest/actions/runs/40634032996) passed architecture graph validation, frontend/shared tests, backend tests, Prisma generation and all three production builds.
- **Database:** [40634032923](https://github.com/gameacc2025/martest/actions/runs/40634032923) passed fresh PostgreSQL migration validation.
- **Evidence:** Build logs no longer report `INEFFECTIVE_DYNAMIC_IMPORT` in Website, Company or Admin. Route-level lazy loading remains, and the largest displayed JavaScript chunk is approximately 195 kB.
- **Remaining:** Transitive Node dependency deprecation notices for `url.parse()` and `punycode` are still present; trace the dependency chain before upgrading packages. Browser E2E is not claimed passed.


## Follow-up finding — duplicate supplier response handling (2026-10-28)

- **Severity:** P2 business/API consistency.
- **Finding:** Prisma's unique constraint on `(inquiryId, companyId)` protects data integrity, but a duplicate submit could surface as a generic database error rather than a useful API conflict.
- **Fix prepared:** With the parent inquiry row already locked, the service checks for an existing response and returns HTTP 409 / `RESPONSE_ALREADY_EXISTS` with the existing response ID and status. The database unique constraint remains the final invariant.
- **Regression coverage prepared:** Duplicate pending response is rejected before creation and does not dispatch another response notification.
- **Validation:** CI and migration validation pending; browser E2E is non-blocking.


## Closure — duplicate supplier response handling (2026-10-28)

- **Status:** FIXED and merged in PR #22 at `17a2015edeecbc00c1cbf540540ea48b8c97f394`.
- **CI:** [40634407695](https://github.com/gameacc2025/martest/actions/runs/40634407695) passed architecture graph, frontend/shared tests, backend tests, Prisma generation and all three production builds.
- **Database:** [40634407696](https://github.com/gameacc2025/martest/actions/runs/40634407696) passed fresh PostgreSQL migration validation.
- **Behavior:** Duplicate supplier response returns HTTP 409 `RESPONSE_ALREADY_EXISTS` and the existing response ID/status; no second response or notification is created.
- **Browser E2E:** Not awaited or claimed passed.


## Follow-up finding — concurrent verified payment callbacks (2026-10-28)

- **Severity:** P1 monetization correctness/idempotency.
- **Finding:** The callback transaction read subscription state before locking the owner row. If another callback activated the subscription while this request waited for the lock, the stale in-memory state could lead to a failed response even though the payment had already been activated.
- **Fix prepared:** After locking the owner row, re-read the subscription and return the existing verified ACTIVE record when another callback has already committed. Keep provider verification, owner serialization and compare-and-set activation.
- **Regression coverage prepared:** Simulate a concurrent activation while the callback waits for the owner lock; assert the second callback returns success without updating/extending the subscription.
- **Validation:** CI and fresh PostgreSQL migration validation pending; no schema change.


## Closure — concurrent verified payment callbacks (2026-10-28)

- **Status:** FIXED and merged in PR #23 at `075db4b3a99d75f0dc043f3fec3417f8bf158ca9`.
- **CI:** [40634806585](https://github.com/gameacc2025/martest/actions/runs/40634806585) passed architecture graph validation, frontend/shared tests, backend tests, Prisma generation and all three production builds.
- **Database:** [40634806668](https://github.com/gameacc2025/martest/actions/runs/40634806668) passed fresh PostgreSQL migration validation.
- **Behavior:** Callback state is re-read after owner lock; a callback that observes a prior verified activation returns success without a second activation/extension.
- **Limitations:** This is regression coverage with mocked provider responses, not live Zarinpal verification. Browser E2E is not claimed passed.


## Follow-up finding — quota consumption at subscription expiry (2026-10-28)

- **Severity:** P1 monetization consistency.
- **Finding:** Quota consumption selected an active subscription before taking its row lock and used that stale result after waiting. If the subscription expired while waiting, one usage could be accepted after the paid period ended.
- **Fix prepared:** After locking the selected subscription, re-query the owner's active subscription and validate its current time window. If the active subscription changed at the boundary, lock and re-check the new row. If no active period remains, reject before aggregating or recording usage.
- **Regression coverage prepared:** Simulate the subscription becoming inactive during lock acquisition and assert quota consumption fails without creating a usage event.
- **Validation:** CI + fresh PostgreSQL migration validation pending; no schema change.


## Closure — quota consumption at subscription expiry (2026-10-28)

- **Status:** FIXED and merged in PR #24 at `c96850af53866c9e8c84b46d436e38fd8b06be3b`.
- **CI:** [40635157043](https://github.com/gameacc2025/martest/actions/runs/40635157043) passed architecture graph validation, frontend/shared tests, backend tests, Prisma generation and all three production builds.
- **Database:** [40635157013](https://github.com/gameacc2025/martest/actions/runs/40635157013) passed fresh PostgreSQL migration validation.
- **Behavior:** Quota consumption revalidates the current active subscription after row lock and fails closed when no paid period remains. A replacement active subscription is re-locked and rechecked.
- **Browser E2E:** Not awaited or claimed passed.


## Targeted tenant-boundary source review (2026-10-28)

- Reviewed route/service boundaries for company profile and company products, product CRUD/history/media, customer addresses, inquiry ownership/responses/messages, and notification folders.
- **Observed controls:** Company routes compare COMPANY context to the requested company ID; product routes enforce STAFF/COMPANY context and service-level product ownership; address operations scope every query to the authenticated user ID; inquiry services check buyer/supplier ownership and response visibility; notification operations scope messages by user and derive folder app scope from the verified token.
- **Regression coverage already present:** Product service tests cover company spoofing and cross-company access; company service tests cover tenant-scoped updates; address tests cover foreign IDs/user scoping; inquiry tests cover supplier ownership and cross-context roles; notification tests cover forged app scope and cross-scope folders.
- **Result:** No additional confirmed cross-tenant data path was found in these targeted areas during this pass. This is not an exhaustive route-by-route security sign-off; keep that limitation in the verification matrix.
- **Code comment corrected:** `product.routes.js` no longer claims SUPER_ADMIN bypasses `requireAccessType`; the comment now states that the app-context boundary remains strict.


## Closure — targeted tenant-boundary review (2026-10-28)

- **Status:** Targeted review completed; PR #25 merged at `6fc10282a29a836ca84987eb4cec93fecce54774`.
- **CI:** [40635937015](https://github.com/gameacc2025/martest/actions/runs/40635937015) passed; fresh PostgreSQL migration validation [40635936924](https://github.com/gameacc2025/martest/actions/runs/40635936924) passed.
- **Reviewed:** Company, product, address, inquiry, and notification route/service ownership controls.
- **Result:** No additional confirmed cross-tenant path was found in the reviewed surfaces; existing regression tests cover the principal owner/context boundaries. This is not an exhaustive route-by-route security certification.
- **Comment accuracy:** Product routes now correctly state that SUPER_ADMIN does not bypass the strict app-context boundary.


## Closure — CI deprecation warning attribution (2026-10-28)

- A temporary `NODE_OPTIONS=--trace-deprecation` diagnostic run in closed PR #26 identified both warnings:
  - `DEP0169 url.parse()` comes from `pnpm/action-setup@v4`'s bundled `pnpm.cjs` during action self-install.
  - `DEP0040 punycode` comes from `actions/setup-node@v4`'s bundled setup/cache implementation.
- PR #26 was closed without merging the diagnostic environment change. No application dependency was upgraded because the warnings originate in the GitHub Actions toolchain.
- If action versions are updated later, do so as a separate CI maintenance change with the standard workflow/migration checks.


## Final branch disposition — 2026-10-29

All 19 non-main remote refs were compared against current `main`. No further merge was justified: merged PRs and selective ports already cover customer address management, customer profile, customer-owned inquiries, RFQ monetization, notification scope/folder contracts, subscription quota/payment concurrency, inquiry response concurrency, RBAC context, admin bundle import cleanup, and supplier response authorization. PR #26 only diagnosed Node deprecation warnings in GitHub Actions tooling and remains intentionally unmerged. The legacy feature branches are heavily divergent historical snapshots; merging them wholesale would risk regressions. The runtime validation workflow is already on `main`. No browser E2E was run or awaited, per owner instruction.

The remaining action is remote ref cleanup by the repository owner. Retain `main`; delete the 19 reviewed non-main refs after fetching the latest remote state.


## Current-state refresh — 2026-10-29 (after PR #28 merge)

### Source baseline and CI evidence
- Latest reviewed main commit before this documentation refresh: `384459502d0913350e4920e5aeeb2aef5360e553`.
- CI [40833114382](https://github.com/gameacc2025/martest/actions/runs/40833114382): PASS for architecture graph check, frontend/shared tests, backend tests, Prisma generation, and all three production builds.
- Fresh PostgreSQL migration validation [40833114529](https://github.com/gameacc2025/martest/actions/runs/40833114529): PASS.
- Runtime validation [40833114464](https://github.com/gameacc2025/martest/actions/runs/40833114464): FAIL at the browser-smoke step. Compose validation, image build/start, service health endpoints, and migration-state check passed first. The browser smoke failure is recorded honestly; per owner instruction it is not the next debugging task.
- The remote branch inventory returned only `main` in the latest query. This says nothing about unpushed local branches.

### UI redesign disposition
PR #28 is merged as `23576cb1a22f80fea2d245cf10e5915794d4a15c`. The accepted scope is limited to shared tokens/primitives, MegaMenu styling, regression tests and the safe-port guide. The legacy 32-file patch remains only partially adapted; page-level redesign is still open. Its mock-data switch, fake fixtures and auth bypass remain explicitly rejected.

### Remaining work
1. Continue route-by-route company-owned resource authorization/tenant/IDOR review. Existing targeted review did not constitute exhaustive certification.
2. Port the UI redesign one current page at a time, beginning with the Website homepage; preserve API/data contracts and add tests for behavior.
3. Run controlled live Zarinpal and SMTP verification only when credentials/environment are supplied. SMS is partially implemented (Twilio adapter/worker/quota/tests); dispatch does not queue SMS rows and live delivery is not verified.
4. Expand API documentation from module-level source-aligned guidance to exhaustive endpoint/schema/permission coverage.
5. Consider GitHub Actions toolchain updates separately if deprecation warnings remain; do not change application dependencies for warnings attributed to bundled action code.

### Graphify status
Graphify MCP could not be reviewed or refreshed: the tool reported no available workspace and calls failed because no workspace was selected. This is a tooling/access blocker, not a finding that the repository's generated architecture graph is stale. The generated architecture graph CI check passed in run 40833114382. Re-run Graphify analysis only after a workspace is made available and selected.

### Release-sign-off boundary
No production deployment, live payment, live SMTP, SMS delivery, exhaustive tenant-security certification, or passing browser smoke is claimed. The CI and migration results above are not a substitute for those operational checks.


## Correction — SMS implementation status (2026-10-29 source review)

Earlier entries saying SMS is wholly unimplemented are too broad and are superseded by this correction. The source currently contains:
- `backend/src/modules/notifications/notification.sms.provider.js`: Twilio REST adapter with configuration/payload validation and timeout/error mapping.
- `backend/src/modules/notifications/notification.delivery.service.js`: `processPendingSmsDeliveries` with SENT/FAILED/retry tracking.
- `backend/src/workers/notification-delivery.worker.js`: invokes email and SMS delivery processors.
- `backend/src/modules/inquiries/inquiry-subscription.service.js`: separately metered SMS quota, plus unit tests.
- Provider, delivery worker, and quota tests.

**Confirmed gap:** `backend/src/modules/notifications/notification.dispatch.service.js` explicitly marks SMS as not implemented and does not create SMS delivery rows. Therefore end-to-end event-driven SMS is not wired despite the downstream adapter/worker existing. The next SMS task is to integrate dispatch/queue creation with explicit recipient opt-in, phone-number resolution/validation, paid-quota consumption, deduplication, and regression tests. Live Twilio delivery remains NOT VERIFIED without credentials and a controlled recipient.


## UI redesign step 1 — current branch status (2026-10-29)

The first page-level port is prepared on `feat/website-homepage-redesign-step-1`. It refines the Website homepage using existing design-system tokens, preserves API and route behavior, and adds keyboard activation for category/product tiles. Source-contract regression tests were added. CI and production build results remain pending; this step is not yet marked complete or merged. No browser E2E debugging is included in this task.


## Verification update — homepage redesign PR #29 (2026-10-29)

- CI run [40839667461](https://github.com/gameacc2025/martest/actions/runs/40839667461) passed on branch commit `0d33036dfe8480e0b63279ad42b4bf39787e844e`: architecture graph validation, frontend/shared tests, backend tests, Prisma generation, and all three frontend builds.
- The first test attempt exposed an invalid `fileURLToPath(import.meta.url)` assumption under Vitest's transform. The test now resolves the source using the current working directory and checks both repository-root and app-root paths; the corrected test passed in CI.
- Database migration validation was still running at the time of this update. Runtime validation is a separate workflow and is not being debugged as part of this task.
- The page-level redesign remains on PR #29 and is not merged.


## Post-merge UI redesign status — 2026-10-29

- PR #29 merged as `520d590b51b7d4be49772dd44cc3f5dc96f45351`; the Website homepage is the first page-level safe port after the shared foundation in PR #28.
- Feature-branch CI [40839895731](https://github.com/gameacc2025/martest/actions/runs/40839895731) and migration validation [40839895740](https://github.com/gameacc2025/martest/actions/runs/40839895740) passed on the final feature-branch commit before merge.
- Post-merge CI, migration, and runtime workflows have been triggered on the merge commit and must be checked independently. Runtime/browser smoke is not claimed passed; per owner instruction, do not prioritize browser-test debugging.
- Next UI slice: Product Listing page. Preserve API/query/pagination/filter semantics, loading/error/empty states, and add focused regression tests before moving to another page.


## UI redesign step 2 — Product Listing (pending verification, 2026-10-29)

The Product Listing page is being ported on `feat/website-product-listing-redesign-step-2`. Styling and accessibility changes preserve the existing products store calls, category query handling, filters, pagination and product-detail route. Component regression tests cover initial query parameters, route-query updates, keyboard activation, and error/empty states. CI/build/migration validation is pending; this step is not merged or signed off.


## UI redesign step 2 merged — 2026-10-29

Product Listing PR #30 merged at `91c64bb1a43553ecb1214b4a50c1bb0efa5f7ac2`. Feature-branch CI [40840764762](https://github.com/gameacc2025/martest/actions/runs/40840764762) and migration validation [40840764653](https://github.com/gameacc2025/martest/actions/runs/40840764653) passed. Added component tests for initial category/API params, reactive route-query updates, keyboard navigation, and error/empty states. Post-merge main workflows are queued and should be checked before proceeding to Product Details. Runtime/browser smoke is not claimed green.


## UI redesign step 3 — Product Details (pending verification, 2026-10-29)

Product Details is being ported on `feat/website-product-details-redesign-step-3`. Styling and accessibility updates preserve product-store calls, route ID handling, image selection, retail/bulk price logic, company navigation, price history and the inquiry permission gate. Component tests cover load/change of route ID, render, not-found/error, thumbnail selection and inquiry authorization visibility. CI/build/migration validation is pending.


## UI redesign step 3 verified and merged — 2026-10-29

Product Details PR #31 merged at `daf47ff282a2e81162ff0e8e5047337b1973b26e`. Feature CI [40841432392](https://github.com/gameacc2025/martest/actions/runs/40841432392), feature migration validation [40841432249](https://github.com/gameacc2025/martest/actions/runs/40841432249), post-merge CI [40841579985](https://github.com/gameacc2025/martest/actions/runs/40841579985), and post-merge migration validation [40841579967](https://github.com/gameacc2025/martest/actions/runs/40841579967) all passed. Product Details tests cover route ID load/change, not-found/error, gallery selection, and inquiry permission visibility. Next UI slice is Categories. Runtime/browser smoke is not claimed green.


## UI redesign step 4 — Categories (pending verification, 2026-10-29)

The Categories page is being ported on `feat/website-categories-redesign-step-4`. Changes preserve the live category store and products route/query contract while adding responsive shared styling, accessible state semantics and an explicit empty state. Component tests cover category render/navigation/loading/empty/error. CI/build/migration validation is pending.


## UI redesign step 4 verified and merged — 2026-10-29

Categories PR #32 merged at `50745aa1c83bfb01fe6a7db5cb87c8f33af7b178`. Feature CI [40842352640](https://github.com/gameacc2025/martest/actions/runs/40842352640), feature migration [40842352602](https://github.com/gameacc2025/martest/actions/runs/40842352602), post-merge CI [40842534524](https://github.com/gameacc2025/martest/actions/runs/40842534524), and post-merge migration [40842534511](https://github.com/gameacc2025/martest/actions/runs/40842534511) all passed. Tests cover live category rendering, route/query navigation, loading, empty and error states. Next page is Search Results.


## UI redesign progress update — Step 5 (2026-10-29)

Website Search Results redesign is on feature branch `feat/website-search-results-redesign-step-5`. It applies shared design primitives and adds accessible loading/error/empty states while preserving the existing search store/API contract and routes. Regression tests were added. Feature CI and database migration validation are pending; this is not yet considered complete or merged. No local test execution is claimed.


## Search Results redesign merge update — 2026-10-29

PR #33 was merged to `main` at `1c58e2c2b01bbfdfe2e4b938e91b9199945ecc25`. Feature CI [40880947037](https://github.com/gameacc2025/martest/actions/runs/40880947037) and database migration validation [40880947043](https://github.com/gameacc2025/martest/actions/runs/40880947043) passed. Post-merge CI [40881262815](https://github.com/gameacc2025/martest/actions/runs/40881262815) and migration validation [40881262830](https://github.com/gameacc2025/martest/actions/runs/40881262830) were queued at the time of this update. Runtime/browser smoke is tracked separately and is not the next debugging task per owner instruction.


## Final verification — Search Results Step 5 (2026-10-29)

- PR #33 merged as `1c58e2c2b01bbfdfe2e4b938e91b9199945ecc25`.
- Feature CI [40880947037](https://github.com/gameacc2025/martest/actions/runs/40880947037) and feature migration validation [40880947043](https://github.com/gameacc2025/martest/actions/runs/40880947043) passed.
- Post-merge CI [40881378521](https://github.com/gameacc2025/martest/actions/runs/40881378521) passed, and post-merge migration validation [40881378435](https://github.com/gameacc2025/martest/actions/runs/40881378435) passed.
- Runtime validation [40881262762](https://github.com/gameacc2025/martest/actions/runs/40881262762) failed at browser smoke after Compose validation, image build/start, service health, and migration-state checks passed. Per owner instruction, browser-smoke debugging is not the next task.
- This is not a release sign-off; live external services, exhaustive tenant/IDOR review, and production readiness remain separate tasks.


## Source-review follow-up — company pages (2026-10-29)

- `apps/website/src/pages/public/Companies.vue` is not registered in `apps/website/src/router/index.js` as currently observed. It imports `../../components/companies/CompanyCard.vue`, which was not found in the complete current Git tree, and calls `getFeaturedCompanies`, `followCompany`, and `unfollowCompany` methods that are not exported from `apps/website/src/stores/companies.js`. This appears to be an orphaned/incomplete page and should not be redesigned without resolving routing and API/store contracts.
- Routed `apps/website/src/pages/public/CompanyProfile.vue` calls `productsStore.getProductsByCompany` and company-store methods `getCompanyReviews`, `isFollowing`, `followCompany`, and `unfollowCompany`; these were not found in the current website store exports. Add a dedicated behavior/API-contract repair with tests before redesigning that page.
- These are source-review findings, not claims that the affected pages were exercised at runtime.

## About Us redesign Step 6 — implementation in progress (2026-10-29)

The About Us page is being ported safely on `feat/website-about-us-redesign-step-6`. The change removes unverified static usage/order/product/company statistics, invented team-member details and partner claims, while preserving the existing published-products API request and product-details route. Regression tests were added; feature CI/migration validation are pending. No local test run is claimed.


## About Us final verification and Company Profile next step — 2026-10-29

- PR #34 merged at `503bbe8af65e1b787a64a7d53aa50ff9bba3bf7f`.
- Feature CI [40882370960](https://github.com/gameacc2025/martest/actions/runs/40882370960), migration validation [40882371076](https://github.com/gameacc2025/martest/actions/runs/40882371076), post-merge CI [40882547737](https://github.com/gameacc2025/martest/actions/runs/40882547737), and post-merge migration validation [40882547667](https://github.com/gameacc2025/martest/actions/runs/40882547667) all passed.
- Runtime validation [40882371017](https://github.com/gameacc2025/martest/actions/runs/40882371017) was still running at last check.
- Company Profile source contract gap: page calls five website store methods not found in store exports (`getProductsByCompany`, `getCompanyReviews`, `isFollowing`, `followCompany`, `unfollowCompany`). Inspect backend endpoints/services before adding methods; do not invent endpoints.
- Companies directory source contract gap: `Companies.vue` is not routed, imports a missing component path and calls store methods not exported. Resolve route/product intent separately.


## Company Profile contract repair — Step 7 in progress (2026-10-29)

The routed Company Profile page was calling website store methods that do not exist. The backend company read/products routes are authenticated and context/permission gated; no review/follow endpoints or schema models were found. The public product list endpoint explicitly supports companyId filtering and enforces `PUBLISHED + PUBLIC`, with a public-safe company id/name/type selection. Branch `fix/website-company-profile-api-contract-step-7` uses this supported public catalog contract, removes unsupported reviews/follows, adds accessible states and regression tests. Feature CI and migration validation are pending. No backend authorization change or new endpoint is included.
