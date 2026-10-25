# Current Task / Agent Handoff

## Active task — NOTIFICATION-READ-STATE
- **Status:** IN_PROGRESS
- **Date:** 2026-10-25
- **Goal:** Fix notification read state when opening a message in Website, Company Portal, and Admin.
- **Approved scope:** Frontend inbox behavior and regression tests only. No database schema or API contract changes without separate approval.
- **Evidence so far:** All three inboxes auto-select the first notification after fetching, but do not call the mark-read operation. Manual clicks call a PATCH endpoint, but the user's reported failure on manual opening has not yet been reproduced; trace route prefixes/client semantics before deciding why.
- **Planned files:** `apps/website/src/pages/public/Notifications.vue` and `.test.js`; `apps/company/src/pages/user/Notifications.vue` and `.test.js`; `apps/admin/src/pages/user/Notifications.vue` and `.test.js`; this file and `.ai/WORKLOG.md`; notification docs only if behavior documentation changes.
- **Verification:** NOT RUN for this task yet. Inspect actual CI run results before reporting tests/builds as passed.
- **Folder feature:** User clarified that Saved is a fixed folder and users cannot create folders; Admin should control system-wide and per-app folder configuration. This is deferred to a separate design proposal covering admin controls, schema, API, authorization, and copy/move semantics. No folder/schema/API implementation in this task.
- **Next action:** Verify route prefixes, API client PATCH behavior, and message click bindings, then implement the smallest frontend-only correction and tests.

## Latest completed task — ALL-APP-NOTIFICATION-INBOX
- **Status:** DONE — Company, Website/customer, and Admin inboxes updated; CI tests and all production builds passed.
- **User-provided evidence:** The API returns `{ data: [...], meta }`, including `ADMIN_ANNOUNCEMENT` and many older notifications whose `type` is `null`.
- **Root cause addressed:** Website and Admin inboxes used `apiGet()` but then expected `result.data`; the helper unwraps the response envelope, so those pages could show no rows. Company was also hardened against nested/legacy response shapes. Category logic previously failed to classify admin announcements and legacy null-type records.
- **Changes:** All three inboxes use `apiGetPaginated()` and normalize response shapes; all three have the categorized email-style UI. Legacy null-type messages are categorized using title/message text. Added a regression test for each app and registered Website/Admin Vitest projects at root. Docs updated.
- **CI:** https://github.com/gameacc2025/martest/actions/runs/40177071576 — `success`; 17 frontend/shared test files, 148 tests passed; backend 1,136 passed/0 failed; root session-handoff tests 18 passed/0 failed; Website, Company, Admin production builds all succeeded.
- **Latest task commits:** Company response normalization `28c0a9a124090064c1933d9bc07dbe3294243b12`; Website inbox `0390ffa09f7ef39689945785940d502382a884c3`; Admin inbox `92d584c450f90ccb83b716fabb4b87d7c980a3ed`; root Vitest projects `2742cd51c3b16b8d4bcbb6ddef6676bb5989e5e7`; docs `b04f70cb98439adbf5831b3f259fb3fbe721d566`.
- **Not verified:** The user's local browser/runtime and real authenticated session were not accessible.
- **Next action:** Complete the active read-state task, then present a separate folder-system design for approval.
