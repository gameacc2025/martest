<script setup>
// Company app landing gate.
//
// The company app is NOT the public marketplace. Its root "/" must decide,
// based on auth, whether to show the company dashboard or send the user to
// login. It must never render the public PublicLayout as a landing page.
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const authStore = useAuthStore()

onMounted(async () => {
  const ok = await authStore.ensureAuthenticated('/company-dashboard')
  if (!ok) return // ensureAuthenticated already redirected to /login
  router.replace({ name: 'company-dashboard' })
})
</script>

<template>
  <div class="landing-gate">
    <i class="pi pi-spin pi-spinner"></i>
    <span>در حال بارگذاری...</span>
  </div>
</template>

<style scoped>
.landing-gate {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  color: var(--text-color-secondary);
}
.landing-gate i {
  font-size: 2rem;
}
</style>
