# Website Visual Reference — Owner-Supplied Telecom Market Prototype

**Status:** Approved visual source for the public Website storefront.  
**Scope:** `apps/website` only. Admin and Company remain on the shared application theme.  
**Reference:** The owner-uploaded `telecom_market_platform (1)(1).html` prototype supplied on 2026-11-07.

## Exact brand palette

| Token | Value |
|---|---|
| Cyan / primary | `#22D3EE` |
| Cyan hover | `#06B6D4` |
| Navy | `#0A1625` |
| Petrol surface | `#122438` |
| Purple accent | `#8B5CF6` |
| Deep cyan accent | `#0891B2` |
| Light canvas | `#F8FAFC` |
| Light card | `#FFFFFF` |
| Light text | `#0F172A` |
| Light border | `#E2E8F0` |

Use Vazirmatn and preserve Persian RTL. Dark mode uses the navy/petrol surfaces; light mode uses the exact light canvas/card/text/border values above. Cyan is the primary action color; purple is an accent, not a replacement primary.

## Visual treatments to preserve

- Dark technical hero with cyan and purple radial light, a subtle fiber/grid texture and a deep navy-to-petrol gradient.
- Translucent glass surfaces with `backdrop-filter: blur(16px)`.
- Gradient borders combining cyan, purple and transparent stops.
- Soft cyan/purple glow, restrained card elevation and clear hover lift.
- Cyan gradient primary actions, cyan focus rings, animated highlight/glow on the featured hero panel.
- Fiber-optic loader uses the same cyan/purple palette.
- Respect `prefers-reduced-motion`; all essential content remains visible without animation.

## Implementation contract

- `apps/website/src/assets/marketplace-theme.scss` is the Website-only source for the prototype palette and visual effects.
- `apps/website/src/main.js` loads that stylesheet after the shared base theme.
- `PublicLayout.vue` exposes the existing shared persisted light/dark theme composable; it does not create a second theme store.
- `Home.vue`, `ProductListing.vue` and `Categories.vue` continue to own their existing page structure, real API data, routes, loading/error/empty states and business behavior. The theme stylesheet only changes presentation.
- The shared Admin/Company design tokens are not globally replaced by this Website-specific reference.
- Do not copy hardcoded prototype products, sellers, prices, metrics, testimonials, addresses, checkout behavior or other demo data into the live application. Keep existing API-backed data and honest unavailable states.

## Verification

Run the Website theme contract test, PublicLayout tests, the focused Home/ProductListing/Categories suites and the Website build. Browser side-by-side review is still required to certify visual parity; do not claim it has been completed until performed.
