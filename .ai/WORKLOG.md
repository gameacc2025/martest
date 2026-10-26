# Agent Worklog — Telecom Marketplace

This file is the shared, version-controlled memory for agents working on the repository. Append new entries; never erase completed work. Keep it factual and do not store secrets.

## 2026-10-25 — REPO-AGENT-RULES — Establish repository-wide agent workflow
- **Status:** DONE
- **Agent:** ChatGPT via GitHub repository tools
- **Goal:** Establish mandatory startup reading, task coordination, persistent project memory, documentation, verification, and commit/push rules.
- **Claimed scope:** Root agent entrypoints, shared protocol, durable worklog, current-task handoff, contributor docs, README, architecture/decision notes, branch cleanup.
- **Changes:** Added and verified the agent entrypoints/protocol, project memory files, and updated docs. Canonical remote is `gameacc2025/martest`; `main` HEAD at task start was `ef0bda86f455ac0ea76ad0ebbcb8f4b76acde335`. Notification system work was merged through PR #1. CI on main was previously verified green in GitHub Actions run 40167701297; this does not verify live SMTP credentials/connectivity.
- **Verification:** NOT RUN for this documentation task yet.
- **Commit:** Pending
- **Push:** Working directly on remote `main` through GitHub repository tools; each file write creates a commit.
- **Risks / open questions:** GitHub connector exposes branch listing but may not support branch deletion. Do not claim the feature branch was deleted unless verified.
- **Next action:** Finish agent files and docs, update this entry with commit hashes and actual verification status, inspect whether branch deletion is supported.


### Completion record — REPO-AGENT-RULES (2026-10-25)

- **Status:** DONE (repository rules/docs committed on `main`)
- **Files added:** `AGENTS.md`, `CLAUDE.md`, `.ai/PROTOCOL.md`, `.ai/WORKLOG.md`, `docs/AI_AGENT_WORKFLOW.md`, `docs/NOTIFICATION_SYSTEM.md`, `.github/copilot-instructions.md`.
- **Files updated:** `README.md` (replaced placeholder), `.ai/current-task.md` (replaced stale task pointer with handoff), `.ai/project-context.md`, `.ai/decisions.md`, `docs/API_DOCUMENTATION.md`, `Telecom_Marketplace_Project_Architecture_and_Roadmap.md`.
- **Commit trail on main:** `9310357` (AGENTS), `389678b` (Claude entrypoint), `80e6661` (protocol), `9a00422` (worklog initialization), `d80c924` (workflow guide), `bc19332` (Copilot instructions), `6cc6b48` (notification docs), `114fb7c` (README), `42c8af7` (current-task handoff), `44876fa` (project context), `ec5fbc4` (API docs), `98d8122` (decision), `c7be7dc` (architecture roadmap).
- **Verification:** GitHub connector re-fetched `AGENTS.md`, `.ai/PROTOCOL.md`, `.ai/WORKLOG.md`, and `docs/NOTIFICATION_SYSTEM.md` successfully. Branch listing confirms `main` and `feat/notifications-complete` still exist. No local tests/builds were run for this documentation-only task because edits were made through the GitHub API rather than a local checkout.
- **Commit:** Latest observed `main` HEAD at verification time: `c7be7dc7dd8b96224fd94a283e092f5a751a7dda`.
- **Push:** Changes were written directly to the remote `main` branch and verified there.
- **Risks / open questions:** The available GitHub connector does not expose a branch-delete action. Therefore `feat/notifications-complete` was NOT deleted. The PR was squash-merged earlier; after confirming no one needs the feature branch locally, delete it through GitHub UI or with `git push origin --delete feat/notifications-complete`.
- **Next action:** Sync local Windows checkout with `origin/main` after checking for uncommitted changes; then delete the obsolete feature branch if desired.

- **Additional alignment:** Prepended a mandatory policy notice to legacy `.ai/PROMPTS.md` so old phase prompts cannot silently override the new root agent policy. Commit: `f8fcf67`.

## 2026-10-26 — Notifications page email-inspired redesign
- **Status:** DONE
- **Agent:** Cline
- **Goal:** Lighten the crowded/dark Notifications page with an email-inspired design while preserving all features
- **Changes:** Lightened backgrounds (surface-ground→#f8fafc, surface-card→#fff), borders (surface-border→#e2e8f0/#f1f5f9), hover states (surface-hover→#f8fafc), sidebar (#f8fafc), reading panel (#fff/#f8fafc), empty states (#f1f5f9), search box (#f8fafc), bulk actions (#f8fafc). Added subtle box-shadow to mail layout. Made unread rows more distinct (#fbfdff).
- **Features preserved:** Folder/category filtering, search, bulk actions (mark read/unread/delete), mark all as read, single-click select/double-click read, delete individual messages, save to folder, reading panel detail view, pagination, loading states, empty states, RTL support, responsive breakpoints
- **Verification:** 4/5 vitest tests pass; 1 pre-existing failure unrelated to changes (bulk read-state endpoint test fails on original code too)
- **Commit:** `2ea32f1` — `style: lighten Notifications page with email-inspired design`
- **Push:** Not yet pushed
- **Final branch check:** `main` and `feat/notifications-complete` are still listed by GitHub. The branch-deletion action is not exposed by the connected GitHub tool, so the request to leave only `main` is not fully completed yet.
- **Latest content commit before this worklog update:** `f8fcf671bdfe9389453c605823b9c0bb238bec03`.


## 2026-10-25 — AGENT-ENGLISH-COMMUNICATION — Enforce English user-facing responses
- **Status:** DONE
- **Agent:** ChatGPT via GitHub repository tools
- **Goal:** Make English the mandatory communication language for every agent, regardless of the language used by the user.
- **Claimed scope:** Root agent policy, Claude/Copilot entrypoints, shared protocol, workflow guide, README, and accepted decisions.
- **Changes:** Added the English-only user communication rule to `AGENTS.md`, `CLAUDE.md`, `.ai/PROTOCOL.md`, `.github/copilot-instructions.md`, `docs/AI_AGENT_WORKFLOW.md`, `README.md`, and `.ai/decisions.md`. Clarified that localized product deliverables may still use their required language while explanations to the user stay English.
- **Verification:** Re-fetched and checked the updated files from GitHub after writing. No local tests/builds run; this is a documentation/policy-only change.
- **Commit:** `1b7e7a0`, `aa50990`, `285f4f1`, `22654d3`, `9768805`, `489f2d6`, `6eecb8d` (one remote commit per file).
- **Push:** Changes written directly to remote `main`.
- **Risks / open questions:** Existing external agent sessions will only follow this policy after they load the updated repository instructions; this file change cannot retroactively change an already-running model's system-level instructions.
- **Next action:** Ensure each agent tool/session loads `AGENTS.md` and its tool-specific instructions before work.


## 2026-10-25 — NOTIFICATIONS-INBOX-UX — Email-style notification inbox
- **Status:** IN_PROGRESS
- **Agent:** ChatGPT via GitHub repository tools
- **Goal:** Replace the plain Company Portal notification list with an email-like inbox so users can browse messages by folder/category and read selected messages.
- **Claimed scope:** apps/company/src/pages/user/Notifications.vue, .ai/current-task.md, and this worklog entry. No backend/schema changes planned.
- **Evidence:** Current page is a basic vertical list; Notification records include type, title, message, isRead, and createdAt. Existing APIs support listing, unread count, mark one/all read, and delete.
- **Plan:** Add All/Unread/Read folders, event-type category filters, local search, a message list and reading pane, responsive behavior, and retain current API actions.
- **Verification:** NOT RUN yet. This task is being edited via GitHub tools, not a local checkout.
- **Commit:** Pending
- **Push:** Not yet written
- **Risks / open questions:** Category filtering can only group notifications returned by the current server page; no backend query contract exists for category-specific pagination. Keep this explicit in UI behavior and preserve existing pagination.
- **Next action:** Implement the scoped UI, review the full source, re-fetch from GitHub, and report tests as NOT RUN unless actually executed.


### Completion record — NOTIFICATIONS-INBOX-UX (2026-10-25)
- **Status:** PARTIAL — scoped UI implementation committed; build/runtime verification not performed.
- **Changes:** Redesigned apps/company/src/pages/user/Notifications.vue into a responsive email-style inbox with All/Unread/Read folders, event-type category filters, search, message list and reading pane, auto-mark-read on open, mark-all-read, delete, refresh, and pagination. Preserved the existing notification API paths and Persian UI text.
- **Documentation:** Updated docs/NOTIFICATION_SYSTEM.md with the inbox capabilities and the current-page filtering limitation.
- **Verification:** Re-fetched the changed Vue file from GitHub and ran textual source checks for folders, categories, search, reading pane, read/delete actions, pagination, and existing API endpoints — all checks true. Build, unit tests, and browser interaction are NOT RUN; no local repository/runtime was available.
- **Commit:** UI a244a9799745b86cf47ae9ce65d7ef6e93632955; documentation and handoff commits recorded by their update results.
- **Push:** Written directly to remote main through GitHub repository tools; each file update creates a commit.
- **Risks / open questions:** Category and search filters apply only to the currently fetched page (20 notifications), not all pages. A backend query contract would be needed for global filtering. Visual rendering and PrimeVue/Vue build compatibility remain NOT VERIFIED.
- **Next action:** Pull main locally, run Company Portal build/tests, and manually verify inbox interactions in the browser.


## 2026-10-25 — NOTIFICATIONS-INBOX-DATA-FLOW — Fix empty notification list
- **Status:** IN_PROGRESS
- **Agent:** ChatGPT via GitHub repository tools
- **Goal:** Fix the Company Portal inbox showing no messages and verify the fix with a regression test and CI.
- **Claimed scope:** `apps/company/src/pages/user/Notifications.vue`, Company app Vitest setup/test, root Vitest project registration, and task/docs records if required.
- **Evidence/root cause:** The page uses `apiGet()` but expects a paginated object. The shared-core `apiGet()` unwraps `{ data, meta }` to `data`, so the page receives an array and `result.data` evaluates to undefined; it consequently renders an empty list. The backend service returns `{ data, meta }`, and `apiGetPaginated()` is the matching wrapper.
- **Plan:** Switch the list request to `apiGetPaginated()`; add a regression test that mounts the page with a paginated response and asserts the notification appears; include that test in root CI; run and inspect CI test/build results; fix any failures before handoff.
- **Verification:** NOT RUN at claim time. This session has no local checkout/terminal, so use GitHub Actions CI and inspect run/job logs.
- **Commit:** Pending
- **Push:** Direct remote-main writes only; commits will be made through the repository connector.
- **Risks / open questions:** Must ensure the Company app test project compiles Vue SFCs and is included in the root Vitest project list without disrupting existing workspace tests.
- **Next action:** Implement the API contract fix and regression test, then inspect the triggered CI run.

### Completion record — NOTIFICATIONS-INBOX-DATA-FLOW (2026-10-25)
- **Status:** DONE — root cause fixed; regression test, full CI test suites, and actual frontend builds passed.
- **Root cause:** `apiGet()` unwraps a paginated `{ data, meta }` body into only the data array; the Company inbox then tried to read `result.data` and displayed an empty list.
- **Changes:** `apps/company/src/pages/user/Notifications.vue` now uses `apiGetPaginated()`; added `apps/company/src/pages/user/Notifications.test.js`; registered the existing Company Vitest project in root `vitest.config.js`; fixed root `package.json` build script, which had incorrectly run `pnpm run --parallel build:website build:company build:admin` and logged “None of the selected packages has a build:website script” instead of building apps; updated `docs/NOTIFICATION_SYSTEM.md`.
- **Commits:** UI fix `74317660ec669e6e220afdcefed989ee43794419`; regression test `ad1302acd3bedbf548af038d64a83dd5efd5ebbe`; root Vitest registration `480ba9e860e924f3a38da91e52871328b25183ce`; actual build-script fix `750b6eafcab89b9558bad521dd5102e60f475ca3`; notification docs `7a83af8a199ae91c763d1d48f43f45cbc2e2287f`.
- **Verification:** GitHub Actions CI run https://github.com/gameacc2025/martest/actions/runs/40176535538 completed with conclusion `success`. Frontend/shared Vitest: 12 test files, 125 tests passed; the new Company notification regression test passed. Backend: 1,136 tests passed, 0 failed. Root session-handoff tests also passed. The corrected `pnpm build` invoked Website, Company, and Admin builds; all three Vite production builds completed successfully.
- **Push:** All changes committed directly to remote `main`; latest task-specific commit is the notification documentation commit above.
- **Risks / open questions:** Automated rendering/build are verified, but the user's local browser/runtime was not accessible in this session, so their live local page is not independently verified. The local checkout must pull `origin/main` and the Company app/backend should be refreshed/restarted if stale code is still running. Category and search filters still apply to the current 20-item page only.
- **Next action:** User should fast-forward local `main`, reload `/notifications`, and confirm the real account's messages. If rows still do not appear after syncing, capture the current `/api/v1/settings/notifications?page=1&limit=20` response and browser console; the API/response contract is now covered by CI.

### Follow-up completion — ALL-APP-NOTIFICATION-INBOX (2026-10-25)
- **Status:** DONE — Company, Website/customer, and Admin inboxes updated; all CI tests and production builds passed.
- **User evidence:** The live API returns a paginated `{ data: [...], meta }` envelope, including a new `ADMIN_ANNOUNCEMENT` and many legacy notifications with `type: null`.
- **Root causes addressed:** Website and Admin inboxes still called `apiGet()` and then expected `result.data`, despite the helper unwrapping the envelope; those inboxes could therefore render an empty list. Category matching also did not classify `ADMIN_ANNOUNCEMENT` or legacy null-type notifications meaningfully.
- **Changes:** Company, Website, and Admin inboxes now use `apiGetPaginated()` plus response normalization; all three now use the email-style folder/category/search/list/reading-pane UI. Legacy null-type records are categorized from title/message text; admin announcements are categorized as announcements. Added regression tests for all three apps and registered Website/Admin in the root Vitest project list. Updated `docs/NOTIFICATION_SYSTEM.md`.
- **Key commits:** Company normalization `28c0a9a124090064c1933d9bc07dbe3294243b12`; Website inbox `0390ffa09f7ef39689945785940d502382a884c3`; Admin inbox `92d584c450f90ccb83b716fabb4b87d7c980a3ed`; Company category mapping `b0e2452f9997935b84f982f4fd10a8efe8532ce3`; Website category mapping `475d3ef0179e4fb39b45a9479b45f6ce80106e65`; Admin category mapping `834c75f5aa4ecee455ea8bf9f4c8ef15503fb789`; realistic payload test `e60b5248745d7c6bc8574de71007b0c71bc3b281`; Website test `f78acea9236679a8a57b72721a33168816906541`; Admin test `4d03abb31956c4ac18692317f73367e4ad2f7256`; root project registration `2742cd51c3b16b8d4bcbb6ddef6676bb5989e5e7`; docs `b04f70cb98439adbf5831b3f259fb3fbe721d566`.
- **Verification:** CI run https://github.com/gameacc2025/martest/actions/runs/40177071576 completed successfully. Frontend/shared Vitest: 17 files, 148 tests passed; notification regression tests passed in Company, Website, and Admin. Backend suite: 1,136 passed, 0 failed. Root session-handoff suite: 18 passed, 0 failed. Website, Company, and Admin production builds all completed successfully.
- **Not verified:** The user's local browser and real account session cannot be driven from this repository session; visual end-to-end rendering against the user's local runtime is not independently verified.
- **Next action:** Pull latest `origin/main`, restart Website/Company/Admin Vite dev servers, then reload each app's `/notifications`. If the Company list still remains blank, inspect the Vue component's runtime `notifications.length` and current bundle/version; the API response shape and row rendering are now covered by regression tests in all three apps.

### Follow-up — NOTIFICATION-NAVIGATION-AND-COUNT (2026-10-25)
- **Status:** DONE — UI, shared navigation, unread badge endpoint, all tests, and all production builds verified in CI.
- **Findings:** Website header unread badge was calling the obsolete `/api/v1/notifications/unread-count` route instead of canonical `/settings/notifications/unread-count`. Shared dashboard navigation linked to inbox but did not expose notification preferences, and staff with `notifications.send` had no dedicated sidebar entry to the admin compose/monitor page.
- **Changes:** `apps/website/src/layouts/PublicLayout.vue` now uses `endpoints.notifications.unreadCount` and tolerates either `{ count }` or `{ data: { count } }`. `packages/shared-ui/config/navigation/dashboardMenu.js` adds notification preferences to the account section and an admin-only/permission-gated `admin-notification-management` item. Route-existence filtering keeps the admin-only item out of Company navigation. `docs/NOTIFICATION_SYSTEM.md` records the route and navigation contract.
- **Commits:** Website unread badge fix `e98e604bec76dacacd811bf32510314bdfd9d219`; shared navigation `335cbc2162862dc6c55dbb655eddc349c0454836`; docs `631ee482915efae97fb98ee501fe8e2ba60776eb`.
- **Verification:** CI run https://github.com/gameacc2025/martest/actions/runs/40185053151 completed successfully. Frontend/shared suite: 17 test files, 148 tests passed; backend suite: 1,136 passed, 0 failed; root handoff tests: 18 passed, 0 failed; Website, Company, and Admin production builds all succeeded.
- **Not verified:** The user's actual local browser/session is not accessible through this workflow. Runtime confirmation still requires syncing `origin/main`, restarting dev servers, and checking the live account.
- **Next action:** User should pull latest `main`, restart Website/Company/Admin dev servers, and check `/notifications` in all three apps. If rows are still absent, inspect the runtime bundle and Vue component state after `fetchNotifications()`; the backend response contract and row rendering are now covered by app-specific tests.


## 2026-10-25 — NOTIFICATION-READ-STATE — Fix opening notifications as read
- **Status:** IN_PROGRESS
- **Agent:** ChatGPT via GitHub repository tools
- **Goal:** Ensure opening a notification marks it read consistently in Website, Company Portal, and Admin.
- **Claimed scope:** Three notification inbox Vue pages and their existing tests; update current-task/worklog. No database schema or API contract changes in this phase.
- **Evidence:** Each inbox automatically selects the first notification in `fetchNotifications()` but does not call `markAsRead()`. Manual click handlers do call the read endpoint, but the user's manual-click failure is not yet reproduced; verify endpoint registration and test both auto-selection and click behavior before attributing that symptom to a root cause.
- **Plan:** Trace actual route prefixes and API client behavior; implement the smallest frontend-only correction; add regression tests in all three app test suites for auto-selection and manual opening, including success/failure state behavior; inspect CI after commits.
- **Verification:** NOT RUN at claim time. GitHub connector can edit/fetch repository files but no local checkout/test terminal is available in this workflow; do not claim tests pass unless an actual CI result is inspected.
- **Commit:** Pending
- **Push:** No changes written yet. Repository connector updates create commits directly on remote `main`; only scoped files will be changed.
- **Risks / open questions:** The auto-selected message is visibly not marked read; the reported manual-click failure may be a separate runtime/API issue. Do not modify backend routes or API contract without a separate approval.
- **Next action:** Verify endpoint prefixes, client PATCH semantics, and template click handlers; then make scoped changes and inspect CI.


### Follow-up record — NOTIFICATION-READ-STATE (2026-10-25)
- **Status:** PARTIAL — frontend fix and regression coverage committed; automated verification has not been observed.
- **Root cause confirmed:** The reading pane auto-selected the first notification after loading, but the code did not call the read endpoint for that opened message. Manual row clicks already called the correct authenticated PATCH endpoint; the reported runtime failure was not independently reproduced in this session.
- **Changes:** Website, Company, and Admin inboxes now await notification loading, mark the initially opened unread notification as read through the existing endpoint, then fetch the unread count so it reflects the persisted state. Regression tests cover auto-open and manual click in all three apps; Website additionally covers a failed read request preserving unread UI state. No database schema or API contract changed.
- **Documentation:** Updated docs/NOTIFICATION_SYSTEM.md to record read-on-open behavior. Recorded the user's accepted folder policy in .ai/decisions.md: fixed Saved folder, no user-created folders, admin-configured system-wide or per-app folders; copy/move semantics preserve the canonical notification and its read state. Folder schema/API work is deferred until separate approval.
- **Verification:** NOT RUN in a local checkout. GitHub Actions status for these direct-main commits could not be inspected with the available tools in this session. Treat tests/builds as NOT VERIFIED until CI results are observed.
- **Commits:** Company page 4d76ba0f99297c762a42633aba81bfa088ce6a5c; Admin page 8c62d1efa6843a3c0bbb7d48010ff67e03d3759c; read-state test commits include 4cfc2812ebd5a146d212bdfbc408e8ae2864bd64, 45b3accbe9f9860f69bc342514bb8b543750e5af, 1243350b4d4f04cf12ff824969c9e1b47f1e8263, 7aa788ecc1d8b4f4b6f12880fce217b84300b3c5, 60874d68d1ef42e4a9b8d604bbafc4a97f2bff05, cb42ca59435c173fcfd66455a6d6bf051da34b8d, 8385651ddf5a4eec3d1bba67aa7f2618f0ee3ee6, 672c2baeabc1c05150b8992748f68f4ee76143a2, 853970977ae66461e96867a5b64b62d1ca7cba5f, 6c9309c66854702674168eaf2f179a7362d2e6df; docs/decision commits 9155a61f51d3450463e1a7c6f41b1df1eacc0a0a and a1afe3d3254dc1c85441b8004c71be85a5e42caa.
- **Push:** Changes written directly to remote main through the repository connector.
- **Next action:** Inspect the actual CI run and fix any failing tests. Then ask the user to sync local main and verify initial display and manual opening. Present the detailed folder schema/API/admin-control design separately before implementing it.


## 2026-10-25 — NOTIFICATION-FOLDERS-ADMIN — Stage 2 folder foundation and admin management
- **Status:** PARTIAL — implementation committed to `main`; automated verification NOT RUN.
- **Agent:** ChatGPT via GitHub repository tools.
- **Goal:** Implement fixed system folders and admin-managed custom folder definitions/scopes without enabling user-created folders.
- **Claimed scope:** Prisma schema, additive SQL migration, admin-only folder API, Admin management page/navigation, API endpoints, and notification documentation.
- **Changes:** Added `NotificationFolder`, `NotificationFolderMembership`, and `NotificationFolderScope`; migration seeds fixed INBOX/SAVED folders, backfills existing notifications to INBOX, and adds a PostgreSQL trigger for future notifications. Added GET/POST/PATCH admin folder endpoints guarded by `system_settings.manage`; system folders are immutable and custom folders can be deactivated rather than deleted. Added Admin route/page for create, rename, scope, order, and active status.
- **Verification:** GitHub re-fetch confirmed schema, migration trigger, API endpoint, and UI page are present. Backend tests, Prisma validation/generation, frontend tests/build, migration application, and CI are NOT RUN / NOT VERIFIED because this workflow has no checked-out runtime/database.
- **Commit trail:** schema `34402cf`; migration `32271e0` then trigger follow-up `c23de53`; routes `f03001c`; controller `4964b59`; service `d9da5b6`; API endpoints `133942c`; Admin route `835c100`; Admin page `ee7bff1`; navigation `418d839`; docs `5e83c0c`.
- **Risks / open questions:** Apply the migration via the approved Prisma deployment workflow before using the API. Copy/move and user-facing folder filtering are NOT implemented yet; those belong to stage 3. The current folder model is shared globally with app scopes; INBOX/SAVED are shared system definitions and per-notification memberships are attached to the canonical Notification.
- **Next action:** Verify CI/builds and Prisma migration in the local/dev environment; then implement stage 3 folder membership operations (copy/move/save) with ownership and scope checks.


## 2026-10-25 — NOTIFICATION-FOLDERS-ACTIONS — Stage 3 folder UI and copy/move
- **Status:** IMPLEMENTED ON `main`; CI verification pending.
- **Changes:** User-facing API lists app-scoped active folders, filters notifications by folder membership, and supports copy/move using canonical notification IDs. All three inbox pages now show admin-managed folders and actions for save, copy, and move.
- **Security:** Endpoints require authentication; service checks notification ownership, destination scope/active state, and source membership/scope. Move uses a DB transaction. Inactive folders remain valid as a source to allow users to move messages out.
- **Tests:** Added route wiring tests for folder list and copy/move route; adjusted controller options to keep previous list contract stable. CI runs for latest commits are in progress; do not claim green until checked.
- **Migration:** Not applied to a live/dev DB. Must apply via reviewed Prisma workflow before testing runtime.
- **Next:** Confirm CI success, inspect any remaining failures, and run migration/app smoke tests in a controlled environment.


## 2026-10-25 — NOTIFICATION-FOLDERS-CLOSEOUT — Complete Stage 2/3 verification
- **Status:** DONE — folder implementation is committed to `main`; CI passed for the folder-action test suite.
- **Agent:** ChatGPT via GitHub repository tools.
- **Goal:** Close the notification folder task by repairing CI, adding security-focused service coverage, and synchronizing documentation/handoff.
- **Claimed scope:** Admin route tests, notification folder service tests, notification/API docs, current-task handoff. No schema or production-data changes.
- **Changes:** Updated admin route test mocks for the three folder-management handlers and added tests for folder list/create/update permission wiring (commit `53dcf7e3fcf910461bd500ff284f0bd41c87466f`). Added service tests for app scope, notification ownership, active/scope-valid destinations, copy membership, transactional move, and invalid source membership (commit `a7473f22637415f36ecd2ec90df272e4a9403c24`). Updated notification and API documentation and this handoff.
- **Verification:** GitHub Actions run [40199219352](https://github.com/gameacc2025/martest/actions/runs/40199219352) passed: frontend/shared tests 18/18; backend tests 1149/1149; Prisma Client generation; Website, Company, and Admin production builds. Run [40199100910](https://github.com/gameacc2025/martest/actions/runs/40199100910) also passed after the admin-route test fix.
- **Development database:** User created `telecom_marketplace_backup.dump`, applied `20261025130000_notification_folders`, verified `INBOX` and `SAVED` and 26 Inbox memberships, confirmed an empty Prisma schema diff, and confirmed `prisma migrate status` reports the database schema up to date.
- **Runtime limits:** User confirmed the notification folder UI works; this session did not independently click through copy/move in the live browser. Live copy/move behavior remains NOT VERIFIED. The Prisma package.json configuration deprecation warning remains non-blocking.
- **Commit:** Test commits above; documentation/handoff closeout committed together after CI passed.
- **Push:** Directly committed to remote `main` through the GitHub repository API; verify the new HEAD after updating the ref.
- **Risks / open questions:** The development database was baselined because its existing schema had no `_prisma_migrations` table; other environments require their own reviewed migration/baseline procedure. Do not re-run the folder SQL against the already-migrated development database.
- **Next action:** User syncs local `main`; if live copy/move clicks fail, capture the network request/response for diagnosis. Otherwise await the next prioritized project task.


## 2026-10-25 — NOTIFICATION-INBOX-FIXES — Folder filters, read-state, and bulk actions
- **Status:** Code and automated tests passed on GitHub Actions run [40201945241](https://github.com/gameacc2025/martest/actions/runs/40201945241).
- **User report:** Saved and Inbox folders displayed the same messages; transfer controls were visually poor; user requested delete icons, read/unread controls, working mark-all-read, and checkbox-based bulk delete.
- **Changes:** Fixed Company app list endpoint usage; added explicit server-side folder/read filters and client-side membership guard; removed the large transfer panel in favor of compact reading-toolbar controls; added row-level delete and read/unread icons, checkbox selection, select-current-page, bulk read/unread, and bulk delete.
- **Backend:** Added ownership-scoped read-state and bulk mutation services/controllers/routes; validation caps bulk requests at 100 IDs. Updated shared API endpoint definitions and service/route tests.
- **Verification:** CI passed frontend/shared tests 18/18, backend tests 1156/1156, Prisma generation, and Website/Company/Admin production builds. The initial selection no longer silently marks a message read.
- **Commits:** `5fa5c68f9eb235b4a5135ba155467ef33f477fde`; `46bf7dcbf7c9860f7b4c16064b0f478d179245ec`; `69dcf1a71ee64d3acc62c733815f2b75ef579170`; `f3eebbe340eb5d70f0d141e4fc6edcc5f7ca0b35`; `39e660bd5a280d4acea48b6a280d720d6d29891d`.
- **Open verification:** Browser-level checks on the user's live environment have not been performed by the agent. User should validate the interactions after pulling the latest main.
- **Next:** User syncs local main and smoke-tests inbox filtering, single read/unread, mark all read, and selected bulk delete.


## 2026-10-25 — NOTIFICATIONS-COUNTERS-DOUBLE-CLICK — Stable folder counters and explicit read interaction

- **Status:** IMPLEMENTED; CI pending.
- **User-reported symptoms:** Folder badge numbers changed or disappeared when switching folders; selected-message read/unread action appeared to do nothing; desired double-click-to-read behavior.
- **Root cause identified:** The All/Read folder counts were derived from `total`, which represented only the currently active query. Custom folder definitions did not include their own count, so their badges disappeared.
- **Changes:** Website, Company, and Admin now fetch independent total counts for All and each server-managed folder; Read is calculated from the independent All total and global unread count. Zero counts remain visible. A single click selects a message without mutating its read state; double-click selects and marks it read. Bulk read/unread updates visible rows immediately after server success, then refreshes the list and all counts. Folder membership changes refresh counts too.
- **Tests:** Updated the three inbox tests to assert a single click does not mark read, double-click does, and read-request failure leaves the message unread.
- **Commits:** Implementation and test changes are being committed directly to `main` via the GitHub repository integration; exact commit IDs are available from the commit history.
- **Verification:** Automated GitHub Actions validation pending. No local browser or local checkout was available in this session, so live UI interaction is NOT VERIFIED.
- **Next:** Check CI, correct any failures, then sync local `main` and verify counts, double-click read, selected bulk read/unread, and bulk delete in the browser.


## 2026-10-25 — PRODUCT-LIFECYCLE-AUDIT-2026-10-25 — Product module end-to-end audit

- **Status:** IN_PROGRESS
- **Agent:** ChatGPT via GitHub repository tools
- **Issue:** https://github.com/gameacc2025/martest/issues/2
- **Goal:** Audit the product lifecycle end-to-end, complete safe verified fixes, and create/maintain follow-up tasks for unresolved changes.
- **Claimed scope:** Backend product service/controller/routes/tests; Company/Admin product UI; Website listing/detail/store; images/documents, specifications and pricing; product roadmap and AI-agent instructions.
- **Pre-work checks:** Confirmed repository `gameacc2025/martest`, default branch `main`, observed HEAD `6e19a2e6cb248273d4f0fd4115d722eda41ee504`; reviewed root agent rules, shared protocol, current-task handoff, project context, decisions, architecture roadmap, testing guide, and relevant product source/test files. Existing current-task handoff was preserved and this task was appended.
- **Initial observations (not yet declared defects):** Product service defines status transitions and a configurable review-on-edit threshold (default 5); `myProducts` controller has an explicit SUPER_ADMIN/company-scope branch. Need to verify those behaviors against routes, service checks, UI actions, and tests. Product image/list/detail behavior remains a known area to verify from historical project context.
- **Changes so far:** Opened GitHub issue #2 to track scope/acceptance criteria. Updated `.ai/current-task.md` to claim this task and record evidence/verification limits.
- **Commit:** `ec09fe3e95db860b18757da83879ac0da391176b` — claim task in current-task handoff.
- **Verification:** Remote source inspection only. Local `git status`, runtime tests, builds, and browser interaction are **NOT RUN** because no local checkout/runtime is available in this session. No product implementation change has been made yet.
- **Push:** The current-task documentation commit was written directly to remote `main` using the GitHub repository integration; remote head verification still required.
- **Risks / open questions:** Need to inspect the full route/service behavior and current CI before choosing code changes. Do not modify permission/business rules, Prisma schema, or migrations without approval when impact is consequential.
- **Next:** Continue cross-layer audit; add confirmed findings to issue #2; then implement narrowly scoped, test-backed fixes or leave clearly prioritized follow-up tasks.


### Product audit milestone — 2026-10-25

- **Status:** IN_PROGRESS; remote inspection milestone complete, implementation pending local verification capability.
- **Confirmed from source:** Public list queries are forced to `PUBLISHED` + `PUBLIC`; public detail fetches enforce the same for anonymous/non-company callers. Product service defines lifecycle transitions and the configurable post-approval edit threshold. Company ownership checks are present in service helpers, and the management controller contains a SUPER_ADMIN branch that avoids companyId scoping.
- **Confirmed catalog contract gap:** Homepage derives “featured” and “best sellers” from slices of the first returned products rather than the `isFeatured` field or sales data. Product controller listing extracts only search/company/category/status; the service does not apply the website's price-range, stock, featured, or sort parameters. Tracked in [issue #3](https://github.com/gameacc2025/martest/issues/3). The current route maps `/products` to `ProductListing.vue`; `Products.vue` may be legacy and must be confirmed before changes.
- **Issue tracking:** Lifecycle end-to-end audit #2; listing/filter/featured contract #3.
- **Documentation commit:** `be84ac7408f19442913a40c6594c57cd7999e3d1` — updated current-task findings and handoff. Earlier claim commit: `ec09fe3e95db860b18757da83879ac0da391176b`.
- **Verification:** Source inspection only. Tests/builds/browser/manual reproduction and local Git status remain **NOT RUN** because this session has no active local checkout/runtime. No product implementation changes have been made.
- **Next:** Obtain/use local checkout, inspect CI status and all product tests; reproduce catalog behavior; implement and verify fixes in scoped commits; update product/API docs and AI-agent context at each milestone.


## 2026-10-25 — PRODUCT-CATALOG-CONTRACT-01 — Implement supported public catalog filters

- **Status:** IN_PROGRESS
- **Agent:** ChatGPT via GitHub repository tools
- **Goal:** Fix the active website catalog contract first, without introducing unsupported stock/sales semantics or weakening public visibility.
- **Claimed scope:** `backend/src/modules/products/product.controller.js`, `backend/src/modules/products/product.service.js`, relevant product service/controller tests, `apps/website/src/pages/public/Home.vue`, and `docs/API_DOCUMENTATION.md`.
- **Evidence:** Active `/products` route uses `ProductListing.vue`; it sends min/max price filters. The backend list controller currently forwards only search/company/category/status and service always sorts by newest. Product model supports `isFeatured` and `prices` tiers but has no stock quantity or sales metric. Homepage currently derives featured/best-seller sections from arbitrary slices.
- **Plan:** Implement validated min/max price and featured filters plus allowlisted sort order in the backend; preserve PUBLISHED+PUBLIC clamp for public queries; update homepage to request actual featured products and remove unsupported “best sellers” claim in favor of an explicitly named recent-products section; add regression tests and API docs.
- **Verification:** Source inspection only at claim time. Local checkout, test execution, build, and browser checks are NOT RUN in this session.
- **Commit:** Claim/handoff update committed as `ac7ca1b97a8e7884a294114a5c05542c019aa55d`; implementation pending.
- **Push:** Documentation write is on remote `main` through the GitHub repository integration.
- **Risks / open questions:** No stock quantity or sales data exists in the Product schema, so stock filtering and best-seller ranking cannot be implemented honestly from current model. Product price filtering is based on related price tiers. No Prisma schema changes are planned.
- **Next action:** Implement and review the catalog query contract, then move to lifecycle/media permission checks under issue #2.

### Product catalog implementation milestone — 2026-10-25

- **Status:** IMPLEMENTED IN SOURCE; automated verification BLOCKED.
- **Changes:** Backend public product listing now accepts and applies `minPrice`, `maxPrice`, `featured`, `sortBy`, and `sortOrder`; price bounds validate and match one price tier; sort fields are allowlisted. Public visibility remains forced to `PUBLISHED` + `PUBLIC`. Added service/controller regression tests and documented the query contract in `docs/API_DOCUMENTATION.md`.
- **Website fixes:** Homepage featured section queries `isFeatured=true`; the arbitrary “best sellers” slice is now accurately labelled newest products. Active `SearchResults.vue` now calls the paginated search API with the correct query string and response shape, uses `categoryId`, maps canonical product fields to the shared ProductCard DTO, wires view/wishlist events correctly, preserves pagination, and removes unsupported stock/rating/brand filters. Homepage and catalog listing cards now prefer `isPrimary` images over array position.
- **Commit trail:** `bac6f11906f72e9db23e68b0f4b39ef79f489eb0`; `6dcb4a2096c2a720eff2a314e7c6691339736019`; `744eb144c630d3a066d870649a1296b4c3eac9b5`; `8b3ac3853d107f1f0839d9429e7290569aadbfe7`; `bb6db21daf22fe2fef46b6abc00ef0613a09a64d`; `0f78d7c36cce65055c8959f2ed609f13c12586a5`; `466f59acf65efd44b5590fa4831509053f6ab7ff`; `ae6c42015270d362ed3e835b00580abf6c26fc6d`; `67a61834c53cf9f0a4aa7da155e32173cd9be57b`; `c8d18f0e2fa3c4b7335b618de0c7fdbf2bbee623`; `f7ffa7295289d6294e8ba7424bd977ce924ce573`; `8f78d48e337de42ec988d85a44a01b83370df722`.
- **Verification:** Source re-fetch/review only. GitHub Actions runs before the latest edits failed at frontend/shared tests because Website/Company/Admin notification inbox tests expect a `خوانده‌شده` button that is not found; backend tests and builds were skipped. Latest run for HEAD `8f78d48e337de42ec988d85a44a01b83370df722` was `40233026025`, in progress at last check. Local tests/build/browser checks are NOT RUN.
- **New security finding:** `GET /api/v1/products/:id/history` and `GET /api/v1/products/:id/activity` are authenticated but lack route access-type/permission checks; service methods only verify existence and do not enforce company ownership, exposing audit trails and actor identity details. Comment with proposed fix/tests added to issue #2. As a security/authorization change, implementation is awaiting explicit user approval.
- **Next:** Re-check CI; continue product lifecycle, pricing/specification, media, and UI audit. Obtain explicit approval before the history/activity access-control fix. Do not close issues until verification and remaining high-impact findings are resolved.
### Product price-tier persistence fix — 2026-10-25

- **Status:** IMPLEMENTED IN SOURCE; automated verification BLOCKED.
- **Finding:** Company/Admin product forms submit a full `priceTiers` collection when editing, but `updateProduct` discarded that field. Price edits, additions, and removals therefore appeared saved but were not persisted.
- **Changes:** `updateProduct` now validates submitted ranges, checks IDs belong to the product and are unique, preserves existing tier IDs and validity metadata, atomically reconciles updates/deletions/creations with the product update, applies the existing edit-review threshold once for the form save, and writes price-tier status/activity audit entries. The update schema accepts existing tier IDs and nullable `maxQuantity`/`unit`; both product forms now send IDs and explicit nulls when clearing those optional fields. API docs and service/route regression tests were updated.
- **Commit trail:** `a2587ee556517e28fec860925eb4f7ee93c293d1`; `39be3e7743172bcadcec59f2707be52fee0ca903`; `09adaa21fd4a313b83f55d64c8d1e0da03466134`; `29d4d2a3ebee0decc50a28ebe494772dad94288c`; `79be530dc0597cf4f815eb30a6dc59f7580656ff`; `2438e2d8986cc3fb70d8b972b255a58eb82c6555`; `826384183215d3d29f8d4df38fc32d81f107b080`; `bd428acb8962a6fde63cde1e35b4e607739a4cd9`; `0e98602bc0d48ffc4eea52875ca637189b1b12f9`; `981fcfeb24f7a1adef8b71e6796a728295acc7d7`; `6e497e2dd301874844a166b882d707aeea133067`.
- **Verification:** Source re-fetch/review only. CI is blocked at the frontend/shared test step by three notification inbox test failures (Website/Company/Admin tests expect a `خوانده‌شده` button that is not found); backend tests and production builds are skipped. Latest observed failed run: `40233455392` for `6e497e2dd301874844a166b882d707aeea133067`. No local checkout/test/build/browser checks are available in this session.
- **Open security approvals:** Issue #2 now records (1) unguarded product history/activity routes exposing internal audit details to any authenticated caller, and (2) granular STAFF users being treated as public callers, preventing them from listing/loading pending-review products via management routes. Proposed access-control fixes and regression criteria were posted. Per agent policy, wait for explicit user approval before changing authorization boundaries.
- **Next:** Obtain approval for the two authorization fixes; continue source audit of media, specifications, lifecycle actions and UI. Do not close issues until relevant CI checks run and pass.
### Product media controls and final source review — 2026-10-25

- **Changes:** Company and Admin product forms now expose actions to set an existing image as primary and move it up/down using the existing image APIs. The UI updates primary flags and ordering after successful actions and mirrors backend primary-image promotion when the primary image is deleted. Product update responses re-read the product within the transaction when price tiers change so returned price data reflects the reconciled state.
- **Commits:** `41c21e0261bc568952fbea8cbcdcb4d87dc7108b`; `96777e038d92e149538e52b157985bbbd19c2610`; `ca1628279fbb8616f3a8b53ed2eff52cacf14125`; `b0f62fc8eb9a8d5bd530c0f281f519d7ef979bbb`; `9be306c77c98e947584cb524969d8ac655b7b14f`; `e3eaf963a9c89c5e41e74bd122d2aa6e01573430`; handoff update `6dbe36e97ac0330c02fee21860d9f6cf99b50701`.
- **CI:** Latest inspected completed run `40233605679` failed at frontend/shared tests with three notification inbox failures (`Notifications.test.js` cannot find the `خوانده‌شده` bulk button after checkbox selection); 155 tests passed, 3 failed, and the workflow stops before backend tests/builds. Run `40233642942` for then-current HEAD `e3eaf963a9c89c5e41e74bd122d2aa6e01573430` was queued at last check. A local clone attempt failed because this runtime cannot resolve `github.com`; no local tests/build/browser checks were run.
- **Open approval items:** Issue #2 records two security/authorization changes that need explicit user approval before implementation: audit-history/activity route access control and separating public catalog visibility from granular STAFF management access.
- **Next:** Wait for user approval for the security changes; resolve the CI notification-test blocker or establish an independent backend test run before claiming verification; continue lifecycle/specification/media audit and keep issues open until the relevant checks pass.
## 2026-10-26 — PRODUCT-AUTH-2026-10-26-01 — Product audit and STAFF management access
- **Status:** IN_PROGRESS
- **Agent:** ChatGPT via GitHub remote file API
- **Goal:** Close the two approved security findings from product audit issue #2: protect product history/activity by access type and ownership, and allow authorized STAFF moderators to list/load products in any lifecycle state without weakening public catalog visibility.
- **Claimed scope:** `backend/src/modules/products/product.routes.js`, `product.controller.js`, `product.service.js`, related route/service tests, API documentation, `.ai/current-task.md`, `.ai/WORKLOG.md`.
- **Plan/evidence:** `GET /:id/history` and `/activity` are authenticated but lack RBAC guards and service ownership checks. `/my-products` and `/:id/manage` lack explicit `products.read` guards. `listProducts` treats STAFF without companyId as public, forcing `PUBLISHED` + `PUBLIC`; `getProductById` does likewise. Public `GET /` explicitly passes `publicOnly: true`, which must remain clamped.
- **Verification plan:** Add route tests for required access type/permission on management and audit endpoints; service tests for STAFF access to pending/private products, company tenant isolation on audit logs, and public catalog clamp. Inspect diffs/source. Runtime tests/builds only if a runnable checkout is available; currently remote GitHub file edits only.
- **Approval:** User explicitly instructed: “انجام بده و معطل نکن” for both security fixes on 2026-10-26.
- **Next:** Implement scoped backend guards and service ownership checks, update tests/docs/handoff, then check GitHub Actions and report exact results.
## 2026-10-26 — PRODUCT-AUTH-2026-10-26-01 — Product audit and STAFF management access
- **Status:** IMPLEMENTED IN SOURCE; automated verification pending.
- **Agent:** ChatGPT via GitHub remote file API.
- **Goal:** Close the two approved security findings from product audit issue #2.
- **Changes:** Product management list/detail and history/activity routes require STAFF or COMPANY access type plus `products.read`; SUPER_ADMIN bypass is preserved. `myProducts` scopes only COMPANY access profiles to their company, allowing STAFF moderators to see pending-review products across companies. `getProductById` now permits authorized STAFF to load non-public products through the management route, while the public route stays clamped to `PUBLISHED` + `PUBLIC`. Audit services now accept the caller and enforce `products.read` plus company ownership, returning 404 for cross-company COMPANY requests before reading audit rows. API docs and route/service regression tests updated.
- **Files:** `backend/src/modules/products/product.routes.js`, `product.controller.js`, `product.service.js`, `product.routes.test.js`, `product.service.test.js`, `docs/API_DOCUMENTATION.md`, `.ai/current-task.md`.
- **Commits:** `6ba52f850c677f173da81a989c10dd6d6453e7fb` (claim); `0e1b87b2e7c77e8ac2b94ed9d41c047321185938`; `037daf105deecd1dfeb205ca987303b6a0837e1b`; `d32c748f38f071f96f5ddc66512d500170c3984d`; `139ae28219da533e5def0a03eb0c879f0dacb6d9`; `a9edc271385a213de60e11c628cbf5cf8cf67dee`; `32b1beb4d1ed7c8549d3fb5a4575f18f05346469`; `33c23dc022d7ccc181f960ec4a47dbee93f747ee`; `1fa059e1a6aba89f463c445ec927e03a9c39b044`; `5af33260e62a1cef08c6690592f938f92eadc79f`; `42468c4c8a5913da15a55152549c371752779f0b`; `3c59c8339aab7a4db7b7948d32c101b2dee5c68b`.
- **Verification:** Source/test review via GitHub API only; local test/build commands NOT RUN because there is no working local checkout/network access in this session. Run `40270601243` for HEAD `42468c4c8a5913da15a55152549c371752779f0b` was queued at last check. Recent CI run `40270506320` failed before backend tests due to three pre-existing Website/Company/Admin notification bulk-read tests expecting a `خوانده‌شده` button that is not found (155 passed, 3 failed).
- **Risks / open questions:** The permission contract assumes product moderators are granted `products.read`; confirm via test/CI and existing permission seeds. Audit endpoints now intentionally expose actor identity details only to authorized readers.
- **Next:** Check latest CI; if the notification test blocker persists, fix its root cause so backend tests/builds can execute. Then verify the product tests and continue the remaining lifecycle/specification/media audit.
### Product authorization hardening follow-up — 2026-10-26

- Restricted `isCompanyUser` to COMPANY access profiles (with legacy no-accessType compatibility), preventing CUSTOMER callers with an unexpected `companyId` claim from being classified as company managers.
- Staff moderator test fixture now intentionally includes `companyId: 999` to prove STAFF remains cross-company; added service tests denying CUSTOMER access to product history/activity even if the caller has `products.read` and a companyId.
- Commits: `8a963b4459288d7de714b4913579dbb61669435d`, `df0e7b52cf8e1e2643bbabac43cd999eee96bcf2`, handoff update `783cbe999d0acbe6d0431158d680b1004382e73d`.
- CI: run `40270760225` for then-current HEAD `df0e7b52cf8e1e2643bbabac43cd999eee96bcf2` was queued at last check. Existing frontend notification bulk-read tests still block the backend test step in recent runs; product tests/builds remain NOT VERIFIED.
- Next: Check latest CI and remove the notification test blocker if it persists, then verify the product service/route suites.

## 2026-10-26 — CI-UNBLOCK-NOTIFICATIONS-2026-10-26-01 — Restore bulk notification selection test coverage
- **Status:** IN_PROGRESS
- **Goal:** Remove the existing Website/Company/Admin notification bulk-read UI test failure that stops CI before the product backend tests can run.
- **Evidence:** Latest workflow logs show 3 failed / 155 passed frontend tests; each failure cannot find the `خوانده‌شده` bulk button after setting a row checkbox. Backend tests/builds are skipped by the workflow after this frontend failure.
- **Scope:** Three `Notifications.vue` pages and their focused tests only; no notification API/schema changes.
- **Verification:** CI must pass the notification tests before product backend tests can be considered verified. Remote GitHub source edits only; local test runner unavailable in this session.

### Verification milestone — product authorization + CI blocker — 2026-10-26

- **CI passed:** Run `40271177578` for commit `3eeb388ede16a3624b6ee2c6ca3baf555d9bc761` completed successfully. Frontend/shared: 17/17 test files passed (158 tests, 0 failed). Backend: 1179/1179 tests passed. Prisma Client generation passed. Website, Company, and Admin production builds passed.
- **Product test corrections:** Updated controller tests to assert the COMPANY access type and to verify `getActivity` forwards the authenticated caller; corrected the changed-price-tier fixture to use non-overlapping quantity ranges.
- **CI blocker correction:** The three notification tests now locate the rendered bulk action by its rendered label instead of matching the imported PrimeVue component object, and the toolbar selection state is exposed through a computed flag. The passing CI run confirms the three Website/Company/Admin notification tests no longer block the workflow.
- **Documentation:** Corrected the legacy API docs that incorrectly listed public `GET /api/products` and `GET /api/products/:id` as requiring `products.read`; documented the public-vs-management split and access contract.
- **Status caveat:** The successful run is for `3eeb388ede16a3624b6ee2c6ca3baf555d9bc761`. A later docs-only commit `4f4d2a2c9885adca22dcee1c95f774698e3fd4f1` is the newer HEAD at this log update and its own CI run `40271218831` was still in progress at last check.
- **Next:** Verify the latest HEAD workflow finishes successfully; continue the remaining product lifecycle/media/specification audit.
## 2026-10-26 — PRODUCT-LIFECYCLE-UI-2026-10-26-01 — Complete missing product lifecycle controls
- **Status:** IMPLEMENTED AND VERIFIED IN CI.
- **Changes:** Company ProductList now offers resubmission for REJECTED products using the canonical `canSubmitForReview` helper. Admin ProductList exposes hide/archive/restore-to-draft for only the backend-allowed statuses, gates all moderation actions by their existing permissions, hides create/edit/copy/delete actions when the caller cannot perform them, and removes the inappropriate Admin submit-review button. Admin product status helpers now derive action availability from `ALLOWED_TRANSITIONS`; new admin/company config tests cover allowed transitions.
- **Status transition fix:** STAFF with `products.publish` can publish APPROVED and HIDDEN products across companies; COMPANY publication still requires ownership and APPROVED status. This matches the existing route contract and has a regression test.
- **Files:** `apps/company/src/pages/company/products/ProductList.vue`, `apps/company/src/config/product.test.js`, `apps/admin/src/pages/admin/products/ProductList.vue`, `apps/admin/src/config/product.js`, `apps/admin/src/config/product.test.js`, `backend/src/modules/products/product.service.js`, `backend/src/modules/products/product.service.test.js`.
- **Issues:** #4 tracks lifecycle UI work (implemented); #5 tracks `isFeatured` permission enforcement and remains open pending authorization approval; #6 tracks broader STAFF update/delete/price/media write scope (publish subcase fixed, other write paths remain open pending explicit decision).
- **Verification:** GitHub Actions run `40271764110` for commit `670e1071712069ff4adbd66b5542799423a1e202` passed: frontend/shared tests passed; backend 1179/1179 passed; Prisma Client generation passed; Website/Company/Admin production builds passed.
- **Next:** Check CI for the latest documentation/handoff commit; continue the remaining product audit. Do not implement issue #5 or broaden STAFF write access without explicit approval.

### Final lifecycle UI verification — 2026-10-26
- Admin create/edit/copy/delete controls are now scoped to the caller's permission and, for non-SUPER_ADMIN callers, the product's matching companyId. This avoids showing actions that the service would reject for a different tenant.
- Latest code HEAD `3b541c3255532a8c14c24e7de0bc7d163e47265a` passed GitHub Actions run [40271919142](https://github.com/gameacc2025/martest/actions/runs/40271919142): frontend/shared tests passed, backend 1179/1179, Prisma Client generation passed, and Website/Company/Admin builds passed.
- Issue #4 lifecycle UI work is implemented and verified. Remaining open approval-sensitive findings are #5 (`isFeatured` permission enforcement) and #6 (broader STAFF update/delete/price/media write authorization; STAFF publish subcase is already fixed).


### Price deletion review policy and stored-XSS fix — 2026-10-26
- `deletePriceTier` now follows the same post-approval edit threshold as add/update: product status/counter update, status history, activity log, and staff notification happen in the same transaction. Added threshold-crossing regression coverage.
- Found stored-XSS risk in public ProductDetails (`v-html` on company-editable description). Since the editor is a plain textarea, changed rendering to escaped text interpolation and preserved line breaks; ProductPreviewCard already used safe interpolation. Issue #7 records the finding and fix.
- **CI passed:** Run `40272171627` for commit `3a132bf65c6783f35231f4304d6ded82347b335f` passed frontend/shared tests, backend tests, Prisma generation, and Website/Company/Admin builds.
- **Remaining approval-sensitive issues:** #5 `isFeatured` permission enforcement and #6 broader STAFF write scope (publish subcase already fixed). These were recorded but not implemented beyond the explicitly authorized scope.


### Public product response allowlist — 2026-10-26
- Public product list/detail now use `publicProductSelect` rather than `include`, returning only fields required by the public catalog and its public relations. Internal `statusHistory`, actor/creator IDs, `editsSinceApproval`, and `deletedAt` are omitted. Management reads continue using `productInclude` with status history for authorized callers.
- Added regression tests for public list/detail select shapes and management detail retaining history. API docs document the public response privacy boundary.
- CI run `40272542697` for commit `9c42d944e07baf8dde418e7ce301f0a663552826` passed frontend/shared tests, backend tests, Prisma generation, and Website/Company/Admin builds.
- The later docs-only commits `575f1ba0d3ad5ae471d92c24ead003c9664b70a2` and `144a7c31b913593f340d19d135d5f6d373178708` clarify the public field allowlist; their CI runs are pending.


### Public response privacy verification and issue closure — 2026-10-26
- Latest handoff HEAD `c1bfed792c2933a586d88838ae498e4073c4ed2f` passed GitHub Actions run [40272711539](https://github.com/gameacc2025/martest/actions/runs/40272711539): frontend/shared tests, backend tests, Prisma generation, and all three production builds passed.
- Closed completed issues #3 (catalog query/featured behavior), #4 (lifecycle UI), #7 (stored XSS), and #8 (public product response privacy allowlist). Master audit issue #2 remains open while authorization decisions #5 (`isFeatured`) and #6 (broader STAFF write scope) remain unresolved.
- Next required user decision: authorize the `products.feature` guard for create/update and decide whether STAFF with granular write permissions should operate cross-company for update/delete/price/media operations. The STAFF publish subcase is already implemented and tested. No schema changes were made.


## 2026-10-26 — PRODUCT-AUTH-FEATURED-STAFF-2026-10-26-01 — Enforce featured and STAFF cross-company permissions
- **Status:** DONE — verified by GitHub Actions.
- **Goal:** Apply the approved policy: changes to `isFeatured` require `products.feature` or SUPER_ADMIN; STAFF cross-company writes require the exact operation permission; COMPANY ownership remains mandatory.
- **Changes:** Added service-level permission checks for STAFF product create/update/delete, price tiers, image/document operations, and lifecycle actions. STAFF product creation now requires `products.create` and an explicit target `companyId`. STAFF-only moderation and caller access type are checked at service level. COMPANY ownership is preserved. Added the featured-field guard and hid/omitted the featured toggle in Company/Admin forms without permission. Admin cross-company controls now reflect granular STAFF permissions; creating across companies requires `products.create` and `companies.read` in the UI. Added 12 backend regression tests and updated API/decision documentation.
- **Files:** `backend/src/modules/products/product.service.js`, `backend/src/modules/products/product.service.test.js`, `backend/src/modules/products/product.routes.js`, `apps/company/src/pages/company/products/ProductForm.vue`, `apps/admin/src/pages/admin/products/ProductForm.vue`, `apps/admin/src/pages/admin/products/ProductList.vue`, `docs/API_DOCUMENTATION.md`, `.ai/decisions.md`, `.ai/current-task.md`.
- **Verification:** GitHub Actions [run 40277836441](https://github.com/gameacc2025/martest/actions/runs/40277836441) passed. Frontend/shared: 19/19 test files; backend: 1196/1196 tests; Prisma Client generation passed; Website, Company, and Admin production builds passed. Local tests/builds were NOT RUN; remote CI is the verification source.
- **Commit:** Changes written to remote `main` through GitHub Contents API; verified commit at time of CI: `4b0f9720f17bd60ef75473de7be9c72c2b8c1f6e`.
- **Push:** Directly committed to remote `main`; no local push was performed.
- **Risks / open questions:** None remaining for the approved scope. No schema or migration changes.
- **Next action:** Keep product permission seeds aligned with assigned roles; closed issues #2, #5, and #6 after successful CI.

## 2026-10-26 — PRODUCT-DETAILS-LAYOUT-2026-10-26-01 — Refine product details page to match reference
- **Status:** DONE — GitHub Actions passed.
- **Agent:** ChatGPT via GitHub repository tools.
- **Goal:** Improve the public product details page layout based on the user-provided reference screenshot while preserving existing product data/API and commerce behavior.
- **Changes:** `apps/website/src/pages/public/ProductDetails.vue`: gallery now uses a wider landscape frame with a lower minimum height; desktop sidebar is narrower; technical specifications render as full-width single-column rows; mobile order is gallery first, then the action/supplier sidebar, then description and specifications. Existing API, cart, wishlist, and supplier navigation behavior are unchanged.
- **Verification:** [GitHub Actions run 40287801938](https://github.com/gameacc2025/martest/actions/runs/40287801938) passed. Frontend/shared tests: 19/19 files; handoff suite: 18/18; backend: 1196/1196; Prisma Client generation passed; Website, Company, and Admin production builds passed. Local/browser visual testing NOT RUN (remote-only editing session).
- **Commit:** `74598683d26929380418adf876fbb3da00ba9d53` (source change; verified by CI).
- **Push:** Committed directly to remote `main` through GitHub Contents API.
- **Risks / open questions:** The reference image shows a dedicated “ثبت استعلام” workflow while current Website product details still uses cart actions. No inquiry API was invented or wired; this task preserves existing behavior until a verified inquiry flow is available.
- **Next action:** User can sync latest `main` and review the page at desktop/mobile widths.

## 2026-10-26 — PRODUCT-DETAILS-ACTIONS-PRICE-CHART-2026-10-26-01 — Product action icons, category badge, tags and six-month price view
- **Status:** DONE — CI passed.
- **Goal:** Apply the user's requested ProductDetails UX changes: permission-gated inquiry icon, icon-only wishlist and price-chart controls beside price, primary category badge beside title, and tags at bottom of sidebar.
- **Evidence:** Current page has a labeled wishlist button in the heading and category/subcategory chips above the title. Website router has no inquiry-create route; shared API client does expose `inquiriesApi.create`, and backend POST /inquiries requires `inquiries.create` or `leads.create` plus a supported access type. Product schema has current price tiers with validFrom/validTo/createdAt/updatedAt but no immutable price-history table. Do not fabricate a historical series; show only available retained price-tier records within six months and state when historical data is unavailable.
- **Scope:** `apps/website/src/pages/public/ProductDetails.vue`; update project handoff/worklog.
- **Plan:** Gate inquiry icon by authentication + permission, submit a single-product RFQ using the existing API and quantity/details dialog, move wishlist to compact icon action beside price, add six-month price-history dialog based only on returned tier records, place only primary category badge inline with title, remove category breadcrumb chips, and render tags at the bottom of the sidebar if the public product response provides them.
- **Verification:** GitHub Actions tests and all production builds. Browser visual validation is not available in this remote-only session.
- **Commit:** Source changes are on remote `main`; final UI commit `80f4c49cb10141065750fa7ae2e74c38d4a0fae1`.
- **Push:** Existing standing instruction permits direct commits to remote `main`.
- **Risks:** Existing product API does not persist complete historical price snapshots; UI must not imply full historical completeness.
- **Verification:** [GitHub Actions run 40290318566](https://github.com/gameacc2025/martest/actions/runs/40290318566) passed: frontend/shared 19/19 test files, handoff 18/18, backend 1196/1196, Prisma generation, and Website/Company/Admin builds. Local/browser visual test NOT RUN.
- **Next action:** For a genuine six-month price-history chart, add persistent immutable price snapshots and expose a read endpoint; current UI intentionally does not fabricate missing historical data.


## 2026-10-26 — PROJECT-QUALITY-2026-10-26-01 — Resolve handoff and execute five follow-ups

- **Status:** IN_PROGRESS — implementation is on `main`; latest CI verification is still running.
- **Goal:** Address the five approved follow-ups: handoff conflict, notification validation, persistent product price history, product detail/inquiry validation, and email/SMS delivery verification.
- **Task 1 — Handoff:** Removed the confirmed Git conflict markers from `.ai/current-task.md` and replaced the conflicted file with a concise active handoff. Detailed completed product and notification history remains in this append-only WORKLOG. Commit: `ce8466fa5f0b0ddddef2d9d71fdd05cc5f06f0c1`. CI run [40308446476](https://github.com/gameacc2025/martest/actions/runs/40308446476) passed.
- **Task 2 — Notifications:** Confirmed the Website, Company, and Admin inboxes have tests for double-click-to-read and bulk read-state, and the current notification/design baseline passed CI run [40307827860](https://github.com/gameacc2025/martest/actions/runs/40307827860). Manual browser testing is NOT RUN in this remote-only session.
- **Task 3 — Immutable price history:** Added `ProductPriceSnapshot` model and migration; snapshots are written on product creation, individual price-tier create/update/delete, and full price-tier reconciliation during product edits. Added public `GET /api/v1/products/:id/price-history`, clamped to currently PUBLISHED + PUBLIC products and the last six months; updated ProductDetails to fetch and display saved snapshots; added service/route tests and API documentation. No historical backfill is fabricated. Commits: `b12da375624a94920f81218ef7cbb87d21cc5127`, `206c600b8aa38e987f46339df55f0c96d5062e5c`, `c72857e569deba6cfa3bdf69a44ca42cef809585`, `b2525e48baa675283f7bf46fb6ac7649a1e7a8b4`, `6ad5e0ef3d153ed945f33f2abdb1f1c8d0310baa`, `9ae3843698b69874e9cb53b5611e3c6521a6a183`, `88aa368eb2c176229a21beba960894a4e8bc5caf`, `d64b429f34f7852ddd5a56b7a073339438528bb0`, `a0364f941991a39e307fb03ca9d347bc2519d6e3`, `b2525e48baa675283f7bf46fb6ac7649a1e7a8b4`, `9ae3843698b69874e9cb53b5611e3c6521a6a183`, `88aa368eb2c176229a21beba960894a4e8bc5caf`, `4233e769386db85f07f7cbccf03a1128bae01851`, `f1dab7c87d8cb459d751664fe88dc6fe2a8ded65`, `d721db5e777b117cd1ed289123cf019c64c835d3`, `6e6cb9959aaa99d49b25026297ad1adf5fbba8a0`.
- **Task 4 — Product detail/inquiry:** Confirmed the existing permission-gated inquiry form, wishlist, price history UI, product tags, responsive layout, and preserved cart/supplier navigation in `apps/website/src/pages/public/ProductDetails.vue`. Existing CI run [40290318566](https://github.com/gameacc2025/martest/actions/runs/40290318566) passed the prior product-detail implementation. New price-history changes are covered by the current CI run; manual desktop/mobile browser verification is NOT RUN.
- **Task 5 — Delivery:** Confirmed SMTP provider configuration and worker exist, using `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, and `SMTP_FROM`. Without configured SMTP, delivery is skipped/console fallback is used; live SMTP delivery is NOT VERIFIED because no configured delivery environment is available. SMS remains explicitly not implemented.
- **Verification:** Latest observed workflow for current price-history work, [40309246682](https://github.com/gameacc2025/martest/actions/runs/40309246682), was IN_PROGRESS when this entry was written. Earlier intermediate runs failed because the route-test controller stub did not include the newly added handler; the stub and route test have since been updated. Do not mark the task DONE until the latest CI result is checked.
- **Migration/rollout:** Deploy the new Prisma migration before relying on the endpoint in a live environment. Existing historic prices are not backfilled because the prior data does not contain a reliable immutable history.
- **Next action:** Verify latest CI on the final source commit; fix any failing tests/builds, then update this entry and current-task with exact results.


### Verification update — PROJECT-QUALITY-2026-10-26-01

- **Status:** PARTIAL — implementation and CI verification passed; manual browser and live SMTP checks remain NOT VERIFIED.
- **CI:** GitHub Actions [40309340136](https://github.com/gameacc2025/martest/actions/runs/40309340136) passed for commit `fa1df2054d1220f526e652f6fc6c8964644ebece`: frontend/shared tests, Prisma Client generation, backend tests, and Website/Company/Admin production builds.
- **Price history:** The immutable snapshot model, migration, write hooks, public history endpoint, UI integration, route/service tests, and API documentation are committed to `main`. Apply migration `20261026110000_product_price_snapshots` before deployment. No historical backfill was made because the existing mutable price-tier timestamps do not provide a reliable complete historical record.
- **Remaining operational checks:** Manual browser tests for Website/Company/Admin notification inboxes and desktop/mobile product details; controlled SMTP delivery test with valid deployment credentials. SMS remains unimplemented.
- **Latest handoff:** `599bdf094d0c22c82051c61f96309beb999ec27c`.


## 2026-10-26 — REPOSITORY-QUALITY-AUDIT-2026-10-26-01 — Full pre-development audit
- **Status:** IN_PROGRESS — initial source/document review and CI evidence collected; remediation and operational verification remain.
- **Agent:** ChatGPT via GitHub repository tools.
- **Goal:** Verify existing application sections, architecture/dependency documentation, tests, access boundaries, and deployment readiness before starting the remaining feature roadmap.
- **Scope checked:** Root README and manifests, CI workflow and latest run logs, current task/project context, notification contract, role-access matrix, API/frontend/database/Docker docs, production and development Compose files, three frontend Dockerfiles, backend Dockerfile, Prisma schema, and product/notification route registration.
- **Findings:** Added `docs/REPOSITORY_QUALITY_AUDIT_2026-10-26.md`. Key issues: Docker docs still describe Next.js/legacy frontend paths and Node 18; docs index says Next.js/PostgreSQL 16/Prisma 5; frontend docs refer to obsolete `frontend/src`; API docs describe legacy `/api` paths and role/user shapes; database model inventory is stale; role-access matrix needs reconciliation with access-profile-based app contexts. Successful Admin build emits a >500 kB chunk and ineffective dynamic-import warning.
- **Verification:** CI run [40309510309](https://github.com/gameacc2025/martest/actions/runs/40309510309) passed frontend/shared tests, backend tests, Prisma Client generation, and all three frontend builds. Source tree scan identified 78 test/spec files and 8 Prisma SQL migrations. Docker/Compose runtime, real PostgreSQL migration application, browser E2E/visual checks, company ownership/IDOR security sign-off, live SMTP, and generated graph validation are NOT VERIFIED.
- **Commit:** Audit report commit `b3e4d6d13aa2e331c2a25035f19fe22d1b73cb2f`; handoff/worklog updates follow separately.
- **Push:** Audit report committed directly to remote `main` through GitHub Contents API.
- **Risks / open questions:** Do not treat green CI as release sign-off. Authorization changes and migration/deployment operations require targeted tests and an isolated configured environment. Need determine whether the requested architecture graph means a generated dependency graph or only documentation diagrams.
- **Next action:** Reconcile stale documentation with source, audit RBAC/ownership and inquiry/notification/product price-history routes, then run/add operational smoke and browser tests before marking the audit complete.


## 2026-10-26 — PRODUCT-ACCESS-AUDIT-2026-10-26-01 — Product security, lifecycle, retail price history

- **Status:** IN_PROGRESS
- **User authorization:** User explicitly authorized full implementation of Task 1 (access/RBAC and ownership audit) and Task 2 (product workflow audit), without follow-up questions.
- **Scope:** Product service/route/controller access checks; COMPANY tenant isolation; STAFF operation permissions; product status transitions; pricing tier validation/reconciliation; specs and media; retail-only price history for charting.
- **Changes made:** Updated `backend/src/modules/products/product.service.js` so only the retail price tier (`minQuantity = 1`) is snapshotted. Wholesale tier creation/updates do not add points; metadata-only retail edits do not add duplicate points; a tier entering retail starts a series; a retail tier leaving retail preserves its final value. Public price history now returns the complete stored series ordered by `recordedAt ASC` instead of truncating at six months. Snapshot writes remain inside the same Prisma transaction as price mutations.
- **Tests added:** `backend/src/modules/products/product.service.test.js` covers wholesale exclusion, retail-to-wholesale final value, wholesale-to-retail series start, metadata-only no-op for chart, and complete public history query shape.
- **Docs updated:** API history endpoint summary and `docs/API_DOCUMENTATION.md`; replaced stale ProductPrice section in `docs/DATABASE_DOCUMENTATION.md` with current `ProductPriceTier` / `ProductPriceSnapshot` models and retail chart semantics; replaced current-task handoff.
- **Commits:** `fcfdf919577affcd590b55ca423e1b3d2f5de6d1`, `03da519bf207f6bc9fa376fb377b8a37b9981ce9`, `5f3fef964ae838be41ac63db2c160ae6808b400a`, `b2ac6ff37883f487c14c27484a9b7672254c66a1`, `cff8b70da5670b5af3897de2622dd08e3270a9e1`, `64358664d517316a4ef303db24c80be0263bfb4c`, `31a9ec433c1e3e949bedd8887c3742f7273e4301`, `8cfbbc08e3b738daf3a16320aaf7123a5c880d57`.
- **CI evidence:** Runs `40311461581`, `40311689207`, `40311709695`, and `40311758998` completed successfully on the code/test/docs commits listed there. Later commits must be checked before this task is marked complete.
- **Not yet verified:** PostgreSQL migration deployment against a real DB, Docker/Compose runtime, browser E2E/visual checks, live SMTP/other external services. Green CI alone is not production sign-off.
- **Next:** Finish code-path/test audit; verify CI for latest main HEAD; close any findings and update this record with final commit and verification status.


### Follow-up — PRODUCT-ACCESS-AUDIT-2026-10-26-01 (2026-10-26)

- **Additional lifecycle fix:** `deleteProduct` now performs soft deletion, status-history insertion (when status changes), and activity logging in one Prisma transaction.
- **Retail history edge cases:** Full product-editor tier reconciliation now records one net retail price change when the editor replaces a retail row, and avoids creating chart points when the retail amount remains unchanged. Added regression coverage for both cases.
- **Public product UI:** Product details prioritize the `minQuantity = 1` retail price for the headline price; the price-history dialog is labeled and explained as retail-only.
- **Test correction:** CI initially found a test-double mismatch in the unpublished-history test (the Prisma mock did not enforce the query predicate). The mock now returns no product for the non-public lookup, matching Prisma query semantics.
- **Green verification:** GitHub Actions run [40312425822](https://github.com/gameacc2025/martest/actions/runs/40312425822) passed on commit `e588f47068d8639ba3657fc2b62d4488e48349a2`; frontend/shared tests, backend tests, Prisma client generation, and all frontend production builds passed.
- **Current handoff commit:** `927e165677d2ff11b7ebde2a9160ba673ace075f`.
- **Still unverified:** Real PostgreSQL migration deployment, Docker/Compose startup, browser E2E/visual flows, and external service connectivity. These require an appropriate runtime environment; do not infer success from CI.


## 2026-10-26 — INQUIRY-COMPLETION-2026-10-26-01 — Complete inquiry/RFQ workflow
- **Status:** IN_PROGRESS
- **Agent:** ChatGPT via GitHub repository tools
- **Goal:** Finish the B2B Inquiry feature end to end before resuming customer dashboard/address/B2C follow-ups.
- **Scope:** Customer-created inquiries from Website, ownership-aware API/model, inquiry visibility (NORMAL/SEALED/ANONYMOUS_SEALED), status/deadline/publish lifecycle, Company response lifecycle, STAFF supervision, event-driven notifications, customer inquiry listing/detail, tests and docs.
- **Evidence/root causes:** Website ProductDetails.vue exposes inquiry creation to CUSTOMER_USER, but createInquiry() requires a companyId; Inquiry.companyId is required and has no buyer-user relation. Sealed modes are stored but getInquiry() returns all responses without applying visibility rules. Inquiry service currently has no calls to notification.dispatch.service.js, despite catalog events for inquiry publication and response receipt. publishDate/autoClose/allowEarlyReveal require verification for actual lifecycle behavior.
- **Implementation plan:** Add a backward-compatible buyerUserId ownership path with an XOR owner constraint/migration; preserve company-owned inquiry flows; enforce ownership and STAFF permission scope in services; redact sealed response data until allowed reveal and anonymize competing companies in ANONYMOUS_SEALED; connect published/status/response events to notification dispatch; add a Website My Inquiries workflow; add regression tests and update API/database/notification docs.
- **Verification plan:** Inquiry service/routes tests, notification event/dispatch tests, Prisma generate/validate, full backend tests, frontend/shared tests, all three frontend builds, CI and Runtime Validation. Checks not yet run.
- **Branch:** feature/inquiry-completion, based on main.
- **Deferred by user:** PR #11 customer-dashboard-foundation and other customer identity/B2C tasks remain unmerged/on hold until Inquiry is complete.
- **Next action:** Implement schema migration and service ownership/privacy fixes first, then UI/notifications, tests, and docs.


## 2026-10-26 — INQUIRY-COMPLETION-2026-10-26-01 — COMPLETED
- **Status:** MERGED to main.
- **Pull Request:** https://github.com/gameacc2025/martest/pull/12 (squash merged).
- **Merge commit:** `1335ce5cd6e9b5b17a13537db4dda9b607556f3a`.
- **Implemented:** CUSTOMER-owned Website inquiries with exclusive buyer ownership constraint; company-owned B2B RFQs preserved; supplier ownership and STAFF permission checks; drafts/future schedules hidden from suppliers; NORMAL/SEALED/ANONYMOUS_SEALED privacy; early reveal; buyer quote selection/manual rejection/automatic rejection of competing pending quotes; scheduled publishing and auto-expiry worker; USER/SYSTEM status history; transactional notifications for publication, quote receipt, status changes, selection/rejection; customer inquiry list/detail/cancel UI; company buyer decision/reveal UI; date-window validation; API/database/notification documentation.
- **Database migration:** Added `20261026150000_customer_owned_inquiries`; fixed invalid PostgreSQL `//` comments in the pre-existing `20261024120000_notification_system` migration, which had blocked fresh-database migration runs.
- **Verification:** CI passed on feature commit `0e1b0d7b` — https://github.com/gameacc2025/martest/actions/runs/40353078512. Fresh PostgreSQL schema validation, Prisma generation, `migrate deploy`, and `migrate status` passed — https://github.com/gameacc2025/martest/actions/runs/40353071103. Backend tests and all frontend builds passed in CI. Browser-level manual visual verification and live SMTP delivery were not performed.
- **Notification detail:** Email dedupe keys are per recipient to avoid silently dropping all but one recipient when a company has multiple active users.
- **Deferred by user:** Customer dashboard foundation PR #11 remains DRAFT and unmerged: https://github.com/gameacc2025/martest/pull/11. Address follow-ups, order history, and B2C commerce remain paused until the user directs us to resume them.


## 2026-10-26 — RFQ-MONETIZATION-01 — Inquiry permissions, subscription quotas, private messaging, and paid SMS
- **Status:** Implemented on `feat/rfq-monetization`; PR #13 remains unmerged/draft.
- **Branch:** `feat/rfq-monetization`; no production enforcement enabled.
- **Data model/migrations:** Added `InquiryPlan`, `InquirySubscription`, `InquiryUsageEvent`, and `InquiryMessage`, with ordered migrations for subscription quotas and private inquiry messages.
- **Authorization/quotas:** Backend independently enforces existing inquiry permissions and subscription entitlements for inquiry creation and company response submission. Usage events are recorded per subscription period; consumption is serialized against concurrent quota use. Internal messages consume their own allowance. SMS always requires an active subscription and remaining SMS allowance, even when general inquiry quota enforcement is disabled.
- **Private messages:** Buyer and responding company can read/send only their own inquiry conversation. Contact phone/email fields are not exposed in message responses. Both customer website and company inquiry detail UIs provide conversation views.
- **SMS:** Optional SMS alert on an inquiry message; recipient must have opted into `INQUIRY_MESSAGE_RECEIVED` SMS. Sender's SMS quota is consumed when an outbox delivery is queued. Twilio outbox worker retries provider failures. Required environment variables: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER`.
- **Subscription UX/admin:** Customer and company subscription pages list plans, show period/quota state, and create pending payment requests. Admin UI supports plan creation, enforcement toggle, subscription listing, explicit payment-confirmed activation, and support grants. Admin activation checks prevent duplicate active subscriptions.
- **Important payment limitation:** No existing payment gateway implementation or merchant credentials were present in the repository. Activation is manual after an administrator verifies payment; there is no automated online checkout or gateway callback yet. Do not describe this as automatic online payment.
- **Rollout safety:** `inquiry.subscription_enforcement` defaults OFF. Configure plans and grant/approve subscriptions before enabling. SMS remains separately enforced.
- **Verification:** CI backend/frontend/shared test-and-build passed on `f505e910ab7687a0f177556efc97b84a6d8515e1`; Prisma migration validation also passed on that commit. Live Twilio delivery and browser-level manual QA were not performed.
- **Production follow-up:** Connect the business-selected payment gateway; verify real credentials in staging; perform end-to-end quota, SMS failure/retry, and permissions testing; agree initial plan prices and quota amounts.
