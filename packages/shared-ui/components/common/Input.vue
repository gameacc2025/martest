<script setup>
/**
 * Input — design-system text field.
 *
 * Wraps PrimeVue InputText with a consistent label/hint/error layout. All
 * styling comes from `--ds-*` tokens (spacing, radius, colors) and PrimeVue's
 * theme; no hardcoded colors.
 */
import { computed, getCurrentInstance, useAttrs } from 'vue'
import InputText from 'primevue/inputtext'

defineOptions({ inheritAttrs: false })

const props = defineProps({
  modelValue: { type: [String, Number], default: '' },
  id: { type: String, default: '' },
  name: { type: String, default: '' },
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
const instance = getCurrentInstance()
const attrs = useAttrs()

// A stable per-instance fallback keeps labels associated even when older
// call sites have not yet supplied an explicit id.
const inputId = computed(() => props.id || (props.name ? `ds-field-${props.name}` : `ds-field-${instance?.uid ?? 'input'}`))
const messageId = computed(() => `${inputId.value}-message`)
const message = computed(() => props.error || props.hint)
const describedBy = computed(() => [attrs['aria-describedby'], message.value ? messageId.value : null].filter(Boolean).join(' ') || undefined)
const ariaInvalid = computed(() => props.error ? 'true' : attrs['aria-invalid'])

const value = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
})
</script>

<template>
  <div class="ds-field" :class="{ 'ds-field--full': fullWidth }">
    <label v-if="label" class="ds-field-label" :for="inputId">{{ label }}</label>
    <InputText
      v-bind="$attrs"
      :id="inputId"
      :name="name || undefined"
      v-model="value"
      :type="type"
      :placeholder="placeholder"
      :disabled="disabled"
      :invalid="!!error"
      :aria-invalid="ariaInvalid"
      :aria-describedby="describedBy"
      class="ds-field-input"
    />
    <small v-if="message" :id="messageId" :class="error ? 'ds-field-error' : 'ds-field-hint'">{{ message }}</small>
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
  font-weight: var(--ds-font-weight-semibold);
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

.ds-field-input :deep(.p-inputtext) {
  min-height: var(--ds-touch-target);
  border-radius: var(--ds-radius-md);
}

.ds-field-input :deep(.p-inputtext:focus) {
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--ds-color-primary) 14%, transparent);
}
</style>
