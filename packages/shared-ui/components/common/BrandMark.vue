<script setup>
/**
 * BrandMark — the product logo mark (cyan rounded square, navy signal glyph).
 *
 * Purely presentational and decorative: the visible product name next to it
 * carries the accessible text, so the SVG is hidden from assistive tech.
 * Colors come from the shared design tokens (cyan accent and deep navy) and stay
 * recognisable in both application color schemes.
 *
 * @prop {number|string} size - Rendered width/height in px (default 32).
 */
defineProps({
  size: { type: [Number, String], default: 32 }
})
</script>

<template>
  <svg
    class="brand-mark"
    :width="size"
    :height="size"
    viewBox="0 0 32 32"
    aria-hidden="true"
    focusable="false"
  >
    <rect width="32" height="32" rx="9" class="brand-mark__bg" />
    <path
      d="M9 20.5a9 9 0 0 1 14 0M12.5 17a4.5 4.5 0 0 1 7 0"
      fill="none"
      class="brand-mark__signal"
      stroke-width="2.4"
      stroke-linecap="round"
    />
    <circle cx="16" cy="23.5" r="1.8" class="brand-mark__dot" />
  </svg>
</template>

<style scoped>
.brand-mark { flex-shrink: 0; display: block; }
.brand-mark__bg { fill: var(--ds-accent); }
.brand-mark__signal { fill: none; stroke: var(--ds-navy); stroke-width: 2.4; stroke-linecap: round; }
.brand-mark__dot { fill: var(--ds-navy); }
</style>