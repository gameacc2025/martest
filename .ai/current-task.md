# Current Task — Full UI redesign using the four installed skills

**Status:** IN_PROGRESS — shared foundations, dashboards, public discovery, notifications, inquiry flows, management lists, Company settings, company directory/profile, FAQ/Terms, About, search, address book, customer profile, contact and authentication have received phased updates; full 69-page redesign remains in progress.  
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
1. Admin and Company operational pages: list surfaces for category/company/user/role/permission/product and Company product/user settings have received a first refinement; continue detail/edit flows, orders, reports and operational edge states.
2. Public Website: company directory/profile, FAQ/Terms, About, search results, address book, customer profile, Contact and authentication received first-pass refinements; orders, cart/checkout and inquiry pages remain.
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
