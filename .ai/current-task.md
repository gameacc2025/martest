# Current Task / Agent Handoff

## Active task — NOTIFICATIONS-INBOX-DATA-FLOW
- **Status:** IN_PROGRESS
- **Objective:** Fix the Company Portal notification inbox showing no message rows and keep working until automated checks pass.
- **Root cause found:** `apps/company/src/pages/user/Notifications.vue` calls `apiGet()` for the paginated notifications endpoint. In `packages/shared-core/http/apiClient.js`, `apiGet()` unwraps the standard `{ data, meta }` response to just `data`, so the page then reads `result.data` from an array and assigns an empty list. The backend's `notification.service.js` returns the paginated `{ data, meta }` shape and the canonical client provides `apiGetPaginated()` for exactly this contract.
- **Scope:** Fix the page to use the paginated client; add a component regression test proving server-returned notification rows render; wire the Company app into the root Vitest CI project list if needed; run CI tests/build and inspect results; update docs and worklog with exact outcomes.
- **Files expected:** `apps/company/src/pages/user/Notifications.vue`, new Company app Vitest config/test, root `vitest.config.js`, `.ai/current-task.md`, `.ai/WORKLOG.md`, and notification docs if behavior notes change.
- **Verification required:** Company notification regression test; `pnpm test`; `pnpm build`; backend notification tests if backend behavior is touched; inspect GitHub Actions result. Do not report success until observed.
- **Environment constraint:** This session has GitHub repository tools but no local checkout/terminal for running pnpm directly. Use the repository's CI workflow as an execution environment and inspect its actual run results/logs after commits.
