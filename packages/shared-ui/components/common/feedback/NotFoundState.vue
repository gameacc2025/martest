<script setup>
/**
 * NotFoundState — 404 screen for missing pages/resources.
 *
 * Designed to be used as a full-page route component or inline. Shows a large
 * "404" glyph plus a friendly message and a way back home.
 */
import { useRouter } from 'vue-router'
import StateDisplay from './StateDisplay.vue'
import Button from 'primevue/button'

const props = defineProps({
  title: { type: String, default: 'صفحه یافت نشد' },
  description: {
    type: String,
    default: 'صفحه‌ای که دنبال آن هستید وجود ندارد یا جابه‌جا شده است.',
  },
  homeTo: { type: [String, Object], default: '/' },
})

const router = useRouter()
function goBack() {
  if (window.history.length > 1) router.back()
  else router.push(props.homeTo)
}
</script>

<template>
  <StateDisplay :title="title" :description="description" tone="primary" size="lg">
    <template #icon>
      <span class="nf-code">۴۰۴</span>
    </template>
    <Button label="بازگشت" icon="pi pi-arrow-right" severity="secondary" outlined @click="goBack" />
    <router-link :to="homeTo" custom v-slot="{ navigate }">
      <Button label="صفحه اصلی" icon="pi pi-home" @click="navigate" />
    </router-link>
  </StateDisplay>
</template>

<style scoped>
.nf-code {
  font-size: 2rem;
  font-weight: var(--ds-font-weight-bold);
  color: var(--ds-color-primary);
  letter-spacing: 0.05em;
}
</style>
