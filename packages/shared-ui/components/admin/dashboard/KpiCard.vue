<script setup>
/**
 * KpiCard — list-page summary metric tile.
 *
 * Visual source: `tem/admin.css` `.kpi` — label row (with a small tinted icon
 * chip pushed to the far edge), a large value, then a quiet caption. These are
 * the summary statistics that sit above every table page.
 *
 * Renders real values only; `null`/empty values show an em dash rather than a
 * fabricated zero. The legacy `kpi-card-*` class hooks are retained because
 * other shared components/tests rely on them.
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
const toneClass = computed(() => {
  const map = {
    primary: 'tm-kpi--primary',
    info: 'tm-kpi--accent',
    success: 'tm-kpi--success',
    warning: 'tm-kpi--warning',
    danger: 'tm-kpi--danger',
  }
  return map[props.tone] || 'tm-kpi--primary'
})

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
    class="kpi-card tm-kpi"
    :class="[`kpi-card--${tone}`, toneClass]"
    :aria-busy="loading ? 'true' : undefined"
  >
    <div class="kpi-card-head tm-kpi__top">
      <span class="kpi-card-label tm-kpi__label">{{ label }}</span>
      <span class="kpi-card-icon tm-kpi__icon" aria-hidden="true"><i :class="icon"></i></span>
    </div>
    <strong
      v-if="!loading"
      class="kpi-card-value tm-kpi__value tm-num"
    >{{ faNumber(value) }}</strong>
    <span
      v-else
      class="kpi-card-value kpi-card-value--skeleton tm-kpi__value"
      aria-label="در حال بارگذاری"
    ></span>
    <span v-if="to" class="kpi-card-destination tm-kpi__meta">
      مشاهده جزئیات <i class="pi pi-arrow-left" aria-hidden="true"></i>
    </span>
  </component>
</template>

<style scoped>
/* The tile itself is styled globally by `.tm-kpi`; only the skeleton bar and
   the destination hint need local rules. */
.kpi-card-value--skeleton {
  display: block;
  width: 3.5rem;
  height: 1.6rem;
  border-radius: 5px;
  background: var(--tm-surface-sunk);
  animation: kpi-pulse 1.2s ease-in-out infinite;
}
.kpi-card-destination {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--tm-blue);
  font-weight: 600;
}
.kpi-card { text-decoration: none; color: inherit; }
@keyframes kpi-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.45; }
}
@media (prefers-reduced-motion: reduce) {
  .kpi-card-value--skeleton { animation: none; }
}
</style>