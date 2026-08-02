<script setup>
/**
 * DashboardPanel — section wrapper used across the command center.
 *
 * Provides a consistent titled surface with an optional icon, "view all" link,
 * and header-action slot. Body content is projected via the default slot.
 * Token-driven; no hardcoded colors.
 */
defineProps({
  title: { type: String, required: true },
  icon: { type: String, default: '' },
  // Optional "view all" route.
  to: { type: [String, Object], default: null },
  toLabel: { type: String, default: 'مشاهده همه' },
})
</script>

<template>
  <section class="dash-panel">
    <header class="dash-panel-header">
      <div class="dash-panel-title">
        <i v-if="icon" :class="icon" class="dash-panel-title-icon"></i>
        <h2>{{ title }}</h2>
      </div>
      <div class="dash-panel-actions">
        <slot name="actions"></slot>
        <router-link v-if="to" :to="to" class="dash-panel-link">
          {{ toLabel }}<i class="pi pi-angle-left"></i>
        </router-link>
      </div>
    </header>
    <div class="dash-panel-body">
      <slot></slot>
    </div>
  </section>
</template>

<style scoped>
.dash-panel {
  background: var(--ds-color-surface);
  border: 1px solid var(--ds-color-border);
  border-radius: var(--ds-radius-lg);
  box-shadow: var(--ds-shadow-sm);
  display: flex;
  flex-direction: column;
  height: 100%;
}

.dash-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--ds-space-3);
  padding: var(--ds-space-4) var(--ds-space-5);
  border-bottom: 1px solid var(--ds-color-border);
}

.dash-panel-title {
  display: flex;
  align-items: center;
  gap: var(--ds-space-2);
  min-width: 0;
}

.dash-panel-title h2 {
  font-size: var(--ds-font-size-lg);
  font-weight: var(--ds-font-weight-semibold);
  color: var(--ds-color-text);
  margin: 0;
}

.dash-panel-title-icon {
  color: var(--ds-color-primary);
  font-size: 1.1rem;
}

.dash-panel-actions {
  display: flex;
  align-items: center;
  gap: var(--ds-space-3);
}

.dash-panel-link {
  display: inline-flex;
  align-items: center;
  gap: var(--ds-space-1);
  font-size: var(--ds-font-size-sm);
  font-weight: var(--ds-font-weight-semibold);
  color: var(--ds-color-primary);
  text-decoration: none;
  white-space: nowrap;
}

.dash-panel-link:hover {
  text-decoration: underline;
}

.dash-panel-body {
  padding: var(--ds-space-4) var(--ds-space-5);
  flex: 1;
}
</style>
