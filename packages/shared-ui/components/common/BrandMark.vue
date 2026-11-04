<script setup>
/**
 * BrandMark — the product logo mark (cyan rounded square, navy signal glyph).
 *
 * Purely presentational and decorative: the visible product name next to it
 * carries the accessible text, so the SVG is hidden from assistive tech.
 * Colors come from the unified `tem` brand pair (cyan #2ed3ee primary,
 * navy #0a1c3f secondary) and do not change with the light/dark theme, because
 * the logo must stay recognisable.
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
    <rect width="32" height="32" rx="9" fill="#2ed3ee" />
    <path
      d="M9 20.5a9 9 0 0 1 14 0M12.5 17a4.5 4.5 0 0 1 7 0"
      fill="none"
      stroke="#0a1c3f"
      stroke-width="2.4"
      stroke-linecap="round"
    />
    <circle cx="16" cy="23.5" r="1.8" fill="#0a1c3f" />
  </svg>
</template>

<style scoped>
.brand-mark {
  flex-shrink: 0;
  display: block;
}
</style>