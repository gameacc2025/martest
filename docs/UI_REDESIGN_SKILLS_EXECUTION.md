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
