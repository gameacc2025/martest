<template>
  <main class="forgot-password-page" aria-labelledby="forgot-password-title" :aria-busy="loading">
    <div class="fp-container">
      <div class="fp-inner">
        <Card>
          <template #title>
            <div class="fp-title">
              <h1 id="forgot-password-title">بازیابی رمز عبور</h1>
            </div>
          </template>
          <template #content>
            <div v-if="completed" class="fp-text-center" role="status">
              <i class="pi pi-check-circle fp-success-icon" aria-hidden="true"></i>
              <h2 class="fp-success-title">رمز عبور تغییر کرد</h2>
              <p class="fp-desc">برای ورود با رمز جدید، به صفحه ورود بروید.</p>
              <router-link :to="{ name: 'login' }" class="fp-input fp-back-link__anchor">بازگشت به صفحه ورود</router-link>
            </div>

            <form v-else-if="step === 'request'" @submit.prevent="handleRequest" class="fp-form">
              <p class="fp-desc">شماره موبایلی را وارد کنید که با آن در بازارگاه ثبت‌نام کرده‌اید. در صورت وجود حساب فعال، کد یک‌بارمصرف برای همان شماره ارسال می‌شود.</p>
              <div class="field">
                <label for="forgot-password-phone">شماره موبایل</label>
                <InputText
                  id="forgot-password-phone"
                  v-model="phone"
                  type="tel"
                  inputmode="tel"
                  autocomplete="tel"
                  placeholder="مثلاً 09123456789"
                  required
                  maxlength="20"
                  class="fp-input"
                  :class="{ 'p-invalid': errors.phone }"
                  :aria-invalid="errors.phone ? 'true' : undefined"
                  aria-describedby="forgot-password-phone-help"
                />
                <small id="forgot-password-phone-help" class="fp-desc">کد بازنشانی فقط از طریق پیامک ارسال می‌شود.</small>
                <small v-if="errors.phone" class="p-error" role="alert">{{ errors.phone }}</small>
              </div>
              <small v-if="errors.request" class="p-error" role="alert">{{ errors.request }}</small>
              <Button type="submit" label="ارسال کد بازنشانی" icon="pi pi-send" class="fp-input p-button-primary" :loading="loading" />
            </form>

            <form v-else @submit.prevent="handleReset" class="fp-form">
              <p class="fp-desc">کد پیامک‌شده به {{ phone }} و رمز عبور جدید را وارد کنید. کد پس از استفاده باطل می‌شود و نشست‌های قبلی شما بسته خواهند شد.</p>
              <div class="field">
                <label for="forgot-password-code">کد یک‌بارمصرف</label>
                <InputText id="forgot-password-code" v-model="code" class="fp-input" inputmode="numeric" autocomplete="one-time-code" maxlength="6" pattern="[0-9]{6}" placeholder="کد ۶ رقمی" required />
              </div>
              <div class="field">
                <label for="forgot-password-new">رمز عبور جدید</label>
                <InputText id="forgot-password-new" v-model="newPassword" class="fp-input" type="password" autocomplete="new-password" minlength="8" maxlength="128" required />
              </div>
              <div class="field">
                <label for="forgot-password-confirm">تکرار رمز عبور جدید</label>
                <InputText id="forgot-password-confirm" v-model="confirmPassword" class="fp-input" type="password" autocomplete="new-password" minlength="8" maxlength="128" required />
              </div>
              <small v-if="errors.reset" class="p-error" role="alert">{{ errors.reset }}</small>
              <Button type="submit" label="تغییر رمز عبور" icon="pi pi-lock" class="fp-input p-button-primary" :loading="loading" />
              <Button type="button" label="ارسال دوباره کد / تغییر شماره" icon="pi pi-refresh" class="fp-input p-button-text" :disabled="loading" @click="backToRequest" />
            </form>

            <div class="fp-back-link">
              <router-link :to="{ name: 'login' }" class="fp-back-link__anchor">بازگشت به صفحه ورود</router-link>
            </div>
          </template>
        </Card>
      </div>
    </div>
  </main>
</template>

<script setup>
import { ref } from 'vue'
import { useAuthStore } from '../../stores/auth'
import Card from 'primevue/card'
import InputText from 'primevue/inputtext'
import Button from 'primevue/button'

const authStore = useAuthStore()
const phone = ref('')
const code = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const step = ref('request')
const completed = ref(false)
const loading = ref(false)
const errors = ref({})

const handleRequest = async () => {
  errors.value = {}
  const normalized = phone.value.trim()
  if (!/^[+]?[\d\s()-]{7,20}$/.test(normalized)) {
    errors.value.phone = 'شماره موبایل معتبر وارد کنید.'
    return
  }

  loading.value = true
  try {
    await authStore.forgotPassword(normalized)
    phone.value = normalized
    step.value = 'reset'
  } catch (error) {
    errors.value.request = error?.message || 'ارسال کد ممکن نشد. لطفاً بعداً تلاش کنید.'
  } finally {
    loading.value = false
  }
}

const handleReset = async () => {
  errors.value = {}
  if (!/^\d{6}$/.test(code.value.trim())) {
    errors.value.reset = 'کد باید دقیقاً ۶ رقم باشد.'
    return
  }
  if (newPassword.value.length < 8 || newPassword.value.length > 128) {
    errors.value.reset = 'رمز عبور باید بین ۸ تا ۱۲۸ نویسه باشد.'
    return
  }
  if (newPassword.value !== confirmPassword.value) {
    errors.value.reset = 'تکرار رمز عبور با رمز جدید یکسان نیست.'
    return
  }

  loading.value = true
  try {
    await authStore.resetPassword({
      phone: phone.value,
      code: code.value.trim(),
      newPassword: newPassword.value,
    })
    completed.value = true
    code.value = ''
    newPassword.value = ''
    confirmPassword.value = ''
  } catch (error) {
    errors.value.reset = error?.message || 'کد معتبر نیست یا منقضی شده است.'
  } finally {
    loading.value = false
  }
}

const backToRequest = () => {
  code.value = ''
  newPassword.value = ''
  confirmPassword.value = ''
  step.value = 'request'
}
</script>

<style scoped>
.forgot-password-page {
  direction: rtl;
}

.fp-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem 1rem;
}

.fp-inner {
  max-width: 28rem;
  margin: 0 auto;
}

.fp-title {
  text-align: center;
}

.fp-title i {
  font-size: 1.875rem;
  color: var(--primary-color);
  margin-bottom: 0.5rem;
}

.fp-title h1 {
  font-size: 1.25rem;
  font-weight: 700;
  margin: 0;
}

.fp-text-center {
  text-align: center;
}

.fp-desc {
  color: var(--text-color-secondary);
  margin-bottom: 1.5rem;
}

.fp-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.fp-input {
  width: 100%;
}

.fp-back-link {
  margin-top: 1rem;
  text-align: center;
}

.fp-success-icon {
  font-size: 2.5rem;
  color: var(--p-green-500);
  margin-bottom: 1rem;
}

.fp-success-title {
  font-size: 1.25rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
}

.fp-action-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.forgot-password-page { min-height: 70vh; background: var(--ds-color-background); }
.forgot-password-page :deep(.p-card) {
  border: 1px solid var(--ds-color-border);
  border-radius: var(--ds-radius-xl);
  box-shadow: var(--ds-shadow-lg);
}
.forgot-password-page .fp-title i { color: var(--ds-color-primary); }
.forgot-password-page .fp-title h1 { color: var(--ds-color-text); }
.forgot-password-page .fp-desc { color: var(--ds-color-text-muted); line-height: var(--ds-line-height-relaxed); }
.forgot-password-page :deep(.p-inputtext) { border-radius: var(--ds-radius-md); }

</style>