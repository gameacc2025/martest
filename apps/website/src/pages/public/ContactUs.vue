<template>
  <div class="contact-page">

    <!-- Breadcrumb as page title -->
    <div class="breadcrumb-wrap">
      <Breadcrumb :home="home" :model="items" />
    </div>

    <!-- Two Column Layout -->
    <div class="contact-grid">
      <!-- Left: Contact Form (65%) -->
      <div class="contact-form-col">
        <FormSection title="فرم تماس" icon="pi pi-envelope">
          <form @submit.prevent="handleSubmit" class="contact-form">
            <FormAlert
              v-if="errors.general"
              variant="error"
              :message="errors.general"
            />

            <FormGrid :columns="2">
              <FormField label="نام و نام خانوادگی" :error="errors.name" required>
                <template #default="{ invalid }">
                  <InputText
                    v-model="form.name"
                    placeholder="نام خود را وارد کنید"
                    :invalid="invalid"
                  />
                </template>
              </FormField>
              <FormField label="ایمیل" :error="errors.email" required>
                <template #default="{ invalid }">
                  <InputText
                    v-model="form.email"
                    placeholder="example@email.com"
                    type="email"
                    :invalid="invalid"
                  />
                </template>
              </FormField>
            </FormGrid>

            <FormField label="شماره تلفن" :error="errors.phone" help="اختیاری — برای تماس سریع‌تر">
              <template #default="{ invalid }">
                <InputText
                  v-model="form.phone"
                  placeholder="۰۹۱۲۱۲۳۴۵۶۷"
                  :invalid="invalid"
                />
              </template>
            </FormField>

            <FormField label="موضوع" :error="errors.subject" required>
              <template #default="{ invalid }">
                <Dropdown
                  v-model="form.subject"
                  :options="subjectOptions"
                  optionLabel="label"
                  optionValue="value"
                  placeholder="موضوع را انتخاب کنید"
                  :invalid="invalid"
                />
              </template>
            </FormField>

            <FormField label="پیام" :error="errors.message" required help="حداقل ۱۰ کاراکتر">
              <template #default="{ invalid }">
                <Textarea
                  v-model="form.message"
                  placeholder="پیام خود را اینجا بنویسید..."
                  rows="5"
                  :invalid="invalid"
                />
              </template>
            </FormField>

            <FormActions align="start">
              <Button
                type="submit"
                label="ارسال پیام"
                icon="pi pi-send"
                :loading="loading"
              />
              <Button
                type="button"
                label="پاک کردن"
                icon="pi pi-times"
                severity="secondary"
                text
                @click="resetForm"
              />
            </FormActions>
          </form>
        </FormSection>
      </div>

      <!-- Right: Contact Information (35%) -->
      <div class="contact-info-col">
        <!-- Phone -->
        <Card class="info-card">
          <template #content>
            <div class="info-card-inner">
              <div class="info-icon"><i class="pi pi-phone"></i></div>
              <div>
                <h4>تلفن تماس</h4>
                <p>۰۲۱-۱۲۳۴۵۶۷۸</p>
              </div>
            </div>
          </template>
        </Card>

        <!-- Email -->
        <Card class="info-card">
          <template #content>
            <div class="info-card-inner">
              <div class="info-icon"><i class="pi pi-envelope"></i></div>
              <div>
                <h4>ایمیل</h4>
                <p>info@telecom-marketplace.ir</p>
              </div>
            </div>
          </template>
        </Card>

        <!-- Address -->
        <Card class="info-card">
          <template #content>
            <div class="info-card-inner">
              <div class="info-icon"><i class="pi pi-map-marker"></i></div>
              <div>
                <h4>آدرس</h4>
                <p>تهران، خیابان ولیعصر، پلاک ۱۲۳، طبقه ۴</p>
              </div>
            </div>
          </template>
        </Card>

        <!-- Working Hours -->
        <Card class="info-card">
          <template #content>
            <div class="info-card-inner">
              <div class="info-icon"><i class="pi pi-clock"></i></div>
              <div>
                <h4>ساعت کاری</h4>
                <div class="hours-list">
                  <div class="hour-row">
                    <span>شنبه تا چهارشنبه</span>
                    <span class="hour-value">۸:۰۰ - ۱۷:۰۰</span>
                  </div>
                  <div class="hour-row">
                    <span>پنجشنبه</span>
                    <span class="hour-value">۸:۰۰ - ۱۴:۰۰</span>
                  </div>
                  <div class="hour-row">
                    <span>جمعه</span>
                    <span class="hour-closed">تعطیل</span>
                  </div>
                </div>
              </div>
            </div>
          </template>
        </Card>

        <!-- Social Networks -->
        <Card class="info-card">
          <template #content>
            <div class="info-card-inner">
              <div class="info-icon"><i class="pi pi-share-alt"></i></div>
              <div>
                <h4>شبکه‌های اجتماعی</h4>
                <div class="social-icons">
                  <a href="https://instagram.com/telecom-marketplace" target="_blank" class="social-link">
                    <i class="pi pi-instagram"></i>
                  </a>
                  <a href="https://t.me/telecom_marketplace" target="_blank" class="social-link">
                    <i class="pi pi-telegram"></i>
                  </a>
                  <a href="https://linkedin.com/company/telecom-marketplace" target="_blank" class="social-link">
                    <i class="pi pi-linkedin"></i>
                  </a>
                </div>
              </div>
            </div>
          </template>
        </Card>
      </div>
    </div>

    <!-- Google Map -->
    <div class="map-section">
      <Card class="map-card">
        <template #content>
          <div class="map-container">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3239.999999999999!2d51.3889739153167!3d35.689197479999996!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMzXCsDQxJzE0LjAiTiA1McKwMjMnMTQuMiJX!5e0!3m2!1sen!2s!4v1234567890123!5m2!1sen!2s"
              width="100%"
              height="100%"
              style="border:0;"
              allowfullscreen=""
              loading="lazy"
              referrerpolicy="no-referrer-when-downgrade"
            ></iframe>
          </div>
        </template>
      </Card>
    </div>

    <!-- Success Dialog -->
    <Dialog v-model:visible="successDialog" header="پیام شما ارسال شد" :modal="true">
      <div class="text-center">
        <i class="pi pi-check-circle" style="font-size: 3rem; color: var(--p-green-500); margin-bottom: 1rem;"></i>
        <p>پیام شما با موفقیت ارسال شد. در اسرع وقت با شما تماس خواهیم گرفت.</p>
      </div>
      <template #footer>
        <Button label="بستن" icon="pi pi-check" @click="successDialog = false" />
      </template>
    </Dialog>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import Breadcrumb from 'primevue/breadcrumb'
import Button from 'primevue/button'
import Card from 'primevue/card'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import Dropdown from 'primevue/dropdown'
import Dialog from 'primevue/dialog'
import { FormSection, FormField, FormGrid, FormActions, FormAlert } from '@telecom/shared-ui/components/common/form'


const form = ref({ name: '', email: '', phone: '', subject: null, message: '' })
const errors = ref({})
const loading = ref(false)
const successDialog = ref(false)

const home = ref({ icon: 'pi pi-home', to: '/' })
const items = ref([{ label: 'تماس با ما' }])

const subjectOptions = ref([
  { label: 'سوال در مورد محصول', value: 'product_question' },
  { label: 'مشکل در سفارش', value: 'order_issue' },
  { label: 'پیشنهاد همکاری', value: 'partnership' },
  { label: 'گزارش مشکل', value: 'bug_report' },
  { label: 'سوال عمومی', value: 'general_question' }
])

const handleSubmit = async () => {
  errors.value = {}
  loading.value = true
  try {
    if (!validateForm()) { loading.value = false; return }
    await new Promise(resolve => setTimeout(resolve, 1000))
    successDialog.value = true
    resetForm()
  } catch (error) {
    errors.value = { general: 'خطا در ارسال پیام.' }
  } finally {
    loading.value = false
  }
}

const validateForm = () => {
  errors.value = {}
  if (!form.value.name) { errors.value.name = 'نام الزامی است'; return false }
  if (!form.value.email) { errors.value.email = 'ایمیل الزامی است'; return false }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.value.email)) { errors.value.email = 'ایمیل معتبر نیست'; return false }
  if (!form.value.subject) { errors.value.subject = 'موضوع الزامی است'; return false }
  if (!form.value.message) { errors.value.message = 'پیام الزامی است'; return false }
  if (form.value.message.length < 10) { errors.value.message = 'پیام باید حداقل ۱۰ کاراکتر باشد'; return false }
  return true
}

const resetForm = () => {
  form.value = { name: '', email: '', phone: '', subject: null, message: '' }
  errors.value = {}
}
</script>

<style scoped>
.contact-page {
  direction: rtl;
}

/* Breadcrumb */
.breadcrumb-wrap { margin-bottom: 1rem; }

/* Two Column Grid */
.contact-grid {
  display: grid;
  grid-template-columns: 1fr 480px;
  gap: 1.5rem;
  margin-bottom: 2rem;
}

/* Form Card */
.form-card { border-radius: 1rem; }
.card-title-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 700;
  font-size: 1.1rem;
}
.card-title-row i { color: #0DAFBE; }
.form-row-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}
.form-actions {
  display: flex;
  gap: 0.75rem;
  margin-top: 0.5rem;
}
.required { color: var(--p-red-500); }

/* Info Cards */
.contact-info-col {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
.info-card { border-radius: 0.75rem; }
.info-card :deep(.p-card-content) { padding: 1rem; }
.info-card-inner {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
}
.info-icon {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 0.5rem;
  background: #DEF5FB;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.info-icon i { font-size: 1.1rem; color: #004D6F; }
.info-card-inner h4 {
  margin: 0 0 0.25rem;
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--text-color);
}
.info-card-inner p {
  margin: 0;
  font-size: 0.8rem;
  color: var(--text-color-secondary);
  line-height: 1.6;
}

/* Hours */
.hours-list { display: flex; flex-direction: column; gap: 0.25rem; }
.hour-row {
  display: flex;
  justify-content: space-between;
  font-size: 0.8rem;
}
.hour-value { font-weight: 600; color: var(--text-color); }
.hour-closed { color: var(--p-red-500); font-weight: 600; }

/* Social */
.social-icons { display: flex; gap: 0.5rem; margin-top: 0.5rem; }
.social-link {
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 50%;
  background: #DEF5FB;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #004D6F;
  text-decoration: none;
  transition: all 0.2s;
}
.social-link:hover {
  background: #004D6F;
  color: #fff;
}

/* Map */
.map-card { border-radius: 1rem; overflow: hidden; }
.map-container {
  height: 350px;
  border-radius: 0.75rem;
  overflow: hidden;
}

/* Responsive */
@media (max-width: 900px) {
  .contact-grid { grid-template-columns: 1fr; }
  .contact-hero { flex-direction: column; text-align: center; gap: 1.5rem; }
}
@media (max-width: 560px) {
  .form-row-2 { grid-template-columns: 1fr; }
  .contact-hero { padding: 1.5rem; }
}
</style>
