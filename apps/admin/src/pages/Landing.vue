<script setup>
// Admin app landing gate.
//
// The admin app is NOT the public marketplace. Its root "/" must decide,
// based on auth, whether to show the admin dashboard or send the user to
// login. It must never render the public PublicLayout as a landing page.
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const authStore = useAuthStore()

onMounted(async () => {
  const ok = await authStore.ensureAuthenticated('/admin-dashboard')
  if (!ok) return // ensureAuthenticated already redirected to /login

  // App selection is driven SOLELY by accessProfile.type — STAFF belongs to
  // the Admin App. Roles/permissions never decide the app (they only gate
  // features INSIDE it). If the authenticated user is not STAFF, do NOT bounce
  // to /login (it is guestOnly and would loop back here). Send them to the app
  // their access type maps to. (The router guard applies the same rule for
  // direct /admin URLs.)
  if (authStore.isStaff) {
    router.replace({ name: 'admin-dashboard' })
  } else {
    const companyUrl = import.meta.env.VITE_COMPANY_APP_URL || ''
    const websiteUrl = import.meta.env.VITE_WEBSITE_APP_URL || '/'
    const target = authStore.isCompany && companyUrl
      ? `${companyUrl}/company-dashboard`
      : websiteUrl
    await authStore.logout({ redirectTo: null })
    window.location.href = target
  }


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
