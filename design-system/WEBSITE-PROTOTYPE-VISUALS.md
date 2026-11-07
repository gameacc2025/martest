# Website Visual Reference — Latest Owner-Supplied Prototype

**Status:** Active, mandatory visual source for every public Website route.  
**Reference file:** `gemini-code-1794067101381.html` supplied by the owner on 2026-11-07.  
**Scope:** `apps/website` only. Admin and Company applications must not inherit these overrides.

## Exact palette from the prototype

| Purpose | Light | Dark |
|---|---|---|
| Primary cyan | `#22D3EE` | `#22D3EE` |
| Primary hover | `#06B6D4` | `#67E8F9` |
| Primary active / deep cyan | `#0891B2` | `#0891B2` |
| Secondary indigo | `#6366F1` | `#6366F1` |
| Violet accent | `#8B5CF6` | `#A78BFA` |
| Navy | `#0A1625` | `#0A1625` |
| Petrol / hero surface | `#122438` | `#122438` |
| Page background | `#F0F7FA` | `#0A1625` |
| Header | `#FFFFFF` | `#0D1B2A` |
| Card | `#FFFFFF` | `#122438` |
| Hover surface | `#F0FDFF` | `#193149` |
| Secondary surface | `#F1F5F9` | `#172B40` |
| Border | `#DCE8EF` | `#24394D` |
| Primary text | `#102A43` | `#F0F9FF` |
| Secondary text | `#627D98` | `#9FB3C8` |
| Muted text | `#94A3B8` | `#71869B` |
| Primary button text | `#FFFFFF` | `#083344` |

Semantic status colors from the prototype: success `#22C55E` / `#DCFCE7` / `#15803D`; warning `#F59E0B` / `#FEF3C7`; error `#EF4444` / `#FEE2E2`; info `#3B82F6` / `#DBEAFE`.

## Signature visual language

- Slim navy utility strip; white translucent sticky header; cyan active navigation; navy/cyan fiber identity mark.
- Primary actions in cyan/deep-cyan gradient; violet and indigo remain secondary accents.
- Homepage hero uses a navy-to-petrol gradient, cyan/violet radial light and animated fiber-network data paths.
- Feature surfaces use dark translucent glass, blur, subtle border and cyan/violet light.
- Product/category cards use white or petrol surfaces, restrained shadow, cyan hover border and a small lift.
- Focus rings and selected states use the cyan family. Preserve Vazirmatn, Persian RTL and the current page structure/data behavior.
- Loading overlay is the prototype's actual fiber transmission diagram: network equipment nodes, central violet optical junction, moving cyan/violet data packets and the text `لطفا منتظر بمانید...`. It is not a generic circular spinner.
- Respect reduced-motion preferences without hiding essential information.

## Implementation

- `apps/website/src/assets/marketplace-theme.scss` is the canonical Website token and visual override layer and is loaded after the shared base styles.
- It overrides the semantic design-system tokens and PrimeVue semantic variables for the Website bundle, so header, links, buttons, forms, cards, paginators, drawers and dialogs use the prototype palette rather than the previous teal/blue palette.
- Dark-mode tokens are selected by the existing persisted `html.app-dark` class from the shared `useTheme` composable.
- `apps/website/index.html` contains the prototype fiber-network loader and applies the saved theme class before first paint.
- `apps/website/src/pages/public/Home.vue` includes the animated cyan/violet network paths in the hero.
- Public header includes the prototype-style `ثبت استعلام` action. Remaining hardcoded legacy accents/surfaces in customer inquiries, notification center and product details were replaced with the same semantic tokens; older legacy form aliases are mapped to the prototype palette for account, address, contact, checkout and cart routes.
- Existing API-backed data, routes, inquiry flows and business rules remain unchanged. Never copy prototype sample products, fake contact data or demo checkout behavior into production.

## Regression coverage

- `apps/website/src/assets/marketplace-theme.test.js` asserts the palette, dark mode, PrimeVue variables, public header CTA, loader, hero fiber paths and removal of known legacy teal values from the inquiry/notification/product detail pages.
- The tests are authored but have not been run, per owner instruction.

## Guardrails

- Never replace these values with the older teal palette or generic blue defaults.
- Do not modify shared Admin/Company tokens to achieve Website visuals.
- Do not introduce a second theme store; use the shared persisted theme state.
- Do not claim visual parity until a browser comparison has actually been performed.
