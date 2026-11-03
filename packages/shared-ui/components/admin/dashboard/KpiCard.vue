<script setup>
/** Data-first metric link for operational dashboards; no data fetching or invented comparisons. */
defineProps({
  label: { type: String, required: true },
  value: { type: [Number, String], default: null },
  icon: { type: String, default: 'pi pi-chart-bar' },
  tone: { type: String, default: 'primary', validator: (v) => ['primary', 'success', 'warning', 'danger', 'info'].includes(v) },
  loading: { type: Boolean, default: false },
  to: { type: [String, Object], default: null },
})
function faNumber(value) {
  if (value === null || value === undefined || value === '') return '—'
  const number = typeof value === 'number' ? value : Number(value)
  return Number.isNaN(number) ? String(value) : number.toLocaleString('fa-IR')
}
</script>

<template>
  <component :is="to ? 'router-link' : 'div'" :to="to || undefined" class="kpi-card"
    :class="['kpi-card--' + tone, { 'kpi-card--link': to }]">
    <span class="kpi-card-label">{{ label }}</span>
    <span v-if="loading" class="kpi-card-value kpi-card-value--skeleton" aria-label="در حال بارگذاری"></span>
    <strong v-else class="kpi-card-value">{{ faNumber(value) }}</strong>
    <span v-if="to" class="kpi-card-destination">مشاهده جزئیات <i class="pi pi-arrow-left" aria-hidden="true"></i></span>
  </component>
</template>

<style scoped>
.kpi-card {
  display: flex; min-width: 0; min-height: 7rem; flex-direction: column;
  align-items: flex-start; justify-content: center; gap: .45rem;
  padding: .85rem 1.15rem; border: 0; border-inline-start: 1px solid var(--ds-color-border);
  border-radius: 0; background: transparent; color: var(--ds-color-text); text-decoration: none;
}
.kpi-card-label { color: var(--ds-color-text-muted); font-size: var(--ds-font-size-sm); font-weight: var(--ds-font-weight-medium); line-height: 1.5; }
.kpi-card-value {
  color: var(--kpi-value-color, var(--ds-color-text)); font-size: clamp(1.55rem, 2.2vw, 2rem);
  font-weight: var(--ds-font-weight-bold); line-height: 1.2; font-variant-numeric: tabular-nums;
}
.kpi-card-destination {
  display: inline-flex; align-items: center; gap: .35rem; min-height: 1.5rem;
  color: var(--ds-color-text-muted); font-size: var(--ds-font-size-xs); opacity: 0;
  transition: opacity var(--ds-transition-fast), color var(--ds-transition-fast);
}
.kpi-card--link { cursor: pointer; }
.kpi-card--link:hover .kpi-card-destination, .kpi-card--link:focus-visible .kpi-card-destination { color: var(--ds-color-primary-text); opacity: 1; }
.kpi-card--link:focus-visible { outline: 2px solid var(--ds-color-focus); outline-offset: 3px; }
.kpi-card--success { --kpi-value-color: var(--ds-color-success); }
.kpi-card--warning { --kpi-value-color: var(--ds-color-warning); }
.kpi-card--danger { --kpi-value-color: var(--ds-color-danger); }
.kpi-card--info { --kpi-value-color: var(--ds-color-info); }
.kpi-card-value--skeleton { display: block; width: 3.5rem; height: 1.8rem; border-radius: 3px; background: var(--ds-color-surface-alt); animation: kpi-pulse 1.2s ease-in-out infinite; }
@keyframes kpi-pulse { 0%, 100% { opacity: 1; } 50% { opacity: .45; } }
@media (prefers-reduced-motion: reduce) { .kpi-card-destination { transition: none; } .kpi-card-value--skeleton { animation: none; } }
@media (max-width: 640px) {
  .kpi-card { min-height: 5.5rem; padding: .75rem; border-inline-start: 0; border-bottom: 1px solid var(--ds-color-border); }
  .kpi-card-destination { opacity: 1; }
}
</style>
