<template>
  <div class="auth-page">
    <!-- Back to the public marketplace website (SEPARATE app) -->
    <a :href="websiteUrl" class="auth-back">
      <i class="pi pi-arrow-right"></i>
      <span>بازگشت به سایت</span>
    </a>

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
              <label>ایمیل</label>
              <InputText
                v-model="form.email"
                type="email"
                placeholder="example@email.com"
                class="auth-input"
                :class="{ 'p-invalid': error && !form.email }"
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
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../../stores/auth'
import InputText from 'primevue/inputtext'
import Password from 'primevue/password'
import Button from 'primevue/button'

const authStore = useAuthStore()
const router = useRouter()
const route = useRoute()

// Back-link + cross-app redirect targets (separate apps).
const websiteUrl = import.meta.env.VITE_WEBSITE_APP_URL || '/'
const adminUrl = import.meta.env.VITE_ADMIN_APP_URL || ''

const form = ref({
  email: '',
  password: ''
})

const loading = ref(false)
const error = ref('')

async function handleSubmit() {
  try {
    loading.value = true
    error.value = ''

    const response = await authStore.login({
      email: form.value.email,
      password: form.value.password,
      app: 'company'
    })

    // App selection is driven SOLELY by accessProfile.type (this is the COMPANY app).
    //   STAFF    → external admin control panel
    //   CUSTOMER → external public website
    //   COMPANY  → internal /company-dashboard
    // Roles/permissions never choose the app — they only gate features inside it.
    const redirect = route.query.redirect
    if (redirect) {
      router.push(redirect)
    } else {
      const type = response.accessProfile?.type

      if (type === 'STAFF' && adminUrl) {
        window.location.href = `${adminUrl}/admin`
      } else if (type === 'CUSTOMER') {
        window.location.href = websiteUrl
      } else {
        router.push('/company-dashboard')
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
  top: 1.5rem;
  inset-inline-end: 1.5rem;
  z-index: 10;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 1.2rem;
  border-radius: 0.75rem;
  background: rgba(255, 255, 255, 0.9);
  color: var(--p-primary-900);
  font-weight: 700;
  font-size: 0.9rem;
  text-decoration: none;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transition: all 0.2s ease;
}
.auth-back:hover {
  background: #ffffff;
  color: var(--primary-color);
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
  max-width: 24rem;
}

.auth-head {
  text-align: center;
  margin-bottom: 2rem;
}

.auth-head h1 {
  font-size: 1.75rem;
  font-weight: 800;
  color: var(--text-color);
  margin: 0;
}

.auth-subtitle {
  color: var(--text-color-secondary);
  margin-top: 0.5rem;
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
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
  font-size: 0.875rem;
  color: var(--p-red-500);
  text-align: center;
}

.auth-success {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: color-mix(in srgb, var(--p-green-500) 10%, transparent);
  border: 1px solid var(--p-green-500);
  border-radius: var(--content-border-radius);
  color: var(--p-green-700);
  font-size: 0.875rem;
  text-align: center;
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
}
</style>
