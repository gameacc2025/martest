<script setup>
/**
 * ServerError — 500 screen for unexpected/server failures.
 *
 * Full-page route component or inline. Offers retry (emits `retry`) and a way
 * home. Keep the message reassuring and non-technical for end users.
 */
import { useRouter } from 'vue-router'
import StateDisplay from './StateDisplay.vue'
import Button from 'primevue/button'

defineProps({
  title: { type: String, default: 'خطای سرور' },
  description: {
    type: String,
    default: 'مشکلی در سمت سرور رخ داد. لطفاً چند لحظه بعد دوباره تلاش کنید.',
  },
  retryable: { type: Boolean, default: true },
  loading: { type: Boolean, default: false },
  homeTo: { type: [String, Object], default: '/' },
})

const emit = defineEmits(['retry'])
const router = useRouter()
</script>

<template>
  <StateDisplay :title="title" :description="description" tone="danger" size="lg">
    <template #icon>
      <span class="se-code">۵۰۰</span>
    </template>
    <Button
      v-if="retryable"
      label="تلاش مجدد"
      icon="pi pi-refresh"
      :loading="loading"
      @click="emit('retry')"
    />
    <Button label="صفحه اصلی" icon="pi pi-home" severity="secondary" outlined @click="router.push(homeTo)" />
  </StateDisplay>
</template>

<style scoped>
.se-code {
  font-size: 2rem;
  font-weight: var(--ds-font-weight-bold);
  color: var(--ds-color-danger);
  letter-spacing: 0.05em;
}
</style>
