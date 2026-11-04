<script setup>
/**
 * TemStatCard — compact metric tile used on dashboards and list headers.
 *
 * Renders real values only. When `value` is null/undefined it shows an
 * em dash instead of inventing a zero.
 */
import { computed } from 'vue'

const props = defineProps({
  label: { type: String, required: true },
  value: { type: [Number, String], default: null },
  icon: { type: String, default: 'pi pi-chart-bar' },
  /** primary | accent | success | warning | danger | violet */
  tone: { type: String, default: 'primary' },
  /** Optional supporting line under the value (e.g. "از ۱۲۰ مورد"). */
  meta: { type: String, default: '' },
  /** Optional delta indicator, e.g. "+12%" — rendered with up/down colouring. */
  delta: { type: String, default: '' },
  deltaDirection: { type: String, default: '', validator: (v) => ['', 'up', 'down'].includes(v) },
  loading: { type: Boolean, default: false },
  to: { type: [String, Object], default: null },
  /** Force LTR numeric layout for mixed digit sets. */
  numeric: { type: Boolean, default: true },
})

const formatted = computed(() => {
  if (props.loading) return '—'
  const raw = props.value
  if (raw === null || raw === undefined || raw === '') return '—'
  const number = typeof raw === 'number' ? raw : Number(raw)
  return Number.isFinite(number) ? number.toLocaleString('fa-IR') : String(raw)
})

const tag = computed(() => (props.to ? 'router-link' : 'div'))
</script>

<template>
  <component
    :is="tag"
    :to="to || undefined"
    class="tm-stat"
    :class="`tm-stat--${tone}`"
    :aria-busy="loading ? 'true' : undefined"
  >
    <span class="tm-stat__icon" aria-hidden="true"><i :class="icon"></i></span>
    <span class="tm-stat__body">
      <span class="tm-stat__label">{{ label }}</span>
      <span class="tm-stat__value" :class="{ 'tm-num': numeric }">{{ formatted }}</span>
      <span v-if="meta || delta" class="tm-stat__meta">
        <span v-if="delta" class="tm-stat__delta" :class="deltaDirection ? `tm-stat__delta--${deltaDirection}` : ''">
          {{ delta }}
        </span>
        <span v-if="meta">{{ meta }}</span>
      </span>
    </span>
  </component>
</template>