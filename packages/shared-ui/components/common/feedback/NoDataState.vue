<script setup>
/**
 * NoDataState — data could not be loaded / none returned.
 *
 * Use for a failed fetch or a genuinely empty result set that isn't the user's
 * to populate (e.g. "no results match your filters", "couldn't load stats").
 * Emits `retry` when the optional retry button is used.
 */
import StateDisplay from './StateDisplay.vue'
import Button from 'primevue/button'

defineProps({
  icon: { type: String, default: 'pi pi-database' },
  title: { type: String, default: 'داده‌ای یافت نشد' },
  description: { type: String, default: '' },
  // Show a retry button (emits `retry`).
  retryable: { type: Boolean, default: false },
  retryLabel: { type: String, default: 'تلاش مجدد' },
  loading: { type: Boolean, default: false },
  size: { type: String, default: 'md' },
})

const emit = defineEmits(['retry'])
</script>

<template>
  <StateDisplay :icon="icon" :title="title" :description="description" tone="neutral" :size="size">
    <slot></slot>
    <Button
      v-if="retryable"
      :label="retryLabel"
      icon="pi pi-refresh"
      severity="secondary"
      outlined
      :loading="loading"
      @click="emit('retry')"
    />
  </StateDisplay>
</template>
