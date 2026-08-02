<script setup>
import { computed } from 'vue'
import Dialog from 'primevue/dialog'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  title: {
    type: String,
    default: ''
  },
  size: {
    type: String,
    default: 'md',
    validator: (value) => ['sm', 'md', 'lg', 'xl', 'full'].includes(value)
  },
  closable: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['update:modelValue', 'close'])

const widthMap = {
  sm: '24rem',
  md: '32rem',
  lg: '42rem',
  xl: '56rem',
  full: '95vw'
}

const dialogStyle = computed(() => ({ width: widthMap[props.size] }))

const visible = computed({
  get: () => props.modelValue,
  set: (val) => {
    emit('update:modelValue', val)
    if (!val) emit('close')
  }
})
</script>

<template>
  <Dialog
    v-model:visible="visible"
    :header="title"
    :closable="closable"
    :style="dialogStyle"
    modal
    class="app-modal"
  >
    <slot></slot>
    <template v-if="$slots.footer" #footer>
      <slot name="footer"></slot>
    </template>
  </Dialog>
</template>
