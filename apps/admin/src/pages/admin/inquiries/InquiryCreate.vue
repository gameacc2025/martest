<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import { inquiriesApi, productsApi } from '@telecom/api-client'

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
import WorkspacePageHeading from '@telecom/shared-ui/components/common/WorkspacePageHeading.vue'

const router = useRouter()
const toast = useToast()

// ── Wizard state ─────────────────────────────────────────────
const STEPS = {
  BASIC: '1',
  PRODUCTS: '2',
  SETTINGS: '3',
  REVIEW: '4',
  SUBMIT: '5',
}
const activeStep = ref(STEPS.BASIC)
const stepLabels = {
  [STEPS.BASIC]: 'اطلاعات پایه',
  [STEPS.PRODUCTS]: 'انتخاب اقلام',
  [STEPS.SETTINGS]: 'تنظیمات استعلام',
  [STEPS.REVIEW]: 'بررسی نهایی',
  [STEPS.SUBMIT]: 'ثبت درخواست',
}
const activeStepLabel = computed(() => stepLabels[activeStep.value] || stepLabels[STEPS.BASIC])
const stepProgress = computed(() => (Number(activeStep.value) / Object.keys(STEPS).length) * 100)

const DRAFT_KEY = 'inquiry-create-draft'

// ── Form model ───────────────────────────────────────────────
const form = reactive({
  // Step 1 — basic information
  title: '',
  description: '',
  // Step 2 — products / items
  items: [],
  // Step 3 — settings
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

// ── Reference data ───────────────────────────────────────────
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
  { label: 'عادی (Normal)', value: 'NORMAL', hint: 'پاسخ‌ها برای همه قابل مشاهده است.' },
  { label: 'دربسته (Sealed)', value: 'SEALED', hint: 'پاسخ‌ها تا پایان مهلت مخفی می‌مانند.' },
  { label: 'ناشناس دربسته (Anonymous)', value: 'ANONYMOUS_SEALED', hint: 'پاسخ‌ها مخفی و هویت پاسخ‌دهندگان ناشناس است.' },
]

onMounted(() => {
  restoreDraft()
  fetchProducts()
})

async function fetchProducts() {
  loadingProducts.value = true
  try {
    const response = await productsApi.list({ limit: 100, status: 'PUBLISHED' })
    // The list endpoint body is { data: [...], meta: {...} }; raw api.get
    // exposes that body under response.data.
    const body = response?.data ?? response
    products.value = Array.isArray(body?.data) ? body.data : Array.isArray(body) ? body : []
  } catch (err) {
    toast.add({ severity: 'error', summary: 'خطا', detail: 'خطا در دریافت محصولات', life: 3000 })
  } finally {
    loadingProducts.value = false
  }
}

// ── Helpers ──────────────────────────────────────────────────
function getProductName(id) {
  return products.value.find((p) => p.id === id)?.title || '-'
}

const priorityLabel = computed(() => priorityOptions.find((o) => o.value === form.priority)?.label || '-')
const visibilityLabel = computed(() => visibilityOptions.find((o) => o.value === form.visibilityMode)?.label || '-')

function formatDate(value) {
  if (!value) return '—'
  try {
    return new Date(value).toLocaleString('fa-IR')
  } catch {
    return value
  }
}

// ── Item management (Step 2) ─────────────────────────────────
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

function removeItem(index) {
  form.items.splice(index, 1)
}

// ── Per-step validation ──────────────────────────────────────
function validateStep(step) {
  if (step === STEPS.BASIC) {
    if (!form.title?.trim()) {
      toast.add({ severity: 'warn', summary: 'خطا', detail: 'عنوان درخواست الزامی است', life: 3000 })
      return false
    }
    return true
  }

  if (step === STEPS.PRODUCTS) {
    if (form.items.length === 0) {
      toast.add({ severity: 'warn', summary: 'خطا', detail: 'حداقل یک قلم کالا اضافه کنید', life: 3000 })
      return false
    }
    if (form.items.some((it) => !it.quantity || it.quantity < 1)) {
      toast.add({ severity: 'warn', summary: 'خطا', detail: 'تعداد هر قلم باید حداقل ۱ باشد', life: 3000 })
      return false
    }
    return true
  }

  if (step === STEPS.SETTINGS) {
    if (form.responseDeadline && new Date(form.responseDeadline) <= new Date()) {
      toast.add({ severity: 'warn', summary: 'خطا', detail: 'مهلت پاسخ باید در آینده باشد', life: 3000 })
      return false
    }
    if (
      form.publishDate &&
      form.responseDeadline &&
      new Date(form.publishDate) >= new Date(form.responseDeadline)
    ) {
      toast.add({ severity: 'warn', summary: 'خطا', detail: 'تاریخ انتشار باید پیش از مهلت پاسخ باشد', life: 3000 })
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

// ── Draft saving ─────────────────────────────────────────────
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
      // Older drafts used step 3 for target-company selection and step 4 for settings.
      // Target-company IDs were never part of the API contract, so discard that
      // no-op field while preserving all other draft data and the nearest valid step.
      delete form.targetCompanyIds
      const legacyStepMap = { '1': STEPS.BASIC, '2': STEPS.PRODUCTS, '3': STEPS.SETTINGS, '4': STEPS.SETTINGS, '5': STEPS.REVIEW, '6': STEPS.SUBMIT }
      if (parsed.activeStep) activeStep.value = legacyStepMap[String(parsed.activeStep)] || STEPS.BASIC
      toast.add({ severity: 'info', summary: 'پیش‌نویس', detail: 'پیش‌نویس قبلی بازیابی شد', life: 2500 })
    }
  } catch {
    /* ignore malformed draft */
  }
}

function clearDraft() {
  localStorage.removeItem(DRAFT_KEY)
}

// ── Final submit (Step 6) ────────────────────────────────────
async function submitInquiry() {
  // Re-run all blocking validations before creating.
  if (!validateStep(STEPS.BASIC) || !validateStep(STEPS.PRODUCTS) || !validateStep(STEPS.SETTINGS)) {
    return
  }

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
    toast.add({ severity: 'success', summary: 'موفقیت', detail: 'درخواست استعلام ایجاد شد', life: 3000 })
    router.push({ name: 'admin-inquiries' })
  } catch (err) {
    toast.add({ severity: 'error', summary: 'خطا', detail: err.message || 'خطا در ایجاد درخواست', life: 3000 })
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="inquiry-create-page">
    <WorkspacePageHeading
      heading-id="inquiry-create-title"
      icon="pi pi-file-edit"
      eyebrow="مدیریت درخواست‌های بازارگاه"
      title="ایجاد درخواست استعلام"
      description="مشخصات درخواست، اقلام موردنیاز و شرایط پاسخ‌گویی را در چند گام تکمیل کنید."
    >
      <template #actions>
        <Button icon="pi pi-arrow-right" text rounded aria-label="بازگشت به فهرست استعلام‌ها" @click="router.push({ name: 'admin-inquiries' })" />
        <Button label="ذخیره پیش‌نویس" icon="pi pi-save" severity="secondary" outlined @click="saveDraft" />
        <Button label="انصراف" icon="pi pi-times" severity="secondary" text @click="router.push({ name: 'admin-inquiries' })" />
      </template>
    </WorkspacePageHeading>

    <section class="inquiry-progress-card" aria-label="پیشرفت ایجاد استعلام">
      <div class="inquiry-progress-copy">
        <div>
          <span>مرحله {{ activeStep }} از {{ Object.keys(STEPS).length }}</span>
          <strong>{{ activeStepLabel }}</strong>
        </div>
        <span class="inquiry-progress-item-count">
          <i class="pi pi-box"></i>
          {{ form.items.length.toLocaleString('fa-IR') }} قلم انتخاب شده
        </span>
      </div>
      <div
        class="inquiry-progress-track"
        role="progressbar"
        :aria-valuenow="stepProgress"
        aria-valuemin="0"
        aria-valuemax="100"
        :aria-label="`پیشرفت ${Math.round(stepProgress)} درصد`"
      >
        <span :style="{ width: stepProgress + '%' }"></span>
      </div>
    </section>

    <Stepper v-model:value="activeStep" class="inquiry-stepper" linear>
      <StepList>
        <Step :value="STEPS.BASIC">اطلاعات</Step>
        <Step :value="STEPS.PRODUCTS">محصولات</Step>
        <Step :value="STEPS.SETTINGS">تنظیمات</Step>
        <Step :value="STEPS.REVIEW">بررسی</Step>
        <Step :value="STEPS.SUBMIT">ثبت</Step>
      </StepList>

      <StepPanels>
        <!-- ── Step 1: Basic Information ───────────────────── -->
        <StepPanel :value="STEPS.BASIC" v-slot="{ activateCallback }">
          <div class="step-body">
            <h2 class="step-title">اطلاعات پایه</h2>
            <div class="field">
              <label for="inquiry-title">عنوان درخواست <span class="required">*</span></label>
              <InputText id="inquiry-title" v-model="form.title" class="w-full" placeholder="مثلاً: استعلام قیمت روتر صنعتی" />
            </div>
            <div class="field">
              <label for="inquiry-description">توضیحات</label>
              <Textarea id="inquiry-description" v-model="form.description" rows="4" class="w-full" placeholder="توضیحات تکمیلی درخواست..." />
            </div>
          </div>
          <div class="step-nav">
            <span></span>
            <Button label="بعدی" icon="pi pi-arrow-left" iconPos="right" @click="goNext(STEPS.BASIC, activateCallback)" />
          </div>
        </StepPanel>

        <!-- ── Step 2: Products ───────────────────────────── -->
        <StepPanel :value="STEPS.PRODUCTS" v-slot="{ activateCallback }">
          <div class="step-body">
            <h2 class="step-title">اقلام کالا</h2>
            <div class="add-item-row">
              <div class="field grow">
                <label for="inquiry-product">محصول</label>
                <Select
                  inputId="inquiry-product"
                  v-model="newItem.productId"
                  :options="products"
                  optionLabel="title"
                  optionValue="id"
                  :loading="loadingProducts"
                  filter
                  placeholder="انتخاب محصول"
                  class="w-full"
                />
              </div>
              <div class="field qty">
                <label for="inquiry-quantity">تعداد</label>
                <InputNumber inputId="inquiry-quantity" v-model="newItem.quantity" :min="1" class="w-full" />
              </div>
              <div class="field grow">
                <label for="inquiry-item-description">توضیحات</label>
                <InputText id="inquiry-item-description" v-model="newItem.description" placeholder="اختیاری" class="w-full" />
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
                  <Button icon="pi pi-trash" severity="danger" rounded text :aria-label="'حذف قلم ' + (index + 1)" @click="removeItem(index)" />
                </template>
              </Column>
            </DataTable>
            <Message severity="info" :closable="false" class="mt-2">
              پس از انتشار استعلام، اعلان برای شرکت‌هایی ارسال می‌شود که مالک محصولات انتخاب‌شده هستند؛ انتخاب دستی شرکت هدف در این جریان پشتیبانی نمی‌شود.
            </Message>
          </div>
          <div class="step-nav">
            <Button label="قبلی" icon="pi pi-arrow-right" severity="secondary" @click="goBack(STEPS.PRODUCTS, activateCallback)" />
            <Button label="بعدی" icon="pi pi-arrow-left" iconPos="right" @click="goNext(STEPS.PRODUCTS, activateCallback)" />
          </div>
        </StepPanel>

        <!-- ── Step 3: Settings ───────────────────────────── -->
        <StepPanel :value="STEPS.SETTINGS" v-slot="{ activateCallback }">
          <div class="step-body">
            <h2 class="step-title">تنظیمات استعلام</h2>

            <div class="settings-grid">
              <div class="field">
                <label for="inquiry-visibility">حالت نمایش (Visibility)</label>
                <Select
                  inputId="inquiry-visibility"
                  v-model="form.visibilityMode"
                  :options="visibilityOptions"
                  optionLabel="label"
                  optionValue="value"
                  class="w-full"
                />
                <small class="field-hint">
                  {{ visibilityOptions.find((o) => o.value === form.visibilityMode)?.hint }}
                </small>
              </div>

              <div class="field">
                <label for="inquiry-priority">اولویت (Priority)</label>
                <Select
                  inputId="inquiry-priority"
                  v-model="form.priority"
                  :options="priorityOptions"
                  optionLabel="label"
                  optionValue="value"
                  class="w-full"
                />
              </div>

              <div class="field">
                <label for="inquiry-deadline">مهلت پاسخ (Deadline)</label>
                <InputText id="inquiry-deadline" v-model="form.responseDeadline" type="datetime-local" class="w-full" />
              </div>

              <div class="field">
                <label for="inquiry-publish-date">تاریخ انتشار (Publish Date)</label>
                <InputText id="inquiry-publish-date" v-model="form.publishDate" type="datetime-local" class="w-full" />
              </div>
            </div>

            <div class="switch-list">
              <div class="switch-row">
                <div>
                  <span class="switch-label">محرمانه (Confidential)</span>
                  <small class="switch-hint">استعلام به‌صورت محرمانه علامت‌گذاری می‌شود.</small>
                </div>
                <ToggleSwitch v-model="form.confidential" aria-label="محرمانه بودن استعلام" />
              </div>
              <div class="switch-row">
                <div>
                  <span class="switch-label">بستن خودکار (Auto Close)</span>
                  <small class="switch-hint">استعلام پس از پایان مهلت به‌صورت خودکار بسته شود.</small>
                </div>
                <ToggleSwitch v-model="form.autoClose" aria-label="بستن خودکار استعلام" />
              </div>
              <div class="switch-row">
                <div>
                  <span class="switch-label">اجازه ویرایش پاسخ</span>
                  <small class="switch-hint">پاسخ‌دهندگان بتوانند پاسخ خود را ویرایش کنند.</small>
                </div>
                <ToggleSwitch v-model="form.allowEditResponse" aria-label="اجازه ویرایش پاسخ" />
              </div>
              <div class="switch-row">
                <div>
                  <span class="switch-label">اجازه پس‌گرفتن پاسخ</span>
                  <small class="switch-hint">پاسخ‌دهندگان بتوانند پاسخ خود را پس بگیرند.</small>
                </div>
                <ToggleSwitch v-model="form.allowWithdrawResponse" aria-label="اجازه پس‌گرفتن پاسخ" />
              </div>
              <div v-if="form.visibilityMode !== 'NORMAL'" class="switch-row">
                <div>
                  <span class="switch-label">اجازه افشای زودهنگام</span>
                  <small class="switch-hint">امکان افشای پاسخ‌های دربسته پیش از پایان مهلت.</small>
                </div>
                <ToggleSwitch v-model="form.allowEarlyReveal" aria-label="اجازه افشای زودهنگام پاسخ‌ها" />
              </div>
            </div>
          </div>
          <div class="step-nav">
            <Button label="قبلی" icon="pi pi-arrow-right" severity="secondary" @click="goBack(STEPS.SETTINGS, activateCallback)" />
            <Button label="بعدی" icon="pi pi-arrow-left" iconPos="right" @click="goNext(STEPS.SETTINGS, activateCallback)" />
          </div>
        </StepPanel>

        <!-- ── Step 4: Review ─────────────────────────────── -->
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
              <div class="review-row"><span>تاریخ انتشار</span><strong>{{ formatDate(form.publishDate) }}</strong></div>
              <div class="review-row"><span>محرمانه</span><strong>{{ form.confidential ? 'بله' : 'خیر' }}</strong></div>
              <div class="review-row"><span>بستن خودکار</span><strong>{{ form.autoClose ? 'بله' : 'خیر' }}</strong></div>
              <div class="review-row"><span>اجازه ویرایش پاسخ</span><strong>{{ form.allowEditResponse ? 'بله' : 'خیر' }}</strong></div>
              <div class="review-row"><span>اجازه پس‌گرفتن پاسخ</span><strong>{{ form.allowWithdrawResponse ? 'بله' : 'خیر' }}</strong></div>
            </div>
          </div>
          <div class="step-nav">
            <Button label="قبلی" icon="pi pi-arrow-right" severity="secondary" @click="goBack(STEPS.REVIEW, activateCallback)" />
            <Button label="بعدی" icon="pi pi-arrow-left" iconPos="right" @click="goNext(STEPS.REVIEW, activateCallback)" />
          </div>
        </StepPanel>

        <!-- ── Step 5: Submit ─────────────────────────────── -->
        <StepPanel :value="STEPS.SUBMIT" v-slot="{ activateCallback }">
          <div class="step-body submit-body">
            <i class="pi pi-check-circle submit-icon"></i>
            <h2 class="step-title">آماده ثبت</h2>
            <p class="step-hint">
              استعلام به‌صورت پیش‌نویس (DRAFT) ایجاد می‌شود. پس از ایجاد می‌توانید آن را از فهرست استعلام‌ها منتشر کنید.
            </p>
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
.inquiry-create-page {
  direction: rtl;
}

.inquiry-stepper {
  background: var(--tm-surface);
  border: 1px solid var(--tm-line);
  border-radius: var(--tm-radius-lg);
  padding: 1rem;
}

.step-body {
  padding: 1.5rem 0.5rem;
  min-height: 240px;
}

.step-title {
  font-size: 1.1rem;
  font-weight: 700;
  margin: 0 0 1.25rem;
  color: var(--tm-ink);
}

.step-hint {
  color: var(--tm-muted);
  margin: 0 0 1rem;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  margin-bottom: 1rem;
}

.field label {
  font-weight: 600;
  font-size: 0.9rem;
}

.field-hint {
  color: var(--tm-muted);
  font-size: 0.8rem;
}

.required {
  color: var(--tm-red);
}

.w-full {
  width: 100%;
}

.mt-2 {
  margin-top: 0.75rem;
}

.mt-3 {
  margin-top: 1rem;
}

.add-item-row {
  display: flex;
  gap: 0.75rem;
  align-items: flex-end;
  flex-wrap: wrap;
}

.add-item-row .grow {
  flex: 1 1 220px;
  margin-bottom: 0;
}

.add-item-row .qty {
  width: 120px;
  margin-bottom: 0;
}

.add-item-row .add-btn {
  margin-bottom: 0;
}

.settings-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem 1.5rem;
  margin-bottom: 1.5rem;
}

.switch-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.switch-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.85rem 1rem;
  border: 1px solid var(--tm-line);
  border-radius: var(--tm-radius-lg);
  background: var(--tm-canvas);
}

.switch-label {
  display: block;
  font-weight: 600;
}

.switch-hint {
  display: block;
  color: var(--tm-muted);
  font-size: 0.8rem;
}

.review-block {
  border: 1px solid var(--tm-line);
  border-radius: var(--tm-radius-lg);
  padding: 1rem 1.25rem;
  margin-bottom: 1rem;
}

.review-block h3 {
  font-size: 0.95rem;
  font-weight: 700;
  margin: 0 0 0.75rem;
}

.review-row {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.35rem 0;
  border-bottom: 1px dashed var(--tm-line);
}

.review-row:last-child {
  border-bottom: none;
}

.review-row span {
  color: var(--tm-muted);
}

.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.submit-body {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  gap: 0.5rem;
}

.submit-icon {
  font-size: 3rem;
  color: var(--p-green-500);
}

.step-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  padding-top: 1rem;
  border-top: 1px solid var(--tm-line);
}

@media (max-width: 768px) {
  .settings-grid {
    grid-template-columns: 1fr;
  }
}

/* Multi-step inquiry form: consistent panel, fields and action hierarchy. */
.inquiry-create-page { display: flex; flex-direction: column; gap: 16px; }

.inquiry-create-page .inquiry-stepper {
  border-color: var(--tm-line);
  border-radius: var(--tm-radius-lg);
  box-shadow: 0 1px 2px rgba(20, 35, 63, 0.05);
  padding: clamp(1rem, 2vw, 1.75rem);
}

.inquiry-create-page .step-body {
  padding: 20px 10px;
}

.inquiry-create-page .step-title {
  padding-bottom: 10px;
  border-bottom: 1px solid var(--tm-line);
  font-size: 14px;
}

.inquiry-create-page .field label {
  color: var(--tm-ink);
  font-size: 12.5px;
}

.inquiry-create-page .step-nav {
  padding-top: 12px;
  border-top: 1px solid var(--tm-line);
}

/* Guided inquiry authoring: explicit context and readable multi-step progress. */
.inquiry-progress-card {
  display: grid;
  gap: .8rem;
  padding: 1rem 1.25rem;
  border: 1px solid var(--tm-line);
  border-radius: var(--tm-radius-lg);
  background: var(--tm-surface);
  box-shadow: 0 1px 2px rgba(20, 35, 63, 0.05);
}

.inquiry-progress-copy {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.inquiry-progress-copy > div { display: grid; gap: .15rem; }

.inquiry-progress-copy > div > span {
  color: var(--tm-blue);
  font-size: 11.5px;
  font-weight: 700;
}

.inquiry-progress-copy strong {
  color: var(--tm-ink);
  font-size: 12.5px;
}

.inquiry-progress-item-count {
  display: inline-flex;
  align-items: center;
  gap: .4rem;
  color: var(--tm-muted);
  font-size: 11.5px;
  white-space: nowrap;
}

.inquiry-progress-item-count i { color: var(--tm-blue); }

.inquiry-progress-track {
  height: .4rem;
  overflow: hidden;
  border-radius: 999px;
  background: var(--tm-surface-alt);
}

.inquiry-progress-track > span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: var(--tm-blue);
  transition: width var(--ds-transition);
}

.inquiry-create-page .inquiry-stepper { overflow: hidden; }

.inquiry-create-page :deep(.p-steplist) {
  gap: .35rem;
  padding: .75rem;
  border: 1px solid var(--tm-line);
  border-radius: var(--tm-radius-lg);
  background: var(--tm-surface-alt);
}

.inquiry-create-page :deep(.p-step) { min-width: 0; }

.inquiry-create-page :deep(.p-step-number) {
  width: 2.75rem;
  height: 2.75rem;
  min-width: 2.75rem;
  min-height: 2.75rem;
  border-color: var(--tm-line);
  background: var(--tm-surface);
  color: var(--tm-muted);
}

.inquiry-create-page :deep(.p-step-active .p-step-number) {
  border-color: var(--tm-blue);
  background: var(--tm-blue);
  color: #fff;
}

.inquiry-create-page :deep(.p-step-title) {
  color: var(--tm-muted);
  font-size: 11.5px;
  font-weight: 600;
}

.inquiry-create-page :deep(.p-step-active .p-step-title) { color: var(--tm-blue); }

.inquiry-create-page :deep(.p-stepper-separator) { background: var(--tm-line); }

.inquiry-create-page :deep(.p-steppanels) { background: transparent; padding: 0; }

.inquiry-create-page :deep(.p-steppanel) { padding: 0; }

.inquiry-create-page .step-body { max-width: 68rem; margin-inline: auto; }

.inquiry-create-page .field { min-width: 0; }

.inquiry-create-page :deep(.p-inputtext),
.inquiry-create-page :deep(.p-textarea),
.inquiry-create-page :deep(.p-select),
.inquiry-create-page :deep(.p-inputnumber),
.inquiry-create-page :deep(.p-inputnumber-input) { width: 100%; }

.inquiry-create-page :deep(.p-inputtext),
.inquiry-create-page :deep(.p-textarea),
.inquiry-create-page :deep(.p-select),
.inquiry-create-page :deep(.p-inputnumber-input) {
  border-color: var(--tm-line);
  border-radius: var(--tm-radius);
}

.inquiry-create-page .switch-row,
.inquiry-create-page .review-block {
  border-color: var(--tm-line);
  border-radius: var(--tm-radius-lg);
  background: var(--tm-surface-alt);
}

.inquiry-create-page .review-block { background: var(--tm-surface); }

.inquiry-create-page .review-row { border-color: var(--tm-line); }

.inquiry-create-page .step-nav :deep(.p-button),
.inquiry-create-page .add-item-row :deep(.p-button) {
  min-height: 2.75rem;
}

.inquiry-create-page :deep(.p-inputtext:focus-visible),
.inquiry-create-page :deep(.p-textarea:focus-visible),
.inquiry-create-page :deep(.p-select:focus-visible),
.inquiry-create-page :deep(.p-inputnumber-input:focus-visible),
.inquiry-create-page :deep(.p-button:focus-visible),
.inquiry-create-page :deep(.p-toggleswitch):focus-visible {
  outline: 2px solid var(--tm-cyan-strong);
  outline-offset: 2px;
}

@media (max-width: 640px) {
  .inquiry-create-page .add-item-row { display: grid; grid-template-columns: minmax(0, 1fr); }
.inquiry-create-page .add-item-row .field { width: 100%; min-width: 0; }
.inquiry-create-page .step-nav { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: .65rem; }
.inquiry-create-page .step-nav :deep(.p-button) { width: 100%; justify-content: center; }
}

@media (max-width: 640px) {
  .inquiry-progress-card { padding: .9rem 1rem; }
.inquiry-progress-copy { align-items: flex-start; flex-direction: column; gap: .45rem; }
.inquiry-create-page :deep(.p-steplist) { overflow-x: auto; justify-content: flex-start; }
.inquiry-create-page :deep(.p-step) { flex: 0 0 auto; }
}

.inquiry-create-page .inquiry-stepper { box-shadow: 0 1px 3px rgba(20, 35, 63, 0.06); }

.inquiry-create-page .step-title { font-size: .95rem; }

.inquiry-create-page .field label { font-size: .78rem; }

.inquiry-create-page .step-body { padding: 1.1rem .5rem; }
</style>
