<script setup>
/**
 * TemToolbar — list-page command bar.
 *
 * Slots: #start (search / filters), #end (primary + secondary actions).
 * `meta` renders an optional record count next to the start slot.
 */
defineProps({
  meta: { type: String, default: '' },
})
</script>

<template>
  <div class="tm-toolbar" role="toolbar">
    <div class="tm-toolbar__start">
      <slot name="start" />
    </div>
    <span v-if="meta" class="tm-toolbar__meta">{{ meta }}</span>
    <div class="tm-toolbar__end">
      <slot name="end" />
    </div>
  </div>
</template>

<style scoped>
.tm-toolbar__start { display: flex; align-items: center; gap: 8px; flex: 1 1 auto; flex-wrap: wrap; min-width: 0; }
.tm-toolbar__end { display: flex; align-items: center; gap: 8px; margin-inline-start: auto; flex-wrap: wrap; }
</style>