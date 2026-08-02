<script setup>
/**
 * Input — design-system text field.
 *
 * Wraps PrimeVue InputText with a consistent label/hint/error layout. All
 * styling comes from `--ds-*` tokens (spacing, radius, colors) and PrimeVue's
 * theme; no hardcoded colors.
 */
import { computed } from 'vue'
import InputText from 'primevue/inputtext'

const props = defineProps({
  modelValue: { type: [String, Number], default: '' },
  type: {
    type: String,
    default: 'text',
    validator: (v) => ['text', 'number', 'email', 'password', 'tel', 'url', 'search'].includes(v),
  },
  label: { type: String, default: '' },
  placeholder: { type: String, default: '' },
  disabled: { type: Boolean, default: false },
  error: { type: String, default: '' },
  hint: { type: String, default: '' },
  fullWidth: { type: Boolean, default: true },
})

const emit = defineEmits(['update:modelValue'])

const value = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
})
</script>

<template>
  <div class="ds-field" :class="{ 'ds-field--full': fullWidth }">
    <label v-if="label" class="ds-field-label">{{ label }}</label>
    <InputText
      v-model="value"
      :type="type"
      :placeholder="placeholder"
      :disabled="disabled"
      :invalid="!!error"
      class="ds-field-input"
    />
    <small v-if="error" class="ds-field-error">{{ error }}</small>
    <small v-else-if="hint" class="ds-field-hint">{{ hint }}</small>
  </div>
</template>

<style scoped>
.ds-field {
  display: flex;
  flex-direction: column;
}

.ds-field--full {
  width: 100%;
}

.ds-field-label {
  font-size: var(--ds-font-size-sm);
  font-weight: var(--ds-font-weight-medium);
  color: var(--ds-color-text);
  margin-bottom: var(--ds-space-2);
}

.ds-field-input {
  width: 100%;
}

.ds-field-error {
  color: var(--ds-color-danger);
  margin-top: var(--ds-space-1);
  font-size: var(--ds-font-size-xs);
}

.ds-field-hint {
  color: var(--ds-color-text-muted);
  margin-top: var(--ds-space-1);
  font-size: var(--ds-font-size-xs);
}
</style>
