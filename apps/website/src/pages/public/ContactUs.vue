<script setup>
import { ref, onMounted } from 'vue'
import { useCmsStore } from '../../stores/cms'
import { contactApi } from '@telecom/api-client'
import { useToast } from 'primevue/usetoast'

const cmsStore = useCmsStore()
const toast = useToast()

const pageContent = ref(null)
const pageLoading = ref(false)

const home = { icon: 'pi pi-home', to: '/' }
const items = [{ label: 'تماس با ما' }]

const form = reactive({
  name: '',
  email: '',
  phone: '',
  subject: '',
  message: ''
})

const errors = reactive({
  name: '',
  email: '',
  phone: '',
  subject: '',
  message: '',
  general: ''
})

const successMessage = ref('')

const subjectOptions = [
  { label: 'پشتیبانی فنی', value: 'technical' },
  { label: 'استعلام و خرید', value: 'sales' },
  { label: 'همکاری و شراکت', value: 'partnership' },
  { label: 'سایر', value: 'other' }
]

onMounted(async () => {
  await loadContactPage()
})

async function loadContactPage() {
  pageLoading.value = true
  try {
    const page = await cmsStore.fetchPageBySlug('contact')
    pageContent.value = page
  } catch (error) {
    console.error('Failed to load contact page:', error)
  } finally {
    pageLoading.value = false
  }
}

function validateForm() {
  errors.name = form.name.trim() ? '' : 'نام الزامی است'
  errors.email = form.email.trim() ? (/\S+@\S+\.\S+/.test(form.email) ? '' : 'ایمیل معتبر نیست') : 'ایمیل الزامی است'
  errors.phone = ''
  errors.subject = form.subject ? '' : 'موضوع الزامی است'
  errors.message = form.message.trim().length >= 10 ? '' : 'پیام باید حداقل ۱۰ کاراکتر باشد'
  errors.general = ''

  return !Object.values(errors).some(e => e)
}

async function handleSubmit() {
  if (!validateForm()) return

  try {
    await contactApi.sendMessage({
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      subject: form.subject,
      message: form.message.trim()
    })
    successMessage.value = 'پیام شما با موفقیت ارسال شد. به زودی پاسخ خواهیم داد.'
    Object.keys(form).forEach(k => form[k] = '')
  } catch (error) {
    errors.general = error?.message || 'ارسال پیام با خطا مواجه شد. دوباره تلاش کنید.'
    toast.add({ severity: 'error', summary: 'خطا', detail: errors.general, life: 3000 })
  }
}
</script>

<template>
  <div class="contact-page">

    <WorkspacePageHeading
      eyebrow="ارتباط با بازارگاه"
      title="تماس با ما"
      description="برای دریافت راهنمایی، پیگیری درخواست یا ارسال پیام با تیم ما در ارتباط باشید."
      icon="pi pi-headphones"
      heading-id="contact-page-title"
    >
      <template #actions><Breadcrumb :home="home" :model="items" /></template>
    </WorkspacePageHeading>

    <!-- Two Column Layout -->
    <div class="contact-grid">
      <!-- Left: Contact Form (65%) -->
      <div class="contact-form-col">
        <FormSection title="فرم تماس">
          <form @submit.prevent="handleSubmit" class="contact-form">
            <FormAlert v-if="errors.general" variant="error" :message="errors.general" />
            <FormAlert v-if="successMessage" variant="success" :message="successMessage" />

            <FormGrid :columns="2">
              <FormField label="نام و نام خانوادگی" :error="errors.name" required>
                <template #default="{ id, invalid, describedBy }">
                  <InputText
                    v-model="form.name"
                    :id="id"
                    name="contactName"
                    :aria-describedby="describedBy"
                    autocomplete="name"
                    placeholder="نام خود را وارد کنید"
                    :invalid="invalid"
                  />
                </template>
              </FormField>
              <FormField label="ایمیل" :error="errors.email" required>
                <template #default="{ id, invalid, describedBy }">
                  <InputText
                    v-model="form.email"
                    :id="id"
                    name="contactEmail"
                    :aria-describedby="describedBy"
                    autocomplete="email"
                    placeholder="example@email.com"
                    type="email"
                    :invalid="invalid"
                  />
                </template>
              </FormField>
            </FormGrid>

            <FormField label="شماره تلفن" :error="errors.phone" help="اختیاری — برای تماس سریع‌تر">
              <template #default="{ id, invalid, describedBy }">
                <InputText
                  v-model="form.phone"
                  :id="id"
                  name="contactPhone"
                  :aria-describedby="describedBy"
                  autocomplete="tel"
                  inputmode="tel"
                  placeholder="۰۹۱۲۱۲۳۴۵۶۷"
                  :invalid="invalid"
                />
              </template>
            </FormField>

            <FormField label="موضوع" :error="errors.subject" required>
              <template #default="{ id, invalid, describedBy }">
                <Select
                  v-model="form.subject"
                  :inputId="id"
                  name="contactSubject"
                  :aria-describedby="describedBy"
                  :options="subjectOptions"
                  optionLabel="label"
                  optionValue="value"
                  placeholder="موضوع را انتخاب کنید"
                  :invalid="invalid"
                />
              </template>
            </FormField>

            <FormField label="پیام" :error="errors.message" required help="حداقل ۱۰ کاراکتر">
              <template #default="{ id, invalid, describedBy }">
                <Textarea
                  v-model="form.message"
                  :id="id"
                  name="contactMessage"
                  :aria-describedby="describedBy"
                  placeholder="پیام خود را اینجا بنویسید…"
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
                :disabled="loading"
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

      <aside class="contact-info-col" aria-label="راهنمای ارسال پیام">
        <Card class="info-card">
          <template #content>
            <div class="info-card-inner">
              <div>
                <h4>پیگیری پیام</h4>
                <p>پس از ارسال موفق، پیام شما به صندوق پشتیبانی بازارگاه تحویل داده می‌شود. پاسخ احتمالی به نشانی ایمیلی که وارد کرده‌اید ارسال خواهد شد.</p>
              </div>
            </div>
          </template>
        </Card>
      </aside>
    </div>

    <!-- Contact Information from CMS -->
    <section v-if="pageContent" class="contact-cms-content" aria-labelledby="contact-info-title">
      <div class="ds-container ds-stack">
        <h2 id="contact-info-title" class="ds-h2">اطلاعات تماس</h2>
        <div class="ds-prose" v-html="pageContent.content"></div>
      </div>
    </section>

  </div>
</template>

<style scoped>
.contact-page {
  direction: rtl;
  width: 100%;
  max-width: var(--ds-container-max);
  margin-inline: auto;
  padding-inline: var(--ds-container-pad);
  padding-block: var(--ds-space-6);
}

@media (min-width: 768px) {
  .contact-page {
    padding-inline: var(--ds-container-pad-lg);
    padding-block: var(--ds-space-8);
  }
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
.card-title-row i { color: var(--tm-cyan-deep); }
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
  background: var(--tm-cyan-soft);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.info-icon i { font-size: 1.1rem; color: var(--tm-ink); }
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
  background: var(--tm-cyan-soft);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--tm-ink);
  text-decoration: none;
  transition: background-color var(--ds-transition-fast), color var(--ds-transition-fast), border-color var(--ds-transition-fast);
}
.social-link:hover {
  background: var(--tm-ink);
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

.contact-page { color: var(--ds-color-text); }
.contact-page .breadcrumb-wrap { margin-bottom: var(--ds-space-5); }
.contact-page .contact-form-col,
.contact-page .contact-info-col {
  min-width: 0;
}
.contact-page :deep(.form-section--card) {
  border-radius: var(--ds-radius-xl);
  box-shadow: var(--ds-shadow-xs);
}
.contact-page :deep(.form-section-title) {
  color: var(--ds-color-text);
  font-weight: var(--ds-font-weight-bold);
}
.contact-page :deep(.p-inputtext),
.contact-page :deep(.p-textarea),
.contact-page :deep(.p-select) { border-radius: var(--ds-radius-md); }
@media (max-width: 900px) {
  .contact-page .contact-grid { grid-template-columns: minmax(0, 1fr); }
}


.contact-page { color: var(--ds-color-text); }
.contact-page-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: var(--ds-space-5);
  padding: 1.25rem 1.5rem;
  border: 1px solid var(--ds-color-border);
  border-radius: var(--ds-radius-xl);
  background: var(--ds-color-surface);
  box-shadow: var(--ds-shadow-xs);
}
.contact-page-heading .ds-eyebrow { display: inline-flex; align-items: center; gap: .45rem; font-weight: var(--ds-font-weight-bold); }
.contact-page-heading h1 { margin: .2rem 0; color: var(--ds-color-text); font-size: var(--ds-font-size-2xl); font-weight: var(--ds-font-weight-bold); }
.contact-page-heading p { margin: .35rem 0 0; color: var(--ds-color-text-muted); font-size: var(--ds-font-size-sm); line-height: 1.7; }
.contact-page-heading :deep(.p-breadcrumb) { padding: 0; border: 0; background: transparent; }
.contact-page :deep(.social-link:hover) { border-color: var(--ds-color-primary); background: var(--ds-color-surface-hover); color: var(--ds-color-primary-text); }
.contact-page :deep(.card-title-row i) { color: var(--ds-color-primary); }
@media (max-width: 640px) { .contact-page-heading { align-items: flex-start; flex-direction: column; padding: 1rem; } }


/* Contact workspace: accessible form hierarchy and balanced information column. */
.contact-page { color: var(--ds-color-text); }
.contact-page-heading {
  align-items: center;
  gap: 1.25rem;
  padding: clamp(1rem, 2vw, 1.5rem);
  border: 1px solid var(--ds-color-border);
  border-radius: var(--ds-radius-xl);
  background: var(--ds-color-surface);
  box-shadow: var(--ds-shadow-xs);
}
.contact-page-heading h1 { color: var(--ds-color-text); font-size: clamp(1.35rem, 2vw, var(--ds-font-size-2xl)); }
.contact-page-heading p { color: var(--ds-color-text-muted); line-height: 1.8; }
.contact-grid {
  grid-template-columns: minmax(0, 1.25fr) minmax(300px, .75fr);
  gap: clamp(1rem, 2vw, 1.5rem);
}
.contact-page .form-card,
.contact-page .info-card,
.contact-page .map-card {
  border: 1px solid var(--ds-color-border);
  border-radius: var(--ds-radius-md);
  background: var(--ds-color-surface);
  box-shadow: none;
  overflow: hidden;
}
.contact-page .card-title-row { color: var(--ds-color-text); }
.contact-page .card-title-row i { color: var(--ds-color-primary); }
.contact-page .info-card-inner h4 { color: var(--ds-color-text); }
.contact-page .info-card-inner p { color: var(--ds-color-text-muted); line-height: 1.8; }
.contact-page .info-icon,
.contact-page .social-link {
  background: var(--ds-color-primary-soft);
  color: var(--ds-color-primary);
}
.contact-page .info-icon i { color: var(--ds-color-primary); }
.contact-page .social-link:hover { background: var(--ds-color-primary); color: var(--ds-color-primary-contrast); }
.contact-page .hour-value { color: var(--ds-color-text); }
.contact-page .hour-closed { color: var(--ds-color-danger); }
.contact-page :deep(.p-inputtext),
.contact-page :deep(.p-textarea),
.contact-page :deep(.p-select) {
  width: 100%;
  border-color: var(--ds-color-border);
  border-radius: var(--ds-radius-md);
}
.contact-page :deep(.p-inputtext:focus-visible),
.contact-page :deep(.p-textarea:focus-visible),
.contact-page :deep(.p-select:focus-visible) {
  border-color: var(--ds-color-focus);
  outline: 2px solid var(--ds-color-focus);
  outline-offset: 2px;
  box-shadow: none;
}
.contact-page .map-container { border-radius: var(--ds-radius-lg); }
@media (max-width: 900px) {
  .contact-grid { grid-template-columns: minmax(0, 1fr); }
}
@media (max-width: 640px) {
  .contact-page-heading { align-items: flex-start; flex-direction: column; }
  .contact-page .form-actions { flex-wrap: wrap; }
  .contact-page .form-actions :deep(.p-button) { flex: 1 1 auto; }
}

/* CMS Content Section */
.contact-cms-content {
  margin-top: var(--ds-space-8);
  padding: var(--ds-space-6);
  border: 1px solid var(--ds-color-border);
  border-radius: var(--ds-radius-xl);
  background: var(--ds-color-surface);
  box-shadow: var(--ds-shadow-xs);
}

.contact-cms-content .ds-h2 {
  margin-bottom: var(--ds-space-4);
  color: var(--ds-color-text);
}

.contact-cms-content .ds-prose {
  color: var(--ds-color-text);
  line-height: var(--ds-line-height-relaxed);
}

.contact-cms-content .ds-prose h2,
.contact-cms-content .ds-prose h3,
.contact-cms-content .ds-prose h4 {
  color: var(--ds-color-text);
  margin-top: var(--ds-space-5);
  margin-bottom: var(--ds-space-3);
}

.contact-cms-content .ds-prose ul,
.contact-cms-content .ds-prose ol {
  margin: var(--ds-space-4) 0;
  padding-right: var(--ds-space-6);
}

.contact-cms-content .ds-prose li {
  margin: var(--ds-space-2) 0;
}

.contact-cms-content .ds-prose p {
  margin: var(--ds-space-3) 0;
}

.contact-cms-content .ds-prose strong {
  color: var(--ds-color-text);
  font-weight: var(--ds-font-weight-bold);
}

@media (max-width: 640px) {
  .contact-cms-content {
    padding: var(--ds-space-4);
    margin-top: var(--ds-space-6);
  }
}
</style>