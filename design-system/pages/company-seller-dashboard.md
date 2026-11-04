# Company Seller Dashboard — Telecom Market

## Information hierarchy
- Single page heading/breadcrumb; no duplicate title or breadcrumb.
- Three KPI groups: **محصولات** (total, published, pending review), **استعلام‌ها** (received, open, awaiting response), **عملکرد** (response success rate, company rank).
- The three actionable metrics (received inquiries, awaiting responses, pending product review) are visually featured. Other values remain secondary.
- KPI cards link to the corresponding filtered list. Product and inquiry filters react to route-query changes.
- Quick actions contain only distinct tasks; product creation remains in the sidebar primary action and page header action, not a repeated quick-access card.

## Charts and flow
- Product lifecycle uses one donut with the total in the center and an adjacent legend showing semantic color, label, count and percentage.
- When one state exceeds 90%, a compact progress representation replaces the low-value donut.
- Inquiry state is represented by one horizontal pipeline with counters and filtered links; no duplicate inquiry bar chart.
- Status colors come from semantic status tokens: published/success, approved/info, pending review/warning, rejected/archived/danger, draft/hidden/neutral.

## States
- KPI values use Persian locale and tabular numerals. Zero values include explanatory copy.
- Product chart and lists have loading, empty, error and retry states.
- Empty inquiry copy guides the seller toward improving product listings.
- Missing company rank explains why ranking is not yet available and what activity contributes to it.
- Order, revenue and low-stock cards are explicitly unavailable until Order and Inventory APIs exist; no fake metrics are shown.

## Responsive behavior
- KPI groups use fluid tracks with a 240px minimum where space permits.
- Operations section places inquiry pipeline and distinct quick actions side by side, collapsing to one column on narrow viewports.
- Company sidebar uses an internal scroll region and becomes a drawer on tablet/mobile.
- E2E viewport coverage is authored for 360, 768, 1366, 1920 and 2560px; it has not yet been run.

## Data and safety
- Product status totals are fetched by supported server status filters, not inferred from the current page of 20 rows.
- API, auth, permission, tenant and inquiry business rules are unchanged.
- Retail orders, sales revenue and inventory remain unavailable because no authoritative Order/Inventory APIs exist.
