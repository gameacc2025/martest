<script setup>
/**
 * PermissionDenied — the user is authenticated but lacks access (403).
 *
 * Can be used full-page (as a route component) or inline within a section the
 * user can't view. Provides a "go back" action by default.
 */
import { useRouter } from 'vue-router'
import StateDisplay from './StateDisplay.vue'
import Button from 'primevue/button'

const props = defineProps({
  title: { type: String, default: 'دسترسی مجاز نیست' },
  description: {
    type: String,
    default: 'شما مجوز لازم برای مشاهده این بخش را ندارید. در صورت نیاز با مدیر سیستم تماس بگیرید.',
  },
  // Show the default "back" button.
  showBack: { type: Boolean, default: true },
  // Optional route to a safe landing page.
  homeTo: { type: [String, Object], default: null },
  size: { type: String, default: 'lg' },
})

const router = useRouter()
function goBack() {
  if (window.history.length > 1) router.back()
  else if (props.homeTo) router.push(props.homeTo)
}
</script>

<template>
  <StateDisplay
    icon="pi pi-lock"
    :title="title"
    :description="description"
    tone="warning"
    :size="size"
  >
    <slot></slot>
    <Button v-if="showBack" label="بازگشت" icon="pi pi-arrow-right" severity="secondary" outlined @click="goBack" />
    <router-link v-if="homeTo" :to="homeTo" custom v-slot="{ navigate }">
      <Button label="صفحه اصلی" icon="pi pi-home" @click="navigate" />
    </router-link>
  </StateDisplay>
</template>
