<script setup>
/**
 * FormField — label + control + help/error wrapper.
 *
 * Wraps any input (passed via the default slot) with a consistent label,
 * required marker, help text, and validation/error display. It only DISPLAYS
 * the error string the parent gives it — it performs no validation itself, so
 * existing validation rules, payloads, and logic are untouched.
 *
 * Usage:
 *   <FormField label="ایمیل" :error="errors.email" help="ایمیل کاری خود را وارد کنید" required>
 *     <InputText v-model="form.email" :invalid="!!errors.email" />
 *   </FormField>
 *
 * Token-driven; RTL-aware; responsive.
 */
import { computed, getCurrentInstance } from 'vue'

const props = defineProps({
  label: { type: String, default: '' },
  help: { type: String, default: '' },
  error: { type: [String, Array], default: '' },
  required: { type: Boolean, default: false },
  // Optional success hint (e.g. "نام کاربری در دسترس است").
  success: { type: String, default: '' },
})

// Vue instance UIDs are available throughout the declared Vue 3.4+ range.
// This avoids depending on useId(), which was introduced in Vue 3.5.
const instance = getCurrentInstance()
const fieldId = `ds-form-field-${instance?.uid ?? 'field'}`
const messageId = computed(() => `${fieldId}-message`)
const message = computed(() => errorText.value || props.success || props.help)

const errorText = computed(() => {
  if (Array.isArray(props.error)) return props.error.filter(Boolean).join('، ')
  return props.error || ''
})
const hasError = computed(() => !!errorText.value)
</script>

<template>
  <div class="form-field" :class="{ 'form-field--error': hasError }">
    <label v-if="label" :for="fieldId" class="form-field-label">
      {{ label }}
      <span v-if="required" class="form-field-required" aria-hidden="true">*</span>
    </label>

    <div class="form-field-control">
      <slot :id="fieldId" :invalid="hasError" :described-by="message ? messageId : undefined"></slot>
    </div>

    <!-- Error takes precedence, then success, then help. -->
    <small v-if="hasError" :id="messageId" class="form-field-msg form-field-msg--error" role="alert">
      <i class="pi pi-exclamation-circle" aria-hidden="true"></i> {{ errorText }}
    </small>
    <small v-else-if="success" :id="messageId" class="form-field-msg form-field-msg--success" aria-live="polite">
      <i class="pi pi-check-circle" aria-hidden="true"></i> {{ success }}
    </small>
    <small v-else-if="help" :id="messageId" class="form-field-msg form-field-msg--help">
      {{ help }}
    </small>
  </div>
</template>

<style scoped>
.form-field {
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-2);
  width: 100%;
}

.form-field-label {
  font-size: var(--ds-font-size-sm);
  font-weight: var(--ds-font-weight-medium);
  color: var(--ds-color-text);
}

.form-field-required {
  color: var(--ds-color-danger);
  margin-inline-start: 0.15rem;
}

.form-field-control {
  display: flex;
  flex-direction: column;
}

/* Make wrapped inputs fill the field width by default. */
.form-field-control :deep(.p-inputtext),
.form-field-control :deep(.p-select),
.form-field-control :deep(.p-multiselect),
.form-field-control :deep(.p-inputnumber),
.form-field-control :deep(.p-password),
.form-field-control :deep(.p-textarea),
.form-field-control :deep(textarea),
.form-field-control :deep(.p-dropdown) {
  width: 100%;
}

.form-field-msg {
  display: inline-flex;
  align-items: center;
  gap: var(--ds-space-1);
  font-size: var(--ds-font-size-xs);
  line-height: var(--ds-line-height-normal);
}

.form-field-msg--help {
  color: var(--ds-color-text-muted);
}
.form-field-msg--error {
  color: var(--ds-color-danger);
}
.form-field-msg--success {
  color: var(--ds-color-success);
}
</style>
