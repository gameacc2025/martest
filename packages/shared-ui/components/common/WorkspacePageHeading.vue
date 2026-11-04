<script setup>
/**
 * Minimal page heading — title + optional actions slot.
 * RTL-first. When a page already shows a breadcrumb, pass `sr-only` to keep
 * the heading available to screen readers without a second visible "where am
 * I" banner on the page.
 */
defineProps({
  title: { type: String, required: true },
  headingId: { type: String, default: 'workspace-page-title' },
  srOnly: { type: Boolean, default: false },
})
</script>

<template>
  <header
    class="workspace-page-heading"
    :class="{ 'workspace-page-heading--sr-only': srOnly }"
    :aria-labelledby="headingId"
  >
    <h1 :id="headingId" class="workspace-page-heading-title">{{ title }}</h1>
    <div v-if="$slots.actions" class="workspace-page-heading-actions"><slot name="actions"></slot></div>
  </header>
</template>

<style scoped>
.workspace-page-heading {
  display: flex;
  min-width: 0;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 1rem;
  padding: 0;
  border: none;
  background: transparent;
  box-shadow: none;
}
.workspace-page-heading-title {
  margin: 0;
  color: var(--ds-color-text);
  font-size: 1.35rem;
  font-weight: var(--ds-font-weight-bold);
  line-height: 1.35;
  text-wrap: balance;
}
.workspace-page-heading-actions { display: flex; align-items: center; flex-wrap: wrap; gap: var(--ds-space-2); }
.workspace-page-heading-actions :deep(.p-button), .workspace-page-heading-actions :deep(a) { min-height: 2.65rem; }
.workspace-page-heading--sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }

@media (max-width: 640px) {
  .workspace-page-heading { align-items: stretch; flex-direction: column; gap: .75rem; }
  .workspace-page-heading-actions { width: 100%; }
  .workspace-page-heading-actions > :deep(*) { flex: 1 1 auto; }
  .workspace-page-heading--sr-only { position: absolute; }
}
</style>
