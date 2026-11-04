<script setup>
/**
 * EmptyState — "nothing here yet" for a section the user CAN populate.
 *
 * Use when a list/section is legitimately empty and the user can take an action
 * to fill it (e.g. "add your first product"). For a failed/absent data fetch,
 * prefer NoDataState. Action buttons are projected via the default slot.
 */
import StateDisplay from './StateDisplay.vue'

defineProps({
  icon: { type: String, default: 'pi pi-inbox' },
  title: { type: String, default: 'موردی برای نمایش وجود ندارد' },
  description: { type: String, default: '' },
  size: { type: String, default: 'md' },
})
</script>

<template>
  <StateDisplay :icon="icon" :title="title" :description="description" tone="primary" :size="size">
    <slot></slot>
  </StateDisplay>
</template>
