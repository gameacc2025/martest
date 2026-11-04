<script setup>
/** TemMeter — labelled progress meter for quota / completion figures. */
import { computed } from 'vue'

const props = defineProps({
  label: { type: String, default: '' },
  value: { type: [Number, String], default: 0 },
  max: { type: [Number, String], default: 100 },
  /** Optional explicit caption, e.g. "۱۲ از ۲۰". */
  caption: { type: String, default: '' },
})

const pct = computed(() => {
  const value = Number(props.value)
  const max = Number(props.max)
  if (!Number.isFinite(value) || !Number.isFinite(max) || max <= 0) return 0
  return Math.min(100, Math.max(0, Math.round((value / max) * 100)))
})
</script>

<template>
  <div class="tm-meter-block">
    <div v-if="label || caption" class="tm-meter-head">
      <span>{{ label }}</span>
      <span class="tm-num">{{ caption || `${pct}٪` }}</span>
    </div>
    <div
      class="tm-meter"
      role="progressbar"
      :aria-valuenow="pct"
      aria-valuemin="0"
      aria-valuemax="100"
      :aria-label="label || 'میزان پیشرفت'"
    >
      <div class="tm-meter__fill" :style="{ width: `${pct}%` }"></div>
    </div>
  </div>
</template>

<style scoped>
.tm-meter-block { width: 100%; }
.tm-meter-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 6px;
  font-size: var(--tm-fs-tiny);
  color: var(--tm-muted);
}
</style>