<script setup>
/**
 * TemLineChart — lightweight SVG time-series chart extracted from TEM chart patterns.
 * Input is always supplied by the host page; no sample series or data fetching.
 * series: [{ label, values: number[], color?: string }], labels: string[]
 */
import { computed } from 'vue'

const props = defineProps({
  series: { type: Array, default: () => [] },
  labels: { type: Array, default: () => [] },
  height: { type: Number, default: 240 },
  loading: { type: Boolean, default: false },
  valueFormatter: { type: Function, default: null },
})
const WIDTH = 640
const TOP = 18
const BOTTOM = 196
const LEFT = 42
const RIGHT = 624
const COLORS = ['#2878c7', '#12b8a6', '#e7a64b', '#7b5cf0']
const maxValue = computed(() => Math.max(1, ...props.series.flatMap((item) => item.values || []).map((value) => Number(value) || 0)))
const plotted = computed(() => props.series.map((item, seriesIndex) => {
  const values = Array.isArray(item.values) ? item.values : []
  const points = values.map((raw, index) => {
    const value = Math.max(0, Number(raw) || 0)
    const x = values.length < 2 ? (LEFT + RIGHT) / 2 : LEFT + ((RIGHT - LEFT) * index) / (values.length - 1)
    const y = BOTTOM - ((BOTTOM - TOP) * value / maxValue.value)
    return [x, y]
  })
  return {
    label: item.label || 'سری ' + (seriesIndex + 1),
    color: item.color || COLORS[seriesIndex % COLORS.length],
    points,
    path: points.map((point, index) => (index ? 'L' : 'M') + point[0].toFixed(1) + ',' + point[1].toFixed(1)).join(' '),
  }
}))
const gridY = [TOP, TOP + (BOTTOM - TOP) / 3, TOP + 2 * (BOTTOM - TOP) / 3, BOTTOM]
function format(value) {
  const number = Number(value)
  if (!Number.isFinite(number)) return '—'
  return props.valueFormatter ? props.valueFormatter(number) : number.toLocaleString('fa-IR')
}
</script>

<template>
  <div class="tm-line-chart" :style="{ height: height + 'px' }" :aria-busy="loading ? 'true' : undefined">
    <div v-if="loading" class="tm-line-chart__loading" aria-hidden="true"><span></span><span></span><span></span><span></span></div>
    <div v-else-if="!plotted.some((item) => item.points.length)" class="tm-empty">
      <i class="pi pi-chart-line" aria-hidden="true"></i><strong>داده‌ای برای نمایش نیست</strong>
    </div>
    <svg v-else viewBox="0 0 640 230" preserveAspectRatio="none" role="img" aria-label="نمودار روند">
      <g class="tm-line-chart__grid">
        <line v-for="y in gridY" :key="y" :x1="LEFT" :x2="RIGHT" :y1="y" :y2="y" />
      </g>
      <g v-for="item in plotted" :key="item.label">
        <path v-if="item.points.length > 1" :d="item.path" fill="none" :stroke="item.color" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
        <circle v-for="(point, index) in item.points" :key="item.label + index" :cx="point[0]" :cy="point[1]" r="3.5" :fill="item.color" />
      </g>
      <g class="tm-line-chart__labels">
        <text v-for="(label, index) in labels" :key="label + index" :x="labels.length < 2 ? (LEFT + RIGHT) / 2 : LEFT + ((RIGHT - LEFT) * index / (labels.length - 1))" y="220" text-anchor="middle">{{ label }}</text>
      </g>
    </svg>
    <div v-if="!loading && plotted.length" class="tm-line-chart__legend">
      <span v-for="item in plotted" :key="item.label"><i :style="{ background: item.color }"></i>{{ item.label }}</span>
    </div>
  </div>
</template>

<style scoped>
.tm-line-chart { width:100%; min-width:0; position:relative; }
.tm-line-chart svg { width:100%; height:calc(100% - 25px); display:block; overflow:visible; }
.tm-line-chart__grid line { stroke:var(--tm-line); stroke-dasharray:3 5; stroke-width:1; }
.tm-line-chart__labels text { fill:var(--tm-muted); font-size:10px; font-family:var(--tm-font); }
.tm-line-chart__legend { display:flex; flex-wrap:wrap; justify-content:center; gap:16px; padding-top:5px; }
.tm-line-chart__legend span { display:inline-flex; align-items:center; gap:6px; color:var(--tm-muted); font-size:11px; }
.tm-line-chart__legend i { width:8px; height:8px; border-radius:50%; }
.tm-line-chart__loading { display:flex; height:100%; align-items:flex-end; gap:12px; padding:16px; }
.tm-line-chart__loading span { flex:1; height:40%; border-radius:8px; background:var(--tm-surface-sunk); animation:tm-line-pulse 1.3s ease-in-out infinite; }
.tm-line-chart__loading span:nth-child(2) { height:65%; }.tm-line-chart__loading span:nth-child(3) { height:48%; }.tm-line-chart__loading span:nth-child(4) { height:82%; }
@keyframes tm-line-pulse { 50% { opacity:.45; } }
@media(prefers-reduced-motion:reduce){.tm-line-chart__loading span{animation:none}}
</style>