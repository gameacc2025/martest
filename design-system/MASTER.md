# Telecom Marketplace — UI Design System

> Source of truth for the RTL Vue 3 marketplace. This document translates the repository's `ui-ux-pro-max` skill recommendations into the existing product identity and design tokens. It does not authorize a brand-color or typography replacement.

## Product and interface profile

- Product: B2B telecom equipment marketplace with public discovery, company operations and staff administration.
- Primary users: procurement teams, suppliers, company operators and marketplace staff.
- Stack: Vue 3 Composition API (`<script setup>`), Vue Router, Pinia, PrimeVue 4, Sass and the existing shared-ui package.
- Language and direction: Persian-first, RTL by default; preserve correct LTR handling for technical identifiers, SKUs, emails, URLs and numeric values.
- Core interaction model: searchable product catalogue, inquiry/RFQ workflows, company workspace and permission-filtered administration.

## Design direction (derived from ui-ux-pro-max)

The skill's product database recommends a data-dense operational dashboard for SaaS, a feature-rich discovery surface for marketplaces and trust/authority cues for B2B services. Its style database identifies Minimalism & Swiss Style, Flat Design and Soft UI Evolution as strong fits for enterprise dashboards and business tools.

Apply that guidance as a restrained hybrid:
1. **Minimalism + flat structure** for navigation, forms, lists and dense operational screens.
2. **Soft UI Evolution** for surface separation, clear borders, restrained elevation and visible focus states.
3. **Data-dense dashboard composition** for admin/company workspaces: KPI row, operational actions, analytics and recent activity, with real API data only.
4. **Trust & Authority** for public catalogue and supplier context: verified status only when returned by the API, clear supplier identity and transparent product details.
5. **Glass/blur effects only as progressive enhancement** for sticky navigation or overlays; never rely on blur for text contrast or hierarchy.

Avoid neumorphism, excessive gradients, ornamental glass cards, over-animated dashboards, emoji icons, fake KPI data and arbitrary per-page palettes.

## Brand and typography

The approved brand direction is **Turquoise + Sky Blue with a dark navy sidebar**. Use the shared tokens in `packages/shared-ui/assets/design-system/tokens.scss` and PrimeVue preset:
- Primary turquoise: `#12B8A6` (brand accent; light-theme actions use accessible darker ramp).
- Sky blue: `#39BFE0` (secondary accent, active icon/highlight).
- Technical blue: `#2878C7` (links and informational emphasis).
- Deep navy: `#173B63`; dark sidebar: `#142B46`.
- Warm amber: `#E7A64B` (warning/limited promotional emphasis).
- Canvas: `#F2F7FA`; text: `#203247`.
- Typeface: Vazirmatn through `--ds-font-family`.
- Semantic colors: PrimeVue palette aliases through `--ds-color-*`.
- Surfaces, borders, spacing, radii, shadows and motion: `--ds-*` tokens.

Do not use bright turquoise as white-button text background without checking contrast; use the darker accessible primary action shade. Keep the palette disciplined: navy anchors navigation, turquoise owns primary brand accents, sky/blue are supporting colors, amber is reserved for warnings. Do not import external fonts or add a second icon library; use installed PrimeIcons consistently.

## Layout and spacing

- Desktop workspace: persistent RTL sidebar (expanded/collapsed), sticky topbar, centered content region up to the shared wide container token.
- Mobile workspace: off-canvas sidebar with backdrop, Escape/route-close behavior and no horizontal page overflow.
- Public site: sticky header, clear primary navigation, accessible mobile navigation, content-first main region and structured footer.
- Use a 4px base spacing scale; prefer the existing `--ds-space-*` tokens.
- Page sections: 16–24px gaps; major page groups: 24–32px; public landing sections may use more whitespace.
- Operational lists: compact but readable; do not sacrifice row legibility to fit every column.
- Use CSS Grid for dashboard and catalogue composition; collapse to one column at narrow widths.

## Component rules

- Page title: `WorkspacePageHeading` with eyebrow, meaningful H1, short task-oriented description and optional action slot.
- Workspace shell: shared `DashboardHeader`, `DashboardSidebar`, `PageHeader`; do not fork role-specific shells unless behavior truly differs.
- Tables: shared `DataTable` where compatible; otherwise follow its toolbar, filter strip, header, row, loading, empty and paginator hierarchy.
- Forms: group fields into named sections; visible labels, inline validation and persistent error text; keep primary/secondary actions in a clear footer.
- Empty/error/loading states: distinguish no results, failed request and loading. Do not show a blank panel.
- Status: text/icon plus color; never communicate state through color alone.
- Icons: PrimeIcons only, consistent size and stroke/filled treatment; no emoji for interface controls.

## Interaction and accessibility

- Interactive targets should be at least 44×44px (including icon-only actions).
- Every icon-only control has an accessible name; toggles expose `aria-expanded` and `aria-controls` where relevant.
- Use semantic `header`, `nav`, `main`, `section`, `button` and real links.
- Visible keyboard focus; skip link to main content in application shells.
- Normal text contrast target: at least 4.5:1; large text and meaningful UI boundaries: at least 3:1.
- Inputs require associated labels; errors use `role="alert"` or `aria-live` as appropriate.
- Disable submit actions during in-flight requests and show the loading state.
- Respect `prefers-reduced-motion`; use opacity/transform for transitions and keep micro-interactions around 150–300ms.
- Sticky headers must not cover focused or anchor-target content.

## Data integrity and boundaries

- All displayed metrics, charts, products, supplier details and inquiry states must come from existing API/store data.
- Never fabricate sample products, order history, analytics, rankings or availability to fill a visual gap.
- Preserve route names, auth handoff/PKCE behavior, role and permission filtering, tenant isolation, API request/response contracts and existing action handlers.
- Planned modules are visibly marked as future work and remain non-interactive until implemented.
- UI work must not introduce backend, schema or business-rule changes unless separately requested.

## Responsive review breakpoints

Review at 375px, 640px, 768px, 992px, 1200px and wide desktop. Ensure tables have intentional horizontal scrolling, not whole-page overflow. Verify mobile portrait and landscape, keyboard-only navigation, reduced motion, and both light/dark themes.

## Vue implementation conventions

- New components use Vue Composition API and `<script setup>`.
- Use `ref` for primitives, `computed` for derived state, explicit `watch` sources for side effects, and clean up timers/listeners in lifecycle hooks.
- Do not mutate props; communicate with emits or `v-model`.
- Use stable keys for rendered lists; avoid `v-if` and `v-for` on the same element.
- Keep shared state in existing Pinia stores/composables; avoid duplicate global state.
- Test component props, rendered output, user interactions and emitted events with Vue Test Utils/Vitest.

## Pre-delivery checklist

- [ ] No API, permission, auth, tenant or route regressions.
- [ ] Real data only; loading, empty and error states are distinct.
- [ ] 44px targets and accessible names for controls.
- [ ] Keyboard navigation and visible focus work.
- [ ] RTL/LTR technical content is readable.
- [ ] Light and dark modes preserve contrast.
- [ ] 375px layout has no unintended page-level horizontal overflow.
- [ ] Reduced-motion preference is respected.
- [ ] Relevant component tests pass.
- [ ] Admin, Company and Website production builds pass.
- [ ] `.ai/WORKLOG.md`, `.ai/current-task.md` and this design system reflect the actual state.


## Skill-based visual execution (2026-11-03)

The four installed skills are now the required review framework, with this file remaining the product's visual source of truth. Use data-first operational screens, flat section separation, typography-led KPIs, restrained navigation and purposeful accent color. Public discovery should use the marketplace's real catalogue and telecom context rather than generic icon-card scaffolding. Preserve the existing teal/navy identity, Vazirmatn, RTL, PrimeVue and all product/API constraints.

- Admin and Company are Operate surfaces; optimize for scanability, real task completion, dense but legible data, and truthful loading/empty/error states.
- Website discovery and product pages are Persuade surfaces; use real API-backed products, prices, supplier identity and images, without invented trust claims.
- Help and legal pages are Read surfaces; prioritize reading hierarchy and clear wayfinding.
- UI UX Pro Max and Vercel checks govern accessibility, keyboard/focus, touch targets, responsive behavior, form feedback and performance.
- Taste's app-screen rules discourage icon-tile KPIs, generic hero-metric cards, decorative chart chrome and excessive card framing.
- Impeccable refines within this established visual world; do not create a new brand or replace the palette.
- API contracts, routes, PKCE, RBAC, tenant ownership, inquiry and product workflows are immutable during UI-only work.

See docs/UI_REDESIGN_SKILLS_EXECUTION.md for phased execution and .ai/current-task.md for the active handoff.


## Global shared component refinement layer (2026-11-03)

The shared stylesheet loads skill-refinements.scss as a mixin and emits it after the legacy Sakai rules. It applies the same skill-driven rules across Admin, Company and Website: typography-led legacy stat cards, compact quick-action rows, restrained PrimeVue cards/panels, explicit button/input focus states, 44px input targets, quieter DataTables and toolbars, and reduced-motion support. Dialog elevation is retained because dialogs are true overlays. Keep this layer semantic-token driven and do not add per-app palette overrides.


## Forms, tables and inquiry workflow refinement (2026-11-03)

- FormSectionHeader uses a clear title/description hierarchy without an icon tile; RequiredFieldsProgress is a flat semantic progress surface.
- Shared DataTable provides loading/busy and empty-state semantics, restrained mobile row surfaces and consistent keyboard focus.
- Product management and inquiry/RFQ page families inherit the cross-app surface rules from skill-refinements.scss.
- Keep product lifecycle, inquiry access/eligibility, quotas, subscription/payment, API contracts and role permissions unchanged during visual refinement.


## Corrective visual direction — 2026-11-03

The first skill pass was too austere: feedback identified lifeless/plain pages and oversized typography. Do not interpret minimalism as removing all character. Keep the product's existing palette and Vazirmatn, but use compact operational type, purposeful color, differentiated surface layers and restrained elevation. Do not use generic gradients, icon-tile KPI templates, decorative blur or invented data.

- Operational page titles should generally sit around 20–22px, with body and table text around 13–15px where the density requires it; avoid oversized headings and 32px+ KPI values.
- Use real hierarchy: title/description, grouped panels, compact toolbars, clearly differentiated selected/unread/error/success states and data-led accent color.
- Cards and panels may use 1px borders, 10–14px radii and subtle navy-tinted shadows when they clarify grouping; avoid both nested card stacks and completely unframed walls of text.
- Inbox pages should follow familiar email-client conventions: folder rail, search and command toolbar, sender identity, subject, preview, time, unread emphasis and a dedicated reading pane.
- Admin, Company and Website notification inboxes have been refactored to this email-client hierarchy using existing API-backed messages and the existing notification actions.
- Shared WorkspacePageHeading, KpiCard and skill-refinements.scss now use compact typography and intentional surface depth.
- Preserve the established brand tokens, RTL, light/dark theme behavior, API contracts and existing user actions.


## Shared workspace visual character — 2026-11-03

Avoid the false choice between oversized decorative dashboard tiles and completely plain text rows. Use compact contextual icons, meaningful surface framing and small but visible brand accents:

- Shared page headings pair a compact 20px title with the route-specific PrimeIcon; keep eyebrow labels out.
- KPI values remain compact (about 22px) while their meaningful icon sits inline with the label, not in a generic tinted circle.
- Dashboard panels have a framed header/body with a contextual icon; quick actions are compact surfaced links with visible hover/focus.
- Sidebar active navigation uses the existing teal wash/icon accent against the established navy shell.
- Management/access/order/company/identity intro surfaces may use a subtle brand tint and their route-specific icon to identify the task.
- Keep cards/panels purposeful and shallow; avoid both nested-card stacks and completely unframed content.


## Public marketplace composition — 2026-11-03

Use a distinct Persuade composition for public discovery without oversized generic hero typography:

- Brand the hero with a compact marketplace context label, strong search affordance and existing navy/teal identity.
- Keep hero titles around 25–36px; product/category headings around 14–16px; supporting copy around 12–14px.
- Public category and product cards may use a real image area, compact metadata, one-pixel borders, subtle elevation and restrained hover feedback.
- Feature rows should use their actual, task-relevant icons and concise descriptions, not unsupported statistics.
- Avoid backdrop blur for ordinary category/price chips; use solid surfaces and readable contrast.
- Use real API-backed products, images, supplier verification, prices and category counts only.


## Public product and supplier surfaces — 2026-11-03

- Product detail pages should make the product title/category/technical metadata, gallery, price/inquiry actions and supplier identity distinct without oversized type.
- Use a compact framed title panel, a clear image canvas and a differentiated purchase panel; price should be visually prominent but not dominate the page.
- Supplier profile headers should communicate company identity with a contextual mark and existing company data; do not invent ratings, certifications or claims.
- Search pages need a clear query context, search action, filters, sort controls, result count and pagination as distinct but compact zones.
- Shared product cards use real imagery, concise metadata, clear pricing and actions with subtle surface depth.


## Admin and Company operational forms — 2026-11-03

- Product editor pages use a contextual product icon, compact heading and distinct form sections; repeated prices/specifications/images/documents remain grouped as repeatable data, not decorative cards.
- Company product tables use a compact page heading and framed catalogue surface.
- Company settings uses existing company status and verification data in a compact header; never invent verification claims.
- Inquiry creation uses a visible progress indicator and stepper with compact labels; keep the user's progress and field hierarchy obvious.
- Inquiry detail should separate inquiry metadata, items, deadline, responses and actions without excessive heading size.


## Approved visual direction — Turquoise / Sky / Dark Navy (2026-11-03)

This replaces the previous teal/petrol brand palette by explicit product-owner choice.
- Primary brand: `#12B8A6`; accessible light action: `#087F78`.
- Secondary sky: `#39BFE0`; technical blue: `#2878C7`.
- Dark sidebar: `#142B46`; deep brand navy: `#173B63`.
- Warm semantic accent: `#E7A64B`; use only for warnings and rare emphasis.
- Light canvas: `#F2F7FA`; white surface; primary text: `#203247`.
- Keep typography compact and Persian-first (Vazirmatn), with RTL layouts and explicit LTR isolation for technical values.
- The first real-page reference is the shared Notifications inbox: folder rail, compact toolbar/search, sender/subject/preview rows, unread state and a reading pane. It must use existing API data and actions; no mock message content.
- Sidebar remains dark in both app themes; its active state uses a restrained turquoise/sky accent and accessible contrast.
- API, route, authentication, permission, tenant and business logic are unchanged.
