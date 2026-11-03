<template>
  <div class="forgot-password-page">
    <div class="fp-container">
      <div class="fp-inner">
        <Card>
          <template #title>
            <div class="fp-title">
              <i class="pi pi-lock"></i>
              <h1>فراموشی رمز عبور</h1>
            </div>
          </template>
          <template #content>
            <div v-if="!emailSent">
              <p class="fp-desc fp-text-center">
                ایمیل خود را وارد کنید تا لینک بازنشانی رمز عبور برای شما ارسال شود
              </p>

              <form @submit.prevent="handleSubmit" class="fp-form">
                <div class="field">
                  <label for="forgot-password-email">آدرس ایمیل</label>
                  <InputText
                    id="forgot-password-email"
                    v-model="email"
                    placeholder="آدرس ایمیل خود را وارد کنید"
                    type="email"
                    required
                    autocomplete="email"
                    :aria-invalid="errors.email ? 'true' : undefined"
                    :aria-describedby="errors.email ? 'forgot-password-email-error' : undefined"
                    :aria-invalid="errors.email ? 'true' : undefined"
                    :aria-describedby="errors.email ? 'forgot-password-email-error' : undefined"
                    class="fp-input"
                    :class="{ 'p-invalid': errors.email }"
                  />
                  <small v-if="errors.email" id="forgot-password-email-error" class="p-error block" role="alert">{{ errors.email }}</small>
                </div>

                <Button
                  type="submit"
                  label="ارسال لینک بازنشانی"
                  icon="pi pi-send"
                  class="fp-input p-button-primary"
                  :loading="loading"
                />
              </form>

              <div class="fp-back-link">
                <Button
                  label="بازگشت به صفحه ورود"
                  icon="pi pi-arrow-right"
                  class="p-button-text p-button-link"
                  @click="goToLogin"
                />
              </div>
            </div>

            <div v-else class="fp-text-center" role="status">
              <i class="pi pi-envelope fp-success-icon"></i>
              <h2 class="fp-success-title">لینک بازنشانی ارسال شد!</h2>
              <p class="fp-desc">
                لینک بازنشانی رمز عبور به آدرس ایمیل {{ email }} ارسال شد.
                لطفاً ایمیل خود را بررسی کنید.
              </p>

              <div class="fp-action-list">
                <Button
                  label="بررسی ایمیل"
                  icon="pi pi-external-link"
                  class="fp-input p-button-primary"
                  @click="checkEmail"
                />
                <Button
                  label="ارسال مجدد لینک"
                  icon="pi pi-refresh"
                  class="fp-input p-button-outlined"
                  @click="resendLink"
                />
                <Button
                  label="بازگشت به صفحه ورود"
                  icon="pi pi-arrow-right"
                  class="fp-input p-button-text"
                  @click="goToLogin"
                />
              </div>
            </div>
          </template>
        </Card>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth'
import Card from 'primevue/card'
import InputText from 'primevue/inputtext'
import Button from 'primevue/button'

const router = useRouter()
const authStore = useAuthStore()

const email = ref('')
const emailSent = ref(false)
const loading = ref(false)
const errors = ref({})

const handleSubmit = async () => {
  errors.value = {}
  loading.value = true

  try {
    if (!validateForm()) {
      loading.value = false
      return
    }

    await authStore.forgotPassword(email.value)
    emailSent.value = true
  } catch (error) {
    console.error('Forgot password error:', error)
    errors.value = {
      email: error.message || 'خطا در ارسال لینک بازنشانی. لطفاً مجدداً تلاش کنید.'
    }
  } finally {
    loading.value = false
  }
}

const validateForm = () => {
  errors.value = {}

  if (!email.value) {
    errors.value.email = 'وارد کردن ایمیل الزامی است'
    return false
  }

  if (!isValidEmail(email.value)) {
    errors.value.email = 'ایمیل وارد شده معتبر نیست'
    return false
  }

  return true
}

const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

const checkEmail = () => {
  // Open user's email client
  window.location.href = `mailto:${email.value}`
}

const resendLink = () => {
  emailSent.value = false
}

const goToLogin = () => {
  router.push({ name: 'login' })
}
</script>

<style scoped>
.forgot-password-page {
  direction: rtl;
}

.fp-container {
  max-width: var(--ds-container-max);
  margin: 0 auto;
  padding-inline: var(--ds-container-pad);
  padding-block: var(--ds-space-6);
}

@media (min-width: 768px) {
  .fp-container {
    padding-inline: var(--ds-container-pad-lg);
    padding-block: var(--ds-space-8);
  }
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
.forgot-password-page :deep(.p-button) { min-height: 2.75rem; }
.forgot-password-page :deep(.p-button:focus-visible),
.forgot-password-page :deep(.p-inputtext:focus-visible),
.forgot-password-page a:focus-visible {
  outline: 2px solid var(--ds-color-focus);
  outline-offset: 2px;
}

</style>