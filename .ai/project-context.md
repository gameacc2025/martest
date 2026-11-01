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


## Active UI redesign — Step 4 Categories (2026-10-29)

- Branch: `feat/website-categories-redesign-step-4`.
- Categories page uses shared design tokens and responsive grid/cards; explicit empty state and accessible loading/error states are added.
- Preserve `productsStore.getCategories()`, category data fields/IDs, and `router.push({ name: 'products', query: { category: categoryId } })`.
- Component tests cover live rendering, route/query behavior, loading, empty and error states. CI/build/migration verification pending.


## UI redesign handoff after Step 4 merge — 2026-10-29

- Categories PR #32 merged at `50745aa1c83bfb01fe6a7db5cb87c8f33af7b178`.
- Feature CI [40842352640](https://github.com/gameacc2025/martest/actions/runs/40842352640), migration [40842352602](https://github.com/gameacc2025/martest/actions/runs/40842352602), post-merge CI [40842534524](https://github.com/gameacc2025/martest/actions/runs/40842534524), and post-merge migration [40842534511](https://github.com/gameacc2025/martest/actions/runs/40842534511) passed.
- Categories preserves `productsStore.getCategories()` and the category-ID query contract to the products route. Empty/loading/error states and route navigation are covered by component tests.
- Next UI page: `apps/website/src/pages/public/SearchResults.vue`; preserve query parsing, API parameters, result rendering and product-detail navigation.


## Current page-contract findings — 2026-10-29

- The routed Website `CompanyProfile.vue` references `productsStore.getProductsByCompany` and `companyStore.getCompanyReviews/isFollowing/followCompany/unfollowCompany`, which were not found among current store exports. Verify backend route/service support and define the actual contract before redesigning this page; do not create mock implementations or assume endpoints.
- `apps/website/src/pages/public/Companies.vue` is not registered in the current website router and references a missing CompanyCard component path plus store methods not exported by the current website company store. Treat it as an orphaned/incomplete feature until route/API intent is confirmed.
- About Us PR #34 merged at `503bbe8af65e1b787a64a7d53aa50ff9bba3bf7f`. It uses the existing published-products API and removes unverified hardcoded statistics/team/partner claims.
- About Us feature and post-merge CI/migration validation passed: feature CI `40882370960`, migration `40882371076`, post-merge CI `40882547737`, post-merge migration `40882547667`. Runtime validation `40882371017` was still running at last check.


## Company Profile contract resolution in progress — 2026-10-29

- Backend `GET /companies/:id` and `GET /companies/:id/products` are authenticated and context/permission gated; they are not public company-profile endpoints.
- The public `GET /products` catalog explicitly supports `companyId` filtering and clamps anonymous/public results to `PUBLISHED + PUBLIC`; its public product select includes company id/name/type only.
- Branch `fix/website-company-profile-api-contract-step-7` adapts the routed public Company Profile page to that supported public catalog contract, removing unsupported review/follow features instead of inventing endpoints. Regression tests and CI/migration validation are pending.
- This avoids exposing private company data or bypassing company route authorization.


## Company directory contract finding — 2026-10-29

- `apps/website/src/pages/public/Companies.vue` is not registered in the Website router. It imports a `CompanyCard.vue` path absent from the current Git tree and calls `getFeaturedCompanies/followCompany/unfollowCompany`, which are not exported from the current website company store.
- Backend `GET /companies` is explicitly restricted to STAFF context with `companies.read`; it must not be made public by merely changing frontend routing.
- Step 7 PR #35 merged as `59c9dc201e6bd896a7a1ca5e599d9b4f31426659`. Company Profile now uses the existing public catalog query filtered by companyId; only PUBLISHED + PUBLIC products and public company id/name/type are rendered. Feature and post-merge CI/migration checks passed.
- Next decision: either keep the directory unrouted if no public directory is intended, or design a separate public-safe endpoint with allowlisted fields and tests before exposing it.


## FAQ and Companies directory status — 2026-10-29

- The Companies directory is intentionally kept unrouted/dormant: backend `GET /companies` requires STAFF context and `companies.read`; no public-safe directory endpoint is currently defined. Do not expose it through a frontend-only route.
- FAQ redesign branch `feat/website-faq-redesign-step-9` updates help content to the actual B2B inquiry permission/subscription flow and product publication process. It removes unsupported promises about installment purchases, returns, order tracking and direct seller contact.
- Runtime validation failures on Search Results (`40881262762`), About Us (`40882371017`) and Company Profile (`40883463183`) all occurred at the browser-smoke step. Per owner instruction, browser smoke is not the next debugging task.


## Inquiry AccessProfile boundary correction — 2026-10-30

- Customer registration intentionally creates no AccessProfile. Its JWT therefore carries `accessType: null`, `companyId: null`, and role `CUSTOMER_USER`; central `requireAccessType('CUSTOMER')` recognizes only this exact fallback.
- Inquiry service must use the same customer-context rule for buyer ownership, sent-inquiry listing, customer inquiry creation, status cancellation, messages, statistics and response visibility.
- Company ownership is valid only when `accessType === 'COMPANY'`. A stray `companyId` on STAFF/CUSTOMER context is never buyer or supplier identity.
- STAFF-created inquiries on behalf of a company require an explicit target `data.companyId` and create permission; STAFF's own stray `companyId` must not be used implicitly.
- SUPER_ADMIN/wildcard bypasses fine-grained permission checks only; it never bypasses the AccessProfile app-context boundary.


## Inquiry received-scope boundary — 2026-10-30

- scope=received is a supplier/company view and must require AccessProfile.type === COMPANY plus a valid authenticated companyId.
- A STAFF caller with a stale or stray companyId must not be treated as a supplier, even when it has inquiry read permission or SUPER_ADMIN/wildcard permission.
- The inquiry service now enforces this context rule independently of route-level permission checks.


## Inquiry subscription and statistics ownership — 2026-10-30

- AccessProfile-less CUSTOMER_USER tokens have `accessType: null` and are recognized as default Website context by central RBAC. Controller subscription/quota owner resolution must mirror that fallback and use authenticated `caller.id` as ownerType=user.
- Quota endpoint is limited to COMPANY/CUSTOMER contexts; STAFF cannot inspect company quota through a stray companyId.
- Inquiry statistics derive company ownership only from COMPANY context. Authorized STAFF with inquiry-read permission receives platform-wide aggregates; STAFF companyId is never used as tenant identity.


## Notification app-context alignment — 2026-10-31

- Notification folder scopes are ADMIN/COMPANY/WEBSITE and must be derived from the authenticated token, never request query/body values.
- Customer registrations have no AccessProfile and are represented by `accessType: null` plus the `CUSTOMER_USER` role. Notification folder scope resolution must mirror `requireAccessType('CUSTOMER')`: this exact fallback grants WEBSITE only and must not apply to SUPER_ADMIN.
- Address endpoints are CUSTOMER-only and all address records are owned by authenticated `userId`; COMPANY and STAFF contexts (including wildcard permission) must not gain customer address access.
- Step 11C inquiry audit merged in PR #40 at `9bac9916de148741fb379ffcdd5aaf44157f4db2`. Step 11D addresses/notifications audit is active on `audit/notification-address-tenant-step-11d`.


## Step 11D merged — addresses and notifications (2026-10-31)

PR #41 merged into main at `9268be23da6c1f0bc0108d3480bdaf0c3f840e53`. Address records are scoped by authenticated userId; route tests protect CUSTOMER_USER Website fallback from COMPANY/STAFF/SUPER_ADMIN context crossover. Notification folder scope resolver now mirrors central RBAC's AccessProfile-less CUSTOMER_USER fallback to WEBSITE only and rejects SUPER_ADMIN fallback. CI and migration checks passed; Runtime validation remains separate.

Step 11E is the remaining backend route inventory: auth, users, admin, settings, categories, roles, permissions, and specification-library.


## Admin password reset app-context boundary — 2026-10-31

- `PATCH /api/v1/auth/users/:id/password` is an administrative operation and must require exact `AccessProfile.type === STAFF` in addition to `users.reset_password`.
- A COMPANY-context user must never gain the admin password-reset capability from a misassigned permission or SUPER_ADMIN/wildcard role. The service must independently verify caller context and permission; route-only enforcement is insufficient.
- Auth service now receives the verified caller for `changeUserPassword` and rejects non-STAFF or unauthorized callers before querying the target account.


## Public taxonomy visibility — 2026-10-31

- Public category and subcategory detail endpoints must return active taxonomy only, matching the public category list. An inactive parent category must not expose its child list.
- Category service supports explicit `activeOnly` lookup options; public controller handlers pass `activeOnly: true`. Staff management list remains able to inspect inactive categories.


- Auth controller password-reset contract: pass `request.user` (verified token context) as the third argument to `authService.changeUserPassword`; controller tests must assert this caller forwarding.


## STAFF user creation result — 2026-10-31

- A STAFF caller with `users.create` and any required role-assignment permission may create a COMPANY user for a target company. Returning the just-created record must not be blocked by the caller's later read-scope filter.
- The service uses a private post-create context lookup tied to the created ID; this does not broaden normal `getUser` access or list scoping.


## Step 11E merged — auth and remaining backend route families (2026-10-31)

PR #42 merged into main at `c92aeff2866353826ec423534b4bc4178e7a57c1`. CI passed 1,368/1,368 tests and migration validation passed. The auth password-reset route/service enforce STAFF context and permission; public category/subcategory detail lookups require ACTIVE; STAFF-created COMPANY users return their created record without widening later user read access.

Next work is the SMS delivery integration audit: reconcile dispatcher and inquiry-message queue paths, confirm paid quota/opt-in/dedupe/transaction guarantees, and keep live Twilio verification separate from unit tests.


## Inquiry-message SMS contract — 2026-10-31

- Generic `notification.dispatch.service` does not emit SMS rows for general notification events. Explicit inquiry-message SMS is queued only when `notifyBySms === true`, recipient preference for `INQUIRY_MESSAGE_RECEIVED/SMS` is enabled, Twilio config is valid, and the sender has paid SMS quota.
- Sender quota owner is the authenticated sender's user or company subscription. The SMS usage event and NotificationDelivery outbox row are created in the same transaction as the inquiry message; quota is consumed at enqueue time, not again on retries.
- Direct user recipients must be ACTIVE. Company SMS preference must be associated with an ACTIVE user whose AccessProfile is type COMPANY, belongs to the recipient company, and has active panel access. Do not select STAFF users merely because they share the Main-company ID.
- The notification worker sends pending SMS through the Twilio adapter. Live provider delivery is not verified until tested with deployment credentials and a controlled recipient.


## SMS delivery recipient scope merged — 2026-10-31

PR #43 merged at `c08b4d319c44541d7a238cba94f0d1b91556ee42`; CI passed 1,373/1,373 backend tests and migration validation passed. Explicit inquiry-message SMS recipient lookup now requires an ACTIVE user; company recipients require ACTIVE COMPANY AccessProfile with matching companyId and active panel access. Sender quota is consumed once at enqueue in the same transaction as the inquiry message and SMS outbox row. Generic event dispatcher SMS remains intentionally unimplemented. Live Twilio is not verified.

Next priority is subscription payment provider/callback/idempotency review.


## Zarinpal amount storage invariant — 2026-10-31

- `InquirySubscription.paymentAmount` is PostgreSQL INTEGER / Prisma Int. Zarinpal receives Rial, so Toman plan prices are multiplied by 10.
- Validate the converted Rial amount as a positive integer no greater than 2,147,483,647 before creating a provider request. Reject overflow before any external payment request to avoid orphaned external authorities or failed persistence.
- Payment activation must continue to rely on server-side Zarinpal verification, never callback query parameters alone. Live credentials/staging transaction remain unverified.


## Zarinpal payment amount validation merged — 2026-10-31

PR #44 merged at `142df69c90dd6f725fc4913a8cd2f1572883e1dc`; CI passed 1,375/1,375 backend tests and migration validation passed. Rial conversion now rejects values outside positive PostgreSQL INTEGER / Prisma Int range before contacting Zarinpal. Server-side callback verification, stored amount, Authority and owner scope remain authoritative. Live provider verification is not complete.

Next work: compare API_DOCUMENTATION.md against registered routes and Swagger/OpenAPI schemas, then update endpoint/auth/permission/schema documentation from source truth.


## API route documentation contract — 2026-10-31

- `docs/API_ROUTE_INVENTORY.md` is the complete method/path/guard index for Fastify route registrations under `/api/v1`.
- `docs/API_DOCUMENTATION.md` links the inventory and summarizes domain contracts.
- `backend/src/utils/api-route-inventory.test.js` checks all literal route declarations against the inventory. Request/response schemas and validation remain authoritative in route/schema source files; never invent them in docs.


## OpenAPI security contract — 2026-10-31

- Swagger routes without a dedicated prose entry default to Bearer JWT security; public routes must be explicitly allow-listed.
- Refresh/logout use the `refreshCookie` cookie scheme and trusted-origin guard. PKCE handoff redeem uses trusted origin + one-time code/verifier, not Bearer auth.
- `openapi-route-docs.js` keys must correspond to registered routes; `openapi-route-docs.test.js` checks against `docs/API_ROUTE_INVENTORY.md`.
- At the 2026-10-31 audit point, 89/149 registered module routes had dedicated prose entries; remaining routes still rely on route source metadata/generic response descriptions.


## OpenAPI route security alignment — 2026-10-31

- PR #46 merged to main at `ea6e787c9b2c6dbe819fb344c22aa7adea33016d`.
- OpenAPI docs remove stale `/orders` and `/settings/preferences` entries; actual notification preferences paths are `/settings/notifications/preferences`.
- `refresh` and `logout` use the `refreshCookie` scheme; PKCE redeem is trusted-origin + one-time code/verifier and is not Bearer-authenticated.
- Undocumented protected operations default to Bearer unless explicitly included in the public route allow-list. Empty `security: []` metadata must not accidentally make a protected route public.
- 89/149 routes have dedicated prose entries; remaining 60 are pending source-backed metadata completion.


## OpenAPI metadata coverage — 2026-10-31

- PR #46 security alignment merged at `ea6e787c9b2c6dbe819fb344c22aa7adea33016d`; PR #47 full route metadata coverage merged at `d3d6012107651af9368c0683ae3126dfc03e5a3f`.
- `openapi-route-docs.js` now has dedicated metadata for all 149 routes in `docs/API_ROUTE_INVENTORY.md`; tests enforce both directions of route-doc/inventory consistency and explicit no-auth metadata for every public route.
- Public category/product/specification-library endpoints are documented as unauthenticated; protected routes require Bearer by default, while refresh/logout use refreshCookie and PKCE redeem remains non-Bearer.
- Detailed request schemas are included where route sources define them. Generic response descriptions remain where concrete response shapes are not source-defined. Next is step 16B: source-backed concrete response schema coverage.


## OpenAPI response contracts — 2026-10-31

- Step 16B is deriving concrete response schemas from actual controller envelopes, service projections and Prisma selects. Address responses use `success(data)` and `ADDRESS_SELECT`; notification endpoints have direct `{data,meta}`, `{count}`, `{success}` and `{success,count}` shapes; folder change returns `{success,action,notificationId,folderId}`.
- Inquiry subscription quota is `{enforced,subscription,quotas,capabilities}`; active plan and subscription projections are documented from `inquiry-subscription.service.js`; payment retry can return `success`, `failed`, `pending` or `cancelled`.
- Admin notification delivery stats contain `total`, `byStatus`, `byChannel`, `recentFailures`; delivery list is paginated. Do not treat raw delivery rows as a finalized public DTO until the API exposes a stable projection.


## OpenAPI response contract coverage — 2026-10-31

- PR #48 merged at `462aad8a518fea47025d116ccb8fc7e095b708b4`; CI passed backend 1,384/1,384 and frontend/shared 18/18; migration passed.
- Address responses reflect `ADDRESS_SELECT` and `{data}` envelopes. Notification list returns `{data,meta}` with folder memberships; count/read/bulk/folder actions match their controller/service payloads. Admin delivery stats expose total, byStatus, byChannel and recentFailures.
- Inquiry plan/quota/subscription response contracts derive from `inquiry-subscription.service.js` and `inquiry-payment.service.js`; POST subscription plan projection is intentionally narrower than the subscription-list projection. Payment retry includes cancelled status.
- Next schema slice: product price/history/activity and inquiry messages/responses/attachments.


## Product and inquiry OpenAPI response contracts — 2026-10-31

- Product price history returns all public retail ProductPriceSnapshot rows in ascending recordedAt order; price Decimal is represented as a JSON string. Product status history includes changedBy user/profile; ProductActivityLog includes actor user/profile.
- Inquiry message list returns up to 500 messages with sender/recipient projections; send adds `smsQueued` and `smsSkippedReason`.
- Inquiry response projections include company, response items with inquiry item/product projections, and attachment metadata. For ANONYMOUS_SEALED buyer views, supplier companyId and nested product companyId are removed; response schema keeps them optional. Buyer response decision returns only `{id,inquiryId,status}`.
- Response attachment `url` is a relative `/uploads/inquiries/responses/...` path.


## Product/inquiry response contracts — merged 2026-10-31

- PR #49 merged at `d79b1908d899fc8569495e8925a00a3a0650080d`; CI backend 1,385/1,385 and frontend/shared 18/18; migration passed.
- Product price snapshots, status history and activity log have concrete schemas. Inquiry messages, responses/items, attachments and decision receipts are documented from actual service projections.
- ANONYMOUS_SEALED buyer responses redact companyId and nested product companyId; schemas do not require them. Buyer decision responses are minimal `{id,inquiryId,status}` receipts. Attachment URLs are relative upload paths.
- Remaining response-contract work: admin subscription/delivery records, inquiry stats/list and product management projections, only where a stable source DTO/projection exists.


## Admin, inquiry dashboard and product management response contracts — 2026-10-31

- Admin subscription list is limited to the newest 100 rows and includes selected plan, company and user projections; manual grant/activate/reject responses include subscription + plan + compact owner projections.
- Notification delivery stats expose `total`, normalized `byStatus`/`byChannel` and at most 10 recent failures. Delivery list returns persisted scalar NotificationDelivery fields and pagination metadata.
- Inquiry dashboard stats are caller-scoped for COMPANY/CUSTOMER and platform-wide for STAFF, with sent/received/response aggregates, success rate and at most five recent records. Inquiry listing uses `{data,meta}` and applies confidentiality/sealed-view redactions to company and response counts.
- Product management listing/detail schemas cover core product data and relation groups (company/category/subcategory/prices/images/documents).


## OpenAPI response schema coverage — step 16D (2026-10-31)

- PR #50 merged at `96a972cb6c663952cb09d6c7a3d9c3d8b90ef2a1`; CI passed 1,386 backend tests and 18 frontend/shared tests; builds and migration validation passed.
- Admin inquiry subscription list/lifecycle actions document actual plan and owner projections; list capped at 100.
- Notification delivery statistics document normalized status/channel maps and 10 recent failures; delivery rows document scalar persisted fields and pagination.
- Inquiry stats/list schemas document caller scoping, recent record caps and sealed/confidential redactions. Product management list/detail schemas document core product and relation groups.
- Route inventory remains 149/149 covered with no duplicate keys. Next pass audits remaining API response envelopes and concrete DTO schemas.


## Company and category API response contracts — 2026-10-31

- Company APIs expose company scalar fields, counts, inquiry limits, custom limits and (detail only) up to ten flattened user summaries. Settings expose inquiryLimit + limits; statistics expose counts and five recent products/orders; company products use paginated product rows with compact company/category/subcategory projections.
- Category APIs expose category records with nested subcategory summaries; subcategory detail includes category and specification template/fields. Public category product lists only published/public products and are paginated.
- Company, category and subcategory DELETE endpoints return 204 without a body.


## Company and category OpenAPI response coverage — 2026-10-31

- PR #51 merged at `095e742d1fbd8b4af954299ff31febd81e0ff732`; CI passed 1,387 backend tests and 18 frontend/shared tests; builds and migration validation passed.
- Company response schemas cover scalar company fields, counts, inquiry/custom limits, up to ten flattened user summaries, settings, dashboard statistics and paginated company products.
- Category/subcategory schemas cover public/staff lists, category detail, subcategory detail with specification template/fields and paginated published/public category products.
- Company/category/subcategory DELETE responses are 204 without bodies. Route inventory remains 149/149 covered.


## Users, RBAC and authentication API response contracts — 2026-10-31

- User APIs expose safe identity fields (`id/email/phone/status/timestamps`), nullable profile/access profile, and roles/permissions. List responses carry role/permission name arrays; detail and mutation responses carry detailed records. Password hashes are never selected.
- Role APIs expose scope, role-permission join projections and assigned-user counts; assignable roles are limited to `id/name/label/scope` and caller's access type. Permission APIs support plain array, grouped `{all,grouped}` and paginated `{data,meta}` modes.
- Auth login/refresh/me/registration/handoff responses exclude refresh tokens from JSON. Refresh token is httpOnly-cookie-only; handoff code is single-use and valid 60 seconds. Customer registration has no AccessProfile; company registration creates inactive COMPANY access pending staff approval.
- Profile settings return safe identity/profile/access/company and role-link data. Admin dashboard exposes aggregate counts, five recent users and twenty pending products; admin settings expose product review threshold.


## User, RBAC and auth OpenAPI response coverage — 2026-10-31

- PR #52 merged at `a58d45f85025ec054d12d46ad9f6f4ba1c08389d`; CI passed 1,388 backend tests and 18 frontend/shared tests; builds and migration validation passed.
- User APIs expose safe identity/profile/access/role/permission projections; no password hashes. Role/permission APIs document role scope, permission links, assignable-role filtering and array/grouped/paginated permission-list modes.
- Auth schemas cover login, refresh, me, customer/company registration and PKCE handoff. Refresh token remains in httpOnly cookie only; handoff code expires in 60 seconds.
- Profile settings, avatar/password operations and admin dashboard/review-threshold settings are documented. Route inventory remains 149/149 covered.


## Admin monitoring and inquiry dashboard response contracts — 2026-10-31

- Admin inquiry subscription list includes subscription scalar fields and exact nested projections: plan id/code/name/price/durationDays; company id/name; user id/phone/email. List is capped at 100 newest rows and first marks elapsed ACTIVE rows EXPIRED.
- Notification delivery stats return total, zero-filled status/channel counts, and up to ten recent failed-delivery projections. Delivery list returns full `NotificationDelivery` rows with pagination metadata; `nextAttemptAt` is non-null per Prisma.
- Inquiry dashboard stats are access-context scoped and return sent/received/responses aggregates, successRate (selected / selected+rejected), and five recent inquiry/response records. Recent inquiry rows omit buyerUserId. Sealed and anonymous-sealed buyer views filter/redact recent responses.
- PR #49 browser runtime validation failure was due to SPA origins failing to serve (`chrome-error://chromewebdata/`, missing #app) while backend CI/build and migration validation passed; keep this as a separate runtime startup investigation.


## OpenAPI response coverage — admin monitoring step 16D (2026-10-31)

- PR #53 merged at `da0478df49eb256fdb5f40c179818a02a6f706fa`.
- `GET /admin/inquiry-subscriptions`: up to 100 newest subscription rows, subscription scalars and exact narrow plan/company/user projections.
- `GET /admin/notifications/delivery-stats`: total, zero-filled status/channel maps and up to ten recent failures. `GET /admin/notifications/deliveries`: full NotificationDelivery scalar row and pagination metadata; nextAttemptAt is required/non-null.
- `GET /inquiries/stats`: access-context scoped sent/received/response aggregates, selected/(selected+rejected) success rate and up to five recent inquiry/response records; recent inquiry excludes buyerUserId and buyer sealed-response redaction is retained.
- Verification: backend 1,389/1,389, frontend/shared 18/18, frontend builds and Prisma migration validation passed. Runtime compose/browser validation was not confirmed at merge time.
- Next audit: replace remaining generic OpenAPI response placeholders only where source projections are stable.


## Core resource OpenAPI response coverage — step 16E (2026-10-31)

- Product management responses follow `productInclude`: full management scalars (including createdByUserId/editsSinceApproval), company/category/subcategory compact projections, price tiers, images, documents and at most ten status-history rows. Public product select intentionally excludes management-only metadata.
- Company list/detail/create/update include Company scalar fields, `_count`, inquiryLimit and CompanyLimit rows as applicable. Detail maps up to ten AccessProfiles to a safe users[] projection; it does not expose password hashes or access token material.
- Inquiry list/detail/create/update/status use distinct caller-facing shapes: buyerUserId is omitted; confidential buyer company may be hidden; list sealed response counts can be absent; detail may hide responses until reveal and anonymize supplier/company IDs in anonymous sealed mode. Inquiry item endpoints include compact product/company projections.
- Admin notification folder operations expose full folder metadata; announcement acceptance returns recipient and channel summary counts under `{data}` with HTTP 202.
- Step 16E CI pending; static route key coverage remains 149/149.


## Core resource response coverage — step 16E merged (2026-10-31)

- PR #54 merged at `8ab9acf25c1380e51fc840fa7d69ea42377971b4`.
- Product management list/detail/create/update contracts reflect `productInclude`: management scalars, company/category/subcategory, price tiers, images, documents, last ten status history. Public catalog response remains separately selected and omits management-only metadata.
- Company list/detail/create/update contracts reflect company service includes, inquiryLimit, limits, counts and up to ten flattened user summaries.
- Inquiry list/detail/create/update/status and item endpoints document caller-shaped data; buyerUserId is omitted, confidential company identity can be hidden, sealed counts may be absent and anonymous sealed supplier identities are redacted.
- Admin notification folder CRUD and announcement receipt contracts added. CI: backend 1,390/1,390; frontend/shared 18/18; builds and Prisma migration validation passed. Runtime validation not confirmed at merge.
- Next: audit remaining generic response placeholders for users/RBAC/categories/settings/company stats/product auxiliary endpoints.


## Company/category/product auxiliary OpenAPI contracts — step 16F (2026-10-31)

- Company settings return inquiryLimit and ordered CompanyLimit records. Company statistics return six aggregate counts and five recent products/five recent inquiries. Company product lists include full product scalar data plus compact category/subcategory/company projections.
- Category public/manage list includes selected subcategory fields; category detail includes full subcategories. Subcategory detail includes category and optional specification template with fields. Category product list returns paginated published/public product records with compact relations.
- Specification-library endpoints expose only id/title/slug/type/defaultUnit/description; search is capped at 50 active rows.
- Product price-tier/image/document and workflow routes now document actual result DTOs. Delete routes for categories, subcategories, tiers, images and documents return 204 with no body.
- Step 16F CI pending; route coverage remains 149/149.


## Company/category/product auxiliary response coverage — step 16F merged (2026-10-31)

- PR #55 merged at `306a82047e3226bf93660598dfcc1b29dcf0e1c5`.
- Company settings return inquiryLimit and ordered CompanyLimit rows; company statistics return six counts and five recent products/inquiries; company product lists include product scalars and compact category/subcategory/company projections.
- Category public/manage/detail and subcategory list/detail responses now include their actual subcategory/template relations. Category product pagination is documented.
- Specification library exposes only id/title/slug/type/defaultUnit/description; search cap 50.
- Product price-tier/image/document/workflow responses are documented; deletes return 204 without body.
- CI: backend 1,391/1,391; frontend/shared 18/18; frontend builds and Prisma migration validation passed. Runtime validation was not confirmed at merge.
- Next: user/RBAC/settings/admin response contracts.


## User/RBAC/settings/admin OpenAPI response coverage — step 16G (2026-10-31)

- User list returns role/permission name arrays; detailed user CRUD/access responses return full safe Role/Permission scalar records. USER_SELECT omits passwordHash and refresh-token relations.
- Role list may be unpaginated or paginated; assignable roles are caller-scope filtered and expose id/name/label/scope. Role response includes compact permission joins and `_count.users`.
- Permission list may be plain, paginated or grouped; permission DTO follows PERMISSION_SELECT.
- Settings profile includes identity/profile/access profile and compact role relation. Password change returns message, avatar upload returns avatarUrl, avatar delete returns message.
- Admin stats includes eight counts, five recent users and twenty pending products with compact related company/category/creator projections. System setting response only exposes productReviewEditThreshold; inquiry monetization setting only exposes subscriptionEnforcement.
- Admin inquiry plan CRUD follows full plan scalar model. Manual subscription actions include full plan and compact company/user projections.
- Step 16G CI pending.


## User/RBAC/settings/admin response contracts — step 16G merged (2026-10-31)

- PR #56 merged at `bebc3192440c9f3b66080a78384d627fdabb4e24`.
- User list uses role/permission name arrays; detail and mutations use safe Role/Permission scalar records. `passwordHash` and refresh-token fields are never exposed.
- Role list is plain or paginated; assignable role picker is filtered by caller scope. Permission list is plain, paginated or grouped. Role response contains compact permission joins and user count.
- Current-user settings profile contains identity/profile/access context and compact role join; password change/avatar operations return message/avatarUrl envelopes.
- Admin stats includes eight counts, five recent users and twenty pending products. System setting only exposes productReviewEditThreshold; inquiry monetization only exposes subscriptionEnforcement. Inquiry plan CRUD and manual subscription action DTOs are documented.
- CI: backend 1,392/1,392; frontend/shared 18/18; builds and Prisma migration validation passed. Runtime validation pending at merge.
- Next: auth/notification/system response audit.


## Auth, notifications and lifecycle response contracts — step 16H (2026-10-31)

- Customer registration returns message/user/profile/null accessProfile/roles in success data; company registration returns message/company/pending user/inactive COMPANY access profile. No role is automatically assigned to the company manager. Neither exposes passwordHash.
- PKCE handoff create returns `{code,expiresIn:60}`; redeem returns access token plus safe auth context. Refresh token is set only in httpOnly cookie, never in response JSON.
- Notification preference GET/PATCH return direct `{data,smsAvailable:false}`. User folder listing returns `{data:[{id,key,name,scope,isSystem,sortOrder}]}`; notification list remains direct `{data,meta}`.
- Company restore/status/verify/logo responses wrap raw company scalars in `success(data)`. Company soft delete returns 204 with no body.
- Product submit-review/approve/reject/publish/hide/archive/restore-draft responses wrap productInclude (company/category/prices/images/documents/latest 10 status-history rows). Product soft delete returns 204 with no body.


## Auth, notification and lifecycle response contracts — step 16H merged (2026-10-31)

- PR #57 merged at `415b6858a9f34235f6cf726a558d76afb5b92af4`. CI passed backend 1,393/1,393 and frontend/shared 18/18; all frontend builds and Prisma migration validation passed. Runtime validation was queued at merge and is not claimed as passed.
- Customer registration returns message/user/profile/null AccessProfile/CUSTOMER_USER role; company registration returns pending company and manager plus inactive COMPANY AccessProfile, with no automatic role assignment. Password hashes are omitted.
- PKCE handoff create returns a 60-second code; redeem returns access token and safe auth context. Refresh token is cookie-only.
- Notification preferences return direct `{data,smsAvailable:false}`; folder list includes isSystem/sortOrder.
- Company restore/status/verify/logo responses return company scalar fields in a success envelope. Company soft delete is 204/no body.
- Product workflow status actions return the managed product include projection; product soft delete is 204/no body.


## Global API error response contracts — step 16I (2026-10-31)

- Central Fastify error handler emits `{error:{code,message,details?}}` for validation/app/Prisma errors. Production 500 messages are generic; development 500 may additionally include debug and stack.
- Prisma P2002 maps to 409; oversized multipart/request payload errors map to 413 through statusCode handling; Fastify rate-limit errors are caught by the central handler and return 429 with the standard `{error:{code:'APP_ERROR',message}}` envelope.
- OpenAPI default responses now document 409, 413, and 429 globally; all three use ErrorResponse. ErrorResponse includes optional dev-only debug/stack fields.


## Global error/status response contract audit — step 16I merged (2026-10-31)

- PR #58 merged at `4ee4dbca6486588af34eda4ed9a22a809a7cb73d`. CI passed backend 1,393/1,393, frontend/shared 18/18 and all frontend builds; Prisma migration validation passed.
- OpenAPI default responses include 409 Conflict, 413 oversized payload/upload and 429 rate limiting. All use the standard ErrorResponse envelope.
- Fastify rate-limit exceptions are caught by the central error handler and normalized to HTTP 429 with `{error:{code:'APP_ERROR',message}}`; do not document the raw plugin Error object.
- ErrorResponse includes optional debug/stack fields only for development-mode 500 errors; production responses omit them.


## Generated OpenAPI runtime route coverage — step 16J (2026-10-31)

- `backend/src/app.test.js` now boots the real Fastify app with the existing Prisma/env mocks and validates generated `/docs/json` against all 149 route inventory rows.
- The test converts Fastify `:param` paths to OpenAPI `{param}` paths, checks every method/path operation exists, verifies bearer/cookie/public security against route metadata, checks global error response statuses, and ensures 204 responses have no content body.


## Generated OpenAPI route verification — step 16J merged (2026-10-31)

- PR #59 merged at `28b9d1035689b099f18cbd711c56bd4b8bae7e3e`. CI passed backend 1,394/1,394 and frontend/shared 18/18; all builds and Prisma migration validation passed.
- Real Fastify `/docs/json` is tested against all 149 API inventory routes, including route method/path, effective bearer/cookie/public security, global error statuses and empty-body 204 responses.
- Root routes mounted at `'/'` appear in Swagger with trailing slash (e.g. `/users/`). `@fastify/swagger` requires `type: 'null'` to model empty 204 bodies; all 13 204 route entries use this form.


## Admin notification delivery query filters — step 16K (2026-10-31)

- GET `/api/v1/admin/notifications/delivery-stats` and GET `/api/v1/admin/notifications/deliveries` accept status (PENDING/SENT/FAILED/SKIPPED), channel (IN_APP/EMAIL/SMS), eventType substring, userId, page and limit. Controller defaults page=1/limit=20; delivery service does not clamp maximum limit.
- Do not document `from`/`to`: the actual admin controller does not pass them to delivery service, even though a stale notification schema helper declares them.
- OpenAPI route docs now declare these query filters; static and generated-spec tests cover the exact accepted fields.


## Auth, notification and resource lifecycle API response rules — 2026-10-31

- Auth refresh token is cookie-only (`httpOnly`); never include refreshToken/passwordHash in JSON contracts. Customer registration has no AccessProfile; company registration creates pending company/user with inactive company AccessProfile.
- Notification preference response is direct `{data,smsAvailable}`; notification list `{data,meta}`; unread count `{count}`; bulk operations `{success,count}`; folder membership `{success,action,notificationId,folderId}`. SMS is currently unavailable; app scope is derived from authenticated token.
- Company restore/status/verify/logo return a company object. Company soft-delete and product soft-delete are HTTP 204 without response body. Product workflow actions return the managed product projection and status history.


## API error contract findings — 2026-10-31

- Central error handler envelope: `{error:{code,message,details?}}`; production 500 is generic `INTERNAL_ERROR`, with debug/stack only in development.
- Auth and RBAC guards often respond directly with `{error:true,code,message}`; some refresh errors are nested. Fastify rate-limit default response is `{statusCode,error,message}`.
- Prisma mapping: P2002→409, P2025→404, P2003/P2014→400; schema validation→400. Thrown payment provider 502/503 errors are currently normalized to generic 500 by the central handler.
- OpenAPI ErrorResponse currently models only the nested central envelope; step 16J must align it to actual variants without weakening production error redaction.


## OpenAPI error response variants — 2026-10-31

- Route docs model 401/403 as `oneOf` central nested ErrorResponse and direct auth/RBAC `{error:true,message,code?}`.
- 500 models central nested errors and direct auth-refresh catch-all `{error:true,message}`. 429 models native Fastify `{statusCode:429,error:'Too Many Requests',message}`.
- Payment-provider service 502/503 exceptions currently become generic 500 through central handler; do not advertise 502/503 until a safe handler change is made and tested.


## Payment provider error response policy — 2026-10-31

- Inquiry subscription request allow-lists provider-unavailable, provider HTTP error, invalid provider response and request rejection as sanitized 502 `{error:{code,message}}`.
- Missing payment provider config returns sanitized 503 on retry verification and callback. Callback verify outages continue to redirect with `payment=pending`.
- Unknown/mismatched errors and invalid provider configuration remain generic 500 through central handler. Never expose raw provider response, merchant ID, authority, config or stack.


## Generated OpenAPI integration guarantees — 2026-11-01

- PR #65 merged at `5cdb8e81acdf679bf60e36c2c36dec118e118156`; CI and migration validation passed. Runtime validation was separate and still running at merge.
- Generated `/docs/json` is integration-tested for actual auth/RBAC error unions, native rate-limit 429, payment provider 502/503 scope and 204 no-content semantics.
- Swagger route-doc response definitions take precedence over generated defaults; handler schemas are fallback for undocumented statuses. OpenAPI 3.0.3 fixed-value constraints use single-value enums, not `const`.
- Inquiry feature rules remain: buyer and supplier participation are permission- and access-context-gated; STAFF is a moderator, not an automatic supplier; sealed and anonymous-sealed visibility must not reveal supplier identities prematurely; quota/subscription limits apply to both buyer inquiries and supplier responses.


## Inquiry monetization integration coverage — 2026-11-01

- `inquiry.service.js` integrates `consumeUsage` for company/user inquiry creation (`INQUIRY_CREATE`), supplier quote submission (`RESPONSE_SUBMIT`) and buyer/supplier internal messages (`INTERNAL_MESSAGE`). SMS is separately metered (`SMS`) and remains enforced even while general enforcement is rollout-disabled.
- Service tests now toggle `SystemSetting.inquiry.subscription_enforcement` and verify the three core usage event types and references, including user-owned Website inquiries and subscription row locking. The subscription service has dedicated tests for expiry, concurrency, limits and quota summaries.
- Business boundary: CUSTOMER users own their own Website inquiries/subscriptions; COMPANY users are company-owned; STAFF is a moderator and must not become a supplier through stray companyId. `inquiries.create` and `inquiries.respond` permissions and access context remain distinct.


## Inquiry response attachment safety — 2026-11-01

- Each supplier response is limited to 10 attachments; files are type/size validated, and failed DB inserts clean up the stored file.
- Uploads now serialize the cap check and DB insert by locking the parent Inquiry row inside a transaction, then re-check response ownership/editability after the lock. The file is written before acquiring the row lock to avoid holding DB locks during disk I/O; if the locked cap/re-check/insert fails, the prewritten file is removed.
- Upload ownership and editability are checked once before consuming the multipart stream and rechecked under the lock to close status-change races.


## Inquiry attachment concurrency invariant — 2026-11-01

- Per-response attachment cap is 10. Concurrent uploads serialize on the parent Inquiry row; under the lock, service re-checks response ownership/editability, counts current attachment rows and inserts metadata in one DB transaction.
- File I/O happens before acquiring the lock. If the transaction rejects due to status/ownership/cap or DB insert failure, the prewritten file is cleaned up. Regression tests verify ordering and cleanup.


## Inquiry message read state — 2026-11-01

- Message reads are scoped to the caller's recipient identity (company or Website user). A list request marks only unread recipient messages included in that response as read; it must not mark messages beyond the returned 500-row result or messages arriving after the query as read.
- Returned message records reflect the readAt timestamp written by the request so the client does not receive stale unread state for messages it just opened.


## Inquiry message read-state regression fix — 2026-11-01

- `listInquiryMessages` marks read only the unread recipient message IDs included in the fetched response (up to the 500-row cap), scoped by inquiry and recipient. New messages arriving after the query and messages outside the response are not marked read.
- Returned messages reflect the readAt timestamp written by the same request. Staff moderation reads do not mutate recipient read state.


## Inquiry message notification contract — 2026-11-01

- `INQUIRY_MESSAGE_RECEIVED` exists in the notification event catalog; defaults are IN_APP and EMAIL enabled, SMS disabled/opt-in. New inquiry messages must dispatch this event in the same transaction as message persistence and internal-message usage consumption.
- Recipient resolution is explicit: active Website buyer user, or active users with `AccessProfile.type=COMPANY` and `isActive=true` for the recipient company. Do not resolve only by companyId because STAFF accounts can share the platform Main-company ID.
- Dedupe key must include both message ID and recipient user ID because notification delivery uniqueness is `(eventType, dedupeKey, channel)` and company conversations can notify multiple members.
- Paid SMS is a separate opt-in, quota-enforced custom delivery path; central notification dispatch does not implement SMS.


## Inquiry message notifications — 2026-11-01

- New internal inquiry messages dispatch `INQUIRY_MESSAGE_RECEIVED` within the message transaction, after `INTERNAL_MESSAGE` usage consumption. Event defaults are IN_APP + EMAIL enabled and SMS disabled/opt-in.
- Recipients: active Website buyer user, or active COMPANY access-profile members for the recipient company. Do not use companyId-only recipient resolution because STAFF users may share the platform Main-company ID.
- Dedupe key includes message ID and recipient user ID. Paid SMS remains a separate custom outbox/quota path.


## Supplier response withdrawal notification — 2026-11-01

- Successful supplier withdrawal of a pending response emits `INQUIRY_RESPONSE_WITHDRAWN` to the inquiry owner. Event channels default to IN_APP + EMAIL, SMS off.
- Template intentionally says a company withdrew its response without naming the supplier, so the event is safe for sealed and anonymous-sealed inquiries. Payload includes inquiryId/responseId only.
- Recipients are active Website buyer user or active COMPANY access-profile members; STAFF accounts sharing a company ID are excluded. Dispatch is transactional and deduped per response/recipient.


## Inquiry response withdrawal notification — 2026-11-01

- Supplier withdrawal of a pending response emits `INQUIRY_RESPONSE_WITHDRAWN` to the inquiry owner, transactionally with the status change. IN_APP/EMAIL default on, SMS off.
- Wording is generic ("one of the companies") and payload includes only inquiryId/responseId, preserving SEALED and ANONYMOUS_SEALED supplier confidentiality.
- Recipient resolution targets active Website buyer user or active COMPANY access-profile members; STAFF accounts sharing company IDs are excluded. Dedupe includes response and recipient IDs.
