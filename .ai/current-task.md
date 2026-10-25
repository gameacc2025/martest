# Current Task / Agent Handoff

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
- **Status:** IN_PROGRESS — remote inspection and initial findings only; no product code changed yet.
- **Issues:** https://github.com/gameacc2025/martest/issues/2 (lifecycle audit); https://github.com/gameacc2025/martest/issues/3 (catalog query/filter contract)
- **Scope:** Backend product service/controller/routes/tests; Company/Admin product forms and lists; Website listing/detail/store; product media/pricing/specifications; roadmap and AI-agent docs.
- **Initial repository evidence:** `main` HEAD observed at `6e19a2e6cb248273d4f0fd4115d722eda41ee504`. No open issues were returned before this task; issue #2 now tracks the audit. The current remote implementation includes a review-on-edit threshold and a `myProducts` controller branch intended to avoid scoping SUPER_ADMIN to a company.
- **Findings:** public list/detail source enforces PUBLISHED + PUBLIC for public callers; lifecycle transitions and review-on-edit policy are defined in the service; SUPER_ADMIN company-scope branch exists in `myProducts`. Catalog contract mismatch is tracked in #3: homepage labels first recent products as featured/best sellers, while list endpoint currently only consumes search/company/category/status; frontend sends price/stock/sort/featured parameters that the controller/service do not apply. The currently routed `/products` page is `ProductListing.vue`; `Products.vue` may be legacy and must not be edited without confirming use.
- **Verification available so far:** GitHub source inspection only. Local `git status`, runtime tests, builds, and browser checks are NOT RUN because no local checkout/runtime is available in this session.
- **Next:** Continue tracing product lifecycle permissions and media persistence; inspect latest CI and product-specific tests; use a local checkout to reproduce and implement the catalog contract work in #3. Do not claim runtime verification from remote source inspection. Obtain approval before consequential permission/schema/business-rule changes.
