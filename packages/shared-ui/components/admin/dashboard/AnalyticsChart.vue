<script setup>
/**
 * AnalyticsChart — dependency-free, token-driven bar chart (SVG).
 *
 * Deliberately avoids pulling in chart.js/apexcharts: it renders a simple,
 * responsive bar chart from a `series` prop so the dashboard can visualize real
 * API data once it's wired. Presentational only — no data fabrication.
 *
 * series shape: [{ label: string, value: number }]
 */
import { computed } from 'vue'

const props = defineProps({
  series: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  // Accent tone for the bars: primary | success | warning | danger | info
  tone: { type: String, default: 'primary' },
  height: { type: Number, default: 220 },
  emptyMessage: { type: String, default: 'داده‌ای برای نمایش وجود ندارد.' },
})

const maxValue = computed(() => {
  const vals = props.series.map((s) => Number(s.value) || 0)
  return vals.length ? Math.max(...vals, 1) : 1
})

// Bar height as a percentage of the plot area.
const barHeight = (value) => `${Math.max(2, ((Number(value) || 0) / maxValue.value) * 100)}%`

const faNumber = (v) => (Number(v) || 0).toLocaleString('fa-IR')
</script>

<template>
  <div class="analytics-chart" :class="`analytics-chart--${tone}`">
    <div v-if="loading" class="analytics-chart-state">
      <i class="pi pi-spin pi-spinner"></i>
    </div>

    <div v-else-if="!series.length" class="analytics-chart-state">
      <i class="pi pi-chart-bar"></i>
      <span>{{ emptyMessage }}</span>
    </div>

    <div v-else class="analytics-chart-plot" :style="{ height: `${height}px` }">
      <div v-for="(point, i) in series" :key="i" class="analytics-chart-col">
        <div class="analytics-chart-bar-wrap">
          <span class="analytics-chart-value">{{ faNumber(point.value) }}</span>
          <div class="analytics-chart-bar" :style="{ height: barHeight(point.value) }"></div>
        </div>
        <span class="analytics-chart-label">{{ point.label }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.analytics-chart {
  --chart-accent: var(--ds-color-primary);
  width: 100%;
}

.analytics-chart--primary { --chart-accent: var(--ds-color-primary); }
.analytics-chart--success { --chart-accent: var(--ds-color-success); }
.analytics-chart--warning { --chart-accent: var(--ds-color-warning); }
.analytics-chart--danger  { --chart-accent: var(--ds-color-danger); }
.analytics-chart--info    { --chart-accent: var(--ds-color-info); }

.analytics-chart-plot {
  display: flex;
  align-items: flex-end;
  justify-content: space-around;
  gap: var(--ds-space-2);
  padding-top: var(--ds-space-4);
}

.analytics-chart-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--ds-space-2);
  flex: 1;
  min-width: 0;
  height: 100%;
}

.analytics-chart-bar-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  gap: var(--ds-space-1);
  width: 100%;
  flex: 1;
}

.analytics-chart-value {
  font-size: var(--ds-font-size-xs);
  color: var(--ds-color-text-muted);
  font-weight: var(--ds-font-weight-semibold);
}

.analytics-chart-bar {
  width: 100%;
  max-width: 2.5rem;
  border-radius: var(--ds-radius-sm) var(--ds-radius-sm) 0 0;
  background: linear-gradient(
    to top,
    var(--chart-accent),
    color-mix(in srgb, var(--chart-accent) 55%, transparent)
  );
  transition: height var(--ds-transition-slow);
}

.analytics-chart-label {
  font-size: var(--ds-font-size-xs);
  color: var(--ds-color-text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

.analytics-chart-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--ds-space-2);
  padding: var(--ds-space-10) 0;
  color: var(--ds-color-text-muted);
}

.analytics-chart-state i {
  font-size: var(--ds-font-size-2xl);
}
</style>
