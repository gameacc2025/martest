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


## Notifications and company catalogue batch — 2026-11-02

### Completed
- Admin notification management composer and delivery status panel now use design-system surfaces, clear hierarchy, responsive composition, tokenized controls and accessible focus states. Existing audience/channel rules and worker-backed delivery semantics remain unchanged.
- Admin notification folder management now uses responsive configuration cards/rows and tokenized form controls. System INBOX/SAVED restrictions and admin-defined folder scope remain unchanged.
- Admin and Company notification preference matrices now have consistent event/channel table hierarchy, explicit unavailable SMS state, horizontal overflow on small screens and responsive save actions. Preference data and save API unchanged.
- Company-wide products page now wraps its server-paginated DataTable in a dedicated catalogue surface, with matching header/body/paginator treatment. Existing product visibility and API behavior unchanged.

### Commits
- `7875672` — NotificationManagement
- `8985db7` — NotificationFolders
- `387e7e9` — Admin NotificationPreferences
- `43e9fcb` — Company NotificationPreferences
- `e239d42` / `dc92478` — CompanyProducts surface and template whitespace correction

### Verification
- CI and database migration validation passed on `dfc47e5` after the shared Table test correction.
- Newer notification/catalogue commits have CI queued/in progress; do not treat them as verified until the latest run finishes.


## Public marketplace and shared workspace refinement — 2026-11-02

### Completed
- Shared DashboardSidebar now has a two-line brand lockup (Telecom Market + Persian product descriptor), stronger focus-visible navigation, more deliberate section spacing and refined active/submenu surfaces. Route filtering, planned-route disabled behavior, collapse and mobile drawer behavior are unchanged.
- Public Companies directory received improved responsive search/filter hierarchy, supplier/category cards, focus-visible category interaction and tokenized loading/empty presentation.
- Public ContactUs now has a balanced form/information column, consistent card surfaces, tokenized contact/social accents and improved form-control focus styling.
- Public Addresses now uses the marketplace container width, tokenized address cards/forms/notices and responsive action layout.
- Public MyInquiries now uses the wide marketplace content container and tokenized request/detail/response/sealed states. Existing visibility rules, response decisions and conversation behavior are unchanged.
- Public InquirySubscription now uses the same subscription-plan/quota visual system as the Company panel, within the public marketplace container. Plan selection, payment redirect/manual verification and quota semantics are unchanged.
- Notification management/folder/preferences changes from the previous batch are recorded above.

### Commits
- `abdefd7` — shared DashboardSidebar brand/navigation
- `bdf55c3` — public Companies
- `fca4b8d` — public ContactUs
- `f61e2e5` — public Addresses
- `d31d278` — public MyInquiries
- `63724e4` — public InquirySubscription

### Verification
- Latest CI and migration validation results are checked on the current main commit separately. No browser testing is claimed.


## Account, subscription and accessibility pass — 2026-11-02

### Completed
- Shared Admin and Company dashboard layouts now expose a keyboard-visible skip link to the main page content; the main content target is focusable. No route or navigation behavior changed.
- Website Addresses and MyInquiries now use the full marketplace container and design-system tokens for cards, forms, response states and responsive actions.
- Public InquirySubscription now aligns with Company subscription plan/quota surfaces.
- Website Companies and ContactUs pages received consistent filter/card/form layouts and responsive states.
- Company and Admin notification preference tables, folder management and notification composer were updated in the preceding batch.
- The auth pages, profile pages, product editor forms, inquiry creation steppers, reports, categories, company profiles, FAQ, terms, search and product detail pages were audited; most already had Paces-inspired/design-token treatments from earlier work and were retained rather than needlessly rewritten.

### Commits
- `63724e4` — public InquirySubscription
- `abdefd7` — DashboardSidebar
- `bdf55c3` — Companies
- `fca4b8d` — ContactUs
- `f61e2e5` — Addresses
- `d31d278` — MyInquiries
- `bda68aa` — AdminLayout skip navigation
- `1ed455e` — CompanyLayout skip navigation

### Verification
- CI status for the newest commit is pending; previous green run `dfc47e5` remains the latest confirmed test/build checkpoint until the new run completes.


## Dashboard shell and identity — batch 7 (2026-11-02)

- Shared `DashboardHeader` now accepts a host-supplied `workspaceLabel` and renders a compact, accessible workspace identity beside the navigation controls.
- Admin passes `مدیریت بازارگاه`; Company passes `فضای کاری شرکت`. The shared shell remains one component and the value is presentation-only.
- The workspace identity adapts on narrow screens and uses existing semantic design tokens; no app membership, permission, route, notification, auth or API behavior changed.
- Added `DashboardHeader.test.js` for both configured and omitted workspace labels.
- Commits: `9fe9d5f` shared header; `39cfd56` Admin shell; `399c989` Company shell; `8e5b9bf` tests.
- Test/build execution is still pending; no local verification is claimed.


## Product editor — batch 8 (2026-11-02)

- Added a live required-information completion panel to both Admin and Company product editors.
- The checklist is derived from the same required values used by each editor's existing validation: title, category, subcategory, and company only where the current access context requires company selection.
- The panel communicates completed/remaining required fields with an accessible progressbar and responsive checklist.
- No validation rule, payload shape, permission check, API call, save flow, or media upload behavior was changed.
- Commits: `62ad6a7` Company editor; `d626f49` Admin editor.
- CI validation for this batch is pending.


## Inquiry authoring wizard — batch 9 (2026-11-02)

- Admin and Company inquiry creation wizards now show an explicit current-step context, five-step progress bar and live selected-item count above the PrimeVue stepper.
- The progress derives from the existing `activeStep` state; selected-item count derives from the existing inquiry form model.
- Existing linear step navigation, step validation, draft save/restore, inquiry options, product selection, API calls and submit behavior remain unchanged.
- Commits: `ec4c1f2` Company wizard; `914ba4f` Admin wizard.
- CI validation pending.


## Shared form guidance component — batch 10 (2026-11-02)

- Extracted the Admin/Company product-editor required-field indicator into `packages/shared-ui/components/common/RequiredFieldsProgress.vue`.
- Both product editors now consume the same shared component; duplicated progress markup and styles were removed.
- Added component tests for partial completion and the empty-checklist edge case.
- Existing form check definitions remain role-aware and continue to mirror current validation requirements. No submit/API behavior changed.
- Commits: `a5f6fa2` shared component; `5ad87a1` Company adoption; `49d779d` Admin adoption; `6332362` tests.
- CI pending.


## Shared management page headings — batch 11 (2026-11-02)

- Added `WorkspacePageHeading.vue` as a shared RTL-aware heading surface with optional eyebrow, description, icon and actions slot.
- Adopted it in Admin product list, company list and inquiry list, plus Company inquiry list.
- The migration standardizes page hierarchy and spacing while preserving each page's text, existing toolbar actions, search/filter state, data tables, routes and API behavior.
- Added component tests for content, custom heading ID, optional fields and actions slot.
- Commits: `1a0e4fc` component; `15f1e40`, `3c2b4d5`, `541944a`, `cb083f0` page adoption; `a34b8e1` tests.
- CI pending.


## Management list rollout — batch 12 (2026-11-02)

Extended the shared `WorkspacePageHeading.vue` pattern to:
- Admin: Categories, Users, Roles, Permissions and Orders.
- Company: Product management.

Together with batch 11, the shared heading now covers Admin Products/Companies/Inquiries and Company Products/Inquiries as well. Page copy and the legacy-order/API availability disclaimer were preserved exactly. Search, filters, permissions, routes, table columns, dialogs and data loading were not changed.

Commits: `3a3611a`, `f2e5bd2`, `e8ecb49`, `10e2c67`, `5a3fd61`, `e693b5d`. CI pending.


## Cross-module workspace heading expansion — batch 13 (2026-11-02)

Extended `WorkspacePageHeading.vue` to additional operational screens:
- Company: User management and Reports/Analytics (including the existing tab-dependent CSV export actions in the heading action slot).
- Admin: System Settings and Inquiry Subscription Management (including the existing refresh action).
- Admin Notification Management and Notification Folder Management (including their existing inbox and refresh actions).

The shared heading now covers 16 Admin/Company operational pages. All page-specific descriptions, existing actions and routes were retained. No API, permission, data, validation, subscription or notification behavior changed.

Commits: `c5f2126`, `7df3c0c`, `fc7963e`, `dcabf38`, `5eca4cd`, `1bd79b4`. CI pending.


## Account and commerce pages — batch 14 (2026-11-02)

Adopted the shared workspace heading on:
- Company: User Profile.
- Website: User Profile, Orders, Wishlist and My Inquiries.

Existing breadcrumb navigation is retained through the actions slot. My Inquiries preserves its subscription, back-to-list and refresh actions. Page-specific content, route behavior, account state, order data, wishlist actions and inquiry flows remain unchanged.

Commits: `95e8111`, `de3d47f`, `7991a04`, `ecfc860`, `959035d`. CI pending.


## Public marketplace heading rollout — batch 15 (2026-11-02)

Adopted the shared workspace heading in Website:
- Product Listing, Categories and Companies.
- Shopping Cart and Checkout.
- Addresses and Contact Us.

Breadcrumbs and page actions are retained through the actions slot. The product/category/company catalog pages preserve their existing filter controls and results; cart/checkout retain all current commerce flows; addresses and contact retain their existing forms and handlers.

Commits: `9d364ed`, `2ba3744`, `364b7bb`, `dc76bc8`, `a6c964c`, `4888705`, `583c051`. CI pending.


## Shared shell and public navigation — batch 7 (2026-11-02)

### Repository / branch policy
- Confirmed GitHub has only the `main` branch; no additional remote branches or open PRs were present at the time of inspection.
- All subsequent changes in this batch were committed directly to `main`; no branch was created.

### Public website shell
- Added a keyboard skip link targeting the main content and made the main landmark programmatically focusable.
- Mobile navigation now exposes `aria-expanded` and `aria-controls`, changes its menu icon/label with state, and closes on route changes (including back/forward) and successful search navigation.
- Improved the mobile navigation panel's bounded scrolling and focus-visible styles; reduced-motion mode now also suppresses animation duration.
- Existing route names, PKCE panel handoff URLs, auth/access-profile routing, category loading and API calls remain unchanged.

### Shared dashboard navigation
- Refined dashboard header controls with descriptive notification/account labels, explicit search dialog semantics and a title for the theme switch.
- Increased dashboard icon controls and account trigger to the 44px minimum target.
- Added a named navigation landmark to the shared sidebar and increased the collapse control to the same 44px target.
- Existing menu generation, permission filtering, routes, theme handling, notification link and logout behavior remain unchanged.

### Tests
- Added `apps/website/src/layouts/PublicLayout.test.js` for skip-link target, mobile-menu accessibility state and automatic close on route change.
- Extended `DashboardHeader.test.js` for descriptive labels on notification, theme and account controls.
- Test/build execution has not been performed in this connected GitHub editing environment. These tests are authored but not yet verified.

### Commits
- `7655d32` public website shell accessibility/navigation
- `ca9591d` public layout navigation tests
- `f531a4b` shared dashboard header controls
- `4b53d8f` shared dashboard sidebar navigation
- `3bb6ab5` dashboard header tests


## Design system and inquiry inbox — batch 8 (2026-11-02)

### ui-ux-pro-max skill application
- Read the repository skill and its Vue stack guidance; used the skill's product/style/color/typography/UX datasets to derive the B2B SaaS + marketplace direction.
- Selected a restrained Minimalism/Flat/Soft-UI hybrid with data-dense operational dashboards, trust cues on public surfaces, and blur only as optional sticky-shell enhancement.
- Preserved the existing brand palette (`#01bec2`, `#003a54`), Vazirmatn, PrimeIcons and semantic `--ds-*` tokens instead of replacing them with generic sample palettes.
- Persisted the resulting master rules and page overrides under `design-system/`.

### Shared component sizing
- Standardized shared table row-action and paginator targets to 44px.
- Set WorkspacePageHeading action controls to a 44px minimum.
- Updated Admin and Company product-list icon actions/pagination to the same target size.

### Inquiry inbox
- Company inquiry inbox now has an explicit recoverable error panel with a retry action instead of falling through to a misleading empty state when the list API fails.
- Added accessible names to Company inquiry search, status filter and row-view action.
- Standardized Admin and Company inquiry table action/pagination targets to 44px.
- Added Company InquiryList component tests for error presentation and successful retry using the existing list API contract.

### Verification
- GitHub Actions CI passed at commit `2c5b360` before the subsequent inquiry-inbox changes. Its `test-and-build` job passed frontend/shared tests, backend tests and builds for all frontend apps.
- Latest inquiry changes have new tests but require the latest CI run to complete before they can be marked verified.
- Runtime Validation and Database Migration Validation were cancelled by newer pushes during this rapid commit sequence; they are not considered passed.


## Product editor and directory refinement — batch 9 (2026-11-02)

### Product editors (Admin + Company)
- Connected visible labels to static product fields, classification selects, dynamic technical-spec controls and price-tier fields using stable input IDs.
- Added accessible names to custom-spec value/removal controls and product-image management actions.
- Increased save/section/delete actions to usable touch sizes, changed image action overlays to a two-column control grid, and improved narrow-screen field/price-tier stacking.
- Added visible focus treatment for keyboard users.
- Existing product payloads, field names, validation, uploads, pricing semantics, permission-gated fields and API operations remain unchanged.

### Identity and company directories
- Admin and Company user directories now expose descriptive names for search, filters and icon-only row actions.
- Admin company directory search/status/type filters now have accessible names.
- Increased directory table action and paginator targets to 44px.
- Preserved role assignment/deactivation restrictions, self-protection, company approval/verification permissions and server-side pagination.

### Public catalogue
- Search icon action and paginator have accessible labels.
- Added visible focus outlines to keyboard-focused product cards and filters; filter/action and paginator targets are sized for touch.
- Product visibility, route navigation, filter query and API behavior are unchanged.

### Verification
- These changes are committed directly to `main`. Await the latest GitHub Actions CI run for frontend/shared tests and builds; no local build is available in this connected editing session.


## Responsive shared tables — batch 7 (2026-11-02)

- The shared `DataTable` now switches to a card-based row layout below 768px by default, so each value is paired with its column label instead of forcing a wide desktop table into a narrow viewport.
- Search, column controls, filters, row actions, selection checkboxes, pagination, empty state and loading behavior remain available. Custom cell slots keep the existing `row` and `value` slot contract.
- Added the `mobileCardLayout` opt-out prop for the few tables whose data density requires the classic horizontal-scroll presentation.
- Added focused tests for the default and opt-out behavior.
- Commits: `4c60743` shared responsive table implementation; `775d757` component test coverage.
- Tests/builds have not yet been run in this connected editing session. CI result must be checked before marking the batch verified.


## Product management lists — batch 8 (2026-11-02)

- Admin and Company product-management pages now use the shared `DataTable` component instead of two separate raw PrimeVue table implementations.
- Both pages retain their existing role/permission-gated row actions, review/publish/archive/delete flows, preview/rejection dialogs, authenticated `myProducts` data source and tenant scoping.
- The existing search and status controls remain in the page toolbar. Server pagination is now passed through the shared table request event, including the selected page size; filter/search changes reset the table's local paginator to page one.
- Company title cells retain brand/model metadata through the shared table's named slot; status badges and all action controls retain their prior behavior.
- Commits: `d5312ab` Admin list migration, `173907e` Company list migration, `e07b1fc` paginator reset API, `334f1d4` reset test, `e2d958d` / `3a256fb` filter-reset wiring.
- CI and app builds are pending; no local execution is claimed.


## Admin directory and category lists — batch 9 (2026-11-02)

- Admin Companies, Users and Categories pages now use the shared responsive DataTable rather than page-local PrimeVue table markup.
- Company list preserves logo/name/type/contact/status/verification/date cells and permission-gated edit/approve/verify/deactivate actions. Company phone fallback (`phoneNumber`) is retained.
- User list preserves avatar/name/access type/company/roles/status/join date and permission-gated view/edit/delete actions. Existing server-side sort state is passed through the shared table request event.
- Category list preserves image/name/slug cells and edit/delete actions.
- Search and filters remain connected to existing stores/API calls; table pagination, selected page size and paginator resets are wired to existing server pagination.
- Commits: `a0f30fe` Categories, `f993736` Companies, `06586b3` phone fallback, `70a640e` category mutation reset, `09452c4` Users, `4f155e6` initial sort support.
- CI is pending; these changes are not marked verified.


## Inquiry list workspaces — batch 10 (2026-11-02)

- Admin and Company inquiry lists now use the shared responsive DataTable with labeled mobile row cards.
- Admin list retains the real `inquiriesApi.list` endpoint, server-side status/search/sort/page state, status-change dialog and detail/create routes.
- Company list retains scope tabs (all/sent/received), status/search/sort/page state, deadline urgency/passed indicators, priority labels, and the permission-gated create action.
- Scope/status/search changes reset the table paginator; the shared table continues to emit lazy requests to the existing API.
- Commits: `d4d102d` Admin inquiry list; `a497b8a` Company inquiry list; `cca3d37` scoped paginator reset; `2860f1b` orphan empty-state fix.
- A CI failure was traced to an orphaned `v-else-if` in the Company inquiry template and fixed in `2860f1b`. Shared table mobile prop was separately fixed in `d9c42c9`; final CI rerun is pending.


## Access-control and order lists — batch 11 (2026-11-02)

- Admin Roles, Permissions and Orders lists now use the shared responsive DataTable with labeled mobile cards.
- Role rows retain scope badges, assigned permission chips, user counts, system-role delete restrictions and existing edit/delete handlers.
- Permission rows retain name/label/group/description and existing CRUD handlers.
- Order rows retain the existing API/store source, status labels, amount/date display and current view/status dialog actions.
- Search/filter and server pagination continue through the existing stores/API. Mutations reset the local paginator.
- Commits: `d12afeb` Roles, `54c49e4` Permissions, `9d3c3c6` Orders, `b0a262f` / `975c917` mutation paginator resets.
- CI/build verification for this batch is pending.


## Public storefront and catalogue refinement — batch 12 (2026-11-02)

### Public shell
- Added a second, compact utility navigation tier above the existing public navigation: a marketplace context statement and real FAQ/contact links.
- Utility tier is hidden at mobile breakpoints so the existing mobile navigation remains the primary navigation.
- Existing search, category mega-menu, account menu, notifications, auth handoff, route behavior and footer remain intact.

### Public product catalogue
- Product cards now expose the product identity hierarchy more clearly: title, supplier, optional brand/model/SKU, API-confirmed verified-supplier cue, optional description, and a consistent price/details footer.
- If the API has no published price tier, the card explicitly asks the buyer to request pricing from the supplier; no placeholder or fabricated price is shown.
- Cards remain one keyboard-accessible navigation surface to the existing product-details route; no nested controls were introduced.
- Technical SKU is isolated LTR inside the RTL interface.

### Tests and verification
- Extended ProductListing tests for brand/model/SKU, API-confirmed verification, price-present and price-absent states.
- Extended PublicLayout tests for the utility tier and existing primary header.
- CI test-and-build passed at 8a381241 before the subsequent PublicLayout utility-tier commits. Latest main is b18cdb7; its CI, migration and runtime workflows are pending. The last completed runtime workflow at 0618911 failed only in the browser smoke step; compose, service health, migration application and test/build CI were separate successful checks. Do not treat browser smoke as a substitute for component tests or production builds.
- No local test/build execution is claimed in this connected GitHub editing session.


## Notification inbox accessibility and control hierarchy — batch 13 (2026-11-02)

- Admin and Company inbox message rows now use semantic article containers, separate selection labels/checkboxes, and native message-open buttons. This removes the previous interactive wrapper with role=button that contained nested checkboxes and action buttons.
- Message-open buttons expose selected state through aria-pressed and support native keyboard activation; the existing single-click-select / double-click-mark-read contract remains unchanged.
- Folder/category navigation and row/reading/bulk action controls have 44px minimum targets. Responsive row controls wrap without forcing page-level horizontal overflow.
- Added Admin and Company inbox tests for semantic button behavior, selected state and unchanged double-click read semantics.
- Existing API endpoints, folder IDs, unread counts, selection behavior, move/copy, bulk actions and user scope are unchanged.
- CI for the latest batch is pending; no local test/build execution is claimed.

## Company subscription and homepage catalogue — batch 14 (2026-11-02)

### Company inquiry subscription
- Replaced the bespoke title row with the shared WorkspacePageHeading.
- Rebuilt the page styling around design-system surfaces/tokens: subscription state panels, quota cards, plan cards, notices, responsive grids and 44px actions.
- Quota meters now expose accessible progressbar names, min/max/current values and value text.
- Plan selection now exposes aria-pressed on the existing selection/request action. Existing payment routing, plan API calls, quota semantics, pending/current subscription rules and manual-payment caution text are unchanged.
- Added component tests for real plan loading, quota accessibility and explicit plan selection before request submission.

### Website homepage
- Featured and recent product cards now show supplier identity, API-confirmed verification, optional brand/model/SKU, price when available, and a clear supplier-inquiry state when no price tier exists.
- Technical SKU is isolated LTR in the RTL card. Cards remain single navigation surfaces to the existing details route.
- Added homepage source-contract coverage for verification, no-price fallback and details affordance.

### Verification
- CI test/build passed at commit f2ee67b (includes the Company subscription component tests). The subsequent homepage commits are newer and require a fresh CI run.
- Database migration/runtime workflows were still in progress at the last check; no migration or runtime sign-off is claimed for the latest main head.
- No local tests/builds were run in this connected GitHub editing session.