# Current Task / Agent Handoff

## Completed — Notification inbox fixes and bulk actions

- **Status:** Implemented and committed to `main`; latest code CI run passed before documentation close-out.
- **Affected apps:** Website, Company, Admin notification inbox pages.
- **Folder filtering:** Company inbox previously fetched the base settings notifications endpoint without folderId; all three pages now use the canonical notifications endpoint, send folder/read filters to the server, and apply a membership guard in the visible list. Folder badges no longer show misleading counts derived only from the current page.
- **Read state:** Added authenticated `PATCH /settings/notifications/:id/read-state` with `{ isRead: boolean }`; per-row and reading-pane controls toggle read/unread. Initial auto-selection does not silently mark a notification as read. Added `readOnly=true` server filtering for the read folder.
- **Mark all read:** Always calls the server action instead of returning early based on a potentially stale unread counter; then refreshes list and counter.
- **Bulk actions:** Checkboxes per row and select-current-page control; selected items can be marked read, marked unread, or bulk-deleted. New authenticated endpoints `POST /bulk-read-state` and `POST /bulk-delete`; both validate request bodies, cap batches at 100, and scope DB mutations to the authenticated user.
- **UI cleanup:** Removed the large copy/move section from the message body. Saved, move-to-folder, read/unread, and delete controls are compact in the reading toolbar; row-level read/unread and delete icons are available.
- **Security/tests:** Added ownership-scoped service operations and route/service tests. Frontend tests updated for the explicit read-state endpoint and initial selection behavior.
- **Verification:** GitHub Actions run [40201945241](https://github.com/gameacc2025/martest/actions/runs/40201945241) passed: frontend/shared tests 18/18, backend tests 1156/1156, Prisma Client generation, and production builds for Website, Company, and Admin.
- **Commits:** `5fa5c68` UI controls and folder filtering; `46bf7dc` read-state and bulk endpoints; `69dcf1a` endpoint test expectations; `f3eebbe` initial-selection test update; `39e660b` preserve controller response contracts.
- **Next:** Pull `main` locally and verify live folder membership with one item saved and one not saved; test individual read/unread, mark all read, and bulk delete.
