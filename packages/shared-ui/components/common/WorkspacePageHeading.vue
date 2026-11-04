<script setup>
/**
 * WorkspacePageHeading — the single page-head block for public pages and
 * secondary workspaces.
 *
 * Visible variant follows the unified `tem` page head (eyebrow, H1,
 * description, right-aligned actions). When a page already renders the
 * breadcrumb from the layout, pass `sr-only` so the H1 stays available to
 * screen readers without repeating the "where am I" banner.
 */
defineProps({
  title: { type: String, required: true },
  headingId: { type: String, default: 'workspace-page-title' },
  srOnly: { type: Boolean, default: false },
  description: { type: String, default: '' },
  eyebrow: { type: String, default: '' },
  icon: { type: String, default: '' },
})
</script>

<template>
  <header
    class="workspace-page-heading tm-page-head"
    :class="{ 'workspace-page-heading--sr-only': srOnly }"
    :aria-labelledby="headingId"
  >
    <div class="workspace-page-heading-copy tm-page-head__main">
      <span v-if="eyebrow && !srOnly" class="workspace-page-heading-eyebrow">
        <i v-if="icon" :class="icon" aria-hidden="true"></i>
        {{ eyebrow }}
      </span>
      <h1 :id="headingId" class="workspace-page-heading-title tm-page-head__title">{{ title }}</h1>
      <p v-if="description && !srOnly" class="workspace-page-heading-description tm-page-head__desc">
        {{ description }}
      </p>
    </div>
    <div v-if="$slots.actions" class="workspace-page-heading-actions tm-page-head__actions">
      <slot name="actions"></slot>
    </div>
  </header>
</template>

<style scoped>
.workspace-page-heading {
  margin-bottom: 16px;
}
.workspace-page-heading-copy { min-width: 0; }
.workspace-page-heading-eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 6px;
  padding: 4px 10px;
  border: 1px solid var(--tm-cyan-soft);
  border-radius: var(--tm-radius-pill);
  background: var(--tm-cyan-soft);
  color: var(--tm-cyan-deep);
  font-size: 11px;
  font-weight: 700;
}
.workspace-page-heading-title {
  margin: 0;
  color: var(--tm-ink);
  font-size: var(--tm-fs-h1);
  font-weight: 700;
  line-height: 1.35;
  text-wrap: balance;
}
.workspace-page-heading-description {
  margin: 5px 0 0;
  color: var(--tm-muted);
  font-size: var(--tm-fs-sm);
  max-width: 64ch;
}
.workspace-page-heading-actions {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}
.workspace-page-heading--sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
  margin: 0;
}
@media (max-width: 640px) {
  .workspace-page-heading { align-items: stretch; flex-direction: column; gap: 12px; }
  .workspace-page-heading-actions { width: 100%; }
  .workspace-page-heading-actions > :deep(*) { flex: 1 1 auto; }
  .workspace-page-heading--sr-only { position: absolute; }
}
</style>