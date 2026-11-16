<script setup>
/** TemAvatar — deterministic initials/colour avatar with optional image. */
import { computed } from 'vue'

const props = defineProps({
  name: { type: String, default: '' },
  src: { type: String, default: '' },
  size: { type: String, default: 'md', validator: (v) => ['md', 'lg'].includes(v) },
})

const PALETTE = [
  { bg: 'var(--ds-color-primary-soft, #e8f1fe)', fg: 'var(--ds-color-primary, #0891B2)' },
  { bg: 'var(--ds-color-primary-soft, #e4f8fd)', fg: 'var(--ds-brand-primary, #0891B2)' },
  { bg: 'var(--ds-status-success-bg, #ddf8f1)', fg: 'var(--ds-status-success-fg, #15803D)' },
  { bg: 'var(--ds-status-warning-bg, #fdf1da)', fg: 'var(--ds-status-warning-fg, #B45309)' },
  { bg: 'color-mix(in srgb, var(--ds-brand-accent) 12%, transparent)', fg: 'var(--ds-brand-accent, #8B5CF6)' },
  { bg: 'color-mix(in srgb, var(--ds-brand-accent) 12%, transparent)', fg: 'var(--ds-brand-accent, #8B5CF6)' },
]

const initials = computed(() => {
  const clean = (props.name || '').trim()
  if (!clean) return '—'
  const parts = clean.split(/\s+/).slice(0, 2)
  return parts.map((p) => p.charAt(0)).join('')
})

const colors = computed(() => {
  let hash = 0
  for (const ch of props.name || '') hash = (hash * 31 + ch.charCodeAt(0)) % 997
  return PALETTE[hash % PALETTE.length]
})
</script>

<template>
  <span
    class="tm-avatar"
    :class="{ 'tm-avatar--lg': size === 'lg' }"
    :style="src ? undefined : { background: colors.bg, color: colors.fg }"
    :title="name || undefined"
  >
    <img v-if="src" :src="src" :alt="name" loading="lazy" decoding="async" />
    <template v-else>{{ initials }}</template>
  </span>
</template>