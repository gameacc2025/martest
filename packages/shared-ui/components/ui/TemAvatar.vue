<script setup>
/** TemAvatar — deterministic initials/colour avatar with optional image. */
import { computed } from 'vue'

const props = defineProps({
  name: { type: String, default: '' },
  src: { type: String, default: '' },
  size: { type: String, default: 'md', validator: (v) => ['md', 'lg'].includes(v) },
})

const PALETTE = [
  { bg: '#e8f1fe', fg: '#1155b0' },
  { bg: '#e4f8fd', fg: '#0f5f88' },
  { bg: '#ddf8f1', fg: '#0c8a6e' },
  { bg: '#fdf1da', fg: '#a86c05' },
  { bg: '#ece7fd', fg: '#6042d8' },
  { bg: '#fde8f1', fg: '#b83d72' },
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