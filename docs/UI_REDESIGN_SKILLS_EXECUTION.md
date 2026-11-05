# UI Redesign — Skill-Based Execution

## Objective
Rework the full customer-facing Website, Company Portal and Admin interface using the repository's installed UI UX Pro Max, Taste Skill, Impeccable and Vercel Web Interface Guidelines. This is a new visual-quality pass over the existing 69-page Vue application inventory, not permission to alter backend behavior.

## Fixed product truth
- Preserve the Telecom Marketplace identity: Vazirmatn, Persian-first RTL, teal #01bec2, deep navy #003a54, petrol #004d6f, existing logo and semantic status colors.
- Keep Vue 3, JavaScript, Vite, Pinia, PrimeVue 4, Tailwind/Sass and @telecom/shared-ui.
- Preserve API calls/contracts, routes, PKCE handoff, role/access-profile boundaries, permissions, tenant ownership, product lifecycle, inquiry/RFQ behavior, notifications and commerce rules.
- Do not introduce fake products, metrics, trends, suppliers, verification states, prices, delivery promises or contact details.
- Use PrimeIcons consistently; do not add another icon package or external font.
- The established visual world in design-system/MASTER.md is authoritative. Do not replace the brand palette.

## Design principles translated from the four skills
- Taste / app screens: operational screens are data-first; KPIs are typography rather than icon tiles; surfaces are flat and separated by rules; navigation recedes; tables align data clearly; meaningful data receives the accent rather than decorative chrome.
- Taste / public pages: derive composition from the telecom equipment marketplace itself; use real product/category content and images already supplied by the API; avoid generic icon-card grids, generic hero templates and unsupported trust claims.
- UI UX Pro Max: prioritize accessibility, touch targets, keyboard support, clear form feedback, responsive behavior, semantic color tokens and stable layouts.
- Impeccable: choose Operate for workspaces, Persuade for public discovery/marketing and Read for help/legal content; refine structure and hierarchy while preserving the established design world; finish loading/empty/error/disabled/focus states.
- Vercel Guidelines: use semantic links/buttons, associated labels, visible focus, aria-live for async feedback, reduced-motion support, responsive image dimensions, URL-backed state where compatible, and robust handling of long/empty content.

## Execution phases
1. Shared workspace foundation — headings, breadcrumbs, KPI presentation, dashboard sections and quick actions. Completed in this first slice.
2. Admin and Company workspaces — dashboards, navigation shell, data tables, detail views and operational density.
3. Public marketplace — homepage, catalogue, categories, product details, company profiles and public content.
4. Forms and task flows — product editing, inquiry creation/responding, subscriptions, notifications, account settings and feedback states.
5. Cross-app consistency and hardening — RTL/LTR isolation, dark/light theme, mobile/tablet breakpoints, keyboard/accessibility and Vercel guideline source review.
6. Documentation and handoff — update page inventory, current task, worklog and design system; report every check not run.

## Phase 1 acceptance
- Remove duplicated page title/breadcrumb chrome from the authenticated shell.
- Use title and real values as the KPI hierarchy; no decorative icon tile or colored card chrome.
- Use flat section frames and compact navigational quick-action rows.
- Keep old props accepted where needed so existing callers do not break during phased migration.
- Add focused component regression tests.
- No backend, API, route, auth, permission, data or business-rule changes.

## Verification constraints
The owner has explicitly asked not to run browser-focused checks or tests/builds. Add/update tests and perform static source review, but mark test execution, builds and visual/browser checks NOT RUN — owner instruction. Do not claim runtime or visual acceptance.


## Progress checkpoint — 2026-11-03

- Shared workspace foundation: implemented and committed.
- Admin/Company dashboard hero and public Home/catalogue/category/product-detail first pass: implemented and committed.
- Public and workspace shells: refined and pending/committed in the current phase.
- Notification inboxes: fixed INBOX/SAVED-only folder presentation, semantic message rows, responsive list/detail layout and retained copy/move/read/bulk actions.
- Notification preferences: simplified matrix and empty/loading states.
- Full UI redesign remains IN_PROGRESS. Do not treat these slices as completion of all 69 pages.
- Automated tests/builds/browser visual checks remain NOT RUN by owner instruction.


## Global shared UI checkpoint — 2026-11-03

The shared PrimeVue/Sakai layer now applies the skill refinements after the legacy styles across Admin, Company and Website. This improves the full application surface in one place: cards/panels no longer add nested shadows, metrics become data-first, quick actions become rows, inputs/buttons get consistent touch targets and focus states, tables use clearer data hierarchy, and motion respects reduced-motion preferences. Page-specific review is still required for each workflow and no full redesign completion is claimed.


## Workflow-family checkpoint — 2026-11-03

The shared DataTable, form-section heading and required-field progress primitives have been refined. Product authoring/catalogue management and inquiry/RFQ pages now inherit cross-app flat-surface rules. Website inquiry subscription uses the shared heading and accessible quota meters. These changes do not complete the remaining public profiles, order/checkout, help/legal, user/role management, or all 69 pages.


## Admin/Company management checkpoint — 2026-11-03

- Admin category, company, user, role, permission and product list screens received a consistent flat, data-first management surface and toolbar treatment.
- Company product and user list search controls now expose stable names, autocomplete behavior and accessible names.
- Company Settings no longer uses a decorative icon/eyebrow hero; status/verification facts remain visible, and profile/contact forms use explicit label associations, semantic input types and autocomplete metadata.
- Category list/preview images now reserve layout space and load below the fold lazily.
- This checkpoint does not complete the remaining detail/edit workflows, reports, or the public Website page inventory.
- No API, route, permission, tenant ownership or business behavior changed. Tests/builds/browser checks remain NOT RUN by owner instruction.


## Public company discovery and read pages — 2026-11-03

- Companies directory now uses a semantic search form, accessible category and sort filters, pressed states for verification filters, keyboard-operable category buttons and explicit loading/error/empty states.
- Company profile has a title-first flat header and stable main heading in loading, error and success states. It continues to show only published public catalog products; no new company endpoint or unsupported profile claims were introduced.
- FAQ accordion now uses a flat list with clear focus and less decorative chrome. Its business answers and accordion behavior are unchanged.
- Terms page is a long-form reading column with clear section separators. Legal copy is preserved verbatim; no legal policy was rewritten.
- Tests/builds/browser screenshots remain NOT RUN by owner instruction.


## About page — 2026-11-03

- AboutUs now uses a title-first hero, text-led values, a clear sequence of marketplace steps and the real published-product archive instead of decorative hero art and generic icon tiles.
- Product links are semantic router links, product images include dimensions/lazy decoding, and missing supplier details are not replaced with invented generic labels.
- Existing API-backed product content and navigation destinations are preserved.
- No tests/build/browser screenshots were run, per owner instruction.


## Search, address book and shared ProductCard — 2026-11-03

- Shared ProductCard now stabilizes image layout, lazily loads product media, exposes wishlist pressed state and accessible labels, and removes generic hover lift/zoom/shadows.
- SearchResults has an explicitly named search input, accessible filter disclosure, sort state, and a flat search heading/state layout.
- Address book fields now carry names and semantic input metadata; loading and load-error states no longer fall through to a misleading empty state, and edit/delete controls have context-aware names.
- Search, cart, wishlist and address CRUD contracts remain unchanged.
- Tests/build/browser screenshots remain NOT RUN by owner instruction.


## Customer profile — 2026-11-03

- Public UserProfile is now a quieter account workspace with flat detail rows, fewer decorative icon tiles, and semantic router links for navigation.
- Avatar media reserves dimensions; profile/password fields carry names and autocomplete; avatar upload has an accessible name.
- Loading and initial-load failure states are explicit. Profile update/password/avatar/logout APIs remain unchanged.
- No tests/build/browser checks were run, per owner instruction.


## Contact and authentication — 2026-11-03

- ContactUs keeps its real contact API and shared validation components, while adding stable field names and removing decorative icon/card chrome.
- Login and registration share the BrandMark and a solid brand panel; the registration type selector now uses native labeled radio controls rather than custom div-based radios.
- ForgotPassword removes duplicate ARIA attributes and uses semantic links for navigation and mail-client launch.
- Auth/PKCE, registration, contact and password recovery contracts are unchanged.
- Commerce caveat: Orders still use a hard-coded empty result; Checkout simulates payment/order confirmation; ShoppingCart simulates discount validation. These are prototypes, not real production integrations, and must not be presented as completed features.
- Tests/build/browser screenshots remain NOT RUN by owner instruction.


## Admin/Company product editors — 2026-11-03

- Both product editor pages now use a simpler heading and section hierarchy, without decorative icon/eyebrow chrome.
- Back/cancel navigation is semantic; inputs and uploads have stable names; image previews reserve dimensions; dynamic document controls are labeled.
- Featured product switch is associated with its visible label.
- Product API payloads, role/ownership checks, specifications, pricing tiers, media handling and moderation lifecycle remain unchanged.
- Tests/build/browser screenshots remain NOT RUN by owner instruction.


## System settings and product catalogues — 2026-11-03

- Admin SystemSettings now uses a flat setting surface; the threshold remains API-backed and its save/retry behavior is unchanged.
- Company MyProducts and CompanyProducts now have semantic create/edit/history navigation, context-specific publish labels, named search and non-fabricated missing-price display.
- Website Products uses semantic search/category/brand controls, explicit loading/error/empty states, stable image dimensions, and reduced decorative card/gradient/hover treatment.
- Existing API, route, publishing, filtering, sort, pagination, cart and wishlist contracts are preserved.
- Tests/build/browser screenshots remain NOT RUN by owner instruction.


## Account security, notification preferences and Wishlist — 2026-11-03

- Admin/Company password pages have explicit label associations, autocomplete, stable names and visible password-length guidance.
- Website/Admin/Company notification preferences use named channel controls, table captions and scoped headers.
- Wishlist uses semantic category controls, contextual remove labels and transparent estimated-price totals that exclude unknown prices.
- Existing password, preference, wishlist and cart behavior remains unchanged.
- Tests/build/browser screenshots remain NOT RUN by owner instruction.


## Corrective art direction — 2026-11-03

Owner feedback rejected the previous over-minimal visual direction: the interface felt lifeless, excessively plain and oversized. The redesign must not equate Taste's restraint with removing all visual structure. The revised direction keeps the existing Telecom Marketplace identity while restoring compact hierarchy and deliberate visual character:

- Use Vazirmatn at compact, consistent operational sizes; avoid oversized page headings and KPI figures.
- Bring back clear surface layering, borders and subtle navy-tinted elevation where it helps grouping and focus.
- Use teal/navy/petrol for purposeful brand presence and real status/data meaning, not decorative gradients.
- Preserve density and email conventions in operational screens; do not turn an inbox into a generic flat list.
- All three notification inboxes now have sender, subject, preview, folder/category navigation, search/commands and a reading pane in a recognizable email-client composition.
- Shared workspace headings, KPI cards and global surface rules now have compact typography and a more deliberate surface hierarchy.
- Existing APIs, permission boundaries, route behavior, and notification interactions remain unchanged.
- Static review only; tests/build/browser checks NOT RUN by owner instruction.

Next phases must apply this corrected direction across remaining pages, not repeat the earlier blanket removal of card surfaces, iconography, and visual detail.


## Shared workspace character restoration — 2026-11-03

- Shared page headings now include their meaningful route-specific icon beside a compact title; eyebrow labels remain omitted.
- KPI labels, dashboard panel titles and quick actions use contextual icons and clearer hierarchy without large icon tiles.
- Dashboard panels and quick actions regain deliberate surface framing and subtle elevation; table and data density remain compact.
- Admin/Company sidebar active states use a restrained teal brand wash and icon accent; topbar workspace context is surfaced.
- Shared management/access/order/company/identity intros and settings/product-management icon marks are restored instead of being hidden by global styling.
- Updated component tests for contextual heading/KPI/panel/quick-action icon output.
- Existing API, role, permission, route, responsive and theme behavior remains unchanged.
- Tests/build/browser checks NOT RUN by owner instruction.


## Public marketplace visual correction — 2026-11-03

- Homepage hero now balances a compact branded context label, reduced title size, clear search and a restrained teal edge accent.
- Home product/category sections, filters and cards regain distinct surfaces, subtle elevation and restrained interaction feedback.
- The four existing marketplace capability descriptions now show their defined contextual PrimeIcons in a compact feature row.
- Product listing heading and product-card typography are compact; product category chips use solid surfaces rather than backdrop blur.
- Category discovery cards use the actual category imagery, clear metadata and subtle depth.
- Updated stale Home/Categories/ProductListing tests to assert the current static hero and semantic links/buttons rather than removed slideshow or click-router handlers.
- Product/category API data, routes, category IDs, search/filter/pagination behavior and price logic remain unchanged.
- Static review only; tests/build/browser checks NOT RUN by owner instruction.


## Public product, supplier and search surfaces — 2026-11-03

- Product details: compact framed title, stronger gallery and content surfaces, differentiated purchase panel, compact price typography and clearer section markers.
- Supplier profile: contextual company identity mark, framed lightly tinted hero and compact catalog heading.
- Search results: framed search/query context, surfaced filter panel, compact results/sort toolbar and paginator.
- Shared ProductCard: contained imagery, compact title/company/price hierarchy, distinct footer/action region and restrained hover depth with reduced-motion handling.
- Added structural regression assertions for the new heading/identity/search compositions.
- Existing APIs, data, product pricing, inquiry permissions, cart/wishlist events, routes and pagination remain unchanged.
- Static review only; tests/build/browser checks NOT RUN by owner instruction.


## Admin and Company operational forms/catalogues — 2026-11-03

- Product editors: contextual product icon, compact title, framed header and softly elevated form sections/repeater rows.
- Company product views: contextual icons, compact heading, surfaced catalogue table and compact data typography.
- Company settings: contextual company icon and framed header while retaining real status/verification indicators.
- Inquiry create/detail: compact title/labels and clear progress/stepper/surface hierarchy while preserving existing stepper semantics.
- No API, form validation, role/permission, route, publish or inquiry workflow changes.
- Static review only; tests/build/browser checks NOT RUN by owner instruction.


## Cross-app TEM reference alignment — 2026-11-05

- Applied the installed Taste Skill app-screen guidance, UI UX Pro Max, shared Design System tokens and the repository's RTL/accessibility constraints to the current cross-app polish pass.
- Used `tem/analytics.html` as the admin/company density and layout reference and `tem/shop.html` as the storefront/card-grid reference; product pages and the shell remain Persian RTL.
- Standardized the semantic radius scale to 4/6/8px (pill radius retained only for intentional chips/badges), strengthened persistent light/dark surface elevation, and removed blanket hover-lift from non-interactive panels.
- Expanded both Admin and Company desktop sidebars from 207px to 256px; preserved the 76px collapsed rail and full-width mobile drawer behavior.
- Aligned header/search controls, sidebar items, settings, notification/subscription panels, profile cards, address cards and inquiry surfaces to compact reference corners and consistent surface depth.
- Storefront homepage featured visual and product/category cards keep live API data, natural RTL reading order, responsive card grids and reduced-motion behavior. No backend, API, permissions, or checkout behavior was changed.
- Commits: `294952a` (shared tokens/shell/home), `8b06f63` (docs + hover behavior), `796df66` (settings/notification/product detail), `48e96d1` (customer account surfaces).
- Verification: CI frontend/shared test step passed on the latest run. Backend test step still fails on two existing unrelated assertions (`POST /messages rejects invalid payloads`, `uploadAvatar` missing-file test). Frontend build step was still running at the last inspection; runtime/browser validation was queued. No local visual browser inspection was performed in this remote GitHub session.


## Final component consistency sweep — 2026-11-05
- Added the final company dashboard, inquiry conversation, About Us product and Website inquiry-subscription card refinements (commit `a87be94`).

- Final polish follow-up (`a87be94`): company dashboard analytics/hero surfaces, company inquiry message bubbles, About Us product cards and Website inquiry-subscription plan/panel cards were brought onto the shared 6–8px radius and elevation rules.
- Latest CI on the preceding documentation commit confirmed frontend/shared tests PASS and all three frontend production builds PASS; backend test step continues to fail only on the two existing assertions for invalid POST /messages payload and missing uploadAvatar file. Migration validation passed. Latest commit CI/migration/runtime workflows are still running/pending.


## 2026-11-05 — Exact TEM reference port (corrective visual pass)
- User clarified that the supplied `tem/analytics.html` and `tem/shop.html` are the exact visual references, not inspiration. Replaced the previous cyan/blue workspace treatment with the actual `tem/style.css` palette and surface language.
- Source values now used by the shared visual layer: canvas `#f4f5fa`, ink `#1d2130`, white cards, 4px card corners, hairline `#eceef5`, subtle `0 1px 3px rgba(20,20,60,.04)` elevation, violet `#7c6cf6`, cyan `#2bb3e8`, green `#22c55e`, orange `#ff6a3d`, amber `#f5a623`.
- Replaced the flat/transparent card and stat overrides in `skill-refinements.scss` with the TEM analytics KPI/card hierarchy, colored compact icon tiles, real white panel surfaces, table treatment and shop-style card surfaces.
- Removed the conflicting appended cyan gradient workspace theme from shared `main.scss`; the exact reference port is now the final shared layer for Admin, Company and Website. Existing RTL direction, live APIs, route logic, permissions and business rules are preserved.
- Updated the semantic brand/radius/elevation tokens and `tem.scss` aliases to the supplied template values.
- Commit: `eba0a64852d1d93367ef9ae4474f37c9ead28ac5`.
- Verification note: source changes committed to `main`; CI/build and browser visual inspection must be checked separately. Do not claim pixel-perfect verification without browser screenshots.
