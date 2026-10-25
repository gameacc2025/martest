# Current Task / Agent Handoff

## Active task — NOTIFICATIONS-INBOX-UX
- **Status:** IN_PROGRESS
- **Date:** 2026-10-25
- **Objective:** Redesign the Company Portal notification inbox as an email-style inbox with folders, category filters, search, a message list, and a reading pane.
- **Scope:** apps/company/src/pages/user/Notifications.vue plus this handoff and .ai/WORKLOG.md. Preserve existing API contracts and notification actions; no schema/backend changes.
- **Observed behavior:** The current Company inbox renders a basic vertical list. The user reports that the unread count is visible but the page does not provide a useful message-browsing experience. Backend notification records include type, title, message, isRead, and createdAt.
- **Plan:** Inspect current page/API/event catalog; build a responsive email-style layout with All, Unread, Read folders, event-based categories, search, selected-message reading pane, mark-read, mark-all-read, delete, and pagination while keeping Persian UI text and current design tokens.
- **Verification plan:** Review the updated source and run Company Portal build/tests if a local checkout is available. GitHub-only edits cannot establish a local build result; mark checks NOT RUN if not executed.
- **Push policy:** User requested the implementation in the current project workflow; write scoped commits directly to remote main using the connected GitHub repository tools, then re-fetch the committed file.
- **Next action:** Implement and review the Company Portal inbox UI, then record exact verification and commit SHA.

## Latest completed task
- **ID:** AGENT-ENGLISH-COMMUNICATION
- **Status:** DONE — the repository policy for coding agents is recorded on remote main.
- **Note:** This repository rule applies to coding agents; it does not change the language of the user's conversation with ChatGPT.
