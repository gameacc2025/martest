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


## Step 11D completion — Addresses and notifications (2026-10-31)

PR #41 merged by squash into `main` at `9268be23da6c1f0bc0108d3480bdaf0c3f840e53`. CI [41216966030](https://github.com/gameacc2025/martest/actions/runs/41216966030) and database migration validation [41216965916](https://github.com/gameacc2025/martest/actions/runs/41216965916) passed. Runtime validation [41216965989](https://github.com/gameacc2025/martest/actions/runs/41216965989) was still running separately. Address ownership review found no cross-user IDOR; notification CUSTOMER_USER Website-context mismatch was fixed with regression tests. Previous Step 11D pending notes above are superseded.

## Step 11E — Remaining backend route inventory (active)

Continue route-by-route audit of `auth`, `users`, `admin`, `settings`, `categories`, `roles`, `permissions`, and `specification-library`. Verify route preHandlers against service-level ownership and app-context checks; do not assume role/permission wildcard grants cross-panel access. Record each module's coverage and add regression tests only for proven gaps. After Step 11E, complete the remaining SMS message/event integration review and API documentation backlog.


## Step 11E audit update — Auth and user-management surfaces (2026-10-31)

- Reviewed auth routes/controller/service, user routes/controller/service, admin, settings, categories, roles, permissions and specification-library route registrations and their service query patterns.
- Confirmed security gap: `PATCH /auth/users/:id/password` was described as an admin-only action but enforced only `users.reset_password`. Since role-permission assignment is configurable and wildcard permissions bypass fine-grained checks, a COMPANY-context user holding that permission (or SUPER_ADMIN role in COMPANY context) could reach a service that changed any target user's password by ID; the service itself accepted no caller context.
- Fixed both boundaries: route now requires exact STAFF AccessProfile context plus `users.reset_password`; controller passes the verified caller to the service; service independently requires STAFF context and the explicit permission (or STAFF wildcard) before reading or changing the target account.
- Added route regression coverage proving COMPANY + SUPER_ADMIN + wildcard cannot invoke the reset controller. Added service tests for COMPANY context denial and missing permission, while preserving authorized STAFF reset behavior.
- Branch: `audit/backend-route-inventory-step-11e`. CI/migration checks pending. Further route families remain under review; no full security sign-off yet.


## Step 11E additional finding — Public category detail visibility

- Confirmed public category `GET /:id` and `GET /:id/subcategories/:subId` looked up taxonomy by ID without requiring ACTIVE status. The public list filtered inactive records, but direct detail URLs could still expose inactive category/subcategory metadata; the controller's source comment promised active-only behavior more broadly than the implementation provided.
- Updated public detail lookups to require `status: ACTIVE`; inactive or unknown IDs now follow the existing not-found path. Public subcategory listing also verifies the parent category is active before returning active children.
- Added service and controller regression tests for active-only detail lookups.


- CI feedback: the first backend test run exposed one test-only mismatch in `auth.controller.test.js`: after the controller began forwarding the verified caller, the test still expected only two service arguments. Updated the fixture to include a STAFF caller and assert all three arguments. No production behavior changed in this correction; rerun CI on the new head.


- CI feedback on the category visibility change: the first controller patch updated `getOne` but did not pass `activeOnly: true` from `listSubcategories` when checking its parent. Updated that call; the failing test correctly caught the incomplete route wiring. Re-run CI on the latest head.


## Step 11E additional finding — STAFF creation of users for other companies

- Confirmed functional bug in `createUser`: after a STAFF admin successfully created a COMPANY user for company X, it called `getUser`, whose non-global STAFF read scope was limited to the caller's Main-company `companyId`. For any other company, the create transaction committed but the API then returned 403, making a successful create appear to fail.
- Added an internal post-create read path that returns only the user just created by the authorized operation, without widening subsequent `getUser` read access. Added regression coverage for a non-SUPER_ADMIN STAFF `ADMIN` with `users.create` + `users.assign_roles` creating a COMPANY user in a different tenant and receiving the created record.
- Corrected the stale auth route comment to document STAFF context + `users.reset_password`.


## Step 11E completion — Remaining backend route inventory (2026-10-31)

PR #42 merged by squash into `main` at `c92aeff2866353826ec423534b4bc4178e7a57c1`. Corrected-head CI [41217897665](https://github.com/gameacc2025/martest/actions/runs/41217897665) passed with 1,368/1,368 backend tests; migration validation [41217897689](https://github.com/gameacc2025/martest/actions/runs/41217897689) passed. Runtime validation [41217897681](https://github.com/gameacc2025/martest/actions/runs/41217897681) remained separate at merge time.

Confirmed and fixed: STAFF-only admin password reset now enforces exact STAFF context at route and service; public category/subcategory detail lookups hide inactive taxonomy; STAFF user creation for another company now returns the record it created without widening normal read scope. Auth/users/admin/settings/categories/roles/permissions/specification-library routes and selected service boundaries have been reviewed. This is not a blanket security certification for every endpoint.

## Next active work — SMS delivery integration review

- Reconcile notification dispatcher docs with the existing explicit inquiry-message SMS queue path.
- Verify paid SMS quota is consumed atomically and idempotently with the message/outbox write, phone resolution and recipient opt-in are correct, and failures do not send without quota.
- Add/adjust regression tests for quota, dedupe, preference, missing phone/provider and transaction rollback.
- Live Twilio delivery remains unverified without configured credentials and a controlled recipient.


## SMS delivery review — active (2026-10-31)

- Clarified architecture: the central notification event dispatcher intentionally does not queue generic event-driven SMS. A separate explicit `sendInquiryMessage(..., notifyBySms: true)` path queues `INQUIRY_MESSAGE_RECEIVED` SMS only when the recipient opted in, Twilio config exists, and the sender has SMS quota. The delivery worker sends the outbox row.
- Found recipient-context weakness for company-owned inquiries: the code selected the first ACTIVE user with a matching companyId but did not require AccessProfile type COMPANY or active panel access. STAFF tied to the Main company or deactivated company accounts could be selected as the SMS preference owner.
- Fixed recipient selection to require `status: ACTIVE` and `AccessProfile(type=COMPANY, companyId=recipientCompanyId, isActive=true)`; direct user recipients must also be ACTIVE. Added regression tests for company context, quota exhaustion, opt-out, missing phone and missing Twilio configuration.
- SMS is charged to the sender's user/company subscription at queue time; quota is consumed once per outbox row in the same Prisma transaction as the message and delivery row. Provider retries do not consume quota again.
- Live Twilio delivery remains NOT VERIFIED without deployment credentials and a controlled recipient. CI/migration checks pending.


## SMS recipient-context and quota review completed — 2026-10-31

PR #43 merged by squash into `main` at `c08b4d319c44541d7a238cba94f0d1b91556ee42`. CI [41218300030](https://github.com/gameacc2025/martest/actions/runs/41218300030) passed with 1,373/1,373 backend tests; migration validation [41218299932](https://github.com/gameacc2025/martest/actions/runs/41218299932) passed. Runtime [41218299887](https://github.com/gameacc2025/martest/actions/runs/41218299887) remained separate at merge time.

Company SMS recipient selection now requires an ACTIVE COMPANY AccessProfile belonging to the recipient company with active panel access; direct user recipients must be ACTIVE. Tests cover quota exhaustion, opt-out, missing phone, missing provider and company recipient scoping. SMS quota is charged to the sender at enqueue time in the same transaction as the message/outbox row; retries do not charge again. Generic event-dispatch SMS remains intentionally unimplemented; only explicit inquiry-message SMS is supported. Live Twilio delivery is NOT VERIFIED.

## Next priority — subscription payment provider review

Inspect current subscription payment request/verification flow, provider callbacks, idempotency and admin manual activation. Establish whether Zarinpal integration is implemented or still manual-only. Add tests for callback authenticity, amount/currency/reference matching, replay protection and state transitions before attempting live staging verification. Do not mark payments live-verified without credentials and controlled test transaction.


## Subscription payment audit — active (2026-10-31)

- Confirmed Zarinpal v4 online request/verify integration exists; when merchant credentials are absent, the service falls back to manual payment-reference review. Live provider verification remains separate.
- Reviewed server-side amount freezing, Authority lookup, callback Status handling, provider verification, refId persistence, owner locking, concurrent callback idempotency, and user/company ownership checks.
- Found a storage boundary bug: Toman prices are multiplied by 10 for Rial, but `paymentAmount` is a PostgreSQL INTEGER / Prisma Int. The old validation accepted any safe JS integer, so a high Toman plan could exceed 2,147,483,647 after the external flow was prepared and fail at DB write.
- Added a strict signed 32-bit positive integer bound before contacting Zarinpal; added a regression test proving overflow is rejected before any provider request or paymentAmount update.
- Branch `fix/zarinpal-payment-amount-boundary`; CI/migration verification pending. Do not claim live payment verification without credentials and a controlled staging transaction.


- CI found one test-fixture mismatch in the new owner-isolation test: the mocked `inquirySubscription.findFirst` ignored the requested companyId, unlike Prisma. Updated the mock to honor id/companyId/userId filters. No production code change in this correction; rerun CI on the latest head.


## Subscription payment amount audit completed — 2026-10-31

PR #44 merged by squash into `main` at `142df69c90dd6f725fc4913a8cd2f1572883e1dc`. Corrected-head CI [41218821629](https://github.com/gameacc2025/martest/actions/runs/41218821629) passed with 1,375/1,375 backend tests; migration validation [41218821572](https://github.com/gameacc2025/martest/actions/runs/41218821572) passed. Runtime [41218821631](https://github.com/gameacc2025/martest/actions/runs/41218821631) remained separate at merge time.

Zarinpal request/verify, callback replay protection, owner lock and amount freezing were reviewed. Converted Rial amount is now constrained to positive PostgreSQL INTEGER / Prisma Int range before provider request. Live Zarinpal remains NOT VERIFIED without controlled staging credentials/transaction.

## Next active work — API documentation completeness

Compare `docs/API_DOCUMENTATION.md`, Swagger/OpenAPI route schemas and actual registered routes module-by-module. Identify missing or stale paths, request/response schemas, auth/app-context requirements, permissions, pagination and error codes. Update docs from source truth and add tests for OpenAPI route metadata where gaps exist. Do not invent response schemas or claim every endpoint is documented until inventory is complete.


## API documentation inventory — active (2026-10-31)

- Compared module route registrations with `docs/API_DOCUMENTATION.md`; the guide described module prefixes and selected operations but lacked a complete endpoint-by-endpoint index.
- Added `docs/API_ROUTE_INVENTORY.md` with all registered Fastify methods/full paths across 13 modules, including inherited auth/context notes and route-level permission guards where declared.
- Linked the inventory from `docs/API_DOCUMENTATION.md`.
- Added `backend/src/utils/api-route-inventory.test.js` so CI fails if a registered route is absent from the inventory. Detailed body/query/params and response schemas remain in route/schema source; the inventory does not invent schemas.
- CI/migration verification pending. Next documentation pass: compare Swagger/OpenAPI operation metadata and actual request/response schemas; fill only source-supported gaps.


## OpenAPI metadata and security alignment — active (2026-10-31)

- Route inventory confirms 149 module routes. OpenAPI registry had 91 keys initially: 82 matched registered routes, 9 were stale (7 nonexistent orders endpoints and 2 nonexistent /settings/preferences paths).
- Removed all 9 stale keys and the unused Orders tag; added docs for the real /settings/notifications/preferences paths, customer/company registration, PKCE handoff, and Zarinpal callback. Current dedicated prose metadata coverage is 89/149; 60 routes remain for a later description/schema pass.
- Corrected cookie-auth docs: refresh/logout use a dedicated refreshCookie scheme; PKCE redeem is trusted-origin + one-time code, not Bearer.
- Swagger now defaults undocumented protected routes to bearerAuth and uses an explicit public route allow-list. Added Addresses and Specification Library tags.
- Added tests that reject OpenAPI keys absent from route inventory, assert cookie/public security schemes, and verify bearer default for undocumented protected routes. CI/migration checks pending.


## OpenAPI metadata/security alignment — merged (2026-10-31)

PR #46 merged by squash into `main` at `ea6e787c9b2c6dbe819fb344c22aa7adea33016d`. Before merge, CI found one Swagger regression: Fastify supplied an empty `security: []` array for undocumented routes, and the fallback treated it as intentional. Fixed the fallback so empty/missing security metadata defaults to Bearer for non-allow-listed routes while preserving explicit non-empty schemes and the public allow-list. Migration validation passed on the pre-correction PR head; the one-line correction changes no schema. The corrected exact head was merged at owner request; no workflow run was exposed for the corrected head/merge commit at merge time, so post-merge CI remains to be confirmed.

Next: complete source-backed OpenAPI prose/query/params/response metadata for the remaining 60 of 149 registered routes, without inventing response shapes. Add focused tests for auth/context/permission and route-doc coverage. Then resume pending tenant-isolation audits for company, notification/address and product route families.


## OpenAPI metadata coverage — step 16A (2026-10-31)

- Added source-backed OpenAPI prose metadata for the remaining 60 routes: user access/company actions, addresses, assignable roles, categories/subcategories, product management/history/retail price history, specification library, inquiry subscription/admin/conversation/response attachment workflows, and notification operations.
- Route inventory and registry now both contain 149 unique method/path keys; static comparison found zero missing and zero stale keys.
- Request body/path schemas were included only where route source defines them. Routes without a registered request schema are not assigned invented schemas. Generic response descriptions remain where handlers do not provide explicit response schemas.
- Added reverse-coverage test requiring every route in `API_ROUTE_INVENTORY.md` to have a dedicated OpenAPI metadata entry (currently 149 routes).
- Branch `docs/openapi-metadata-coverage-step-16`; tests/CI pending. Next after merge: audit tenant boundaries for company, notification/address and product route families; complete response schemas only from controller/service contracts.


## OpenAPI metadata coverage — step 16A merged (2026-10-31)

PR #47 merged by squash into `main` at `d3d6012107651af9368c0683ae3126dfc03e5a3f`. CI run [41222767276](https://github.com/gameacc2025/martest/actions/runs/41222767276) passed: backend 1,381/1,381 tests; frontend/shared tests and all three frontend builds passed. Migration validation [41222767300](https://github.com/gameacc2025/martest/actions/runs/41222767300) passed. Runtime [41222767219](https://github.com/gameacc2025/martest/actions/runs/41222767219) remains separate/pending; browser smoke is not a merge blocker per owner instruction.

- All 149/149 registered module routes now have dedicated OpenAPI metadata. Reverse inventory comparison: zero missing, zero stale, no duplicate keys.
- Public route documentation explicitly marks all 13 public routes `authRequired: false`; a regression test enforces it.
- Protected undocumented route fallback now sets Bearer and route auth extensions correctly; the fallback test uses a truly undocumented route so it tests the intended branch.
- Source-backed request schemas and response status codes were aligned where the route/controller defines them. Generic response descriptions remain for handlers without reusable response schemas.

## Next active work — step 16B response contract accuracy

- Derive concrete response JSON schemas from controllers, services and existing response schema exports for endpoints currently using generic `resourceResponse`/`paginatedResponse` descriptions.
- Prioritize inquiry subscription/quota/messages/responses, notification CRUD/folders/delivery monitoring, address CRUD, products and admin plan endpoints.
- Add contract tests that compare documented status codes and key response shapes with controller behavior. Do not invent fields or overclaim schema completeness.
- Keep the previously merged security audits (company/product/inquiry/notification/address/admin route families) as completed slices; revisit only on new evidence.


## OpenAPI response contracts — step 16B (in progress, 2026-10-31)

- New branch: `docs/openapi-response-contracts-step-16b` (based on main after PR #47).
- Added concrete response schemas from controller envelopes, Prisma selects and service projections for address CRUD, notification list/read/bulk/folder actions, admin notification folders/delivery stats/delivery pagination, inquiry plans/quota, caller-owned subscriptions and payment verification.
- Address responses reflect the explicit `ADDRESS_SELECT` fields and `{data}` wrapper; address delete is 204. Notifications document the actual direct response shapes (`{data,meta}`, `{count}`, `{success}`, `{success,count}`, folder change result). Admin delivery stats reflect actual totals/maps/recentFailures. Inquiry quota reflects enforced/subscription/quotas/capabilities; subscription payment results include cancelled.
- Added structural response-contract tests for these exact payload keys. Static registry check still shows 149 unique docs keys for 149 routes, zero missing, zero duplicate literal keys.
- Remaining step 16B work: concrete product history/public price-history response schemas, inquiry message/response shapes, and full notification delivery row schema only if source DTO is stable. Then CI/migration validation and PR.


## OpenAPI response contracts — step 16B merged (2026-10-31)

PR #48 merged by squash into `main` at `462aad8a518fea47025d116ccb8fc7e095b708b4`. CI [41223427283](https://github.com/gameacc2025/martest/actions/runs/41223427283) passed: backend 1,384/1,384; frontend/shared 18/18; all frontend builds passed. Migration validation [41223427321](https://github.com/gameacc2025/martest/actions/runs/41223427321) passed. Runtime [41223427298] remains separate from unit/build and is not a merge blocker per owner instruction.

- Concrete response contracts added for addresses, user notifications, notification folders/read/bulk actions, admin notification folders/delivery stats/delivery pagination, inquiry plans/quota/subscriptions/payment verification.
- Schemas follow actual `success(data)` envelopes, direct `{data,meta}` notification pagination, Prisma selects and controller status codes. Subscription creation uses the narrower plan projection actually returned by the payment service; subscription list uses the wider plan projection. Payment retry includes `cancelled` as a supported service outcome.
- Added structural tests for address, notification, admin delivery and inquiry subscription response fields.

## Next active work — step 16C

- Add source-backed response schemas for product public price history, product management history/activity, inquiry message lists/sends, inquiry response lists/decisions/withdrawals and attachment upload.
- Reuse existing service projection shapes; do not expose private buyer/company/payment fields in public projections.
- Add tests for each documented response envelope and statuses; then CI/migration validation and merge.


## OpenAPI response contracts — step 16C (in progress, 2026-10-31)

- Branch: `docs/openapi-product-inquiry-responses-step-16c`.
- Added source-backed product price snapshot, product status history, product activity log, inquiry message, inquiry response/item, response attachment and buyer-decision receipt schemas.
- Public price history reflects all recorded retail snapshots in ascending recordedAt order (not a six-month truncation); Decimal prices are serialized as strings. Product status history and activity log preserve their distinct actor projections.
- Inquiry messages document the 500-item cap and sender/recipient projections; send response includes smsQueued/smsSkippedReason. Inquiry response schemas allow companyId and nested product companyId to be omitted for ANONYMOUS_SEALED buyer views. Buyer decision response is the minimal `{id,inquiryId,status}` receipt. Attachment URLs are relative `/uploads/...` paths, not absolute URIs.
- Tests added for product history/price history/activity and inquiry message/response/decision/attachment response keys. CI pending.


## OpenAPI product/inquiry response contracts — step 16C merged (2026-10-31)

PR #49 merged by squash into `main` at `d79b1908d899fc8569495e8925a00a3a0650080d`. CI [41224051397](https://github.com/gameacc2025/martest/actions/runs/41224051397) passed: backend 1,385/1,385 and frontend/shared 18/18; frontend builds passed. Migration validation [41224051449](https://github.com/gameacc2025/martest/actions/runs/41224051449) passed. Runtime remains separate/pending and is not a merge blocker per owner instruction.

- Product price snapshots, product status history and activity log now have source-backed response schemas.
- Inquiry messages, supplier responses/items, attachment metadata and minimal buyer decision receipts now have source-backed schemas. Anonymous sealed response redaction is reflected by optional company identifiers.
- Attachment URL documents the relative `/uploads/inquiries/responses/...` path. Message list documents the 500-item cap and send response includes SMS outcome fields.

## Next active work — step 16D response schema completion

- Model admin inquiry subscription list and notification delivery row response projections from service/Prisma selects.
- Model inquiry stats/list and product management list/detail responses where stable projections exist.
- Re-check all response status codes and error response shapes; avoid turning raw internal model fields into a public contract without a stable DTO.


## OpenAPI response contracts — step 16D (in progress, 2026-10-31)

- Branch: `docs/openapi-admin-inquiry-stats-and-management-responses-step-16d`.
- Added schemas for admin inquiry subscription list/grant/activate/reject, notification delivery aggregate stats and raw delivery rows, inquiry stats/list, and product management list/detail.
- Contracts follow actual controller envelopes and service projections: subscription list capped at 100; delivery stats recent failures capped at 10; inquiry stats recent arrays capped at 5; inquiry/product/delivery lists use shared `{data,meta}` pagination.
- Inquiry list keeps company nullable and response count optional because confidential/sealed supplier views redact them. Inquiry stats distinguish caller-scoped CUSTOMER/COMPANY data from platform-wide STAFF data.
- Tests assert important fields, list caps and redaction-compatible shapes. CI pending.
- Separate runtime validation on merged PR #49 failed in browser smoke tests: company/admin panel smoke pages did not mount, and STAFF auth handoff redirected to `/login` then Chrome error page. Backend/frontend unit tests, builds and migration validation passed. Per project direction, do not make browser smoke testing the focus; investigate only if it points to an actual app/API regression.


## OpenAPI response contracts — step 16D merged (2026-10-31)

PR #50 merged by squash into `main` at `96a972cb6c663952cb09d6c7a3d9c3d8b90ef2a1`. CI [41227149553](https://github.com/gameacc2025/martest/actions/runs/41227149553) passed: backend 1,386/1,386; frontend/shared 18/18; all frontend builds passed. Migration validation [41227149568](https://github.com/gameacc2025/martest/actions/runs/41227149568) passed. Runtime validation remains separate from unit/build and is not a merge blocker per owner instruction.

- Admin inquiry subscription list and grant/activate/reject responses now reflect actual plan/company/user projections; list cap is 100.
- Notification delivery stats expose normalized status/channel counts and at most 10 recent failures; delivery rows include persisted scalar fields and pagination.
- Inquiry stats/list document caller-specific scoping and confidentiality/sealed-view redactions. Stats recent arrays cap at 5.
- Product management list/detail document the management projection and relation groups.
- Tests assert key response fields and limits. Route inventory remains 149/149 covered, with no duplicate keys.

## Next active work — step 16E

- Audit response envelopes/status codes for the remaining documented API routes, especially admin dashboard/settings, company/user/role/permission/category management, product mutations/media uploads and notification preference/folder actions.
- Replace generic response descriptions with concrete source-backed DTO schemas where the controllers/services provide stable projections; preserve 204/202/302 outcomes and multipart upload metadata.
- Add structural tests for each added schema; keep error response contract aligned with the global error handler. Then CI/migration validation and merge.


## OpenAPI response contracts — step 16E (in progress, 2026-10-31)

- Branch: `docs/openapi-company-category-responses-step-16e`.
- Added company list/detail/create/update/status/restore/verification/logo, settings, statistics and company product-list response schemas. Company detail includes up to ten flattened user summaries; list includes counts and limit projections. Statistics cap recent lists at five.
- Added public and staff category list/detail, subcategory list/detail, and public category product-list response schemas. Subcategory detail includes category and specification-template/field projections.
- Corrected company/category/subcategory DELETE contracts to HTTP 204 without JSON response body. Category/company product list responses use actual `{data,meta}` pagination.
- Added structural tests; static route inventory remains 149/149 covered, no duplicate keys, and new schema block delimiter check passed. CI pending.


## OpenAPI response contracts — step 16E merged (2026-10-31)

PR #51 merged by squash into `main` at `095e742d1fbd8b4af954299ff31febd81e0ff732`. CI [41227529099](https://github.com/gameacc2025/martest/actions/runs/41227529099) passed: backend 1,387/1,387; frontend/shared 18/18; frontend builds passed. Migration validation [41227529153](https://github.com/gameacc2025/martest/actions/runs/41227529153) passed. Runtime remains a separate check and is not a merge blocker per owner instruction.

- Company APIs now document company scalar fields, counts, inquiry limits, custom limits, flattened up-to-10 user summaries, settings, statistics and paginated product relations.
- Category APIs now document public/staff category list/detail, subcategory summaries/details, specification-template fields and paginated public category products.
- Company/category/subcategory DELETE endpoints correctly document 204/no body.
- Added structural tests; inventory remains 149/149 routes documented, no duplicate keys.

## Next active work — step 16F

- Audit user, role, permission, address, settings/profile and auth/session responses against controllers/services and Prisma selects.
- Replace generic response descriptions with concrete source-backed schemas for user list/detail/create/update/access state, assignable roles, role/permission CRUD, profile/password/avatar, addresses and auth registration/session/handoff flows.
- Keep private fields (password hashes, tokens, provider secrets) excluded; preserve 204 and message-only outcomes. Add tests, CI/migration validation and merge.


## OpenAPI response contracts — step 16F (in progress, 2026-10-31)

- Branch: `docs/openapi-users-auth-rbac-responses-step-16f`.
- Added user list/detail/create/update/access state/company move schemas; user list exposes role/permission name arrays while detailed reads/mutations expose role/permission records. `passwordHash` is excluded.
- Added role CRUD and caller-scoped assignable-role schemas; permission CRUD and list-mode variants (plain array, grouped `{all,grouped}`, paginated `{data,meta}`).
- Added login/refresh/me/register/register-company/handoff schemas, explicitly keeping refresh token out of JSON (httpOnly cookie only) and documenting 60-second one-time handoff code.
- Added profile settings, avatar upload/delete, password change, admin stats and review-threshold settings schemas. Profile settings role relation shape is modeled separately from detailed user access; no nonexistent `permissions` field is required.
- Added structural tests for response shapes and secret exclusion. New schema block delimiters balanced; route inventory remains 149/149 covered, no missing/duplicate route keys. CI pending.


## OpenAPI response contracts — step 16F merged (2026-10-31)

PR #52 merged by squash into `main` at `a58d45f85025ec054d12d46ad9f6f4ba1c08389d`. CI [41228711838](https://github.com/gameacc2025/martest/actions/runs/41228711838) passed: backend 1,388/1,388; frontend/shared 18/18; frontend builds passed. Migration validation [41228711826](https://github.com/gameacc2025/martest/actions/runs/41228711826) passed.

- User list/detail/create/update/access/company-move schemas now reflect safe identity, profile/access profile, roles and permissions; password hashes are excluded.
- Role CRUD/assignable and permission CRUD/list variants are documented.
- Auth login/refresh/me/register/register-company/handoff flows document cookie-only refresh tokens and the one-time 60-second handoff code.
- Profile settings/avatar/password and admin stats/review threshold are documented.
- Structural tests pass; route inventory remains 149/149 covered.

## Next active work — step 16G

- Audit remaining product mutation/media and notification preference/folder routes for exact success envelopes and HTTP statuses.
- Model price-tier create/update/delete, product image/document upload/delete/sort/primary, public product detail, notification preferences, user folder membership/read-state/bulk operations, admin notification folder CRUD and send campaign 202 envelopes.
- Preserve 204/202 outcomes and relative upload URLs; do not leak delivery internals or private product/company fields into public responses. Add tests, CI/migration validation and merge.


## OpenAPI response contracts — step 16D (in progress, 2026-10-31)

- Branch: `docs/openapi-admin-monitoring-inquiry-stats-step-16d`.
- Added source-backed `GET /admin/inquiry-subscriptions` contract with exact list include projections (plan select, company select, user select), 100-row cap and expiry normalization note.
- Added `GET /admin/notifications/delivery-stats` contract with complete zero-filled status/channel maps and up to ten failure rows; added complete `NotificationDelivery` row schema for paginated delivery list. `nextAttemptAt` is required because Prisma schema defines it non-null.
- Added `GET /inquiries/stats` dashboard contract: sent/received/responses buckets, computed success rate, recent inquiries/responses capped at five, no buyerUserId field in recent inquiry output, and sealed/anonymous buyer response visibility behavior.
- Added structural response contract tests. CI and migration validation pending.
- PR #49 CI and migration passed (backend 1,385/1,385, frontend/shared 18/18, builds and migration validation). Runtime validation failed only in browser smoke: SPA origins returned chrome-error and `#app` did not attach. User preference is to prioritize tests over browser testing; track runtime compose/startup separately and do not claim it passed.


## OpenAPI response contracts — step 16D merged (2026-10-31)

PR #53 merged by squash into `main` at `da0478df49eb256fdb5f40c179818a02a6f706fa`.

- Admin inquiry subscription list now documents its 100-row cap and exact subscription/plan/company/user projections.
- Notification delivery stats now document zero-filled status/channel maps and up to ten recent failures; delivery list documents the complete NotificationDelivery row and pagination metadata. `nextAttemptAt` is required.
- Inquiry stats now document scoped sent/received/response aggregates, successRate and up to five recent inquiries/responses with sealed/anonymous-sealed buyer visibility rules.
- CI passed: backend 1,389/1,389 and frontend/shared 18/18; all frontend builds passed. Migration validation passed. Runtime compose/browser run was still executing at merge time and is not treated as a passed check.

## Next active work — step 16E response coverage audit

- Audit the remaining route registry for generic response placeholders, especially product create/update/list/manage, inquiry create/update/status/item operations, company list/detail, and notification admin folder/send operations.
- Add only response schemas grounded in controller/service/Prisma projections; preserve sensitive-field omissions and caller-specific redactions.
- Extend structural tests and docs, then CI/migration validation and merge. Avoid browser-smoke work unless a concrete runtime issue blocks functional verification.


## OpenAPI response contracts — step 16E (in progress, 2026-10-31)

- Branch: `docs/openapi-core-resource-response-audit-step-16e`.
- Product management list/detail/create/update now use source-backed `productInclude` schemas (company/category/subcategory, price tiers, images, documents, max ten status-history records). Management-only fields stay out of public catalog response schemas.
- Company list/detail/create/update now document Company scalar fields, counts, inquiry limits, usage limits and flattened max-ten recent user projections.
- Inquiry list/detail/create/update/status and item list/create/update now document caller-shaped responses, compact product/company relations, status history, and list count. `buyerUserId` is omitted; confidentiality and sealed/anonymous-sealed response hiding/redaction are reflected in optional/nullable fields.
- Admin notification folder CRUD and 202 announcement receipt now have concrete response schemas.
- Corrected created-response contracts to wrap data under `{data}` (not a bare object). Structural tests added. Static route audit: 149/149 inventory routes, zero missing/duplicate keys and zero duplicate top-level schema declarations. CI pending.


## OpenAPI response contracts — step 16E merged (2026-10-31)

PR #54 merged by squash into `main` at `8ab9acf25c1380e51fc840fa7d69ea42377971b4`.

- Product management list/detail/create/update contracts follow `productInclude`, including price tiers, images, documents and up to ten status-history rows. Public product schemas remain distinct.
- Company list/detail/create/update contracts include Company scalars, inquiry/usage limits, counts and up to ten flattened user summaries.
- Inquiry list/detail/create/update/status and item list/create/update contracts preserve buyerUserId omission, confidential company hiding, sealed response count omission, anonymous-sealed supplier redaction and caller-specific response visibility.
- Admin notification folder CRUD and announcement 202 receipt now have concrete schemas. Create operations use `{data}` with 201.
- CI passed: backend 1,390/1,390; frontend/shared 18/18; frontend builds passed. Prisma migration validation passed. Runtime compose/browser validation was still running at merge time and is not counted as passed.

## Next active work — step 16F remaining response coverage

- Audit remaining generic resource/paginated response placeholders for users, roles/permissions, categories/subcategories, settings, company settings/statistics/products and product price-tier/image/document operations.
- Prefer stable service projections and explicit security omissions; avoid broad schema guesses for dynamic or unstable DTOs.
- Add focused structural tests and update API/.ai docs, then CI/migration validation and merge.


## OpenAPI response contracts — step 16F (in progress, 2026-10-31)

- Branch: `docs/openapi-company-product-category-aux-step-16f`.
- Added company settings GET/PATCH, company statistics and company product pagination schemas from exact service return shapes.
- Added category public/manage list, detail, subcategory list/detail, category product pagination, and category/subcategory CRUD schemas. Subcategory detail includes category and optional specification template/fields.
- Added specification-library search/all schemas based on the explicit selected fields and 50-result search cap.
- Added product price-tier, image, document and workflow-transition response schemas; corrected all auxiliary delete endpoints to HTTP 204 with no body.
- Reused step16E DTO schemas where the service projection is identical. Static route coverage remains 149/149 with zero missing/duplicate keys or duplicate top-level declarations. Structural tests added. CI pending.


## OpenAPI response contracts — step 16F merged (2026-10-31)

PR #55 merged by squash into `main` at `306a82047e3226bf93660598dfcc1b29dcf0e1c5`.

- Company settings, statistics and paginated company-product responses now have concrete schemas.
- Category public/manage/detail/subcategory/product and CRUD responses are source-backed. Subcategory detail includes category and optional specification template/fields.
- Specification library search/all schemas follow explicit selected fields; search is capped at 50.
- Product price-tier/image/document and workflow transition responses are documented; category/subcategory/tier/image/document delete routes correctly return 204 with no body.
- CI passed: backend 1,391/1,391; frontend/shared 18/18; frontend builds passed. Prisma migration validation passed. Runtime compose/browser validation was still in progress at merge time and is not counted as passed.

## Next active work — step 16G user/RBAC/settings/admin response coverage

- Add source-backed response schemas for users/access profiles, roles, permissions and assignable roles.
- Add settings/profile/preferences/avatar/password response contracts, company logo/settings operations and remaining admin stats/settings/plan/subscription operations.
- Verify exact no-content status codes, direct `{data}` versus `success(data)` envelopes and secret-field omissions.
- Add structural tests, update API/.ai docs, CI/migration validation and merge.


## OpenAPI response contracts — step 16G (in progress, 2026-10-31)

- Branch: `docs/openapi-user-rbac-settings-admin-step-16g`.
- Added user list/detail/create/update/access/activation/company-move/delete contracts. List uses role/permission name arrays; detail responses use full safe role/permission scalar records. `passwordHash` and refresh tokens are omitted.
- Added role list (plain or paginated), assignable roles, role CRUD and permission list (plain/paginated/grouped), permission CRUD schemas based on ROLE_SELECT/PERMISSION_SELECT.
- Added current-user settings profile, password change, avatar upload/delete envelopes.
- Added admin stats (8 counts, 5 recent users, 20 pending products), system settings, inquiry monetization switch, plan CRUD and manual subscription action schemas. Plan actions use full InquiryPlan and compact company/user owner projections.
- Structural tests added. CI/migration validation pending.


## OpenAPI response contracts — step 16G merged (2026-10-31)

PR #56 merged by squash into `main` at `bebc3192440c9f3b66080a78384d627fdabb4e24`.

- User list/detail/create/update/access/access-active/company-move/delete contracts distinguish role/permission name arrays from detailed scalar records; passwordHash and refresh tokens are excluded.
- Role plain/paginated and assignable responses; permission plain/paginated/grouped variants and CRUD responses are documented.
- Current-user settings profile, password change and avatar responses are documented.
- Admin stats, system settings, inquiry monetization, plan CRUD and manual subscription grant/activate/reject responses are documented.
- CI passed: backend 1,392/1,392; frontend/shared 18/18; frontend builds passed. Prisma migration validation passed. Runtime compose/browser validation was still pending and is not counted as passed.

## Next active work — step 16H remaining auth/notification/system response audit

- Audit remaining generic response placeholders for auth register/login/refresh/me/handoff, notification preferences/folders/read/delete actions, company logo/status/restore, and remaining product status/soft-delete responses.
- Reconcile all controller status codes and error response contracts, including 204/no-body and direct `{data}` responses.
- Add structural tests and API/.ai docs; CI/migration validation and merge. Keep browser smoke out of the critical path unless a concrete runtime defect blocks correctness.


## OpenAPI response contracts — step 16H (in progress, 2026-10-31)

- Branch: `docs/openapi-auth-notifications-lifecycle-step-16h`.
- Added source-backed customer registration and company registration responses. Customer registration has a null AccessProfile and CUSTOMER_USER role; company registration creates a PENDING company/manager with inactive COMPANY AccessProfile and no auto-assigned role.
- Added PKCE handoff create/redeem response schemas. The code is 60-second/one-use; redeem body contains access token and safe context while refresh token remains httpOnly-cookie-only.
- Added direct `{data,smsAvailable}` preference response schemas (not nested success envelope), including explicit `smsAvailable:false`; corrected user-folder fields to include `isSystem` and `sortOrder` returned by service.
- Added company restore/status/verify/logo response schemas. Corrected company and product DELETE contracts to HTTP 204 with no response body, matching controllers.
- Added full managed-product response schema for all seven status workflow transitions, including latest ten status history rows.
- Added structural tests for all response variants and secret omissions. CI/migration validation pending.


## OpenAPI response contracts — step 16H merged (2026-10-31)

PR #57 merged by squash into `main` at `415b6858a9f34235f6cf726a558d76afb5b92af4`.

- CI [41236279545](https://github.com/gameacc2025/martest/actions/runs/41236279545) passed: backend 1,393/1,393; frontend/shared 18/18; all frontend builds passed.
- Prisma migration validation [41236279647](https://github.com/gameacc2025/martest/actions/runs/41236279647) passed.
- Runtime compose/browser validation [41236279570] was queued and is not claimed as passed; browser smoke is not a critical-path requirement unless a concrete runtime defect blocks correctness.
- Added source-backed customer/company registration, PKCE handoff, logout, notification preference/folder, company lifecycle/logo, and product status workflow response schemas.
- Customer registration documents ACTIVE user + personal profile + null AccessProfile + CUSTOMER_USER role. Company registration documents PENDING company/manager + inactive COMPANY AccessProfile and no auto-assigned role. Refresh token remains cookie-only.
- Notification preference responses are direct `{data,smsAvailable:false}`; folder listing includes `isSystem` and `sortOrder`.
- Company and product soft-delete routes now document HTTP 204 with no response body, matching their controllers.
- Product workflow actions document the managed product projection including related resources and latest ten status-history rows.
- Static route coverage: 149 inventory routes / 149 unique literal route keys; zero missing and zero duplicate.

## Next active work — step 16I error and response metadata audit

- Audit error response shapes/statuses and route-level response status metadata against controller/service behavior, especially validation, authorization, not-found, conflict and 204 cases.
- Inspect remaining OpenAPI placeholders after accounting for later response overrides; do not assume the initial generic registry entry is the effective response.
- Add structural tests for final effective route responses and metadata, update API/.ai docs, run CI/migration validation, and merge.


## OpenAPI error/status response audit — step 16I (in progress, 2026-10-31)

- Branch: `docs/openapi-error-response-audit-step-16i`.
- Audited `error-handler.plugin.js` and `swagger.plugin.js` default response behavior. Prisma P2002 maps to 409; multipart file-size errors are Fastify 413 and are normalized by the app error handler; auth/global rate limiting emits a 429 rate-limit payload.
- Added global 409/413/429 responses. The 429 response uses ErrorResponse because the central Fastify error handler normalizes the rate-limit Error into `{error:{code:'APP_ERROR',message}}`. Expanded ErrorResponse with optional development-only debug/stack fields; production responses still omit them.
- Added Swagger contract tests for 409/413/429 and debug/stack schema fields. Strengthened security rate-limit integration test to assert actual 429 body shape.
- CI/migration validation pending.


## OpenAPI error/status response audit — step 16I merged (2026-10-31)

PR #58 merged by squash into `main` at `4ee4dbca6486588af34eda4ed9a22a809a7cb73d`.

- CI [41236781704](https://github.com/gameacc2025/martest/actions/runs/41236781704) passed: backend 1,393/1,393; frontend/shared 18/18; all frontend builds passed.
- Prisma migration validation [41236781614](https://github.com/gameacc2025/martest/actions/runs/41236781614) passed.
- Central error handler normalizes rate-limit exceptions (HTTP 429) to `{error:{code:'APP_ERROR',message}}`; the initial assumption of a raw `{statusCode,error,message}` body was disproved by the security integration test and corrected.
- OpenAPI global error responses now include 409 conflict, 413 oversized request/file, and 429 rate limit. All use ErrorResponse; 429 does not expose Fastify's internal Error object.
- ErrorResponse documents optional development-only debug/stack fields; production still omits them.
- Swagger tests and security integration tests cover status and body shapes.

## Next active work — step 16J final route response audit

- Audit route inventory against registered Fastify routes and effective OpenAPI operations (including paths with aliases/prefixes).
- Identify remaining undocumented response bodies/statuses or stale metadata, with focus on 204 endpoints, public routes, cookie/PKCE auth and any routes falling back to undocumented security.
- Add static/structural tests, update API/.ai docs, run CI/migration validation and merge.


## OpenAPI runtime route coverage audit — step 16J (in progress, 2026-10-31)

- Branch: `test/openapi-runtime-route-coverage-step-16j`.
- Added an app-level integration test that boots the actual Fastify app (existing Prisma/env mocks), fetches `/docs/json`, and compares every route in `API_ROUTE_INVENTORY.md` against the generated OpenAPI path+method.
- The test also checks effective bearer/cookie/public security metadata against route docs, verifies global 400/401/403/404/409/413/429/500 responses, and ensures any 204 operation has no response body.
- This closes the gap between static route-doc key coverage and actual Swagger transform output. CI pending.


## OpenAPI runtime route coverage audit — step 16J merged (2026-10-31)

PR #59 merged by squash into `main` at `28b9d1035689b099f18cbd711c56bd4b8bae7e3e`.

- CI [41237449214](https://github.com/gameacc2025/martest/actions/runs/41237449214) passed: backend 1,394/1,394; frontend/shared 18/18; all frontend builds passed.
- Prisma migration validation [41237449259](https://github.com/gameacc2025/martest/actions/runs/41237449259) passed.
- Added real-app `/docs/json` integration coverage: all 149 API inventory routes are present with method/path, security metadata matches route docs, global error statuses 400/401/403/404/409/413/429/500 are present, and 204 responses are bodyless.
- The integration test exposed two actual documentation details: root Fastify routes appear with trailing slash in Swagger (`/users/`), and `@fastify/swagger` requires `type: 'null'` for empty-body responses. All 13 204 entries now declare explicit null bodies and generated OpenAPI verifies them as bodyless.

## Next active work — step 16K repository branch and documentation consistency audit

- Reconcile all existing remote branches against `main` before merging/deleting anything; merge only branches with valid, non-duplicate feature commits and no conflicting history.
- Verify route inventory, API docs and `.ai` current-task/worklog/project context all point to merged main state.
- GitHub connector currently exposes branch creation/update but no branch-delete operation; do not claim remote branch deletion. Provide exact PowerShell commands for stale branch deletion after the safe merge audit.


## OpenAPI delivery query filters — step 16K (in progress, 2026-10-31)

- Branch: `docs/openapi-delivery-query-filters-step-16k`.
- Safe branch audit found 31 remote branches; all but two map to already-merged PR heads. `feat/website-homepage-redesign` has zero commits ahead of main and is safe to delete. `docs/openapi-admin-inquiry-delivery-responses-step-16d` is a scratch branch whose response schema work is already superseded by merged 16D/16E work, but its admin delivery querystring schema is not present in main.
- Added source-backed delivery query filters to both admin delivery stats and delivery list docs. Exact controller inputs: status, channel, eventType, userId, page, limit. Excluded from/to because controller/service do not consume them. No max limit is claimed because service does not clamp it.
- Added static schema tests and generated `/docs/json` integration assertions for query parameter presence/absence. CI pending.


## OpenAPI response contracts — step 16H complete (2026-10-31)

- Branch: `docs/openapi-auth-notification-company-responses-step-16h`.
- Auth responses cover customer/company registration, login, refresh, current-user context, logout and one-time PKCE handoff/redeem. Refresh token remains cookie-only; response schemas do not expose refreshToken or passwordHash. Customer registration has no AccessProfile; company manager registration is pending with inactive AccessProfile and no implicit role.
- Notification preferences use direct `{data,smsAvailable}` (not a success envelope); current SMS availability is false. User notification list is direct `{data,meta}`, unread count `{count}`, bulk actions `{success,count}`, folder membership `{success,action,notificationId,folderId}`. User folders include scope/system/sort fields and are selected from token-derived app scope.
- Company restore/status/verify/logo return company data. Company soft-delete and product soft-delete return HTTP 204 with no body. Product workflow transitions return managed product projection with status history.
- Added a second regression test to assert auth secret omissions, notification direct envelopes and lifecycle response status/body contracts. API guide updated. CI/migration validation pending.

## Next active work — step 16I response/error contract audit

- Audit common error envelopes and per-route error status codes for auth, permission/ownership failures, validation, missing resources, quota/plan restrictions and payment callbacks.
- Ensure 204 routes have no body, 201 creation routes and direct pagination envelopes are accurate, and public/sealed inquiry projections remain redacted.
- Add focused structural tests and API/.ai documentation; validate CI/migrations and merge.


## OpenAPI response contracts — step 16H merged (2026-10-31)

PR #61 squash-merged into `main` at `fc6caac4aa742c0f2c12e7778faffc6eafcf1389`. CI [41239961588](https://github.com/gameacc2025/martest/actions/runs/41239961588) passed: backend 1,397/1,397; frontend/shared 18/18; all three frontend builds passed. Prisma migration validation [41239961564](https://github.com/gameacc2025/martest/actions/runs/41239961564) passed. Runtime compose validation [41239961558](https://github.com/gameacc2025/martest/actions/runs/41239961558) was separate from required test/build and migration gates.

- Auth response contracts preserve cookie-only refresh tokens and omit password hashes. Customer registration has no AccessProfile; company registration is pending with inactive company AccessProfile.
- Notification preferences are direct `{data,smsAvailable}` (SMS unavailable); notification list `{data,meta}`; unread count `{count}`; bulk operations `{success,count}`; folder membership `{success,action,notificationId,folderId}`. Folder scope is derived from the authenticated token.
- Company restore/status/verify/logo return company records. Company and product soft delete return 204 with no body. Product lifecycle transitions return managed product projection with status history.
- Regression tests cover auth secret omission, direct notification envelopes and lifecycle response statuses.

## Next active work — step 16I error/status contract audit

- Audit common error handler envelopes and route-specific status codes for authentication, authorization/tenant ownership, validation, missing resources, quota/subscription restrictions and payment callbacks.
- Align OpenAPI response schemas for 400/401/403/404/409/422/429/500 as actually emitted; avoid claiming one uniform error shape if handlers differ.
- Verify 204 no-body and 201 creation responses across the route inventory; add focused tests, API/.ai docs, CI/migration validation and merge.


## OpenAPI error/status audit — step 16I findings (2026-10-31)

- Inspected `error-handler.plugin.js`, `auth.plugin.js`, `rbac.js`, `originGuard.js`, `app.js`, `swagger.plugin.js`, `auth.schemas.js`, inquiry payment/subscription services and existing error-handler/auth/Swagger tests.
- Actual error shapes are not uniform: central handler uses `{error:{code,message,details?}}`; auth and RBAC guards often send `{error:true,code,message}` directly (one refresh branch sends nested error); rate limiting uses the default Fastify response `{statusCode,error,message}` because no custom `errorResponseBuilder` is configured.
- Central handler maps Prisma P2002→409, P2025→404, P2003/P2014→400; validation→400. Generic production 500 is `{error:{code:'INTERNAL_ERROR',message}}`; debug/stack are development-only.
- Payment service emits internal 502/503 `statusCode` values, but central handler deliberately normalizes all thrown 5xx errors to generic 500. Public clients currently receive 500/INTERNAL_ERROR, not the provider code/status.
- Identified an OpenAPI mismatch: `ErrorResponse` component models only the nested envelope, and Swagger's 429 description incorrectly claims central wrapping. No code/schema change has been merged in this audit slice; follow-up step 16J will safely model the union and decide whether sanitized payment gateway statuses should be preserved, with tests proving no internal leakage.
- Route inventory and 204/201 checks remain covered by the existing 149-route OpenAPI registry tests.

## Next active work — step 16J common error schema/status correction

- Update shared OpenAPI ErrorResponse to a oneOf union for central, direct auth/RBAC and Fastify rate-limit envelopes; correct 429 description.
- Add exact 502/503 only if the central handler safely preserves an allow-list of sanitized payment-provider errors; all other 5xx must remain generic 500.
- Extend Swagger/error-handler tests for every envelope and ensure production responses never leak provider/internal debug data.
- Update API/.ai docs, run CI/migration validation, merge.


## OpenAPI error/status audit — step 16I findings merged (2026-10-31)

PR #62 squash-merged into `main` at `3d3c2de398566e9f064744dcd3698f43dbd54d6c`. CI [41240689243](https://github.com/gameacc2025/martest/actions/runs/41240689243) passed: backend 1,397/1,397, frontend/shared 18/18 and frontend builds. Prisma migration validation [41240689183](https://github.com/gameacc2025/martest/actions/runs/41240689183) passed. Runtime validation [41240689335](https://github.com/gameacc2025/martest/actions/runs/41240689335) is separate.

- Documented three actual error envelopes: central nested `{error:{code,message,details?}}`, direct auth/RBAC `{error:true,code,message}`, and default Fastify rate-limit `{statusCode,error,message}`.
- Documented Prisma/validation mappings and production 500 redaction. Payment service 502/503 throws currently normalize to generic 500 in the central handler.
- Identified the OpenAPI shared `ErrorResponse` mismatch and incorrect 429 description; no runtime behavior changed in this audit-only PR.

## Next active work — step 16J common error schema correction

- Align shared OpenAPI ErrorResponse with central, direct guard and Fastify rate-limit variants; correct 429 description.
- Evaluate a narrowly allow-listed 502/503 payment response path only if it can preserve sanitized messages and keep all other 5xx generic.
- Add Swagger/error-handler tests for each variant and production redaction; update API/.ai docs, CI/migration validation and merge.


## OpenAPI error envelope correction — step 16J (in progress, 2026-10-31)

- Branch: `docs/openapi-error-envelope-schemas-step-16j`.
- Route-doc responses now override Swagger defaults for 401/403 with `oneOf`: central nested `ErrorResponse` plus direct auth/RBAC `{error:true,message,code?}`. 500 also accepts both shapes because `authenticateRefresh` has a direct catch-all 500 body.
- 429 now documents native Fastify `{statusCode:429,error:'Too Many Requests',message}` rather than claiming central wrapping.
- 502/503 are intentionally not advertised: inquiry payment service throws those internal status codes, but central handler currently normalizes all thrown 5xx to generic 500. No unsafe behavior change was made.
- Added structural tests for 401/403/429/500 variants and payment status normalization; route inventory remains 149/149 with no duplicate keys. CI pending.


## OpenAPI error envelope correction — step 16J merged (2026-10-31)

PR #63 squash-merged into `main` at `97ea2bb9adaa140fb8b41925269446264fd088a7`. CI [41240966618](https://github.com/gameacc2025/martest/actions/runs/41240966618) passed: backend 1,398/1,398; frontend/shared 18/18; all frontend builds passed. Prisma migration validation [41240966682](https://github.com/gameacc2025/martest/actions/runs/41240966682) passed. Runtime [41240966686](https://github.com/gameacc2025/martest/actions/runs/41240966686) is a separate workflow.

- Route-level OpenAPI 401/403 now model the nested central error and direct auth/RBAC guard error via `oneOf`.
- 500 models both the central nested error and the direct auth-refresh catch-all response.
- 429 documents native Fastify `{statusCode,error,message}`; the incorrect claim of central wrapping is removed.
- Payment service 502/503 exceptions remain normalized to generic 500 by the central handler and are not advertised as public statuses. This preserves current production redaction; safe payment status behavior remains a follow-up decision.
- Structural tests pass and all 149 route inventory entries remain documented with no duplicates.

## Next active work — step 16L payment error contract and provider failure handling

- Trace request/retry/callback payment paths and their controller response/redirect behavior.
- Decide whether sanitized provider-unavailable/rejected errors should surface as 502/503 or remain generic 500; if changing, use a narrow allow-list and never expose provider response bodies, merchant configuration, authority secrets or stack traces.
- Add controller/service/error-handler tests for provider unavailable, malformed response, rejected request, missing configuration and generic unexpected errors.
- Update route-level OpenAPI statuses and API/.ai docs only after runtime behavior is verified; CI/migration validation and merge.


## Payment provider error handling — step 16L (in progress, 2026-10-31)

- Branch: `audit/payment-provider-error-contract-step-16L`.
- Inquiry controller now catches only a strict allow-list of provider errors and returns sanitized nested `{error:{code,message}}` with correct HTTP status: provider unavailable/HTTP/invalid response/request rejected → 502; provider not configured → 503.
- Applied handling to subscription request, retry verification and public callback. Callback verification outages are already converted by the service to a `pending` redirect and remain so.
- Unrecognized codes, mismatched status codes, and invalid provider configuration continue to throw to the central handler (generic 500); no provider response body, merchant ID, authority, stack or config values are exposed.
- OpenAPI now documents 502 only on subscription request and 503 on retry verification and callback. Added controller and route-doc tests. CI pending.


## Payment provider error handling — step 16L merged (2026-10-31)

PR #64 squash-merged into `main` at `3d7fa5276d211897d69fa5f567c09f3b4a5443f7`. CI [41241532496](https://github.com/gameacc2025/martest/actions/runs/41241532496) passed: backend 1,404/1,404; frontend/shared 18/18; frontend builds passed. Prisma migration validation [41241532777](https://github.com/gameacc2025/martest/actions/runs/41241532777) passed. Runtime [41241532900](https://github.com/gameacc2025/martest/actions/runs/41241532900) remains a separate workflow.

- Inquiry controller maps only allow-listed payment errors to sanitized responses: request/provider HTTP/invalid response/rejection → 502; provider not configured → 503.
- Applied to subscription creation, retry verification and callback. Transient callback verification failure still redirects with `payment=pending` and never activates without server-side verification.
- Unrecognized/mismatched errors and invalid provider configuration continue to central generic 500. Only code/message are returned; provider body, merchant ID, authority, stack and config are not forwarded.
- OpenAPI exposes 502 only for subscription creation and 503 for retry verification/callback. Tests cover safe payloads and unknown error propagation.

## Next active work — step 16M generated OpenAPI integration verification

- Add an integration test against `/docs/json` for actual registered auth, notification, inquiry payment and lifecycle routes (not only the static route-doc registry).
- Assert generated OpenAPI preserves route-level 401/403 oneOf, native 429, 500 variants, payment 502/503 only on relevant routes, and 204 no-content semantics.
- Ensure security schemes and route path normalization are correct; CI/migration validation and merge. Then continue remaining Inquiry flow test/feature gaps from project roadmap.


## Generated OpenAPI integration verification — step 16M (in progress, 2026-10-31)

- Branch: `test/openapi-generated-spec-step-16M`.
- Added a Swagger `/docs/json` integration test that registers inquiry subscription creation, retry verification, public payment callback and product soft-delete routes, then asserts generated 401/403/429/500 variants, route-specific 502/503 and 204 no-content.
- Existing Swagger integration test separately asserts refresh uses cookieAuth and handoff redeem is non-bearer; static route tests cover notification preferences and all 149 route docs.
- CI pending.


### Step 16M additional finding

- Generated spec test initially exposed that Swagger transform unconditionally overwrote route-doc 401/403/500 response schemas with shared defaults. Updated `swagger.plugin.js` to prefer route-specific error schemas while retaining defaults when no route override exists; corrected the default 429 description to native Fastify behavior.
- Generated spec integration assertions now exercise the actual transformed output, not only static route docs. CI rerun pending.


## Step 16M — generated OpenAPI response precedence fix (2026-11-01)

- CI run [41242121449](https://github.com/gameacc2025/martest/actions/runs/41242121449) exposed a real generated-spec defect: `mergeResponseDocs` merged route-doc responses first and schema-generated responses second, so generated defaults silently overwrote audited 401/403/429/500 route contracts.
- Corrected precedence: actual registered route schemas remain as fallback, while explicit route-doc response contracts now win. This preserves the audited guard unions, native Fastify 429, payment-only 502/503 and 204 no-content contracts.
- The integration test at `/docs/json` already reproduced the bug and now verifies the corrected output. Migration validation passed on prior head [41242121332]; CI rerun pending.


## Step 16M — OpenAPI 3.0 compatibility correction (2026-11-01)

- First rerun still failed at generated `/docs/json` assertion because OpenAPI 3.0.3 does not support JSON Schema `const`; Swagger serialization dropped the `const` keywords, so the expected discriminator values were absent in the generated spec.
- Replaced `const` with single-value `enum` for direct auth/RBAC error and native Fastify 429 fields; updated static and generated-spec tests to assert enum arrays. Kept the response merge precedence correction so route docs override generated defaults.
- CI and migration validation rerun pending.


- Follow-up CI caught a test-only assertion mistake: enum arrays were compared with strict scalar equality. Updated those assertions to structural `deepEqual`; generated Swagger integration checks now pass on the preceding attempt, and only the static assertion failed. CI rerun pending.


- A subsequent CI run passed the static error-contract tests but the generated-spec test had the same test-only issue: enum arrays were still checked with `assert.equal`. Converted generated-spec enum assertions to `assert.deepEqual` as well. No runtime/API behavior changed. CI rerun pending.


## Generated OpenAPI integration verification — step 16M merged (2026-11-01)

PR #65 squash-merged into `main` at `5cdb8e81acdf679bf60e36c2c36dec118e118156`.

- CI [41270193698] passed. Database migration validation [41270193682] passed. Runtime validation [41270193677] was a separate workflow and was still running at merge time; it is not claimed as passed.
- Generated `/docs/json` integration test now verifies actual transformed auth/RBAC 401/403 unions, native Fastify 429, 500 union, route-specific payment 502/503, and 204 no-content behavior.
- Fixed Swagger response merge precedence so explicit audited route docs override generated/default response schemas while registered route schemas remain fallback.
- Fixed OpenAPI 3.0.3 fixed-value constraints by using single-value `enum` instead of unsupported `const`. Structural and generated-spec tests pass.

## Next active work — step 16N inquiry flow completion audit

- Audit end-to-end inquiry creation, item mutation, visibility/reveal rules, supplier eligibility, response submit/update/withdraw/decision, messages, attachments, subscription/quota enforcement and notification/SMS effects against service/controller code and existing tests.
- Prioritize concrete authorization, ownership, sealed/anonymous disclosure and quota bypass gaps. Keep STAFF moderation distinct from supplier participation; require COMPANY/CUSTOMER context and explicit `inquiries.create` / `inquiries.respond` permissions where appropriate.
- Add missing unit/integration tests and fix only verified defects; do not change intended business policy without evidence. Update `.ai` and API docs; run CI/migration validation and merge each completed slice.


## Inquiry flow audit — step 16N (in progress, 2026-11-01)

- Audited inquiry routes, service/controller, subscription service and existing tests. Existing suite already covers access context/permission boundaries, STAFF-vs-supplier separation, owner scoping, sealed/anonymous reveal, duplicate responses, stale decisions, attachment type/size/cap and file cleanup, message recipient restrictions, SMS preference/provider/quota handling, and payment callback verification.
- Found a test coverage gap: `inquiry.service.test.js` mocked company capacity checks but left `SystemSetting.inquiry.subscription_enforcement` hardcoded false. Thus core create/response/message services did not verify that their real `consumeUsage` integration records the right usage type/reference when enforcement is enabled.
- Added dynamic enforcement flag to test Prisma fixture and integration-style service tests for company inquiry creation (`INQUIRY_CREATE`), Website customer inquiry creation (user-owned `INQUIRY_CREATE`), supplier response submission (`RESPONSE_SUBMIT`) and internal message sending (`INTERNAL_MESSAGE`). Tests assert subscription row locking and usage-event references.
- No production behavior changed in this slice. CI/migration validation pending.


## Inquiry usage integration coverage — step 16N merged (2026-11-01)

PR #66 squash-merged into `main` at `1c9e960a7144ff86369a4aa5ce88ca7514eb7de8`. CI [41270495169] passed and Prisma migration validation [41270495193] passed. Runtime validation [41270495206] was separate/in progress and is not marked passed.

- Service tests now enable monetization enforcement and verify company/user inquiry creation (`INQUIRY_CREATE`), supplier response (`RESPONSE_SUBMIT`) and internal message (`INTERNAL_MESSAGE`) usage events, references and subscription locking.
- No production behavior changed in step 16N.

## Next active work — step 16O response attachment concurrency

- Fix race in per-response 10-attachment cap: current check/count and insert were not serialized, so simultaneous uploads could exceed the cap.
- Pre-validate ownership before reading/storing the upload, write file outside the DB lock, then lock parent Inquiry row, re-check response editability/ownership, count and insert inside one transaction. Clean up the stored file if the locked check or DB insert fails.
- Add tests proving lock-before-count ordering, concurrent-safe cap decision path and file cleanup. CI/migration validation and merge.


## Inquiry response attachment concurrency — step 16O merged (2026-11-01)

PR #67 squash-merged into `main` at `8ec294c6ca41c64ddfbdf5acabd17e0b4debea12`. CI [41270660122] passed; Prisma migration validation [41270660084] passed. Runtime validation [41270660090] was separate/in progress at merge and is not claimed as passed.

- Per-response attachment cap race fixed. Upload now validates before consuming multipart data, writes the file before DB locking, then locks parent Inquiry, re-checks ownership/editability, counts and inserts inside one transaction.
- If the locked re-check, cap or insert fails, the prewritten file is removed. Tests assert lock-before-count/create ordering and cleanup at the cap.

## Next active work — step 16P inquiry message and lifecycle transaction audit

- Audit message send/read state, supplier response decisions, withdraw/update and inquiry status changes for race windows, duplicate side effects, missing idempotency, and transactional notification consistency.
- Prioritize any verified issue with business impact; preserve current role/ownership/visibility rules. Add focused regression tests and update docs before CI/migration validation and merge.


## Inquiry message read-state race — step 16P (in progress, 2026-11-01)

- Found a concrete read-state bug in `listInquiryMessages`: after fetching at most 500 rows, it updated every unread message for that recipient in the inquiry. Messages beyond the returned page or arriving after the SELECT could be marked read without ever being returned to the caller.
- Fixed by collecting unread recipient message IDs from the fetched result and updating only those IDs, still scoped by inquiry/recipient/readAt-null. Returned message objects now include the readAt timestamp written by this request.
- Updated COMPANY and AccessProfile-less CUSTOMER tests to verify recipient-only updates, exact ID scoping and returned readAt values. CI pending.


## Inquiry message read-state race — step 16P merged (2026-11-01)

PR #68 squash-merged into `main` at `9ebbfbd96fa5e5df836abc6c8f930d4f252bace0`. CI [41270839852] passed and Prisma migration validation [41270839763] passed. Runtime [41270839712] was separate/in progress at merge and is not claimed as passed.

- Message list now marks only unread recipient message IDs included in the returned result as read; it no longer marks all unread messages in the thread, including unseen messages beyond the 500-row result or messages arriving after the SELECT.
- Returned message records include the readAt timestamp written by the request. COMPANY and AccessProfile-less CUSTOMER tests verify recipient + ID scoping and returned read state.

## Next active work — step 16Q inquiry messaging notification and delivery audit

- Trace whether newly created inquiry messages generate the intended in-app notification/unread badge behavior, email/SMS delivery policy and event templates; compare service writes, notification event registry, frontend consumption and tests.
- Verify sender/recipient identity for company-owned and user-owned inquiries, sealed/anonymous redaction, and dedupe/transaction boundaries. Add only policy-backed behavior; do not silently introduce paid SMS or change notification preferences.


## Inquiry message notification delivery — step 16Q (in progress, 2026-11-01)

- Confirmed `INQUIRY_MESSAGE_RECEIVED` already exists in `notification.events.js` with IN_APP + EMAIL enabled by default and SMS opt-in. `sendInquiryMessage` previously wrote the message and optional paid SMS outbox row but never dispatched this event, so no in-app notification/email was created.
- Added transactional `dispatchNotification('INQUIRY_MESSAGE_RECEIVED', ...)` after message creation and internal-message quota consumption. Recipients are resolved to the active Website buyer user or active users with `accessProfile.type=COMPANY` and `isActive=true` for the recipient company. This deliberately excludes STAFF accounts that may share the Main-company ID.
- Notification context carries inquiry id/title; dedupe keys are per recipient (`inquiry-message-{messageId}-{userId}`) so one company member's email does not suppress another's.
- Existing optional paid SMS path remains separate, opt-in, quota-enforced and Twilio-outbox-backed. Tests added for user/company recipient resolution, STAFF exclusion and per-recipient dedupe. CI pending.


## Inquiry message notification dispatch — step 16Q merged (2026-11-01)

PR #69 squash-merged into `main` at `ef55a970e03bc746128c234272a63aa5a6a6c246`. CI [41271042201] passed and Prisma migration validation [41271042195] passed. Runtime [41271042218] was separate/in progress at merge and is not claimed as passed.

- New inquiry conversation messages now dispatch the existing `INQUIRY_MESSAGE_RECEIVED` event inside the same transaction as message persistence and `INTERNAL_MESSAGE` usage consumption.
- Recipient resolution is restricted to the active Website buyer user or active COMPANY access-profile members (`type=COMPANY`, `isActive=true`); STAFF sharing Main-company IDs are excluded.
- Per-recipient dedupe keys prevent one company member's email from suppressing another's. Default IN_APP/EMAIL preferences apply; optional paid SMS remains separate and unchanged.

## Next active work — step 16R inquiry response lifecycle notifications

- Audit whether supplier response withdrawal and other buyer/supplier-visible lifecycle changes have appropriate notification events and recipients. Compare current event catalog and documented workflow before adding any new event.
- If policy supports it, add a dedicated withdrawal event, dispatch transactionally to the inquiry owner, preserve anonymous/sealed privacy, add tests for COMPANY buyer and Website user buyer, update notification docs/preferences, CI/migration validation and merge.


## Inquiry response withdrawal notifications — step 16R (in progress, 2026-11-01)

- Audit found supplier `withdrawResponse` changed a pending response to WITHDRAWN but did not notify the inquiry owner. The event catalog had no dedicated withdrawal event.
- Added `INQUIRY_RESPONSE_WITHDRAWN` with IN_APP + EMAIL defaults and an anonymous-safe template that names the inquiry/response IDs but never the supplier identity (safe for SEALED and ANONYMOUS_SEALED).
- On successful withdrawal, dispatches transactionally to the active Website buyer user or active COMPANY access-profile members only; STAFF sharing the Main-company ID are excluded. Per-recipient dedupe keys are used.
- Added service tests for company and Website buyer notification recipients and event template tests for anonymous safety. CI pending.


## Inquiry response withdrawal notification — step 16R merged (2026-11-01)

PR #70 squash-merged into `main` at `f2c957a2de1e8e8f5f0cdbc9fd552b912cd59ef7`. CI [41271249036] passed and Prisma migration validation [41271248977] passed. Runtime [41271249049] was separate/in progress at merge and is not claimed as passed.

- Added `INQUIRY_RESPONSE_WITHDRAWN` with IN_APP + EMAIL defaults and anonymous-safe wording; supplier identity is never included.
- Successful withdrawal dispatches transactionally to active Website buyer user or active COMPANY access-profile members only; STAFF sharing Main-company ID are excluded. Dedupe is per response/recipient.

## Next active work — step 16S inquiry status transition notifications

- Audit `changeInquiryStatus` and related transitions to ensure buyer, responding suppliers and STAFF receive only policy-appropriate events. Check CUSTOMER cancellation, COMPANY/STAFF close/complete/expire transitions, notification dedupe and transaction boundaries.
- Reuse existing event catalog where semantically correct; add a new event only when a distinct lifecycle event is required. Preserve sealed/anonymous supplier identity privacy. Add regression tests and update docs, CI/migration validation and merge.


## Inquiry status notification audit — step 16S (2026-11-01)

- Audited the existing `changeInquiryStatus` dispatch for OPEN publication and terminal transitions (CLOSED, EXPIRED, COMPLETED, CANCELLED). Existing status event dispatch already targets the inquiry owner and distinct companies with non-withdrawn responses, uses transaction-scoped persistence and per-user dedupe keys; the event payload contains only inquiry id/title and status, so it does not disclose supplier identity for SEALED/ANONYMOUS_SEALED.
- Found a cross-context recipient bug in the shared notification dispatcher: `{ companyIds }` resolved every ACTIVE user with a matching companyId but did not require `AccessProfile.type=COMPANY` or `AccessProfile.isActive=true`. STAFF accounts sharing the Main-company id could therefore receive company notifications.
- Fixed company recipient resolution to require ACTIVE user status plus COMPANY access profile, matching company ID and active access profile. This applies consistently to all company-targeted notifications, not only inquiry status changes.
- Added dispatcher regression coverage for the exact company recipient filter and inquiry status service tests for company owner + distinct responding companies, per-recipient dedupe, transaction binding, and Website buyer cancellation recipient.
- Branch: `fix/inquiry-status-notification-recipients-step-16s`. CI/migration validation pending.

- Additional regression found while running CI: `notifyInquiryOwner` used `recipients.length` to detect empty recipients. The company descriptor is an object (`{ companyIds: [...] }`) and has no `length`, so owner notifications for company-owned inquiries were silently skipped. Fixed the guard to distinguish ID arrays from company descriptor objects. The status transition test now asserts the owner company notification alongside distinct supplier companies.


## Inquiry status notification recipient audit — step 16S merged (2026-11-01)

PR #72 squash-merged into `main` at `903f24cdfe7746349fec0a32039acaf567d9118c`.

- CI [41283669357] passed: backend 1,417/1,417; frontend/shared 18/18; frontend builds passed.
- Prisma migration validation [41283669375] passed.
- Runtime validation [41283669383] was separate and still running at merge; it is not counted as passed. Earlier runtime attempts from the pre-fix commits are not relevant to the merged SHA.
- Fixed company notification recipient resolution to require ACTIVE user and active `AccessProfile` with `type=COMPANY` and matching company ID. STAFF sharing Main-company IDs and inactive company access profiles are excluded.
- Fixed `notifyInquiryOwner` empty-recipient guard: company descriptors are objects and were incorrectly treated as empty by `.length`; company-owned inquiry owners now receive status notifications.
- Verified terminal status events target the inquiry owner and distinct non-withdrawn responding companies transactionally, with per-recipient dedupe. Website buyer cancellation targets the buyer user ID. Event payload remains anonymous-safe (inquiry ID/title + status only).

## Next active work — step 16T inquiry response selection/rejection notification audit

- Audit `decideResponse` and auto-rejection flow against `INQUIRY_RESPONSE_SELECTED`, `INQUIRY_RESPONSE_REJECTED`, and `INQUIRY_RESPONSE_AUTO_REJECTED` events.
- Verify selected supplier receives selection notice; rejected suppliers receive rejection notices; losing pending responses are auto-rejected and notified; only actual affected companies are targeted.
- Preserve SEALED/ANONYMOUS_SEALED identity rules and buyer privacy. Ensure notifications are transactional with response decisions and inquiry status changes, deduped per response/recipient, and no duplicate or misleading event on idempotent retries.
- Add regression tests, update docs/.ai, CI/migration validation and merge.
