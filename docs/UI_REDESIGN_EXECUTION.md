# Telecom Marketplace UI Redesign — Execution Log

## Direction

Use the Paces RTL preview as a layout and interaction reference, not as a source of brand colors or application code. Keep the Telecom Marketplace identity (Vazirmatn, RTL, teal primary, deep navy, light/dark theme), Vue 3, PrimeVue 4, current API contracts, router guards, permissions, tenant boundaries, and business workflows.

The public Website remains a marketplace experience; Admin and Company remain separate authenticated workspaces. Future CRM, HR, finance, support, operations, and BI modules are planned information architecture only until their backend, permissions, tests, and workflows exist.

## Completed in this execution

| Area | Work |
|---|---|
| Shared design system | Added reusable page-frame, page-heading, toolbar, panel, KPI, detail-heading, form-section, table, tabs, and status primitives in `packages/shared-ui/assets/design-system/pages.scss`. |
| Shared dashboard header | Refined sticky topbar, search, user menu, and icon-button surfaces while preserving existing actions. |
| Admin workspace shell | Improved workspace background, content width, page gutters, and responsive spacing. |
| Company workspace shell | Applied the same workspace proportions without changing role/permission filtering. |
| Admin dashboard | Applied shared page-heading hierarchy and responsive KPI/analytics grids; all existing API-backed widgets and actions remain. |
| Company dashboard | Applied shared page-heading hierarchy and responsive KPI/pipeline/activity grids; all company-scoped data remains. |
| Public shell | Refined sticky header, navigation active state, search, and mobile navigation surfaces. |
| Admin product list | Refined toolbar, table density, header hierarchy, and responsive behavior. |
| Company product list | Applied the same catalogue-management treatment while preserving company permissions and product workflow. |

## Commits on main

- `4f51dfc` — shared enterprise page primitives
- `09c20f1` — shared dashboard topbar
- `d8cc43d` — Admin workspace spacing
- `69d237a` — Company workspace spacing
- `0af36de` — Admin dashboard
- `4d43c2c` — Company dashboard
- `4a3fc01` — public marketplace shell
- `437291e` — Admin product list
- `f3c1723` — Company product list

## Page migration coverage

The repository inventory contains 69 Vue page files across the three applications. Every active route/page family has either been migrated in this execution or audited as already using the shared Design System.

### Admin / STAFF
- Dashboard and workspace shell
- Users, companies, categories, roles, permissions and system settings
- Product list and editor
- Inquiry list, detail, create and subscription management
- Notification inbox, notification preferences, notification sending/management and folder settings
- Profile, change password, password recovery and root loading gate
- Legacy OrderList visual treatment retained without restoring the removed Orders backend/menu capability

### Company / COMPANY
- Dashboard and workspace shell
- Product list/editor, personal product list, company product view and company settings
- Inquiry list, detail, create and subscription
- Company users and reports
- Notifications, notification preferences, profile, change password, password recovery and root loading gate
- Not-found state continues to use the shared feedback system

### Website / CUSTOMER
- Public shell, home, category listing, product listing/details, search results
- Company directory and company profile
- Login, registration, forgot password, customer profile and addresses
- Customer inquiry list/detail and subscription
- Notification inbox/preferences
- About, Contact, FAQ, Terms and Not Found
- Legacy commerce views (cart, checkout, orders, order details, wishlist) and legacy Products view received token-based styling, but routes must remain governed by the current router/API reality

### Shared UI
- Dashboard shell, sidebar, header, footer and breadcrumb
- Cards, KPI cards, product cards, panels, quick actions, pipeline, welcome banner and system status
- Buttons, badges, inputs, dialogs, page headers, tables, pagination and PrimeVue global surfaces
- Form sections, fields, grids, alerts and action bars
- Loading, skeleton, empty, permission-denied, server-error and not-found states
- Mega menu, review card, auth handoff and shared feedback components

### Remaining work (not page styling)
- Complete local responsive/dark/RTL visual review against actual running apps.
- Run all relevant unit/component tests and app builds locally or via CI after the latest commits.
- Review the latest Runtime Validation workflow result. The test-and-build and database-migration checks passed at the earlier checkpoint; newer commits need their own green run.
- Obtain the Paces source ZIP or accessible URLs if exact page-by-page inspection of the complete 280+ page catalog is required. The live preview index was not fully retrievable, so unobserved pages are not represented as inspected.

## Required process for each remaining page

1. Read the full component, API calls, store dependencies, router names, and permission checks.
2. Keep business logic and API contracts unchanged unless a separate bug is demonstrated.
3. Apply the shared visual hierarchy: page heading, primary action, filter toolbar, content panel, status, and empty/loading/error states.
4. Preserve RTL, keyboard focus, responsive layout, dark mode, and accessible labels.
5. Update or add focused component tests for behavior and states.
6. Run the relevant app tests and build in the local project environment; record actual results (do not infer success from source edits).
7. Commit the page and update this log plus the AI worklog/current-task documents.

## Verification status

The commits above are source edits made through the connected GitHub repository interface. A local pnpm test/build has **not** been run in this execution environment. Do not mark the redesign complete until all inventory sections are migrated and the user/local CI confirms the required tests and builds.


## Additional pages completed

| Area | Work |
|---|---|
| Admin inquiries | Refined inquiry inbox, detail, and multi-step create page surfaces. |
| Company inquiries | Applied the same inbox/detail/create visual hierarchy; response and subscription logic untouched. |
| Admin catalogue | Refined category, company, user, role, and permission management tables. |
| Company users | Refined company-user management table. |
| Company reports | Updated report heading, KPI grid, and tab surfaces. |
| Admin notifications | Refined notification management and fixed-folder settings pages. |
| Website company directory | Aligned company directory heading, filters, and card surfaces. |
| Website commerce | Refined cart, checkout, orders, order details, and wishlist page headings and cards. |
| Shared PrimeVue layer | Unified card, toolbar, table, paginator, dialog, form-control, tag, tab, and message surfaces across all three apps. |

Recent commits include:
- `1a795de` — cross-app PrimeVue surface layer
- `488317f`, `6d5a582`, `eb952db` — Admin inquiry pages
- `7aa435c`, `f047477`, `975c90a` — Company inquiry pages
- `d9f3a79`, `f2d34f0`, `3e801cf`, `7d402ab`, `e7d9057` — Admin management lists
- `c12b9b7` — Company user list
- `030a717` — Company reports
- `785c420`, `47e25b0` — Admin notification tools
- `d3966fb` — Website company directory
- `48942c0`, `197a079`, `06a246b`, `0fd78f4`, `7e66b77` — Website commerce pages

## Next migration batch

- Admin product form, inquiry subscription management, profile/preferences, and remaining notification pages.
- Company product form, company settings, profile/preferences, and notification pages.
- Website authentication, registration, customer profile/address pages, customer inquiry pages, and static content pages.
- Shared product card, dialog, form, empty/loading/error components and remaining dashboard widgets.


## Additional migration batch 2

- Admin and Company product editors: form headers, section surfaces, field hierarchy.
- Admin and Company inquiry subscription pages: subscription/usage panels and form controls.
- Company settings: profile/settings cards and form controls.
- Admin and Company profile pages: responsive account summary and tab surfaces.
- Admin, Company and Website notification inboxes: inbox heading, toolbar, surfaces and mobile actions.
- Admin, Company and Website notification preferences: preference table and settings-card hierarchy.
- Website auth: login, registration and password-recovery surfaces; Admin/Company password-recovery and password-change pages.
- Website customer profile, address management, and inquiry workspace.
- Shared components: Card, Button, Badge, DataTable, FormSection and ProductCard.

Additional commits: product editors 745988d, 1d95149; subscription/settings c90da4c, c4d81f0, bc53c6f; profile/inbox/preferences b8caf91, e6ce2a5, 401a8a7, e597172, 50264a0, 68ce9be, 9f3c909, 692fa9b; auth/security 017ed2f, f24ddc4, b344ca6, c19d7ee, 5dfdca7, 1b9578f, ff339e3; customer account 8677b63, a1f37fa, 99c1308; shared components f02b82c, 16c10d1, a2b1ebd, d8000f2, 89bb83d, fd88bfb.

A markup review caught two commerce page header closing tags after the initial heading conversion; both were corrected in c70fce1 and a0a734a. Build/test verification remains pending.


## Additional migration batch 3

- Company personal products and company products pages aligned to the shared table and page-heading system.
- Admin system settings and the legacy Admin order list received consistent workspace/table surfaces. The order route remains unchanged; its backend availability must be validated separately before exposing it in navigation.
- Website contact, inquiry-subscription, and legacy products catalogue pages received the shared visual hierarchy.
- Admin/Company root loading gates now use accessible status semantics and brand tokens.
- Shared auth handoff, dashboard footer/breadcrumb, and feedback-state components were refined.
- Added disabled, explicitly labelled planned-module entries to the shared Admin/Company sidebar for CRM, finance, HR, procurement, inventory/logistics, support, projects/operations, BI, and integrations/security. These entries have no route or click action and are permission/role scoped. Added a regression test for the roadmap menu contract.

Recent commits: Company product views c3d2339/9946e62; Admin order/settings ca4b483/4f5ce4a; Company dashboard donut fde356c; Website contact/subscription/legacy catalogue 1b7bf37/c0f4d52/84bf494; shared auth/shell/feedback 4962549/eff3cf6/bb1bfb9/7f698b6/78a307d; planned menu 39f42e0/fe74038/025c5bd; app loading gates f67b924/63f9333.


## Additional migration batch 4 — shared component system

- Refined the dashboard panel/KPI/quick-action/inquiry-pipeline/welcome/system-status components to a consistent radius, elevation and responsive hierarchy.
- Refined shared dialog chrome, PageHeader, review cards, form alerts/actions and shared Input.
- Added a rendering test proving planned roadmap items are rendered as disabled non-links (in addition to the navigation-config test).
- Replaced remaining non-brand hard-coded hover colors in legacy Website cart/checkout/order pages with design tokens.

## Page inventory audit

The repository currently contains 69 Vue page files across Admin, Company and Website. The active page families have been migrated or were already using the shared design system before this redesign. The remaining page files are transitional gates/shared-state wrappers and legacy pages; do not invent new backend functionality for them. The execution tracker remains open until component audit, full local tests/builds and CI are green.

Recent shared component commits: DashboardPanel 20fd890, KpiCard 92a7116, QuickActions e5d6db0, InquiryPipeline af954b5, WelcomeBanner 21f3dd9, SystemStatus 030f46b, Dialog 6d9e8a4, PageHeader 61c1800, ReviewCard 925f02e, FormAlert 700a1d2, FormActions 3157c88, Input 8bd9dc7, DashboardSidebar test c64264a. Website token cleanup: ad447c3, 47b21aa, f0905f2.


## Planned navigation coverage update

The shared disabled roadmap section now also includes Calendar/Tasks, Documents/Assets, Organization Communications/Campaigns, Knowledge Center/Content, and Audit/Compliance. All future entries remain non-interactive, have no named route, and are role-scoped. The config test now checks the complete planned domain set.

## CI checkpoint

At commit 6a7cb3efc58b60a04f6de1e57df833263d0a75da, GitHub CI test-and-build completed successfully and Database Migration Validation completed successfully. Runtime Validation (compose-and-browser) was still in progress at the last check. Later menu-only commits require their own CI completion before final sign-off. No local browser test was performed.


## Additional migration batch 5 — consistent list page headers

Added Paces-style title/description hierarchy above the management toolbars for Admin categories, companies, users, roles, permissions, products and inquiries; Company products, inquiries and company users; and the legacy Admin order view. Existing toolbar actions, filters, server pagination, row actions, API calls and permission conditions remain in place.

Commits: Admin category/company/user/role/permission headers c350236, f7110ca, 1dae02f, e2ae56f, 5aaef1b; product/inquiry/order headers 035f82e, 5f23c04, 64641ca; Company product/inquiry/user headers b6dde92, 6ba2592, af2f45a.


## Verification result — commit b5220ea

- GitHub CI / test-and-build: **passed**. This includes the repository unit/component test and all three production app builds.
- Database Migration Validation: **passed**.
- Runtime Validation: **failed** in the existing Playwright smoke suite. Compose configuration, service startup/health, and database migrations all passed; the panel smoke tests then timed out waiting for #app in Website/Company/Admin, and the STAFF auth-flow test also failed. This is recorded as an unresolved runtime-check failure; no root cause has been established and it is not being treated as a visual redesign acceptance test.
- No local browser testing was performed. The successful build proves the current Vue/SCSS source compiles; it does not prove runtime rendering or visual correctness.


## Structural redesign — batch 6 (2026-11-02)

This batch replaces the previous dashboard-only heading treatment with an actual workspace composition change in both authenticated dashboards.

### Admin dashboard
- Replaced the plain page title row with a full-width welcome/command banner using the Telecom navy/teal brand tokens, explanatory context, and primary product-create plus inquiry-management actions.
- Reorganized the operational area into a three-column workspace: quick actions, platform metrics visualization, and service health. At tablet/mobile widths it collapses to two columns and then a single column.
- Kept all existing API-backed KPI values, stats/error/loading states, approval queue, entity lists, product approve/reject handlers, route names and permissions unchanged.

### Company dashboard
- Replaced the plain title row with a company-context welcome banner using the authenticated company identity/status and verified state already present in the auth store.
- Combined the inquiry pipeline and quick actions into a two-column operational workspace; removed the duplicated standalone quick-actions panel.
- Preserved existing company-scoped stats, products, inquiry deadlines, activity feed, score/rank fallback behavior, actions, routes and API calls.

### Commits
- `171ca0a` — structurally redesign Admin dashboard workspace
- `82f6897` — redesign Company dashboard workspace

### Verification
- Source changes committed directly to `main` through the connected GitHub repository.
- Local test/build execution is not available in this connected editing step; these commits are not marked as locally verified. Continue with component coverage and CI checks before sign-off.


## Shared data-table refinement — batch 7 (2026-11-02)

- The shared `DataTable` now reports the actual visible client-side result count (including filters) and the server-provided total in lazy mode.
- Search debounce timers are cleared when the component unmounts.
- Added token-driven PrimeVue table header/body/hover/selected-row/paginator styling, improved mobile toolbar layout, and clearer focus treatment.
- Added `DataTable.test.js` coverage for client counts, lazy server totals and filtered counts.
- Commits: `c0be61b` shared table refinement; `3f3ab5f` table tests.
- CI was triggered by the pushes and is being checked; no local test execution is claimed.


## Product editor, subscriptions and reporting — batch 8 (2026-11-02)

- Admin product editor: replaced the plain title row with a structured editor header, contextual guidance, accessible back action and explicit save-product action; improved section headings, field spacing, PrimeVue input surfaces, technical-spec empty state, price-tier and document surfaces.
- Company product editor: applied the same guided editor hierarchy while preserving company routes and existing save/permission behavior.
- Admin inquiry subscriptions: added a live overview strip for defined plans, pending purchase requests and enforcement state; reorganized the page heading and improved responsive plan form, policy panel and review tables using design tokens.
- Company reports: added an explanatory report header and refined tabs, export actions, KPI/chart spacing and responsive behavior. Export logic and API-derived metrics remain unchanged.
- Commits: `e14505e` Admin inquiry subscription workspace; `d288067` Admin product editor; `18a67c5` Company product editor; `90cf711` Company reports.
- CI for this latest batch is pending; no local tests/builds claimed.


## Admin notification, company catalogue/subscription and customer profile — batch 9 (2026-11-02)

- Admin notification management: clarified the compose-page hierarchy and delivery-status workspace; refined metric tiles and delivery table states with design tokens.
- Company personal-products and company-products views: added distinct page context and descriptions while retaining their existing table, filters and product routes.
- Company inquiry subscription: improved subscription heading, active/pending state surfaces, quota meters and selectable plan cards; payment flow and quota data remain unchanged.
- Website customer profile: replaced the plain heading with an account-context header and responsive profile workspace; retained existing profile actions and account data.
- Commits: `5761ae7` Admin notification management; `eceda9f` Company personal products; `e895213` Company product directory; `f99c289` Company subscription; `77b0f74` Website customer profile.
- CI for the latest source changes is pending; no local tests/builds claimed.


## UI redesign — shared shell, catalog and inquiry batch 10 (2026-11-02)

### Shared authenticated UI
- Rebuilt the shared dashboard page-context header to show route section, route title and breadcrumb as a single responsive component.
- Reworked the shared DataTable surface: toolbar hierarchy, search/column controls, filters, table head/body/selected states, row actions, empty/loading states and paginator now use the Telecom design tokens and have a mobile-specific layout.
- Added a focused PageHeader component test for route metadata and fallback rendering.

### Public marketplace
- Rebuilt the public header's brand lockup into an icon + Telecom Marketplace wordmark and refined search, notification, profile and mobile navigation surfaces.
- Reorganized the public product catalog's heading, filter card, result count, product category marker, image treatment, supplier line and responsive product grid.
- Refined the customer inquiry center's page identity, action grouping, inquiry rows, metadata, sealed-response notice and conversation surfaces.

### Product and inquiry operations
- Rebuilt Admin and Company product-list page headers and management surfaces with role-specific context; existing API-backed list, filters, pagination, action handlers and permission checks remain unchanged.
- Rebuilt Admin and Company inquiry-list page headers and toolbar/table surfaces; existing inquiry filters, tabs, pagination, response state and API calls remain unchanged.

### Commits
- `48ce7a6` — shared dashboard page context header
- `012f0ea` — shared DataTable visual system
- `ca1cec4` — public marketplace header identity
- `e37de59` — public product catalog
- `038a467`, `f763480` — Admin/Company product management lists
- `f9a2f47`, `0f64a5c` — Admin/Company inquiry workspaces
- `b933ca0` — customer inquiry center
- `efac6fc` — PageHeader component tests

### Verification status
- GitHub Actions CI is configured for pushes to `main`, but the latest commit currently reports no status checks; do not infer a pass.
- The connected GitHub editing session cannot run local pnpm tests or production builds. The new PageHeader test and existing shared UI tests are committed but not yet executed.
- This batch is not signed off as verified. Continue page-family implementation and await/obtain CI evidence before release.


## UI redesign — inquiry authoring and homepage batch 11 (2026-11-02)

- Admin and Company multi-step inquiry creation now have clearer contextual headers, a guided progress rail, improved active-step contrast, consistent field surfaces, review blocks and responsive action layout.
- Customer inquiry center and inquiry lists were already updated in batch 10; this batch completes the inquiry-create visual family without changing step validation, draft persistence, inquiry payloads, role restrictions or submission APIs.
- Public homepage refined: branded hero hierarchy, search CTA, product image containment, category/product card surfaces, responsive two-column mobile product grid and compact stats/features.
- Commits: `ec8f735` Admin inquiry create; `14361df` Company inquiry create; `5da81bd` Website homepage.
- No local tests/builds or browser checks were run. Current main CI status must be checked before sign-off.


## UI redesign — subscription, notifications and management lists batch 12 (2026-11-02)

- Customer inquiry subscription: added a clear account-context header, quota surfaces, plan selection states and payment-reference guidance styling; subscription/payment logic and API payloads are unchanged.
- Admin inquiry detail: added a contextual detail header that shows the live inquiry title when loaded; response permission gates and all detail actions remain unchanged.
- Website notification inbox: replaced hardcoded light-only surfaces with shared design tokens so inbox/sidebar/list/reading pane states adapt to the active theme.
- Admin, Company and Website notification preferences: added consistent settings identity, accessible table layout, responsive footer/action treatment and token-based surfaces; preference values and save behavior unchanged.
- Admin users/companies/categories and Company users lists: rebuilt the page intro with role-specific icon/context and aligned toolbar/table surfaces; existing search, filters, server pagination, dialogs and permissions preserved.
- Commits: `ef00252`, `6cf7465`, `d9cd191`, `e77f07a`, `5cf6289`, `c44bb78`, `1a91159`, `5e40f45`, `b9f25de`, `3df74f0`.
- Verification is still pending; no local tests/builds or browser tests were run.


## UI redesign — authentication and account settings batch 13 (2026-11-02)

- Customer login and registration received a more focused form surface, refined brand/visual panel, responsive spacing and token-based inputs/focus states.
- Registration account-type choice is now one keyboard-operable radio group (Enter/Space and arrow-key selection) with a single accessible radio semantic; the existing customer/company values and submit payload remain unchanged.
- Admin, Company and Website notification-preference screens now share a settings identity, responsive table and save-action layout; the SMS availability state remains informational and is not made interactive.
- Commits: 156d029 Login; d76e548 initial Register visual pass; 884de96 accessible account-type selector; e77f07a, 5cf6289, c44bb78 notification preferences.
- No local test/build execution or browser testing was performed.


## UI redesign — public company and commerce pages batch 14 (2026-11-02)

- Public Companies directory now has a network/supplier context header, improved search/filter surface, verification filter strip and category cards.
- Shopping Cart, Checkout and Wishlist now use a consistent contextual commerce header with breadcrumbs and explanatory copy; empty states and PrimeVue cards have responsive, token-based surfaces.
- Checkout payment-method selection and cart/wishlist item behavior were not changed. These screens remain presentation work over their existing route/state; no new payment/cart backend behavior is claimed.
- Commits: cc4842e Companies; 91f35bd Shopping Cart; a4c41fd Checkout; 32e88c0 Wishlist.
- No local test/build/browser execution; verification remains outstanding.


## UI redesign — public catalog, order and support pages batch 15 (2026-11-02)

- Public Products page now has a contextual catalog header, refined filters, responsive two-column mobile grid and product image containment.
- Orders and Order Details now use a consistent account/order context header, breadcrumb placement and token-based card surfaces.
- Contact Us now has a true page heading and breadcrumb separated from the form; contact information cards/social controls use brand tokens rather than fixed cyan colors.
- Existing search/filter/sort/pagination, order data, navigation and contact form submission remain unchanged.
- Commits: `f1d2e99`, `8cd0cac`, `e349467`, `41bcdf8`.
- No local tests/builds or browser tests run; verification outstanding.


## UI redesign — access, system and account settings batch 16 (2026-11-02)

- Admin Roles and Permissions lists now use distinct security/access page identity and consistent responsive toolbars/tables.
- Admin System Settings was rebuilt from inline-styled markup into a semantic settings workspace with a contextual heading, descriptive setting card, labeled threshold control, loading/error/default states and responsive save action. The setting value, min/max, API load/save and retry behavior are unchanged.
- Company Settings now presents organization identity and the existing live status/verification badges above the profile/contact/notifications/security tabs; form data and permission gates are unchanged.
- Admin/Company personal profiles now have a common account-context header and refined tabs/cards/forms; Company Change Password has a clear security header.
- Commits: a51eea5, 5715c4a, c2da3c9, d3391a1, 7bf11c2, 70f7445, 5e0a572.
- No local test/build or browser execution; verification remains outstanding.


## UI redesign — order and notification folder administration batch 17 (2026-11-02)

- Admin legacy Orders list now has an explicit sales/legacy context header and a responsive toolbar/table surface; no unsupported order API capability was added.
- Admin Notification Folders now has a folder-structure header, responsive creation form and list rows, consistent system-folder vs admin-folder surfaces, and token-based success/error/action styling. User folder creation remains unavailable; system INBOX/SAVED folders remain protected by the existing logic.
- Commits: `7232a6e`, `fecd896`.
- No local tests/builds/browser execution; verification remains outstanding.


## Management screens and shared table batch — 2026-11-02

### Completed
- `packages/shared-ui/components/common/Table.vue`: replaced the minimal table presentation with a consistent data surface, clear header hierarchy, row hover/focus treatment, paginator styling, loading overlay and a designed empty state. The existing columns/rows/slots and PrimeVue attribute passthrough contract remain unchanged.
- `apps/admin/src/pages/admin/products/ProductList.vue`: established a branded management intro, refined toolbar/filter controls, data-table hierarchy, pagination, row actions and explicit loading/error/empty state presentation. Existing API calls, pagination, product workflow actions and permission predicates were not changed.
- `apps/admin/src/pages/admin/companies/CompanyList.vue`: refined the directory surface, search/filter toolbar, data table, pagination and responsive toolbar behavior. Company approval/verification/status operations and permissions were not changed.

### Commits
- `0256af2` — shared Table component
- `1092b84` — Admin ProductList
- `c21d18d` — Admin CompanyList visual system
- `7010dc6` — apply the company table class hook missed in the prior edit

### Verification
- CI started for `7010dc6` (run `41449786538`); test/build outcome is pending at the time of this update.
- No local browser testing was performed. Do not mark this batch as fully verified until CI completes.


## Company catalogue and inquiry workspaces — 2026-11-02

### Completed
- Company ProductList now shares the admin catalogue's visual language: a clear catalogue intro, compact responsive toolbar, token-driven table header/body/pagination and mobile filter layout. Removed the extra page-level padding that caused nested dashboard content to be inset twice.
- Company InquiryList now has a dedicated management surface, clearer tab navigation and a consistent responsive server-side table/paginator presentation.
- Admin InquiryList now has a dedicated review surface and consistent toolbar, loading skeleton/data table, row hover and pagination presentation.
- These changes are presentation-only. Company-scoped product actions, STAFF-only review boundaries, inquiry scope tabs, server pagination/sorting, filters, API calls and permissions remain intact.

### Commits
- `4e5cd98` — Company ProductList
- `55ec8ed` + `17e43c0` — Company InquiryList styles and table hook
- `9036416` + `7c2f7af` — Admin InquiryList styles and table hooks

### Verification
- CI was triggered by the preceding commit `7010dc6`; its run status is being checked separately. This latest batch is not marked verified until CI for the latest main commit completes.


## Identity, access and catalogue administration batch — 2026-11-02

### Completed
- Admin UserList and Company UserList now share a dedicated responsive management surface, toolbar and table/paginator treatment. Company-side self-protection and access activation restrictions are unchanged.
- Admin RoleList, PermissionList and CategoryList now use a consistent surface, toolbar and responsive data-table presentation.
- Added `packages/shared-ui/components/common/Table.test.js` covering row/loading passthrough, configured empty-state copy and the existing column configuration contract.
- No changes to user/role/permission/category APIs, authorization predicates, role semantics or data operations.

### Commits
- `9927176` — Admin UserList
- `b52f642` — Company UserList
- `8b54d91` — RoleList
- `d065562` — PermissionList
- `b6ce439` — CategoryList
- `95ac38b` — shared Table unit tests

### CI evidence
- CI passed on `7767afe` and `b52f642` (test/build workflow).
- Runtime Validation is a separate Playwright smoke workflow and has reported failures/cancellations on some commits; it is not being used as the acceptance criterion for this visual batch. Review its failure separately if it blocks release.
- CI for the newest commits is pending/in progress; this latest batch is not yet signed off.


## Inquiry details and company settings — 2026-11-02

### Completed
- Admin InquiryDetail now composes request metadata and requested items as a two-column first row; response cards and status history span the full content width. Loading/error states, response actions, attachments and workflow permissions are preserved.
- Company InquiryDetail now aligns to the dashboard's shared content width (removed a nested max-width/padding container), with clearer status/deadline banners, request sections, response cards and responsive sidebar collapse.
- CompanySettings now uses the shared shell width instead of a nested 1000px/padded container. Tabs, system metadata, editable sections and notification toggles receive consistent token-based panels and mobile behavior.
- No changes to inquiry lifecycle, sealed-response visibility, response decision permissions, company scope, settings API or data.

### Commits
- `5e1d159` — Admin InquiryDetail
- `f6bc9b8` — Company InquiryDetail
- `26b6f8f` — CompanySettings

### Test correction
- CI exposed an incorrect assertion in the newly added shared Table test (the Column stub was not rendered by the test stub). The test was corrected in `07abcc2`; the earlier failure was test-harness-only, not a product-code failure. CI for the corrected/latest code is still pending.
