<template>
  <div class="auth-page">
    <!-- Back to site button -->
    <router-link :to="{ name: 'home' }" class="auth-back">
      <i class="pi pi-arrow-right" aria-hidden="true"></i>
      <span>بازگشت به سایت</span>
    </router-link>

    <div class="auth-split">
      <!-- Visual / telecom side -->
      <div class="auth-visual">
        <div class="auth-visual-content">
          <div class="auth-brand">
            <BrandMark :size="36" aria-hidden="true" />
            <span>Telecom Market</span>
          </div>
          <h2 class="auth-visual-title">بازارگاه تجهیزات مخابراتی</h2>
          <p class="auth-visual-text">
            کاتالوگ تخصصی تجهیزات مخابراتی و شبکه را بررسی کنید و محصولات موردنیاز خود را بیابید.
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
            <div v-if="route.query.registered" class="auth-success" role="status">
              <i class="pi pi-check-circle" aria-hidden="true"></i>
              <span>ثبت نام با موفقیت انجام شد. حساب کاربری شما پس از تأیید مدیر سیستم فعال خواهد شد.</span>
            </div>

            <div class="field">
              <label for="login-phone">شماره تلفن</label>
              <InputText
                id="login-phone"
                v-model="form.phone"
                name="phone"
                type="tel"
                inputmode="tel"
                autocomplete="username"
                required
                placeholder="شماره تلفن خود را وارد کنید"
                class="auth-input"
                :class="{ 'p-invalid': error && !form.phone }"
              />
            </div>

            <div class="field">
              <label for="login-password">رمز عبور</label>
              <Password
                inputId="login-password"
                v-model="form.password"
                name="password"
                autocomplete="current-password"
                required
                placeholder="رمز عبور خود را وارد کنید"
                class="auth-input"
                inputClass="w-full"
                :class="{ 'p-invalid': error && !form.password }"
                :feedback="false"
                toggleMask
              />
            </div>

            <div v-if="error" class="auth-error" role="alert">
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
import BrandMark from '@telecom/shared-ui/components/common/BrandMark.vue'

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
  background: var(--ds-color-surface);
  border: 1px solid var(--ds-color-border);
  color: var(--ds-color-text);
  font-weight: var(--ds-font-weight-bold);
  font-size: var(--ds-font-size-sm);
  text-decoration: none;
  box-shadow: none;
  transition: background-color var(--ds-transition-fast), color var(--ds-transition-fast), border-color var(--ds-transition-fast);
}
.auth-back:hover {
  background: var(--ds-color-surface-hover);
  color: var(--ds-color-primary-text);
}

.auth-split {
  display: grid;
  grid-template-columns: 1fr 1fr;
  min-height: 100vh;
}

/* ---- Visual side ---- */
.auth-visual {
  position: relative;
  background: var(--ds-color-brand-deep);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.auth-visual-content {
  position: relative;
  z-index: 1;
  text-align: start;
  color: var(--ds-color-on-brand);
  padding: clamp(2rem, 5vw, 4rem);
  max-width: 34rem;
}

.auth-brand {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.4rem;
  font-weight: 800;
  margin-bottom: 3rem;
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
  color: color-mix(in srgb, var(--ds-color-on-brand) 82%, transparent);
  margin: 0;
}

/* ---- Form side ---- */
.auth-form-side {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  background: var(--ds-color-background);
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

.auth-page { background: var(--ds-color-background); color: var(--ds-color-text); }
.auth-back {
  border: 1px solid var(--ds-color-border);
  background: var(--ds-color-surface);
  color: var(--ds-color-text);
  box-shadow: var(--ds-shadow-xs);
}
.auth-back:hover { color: var(--ds-color-primary); border-color: var(--ds-color-primary); }
.auth-form,
.auth-card,
.auth-panel {
  border-color: var(--ds-color-border);
  border-radius: var(--ds-radius-xl);
  box-shadow: var(--ds-shadow-lg);
}
.auth-page :deep(.p-inputtext),
.auth-page :deep(.p-password),
.auth-page :deep(.p-select) { border-radius: var(--ds-radius-md); }
.auth-page :deep(.p-button) { border-radius: var(--ds-radius-md); }
@media (max-width: 640px) {
  .auth-back { top: var(--ds-space-3); inset-inline-end: var(--ds-space-3); }
}


/* Authentication workspace: calm form surface with clear focus and identity. */
.auth-page { background: var(--ds-color-background); }
.auth-split { min-height: 100svh; }
.auth-visual {
  background: var(--ds-hero-gradient);
  isolation: isolate;
}
.auth-visual::before,
.auth-visual::after {
  position: absolute;
  z-index: 0;
  width: min(34rem, 70vw);
  aspect-ratio: 1;
  border: 1px solid rgba(255,255,255,.12);
  border-radius: 50%;
  content: "";
  pointer-events: none;
}
.auth-visual::before { inset-inline-start: -12rem; top: -10rem; }
.auth-visual::after { inset-inline-end: -15rem; bottom: -17rem; width: 42rem; }
.auth-visual-content { max-width: 34rem; }
.auth-brand {
  padding: .55rem .9rem;
  border: 1px solid rgba(255,255,255,.18);
  border-radius: var(--ds-radius-pill);
  background: rgba(255,255,255,.08);
  backdrop-filter: blur(10px);
}
.auth-visual-icon {
  display: block;
  filter: drop-shadow(0 1.25rem 1.5rem rgba(0,0,0,.2));
}
.auth-form-side { background: var(--ds-color-background); }
.auth-form-wrap {
  padding: clamp(1.25rem, 3vw, 2.25rem);
  border: 1px solid var(--ds-color-border);
  border-radius: var(--ds-radius-xl);
  background: var(--ds-color-surface);
  box-shadow: var(--ds-shadow-lg);
}
.auth-head { margin-bottom: var(--ds-space-6); }
.auth-head h1 { color: var(--ds-color-text); }
.auth-subtitle { color: var(--ds-color-text-muted); line-height: 1.8; }
.auth-form .field { display: flex; flex-direction: column; gap: .45rem; }
.auth-form .field label { color: var(--ds-color-text); font-size: var(--ds-font-size-sm); font-weight: var(--ds-font-weight-semibold); }
.auth-page :deep(.p-inputtext),
.auth-page :deep(.p-password-input),
.auth-page :deep(.p-select),
.auth-page :deep(.p-textarea) {
  width: 100%;
  min-height: 2.8rem;
  border-color: var(--ds-color-border);
  border-radius: var(--ds-radius-md);
}
.auth-page :deep(.p-inputtext:focus),
.auth-page :deep(.p-password-input:focus) {
  border-color: var(--ds-color-primary);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--ds-color-primary) 14%, transparent);
}
.auth-submit { min-height: 2.9rem; border-radius: var(--ds-radius-md); }
.auth-page .auth-back { min-height: 2.75rem; }
.auth-page :deep(.p-button:focus-visible),
.auth-page :deep(.p-inputtext:focus-visible),
.auth-page :deep(.p-password-input:focus-visible),
.auth-page a:focus-visible {
  outline: 2px solid var(--ds-color-focus);
  outline-offset: 2px;
}
.auth-success { border-color: color-mix(in srgb, var(--ds-color-success) 30%, transparent); background: var(--ds-color-success-soft); color: var(--ds-color-success); }
.reg-type-row { gap: .75rem; }
.user-type-selector {
  display: grid;
  grid-template-columns: auto minmax(0,1fr) auto;
  align-items: center;
  gap: .65rem;
  min-height: 4.25rem;
  padding: .8rem;
  border: 1px solid var(--ds-color-border);
  border-radius: var(--ds-radius-lg);
  background: var(--ds-color-surface);
  text-align: start;
  transition: border-color var(--ds-transition), background var(--ds-transition), box-shadow var(--ds-transition);
}
.user-type-selector:hover { border-color: var(--ds-color-primary); background: var(--ds-color-surface-hover); }
.user-type-selector:focus-visible { outline: 3px solid var(--ds-color-focus); outline-offset: 2px; }
.user-type-selector.is-active {
  border-color: var(--ds-color-primary);
  background: var(--ds-color-primary-soft);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--ds-color-primary) 12%, transparent);
}
.reg-type-icon { margin: 0; font-size: 1.15rem; }
.reg-type-radio { margin: 0; }
.reg-section-title {
  border: 1px solid var(--ds-color-border);
  border-radius: var(--ds-radius-md);
  background: var(--ds-color-surface-alt);
  color: var(--ds-color-primary);
}
@media (max-width: 900px) {
  .auth-form-side { min-height: 100svh; padding: 5rem 1rem 1.5rem; }
  .auth-form-wrap { max-width: 34rem; }
}
@media (max-width: 480px) {
  .auth-form-wrap { padding: 1.1rem; }
  .reg-type-row { grid-template-columns: 1fr; }
}

</style>