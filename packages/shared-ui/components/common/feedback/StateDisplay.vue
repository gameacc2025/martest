<script setup>
/**
 * StateDisplay — the shared foundation for all "state" screens.
 *
 * A centered icon + title + description + action layout used by EmptyState,
 * NoDataState, PermissionDenied, NotFound and ServerError so every non-happy
 * path looks consistent across the app. Purely presentational; token-driven.
 *
 * Prefer the specialized wrappers over using this directly, but it's exported
 * too for one-off states.
 */
defineProps({
  icon: { type: String, default: 'pi pi-info-circle' },
  title: { type: String, default: '' },
  description: { type: String, default: '' },
  // Accent tone for the icon: neutral | primary | success | warning | danger
  tone: {
    type: String,
    default: 'neutral',
    validator: (v) => ['neutral', 'primary', 'success', 'warning', 'danger'].includes(v),
  },
  // Vertical padding size: sm | md | lg
  size: {
    type: String,
    default: 'md',
    validator: (v) => ['sm', 'md', 'lg'].includes(v),
  },
})
</script>

<template>
  <div class="state-display" :class="[`state-display--${tone}`, `state-display--${size}`]">
    <div class="state-display-icon">
      <slot name="icon">
        <i :class="icon"></i>
      </slot>
    </div>
    <h3 v-if="title" class="state-display-title">{{ title }}</h3>
    <p v-if="description" class="state-display-desc">{{ description }}</p>
    <div v-if="$slots.default" class="state-display-actions">
      <slot></slot>
    </div>
  </div>
</template>

<style scoped>
.state-display {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  gap: var(--ds-space-3);
}

.state-display--sm { padding: var(--ds-space-6) var(--ds-space-4); }
.state-display--md { padding: var(--ds-space-10) var(--ds-space-4); }
.state-display--lg { padding: var(--ds-space-16) var(--ds-space-4); }

.state-display-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 4.5rem;
  height: 4.5rem;
  border-radius: var(--ds-radius-circle);
  background: var(--state-soft, var(--ds-color-surface-alt));
  color: var(--state-accent, var(--ds-color-text-muted));
  margin-bottom: var(--ds-space-1);
}

.state-display-icon :deep(i) {
  font-size: 2rem;
}

.state-display-title {
  font-size: var(--ds-font-size-lg);
  font-weight: var(--ds-font-weight-semibold);
  color: var(--ds-color-text);
  margin: 0;
}

.state-display-desc {
  font-size: var(--ds-font-size-sm);
  color: var(--ds-color-text-muted);
  margin: 0;
  max-width: 32rem;
  line-height: var(--ds-line-height-relaxed);
}

.state-display-actions {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--ds-space-3);
  flex-wrap: wrap;
  margin-top: var(--ds-space-2);
}

/* Tones */
.state-display--neutral { --state-accent: var(--ds-color-text-muted); --state-soft: var(--ds-color-surface-alt); }
.state-display--primary { --state-accent: var(--ds-color-primary); --state-soft: var(--ds-color-info-soft); }
.state-display--success { --state-accent: var(--ds-color-success); --state-soft: var(--ds-color-success-soft); }
.state-display--warning { --state-accent: var(--ds-color-warning); --state-soft: var(--ds-color-warning-soft); }
.state-display--danger  { --state-accent: var(--ds-color-danger);  --state-soft: var(--ds-color-danger-soft); }
</style>
