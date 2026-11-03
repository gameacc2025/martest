# Current Task — Full UI redesign using the four installed skills

**Status:** IN_PROGRESS — shared foundation and first dashboard/public marketplace slices implemented; this UI redesign is not complete.  
**Repository:** gameacc2025/martest  
**Branch:** main  
**Scope:** apps/website, apps/company, apps/admin, packages/shared-ui, design-system/, .ai/ and relevant UI documentation.

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

### Admin and Company dashboards
- Removed decorative hero kickers, oversized ornamental marks, gradients and shadows.
- Replaced dashboard welcome panels with a solid brand-navy workspace heading and clear actions.
- Added accessible labels to icon-only product review actions.
- Preserved API-backed metrics, company status and verification state.

### Public marketplace
- Replaced auto-rotating generic homepage slideshow/illustration with a static search-first marketplace introduction.
- Removed autoplay timers and associated motion code.
- Converted homepage and catalogue product tiles into real router links; category tiles into semantic buttons/links.
- Removed unsupported zero fallbacks for missing category product counts and omitted absent supplier names.
- Flattened homepage/catalogue/category/product-detail surfaces and removed decorative card shadows/gradients.
- Added image dimensions/loading/decoding hints to prevent layout shifts.

## Remaining phases
1. Complete Admin and Company pages: navigation shell, tables, detail views, product management, inquiry/RFQ workflows, subscriptions, notification inboxes, account and settings.
2. Complete public Website: search results, product/company profiles, content/help/legal pages and responsive catalogue states.
3. Cross-app hardening: RTL/LTR isolation, dark/light themes, mobile/tablet layouts, keyboard/accessibility and Vercel guideline review.
4. Update the full 69-page inventory and documentation, then provide a truthful completion report.

## Verification
- Browser/screenshot inspection: NOT RUN — owner instruction.
- Automated tests/builds: NOT RUN — owner instruction.
- Static review: ongoing. Do not claim runtime, visual or full redesign acceptance until all pages are reviewed and the user-authorized checks are performed.

## Prior independent backlog
Company-owned API/tenant-isolation audit and SMS/provider integration remain separate. Do not silently mark them complete or change backend behavior during this UI-only task.
