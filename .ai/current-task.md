# Current Task / Agent Handoff

## Latest task — NOTIFICATIONS-INBOX-DATA-FLOW
- **Status:** DONE — automated regression test, full CI tests, and all three frontend production builds passed.
- **Objective:** Fix the Company Portal notification inbox showing no message rows.
- **Root cause:** `apiGet()` unwraps the paginated `{ data, meta }` API envelope to the inner data array; the component then tried to access `result.data`, so it assigned an empty list.
- **Fix:** `apps/company/src/pages/user/Notifications.vue` now uses `apiGetPaginated()` for the list endpoint. Added `apps/company/src/pages/user/Notifications.test.js` and included the existing Company Vitest project in root `vitest.config.js`.
- **Build-script fix:** Root `package.json` previously used `pnpm run --parallel build:website build:company build:admin`, which selected workspace package scripts and reported that no package had `build:website`. It now invokes the three root build scripts sequentially, and CI confirms all three Vite builds ran successfully.
- **Documentation:** `docs/NOTIFICATION_SYSTEM.md` documents the pagination contract and regression test.
- **Commits:** `74317660ec669e6e220afdcefed989ee43794419` (UI fix), `ad1302acd3bedbf548af038d64a83dd5efd5ebbe` (regression test), `480ba9e860e924f3a38da91e52871328b25183ce` (Vitest project), `750b6eafcab89b9558bad521dd5102e60f475ca3` (build script), `7a83af8a199ae91c763d1d48f43f45cbc2e2287f` (notification docs), `b6f55ebb6ea0d6eb8d80af2978dba68a61015621` (worklog).
- **Verification:** CI run https://github.com/gameacc2025/martest/actions/runs/40176535538 — `success`. Frontend/shared Vitest: 12 test files and 125 tests passed, including the new notification-row rendering regression test. Backend suite: 1,136 passed, 0 failed. Root session-handoff tests passed. Website, Company, and Admin production builds all completed successfully.
- **Not verified:** The user's local browser/runtime was not accessible from this session; local end-to-end rendering against the user's live data is not independently verified.
- **Next action:** Pull `origin/main` in the local Windows checkout, refresh `/notifications`, and restart the Company/backend dev services if they are still running stale code. If the page remains empty after syncing, capture the live list endpoint response and browser console.

## Agent policy note
The repository's English-only communication rule applies to coding agents working through command-line tools; ChatGPT conversation with the user remains in Persian as requested.
