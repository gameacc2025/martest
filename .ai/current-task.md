TASK: PKCE cross-app session handoff + memory-only access token (frontend)
STATUS: done — backend landed in the previous session, frontend finished here
CHANGED:
  Backend (earlier): modules/auth/handoff.service.js, auth.routes/schemas/controller
    (POST /auth/handoff, /auth/handoff/redeem), middlewares/originGuard.js,
    ALLOWED_ORIGINS CORS list, Prisma HandoffCode model + migration.
  Frontend (this pass):
    - packages/shared-core/http/tokenMemory.js (access token lives in memory only)
      + both HTTP clients (shared-core/http/apiClient, api-client/apiClient) and
      AuthMiddleware now read it instead of localStorage.
    - packages/auth: sessionHandoff.js rewritten to PKCE helpers, new
      handoffClient.js (mint/redeem), storageKeys (no token key),
      store.js (memory token, tokens bundle persisted without secrets,
      legacy-key wipe, restoreSession(), ensureAuthenticated() now silent-refreshes
      after a reload, setAuthContext exposed), index.js exports.
    - packages/shared-ui/components/auth/{HandoffStart,HandoffCallback}.vue.
    - apps/admin + apps/company: /auth/start and /auth/callback routes,
      main.js boots via restoreSession() (bootstrapSessionFromUrl removed).
    - apps/website: Login.vue mints the code (?app&state&challenge) and sends
      external targets through the panel's /auth/start; router guard keeps the
      login page mounted while a handoff is in flight; main.js restoreSession().
  Final pass:
    - PublicLayout: every link out to company/admin now aims at the panel's
      /auth/start?redirect=... (panelStartUrl helper) instead of a bare deep
      link, which would have bounced to /login with no session.
    - HandoffStart: skips the round trip when this panel already holds a
      session for its own role (restoreSession ran at boot).
    - HandoffCallback: a failed redeem no longer routes to /login (whose only
      job is bouncing back to the website) — it restarts from a fresh /login
      with no stale ?redirect=/auth/callback, so it cannot loop.
TESTS: backend `node --test` 894/894; `node --test packages/auth/sessionHandoff.test.js` 18/18;
  `vite build` OK for website + company + admin (workspace `pnpm install` was needed —
  node_modules had been wiped).
BLOCKERS: none
NEXT: candidates (see project-context.md §15 Known Issues):
  1. Bring inquiry.service.js / product.service.js backend test coverage up from 31%/58%
  2. Start frontend test coverage (currently only packages/auth/sessionHandoff.test.js)
  3. Resolve the two-apiClient question (packages/api-client vs shared-core/http) — see decisions.md
