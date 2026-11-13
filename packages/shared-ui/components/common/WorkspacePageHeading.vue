<script setup>
/**
 * WorkspacePageHeading — the single page-head block for public pages and
 * secondary workspaces.
 *
 * Visual source: `tem/admin.css` `.ph` / `tem/style.css` `.head` — a bare
 * title row (large bold H1 + quiet description) with actions pushed to the
 * opposite edge. No card chrome.
 *
 * Dashboard pages use the layout breadcrumb as their visible page locator.
 * The heading stays available to assistive technology by default, while any
 * action slot remains visible.
 */
defineProps({
  title: { type: String, required: true },
  headingId: { type: String, default: 'workspace-page-title' },
  srOnly: { type: Boolean, default: true },
  description: { type: String, default: '' },
  eyebrow: { type: String, default: '' },
  icon: { type: String, default: '' },
})
</script>

<template>
  <header
    class="workspace-page-heading tm-page-head"
    :aria-labelledby="headingId"
  >
    <div class="workspace-page-heading-copy tm-page-head__main" :class="{ 'workspace-page-heading-copy--sr-only': srOnly }">
      <div class="workspace-page-heading-title-row">
        <span v-if="icon && !srOnly" class="workspace-page-heading-icon" aria-hidden="true">
          <i :class="icon"></i>
        </span>
        <div class="workspace-page-heading-text">
          <span v-if="eyebrow && !srOnly" class="workspace-page-heading-eyebrow">{{ eyebrow }}</span>
          <h1 :id="headingId" class="workspace-page-heading-title tm-page-head__title">{{ title }}</h1>
        </div>
      </div>
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
  margin-bottom: 20px;
}
.workspace-page-heading-copy { min-width: 0; }
.workspace-page-heading-title-row {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}
.workspace-page-heading-text { min-width: 0; }
.workspace-page-heading-eyebrow {
  display: block;
  margin-bottom: 2px;
  color: var(--tm-cyan-deep);
  font-size: 12px;
  font-weight: 700;
}
.workspace-page-heading-title {
  margin: 0;
  color: var(--tm-ink);
  font-size: 24px;
  font-weight: 700;
  line-height: 1.35;
  letter-spacing: -0.3px;
  text-wrap: balance;
}
.workspace-page-heading-description {
  margin: 6px 0 0;
  color: var(--tm-muted);
  font-size: 14px;
  line-height: 1.7;
  max-width: 68ch;
}
.workspace-page-heading-actions {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}
.workspace-page-heading-copy--sr-only {
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
  .workspace-page-heading-title { font-size: 20px; }
}
</style>