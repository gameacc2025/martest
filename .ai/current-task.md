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
