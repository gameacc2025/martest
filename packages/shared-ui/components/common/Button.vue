<script setup>
/**
 * Button — design-system button.
 *
 * Thin wrapper over PrimeVue Button (keeps full framework compatibility:
 * loading, icons, etc.) with a stable variant/size API. Visuals come from the
 * PrimeVue theme + `--ds-*` tokens — no hardcoded colors.
 */
import { computed } from 'vue'
import PvButton from 'primevue/button'

const props = defineProps({
  variant: {
    type: String,
    default: 'primary',
    validator: (v) => ['primary', 'secondary', 'success', 'warning', 'danger', 'outline', 'ghost'].includes(v),
  },
  size: {
    type: String,
    default: 'md',
    validator: (v) => ['sm', 'md', 'lg'].includes(v),
  },
  disabled: { type: Boolean, default: false },
  loading: { type: Boolean, default: false },
  fullWidth: { type: Boolean, default: false },
})

const severityMap = {
  primary: 'primary',
  secondary: 'secondary',
  success: 'success',
  warning: 'warn',
  danger: 'danger',
  outline: 'secondary',
  ghost: 'secondary',
}

const severity = computed(() => severityMap[props.variant] || 'primary')
const variantIsOutline = computed(() => props.variant === 'outline')
const variantIsGhost = computed(() => props.variant === 'ghost')
const pvSize = computed(() => (props.size === 'md' ? undefined : props.size))
</script>

<template>
  <PvButton
    :severity="severity"
    :outlined="variantIsOutline"
    :text="variantIsGhost"
    :disabled="disabled"
    :loading="loading"
    :size="pvSize"
    :class="['ds-btn', { 'ds-btn--full': fullWidth }]"
  >
    <slot></slot>
  </PvButton>
</template>

<style scoped>
.ds-btn {
  border-radius: var(--ds-radius-md);
  font-weight: var(--ds-font-weight-semibold);
  transition: all var(--ds-transition);
}

.ds-btn.ds-btn--full {
  width: 100%;
}
</style>
