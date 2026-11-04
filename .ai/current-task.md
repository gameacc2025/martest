# Current Task — Full UI rebuild on the `tem/` visual language (UI-REDESIGN-TEM-01)

**Status:** IN_PROGRESS — TEM widget extraction and the first operations UI foundation are committed directly to `main`. Admin CRM, finance/settlement, support-ticket and retail-order prototypes plus Company support-ticket prototype exist with explicitly labelled sample data. API/domain implementation remains a future phase. Browser/build checks were not run in this remote-editing session; GitHub Actions/CI was not inspected or run per owner instruction.
**Repository:** gameacc2025/martest  
**Branch:** main  
**Scope:** apps/website, apps/company, apps/admin, packages/shared-ui, design-system/, .ai/ and UI documentation.

## Product constraints
Apply the newly approved turquoise/sky/navy identity (Vazirmatn, Persian-first RTL, dark sidebar, existing logo), Vue 3/JavaScript/PrimeVue 4 stack, APIs, routes, PKCE authentication, app-context/RBAC, tenant isolation, inquiry/RFQ rules, product lifecycle, notification behavior and commerce contracts. Do not present fake data as real or make unsupported claims. Explicitly requested UI-only prototypes may use clearly labelled sample data, must remain disconnected from guessed APIs, and must not execute real business/financial operations. No backend/schema/API/business-rule changes during this UI-only task.

## Required skill workflow
- UI UX Pro Max: accessibility, responsive layout, semantic tokens, form feedback and performance guidance.
- Taste Skill: product-specific composition; data-first app screens; avoid generic icon tiles, nested cards and decorative chrome.
- Impeccable: Operate mode for Admin/Company, Persuade for public discovery, Read for help/legal pages; preserve the established visual world.
- Vercel Web Interface Guidelines: semantic controls, keyboard/focus, image layout stability, reduced motion and robust states.

## Implemented slices
### Approved turquoise brand foundation — 2026-11-03
- Owner selected the turquoise/sky-blue palette with dark sidebar.
- Shared PrimeVue preset and design tokens now define sky-blue primary (#39BFE0), turquoise secondary (#12B8A6), technical blue (#2878C7), navy (#173B63), dark sidebar (#142B46), amber (#E7A64B), and cool light surfaces.
- Added `design-system/pages/notifications.md` as the first real-page visual reference and applied turquoise selected/unread/focus accents to all three existing Notifications inboxes.
- Updated `design-system/MASTER.md` and WORKLOG. No API, route, auth, permission, tenant, notification, or backend behavior was changed.
- Verification: remote source re-fetch only; tests/build/browser checks NOT RUN in this session.


### Shared workspace foundation
- KpiCard uses typography-led real values without decorative icon tiles.
- DashboardPanel is a flat titled section.
- QuickActions is a compact navigation list.
- WorkspacePageHeading is task-first without eyebrow/icon decoration.
- PageHeader is a lightweight breadcrumb row, avoiding duplicate page titles.
- Focused component regression tests were added.

### Admin and Company dashboards/shell
- Simplified dashboard hero panels and removed decorative kickers/marks, gradients and shadows.
- Added accessible labels to icon-only product moderation actions.
- Updated shared topbar focus states, removed glass/shadow chrome, and made sidebar active state quieter with aria-current.
- Updated layout skip-target focus styling.

### Public marketplace
- Replaced homepage autoplay slideshow with a static search-first introduction.
- Converted homepage/catalogue product tiles and category tiles to semantic links/buttons.
- Updated public shell to use the shared BrandMark, removed unsupported footer marketing claims, corrected footer category links to use category IDs, and flattened sticky header chrome.
- Flattened Home, ProductListing, Categories and ProductDetails surfaces; removed fake zero counts and absent supplier placeholders; added image layout hints.

### Notifications and preferences
- All three inboxes now expose only the fixed INBOX and SAVED folders, in a stable order; custom/user-created folders are not shown.
- Sidebar exposes only the fixed INBOX and SAVED folders; notification type categories remain separate filters. Read/unread state is shown per row and in the global unread badge, not as extra folders.
- Preserved copy-to-SAVED and explicit move semantics, bulk delete/read-state actions and double-click-to-mark-read behavior.
- Website inbox rows now use semantic buttons rather than clickable divs.
- Reworked inbox and notification-preference surfaces to flat, readable tables/lists with responsive overflow and focus states.
- Added a shared fixed-folder normalizer and unit tests.


### Notification inbox correction — 2026-11-03
- The three inboxes now render only the two fixed system folders (INBOX and SAVED); category labels remain a separate filter group.
- Selecting a message opens the reading drawer from the physical right edge in RTL. The overlay uses a narrower mail-reader width, and the row exposes `aria-expanded` / `aria-controls` rather than toggle-button semantics.
- Search now grows into the available toolbar space (with a sensible max width) instead of being constrained to a small fixed-width field. Bulk read/unread/delete actions are icon-only with accessible labels and titles.
- Website now applies folder-membership filtering consistently with Company/Admin.
- Added/updated frontend regression assertions for the fixed-folder model, drawer expansion state and icon-only bulk actions.
- API contracts, copy/save/move semantics, read-state behavior (single click opens; double-click marks read), and pagination remain unchanged.
- Verification: source changes were committed directly to remote `main`; automated tests/build and browser rendering have NOT been run in this session. CI status must be checked before treating the task as verified.

## Remaining phases
1. Admin and Company operational pages: category/company/user/role/permission/product lists, Company product/user settings, both product editors and system settings have received first refinements; continue detail/edit flows, orders, reports and operational edge states.
2. Public Website: company directory/profile, FAQ/Terms, About, search results, address book, customer profile, Contact, authentication, legacy Products catalogue and Wishlist received first-pass refinements; orders, cart/checkout and inquiry pages remain.
3. Cross-app hardening: RTL/LTR isolation, dark/light themes, mobile/tablet layouts, keyboard/accessibility, loading/empty/error/disabled states and Vercel guideline review.
4. Full 69-page inventory and documentation update, then a truthful completion report.

## Verification
- Browser/screenshot inspection: NOT RUN — owner instruction.
- Automated tests/builds: NOT RUN — owner instruction. Regression tests are authored, not executed.
- Static review: ongoing. Do not claim runtime, visual or full redesign acceptance until all pages are reviewed and checks are authorized.

## Prior independent backlog
Company-owned API/tenant-isolation audit and SMS/provider integration remain separate. Do not silently mark them complete or change backend behavior during this UI-only task.


### Global shared component layer
- Added a cross-app skill refinement mixin to the shared Sass entry, emitted after legacy Sakai overrides.
- PrimeVue cards/panels, DataTables, toolbars, inputs and buttons now use flatter surfaces, consistent touch targets and explicit keyboard focus; dialog elevation is retained.
- Legacy stat and quick-action components are restyled data-first and as navigation rows.
- Static token-name review found no undefined semantic token references in the new mixin. Sass compilation was not run.


### Forms, tables and inquiry workflows
- Shared FormSectionHeader and RequiredFieldsProgress are now typography-first and free of decorative icon/kicker treatment.
- Shared DataTable has semantic loading/empty states, aria-busy, quieter mobile rows and consistent focus/touch targets.
- Product form/list and inquiry/RFQ page families receive cross-app flat-surface refinements.
- Website inquiry subscription now uses the shared page heading and accessible quota progress meters.
- New component regression tests are authored; execution remains NOT RUN by owner instruction.


### Admin/Company management and settings — Phase 7
- Unified flat management surfaces and toolbars across category, company, user, role, permission and product lists.
- Refined Company Settings heading, profile/contact sections, metadata and tabs to remove decorative gradient/icon-card styling.
- Added explicit names/autocomplete/accessibility labels to the relevant search inputs.
- Added explicit image dimensions, alt fallback, lazy loading and async decoding to category images.
- Added explicit for/id, name, autocomplete and semantic input types to Company Settings profile/contact fields.
- No API, route, authorization, tenant or business behavior changed.
- Static source review only; tests/build/browser checks NOT RUN — owner instruction.


### Public company discovery and read pages — Phase 8
- Company directory now uses semantic search/filter/category controls, explicit loading/error/empty states, keyboard focus, and a non-decorative category navigation treatment.
- Company profile uses a flat title-first header, truthful public-catalog explanation and stable heading IDs for loading/error/success states.
- FAQ uses a flat accessible accordion list and a concise support close.
- Terms uses a readable long-form column and section dividers; existing legal copy was preserved unchanged.
- No API, route, permissions or business behavior changed.
- Static source review only; automated tests/build/browser checks NOT RUN — owner instruction.


### Public About page — Phase 9
- Replaced the decorative hero illustration and icon-card value grid with an editorial, text-first composition.
- Kept the marketplace mission, values, process steps and actual API-backed published product list.
- Product navigation uses router links; product images reserve space and load lazily; missing supplier names are omitted.
- No API or business behavior changed. Static review only; tests/build/browser checks NOT RUN — owner instruction.


### Search, address book and shared ProductCard — Phase 10
- Shared ProductCard images reserve space, load lazily, and wishlist controls expose accessible labels and pressed state; supplier details are omitted when unavailable.
- SearchResults has explicit search metadata, conditional disclosure semantics, sort state and quieter flat layout.
- Addresses has semantic form field names/types, load retry, non-conflicting empty/error states and keyboard focus.
- Existing API calls, search URL behavior, address payloads and cart/wishlist actions are unchanged.
- Static review only; tests/build/browser checks NOT RUN — owner instruction.


### Customer profile — Phase 11
- Account profile surfaces are flatter and data-first; profile details use simple rows, not nested cards.
- Account navigation uses router links; edit/password/logout remain actions.
- Avatar and form fields now expose layout/accessibility metadata; failed initial profile loads no longer leave a blank profile shell.
- Existing profile, password, avatar and logout actions are unchanged.
- Static review only; tests/build/browser checks NOT RUN — owner instruction.


### Contact and authentication — Phase 12
- Contact form retains shared validation components and real contact API; form fields now have stable names and the page uses flatter surfaces.
- Login/register use the shared BrandMark and a solid brand panel; registration account-type choice uses native labeled radio inputs.
- Password recovery now has one set of ARIA validation attributes, named email field and semantic links for navigation/email-client launch.
- No authentication, PKCE, registration or contact API contract changed.
- Static review only; tests/build/browser checks NOT RUN — owner instruction.

### Commerce prototype limitation
- Orders.vue currently supplies a hard-coded empty result object; Checkout.vue simulates order confirmation/payment and ShoppingCart.vue simulates discount validation.
- These are not production commerce integrations. Do not represent them as completed during a visual-only redesign; align the UX with approved B2B inquiry-first product policy and real APIs before activation.


### Admin/Company product editors — Phase 13
- Both product editor screens now share a flatter, task-first heading and low-noise section hierarchy.
- Decorative section icons/eyebrow removed; navigation actions are links; image previews reserve dimensions and load lazily.
- Inputs now expose stable names, file upload fields have names, document controls have context-specific accessible names, and the featured switch has an explicit label association.
- Product creation/edit payloads, ownership, permissions, spec templates, tier rules, media handlers and approval lifecycle are unchanged.
- Static source review only; tests/build/browser checks NOT RUN — owner instruction.


### System settings and product catalogues — Phase 14
- Admin SystemSettings is a flat API-backed setting surface with no decorative icon/gradient.
- Company MyProducts and CompanyProducts use semantic navigation links, accessible actions, stable search metadata and no false zero prices.
- Website Products uses native search/category/brand controls, accessible pressed/view states, real loading/error/empty states, stable image dimensions and flatter data-first surfaces.
- Existing APIs, route destinations, filters, sorting, pagination, publish, cart and wishlist event contracts remain unchanged.
- Static review only; tests/build/browser checks NOT RUN — owner instruction.


### Account security, notification preferences and Wishlist — Phase 15
- Admin and Company password forms now use explicit labels/ids, names, autocomplete and required/minimum-length metadata.
- Notification preferences across all three apps have table captions, scoped headers and named channel controls; save is disabled while loading/saving.
- Wishlist category filters are keyboard-operable buttons; remove actions are labeled; missing prices are excluded from the estimated total rather than treated as zero.
- Password, notification, wishlist and cart store/API behavior is unchanged.
- Static review only; tests/build/browser checks NOT RUN — owner instruction.


### Visual direction correction and email inbox redesign — Phase 16
- Owner feedback: previous phases over-applied minimalism, producing visually flat pages and oversized headings/metrics. Do not continue stripping surfaces or reducing every page to plain text and borders.
- New execution direction: compact Persian/Vazirmatn typography, intentional brand presence using the approved turquoise/sky/navy palette (#12B8A6, #39BFE0, #2878C7, #173B63), dark sidebar (#142B46), meaningful surface layers, subtle depth, denser information hierarchy, and consistent interaction states. No new brand, font, dependencies, or fabricated content.
- Admin, Company and Website notification inboxes now use a recognizable email-client structure: branded mailbox header, search/command bar, folder/category rail, sender/subject/preview rows, unread emphasis, and a dedicated reading pane.
- Shared WorkspacePageHeading and KpiCard now use compact type sizes and intentional surface treatment; shared refinement layer restores subtle card/panel/toolbar depth and compact operational metrics instead of removing all visual character.
- Notification APIs, folder membership, read/unread semantics, double-click behavior, bulk operations, delete/save/move behavior and role routes remain unchanged.
- Added regression assertions for sender/subject hierarchy in all three notification inbox test files.
- Static structural review completed; tests/build/browser checks NOT RUN — owner instruction.
- **Commit:** 9fc2eda2c9d3330200ddf810eea5f845b28959bb — https://github.com/gameacc2025/martest/commit/9fc2eda2c9d3330200ddf810eea5f845b28959bb
- Next: apply the corrected visual direction to remaining Admin/Company operational screens and public marketplace surfaces; review typography/density and restore purposeful brand character without generic templates.


### Shared workspace visual character — Phase 17
- Restored contextual PrimeIcons in shared page headings, KPI labels and dashboard section headers without adding oversized icon tiles or decorative gradients.
- Dashboard panels and quick actions now have clear surface framing, restrained elevation, compact labels and purposeful hover/focus states.
- Rebalanced Admin/Company navigation: active items use the established teal wash and accent icon; topbar workspace context is a compact, surfaced control.
- Shared management, access, order, company and identity intro regions now retain meaningful icon marks and subtle brand-tinted surfaces instead of being flattened or hidden globally.
- Settings and product management headings retain their contextual icon marks while keeping eyebrow labels suppressed.
- Updated component tests to assert the restored contextual icon and navigation hierarchy.
- API, routing, permissions, responsive shell behavior and dashboard data contracts are unchanged.
- Static review only; tests/build/browser checks NOT RUN — owner instruction.
- **Commit:** b8d5f9ae80eb767b8dbc5ee930b6d8bb79f18823 — https://github.com/gameacc2025/martest/commit/b8d5f9ae80eb767b8dbc5ee930b6d8bb79f18823


### Public marketplace visual correction — Phase 18
- Homepage hero is now more branded but less oversized: compact context label, reduced title scale, prominent search field and a restrained teal edge accent.
- Restored distinct surfaces for homepage category/product sections, filters and product cards; product cards regain subtle elevation and restrained hover response.
- Marketplace capability items now display their existing contextual icons and use compact, grouped feature surfaces.
- Product listing title and card hierarchy is compact; product category badge no longer relies on backdrop blur; cards use controlled depth.
- Category cards regain image-led hierarchy, subtle elevation and hover/focus feedback.
- Corrected stale tests for Homepage slideshow removal and native link/button semantics on Home, Categories and ProductListing. The tests now assert the current implementation rather than the former slideshow/router-push behavior.
- Search inputs now expose stable names and autocomplete behavior; no product data, prices, categories or claims were fabricated.
- Existing product/category APIs, route names, query parameters, filters, price rendering and loading/error/empty states remain unchanged.
- Static source review only; tests/build/browser checks NOT RUN — owner instruction.
- **Commit:** 17230aed53ccd532da211b7fea86a3d12192e80d — https://github.com/gameacc2025/martest/commit/17230aed53ccd532da211b7fea86a3d12192e80d


### Public product, supplier and search experience — Phase 19
- Product detail page now has a compact framed product heading, stronger image/gallery surface, differentiated purchase panel, and compact section/price typography.
- Supplier profile now uses a purposeful company identity mark and a framed brand-tinted header; product catalog and pagination remain API-backed.
- Search results now have a framed query header, compact search controls, a clearer filter rail, results summary and paginator surfaces.
- Shared ProductCard now uses image containment, compact title/company/price hierarchy, a clear footer/action area, subtle elevation and accessible reduced-motion handling.
- Added component regression assertions for product detail heading, company identity mark and search header.
- No product data, supplier details, price values, cart/wishlist behavior, API contracts or route behavior changed.
- Static source review only; tests/build/browser checks NOT RUN — owner instruction.
- **Commit:** e6c1ce4df63bdc2b6609c6941ee92123bd48fceb — https://github.com/gameacc2025/martest/commit/e6c1ce4df63bdc2b6609c6941ee92123bd48fceb


### Company/admin operational forms and catalogues — Phase 20
- Admin and Company product forms now use a compact framed editor header with a contextual product icon, reduced title scale and subtly elevated form sections/repeater rows.
- Company personal product list and company-wide catalogue now use contextual icons, compact page headings, framed data surfaces, and denser table typography.
- Company settings page now has a contextual company icon, compact title and a brand-tinted framed header while preserving existing trust/status indicators.
- Admin and Company inquiry creation pages retain their stepper and progress semantics but use compact heading/field typography and a clearer stepper surface.
- Admin inquiry detail title and cards use compact type and stronger grouping.
- All API requests, form validation, save/publish workflows, inquiry steps, permissions, routes and company status/verification data remain unchanged.
- Static source review only; tests/build/browser checks NOT RUN — owner instruction.
- **Commit:** be7633927702f5a81cfdd85535eea027dbd7c958 — https://github.com/gameacc2025/martest/commit/be7633927702f5a81cfdd85535eea027dbd7c958


### Notification reading drawer — Phase 21
- Replaced the permanently embedded reading column in all three notification inboxes (Admin, Company and Website) with a full-height right-side reading drawer matching the supplied email-client reference.
- Selecting a message opens the drawer over the inbox; the rest of the application is dimmed, the drawer scrolls independently, and the close control returns to the inbox.
- Drawer includes a compact top action bar, subject/date, sender identity, category, message body, save, move-to-folder, mark-read/unread and delete actions, all wired to the existing notification handlers/APIs.
- Initial page load no longer auto-opens the first notification. Single click opens the drawer; the established double-click-to-mark-read behavior is preserved.
- Added regression coverage for drawer opening/closing and semantic message-button interaction in all three app test suites.
- No API, backend, schema, routing, folder membership or authorization changes.
- Static source review only; tests/build/browser checks NOT RUN.
- **Merged:** PR #81 — https://github.com/gameacc2025/martest/pull/81. Squash commit: fbad7a813e5f64759d4f1311bc4e9468e714d2dc.


### Notification inbox visual correction — Phase 22 (owner reference screenshot)
- Reworked the complete notification inbox composition in Admin, Company and Website to match the supplied Myron Mail reference: light neutral page header with breadcrumb, compact folder sidebar on the left, and a full-width message list on the right.
- Moved search into the list toolbar alongside select-page, refresh, mark-all-read and contextual bulk actions; removed the separate oversized toolbar and dark navy hero header.
- Replaced the old three-column grid definition (which no longer matched its two template children) with the intended two-column sidebar + message-list layout.
- Tightened row density, typography, border treatment, folder navigation, selected/unread states and responsive behavior; retained the right-side full-height reading drawer from Phase 21.
- Kept real app capabilities only: no fabricated sender identities, compose flow, star/label persistence or export actions. Existing API data, routes, folder model and handlers are preserved.
- Added structural regression tests for the two-column email composition and integrated search toolbar in all three app test suites.
- Static source review only; tests/build/browser checks NOT RUN.
- **Merged:** PR #82 — https://github.com/gameacc2025/martest/pull/82. Squash commit: f2a2c47584329d3b4354d9d7ba56f9bb894d2048.


### Notification RTL and toolbar refinement — Phase 23
- Corrected the inbox grid to use RTL flow so the folder sidebar is on the right and the message list is on the left for Persian UI; moved the sidebar divider to its visual inner edge.
- Replaced text-heavy header actions with compact icon-only unread and settings controls; unread count is shown as a small badge and accessible labels/tooltips remain available.
- Constrained desktop search to a compact 320px maximum instead of allowing it to stretch across the toolbar; it becomes full-width only on smaller screens.
- Added explicit PrimeIcons font/display rules for inline and PrimeVue button icons while retaining the existing global PrimeIcons stylesheet import.
- Added regression coverage for RTL direction and icon-only header controls in Admin, Company and Website notification tests.
- Existing notification APIs, routes, drawer behavior and message actions are unchanged.
- Static source review only; tests/build/browser checks NOT RUN.
- **Merged:** PR #83 — https://github.com/gameacc2025/martest/pull/83. Squash commit: fc8baacd3457513d95e356542bec0c25ff8e0f68.


### Notification mailbox follow-up — 2026-11-03
- Removed the duplicate internal `mail-breadcrumb` from Admin, Company and Website inboxes; the shared layout breadcrumb is now the only page path.
- Preserved the inbox title and compact header actions.
- Bounded the desktop mailbox to the viewport with independent sidebar/message-list scrolling; the RTL reading drawer remains right-anchored and becomes full-screen on mobile.
- Added regression tests in all three apps for the absence of the duplicate breadcrumb.
- API/business behavior unchanged. Automated tests/builds/browser checks NOT RUN; verify CI before marking this slice validated.


### Breadcrumb width isolation — 2026-11-03
- Shared PageHeader/Breadcrumb moved outside the constrained `.dash-layout-content` wrapper in Admin and Company layouts.
- The breadcrumb now spans the available main-column width; page content and footer retain the existing max-width and padding constraints.
- No API or notification behavior changed. Automated validation not run.


### Mailbox edge-to-edge refinement — 2026-11-03
- Removed the redundant in-page mailbox header; unread and notification-settings icon actions now live in the mailbox sidebar header beside the folder identity/count.
- Removed page-level horizontal padding and the mailbox card border/radius/shadow so the email workspace reaches the available main-column edges beside the application navigation. Mobile retains a small safe inset while the sidebar controls remain visible.
- Applied consistently to Admin, Company and Website notification inboxes; notification data, API calls, routes and actions are unchanged.
- Updated all three notification component regression suites for the new sidebar action placement and removed header.
- Automated tests/builds/browser rendering were not run in this session.


### Admin + Company panel visual rebuild — 2026-11-03
- Applied the approved reference direction to the shared workspace shell used by Admin and Company: navy gradient sidebar, bright sky-blue active navigation and primary actions, turquoise secondary actions, clean white topbar, cool-gray canvas and compact Vazirmatn typography.
- Refined dashboard hero panels, workspace page headings, KPI cards, operational panels, toolbars, form controls, tables, dialogs, responsive spacing and reduced-motion behavior.
- Updated shared KPI and DashboardPanel components; all API-backed dashboard data, route destinations and permission checks remain unchanged.
- UI-only work. Per owner instruction, no UI tests/build/browser validation was run.
- Remaining: continue route-specific polish for every Admin and Company management page; this shared layer is the common foundation, not a claim that every page has been individually redesigned.


## Dashboard correction — 2026-11-03
- Admin dashboard now places platform analytics directly after the KPI row; operational shortcuts and service health are secondary. The chart visualizes existing aggregate counts only; it is not a time-series trend.
- Company dashboard now includes two API-backed status charts: received inquiries by status and company products by lifecycle status. Both use existing inquiry stats/product list data; no sample values or backend changes.
- Shared AnalyticsChart now has clearer grid structure, baseline, wider bars and compact labels.
- No API contracts, routes, permissions or business workflows changed. UI tests/builds were intentionally not run in this pass.


## Reference-led panel redesign — 2026-11-04
- Re-opened the original generated dashboard references from the conversation and reset the implementation direction to that visual system: deep navy left navigation, vivid cyan active state, pale blue-gray canvas, compact white cards, rounded search topbar, gradient telecom hero, colored KPI icon tiles, and compact chart/panel hierarchy.
- Rebuilt shared dashboard sidebar/header styling and left-side desktop shell placement for Admin and Company. Added the account identity footer to the sidebar.
- Reworked KPI tiles and dashboard panels; adjusted Admin and Company dashboard hero/KPI composition to a wide hero beside a 2×2 KPI block.
- Scoped the new global surface/form/table styles to .dash-layout so the public website does not inherit the panel-only restyle. Restored the shared PrimeVue theme and base design tokens to their previous website palette.
- Admin and Company page data, API contracts, routes, permissions and business logic were not intentionally changed. The dashboard visuals use existing API data only; no synthetic historical series was added.
- UI build/browser tests were not run in this pass, per the current instruction.

### Admin company management refinement — 2026-11-04
- Applied the approved reference-led panel visual language to the Admin Company List: compact title treatment, pale blue-to-white workspace surface, denser filter toolbar, cyan primary action, refined data-table hierarchy, company avatar treatment, and explicit focus/reduced-motion states.
- The page continues to use the existing company store, server pagination, filters, permission gates, create/edit dialogs, status activation, and verification actions. No API, route, authorization, or business logic was changed.
- Verification: source-only review; tests/build/browser rendering NOT RUN per owner instruction.
- **Commit:** fd827614e35c8f91708294c3e0c3cfdee08d69d7.
- Next: apply the same approved visual system to the Admin inquiry list and Company inquiry list, keeping the role-specific actions and real inquiry data intact.

### Inquiry workspaces visual refinement — 2026-11-04
- Applied the reference-led Admin/Company panel identity to both inquiry list workspaces: compact branded page heading, pale blue/turquoise toolbar surface, sky-blue primary action, tighter table typography/density, clearer record-count treatment, accessible focus outline and reduced-motion handling.
- Kept role-specific permissions, inquiry scopes/tabs, search/status filters, server-side pagination/sorting, deadlines, response counts, status display and route actions unchanged. No API, backend, schema, permission or RFQ business logic was changed.
- Verification: source-only review; tests/build/browser rendering NOT RUN per owner instruction.
- **Commits:** Admin cf969d8c437d79b941a366e215c8a64676923a49; Company 6df737098b4e367ea984d175dc2744dd7150f49f.
- Next: continue with Admin users/roles and Company user-management screens, then product and order/report surfaces.

### Identity and access workspaces refinement — 2026-11-04
- Applied the same approved panel reference to Admin users, Admin roles and Company users: compact page heading, pale blue/turquoise workspace toolbar, sky-blue primary actions, denser tables, improved record-count hierarchy, clear focus states and reduced-motion handling.
- Preserved STAFF/COMPANY context separation, existing role/access-profile boundaries, permission gates, role assignment and deletion restrictions, Company member visibility/access toggling, API/store calls, pagination and routes.
- No API, backend, authorization or business logic was changed.
- Verification: source-only review; tests/build/browser rendering NOT RUN per owner instruction.
- **Commits:** Admin users 9676dc7b7d5a0ea225fdd70cfbcafdbd244d12fd; Admin roles 87c540ba539daeb5c12139814f60a53155973f4a; Company users aa3acfce509df821d2536de3a2d3f1a69e05b114.
- Next: continue the same visual pass on Admin products/categories and Company product management, then orders and reports.

### Product and category catalogue refinement — 2026-11-04
- Applied the approved reference-led Admin/Company panel treatment to Admin Product List, Admin Category List and Company Product List: compact branded headings, pale blue/turquoise toolbars, cyan primary actions, compact record-count/table hierarchy, keyboard focus and reduced-motion states.
- Preserved the existing product/category APIs, server pagination, search/status filters, product lifecycle and approval/publishing controls, role permissions, routes, and empty/loading states. No backend or business logic changed.
- Verification: source-only review; tests/build/browser rendering NOT RUN per owner instruction.
- **Commits:** Admin products 43af31135b1dcc37dec5ac901b135f738fe915dd; Admin categories 66e8226cbbc2790b563083fc47511cdf05b745ff; Company products e1f3c5ebeb2141efa44e40c636d1bd5758c0a4b0.
- Next: refine product editors/details and operational order/report pages, then continue the remaining route inventory.



### Verified baseline — 2026-11-04
- Full Vitest suite and all three production builds were executed and pass (306/306 tests). Earlier "NOT RUN" notes above are superseded for tests/builds; browser/visual checks remain NOT RUN.
- Open owner decisions: canonical primary color for website vs panels (AGENTS.md vs MASTER.md), and token-ization of hard-coded hex colors in shared dashboard components (dark theme).
- **Applied and verified:** UI-PALETTE-MOCKUP-01 (commits `7cd9f35`, `6c8d7f7`). Shared-ui package is clean of old palette hex. App-level page components (CategoryList, CompanyList, InquiryList, ProductList, RoleList, UserList, Notifications) still contain hard-coded `#39bfe0` / `#12b8a6` — these need separate token-ization passes.


### UI-REDESIGN-TEM-01 — full redesign on the `tem/` visual language — 2026-11-04 (current focus)

**Owner directive:** complete UI/UX rebuild of Website, Admin and Company using the `tem/` HTML files as the primary design source — layouts, visual language, components, colours, typography, spacing, navigation and interactions. One unified brand across all three apps, reusable widgets mandatory, high visual fidelity. Real APIs, auth, RBAC, routing, backend and business rules preserved. No mock data. Persian RTL + Vazirmatn. Browser automation and screenshot loops prohibited → visual checks `NOT RUN`.

**Done (phase 1):**
- `packages/shared-ui/assets/design-system/tem.scss` — authoritative unified visual layer (`--tm-*` tokens + `--ds-*` aliases, typography, buttons/pills, panels, stat tiles, grids, toolbar, avatar, segmented, empty/alert, tables, dashboard shell overrides, PrimeVue alignment, public shell, charts, responsive, reduced-motion).
- `packages/shared-ui/theme.js` — PrimeVue preset moved to the blue/cyan/navy ramp.
- `packages/shared-ui/components/ui/` — 13 reusable presentational widgets + barrel; exported from `packages/shared-ui/index.js`.
- `apps/{website,admin,company}/src/main.js` — `tem.scss` imported after `assets/main.scss`.
- Website shell (`PublicLayout.vue`) and homepage (`Home.vue` + `Home.test.js`) rebuilt; Admin `Dashboard.vue` and Company `CompanyDashboard.vue` rebuilt on Tem widgets with all fetchers/approval workflow preserved.
- Brand hex token-ized in admin/company list pages and all three notification inboxes.
- Verification: three production builds pass; 310/310 Vitest tests pass.

**Done (phase 2):**
- Shared-component cascade: `KpiCard` → `.tm-stat` (all `kpi-card-*` hooks kept), `KpiStatsRow` → `.tm-grid--stats`, `DashboardPanel` → `.tm-panel` (all `.dash-panel-*` hooks kept), `WorkspacePageHeading` gained `eyebrow`/`description`/`icon` + visible tem page-head while keeping `sr-only`.
- Website catalogue rebuilt: `ProductListing`, `Categories`, `ProductDetails` (style block only), `SearchResults` (Tem widgets).
- Legacy hex sweep → `--tm-*` across the 9 Admin/Company list pages, 3 Notifications inboxes, `MyInquiries`, `ContactUs`, `Inquiry*`, `NotificationFolders`, `StatDonut`, layouts, `PublicLayout`, `Home`, `ProductDetails`.
- Dashboard shell (`DashboardSidebar`, `DashboardHeader`) and `BrandMark` aligned to the navy/cyan/blue brand.
- Verification: three production builds pass; 310/310 Vitest tests pass. Visual checks `NOT RUN`.

**Done (phase 4 — structural shell + list rebuild):**
- True structural rebuild, not a token swap. `DashboardSidebar` → tem `.sd` (207px navy rail, cyan CTA pill, count chips, support card, copyright); `DashboardHeader` → tem `.tp` (canvas row, pill search, 46px round icon buttons, avatar user chip). Test contracts kept.
- `tem.scss`: exact `.tm-kpis`/`.tm-kpi` tiles, bare `.ph` page head, `.tools` toolbar, `table.t` rows (49px, transparent header), `.pill` tags, and `body`-prefixed normalization folding legacy list surfaces into one tem card.
- 11 Admin/Company list pages: visible `WorkspacePageHeading`, all `:deep()` overrides and dead CSS stripped (−2154 lines); pages delegate to the shared layer.
- `AdminLayout`/`CompanyLayout`: `primaryAction` wired (`admin-product-create` / `manage-product-create`), 207px rail, canvas background.
- Verification: 310/310 Vitest, three production builds pass. Visual checks `NOT RUN`.

**Done (phase 5 — detail + form workspaces to tem widgets):**
- Admin + Company `ProductForm.vue`, `CompanySettings.vue`, `InquiryCreate.vue`, `InquiryDetail.vue`, `Reports.vue`, and legacy `MyProducts.vue` / `CompanyProducts.vue`: bespoke page headers replaced with the shared `WorkspacePageHeading` (icon/eyebrow/title/description + `#actions` slot); dead header CSS pruned; scoped styles normalised onto `--tm-*` tokens.
- Contracts kept: `FormAccessibility.test.js` label ids / dynamic `inputId` / `min-height: 2.75rem`; `Reports.test.js` per-tab API error + retry strings. Legacy `--ds-*` tokens still resolve through `TelecomPreset`; all `var(--tm-*)` references verified defined in `tem.scss`.
- Verification: 310/310 Vitest, three production builds pass. Visual checks `NOT RUN`.
- **Commit:** `61dcab7` (10 files, +1094 / −2534).

**Remaining (phase 5+):**
1. Admin/Company: `CompanyDetail`, `UserDetail`, `RoleDetail`, `PermissionList` detail/dialog, and remaining settings/order detail surfaces — audit the shared cascade first, rewrite only where insufficient. Preserve server pagination/permissions.
2. Public Website surfaces are already tem-based on `--tm-*` with real APIs and passing tests (`PublicLayout`, `Home`, `ProductListing`, `ProductDetails`, `Categories`, `SearchResults`); no further change required unless a specific gap is found.
3. Account pages (`UserProfile`, `Addresses`, `MyInquiries`, `InquirySubscription`) and auth pages (`Login`, `Register`, `ForgotPassword`) brand pass.
4. `Products.vue` is exported from `pages/public/index.js` but not routed — decide whether to keep/delete.
5. `InquirySubscriptions.vue` / `NotificationManagement.vue` have no summary-stat row; add one only if a real, non-paginated breakdown exists (do not fabricate counts).
6. Re-run `npx vitest run` + the three builds after each phase; commit per phase on `main`; do not push without authorization.

**Phase 2 commit:** `c71d44c`.
**Phase 3 commit:** `7853339`.
**Phase 4 commit:** `150bc35`.
**Phase 5 commit:** `61dcab7`.

**Open decision:** whether to keep the legacy website `components/products/ProductCard.vue` alongside the new Tem product card, or migrate all product surfaces to one shared card.


## 2026-11-04 — TEM widget reuse and operations UI foundation
- Added the reusable OperationalWorkspace composition under packages/shared-ui and exported it from the shared package.
- Reused the existing TEM widget family (TemPageHeader, TemStatCard, TemPanel, TemToolbar, TemStatusPill, charts, legend, meter, avatar and user cell) instead of creating page-specific duplicates.
- Added Admin routes for CRM, finance/settlements, support tickets and retail orders; added a Company support-ticket preview. All new records are visibly demo data; no APIs, migrations or operational actions were fabricated.
- Expanded Company dashboard metrics from existing company-scoped data and added support shortcut. Expanded table KPI summaries for companies, users, products, inquiries and orders. Status breakdowns explicitly say «صفحه جاری»; only the total uses pagination metadata.
- Added docs/OPERATIONS_UI_ROADMAP.md and updated the future-module blueprint and UI redesign execution log.
- CI/GitHub Actions not inspected or run per owner instruction. Local build/browser verification not performed through the remote GitHub editing session.

- Follow-up: CRM has subroutes for overview/leads/pipeline/activities; Finance has overview/settlements/transactions/invoices. Support and Retail Orders are separate menu groups. Added TemLineChart to the shared TEM widget exports. Admin dashboard now uses existing aggregate API fields for active users, pending products and total inquiries; Company dashboard uses authoritative pagination/stat fields for total products and open inquiries.

- Additional TEM extraction: added/exported TemLineChart, TemMailLayout, TemMailRow, TemMailReader and TemActivityTimeline; see docs/OPERATIONS_UI_ROADMAP.md for the complete reusable widget inventory.

- Support now has a customer-facing Website route (/support/tickets) and account-menu entry. COMPANY and STAFF identities are routed via PKCE handoff to their own panel support desk; customer-only access is enforced in the Website router.

- Completed list KPI coverage for Admin categories, roles and permissions, Company users and Company inquiry pages; the notification-delivery page already exposes live aggregate delivery stats. PermissionList.vue now has its missing kpiItems computed definition.

- Added Company-side settlement preview (/finance/settlements), its menu item and dashboard shortcut. All amounts are demo data pending a secure settlement ledger/API.
