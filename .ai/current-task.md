# Current Task / Agent Handoff

## Completed — NOTIFICATION-FOLDERS (Stages 2 and 3)

- **Status:** DONE — implementation is on `main`; GitHub Actions CI passed on the folder-action test commits.
- **Stage 2:** Prisma folder models and additive migration; fixed `INBOX` and `SAVED` system folders; existing-notification backfill; trigger assigning new notifications to Inbox; admin-only folder list/create/update API and Admin management UI.
- **Stage 3:** App-scoped folder listing; server-side folder filtering; copy/move membership API; save-to-SAVED, copy, and move controls in Website, Company, and Admin inboxes.
- **Security:** Admin folder management requires `system_settings.manage`; user actions require authentication and notification ownership, validate app scope and active destination, and validate source membership for moves. Copy preserves source membership. Move adds the destination and removes the source in a transaction. The canonical notification and its read state remain singular.
- **Verification:** GitHub Actions run [40199219352](https://github.com/gameacc2025/martest/actions/runs/40199219352) passed: frontend/shared tests 18/18, backend tests 1149/1149, Prisma Client generation, and Website/Company/Admin production builds. The preceding admin-route test fix also passed run [40199100910](https://github.com/gameacc2025/martest/actions/runs/40199100910).
- **Development database:** The user created a backup, applied `20261025130000_notification_folders`, verified the `INBOX` and `SAVED` folders and 26 Inbox memberships, then confirmed `prisma migrate diff` was empty and `prisma migrate status` reported the schema up to date.
- **Not independently verified:** Live UI copy/move click-through across folders was not separately exercised in this session. The user confirmed the notification folder UI is working.
- **Relevant commits:** `53dcf7e3fcf910461bd500ff284f0bd41c87466f` (admin route test mocks and coverage); `a7473f22637415f36ecd2ec90df272e4a9403c24` (folder service ownership/scope/copy/move tests).
- **Next action:** Sync local `main` before continuing. If a live copy/move action fails, capture its request/response and inspect the relevant folder membership; otherwise select the next project priority.
