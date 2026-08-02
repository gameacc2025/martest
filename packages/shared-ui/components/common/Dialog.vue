<script setup>
/**
 * Dialog — design-system modal.
 *
 * Wraps PrimeVue Dialog with a size preset API and token-driven chrome.
 * Two-way bound via `v-model` (visibility). Header/footer slots pass through.
 * PrimeVue-compatible and RTL-aware; no hardcoded colors.
 */
import { computed } from 'vue'
import PvDialog from 'primevue/dialog'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  title: { type: String, default: '' },
  size: {
    type: String,
    default: 'md',
    validator: (v) => ['sm', 'md', 'lg', 'xl', 'full'].includes(v),
  },
  closable: { type: Boolean, default: true },
  dismissableMask: { type: Boolean, default: true },
})

const emit = defineEmits(['update:modelValue', 'close'])

const widthMap = {
  sm: '24rem',
  md: '32rem',
  lg: '42rem',
  xl: '56rem',
  full: '95vw',
}

const dialogStyle = computed(() => ({ width: widthMap[props.size] }))

const visible = computed({
  get: () => props.modelValue,
  set: (val) => {
    emit('update:modelValue', val)
    if (!val) emit('close')
  },
})
</script>

<template>
  <PvDialog
    v-model:visible="visible"
    :header="title"
    :closable="closable"
    :dismissableMask="dismissableMask"
    :style="dialogStyle"
    modal
    class="ds-dialog"
  >
    <template v-if="$slots.header" #header>
      <slot name="header"></slot>
    </template>

    <slot></slot>

    <template v-if="$slots.footer" #footer>
      <div class="ds-dialog-footer">
        <slot name="footer"></slot>
      </div>
    </template>
  </PvDialog>
</template>

<style scoped>
.ds-dialog-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: var(--ds-space-2);
  flex-wrap: wrap;
}
</style>

<style>
/* Global (unscoped) tweaks so the DS dialog chrome uses tokens consistently. */
.ds-dialog {
  border-radius: var(--ds-radius-lg);
  box-shadow: var(--ds-shadow-xl);
}
</style>
