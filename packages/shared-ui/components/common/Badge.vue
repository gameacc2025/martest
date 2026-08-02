<script setup>
/**
 * Badge — design-system status label.
 *
 * Wraps PrimeVue Tag with a semantic variant API aligned to the design-system
 * status tokens (success / warning / danger / info / neutral). Supports a soft
 * (tinted) style. No hardcoded colors — everything resolves to `--ds-*` tokens.
 */
import { computed } from 'vue'
import Tag from 'primevue/tag'

const props = defineProps({
  variant: {
    type: String,
    default: 'primary',
    validator: (v) => ['primary', 'success', 'warning', 'danger', 'info', 'gray'].includes(v),
  },
  // Soft/tinted background instead of solid.
  soft: { type: Boolean, default: false },
  dot: { type: Boolean, default: false },
})

const severityMap = {
  primary: 'info',
  info: 'info',
  success: 'success',
  warning: 'warn',
  danger: 'danger',
  gray: 'secondary',
}

const severity = computed(() => severityMap[props.variant] || 'info')
</script>

<template>
  <Tag
    :severity="severity"
    :class="['ds-badge', `ds-badge--${variant}`, { 'ds-badge--soft': soft, 'ds-badge--dot': dot }]"
  >
    <span v-if="dot" class="ds-badge-dot"></span>
    <slot></slot>
  </Tag>
</template>

<style scoped>
.ds-badge {
  display: inline-flex;
  align-items: center;
  border-radius: var(--ds-radius-sm);
  font-size: var(--ds-font-size-xs);
  font-weight: var(--ds-font-weight-semibold);
}

.ds-badge-dot {
  width: 0.375rem;
  height: 0.375rem;
  border-radius: var(--ds-radius-circle);
  background: currentColor;
  margin-inline-end: var(--ds-space-2);
  display: inline-block;
}

/* Soft (tinted) variants — token-driven backgrounds/foregrounds. */
.ds-badge--soft.ds-badge--success {
  background: var(--ds-color-success-soft);
  color: var(--ds-color-success);
}
.ds-badge--soft.ds-badge--warning {
  background: var(--ds-color-warning-soft);
  color: var(--ds-color-warning);
}
.ds-badge--soft.ds-badge--danger {
  background: var(--ds-color-danger-soft);
  color: var(--ds-color-danger);
}
.ds-badge--soft.ds-badge--primary,
.ds-badge--soft.ds-badge--info {
  background: var(--ds-color-info-soft);
  color: var(--ds-color-info);
}
.ds-badge--soft.ds-badge--gray {
  background: var(--ds-color-surface-alt);
  color: var(--ds-color-text-muted);
}
</style>
