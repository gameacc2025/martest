<script setup>
/**
 * KpiCard — list-page metric tile.
 *
 * Renders real values only; `null`/empty values show an em dash rather than a
 * fabricated zero. The visual treatment comes from the shared `.tm-stat`
 * widget (see assets/design-system/tem.scss); the legacy `kpi-card-*` class
 * hooks are retained because other shared components/tests rely on them.
 */
import { computed } from 'vue'

const props = defineProps({
  label: { type: String, required: true },
  value: { type: [Number, String], default: null },
  icon: { type: String, default: 'pi pi-chart-bar' },
  tone: { type: String, default: 'primary', validator: (v) => ['primary', 'success', 'warning', 'danger', 'info'].includes(v) },
  loading: { type: Boolean, default: false },
  to: { type: [String, Object], default: null },
})

// `info` predates the shared widget vocabulary; it maps to the cyan accent.
const tmTone = computed(() => (props.tone === 'info' ? 'accent' : props.tone))

function faNumber(value) {
  if (value === null || value === undefined || value === '') return '—'
  const number = typeof value === 'number' ? value : Number(value)
  return Number.isNaN(number) ? String(value) : number.toLocaleString('fa-IR')
}
</script>

<template>
  <component
    :is="to ? 'router-link' : 'div'"
    :to="to || undefined"
    class="kpi-card tm-stat"
    :class="[`kpi-card--${tone}`, `tm-stat--${tmTone}`]"
    :aria-busy="loading ? 'true' : undefined"
  >
    <span class="kpi-card-icon tm-stat__icon" aria-hidden="true"><i :class="icon"></i></span>
    <span class="tm-stat__body">
      <span class="kpi-card-label tm-stat__label">{{ label }}</span>
      <span v-if="loading" class="kpi-card-value kpi-card-value--skeleton tm-stat__value" aria-label="در حال بارگذاری"></span>
      <strong v-else class="kpi-card-value tm-stat__value tm-num">{{ faNumber(value) }}</strong>
      <span v-if="to" class="kpi-card-destination tm-stat__meta">
        مشاهده جزئیات <i class="pi pi-arrow-left" aria-hidden="true"></i>
      </span>
    </span>
  </component>
</template>

<style scoped>
/* The tile itself is styled globally by `.tm-stat`; only the skeleton bar
   and the destination hint need local rules. */
.kpi-card-value--skeleton {
  display: block;
  width: 3.5rem;
  height: 1.4rem;
  margin-block: 2px;
  border-radius: 5px;
  background: var(--tm-surface-sunk);
  animation: kpi-pulse 1.2s ease-in-out infinite;
}
.kpi-card-destination {
  color: var(--tm-blue);
  font-weight: 600;
}
.kpi-card { text-decoration: none; color: inherit; }
@keyframes kpi-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.45; } }
@media (prefers-reduced-motion: reduce) {
  .kpi-card-value--skeleton { animation: none; }
}
</style>