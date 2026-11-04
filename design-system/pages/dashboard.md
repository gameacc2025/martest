# Dashboard page override

Applies to Admin and Company dashboard pages. Master rules remain authoritative.

## Composition
1. Branded welcome band with a clear role/workspace title and one primary action.
2. KPI row sourced from existing API/store data; keep labels, units and comparison periods explicit.
3. Operational workspace grid: quick actions, inquiry pipeline or analytics, and service/operational status.
4. Recent entities and activity below the primary operational area.
5. Alerts/deadlines must be actionable and linked to their existing route when available.

## Density and hierarchy
- Use 4–6 KPI cards at most in the first row.
- Use a 12-column conceptual grid on desktop; collapse to 2 columns at tablet and 1 column on mobile.
- Do not make every widget the same visual weight. The primary workflow panel receives the most space.
- Prefer real trends and status labels over decorative charts. Hide a chart when the API has no data instead of inventing values.

## Interaction
- Primary action is visible without scrolling on desktop.
- Secondary actions remain links/buttons with real routes.
- Skeleton, empty, partial-data and API-error states remain distinct.
- Respect reduced motion and ensure chart/table labels remain readable in dark mode.

## Shared dashboard navigation and shell
- Admin and Company use one shared sidebar/header shell; keep the menu permission-filtered by the host app and do not duplicate or hard-code route definitions in shared UI.
- Desktop sidebar supports expanded/collapsed states; mobile drawer state is passed explicitly to the shared header.
- Desktop and mobile toggles expose dynamic labels, aria-expanded and aria-controls pointing to the actual navigation container.
- An open mobile sidebar is exposed as a modal navigation dialog. Escape and overlay dismissal behavior remains owned by the host layout.
- Header icon, notification, account and search controls meet 44px minimum targets with visible focus states.
- Preserve the Telecom brand mark, workspace label, company identity, theme switch, notification count, profile menu and search route guard.