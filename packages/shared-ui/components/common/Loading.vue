<script setup>
import { computed } from 'vue'
import ProgressSpinner from 'primevue/progressspinner'

const props = defineProps({
  size: {
    type: String,
    default: 'md',
    validator: (value) => ['sm', 'md', 'lg'].includes(value)
  },
  text: {
    type: String,
    default: 'در حال دریافت داده ها...'
  },
  fullscreen: {
    type: Boolean,
    default: false
  }
})

const spinnerSize = computed(() => {
  const sizes = { sm: '2rem', md: '3rem', lg: '4.5rem' }
  return sizes[props.size]
})
</script>

<template>
  <div v-if="fullscreen" class="app-loading app-loading-fullscreen">
    <div class="app-loading-content">
      <ProgressSpinner :style="{ width: spinnerSize, height: spinnerSize }" strokeWidth="4" />
      <p v-if="text" class="app-loading-text">{{ text }}</p>
    </div>
  </div>
  <div v-else class="app-loading app-loading-inline">
    <ProgressSpinner :style="{ width: '1.5rem', height: '1.5rem' }" strokeWidth="6" />
    <span v-if="text" class="app-loading-text app-loading-text-sm">{{ text }}</span>
  </div>
</template>

<style scoped>
.app-loading-fullscreen {
  position: fixed;
  inset: 0;
  z-index: 1100;
  display: flex;
  align-items: center;
  justify-content: center;
  background: color-mix(in srgb, var(--surface-card) 85%, transparent);
  backdrop-filter: blur(4px);
}

.app-loading-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.app-loading-inline {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.app-loading-text {
  color: var(--text-color-secondary);
  margin: 0;
}

.app-loading-text-sm {
  font-size: 0.875rem;
}
</style>
