<script setup>
/** Compact navigation list for common workspace tasks; destinations stay host-owned. */
defineProps({ actions: { type: Array, default: () => [] } })
</script>

<template>
  <nav class="quick-actions" aria-label="دسترسی سریع">
    <router-link v-for="action in actions" :key="action.label" :to="action.to" class="quick-action-item">
      <i :class="action.icon" class="quick-action-icon" aria-hidden="true"></i>
      <span class="quick-action-label">{{ action.label }}</span>
      <i class="pi pi-arrow-left quick-action-arrow" aria-hidden="true"></i>
    </router-link>
  </nav>
</template>

<style scoped>
.quick-actions { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: .65rem; }
.quick-action-item {
  display: flex;
  min-width: 0;
  min-height: 3.4rem;
  align-items: center;
  gap: .7rem;
  padding: .65rem .8rem;
  border: 1px solid var(--ds-color-border);
  border-radius: var(--ds-radius-md);
  background: var(--ds-color-surface);
  color: var(--ds-color-text);
  box-shadow: var(--ds-shadow-xs);
  text-decoration: none;
  font-size: .8rem;
  font-weight: var(--ds-font-weight-medium);
  transition: border-color var(--ds-transition-fast), background-color var(--ds-transition-fast), box-shadow var(--ds-transition-fast);
}
.quick-action-icon { flex: 0 0 auto; color: var(--ds-color-primary-text); font-size: 1.05rem; }
.quick-action-label { min-width: 0; overflow-wrap: anywhere; }
.quick-action-arrow { margin-inline-start: auto; color: var(--ds-color-text-muted); font-size: .78rem; transition: transform var(--ds-transition-fast), color var(--ds-transition-fast); }
.quick-action-item:hover { border-color: color-mix(in srgb, var(--ds-color-primary) 35%, var(--ds-color-border)); background: var(--ds-color-surface-hover); box-shadow: var(--ds-shadow-sm); }
.quick-action-item:hover .quick-action-arrow { color: var(--ds-color-primary-text); transform: translateX(-2px); }
.quick-action-item:focus-visible { outline: 2px solid var(--ds-color-focus); outline-offset: 2px; }
@media (max-width: 640px) { .quick-actions { grid-template-columns: minmax(0, 1fr); } }
@media (prefers-reduced-motion: reduce) { .quick-action-item, .quick-action-arrow { transition: none; } }
</style>
