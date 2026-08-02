<script setup>
/**
 * FormAlert — form-level feedback banner (error / success / info / warning).
 *
 * For messages that apply to the whole form rather than a single field, e.g. a
 * server error summary or a "saved successfully" confirmation. Presentational
 * only — the parent decides when to show it and what it says. Supports a single
 * message or a list (e.g. server validation summary). Token-driven; RTL-aware.
 */
import { computed } from 'vue'

const props = defineProps({
  // 'error' | 'success' | 'info' | 'warning'
  variant: {
    type: String,
    default: 'info',
    validator: (v) => ['error', 'success', 'info', 'warning'].includes(v),
  },
  title: { type: String, default: '' },
  message: { type: String, default: '' },
  // Optional list of messages (e.g. multiple server errors).
  messages: { type: Array, default: () => [] },
  closable: { type: Boolean, default: false },
})

const emit = defineEmits(['close'])

const iconMap = {
  error: 'pi pi-times-circle',
  success: 'pi pi-check-circle',
  info: 'pi pi-info-circle',
  warning: 'pi pi-exclamation-triangle',
}
const icon = computed(() => iconMap[props.variant])
const list = computed(() => props.messages.filter(Boolean))
</script>

<template>
  <div class="form-alert" :class="`form-alert--${variant}`" role="alert">
    <i class="form-alert-icon" :class="icon"></i>
    <div class="form-alert-content">
      <p v-if="title" class="form-alert-title">{{ title }}</p>
      <p v-if="message" class="form-alert-message">{{ message }}</p>
      <ul v-if="list.length" class="form-alert-list">
        <li v-for="(m, i) in list" :key="i">{{ m }}</li>
      </ul>
      <slot></slot>
    </div>
    <button
      v-if="closable"
      type="button"
      class="form-alert-close"
      aria-label="بستن"
      @click="emit('close')"
    >
      <i class="pi pi-times"></i>
    </button>
  </div>
</template>

<style scoped>
.form-alert {
  display: flex;
  align-items: flex-start;
  gap: var(--ds-space-3);
  padding: var(--ds-space-4);
  border-radius: var(--ds-radius-md);
  border: 1px solid transparent;
}

.form-alert-icon {
  font-size: 1.1rem;
  flex-shrink: 0;
  margin-top: 0.1rem;
}

.form-alert-content {
  flex: 1;
  min-width: 0;
}

.form-alert-title {
  font-weight: var(--ds-font-weight-semibold);
  font-size: var(--ds-font-size-sm);
  margin: 0;
}

.form-alert-message {
  font-size: var(--ds-font-size-sm);
  margin: var(--ds-space-1) 0 0;
  line-height: var(--ds-line-height-normal);
}

.form-alert-list {
  margin: var(--ds-space-1) 0 0;
  padding-inline-start: var(--ds-space-5);
  font-size: var(--ds-font-size-sm);
  line-height: var(--ds-line-height-relaxed);
}

.form-alert-close {
  background: none;
  border: none;
  cursor: pointer;
  color: inherit;
  opacity: 0.7;
  padding: 0;
  flex-shrink: 0;
}
.form-alert-close:hover { opacity: 1; }

/* Variants — token-driven soft backgrounds. */
.form-alert--error {
  background: var(--ds-color-danger-soft);
  border-color: var(--ds-color-danger);
  color: var(--ds-color-danger);
}
.form-alert--success {
  background: var(--ds-color-success-soft);
  border-color: var(--ds-color-success);
  color: var(--ds-color-success);
}
.form-alert--info {
  background: var(--ds-color-info-soft);
  border-color: var(--ds-color-info);
  color: var(--ds-color-info);
}
.form-alert--warning {
  background: var(--ds-color-warning-soft);
  border-color: var(--ds-color-warning);
  color: var(--ds-color-warning);
}

/* Body text stays readable regardless of the accent color. */
.form-alert-message,
.form-alert-list {
  color: var(--ds-color-text);
}
</style>
