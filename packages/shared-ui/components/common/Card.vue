<script setup>
/**
 * Card — design-system surface container.
 *
 * Wraps content in a token-driven surface (background, border, radius, shadow).
 * PrimeVue-compatible: it's a plain surface you can drop any PrimeVue content
 * into. All styling comes from `--ds-*` tokens — no hardcoded colors.
 */
import PvButton from 'primevue/button'

defineProps({
  title: { type: String, default: '' },
  subtitle: { type: String, default: '' },
  // Elevation: 'none' | 'sm' | 'md' | 'lg'
  elevation: {
    type: String,
    default: 'sm',
    validator: (v) => ['none', 'sm', 'md', 'lg'].includes(v),
  },
  // Inner padding: 'none' | 'sm' | 'md' | 'lg'
  padding: {
    type: String,
    default: 'md',
    validator: (v) => ['none', 'sm', 'md', 'lg'].includes(v),
  },
  actions: { type: Array, default: () => [] },
})
</script>

<template>
  <div class="ds-card" :class="[`ds-card--elev-${elevation}`, `ds-card--pad-${padding}`]">
    <div
      v-if="title || subtitle || actions.length > 0 || $slots.header || $slots.actions"
      class="ds-card-header"
    >
      <div class="ds-card-heading">
        <slot name="header">
          <h3 v-if="title" class="ds-card-title">{{ title }}</h3>
          <p v-if="subtitle" class="ds-card-subtitle">{{ subtitle }}</p>
        </slot>
      </div>
      <div v-if="actions.length > 0 || $slots.actions" class="ds-card-actions">
        <slot name="actions">
          <template v-for="action in actions" :key="action.label">
            <router-link v-if="action.to" :to="action.to" custom v-slot="{ navigate }">
              <PvButton :label="action.label" :icon="action.icon" severity="secondary" outlined @click="navigate" />
            </router-link>
            <PvButton v-else :label="action.label" :icon="action.icon" severity="secondary" outlined @click="action.onClick" />
          </template>
        </slot>
      </div>
    </div>

    <div class="ds-card-body">
      <slot></slot>
    </div>

    <div v-if="$slots.footer" class="ds-card-footer">
      <slot name="footer"></slot>
    </div>
  </div>
</template>

<style scoped>
.ds-card {
  background: var(--ds-color-surface);
  border: 1px solid var(--ds-color-border);
  border-radius: var(--ds-radius-md);
  transition: box-shadow var(--ds-transition);
}

/* Elevation */
.ds-card--elev-none { box-shadow: none; }
.ds-card--elev-sm { box-shadow: var(--ds-shadow-sm); }
.ds-card--elev-md { box-shadow: var(--ds-shadow-md); }
.ds-card--elev-lg { box-shadow: var(--ds-shadow-lg); }

/* Padding */
.ds-card--pad-none .ds-card-body { padding: 0; }
.ds-card--pad-sm .ds-card-body { padding: var(--ds-space-3); }
.ds-card--pad-md .ds-card-body { padding: var(--ds-space-6); }
.ds-card--pad-lg .ds-card-body { padding: var(--ds-space-8); }

.ds-card-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--ds-space-4);
  padding: var(--ds-space-4) var(--ds-space-6);
  border-bottom: 1px solid var(--ds-color-border);
  flex-wrap: wrap;
}

.ds-card-title {
  font-size: var(--ds-font-size-lg);
  font-weight: var(--ds-font-weight-semibold);
  color: var(--ds-color-text);
  margin: 0;
}

.ds-card-subtitle {
  font-size: var(--ds-font-size-sm);
  color: var(--ds-color-text-muted);
  margin: var(--ds-space-1) 0 0 0;
}

.ds-card-actions {
  display: flex;
  align-items: center;
  gap: var(--ds-space-2);
  flex-wrap: wrap;
}

.ds-card-footer {
  padding: var(--ds-space-4) var(--ds-space-6);
  border-top: 1px solid var(--ds-color-border);
}
</style>
