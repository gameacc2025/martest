# Current Task / Agent Handoff

## Active — NOTIFICATION-FOLDERS (Stages 2 and 3)
- **Status:** Implemented on `main`; CI verification pending.
- **Stage 2:** Prisma models, additive migration, fixed INBOX/SAVED system folders, backfill of existing notifications to INBOX, trigger assigning future notifications to INBOX; admin-only list/create/update API; Admin management page/navigation; docs.
- **Stage 3:** App-scoped user folder list API; server-side notification filtering by folder; copy/move API using folder membership; Website, Company, and Admin inbox UIs expose folders, save-to-SAVED, copy and move.
- **Security:** Admin folder management requires `system_settings.manage`; user endpoints require auth and check notification ownership, app scope, destination active state, and source membership. Copy preserves source membership. Move atomically adds destination and removes source. Canonical notification/read state remains singular.
- **Verification:** Prisma generation passed on an intermediate commit after correcting the misplaced relation. Backend tests failed on the next commit due route test mocks and old controller expectation; both were corrected. Latest CI runs must be checked before marking green. DB migration has not been applied in a runtime environment.
- **Next action:** Check latest CI run conclusions; fix any failures. Then apply migration in dev and smoke-test list/save/copy/move. Do not claim runtime verified until actually run.

## Previous — NOTIFICATION-READ-STATE
- **Status:** PARTIAL — implementation and tests committed; automated verification not fully confirmed.
- **Goal:** Mark opened notifications as read in Website, Company Portal, and Admin.
