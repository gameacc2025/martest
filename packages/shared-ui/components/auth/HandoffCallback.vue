<template>
  <div class="handoff-page">
    <template v-if="failed">
      <i class="pi pi-exclamation-triangle handoff-icon handoff-icon--error"></i>
      <p class="handoff-text">انتقال نشست نامعتبر یا منقضی شده است.</p>
      <button class="handoff-button" type="button" @click="restart">تلاش دوباره</button>
    </template>
    <template v-else>
      <i class="pi pi-spin pi-spinner handoff-icon"></i>
      <p class="handoff-text">در حال ورود به پنل…</p>
    </template>
  </div>
</template>

<script setup>
// =============================================================
// Website → Panel handoff (PKCE step 3): /auth/callback#code=…&state=…
//
// Redeems the one-time code together with the verifier this tab created
// in step 1 (/auth/start), applies the returned auth context through the
// canonical store path, and lands on the page the user originally asked
// for — all without a full page reload (the access token is memory-only,
// so a reload here would throw it away).
// =============================================================
import { ref, onMounted } from 'vue'
import {
  createAuthStore,
  getAuthRouter,
  parseCallbackHash,
  readPendingHandoff,
  clearPendingHandoff,
  redeemHandoffCode,
} from '@telecom/auth'

// Same store id ('auth') as the app's own stores/auth.js — Pinia resolves
// by id, so both definitions share one instance.
const useAuthStore = createAuthStore()

const props = defineProps({
  app: { type: String, required: true, validator: (v) => ['admin', 'company'].includes(v) },
  defaultRedirect: { type: String, required: true },
})

const failed = ref(false)
const websiteAppUrl = import.meta.env.VITE_WEBSITE_APP_URL || '/'

function stripFragment() {
  window.history.replaceState(null, '', window.location.pathname + window.location.search)
}

function restart() {
  clearPendingHandoff(props.app)
  // Start over from the centralized login (a FRESH handoff, with no stale
  // ?redirect=/auth/callback — that would only loop back here to fail again).
  window.location.replace(`${websiteAppUrl}/login`)
}

onMounted(async () => {
  const params = parseCallbackHash(window.location.hash)
  const pending = readPendingHandoff(props.app)
  // The one-time code must never linger in history/referrer.
  stripFragment()

  if (!params || !pending || params.state !== pending.state) {
    failed.value = true
    clearPendingHandoff(props.app)
    return
  }

  try {
    const context = await redeemHandoffCode({
      app: props.app,
      code: params.code,
      verifier: pending.verifier,
    })
    clearPendingHandoff(props.app)

    const store = useAuthStore()
    store.setAuthContext(context)

    const target = pending.redirect || props.defaultRedirect
    const router = getAuthRouter()
    // In-app navigation only: a real reload would wipe the memory token.
    if (router) router.replace(target)
    else window.location.replace(target)
  } catch {
    clearPendingHandoff(props.app)
    failed.value = true
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
  text-align: center;
  padding: 1.5rem;
}
.handoff-icon {
  font-size: 2.5rem;
  color: var(--primary-color, #2563eb);
}
.handoff-icon--error {
  color: var(--p-red-500, #ef4444);
}
.handoff-text {
  color: var(--text-color-secondary, #64748b);
  font-size: 1rem;
}
.handoff-button {
  border: none;
  border-radius: 0.5rem;
  padding: 0.6rem 1.5rem;
  background: var(--primary-color, #2563eb);
  color: #fff;
  font: inherit;
  cursor: pointer;
}
</style>
