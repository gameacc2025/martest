<script setup>
import { computed } from 'vue'

// A dependency-free SVG donut chart. Segments are driven entirely by the
// `segments` prop ([{ label, value, color }]) — no fabricated data.
const props = defineProps({
  segments: { type: Array, default: () => [] },
  size: { type: Number, default: 160 },
  thickness: { type: Number, default: 22 },
})

const total = computed(() => props.segments.reduce((sum, s) => sum + (Number(s.value) || 0), 0))

const radius = computed(() => (props.size - props.thickness) / 2)
const circumference = computed(() => 2 * Math.PI * radius.value)

// Pre-compute stroke dash offsets so each segment stacks after the previous.
const arcs = computed(() => {
  if (total.value === 0) return []
  let offset = 0
  return props.segments
    .filter((s) => (Number(s.value) || 0) > 0)
    .map((s) => {
      const fraction = (Number(s.value) || 0) / total.value
      const dash = fraction * circumference.value
      const arc = {
        color: s.color,
        dashArray: `${dash} ${circumference.value - dash}`,
        dashOffset: -offset,
      }
      offset += dash
      return arc
    })
})
</script>

<template>
  <div class="donut-wrap">
    <svg :width="size" :height="size" :viewBox="`0 0 ${size} ${size}`" class="donut">
      <g :transform="`rotate(-90 ${size / 2} ${size / 2})`">
        <circle
          :cx="size / 2" :cy="size / 2" :r="radius"
          fill="none" :stroke-width="thickness"
          class="donut-track"
        />
        <circle
          v-for="(arc, i) in arcs" :key="i"
          :cx="size / 2" :cy="size / 2" :r="radius"
          fill="none" :stroke-width="thickness"
          :stroke="arc.color"
          :stroke-dasharray="arc.dashArray"
          :stroke-dashoffset="arc.dashOffset"
          stroke-linecap="butt"
        />
      </g>
      <text :x="size / 2" :y="size / 2" text-anchor="middle" dominant-baseline="central" class="donut-total">
        {{ total.toLocaleString('fa-IR') }}
      </text>
    </svg>
    <ul class="donut-legend">
      <li v-for="(s, i) in segments" :key="i">
        <span class="legend-dot" :style="{ background: s.color }"></span>
        <span class="legend-label">{{ s.label }}</span>
        <b class="legend-value">{{ (Number(s.value) || 0).toLocaleString('fa-IR') }}</b>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.donut-wrap {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  flex-wrap: wrap;
}

.donut-track {
  stroke: var(--surface-200, #e5e7eb);
}

.donut-total {
  font-size: 1.4rem;
  font-weight: 700;
  fill: var(--text-color, #111827);
}

.donut-legend {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  min-width: 140px;
}

.donut-legend li {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
}

.legend-dot {
  width: 12px;
  height: 12px;
  border-radius: 3px;
  flex-shrink: 0;
}

.legend-label {
  color: var(--text-color-secondary);
}

.legend-value {
  margin-inline-start: auto;
}
</style>
