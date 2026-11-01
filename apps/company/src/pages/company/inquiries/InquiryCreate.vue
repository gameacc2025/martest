<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import { inquiriesApi, productsApi } from '@telecom/api-client'
import { getInquiryDateWindowError, INQUIRY_DATE_WINDOW_ERRORS } from '../../../utils/inquiryDateWindow.js'

import Stepper from 'primevue/stepper'
import StepList from 'primevue/steplist'
import Step from 'primevue/step'
import StepPanels from 'primevue/steppanels'
import StepPanel from 'primevue/steppanel'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import InputNumber from 'primevue/inputnumber'
import Select from 'primevue/select'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import ToggleSwitch from 'primevue/toggleswitch'
import Message from 'primevue/message'

const router = useRouter()
const toast = useToast()

const STEPS = { BASIC: '1', PRODUCTS: '2', SETTINGS: '3', REVIEW: '4', SUBMIT: '5' }
const activeStep = ref(STEPS.BASIC)
const DRAFT_KEY = 'company-inquiry-create-draft'

const form = reactive({
  title: '',
  description: '',
  items: [],
  priority: 'NORMAL',
  visibilityMode: 'NORMAL',
  responseDeadline: null,
  publishDate: null,
  confidential: false,
  autoClose: true,
  allowEditResponse: true,
  allowWithdrawResponse: false,
  allowEarlyReveal: false,
})

const products = ref([])
const loadingProducts = ref(false)
const submitting = ref(false)
const newItem = reactive({ productId: null, quantity: 1, description: '' })

const priorityOptions = [
  { label: 'کم', value: 'LOW' },
  { label: 'عادی', value: 'NORMAL' },
  { label: 'زیاد', value: 'HIGH' },
  { label: 'فوری', value: 'URGENT' },
]
const visibilityOptions = [
  { label: 'عادی', value: 'NORMAL', hint: 'پاسخ‌ها برای همه قابل مشاهده است.' },
  { label: 'دربسته', value: 'SEALED', hint: 'پاسخ‌ها تا پایان مهلت مخفی می‌مانند.' },
  { label: 'ناشناس دربسته', value: 'ANONYMOUS_SEALED', hint: 'پاسخ‌ها مخفی و هویت پاسخ‌دهندگان ناشناس است.' },
]

onMounted(() => { restoreDraft(); fetchProducts() })

async function fetchProducts() {
  loadingProducts.value = true
  try {
    const response = await productsApi.myProducts({ limit: 100 })
    const body = response?.data ?? response
    products.value = Array.isArray(body?.data) ? body.data : Array.isArray(body) ? body : []
  } catch (err) {
    toast.add({ severity: 'error', summary: 'خطا', detail: 'خطا در دریافت محصولات', life: 3000 })
  } finally {
    loadingProducts.value = false
  }
}

function getProductName(id) {
  return products.value.find((p) => p.id === id)?.title || '-'
}

const priorityLabel = computed(() => priorityOptions.find((o) => o.value === form.priority)?.label || '-')
const visibilityLabel = computed(() => visibilityOptions.find((o) => o.value === form.visibilityMode)?.label || '-')

function formatDate(value) {
  if (!value) return '—'
  try { return new Date(value).toLocaleString('fa-IR') } catch { return value }
}

function addItem() {
  if (!newItem.productId) {
    toast.add({ severity: 'warn', summary: 'توجه', detail: 'محصول را انتخاب کنید', life: 3000 })
    return
  }
  if (form.items.some((it) => it.productId === newItem.productId)) {
    toast.add({ severity: 'warn', summary: 'توجه', detail: 'این محصول قبلاً اضافه شده است', life: 3000 })
    return
  }
  form.items.push({ productId: newItem.productId, quantity: newItem.quantity || 1, description: newItem.description })
  newItem.productId = null
  newItem.quantity = 1
  newItem.description = ''
}

function removeItem(index) { form.items.splice(index, 1) }

function validateStep(step) {
  if (step === STEPS.BASIC) {
    if (!form.title?.trim()) {
      toast.add({ severity: 'warn', summary: 'خطا', detail: 'عنوان استعلام الزامی است', life: 3000 })
      return false
    }
    return true
  }
  if (step === STEPS.PRODUCTS) {
    if (form.items.length === 0) {
      toast.add({ severity: 'warn', summary: 'خطا', detail: 'حداقل یک قلم کالا اضافه کنید', life: 3000 })
      return false
    }
    return true
  }
  if (step === STEPS.SETTINGS) {
    const dateError = getInquiryDateWindowError({
      publishDate: form.publishDate,
      responseDeadline: form.responseDeadline,
    })
    const messages = {
      [INQUIRY_DATE_WINDOW_ERRORS.INVALID_PUBLISH_DATE]: 'تاریخ انتشار معتبر نیست؛ تاریخ را دوباره انتخاب کنید',
      [INQUIRY_DATE_WINDOW_ERRORS.INVALID_RESPONSE_DEADLINE]: 'مهلت پاسخ معتبر نیست؛ تاریخ را دوباره انتخاب کنید',
      [INQUIRY_DATE_WINDOW_ERRORS.DEADLINE_NOT_FUTURE]: 'مهلت پاسخ باید در آینده باشد',
      [INQUIRY_DATE_WINDOW_ERRORS.DEADLINE_NOT_AFTER_PUBLISH]: 'مهلت پاسخ باید بعد از تاریخ انتشار باشد',
    }
    if (dateError) {
      toast.add({ severity: 'warn', summary: 'خطا', detail: messages[dateError] || 'بازه زمانی استعلام معتبر نیست', life: 3000 })
      return false
    }
    return true
  }
  return true
}

function goNext(step, activate) {
  if (!validateStep(step)) return
  const order = Object.values(STEPS)
  const idx = order.indexOf(step)
  const next = order[idx + 1]
  if (next) activate(next)
}

function goBack(step, activate) {
  const order = Object.values(STEPS)
  const idx = order.indexOf(step)
  const prev = order[idx - 1]
  if (prev) activate(prev)
}

function saveDraft() {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ form, activeStep: activeStep.value, savedAt: Date.now() }))
    toast.add({ severity: 'success', summary: 'ذخیره شد', detail: 'پیش‌نویس ذخیره شد', life: 2500 })
  } catch {
    toast.add({ severity: 'error', summary: 'خطا', detail: 'ذخیره پیش‌نویس ناموفق بود', life: 3000 })
  }
}

function restoreDraft() {
  try {
    const raw = localStorage.getItem(DRAFT_KEY)
    if (!raw) return
    const parsed = JSON.parse(raw)
    if (parsed?.form) {
      Object.assign(form, parsed.form)
      if (parsed.activeStep) activeStep.value = parsed.activeStep
      toast.add({ severity: 'info', summary: 'پیش‌نویس', detail: 'پیش‌نویس قبلی بازیابی شد', life: 2500 })
    }
  } catch { /* ignore */ }
}

function clearDraft() { localStorage.removeItem(DRAFT_KEY) }

async function submitInquiry() {
  if (!validateStep(STEPS.BASIC) || !validateStep(STEPS.PRODUCTS) || !validateStep(STEPS.SETTINGS)) return
  submitting.value = true
  try {
    const payload = {
      title: form.title.trim(),
      description: form.description || undefined,
      priority: form.priority,
      visibilityMode: form.visibilityMode,
      confidential: form.confidential,
      autoClose: form.autoClose,
      allowEditResponse: form.allowEditResponse,
      allowWithdrawResponse: form.allowWithdrawResponse,
      allowEarlyReveal: form.allowEarlyReveal,
      responseDeadline: form.responseDeadline ? new Date(form.responseDeadline).toISOString() : undefined,
      publishDate: form.publishDate ? new Date(form.publishDate).toISOString() : undefined,
      items: form.items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        description: item.description || undefined,
      })),
    }
    await inquiriesApi.create(payload)
    clearDraft()
    toast.add({ severity: 'success', summary: 'موفقیت', detail: 'استعلام ایجاد شد', life: 3000 })
    router.push({ name: 'company-inquiries' })
  } catch (err) {
    toast.add({ severity: 'error', summary: 'خطا', detail: err.message || 'خطا در ایجاد استعلام', life: 3000 })
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="inquiry-create-page">
    <div class="page-header">
      <div class="page-header-title">
        <Button icon="pi pi-arrow-right" text rounded @click="router.push({ name: 'company-inquiries' })" />
        <h1>ایجاد استعلام جدید</h1>
      </div>
      <div class="page-header-actions">
        <Button label="ذخیره پیش‌نویس" icon="pi pi-save" severity="secondary" outlined @click="saveDraft" />
        <Button label="انصراف" icon="pi pi-times" severity="secondary" text @click="router.push({ name: 'company-inquiries' })" />
      </div>
    </div>

    <Stepper v-model:value="activeStep" class="inquiry-stepper" linear>
      <StepList>
        <Step :value="STEPS.BASIC">اطلاعات</Step>
        <Step :value="STEPS.PRODUCTS">محصولات</Step>
        <Step :value="STEPS.SETTINGS">تنظیمات</Step>
        <Step :value="STEPS.REVIEW">بررسی</Step>
        <Step :value="STEPS.SUBMIT">ثبت</Step>
      </StepList>

      <StepPanels>
        <StepPanel :value="STEPS.BASIC" v-slot="{ activateCallback }">
          <div class="step-body">
            <h2 class="step-title">اطلاعات پایه</h2>
            <div class="field">
              <label>عنوان استعلام <span class="required">*</span></label>
              <InputText v-model="form.title" class="w-full" placeholder="مثلاً: استعلام قیمت روتر صنعتی" />
            </div>
            <div class="field">
              <label>توضیحات</label>
              <Textarea v-model="form.description" rows="4" class="w-full" placeholder="توضیحات تکمیلی..." />
            </div>
          </div>
          <div class="step-nav">
            <span></span>
            <Button label="بعدی" icon="pi pi-arrow-left" iconPos="right" @click="goNext(STEPS.BASIC, activateCallback)" />
          </div>
        </StepPanel>

        <StepPanel :value="STEPS.PRODUCTS" v-slot="{ activateCallback }">
          <div class="step-body">
            <h2 class="step-title">اقلام کالا</h2>
            <div class="add-item-row">
              <div class="field grow">
                <label>محصول</label>
                <Select v-model="newItem.productId" :options="products" optionLabel="title" optionValue="id" :loading="loadingProducts" filter placeholder="انتخاب محصول" class="w-full" />
              </div>
              <div class="field qty">
                <label>تعداد</label>
                <InputNumber v-model="newItem.quantity" :min="1" class="w-full" />
              </div>
              <div class="field grow">
                <label>توضیحات</label>
                <InputText v-model="newItem.description" placeholder="اختیاری" class="w-full" />
              </div>
              <div class="field add-btn">
                <Button label="افزودن" icon="pi pi-plus" @click="addItem" />
              </div>
            </div>
            <Message v-if="form.items.length === 0" severity="info" :closable="false" class="mt-2">
              هنوز قلمی اضافه نشده است. حداقل یک قلم کالا لازم است.
            </Message>
            <DataTable v-else :value="form.items" responsiveLayout="scroll" class="mt-3">
              <Column header="محصول">
                <template #body="{ data }">{{ getProductName(data.productId) }}</template>
              </Column>
              <Column field="quantity" header="تعداد" style="width: 8rem" />
              <Column field="description" header="توضیحات" />
              <Column header="عملیات" style="width: 6rem">
                <template #body="{ index }">
                  <Button icon="pi pi-trash" severity="danger" rounded text @click="removeItem(index)" />
                </template>
              </Column>
            </DataTable>
          </div>
          <div class="step-nav">
            <Button label="قبلی" icon="pi pi-arrow-right" severity="secondary" @click="goBack(STEPS.PRODUCTS, activateCallback)" />
            <Button label="بعدی" icon="pi pi-arrow-left" iconPos="right" @click="goNext(STEPS.PRODUCTS, activateCallback)" />
          </div>
        </StepPanel>

        <StepPanel :value="STEPS.SETTINGS" v-slot="{ activateCallback }">
          <div class="step-body">
            <h2 class="step-title">تنظیمات استعلام</h2>
            <div class="settings-grid">
              <div class="field">
                <label>حالت نمایش</label>
                <Select v-model="form.visibilityMode" :options="visibilityOptions" optionLabel="label" optionValue="value" class="w-full" />
                <small class="field-hint">{{ visibilityOptions.find((o) => o.value === form.visibilityMode)?.hint }}</small>
              </div>
              <div class="field">
                <label>اولویت</label>
                <Select v-model="form.priority" :options="priorityOptions" optionLabel="label" optionValue="value" class="w-full" />
              </div>
              <div class="field">
                <label>مهلت پاسخ</label>
                <InputText v-model="form.responseDeadline" type="datetime-local" class="w-full" />
              </div>
              <div class="field">
                <label>تاریخ انتشار</label>
                <InputText v-model="form.publishDate" type="datetime-local" class="w-full" />
              </div>
            </div>
            <div class="switch-list">
              <div class="switch-row">
                <div>
                  <span class="switch-label">محرمانه</span>
                  <small class="switch-hint">استعلام به‌صورت محرمانه علامت‌گذاری شود.</small>
                </div>
                <ToggleSwitch v-model="form.confidential" />
              </div>
              <div class="switch-row">
                <div>
                  <span class="switch-label">بستن خودکار</span>
                  <small class="switch-hint">استعلام پس از پایان مهلت خودکار بسته شود.</small>
                </div>
                <ToggleSwitch v-model="form.autoClose" />
              </div>
              <div class="switch-row">
                <div>
                  <span class="switch-label">اجازه ویرایش پاسخ</span>
                  <small class="switch-hint">پاسخ‌دهندگان بتوانند پاسخ خود را ویرایش کنند.</small>
                </div>
                <ToggleSwitch v-model="form.allowEditResponse" />
              </div>
              <div class="switch-row">
                <div>
                  <span class="switch-label">اجازه پس‌گرفتن پاسخ</span>
                  <small class="switch-hint">پاسخ‌دهندگان بتوانند پاسخ خود را پس بگیرند.</small>
                </div>
                <ToggleSwitch v-model="form.allowWithdrawResponse" />
              </div>
            </div>
          </div>
          <div class="step-nav">
            <Button label="قبلی" icon="pi pi-arrow-right" severity="secondary" @click="goBack(STEPS.SETTINGS, activateCallback)" />
            <Button label="بعدی" icon="pi pi-arrow-left" iconPos="right" @click="goNext(STEPS.SETTINGS, activateCallback)" />
          </div>
        </StepPanel>

        <StepPanel :value="STEPS.REVIEW" v-slot="{ activateCallback }">
          <div class="step-body">
            <h2 class="step-title">بررسی نهایی</h2>
            <div class="review-block">
              <h3>اطلاعات پایه</h3>
              <div class="review-row"><span>عنوان</span><strong>{{ form.title || '—' }}</strong></div>
              <div class="review-row"><span>توضیحات</span><strong>{{ form.description || '—' }}</strong></div>
            </div>
            <div class="review-block">
              <h3>اقلام ({{ form.items.length }})</h3>
              <DataTable :value="form.items" responsiveLayout="scroll">
                <Column header="محصول">
                  <template #body="{ data }">{{ getProductName(data.productId) }}</template>
                </Column>
                <Column field="quantity" header="تعداد" style="width: 8rem" />
                <Column field="description" header="توضیحات" />
              </DataTable>
            </div>
            <div class="review-block">
              <h3>تنظیمات</h3>
              <div class="review-row"><span>حالت نمایش</span><strong>{{ visibilityLabel }}</strong></div>
              <div class="review-row"><span>اولویت</span><strong>{{ priorityLabel }}</strong></div>
              <div class="review-row"><span>مهلت پاسخ</span><strong>{{ formatDate(form.responseDeadline) }}</strong></div>
              <div class="review-row"><span>محرمانه</span><strong>{{ form.confidential ? 'بله' : 'خیر' }}</strong></div>
              <div class="review-row"><span>بستن خودکار</span><strong>{{ form.autoClose ? 'بله' : 'خیر' }}</strong></div>
            </div>
          </div>
          <div class="step-nav">
            <Button label="قبلی" icon="pi pi-arrow-right" severity="secondary" @click="goBack(STEPS.REVIEW, activateCallback)" />
            <Button label="بعدی" icon="pi pi-arrow-left" iconPos="right" @click="goNext(STEPS.REVIEW, activateCallback)" />
          </div>
        </StepPanel>

        <StepPanel :value="STEPS.SUBMIT" v-slot="{ activateCallback }">
          <div class="step-body submit-body">
            <i class="pi pi-check-circle submit-icon"></i>
            <h2 class="step-title">آماده ثبت</h2>
            <p class="step-hint">استعلام به‌صورت پیش‌نویس ایجاد می‌شود. پس از ایجاد می‌توانید آن را منتشر کنید.</p>
          </div>
          <div class="step-nav">
            <Button label="قبلی" icon="pi pi-arrow-right" severity="secondary" @click="goBack(STEPS.SUBMIT, activateCallback)" />
            <Button label="ثبت استعلام" icon="pi pi-check" :loading="submitting" @click="submitInquiry" />
          </div>
        </StepPanel>
      </StepPanels>
    </Stepper>
  </div>
</template>

<style scoped>
.inquiry-create-page { direction: rtl; }
.page-header { display: flex; align-items: center; justify-content: space-between; gap: 1rem; margin-bottom: 1.5rem; flex-wrap: wrap; }
.page-header-title { display: flex; align-items: center; gap: 0.5rem; }
.page-header-title h1 { font-size: 1.5rem; font-weight: 700; margin: 0; }
.page-header-actions { display: flex; gap: 0.5rem; }
.inquiry-stepper { background: var(--surface-card); border: 1px solid var(--surface-border); border-radius: var(--content-border-radius); padding: 1rem; }
.step-body { padding: 1.5rem 0.5rem; min-height: 240px; }
.step-title { font-size: 1.1rem; font-weight: 700; margin: 0 0 1.25rem; color: var(--text-color); }
.step-hint { color: var(--text-color-secondary); margin: 0 0 1rem; }
.field { display: flex; flex-direction: column; gap: 0.4rem; margin-bottom: 1rem; }
.field label { font-weight: 600; font-size: 0.9rem; }
.field-hint { color: var(--text-color-secondary); font-size: 0.8rem; }
.required { color: var(--p-red-500); }
.w-full { width: 100%; }
.mt-2 { margin-top: 0.75rem; }
.mt-3 { margin-top: 1rem; }
.add-item-row { display: flex; gap: 0.75rem; align-items: flex-end; flex-wrap: wrap; }
.add-item-row .grow { flex: 1 1 220px; margin-bottom: 0; }
.add-item-row .qty { width: 120px; margin-bottom: 0; }
.add-item-row .add-btn { margin-bottom: 0; }
.settings-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem 1.5rem; margin-bottom: 1.5rem; }
.switch-list { display: flex; flex-direction: column; gap: 0.75rem; }
.switch-row { display: flex; align-items: center; justify-content: space-between; gap: 1rem; padding: 0.85rem 1rem; border: 1px solid var(--surface-border); border-radius: var(--content-border-radius); background: var(--surface-ground); }
.switch-label { display: block; font-weight: 600; }
.switch-hint { display: block; color: var(--text-color-secondary); font-size: 0.8rem; }
.review-block { border: 1px solid var(--surface-border); border-radius: var(--content-border-radius); padding: 1rem 1.25rem; margin-bottom: 1rem; }
.review-block h3 { font-size: 0.95rem; font-weight: 700; margin: 0 0 0.75rem; }
.review-row { display: flex; justify-content: space-between; gap: 1rem; padding: 0.35rem 0; border-bottom: 1px dashed var(--surface-border); }
.review-row:last-child { border-bottom: none; }
.review-row span { color: var(--text-color-secondary); }
.submit-body { display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; gap: 0.5rem; }
.submit-icon { font-size: 3rem; color: var(--p-green-500); }
.step-nav { display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; padding-top: 1rem; border-top: 1px solid var(--surface-border); }
@media (max-width: 768px) { .settings-grid { grid-template-columns: 1fr; } }
</style>
