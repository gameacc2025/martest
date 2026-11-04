<script setup>
/**
 * TemSegmented — accessible segmented control.
 *
 * <TemSegmented v-model="tab" :options="[{value:'all',label:'همه'}]" aria-label="..." />
 */
const props = defineProps({
  modelValue: { type: [String, Number], default: null },
  /** [{ value, label }] */
  options: { type: Array, required: true },
  ariaLabel: { type: String, default: 'انتخاب نما' },
})
const emit = defineEmits(['update:modelValue'])

function select(value) {
  if (value !== props.modelValue) emit('update:modelValue', value)
}
</script>

<template>
  <div class="tm-segmented" role="group" :aria-label="ariaLabel">
    <button
      v-for="option in options"
      :key="option.value"
      type="button"
      :aria-pressed="modelValue === option.value ? 'true' : 'false'"
      @click="select(option.value)"
    >
      {{ option.label }}
    </button>
  </div>
</template>