<script setup>
/**
 * FormActions — consistent footer bar for form submit/cancel buttons.
 *
 * Presentational layout only. Buttons are projected via the default slot so the
 * parent keeps control of submit handlers and business logic. Aligns actions to
 * the end by default (RTL-aware) and stacks them full-width on mobile.
 */
defineProps({
  // 'end' (default) | 'start' | 'between' | 'stretch'
  align: {
    type: String,
    default: 'end',
    validator: (v) => ['end', 'start', 'between', 'stretch'].includes(v),
  },
  // Show a top border/divider above the actions.
  bordered: { type: Boolean, default: true },
  // Make the bar sticky to the bottom of the viewport (useful for long forms).
  sticky: { type: Boolean, default: false },
})
</script>

<template>
  <div
    class="form-actions"
    :class="[`form-actions--${align}`, { 'form-actions--bordered': bordered, 'form-actions--sticky': sticky }]"
  >
    <slot></slot>
  </div>
</template>

<style scoped>
.form-actions {
  display: flex;
  align-items: center;
  gap: var(--ds-space-3);
  flex-wrap: wrap;
  padding-top: var(--ds-space-4);
}

.form-actions--bordered {
  border-top: 1px solid var(--ds-color-border);
  margin-top: var(--ds-space-2);
}

.form-actions--end { justify-content: flex-end; }
.form-actions--start { justify-content: flex-start; }
.form-actions--between { justify-content: space-between; }
.form-actions--stretch :deep(.p-button) { flex: 1; }

.form-actions--sticky {
  position: sticky;
  bottom: 0;
  background: var(--ds-color-surface);
  padding: var(--ds-space-4);
  border-top: 1px solid var(--ds-color-border);
  z-index: var(--ds-z-sticky);
}

@media (max-width: 640px) {
  .form-actions {
    flex-direction: column-reverse;
  }
  .form-actions :deep(.p-button) {
    width: 100%;
  }
}
</style>
