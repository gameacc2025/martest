## Storefront widget extraction — 2026-11-07 (STORE-WIDGETS-01)
- **Status:** DONE. Commit `194eed79` on `main` (not pushed).
- New shared widgets in `packages/shared-ui/components/store/`: `StoreSectionHeading`, `StoreCategoryCard` (tile/panel), `StoreProductCard`, `StoreFilterPanel`, barrel `index.js`.
- Home, ProductListing and Categories now consume these widgets instead of duplicated inline markup; dead card/category/heading CSS removed. `Telecom Market.html` is tracked in the repo root as the design reference (commit `8ad51708`).
- Preserved live APIs, routes/queries, RTL/Vazirmatn, `--tm-*` tokens, the 168–210px grid tracks and 4:5 / 11px / 44px card contracts. No backend/schema/API/auth changes; no fabricated stats/offers.
- Verification: targeted suites 43/43 passed; full `npx vitest run` 358 passed with only the 5 known pre-existing failures (FAQ 1, Terms 2, WorkspacePageHeading 2); `pnpm run build:website` succeeded. Browser/visual checks **NOT RUN** (owner instruction).
- **Next:** optional follow-up — apply `StoreProductCard` to SearchResults/Wishlist/CompanyProfile and retire the legacy `products/ProductCard.vue` if the owner wants one card everywhere; also decide whether `Telecom Market.html` should be kept in-repo.

## Website homepage motion & liveliness — 2026-11-07 (HOME-LIVELY-01)
- **Status:** DONE. Homepage now has a reduced-motion-gated motion layer built from its existing elements; palette/style system unchanged. Commit b813e77a (pushed to origin/main).
- `apps/website/src/pages/public/Home.vue`: `vReveal` directive + shared `IntersectionObserver` (sections, titles, category cards, product shelves, CTAs; bounded stagger); campaign-banner crossfade + subtle `home-hero-drift`; section-title underline sweep; product-card image zoom + CTA arrow nudge (hover/pointer:fine only); autoplay loops pause while the tab is hidden.
- Hidden states are scoped to `prefers-reduced-motion: no-preference` / `:not(.is-revealed)` and use `animation-fill-mode: backwards`, so the reduced/no-JS page is the finished page and post-reveal hover transforms are not shadowed.
- Only existing `--tm-*` tokens used; no new colors, deps, API/route/backend/business changes.
- Verification: `Home.test.js` + `StorefrontCardSizing.test.js` -> 21/21 passed; `pnpm run build:website` succeeded; full `npx vitest run` -> 57 files passed with only the 5 known pre-existing unrelated failures (FAQ 1, Terms 2, WorkspacePageHeading 2). Browser/visual checks **NOT RUN** (owner instruction).
## Public company storefront route hardening — 2026-11-06
- Registered `GET /api/v1/companies/public/:id` directly on the root Fastify app scope instead of inside the company-management plugin. The route is therefore independent of the plugin's authentication hook.
- Added a full-app route-registration regression assertion and synchronized API inventory/OpenAPI metadata to mark the route public.
- The route still uses the same allowlisted controller/service projection; no private company relations are exposed.

﻿# Current Task — Full UI rebuild on the `tem/` visual language (UI-REDESIGN-TEM-01)

**Status:** IN_PROGRESS — the first seller-dashboard and storefront implementation pass is committed directly to main. On 2026-11-05 the public catalogue was promoted to `/` without changing ProductListing content, the duplicate homepage navigation entry was removed, the category menu trigger was flattened, and the header gained a live five-notification preview beside the cart. Targeted regression coverage was added; execution and visual verification are still pending.
**Repository:** gameacc2025/martest  
**Branch:** main  
**Scope:** apps/website, apps/company, apps/admin, packages/shared-ui, design-system/, .ai/ and UI documentation.



## Company storefront redesign and independent public profile — 2026-11-06
- Rebuilt the public company profile page as a storefront: compact company identity header, dedicated company introduction, verified status, contact details, membership date and a tighter responsive product grid.
- Reduced the product grid whitespace by moving from 3 columns / large gaps to 5 desktop columns with 12px gaps, 4/3 tablet columns and 2 mobile columns.
- Added a dedicated unauthenticated GET /companies/public/:id endpoint with an explicit safe field allowlist; only ACTIVE, non-deleted companies are returned. Product counts include only PUBLISHED + PUBLIC products. Private user, inquiry and company-limit relations are not selected.
- The company introduction now loads independently of products, so it remains visible when the company has no published products.
- Added UI, service, controller and route regression coverage. CI/build verification is pending.
  
## Retail catalogue and public company storefront — 2026-11-06
- Added a public retailEnabled product-list filter, backed by Prisma query filtering and the existing public PUBLISHED/PUBLIC visibility clamp.
- Added a homepage section for the newest retail-enabled products; the request is a separate live API query and does not infer retail eligibility from a price tier.
- Expanded the public product response company projection with company description, logo, contact and address fields so the company storefront can display its public profile alongside published products.
- Updated the public company page to render description, address, phone, email, website and verification state when present.
- Best-selling retail ranking remains intentionally unavailable: the current schema has no order/sales records or sales aggregate. Do not substitute featured flags or arbitrary sorting and call them best-selling.
- Targeted test updates added for retail filtering, homepage retail query and company contact details. Execution is pending; do not claim tests/build passed until CI is inspected.

## Website catalogue breadcrumb and spacing — 2026-11-06
- Replaced the public catalogue's large WorkspacePageHeading and trust badge with the shared lightweight PageHeader breadcrumb.
- Set the catalogue route meta title to “فروشگاه تجهیزات شبکه و مخابرات”; the breadcrumb home link points to the catalogue route.
- Reduced PublicLayout main top padding from 24px to 10px. No API/backend changes.
- Source edits committed directly to main. Build, tests and browser visual verification NOT RUN in this GitHub-only session.

## Website header and homepage consolidation — 2026-11-05

- The root route now renders the existing ProductListing page; the legacy `/products` path remains an alias and query filters are preserved. The old separate Home page is no longer routed or shown in the primary navigation. ProductListing content and API behavior were not changed.
- Removed the duplicate “صفحه اصلی” header navigation item; brand mark now returns to the catalogue root.
- Flattened the shared MegaMenu category trigger to match adjacent header links (no surrounding box/border fill); dropdown content and category routing remain intact.
- Repositioned the cart icon directly beside the notification bell for authenticated users (and retained cart access for guests).
- Added a live latest-five notification preview dropdown anchored to the bell and opening toward the left in RTL. It uses the existing notifications list and unread-count endpoints; no mock data or backend changes. Selecting an item opens the existing notification center.
- Added PublicLayout regression coverage for the five-item preview. Automated tests/build and browser rendering have NOT been run in this remote GitHub editing session.
- Source commits: `46a2cdc`, `78225ff`, `32a2329`, `ac03fe6`, `753e421`, `d5da3e3`.
- **Next:** execute Website tests/build, review responsive header/dropdown alignment, and inspect whether any other source still references the old `home` route name.

## Active focused subtask — UI-SELLER-HOME-REDESIGN-01 (2026-11-04)
**Status:** IN_PROGRESS — shared foundation and first page pass committed; final CI and responsive visual verification still pending.

Rebuild only these two surfaces first: Company seller dashboard and Website public homepage. Follow the supplied Telecom Market requirements A–D, with the current mockup-derived navy/sky/cyan palette, Vazirmatn, Persian RTL, Vue 3/JavaScript/PrimeVue 4, and live API data. Reuse existing shared components and the tem/telecom.html / tem/shop.html references; do not create a competing design system.

Acceptance targets: tokenized semantic states/type/spacing/containers; readable Persian numerals and WCAG AA text; keyboard focus and icon labels; light/dark compatibility; responsive layouts at 360/768/1366/1920/2560; seller KPI groups and one inquiry pipeline (no duplicate status chart); no duplicated actions; responsive marketplace hero/categories/products/recent table; clear fixed-price/RFQ/volume distinctions only where source data supports them; loading/empty/error states; tests and documentation.

Safety boundary: existing retail backend has no Order or Inventory models/routes. Do not invent live order/revenue/stock values or enable purchase/checkout from the retailEnabled flag alone. Use honest unavailable/preview states until authoritative APIs exist.

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
- GitHub Actions: the run for 01c247a completed successfully; the run for 6d8bc9b completed with frontend/shared tests and all frontend builds passing; backend tests still fail two unrelated existing tests. The run for 6d1bb13 is pending at this documentation snapshot. An earlier run exposed stale Telecom Marketplace smoke-test assertions; those assertions were updated to Telecom Market.
- Targeted tests added/updated: Home sales-mode scenarios, dashboard product-status scenarios, PublicLayout commerce/RFQ visibility and count, InquiryList route mocks, router/smoke brand expectations.
- Responsive Playwright coverage added for 360, 768, 1366, 1920 and 2560px. E2E/browser rendering has NOT yet been run. The latest build step now runs even when backend tests fail, so frontend build feedback is not suppressed by unrelated backend failures.
- Local production builds and screenshot inspection: NOT RUN in this remote source-editing session.
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

- Retail commerce follow-up: customer Website /orders and Company /retail/orders previews are registered; Admin legacy /orders redirects to /retail/orders. Legacy order endpoints/stores are deprecated because backend has no Order model or /orders routes. Domain/API/ledger design is documented in docs/RETAIL_COMMERCE_AND_SETTLEMENT_DESIGN.md; no real order/payment API or migration has been created.

- Support desk UI now uses shared TicketDeskWorkspace across Admin, Company and Website CUSTOMER. Admin can preview internal notes; Company/Customer never receive them in their page data. All write actions remain disabled pending backend. See docs/SUPPORT_TICKETING_DOMAIN_DESIGN.md for the API/model contract.

- CRM domain contract is documented in docs/CRM_DOMAIN_DESIGN.md. The initial CRM is internal STAFF-only and references canonical User/Company records instead of duplicating identity data.


## 2026-11-04 — WEBSITE-CART-CHECKOUT-SAFETY-01

**Status:** UI slice committed on `main`; checkout remains intentionally non-operational.

- Registered Website routes `/cart` and authenticated CUSTOMER-only `/checkout`.
- Added cart access and item-count badge to the public header.
- Rebuilt ShoppingCart around the existing Pinia cart contract; removed unsupported discount/shipping calculations, fake recommended products, and calls to store methods that did not exist.
- Hardened cart localStorage parsing, product/price/quantity validation, quantity updates, and persistence.
- Added unit tests for cart add/increment, invalid input, quantity update, removal/clear, and malformed storage.
- Rebuilt Checkout as delivery-information + review only. Removed card number/CVV/expiry collection and fake order success. Final submit remains disabled until the server order/payment flow exists.
- Checkout accepts Persian/Arabic digits for phone and postal-code validation.
- Updated `docs/WEBSITE_CART_CHECKOUT_STATUS.md` and `docs/OPERATIONS_UI_ROADMAP.md`.

**Verification:** GitHub source writes and source re-fetch/static review only. Vitest/build/browser checks NOT RUN per owner instruction. No backend/schema/API/payment behavior changed.

**Next:** Continue Website customer surfaces (address book/profile and inquiry pages) or, when the scope moves to operational commerce, implement R1 from `docs/RETAIL_COMMERCE_AND_SETTLEMENT_DESIGN.md` only after resolving the documented retail eligibility, inventory, shipping, commission, return-window and payment-provider decisions. Do not activate cart purchase actions before real server-side pricing, inventory reservation, order and payment APIs are available.


## 2026-11-04 — WEBSITE-CUSTOMER-ACCOUNT-INQUIRY-02

**Status:** UI and route guard improvements committed on `main`.

- Improved `apps/website/src/pages/public/Addresses.vue`: client validation, Persian/Arabic digit normalization for phone/postal code, server-schema length alignment, visible form errors, and a guarded default-address update state.
- Improved `apps/website/src/pages/public/MyInquiries.vue`: request sequence guards prevent stale inquiry/message responses from overwriting the active detail; supplier company options are deduplicated; a sole supplier is selected automatically; draft/message/SMS state resets on navigation; message-load errors are visible and retryable.
- Updated Website router so `/profile`, `/profile/addresses`, and `/my-inquiries` are CUSTOMER-only. COMPANY and STAFF users are redirected through PKCE to their corresponding panel path.
- Corrected escaped digit-validation regexes in both Checkout and Addresses discovered during source re-fetch.
- Added `docs/WEBSITE_CUSTOMER_ACCOUNT_STATUS.md`; updated operations roadmap, current task, project context and worklog.

**Verification:** GitHub source writes plus re-fetch/static review only. Vitest/build/browser tests NOT RUN. No backend, schema, migration or API implementation changed.

**Next:** Audit auth-store profile operations against actual package/backend endpoints before modifying profile editing/avatar/password. Then move to operational retail backend R1 from `docs/RETAIL_COMMERCE_AND_SETTLEMENT_DESIGN.md` only after validating product retail eligibility, stock, shipping, commission, returns and payment provider.


### Customer profile API correction — 2026-11-04
- Audited `packages/auth/store.js`, the website profile page, settings routes/controller/schema/service, and the shared FormData request handling.
- Confirmed profile name updates use `PATCH /settings/profile`; password changes use `PATCH /settings/change-password` and revoke refresh tokens; avatar uses `POST/DELETE /settings/profile/avatar`.
- Fixed a fake avatar implementation: backend now validates JPEG/PNG/WebP MIME plus file signature, enforces a 1 MB limit, writes a generated safe filename under `uploads/avatars`, persists the URL only after file write, and best-effort cleans up the replaced file.
- Added per-route multipart limits and unit coverage for invalid MIME and actual file persistence.
- Added a named production Docker volume `user_uploads:/app/uploads` so static user uploads survive container replacement. Dev backend bind mount already persists `backend/uploads`.
- No Prisma schema or migration changes. This is a narrowly scoped backend correctness/security fix discovered during the UI account audit; it is an explicit exception to the UI-only redesign scope, not a broader backend feature phase.
- Automated tests/build/browser checks NOT RUN. Source was re-fetched for static review.


### Website profile form hardening — 2026-11-04
- Profile name fields are now required and capped at 50 characters before calling the backend; empty values no longer silently skip persistence and close as success.
- Password form validates current password (6–100 backend-compatible), new password (8–100), and confirmation before API submission.
- Avatar picker is restricted to JPEG/PNG/WebP, 1 MB, disabled during upload; duplicate submissions are guarded.
- Missing avatar multipart file now returns a structured 400 AppError rather than a generic 500.
- Added Vitest cases for profile and password validation; expanded Node unit cases for forged MIME/signature and oversized avatar files.
- Avatar URLs are served same-origin in both dev Vite proxy (/uploads) and production nginx proxy (/uploads); no frontend URL rewriting is required.
- Tests/build/browser NOT RUN.
**Next:** Begin retail backend R1 audit/implementation from the existing commerce domain contract, starting with schema/product eligibility, price tier semantics, stock and tenant access; do not activate checkout/payment until the server-side policy and gateway contract are verified.


## Next phase — RETAIL-COMMERCE-R1 — Backend readiness audit
- Audited current Prisma Product/ProductPriceTier/ProductPriceSnapshot/Company/User/AccessProfile/Address models and product service/routes.
- Confirmed no retail enable flag, no inventory balance/movement/reservation models, no Order/SellerOrder models, and no retail payment/webhook APIs. Legacy /orders backend module is removed.
- Product price tiers use Decimal(18,2), quantity bounds and validity dates; minQuantity=1 is only a candidate retail price and is not yet a server-side checkout resolver.
- Retail eligibility must be opt-in, default false; require PUBLISHED + PUBLIC product, ACTIVE non-deleted seller, a currently valid minQuantity=1 tier and positive available stock.
- Added docs/RETAIL_COMMERCE_R1_AUDIT.md with findings, safe defaults, open engineering decisions and R1a/R1b slices.
- No schema/API/checkout activation in this audit. Tests/build/browser NOT RUN.
**Next:** Implement R1a retail eligibility and server-resolved retail catalogue/price contract; keep every existing product retail-disabled by default.


### RETAIL-COMMERCE-R1a — Product retail opt-in
- Added Product.retailEnabled Boolean @default(false) with PostgreSQL migration and composite lookup index.
- Added retailEnabled to product create/update JSON schema and public product projection.
- Added opt-in toggle to Admin and Company ProductForm; old products remain disabled by default.
- Toggle is only an opt-in declaration; no retail catalogue, inventory, reservation, order or payment route is enabled. Existing products cannot be purchased from this field alone.
- Added product service and route schema tests; NOT RUN.
- Migration not applied to any database in this session. Build/browser NOT RUN.
**Next:** R1b inventory balance/movement/reservation models and atomic stock operations; only after stock exists should the retail catalogue resolver return sellable items.


### Progress snapshot — UI-SELLER-HOME-REDESIGN-01 (2026-11-04)
- Completed: semantic design tokens and PrimeVue preset aligned to the current mockup palette; light/dark status colors; BrandMark and app titles use Telecom Market; shared chart/status/skeleton/legend refinements.
- Completed: Company dashboard KPI grouping, lifecycle status donut + legend/90% fallback, inquiry pipeline, filtered navigation links, responsive operations columns, rank/zero explanations and retry/empty/error handling.
- Completed: Website header/search behavior, category mega-menu/navigation wording, purchase/RFQ switcher with authenticated RFQ count, hero/CTA, 4×2 category grid, mode-aware product cards, recent-products table with mobile card layout, compact benefits and footer link deduplication.
- Safety: fixed-price CTA is visible but disabled until authoritative Order and Inventory services exist. No fake stock/order/revenue values were introduced and no backend/schema/API/business-rule code was changed.
- Open: supplier/product trust totals and brand logos, contact address/phone/ENAMAD/payment/returns, product availability/brand filters, compare, ratings/reviews require verified source data or API support. Do not fill these with placeholders that look real.


### Focused correction — shop listing and product-card elevation (2026-11-04)
- In response to visual feedback, restore distinct white elevated product cards (soft persistent shadow, stronger hover elevation, fine border) rather than flat blending into the canvas.
- Rebuild public catalogue composition around `tem/shop.html`: filters on the RTL right, product grid on the left, dense responsive grid, wide container, and larger page sizes (24/48/96). Keep live filters/API contract; do not fabricate unsupported facets.
- Prevent product title/category truncation; allow natural wrapping. Verify dark mode still uses the same semantic surface tokens.


## Current focus — UI-REDESIGN-CARD-AND-STOREFRONT-02 (2026-11-04)
- Priority: finish the Website homepage as a product-led storefront with a live featured-product slider and multiple dense product shelves; make white surfaces/cards visibly elevated according to `tem/analytics.html` and the shared TEM card system.
- Latest source slice: homepage featured slider + latest 12 product-card grid; shared TEM shadows strengthened for light and dark modes; test contracts updated.
- Do not fabricate best-seller rankings, ratings, revenue, stock or brand data. Add those shelves only after authoritative API data exists.
- Remaining: audit all Admin/Company/Website routes for layout/card overrides and fix only grounded defects; preserve APIs, auth, RBAC, workflows and existing design palette. Run Vitest + all three production builds if local workspace is available; inspect GitHub Actions after each push. Visual browser checks remain unavailable/not performed.


### Card elevation audit follow-up — 2026-11-04
- Found and removed a shared TEM regression: legacy Admin/Company list `.card` wrappers explicitly used `box-shadow: none`, which overrode the intended raised-card language. These wrappers now use the shared persistent card shadow.
- PrimeVue DataTable surfaces now receive the same elevation when standalone; nested tables inside an existing entity surface remain frameless and shadowless to avoid double cards.
- Homepage category and capability cards now share the persistent elevation and stronger hover lift.
- Verification remains static source review only; wait for Actions on the current `main` head and address only failures that intersect this UI slice. Existing CI failures previously observed on the older head included unrelated backend message/avatar tests and browser app startup/navigation failures.

- Accessibility refinement: slider auto-rotation now respects `prefers-reduced-motion`; keyboard focus remains a pause state until focus leaves the slider rather than restarting when moving between its controls.


## 2026-11-05 — Active UI polish handoff
- Current task remains cross-app visual QA against `tem/analytics.html` (Admin/Company) and `tem/shop.html` (Website), all RTL.
- Completed in this slice: unified radius/elevation tokens, card surface consistency, compact control corners, storefront homepage card geometry, and 256px Admin/Company sidebars (76px collapsed).
- Preserve existing APIs, route guards, permissions, business workflows, and non-operational checkout safeguards. Never invent data or unsupported facets.
- Latest implementation commit: `294952a11964352aee25c7ded5f23c0b77baec96`.
- Verification still required in a local workspace: `pnpm -r test` / the repository's documented Vitest command and production builds for Website, Admin and Company; visual browser checks were not run.


## 2026-11-05 — Latest handoff
- Cross-app reference alignment has been applied in shared TEM tokens and the relevant Admin, Company and Website card/layout overrides. Expanded sidebar is 256px, collapsed 76px; semantic radii 4/6/8px; card elevation is shared and dark-mode aware.
- Additional page fixes cover System Settings, Notification Management, Inquiry Subscriptions, Product Details, Website Profile, Addresses and My Inquiries.
- Implementation commits: `294952a`, `8b06f63`, `796df66`, `48e96d1` (latest).
- Latest CI frontend/shared tests passed. Backend tests fail on the two known unrelated assertions for invalid POST /messages payloads and missing uploadAvatar file. Frontend build/runtime results were pending at last check; do not call all checks green.
- No backend/schema/API changes. No browser screenshots were taken in this remote source-editing session.


## 2026-11-05 — Latest UI status
- Cross-app visual consistency pass now includes Admin, Company and Website dashboard, catalogue, account, inquiry, notification, subscription and settings surfaces. The shared 4/6/8px radius scale, 280px expanded panel sidebars (76px collapsed), card elevation and RTL shell rules are in place.
- Latest UI commit: `a87be946bd9f0a1ba34e2462655f5f261ad0e1a3`.

- Final polish follow-up (`a87be94`): company dashboard analytics/hero surfaces, company inquiry message bubbles, About Us product cards and Website inquiry-subscription plan/panel cards were brought onto the shared 6–8px radius and elevation rules.
- Latest CI on the preceding documentation commit confirmed frontend/shared tests PASS and all three frontend production builds PASS; backend test step continues to fail only on the two existing assertions for invalid POST /messages payload and missing uploadAvatar file. Migration validation passed. Latest commit CI/migration/runtime workflows are still running/pending.
- Visual browser screenshots were not manually captured. Do not claim pixel-perfect browser verification.


## 2026-11-05 — Exact TEM reference port (corrective visual pass)
- User clarified that the supplied `tem/analytics.html` and `tem/shop.html` are the exact visual references, not inspiration. Replaced the previous cyan/blue workspace treatment with the actual `tem/style.css` palette and surface language.
- Source values now used by the shared visual layer: canvas `#f4f5fa`, ink `#1d2130`, white cards, 4px card corners, hairline `#eceef5`, subtle `0 1px 3px rgba(20,20,60,.04)` elevation, violet `#7c6cf6`, cyan `#2bb3e8`, green `#22c55e`, orange `#ff6a3d`, amber `#f5a623`.
- Replaced the flat/transparent card and stat overrides in `skill-refinements.scss` with the TEM analytics KPI/card hierarchy, colored compact icon tiles, real white panel surfaces, table treatment and shop-style card surfaces.
- Removed the conflicting appended cyan gradient workspace theme from shared `main.scss`; the exact reference port is now the final shared layer for Admin, Company and Website. Existing RTL direction, live APIs, route logic, permissions and business rules are preserved.
- Updated the semantic brand/radius/elevation tokens and `tem.scss` aliases to the supplied template values.
- Commit: `eba0a64852d1d93367ef9ae4474f37c9ead28ac5`.
- Verification note: source changes committed to `main`; CI/build and browser visual inspection must be checked separately. Do not claim pixel-perfect verification without browser screenshots.


## 2026-11-05 — Exact supplied TEM visual implementation (not inspiration)
- Corrected the previous redesign to use the actual files in `tem/`: `style.css`, `analytics.html`, `shop.html`, and `layout.js`. This pass intentionally removes the invented cyan-gradient workspace treatment and the transparent/flat-card overrides that contradicted the supplied reference.
- Shared visual values: canvas `#f4f5fa`, ink `#1d2130`, white cards, hairline `#eceef5`, 4px card corners, restrained `0 1px 3px rgba(20,20,60,.04)` elevation; primary violet `#7c6cf6`, secondary violet `#8878f7`, cyan `#2bb3e8`, green `#22c55e`, orange `#ff6a3d`, amber `#f5a623`.
- Updated the shared PrimeVue/design-system layer, semantic tokens, TEM aliases, Admin/Company shell and active navigation. KPI cards now follow the template hierarchy: label + compact colored icon row, large metric + delta row, quiet comparison caption. Panels/tables use the same white surfaces and fine separators as the reference.
- Website homepage hero, featured products, category tiles, and product listing cards were updated to the TEM white-card/pale-canvas palette and subtle elevation. Existing live product/category API calls, route names, permission gates, checkout safeguards, and RTL layout remain unchanged.
- Files changed in this correction: `tokens.scss`, `skill-refinements.scss`, shared `main.scss`, `tem.scss`, `TemStatCard.vue`, Website `Home.vue` and `ProductListing.vue`.
- Implementation commits: `eba0a648` (shared exact palette/surface port), `907dc86d` / `add4aadc` / `de3dad4a` / `05841b5c` (storefront card/homepage port and CSS/test corrections), `8858f510` (TEM KPI composition), `f424df23` (shell navigation and hero surfaces).
- Verification on `f424df23`: frontend/shared tests PASS; production builds for Website, Admin and Company PASS; database migration validation PASS. Backend tests still fail on the two existing assertions `POST /messages rejects invalid payloads` and `uploadAvatar` missing-file test. Runtime/browser smoke validation is queued/pending; no claim of completed browser visual inspection.


## 2026-11-05 — Shop page structural rebuild + requested sidebar color
- Rebuilt `apps/website/src/pages/public/ProductListing.vue` as a full RTL storefront composition using the supplied `tem/shop.html` layout language: deep navy featured-product carousel, trust/benefit strip, category tiles, featured-product rail, sticky filter sidebar, search, category selection, price bounds, server-supported sort choices, product grid cards, and pagination.
- Kept the existing public product/category store APIs, published/public catalog constraints, product detail route, image selection, and pagination response handling. No checkout or cart action was fabricated.
- Updated dashboard sidebar semantic token and shell surfaces to the user-requested exact `#0d2b53`; expanded the desktop sidebar from 256px to 280px and retained responsive collapse behavior.
- The public catalog API currently supports sorting by `createdAt`, `updatedAt`, and `title`, but exposes no sales/order-count metric. Therefore this pass labels the server-flagged items as `محصولات ویژه` rather than falsely calling them best sellers. A truthful best-seller ranking requires a real sales aggregate/API; no fabricated ranking or backend schema change was introduced.
- Commit: `61f135ba26de72f57c025efa669fa510228e79d3`.
- CI, runtime validation, and migration validation were triggered for this commit and must be checked before claiming success. No browser screenshot validation was performed in this remote session.


## 2026-11-05 — TEM storefront and dashboard layout implementation
- Rebuilt Website `ProductListing.vue` around the supplied `tem/shop.html` composition: featured-product slider, category browsing tiles, selected products, filter sidebar, search, category/price filters, sort choices supported by the live API, product cards, and pagination. The listing is now a store catalogue rather than a plain filter form plus generic grid.
- Applied the requested Admin/Company sidebar color `#0d2b53` via semantic sidebar tokens and shell selectors, and widened the expanded sidebar to 280px.
- Admin and Company dashboard KPI rows and panel surfaces now use the tighter TEM analytics rhythm and 137px KPI tiles.
- Tests for the new shop structure, API contract, product routes, supplier details, price inquiry state, empty/error states, and category route updates were added/updated. A test-only issue with PrimeVue Select stubs and an error alert role was corrected.
- Sales/order count data does not exist in the current public Product API or Prisma schema, so the storefront presents products explicitly flagged `isFeatured` as `محصولات ویژه`; it does not falsely label them best sellers. A real best-seller section requires a sales aggregate/API and cannot be truthfully derived from current product catalogue data.
- Implementation commits: `61f135ba`, `f138ea86`, `f5530466`, `60714786`, `8a70af80`, `90c2dd50`. Latest source commit: `90c2dd50d8305a9a177c05ef5736245c79cb09ea`.
- CI/build, migration validation, and runtime checks have been triggered; final results are pending. Do not claim browser visual verification without screenshots.


## 2026-11-05 — Panel header cleanup and storefront refinement
- Removed the redundant `TemPageHeader` page-title/breadcrumb/action block from both the Admin dashboard and Company dashboard. The Company dashboard retains its active/verified status and add-product action in a compact toolbar, without restoring the large page header.
- Reworked the storefront feature stage into two adjacent, independent blocks: a dark navy featured-product carousel and a separate light company/supplier promotion banner. The featured product text and image now enter with a short transition; reduced-motion preferences are respected.
- Made the storefront filter sidebar explicit in the desktop grid (310px, right-to-left) and pinned its visibility; the product search remains at the top of the sidebar. On mobile, filters stack above the product results.
- Added/updated storefront tests asserting the filter search and paired banner sections are rendered.
- No backend/API or database changes were made.
- Commits: `4c7600b7`, `a97ceb5b`, `2b4b33c0`, `8cffe782`, `f0970a4e`.
- CI and runtime/database validation were triggered for the source changes; final workflow results must be checked before reporting a green status. Browser visual verification was not performed.


## Focused follow-up — UI-COMPANY-ADMIN-PARITY-01 (2026-11-05)
**Status:** IN_PROGRESS — Step 1 shell geometry aligned and committed as `9482da86c943e7ff1256a84911537b56ffc0c4c2`.

**User goal:** Bring the existing Admin panel presentation to the Company Portal so both have the same layout/composition; show every module and data surface that is genuinely available to a company user, while excluding STAFF-only controls and data.

**Accepted scope:** UI/presentation only. Preserve existing Company APIs, auth/PKCE, accessProfile boundary, permissions, tenant ownership, routes, and business behavior. Do not change backend/schema/API or fabricate data. Keep company-specific workspace identity and actions.

**Sequence:**
1. Align the shared dashboard shell geometry — committed; static source review only.
2. Audit Admin navigation and page families against Company routes, role/permission visibility, and available API data. Produce the company-visible page matrix.
3. Implement page composition parity one page family at a time, reusing shared components and existing Company data flows.
4. Add/update focused regression tests and docs; run permitted non-browser tests/builds when repository execution is available. Browser screenshot testing remains prohibited unless the owner authorizes it.

**Current next action:** Step 2 — inspect `dashboardMenu`, Company auth permissions, Company routes/stores, and page implementations; identify displayable modules and gaps without changing behavior.


## UI-SIDEBAR-PRODUCT-CTA-02 (2026-11-05)
**Status:** Implemented and committed to `main`.
- Keep the header sidebar toggle; remove the duplicate collapse control from inside the sidebar.
- Remove product creation CTAs from the shared sidebar, both layouts, the Company dashboard (including empty state), CompanyProducts and MyProducts.
- Preserve product creation buttons only in the canonical Admin and Company product-list pages.
- Add a DashboardSidebar regression test for the absence of duplicate controls/CTA.
- No API/backend/auth/permission/route/business-logic changes. Build and tests have not yet been run in this remote editing session.


## Latest UI slice — Header/breadcrumb/dashboard cleanup (2026-11-05)
- Shared Admin/Company header: removed workspace-label chip entirely.
- Shared PageHeader: breadcrumb now sits in a compact full-width card, aligned to the main workspace gutters.
- Company dashboard: removed the active/verified status toolbar and the Products KPI heading/subtitle; company status remains available in the summary panel.
- No API/backend/auth/permission/route/business-logic changes. Static source checks only; tests/build/browser NOT RUN.


## Latest focus — Company ecommerce dashboard
- Port the compact card sizing and asymmetrical content layout from `tem/ecommerce.html` into Company dashboard.
- Dashboard now has nine requested metrics; live inquiry/product counts use existing APIs and order/inventory counts are explicitly sample data until APIs exist.
- Added recent activity, approaching inquiries, recently approved/unapproved products, recent answered inquiries, quick actions, and a Company-only left-side messages drawer with five clearly marked sample messages.
- Messages drawer is placed below the header; it does not fetch inquiry threads because the existing per-inquiry messages endpoint marks received messages as read during retrieval.
- New KPI helper tests added. Static source review only; tests/build/browser not run yet.


### Latest follow-up
- Product approved/unapproved counts now combine lifecycle statuses correctly, and recent product panels fetch latest records per status.
- Quick access expanded. Updated DashboardHeader regression test to match the removed workspace chip; latest CI is pending.


## Current task — Company dashboard density and sales preview (2026-11-05)
- KPI area: exactly eight cards, three columns on desktop (three rows: 3 + 3 + 2), reduced card/icon/number sizing; responsive two-column/mobile stacking retained.
- Right rail: remove Company summary panel; retain Quick access and use the remaining space for a compact 12-month sales trend chart.
- Sales chart values and growth are demo-only, visibly labeled, and must be replaced by an authoritative sales API when available. Do not present sample revenue as actual company revenue.
- Keep all existing Company APIs, route names, tenant boundaries, permissions and workflows unchanged. No backend/schema/database work.
- Next: run focused dashboard tests and Company production build when local execution is available; inspect CI for the new commits. No browser testing performed.


## Current task — KPI cards one column with adjacent Quick access (2026-11-05)
- Eight KPI cards must be in a single vertical column, compact in height and typography.
- Place Quick access in the adjacent column, aligned with the top and vertical extent of the KPI stack; on mobile stack it below the metrics.
- Keep the sample sales chart in the lower dashboard content. Company summary stays removed.
- Preserve all Company API, tenant, route and permission behavior; no backend/schema changes.


## Current task — Dashboard navigation and message destination fixes (2026-11-05)
- Company message drawer preview rows and footer “مشاهده همه پیام‌ها” must route to the existing `notifications` page, not inquiries. Keep all preview content clearly labeled sample/demo until a real message API exists.
- Do not render empty sidebar section headings. The “بازرگانی” heading is removed from Admin and Company navigation; both roles have a direct “داشبورد” item targeting their own dashboard route.
- “مشاهده سایت” must open the public website: resolve `VITE_PUBLIC_SITE_URL` then `VITE_WEBSITE_APP_URL`; pass the website URL through production Docker build args for both panel apps.
- Document every demo-only area (currently Company message previews and sales chart) as sample data; never imply these are live API records.
- Preserve existing routes, permissions, APIs and backend behavior. No backend/schema changes.


## Current task — Sidebar and order menu refinement (2026-11-05)
- Remove the sidebar promotional “با ما در ارتباط باشید / تماس پشتیبانی” card.
- Add a “سفارشات” parent with working status submenus in both Admin and Company sidebars. Children use the existing retail order routes and query-based status filters; statuses must match the sample rows shown by each panel. Clearly identify the order workspace as sample/prototype until APIs exist.
- Keep ticket handling separate from notifications. Notifications report events; ticket workspace owns the support case lifecycle. Product-related tickets should route to the company that owns the product, while Admin can oversee/reassign. This is a recommendation only; do not implement backend/schema changes without a separate approved task.
- Preserve current APIs, roles, permissions and business workflows. Static checks only; tests/build/browser not run.


## Current task — Dashboard home visibility and ticket navigation (2026-11-05)
- Keep “داشبورد” as the first, directly accessible Home item in the sidebar for both Admin and Company panels, under a visible “پیشخوان” group. Do not make the essential home link depend on `dashboard.read`; keep app role scoping and the correct app-specific route.
- Provide a nested “تیکت‌ها” sidebar group in each panel with “همه تیکت‌ها”, “تیکت‌های باز”, and “تیکت‌های بسته‌شده”. Use the panel-specific ticket route and synchronize the submenu status query with the ticket inbox filter.
- Keep tickets separate from notifications. Ticket page content is still a clearly marked UI preview with sample data; no backend/API/schema/auth/permission changes in this navigation task.
- Static checks only; automated tests/build/browser verification not run.


## Sidebar visibility regression — 2026-11-05
- Root cause found: `useDashboardMenu` read roles from `authStore.user.roles`, while `@telecom/auth` exposes authorization separately as `authStore.roles`. The resulting empty role list hid role-scoped Dashboard, Orders and Ticket menu entries.
- Corrected the shared resolver to read `authStore.roles`; preserved permission checks and router route-existence checks.
- Added regression coverage for Admin and Company role menus, supported role object shapes, missing roles, permission-gated links and route filtering.
- No backend/API/database/auth-contract changes. Retail orders remain a clearly identified UI prototype pending a real backend domain/API.


## Current task — Remove duplicate Admin/Company page heading blocks (2026-11-05)
- Hide the repeated visible page title blocks on Admin and Company pages; use the existing breadcrumb as the visible page title and the active sidebar styling as the navigation context.
- Keep semantic page headings available to screen readers. Preserve heading action slots and all page content/actions.
- Remove the redundant title block from `OperationalWorkspace` pages as well.
- Frontend-only: no routes, menu definitions, APIs, backend, permissions, or business logic changes. Tests/build/browser verification pending.


## 2026-11-05 — WEBSITE-NAV-NOTIFICATION-DRAWER-CATEGORY-FILTER-02
- **Status:** IMPLEMENTED — verification pending.
- Changed the public header's primary catalogue label from «همه محصولات» to «منوی اصلی» and added appropriate icons to desktop/mobile navigation items. Replaced the hamburger glyph with a compass/navigation icon; removed the category trigger caret and per-category chevron indicators.
- Replaced the compact notification dropdown with a fixed, full-height drawer that slides in from the physical left edge, includes a backdrop/close control, and retains the latest-five live API preview and unread styling. No notification API or backend changes.
- Fixed category navigation: the menu previously passed category slugs, while ProductListing expects numeric category IDs and sends them as categoryId to the existing products API. Main-category and subcategory clicks now navigate with their IDs so the catalogue's existing route watcher reloads filtered products.
- Updated MegaMenu and PublicLayout regression tests for category IDs, subcategory filtering, drawer presentation and primary navigation label. Tests/build/browser checks have NOT been run in this GitHub remote-edit session.
- No backend, database, API contract, authentication or permissions changes.
- Source commits: b70b7552, 3c47ae03, 6cdfa7a8, 93318ebb; test commits: 5d3b55df, 82397131, 50f6fc86.

- Category rows now select a context-appropriate icon (fiber, network, wireless, cable, power, telecom, or generic tag) and the remaining decorative arrows were removed from the category navigation. Follow-up source commit: f958be9f.


## 2026-11-05 — WEBSITE-PUBLIC-LAYOUT-TEMPLATE-ERROR-FIX
- **Status:** PATCHED — runtime/build verification pending.
- Fixed the header authentication conditional structure in `apps/website/src/layouts/PublicLayout.vue`: replaced adjacent `<template v-if>` / `<template v-else>` wrappers with explicit `<div v-if>` / `<div v-else>` containers to make the header branch boundaries unambiguous while preserving the authenticated and guest controls.
- The full template tag-balance check reports no unmatched or unclosed elements. Vite build/dev server has not been run in this remote GitHub edit session.
- Commit: 3c1beac5777e9384766d21d2fd44d0a21e8743f4.


## 2026-11-05 — WEBSITE-PUBLIC-LAYOUT-VUE-PARSER-FOLLOW-UP
- The reported Vite SFC parser error persisted after the earlier auth-branch wrapper change. Follow-up cleanup removed the nested JavaScript template literal from the mobile notification-count interpolation, replacing it with a plain concatenation expression and the existing `countLabel` formatter.
- Source commits: `d3ad966e53803b60168af439fc9ecc5c0c6992d6`, `aafa889baafb9051809a4ff1c4110327a411c1bf`.
- Important: remote source edits and static tag-balance checks are not equivalent to running `@vue/compiler-sfc`; the Vite compiler/build has not been executed here. If the error remains, capture the current exact line range from the running checkout because it may not be synchronized with `main`.


## Current task — Adopt Myron template widgets as shared Vue components (2026-11-06)
- **Status:** IMPLEMENTED remotely; local compiler/build verification pending.
- The old `tem/` reference directory was replaced by `store-template/` in the user's preceding commit. Treat `store-template/` as the visual reference, not as runtime application code.
- Added reusable Vue SFCs in `packages/shared-ui/components/tem/` and exported them through `@telecom/shared-ui`. This is a presentation library only: consuming apps own API data, permissions, and actions.
- Priority component for the next Website phase: `TemProductCard`; preserve the live product API, category navigation, supplier verification and inquiry-first marketplace behavior. Do not introduce a sample cart/checkout/payment flow.
- No Website pages have been rewritten in this task. Next phase is the Website redesign and refinement using these shared components.
- **Deferred backlog:** Blog public listing/detail pages and Admin content authoring/management are tracked in GitHub issue [#84](https://github.com/gameacc2025/martest/issues/84). This includes Prisma models, migrations, real CRUD/publish APIs, STAFF permissions, SEO metadata and published-only public visibility. Do not implement now; revisit after Website UI rewrite.
- **Verification:** remote source review only. Vue SFC compilation, unit tests, package builds and browser rendering remain NOT RUN; browser checks are prohibited unless the owner authorizes them.
- **Commits:** `5430734ddf08a650ac225641228ef286676389e7`, `a2ffbfd15f410c59b5ba9887dcca6dd45c5dbc81`.
- **Next action:** pull latest `main` locally and continue Website UI rewrite with `TemProductCard` and the new shared widget library.
## Current task — Promotional banner campaigns (2026-11-06)
- **Status:** Implemented in source on main; verification and database migration application remain pending.
- A dedicated Banner domain now exists, separate from Product. It supports scheduled campaigns, image upload, target link, CTA, placement and priority.
- Backend routes are registered at /api/v1/banners: public active feed plus STAFF-only management endpoints. Authorization uses existing banners.create/read/update/delete and media.upload permissions.
- Admin UI route: /banners; sidebar item is permission-gated. Website homepage uses bannersApi.listActive('HOME_HERO') to render an independent, slightly wider campaign carousel alongside the product slider.
- No blog work, cart/checkout behavior, product workflow or inquiry/RFQ behavior was changed.
- **Do not claim tests/builds/migration passed:** they have not been executed in this remote source-edit session. Apply migration and run the documented checks locally.
- **GitHub branch cleanup:** user requested deletion of feat/advertising-banners. The connected GitHub actions expose branch creation/ref movement but no branch/ref deletion action; do not claim deletion.

## Current task — Reproducible development database and demo marketplace (2026-11-06)
- Added a development-only repeatable seed extension: 10 demo companies across MANUFACTURER/IMPORTER/TELECOM_OPERATOR, 3 scoped users per company (manager/catalog/sales), 5 customer accounts, and 5 product families for each of the 15 top-level categories. Each family is listed by two suppliers.
- Demo login password defaults to A123@456 and can be overridden with DEMO_USER_PASSWORD. Demo fixtures are skipped in production or when SEED_DEMO_DATA=false. Indicative prices and product reference specifications are marked as development data and require datasheet/supplier verification.
- Added Product.catalogCode as shared manufacturer/model identity distinct from each seller's SKU. Inquiry publication resolves all active suppliers with a published matching catalogCode and retains STAFF notifications; buyer company is excluded.
- Added a guarded development reset script requiring NODE_ENV=development and the telecom_marketplace database; it runs prisma db push --force-reset followed by the idempotent seed. Normal startup does not reset the database.
- Historical migrations are preserved for production deployments; a new migration adds catalogCode for migration-based deployments.
- Remote GitHub source edits only. Prisma validation, database reset, seed execution, Node tests, and app builds remain to be run locally; do not report them as passed.


- Public product detail now exposes catalogCode and GET /api/v1/products/:id/similar returns matching public listings from other active suppliers. Product create/update derives the shared code from brand + model unless an explicit code is provided.

- Website product detail now shows same-model listings from other suppliers, and the shared catalog code is visible in the company and admin product tables. Demo product specifications are also emitted in the website's standard key/value format.
- Regenerated the stale architecture dependency graph and changed CI sequencing so backend tests/build checks still execute after frontend test failures.

## Current task — Website homepage and storefront composition (2026-11-06)
- **Status:** Implemented remotely on feat/website-home-storefront; verification pending.
- Homepage campaign hero uses the scheduled active Banner feed (HOME_HERO) and includes previous/next/dot controls plus a fallback state when no campaign is active.
- Product categories are horizontally browsable directly below the hero; the all-categories link remains visible.
- Featured listings remain explicitly labelled «محصولات منتخب». Do not call them «پرفروش‌ترین» until a verified sales aggregate/public API exists; the current marketplace has no authoritative sales ranking.
- Recent published products remain a separate section. Introductory feature cards and inquiry/retail CTA panels remain before the public footer.
- Header search is icon-triggered and opens a styled search popover. Cart opens a left-side drawer backed by the existing Pinia store, with thumbnails, price, quantity controls, remove, subtotal, continue shopping and checkout navigation.
- Checkout remains a preview only; do not represent the drawer CTA as a completed order or payment.
- No backend/schema/API/auth/permission changes. Updated source-contract tests. Vue compiler, tests, builds and browser rendering still need local execution.



## 2026-11-06 — WEBSITE PRODUCT CARD CONSISTENCY AND HOMEPAGE COMPLETION

- Standardized public product-card image proportions to portrait 4:5 across the homepage, primary catalogue, legacy product grid, search results, and the shared ProductCard component. Cards use compact typography/spacing and consistent grid sizing; mobile grids retain two columns where space allows.
- Homepage featured and newest sections each request and render at most 8 products (two rows at four columns on desktop). Loading placeholders now follow the same count and card silhouette.
- Added a live hero search form connected to the existing `search` route in both scheduled-campaign and no-campaign hero states.
- Added three pre-footer discovery/promo cards linking only to existing routes and describing capabilities backed by current catalogue, company metadata and inquiry workflows.
- Removed the catalogue's remaining violet accents in favor of the approved blue/cyan semantic tokens; homepage card focus uses the shared focus token.
- **Bestseller data constraint:** no authoritative sales/order aggregate or public bestseller endpoint exists. The homepage section therefore remains honestly labelled «محصولات منتخب» and uses the existing featured flag; do not rename it «پرفروش‌ترین» or infer sales rank until a real aggregate/API is available.
- No backend, schema, migration, API contract, authentication, permission or commerce behavior changed. Checkout remains a preview and fixed-price cart actions remain disabled.
- Added/updated source-contract tests for homepage limits, card proportions, hero search, promo cards and catalogue card layout. Tests/build/browser visual checks were NOT RUN in this remote GitHub editing session.


## Website catalogue cleanup and card-density correction — 2026-11-06
- Removed the supplier-promotion banner and the three-item marketplace-benefits strip from the dedicated `/products` catalogue; these marketing elements do not belong in the product browsing/filtering flow.
- The featured-product hero remains, now spans the full catalogue content width instead of reserving an empty banner column.
- Reduced catalogue product-card footprint to match the shared TEM card rhythm: portrait 4:5 image, 11px body padding, compact 13px/44px two-line title, smaller image inset and tighter footer spacing. Desktop density is five columns, six on very wide screens, four at medium desktop, three at tablet and two on mobile.
- No API, route, backend or product behavior changes. Test assertions updated; execution and browser visual verification remain pending.



## Website homepage/menu/card consistency pass — 2026-11-06
- Corrected the public header's “صفحه اصلی” destination: logo and desktop/mobile homepage navigation now resolve to route `home`; a separate “محصولات” link resolves to `products`.
- Fixed MegaMenu interaction: trigger exposes expanded state; category rows are real keyboard-accessible buttons; hover/focus selects a category without toggling it closed; subcategory actions are buttons; empty category data has a clear state.
- Reworked the homepage fallback hero into a storefront composition with live featured-product spotlight, real product search, and catalog/category shortcuts. Added a concise marketplace capabilities strip and strengthened section-heading/product-shelf hierarchy.
- Homepage product cards now follow the same visual structure and dimensions as catalogue cards. Both grids use bounded 168–210px card tracks, 4:5 media, 10px image inset, 11px body padding and 44px two-line titles; column count adapts to available width, including the catalogue filter sidebar. Both mobile grids cap tracks at 210px.
- Each product shelf still shows at most 8 products; no fake banners, supplier claims, or product/order metrics were added. Campaign banners continue to come only from the active scheduled banner API.
- Regression tests updated for home/catalogue navigation and card sizing. CI for latest main commit is running; browser visual inspection has not been performed in this remote GitHub editing session.

- Final alignment: Home and ProductListing now use the same 150–210px card track at the <=520px breakpoint as well; the catalogue no longer applies smaller mobile body/title overrides. MegaMenu now also closes on Escape and exposes `aria-controls`. Latest responsive/menu commits: `166e018`, `a06b76b`, `df3e22a`, `894a404`.

- Verification update for code SHA `ee46af7`: changed-surface tests (Home, ProductListing, PublicLayout and MegaMenu) pass; all frontend builds and backend tests pass; Database Migration Validation passes. The aggregate frontend/shared test step still reports 5 unrelated existing failures in FAQ (1), Terms (2) and WorkspacePageHeading (2). Runtime Validation's disposable Compose/browser-smoke workflow is still running. No manual visual inspection of the homepage has been performed.

- Menu interaction contract preserved after final review: clicking a top-level category navigates directly to its filtered catalogue; hover/focus reveals its subcategory panel; subcategory buttons route to their filtered catalogue. Escape closes the dropdown.


## Cross-site product-card sizing — 2026-11-06
- Extended the shared bounded product-card tracks beyond Home and ProductListing to SearchResults, the legacy Products surface and Wishlist. All product-card grids now use 168–210px tracks above 520px and 150–210px tracks at <=520px, with content-width-driven column counts.
- Compact sizing also applied to shared `ProductCard` and `TemProductCard`: 4:5 image frame, contain-fit image with 10px inset, 11px body padding, 44px two-line title and compact footer. Search/legacy/Wishlist product grids no longer expand into oversized cards.
- Added `StorefrontCardSizing.test.js` to enforce the same sizing contract across all five Website product surfaces and both shared card components.

- **Latest verification (code SHA `3d43d3e`):** all changed-surface tests, including the new 3-test `StorefrontCardSizing.test.js`, pass; all frontend builds and backend tests pass; Database Migration Validation passes. The aggregate frontend/shared suite remains red only for five unrelated existing tests (FAQ 1, Terms 2, WorkspacePageHeading 2). Runtime Validation (Compose and browser smoke) is still running. Manual visual review at desktop/mobile widths remains unperformed.


## 2026-11-06 — HOMEPAGE-REMOVE-REDUNDANT-BENEFIT-SECTIONS
- Removed the three-item `home-marketplace-benefits` strip directly beneath the homepage hero.
- Removed the entire «چرا Telecom Market؟» capability-card section and its now-unused feature data/CSS, including responsive and reduced-motion references.
- Kept the campaign/featured-product hero, categories, product shelves, promo navigation and inquiry CTA intact; no API, backend, schema or route changes.
- Updated homepage source-contract tests to assert these redundant blocks stay absent.
- Verification: source edits committed; tests/build/browser visual checks have not been run in this remote GitHub editing session.

## Public company profile route follow-up — 2026-11-06
- Follow-up CI exposed a stale OpenAPI route inventory assertion (152 vs 153); updated the expected count to 153.
- Updated CompanyProfile component tests to assert the current storefront markup (`company-logo`, `company-kind`, `product-count`) rather than obsolete selectors.
- The public endpoint is registered at the Fastify root scope and its controller/service exports are present. Local Docker runtime still cannot be restarted from this remote session; deployment/restart state on the user's machine remains unverified.
