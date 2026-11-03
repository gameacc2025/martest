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
  display: flex; min-width: 0; align-items: flex-end; justify-content: space-between;
  flex-wrap: wrap; gap: var(--ds-space-4); margin-block: .5rem var(--ds-space-6);
  padding: 0 0 var(--ds-space-4); border-bottom: 1px solid var(--ds-color-border);
}
.workspace-page-heading-copy { min-width: 0; flex: 1 1 24rem; }
.workspace-page-heading h1 {
  margin: 0; color: var(--ds-color-text); font-size: clamp(1.45rem, 2vw, 1.8rem);
  font-weight: var(--ds-font-weight-bold); line-height: 1.35; text-wrap: balance;
}
.workspace-page-heading p { max-width: 68ch; margin: .4rem 0 0; color: var(--ds-color-text-muted); font-size: var(--ds-font-size-sm); line-height: var(--ds-line-height-relaxed); }
.workspace-page-heading-actions { display: flex; align-items: center; flex-wrap: wrap; gap: var(--ds-space-2); }
.workspace-page-heading-actions :deep(.p-button), .workspace-page-heading-actions :deep(a) { min-height: 2.75rem; }
@media (max-width: 640px) {
  .workspace-page-heading { align-items: stretch; flex-direction: column; gap: var(--ds-space-3); margin-bottom: var(--ds-space-4); }
  .workspace-page-heading-actions { width: 100%; }
  .workspace-page-heading-actions > :deep(*) { flex: 1 1 auto; }
}
</style>
