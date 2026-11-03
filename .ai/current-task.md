# Current Task — Full UI redesign using the four installed skills

**Status:** IN_PROGRESS — shared workspace foundation implemented on main; remaining app surfaces are still in progress.  
**Repository:** gameacc2025/martest  
**Branch:** main  
**Scope:** apps/website, apps/company, apps/admin, packages/shared-ui, design-system/, .ai/ and relevant UI documentation.

## Product constraints
Preserve the established Telecom Marketplace visual identity (Vazirmatn, RTL, teal/navy/petrol palette, logo), Vue 3/JavaScript/PrimeVue 4 stack, existing APIs, routes, PKCE authentication, app-context/RBAC, tenant isolation, inquiry/RFQ rules, product lifecycle, notification behavior and commerce contracts. No fake data or unsupported claims. No backend/schema/API/business-rule changes as part of visual work.

## Skill execution
- UI UX Pro Max: accessibility, responsive layout, semantic tokens, form feedback and performance guidance.
- Taste Skill: product-specific composition; data-first app screens; avoid generic icon tiles, nested cards and decorative chrome.
- Impeccable: Operate mode for Admin/Company, Persuade for public discovery, Read for help/legal pages; preserve established visual world.
- Vercel Web Interface Guidelines: fresh upstream rules retrieved and applied to code review.

## Completed phase 1 — shared workspace foundation
- Reworked KpiCard to show real labels/values as typography, without decorative icon tiles or colored card chrome.
- Reworked DashboardPanel into a flat titled section.
- Reworked QuickActions into compact navigation rows.
- Reworked WorkspacePageHeading into a task-first heading without eyebrow/icon decoration.
- Reworked PageHeader into a lightweight breadcrumb row, avoiding duplicate page titles.
- Added focused component regression tests. Tests are authored but not executed per owner instruction.

## Remaining phases
1. Admin and Company workspace pages, dashboard composition, tables and detail views.
2. Public Website homepage, catalogue, product details, categories, company profiles and content pages.
3. Forms, inquiries, subscriptions, notification inboxes, account pages and all interaction states.
4. Responsive, RTL/LTR, dark/light, keyboard and accessibility hardening across the full 69-page inventory.
5. Update design-system/MASTER.md, UI execution docs, page inventory and worklog as implementation advances.

## Verification
- Browser/screenshot inspection: NOT RUN — owner instruction.
- Automated tests/builds: NOT RUN — owner instruction.
- Static review: ongoing; do not claim full UI completion until all phases are implemented and reviewed.

## Prior independent backlog
The company-owned API/tenant-isolation audit and SMS/provider integration backlog remain separate from this UI-only task. Do not silently mark them complete or change backend behavior while redesigning UI.
