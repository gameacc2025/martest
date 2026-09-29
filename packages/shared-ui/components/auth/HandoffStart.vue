<template>
  <div class="handoff-page">
    <i class="pi pi-spin pi-spinner handoff-icon"></i>
    <p class="handoff-text">در حال انتقال به وب‌سایت…</p>
  </div>
</template>

<script setup>
// =============================================================
// Panel → Website handoff (PKCE step 1).
//
// Route: /auth/start?redirect=/some/internal/path
//
// Generates the PKCE verifier (kept in THIS tab's sessionStorage), sends
// only the challenge + state to the centralized website login, and leaves.
// No token is ever put in a URL — the code that comes back in step 3 is
// useless without the verifier parked here.
// =============================================================
import { onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { createAuthStore, getAuthRouter, beginPanelHandoff } from '@telecom/auth'

// Same store id ('auth') as the app's own stores/auth.js — Pinia resolves
// by id, so both definitions share one instance.
const useAuthStore = createAuthStore()

const props = defineProps({
  app: { type: String, required: true, validator: (v) => ['admin', 'company'].includes(v) },
})

const route = useRoute()
const websiteAppUrl = import.meta.env.VITE_WEBSITE_APP_URL || '/'

onMounted(async () => {
  const raw = typeof route.query.redirect === 'string' ? route.query.redirect : null
  // Only internal paths may be used as a post-redeem landing spot.
  const redirect = raw && raw.startsWith('/') && !raw.startsWith('//') ? raw : null

  // Already signed in for THIS app (boot restore / a previous handoff):
  // skip the round trip entirely and just continue.
  const store = useAuthStore()
  const belongsHere = props.app === 'admin' ? store.isStaff : store.isCompany
  if (store.isAuthenticated && belongsHere) {
    const router = getAuthRouter()
    if (router) {
      router.replace(redirect || '/')
      return
    }
  }

  try {
    window.location.href = await beginPanelHandoff({
      app: props.app,
      websiteUrl: websiteAppUrl,
      redirect,
    })
  } catch {
    // Nothing sensible to do without crypto/storage — fall back to a plain
    // login (which will just come back here and likely fail the same way,
    // but never strands the user on a dead spinner).
    window.location.href = `${websiteAppUrl}/login`
  }
})
</script>

<style scoped>
.handoff-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  background: var(--surface-ground, #f8fafc);
}
.handoff-icon {
  font-size: 2.5rem;
  color: var(--primary-color, #2563eb);
}
.handoff-text {
  color: var(--text-color-secondary, #64748b);
  font-size: 1rem;
}
</style>
