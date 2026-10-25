# Current Task / Agent Handoff

## Latest completed task — NOTIFICATIONS-INBOX-UX
- **Status:** PARTIAL — UI implementation committed; runtime/build verification remains outstanding.
- **Objective:** Redesign the Company Portal notification inbox as an email-style inbox.
- **Implementation:** apps/company/src/pages/user/Notifications.vue now includes All/Unread/Read folders, event-type categories, search, a message list, a reading pane, read/delete actions, refresh, and pagination. Persian UI copy and existing API endpoints are preserved.
- **Commit:** a244a9799745b86cf47ae9ce65d7ef6e93632955
- **Documentation:** docs/NOTIFICATION_SYSTEM.md updated to describe the new inbox and its current-page category/search limitation.
- **Verification:** Re-fetched the updated Vue file from GitHub and confirmed expected UI/actions/API endpoint strings are present. Build, tests, and browser interaction are NOT RUN because no local checkout/runtime was available in this session.
- **Known limitation:** Category and text search filtering currently operate on the currently loaded server page (20 items), not all notifications across every page. Full-server filtering requires adding and testing query parameters in the backend API.
- **Next action:** Pull main locally, run the Company Portal build/tests, and manually test folders, search, selected-message reading, read/unread counts, deletion, and pagination. Consider server-side category/search filters as a separate scoped task if needed.

## Agent policy note
The repository's English-only communication rule applies to coding agents working through command-line tools; ChatGPT conversation with the user remains in Persian as requested.
