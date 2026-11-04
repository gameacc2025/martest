<script setup>
/**
 * FormGrid — responsive multi-column layout for form fields.
 *
 * Drops fields into a responsive grid that collapses to a single column on
 * small screens. Presentational only. Children can span the full width with the
 * `.form-grid-full` utility class (exposed below) when needed.
 */
defineProps({
  // Number of columns on wide screens (1–3).
  columns: {
    type: Number,
    default: 2,
    validator: (v) => [1, 2, 3].includes(v),
  },
})
</script>

<template>
  <div class="form-grid" :class="`form-grid--${columns}`">
    <slot></slot>
  </div>
</template>

<style scoped>
.form-grid {
  display: grid;
  gap: var(--ds-space-4) var(--ds-space-5);
  align-items: start;
}

.form-grid--1 { grid-template-columns: 1fr; }
.form-grid--2 { grid-template-columns: repeat(2, 1fr); }
.form-grid--3 { grid-template-columns: repeat(3, 1fr); }

/* A child can opt to span the whole row. */
.form-grid :deep(.form-grid-full) {
  grid-column: 1 / -1;
}

@media (max-width: 768px) {
  .form-grid--2,
  .form-grid--3 {
    grid-template-columns: 1fr;
  }
}
</style>
