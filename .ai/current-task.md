# Current Task / Agent Handoff

## Latest task — ALL-APP-NOTIFICATION-INBOX
- **Status:** DONE — Company, Website/customer, and Admin inboxes updated; CI tests and all production builds passed.
- **User-provided evidence:** The API returns `{ data: [...], meta }`, including `ADMIN_ANNOUNCEMENT` and many older notifications whose `type` is `null`.
- **Root cause addressed:** Website and Admin inboxes used `apiGet()` but then expected `result.data`; the helper unwraps the response envelope, so those pages could show no rows. Company was also hardened against nested/legacy response shapes. Category logic previously failed to classify admin announcements and legacy null-type records.
- **Changes:** All three inboxes use `apiGetPaginated()` and normalize response shapes; all three have the categorized email-style UI. Legacy null-type messages are categorized using title/message text. Added a regression test for each app and registered Website/Admin Vitest projects at root. Docs updated.
- **CI:** https://github.com/gameacc2025/martest/actions/runs/40177071576 — `success`; 17 frontend/shared test files, 148 tests passed; backend 1,136 passed/0 failed; root session-handoff tests 18 passed/0 failed; Website, Company, Admin production builds all succeeded.
- **Latest task commits:** Company response normalization `28c0a9a124090064c1933d9bc07dbe3294243b12`; Website inbox `0390ffa09f7ef39689945785940d502382a884c3`; Admin inbox `92d584c450f90ccb83b716fabb4b87d7c980a3ed`; root Vitest projects `2742cd51c3b16b8d4bcbb6ddef6676bb5989e5e7`; docs `b04f70cb98439adbf5831b3f259fb3fbe721d566`; latest worklog `f3a35e54b4285d1abb30aad374f11a55adfae38e`.
- **Not verified:** The user's local browser/runtime and real authenticated session were not accessible in this session.
- **Next action:** User should fast-forward local `main`, restart the three frontend dev servers, and verify `/notifications` in each app. If a list is still blank, inspect the runtime component state and loaded bundle version; all three response/render paths now have regression coverage.

## Agent policy note
The repository's English-only communication rule applies to coding agents working through command-line tools; ChatGPT conversation with the user remains in Persian as requested.

## Follow-up — unread badge and notification navigation (2026-10-25)
- Fixed Website header badge to call `endpoints.notifications.unreadCount` (`/settings/notifications/unread-count`), not obsolete `/api/v1/notifications/unread-count`.
- Added shared navigation for notification preferences and permission-gated admin send/monitor page (`notifications.send`). Route-existence filtering hides admin management from Company app.
- Commits: `e98e604bec76dacacd811bf32510314bdfd9d219`, `335cbc2162862dc6c55dbb655eddc349c0454836`, docs `631ee482915efae97fb98ee501fe8e2ba60776eb`, worklog `5ff80cfd55bcf06d2f0a5c3a4b9d8112c45a19ee`.
- Verification: CI run https://github.com/gameacc2025/martest/actions/runs/40185053151 succeeded: 17 frontend/shared test files, 148 tests passed; backend 1,136 passed/0 failed; handoff 18 passed/0 failed; all three frontend production builds passed.
- Remaining limitation: live local browser/session not accessible here. After syncing `origin/main`, restart dev servers and verify all three routes. If still blank, capture component runtime state and loaded bundle version.
