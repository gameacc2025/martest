<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import { inquiriesApi, API_BASE_URL } from '@telecom/api-client'
import { useAuthStore } from '../../../stores/auth'
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import Card from 'primevue/card'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import ProgressSpinner from 'primevue/progressspinner'
import ConfirmDialog from 'primevue/confirmdialog'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const confirm = useConfirm()
const auth = useAuthStore()

const inquiry = ref(null)
const loading = ref(true)
const errored = ref(false)

const showResponseDialog = ref(false)
const responseItems = ref([])
const editingResponseId = ref(null)
const savingResponse = ref(false)
const uploadingResponseId = ref(null)

const statusLabels = {
  DRAFT: 'پیش‌نویس', SUBMITTED: 'ارسال شده', OPEN: 'باز',
  CLOSED: 'بسته شده', EXPIRED: 'منقضی شده', COMPLETED: 'تکمیل شده', CANCELLED: 'لغو شده',
}
const statusSeverity = {
  DRAFT: 'secondary', SUBMITTED: 'info', OPEN: 'success',
  CLOSED: 'warn', EXPIRED: 'danger', COMPLETED: 'success', CANCELLED: 'danger',
}
const responseStatusLabels = {
  PENDING: 'در انتظار', SELECTED: 'انتخاب شده', REJECTED: 'رد شده',
  EXPIRED: 'منقضی شده', WITHDRAWN: 'پس گرفته شده',
}
const responseStatusSeverity = {
  PENDING: 'info', SELECTED: 'success', REJECTED: 'danger',
  EXPIRED: 'warn', WITHDRAWN: 'secondary',
}

const myCompanyId = computed(() => Number(auth.companyId) || null)


const deadlinePassed = computed(() => {
  const d = inquiry.value?.responseDeadline
  return d ? new Date(d) <= new Date() : false
})

const isOpen = computed(() => inquiry.value?.status === 'OPEN' && !inquiry.value?.closedAt)

const myResponse = computed(() => {
  if (!inquiry.value?.responses || !myCompanyId.value) return null
  return inquiry.value.responses.find((r) => r.company?.id === myCompanyId.value) || null
})

const canCreateResponse = computed(() => {
  if (!isOpen.value || deadlinePassed.value) return false
  if (inquiry.value?.company?.id === myCompanyId.value) return false
  const existing = myResponse.value
  return !existing || existing.status === 'WITHDRAWN'
})

function canEditResponse(response) {
  return isOpen.value && !deadlinePassed.value && inquiry.value?.allowEditResponse && response?.status === 'PENDING'
}

function canWithdrawResponse(response) {
  return isOpen.value && !deadlinePassed.value && inquiry.value?.allowWithdrawResponse && response?.status === 'PENDING'
}

function isMyResponse(response) {
  return myCompanyId.value && response.company?.id === myCompanyId.value
}

onMounted(() => fetchInquiry())

async function fetchInquiry() {
  loading.value = true
  errored.value = false
  try {
    const response = await inquiriesApi.getById(route.params.id)
    const body = response?.data ?? response
    inquiry.value = body?.data ?? body
  } catch (err) {
    errored.value = true
    toast.add({ severity: 'error', summary: 'خطا', detail: 'خطا در دریافت اطلاعات استعلام', life: 3000 })
  } finally {
    loading.value = false
  }
}

function openCreateDialog() {
  editingResponseId.value = null
  responseItems.value = (inquiry.value?.items || []).map((item) => ({
    inquiryItemId: item.id,
    price: 0,
    availableQuantity: 0,
    deliveryTime: '',
    description: '',
    productTitle: item.product?.title || '',
  }))
  showResponseDialog.value = true
}

function openEditDialog(response) {
  editingResponseId.value = response.id
  const byItem = new Map((response.items || []).map((ri) => [ri.inquiryItem?.id ?? ri.inquiryItemId, ri]))
  responseItems.value = (inquiry.value?.items || []).map((item) => {
    const existing = byItem.get(item.id)
    return {
      inquiryItemId: item.id,
      price: existing ? Number(existing.price) : 0,
      availableQuantity: existing ? existing.availableQuantity : 0,
      deliveryTime: existing?.deliveryTime || '',
      description: existing?.description || '',
      productTitle: item.product?.title || '',
    }
  })
  showResponseDialog.value = true
}

function validateResponseItems() {
  const valid = responseItems.value.filter((it) => it.price > 0 && it.description && it.deliveryTime)
  if (valid.length === 0) {
    toast.add({ severity: 'warn', summary: 'خطا', detail: 'برای حداقل یک قلم قیمت، زمان تحویل و توضیحات وارد کنید', life: 3500 })
    return null
  }
  return valid.map((it) => ({
    inquiryItemId: it.inquiryItemId,
    price: it.price,
    availableQuantity: it.availableQuantity,
    deliveryTime: it.deliveryTime,
    description: it.description,
  }))
}

async function saveResponse() {
  const items = validateResponseItems()
  if (!items) return
  savingResponse.value = true
  try {
    if (editingResponseId.value) {
      await inquiriesApi.updateResponse(route.params.id, editingResponseId.value, { items })
      toast.add({ severity: 'success', summary: 'موفقیت', detail: 'پاسخ ویرایش شد', life: 3000 })
    } else {
      await inquiriesApi.submitResponse(route.params.id, { items })
      toast.add({ severity: 'success', summary: 'موفقیت', detail: 'پاسخ با موفقیت ارسال شد', life: 3000 })
    }
    showResponseDialog.value = false
    await fetchInquiry()
  } catch (err) {
    toast.add({ severity: 'error', summary: 'خطا', detail: err.message || 'خطا در ثبت پاسخ', life: 3500 })
  } finally {
    savingResponse.value = false
  }
}

function confirmWithdraw(response) {
  confirm.require({
    message: 'آیا از پس‌گرفتن این پاسخ مطمئن هستید؟',
    header: 'پس‌گرفتن پاسخ',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'پس‌گرفتن',
    rejectLabel: 'انصراف',
    acceptClass: 'p-button-danger',
    accept: () => withdrawResponse(response),
  })
}

async function withdrawResponse(response) {
  try {
    await inquiriesApi.withdrawResponse(route.params.id, response.id)
    toast.add({ severity: 'success', summary: 'موفقیت', detail: 'پاسخ پس گرفته شد', life: 3000 })
    await fetchInquiry()
  } catch (err) {
    toast.add({ severity: 'error', summary: 'خطا', detail: err.message || 'خطا در پس‌گرفتن پاسخ', life: 3500 })
  }
}

function triggerUpload(response) {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.pdf,.jpg,.jpeg,.png,.webp,.doc,.docx,.xls,.xlsx'
  input.onchange = () => {
    const file = input.files?.[0]
    if (file) uploadAttachment(response, file)
  }
  input.click()
}

async function uploadAttachment(response, file) {
  uploadingResponseId.value = response.id
  try {
    const formData = new FormData()
    formData.append('file', file)
    await inquiriesApi.uploadResponseAttachment(route.params.id, response.id, formData)
    toast.add({ severity: 'success', summary: 'موفقیت', detail: 'فایل بارگذاری شد', life: 3000 })
    await fetchInquiry()
  } catch (err) {
    toast.add({ severity: 'error', summary: 'خطا', detail: err.message || 'خطا در بارگذاری فایل', life: 3500 })
  } finally {
    uploadingResponseId.value = null
  }
}

async function deleteAttachment(response, attachment) {
  try {
    await inquiriesApi.deleteResponseAttachment(route.params.id, response.id, attachment.id)
    toast.add({ severity: 'success', summary: 'موفقیت', detail: 'فایل حذف شد', life: 3000 })
    await fetchInquiry()
  } catch (err) {
    toast.add({ severity: 'error', summary: 'خطا', detail: err.message || 'خطا در حذف فایل', life: 3500 })
  }
}

function attachmentUrl(url) {
  if (!url) return '#'
  if (/^https?:\/\//.test(url)) return url
  try {
    const origin = new URL(API_BASE_URL, window.location.origin).origin
    return `${origin}${url}`
  } catch {
    return url
  }
}

function formatPrice(price) {
  return new Intl.NumberFormat('fa-IR', { style: 'currency', currency: 'IRR' }).format(price)
}
</script>

<template>
  <div class="inquiry-detail-page">
    <ConfirmDialog />
    <div class="page-header">
      <div>
        <Button icon="pi pi-arrow-right" text @click="router.push({ name: 'company-inquiries' })" />
        <h1>جزئیات استعلام</h1>
      </div>
      <div class="page-header-actions" v-if="canCreateResponse">
        <Button label="ارسال پاسخ" icon="pi pi-send" @click="openCreateDialog" />
      </div>
    </div>

    <div v-if="loading" class="text-center py-8">
      <ProgressSpinner />
    </div>

    <div v-else-if="errored" class="state-block">
      <i class="pi pi-exclamation-triangle state-icon" style="color: var(--p-red-500)"></i>
      <h3>خطا در دریافت اطلاعات</h3>
      <p>دریافت جزئیات استعلام با مشکل مواجه شد.</p>
      <div class="flex gap-2">
        <Button label="تلاش مجدد" icon="pi pi-refresh" @click="fetchInquiry" />
        <Button label="بازگشت" icon="pi pi-arrow-right" severity="secondary" text @click="router.push({ name: 'company-inquiries' })" />
      </div>
    </div>

    <div v-else-if="inquiry" class="detail-grid">
      <Card class="detail-card">
        <template #title>اطلاعات استعلام</template>
        <template #content>
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">عنوان</span>
              <span class="info-value">{{ inquiry.title }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">شرکت درخواست‌کننده</span>
              <span class="info-value">{{ inquiry.company?.name }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">وضعیت</span>
              <Tag :value="statusLabels[inquiry.status]" :severity="statusSeverity[inquiry.status]" />
            </div>
            <div class="info-item">
              <span class="info-label">تاریخ ایجاد</span>
              <span class="info-value">{{ new Date(inquiry.createdAt).toLocaleDateString('fa-IR') }}</span>
            </div>
            <div class="info-item" v-if="inquiry.description">
              <span class="info-label">توضیحات</span>
              <span class="info-value">{{ inquiry.description }}</span>
            </div>
            <div class="info-item" v-if="inquiry.responseDeadline">
              <span class="info-label">مهلت پاسخ</span>
              <span class="info-value" :class="{ 'text-danger': deadlinePassed }">
                {{ new Date(inquiry.responseDeadline).toLocaleString('fa-IR') }}
                <Tag v-if="deadlinePassed" value="گذشته" severity="danger" class="ms-1" />
              </span>
            </div>
          </div>
        </template>
      </Card>

      <Card class="detail-card">
        <template #title>اقلام درخواست ({{ inquiry.items?.length || 0 }})</template>
        <template #content>
          <DataTable :value="inquiry.items || []" responsiveLayout="scroll">
            <Column field="product.title" header="محصول"></Column>
            <Column field="quantity" header="تعداد"></Column>
            <Column field="description" header="توضیحات"></Column>
          </DataTable>
        </template>
      </Card>

      <Card class="detail-card" v-if="inquiry.responses?.length">
        <template #title>پاسخ‌ها ({{ inquiry.responses.length }})</template>
        <template #content>
          <div v-for="response in inquiry.responses" :key="response.id" class="response-card">
            <div class="response-header">
              <div class="response-header-info">
                <span class="font-semibold">{{ response.company?.name }}</span>
                <Tag :value="responseStatusLabels[response.status] || response.status" :severity="responseStatusSeverity[response.status] || 'info'" />
                <Tag v-if="isMyResponse(response)" value="پاسخ شما" severity="contrast" />
              </div>
              <div class="response-actions" v-if="isMyResponse(response)">
                <Button v-if="canEditResponse(response)" label="ویرایش" icon="pi pi-pencil" size="small" text @click="openEditDialog(response)" />
                <Button v-if="canEditResponse(response)" label="افزودن فایل" icon="pi pi-paperclip" size="small" text :loading="uploadingResponseId === response.id" @click="triggerUpload(response)" />
                <Button v-if="canWithdrawResponse(response)" label="انصراف" icon="pi pi-times-circle" size="small" text severity="danger" @click="confirmWithdraw(response)" />
              </div>
            </div>
            <DataTable :value="response.items || []" responsiveLayout="scroll" size="small">
              <Column header="محصول">
                <template #body="{ data }">{{ data.inquiryItem?.product?.title || '-' }}</template>
              </Column>
              <Column field="price" header="قیمت">
                <template #body="{ data }">{{ formatPrice(data.price) }}</template>
              </Column>
              <Column field="availableQuantity" header="تعداد موجود"></Column>
              <Column field="deliveryTime" header="زمان تحویل"></Column>
              <Column field="description" header="توضیحات"></Column>
            </DataTable>
            <div v-if="response.attachments?.length" class="attachments">
              <span class="attachments-label"><i class="pi pi-paperclip"></i> فایل‌های پیوست:</span>
              <div class="attachment-list">
                <div v-for="att in response.attachments" :key="att.id" class="attachment-chip">
                  <a :href="attachmentUrl(att.url)" target="_blank" rel="noopener">
                    <i class="pi pi-file"></i> {{ att.filename }}
                  </a>
                  <Button v-if="isMyResponse(response) && canEditResponse(response)" icon="pi pi-times" text rounded size="small" severity="danger" @click="deleteAttachment(response, att)" />
                </div>
              </div>
            </div>
          </div>
        </template>
      </Card>

      <Card class="detail-card" v-if="inquiry.statusHistory?.length">
        <template #title>تاریخچه وضعیت</template>
        <template #content>
          <DataTable :value="inquiry.statusHistory" responsiveLayout="scroll" size="small">
            <Column header="از وضعیت">
              <template #body="{ data }">
                <Tag :value="statusLabels[data.previousStatus]" :severity="statusSeverity[data.previousStatus]" size="small" />
              </template>
            </Column>
            <Column header="به وضعیت">
              <template #body="{ data }">
                <Tag :value="statusLabels[data.newStatus]" :severity="statusSeverity[data.newStatus]" size="small" />
              </template>
            </Column>
            <Column header="تغییر دهنده">
              <template #body="{ data }">{{ data.changedBy?.fullName || '-' }}</template>
            </Column>
            <Column field="comment" header="توضیحات"></Column>
            <Column header="تاریخ">
              <template #body="{ data }">{{ new Date(data.createdAt).toLocaleDateString('fa-IR') }}</template>
            </Column>
          </DataTable>
        </template>
      </Card>
    </div>

    <Dialog v-model:visible="showResponseDialog" :header="editingResponseId ? 'ویرایش پاسخ' : 'ارسال پاسخ'" :modal="true" :style="{ width: '700px' }">
      <div v-for="(item, index) in responseItems" :key="index" class="response-item-form">
        <h4 class="mb-2">{{ item.productTitle }}</h4>
        <div class="grid grid-cols-2 gap-4">
          <div class="field">
            <label>قیمت (ریال)</label>
            <InputNumber v-model="item.price" :min="0" class="w-full" />
          </div>
          <div class="field">
            <label>تعداد موجود</label>
            <InputNumber v-model="item.availableQuantity" :min="0" class="w-full" />
          </div>
          <div class="field">
            <label>زمان تحویل</label>
            <InputText v-model="item.deliveryTime" placeholder="مثلاً ۳ روز کاری" class="w-full" />
          </div>
          <div class="field">
            <label>توضیحات</label>
            <InputText v-model="item.description" placeholder="توضیحات پاسخ" class="w-full" />
          </div>
        </div>
      </div>
      <template #footer>
        <Button label="انصراف" icon="pi pi-times" severity="secondary" text @click="showResponseDialog = false" />
        <Button :label="editingResponseId ? 'ذخیره تغییرات' : 'ارسال پاسخ'" icon="pi pi-check" :loading="savingResponse" @click="saveResponse" />
      </template>
    </Dialog>
  </div>
</template>

<style scoped>
.inquiry-detail-page {
  direction: rtl;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
}

.page-header h1 {
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0;
  display: inline;
  margin-inline-start: 0.5rem;
}

.detail-grid {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.info-label {
  font-size: 0.875rem;
  color: var(--text-color-secondary);
}

.info-value {
  font-weight: 600;
}

.text-danger {
  color: var(--p-red-500);
}

.ms-1 {
  margin-inline-start: 0.5rem;
}

.response-card {
  border: 1px solid var(--surface-border);
  border-radius: var(--content-border-radius);
  padding: 1rem;
  margin-bottom: 1rem;
}

.response-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}

.response-header-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.response-actions {
  display: flex;
  gap: 0.25rem;
  flex-wrap: wrap;
}

.response-item-form {
  border: 1px solid var(--surface-border);
  border-radius: var(--content-border-radius);
  padding: 1rem;
  margin-bottom: 1rem;
}

.attachments {
  margin-top: 1rem;
  padding-top: 0.75rem;
  border-top: 1px dashed var(--surface-border);
}

.attachments-label {
  display: block;
  font-size: 0.85rem;
  color: var(--text-color-secondary);
  margin-bottom: 0.5rem;
}

.attachment-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.attachment-chip {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.5rem;
  border: 1px solid var(--surface-border);
  border-radius: var(--content-border-radius);
  background: var(--surface-ground);
}

.attachment-chip a {
  color: var(--primary-color);
  text-decoration: none;
  font-size: 0.85rem;
}

.state-block {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 3rem 1rem;
  text-align: center;
}

.state-icon {
  font-size: 2.5rem;
  color: var(--text-color-secondary);
  margin-bottom: 0.25rem;
}

.state-block h3 {
  margin: 0;
  font-size: 1.05rem;
}

.state-block p {
  margin: 0 0 0.75rem;
  color: var(--text-color-secondary);
  font-size: 0.9rem;
  max-width: 24rem;
}

@media (max-width: 640px) {
  .info-grid {
    grid-template-columns: 1fr;
  }
}
</style>
