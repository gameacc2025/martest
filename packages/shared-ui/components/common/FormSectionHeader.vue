<script setup>
defineProps({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  icon: { type: String, default: 'pi pi-file' },
})
</script>

<template>
  <header class="form-section-heading">
    <span class="form-section-heading__icon" aria-hidden="true">
      <i :class="icon"></i>
    </span>
    <div class="form-section-heading__copy">
      <h2>{{ title }}</h2>
      <p v-if="description">{{ description }}</p>
    </div>
    <div v-if="$slots.actions" class="form-section-heading__actions">
      <slot name="actions" />
    </div>
  </header>
</template>

<style scoped>
.form-section-heading {
  display: flex;
  align-items: center;
  gap: .9rem;
  min-width: 0;
  margin-bottom: 1.35rem;
}
.form-section-heading__icon {
  display: grid;
  place-items: center;
  width: 2.8rem;
  height: 2.8rem;
  flex: 0 0 auto;
  border: 1px solid color-mix(in srgb, var(--ds-color-primary) 18%, var(--ds-color-border));
  border-radius: var(--ds-radius-lg);
  background: var(--ds-color-primary-soft);
  color: var(--ds-color-primary);
  font-size: 1.1rem;
}
.form-section-heading__copy { min-width: 0; flex: 1; }
.form-section-heading__copy h2 {
  margin: 0;
  color: var(--ds-color-text);
  font-size: var(--ds-font-size-md);
  font-weight: var(--ds-font-weight-bold);
  line-height: 1.5;
}
.form-section-heading__copy p {
  margin: .2rem 0 0;
  color: var(--ds-color-text-muted);
  font-size: var(--ds-font-size-xs);
  line-height: 1.6;
}
.form-section-heading__actions { flex: 0 0 auto; }
@media (max-width: 560px) {
  .form-section-heading { align-items: flex-start; gap: .65rem; }
  .form-section-heading__icon { width: 2.45rem; height: 2.45rem; }
  .form-section-heading__actions { margin-inline-start: auto; }
}
</style>
