# Myron template widgets — shared Vue components

This directory contains Vue 3 components adapted from the reusable examples in the repository's `store-template/components/` directory.

## Usage

All components are exported from the `@telecom/shared-ui` package root:

```vue
<script setup>
import { TemProductCard, TemStatCard, TemDataCard } from '@telecom/shared-ui'
</script>

<template>
  <TemStatCard title="محصولات منتشرشده" :value="total" variant="default" color="primary" />
  <TemDataCard title="محصولات">
    <TemProductCard :product="product" :to="{ name: 'product-detail', params: { id: product.id } }" />
  </TemDataCard>
</template>
```

## Components

| Component | Purpose |
|---|---|
| `TemProductCard` | Standard product card; accepts a live product object, optional route, category, verified/featured state and action slot |
| `TemStatCard` | Dashboard statistic; variants: `default`, `icon`, `edge`, `tint`, `center`, `gradient` |
| `TemDataCard` | Content panel with header, action and footer slots |
| `TemToolbar` | Responsive toolbar with start/end slots |
| `TemFilterPanel` | Filter container with clear/apply events |
| `TemProgressRow` | Labelled progress indicator |
| `TemPriceRow` | Label/value row for totals and pricing |
| `TemLegendRow` | Chart legend row |
| `TemCustomerCell` | Avatar/name/subtitle cell |
| `TemMailRow` | Selectable mail/inbox row with star and open events |
| `TemChatBubble` | Conversation bubble |
| `TemFaqItem` | Expandable FAQ item |
| `TemPlanCard` | Feature/plan comparison card |
| `TemRoleCard` | Role summary card with permission/user actions |
| `TemTrackingCard` | KPI/tracking panel with chart slot |
| `TemCartItem` | Cart line-item presentation; parent owns quantity and mutations |
| `TemOrderSummary` | Summary rows and total |
| `TemConfirmModal` | Controlled confirmation dialog (`v-model`, `confirm`, `cancel`) |
| `TemBadge`, `TemButton` | Reusable labels and buttons |
| `TemCardBorder` | Accent-border information card |
| `TemPageHeader`, `TemSection` | Page/section composition primitives |
| `TemAlert` | Status and feedback message |

## Guardrails

- Components do not call APIs, access stores, or persist data.
- Do not copy the template's demo records, localStorage cart, checkout, payment, or authentication logic into the marketplace.
- Use the existing API client and domain stores in consuming pages. Keep RFQ/inquiry as the marketplace's primary commercial workflow; do not expose retail cart actions unless the product requirements explicitly enable them.
- Keep Persian/RTL content and existing project tokens. The reference palette is a visual guide; do not globally replace the current brand palette as part of component adoption.
- The public/Admin blog examples in `store-template/admin/blog-create.html` and `blog-details.html` are deferred references only. Implementation is tracked in GitHub issue #84.
