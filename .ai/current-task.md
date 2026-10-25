# Current Task / Agent Handoff

## Active follow-up — NOTIFICATION-READ-STATE
- **Status:** PARTIAL — implementation and tests are committed; automated verification is NOT VERIFIED.
- **Goal:** Ensure opening a notification marks it read consistently in Website, Company Portal, and Admin.
- **Changes:** Each inbox now marks the initially selected unread message as read after loading, then refreshes the unread count. Manual click behavior uses the existing read endpoint. Regression tests cover initial selection and manual click in all three apps; Website also checks failure-state behavior.
- **Scope guard:** No database schema or API contract changes were made.
- **Docs:** Notification behavior documented in docs/NOTIFICATION_SYSTEM.md; fixed Saved folder/admin-managed system-wide or per-app folder policy recorded in .ai/decisions.md.
- **Verification:** NOT RUN locally; CI status for direct-main commits could not be inspected with the available tools. Do not report tests/builds as passing.
- **Next action:** Inspect CI, fix failures if any, and request user verification after syncing local main.

## Deferred approved direction — notification folders
- Saved is a fixed system folder; users cannot create/rename/delete folders.
- Admin must control whether a folder is system-wide or enabled for Website, Company Portal, or Admin.
- Copy adds a folder association without removing the source association. Move changes the association without deleting the canonical notification. Read status belongs to the canonical notification.
- Exact admin UI, schema, endpoints, migration, authorization and copy/move behavior must be presented for separate approval before implementation.

## Latest completed task — ALL-APP-NOTIFICATION-INBOX
- **Status:** DONE — Company, Website/customer, and Admin inboxes updated; prior CI tests and all production builds passed.
- **Evidence/root cause:** The live API returns a paginated { data: [...], meta } envelope. Website/Admin previously used apiGet() but expected result.data; legacy null-type notifications and ADMIN_ANNOUNCEMENT also needed classification.
- **Changes:** All three inboxes use apiGetPaginated() and normalize response shapes; email-style UI, category handling, regression tests and docs are present.
- **Prior CI:** https://github.com/gameacc2025/martest/actions/runs/40177071576 — successful for the prior inbox task; this is not verification of the current read-state changes.
- **Not verified:** The user's local browser/runtime and real authenticated session are not accessible through this workflow.
