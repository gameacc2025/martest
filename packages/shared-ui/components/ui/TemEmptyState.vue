<script setup>
/** TemEmptyState — consistent empty / zero-data state. */
defineProps({
  icon: { type: String, default: 'pi pi-inbox' },
  title: { type: String, default: 'موردی برای نمایش نیست' },
  description: { type: String, default: '' },
})
</script>

<template>
  <div class="tm-empty">
    <i :class="icon" aria-hidden="true"></i>
    <strong>{{ title }}</strong>
    <p v-if="description">{{ description }}</p>
    <slot />
  </div>
</template>