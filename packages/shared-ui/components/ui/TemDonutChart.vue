<script setup>
/**
 * TemDonutChart — dependency-free SVG donut for real aggregate shares.
 *
 * `segments`: [{ label, value, color? }]. A zero total renders an empty ring,
 * never illustrative slices. Pass a legend separately with <TemLegend>.
 */
import { computed } from 'vue'

const props = defineProps({
  segments: { type: Array, default: () => [] },
  thickness: { type: Number, default: 12 },
  centerLabel: { type: String, default: '' },
  centerValue: { type: String, default: '' },
})

const RADIUS = 42
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

const PALETTE = ['#1a73e8', '#2ed3ee', '#18c8a0', '#f0b040', '#7b5cf0', '#ed76a5', '#6b7a99']

const total = computed(() =>
  props.segments.reduce((sum, s) => sum + (Number(s.value) || 0), 0)
)

const accessibleLabel = computed(() => {
  if (!total.value) return 'وضعیت محصولات؛ داده‌ای برای نمایش ثبت نشده است'
  return `وضعیت محصولات؛ مجموع ${total.value.toLocaleString('fa-IR')} مورد؛ ${props.segments.map((s) => `${s.label}: ${Number(s.value || 0).toLocaleString('fa-IR')}`).join('، ')}`
})

const arcs = computed(() => {
  if (!total.value) return []
  let offset = 0
  return props.segments
    .filter((s) => (Number(s.value) || 0) > 0)
    .map((s, index) => {
      const value = Number(s.value) || 0
      const length = (value / total.value) * CIRCUMFERENCE
      const arc = {
        label: s.label,
        value,
        color: s.color || PALETTE[index % PALETTE.length],
        dasharray: `${length} ${CIRCUMFERENCE - length}`,
        dashoffset: -offset,
      }
      offset += length
      return arc
    })
})
</script>

<template>
  <div class="tm-donut-wrap">
    <svg class="tm-donut" viewBox="0 0 100 100" role="img" :aria-label="accessibleLabel">
      <circle
        cx="50" cy="50" :r="RADIUS"
        fill="none" stroke="var(--tm-surface-sunk)" :stroke-width="thickness"
      />
      <circle
        v-for="arc in arcs"
        :key="arc.label"
        cx="50" cy="50" :r="RADIUS"
        fill="none"
        :stroke="arc.color"
        :stroke-width="thickness"
        :stroke-dasharray="arc.dasharray"
        :stroke-dashoffset="arc.dashoffset"
        stroke-linecap="butt"
        transform="rotate(-90 50 50)"
      />
      <text
        v-if="centerValue"
        x="50" y="48" text-anchor="middle"
        class="tm-donut__value"
      >{{ centerValue }}</text>
      <text
        v-if="centerLabel"
        x="50" y="62" text-anchor="middle"
        class="tm-donut__label"
      >{{ centerLabel }}</text>
    </svg>
  </div>
</template>

<style scoped>
.tm-donut-wrap { display: grid; place-items: center; width: 100%; }
.tm-donut__value { font-size: 15px; font-weight: 700; fill: var(--tm-ink); font-family: var(--tm-font); }
.tm-donut__label { font-size: 7px; fill: var(--tm-muted); font-family: var(--tm-font); }
</style>