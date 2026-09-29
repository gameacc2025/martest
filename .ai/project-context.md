# martest — Project Context

_Last full rebuild: 2026-08-08 (initial). Update incrementally via /context-update; only /context-reset does a full rescan._

## 1. Project identity
Telecom B2B marketplace ("telecom-marketplace"). Companies (manufacturers/
importers/telecom operators) list products; buyers send RFQ-style inquiries;
companies respond with priced offers. Three separate frontend apps + one
backend serve this.

## 2. Architecture
pnpm monorepo (`pnpm@9.0.0`, workspaces: `apps/*`, `packages/*`) + a
standalone `backend/` (own package.json, not a pnpm workspace member — has
its own node_modules/lockfile). No TypeScript anywhere — plain JS/CJS
backend, plain JS/ESM frontend. No shared root build tool beyond pnpm
filters (`pnpm --filter @telecom/<app> dev|build`).

## 3. Applications (`apps/*`, Vue 3 + Vite)
- **`apps/website`** (`@telecom/website`) — public storefront, buyer-facing (CUSTOMER).
- **`apps/company`** (`@telecom/company`) — company portal (COMPANY accessProfile).
- **`apps/admin`** (`@telecom/admin`) — internal admin portal, user/role/permission mgmt, product approval, analytics (STAFF accessProfile).
- All three: Vue 3.4, vue-router 4, Vite 8, `@vitejs/plugin-vue`, sass/sass-embedded.
- Admin + Company also use: Pinia (state), PrimeVue 4 + `@primevue/themes` (UI kit), PrimeIcons.
- App selection on login is driven ONLY by `accessProfile.type` (STAFF→admin, COMPANY→company, CUSTOMER→website) — roles never select the app, only permissions within it.

## 4. Backend (`backend/`)
Fastify 4 + Prisma + PostgreSQL. Modular-monolith layout under
`backend/src/modules/<name>/`: `*.controller.js` (HTTP), `*.service.js`
(business logic + Prisma calls), `*.routes.js` (registration, preHandlers),
`*.schemas.js` (JSON Schema, where not inlined in routes).
Modules: admin, auth, categories, companies, inquiries, notifications,
permissions, products, roles, settings, specification-library, users.
Entry: `src/server.js` → `src/app.js` (builds & returns the Fastify
instance — this indirection is what makes `app.test.js` boot-smoke-testable
without a real `.listen()`).
Plugins (`src/plugins/`): `auth.plugin.js` (JWT access+refresh via
`@fastify/jwt` + `@fastify/cookie`), `error-handler.plugin.js` (global error
→ HTTP mapping, Prisma/Zod error translation), `swagger.plugin.js`
(`@fastify/swagger` + swagger-ui, docs sourced from `utils/openapi-route-docs.js`).
Global error handling: `utils/error.js` defines `AppError` + subclasses
(ValidationError 400, NotFoundError 404, UnauthorizedError 401,
ForbiddenError 403, ConflictError 409) and `handlePrismaError`/
`handleZodError` translators, consumed by `error-handler.plugin.js`.

## 5. Frontend architecture / UI system
- Admin & Company: PrimeVue 4 component kit + Tailwind-free (uses PrimeVue's own theming via `@primevue/themes`) + SCSS (`packages/shared-ui/assets/main.scss`).
- `packages/shared-ui` — shared composables (`useSidebarState`, `useTheme`, `useDashboardMenu`), shared config (e.g. `productReservedSpecificationKeys.js`), shared theme.
- Do not introduce Tailwind or a second UI kit — PrimeVue is the established system for admin/company.

## 6. Shared packages (`packages/*`)
- **`@telecom/auth`** — `store.js` (Pinia auth store: `auth.user` / `auth.profile` / `auth.accessProfile` / `auth.roles` / `auth.permissions` / `auth.tokens`, kept as 6 SEPARATE domains, never merged into one `user` blob — mirrors the backend's auth response shape exactly; `auth.tokens` is persisted WITHOUT secrets), `sessionHandoff.js` (PKCE cross-app session handoff — dependency-free helpers: verifier/challenge/state generation, pending-flow storage in the panel tab's sessionStorage, callback parsing; a token NEVER appears in a URL), `handoffClient.js` (the flow's two API calls: mint `POST /auth/handoff`, redeem `POST /auth/handoff/redeem`), `storageKeys.js` (localStorage keys — there is NO token key: the access token lives only in `@telecom/shared-core/http/tokenMemory.js`), plus `sessionHandoff.test.js` (18 dependency-free unit tests, `node --test packages/auth/sessionHandoff.test.js`).
- **`@telecom/permissions`** — `PERMISSIONS` constant object, single source of truth for permission-string constants across all 3 apps (was previously duplicated per-app under `src/config/permissions.js`; now everything re-maps here). SUPER_ADMIN bypasses all checks (handled in the auth store, `roles.includes('SUPER_ADMIN')`-style, mirroring backend `utils/rbac.js`).
- **`@telecom/api-client`** — `apiClient.js`, `endpoints.js`, `errorHandler.js` — HTTP client + centralized endpoint URL builder + error normalization.
- **`@telecom/shared-core`** — ALSO has `http/apiClient.js` and `http/authBridge.js`. **Note: there are two apiClient implementations (`packages/api-client` and `packages/shared-core/http`)** — `auth/store.js` imports from BOTH (`apiGet/apiPost/...` from shared-core/http/apiClient, but `handleApiError`/`endpoints`/`showSessionToast` from api-client). This split is real, not a mistake to "clean up" reflexively — confirm intent before consolidating (see Known Issues §15).
- **`@telecom/vite-config`** — shared Vite config for the 3 apps.

## 7. Database (Prisma / PostgreSQL)
Single `backend/prisma/schema.prisma`, ~26 models. Key domains:
- **Identity**: `User` → `Profile` (1:1, personal info: firstName/lastName/avatar) → `AccessProfile` (1:1, app-context: `type` STAFF|COMPANY, `companyId`, `isActive`) → `UserRole`→`Role`→`RolePermission`→`Permission`.
- **Companies**: `Company`, `CompanyLimit` (key/value quota rows, e.g. `rfq.max_open`), `CompanyInquiryLimit` (legacy-shaped limit fields, being phased toward `CompanyLimit`).
- **Catalog**: `Category`→`Subcategory`, `SpecificationTemplate`/`SpecificationField` (per-category spec forms), `SpecificationLibraryField` (reusable autocomplete field library), `Product` (+`ProductStatusHistory`, `ProductImage`, `ProductDocument`, `ProductPriceTier`).
- **RFQ workflow**: `Inquiry` (+`InquiryStatusHistory`, `InquiryItem`) → `InquiryResponse` (+`InquiryResponseAttachment`, `InquiryResponseItem`).
- **Other**: `RefreshToken`, `Notification`.
- Key enums: `ProductStatus` (DRAFT→PENDING_REVIEW→APPROVED→PUBLISHED, or REJECTED/HIDDEN/ARCHIVED), `InquiryStatus` (DRAFT→SUBMITTED→OPEN→CLOSED/EXPIRED/COMPLETED/CANCELLED), `InquiryResponseStatus` (PENDING→SELECTED/REJECTED/EXPIRED/WITHDRAWN), `CompanyStatus` (PENDING→ACTIVE/INACTIVE/SUSPENDED), `UserStatus` (PENDING→ACTIVE/REJECTED), `CompanyType` (MANUFACTURER/IMPORTER/TELECOM_OPERATOR).

## 8. Authentication
JWT access + refresh tokens via `@fastify/jwt`, refresh token also persisted
in DB (`RefreshToken` model, hashed via SHA-256 — see `backend/src/utils/token.js` `hashRefreshToken`) so refresh tokens are individually revocable.
`backend/src/plugins/auth.plugin.js` decorates `fastify.authenticate`
(access token, sets `request.user = {id, email, roles[], permissions[],
accessType, companyId}`) and `fastify.authenticateRefresh` (refresh token
from an httpOnly cookie, checks DB record exists / not expired / user
ACTIVE). Frontend mirrors this exactly in `packages/auth/store.js` (see §6).
Cross-app session handoff (website → admin/company panel) uses a **PKCE code
flow**, never a token in a URL: panel `/auth/start` (`beginPanelHandoff`) keeps
a random verifier in its own sessionStorage and sends only
`challenge = base64url(SHA-256(verifier))` + `state` to the website login;
`Login.vue` mints a 60s one-time code bound to that challenge
(`POST /auth/handoff`, authenticated) and redirects to
`<panel>/auth/callback#code&state`; the panel redeems code+verifier
(`POST /auth/handoff/redeem`) and applies the context through
`setAuthContext`. Server side: `backend/src/modules/auth/handoff.service.js`
(single-use, hashed at rest, target-app bound, access re-checked at redeem).
Related: cookie-authenticated routes (`/refresh`, `/logout`, `/handoff/redeem`)
are guarded by `middlewares/originGuard.js` + the CORS allow-list
(`ALLOWED_ORIGINS`).

Frontend token storage: the access token exists **in memory only**
(`packages/shared-core/http/tokenMemory.js`, read by both HTTP clients and
`AuthMiddleware`). Web Storage never holds a secret — `store.js` strips
`accessToken` before persisting the `tokens` bundle, and the refresh token
only ever exists as the httpOnly cookie. Because memory dies on reload,
each app boots with `store.js restoreSession()` (silent `/auth/refresh`,
5s cap) before the first router guard runs.

## 9. Authorization / RBAC
Backend: `backend/src/utils/rbac.js` (pure helpers incl. `SUPER_ADMIN_ROLE`
constant + wildcard bypass) + `backend/src/middlewares/rbac.js`
(`requirePermission` / `requireAnyPermission` Fastify preHandlers, used per-route
in every `*.routes.js`). SUPER_ADMIN (or a `'*'` in `permissions[]`) bypasses
every permission check. Frontend: `@telecom/permissions` (string constants,
single source of truth) + `usePermissions().can()/canAny()` composable
(reads `auth.permissions` from the Pinia store) — same SUPER_ADMIN bypass
mirrored client-side for UI gating (server is still the enforcement
boundary; client-side checks are UX-only).
Company-level rate limiting/quotas (distinct from RBAC): `company-rule.service.js`
enforces `CompanyLimit` rows (e.g. max open RFQs, max active/daily/monthly
responses) — "no configured limit row" means unlimited (opt-in quotas, not
default-deny).

## 10. Testing
**Backend**: `node --test` (Node's built-in runner, no Jest/Mocha), test
files co-located as `*.test.js` next to the source file. As of the last
full pass: full coverage on `companies`, `specification-library` modules,
all controllers, pure utils (`pagination`/`success`/`error`/
`openapi-route-docs`), both plugins (`auth.plugin`, `error-handler.plugin`),
plus integration tests (`company.routes.test.js`, `auth.routes.test.js`,
`app.test.js` boot smoke test, `schemas.structural.test.js`). The two
former gaps are now closed: `inquiry.service.js` and `product.service.js`
are both at 100% lines / >92% branches / >96% functions (their test files
were completed in a dedicated pass — `inquiry.service.test.js` 107 tests,
`product.service.test.js` 117 tests; repo total 1062). Run: `cd backend &&
npm test` (fast, no coverage) or `npm run
test:ci` (with 95%/90%/90% line/branch/function coverage gate — see
`package.json`). No CI workflow exists yet (`.ai` previously referenced
`.github/workflows/backend-tests.yml`, but there is no `.github/` directory
in the repo — add one if/when CI is wanted). Every test mocks `config/db`,
so no live DB is needed.
**Frontend**: effectively no test coverage. Only
`packages/auth/sessionHandoff.test.js` exists across all of `apps/*` and
`packages/*`. This is the single biggest testing gap in the repo.

## 11. Docker / development
`docker-compose.yml` (prod-ish) and `docker-compose.dev.yml` (dev), both
define: `postgres`, `backend`, `admin`, `company`, `website` services on a
shared `telecom_net` network, with `postgres_data`/`postgres_data_dev`
volumes. Root `.env.example` documents `JWT_SECRET`/`JWT_EXPIRES_IN` (NOTE:
`backend/.env.example`, not the root one, is authoritative for the backend's
actual required vars — confirm which `.env.example` is current before
trusting either blindly). Backend fails fast at boot if required env vars
are missing (`backend/src/config/env.js`).

## 12. Important business rules
- Application routing is `accessProfile.type`-driven, never role-driven (repeated in 3 places in code — auth store, backend JWT payload shape, and comments in `company.service.js` — treat this as load-bearing, not incidental).
- Company activation (`PENDING`→`ACTIVE` via `company.service.js changeStatus`) is transactional: activates all PENDING users under that company AND seeds default `CompanyLimit`/`CompanyInquiryLimit` rows via upsert-with-empty-update (never overwrites an admin's already-customized limits).
- RFQ/response quotas are opt-in: a company with no `CompanyLimit` row for a given key is unlimited for that key, not blocked.
- Soft-delete pattern on `Company` (`deletedAt`) — deleted companies are 404, not 400, even for SUPER_ADMIN; delete also forces `status: INACTIVE`.
- Product lifecycle is a strict state machine (`DRAFT→PENDING_REVIEW→APPROVED→PUBLISHED`, plus `REJECTED`/`HIDDEN`/`ARCHIVED`/`restore-draft`) enforced via named controller actions (`submitReview`/`approve`/`reject`/`publish`/`hide`/`archive`/`restoreDraft`), not a generic PATCH.

## 13. Architectural constraints (do not violate without explicit approval)
- No TypeScript anywhere in this repo.
- PrimeVue is the UI kit for admin/company — don't introduce Tailwind or a second kit.
- Permission strings live in exactly one place: `@telecom/permissions`. Don't reintroduce per-app copies.
- Auth state stays split into 6 domains (user/profile/accessProfile/roles/permissions/tokens) client-side — mirrors backend JWT payload shape; don't collapse into one blob.
- Backend module boundary: controller → service → Prisma. Don't call Prisma directly from a controller.

## 14. Current development state
Backend test coverage was just brought from ~0 (on several modules) to
comprehensive (1062 tests passing) — see §10. Previous engineer had left the
backend under-tested; that gap is now closed for controllers/utils/
plugins/companies/specification-library/inquiries/products. Frontend has
essentially no automated tests — likely the next major gap to address. No
active feature work in flight as of this writing (see
`.ai/current-task.md`).

## 15. Known issues / technical debt
- Two parallel HTTP client implementations (`packages/api-client` vs `packages/shared-core/http`), both actively imported by `packages/auth/store.js` for different exports — needs an intentional decision (consolidate or document why both exist), not a reflexive cleanup.
- `project-structure.txt` at repo root is a 2MB generated file dump — never read it; if it needs regenerating, regenerate, don't cat it into context.
- Frontend has ~zero test coverage (see §10).
- Root `.env.example` (`JWT_SECRET`) looks stale/inconsistent with `backend/.env.example` (`JWT_ACCESS_SECRET`/`JWT_REFRESH_SECRET`) — verify which is current before relying on either for a fresh setup.
- `BACKEND_AUDIT_REPORT.md` at repo root documents a completed `User`→`Profile`+`AccessProfile` migration; worth a skim if touching identity/auth models, but don't treat it as current-state documentation — it's a point-in-time audit.

## 16. Important recent changes
- Backend: `inquiry.service.js` and `product.service.js` were completed to
  100% line coverage (their pre-existing partial test files were finished:
  file-upload paths write into `backend/uploads/…` and clean up after
  themselves, size-limit paths stream >5/20MB through the real `pipeline`).
  Repo-wide coverage now 97.9% lines / 92.6% branches / 95.9% functions,
  so the `test:ci` gate (85/85/75) is now well under the real baseline and
  could be raised (see `decisions.md`).
- Backend: `companies` module (service/rule-engine/controller) and
  `specification-library` module went from zero test coverage to full
  coverage; all backend controllers gained tests; 3 real bugs found and
  fixed (whitelist-bypass in `company.service.js buildOrderBy` via
  `SORT_FIELDS['__proto__']`, and two `limit=0` falsy-coercion
  inconsistencies in `specification-library.service.js` and
  `backend/src/utils/pagination.js`). Added integration tests
  (`company.routes.test.js`, `auth.routes.test.js`), a full-app boot
  smoke test (`app.test.js`), schema structural tests, coverage
  thresholds (`npm run test:ci`), and GitHub Actions CI
  (`.github/workflows/backend-tests.yml`).
