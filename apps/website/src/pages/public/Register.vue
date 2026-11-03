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
          <h2 class="auth-visual-title">به بازارگاه ما بپیوندید</h2>
          <p class="auth-visual-text">
            با ثبت‌نام در بازارگاه، محصولات را جستجو کنید، استعلام ثبت کنید و درخواست‌های تأمین خود را پیگیری کنید.
          </p>
        </div>
      </div>

      <!-- Form side -->
      <div class="auth-form-side">
        <div class="auth-form-wrap">
          <div class="auth-head">
            <h1>ثبت نام در بازارگاه مخابرات</h1>
            <p class="auth-subtitle">حساب کاربری خود را ایجاد کنید</p>
          </div>

          <form @submit.prevent="handleSubmit" class="auth-form">
            <!-- User Type Selection -->
            <div class="reg-type-row" role="radiogroup" aria-label="نوع حساب کاربری">
              <div
                class="user-type-selector"
                :class="{ 'is-active': userType === 'customer' }"
                role="radio"
                :aria-checked="userType === 'customer'"
                tabindex="0"
                @click="userType = 'customer'"
                @keydown.enter.space.prevent="userType = 'customer'"
                @keydown.right.prevent="userType = 'company'"
                @keydown.left.prevent="userType = 'customer'"
              >
                <i class="pi pi-user reg-type-icon"></i>
                <span>کاربر عادی</span>
                <input v-model="userType" type="radio" value="customer" class="reg-type-radio" aria-hidden="true" tabindex="-1" />
              </div>
              <div
                class="user-type-selector"
                :class="{ 'is-active': userType === 'company' }"
                role="radio"
                :aria-checked="userType === 'company'"
                tabindex="0"
                @click="userType = 'company'"
                @keydown.enter.space.prevent="userType = 'company'"
                @keydown.right.prevent="userType = 'customer'"
                @keydown.left.prevent="userType = 'company'"
              >
                <i class="pi pi-building reg-type-icon"></i>
                <span>شرکت</span>
                <input v-model="userType" type="radio" value="company" class="reg-type-radio" aria-hidden="true" tabindex="-1" />
              </div>
            </div>

            <!-- Personal Information -->
            <div v-if="userType === 'customer'">
              <div class="reg-grid-2">
                <div class="field">
                  <label for="register-first-name">نام</label>
                  <InputText
                    id="register-first-name"
                  autocomplete="given-name"
                    v-model="form.firstName"
                    placeholder="نام خود را وارد کنید"
                    class="auth-input"
                    :class="{ 'p-invalid': errors.firstName }"
                  />
                  <small v-if="errors.firstName" class="p-error block">{{ errors.firstName }}</small>
                </div>
                <div class="field">
                  <label for="register-last-name">نام خانوادگی</label>
                  <InputText
                    id="register-last-name"
                  autocomplete="family-name"
                    v-model="form.lastName"
                    placeholder="نام خانوادگی خود را وارد کنید"
                    class="auth-input"
                    :class="{ 'p-invalid': errors.lastName }"
                  />
                  <small v-if="errors.lastName" class="p-error block">{{ errors.lastName }}</small>
                </div>
              </div>

              <div class="reg-grid-2">
                <div class="field">
                  <label for="register-email">ایمیل <span class="reg-optional">(اختیاری)</span></label>
                  <InputText
                    id="register-email"
                  autocomplete="email"
                    v-model="form.email"
                    placeholder="آدرس ایمیل خود را وارد کنید"
                    type="email"
                    class="auth-input"
                    :class="{ 'p-invalid': errors.email }"
                  />
                  <small v-if="errors.email" class="p-error block">{{ errors.email }}</small>
                </div>
                <div class="field">
                  <label for="register-phone">شماره تلفن <span class="reg-required">*</span></label>
                  <InputText
                    id="register-phone"
                  autocomplete="tel"
                    v-model="form.phone"
                    placeholder="شماره تلفن خود را وارد کنید"
                    class="auth-input"
                    :class="{ 'p-invalid': errors.phone }"
                  />
                  <small v-if="errors.phone" class="p-error block">{{ errors.phone }}</small>
                </div>
              </div>

              <div class="field">
                <label for="register-password">رمز عبور</label>
                <Password
                  inputId="register-password"
                  autocomplete="new-password"
                  v-model="form.password"
                  placeholder="رمز عبور خود را وارد کنید"
                  class="auth-input"
                  :class="{ 'p-invalid': errors.password }"
                  :feedback="false"
                  toggleMask
                />
                <small v-if="errors.password" class="p-error block">{{ errors.password }}</small>
              </div>

              <div class="field">
                <label for="register-confirm-password">تکرار رمز عبور</label>
                <Password
                  inputId="register-confirm-password"
                  autocomplete="new-password"
                  v-model="form.confirmPassword"
                  placeholder="رمز عبور را مجدداً وارد کنید"
                  class="auth-input"
                  :class="{ 'p-invalid': errors.confirmPassword }"
                  :feedback="false"
                  toggleMask
                />
                <small v-if="errors.confirmPassword" class="p-error block">{{ errors.confirmPassword }}</small>
              </div>
            </div>

            <!-- Company Information -->
            <div v-if="userType === 'company'">
              <div class="field">
                <label for="register-company-name">نام شرکت</label>
                <InputText
                  id="register-company-name"
                  autocomplete="organization"
                  v-model="form.companyName"
                  placeholder="نام شرکت خود را وارد کنید"
                  class="auth-input"
                  :class="{ 'p-invalid': errors.companyName }"
                />
                <small v-if="errors.companyName" class="p-error block">{{ errors.companyName }}</small>
              </div>

              <div class="reg-grid-2">
                <div class="field">
                  <label for="register-company-name-en">نام انگلیسی شرکت</label>
                  <InputText
                    id="register-company-name-en"
                  autocomplete="organization"
                    v-model="form.companyNameEn"
                    placeholder="نام انگلیسی شرکت"
                    class="auth-input"
                  />
                </div>
                <div class="field">
                  <label for="register-national-id">شناسه ملی شرکت</label>
                  <InputText
                    id="register-national-id"
                    v-model="form.nationalId"
                    placeholder="شناسه ملی شرکت"
                    class="auth-input"
                    :class="{ 'p-invalid': errors.nationalId }"
                  />
                  <small v-if="errors.nationalId" class="p-error block">{{ errors.nationalId }}</small>
                </div>
              </div>

              <div class="reg-grid-2">
                <div class="field">
                  <label for="register-registration-number">شماره ثبت شرکت</label>
                  <InputText
                    id="register-registration-number"
                    v-model="form.registrationNumber"
                    placeholder="شماره ثبت شرکت"
                    class="auth-input"
                    :class="{ 'p-invalid': errors.registrationNumber }"
                  />
                  <small v-if="errors.registrationNumber" class="p-error block">{{ errors.registrationNumber }}</small>
                </div>
                <div class="field">
                  <label for="register-company-email">ایمیل شرکت</label>
                  <InputText
                    id="register-company-email"
                  autocomplete="email"
                    v-model="form.email"
                    placeholder="آدرس ایمیل شرکت"
                    type="email"
                    class="auth-input"
                    :class="{ 'p-invalid': errors.email }"
                  />
                  <small v-if="errors.email" class="p-error block">{{ errors.email }}</small>
                </div>
              </div>

              <div class="reg-grid-2">
                <div class="field">
                  <label for="register-company-phone">شماره تلفن شرکت</label>
                  <InputText
                    id="register-company-phone"
                  autocomplete="tel"
                    v-model="form.phone"
                    placeholder="شماره تلفن شرکت"
                    class="auth-input"
                    :class="{ 'p-invalid': errors.phone }"
                  />
                  <small v-if="errors.phone" class="p-error block">{{ errors.phone }}</small>
                </div>
                <div class="field">
                  <label for="register-company-website">وب‌سایت شرکت</label>
                  <InputText
                    id="register-company-website"
                  autocomplete="url"
                    v-model="form.website"
                    placeholder="https://example.com"
                    class="auth-input"
                  />
                </div>
              </div>

              <div class="field">
                <label for="register-company-address">آدرس شرکت</label>
                <Textarea
                  id="register-company-address"
                  v-model="form.address"
                  placeholder="آدرس کامل شرکت"
                  class="auth-input"
                  :class="{ 'p-invalid': errors.address }"
                  rows="2"
                />
                <small v-if="errors.address" class="p-error block">{{ errors.address }}</small>
              </div>

              <!-- Manager Information -->
              <div class="reg-section-title">
                <i class="pi pi-user"></i>
                <span>اطلاعات مدیر شرکت</span>
              </div>

              <div class="reg-grid-2">
                <div class="field">
                  <label for="register-manager-first-name">نام مدیر</label>
                  <InputText
                    id="register-manager-first-name"
                  autocomplete="given-name"
                    v-model="form.managerFirstName"
                    placeholder="نام مدیر شرکت"
                    class="auth-input"
                    :class="{ 'p-invalid': errors.managerFirstName }"
                  />
                  <small v-if="errors.managerFirstName" class="p-error block">{{ errors.managerFirstName }}</small>
                </div>
                <div class="field">
                  <label for="register-manager-last-name">نام خانوادگی مدیر</label>
                  <InputText
                    id="register-manager-last-name"
                  autocomplete="family-name"
                    v-model="form.managerLastName"
                    placeholder="نام خانوادگی مدیر"
                    class="auth-input"
                    :class="{ 'p-invalid': errors.managerLastName }"
                  />
                  <small v-if="errors.managerLastName" class="p-error block">{{ errors.managerLastName }}</small>
                </div>
              </div>

              <div class="reg-grid-2">
                <div class="field">
                  <label for="register-manager-email">ایمیل مدیر <span class="reg-optional">(اختیاری)</span></label>
                  <InputText
                    id="register-manager-email"
                  autocomplete="email"
                    v-model="form.managerEmail"
                    placeholder="ایمیل مدیر شرکت"
                    type="email"
                    class="auth-input"
                    :class="{ 'p-invalid': errors.managerEmail }"
                  />
                  <small v-if="errors.managerEmail" class="p-error block">{{ errors.managerEmail }}</small>
                </div>
                <div class="field">
                  <label for="register-manager-phone">شماره همراه مدیر <span class="reg-required">*</span></label>
                  <InputText
                    id="register-manager-phone"
                  autocomplete="tel"
                    v-model="form.managerPhone"
                    placeholder="شماره همراه مدیر"
                    class="auth-input"
                    :class="{ 'p-invalid': errors.managerPhone }"
                  />
                  <small v-if="errors.managerPhone" class="p-error block">{{ errors.managerPhone }}</small>
                </div>
              </div>

              <div class="reg-grid-2">
                <div class="field">
                  <label for="register-company-password">رمز عبور مدیر</label>
                  <Password
                    inputId="register-company-password"
                  autocomplete="new-password"
                    v-model="form.password"
                    placeholder="رمز عبور را وارد کنید"
                    class="auth-input"
                    :class="{ 'p-invalid': errors.password }"
                    :feedback="false"
                    toggleMask
                  />
                  <small v-if="errors.password" class="p-error block">{{ errors.password }}</small>
                </div>
                <div class="field">
                  <label for="register-company-confirm-password">تکرار رمز عبور</label>
                  <Password
                    inputId="register-company-confirm-password"
                  autocomplete="new-password"
                    v-model="form.confirmPassword"
                    placeholder="رمز عبور را مجدداً وارد کنید"
                    class="auth-input"
                    :class="{ 'p-invalid': errors.confirmPassword }"
                    :feedback="false"
                    toggleMask
                  />
                  <small v-if="errors.confirmPassword" class="p-error block">{{ errors.confirmPassword }}</small>
                </div>
              </div>
            </div>

            <!-- Terms and Conditions -->
            <div class="reg-terms">
              <Checkbox
                v-model="form.acceptTerms"
                :binary="true"
                inputId="acceptTerms"
                :class="{ 'p-invalid': errors.acceptTerms }"
              />
              <label for="acceptTerms" class="reg-terms-label">
                با <a href="/terms" class="auth-link">قوانین و شرایط</a> و
                <a href="/terms" class="auth-link">سیاست حریم خصوصی</a> موافقم
              </label>
            </div>
            <small v-if="errors.acceptTerms" class="p-error block" role="alert">{{ errors.acceptTerms }}</small>

            <Button
              type="submit"
              label="ثبت نام"
              icon="pi pi-user-plus"
              class="auth-submit"
              :loading="loading"
              size="large"
            />
          </form>

          <div class="auth-hint">
            قبلاً ثبت نام کرده اید؟
            <router-link :to="{ name: 'login' }" class="auth-link auth-link-strong">
              ورود
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
import Checkbox from 'primevue/checkbox'
import Textarea from 'primevue/textarea'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const userType = ref('customer')
const loading = ref(false)

const form = ref({
  // Customer fields
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  password: '',
  confirmPassword: '',
  // Company fields
  companyName: '',
  companyNameEn: '',
  nationalId: '',
  registrationNumber: '',
  address: '',
  website: '',
  // Manager fields
  managerFirstName: '',
  managerLastName: '',
  managerEmail: '',
  managerPhone: '',
  acceptTerms: false
})

const errors = ref({})

const handleSubmit = async () => {
  errors.value = {}
  loading.value = true

  try {
    if (!validateForm()) {
      loading.value = false
      return
    }

    if (userType.value === 'customer') {
      // Customer registration
      await authStore.register({
        email: form.value.email,
        password: form.value.password,
        firstName: form.value.firstName,
        lastName: form.value.lastName,
        phone: form.value.phone,
      })
    } else {
      // Company registration
      await authStore.registerCompany({
        companyName: form.value.companyName,
        nameEn: form.value.companyNameEn || undefined,
        nationalId: form.value.nationalId,
        registrationNumber: form.value.registrationNumber,
        companyEmail: form.value.email,
        phone: form.value.phone,
        address: form.value.address,
        website: form.value.website || undefined,
        managerFirstName: form.value.managerFirstName,
        managerLastName: form.value.managerLastName,
        managerEmail: form.value.managerEmail,
        managerPhone: form.value.managerPhone || undefined,
        password: form.value.password,
      })
    }

    // Redirect to login with success message. Carry along `redirect` if the
    // user was sent here FROM another app's /register (see company/admin
    // router) so they land back there after logging in.
    router.push({
      name: 'login',
      query: {
        registered: 'true',
        email: form.value.email,
        ...(route.query.redirect ? { redirect: route.query.redirect } : {}),
      }
    })
  } catch (error) {
    console.error('Registration error:', error)
    errors.value = {
      general: error.message || 'خطا در ثبت نام. لطفاً مجدداً تلاش کنید.'
    }
  } finally {
    loading.value = false
  }
}

const validateForm = () => {
  errors.value = {}

  if (userType.value === 'customer') {
    if (!form.value.firstName) errors.value.firstName = 'وارد کردن نام الزامی است'
    if (!form.value.lastName) errors.value.lastName = 'وارد کردن نام خانوادگی الزامی است'
    if (!form.value.phone) errors.value.phone = 'وارد کردن شماره تلفن الزامی است'
    if (form.value.email && !isValidEmail(form.value.email)) errors.value.email = 'ایمیل وارد شده معتبر نیست'
  } else {
    // Company validation
    if (!form.value.companyName) errors.value.companyName = 'وارد کردن نام شرکت الزامی است'
    if (!form.value.nationalId) errors.value.nationalId = 'وارد کردن شناسه ملی الزامی است'
    if (!form.value.registrationNumber) errors.value.registrationNumber = 'وارد کردن شماره ثبت الزامی است'
    if (!form.value.address) errors.value.address = 'وارد کردن آدرس شرکت الزامی است'
    // Manager validation
    if (!form.value.managerFirstName) errors.value.managerFirstName = 'وارد کردن نام مدیر الزامی است'
    if (!form.value.managerLastName) errors.value.managerLastName = 'وارد کردن نام خانوادگی مدیر الزامی است'
    if (!form.value.managerPhone) errors.value.managerPhone = 'وارد کردن شماره تلفن مدیر الزامی است'
    if (form.value.managerEmail && !isValidEmail(form.value.managerEmail)) errors.value.managerEmail = 'ایمیل مدیر معتبر نیست'
  }

  if (!form.value.password) {
    errors.value.password = 'وارد کردن رمز عبور الزامی است'
  } else if (form.value.password.length < 8) {
    errors.value.password = 'رمز عبور باید حداقل 8 کاراکتر باشد'
  }

  if (form.value.password !== form.value.confirmPassword) {
    errors.value.confirmPassword = 'رمز عبور و تکرار آن یکسان نیستند'
  }

  if (!form.value.acceptTerms) {
    errors.value.acceptTerms = 'پذیرش قوانین و شرایط الزامی است'
  }

  return Object.keys(errors.value).length === 0
}

const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
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
  position: sticky;
  top: 0;
  height: 100vh;
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
  padding: 3rem 2rem;
}

.auth-form-wrap {
  width: 100%;
  max-width: 30rem;
}

.auth-head {
  text-align: center;
  margin-bottom: 2rem;
}

.auth-head h1 {
  font-size: 1.6rem;
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

.reg-type-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 0.5rem;
}

.user-type-selector {
  padding: 1rem;
  border: 1px solid var(--surface-border);
  border-radius: var(--content-border-radius);
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: center;
}
.user-type-selector:hover {
  border-color: var(--primary-color);
  background-color: var(--surface-hover);
}
.user-type-selector.is-active {
  border-color: var(--primary-color);
  background-color: color-mix(in srgb, var(--primary-color) 8%, transparent);
}

.reg-type-icon {
  font-size: 1.5rem;
  margin-bottom: 0.5rem;
  display: block;
  color: var(--primary-color);
}

.reg-type-radio {
  margin-top: 0.5rem;
}

.reg-grid-2 {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
}
@media (min-width: 480px) {
  .reg-grid-2 {
    grid-template-columns: repeat(2, 1fr);
  }
}

.reg-terms {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.5rem;
}
.reg-terms-label {
  font-size: 0.85rem;
  color: var(--text-color-secondary);
}

.auth-submit {
  width: 100%;
  margin-top: 0.5rem;
}

.reg-section-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: var(--surface-hover);
  border-radius: var(--content-border-radius);
  font-weight: 700;
  color: var(--primary-color);
  margin-top: 0.5rem;
  margin-bottom: 0.25rem;
}

.reg-required {
  color: var(--p-red-500);
}

.reg-optional {
  color: var(--text-color-secondary);
  font-size: 0.8rem;
  font-weight: 400;
}

.auth-hint {
  margin-top: 1.25rem;
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
.auth-page :deep(.p-checkbox:focus-visible),
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