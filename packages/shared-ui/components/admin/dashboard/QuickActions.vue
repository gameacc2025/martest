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
.quick-actions { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); column-gap: var(--ds-space-6); }
.quick-action-item {
  display: flex; min-width: 0; min-height: 3.25rem; align-items: center; gap: var(--ds-space-3);
  padding: .65rem .15rem; border-bottom: 1px solid var(--ds-color-border); color: var(--ds-color-text);
  text-decoration: none; font-size: var(--ds-font-size-sm); font-weight: var(--ds-font-weight-medium);
  transition: color var(--ds-transition-fast);
}
.quick-action-icon { flex: 0 0 1.25rem; color: var(--ds-color-text-muted); font-size: 1.05rem; text-align: center; }
.quick-action-label { min-width: 0; overflow-wrap: anywhere; }
.quick-action-arrow { margin-inline-start: auto; color: var(--ds-color-text-muted); font-size: .8rem; transition: transform var(--ds-transition-fast), color var(--ds-transition-fast); }
.quick-action-item:hover, .quick-action-item:hover .quick-action-icon, .quick-action-item:hover .quick-action-arrow { color: var(--ds-color-primary-text); }
.quick-action-item:hover .quick-action-arrow { transform: translateX(-2px); }
.quick-action-item:focus-visible { outline: 2px solid var(--ds-color-focus); outline-offset: 2px; }
@media (max-width: 640px) { .quick-actions { grid-template-columns: minmax(0, 1fr); } }
@media (prefers-reduced-motion: reduce) { .quick-action-item, .quick-action-arrow { transition: none; } }
</style>
