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
| PATCH | `/:id/read` | Mark one notification as read |
| PATCH | `/read-all` | Mark all notifications as read |
| DELETE | `/:id` | Delete one of the authenticated user's notifications |
| GET | `/preferences` | Read effective preferences, including defaults |
| PATCH | `/preferences` | Batch update preferences by event type and channel |

All routes require authentication. Ownership must be scoped to the authenticated user in service/controller logic; do not trust a user ID supplied by the client.

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
- Company inbox: `apps/company/src/pages/user/Notifications.vue` — email-style inbox with All/Unread/Read folders, event-type categories, search, message list/reading pane, read/delete actions, and pagination. Category/search filters operate on the currently loaded server page; global category filtering across all pages would require a backend query contract.
- Company preferences: `apps/company/src/pages/user/NotificationPreferences.vue` — route `/notification-preferences`.
- Admin preferences: `apps/admin/src/pages/user/NotificationPreferences.vue` — route `/notification-preferences`.
- Admin management/composition/monitoring: `apps/admin/src/pages/admin/notifications/NotificationManagement.vue` — route `/notification-management`.
- Company/Admin inbox routes and navigation should be verified in each app's router before changing links.

The shared API client lives in `packages/api-client`; use it instead of adding page-specific HTTP clients.

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
