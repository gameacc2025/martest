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

Use the existing tokens in `packages/shared-ui/assets/design-system/tokens.scss`:
- Primary teal: `#01bec2`.
- Deep navy: `#003a54`.
- Petrol: `#004d6f`.
- Typeface: Vazirmatn through `--ds-font-family`.
- Semantic colors: PrimeVue palette aliases through `--ds-color-*`.
- Surfaces, borders, spacing, radii, shadows and motion: `--ds-*` tokens.

Do not replace the brand with the generic blue palette from the skill's SaaS example. The palette is a reference pattern, while the existing Telecom colors are an explicit product constraint. Do not import external fonts or add a second icon library; use the installed PrimeIcons consistently.

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
