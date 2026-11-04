# Storefront Homepage — Telecom Market

## Header and navigation
- Brand name is consistently **Telecom Market**.
- The homepage has one search field in the hero; the compact sticky-header search appears only after the hero search scrolls out of view.
- Navigation separates category browsing from the **همه محصولات** destination and keeps links nowrap.
- One commerce trigger opens distinct **خرید** and **استعلام** destinations. The RFQ destination/count is visible only to authenticated customer accounts; counts are fetched from the existing sent-inquiry API.
- Icon-only actions have accessible labels and 44px targets.

## Hero and discovery
- The hero addresses both retail buyers and project/procurement buyers, with separate purchase and RFQ CTAs.
- Supporting benefits are informational rows, not fake buttons.
- Category cards use distinct category-aware icons, a deliberate 4×2 layout for the eight displayed categories, and API-backed product counts when supplied.
- Trust totals and supplier logos are omitted until an authoritative aggregate/brand source is available.

## Product presentation
- Shared pure presentation helpers classify fixed-price, inquiry-only and volume-tier products from the actual public product projection.
- Cards show image/fallback, product name, SKU, category, supplier, available stock state when supplied, sale-mode badge and price/starting price/inquiry label.
- Inquiry-only and volume products link to product details where the existing inquiry workflow and permission checks apply.
- Fixed-price add-to-cart is displayed disabled with a clear reason until Order and Inventory APIs are available. The localStorage cart is a preview, not an order/checkout implementation.
- The latest-products section shows image/name/SKU/category, supplier, sales mode, price and action. Rows are keyboard-focusable/clickable; on mobile the table becomes cards.

## Value proposition and footer
- “چرا Telecom Market؟” explains real catalogue/inquiry capabilities without unsupported payment, guarantee or shipping claims.
- Inquiry and direct-purchase banners are visually distinct; direct purchase remains preview-only until backend readiness.
- Duplicate About/Contact links were removed. Contact address, telephone, ENAMAD, payment methods, return-policy details and legal destinations are not fabricated where the organization has not supplied verified data.

## Known catalogue gaps
- The current public query supports search/category/price and supplier company filtering at the service level, but the page does not yet provide the complete brand/availability filter UI.
- Product comparison, ratings and reviews need real data models/endpoints and are not simulated.
- No fake supplier counts, stock levels, ratings, discount values or brand logos are used.

## Responsive behavior
- Containers grow to the shared 1,920px maximum.
- Category grid is 4×2 on desktop and 2 columns on narrower widths.
- Product cards use fluid auto-fit tracks; recent products become cards on mobile.
- Playwright viewport checks are authored for 360, 768, 1366, 1920 and 2560px but have not yet been executed.
