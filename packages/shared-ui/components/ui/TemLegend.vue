<script setup>
/** TemLegend — chart key paired with TemDonutChart / TemBarChart. */
defineProps({
  /** [{ label, value, color }] */
  items: { type: Array, default: () => [] },
  /** Format the trailing value (defaults to Persian digits). */
  numeric: { type: Boolean, default: true },
})

function display(value) {
  const n = Number(value)
  return Number.isFinite(n) ? n.toLocaleString('fa-IR') : '—'
}
</script>

<template>
  <ul class="tm-legend">
    <li v-for="item in items" :key="item.label" class="tm-legend__item">
      <span class="tm-legend__swatch" :style="{ background: item.color }" aria-hidden="true"></span>
      <span class="tm-legend__label">{{ item.label }}</span>
      <span v-if="item.value !== undefined" class="tm-legend__value" :class="{ 'tm-num': numeric }">
        {{ display(item.value) }}
      </span>
    </li>
  </ul>
</template>

<style scoped>
.tm-legend { list-style: none; margin: 0; padding: 0; }
.tm-legend__label { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
</style>