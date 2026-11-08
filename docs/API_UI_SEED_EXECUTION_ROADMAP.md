# API + UI + Demo Seed Execution Roadmap

**Document ID:** API-UI-SEED-01  
**Status:** IN_PROGRESS — direct-to-main execution; shared website-owned palette consolidation applied, runtime verification pending  
**Updated:** 2026-11-08

## 1. Objective

Deliver the six planned API domains as complete vertical slices. Every domain ships its backend contract, persistence integration, permission enforcement, real UI workflows, deterministic realistic demo data, automated tests, and operator documentation together. UI is not deferred until all APIs are complete.

The first implementation milestone is to make the Website's approved visual language the single source of truth and ensure Admin and Company consume it without divergent token definitions. API-1 begins after the palette contract and its tests are verified.

## 2. Repository facts and constraints

- The six domain database foundations were merged through PR #90 (merge commit d509ade7d1dc452eabaccfa0edd2ef463cd23d94): AuthChallenge/AuditLog, Support, CMS, CRM, Retail, and Finance.
- Do not recreate those models. Inspect the merged Prisma schema and migrations before adding any follow-up schema change.
- Existing schema foundations are not equivalent to implemented APIs or enabled workflows.
- Existing Admin CRM and Support experiences are prototypes in places. Replace sample-only behavior with real API calls as each vertical slice becomes available.
- Stack: Vue 3, Vite, Pinia, PrimeVue 4, Tailwind and JavaScript. Keep the existing API client/fetch wrapper; do not introduce Axios or TypeScript.
- Maintain strict STAFF / COMPANY / CUSTOMER application-context boundaries and server-side authorization.
- B2C Cart / Checkout / Orders / Wishlist and retail payment/payout remain frozen under AD-4 until the owner approves the commercial decisions.
- Finance and retail database foundations may remain inert until their activation gates are approved.
- Keep Persian copy, Vazirmatn, RTL, responsive layouts, light/dark themes and accessible interaction states.
- **Branch policy:** work directly on `main`; do not create feature branches, temporary branches or PRs. Agents may work in isolated detached worktrees/checkouts, but only the coordinator integrates reviewed patches as small commits onto the current `main` head. Never force-push.
- Never use production data as demo data. Demo records must be clearly synthetic and safe for local/development/test environments only.

## 3. Global delivery rules for every module

Each module follows the same small-step sequence:

1. Inspect the domain design, merged Prisma models/enums/migrations, current routes/services, API-client conventions, permissions, screens, tests and seed conventions.
2. Contract: define request/response schemas, stable error codes, pagination/filter rules, ownership scope, state transitions and permission matrix.
3. Persistence: reuse merged models; add a new additive migration only when evidence shows a real schema gap. Never use reset or db push against a persistent database.
4. Backend: implement routes, validation, service/domain rules, persistence, audit/events and notifications where applicable.
5. Security: enforce access context, resource ownership, tenant isolation, least privilege, rate limits and sensitive-field redaction in backend services, not only in UI.
6. API client: add endpoint functions and normalize errors through the existing shared client.
7. UI: build actual list, detail, create/edit, filters, empty/loading/error/success states and responsive interactions in the correct app(s). Do not ship inert controls or hardcoded mock API responses.
8. Demo seed: add a domain-specific deterministic, idempotent seed module with realistic synthetic records and relationships.
9. Tests: unit/service, route/contract, permission/tenant-isolation, seed idempotency and UI component/page regression tests.
10. Docs and handoff: update domain/API/permission/seed docs, worklog and current task. Record exact checks and unverified items.
11. Review and integrate: inspect the full diff, run applicable non-browser checks, then integrate the completed patch as a scoped commit directly onto the latest `main` head. Reapply the patch if main moved; do not create a branch or PR.

A module is not complete if its API exists but the UI is still a prototype, if the UI uses local mock data instead of the real API, if seed data is missing, or if authorization tests are absent.


## 3A. Multi-agent execution and coordination contract

The work is split into bounded agent lanes. Parallelize discovery, contract drafting, isolated implementation and test authoring; serialize integration into `main`.

### Agent lanes

| Lane | Owner | Primary scope | Depends on | Must not edit |
|---|---|---|---|---|
| M0 | Design-system agent | Website-owned token source, shared theme, Admin/Company parity, design-system tests/docs | None; first gate | API/domain behavior |
| API-1 | Auth/Audit agent | AuthChallenge flows, AuditLog service/API, session/security UI, auth-audit seeds | M0 contract; API-1 policy decisions | Support/CMS/CRM/Retail/Finance modules |
| API-2 | Support agent | Ticket lifecycle, queues/SLA, attachments, Admin/Company/Customer support UI, support seeds | Shared API conventions; M0 | Auth core, CMS, CRM, Retail/Finance |
| API-3 | CMS agent | Content/revisions/publication APIs, Admin editor, Website CMS rendering, CMS seeds | Shared media/API conventions; M0 | Auth core, Support, CRM |
| API-4 | CRM agent | Leads/accounts/contacts/pipelines/activities, Admin CRM UI, CRM seeds | Company/User/Inquiry identity contract; M0 | Auth core, Support, CMS |
| API-5 | Retail agent | Inventory, reservations, orders, fulfillment and retail UI/seeds | Explicit commercial approval; AD-4 gate | Payment/payout activation before approval |
| API-6 | Finance agent | Commission, ledger, reconciliation, settlement, finance UI/seeds | Accounting policy approval; API-5 seller/order contract where applicable | Real money movement before provider/legal approval |
| INT | Integration coordinator | Cross-module contracts, shared files, permissions registry, app registration, seed orchestrator, docs index and main integration | All lanes | Do not absorb domain implementation without coordination |

### Safe parallel-work rules

1. At task start every agent reads `AGENTS.md`, `.ai/PROTOCOL.md`, `.ai/UI_SKILLS.md`, `.ai/current-task.md`, latest relevant WORKLOG entries, domain docs, Prisma schema/migrations, route registration, API-client conventions and tests.
2. The coordinator assigns a unique task ID, lane, exact file ownership, allowed dependencies and acceptance tests in `.ai/agent-coordination/ACTIVE.md`. An agent must not edit files owned by another active lane.
3. Agents can investigate and implement in isolated detached worktrees/checkouts pinned to a recorded `main` SHA. Do not create local or remote branches. Agents return a patch/diff plus changed-file list, tests, migration/seed notes and unresolved questions.
4. Only the coordinator integrates patches. Before each integration, fetch latest `main`, inspect changed paths and reapply the patch against the new head. Commit each bounded slice directly to `main`; never force-push.
5. Shared hotspots are coordinator-owned unless explicitly delegated: `backend/src/app.js`, Prisma schema/migrations, permission registry/seed entrypoint, shared API client exports, package manifests, global route/menu registration, global design tokens and global test setup.
6. Domain agents own their module directory, domain-specific API-client module, domain UI pages/components, domain seed module and domain tests. They request coordinator integration for shared registries and cross-domain schema edits.
7. No two agents may update the same file concurrently. A WORKLOG claim is advisory, not a filesystem lock. If overlap is unavoidable, pause one lane and let the coordinator sequence the change.
8. API contracts are frozen before UI integration: route/method, schema, response envelope, error codes, permission key, ownership scope, pagination/filter semantics and state transitions are documented in the domain contract.
9. Every agent appends a factual WORKLOG entry and updates its task handoff. The coordinator updates ACTIVE.md and current-task.md after integration.
10. If a lane is blocked by an unresolved business/security decision, it may complete discovery, contract proposals and tests that do not assume the decision; it must not silently invent policy.

### Required agent handoff

Each agent returns:
- Task ID, lane, base `main` SHA and current status.
- Exact files changed and files intentionally not changed.
- Domain contract: endpoints, validation, response/error shapes, permissions and ownership rules.
- Prisma models/enums used; exact migration requirement (or `NONE`).
- Seed module, fixture scenarios, idempotency strategy and production guard.
- Tests run with exact commands/results; `NOT RUN` with reason for unavailable checks.
- Security review: tenant isolation, STAFF/COMPANY/CUSTOMER boundaries, sensitive data redaction, rate limits and audit coverage.
- Remaining risks, decisions needed and integration instructions.

### Shared-file integration order

1. M0 tokens/theme and design-system tests.
2. Shared API conventions and permission naming contract (coordinator).
3. Domain backend/service/routes and route tests.
4. Domain API-client/store integration.
5. Domain UI and page/component tests.
6. Domain seed module and seed orchestration.
7. Full regression, docs and direct-to-main commit.


## 3B. Realistic synthetic demo-data contract

Every API vertical slice includes believable domain fixtures during implementation; seed data is not a later cleanup task.

- Use plausible telecom-marketplace scenarios: manufacturers/importers/operators, network equipment, RFQs, leads from web forms/trade events/referrals, support tickets with real operational urgency, editorial telecom content, inventory movements and accounting events where approved.
- Never impersonate a real person or create records that could be mistaken for real customers, companies, invoices or financial transactions. Use clearly synthetic names and identifiers such as `DEMO-`, `SYN-` and `example.test` email domains.
- Do not use real credentials, working OTPs, refresh tokens, payment credentials, live SMS/email destinations, real personal phone numbers, production IP addresses or production data. Use reserved documentation IP ranges and provider fakes/test adapters.
- Every domain seed must be deterministic and idempotent: stable unique keys, safe dependency ordering and no duplicate growth on repeated runs.
- Production guard is mandatory. Seed entrypoints must refuse to run in production unless an explicit, reviewed production-safe reference-data mode exists; demo fixtures must never be part of production deploy.
- Fixtures must cover normal, edge, failure and lifecycle states, not only happy-path records. Include multiple companies/users to exercise authorization and tenant isolation.
- Seed relationships must respect real FK constraints and business invariants. No orphan rows, impossible status combinations, fake audit records with invalid actors, or accounting entries that do not balance.
- Use a domain-specific module under `backend/prisma/seeds/<domain>.js`; coordinator owns the global seed orchestrator. Never publish passwords/tokens in repository docs.
- Seed tests must prove idempotency, production refusal, referential integrity and that private fields/internal notes are not exposed by APIs.


## 4. Milestone 0 — Shared palette and dashboard design-system completion

**Scope:** packages/shared-ui, apps/admin, apps/company.

The public Website's current approved palette is the visual authority. `packages/shared-ui/assets/design-system/newtemp-reference.scss` is the shared canonical token layer and must be loaded last by Website, Admin and Company. `apps/website/src/assets/marketplace-theme.scss` is restricted to Website component/layout styling; it must not define root-level brand, surface, typography, radius, shadow or status tokens. Admin and Company must consume the same canonical tokens rather than approximating the Website palette. Never substitute the demo colors from store-template/assets/css/tokens.css.

### Small tasks

- [ ] M0.1 Read the Website's approved light/dark palette in newtemp-reference.scss, marketplace-theme.scss and the supplied reference; record canonical tokens and verify PrimeVue theme.js alignment.
- [ ] M0.2 Audit import order in all three apps and verify newtemp-reference.scss is the final token/visual layer after app-specific styles.
- [ ] M0.3 Search Website, Admin and Company layout, shared dashboard components, page-level scoped styles and PrimeVue overrides for retired/competing hardcoded brand colors.
- [ ] M0.4 Replace only confirmed palette violations with existing semantic tokens; preserve status colors (success/warning/danger/info) as semantic states.
- [ ] M0.5 Align sidebar, active navigation, header, page canvas, cards, tables, inputs, buttons, badges, dialogs, charts, loading/error/empty states and overlays with the exact Website token contract.
- [ ] M0.6 Verify the same brand identity in light and dark modes, including text contrast, focus rings and disabled/loading states.
- [ ] M0.7 Verify Admin and Company remain visually coherent while preserving different navigation and role-specific content.
- [ ] M0.8 Add/update token-contract tests that fail when retired palette values return in dashboard/shared components.
- [ ] M0.9 Update design-system documentation and record static checks. Browser checks remain NOT RUN under the current owner instruction unless separately authorized.

### Progress — 2026-11-08

- Confirmed Admin and Company both load the shared PrimeVue preset and the NewTemp reference layer after the main shared stylesheet.
- Confirmed the owner-approved brand values are already defined in the shared theme; the demo purple/orange palette in store-template is not the dashboard brand source.
- Found an optional legacy refinement mixin containing a retired purple/grey palette. Replaced its hardcoded palette and surface colors with shared semantic tokens so it cannot reintroduce the retired theme if enabled later.
- Added a regression assertion to design-system.test.js for the optional refinement layer.
- Static source verification: retired palette values no longer occur in skill-refinements.scss; Admin/Company import order remains correct. Vue/Sass compilation and Vitest have NOT RUN in this GitHub-only editing session.
- The initial pass is partial. The Website token definitions were subsequently centralized by removing six duplicate root-level token blocks from marketplace-theme.scss; this file is now component/layout styling only. Admin and Company already load the same newtemp-reference.scss final layer.
- Remaining work: full page-level audit, align every remaining page-specific color to semantic tokens, run shared design-system tests/builds, and review visual parity when authorized.
- Extended the M0 cleanup to DashboardSidebar, DashboardHeader, CompanyDashboard and OperationalWorkspace: contrast text, shadows, notices and warning demo labels now consume semantic tokens.
- Static source scan of selected Admin Dashboard, Admin OperationsHub, CompanyDashboard, shared dashboard header/sidebar and OperationalWorkspace found no raw color literals in those audited files after tokenization. Website-specific component CSS may still use literal colors for illustrations/hero art; shared semantic tokens remain the authority for common UI surfaces.

### Acceptance gate

- Both apps load the same approved shared palette and semantic token layer.
- No competing legacy brand palette remains in the audited dashboard shell/shared components.
- No business/API/auth behavior changes are introduced by the styling pass.
- Light/dark, RTL, responsive and keyboard/focus contracts have test coverage.
- Existing shared design-system tests pass; exact commands/results are recorded.

## 5. API-1 — Additional authentication and Audit Log

**Database foundation:** AuthChallenge and AuditLog are already in the merged schema.

### Backend tasks

- [ ] A1.1 Inventory current login, refresh, password reset, phone verification, session and token flows; map existing behavior before changing it.
- [ ] A1.2 Reconcile AuthChallengePurpose/AuthChallengeChannel with required flows. Current enums cover PASSWORD_RESET, PHONE_VERIFICATION and EMAIL_VERIFICATION only; add a LOGIN_MFA purpose through an additive migration if SMS/email second-factor login is approved. Define whether MFA is optional or mandatory by STAFF/COMPANY/CUSTOMER context before enforcement.
- [ ] A1.3 Implement challenge request/verify/consume services; store only hashes of OTPs/tokens and never return secrets.
- [ ] A1.4 Add abuse controls: rate limits, resend cooldown, attempt throttling, generic responses and invalidation rules.
- [ ] A1.5 Reconcile session policy before building device management: RefreshToken currently stores only token hash, userId, expiry and createdAt; login revokes prior refresh tokens by default, while logout-one/logout-all already exist. Decide whether multiple concurrent devices are allowed. If yes, add device/session metadata and change issuance/rotation without weakening token-reuse protection; otherwise present the single active session accurately.
- [ ] A1.6 Implement an AuditLog module/service. The append-only table and database trigger already exist, but no audit module/routes are registered in backend/src/app.js. Capture actor context, target, action, safe before/after metadata, source/IP/user-agent policy and request correlation ID.
- [ ] A1.7 Add staff-only audit search API with date, actor, action, target and result filters; the base seed already defines audit_logs.read, but no route currently consumes it. Redact credentials, OTPs, tokens and sensitive payloads.
- [ ] A1.8 Add only missing granular permissions (for example auth_challenges.manage and audit_logs.export if export is approved) and enforce them in service and route layers; preserve the existing audit_logs.read permission.
- [ ] A1.9 Add security tests: expired/replayed challenge, brute-force throttle, token redaction, cross-context denial, session revocation and immutable audit records.

### UI tasks

- [ ] A1.10 Admin: security event explorer with filters, event detail and safe metadata diff.
- [ ] A1.11 Admin: user session/device inspection and revoke actions with confirmation.
- [ ] A1.12 Company: personal security settings, active sessions and revoke controls.
- [ ] A1.13 Website: complete self-service verification/recovery screens only for flows approved by existing identity policy.
- [ ] A1.14 Add loading, empty, error, rate-limit, expiry and success states; no secret values in UI logs or analytics.

### Seed tasks

- [ ] A1.15 Add backend/prisma/seeds/auth-audit.js: synthetic users/devices, active and revoked sessions, successful/failed security events and challenge lifecycle examples.
- [ ] A1.16 Never seed usable OTPs, raw tokens, passwords or real IP/person data. Use reserved/example values and clearly labelled demo metadata.
- [ ] A1.17 Ensure seed is deterministic, idempotent and disabled in production.


### API-1 discovery notes — 2026-11-08

- AuthChallenge and AuditLog tables, indexes and constraints are already migrated. AuditLog is append-only at the PostgreSQL layer; do not recreate that trigger.
- AuthChallenge currently supports PASSWORD_RESET, PHONE_VERIFICATION and EMAIL_VERIFICATION over SMS/EMAIL. Login MFA is not represented yet.
- RefreshToken has no device name, user-agent, IP or last-used metadata. The current login path revokes prior refresh tokens by default; logout-current-device and logout-all endpoints already exist.
- The base seed already defines audit_logs.read, but backend/src/app.js registers no audit module and the current auth routes expose no challenge request/verify endpoints.
- The above session/MFA policy choices must be resolved in the API-1 contract before schema or login behavior changes; do not silently weaken current token rotation or session revocation.

## 6. API-2 — Support and Ticketing

**Database foundation:** SupportTicket, SupportMessage, SupportAttachment, queues, assignments, status history, categories, SLA policies and events are represented in the merged schema. Confirm exact model names/constraints against Prisma before implementation.

### Backend tasks

- [ ] A2.1 Reconcile the current support domain design with merged schema and existing notification/file infrastructure.
- [ ] A2.2 Implement ticket create/list/detail with requester ownership and company tenant scoping.
- [ ] A2.3 Implement public replies and staff-only internal notes as separate commands.
- [ ] A2.4 Implement private attachment upload/download with ownership, MIME/size checks and safe storage.
- [ ] A2.5 Implement queue/category/SLA policy management for authorized STAFF.
- [ ] A2.6 Implement assignment history, status transition commands and reason validation.
- [ ] A2.7 Implement first-response/resolve SLA calculation, pause/resume rules and due/overdue indicators.
- [ ] A2.8 Connect notifications idempotently; provider failure must not roll back a saved ticket message.
- [ ] A2.9 Add support permissions and exhaustive requester/company/STAFF isolation tests.

### UI tasks

- [ ] A2.10 Admin: operational ticket inbox with queue, status, priority, SLA, assignee and search filters.
- [ ] A2.11 Admin: ticket conversation, internal notes, assignment, status timeline and attachment viewer.
- [ ] A2.12 Company: support center, company ticket list, create ticket and conversation.
- [ ] A2.13 Website: customer ticket list, create ticket and conversation.
- [ ] A2.14 Add unread indicators, attachment progress, retry/error feedback, empty states and mobile conversation layout.
- [ ] A2.15 Replace TicketDeskWorkspace sample-only actions with real API behavior without changing shared visual language.

### Seed tasks

- [ ] A2.16 Add backend/prisma/seeds/support.js: realistic categories, queues, SLA policies, tickets at each lifecycle state, public replies, internal notes, assignments and SLA breaches.
- [ ] A2.17 Ensure internal notes and attachments are never exposed to COMPANY/CUSTOMER fixtures through API serialization.
- [ ] A2.18 Seed records across multiple synthetic companies and customers to exercise tenant-isolation tests.

## 7. API-3 — CMS and Content Management

**Database foundation:** CMS tables and publication/revision constraints are included in the merged schema.

### Backend tasks

- [ ] A3.1 Inventory existing static website content, FAQ, magazine/news pages, banners and upload infrastructure.
- [ ] A3.2 Define content types, slug uniqueness, locale, status, revision and publication-window behavior.
- [ ] A3.3 Implement CRUD for pages, articles, FAQs, banners and content categories.
- [ ] A3.4 Implement draft → review → scheduled/published → archived transitions with audit history.
- [ ] A3.5 Implement revision history, preview tokens and safe media association.
- [ ] A3.6 Implement SEO metadata, canonical URL, robots policy and sitemap integration.
- [ ] A3.7 Implement public read APIs that return only published content and safe fields.
- [ ] A3.8 Add granular CMS permissions and author/editor/reviewer/publisher separation.
- [ ] A3.9 Test slug collision, schedule boundaries, revision restore, preview authorization and public unpublished-content denial.

### UI tasks

- [ ] A3.10 Admin: content dashboard and filtered content list.
- [ ] A3.11 Admin: page/article editor with autosave or explicit save state, validation and preview.
- [ ] A3.12 Admin: FAQ and category management.
- [ ] A3.13 Admin: banner/media management and publication scheduling.
- [ ] A3.14 Website: render CMS-backed FAQ, magazine, article and managed pages from public APIs.
- [ ] A3.15 Add draft/review/published badges, revision comparison and safe preview experience.

### Seed tasks

- [ ] A3.16 Add backend/prisma/seeds/cms.js: Persian telecom equipment articles, FAQ entries, policy/help pages, category descriptions and banner variants.
- [ ] A3.17 Include draft, review, scheduled, published and archived states; only published records appear in public API fixtures.
- [ ] A3.18 Use synthetic authors and non-infringing text/assets; no invented endorsements or unsupported commercial claims.

## 8. API-4 — CRM and Lead Management

**Database foundation:** CRMAccount, CRMContact, Lead, LeadSource, Pipeline, PipelineStage, Opportunity, stage history, activities, tasks, notes and related CRM models are included in the merged schema.

### Backend tasks

- [ ] A4.1 Reconcile CRM domain design and exact Prisma model fields with existing Company/User/Inquiry identities.
- [ ] A4.2 Implement CRM account/contact list, detail, create and update with canonical links to Company/User.
- [ ] A4.3 Implement lead create/list/detail/update, source, score, owner and lifecycle history.
- [ ] A4.4 Implement deduplication suggestions and an audited explicit merge flow; never auto-merge on similar names.
- [ ] A4.5 Implement transactional, idempotent lead conversion to account/contact.
- [ ] A4.6 Implement pipeline/stage management and opportunity CRUD.
- [ ] A4.7 Implement stage-transition commands and immutable stage history.
- [ ] A4.8 Implement activities, notes and tasks with owner, due date, completion and reminders.
- [ ] A4.9 Implement dashboard aggregates with date/timezone and currency-safe aggregation.
- [ ] A4.10 Enforce STAFF-only CRM access, record scope, internal-note privacy and export permissions.
- [ ] A4.11 Test concurrent lead conversion, duplicate prevention, tenant/context denial, stage history and KPI calculations.

### UI tasks

- [ ] A4.12 Admin: lead inbox with source, stage, score, owner and date filters.
- [ ] A4.13 Admin: lead detail with contact data, timeline, notes, tasks and conversion action.
- [ ] A4.14 Admin: CRM pipeline Kanban with keyboard-accessible stage changes.
- [ ] A4.15 Admin: account/contact detail and opportunity management.
- [ ] A4.16 Admin: activities/task agenda and overdue work queue.
- [ ] A4.17 Admin: CRM dashboard with real aggregate APIs and currency-separated values.
- [ ] A4.18 Replace prototype sample arrays with API-client/store integration and real loading/error/empty states.

### Seed tasks

- [ ] A4.19 Add backend/prisma/seeds/crm.js: synthetic telecom leads from website forms, trade events, referrals, inbound calls and RFQ signals.
- [ ] A4.20 Seed accounts linked to existing synthetic Companies where appropriate, plus contacts, opportunities across stages, activities and overdue/upcoming tasks.
- [ ] A4.21 Seed won/lost examples and distinct currencies without mixing them in totals; mark all fixtures as demo data.

## 9. API-5 — Retail inventory and orders

**Activation gate:** schema foundation exists, but workflows remain disabled until commercial decisions are explicitly approved.

### Decision tasks before activation

- [ ] A5.1 Approve eligible products and seller participation rules.
- [ ] A5.2 Approve stock ownership, single-warehouse MVP vs multi-warehouse, reservation expiry and negative-stock policy.
- [ ] A5.3 Approve order acceptance, partial fulfillment, cancellation, returns and refund responsibility.
- [ ] A5.4 Approve pricing, discount funding, shipping, tax and currency rules.
- [ ] A5.5 Approve payment provider, payment capture/refund and seller payout boundaries.
- [ ] A5.6 Confirm AD-4 route/menu freeze changes explicitly before exposing cart/checkout/orders.

### Backend tasks after approval

- [ ] A5.7 Reconcile commercial decisions with Retail/Inventory/Payment/Fulfillment/Returns models and constraints.
- [ ] A5.8 Implement inventory balance and movement services with atomic conditional stock updates.
- [ ] A5.9 Implement expiring stock reservations and release/consume/expire commands.
- [ ] A5.10 Implement checkout/order creation with idempotency and immutable item/address/price snapshots.
- [ ] A5.11 Implement seller-order acceptance, fulfillment, shipment and tracking commands.
- [ ] A5.12 Implement cancellation/return/refund state machines and audit trail.
- [ ] A5.13 Integrate verified payment callbacks and idempotent webhook inbox only after provider approval.
- [ ] A5.14 Add permission, concurrency, inventory invariant and payment-state tests.

### UI tasks after approval

- [ ] A5.15 Admin: inventory overview, adjustments, movement history and low-stock alerts.
- [ ] A5.16 Admin: order operations, seller-order split, payment state and return management.
- [ ] A5.17 Company: stock overview, reservation visibility, order acceptance and fulfillment.
- [ ] A5.18 Website: activate cart/checkout/order tracking only after AD-4 and commercial gates are approved.
- [ ] A5.19 Keep all pre-approval screens clearly disabled or labelled as non-operational preview; no fake checkout success.

### Seed tasks after approval

- [ ] A5.20 Add backend/prisma/seeds/retail.js: synthetic inventory, movements, reservations, orders, seller orders, shipments and return scenarios.
- [ ] A5.21 Include edge fixtures (low stock, expired reservation, partial fulfillment, cancelled order) without creating payable or real payment records.
- [ ] A5.22 Seed payment records only as explicitly simulated/test-provider events and never call a live payment provider.

## 10. API-6 — Accounting, Commission and Settlement

**Activation gate:** schema foundation exists; production accounting behavior requires approved commercial, tax and accounting policies.

### Decision tasks before activation

- [ ] A6.1 Approve legal entity, accounting jurisdiction, fiscal calendar, chart of accounts and currency policy.
- [ ] A6.2 Approve commission basis, rates, seller-funded discounts, fees, refunds and chargeback handling.
- [ ] A6.3 Approve invoice/tax responsibilities and required invoice numbering/retention.
- [ ] A6.4 Approve settlement eligibility, minimums, holds, payout rails and maker-checker roles.
- [ ] A6.5 Approve reconciliation and correction/period-close procedures.

### Backend tasks after approval

- [ ] A6.6 Reconcile Finance schema against approved accounting policy; add no assumed tax/legal rules.
- [ ] A6.7 Implement chart-of-accounts and accounting-period administration.
- [ ] A6.8 Implement balanced double-entry journal posting with same-currency and immutability invariants.
- [ ] A6.9 Implement source-event to journal mapping and idempotent posting.
- [ ] A6.10 Implement commission rule versioning and order-time snapshots.
- [ ] A6.11 Implement seller settlement calculation, request, review, approval and payout workflow.
- [ ] A6.12 Enforce maker-checker separation between settlement approval and payout execution.
- [ ] A6.13 Implement statements, reconciliation, reversal/adjustment and period reports.
- [ ] A6.14 Add accounting invariant, rounding, currency, duplicate-event, authorization and audit tests.

### UI tasks after approval

- [ ] A6.15 Admin: finance overview with separate currency totals and period filters.
- [ ] A6.16 Admin: journal entry list/detail and balanced debit/credit editor.
- [ ] A6.17 Admin: commission rules, settlement review queue, maker-checker approval and payout reconciliation.
- [ ] A6.18 Company: revenue statement, commission breakdown, settlement eligibility and payout history.
- [ ] A6.19 Add export permission, redaction, immutable posted-state UI and clear audit history.

### Seed tasks after approval

- [ ] A6.20 Add backend/prisma/seeds/finance.js: synthetic chart of accounts, balanced journal entries, commission snapshots, settlement requests and payout outcomes.
- [ ] A6.21 Include paid, pending, held, rejected, failed and reconciled cases; ensure every posted entry balances per currency.
- [ ] A6.22 Use only synthetic bank/provider references; never store real account numbers or trigger a real payout.

## 11. Demo seed architecture and safety

- Keep domain seeds separate under backend/prisma/seeds/: auth-audit.js, support.js, cms.js, crm.js, retail.js, and finance.js.
- Keep the existing base seed responsible for foundational roles, permissions, companies, taxonomy and existing marketplace demo data.
- Use deterministic identifiers/unique keys and upsert/createMany-with-skipDuplicates patterns so repeated runs do not duplicate records.
- Create fixtures in dependency order and use explicit relations; do not guess IDs from insertion order.
- Prefer reserved .test email domains, synthetic names, clearly non-routable test phone values and provider references prefixed with DEMO-.
- Never seed raw OTPs, refresh tokens, API keys, passwords, real bank account details or real personal data.
- Guard domain demo seeds with an explicit development/test condition (for example SEED_DEMO_DATA=true plus a non-production environment check). Production seed path must not create demo business records.
- Use realistic Persian telecom marketplace scenarios, product categories, lifecycle states and plausible quantities/amounts, but label all demo records so reports can exclude them.
- Add seed tests for repeatability, referential integrity, cross-company fixture coverage and production guard behavior.
- A successful seed run must print counts by domain without printing secrets or personal data.

## 12. Cross-module dependencies and execution order

1. M0 — shared palette/dashboard completion.
2. API-1 — authentication/security and audit foundation.
3. API-2 — support; reuse notifications and private file infrastructure.
4. API-3 — CMS; connect public website only to published content.
5. API-4 — CRM; integrate with canonical Company/User and optionally link to Inquiry/Ticket.
6. API-5 — retail only after explicit commercial/AD-4 approval.
7. API-6 — finance only after accounting/commission/settlement policy approval; integrate with verified retail/payment events.

Retail and Finance must not be activated merely because their database tables exist. They may be implemented behind disabled feature flags after decisions are approved, but never expose live payment or payout operations prematurely.

## 13. Definition of Done per vertical slice

- API routes, schemas, service/domain logic and API-client methods are implemented.
- Server-side permission, context, tenant and ownership checks are tested.
- Admin/Company/Website surfaces required by the domain use real APIs and preserve loading/error/empty states.
- Domain-specific realistic demo seed is deterministic, idempotent, safe and test-covered.
- Unit/service/route/security/UI regression tests pass, or unavailable checks are explicitly recorded as NOT RUN.
- Documentation, permission matrix, seed instructions and current-task/worklog handoff are updated.
- No unrelated behavior, production data or persistent database is changed.
- Changes are reviewed and committed as a small milestone before the next module begins.

## 14. Immediate next action

Start with M0.1–M0.9. The shared palette contract and app entry-point imports already exist; the first code change must be driven by a source audit that identifies actual legacy-color leaks or missing component coverage. Do not alter palette values just to create visible churn. Once M0 passes, begin API-1 using the merged AuthChallenge/AuditLog foundation.

## 13. Main-branch and completion policy

- Canonical target is `main`. Do not create a new branch or pull request for these tasks.
- Integrate one reviewed vertical slice at a time as a small commit directly to `main`.
- Do not start the next API lane until the current lane's backend, UI, seed, tests and documentation meet its Definition of Done, unless the coordinator explicitly parallelizes independent discovery/contract work.
- A red CI check caused by the change blocks completion. Existing unrelated failures must be identified precisely and documented; do not suppress or weaken tests.
- Do not run migrations on a persistent user database without checking baseline, `prisma migrate status`, backup and the migration runbook. No `db push`, reset or destructive migration.
- A completed source change is not the same as runtime verification. Report commits, tests and unverified items separately.


### Direct-main integration update — 2026-11-08

- Applied the initial shared palette corrections directly to `main`; no PR was merged. Draft PR #91 was closed unmerged after its CI checks failed.
- Removed all six root-level token blocks from Website-only `marketplace-theme.scss`. The Website-specific stylesheet now owns component/layout presentation only.
- Preserved the Website's PrimeVue semantic compatibility values by moving its light/dark `--p-*` and legacy aliases into the canonical shared `newtemp-reference.scss` root tokens. This is important: centralization must not silently discard the Website's existing component colors.
- Updated Website and shared design-system tests to assert that the Website component stylesheet does not redeclare root tokens and that all three apps load the shared final theme.
- Static verification: Website component stylesheet has zero root token blocks; shared theme has one light and one dark root block; Admin, Company and Website entrypoint order is correct; all 62 custom properties used by the shared refinement mixin are defined in shared tokens.
- The earlier PR CI failure details were inspected: database migration validation passed; test-and-build had 23 failing assertions across 9 Website/shared-ui test files; browser smoke failed on existing Website mobile horizontal overflow (383px document at 360px viewport) and a missing storefront selector. The Website palette test failure was updated to match the new shared-token architecture. These failures still require fresh verification; they are not marked fixed by source inspection alone.
- Current state remains IN_PROGRESS. Vitest, Sass/Vue compilation, builds and browser visual review have not been run on the latest main head.
