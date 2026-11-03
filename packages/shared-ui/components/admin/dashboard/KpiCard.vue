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
    <span class="kpi-card-label"><i :class="icon" aria-hidden="true"></i>{{ label }}</span>
    <span v-if="loading" class="kpi-card-value kpi-card-value--skeleton" aria-label="در حال بارگذاری"></span>
    <strong v-else class="kpi-card-value">{{ faNumber(value) }}</strong>
    <span v-if="to" class="kpi-card-destination">مشاهده جزئیات <i class="pi pi-arrow-left" aria-hidden="true"></i></span>
  </component>
</template>

<style scoped>
.kpi-card {
  display: flex;
  min-width: 0;
  min-height: 6rem;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  gap: .35rem;
  padding: .85rem 1rem;
  border: 1px solid var(--ds-color-border);
  border-radius: var(--ds-radius-lg);
  background: var(--ds-color-surface);
  color: var(--ds-color-text);
  text-decoration: none;
  box-shadow: var(--ds-shadow-xs);
  transition: border-color var(--ds-transition-fast), box-shadow var(--ds-transition-fast), background-color var(--ds-transition-fast);
}
.kpi-card-label { display: flex; align-items: center; gap: .4rem; color: var(--ds-color-text-muted); font-size: .78rem; font-weight: var(--ds-font-weight-medium); line-height: 1.5; }
.kpi-card-label i { color: var(--kpi-value-color, var(--ds-color-primary-text)); font-size: .92rem; }
.kpi-card-value {
  color: var(--kpi-value-color, var(--ds-color-text));
  font-size: 1.4rem;
  font-weight: var(--ds-font-weight-bold);
  line-height: 1.25;
  font-variant-numeric: tabular-nums;
}
.kpi-card-destination { display: inline-flex; align-items: center; gap: .35rem; min-height: 1.4rem; color: var(--ds-color-text-muted); font-size: .72rem; opacity: .8; transition: color var(--ds-transition-fast), opacity var(--ds-transition-fast); }
.kpi-card--link { cursor: pointer; }
.kpi-card--link:hover { border-color: color-mix(in srgb, var(--ds-color-primary) 35%, var(--ds-color-border)); background: var(--ds-color-surface-hover); box-shadow: var(--ds-shadow-sm); }
.kpi-card--link:hover .kpi-card-destination, .kpi-card--link:focus-visible .kpi-card-destination { color: var(--ds-color-primary-text); opacity: 1; }
.kpi-card--link:focus-visible { outline: 2px solid var(--ds-color-focus); outline-offset: 3px; }
.kpi-card--success { --kpi-value-color: var(--ds-color-success); }
.kpi-card--warning { --kpi-value-color: var(--ds-color-warning); }
.kpi-card--danger { --kpi-value-color: var(--ds-color-danger); }
.kpi-card--info { --kpi-value-color: var(--ds-color-info); }
.kpi-card-value--skeleton { display: block; width: 3.5rem; height: 1.5rem; border-radius: 4px; background: var(--ds-color-surface-alt); animation: kpi-pulse 1.2s ease-in-out infinite; }
@keyframes kpi-pulse { 0%, 100% { opacity: 1; } 50% { opacity: .45; } }
@media (prefers-reduced-motion: reduce) { .kpi-card, .kpi-card-destination { transition: none; } .kpi-card-value--skeleton { animation: none; } }
@media (max-width: 640px) { .kpi-card { min-height: 5.25rem; padding: .75rem; } .kpi-card-destination { opacity: 1; } }
</style>
