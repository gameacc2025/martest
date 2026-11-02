# Catalogue page override

Applies to public product discovery and Admin/Company product lists.

## Public product discovery
- Use a responsive filter + results layout; filters become a drawer/stacked section on narrow screens.
- Product cards prioritize product image, title, category, supplier and API-backed price when available.
- Keep the card clickable through a semantic link or keyboard-accessible control.
- Show only products returned as publicly visible by the existing API.
- Pagination, filter state and category deep links remain reflected in the existing route/query contract.

## Admin and Company catalogue
- Use the page heading followed by one command surface containing search, status/company filters and the table.
- Keep status, review state and post-approval edit indicators distinct and text-labelled.
- Group row actions consistently and provide tooltips/accessible names.
- Keep STAFF-only approval actions out of the Company workspace; preserve the current permission guards.
- Tables may scroll horizontally within their own surface; do not shrink action targets below 44px.


## Website product listing card refinement (2026-11-02)
- Keep the whole product card keyboard-accessible and navigable to the existing product-details route; do not nest buttons or links inside the card's link-like interaction surface.
- Card hierarchy: product image with category and API-backed starting-price overlays; title; verified supplier cue only when the API explicitly returns company.isVerified === true; supplier name; optional brand/model/SKU metadata; optional short description; and a clear details affordance.
- When no published price tier is returned, state that price must be requested from the supplier. Never show a zero, placeholder or fabricated price.
- Technical identifiers such as SKU use LTR isolation within the Persian RTL layout.
- On small screens, keep cards compact but readable and stack the price/details footer rather than shrinking controls.
