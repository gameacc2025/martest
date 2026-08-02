<script setup>
/**
 * ScoreCard — circular gauge for a company score / ranking.
 *
 * Presentational: the parent passes a real score (0–max) and optional rank.
 * Renders a dependency-free SVG progress ring driven by design tokens. No
 * fabricated scoring logic here — compute the value from real data upstream.
 */
import { computed } from 'vue'

const props = defineProps({
  // Current score. When null, renders an "unavailable" state.
  score: { type: Number, default: null },
  max: { type: Number, default: 100 },
  label: { type: String, default: 'امتیاز شرکت' },
  // Optional rank position + total (e.g. rank 12 of 340).
  rank: { type: Number, default: null },
  rankTotal: { type: Number, default: null },
  tone: { type: String, default: 'primary' },
  loading: { type: Boolean, default: false },
})

const RADIUS = 52
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

const pct = computed(() => {
  if (props.score === null || !props.max) return 0
  return Math.max(0, Math.min(1, props.score / props.max))
})

const dashOffset = computed(() => CIRCUMFERENCE * (1 - pct.value))
const faNumber = (v) => (Number(v) || 0).toLocaleString('fa-IR')
</script>

<template>
  <div class="score-card" :class="`score-card--${tone}`">
    <div v-if="loading" class="score-card-loading">
      <i class="pi pi-spin pi-spinner"></i>
    </div>

    <template v-else-if="score === null">
      <div class="score-ring-empty">
        <i class="pi pi-chart-line"></i>
        <span>امتیازی در دسترس نیست</span>
      </div>
    </template>

    <template v-else>
      <div class="score-ring">
        <svg viewBox="0 0 120 120" class="score-ring-svg" aria-hidden="true">
          <circle class="score-ring-track" cx="60" cy="60" :r="RADIUS" fill="none" stroke-width="10" />
          <circle
            class="score-ring-progress"
            cx="60"
            cy="60"
            :r="RADIUS"
            fill="none"
            stroke-width="10"
            stroke-linecap="round"
            :stroke-dasharray="CIRCUMFERENCE"
            :stroke-dashoffset="dashOffset"
          />
        </svg>
        <div class="score-ring-center">
          <span class="score-ring-value">{{ faNumber(score) }}</span>
          <span class="score-ring-max">از {{ faNumber(max) }}</span>
        </div>
      </div>

      <div class="score-meta">
        <span class="score-label">{{ label }}</span>
        <span v-if="rank !== null" class="score-rank">
          <i class="pi pi-star-fill"></i>
          رتبه {{ faNumber(rank) }}<template v-if="rankTotal"> از {{ faNumber(rankTotal) }}</template>
        </span>
      </div>
    </template>
  </div>
</template>

<style scoped>
.score-card {
  --score-accent: var(--ds-color-primary);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--ds-space-3);
  padding: var(--ds-space-2) 0;
}

.score-card--primary { --score-accent: var(--ds-color-primary); }
.score-card--success { --score-accent: var(--ds-color-success); }
.score-card--warning { --score-accent: var(--ds-color-warning); }
.score-card--info    { --score-accent: var(--ds-color-info); }

.score-ring {
  position: relative;
  width: 140px;
  height: 140px;
}

.score-ring-svg {
  width: 100%;
  height: 100%;
  transform: rotate(-90deg);
}

.score-ring-track {
  stroke: var(--ds-color-surface-alt);
}

.score-ring-progress {
  stroke: var(--score-accent);
  transition: stroke-dashoffset var(--ds-transition-slow);
}

.score-ring-center {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.15rem;
}

.score-ring-value {
  font-size: var(--ds-font-size-2xl);
  font-weight: var(--ds-font-weight-bold);
  color: var(--ds-color-text);
  line-height: 1;
}

.score-ring-max {
  font-size: var(--ds-font-size-xs);
  color: var(--ds-color-text-muted);
}

.score-meta {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--ds-space-1);
}

.score-label {
  font-size: var(--ds-font-size-sm);
  font-weight: var(--ds-font-weight-semibold);
  color: var(--ds-color-text);
}

.score-rank {
  display: inline-flex;
  align-items: center;
  gap: var(--ds-space-1);
  font-size: var(--ds-font-size-xs);
  color: var(--ds-color-warning);
  font-weight: var(--ds-font-weight-medium);
}

.score-ring-empty,
.score-card-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--ds-space-2);
  padding: var(--ds-space-8) 0;
  color: var(--ds-color-text-muted);
}

.score-ring-empty i,
.score-card-loading i {
  font-size: var(--ds-font-size-2xl);
}
</style>
