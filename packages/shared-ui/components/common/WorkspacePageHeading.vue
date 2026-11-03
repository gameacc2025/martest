<script setup>
/** Plain, task-first page heading. Legacy eyebrow/icon props remain compatible. */
defineProps({
  eyebrow: { type: String, default: '' },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  icon: { type: String, default: 'pi pi-th-large' },
  headingId: { type: String, default: 'workspace-page-title' },
})
</script>

<template>
  <section class="workspace-page-heading" :aria-labelledby="headingId">
    <div class="workspace-page-heading-copy">
      <h1 :id="headingId">{{ title }}</h1>
      <p v-if="description">{{ description }}</p>
    </div>
    <div v-if="$slots.actions" class="workspace-page-heading-actions"><slot name="actions"></slot></div>
  </section>
</template>

<style scoped>
.workspace-page-heading {
  display: flex;
  min-width: 0;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 1rem;
  margin: .5rem 0 1.25rem;
  padding: 1rem 1.2rem;
  border: 1px solid var(--ds-color-border);
  border-inline-start: 1px solid var(--ds-color-border);
  border-radius: var(--ds-radius-lg);
  background: color-mix(in srgb, var(--ds-color-primary) 3%, var(--ds-color-surface));
  box-shadow: var(--ds-shadow-xs);
}
.workspace-page-heading-copy { min-width: 0; flex: 1 1 24rem; }
.workspace-page-heading h1 {
  margin: 0;
  color: var(--ds-color-text);
  font-size: 1.28rem;
  font-weight: var(--ds-font-weight-bold);
  line-height: 1.45;
  text-wrap: balance;
}
.workspace-page-heading p {
  max-width: 68ch;
  margin: .3rem 0 0;
  color: var(--ds-color-text-muted);
  font-size: .82rem;
  line-height: var(--ds-line-height-relaxed);
}
.workspace-page-heading-actions { display: flex; align-items: center; flex-wrap: wrap; gap: var(--ds-space-2); }
.workspace-page-heading-actions :deep(.p-button), .workspace-page-heading-actions :deep(a) { min-height: 2.65rem; }
@media (max-width: 640px) {
  .workspace-page-heading { align-items: stretch; flex-direction: column; gap: .75rem; margin-bottom: 1rem; padding: .85rem; }
  .workspace-page-heading-actions { width: 100%; }
  .workspace-page-heading-actions > :deep(*) { flex: 1 1 auto; }
}
</style>
