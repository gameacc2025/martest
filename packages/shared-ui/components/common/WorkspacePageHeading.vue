<script setup>
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
    <span class="workspace-page-heading-icon" aria-hidden="true">
      <i :class="icon"></i>
    </span>
    <div class="workspace-page-heading-copy">
      <span v-if="eyebrow" class="workspace-page-heading-eyebrow">{{ eyebrow }}</span>
      <h1 :id="headingId">{{ title }}</h1>
      <p v-if="description">{{ description }}</p>
    </div>
    <div v-if="$slots.actions" class="workspace-page-heading-actions">
      <slot name="actions"></slot>
    </div>
  </section>
</template>

<style scoped>
.workspace-page-heading {
  position: relative;
  isolation: isolate;
  display: flex;
  align-items: center;
  gap: 1rem;
  min-width: 0;
  min-height: 7rem;
  padding: clamp(1.1rem, 2.2vw, 1.5rem);
  overflow: hidden;
  border: 1px solid color-mix(in srgb, var(--ds-color-primary) 18%, var(--ds-color-border));
  border-radius: var(--ds-radius-xl);
  background:
    radial-gradient(circle at 7% 0%, color-mix(in srgb, var(--ds-color-primary) 12%, transparent), transparent 38%),
    var(--ds-color-surface);
  box-shadow: var(--ds-shadow-xs);
}
.workspace-page-heading::after {
  position: absolute;
  z-index: -1;
  inset-inline-end: -2.5rem;
  bottom: -5.5rem;
  width: 11rem;
  height: 11rem;
  border: 1px solid color-mix(in srgb, var(--ds-color-primary) 10%, transparent);
  border-radius: 50%;
  content: "";
}
.workspace-page-heading-icon {
  display: grid;
  place-items: center;
  flex: 0 0 3.25rem;
  width: 3.25rem;
  height: 3.25rem;
  border: 1px solid color-mix(in srgb, var(--ds-color-primary) 22%, transparent);
  border-radius: 1rem;
  background: var(--ds-color-primary-soft);
  color: var(--ds-color-primary);
  font-size: 1.35rem;
}
.workspace-page-heading-copy { min-width: 0; flex: 1; }
.workspace-page-heading-eyebrow {
  display: block;
  margin-bottom: .2rem;
  color: var(--ds-color-primary);
  font-size: var(--ds-font-size-xs);
  font-weight: var(--ds-font-weight-bold);
}
.workspace-page-heading h1 {
  margin: 0;
  color: var(--ds-color-text);
  font-size: clamp(1.3rem, 2vw, 1.7rem);
  font-weight: 800;
  line-height: 1.45;
}
.workspace-page-heading p {
  max-width: 54rem;
  margin: .35rem 0 0;
  color: var(--ds-color-text-muted);
  font-size: var(--ds-font-size-sm);
  line-height: 1.75;
}
.workspace-page-heading-actions {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: .6rem;
}
@media (max-width: 640px) {
  .workspace-page-heading { align-items: flex-start; flex-wrap: wrap; padding: 1rem; }
  .workspace-page-heading-icon { flex-basis: 2.75rem; width: 2.75rem; height: 2.75rem; }
  .workspace-page-heading-copy { flex-basis: calc(100% - 4rem); }
  .workspace-page-heading-actions { width: 100%; }
  .workspace-page-heading-actions > :deep(*) { flex: 1 1 auto; }
}
</style>
