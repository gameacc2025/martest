<script setup>
/**
 * QuickActions — grid of navigation shortcuts for common admin tasks.
 *
 * Actions are passed in as a config array so the parent controls destinations
 * and labels. Purely presentational; each item is a router-link. Token-driven.
 */
defineProps({
  // [{ label, icon, to, tone? }]
  actions: { type: Array, default: () => [] },
})
</script>

<template>
  <div class="quick-actions">
    <router-link
      v-for="action in actions"
      :key="action.label"
      :to="action.to"
      class="quick-action-item"
      :class="`quick-action-item--${action.tone || 'primary'}`"
    >
      <span class="quick-action-icon">
        <i :class="action.icon"></i>
      </span>
      <span class="quick-action-label">{{ action.label }}</span>
      <i class="pi pi-angle-left quick-action-arrow"></i>
    </router-link>
  </div>
</template>

<style scoped>
.quick-actions {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--ds-space-3);
}

.quick-action-item {
  display: flex;
  align-items: center;
  gap: var(--ds-space-3);
  padding: var(--ds-space-4);
  border: 1px solid var(--ds-color-border);
  border-radius: var(--ds-radius-md);
  background: var(--ds-color-surface);
  color: var(--ds-color-text);
  text-decoration: none;
  font-weight: var(--ds-font-weight-semibold);
  font-size: var(--ds-font-size-sm);
  transition: background-color var(--ds-transition), border-color var(--ds-transition), transform var(--ds-transition);
}

.quick-action-item:hover {
  background: var(--ds-color-surface-hover);
  border-color: var(--qa-accent, var(--ds-color-primary));
  transform: translateY(-1px);
}

.quick-action-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: var(--ds-radius-md);
  background: var(--qa-soft, var(--ds-color-info-soft));
  color: var(--qa-accent, var(--ds-color-primary));
  flex-shrink: 0;
}

.quick-action-icon i {
  font-size: 1.2rem;
}

.quick-action-arrow {
  margin-inline-start: auto;
  color: var(--ds-color-text-muted);
}

.quick-action-item--primary { --qa-accent: var(--ds-color-primary); --qa-soft: var(--ds-color-info-soft); }
.quick-action-item--success { --qa-accent: var(--ds-color-success); --qa-soft: var(--ds-color-success-soft); }
.quick-action-item--warning { --qa-accent: var(--ds-color-warning); --qa-soft: var(--ds-color-warning-soft); }
.quick-action-item--danger  { --qa-accent: var(--ds-color-danger);  --qa-soft: var(--ds-color-danger-soft); }
.quick-action-item--info    { --qa-accent: var(--ds-color-info);    --qa-soft: var(--ds-color-info-soft); }
</style>
