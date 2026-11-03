# Current Task — Full UI redesign using the four installed skills

**Status:** IN_PROGRESS — owner feedback identified over-minimal/oversized visual direction; a richer, compact, brand-led direction is now being applied. The three notification inboxes and shared workspace primitives have received a corrective pass; the full 69-page redesign remains in progress.
**Repository:** gameacc2025/martest  
**Branch:** main  
**Scope:** apps/website, apps/company, apps/admin, packages/shared-ui, design-system/, .ai/ and UI documentation.

## Product constraints
Preserve the Telecom Marketplace identity (Vazirmatn, Persian-first RTL, teal/navy/petrol palette, logo), Vue 3/JavaScript/PrimeVue 4 stack, APIs, routes, PKCE authentication, app-context/RBAC, tenant isolation, inquiry/RFQ rules, product lifecycle, notification behavior and commerce contracts. Do not add fake data or unsupported claims. No backend/schema/API/business-rule changes during this UI-only task.

## Required skill workflow
- UI UX Pro Max: accessibility, responsive layout, semantic tokens, form feedback and performance guidance.
- Taste Skill: product-specific composition; data-first app screens; avoid generic icon tiles, nested cards and decorative chrome.
- Impeccable: Operate mode for Admin/Company, Persuade for public discovery, Read for help/legal pages; preserve the established visual world.
- Vercel Web Interface Guidelines: semantic controls, keyboard/focus, image layout stability, reduced motion and robust states.

## Implemented slices
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
- Kept All/Read/Unread filters and notification type categories.
- Preserved copy-to-SAVED and explicit move semantics, bulk delete/read-state actions and double-click-to-mark-read behavior.
- Website inbox rows now use semantic buttons rather than clickable divs.
- Reworked inbox and notification-preference surfaces to flat, readable tables/lists with responsive overflow and focus states.
- Added a shared fixed-folder normalizer and unit tests.

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
- New execution direction: compact Persian/Vazirmatn typography, intentional brand presence using the existing teal/navy/petrol palette, meaningful surface layers, subtle depth, denser information hierarchy, and consistent interaction states. No new brand, font, dependencies, or fabricated content.
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
