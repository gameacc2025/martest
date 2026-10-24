<template>
  <div class="auth-page">
    <!-- Back to site button -->
    <router-link :to="{ name: 'home' }" class="auth-back">
      <i class="pi pi-arrow-right"></i>
      <span>بازگشت به سایت</span>
    </router-link>

    <div class="auth-split">
      <!-- Visual / telecom side -->
      <div class="auth-visual">
        <div class="auth-visual-overlay"></div>
        <div class="auth-visual-content">
          <div class="auth-brand">
            <i class="pi pi-wifi"></i>
            <span>Telecom Market</span>
          </div>
          <i class="pi pi-server auth-visual-icon"></i>
          <h2 class="auth-visual-title">بازارگاه تجهیزات مخابراتی</h2>
          <p class="auth-visual-text">
            طیف وسیعی از تجهیزات مخابراتی و شبکه با بهترین کیفیت
            از تولیدکنندگان و تأمین‌کنندگان معتبر.
          </p>
        </div>
      </div>

      <!-- Form side -->
      <div class="auth-form-side">
        <div class="auth-form-wrap">
          <div class="auth-head">
            <h1>ورود به حساب کاربری</h1>
            <p class="auth-subtitle">به بازارگاه تجهیزات مخابراتی خوش آمدید</p>
          </div>

          <form @submit.prevent="handleSubmit" class="auth-form">
            <!-- Registration success message -->
            <div v-if="route.query.registered" class="auth-success">
              <i class="pi pi-check-circle"></i>
              <span>ثبت نام با موفقیت انجام شد. حساب کاربری شما پس از تأیید مدیر سیستم فعال خواهد شد.</span>
            </div>

            <div class="field">
              <label>شماره تلفن</label>
              <InputText
                v-model="form.phone"
                placeholder="شماره تلفن خود را وارد کنید"
                class="auth-input"
                :class="{ 'p-invalid': error && !form.phone }"
              />
            </div>

            <div class="field">
              <label>رمز عبور</label>
              <Password
                v-model="form.password"
                placeholder="رمز عبور خود را وارد کنید"
                class="auth-input"
                inputClass="w-full"
                :class="{ 'p-invalid': error && !form.password }"
                :feedback="false"
                toggleMask
              />
            </div>

            <div v-if="error" class="auth-error">
              {{ error }}
            </div>

            <Button
              type="submit"
              label="ورود"
              icon="pi pi-sign-in"
              class="auth-submit"
              :loading="loading"
              size="large"
            />
          </form>

          <div class="auth-forgot">
            <router-link :to="{ name: 'forgot-password' }" class="auth-link">
              رمز عبور را فراموش کرده ام
            </router-link>
          </div>

          <div class="auth-hint">
            حساب کاربری ندارید؟
            <router-link :to="{ name: 'register' }" class="auth-link auth-link-strong">
              ثبت نام کنید
            </router-link>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../../stores/auth'
import { isExternalUrl, readMintRequest, buildCallbackUrl, mintHandoffCode } from '@telecom/auth'
import InputText from 'primevue/inputtext'
import Password from 'primevue/password'
import Button from 'primevue/button'

const authStore = useAuthStore()
const router = useRouter()
const route = useRoute()

// The management dashboards (admin panel / company dashboard) are SEPARATE
// apps. The public website router has no routes for them, so after login we
// send those users to the external app origins instead of router.push().
const companyAppUrl = import.meta.env.VITE_COMPANY_APP_URL || ''
const adminAppUrl = import.meta.env.VITE_ADMIN_APP_URL || ''

// PKCE handoff in flight: the panel redirected here through its own
// /auth/start with `?app&state&challenge` (see beginPanelHandoff in
// @telecom/auth). We only ever mint a one-time code — never a token —
// and bounce back to the panel's /auth/callback.
const mintRequest = readMintRequest(window.location.search)

// Login/register are centralized here. `?redirect=` may now be a FULL url
// on a different app's origin (e.g. company/admin sent us here because the
// user hit their own /login). Only ever redirect to an origin we know
// about — never trust an arbitrary external URL from the query string.
const allowedRedirectOrigins = [companyAppUrl, adminAppUrl, window.location.origin]
  .filter(Boolean)
  .map((url) => { try { return new URL(url).origin } catch { return null } })
  .filter(Boolean)

function isAllowedRedirect(url) {
  if (!isExternalUrl(url)) return true // internal path — always fine
  try {
    return allowedRedirectOrigins.includes(new URL(url).origin)
  } catch {
    return false
  }
}

// Go to `target` (internal path or external app URL) after a successful
// login.
//
// External targets never carry a session themselves: the destination panel
// must start the PKCE flow itself (only that tab may generate the verifier,
// and no token may ever travel in a URL). So we send the browser to the
// panel's /auth/start with the intended path, and the round trip
// start → here → mint → callback completes the sign-in.
function goTo(target) {
  if (isExternalUrl(target)) {
    const panel = panelFor(target)
    if (panel) {
      const { pathname, search } = new URL(target)
      window.location.href =
        `${panel.url}/auth/start?redirect=${encodeURIComponent(pathname + search)}`
      return
    }
    // Origin we don't recognize — never hand a session off to it.
    router.push('/')
    return
  }
  router.push(target)
}

// Which panel app does this external URL belong to (if any)?
function panelFor(url) {
  try {
    const origin = new URL(url).origin
    if (adminAppUrl && new URL(adminAppUrl).origin === origin) return { app: 'admin', url: adminAppUrl }
    if (companyAppUrl && new URL(companyAppUrl).origin === origin) return { app: 'company', url: companyAppUrl }
  } catch { /* not a URL at all */ }
  return null
}

// Mint the one-time handoff code and leave for the panel's callback.
async function mintAndRedirect() {
  loading.value = true
  try {
    const { code } = await mintHandoffCode({
      app: mintRequest.app,
      challenge: mintRequest.challenge,
    })
    window.location.href = buildCallbackUrl(
      mintRequest.app === 'admin' ? adminAppUrl : companyAppUrl,
      { code, state: mintRequest.state }
    )
  } finally {
    loading.value = false
  }
}

// The panel's handoff lands here before the form is ever shown. A page
// load starts with an empty token memory, so try the httpOnly refresh
// cookie first — if it still works the user never has to type anything.
onMounted(async () => {
  if (!mintRequest) return
  if (!authStore.isAuthenticated) {
    try { await authStore.refresh() } catch { /* show the form instead */ }
  }
  if (authStore.isAuthenticated) {
    try {
      await mintAndRedirect()
    } catch (err) {
      error.value = err?.serverMessage || err?.message || 'خطا در انتقال نشست. لطفا دوباره تلاش کنید.'
    }
  }
})

const form = ref({
  phone: '',
  password: ''
})

const loading = ref(false)
const error = ref('')

async function handleSubmit() {
  try {
    loading.value = true
    error.value = ''

    const response = await authStore.login({
      phone: form.value.phone,
      password: form.value.password
    })

    // A panel-initiated handoff takes priority over any local redirect:
    // the panel is where the user is actually going.
    if (mintRequest) {
      try {
        await mintAndRedirect()
      } catch (err) {
        error.value = err?.serverMessage || err?.message || 'خطا در انتقال نشست. لطفا دوباره تلاش کنید.'
      }
      return
    }

    // App selection is driven SOLELY by accessProfile.type.
    //   STAFF    → admin control panel (SEPARATE app)
    //   COMPANY  → company dashboard (SEPARATE app)
    //   CUSTOMER → website home (internal route)
    // Roles/permissions never choose the app — they only gate features inside it.
    const redirect = route.query.redirect
    if (redirect && isAllowedRedirect(redirect)) {
      goTo(redirect)
    } else {
      const type = response.accessProfile?.type

      if (type === 'STAFF') {
        goTo(`${adminAppUrl}/admin-dashboard`)
      } else if (type === 'COMPANY') {
        goTo(`${companyAppUrl}/company-dashboard`)
      } else {
        router.push('/')
      }
    }


  } catch (err) {
    console.error('Login error:', err)
    // Show the server-provided message inline (invalid credentials, pending
    // account, etc.). No redirect side effects happen here.
    error.value = err.message || 'خطا در ورود. لطفا مجددا تلاش کنید.'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.auth-page {
  direction: rtl;
  position: relative;
  min-height: 100vh;
  background: var(--surface-ground);
}

.auth-back {
  position: absolute;
  top: var(--ds-space-6);
  inset-inline-end: var(--ds-space-6);
  z-index: 10;
  display: inline-flex;
  align-items: center;
  gap: var(--ds-space-2);
  padding: var(--ds-space-2) var(--ds-space-4);
  border-radius: var(--ds-radius-lg);
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(8px);
  color: var(--ds-color-text);
  font-weight: var(--ds-font-weight-bold);
  font-size: var(--ds-font-size-sm);
  text-decoration: none;
  box-shadow: var(--ds-shadow-md);
  transition: all var(--ds-transition);
}
.auth-back:hover {
  background: #ffffff;
  color: var(--ds-color-primary);
  transform: translateY(-2px);
  box-shadow: var(--ds-shadow-lg);
}

.auth-split {
  display: grid;
  grid-template-columns: 1fr 1fr;
  min-height: 100vh;
}

/* ---- Visual side ---- */
.auth-visual {
  position: relative;
  background: linear-gradient(
    135deg,
    var(--p-primary-900) 0%,
    var(--p-primary-700) 55%,
    var(--p-primary-500) 100%
  );
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.auth-visual-overlay {
  position: absolute;
  inset: -20%;
  background:
    radial-gradient(circle at 25% 25%, rgba(72, 217, 240, 0.35), transparent 55%),
    radial-gradient(circle at 75% 80%, rgba(1, 190, 194, 0.3), transparent 55%);
}

.auth-visual-content {
  position: relative;
  z-index: 1;
  text-align: center;
  color: #ffffff;
  padding: 3rem;
  max-width: 440px;
}

.auth-brand {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.4rem;
  font-weight: 800;
  margin-bottom: 3rem;
}
.auth-brand i {
  font-size: 1.7rem;
  color: var(--p-primary-300);
}

.auth-visual-icon {
  font-size: 6rem;
  color: rgba(255, 255, 255, 0.9);
  margin-bottom: 2rem;
}

.auth-visual-title {
  font-size: 2rem;
  font-weight: 800;
  margin: 0 0 1rem;
  line-height: 1.4;
}

.auth-visual-text {
  font-size: 1rem;
  line-height: 2;
  color: rgba(255, 255, 255, 0.85);
  margin: 0;
}

/* ---- Form side ---- */
.auth-form-side {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.auth-form-wrap {
  width: 100%;
  max-width: 26rem;
}

.auth-head {
  text-align: center;
  margin-bottom: var(--ds-space-8);
}

.auth-head h1 {
  font-size: var(--ds-font-size-2xl);
  font-weight: var(--ds-font-weight-bold);
  color: var(--ds-color-text);
  margin: 0 0 var(--ds-space-2) 0;
  line-height: 1.3;
}

.auth-subtitle {
  color: var(--ds-color-text-muted);
  font-size: var(--ds-font-size-md);
  margin: 0;
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-5);
}

.auth-input {
  width: 100%;
}

/* Fix Password input height to match InputText */
:deep(.auth-form .p-password) {
  width: 100%;
}

:deep(.auth-form .p-password .p-inputtext) {
  width: 100%;
}

.auth-error {
  font-size: var(--ds-font-size-sm);
  color: var(--ds-color-danger);
  text-align: center;
  padding: var(--ds-space-3);
  background: var(--ds-color-danger-soft);
  border-radius: var(--ds-radius-md);
}

.auth-success {
  display: flex;
  align-items: center;
  gap: var(--ds-space-2);
  padding: var(--ds-space-3) var(--ds-space-4);
  background: color-mix(in srgb, var(--p-green-500) 10%, transparent);
  border: 1px solid var(--p-green-500);
  border-radius: var(--ds-radius-md);
  color: var(--p-green-700);
  font-size: var(--ds-font-size-sm);
}

.auth-submit {
  width: 100%;
}

.auth-forgot {
  margin-top: 1.5rem;
  text-align: center;
}

.auth-hint {
  margin-top: 1rem;
  text-align: center;
  font-size: 0.875rem;
  color: var(--text-color-secondary);
}

.auth-link {
  font-size: 0.875rem;
  color: var(--primary-color);
}
.auth-link:hover {
  text-decoration: underline;
}
.auth-link-strong {
  font-weight: 700;
}

@media (max-width: 900px) {
  .auth-split {
    grid-template-columns: 1fr;
  }
  .auth-visual {
    display: none;
  }
  .auth-back {
    top: var(--ds-space-4);
    inset-inline-end: var(--ds-space-4);
  }
  .auth-form-side {
    padding: var(--ds-space-4);
  }
}
</style>