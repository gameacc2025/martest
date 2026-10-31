# Current Task — 2026-10-30

## Active handoff: Step 11 — Company-owned API authorization and tenant-isolation audit

**Repository:** `gameacc2025/martest`  
**Canonical branch:** `main`  
**Main after Step 10:** `0da4960d026aa6be532777c5dd66afacca3430de`  
**Feature branch:** `audit/company-tenant-access-step-11`  
**Status:** Company module audit slice merged in PR #38 at `d4d64af9c120d7200e363bdcb7092dfd0554f47b`; feature and post-merge CI/migration passed. **Current audit slice:** Product routes/service reviewed. Existing ownership and nested-resource checks are present; added regression coverage for COMPANY/CUSTOMER wildcard attempts against STAFF-only moderation. CI pending. **Current audit slice:** Product route/service review completed with no confirmed cross-tenant bypass. Regression test for COMPANY/CUSTOMER wildcard attempts against STAFF-only moderation merged in PR #39; feature and post-merge CI/migration passed. Inquiry route family is next.

## Completed UI redesign steps

- Steps 1–7: Homepage, Product Listing, Product Details, Categories, Search Results, About Us, and Company Profile changes are merged in PRs #29–#35. Their CI/migration results are recorded in the UI redesign guide; browser-smoke failures are recorded separately.
- Step 8: Companies directory remains intentionally unrouted/dormant because `GET /companies` is STAFF-only and the existing page references missing dependencies. No public exposure without a public-safe endpoint and field allowlist.
- Step 9: FAQ PR #36 merged. Feature and post-merge CI/migration passed; feature and post-merge runtime browser-smoke failed.
- **Step 10:** Terms & Privacy PR #37 merged at `0da4960d026aa6be532777c5dd66afacca3430de`. Feature CI [41096817092](https://github.com/gameacc2025/martest/actions/runs/41096817092) passed; feature migration [41096817046](https://github.com/gameacc2025/martest/actions/runs/41096817046) passed; post-merge CI [41097249357](https://github.com/gameacc2025/martest/actions/runs/41097249357) passed; post-merge migration [41097249463](https://github.com/gameacc2025/martest/actions/runs/41097249463) passed. Post-merge runtime [41097249425](https://github.com/gameacc2025/martest/actions/runs/41097249425) was still running at handoff; browser smoke is not the next debugging task.

## Step 11 — Security audit scope

- Review company-owned API routes, their preHandlers, AccessProfile context requirements, tenant scoping, resource ownership checks, nested attachments, and read/write operations.
- Start with `companies`, `products`, `inquiries`, `addresses`, and `notifications`; inspect every relevant route and service query rather than relying on frontend gating.
- For each suspected gap, prove the path and add a focused regression test before changing behavior.
- Do not claim full security sign-off until the complete route inventory is covered.
- Preserve strict app-context boundaries: STAFF/SUPER_ADMIN must not gain COMPANY context by wildcard permission; COMPANY operations must be scoped to the authenticated company.

## Deferred UI / integration item — Contact Us

`ContactUs.vue` contains hardcoded phone/email/address/social/map details and a submit handler that simulates success with a timeout. No public contact submission API was found in source searches or route inventory. Do not invent an endpoint or claim a message was sent. Define a real contact-message workflow and authoritative business contact details before implementing it.

## Remaining backlog after Step 11

1. Complete the exhaustive company-owned route/tenant/IDOR audit.
2. Complete SMS event-dispatch integration: Twilio adapter, worker, paid quota and tests exist; dispatcher does not enqueue SMS rows. Live delivery unverified.
3. Verify live Zarinpal and SMTP using controlled staging credentials.
4. Complete endpoint/schema/permission API documentation.
5. Refresh Graphify when a workspace is available.
6. Resolve Contact Us functional integration from an approved API and verified contact data.

## Constraints

- No mock data, auth bypass, invented endpoints, or fake success states.
- Do not expose STAFF-only company directory data publicly.
- Preserve app-context/RBAC, tenant ownership, inquiry permission/subscription, payment idempotency and quota invariants.
- Browser-smoke debugging is not the next task; report its result honestly.
- Separate unit/CI tests, builds, migrations, runtime infrastructure, browser smoke and live-provider verification.
- Keep `.ai/current-task.md`, `.ai/WORKLOG.md`, project context, roadmap and relevant docs current.


## Step 11A completion — Companies module

PR #38 merged at `d4d64af9c120d7200e363bdcb7092dfd0554f47b`. Feature CI [41098052152] and migration [41098052018] passed; post-merge CI [41098224830] and migration [41098224693] passed. Runtime [41098225137] remains separate; browser smoke is not pursued next. No confirmed company-route cross-tenant bypass was found. Added tests cover own-vs-other tenant access to company products/statistics/logo and wildcard COMPANY denial for settings.

## Step 11B — Products module (next)

Review product route/controller/service ownership enforcement and nested image/document/price-tier operations. Existing tests already cover many ownership, lifecycle and attachment boundaries; verify gaps against actual route wiring before adding or changing behavior. No vulnerability is asserted at this point.


## Step 11B completion — Products module

PR #39 merged at `de25c403506208bdfc01c1516d56fa929e85a8ad`. Feature CI [41098778272] and migration [41098778245] passed; post-merge CI [41098969268] and migration [41098969119] passed. Runtime [41098968989] remains separate; browser smoke is not the next debugging task. No confirmed product cross-tenant bypass was found. Added explicit wildcard-context regression tests for STAFF-only product moderation.

## Step 11C — Inquiry route family (next)

Review route context/permission boundaries, buyer/supplier ownership, sealed/anonymous response visibility, subscription ownership/payment callbacks, messaging and nested response attachments. **Confirmed finding:** customer accounts have no AccessProfile and receive `accessType: null` with `CUSTOMER_USER`, but inquiry services only recognized `accessType: 'CUSTOMER'`; additionally, `isInquiryBuyer` trusted any caller's companyId, including STAFF. Fix these service-level context mismatches and cover them with regression tests. Correct the stale SUPER_ADMIN comment.


## Step 11C audit update — inquiry ownership and received scope

- The open PR is #40: https://github.com/gameacc2025/martest/pull/40
- Fixed the confirmed buyer-context and AccessProfile-less CUSTOMER_USER mismatches described above.
- Additional confirmed issue: listInquiries({ scope: 'received' }) accepted STAFF callers if they carried a stray companyId, because the service checked only for a companyId and did not require accessType === 'COMPANY'. This could expose supplier-side received inquiry listings to STAFF outside the intended company context.
- Fixed the service guard to require explicit COMPANY context and a valid companyId for received scope.
- Updated the unrelated-company response-visibility fixture to use an actual COMPANY context.
- Fixed stats test instrumentation so Prisma groupBy arguments are captured and the new customer stats assertions test real query scoping.
- Previous CI attempt exposed three failing backend tests: the unrelated-company fixture lacked COMPANY context; groupBy mocks did not record args; STAFF received-scope was accepted. These are addressed in the latest branch commits. New CI must confirm.
- No merge until latest backend tests/CI and migration validation pass. Runtime browser smoke is tracked separately and not the next debugging task.


## Step 11C additional findings — subscription/quota and statistics

- Confirmed controller mismatch: route RBAC admits AccessProfile-less CUSTOMER_USER as default CUSTOMER context, but controller subscriptionOwner() and quota() recognized only accessType === 'CUSTOMER'. Customer users therefore could not read their own quota/subscription or purchase/verify a user-owned plan. Controller now resolves the same explicit CUSTOMER_USER fallback and scopes these operations to caller.id.
- Quota endpoint now accepts only COMPANY or CUSTOMER app context; STAFF with a stray companyId cannot inspect a company's quota.
- Confirmed stats scope mismatch: getInquiryStats previously read caller.companyId without requiring COMPANY context. STAFF could be scoped through a stray companyId; STAFF without companyId failed despite the route admitting STAFF. It now permits authorized STAFF (leads.read/inquiries.read) to receive platform-wide aggregates, matching the STAFF inquiry-list behavior, and never scopes STAFF by companyId. Unauthorized STAFF is rejected.
- Added controller tests for CUSTOMER_USER subscription listing, purchase, payment retry and quota; COMPANY quota; and STAFF stray-companyId denial. Added service tests for STAFF stats authorization and platform scope.
- PR #40 remains unmerged pending the latest CI/backend tests and migration validation.


## Step 11C CI correction — 2026-10-31

- The first PR #40 CI run had 1 backend test failure out of 1,355: the STAFF `scope=received` regression correctly rejected the request, but the test incorrectly expected the mock call tracker to be `undefined`; the harness initializes it as an empty array.
- Corrected the assertion to require `calls.findMany.length === 0`, preserving the security expectation that no database listing occurs after rejecting STAFF received scope.
- Correction commit: `189516deb109ca045f577459d385b5492c1d16e7`.
- Fresh CI and migration verification for this exact head are pending. Previous migration validation passed, but it must be rerun for the corrected PR head. Runtime workflow infrastructure/health/migrations passed; browser smoke failed and remains outside the next debugging task.
- Do not merge PR #40 until fresh backend CI and migration validation pass.


## Step 11C completion — Inquiry module (2026-10-31)

PR #40 was merged into `main` by squash at `9bac9916de148741fb379ffcdd5aaf44157f4db2`. Corrected-head CI run [41216629069](https://github.com/gameacc2025/martest/actions/runs/41216629069) passed; database migration validation [41216628936](https://github.com/gameacc2025/martest/actions/runs/41216628936) passed. Runtime validation [41216628926](https://github.com/gameacc2025/martest/actions/runs/41216628926) remained queued at merge time and is tracked separately. The PR was moved from draft to ready before merge. All previous "do not merge / pending" notes above refer to pre-merge state and are superseded by this completion record.

## Step 11D — Addresses and notifications audit (active)

- Reviewed address routes, controller, service and ownership tests. Every address read/update/delete query is scoped by authenticated `userId`; foreign address IDs return the same not-found response. Default-address mutations are also tenant-scoped. No cross-user IDOR was confirmed.
- Reviewed notification routes/controller/service and dispatcher. Notification CRUD is scoped by authenticated user ID; folder scope is derived from the verified token rather than client-supplied `app`; folder membership changes verify notification ownership, destination/source scope and source membership.
- Confirmed one app-context integration defect: notification folder listing/filtering recognized only explicit `accessType === 'CUSTOMER'`, while central RBAC intentionally permits AccessProfile-less `CUSTOMER_USER` accounts as Website customers. Such users were denied folder operations despite being authenticated Website customers.
- Fixed notification scope resolution to mirror central RBAC exactly: only `accessType === null` + `CUSTOMER_USER` gets WEBSITE; SUPER_ADMIN is excluded. Added controller regression tests for fallback, strict SUPER_ADMIN denial, and Website folder filtering.
- Added address route tests proving CUSTOMER_USER Website access works, COMPANY and STAFF/SUPER_ADMIN cannot cross into customer address routes, and wildcard permission does not override app-context boundaries.
- Branch: `audit/notification-address-tenant-step-11d`. CI/migration verification is pending. Do not merge until required CI and migration checks pass.
- Remaining Step 11 scope includes any route families outside companies/products/inquiries/addresses/notifications; do not claim exhaustive sign-off until inventory is complete.
