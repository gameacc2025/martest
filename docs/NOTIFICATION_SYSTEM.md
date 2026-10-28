# Notification System — Implementation Notes

## Scope

The notification feature has three concerns:
1. In-app notifications and unread state for an authenticated user.
2. User preferences by event type and delivery channel.
3. Staff-created announcements and delivery monitoring.

This document records the current implementation contract observed in the repository. If code and this document differ, inspect the current routes, schemas, service, worker, Prisma models, and tests, then update this document in the same task.

## User-facing API

Routes are registered under `/api/v1/settings/notifications` (confirm the prefix in `backend/src/app.js` when changing route registration).

| Method | Path | Purpose |
|---|---|---|
| GET | `/` | List the authenticated user's notifications |
| GET | `/unread-count` | Get unread count |
| GET | `/folders?app=...` | List folders for the app context derived from the authenticated access token; the query parameter is ignored |
| POST | `/:id/folders` | Copy or move an owned notification to a folder allowed in the authenticated app context |
| PATCH | `/:id/read-state` | Set an owned notification's `isRead` state to true or false |
| POST | `/bulk-read-state` | Set read state for up to 100 selected notifications owned by the caller |
| POST | `/bulk-delete` | Delete up to 100 selected notifications owned by the caller |
| PATCH | `/:id/read` | Mark one notification as read |
| PATCH | `/read-all` | Mark all notifications as read |
| DELETE | `/:id` | Delete one of the authenticated user's notifications |
| GET | `/preferences` | Read effective preferences, including defaults |
| PATCH | `/preferences` | Batch update preferences by event type and channel |

All routes require authentication. Ownership must be scoped to the authenticated user in service/controller logic; do not trust a user ID supplied by the client. Folder app scope is derived server-side from the verified access token (`STAFF` → `ADMIN`, `COMPANY` → `COMPANY`, `CUSTOMER` → `WEBSITE`); clients cannot select another app's folder by submitting a query/body `app` value. Unknown app context fails closed.

## Admin API

Admin routes are registered under the admin API prefix (verify the registration in `backend/src/app.js`).

| Method | Path suffix | Required permission | Purpose |
|---|---|---|---|
| POST | `/notifications/send` | `notifications.send` | Send an announcement to selected active audience(s) |
| GET | `/notifications/delivery-stats` | `delivery.view` | Read delivery statistics |
| GET | `/notifications/deliveries` | `delivery.view` | List delivery attempts/results |

Announcement audiences currently include `ALL_ACTIVE`, `CUSTOMER`, `COMPANY`, and `STAFF`. Supported send channels are `IN_APP` and `EMAIL`; SMS is not enabled by this contract. Request schema limits and accepted values are defined in `backend/src/modules/admin/admin.routes.js` and must remain the source of truth.

## Frontend entry points

- Website inbox: `apps/website/src/pages/public/Notifications.vue` — route `/notifications`.
- Website preferences: `apps/website/src/pages/public/NotificationPreferences.vue` — route `/notification-preferences`.
- Company inbox: `apps/company/src/pages/user/Notifications.vue` — email-style inbox with All/Unread/Read folders, event-type categories, search, message list/reading pane, read/delete actions, and pagination. Uses `apiGetPaginated()` and normalizes both paginated envelopes and legacy/nested response shapes. Legacy `type: null` notifications are categorized from title/message text; `ADMIN_ANNOUNCEMENT` is categorized as an announcement. Category matching must not let the generic `other` predicate consume null types before text-based classification. A regression test in each app selects the Products category and asserts that a legacy null-type product notification is shown.
- Website/customer inbox: `apps/website/src/pages/public/Notifications.vue` — same categorized inbox and response normalization for ordinary users.
- Admin inbox: `apps/admin/src/pages/user/Notifications.vue` — same categorized inbox for staff, with the separate notification management/send page still available. Regression tests cover the inbox in all three apps.
- Shared dashboard navigation includes notification preferences in both Company/Admin apps and exposes the admin send/monitor page only when the current app route exists and the user has the `notifications.send` permission. The Website header unread badge uses `endpoints.notifications.unreadCount` (`/settings/notifications/unread-count`) rather than the obsolete `/api/v1/notifications/unread-count` path.
- When the inbox opens, the first visible notification is selected in the reading pane but is **not** marked as read. A single click selects/opens a row; double-click explicitly marks it read, and the UI only changes read state after the PATCH succeeds.
- All/Unread/Read and saved/custom folder counts are loaded independently from the current message page. Switching folders applies the corresponding server query and must not overwrite unrelated folder counts.
- Category/search filters operate on the currently loaded server page; global category filtering across all pages would require a backend query contract.
- Regression tests in Website, Company and Admin cover paginated rows, legacy null-type categorization, unread-folder query filtering, stable folder counts, single-click vs double-click read semantics, failed read requests, and bulk read-state IDs. Backend tests cover user scoping and read/delete ownership.
- Company preferences: `apps/company/src/pages/user/NotificationPreferences.vue` — route `/notification-preferences`.
- Admin preferences: `apps/admin/src/pages/user/NotificationPreferences.vue` — route `/notification-preferences`.
- Admin management/composition/monitoring: `apps/admin/src/pages/admin/notifications/NotificationManagement.vue` — route `/notification-management`.
- Company/Admin inbox routes and navigation should be verified in each app's router before changing links.

The shared API client lives in `packages/api-client`; use it instead of adding page-specific HTTP clients. For paginated inbox lists, the Company page must call `apiGetPaginated()` from `packages/shared-core/http/apiClient.js`: `apiGet()` unwraps `{ data, meta }` to the inner `data` value and therefore discards pagination metadata. The Company inbox has a regression test for rendering rows from the paginated response (`apps/company/src/pages/user/Notifications.test.js`).

## Inquiry/RFQ notification integration

The Inquiry service dispatches catalog events through `notification.dispatch.service.js` inside the same Prisma transaction as the business change:

- `INQUIRY_PUBLISHED`: when a customer submits a product inquiry immediately, when a company inquiry transitions to OPEN, or when a scheduled SUBMITTED inquiry becomes due. Recipients are companies that own the requested products and STAFF users with `leads.read`.
- `INQUIRY_RESPONSE_RECEIVED`: delivered to the owning customer user or the requesting company when a supplier submits a quote.
- `INQUIRY_STATUS_CHANGED`: delivered to the inquiry owner and companies that have active responses when an inquiry closes, expires, completes, or is cancelled.
- `INQUIRY_RESPONSE_SELECTED`: delivered to the supplier whose quote was selected.
- `INQUIRY_RESPONSE_REJECTED`: delivered when the buyer manually rejects one quote.
- `INQUIRY_RESPONSE_AUTO_REJECTED`: delivered to pending suppliers whose quotes are rejected atomically after another quote is selected.

The dispatcher applies each recipient's channel preferences, persists in-app notifications and queues email deliveries transactionally, and deduplicates event dispatch. SMS remains unavailable. Scheduled publishing and auto-expiry are processed by the backend inquiry lifecycle worker; manual browser verification and live SMTP delivery still require a configured environment.

## Delivery and operational requirements

- The notification event catalog and dispatch service determine which events can be emitted and how channels/preferences are applied.
- Email delivery requires valid SMTP configuration: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, and `SMTP_FROM` as applicable to the deployment configuration.
- A green unit test/build does **not** prove that SMTP credentials or remote mail delivery work. Mark live delivery as `NOT VERIFIED` until tested with a configured environment.
- Do not commit secrets or real recipient data.
- Keep delivery state, provider metadata, retry behavior, and deduplication consistent with the existing Prisma schema and worker.

## Verification checklist for notification changes

1. Inspect `backend/src/modules/notifications/`, `backend/src/modules/admin/admin.routes.js`, app route registration, Prisma models, and all relevant tests.
2. Run targeted backend notification/admin tests.
3. Run the backend test suite and root CI/build commands when feasible.
4. Verify authorization, per-user ownership, preference validation, duplicate/bulk-send behavior, and failure/retry recording.
5. Verify all three frontend apps build if shared API contracts or routes change.
6. If SMTP or a production worker is not available, state explicitly that live delivery was not tested.
7. Update this document and `.ai/WORKLOG.md` when the implementation changes.


## Notification folders (2026-10-25)

The additive migration `20261025130000_notification_folders` introduces admin-managed
folder definitions and notification-to-folder memberships. The fixed system folders
are `INBOX` (دریافتی‌ها) and `SAVED` (ذخیره‌شده‌ها); system folders cannot be
renamed, deactivated, or deleted through the admin API. New notifications are
automatically associated with Inbox by a PostgreSQL trigger, and existing notifications
are backfilled to Inbox by the migration.

Custom folders have a scope of `ALL`, `WEBSITE`, `COMPANY`, or `ADMIN`, and can
be disabled without deleting their memberships. Folder administration is restricted to
`system_settings.manage` and is available at `/notification-folders` in the Admin
app. The API is under `/api/v1/admin/notifications/folders`.

User-facing folder filtering and copy/move membership actions are implemented below.
The development database used for this task has been migrated and verified. For other
environments, follow the reviewed Prisma migration/baseline workflow; do not re-run the
folder migration against a database where it has already been applied.


## User folder actions (2026-10-25)

The user inbox API now exposes `GET /settings/notifications/folders?app=WEBSITE|COMPANY|ADMIN`
and `POST /settings/notifications/:id/folders` with `folderId`, `action` (`copy` or `move`), `app`,
and optional `sourceFolderId`. The service verifies notification ownership, active destination folder,
app scope, and source membership. Copy creates an additional membership; move creates/ensures the
destination membership and removes the selected source membership in a transaction. The three inbox
pages expose folder selection, save-to-SAVED, copy, and move actions. The canonical notification row
and its read state are not duplicated by folder operations.

Verification and environment status:
- GitHub Actions run [40199219352](https://github.com/gameacc2025/martest/actions/runs/40199219352) passed: frontend/shared tests (18/18), backend tests (1149/1149), Prisma Client generation, and production builds for Website, Company, and Admin.
- The user applied the folder migration in the development database after creating a backup. The two system folders were confirmed, with 26 existing notifications associated with INBOX and none with SAVED.
- `prisma migrate diff --from-url "$DATABASE_URL" --to-schema-datamodel prisma/schema.prisma --script` returned an empty migration, and `prisma migrate status` reported `Database schema is up to date!`.
- The user confirmed the folder UI is working. Live copy/move clicks were not independently exercised in this session and remain NOT VERIFIED.
- The Prisma `package.json#prisma` deprecation warning is non-blocking and was not changed as part of this task.


## Inbox interaction update — 2026-10-25

The inbox now filters folders by membership in both the API query and the visible list. Read/unread filtering is server-side to preserve pagination. Website, Company, and Admin provide per-message read/unread and delete controls, page selection checkboxes, bulk read/unread, and bulk delete. The transfer controls are compact in the message toolbar. Bulk operations are authenticated, ownership-scoped, and limited to 100 IDs per request.

Verification: GitHub Actions run [40201945241](https://github.com/gameacc2025/martest/actions/runs/40201945241) passed frontend/shared tests (18/18), backend tests (1156/1156), Prisma Client generation, and production builds for all three frontend apps. Live browser click-through remains for the user to verify after pulling `main`.


## Inbox follow-up — stable counters and double-click read (2026-10-25)

The three inbox pages now fetch independent totals for all notifications and each server-managed folder, instead of deriving the read count from whichever folder is currently selected. Folder badges retain their positions and display zero counts instead of disappearing. Counts are refreshed after read-state, deletion, and folder membership changes.

A single click now only selects a message and opens its reading pane. A double-click marks that message as read. Bulk read/unread now updates visible row state immediately after the server confirms the operation, then refreshes the list and counts.

Verification for this follow-up: frontend tests were updated to assert single-click selection does not mark a message read and double-click does. GitHub Actions validation is pending; live browser interactions remain NOT VERIFIED until tested after syncing the local checkout.


## Folder membership, counts, and read-state UI (2026-10-28)

The Website, Company, and Admin inboxes use server-managed folders scoped by app (\`WEBSITE\`, \`COMPANY\`, \`ADMIN\`). The folder list comes from the notification folders endpoint; each folder's message list is requested with its own \`folderId\`. The inbox, read, and unread views use the existing list API with \`readOnly\`/\`unreadOnly\` filters. Folder totals are fetched separately using a one-row paginated request so changing the active folder does not repurpose the count displayed for other folders.

The inbox also supports selecting messages, bulk read/unread updates, bulk deletion, saving a notification into the SAVED folder, and moving/copying a notification to another eligible folder. The backend must enforce notification ownership by authenticated user and app-scope eligibility for both source and destination folders; client-supplied IDs are not authorization.

Interaction contract:
- A single click selects a message for reading but does not change its read state.
- A double click opens the message and marks it as read.
- The read/unread actions and bulk actions call the backend and refresh counts after success.
- Category and text search filters apply to the currently fetched page (20 items by default), not the entire notification history. Global search/category pagination requires a server-side query contract.
- UI regression tests cover paginated rendering, legacy notifications with null types, stable folder counts when switching folders, double-click read behavior, bulk read state, and failed read requests. Backend unit and route tests cover ownership scoping, bulk ID validation, and the notification API wiring.

Do not claim a browser E2E run passed unless a completed Playwright job explicitly reports success. Unit tests and the CI browser job are separate evidence.
