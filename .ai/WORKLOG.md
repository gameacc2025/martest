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


### RFQ-MONETIZATION-01 implementation update — 2026-10-26

- **Branch / PR:** `feat/rfq-monetization`, draft PR #13: https://github.com/gameacc2025/martest/pull/13
- **Implemented:** Period-based plan/subscription/usage ledger; backend quota checks for inquiry creation, supplier response, private inquiry messaging and paid SMS; usage events linked to created inquiries/responses/messages; buyer/supplier participant authorization; message read timestamps; SMS opt-in outbox delivery through Twilio; SMS failure/quota skips do not block the internal message; website and company subscription/quota/request UI with online checkout and retry-verification action; admin plan create/update/enable/disable and subscription activation/rejection UI; plan edits locked while active/pending subscriptions exist; disabled plans no longer revoke existing paid access; race-safe payment review and subscription state changes; elapsed subscription expiry.
- **SMS configuration:** `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER`. SMS is queued only when the recipient opted in and the sender has remaining SMS quota. Live provider delivery has not been exercised.
- **Payment integration:** Added optional Zarinpal v4 checkout and a public callback endpoint. The server verifies payment directly with Zarinpal before activation, checks the fixed amount and authority, supports repeat callbacks, and prevents admin activation/rejection of Zarinpal requests. Configure `ZARINPAL_MERCHANT_ID`, `ZARINPAL_SANDBOX`, `ZARINPAL_CALLBACK_URL`, and `INQUIRY_SUBSCRIPTION_RESULT_URL`. If no merchant ID is configured, the manual-review flow remains available. Real credentials and staging tests are still required.
- **Rollout:** `inquiry.subscription_enforcement` defaults OFF for inquiry/response/internal-message quotas. SMS remains separately metered and requires an active subscription/allowance when requested.
- **Verification:** GitHub CI (backend tests, frontend/shared tests, and all frontend builds) and migration validation passed at `117adb221b3da2ad4e29d547a62114243f68a9d6`. The provider callback is public only for the provider redirect and server-to-server verification is required before activation. Owners can retry transient verification failures. No live payment or Twilio acceptance test was performed.
- **Follow-up:** Configure Zarinpal merchant credentials and HTTPS callback/result URLs; run payment success/cancel/failure/replay/retry tests and live Twilio acceptance tests in staging before merging or enabling enforcement in production.

- **Post-review hardening (2026-10-27):** Added a standalone outbox worker command, `npm run worker:notifications`, which polls both email and SMS deliveries. Run as a single replica until delivery claiming supports a database lease for safe multi-worker deployment. Added a regression test for a successful server-verified payment racing with a cancellation callback; verified payments can still activate without trusting callback query parameters. Administrative support grants now lock the owner row to avoid concurrent duplicate active grants.
- **Latest verification:** Revalidation is running for the payment-race test and notification worker additions. Do not merge until the latest CI and migration validation checks finish successfully. Live payment/Twilio tests still require configured staging credentials.


## 2026-10-27 — MARKETPLACE-E2E-01 — Supplier response and quotation lifecycle audit
- **Status:** IN_PROGRESS
- **Agent:** ChatGPT via GitHub repository tools
- **Goal:** Continue after the user-tested inquiry monetization work by auditing and hardening the B2B path from published product to inquiry, supplier response/quote, buyer decision, and terminal state.
- **Claimed scope:** Trace response/quote authorization and ownership; verify STAFF/COMPANY/CUSTOMER boundaries; check deadlines, sealed/anonymous-sealed privacy, duplicate responses, quote item ownership, decision races, and notification side effects; add regression tests for confirmed defects; update project handoff.
- **Observed starting point:** Main contains inquiry creation/lifecycle, supplier responses, buyer decisions, sealed visibility, and subscription quotas. CI and fresh-PostgreSQL migration validation passed on merge commit `bd90c07f56d3e8f973db52970f6f5f43ff3429d8`.
- **Initial risk to verify:** `submitResponse` blocks ordinary STAFF but exempts SUPER_ADMIN STAFF, while `resolveCompanyId` allows that caller to supply a company ID. This may violate the documented rule that STAFF does not act as a supplier; reproduce with tests before changing behavior.
- **Plan:** Inspect route permissions, service helpers, existing unit tests, and caller identity contracts; add a failing regression test for any confirmed authorization bypass; make the smallest backend fix; run targeted backend tests and CI/build/migration validation; document actual results.
- **Commit:** Not yet committed.
- **Push:** Not yet pushed.
- **Next action:** Confirm the STAFF/SUPER_ADMIN quote-submission behavior against tests and related authorization decisions; then implement only verified gaps.


### MARKETPLACE-E2E-01 completion update — 2026-10-27
- **Status:** DONE
- **Confirmed defects:** STAFF-context SUPER_ADMIN could use supplier response service exceptions and a supplied companyId to submit/edit/withdraw quotes; the buyer decision helper also treated STAFF SUPER_ADMIN as the inquiry buyer. Quote decision writes were unconditional after stale reads, allowing concurrent SELECTED/REJECTED requests to overwrite a decision.
- **Changes:** Added a supplier-context resolver that requires COMPANY access for supplier mutations and derives companyId from the authenticated access profile; explicitly blocks STAFF from quote submission and buyer decisions; uses conditional PENDING→REJECTED / PENDING→SELECTED updates and returns 409 when another request has already decided the response. Added regression tests for STAFF/SUPER_ADMIN impersonation, companyId spoofing, stale decisions, and response attachment deletion permission routing. Updated the API contract documentation.
- **Verification:** CI passed on `6349019df12d0f7cbaba165182e7136c24f2c38a` (backend tests, frontend/shared tests, all frontend builds): https://github.com/gameacc2025/martest/actions/runs/40449870703. Fresh PostgreSQL migration validation passed: https://github.com/gameacc2025/martest/actions/runs/40449870804. No schema migration was needed. Browser/manual staging tests were NOT RUN.
- **Commit:** Changes are on `main`; latest verified code commit: `6349019df12d0f7cbaba165182e7136c24f2c38a` (documentation-only commits followed the code and are also included in the verified run).
- **Push:** Written directly to the canonical GitHub `main` branch through repository tools.
- **Risks / open questions:** End-to-end browser verification was not performed. Real payment/Twilio testing remains separately dependent on staging credentials.
- **Next action:** Continue the broader Phase 0 tenant-isolation/RBAC audit across product, company-user, and admin routes; reproduce any suspected cross-tenant access issue before changing behavior.


### TENANT-ISOLATION-01 completion update — 2026-10-27
- **Status:** DONE for the audited user-management, company-profile, product, inquiry, and selected admin-management surfaces.
- **Confirmed defects:** COMPANY users could reach create/edit/delete/role-assignment service paths when granted broad permissions; generic user updates could toggle panel access without the exact activate/deactivate permission; non-global staff could assign cross-context roles or SUPER_ADMIN through role assignment; SUPER_ADMIN role membership was treated as global by product/inquiry/company/user service helpers without checking STAFF context; company management routes relied only on permission checks and did not consistently enforce own-company scope; company users could submit company limits/lifecycle fields through profile updates.
- **Changes:** Restricted COMPANY user management to own-company reads and exact-direction access toggles; blocked COMPANY create/edit/delete/role assignment/company transfer; enforced role scope matching and protected SUPER_ADMIN assignment; required exact activation/deactivation permission; limited global user/product/inquiry/company service overrides to STAFF context; scoped company profile routes to the authenticated company and made role/permission/category/admin management strict STAFF-context surfaces; kept company quotas and lifecycle/verification controls STAFF-only; added regression tests and updated the company profile read permission to support `company_profile.read`.
- **Verification:** CI passed at `e5b6900532b9a20ae92d581f5a2bde4647de4db2` (backend tests, frontend/shared tests, and all frontend builds): https://github.com/gameacc2025/martest/actions/runs/40452034168. Fresh PostgreSQL migration validation passed: https://github.com/gameacc2025/martest/actions/runs/40452034275. No schema migration was needed.
- **Risks / open questions:** The legacy generic `requireAccessType` middleware and auth app-selection logic still codify a SUPER_ADMIN cross-context bypass in existing tests. This task did not change that global contract; the highest-risk user/product/inquiry/company and selected admin surfaces now have strict guards, but a full global policy change needs explicit product confirmation because it changes existing authentication behavior.
- **Commit:** Code and regression tests are on `main`; verified code head `e5b6900532b9a20ae92d581f5a2bde4647de4db2`.
- **Next action:** Review the legacy global SUPER_ADMIN app-context bypass and decide whether AccessProfile.type must be enforced globally.


## 2026-10-27 — PRIORITY-REVIEW-DOCS-01 — Reconcile critical documentation with current source

- **Status:** PARTIAL — six core documents updated; no application behavior changed.
- **Goal:** Start the highest-priority safe work from the repository quality audit without silently changing the unresolved global SUPER_ADMIN authentication policy.
- **Changes:** Rewrote `docs/README.md` for the pnpm monorepo; corrected `docs/FRONTEND_DOCUMENTATION.md` to describe the three Vue/Vite apps and shared packages; replaced stale Next.js/Node 18 examples in `docs/DOCKER_DEPLOYMENT.md` with the current four-service production Compose topology and current ports; replaced the legacy API guide with the registered `/api/v1` module index and current auth/ownership caveats; rebuilt `docs/DATABASE_DOCUMENTATION.md` from the current Prisma model inventory, including AccessProfile, inquiry monetization, notification and price snapshot models; updated `docs/role-access-matrix.md` to distinguish app context from role scope and record the unresolved legacy SUPER_ADMIN bypass.
- **Commits on main:** `3e9bacbafd4905ddcce35622a66fc9d0abad8573`, `e3e5e7f49c501d0d899c882d6b896418ca51bbfe`, `d0518ebce8c313fa1b8ccaac963133bc313dff95`, `bf43f91d014cb7353933aea4874c7955370e94ec`, `eab7069c6c15a9521fcede18ddec5bcd2b8af3eb`, `7587c4953f7e04042fa1044c5926477c5214a89d`.
- **Verification:** Each updated file was fetched from the repository before editing and the changes were committed through the GitHub repository connector. No local markdown lint, app tests, build, Docker run, PostgreSQL migration run, or browser tests were executed in this documentation-only step. The new commits have not yet been independently verified by a fresh CI result.
- **Not completed:** The broader architecture roadmap and API/database examples still require detailed route/schema cross-checking. Runtime validation and browser E2E remain unverified. PR #9 (runtime/browser validation) and PR #11 (customer dashboard) remain listed as open by the repository search; do not assume either is merged.
- **Next action:** Check current CI/runtime validation status for the latest main head and PR #9, then address remaining P1 runtime/browser verification. Keep the global SUPER_ADMIN cross-app policy unchanged until the product decision is explicit.


## 2026-10-27 — RUNTIME-VALIDATION-01 — Inspect completed Docker and browser smoke run

- **Status:** VALIDATION PASSED ON PR BRANCH; NOT YET VERIFIED ON MAIN.
- **Workflow run:** `40339211695`; job `122194361685`; branch `docs-runtime-e2e-hardening`.
- **Observed final result:** Job conclusion is `success`. Docker Compose configuration validation, build/start of PostgreSQL + backend + all three panels, service health checks, Prisma migration status, Chromium installation, and Playwright browser smoke tests all completed successfully. Failure-log collection was skipped because the run did not fail, and the disposable Compose environment was torn down successfully.
- **Important scope limit:** This run validates the PR branch snapshot, not the latest main head. The branch and main have diverged substantially (compare reports 61 commits ahead and 77 behind). PR #9 includes changes beyond the runtime workflow, including customer-address code, Dockerfiles, migration/schema changes and frontend/router changes. Do not merge the entire PR solely because its runtime workflow passed; it needs a fresh base/rebase and conflict/behavior review.
- **Current main CI:** No workflow run was returned for documentation commit `0aba93bd1a2922a7029b8e9010f87953a6d0671b` through the commit-run lookup. This is NOT evidence of a failure or a pass; latest-main CI remains NOT VERIFIED.
- **Next action:** Port the runtime workflow and minimal browser smoke tests to a fresh branch based on current main, adapting tests to the current code. Trigger the workflow there and verify the final result before marking runtime/browser validation complete on main.


## 2026-10-27 — RUNTIME-VALIDATION-MAIN-01 — Port smoke validation onto current main

- **Status:** IN PROGRESS — PR opened; workflow result not yet observable.
- **Branch:** `runtime-validation-main`, based directly on current main (`99bfb3386704260c0bfbc3baee9bff9e747fad86`).
- **PR:** #14 — https://github.com/gameacc2025/martest/pull/14
- **Changes isolated to five new files:** `.github/workflows/runtime-validation.yml`, `e2e/package.json`, `e2e/playwright.config.js`, `e2e/tests/panels.spec.js`, `e2e/tests/auth-flow.spec.js`.
- **Coverage intended:** disposable Docker Compose configuration/build/start, backend + all three frontend health endpoints, PostgreSQL migration status, Playwright Chromium installation, initial render at desktop/mobile viewport for each panel, API proxy reachability, and STAFF login → cross-app handoff → logout.
- **Branch safety:** Compare against main reports exactly 5 commits ahead, 0 behind; no unrelated address/schema/product code is included. The PR is not merged.
- **CI observation:** The commit status query currently returns no statuses and the workflow-run lookup returns no runs for the head SHA. Thus the new workflow's runtime/browser result is NOT VERIFIED yet. Do not merge until a completed green run is observable.
- **Next action for this stage:** Verify the PR's CI result; if no workflow is triggered, diagnose workflow dispatch/Actions visibility and adjust the workflow trigger before considering this stage complete.


## 2026-10-27 — RUNTIME-MAIN-MERGE + AUTH-CONTEXT-STRICT

- **Status:** Runtime validation scaffolding merged; auth-context remediation committed; newest auth tests await CI confirmation.
- **User direction:** Merge safe branches into main, retain tests without waiting on live browser execution, continue remaining stages, and keep docs/AI files current.
- **Runtime PR:** PR #14 merged to main as `92501f206ab16b163d8d4605e685cbe3396dd2aa`.
- **Runtime changes:** Added `.github/workflows/runtime-validation.yml`, isolated Playwright package/config, and smoke tests for Website/Company/Admin rendering at desktop/mobile, protected API proxy response, and STAFF login → Admin handoff → logout. Added Vite build-time panel origins to all three Dockerfiles/Compose and documented them in `.env.example` and `docs/DOCKER_DEPLOYMENT.md`.
- **Observed verification on PR head `a62b8c479cd13cf1b3a3b244599b377064682502`:** CI run `40555574784` passed; PostgreSQL migration validation `40555574786` passed; runtime run `40555575064` passed Compose validation, Docker build/start, all service health checks, and migration status. Playwright browser step was in progress at last observation and is not being awaited per the user's instruction. Do not claim browser tests passed.
- **Security change:** Enforced `AccessProfile.type` as the application boundary by removing the SUPER_ADMIN bypass from `backend/src/modules/auth/auth.service.js`, `backend/src/middlewares/rbac.js`, and `backend/src/modules/auth/handoff.service.js`. Tests changed in `auth.service.test.js` and `rbac.test.js`; new `handoff.service.test.js` covers matching context, mismatched context despite SUPER_ADMIN role, missing access profile, and inactive access profile.
- **Code commits:** `edf2625dd4916a4c7a0785138b7c9c2b4c2f9ad3`, `d214ca55739414a73744a94399b935d19b43a2f7`, `37d220386a3a5f8eeb3d834751240d8cb28e9d8d`, `acb8de8a7183c216792a99eb4c873f8f8cced98f`, `a06adbd1a0642563e00bc5017932d06d2a4af11c`, `584ec083bc29d2ed5c095fb7dd44a21604c6eb63`, `082af48195c7bbabd34f45d0ff25df9eda374f57`, `272132a076a9bba25d27834d499646455689036e`, `bb580edf2b132848690b4db001bee15dd745ec4e`.
- **Docs updated:** `docs/role-access-matrix.md`, `docs/ARCHITECTURE_DECISIONS.md`, `.ai/decisions.md`, `.ai/current-task.md`, and `docs/REPOSITORY_QUALITY_AUDIT_2026-10-26.md`.
- **PR #9 / #11:** PR #9 was moved out of draft, but became non-mergeable against the new main head; it was not merged to avoid reverting newer Docker/docs/security work. PR #11 is based on PR #9's branch. Next port useful address/token/graph/chunking/profile changes selectively to current main; do not claim either branch merged.
- **Verification status:** Latest auth-context test changes have not yet been observed passing in a completed CI run. Browser E2E completion is intentionally not a blocker. SMTP delivery remains unverified without live credentials and a test recipient; SMS remains not implemented.
- **Next action:** Continue with focused CI regression review, then selectively port customer-address/profile work and review the product price-history, inquiry quote/decision, wishlist and monetization test coverage. Update relevant docs and this worklog after each material stage.


## 2026-10-27 — PORTED-FEATURES-AND-REGRESSION-COVERAGE

- **User direction:** Continue the remaining stages, merge safe changes into main, write tests without waiting on live browser execution, and keep documentation/AI files current.
- **Branch cleanup:** PR #14 is merged. PR #9 and PR #11 were closed after their useful changes were ported selectively; both stale branches were based on an old snapshot and should not be force-merged into current main.
- **Customer addresses:** Added `Address` Prisma model and migration `20261027200000_customer_addresses`, address routes/controller/service, service tests, shared API endpoints, Website `/profile` and `/profile/addresses` routes, address management page, and customer menu links. The API scopes every operation to the authenticated user. A PostgreSQL partial unique index limits each user to one default address; the service preserves/promotes a default on edits/deletion. Tests cover user scoping, foreign IDs, initial default, set-default, deletion promotion, unchecking the current default, and the sole-address invariant.
- **Profile contract:** `UserProfile.vue` now maps `/auth/me`'s `user`/ `profile`/ `accessProfile` domains correctly and only sends `firstName`/`lastName` to the profile API. Password confirmation is validated client-side and not sent to the API; errors are displayed. `packages/auth/store.js` stores only the nested personal profile returned by `/settings/profile`. Added a store regression test.
- **Security context:** Strict STAFF/COMPANY context checks remain in login, generic RBAC and PKCE handoff. Customer registration's existing no-AccessProfile contract is preserved: only `CUSTOMER_USER` gets the default Website/CUSTOMER fallback, never Admin/Company and never SUPER_ADMIN. Tests cover that exception.
- **Refresh token:** `signRefreshToken` now includes random `jti` so repeated issuance for one user in the same second cannot create the same JWT/hash. Added a uniqueness test.
- **Price history:** Extracted the six-month client transformation into `apps/website/src/utils/priceHistory.js`; added Vitest tests for six-month boundaries, invalid/future records, ordering, metadata and bar widths. Backend snapshot/API tests remain in place.
- **Inquiry monetization:** Added tests for replaying a successful payment callback and retrying an already verified subscription without another provider call. Existing tests cover server-side provider verification, failed verification, and concurrent cancellation recovery. Live provider behavior still requires staging credentials.
- **B2C boundary:** Removed active Website routes for Cart / Checkout / Orders / Wishlist and removed active cart/wishlist controls from product detail and profile UI, following frozen AD-4. The source files remain dormant for a future architecture decision.
- **Runtime/performance/architecture:** Backend Docker image now contains Prisma CLI and OpenSSL in runtime so `prisma migrate deploy` does not rely on an implicit `npx` download. Added Vite/Rolldown vendor chunk splitting. Added `scripts/generate-architecture-graph.mjs`, generated dependency graph, and `pnpm architecture:graph` / `pnpm architecture:check`.
- **Docs updated:** `docs/API_DOCUMENTATION.md`, `docs/DATABASE_DOCUMENTATION.md`, `docs/FRONTEND_DOCUMENTATION.md`, `docs/DOCKER_DEPLOYMENT.md`, `docs/README.md`, `docs/role-access-matrix.md`, `docs/ARCHITECTURE_DECISIONS.md`, `docs/REPOSITORY_QUALITY_AUDIT_2026-10-26.md`, `docs/architecture/README.md`, `.ai/project-context.md`, `.ai/decisions.md`, and `.ai/current-task.md`.
- **Current verification:** PR-head CI and migration runs cited in the previous entry were green. The newest direct-main commits (strict-context tests, address module/migration, profile/auth-store, price-history/payment/token tests, code splitting and Docker runtime changes) have not yet been observed passing a completed CI run. Browser E2E is intentionally not awaited. Next action: create a validation PR from the current main snapshot with a docs/worklog checkpoint, review CI and migration/build results, fix failures, and merge that PR. Do not claim the browser step passed.
- **External integrations:** SMTP remains NOT VERIFIED without real credentials and a test recipient. SMS remains NOT IMPLEMENTED.


## 2026-10-27 — VALIDATE-CURRENT-MAIN-FINAL-01

- **Branch:** `validate-current-main-final-20261027`, created from current main snapshot `4f0793007c7f45d920ce6addc35afacdd24ce701`. Only documentation/worklog checkpoint changes are on this branch; all application code and regression tests match the latest main snapshot.
- **Prior snapshot results:** CI run `40590958164` passed frontend/shared tests, backend tests and all frontend builds. Database migration run `40590958106` passed Prisma schema/client validation, fresh PostgreSQL migration application and migration status. These runs predate the newest notification folder-count tests.
- **Runtime/browser instruction:** Previous runtime run `40590958191` failed. The owner explicitly said not to chase browser tests, so the browser job is not a blocker and no browser pass is claimed. Docker runtime checks and Playwright tests remain committed.
- **Required now:** Run CI and migration validation against this newer snapshot; fix failures if any. Merge this PR only after completed CI and migration checks pass. No live SMTP/SMS/provider verification is implied.


## 2026-10-28 — VALIDATE-CURRENT-MAIN-FINAL-01 follow-up

- **Status:** IN PROGRESS — current-main validation PR #16; browser E2E intentionally non-blocking.
- **CI evidence:** First CI run on PR #16 failed before running app tests because \`pnpm architecture:check\` found \`docs/architecture/DEPENDENCY_GRAPH.generated.mmd\` stale. The generator's check path now prints its expected graph when stale, and the generated graph was rewritten from the generator output; the subsequent run passed the architecture graph check.
- **Regression failure found:** The next CI run reached frontend tests and exposed the same failing folder-count test in Website, Company and Admin. The test selected every \`.folder-link:not(.category-link)\`, which accidentally included the “all categories” button that has no count element. Added \`data-folder-id\` to server-managed folder buttons and changed the tests to select \`button[data-folder-id]\`, so the assertions measure only actual folders.
- **Changed files on validation branch:** \`scripts/generate-architecture-graph.mjs\`, \`docs/architecture/DEPENDENCY_GRAPH.generated.mmd\`, the three notification page components and their Vitest files.
- **Docs:** Added a source-aligned notification folder/read-state/bulk-action contract to \`docs/NOTIFICATION_SYSTEM.md\`; refreshed this handoff.
- **Verification:** Architecture graph check passed in CI after regeneration. The full CI run after the folder selector fix and database migration validation are still pending/need final status review. Browser workflow is not a blocker and must not be represented as passed.
- **Next action:** Verify latest CI and migration jobs, fix any non-browser failures, then merge PR #16. Continue the remaining quality-audit items after merge and keep this file plus \`.ai/current-task.md\` updated at each milestone.


## 2026-10-28 — VALIDATE-CURRENT-MAIN-FINAL-01 — COMPLETE

- **Status:** DONE — validation PR #16 merged to \`main\`.
- **Merge commit:** \`90a8f36be5c4281c999515206b099b894d2da75d\`.
- **CI:** Run \`40629289205\` passed. Verified architecture graph consistency, frontend/shared Vitest tests, backend tests, Prisma client generation, and production builds for Website, Company and Admin.
- **Database:** Migration validation run \`40629289194\` passed schema/client validation, applying all migrations to a fresh PostgreSQL instance, and checking migration state.
- **Failures fixed:** (1) generated Mermaid graph was out of sync with generator output; regenerated the file and added expected-graph diagnostics to the checker; (2) a folder-count test in all three frontends incorrectly selected the “all categories” button, which has no count element. Added \`data-folder-id\` to folder buttons and restricted test selection to those buttons.
- **Documentation:** Added notification folder/read-state/bulk action details to \`docs/NOTIFICATION_SYSTEM.md\`; updated this worklog and \`.ai/current-task.md\`.
- **Browser E2E:** Intentionally not treated as a blocker per owner instruction. No browser pass is claimed.
- **Next:** Continue reviewing notification API ownership/scope, inquiry access/quotas/response decisions, payment callback idempotency, documentation/source alignment, and the outstanding bundle-size warning. SMTP is not live-verified; SMS is not implemented.


## 2026-10-28 — NOTIFICATION-APP-SCOPE-01

- **Status:** IN PROGRESS — security fix and regression tests prepared on \`fix/notification-app-scope-20261028\`.
- **Finding:** Notification folder APIs accepted a client-supplied app scope (\`query.app\` for folder listing and \`body.app\` for move/copy). An authenticated user could request another panel's folder scope. Listing a folder ID also did not first verify that the folder was visible in the caller's app context.
- **Fix:** Derive folder scope from verified \`request.user.accessType\`: \`STAFF\` → \`ADMIN\`, \`COMPANY\` → \`COMPANY\`, \`CUSTOMER\` → \`WEBSITE\`. Ignore client app values, reject unknown contexts, and validate folder IDs against the server-derived scope before querying messages. Reject moves from inactive source folders.
- **Tests:** Added controller regression tests for forged app scope, missing app context, cross-app folder IDs and valid scope mapping. Added service regression tests for inactive source folders and cross-scope destinations.
- **Docs:** Updated \`docs/NOTIFICATION_SYSTEM.md\` with current folder/bulk endpoints and the server-derived app-scope contract; updated \`.ai/current-task.md\`.
- **Verification:** Await CI and fresh PostgreSQL migration validation on this branch. Do not claim tests passed before the completed workflow result. Browser E2E is intentionally non-blocking.


## 2026-10-28 — NOTIFICATION-APP-SCOPE-01 — COMPLETE

- **Status:** DONE — PR #17 merged into \`main\`.
- **Merge commit:** \`6c936fbf89b62febdf8122ac854fb53d93049ed4\`.
- **CI:** Run \`40630173240\` passed architecture graph check, frontend/shared tests, backend tests, Prisma client generation and all three production builds.
- **Database:** Migration validation run \`40630173261\` passed against a fresh PostgreSQL database.
- **Security fix:** Notification folder scope is derived from verified token context (\`STAFF\` → \`ADMIN\`, \`COMPANY\` → \`COMPANY\`, \`CUSTOMER\` → \`WEBSITE\`). The controller ignores client-provided \`app\`, rejects unknown contexts, and checks requested folder IDs against allowed folders before listing. The service rejects inactive source folders and cross-scope destinations.
- **Regression tests:** Added coverage for forged query/body app values, missing context, cross-app folder IDs, valid context mapping, inactive source folders and cross-scope destinations.
- **Docs:** Updated \`docs/NOTIFICATION_SYSTEM.md\`, \`docs/REPOSITORY_QUALITY_AUDIT_2026-10-26.md\`, and this handoff/worklog.
- **Browser E2E:** Intentionally non-blocking per owner instruction. No browser pass is claimed.
- **Next:** Continue inquiry permission/quota/response-decision/payment review and source-aligned docs. SMTP remains not live-verified; SMS is not implemented.


## 2026-10-28 — NOTIFICATION-FOLDER-CONTRACT-01

- **Status:** IN PROGRESS — client API cleanup on \`fix/notification-folder-contract-20261028\`.
- **Reason:** After server-side scope enforcement was merged, the shared endpoint helper and all three frontends still sent a redundant app value. The route schema also required \`app\` even though the controller correctly ignored it.
- **Changes:** \`endpoints.notifications.folders\` is now a constant path without a query parameter; Website/Company/Admin call it without an app argument and omit \`app\` from move/copy bodies; the backend folder action schema no longer requires or accepts a client-supplied app field; the route regression test uses the canonical body; notification API docs were aligned.
- **Verification:** CI and migration validation pending. Browser E2E is not a blocker and is not claimed passed.


## 2026-10-28 — NOTIFICATION-FOLDER-CONTRACT-01 — COMPLETE

- **Status:** DONE — PR #18 merged into \`main\`.
- **Merge commit:** \`fd6515426d7cc5d6ed1c7d02589c46e940e35fde\`.
- **CI:** Run \`40630881073\` passed architecture graph check, frontend/shared tests, backend tests, Prisma client generation and all three production builds.
- **Database:** Migration validation run \`40630881119\` passed against a fresh PostgreSQL database.
- **Changes:** The shared endpoint helper now exposes the canonical \`/settings/notifications/folders\` path without a client-selected app query. Website, Company and Admin no longer send app scope in folder list or move/copy requests. The route schema no longer requires a client-supplied app; the controller derives scope from verified token context.
- **Docs:** Updated \`docs/NOTIFICATION_SYSTEM.md\`, quality audit, worklog and handoff.
- **Next:** Inquiry monetization review identified a likely backend consistency gap to verify: pending subscription duplication is checked per owner + plan, while the UI blocks any pending request. Add a regression test and enforce one pending request per owner if confirmed.


## 2026-10-28 — INQUIRY-PENDING-SUBSCRIPTION-01

- **Status:** IN PROGRESS — backend invariant fix and regression tests on \`fix/inquiry-pending-subscription-unique-20261028\`.
- **Finding:** \`createPendingSubscription\` queried pending subscriptions by owner *and planId*. The self-service UI blocks any new request when any pending subscription exists, so direct API calls could bypass that UI rule by selecting a different plan. The owner lock serializes concurrent requests, but the backend predicate was still too narrow.
- **Fix:** Check pending status by owner only, independent of plan ID. The existing transaction/owner lock in the payment service preserves the serial decision path.
- **Tests:** Added regression coverage that a pending request for a different plan blocks creation, plus a positive case for an owner with no pending/active subscription.
- **Docs:** Added subscription ownership, pending-request and payment-verification invariants to \`docs/API_DOCUMENTATION.md\`; refreshed current-task handoff.
- **Verification:** CI and fresh PostgreSQL migration validation pending. Do not claim success before observing completed results.


## 2026-10-28 — INQUIRY-PENDING-SUBSCRIPTION-01 — COMPLETE

- **Status:** DONE — PR #19 merged into \`main\`.
- **Merge commit:** \`695b61861b39f840eefa24660541d4d61143943d\`.
- **CI:** Run \`40631325212\` passed architecture graph validation, frontend/shared tests, backend tests, Prisma client generation and all three frontend production builds.
- **Database:** Migration validation run \`40631325206\` passed against a fresh PostgreSQL database.
- **Business-rule fix:** \`createPendingSubscription\` now checks for any \`PENDING_PAYMENT\` subscription belonging to the owner, independent of plan ID. The payment service's owner-row lock serializes concurrent creation attempts before this check.
- **Regression tests:** Added a negative test for an existing pending request tied to another plan and a positive test for the first valid request.
- **Docs:** Added subscription owner, pending-request and server-side payment verification invariants to \`docs/API_DOCUMENTATION.md\`; updated the quality audit and handoff.
- **Next:** Continue review of inquiry response decisions, ownership/RBAC, quota enforcement and payment callback paths. Do not claim live payment verification without staging credentials.


## 2026-10-28 — INQUIRY-RESPONSE-CONCURRENCY-01

- **Status:** IN PROGRESS — implementation and regression assertions prepared on `fix/inquiry-response-concurrency-20261028`.
- **Finding:** Under PostgreSQL READ COMMITTED, a supplier response submission and buyer response selection could concurrently read an inquiry as OPEN. A transaction that read OPEN before selection committed could insert a pending quote after the buyer closed the inquiry and rejected existing pending responses.
- **Fix:** Added a shared transactional lock on the parent `Inquiry` row before reading state for response submission, response editing/withdrawal, buyer selection/rejection, and manual status transitions. Existing ownership, permission, deadline, response-state compare-and-set and transactional notification checks remain in place.
- **Regression tests:** Mock Prisma records raw SQL calls; successful response submission and buyer selection assert a parent-row `FOR UPDATE` lock.
- **Docs updated:** `docs/API_DOCUMENTATION.md`, `docs/REPOSITORY_QUALITY_AUDIT_2026-10-26.md`, `.ai/current-task.md`, `.ai/project-context.md`, and `.ai/decisions.md`.
- **Validation:** CI and fresh PostgreSQL migration validation are pending. Browser E2E is not a blocker per owner instruction and is not claimed passed.
- **Next:** Observe CI + migration status, fix non-browser failures, merge if green, then continue source-level review of quota idempotency and payment callback consistency. Do not blindly merge heavily diverged feature branches.


## 2026-10-28 — INQUIRY-RESPONSE-CONCURRENCY-01 — COMPLETE

- **Status:** DONE — PR #20 squash-merged into `main` at `afe468c62d674ec675e4d7e9264e4850403fdb21`.
- **CI:** Run `40633476868` passed architecture graph consistency, frontend/shared tests, backend tests, Prisma client generation and Website/Company/Admin production builds.
- **Database:** Fresh PostgreSQL migration validation run `40633476941` passed; no schema changes were included in this fix.
- **Fix:** Parent `Inquiry` rows are locked inside transactions before current state is read for supplier response submission/edit/withdraw, buyer decision, and manual status transition. This prevents a stale submission transaction from adding a pending response after a buyer closes an RFQ.
- **Regression coverage:** Unit tests verify the `FOR UPDATE` lock is requested on successful supplier submission and buyer selection.
- **Docs:** API documentation, repository quality audit, project context, decision notes, current-task handoff and worklog were updated.
- **Browser E2E:** Intentionally not awaited per owner instruction. No browser pass is claimed.
- **Next:** Review the remaining Admin bundle-size warning and continue quota/payment edge-case audit. Do not merge heavily diverged legacy branches wholesale.


## 2026-10-28 — ADMIN-BUNDLE-WARNING-01

- **Status:** IN PROGRESS — Admin router import cleanup prepared on `perf/admin-auth-import-warning-20261028`.
- **Evidence:** CI run `40633476868` passed production builds and emitted split Admin chunks below the prior approximately 730 kB entry chunk; the largest displayed JavaScript chunk was approximately 196 kB.
- **Finding:** CI after the first Admin-only change showed `INEFFECTIVE_DYNAMIC_IMPORT` in all three apps: `src/stores/auth.js` was dynamically imported by each router but statically imported elsewhere.
- **Fix:** Website, Company and Admin routers now import `useAuthStore` statically. Route-level lazy imports remain unchanged.
- **Docs:** Updated `docs/FRONTEND_DOCUMENTATION.md`, repository quality audit, current-task and project context.
- **Validation:** CI still needs to run on this branch. Browser E2E is not a blocker and is not claimed passed.

- **Scope adjustment:** Expanded the fix to Website and Company after CI exposed the same warning there. CI needs one more run to confirm all three warnings are gone.


## 2026-10-28 — FRONTEND-AUTH-IMPORT-WARNING-01 — COMPLETE

- **Status:** DONE — PR #21 squash-merged into `main` at `a6c24627b640b6154cfe6277332673b021299371`.
- **CI:** Run `40634032996` passed architecture graph validation, frontend/shared tests, backend tests, Prisma generation and all three production builds.
- **Database:** Migration validation run `40634032923` passed against a fresh PostgreSQL database.
- **Fix:** Website, Company and Admin routers now statically import their auth stores. This removed the ineffective dynamic-import warning without disabling route-level lazy loading.
- **Verification:** Build logs for the merged PR head contain no `INEFFECTIVE_DYNAMIC_IMPORT` warning. The previous ~730 kB Admin entry bundle is now split into chunks; the largest displayed JS chunk is about 195 kB.
- **Remaining dependency notices:** Node's `url.parse()` and `punycode` deprecations remain in transitive dependencies; no package update was included because the source dependency path should be traced before changing lockfiles.
- **Browser E2E:** Intentionally not awaited and not claimed passed.
- **Next:** Continue inquiry duplicate-response handling and subscription quota/payment callback review.


## 2026-10-28 — INQUIRY-DUPLICATE-RESPONSE-01

- **Status:** IN PROGRESS — backend fix and regression test prepared on `fix/inquiry-duplicate-response-20261028`.
- **Finding:** The schema's unique `(inquiryId, companyId)` constraint prevented duplicate response rows, but duplicate submission could still produce a generic Prisma error and a 500 response.
- **Fix:** After locking the parent inquiry and validating the caller's product ownership, the service checks for an existing response and returns 409 / `RESPONSE_ALREADY_EXISTS` with its ID and status. The unique database constraint remains the final invariant.
- **Tests:** Added a service test proving duplicate pending response is rejected before creating another response or dispatching another notification.
- **Docs:** Updated API documentation, quality audit, current-task and project context.
- **Validation:** CI and fresh PostgreSQL migration validation pending. No migration/schema change. Browser E2E remains non-blocking.


## 2026-10-28 — INQUIRY-DUPLICATE-RESPONSE-01 — COMPLETE

- **Status:** DONE — PR #22 squash-merged into `main` at `17a2015edeecbc00c1cbf540540ea48b8c97f394`.
- **CI:** Run `40634407695` passed architecture graph validation, frontend/shared tests, backend tests, Prisma generation and all three production builds.
- **Database:** Migration validation run `40634407696` passed against a fresh PostgreSQL database.
- **Fix:** The inquiry service checks for an existing response after locking the inquiry and validating supplier ownership, then returns HTTP 409 / `RESPONSE_ALREADY_EXISTS` instead of exposing a generic Prisma unique-constraint failure.
- **Regression coverage:** Duplicate pending response is rejected before a second response or notification is created. The database unique constraint remains the final defense.
- **Docs:** Updated API documentation, repository quality audit, current-task and project context.
- **Browser E2E:** Intentionally not awaited and not claimed passed.
- **Next:** Audit quota transaction semantics and payment callback idempotency; add tests and merge safe fixes after CI + migration validation.


## 2026-10-28 — PAYMENT-CALLBACK-CONCURRENCY-01

- **Status:** IN PROGRESS — callback state recheck and regression test prepared on `fix/payment-callback-concurrency-20261028`.
- **Finding:** A callback read `PENDING_PAYMENT` before taking the owner-row lock. A second callback could wait while the first committed activation, then use the stale read and return failure even though the payment was already successful.
- **Fix:** Re-read the subscription after acquiring the owner lock and return the already verified ACTIVE record when present. Existing server-side provider verification and compare-and-set activation remain.
- **Regression coverage:** Test simulates another callback activating the subscription while this request waits for the owner lock and asserts success without duplicate activation/extension.
- **Docs:** Updated API documentation, quality audit, current-task, project context and decisions.
- **Validation:** CI and fresh PostgreSQL migration validation pending. Browser E2E is not a blocker.


## 2026-10-28 — PAYMENT-CALLBACK-CONCURRENCY-01 — COMPLETE

- **Status:** DONE — PR #23 squash-merged into `main` at `075db4b3a99d75f0dc043f3fec3417f8bf158ca9`.
- **CI:** Run `40634806585` passed architecture graph validation, frontend/shared tests, backend tests, Prisma generation and all three production builds.
- **Database:** Migration validation run `40634806668` passed against a fresh PostgreSQL database.
- **Fix:** Subscription state is re-read after the owner-row lock. If another callback has already committed a verified ACTIVE subscription while this callback waited, the waiting callback returns success without activating or extending the subscription again.
- **Regression test:** Simulates a concurrent activation during lock acquisition and verifies success/no second update.
- **Docs:** Updated API docs, quality audit, current-task, worklog, project context and decisions.
- **External provider:** Live Zarinpal payment remains NOT VERIFIED without staging credentials. Browser E2E is not claimed passed.
- **Next:** Review quota consumption when a subscription expires while a transaction waits for its row lock; add regression coverage and merge a safe fix.


## 2026-10-28 — QUOTA-ACTIVE-PERIOD-01

- **Status:** IN PROGRESS — service fix and regression test prepared on `fix/inquiry-quota-expiry-lock-20261028`.
- **Finding:** `consumeUsage` queried the active subscription before locking it. If the transaction waited until the subscription period expired, the stale pre-lock object could authorize usage after expiration.
- **Fix:** After locking the candidate row, re-query the owner's currently active subscription and verify its period again. If the active row changed at the boundary, lock and re-check the new row; if none remains, reject before counting or recording usage.
- **Regression test:** Simulates an active subscription disappearing while the lock is acquired and asserts no usage event is created.
- **Docs:** Updated API documentation, quality audit, current-task and project context.
- **Validation:** CI and fresh PostgreSQL migration validation pending; no schema change.


## 2026-10-28 — QUOTA-ACTIVE-PERIOD-01 — COMPLETE

- **Status:** DONE — PR #24 squash-merged into `main` at `c96850af53866c9e8c84b46d436e38fd8b06be3b`.
- **CI:** Run `40635157043` passed architecture graph validation, frontend/shared tests, backend tests, Prisma generation and all three production builds.
- **Database:** Migration validation run `40635157013` passed against a fresh PostgreSQL database.
- **Fix:** Quota consumption re-checks the active subscription after locking its row. If the period expired while waiting, it rejects before usage aggregation/insertion. If the active row changed at the boundary, it locks and re-checks the new row.
- **Regression coverage:** Simulates an active subscription becoming unavailable during lock acquisition and asserts no usage event is written.
- **Docs:** Updated API docs, quality audit, current-task, worklog and project context.
- **Browser E2E:** Not awaited and not claimed passed.
- **Next:** Trace transitive Node deprecation warnings and review any remaining actionable audit items.


## 2026-10-28 — AUDIT-STATUS-REFRESH-01

- **Status:** Core findings fixed; source-level audit continues.
- **CI:** Run `40635157043` passed architecture check, frontend/shared tests, backend tests, Prisma generation and all production builds.
- **Database:** Run `40635157013` passed fresh PostgreSQL migration application and status verification.
- **Resolved:** Core documentation drift, strict app context, notification folder app scope, ineffective auth-store dynamic imports in all three routers, inquiry response race/duplicate error handling, payment callback concurrency, and quota expiry revalidation.
- **Not claimed:** Browser E2E pass, live Zarinpal, SMTP delivery, production deployment or exhaustive company-endpoint IDOR sign-off. SMS remains not implemented.
- **Remaining:** Continue company-owned route/service owner-scope review. Node `url.parse()`/`punycode` deprecations remain non-blocking pending a traced call site; do not upgrade dependencies blindly.


## 2026-10-28 — TENANT-BOUNDARY-TARGETED-REVIEW-01

- **Status:** IN PROGRESS — targeted source review and stale RBAC comment fix on `docs/rbac-context-comment-20261028`.
- **Reviewed:** Company route/service ownership, product management and media/history ownership, user-scoped address CRUD, inquiry buyer/supplier response/message access, and notification folder/message scoping.
- **Result:** No additional confirmed cross-tenant data path was found in these surfaces during this pass. Existing regression tests cover the main ownership boundaries.
- **Fix:** Updated the product route comment to accurately state that SUPER_ADMIN does not bypass the app-context boundary.
- **Limit:** Not an exhaustive route-by-route security sign-off.


## 2026-10-28 — TENANT-BOUNDARY-TARGETED-REVIEW-01 — COMPLETE

- **Status:** Targeted review completed; PR #25 merged into `main` at `6fc10282a29a836ca84987eb4cec93fecce54774`.
- **CI:** Run `40635937015` passed architecture graph, frontend/shared tests, backend tests, Prisma generation and all production builds.
- **Database:** Migration validation run `40635936924` passed.
- **Reviewed:** Company routes/services, product management/media/history, user-scoped addresses, inquiry response/message ownership, notification folder/message scoping.
- **Result:** No additional confirmed cross-tenant data path found in the targeted surfaces. Existing regression tests cover the main ownership boundaries.
- **Code comment:** Corrected the stale claim that SUPER_ADMIN bypasses `requireAccessType`; app context remains strict.
- **Limitations:** Not an exhaustive route-by-route security sign-off. Transitive Node deprecation notices remain non-blocking until traced; browser E2E is not claimed passed; live Zarinpal/SMTP are not verified; SMS is not implemented.


## 2026-10-28 — CI-DEPRECATION-TRACE-01 — COMPLETE

- **Diagnostic PR:** #26 was intentionally closed without merging its temporary `NODE_OPTIONS=--trace-deprecation` setting.
- **Trace result:** `DEP0169 url.parse()` originates from `pnpm/action-setup@v4` bundled `pnpm.cjs` during self-install. `DEP0040 punycode` originates from `actions/setup-node@v4` bundled setup/cache code.
- **Impact:** These are GitHub Actions toolchain warnings, not application/workspace runtime dependency warnings. No package/lockfile update was justified.
- **Next:** Only consider updating action versions as a separate CI maintenance change, with ordinary CI/migration validation.


## 2026-10-28 — BRANCH-CONSOLIDATION-CI-01

- **Status:** CI trigger cleanup committed; full branch consolidation remains a selective audit, not a blanket merge.
- **Finding:** The push workflow still targeted `feat/notifications-complete` even though the canonical workflow is `main`. The repository currently has many stale branches that diverge substantially from current main; their diffs overlap with already-merged work and cannot safely be merged as snapshots.
- **Change:** `.github/workflows/ci.yml` now triggers on pushes to `main` only; pull-request validation targeting `main` remains unchanged.
- **AI handoff:** Updated `.ai/current-task.md` with branch inventory, merge-safety decision, verification state, and next audit focus.
- **Commits:** CI `a518d061ded03ab82db3b62368489b1f9efdc6f5`; handoff `789047952636b5ccc761bf252596b75f07ce6082`.
- **Tests:** NOT RUN in this tool session. GitHub Actions status after these direct commits has not yet been checked. No browser E2E was run or awaited.
- **Branch policy:** No force-push, blind merge, or branch deletion. Port only unique, relevant changes after review and regression tests; branch deletion is not implied by merge authorization.
- **Remaining:** Continue company/product/inquiry lifecycle and authorization audit; validate CI on main; retain explicit NOT VERIFIED labels for live payment, SMTP, deployment, and browser E2E.


## 2026-10-29 — INQUIRY-SUPPLIER-CONTEXT-01

- **Status:** PR #27 open; CI and migration validation pending.
- **Finding:** Supplier response routes allowed STAFF context when the caller held `leads.update`, although the service rejects staff from acting as suppliers. This mismatch exposed an unnecessarily broad route boundary and inconsistent authorization behavior.
- **Change:** Response create/edit/withdraw/attachment routes now require `COMPANY` access context and `inquiries.respond` specifically.
- **Regression coverage:** Added tests that STAFF with `leads.update` cannot submit, edit, withdraw, or delete supplier response attachments.
- **Docs:** Updated `.ai/current-task.md`; API documentation update still pending.
- **Validation:** No browser E2E. Do not merge until automated checks pass.


## 2026-10-29 — INQUIRY-SUPPLIER-CONTEXT-01 — MERGED

- **PR:** [#27](https://github.com/gameacc2025/martest/pull/27), squash merge `7accdd8b2db4a1db046175c19507d76d223bce95`.
- **Finding/fix:** Supplier response lifecycle routes now require `COMPANY` access context and `inquiries.respond`; administrative `leads.update` does not permit STAFF to impersonate a supplier.
- **Regression tests:** STAFF cannot submit, edit, withdraw, or delete response attachments through supplier routes.
- **Validation:** CI run `40825349236` passed; database migration validation run `40826610626` passed on merged `main`. No browser E2E was run or awaited.
- **Docs:** Added `docs/SUPPLIER_RESPONSE_AUTHORIZATION.md` and updated `docs/API_DOCUMENTATION.md`.

## 2026-10-29 — BRANCH-AUDIT-02

- Audited 18 remaining non-main branch heads against `main`; no blanket merge or force update performed.
- Confirmed core inquiry duplicate-response, quota expiry, notification app-scope, payment callback, RBAC context and inquiry locking fixes are present in current `main`; stale branch variants must not be replayed.
- Large divergent customer-address/dashboard, inquiry-completion, RFQ and runtime-validation branches remain subject to selective file-level review. Browser E2E work is excluded per owner instruction.
- Branch-ref deletion is not available through the connected GitHub action set; do not simulate deletion by moving refs. A supported GitHub delete-ref action is needed to complete remote branch cleanup.


## 2026-10-29 — BRANCH-AUDIT-03: final selective review

- Re-listed the 19 non-main remote refs and compared each branch head with current `main`.
- Confirmed no further merge is warranted. The customer address and inquiry/RFQ work are represented by merged PRs #10, #12 and #13; notification/security/concurrency fixes are represented by merged PRs #17–#25; supplier response authorization is merged as PR #27. The customer profile PR #11 was closed as redundant after a direct port; PR #9 was closed after useful changes were selectively ported. PR #26 was diagnostic-only and was correctly not merged.
- The old feature branches diverge substantially and contain historical snapshots; merging them wholesale risks reverting newer implementation. Validation branches are checkpoints, not product changes. Current `main` already contains the runtime validation workflow.
- No additional branch content was merged because no unmerged unique implementation was identified. Owner can now delete the listed remote refs, retaining only `main`. Browser E2E was not run or awaited.


## 2026-10-29 — UI-REDESIGN-SAFE-01 — Safe production adaptation of telecom UI redesign
- **Status:** IN_PROGRESS
- **Agent:** ChatGPT via GitHub repository tools
- **Goal:** Port the visual direction of `telecom-ui-redesign.patch` without replacing production API-backed behavior, authentication, or permissions.
- **Claimed scope:** Shared design tokens/primitives, existing category mega-menu styling, focused regression tests, redesign compatibility docs, and task handoff on `feat/telecom-ui-redesign-safe`.
- **Evidence:** The uploaded patch introduces `USE_MOCK = true`, mock product/company/order/inquiry/user/notification datasets, local-only cart/wishlist behavior, and bypasses the `requiresAuth` route guard when mocks are enabled. It also conflicts with several files on current `main`.
- **Changes:** Claim recorded. Mock-backed page rewrites and auth-guard changes are explicitly excluded from the production branch.
- **Verification:** NOT RUN yet.
- **Commit:** Claim/handoff commit recorded on branch; implementation pending.
- **Push:** Working on the requested separate remote branch; `main` remains untouched.
- **Risks / open questions:** The patch's page-level visual changes require per-page porting against current API contracts; the safe shared UI slice is not the complete 32-file redesign.
- **Next action:** Implement shared styling and menu regression tests, then run the shared-ui test suite and website build if the available environment permits.


### Completion update — UI-REDESIGN-SAFE-01 (2026-10-29)
- **Status:** PARTIAL — safe shared UI foundation implemented; broader page-by-page redesign remains.
- **Branch / PR:** `feat/telecom-ui-redesign-safe`, [PR #28](https://github.com/gameacc2025/martest/pull/28), draft and unmerged.
- **Changes:** Added shared design token aliases and opt-in page primitives; refreshed the existing MegaMenu styles without changing its data or routing contract; added two MegaMenu regression tests; documented the security and compatibility exclusions in `docs/TELECOM_UI_REDESIGN_SAFE_PORT.md`.
- **Security review:** No `USE_MOCK` or `mockData.js` added; no router/auth/API/permission changes; no mock product/order/cart/wishlist/notification data wired into production pages. `apps/website/src/router/index.js` remains unchanged.
- **Verification:** CI run `40832326705` PASS (architecture graph, frontend/shared tests, backend tests, Prisma generation, all three frontend builds). Database migration validation `40832326749` PASS. Runtime validation `40832326683` was still in progress at the last check and is NOT claimed passed. Local tests/build NOT RUN; no local dependency-equipped checkout was available.
- **Commits:** Changes are on the PR branch; current PR head to be rechecked at handoff.
- **Push:** Pushed via GitHub API to the requested feature branch. `main` unchanged.
- **Risks / open questions:** This is not the full 32-file patch. Large page replacements must be reconciled individually with current APIs and current routes before any wider merge. Keep PR draft/unmerged while the page-by-page port continues.
- **Next action:** Review current Website homepage implementation and tests; port only template/style changes while preserving API calls, loading/error states, route behavior and authorization assumptions.


### Merge and cleanup handoff — UI-REDESIGN-SAFE-01 (2026-10-29)
- **Status:** MERGED (partial safe slice); full page-by-page patch port remains incomplete.
- **PR:** [#28](https://github.com/gameacc2025/martest/pull/28), squash-merged.
- **Merge commit:** `23576cb1a22f80fea2d245cf10e5915794d4a15c`.
- **Verification:** CI passed (frontend/shared tests, backend tests, architecture graph, three frontend builds); database migration validation passed. Runtime validation was still in progress at last check.
- **Branch deletion:** `feat/telecom-ui-redesign-safe` remains present because the connected GitHub toolset does not provide a delete-branch operation. Repository owner can delete it via GitHub UI or `git push origin --delete feat/telecom-ui-redesign-safe`.
- **Next:** Continue porting the page-level visual changes separately; do not describe the entire 32-file patch as merged.


## 2026-10-29 — FULL-REPOSITORY-STATE-REVIEW-01

- **Status:** Source/docs review completed; Graphify MCP review blocked by missing workspace.
- **Repository:** `gameacc2025/martest`; reviewed `main` at `384459502d0913350e4920e5aeeb2aef5360e553` before this documentation refresh.
- **Scope:** Reviewed current-task handoff, AI project context/decisions, package scripts, root tree/test inventory, quality audit, roadmap, UI redesign guide, and latest GitHub Actions runs. Latest branch search returned only `main`.
- **Latest CI:** [40833114382](https://github.com/gameacc2025/martest/actions/runs/40833114382) passed frontend/shared tests, backend tests, Prisma generation, architecture graph check and all three frontend builds.
- **Database:** [40833114529](https://github.com/gameacc2025/martest/actions/runs/40833114529) passed.
- **Runtime:** [40833114464](https://github.com/gameacc2025/martest/actions/runs/40833114464) failed at browser smoke after Compose validation, image build/start, service health and migration checks passed. Per owner instruction, browser tests are not pursued as the next task. No pass claimed.
- **Graphify:** `list_workspaces` returned an empty workspace list; Graphify calls failed because no workspace was selected. No Graphify memory or index update is claimed. The repository-generated architecture graph check is separate and passed in CI.
- **Completed status correction:** PR #28 is merged at `23576cb1a22f80fea2d245cf10e5915794d4a15c`; the shared UI foundation is merged, but the broader page-by-page redesign remains incomplete. The legacy patch was not merged wholesale.
- **Remaining tasks:** (1) port Website homepage redesign safely with tests/build; (2) continue exhaustive company-owned route/tenant/IDOR review; (3) controlled live Zarinpal/SMTP verification when credentials are available; (4) decide whether to scope and implement SMS; (5) expand API documentation to endpoint/schema/permission level; (6) maintain action toolchain separately if deprecation warnings warrant it.
- **Release limitations:** No production deployment, live payment, live SMTP, SMS delivery, exhaustive tenant-security certification, or passing browser smoke is claimed.
- **Files updated in this review:** `.ai/current-task.md`, `.ai/project-context.md`, `.ai/decisions.md`, this worklog, `docs/REPOSITORY_QUALITY_AUDIT_2026-10-26.md`, `docs/TELECOM_UI_REDESIGN_SAFE_PORT.md`, and `Telecom_Marketplace_Project_Architecture_and_Roadmap.md`.


### Correction to SMS status — source-level review (2026-10-29)

- Earlier summary wording that SMS was wholly unimplemented was too broad.
- Present in source: Twilio provider adapter, SMS delivery processor/retry tracking, worker invocation, paid SMS quota enforcement, and unit tests.
- Confirmed missing integration: `backend/src/modules/notifications/notification.dispatch.service.js` explicitly never queues SMS rows and returns `sms.notImplemented`. Admin announcements are IN_APP/EMAIL only.
- Remaining task: wire supported event dispatch to SMS queue with recipient opt-in, phone validation, paid quota consumption, dedupe/retry tests, then controlled live Twilio verification. Live delivery remains NOT VERIFIED.
- Updated `.ai/current-task.md`, `.ai/project-context.md`, quality audit, notification system documentation, and project roadmap to reflect the partial implementation accurately.


## 2026-10-29 — UI-REDESIGN-STEP-1 — Website homepage

- **Status:** Implementation committed to focused branch; verification pending.
- **Branch:** `feat/website-homepage-redesign-step-1`, based on `main` at `d91b3961e3c775def84d0efe634a4fa82271b9f4`.
- **Scope:** `apps/website/src/pages/public/Home.vue`; Website test script/config; source-contract regression test; UI porting guide and AI handoff.
- **Changes:** Applied shared design-system tokens to homepage surfaces, spacing, hero, section typography; improved mobile hero layout; added keyboard activation/focus treatment for category/product tiles.
- **Behavior preserved by source review:** real `productsApi.list` and `productsStore.getCategories` calls, search/filter behavior, product/category routes, and loading/error/empty states. No API, backend, authentication or authorization logic changed.
- **Tests:** Added source-contract regression tests for the real API/store calls, route contracts, state branches, keyboard support, and absence of mock-data/auth-bypass switches. These are source-level guards, not component interaction tests.
- **Verification:** No local runner available through GitHub connector. CI and Website build are pending; do not claim pass until Actions reports success.
- **Next step after verification:** Port Product Listing page with the same API-first constraints.


### Verification update — UI-REDESIGN-STEP-1 (2026-10-29)

- CI run [40839667461](https://github.com/gameacc2025/martest/actions/runs/40839667461) **PASS** on commit `0d33036dfe8480e0b63279ad42b4bf39787e844e`: architecture graph validation, frontend/shared tests (including the new homepage source-contract tests), backend tests, Prisma generation, and all three frontend production builds.
- An earlier CI attempt failed because Vitest transforms `import.meta.url` in this workspace, making the test's `fileURLToPath` assumption invalid. The test path was corrected to resolve the source from either repository-root or app-root working directories. The corrected suite passed in the latest CI run.
- Database migration validation was still running at the time of this update. Runtime validation remains a separate workflow; browser smoke debugging is not part of this step.
- The test is intentionally a source-contract regression guard; it is not represented as a component-level interaction test.


## 2026-10-29 — UI-REDESIGN-STEP-1 — MERGED

- **Status:** MERGED; PR [#29](https://github.com/gameacc2025/martest/pull/29), merge commit `520d590b51b7d4be49772dd44cc3f5dc96f45351`.
- **Scope:** Website homepage visual refinement, keyboard activation/focus for category/product tiles, Website source-contract regression tests, and updated AI/docs.
- **Verification:** CI [40839895731](https://github.com/gameacc2025/martest/actions/runs/40839895731) passed architecture graph validation, frontend/shared tests, backend tests, Prisma generation and all three frontend production builds on the final branch commit before merge. Migration validation [40839895740](https://github.com/gameacc2025/martest/actions/runs/40839895740) passed on that commit.
- **Test correction:** The initial source test failed because Vitest transforms `import.meta.url`; the test was corrected to find the source from either repository-root or app-root working directories, and the corrected suite passed.
- **Behavior:** Real `productsApi.list` and `productsStore.getCategories` calls, route contracts, filters and loading/error/empty states remain intact. No backend/API/auth changes or mock data were introduced.
- **Runtime boundary:** Runtime/browser smoke is separate and not claimed green. Per owner instruction, browser-smoke debugging is not the next task.
- **Next:** Inspect post-merge main CI/migration results, then begin Product Listing page as Step 2 on a focused branch.


## 2026-10-29 — UI-REDESIGN-STEP-2 — Product Listing

- **Status:** Implementation and tests committed on focused branch; verification pending.
- **Branch:** `feat/website-product-listing-redesign-step-2`, based on main after homepage PR #29 and its documentation handoff.
- **Source reviewed:** `apps/website/src/pages/public/ProductListing.vue`, products store, Website router and existing Website test patterns.
- **Changes:** Added page heading using shared design tokens, refined filter card/product grid/price badge/pagination styling, associated search/category labels with inputs, gave min/max price inputs accessible labels, added live/loading/error/empty semantics, and keyboard activation/focus for product tiles.
- **Behavior preserved:** `productsStore.getCategories()`, `productsStore.getProducts(params)`, initial category query, query watcher, filters/pagination, and `product-details` route.
- **Tests added:** component-level tests for initial query/API params, keyboard navigation, error/empty states and reactive route-query category changes.
- **Verification:** CI/build/migration results pending. No local test/build run is claimed.


## 2026-10-29 — UI-REDESIGN-STEP-2 — MERGED

- **Status:** MERGED; PR [#30](https://github.com/gameacc2025/martest/pull/30), merge commit `91c64bb1a43553ecb1214b4a50c1bb0efa5f7ac2`.
- **Changes:** Shared design-system page heading/surface/grid/pagination styling; associated filter labels and accessible min/max price labels; loading/error/empty live-state semantics; keyboard product-tile activation/focus.
- **Behavior preserved:** `productsStore.getCategories()`, `productsStore.getProducts(params)`, category query initialization/watch, filter and pagination semantics, and `product-details` route.
- **Verification:** Feature-branch CI [40840764762](https://github.com/gameacc2025/martest/actions/runs/40840764762) passed architecture graph validation, frontend/shared tests including Product Listing component tests, backend tests, Prisma generation and all three frontend builds. Migration validation [40840764653](https://github.com/gameacc2025/martest/actions/runs/40840764653) passed.
- **Post-merge:** Main CI/migration/runtime workflows were queued on merge commit and must be checked before Step 3 starts.
- **Next:** Product Details page, one focused branch/PR at a time; preserve inquiry/cart/data behavior.


## 2026-10-29 — UI-REDESIGN-STEP-3 — Product Details

- **Status:** Implementation and component regression tests committed on focused branch; verification pending.
- **Branch:** `feat/website-product-details-redesign-step-3`, based on main after merged Product Listing PR #30.
- **Changes:** Apply shared design tokens to Product Details page surfaces/spacing; add accessible loading/not-found/error and price-history state semantics; expose active thumbnail selection with `aria-pressed`.
- **Behavior preserved:** route ID loading/watcher, product store API, image selection, retail/bulk price selection, company profile route, price-history API, inquiry submission and permission gating.
- **Tests added:** product loading/route ID, not-found/error states, route changes, image switching and permission-gated inquiry action.
- **Verification:** CI, production builds and migration validation pending. No local test/build run claimed.


## 2026-10-29 — UI-REDESIGN-STEP-3 — MERGED

- **Status:** MERGED; PR [#31](https://github.com/gameacc2025/martest/pull/31), merge commit `daf47ff282a2e81162ff0e8e5047337b1973b26e`.
- **Changes:** Product Details now uses shared design-system tokens for page surface, container, color, border, shadow and spacing. Loading/not-found/error/price-history states expose accessibility roles; selected image thumbnail exposes `aria-pressed`.
- **Behavior preserved:** route-ID loading/watcher, product gallery, retail/bulk price logic, company profile navigation, price-history API, and inquiry submission with existing authentication/permission gate.
- **Verification:** Feature CI [40841432392](https://github.com/gameacc2025/martest/actions/runs/40841432392) passed all frontend/shared tests (including new Product Details component tests), backend tests, Prisma generation, architecture graph and all three builds. Migration validation [40841432249](https://github.com/gameacc2025/martest/actions/runs/40841432249) passed. Post-merge main CI [40841579985](https://github.com/gameacc2025/martest/actions/runs/40841579985) and migration validation [40841579967](https://github.com/gameacc2025/martest/actions/runs/40841579967) also passed.
- **Next:** Categories page as Step 4 on a focused branch. Runtime/browser smoke remains separate and is not claimed passed.


## 2026-10-29 — UI-REDESIGN-STEP-4 — Categories

- **Status:** Implementation and component regression tests committed on focused branch; verification pending.
- **Branch:** `feat/website-categories-redesign-step-4`.
- **Changes:** Shared page/container/header/surface tokens, responsive category grid/cards, focus treatment, accessible loading/error states and explicit empty state.
- **Behavior preserved:** `productsStore.getCategories()`, category fields/IDs, and route push to `name: 'products'` with `query.category`.
- **Tests:** Live category rendering, route/query contract, pending loading state, empty result and error state.
- **Verification:** CI, production builds and migration validation pending. No local test/build execution claimed.


## 2026-10-29 — UI-REDESIGN-STEP-4 — MERGED

- **Status:** MERGED; PR [#32](https://github.com/gameacc2025/martest/pull/32), merge commit `50745aa1c83bfb01fe6a7db5cb87c8f33af7b178`.
- **Changes:** Categories page uses shared page/container/header/surface tokens, responsive grid/cards, focus treatment, accessible loading/error states and explicit empty state.
- **Behavior preserved:** `productsStore.getCategories()`, category fields/IDs and navigation to `{ name: 'products', query: { category: categoryId } }`.
- **Tests:** component tests cover category rendering, route/query, loading, empty and error states.
- **Test correction:** The first CI run failed because shallow-mounted Card stubs did not render named slots; explicit Card/Button/Badge/Breadcrumb/Spinner stubs were added and tests passed in the corrected run.
- **Verification:** Feature CI [40842352640](https://github.com/gameacc2025/martest/actions/runs/40842352640) and migration [40842352602](https://github.com/gameacc2025/martest/actions/runs/40842352602) passed. Post-merge CI [40842534524](https://github.com/gameacc2025/martest/actions/runs/40842534524) and migration [40842534511](https://github.com/gameacc2025/martest/actions/runs/40842534511) passed.
- **Next:** Search Results page as Step 5.


## 2026-10-29 — WEBSITE-SEARCH-RESULTS-REDESIGN-STEP-5

- **Status:** Implementation and regression tests pushed to `feat/website-search-results-redesign-step-5`; CI and migration verification pending.
- **Scope:** Redesigned `apps/website/src/pages/public/SearchResults.vue` using the existing shared design-system tokens/primitives; added accessible search labels, results count announcements, loading/error/empty states, retry action, responsive filter/result layout, and accessible sorting controls.
- **Behavior preserved:** `productsStore.searchProducts(searchQuery, params)`, query route synchronization/watcher, category/price/sort/pagination parameters, product normalization, cart/wishlist handlers, and `product-details` route.
- **Tests added:** `apps/website/src/pages/public/SearchResults.test.js` covers route query/API parameters, live result normalization/render, new query submit and URL sync, empty/error/retry states, query changes, and product navigation.
- **Base:** `985b8da264c21254c1c29edc2610c37d42952c76`.
- **Important:** No local dependency-equipped checkout was available; do not claim local tests ran. Await feature CI, migration validation, and post-merge checks before marking complete.
- **Owner constraints:** Do not introduce mocks into production runtime, bypass auth, change API contracts, or debug browser smoke as the next task.


## 2026-10-29 — WEBSITE-SEARCH-RESULTS-REDESIGN-STEP-5-COMPLETE

- **Status:** PR #33 merged to `main` as `1c58e2c2b01bbfdfe2e4b938e91b9199945ecc25`.
- **Feature CI:** [40880947037](https://github.com/gameacc2025/martest/actions/runs/40880947037) passed frontend/shared tests, backend tests, Prisma generation, architecture graph check, and all three frontend builds.
- **Migration validation:** [40880947043](https://github.com/gameacc2025/martest/actions/runs/40880947043) passed.
- **Post-merge checks:** CI [40881262815](https://github.com/gameacc2025/martest/actions/runs/40881262815) and migration validation [40881262830](https://github.com/gameacc2025/martest/actions/runs/40881262830) were queued when this entry was written. Runtime validation [40881262762](https://github.com/gameacc2025/martest/actions/runs/40881262762) was also queued. Inspect these before starting the next page.
- **Browser-smoke constraint:** Feature runtime workflow was still running at the last check. Per owner instruction, do not debug browser smoke as the next task; report its actual outcome when available.
- **Next page:** Only after post-merge CI/migration are inspected, proceed to the next Website page in the approved sequence.


### Post-merge verification result — Search Results Step 5 (2026-10-29)

- **Post-merge CI:** [40881378521](https://github.com/gameacc2025/martest/actions/runs/40881378521) PASS on `main`, including frontend/shared tests, backend tests, Prisma generation, architecture graph check, and all three frontend builds.
- **Post-merge database migration validation:** [40881378435](https://github.com/gameacc2025/martest/actions/runs/40881378435) PASS.
- **Runtime validation:** [40881262762](https://github.com/gameacc2025/martest/actions/runs/40881262762) FAIL at browser smoke. Compose validation, build/start of PostgreSQL/backend/three panels, health endpoints, and migration-state checks passed before browser smoke failed. Per owner instruction, no browser-smoke debugging is started as the next task.
- **Disposition:** Step 5 is complete and merged. The next Website page may begin; keep the browser smoke failure visible as an operational caveat.


## 2026-10-29 — WEBSITE-ABOUT-US-REDESIGN-STEP-6

- **Status:** Implementation and regression tests pushed to `feat/website-about-us-redesign-step-6`; CI and migration verification pending.
- **Page:** `apps/website/src/pages/public/AboutUs.vue`.
- **Changes:** Applied shared design-system tokens and responsive layouts; reorganized mission, values, how-it-works and published-products sections; added accessible loading/error/empty states and retry behavior.
- **Content integrity:** Removed hardcoded unverified usage/order/product/company counts, named team profiles, and partner claims. Retained only non-numeric platform purpose/process copy and real API-backed published products.
- **Behavior preserved:** `productsApi.list({ page: 1, limit: 6, status: 'PUBLISHED' })`, product price formatting, and `product-details` route navigation.
- **Tests:** Added `apps/website/src/pages/public/AboutUs.test.js` for request contract, API-backed product rendering, absence of demo metrics/team/partner claims, empty/error/retry states, and product navigation.
- **Source review follow-ups:** `Companies.vue` is not registered in the current router and references missing CompanyCard/store APIs; `CompanyProfile.vue` calls missing website store methods. These are documented for a dedicated behavior/API-contract task and are not silently changed in this visual slice.
- **Verification:** No local dependency-equipped checkout was used; await feature CI and migration validation. No local test run is claimed.
- **Constraints:** No mock data, auth bypass, or fabricated metrics added.


## 2026-10-29 — WEBSITE-ABOUT-US-REDESIGN-STEP-6-COMPLETE

- **Status:** PR #34 merged to `main` as `503bbe8af65e1b787a64a7d53aa50ff9bba3bf7f`.
- **Feature CI:** [40882370960](https://github.com/gameacc2025/martest/actions/runs/40882370960) PASS, including frontend/shared tests, backend tests, Prisma generation, architecture graph check, and all three frontend builds.
- **Feature migration validation:** [40882371076](https://github.com/gameacc2025/martest/actions/runs/40882371076) PASS.
- **Post-merge CI:** [40882547737](https://github.com/gameacc2025/martest/actions/runs/40882547737) PASS.
- **Post-merge migration validation:** [40882547667](https://github.com/gameacc2025/martest/actions/runs/40882547667) PASS.
- **Runtime validation:** [40882371017](https://github.com/gameacc2025/martest/actions/runs/40882371017) was still in progress at the last check. No result is claimed and browser smoke is not the next debugging task.
- **Content integrity:** Removed unverified static metrics, named team profiles and partner claims; retained API-backed published products and route navigation.
- **Next task:** Step 7 Company Profile contract audit/repair, because the routed page calls store methods not exported by current website stores. Do not redesign the page until its API contract is established.


## 2026-10-29 — WEBSITE-COMPANY-PROFILE-CONTRACT-STEP-7

- **Status:** Implementation and tests pushed to `fix/website-company-profile-api-contract-step-7`; CI/migration verification pending.
- **Source finding:** Routed `CompanyProfile.vue` called missing website-store methods for company products, reviews and follows. Backend company routes require authentication and context/permission checks; no company review/follower endpoints or schema models were found in the current source. Do not add invented endpoints.
- **Supported contract:** Public product listing uses `GET /products`, `publicOnly: true`, and supports `companyId` filtering. It enforces `PUBLISHED + PUBLIC` and returns public product fields including company id/name/type.
- **Change:** Reworked Company Profile to call `productsStore.getProducts({ page, limit, companyId })`, derive the public company header from returned products, normalize product-card data, preserve product-details navigation/cart/wishlist handlers, and add accessible loading/error/empty/retry states plus route-ID watching/pagination. Unsupported review/follow UI was removed rather than faked.
- **Tests:** Added `apps/website/src/pages/public/CompanyProfile.test.js` for query contract, route ID updates, empty/error/retry states, product navigation and pagination.
- **Base:** `e7d9a50d6fe86097d1286507d5249c026467b483`.
- **Constraints:** No backend endpoint, authorization change, mock data, or public private-company fields added. Await feature CI and migration validation; no local tests claimed.


## 2026-10-29 — WEBSITE-COMPANY-PROFILE-CONTRACT-STEP-7-COMPLETE

- **Status:** PR #35 merged to `main` as `59c9dc201e6bd896a7a1ca5e599d9b4f31426659`.
- **Feature CI:** [40883463184](https://github.com/gameacc2025/martest/actions/runs/40883463184) PASS.
- **Feature migration validation:** [40883463227](https://github.com/gameacc2025/martest/actions/runs/40883463227) PASS.
- **Post-merge CI:** [40883640234](https://github.com/gameacc2025/martest/actions/runs/40883640234) PASS.
- **Post-merge migration validation:** [40883640581](https://github.com/gameacc2025/martest/actions/runs/40883640581) PASS.
- **Runtime validation:** [40883463183](https://github.com/gameacc2025/martest/actions/runs/40883463183) was still in progress at last check; no result claimed.
- **Contract:** Company Profile now uses public catalog `getProducts({ page, limit, companyId })`, which is explicitly filtered to PUBLISHED + PUBLIC by the backend. Unsupported review/follow UI was removed; no backend authorization was weakened.
- **Next:** Audit Companies directory because it is unrouted, references a missing component and missing store methods, while backend `GET /companies` is STAFF-only.


## 2026-10-29 — WEBSITE-FAQ-REDESIGN-STEP-9

- **Status:** Implementation and regression tests pushed to `feat/website-faq-redesign-step-9`; CI/migration verification pending.
- **Page:** `apps/website/src/pages/public/Faq.vue`.
- **Changes:** Shared design-system hero/surfaces, responsive FAQ accordion, accessible `aria-expanded` / `aria-controls` / region semantics, contact-support links.
- **Content accuracy:** Replaced outdated claims about product returns, installment payments, order tracking, and seller contact with current B2B marketplace, inquiry permission/subscription, company approval and product-publication guidance.
- **Tests:** Added `Faq.test.js` for rendering, toggle semantics, independent expanded items, unsupported-feature claim prevention, and contact route.
- **Step 8 disposition:** Keep Companies directory unrouted/dormant because backend `GET /companies` is STAFF-only and the current page references missing UI/store contracts. No public API was invented.
- **Runtime evidence correction:** Search Results [40881262762](https://github.com/gameacc2025/martest/actions/runs/40881262762), About Us [40882371017](https://github.com/gameacc2025/martest/actions/runs/40882371017), and Company Profile [40883463183](https://github.com/gameacc2025/martest/actions/runs/40883463183) runtime workflows failed at browser smoke after infrastructure/health/migration stages. Per owner instruction, do not debug browser smoke as the next task.
- **Verification:** No local test run claimed; await feature CI and migration validation.


## 2026-10-30 — UI-REDESIGN-STEP-9-VERIFICATION-AND-STEP-10-HANDOFF

- **Step 9:** FAQ redesign PR #36 is merged at `89c490b6273188e10b66a685794c9edbe9bfed01`.
- **Feature verification:** CI [40884581248](https://github.com/gameacc2025/martest/actions/runs/40884581248) PASS; database migration [40884581108](https://github.com/gameacc2025/martest/actions/runs/40884581108) PASS.
- **Post-merge verification:** CI [40884769582](https://github.com/gameacc2025/martest/actions/runs/40884769582) PASS; database migration [40884769425](https://github.com/gameacc2025/martest/actions/runs/40884769425) PASS.
- **Runtime:** feature [40884581818](https://github.com/gameacc2025/martest/actions/runs/40884581818) and post-merge [40884769750](https://github.com/gameacc2025/martest/actions/runs/40884769750) failed at browser smoke. No runtime pass is claimed; per owner instruction, browser smoke is not pursued as the next task.
- **Current next UI slice:** Step 10 Terms & Privacy visual/accessibility redesign. Preserve legal text and meaning; do not create new legal claims.
- **Contact Us deferral:** current page has hardcoded business contact details/map and fake successful submission implemented with a timeout. No public contact submission endpoint was found by source search. Do not redesign it as if sending were real; first define and verify backend contract and real business contact data.
- **No implementation changes for Step 10 yet.**
- **Graphify:** still unavailable because no workspace is selected; do not claim its memory/index was refreshed.


## 2026-10-30 — STEP-10 TERMS PAGE IMPLEMENTATION (PR #37)

- **Branch:** `feat/website-terms-redesign-step-10`; **PR:** https://github.com/gameacc2025/martest/pull/37 (draft).
- Replaced the Terms page's legacy layout with responsive RTL shared-design-system sections and breadcrumb.
- Preserved all existing legal paragraphs; only added a short descriptive page introduction. No new legal, privacy, security or compliance claims were added.
- Added `apps/website/src/pages/public/Terms.test.js` for semantic structure, RTL, content-preservation and unsupported-claim checks.
- PR checks on head `cc6200f893a496f413679f7cae88bdbbc7365fbc`: CI [41096735410], migration [41096735469], and runtime [41096735415] were queued when recorded. No result claimed yet.
- This entry supersedes the earlier Step 10 “no implementation changes yet” handoff line.


## 2026-10-30 — UI-REDESIGN-STEP-10-COMPLETE

- **PR:** #37 merged at `0da4960d026aa6be532777c5dd66afacca3430de`.
- **Feature CI:** [41096817092](https://github.com/gameacc2025/martest/actions/runs/41096817092) PASS.
- **Feature migration:** [41096817046](https://github.com/gameacc2025/martest/actions/runs/41096817046) PASS.
- **Post-merge CI:** [41097249357](https://github.com/gameacc2025/martest/actions/runs/41097249357) PASS.
- **Post-merge migration:** [41097249463](https://github.com/gameacc2025/martest/actions/runs/41097249463) PASS.
- **Post-merge runtime:** [41097249425](https://github.com/gameacc2025/martest/actions/runs/41097249425) was still running at handoff; browser smoke is not pursued as the next task.
- **Scope:** Terms & Privacy page received RTL/semantic/responsive shared-design-system layout; original legal wording preserved; focused tests added. No API/auth/backend changes.
- **Next:** Step 11 company-owned API route/tenant-isolation audit. Inspect source route-by-route and add tests for confirmed gaps; no full security sign-off until complete.
- **Contact Us:** still deferred; hardcoded contact information and simulated success, no verified public submission endpoint.


## 2026-10-30 — SECURITY-AUDIT-STEP-11A-COMPANIES

- **Branch:** `audit/company-tenant-access-step-11`.
- **Scope reviewed:** `company.routes.js`, `company.controller.js`, `company.service.js`, company route/controller/service tests, RBAC middleware, and company rule service.
- **Findings:** No confirmed cross-tenant authorization bypass in the reviewed company route family. The route-level context guard limits COMPANY users to the company ID in their authenticated context; staff-only routes reject COMPANY context; service update logic preserves the STAFF global-admin boundary and blocks company-context lifecycle/limit changes.
- **Coverage added:** Integration tests verify own-vs-other tenant behavior for company product listing, statistics and logo update, and verify COMPANY context cannot read/update settings even with wildcard permissions.
- **Not a full sign-off:** This is one module slice only. Product, inquiry, address, notification and nested-resource route families remain to be reviewed.
- **Verification:** Await GitHub Actions CI/backend tests and migration validation before merging this test-only security slice.


## 2026-10-30 — SECURITY-AUDIT-STEP-11A-COMPANIES-MERGED

- **PR #38:** merged at `d4d64af9c120d7200e363bdcb7092dfd0554f47b`.
- Feature CI [41098052152] and migration [41098052018] passed.
- Post-merge CI [41098224830] and migration [41098224693] passed.
- Runtime [41098225137] remains separate; do not claim browser smoke passed or pursue it as the next debugging task.
- No confirmed cross-tenant authorization bypass found in company routes/services.
- Added route tests for own-vs-other company products/statistics/logo and wildcard COMPANY denial on staff-only settings.
- Next: product route/service and nested attachment authorization audit.


## 2026-10-30 — SECURITY-AUDIT-STEP-11B-PRODUCTS

- **Branch:** `audit/product-tenant-access-step-11b`.
- **Scope reviewed:** product route table, controller, service ownership helpers, product route/service tests, public projection and nested resource methods (price tiers, images, documents, status history, activity logs).
- **Findings:** No confirmed cross-tenant bypass identified in this product slice. Company management queries are scoped to caller company; nested image/document/price-tier lookups are constrained by parent product ID; public catalog projection clamps visibility and excludes internal moderation fields; status transitions are separated by AccessProfile context.
- **Coverage added:** A route integration regression test verifies COMPANY and CUSTOMER contexts carrying a stray SUPER_ADMIN role and wildcard permissions cannot invoke STAFF-only approve/reject/hide/archive/restore actions.
- **Not a full sign-off:** Inquiry, address, notification and remaining nested resource routes still require review.
- **Verification:** CI/backend tests and migration validation pending.


## 2026-10-30 — SECURITY-AUDIT-STEP-11B-PRODUCTS-MERGED

- **PR #39:** merged at `de25c403506208bdfc01c1516d56fa929e85a8ad`.
- Feature CI [41098778272] and migration [41098778245] passed.
- Post-merge CI [41098969268] and migration [41098969119] passed.
- Runtime [41098968989] remains separate; no browser-smoke pass is claimed.
- No confirmed product cross-tenant bypass found. Product list/detail and nested price tier/image/document lookups were reviewed; public projection remains PUBLISHED + PUBLIC.
- Added regression coverage ensuring COMPANY/CUSTOMER wildcard contexts cannot invoke STAFF-only moderation actions.
- Next: inquiry route family — buyer/supplier ownership, strict context, subscription/payment ownership, sealed visibility, messaging and attachments.


## 2026-10-30 — SECURITY-AUDIT-STEP-11C-INQUIRIES: confirmed context mismatch

- Auth source confirms CUSTOMER registrations have no AccessProfile; `issueTokens` emits `accessType: null`, `companyId: null`, and role `CUSTOMER_USER`.
- Central `requireAccessType('CUSTOMER')` explicitly accepts this role-based Website fallback.
- Inquiry service previously recognized customers only when `accessType === 'CUSTOMER'` in listing, creation, status restrictions, messages, and statistics. Therefore the actual AccessProfile-less CUSTOMER_USER token did not follow the customer path even though route RBAC admitted it.
- `isInquiryBuyer` also compared `caller.companyId` without requiring COMPANY context. A STAFF token carrying a stray companyId could be treated as the buyer in service-level ownership checks. In particular, STAFF with `inquiries.create` can reach the status/items routes' permission preHandler, so service ownership must not accept that stray companyId.
- Fix in progress: add `isCustomerContext` matching the central CUSTOMER fallback, scope buyer identity by CUSTOMER_USER id or COMPANY context only, require explicit COMPANY context for supplier responses, and only let STAFF create for an explicitly supplied companyId with the required permission.
- Added regression tests for customer default context across listing/create/messages/stats, STAFF stray-companyId read/status denial, and STAFF/CUSTOMER wildcard denial on supplier lifecycle/attachment routes. CI pending.
- Corrected the stale inquiry route comment: SUPER_ADMIN wildcard bypasses permission checks only, never the AccessProfile context guard.


### Inquiry audit refinement — customer response visibility

- A second use of `caller.companyId` was found in `assertCanReadResponses`: after buyer check, it could treat a CUSTOMER_USER default Website context with a stray companyId as a supplier company owning a requested product.
- Fixed the fallback so a CUSTOMER context that is not the buyer receives 404; only an explicit COMPANY context may use companyId for supplier visibility.
- Added regression coverage that a CUSTOMER_USER with a stray companyId cannot list supplier responses for another buyer's inquiry.
- Also corrected the central RBAC header comment: wildcard bypasses permission checks only, never `requireAccessType`.


### Inquiry audit — received-scope tenant boundary and CI correction (2026-10-30)

- The first CI attempt for PR #40 exposed a real service-layer gap: listInquiries({scope:'received'}) allowed STAFF with a stray companyId because the guard only checked that companyId was truthy. This contradicted the COMPANY-only supplier view.
- Fixed the guard to require caller.accessType === 'COMPANY' as well as a valid companyId. This prevents STAFF/CUSTOMER tokens from entering supplier received scope based on stale/misassigned company identifiers.
- Corrected an unrelated-company response test fixture to carry explicit COMPANY context, so the test exercises the intended supplier-not-owner 404 path instead of the invalid-context path.
- The stats test expected Prisma groupBy query arguments but the mock never recorded them. Updated inquiry and response groupBy mocks to record args, making the assertions meaningful.
- Earlier backend CI failures: (1) unrelated-company fixture expected wrong error for context-less caller; (2) stats assertion read missing mock call records; (3) STAFF received-scope was not rejected. Latest commits contain corrections; re-run CI before merge.


### Inquiry audit — subscription owner and statistics context alignment (2026-10-30)

- Found a second AccessProfile-less CUSTOMER_USER mismatch in `inquiry.controller.js`: RBAC allowed the default Website context, but subscriptionOwner() and quota() recognized only explicit `accessType === 'CUSTOMER'`. This blocked customers from their own subscription/quota flows. Added matching CUSTOMER_USER fallback; all user-owned operations are scoped by authenticated caller.id.
- Restricted the quota route to COMPANY/CUSTOMER contexts so STAFF cannot read company quota by carrying a stray companyId.
- Found stats context mismatch: getInquiryStats read caller.companyId regardless of AccessProfile. It now derives companyId only in COMPANY context, requires inquiry-read permission for STAFF, and uses platform-wide aggregates for authorized STAFF (consistent with staff inquiry listing) rather than a stray company filter.
- Added controller tests for customer subscription/list/retry/quota ownership, company quota, and STAFF denial; added stats tests for authorized platform scope and unauthorized STAFF rejection.
- PR #40 remains open pending latest CI and migration checks.


## 2026-10-31 — INQUIRY-APP-CONTEXT-CI-CORRECTION

- **PR:** #40, branch `audit/inquiry-app-context-step-11c`.
- **CI diagnosis:** The first run executed 1,355 backend tests; 1,354 passed. The sole failure was in the newly added STAFF `scope=received` test. The service correctly rejected the request before querying; the test then incorrectly asserted `calls.findMany === undefined`, while the shared mock harness initializes that tracker to `[]`.
- **Correction:** Changed the assertion to `calls.findMany.length === 0`; no production behavior changed in this correction.
- **Commit:** `189516deb109ca045f577459d385b5492c1d16e7`.
- **Migration:** Previous PR-head migration validation passed; fresh validation on the corrected head is pending. Runtime infrastructure, health endpoints and migrations passed; browser smoke failed separately and is not pursued as the next task.
- **Disposition:** Keep PR #40 unmerged until fresh CI and migration checks pass.


## 2026-10-31 — STEP-11C-MERGE / STEP-11D-NOTIFICATIONS-ADDRESSES

- PR #40 merged by squash into `main`: `9bac9916de148741fb379ffcdd5aaf44157f4db2`.
- Corrected-head CI [41216629069](https://github.com/gameacc2025/martest/actions/runs/41216629069) passed; database migration validation [41216628936](https://github.com/gameacc2025/martest/actions/runs/41216628936) passed. Runtime validation [41216628926](https://github.com/gameacc2025/martest/actions/runs/41216628926) was queued and remains separately tracked.
- Step 11D address review found all address operations consistently scoped by authenticated user ID; no cross-user IDOR confirmed. Added route-level tests for CUSTOMER_USER default Website access and denial of COMPANY, STAFF/SUPER_ADMIN and wildcard attempts.
- Step 11D notification review found AccessProfile-less CUSTOMER_USER accounts could not access notification folders because controller scope resolution did not mirror central RBAC's default Website fallback. Fixed with strict CUSTOMER_USER-only fallback and explicit SUPER_ADMIN exclusion. Added controller tests for folders and folder-filtered listing.
- Current branch: `audit/notification-address-tenant-step-11d`; awaiting CI/migration checks before PR merge.
- Full security sign-off is not claimed; remaining route inventory and SMS event dispatch integration are still open.


## 2026-10-31 — STEP-11D-MERGE

- PR #41 merged by squash at `9268be23da6c1f0bc0108d3480bdaf0c3f840e53`.
- CI [41216966030](https://github.com/gameacc2025/martest/actions/runs/41216966030) and migration validation [41216965916](https://github.com/gameacc2025/martest/actions/runs/41216965916) passed. Runtime [41216965989](https://github.com/gameacc2025/martest/actions/runs/41216965989) was still running at merge time.
- Address ownership queries remain scoped to authenticated userId; no cross-user IDOR confirmed. Address route tests cover CUSTOMER_USER default Website context and explicit denial of COMPANY/STAFF/SUPER_ADMIN wildcard context.
- Fixed notification folder app-scope resolution for AccessProfile-less CUSTOMER_USER while preserving strict ADMIN/COMPANY boundaries; added folder listing/filtering and SUPER_ADMIN regression tests.
- Next: Step 11E audit of auth/users/admin/settings/categories/roles/permissions/specification-library.


## 2026-10-31 — STEP-11E-AUTH-PASSWORD-RESET

- Audited auth/users/admin/settings/categories/roles/permissions/specification-library route wiring and selected service boundaries.
- Confirmed the admin password-reset endpoint had only a fine-grained permission guard. It did not enforce STAFF app context, and `changeUserPassword` accepted no caller context, allowing any caller whose role was granted `users.reset_password` (including a COMPANY-context SUPER_ADMIN/wildcard) to reset arbitrary user IDs.
- Fixed route to require `requireExactAccessType('STAFF')` and `users.reset_password`; passed verified caller into service; service independently enforces STAFF context and explicit permission/wildcard.
- Added route and service regressions for COMPANY/SUPER_ADMIN wildcard denial and STAFF missing-permission denial. Authorized STAFF reset behavior remains covered.
- Branch: `audit/backend-route-inventory-step-11e`; verification pending.


### Step 11E — Public taxonomy visibility

- Found public category detail and subcategory detail handlers fetched by ID without checking `status === ACTIVE`, despite the public category list filtering inactive rows.
- Added active-only predicates to public category/subcategory detail lookups and verified the parent category is active before listing children.
- Added service/controller regression coverage. Changes are included in PR #42.


- CI first run: 1,313 tests executed, 1,312 passed; the only failure was a stale controller-test expectation after the caller context was added to the service call. Updated the test to provide a verified STAFF caller and assert the third argument. No production behavior changed in this correction. Re-run CI on the latest head.


- Category controller regression caught one missed call site: `listSubcategories` still fetched its parent without `activeOnly: true`. Corrected the parent lookup to enforce active status before listing active children; re-run CI on the latest head.
