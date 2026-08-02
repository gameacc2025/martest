<script setup>
/**
 * FormSection — a titled group of related fields.
 *
 * Purely presentational layout: gives forms clear visual sections with a title,
 * optional description, and consistent spacing. Does not touch validation,
 * payloads, or business logic. Token-driven; RTL-aware.
 */
defineProps({
  title: { type: String, default: '' },
  description: { type: String, default: '' },
  icon: { type: String, default: '' },
  // Renders as a bordered card (default) or a plain, borderless block.
  variant: {
    type: String,
    default: 'card',
    validator: (v) => ['card', 'plain'].includes(v),
  },
})
</script>

<template>
  <section class="form-section" :class="`form-section--${variant}`">
    <header v-if="title || description || $slots.header" class="form-section-header">
      <slot name="header">
        <div class="form-section-heading">
          <span v-if="icon" class="form-section-icon"><i :class="icon"></i></span>
          <div>
            <h3 v-if="title" class="form-section-title">{{ title }}</h3>
            <p v-if="description" class="form-section-desc">{{ description }}</p>
          </div>
        </div>
      </slot>
      <div v-if="$slots.actions" class="form-section-actions">
        <slot name="actions"></slot>
      </div>
    </header>

    <div class="form-section-body">
      <slot></slot>
    </div>
  </section>
</template>

<style scoped>
.form-section--card {
  background: var(--ds-color-surface);
  border: 1px solid var(--ds-color-border);
  border-radius: var(--ds-radius-lg);
  padding: var(--ds-space-6);
}

.form-section-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--ds-space-4);
  margin-bottom: var(--ds-space-5);
}

.form-section--card .form-section-header {
  padding-bottom: var(--ds-space-4);
  border-bottom: 1px solid var(--ds-color-border);
}

.form-section-heading {
  display: flex;
  align-items: flex-start;
  gap: var(--ds-space-3);
  min-width: 0;
}

.form-section-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.25rem;
  height: 2.25rem;
  border-radius: var(--ds-radius-md);
  background: var(--ds-color-info-soft);
  color: var(--ds-color-primary);
  flex-shrink: 0;
}

.form-section-title {
  font-size: var(--ds-font-size-lg);
  font-weight: var(--ds-font-weight-semibold);
  color: var(--ds-color-text);
  margin: 0;
}

.form-section-desc {
  font-size: var(--ds-font-size-sm);
  color: var(--ds-color-text-muted);
  margin: var(--ds-space-1) 0 0;
  line-height: var(--ds-line-height-normal);
}

.form-section-actions {
  display: flex;
  align-items: center;
  gap: var(--ds-space-2);
  flex-shrink: 0;
}

.form-section-body {
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-5);
}
</style>
