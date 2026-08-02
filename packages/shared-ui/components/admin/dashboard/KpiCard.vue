<script setup>
/**
 * KpiCard — a single KPI metric tile for the admin command center.
 *
 * Presentational only: it renders whatever value/label it's given. The parent
 * dashboard is responsible for fetching real numbers and passing them in, so
 * this stays API-agnostic and reusable. All colors come from `--ds-*` tokens.
 */
defineProps({
  label: { type: String, required: true },
  value: { type: [Number, String], default: null },
  icon: { type: String, default: 'pi pi-chart-bar' },
  // Accent tone: primary | success | warning | danger | info
  tone: {
    type: String,
    default: 'primary',
    validator: (v) => ['primary', 'success', 'warning', 'danger', 'info'].includes(v),
  },
  loading: { type: Boolean, default: false },
  // Optional destination when the card is clickable.
  to: { type: [String, Object], default: null },
})

function faNumber(v) {
  if (v === null || v === undefined || v === '') return '—'
  const n = typeof v === 'number' ? v : Number(v)
  return Number.isNaN(n) ? String(v) : n.toLocaleString('fa-IR')
}
</script>

<template>
  <component
    :is="to ? 'router-link' : 'div'"
    :to="to || undefined"
    class="kpi-card"
    :class="[`kpi-card--${tone}`, { 'kpi-card--link': to }]"
  >
    <div class="kpi-card-icon">
      <i :class="icon"></i>
    </div>
    <div class="kpi-card-body">
      <span class="kpi-card-label">{{ label }}</span>
      <span v-if="loading" class="kpi-card-value kpi-card-value--skeleton"></span>
      <span v-else class="kpi-card-value">{{ faNumber(value) }}</span>
    </div>
    <i v-if="to" class="pi pi-angle-left kpi-card-arrow"></i>
  </component>
</template>

<style scoped>
.kpi-card {
  display: flex;
  align-items: center;
  gap: var(--ds-space-4);
  padding: var(--ds-space-5);
  background: var(--ds-color-surface);
  border: 1px solid var(--ds-color-border);
  border-radius: var(--ds-radius-lg);
  box-shadow: var(--ds-shadow-sm);
  text-decoration: none;
  transition: box-shadow var(--ds-transition), transform var(--ds-transition), border-color var(--ds-transition);
  position: relative;
  overflow: hidden;
}

.kpi-card::before {
  content: '';
  position: absolute;
  inset-inline-start: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  background: var(--kpi-accent);
}

.kpi-card--link:hover {
  box-shadow: var(--ds-shadow-md);
  transform: translateY(-2px);
  border-color: var(--kpi-accent);
}

.kpi-card-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 3.25rem;
  height: 3.25rem;
  border-radius: var(--ds-radius-md);
  background: var(--kpi-soft);
  color: var(--kpi-accent);
  flex-shrink: 0;
}

.kpi-card-icon i {
  font-size: 1.5rem;
}

.kpi-card-body {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.kpi-card-label {
  font-size: var(--ds-font-size-sm);
  color: var(--ds-color-text-muted);
  font-weight: var(--ds-font-weight-medium);
}

.kpi-card-value {
  font-size: var(--ds-font-size-2xl);
  font-weight: var(--ds-font-weight-bold);
  color: var(--ds-color-text);
  line-height: var(--ds-line-height-tight);
}

.kpi-card-value--skeleton {
  width: 3rem;
  height: 1.75rem;
  border-radius: var(--ds-radius-sm);
  background: var(--ds-color-surface-alt);
  animation: kpi-pulse 1.2s ease-in-out infinite;
}

@keyframes kpi-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

.kpi-card-arrow {
  margin-inline-start: auto;
  color: var(--ds-color-text-muted);
  font-size: 1rem;
}

/* Tone → accent/soft token wiring */
.kpi-card--primary { --kpi-accent: var(--ds-color-primary); --kpi-soft: var(--ds-color-info-soft); }
.kpi-card--info    { --kpi-accent: var(--ds-color-info);    --kpi-soft: var(--ds-color-info-soft); }
.kpi-card--success { --kpi-accent: var(--ds-color-success); --kpi-soft: var(--ds-color-success-soft); }
.kpi-card--warning { --kpi-accent: var(--ds-color-warning); --kpi-soft: var(--ds-color-warning-soft); }
.kpi-card--danger  { --kpi-accent: var(--ds-color-danger);  --kpi-soft: var(--ds-color-danger-soft); }
</style>
