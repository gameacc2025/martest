# martest — Project Context

_Baseline architecture notes originated 2026-08-08; current-state corrections last reconciled 2026-10-29. Read the final “Current state and audit corrections” section below before relying on older details.

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
- Admin/Company app access is strictly driven by `AccessProfile.type` (STAFF→admin, COMPANY→company). Customer registration intentionally has no AccessProfile; only `CUSTOMER_USER` may use the default Website context, and that fallback never grants panel access or bypasses SUPER_ADMIN app-context checks.

## 4. Backend (`backend/`)
Fastify 4 + Prisma + PostgreSQL. Modular-monolith layout under
`backend/src/modules/<name>/`: `*.controller.js` (HTTP), `*.service.js`
(business logic + Prisma calls), `*.routes.js` (registration, preHandlers),
`*.schemas.js` (JSON Schema, where not inlined in routes).
Modules: admin, auth, addresses, categories, companies, inquiries, notifications,
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
- **Identity**: `User` → `Profile` (1:1, personal info: firstName/lastName/avatar) → optional `AccessProfile` (1:1, app-context: `type` STAFF|COMPANY, `companyId`, `isActive`; CUSTOMER defaults to Website without an AccessProfile) → `UserRole`→`Role`→`RolePermission`→`Permission`.
- **Customer addresses**: `Address` records are owned by `userId`; all address APIs scope reads/writes to the authenticated user. A partial unique PostgreSQL index enforces at most one default address per user.
- **Future B2C commerce**: Cart, Checkout, Orders, and Wishlist remain dormant by frozen AD-4. Their page/store files may remain for future work but must not be routed or exposed through active product/profile controls until the architecture decision changes.
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
in every `*.routes.js`). SUPER_ADMIN (or a `'*'` in `permissions[]`) may bypass permission checks only after app-context checks; it never bypasses `requireAccessType`. Frontend: `@telecom/permissions` (string constants,
single source of truth) + `usePermissions().can()/canAny()` composable
(reads `auth.permissions` from the Pinia store) — same SUPER_ADMIN bypass
mirrored client-side for UI gating (server is still the enforcement
boundary; client-side checks are UX-only).
Company-level rate limiting/quotas (distinct from RBAC): `company-rule.service.js`
enforces `CompanyLimit` rows (e.g. max open RFQs, max active/daily/monthly
responses) — "no configured limit row" means unlimited (opt-in quotas, not
default-deny).

## 10. Testing
**Backend**: Node's built-in `node:test` runner with co-located `*.test.js` files. Run `npm test --prefix backend` or `pnpm --dir backend test`. Coverage includes auth/RBAC, products and price snapshots, inquiry lifecycle/quotas/responses, notification inbox/delivery, address ownership/default invariants, payment callback/retry idempotency, refresh-token uniqueness, and handoff context checks. Tests mock Prisma/provider boundaries unless specifically running the disposable runtime workflow.
**Frontend**: Vitest projects are configured for shared packages and all three apps. Website coverage includes auth-store profile response normalization and the pure six-month price-history transformation; company/admin and shared packages have their own regression tests. Root command: `pnpm test`.
**Browser E2E**: Playwright smoke tests are committed in `e2e/` and run through `.github/workflows/runtime-validation.yml`; the owner explicitly instructed not to block further work waiting for live browser execution. Never claim E2E passed unless the workflow result is observed.

## 11. Docker / development
`docker-compose.yml` (production) and `docker-compose.dev.yml` (development)
define PostgreSQL, backend and the three frontend panels. Root `.env.example`
holds the PostgreSQL password and browser-facing Vite panel origins;
`backend/.env.example` is the source for backend secrets/provider settings.
The backend runtime image includes Prisma CLI and OpenSSL because startup runs
`prisma migrate deploy` before seed and Fastify startup. Do not depend on an
implicit `npx` network download in production.

## 12. Important business rules
- Admin/Company app access is strictly driven by `AccessProfile.type`; SUPER_ADMIN wildcard permissions never bypass the context boundary. Customer registration intentionally has no AccessProfile; only `CUSTOMER_USER` can use the default Website context, never Admin/Company.
- Cart / Checkout / Orders / Wishlist are dormant future B2C pages under frozen AD-4; do not route or expose their controls.
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
Backend and frontend regression coverage now spans the main auth, product,
inquiry, notification, profile, price-history and address contracts. Newest
test additions have been committed to main; their completed CI result must be
checked through the validation PR before claiming they pass. Browser E2E is
kept as automated coverage but is not a blocker per owner instruction. Current
work status is tracked in `.ai/current-task.md` and `.ai/WORKLOG.md`.

## 15. Known issues / technical debt
- Two parallel HTTP client implementations (`packages/api-client` vs `packages/shared-core/http`), both actively imported by `packages/auth/store.js` for different exports — needs an intentional decision (consolidate or document why both exist), not a reflexive cleanup.
- `project-structure.txt` at repo root is a 2MB generated file dump — never read it; if it needs regenerating, regenerate, don't cat it into context.
- `packages/api-client` and `packages/shared-core/http` remain two HTTP helper layers; keep their ownership/return-shape contracts documented and covered by tests rather than merging reflexively.
- SMTP delivery cannot be considered verified without real credentials and a test recipient. SMS is not implemented.
- Architecture graph is generated from package manifests and route registration; use `pnpm architecture:graph` to regenerate and `pnpm architecture:check` to detect drift.
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


## 17. Agent workflow and durable project memory (2026-10-25)

- Root `AGENTS.md` is the mandatory first-read policy for every coding agent. `CLAUDE.md` and `.github/copilot-instructions.md` point their respective tools to the same policy.
- `.ai/PROTOCOL.md` defines startup reading, task claims, planning/approval gates, verification, commit/push rules, and handoff requirements.
- `.ai/WORKLOG.md` is the append-only, version-controlled task journal. `.ai/current-task.md` is the active handoff and may be replaced as tasks change; move completed history to WORKLOG first.
- `docs/AI_AGENT_WORKFLOW.md` is the human-facing explanation. `README.md` points new contributors and agents to these files.
- `main` is the intended only long-lived branch. Do not create branches by default; never rewrite history or delete a branch without authorization and safe-integration verification.

## 18. Notifications (2026-10-25)

- User notification routes are registered at `/api/v1/settings/notifications`: list, unread count, mark one/all read, delete, and get/update preferences. Inspect `backend/src/modules/notifications/notification.routes.js` for the authoritative current route contract.
- Admin announcement and delivery monitoring routes are defined in `backend/src/modules/admin/admin.routes.js`; permissions include `notifications.send` and `delivery.view`.
- Website notification inbox is `apps/website/src/pages/public/Notifications.vue`; website, company, and admin each have notification preference pages. Admin management/composition is `apps/admin/src/pages/admin/notifications/NotificationManagement.vue`.
- See `docs/NOTIFICATION_SYSTEM.md` for route inventory, frontend entry points, SMTP requirements, and verification checklist.
- CI/build success does not verify live SMTP credentials/connectivity; record external delivery as NOT VERIFIED until exercised in a configured environment.


## 18. Product authorization contract — 2026-10-26

- Public product catalog endpoints expose only `PUBLISHED` + `PUBLIC` products and omit internal moderation/audit fields.
- COMPANY product writes remain tenant-scoped to the caller's own company; a supplied `companyId` cannot transfer ownership.
- STAFF cross-company operations require the exact permission for that operation, checked in both the route and product service. This includes create (explicit target `companyId`), update/delete, price tiers, image/document actions, and lifecycle actions. STAFF is not treated as COMPANY even if a token carries a `companyId`.
- `isFeatured` is separately privileged: only SUPER_ADMIN or `products.feature` may set it to true or change the existing value. Company/Admin forms hide the control and omit the field when the caller lacks permission.
- STAFF-only workflow actions are guarded in the service as well as the route; CUSTOMER cannot use a stray `companyId` to create or publish products.
- No database schema or migration changes were needed. The contract and regression tests are documented in `docs/API_DOCUMENTATION.md`, `.ai/decisions.md`, and `.ai/WORKLOG.md`.
- Verification baseline: GitHub Actions run [40277836441](https://github.com/gameacc2025/martest/actions/runs/40277836441) passed frontend/shared 19/19 test files, backend 1196/1196 tests, Prisma Client generation, and all three frontend production builds.


## Inquiry completion status (2026-10-26)
- Customer inquiry creation is supported with `Inquiry.buyerUserId`; existing company-owned inquiries continue using `companyId`.
- Normal/sealed/anonymous-sealed visibility is enforced in service response shaping. Supplier users only receive their own response data; drafts and future-scheduled inquiries are hidden from suppliers.
- `INQUIRY_PUBLISHED`, `INQUIRY_RESPONSE_RECEIVED`, and `INQUIRY_STATUS_CHANGED` are dispatched transactionally through the central notification dispatcher.
- Background lifecycle worker processes scheduled publishing and automatic expiry, recording SYSTEM transitions in status history.


## Inquiry response concurrency invariant (2026-10-28)

Response writes and buyer decisions are serialized on the parent `Inquiry` row within the same PostgreSQL transaction. Before reading current inquiry state, response submit/edit/withdraw/decision operations and manual status transitions acquire `SELECT id FROM "Inquiry" WHERE id = $1 FOR UPDATE`. This prevents a stale transaction from committing a pending supplier response after buyer selection closes the inquiry. Keep authorization, ownership, deadline checks, response compare-and-set, and transactional notification dispatch in place; the lock is an additional consistency guarantee, not a replacement.


## Frontend bundling note (2026-10-28)

The shared Vite config uses Rolldown code-splitting groups for framework and PrimeVue dependencies. Keep dashboard page components lazy-loaded. The Website, Company and Admin auth stores are imported statically by their routers because other modules also import them statically; a dynamic import of the same module is ineffective and should not be added as a chunk-splitting workaround.


## Duplicate inquiry response contract (2026-10-28)

A company may have only one `InquiryResponse` per inquiry, enforced by the database unique constraint on `(inquiryId, companyId)`. The service must check for an existing response while holding the parent inquiry row lock and return a stable HTTP 409 `RESPONSE_ALREADY_EXISTS` domain error before attempting another insert. Preserve the database constraint as defense in depth and do not dispatch duplicate response notifications.


## Payment callback concurrency invariant (2026-10-28)

After a provider verifies payment, callbacks for the same owner serialize on the owner row. Re-read the subscription after acquiring that lock. If another callback already committed `ACTIVE` with `paymentVerifiedAt`, return the existing verified result without extending or reactivating it. Continue to require server-to-server provider verification and conditional status/verification updates.


## Quota consumption invariant (2026-10-28)

Usage consumption must validate the active subscription after acquiring its row lock, not rely solely on a pre-lock lookup. Re-query the owner's active subscription and time window after the lock; if it changed, lock and re-check the new active row. If no active subscription remains, reject before aggregation or inserting an `InquiryUsageEvent`.


## RBAC comment accuracy (2026-10-28)

`requireAccessType` is a strict application-context boundary. SUPER_ADMIN/wildcard permission override applies only in STAFF context and must not bypass app-type checks for COMPANY or CUSTOMER. Keep route comments and docs aligned with this invariant.


## Current state and audit corrections — 2026-10-29 (authoritative over older notes)

- Canonical source is `main`; the latest reviewed source commit before this documentation refresh was `384459502d0913350e4920e5aeeb2aef5360e553`. GitHub branch search returned only `main` at the time of review.
- PR #28 is merged. Its production-safe shared UI slice includes semantic design-token aliases, opt-in page primitives, MegaMenu visual updates, regression tests and a porting guide. The uploaded 32-file redesign patch is **not fully ported**.
- Never import the original patch's `USE_MOCK` / `mockData.js` patterns into production pages. Preserve backend APIs, auth guards, RBAC, actual server data, route behavior, loading/error states and real mutations.
- Strict context invariant: SUPER_ADMIN or wildcard permissions do not bypass the STAFF/COMPANY/CUSTOMER application-context boundary. In particular, supplier response create/edit/withdraw/attachment operations require COMPANY context and `inquiries.respond`.
- Inquiry concurrency invariants: parent inquiry row locking serializes response submit/edit/withdraw, buyer decisions and manual status changes; duplicate company/inquiry submissions return 409 `RESPONSE_ALREADY_EXISTS`.
- Payment/quota invariants: payment callbacks re-read subscription state after the owner lock and must not reactivate/extend an already verified ACTIVE subscription; quota consumption revalidates the current active period after locking and fails closed after expiry.
- Notifications derive app/folder scope from authenticated context, not client-supplied app scope. Preserve stable counters, folder membership, bulk/single read state and the double-click-to-read interaction.
- Latest remote CI on the reviewed main commit: CI run `40833114382` passed, migration validation `40833114529` passed. Runtime validation `40833114464` failed at browser smoke after Compose, build/start, service health and migration checks succeeded. Per owner instruction, browser tests are not the next debugging task and must not be reported as passed.
- Live Zarinpal and SMTP remain NOT VERIFIED without staging credentials/controlled delivery. SMS is PARTIALLY IMPLEMENTED: Twilio adapter, delivery-worker processing, paid quota enforcement and unit tests exist, but `notification.dispatch.service.js` explicitly never queues SMS rows; end-to-end event-driven SMS is not wired and live Twilio delivery is NOT VERIFIED. Production deployment and exhaustive route-by-route tenant/IDOR review are not signed off.
- API documentation is reconciled to current implementation at a high level, but exhaustive endpoint/schema/permission documentation is still follow-up work.
- The Graphify MCP workspace could not be queried or updated because no workspace is available/selected for this agent. This does not mean the repository architecture graph is missing: its generated check passed in CI. Re-enable/select a Graphify workspace before claiming a Graphify refresh.
- The frontend contains two API-client implementations (`packages/api-client` and `packages/shared-core/http`). Treat consolidation as a separate architectural decision; do not merge them reflexively.
- B2C Cart/Checkout/Orders/Wishlist remain dormant under the existing frozen architecture decision; do not expose them as active features without revisiting that decision.


## Active UI redesign work — 2026-10-29

- Current focused branch: `feat/website-homepage-redesign-step-1`, based on `main` commit `d91b3961e3c775def84d0efe634a4fa82271b9f4`.
- Website homepage is being visually refined using the already merged shared design system. Existing API calls (`productsApi.list`, `productsStore.getCategories`), route contracts, and loading/error/empty states must remain unchanged.
- Keyboard activation/focus styles are being added to category and product tiles.
- Source-contract tests were added; they guard API/route/state assumptions but do not replace component-level interaction tests. CI run [40839667461](https://github.com/gameacc2025/martest/actions/runs/40839667461) passed frontend/shared tests, backend tests, Prisma generation, architecture graph validation, and all three frontend builds on commit `0d33036dfe8480e0b63279ad42b4bf39787e844e`. Database migration validation was still running at the time of this update.
- Do not proceed to Product Listing until this step's CI test/build results are inspected.


## UI redesign handoff after Step 1 merge — 2026-10-29

- PR #29 is merged at `520d590b51b7d4be49772dd44cc3f5dc96f45351`. Homepage styling now uses shared design-system primitives/tokens; category and product tiles support keyboard activation and visible focus.
- Branch CI [40839895731](https://github.com/gameacc2025/martest/actions/runs/40839895731) and migration validation [40839895740](https://github.com/gameacc2025/martest/actions/runs/40839895740) both passed on the final feature-branch commit before merge. Post-merge main workflows must still be inspected separately.
- Website homepage source-contract tests are source-level guards, not component interaction tests. The initial path-resolution failure was fixed; the corrected tests passed.
- Next page is `apps/website/src/pages/public/ProductListing.vue`. Inspect existing API/store/query/pagination/filter contracts before styling; do not apply the legacy patch wholesale.
- Keep each page port isolated, tested and documented. No browser smoke debugging as the next task.


## Active UI redesign — Step 2 Product Listing (2026-10-29)

- Branch: `feat/website-product-listing-redesign-step-2`, based on main after merged homepage PR #29.
- `ProductListing.vue` is being restyled with the shared design system; API/store data flow, query category initialization/watch, filters, pagination and product-details route must remain intact.
- Product cards now support keyboard activation/focus. Loading/error/empty regions expose appropriate live/accessibility semantics.
- New component tests cover category query params, keyboard navigation, error/empty states and query watcher behavior. CI/build verification is pending.


## UI redesign handoff after Step 2 merge — 2026-10-29

- Product Listing PR #30 merged at `91c64bb1a43553ecb1214b4a50c1bb0efa5f7ac2`.
- Feature-branch CI [40840764762](https://github.com/gameacc2025/martest/actions/runs/40840764762) and migration validation [40840764653](https://github.com/gameacc2025/martest/actions/runs/40840764653) passed. The new component tests cover initial category query params, keyboard navigation, error/empty states and reactive category query updates.
- Product Listing keeps existing store/API calls, route-query semantics, filters, pagination and product-details route.
- Next page is `apps/website/src/pages/public/ProductDetails.vue`; preserve API/store data flow, route ID, inquiry/cart behavior, permissions and loading/not-found/error states.
- Inspect post-merge main CI/migration checks before starting the next page. Browser smoke debugging remains out of scope per owner instruction.


## Active UI redesign — Step 3 Product Details (2026-10-29)

- Branch: `feat/website-product-details-redesign-step-3`.
- Product Details is being aligned to shared design-system tokens for surfaces, text, border, shadow and spacing. Accessible state semantics and selected-gallery-thumbnail `aria-pressed` are being added.
- Preserve `getProductById(route.params.id)`, route ID watcher, product gallery, price tier logic, company-profile route, price-history API, inquiry creation, and the existing authentication plus permission gate for inquiries.
- Component tests cover route-ID load/change, product render, not-found/error, thumbnail selection and inquiry permission gating. CI/build/migration verification pending.


## UI redesign handoff after Step 3 merge — 2026-10-29

- Product Details PR #31 merged at `daf47ff282a2e81162ff0e8e5047337b1973b26e`.
- Feature CI [40841432392](https://github.com/gameacc2025/martest/actions/runs/40841432392), feature migration [40841432249](https://github.com/gameacc2025/martest/actions/runs/40841432249), post-merge CI [40841579985](https://github.com/gameacc2025/martest/actions/runs/40841579985), and post-merge migration [40841579967](https://github.com/gameacc2025/martest/actions/runs/40841579967) all passed.
- Product Details keeps the route-ID watcher, product store API, gallery, price tiers, company profile, price-history API, and inquiry permission gate; component tests cover these boundaries.
- Next UI page is `apps/website/src/pages/public/Categories.vue`; preserve category data, IDs, navigation query and loading/error/empty states.
- Runtime/browser smoke is separate and not claimed green; browser-test debugging is not the next task.
