# Current Task / Agent Handoff

## Active — NOTIFICATION-FOLDERS-ADMIN (Stage 2)
- **Status:** PARTIAL — implementation committed to `main`; verification NOT RUN.
- **Goal:** Provide fixed Inbox/Saved system folders and admin-managed folder definitions with app scopes.
- **Implemented:** Prisma models and additive migration; existing notification backfill to Inbox; PostgreSQL trigger puts newly inserted notifications into Inbox; admin-only GET/POST/PATCH folder API; Admin folder management page and navigation; API endpoint constants; notification docs.
- **Security:** Folder admin endpoints require `system_settings.manage`; system folders cannot be modified through the API; custom folders are deactivated rather than deleted.
- **Not implemented:** User-facing folder filtering and copy/move/save actions — stage 3.
- **Verification:** Only GitHub re-fetch/content checks completed. Prisma validation/generation, DB migration application, backend tests, frontend tests/build, and CI are NOT VERIFIED.
- **Next action:** Run verification and apply migration in a controlled dev environment, then implement stage 3 copy/move/save with ownership and scope enforcement.

## Previous — NOTIFICATION-READ-STATE
- **Status:** PARTIAL — implementation and tests committed; automated verification NOT VERIFIED.
- **Goal:** Mark opened notifications as read consistently in Website, Company Portal, and Admin.
- **Changes:** All three inboxes mark the initially selected unread message as read after loading; manual selection uses existing read endpoint; tests were added but not run locally.
- **Scope:** No schema/API changes in that task.
- **Next action:** Verify CI and local browser/runtime after syncing `main`.

## Latest completed task — ALL-APP-NOTIFICATION-INBOX
- **Status:** DONE — Company, Website/customer, and Admin inboxes updated; prior CI and builds passed for that earlier task.
- **Prior CI:** https://github.com/gameacc2025/martest/actions/runs/40177071576 (not verification of later changes).
