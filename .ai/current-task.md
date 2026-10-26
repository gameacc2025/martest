# Current Task / Agent Handoff

## Active task — PRODUCT-AUTH-FEATURED-STAFF-2026-10-26-01
- **Status:** IMPLEMENTED; CI verification pending.
- **Approved policy:** `isFeatured` may be set/changed only by SUPER_ADMIN or a caller with `products.feature`. STAFF cross-company writes require the exact operation permission; COMPANY ownership is never bypassed.
- **Implementation:** Service-level STAFF permission guards cover create/update/delete, price tiers, image/document operations, and lifecycle actions. STAFF product creation requires explicit `companyId`. Company/Admin forms hide the featured control and omit the field without permission. API and architectural decision docs updated.
- **Regression coverage:** Seven backend tests added for STAFF create/update/delete/media scope, featured creation/update, and STAFF-only moderation actions.
- **Verification:** Remote source edits only; local tests/builds NOT RUN. Must inspect GitHub Actions for current main HEAD before closing issues.
- **Next:** Verify CI, fix any failures, then close issues #5/#6 and master audit #2 if all checks pass.


## Completed — Notification inbox fixes and bulk actions

- **Status:** Earlier inbox actions are implemented; follow-up for independent folder counters and double-click-to-read has been committed to `main`; CI pending.
- **Affected apps:** Website, Company, Admin notification inbox pages.
- **Folder filtering and counts:** All three pages send folder/read filters to the server and apply a membership guard. All/Read totals and each server-managed folder count are fetched independently, so changing the active folder no longer changes other badges; zero badges remain visible.
- **Read state:** Added authenticated `PATCH /settings/notifications/:id/read-state` with `{ isRead: boolean }`; per-row and reading-pane controls toggle read/unread. A single click only selects/opens the message; double-click marks it read. Added `readOnly=true` server filtering for the read folder.
- **Mark all read:** Always calls the server action instead of returning early based on a potentially stale unread counter; then refreshes list and counter.
- **Bulk actions:** Checkboxes per row and select-current-page control; selected items can be marked read, marked unread, or bulk-deleted. New authenticated endpoints `POST /bulk-read-state` and `POST /bulk-delete`; both validate request bodies, cap batches at 100, and scope DB mutations to the authenticated user. Bulk read/unread updates visible rows immediately after server success, then refreshes the list and counts.
- **UI cleanup:** Removed the large copy/move section from the message body. Saved, move-to-folder, read/unread, and delete controls are compact in the reading toolbar; row-level read/unread and delete icons are available.
- **Security/tests:** Added ownership-scoped service operations and route/service tests. Frontend tests updated for the explicit read-state endpoint and initial selection behavior.
- **Verification:** GitHub Actions run [40201945241](https://github.com/gameacc2025/martest/actions/runs/40201945241) passed: frontend/shared tests 18/18, backend tests 1156/1156, Prisma Client generation, and production builds for Website, Company, and Admin.
- **Commits:** `5fa5c68` UI controls and folder filtering; `46bf7dc` read-state and bulk endpoints; `69dcf1a` endpoint test expectations; `f3eebbe` initial-selection test update; `39e660b` preserve controller response contracts.
- **Next:** Check CI for the latest counter/double-click follow-up, then pull `main` locally and verify independent folder counts, double-click read, selected bulk read/unread, mark all read, and bulk delete.


## In progress — Product lifecycle audit (#2; catalog follow-up #3)

- **Task ID:** PRODUCT-LIFECYCLE-AUDIT-2026-10-25
- **Status:** IN_PROGRESS — catalog contract fix is the first implementation milestone. Current main HEAD at restart: `475dd0bb70f54906289ee7329920c5cfefb28d2b`.
- **Issues:** https://github.com/gameacc2025/martest/issues/2 (lifecycle audit); https://github.com/gameacc2025/martest/issues/3 (catalog query/filter contract)
- **Scope:** Backend product service/controller/routes/tests; Company/Admin product forms and lists; Website listing/detail/store; product media/pricing/specifications; roadmap and AI-agent docs.
- **Initial repository evidence:** prior inspection observed an older HEAD; re-checked at restart and current `main` is `475dd0bb70f54906289ee7329920c5cfefb28d2b`. No open issues were returned before this task; issue #2 now tracks the audit. The current remote implementation includes a review-on-edit threshold and a `myProducts` controller branch intended to avoid scoping SUPER_ADMIN to a company.
- **Findings:** public list/detail source enforces PUBLISHED + PUBLIC for public callers; lifecycle transitions and review-on-edit policy are defined in the service; SUPER_ADMIN company-scope branch exists in `myProducts`. Catalog contract mismatch is tracked in #3: homepage labels first recent products as featured/best sellers, while list endpoint currently only consumes search/company/category/status; frontend sends price/stock/sort/featured parameters that the controller/service do not apply. The currently routed `/products` page is `ProductListing.vue`; `Products.vue` may be legacy and must not be edited without confirming use.
- **Verification available so far:** GitHub source inspection only. Local `git status`, runtime tests, builds, and browser checks are NOT RUN because no local checkout/runtime is available in this session.
- **Catalog milestone (source edits committed):** Backend list controller/service now forward and apply `minPrice`, `maxPrice`, `featured`, and allowlisted `sortBy`/`sortOrder`; public queries remain clamped to `PUBLISHED` + `PUBLIC`. Active Website `SearchResults.vue` now uses the actual paginated API contract, maps canonical Product fields to shared card fields, preserves pagination, and removes unsupported brand/rating/stock controls. Homepage now requests real featured products and labels its recent slice accurately. Homepage/catalog cards use the explicit primary image when set. API contract docs and service/controller regression tests were updated. Commits: `bac6f11906f72e9db23e68b0f4b39ef79f489eb0`, `6dcb4a2096c2a720eff2a314e7c6691339736019`, `744eb144c630d3a066d870649a1296b4c3eac9b5`, `8b3ac3853d107f1f0839d9429e7290569aadbfe7`, `bb6db21daf22fe2fef46b6abc00ef0613a09a64d`, `0f78d7c36cce65055c8959f2ed609f13c12586a5`, `466f59acf65efd44b5590fa4831509053f6ab7ff`, `ae6c42015270d362ed3e835b00580abf6c26fc6d`, `67a61834c53cf9f0a4aa7da155e32173cd9be57b`, `c8d18f0e2fa3c4b7335b618de0c7fdbf2bbee623`, `f7ffa7295289d6294e8ba7424bd977ce924ce573`, `8f78d48e337de42ec988d85a44a01b83370df722`.
**Pricing persistence milestone:** Found and fixed that both Company/Admin `ProductForm.vue` sent `priceTiers` on PATCH while `updateProduct` discarded them. Product update now validates the complete submitted tier set, preserves existing tier IDs/validity metadata, reconciles create/update/delete operations inside the same transaction, applies review-on-edit once per form save, and records price-tier status/activity history. Update schema accepts existing tier IDs and nullable max quantity/unit. Regression tests cover replacement, ID-based updates, unchanged tiers, metadata preservation, and request schema. Commits: `a2587ee556517e28fec860925eb4f7ee93c293d1`, `39be3e7743172bcadcec59f2707be52fee0ca903`, `09adaa21fd4a313b83f55d64c8d1e0da03466134`, `29d4d2a3ebee0decc50a28ebe494772dad94288c`, `79be530dc0597cf4f815eb30a6dc59f7580656ff`, `2438e2d8986cc3fb70d8b972b255a58eb82c6555`, `826384183215d3d29f8d4df38fc32d81f107b080`, `bd428acb8962a6fde63cde1e35b4e607739a4cd9`, `0e98602bc0d48ffc4eea52875ca637189b1b12f9`, `981fcfeb24f7a1adef8b71e6796a728295acc7d7`, `6e497e2dd301874844a166b882d707aeea133067`.
**Media controls milestone:** Both Company/Admin product forms now expose controls to set the primary image and reorder existing images through existing APIs, and the local image list updates after deleting the primary image. The product update response re-reads the product inside the transaction after price-tier reconciliation so returned prices reflect saved state. Commits: `41c21e0261bc568952fbea8cbcdcb4d87dc7108b`, `96777e038d92e149538e52b157985bbbd19c2610`, `ca1628279fbb8616f3a8b53ed2eff52cacf14125`, `b0f62fc8eb9a8d5bd530c0f281f519d7ef979bbb`, `9be306c77c98e947584cb524969d8ac655b7b14f`, `e3eaf963a9c89c5e41e74bd122d2aa6e01573430`.
**Verification blocker:** Recent GitHub Actions runs fail at frontend/shared tests because three Website/Company/Admin notification inbox tests cannot find the `خوانده‌شده` bulk button after selecting a row. The latest inspected failed run `40233605679` reports 3 failed / 155 passed tests and stops before backend tests/builds. Latest run for then-current HEAD `e3eaf963a9c89c5e41e74bd122d2aa6e01573430` was `40233642942`, queued at last check. A local clone attempt failed because this runtime cannot resolve `github.com`; no local tests/build/browser checks were run.
**Security findings requiring approval:** (1) Product `history` and `activity` endpoints expose audit records to any authenticated caller; service functions do not enforce company ownership and routes do not restrict access type/permission. (2) Granular STAFF users who are not SUPER_ADMIN are treated as public callers by `listProducts`/`getProductById`, so they cannot list or load pending-review products through management routes; public vs management reads need separate authorization paths. Proposed fixes and tests for both were added to issue #2. Do not implement these authorization-boundary changes until the user explicitly approves.
**Plan for this session:** (1) implement supported catalog query filters/sort and correct featured/homepage behavior without inventing stock/sales data; (2) add targeted service/controller regression tests and API docs; (3) inspect and resolve lifecycle/permissions/media issues one by one; (4) update this handoff and WORKLOG after each milestone. Remote GitHub source edits only are available; runtime tests/builds remain NOT RUN unless a runnable environment becomes available. Do not change schema, auth, or consequential business rules without approval.


## Active follow-up — PRODUCT-AUTH-2026-10-26-01
- **Status:** IN_PROGRESS — user approved both product security fixes.
- **Scope:** Require `products.read` plus STAFF/COMPANY access type for management list/detail and history/activity; enforce company ownership in service audit queries; let authorized STAFF moderators see all product lifecycle states only through management routes while keeping public catalog clamped to `PUBLISHED` + `PUBLIC`.
- **Evidence:** `product.routes.js` currently has no RBAC preHandlers on `/my-products`, `/:id/manage`, `/:id/history`, or `/:id/activity`; `product.service.js` does not receive a caller for audit functions and classifies STAFF without `companyId` as a public caller in listing/detail logic.
- **Verification:** Remote GitHub edits only at present; local test/build execution unavailable unless environment changes.


## Product authorization follow-up — 2026-10-26
- **Status:** Implemented in source; CI verification pending.
- Management list/detail and product history/activity routes require STAFF or COMPANY access type and `products.read` (SUPER_ADMIN bypass remains supported).
- Audit service methods now receive the caller and enforce `products.read` plus company ownership; cross-company COMPANY reads return 404 before querying audit rows.
- Authorized STAFF moderators can list/load pending/private products across companies via management routes, even when a `companyId` claim is present. Public list/detail behavior remains restricted to PUBLISHED + PUBLIC.
- Added route/service regression tests and documented the contract in `docs/API_DOCUMENTATION.md`.
- Commits: `037daf105deecd1dfeb205ca987303b6a0837e1b`, `d32c748f38f071f96f5ddc66512d500170c3984d`, `139ae28219da533e5def0a03eb0c879f0dacb6d9`, `a9edc271385a213de60e11c628cbf5cf8cf67dee`, `32b1beb4d1ed7c8549d3fb5a4575f18f05346469`, `33c23dc022d7ccc181f960ec4a47dbee93f747ee`, `1fa059e1a6aba89f463c445ec927e03a9c39b044`, `5af33260e62a1cef08c6690592f938f92eadc79f`, `42468c4c8a5913da15a55152549c371752779f0b`.
- Verification: GitHub Actions run `40270601243` was queued at last check. Local tests/builds are NOT RUN; this session has remote GitHub file access but no working local checkout.
- Next: Inspect the latest workflow result; resolve the existing frontend notification test blocker if it still prevents backend tests, then verify product tests and continue the remaining product audit.
- **Additional hardening:** `isCompanyUser` now recognizes only COMPANY access profiles (or legacy callers with no `accessType`), so CUSTOMER accounts cannot be treated as company managers based on a stray `companyId`. STAFF test fixtures deliberately include a companyId to verify they remain cross-company moderators. Added explicit CUSTOMER-denial tests for both audit services. Commits: `8a963b4459288d7de714b4913579dbb61669435d`, `df0e7b52cf8e1e2643bbabac43cd999eee96bcf2`.
- **CI blocker:** The latest observed completed workflow still fails in the pre-existing Website/Company/Admin notification bulk-read tests (3 failed, 155 passed) before backend tests. Run `40270760225` for current HEAD was queued at last check. Product authorization tests remain NOT VERIFIED until backend test step executes.

## Verification — product authorization + CI blocker — 2026-10-26
- GitHub Actions run [40271177578](https://github.com/gameacc2025/martest/actions/runs/40271177578) passed for commit `3eeb388ede16a3624b6ee2c6ca3baf555d9bc761`: frontend/shared 17/17 test files (158 tests, 0 failed); backend 1179/1179; Prisma Client generation; Website/Company/Admin production builds.
- The product route/service authorization tests are included in that passing backend suite. The three notification inbox test failures were fixed by locating the rendered bulk action by label; the computed selection flag remains in all three inbox pages.
- The latest documentation-only commit `4f4d2a2c9885adca22dcee1c95f774698e3fd4f1` corrects the old public-endpoint permission statements; its own CI run `40271218831` was still in progress at last check.


## Product lifecycle UI milestone — 2026-10-26
- Company product list now allows resubmitting REJECTED products through `canSubmitForReview`.
- Admin product list now exposes hide/archive/restore-to-draft actions only in backend-supported statuses and only when the caller has the matching permission. Create/edit/copy/delete controls are permission-aware; the invalid Admin submit-review button was removed.
- Admin lifecycle action helpers now derive from `ALLOWED_TRANSITIONS`; new tests were added for Admin and Company lifecycle helper behavior.
- STAFF with `products.publish` can publish APPROVED and HIDDEN products across companies, matching the existing route contract; COMPANY publish remains ownership-checked and APPROVED-only.
- Issues: #4 implemented; #5 `isFeatured` permission enforcement remains open pending authorization approval; #6 broader STAFF update/delete/price/media write scope remains open (publish subcase fixed).
- Verification: [CI run 40271764110](https://github.com/gameacc2025/martest/actions/runs/40271764110) passed frontend/shared tests, backend 1179/1179, Prisma generation, and Website/Company/Admin builds. This run is for commit `670e1071712069ff4adbd66b5542799423a1e202`; current handoff/documentation commits may have their own CI runs pending.

- **Latest verified code HEAD before this handoff-only update:** `3b541c3255532a8c14c24e7de0bc7d163e47265a`; [CI run 40271919142](https://github.com/gameacc2025/martest/actions/runs/40271919142) passed frontend/shared tests, backend 1179/1179, Prisma generation, and Website/Company/Admin builds. Admin create/edit/copy/delete controls are now also scoped to the caller's permission and matching company for non-SUPER_ADMIN users.
- **Open authorization decisions:** #5 (`isFeatured` may be set through create/update without `products.feature`) and #6 (STAFF update/delete/price/media write scope; STAFF publish has been fixed) remain unimplemented where they would broaden/change permission boundaries; obtain explicit approval before proceeding.


## Additional product audit fixes — 2026-10-26
- `deletePriceTier` now applies the same post-approval review threshold as add/update, with transactional product counter/status changes, status history, activity log, and staff notification; a threshold-crossing regression test was added.
- Stored XSS: replaced public ProductDetails `v-html` rendering of the company-editable description with escaped plain-text interpolation and `white-space: pre-line`; tracked in issue #7.
- Verified: [CI run 40272171627](https://github.com/gameacc2025/martest/actions/runs/40272171627) passed frontend/shared tests, backend tests, Prisma generation, and Website/Company/Admin builds for commit `3a132bf65c6783f35231f4304d6ded82347b335f`.
- Open approval-sensitive issues: #5 `isFeatured` permission enforcement and #6 broader STAFF update/delete/price/media write scope (STAFF publish subcase fixed). Do not broaden those permissions without explicit approval.


## Public product response privacy fix — 2026-10-26
- Added `publicProductSelect` and use it for public list/detail queries. It returns public product fields and relations but omits `statusHistory`, actor/creator IDs, post-approval edit counters, and deletion metadata. Management reads retain `productInclude` with history.
- Regression tests verify public list/detail use the allowlist and management detail retains status history. API docs updated.
- CI run [40272542697](https://github.com/gameacc2025/martest/actions/runs/40272542697) passed frontend/shared tests, backend tests, Prisma generation, and all three production builds for commit `9c42d944e07baf8dde418e7ce301f0a663552826`.
- Remaining open authorization issues: #5 `isFeatured` permission enforcement and #6 broader STAFF write scope (publish subcase fixed); do not broaden those permissions without explicit approval.


## Final verified handoff — 2026-10-26
- Latest handoff HEAD before this note `c1bfed792c2933a586d88838ae498e4073c4ed2f` passed [CI run 40272711539](https://github.com/gameacc2025/martest/actions/runs/40272711539): frontend/shared tests, backend tests, Prisma generation, and all Website/Company/Admin builds passed.
- Closed completed issues #3, #4, #7, and #8. Master product audit #2 remains open pending decisions tracked in #5 and #6.
- **Approval needed to finish the remaining permission audit:** #5: enforce `products.feature` for creating/changing `isFeatured` (Company and Admin forms currently send it, and the backend accepts it under create/update permissions); #6: decide whether STAFF with granular write permissions may update/delete/manage prices/media across companies or whether those routes should be COMPANY-only except SUPER_ADMIN. STAFF cross-company publish was fixed to match the existing `products.publish` route contract.
- No schema/migration changes. All code changes above are committed directly to `main`; CI is green for the latest code/docs snapshot.
