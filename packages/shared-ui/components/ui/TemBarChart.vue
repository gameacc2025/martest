<script setup>
/**
 * TemBarChart — dependency-free CSS bar chart for aggregate, real data.
 *
 * `series`: [{ label, value }]. Values are normalised against the largest
 * entry; a zero-max series renders an honest empty track instead of fake bars.
 * This is deliberately NOT a time-series library: it visualises whatever
 * aggregates the page actually holds.
 */
import { computed } from 'vue'

const props = defineProps({
  series: { type: Array, default: () => [] },
  /** primary | alt */
  tone: { type: String, default: 'primary' },
  height: { type: Number, default: 220 },
  valueFormatter: { type: Function, default: null },
  loading: { type: Boolean, default: false },
})

const max = computed(() => Math.max(1, ...props.series.map((s) => Number(s.value) || 0)))

function heightPct(value) {
  const n = Number(value) || 0
  if (n <= 0) return 0
  return Math.max(4, Math.round((n / max.value) * 100))
}

function format(value) {
  const n = Number(value)
  if (!Number.isFinite(n)) return '—'
  return props.valueFormatter ? props.valueFormatter(n) : n.toLocaleString('fa-IR')
}
</script>

<template>
  <div class="tm-chart" :style="{ height: `${height}px` }" :aria-busy="loading ? 'true' : undefined">
    <div v-if="loading" class="tm-chart__skeleton" aria-hidden="true">
      <span v-for="i in Math.max(series.length, 5)" :key="i" :style="{ height: `${30 + ((i * 17) % 55)}%` }"></span>
    </div>
    <div v-else-if="!series.length" class="tm-empty" style="padding: 24px">
      <i class="pi pi-chart-bar" aria-hidden="true"></i>
      <strong>داده‌ای برای نمایش نیست</strong>
    </div>
    <div v-else class="tm-bars" role="img" aria-label="نمودار میله‌ای داده‌های موجود">
      <div v-for="item in series" :key="item.label" class="tm-bars__col">
        <span class="tm-bars__value">{{ format(item.value) }}</span>
        <span class="tm-bars__track">
          <span
            class="tm-bars__fill"
            :class="{ 'tm-bars__fill--alt': tone === 'alt' }"
            :style="{ height: `${heightPct(item.value)}%` }"
          ></span>
        </span>
        <span class="tm-bars__label">{{ item.label }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.tm-chart { width: 100%; min-width: 0; }
.tm-bars { align-items: flex-end; }
.tm-bars__col { justify-content: flex-end; }
.tm-bars__value { font-size: 11px; color: var(--tm-muted); font-variant-numeric: tabular-nums; }
.tm-bars__track { min-height: 0; }
.tm-chart__skeleton { display: flex; align-items: flex-end; gap: 12px; height: 100%; }
.tm-chart__skeleton span {
  flex: 1;
  border-radius: 8px 8px 2px 2px;
  background: var(--tm-surface-sunk);
  animation: tm-pulse 1.4s ease-in-out infinite;
}
@keyframes tm-pulse { 0%, 100% { opacity: 0.5; } 50% { opacity: 1; } }
@media (prefers-reduced-motion: reduce) { .tm-chart__skeleton span { animation: none; } }
</style>