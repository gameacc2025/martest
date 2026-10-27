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
import Textarea from 'primevue/textarea'
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
const messages = ref([])
const messageDraft = ref('')
const recipientCompanyId = ref(null)
const notifyBySms = ref(false)
const smsAvailable = ref(false)
const loadingMessages = ref(false)
const sendingMessage = ref(false)

const showResponseDialog = ref(false)
const responseItems = ref([])
const editingResponseId = ref(null)
const savingResponse = ref(false)
const uploadingResponseId = ref(null)
const decidingResponseId = ref(null)

const statusLabels = {
  DRAFT: 'پیش‌نویس', SUBMITTED: 'ارسال شده', OPEN: 'باز',
  CLOSED: 'بسته شده', EXPIRED: 'منقضی شده', COMPLETED: 'تکمیل شده', CANCELLED: 'لغو شده',
}
const statusSeverity = {
  DRAFT: 'secondary', SUBMITTED: 'info', OPEN: 'success',
  CLOSED: 'warn', EXPIRED: 'danger', COMPLETED: 'success', CANCELLED: 'danger',
}
const statusIcons = {
  DRAFT: 'pi-file-edit', SUBMITTED: 'pi-send', OPEN: 'pi-circle-fill',
  CLOSED: 'pi-lock', EXPIRED: 'pi-clock', COMPLETED: 'pi-check-circle', CANCELLED: 'pi-times-circle',
}
const responseStatusLabels = {
  PENDING: 'در انتظار', SELECTED: 'انتخاب شده', REJECTED: 'رد شده',
  EXPIRED: 'منقضی شده', WITHDRAWN: 'پس گرفته شده',
}
const responseStatusSeverity = {
  PENDING: 'info', SELECTED: 'success', REJECTED: 'danger',
  EXPIRED: 'warn', WITHDRAWN: 'secondary',
}

const PRIORITY_LABELS = { LOW: 'کم', NORMAL: 'عادی', HIGH: 'زیاد', URGENT: 'فوری' }
const PRIORITY_SEVERITY = { LOW: 'secondary', NORMAL: 'info', HIGH: 'warn', URGENT: 'danger' }

const myCompanyId = computed(() => Number(auth.companyId) || null)
const isInquiryBuyer = computed(() => Boolean(myCompanyId.value && Number(inquiry.value?.company?.id) === myCompanyId.value))
const canUseInquiryMessages = computed(() => isInquiryBuyer.value || Boolean(myResponse.value))
const messageRecipients = computed(() => (inquiry.value?.responses || []).map(r => r.company).filter(Boolean))
const canRevealResponses = computed(() => isInquiryBuyer.value
  && ['SEALED', 'ANONYMOUS_SEALED'].includes(inquiry.value?.visibilityMode)
  && inquiry.value?.allowEarlyReveal
  && inquiry.value?.responsesHidden
  && !inquiry.value?.revealedAt)

function canDecideResponse(response) {
  return isInquiryBuyer.value
    && inquiry.value?.status === 'OPEN'
    && response?.status === 'PENDING'
    && !inquiry.value?.responsesHidden
}

const deadlinePassed = computed(() => {
  const d = inquiry.value?.responseDeadline
  return d ? new Date(d) <= new Date() : false
})

const deadlineApproaching = computed(() => {
  const d = inquiry.value?.responseDeadline
  if (!d) return false
  const deadline = new Date(d)
  const now = new Date()
  const daysLeft = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24))
  return daysLeft <= 3 && daysLeft >= 0
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

function formatDate(v) {
  if (!v) return '—'
  try { return new Date(v).toLocaleDateString('fa-IR') } catch { return '—' }
}

function formatDateTime(v) {
  if (!v) return '—'
  try { return new Date(v).toLocaleString('fa-IR') } catch { return '—' }
}

onMounted(() => fetchInquiry())

async function fetchInquiry() {
  loading.value = true
  errored.value = false
  try {
    const response = await inquiriesApi.getById(route.params.id)
    const body = response?.data ?? response
    inquiry.value = body?.data ?? body
    try {
      const quotaResult = await inquiriesApi.getQuota()
      const quotaBody = quotaResult?.data ?? quotaResult
      const quota = quotaBody?.data ?? quotaBody
      smsAvailable.value = Boolean(quota?.capabilities?.smsConfigured && Number(quota?.quotas?.SMS?.remaining) > 0)
    } catch {
      smsAvailable.value = false
    }
    await fetchMessages()
  } catch (err) {
    errored.value = true
    toast.add({ severity: 'error', summary: 'خطا', detail: 'خطا در دریافت اطلاعات استعلام', life: 3000 })
  } finally {
    loading.value = false
  }
}

function messageSenderName(message) {
  if (message.senderCompany?.name) return message.senderCompany.name
  const profile = message.senderUser?.profile
  const name = [profile?.firstName, profile?.lastName].filter(Boolean).join(' ')
  return name || message.senderUser?.phone || 'کاربر'
}

async function fetchMessages() {
  loadingMessages.value = true
  try {
    const result = await inquiriesApi.listMessages(route.params.id)
    const body = result?.data ?? result
    messages.value = Array.isArray(body?.data) ? body.data : Array.isArray(body) ? body : []
  } catch (err) {
    messages.value = []
    // A user who can see the inquiry but is not a participant must not see the thread.
    if (err?.response?.status !== 403 && err?.response?.status !== 404) {
      toast.add({ severity: 'warn', summary: 'پیام‌های استعلام', detail: err?.message || 'دریافت پیام‌ها انجام نشد', life: 3000 })
    }
  } finally {
    loadingMessages.value = false
  }
}

async function sendInquiryMessage() {
  const message = messageDraft.value.trim()
  if (!message) return
  if (isInquiryBuyer.value && !Number(recipientCompanyId.value)) {
    toast.add({ severity: 'warn', summary: 'انتخاب گیرنده', detail: 'ابتدا شرکت پاسخ‌دهنده را انتخاب کنید.', life: 3000 })
    return
  }
  sendingMessage.value = true
  try {
    const result = await inquiriesApi.sendMessage(route.params.id, {
      message,
      ...(isInquiryBuyer.value ? { recipientCompanyId: Number(recipientCompanyId.value) } : {}),
      ...(notifyBySms.value ? { notifyBySms: true } : {}),
    })
    const body = result?.data ?? result
    const payload = body?.data ?? body
    messageDraft.value = ''
    notifyBySms.value = false
    toast.add({
      severity: payload?.smsSkippedReason ? 'warn' : 'success',
      summary: 'پیام ارسال شد',
      detail: payload?.smsQueued
        ? 'پیام ثبت شد و اعلان پیامکی در صف ارسال قرار گرفت.'
        : payload?.smsSkippedReason === 'recipient_sms_opted_out'
          ? 'پیام ثبت شد؛ گیرنده دریافت پیامک را فعال نکرده است.'
          : payload?.smsSkippedReason === 'sms_quota_exceeded'
            ? 'پیام ثبت شد؛ سهمیه پیامک شما کافی نیست یا اشتراک پیامکی فعال ندارید.'
            : payload?.smsSkippedReason === 'sms_provider_not_configured'
              ? 'پیام ثبت شد؛ درگاه پیامک در حال حاضر آماده نیست.'
              : payload?.smsSkippedReason === 'recipient_phone_missing' || payload?.smsSkippedReason === 'recipient_account_missing'
                ? 'پیام ثبت شد؛ اطلاعات تماس گیرنده برای ارسال پیامک کامل نیست.'
                : 'پیام با موفقیت ثبت شد.',
      life: 3000,
    })
    await fetchMessages()
  } catch (err) {
    const code = err?.response?.data?.code || err?.code
    const detail = code === 'INQUIRY_QUOTA_EXCEEDED' || code === 'INQUIRY_SUBSCRIPTION_REQUIRED'
      ? 'سهمیه پیام شما کافی نیست یا اشتراک فعال ندارید. بخش اشتراک استعلام را بررسی کنید.'
      : err?.response?.data?.message || err?.message || 'ارسال پیام انجام نشد.'
    toast.add({ severity: 'error', summary: 'ارسال پیام ناموفق بود', detail, life: 4000 })
  } finally {
    sendingMessage.value = false
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

async function revealResponses() {
  savingResponse.value = true
  try {
    await inquiriesApi.revealResponses(route.params.id)
    toast.add({ severity: 'success', summary: 'موفقیت', detail: 'پیشنهادها اکنون قابل بررسی هستند', life: 3000 })
    await fetchInquiry()
  } catch (err) {
    toast.add({ severity: 'error', summary: 'خطا', detail: err?.response?.data?.message || err?.message || 'بازکردن پیشنهادها انجام نشد', life: 3500 })
  } finally {
    savingResponse.value = false
  }
}

function confirmDecision(response, decision) {
  const selecting = decision === 'SELECTED'
  confirm.require({
    message: selecting
      ? 'با انتخاب این پیشنهاد، استعلام بسته و سایر پیشنهادهای در انتظار به‌صورت خودکار رد می‌شوند. ادامه می‌دهید؟'
      : 'آیا از رد این پیشنهاد مطمئن هستید؟',
    header: selecting ? 'انتخاب پیشنهاد برنده' : 'رد پیشنهاد',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: selecting ? 'انتخاب و بستن استعلام' : 'رد پیشنهاد',
    rejectLabel: 'انصراف',
    acceptClass: selecting ? undefined : 'p-button-danger',
    accept: () => decideResponse(response, decision),
  })
}

async function decideResponse(response, decision) {
  decidingResponseId.value = response.id
  try {
    await inquiriesApi.decideResponse(route.params.id, response.id, { decision })
    toast.add({
      severity: 'success',
      summary: 'موفقیت',
      detail: decision === 'SELECTED' ? 'پیشنهاد انتخاب شد و استعلام بسته شد' : 'پیشنهاد رد شد',
      life: 3500,
    })
    await fetchInquiry()
  } catch (err) {
    toast.add({ severity: 'error', summary: 'خطا', detail: err?.response?.data?.message || err?.message || 'تصمیم‌گیری روی پیشنهاد انجام نشد', life: 3500 })
  } finally {
    decidingResponseId.value = null
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

    <!-- Loading State -->
    <div v-if="loading" class="detail-skeleton">
      <div class="skeleton-header">
        <div class="skeleton-line skeleton-title"></div>
        <div class="skeleton-line skeleton-subtitle"></div>
      </div>
      <div class="skeleton-card">
        <div class="skeleton-line skeleton-heading"></div>
        <div class="skeleton-grid">
          <div class="skeleton-line skeleton-field" v-for="i in 6" :key="i"></div>
        </div>
      </div>
      <div class="skeleton-card">
        <div class="skeleton-line skeleton-heading"></div>
        <div class="skeleton-line skeleton-field" v-for="i in 3" :key="i"></div>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="errored" class="state-block">
      <i class="pi pi-exclamation-triangle state-icon error"></i>
      <h3>خطا در دریافت اطلاعات</h3>
      <p>دریافت جزئیات استعلام با مشکل مواجه شد.</p>
      <div class="state-actions">
        <Button label="تلاش مجدد" icon="pi pi-refresh" @click="fetchInquiry" />
        <Button label="بازگشت" icon="pi pi-arrow-right" severity="secondary" text @click="router.push({ name: 'company-inquiries' })" />
      </div>
    </div>

    <!-- Inquiry Detail -->
    <template v-else-if="inquiry">
      <!-- Page Header -->
      <div class="page-header">
        <div class="page-header-left">
          <Button icon="pi pi-arrow-right" text @click="router.push({ name: 'company-inquiries' })" />
          <div class="page-title-group">
            <h1>{{ inquiry.title }}</h1>
            <div class="page-meta">
              <Tag :value="statusLabels[inquiry.status]" :severity="statusSeverity[inquiry.status]" :icon="statusIcons[inquiry.status]" />
              <Tag v-if="inquiry.priority && inquiry.priority !== 'NORMAL'" :value="PRIORITY_LABELS[inquiry.priority]" :severity="PRIORITY_SEVERITY[inquiry.priority]" />
              <span v-if="inquiry.company?.name" class="meta-company">
                <i class="pi pi-building"></i>
                {{ inquiry.company.name }}
              </span>
            </div>
          </div>
        </div>
        <div class="page-header-actions" v-if="canCreateResponse">
          <Button label="ارسال پاسخ" icon="pi pi-send" size="large" @click="openCreateDialog" />
        </div>
      </div>

      <!-- Deadline Banner -->
      <div v-if="inquiry.responseDeadline" class="deadline-banner" :class="{ 'deadline-urgent': deadlineApproaching, 'deadline-passed': deadlinePassed }">
        <i class="pi" :class="deadlinePassed ? 'pi-times-circle' : 'pi-clock'"></i>
        <span v-if="deadlinePassed">مهلت پاسخ گذشته است</span>
        <span v-else-if="deadlineApproaching">مهلت پاسخ نزدیک است — {{ formatDateTime(inquiry.responseDeadline) }}</span>
        <span v-else>مهلت پاسخ: {{ formatDateTime(inquiry.responseDeadline) }}</span>
      </div>

      <!-- Main Content Grid -->
      <div class="detail-grid">
        <!-- Left Column: Inquiry Info -->
        <div class="detail-main">
          <!-- Description -->
          <div class="detail-section" v-if="inquiry.description">
            <h2>توضیحات</h2>
            <p class="description-text">{{ inquiry.description }}</p>
          </div>

          <!-- Requested Items -->
          <div class="detail-section">
            <h2>اقلام درخواست <span class="count-badge">{{ inquiry.items?.length || 0 }}</span></h2>
            <div v-if="inquiry.items?.length" class="items-list">
              <div v-for="item in inquiry.items" :key="item.id" class="item-card">
                <div class="item-header">
                  <span class="item-product">{{ item.product?.title || 'محصول نامشخص' }}</span>
                  <span class="item-quantity">×{{ item.quantity }}</span>
                </div>
                <p v-if="item.description" class="item-description">{{ item.description }}</p>
              </div>
            </div>
            <div v-else class="empty-section">
              <p>آیتمی ثبت نشده است</p>
            </div>
          </div>

          <!-- Sealed response privacy -->
          <div class="detail-section" v-if="inquiry.responsesHidden">
            <h2>پاسخ‌ها</h2>
            <p class="description-text">پیشنهادها تا پایان مهلت پاسخ یا بازکردن مجاز پاکت‌ها محرمانه می‌مانند.</p>
            <Button v-if="canRevealResponses" label="بازکردن پاکت پیشنهادها" icon="pi pi-lock-open" :loading="savingResponse" @click="revealResponses" />
          </div>

          <!-- Responses Section -->
          <div class="detail-section" v-if="inquiry.responses?.length">
            <h2>پاسخ‌ها <span class="count-badge">{{ inquiry.responses.length }}</span></h2>
            <div class="responses-list">
              <div v-for="response in inquiry.responses" :key="response.id" class="response-card" :class="{ 'response-mine': isMyResponse(response) }">
                <div class="response-header">
                  <div class="response-header-info">
                    <span class="response-company">{{ response.company?.name }}</span>
                    <Tag :value="responseStatusLabels[response.status] || response.status" :severity="responseStatusSeverity[response.status] || 'info'" />
                    <Tag v-if="isMyResponse(response)" value="پاسخ شما" severity="contrast" />
                  </div>
                  <div class="response-actions" v-if="isMyResponse(response)">
                    <Button v-if="canEditResponse(response)" label="ویرایش" icon="pi pi-pencil" size="small" text @click="openEditDialog(response)" />
                    <Button v-if="canEditResponse(response)" label="افزودن فایل" icon="pi pi-paperclip" size="small" text :loading="uploadingResponseId === response.id" @click="triggerUpload(response)" />
                    <Button v-if="canWithdrawResponse(response)" label="انصراف" icon="pi pi-times-circle" size="small" text severity="danger" @click="confirmWithdraw(response)" />
                  </div>
                  <div class="response-actions response-decision-actions" v-if="canDecideResponse(response)">
                    <Button label="انتخاب پیشنهاد" icon="pi pi-check" size="small" severity="success" :loading="decidingResponseId === response.id" @click="confirmDecision(response, 'SELECTED')" />
                    <Button label="رد پیشنهاد" icon="pi pi-times" size="small" severity="danger" outlined :loading="decidingResponseId === response.id" @click="confirmDecision(response, 'REJECTED')" />
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
            </div>
          </div>

          <!-- Private inquiry conversation -->
          <div class="detail-section message-section" v-if="canUseInquiryMessages">
            <div class="message-heading">
              <h2>گفت‌وگوی استعلام <span class="count-badge">{{ messages.length }}</span></h2>
              <Button icon="pi pi-refresh" text rounded size="small" aria-label="به‌روزرسانی پیام‌ها" :loading="loadingMessages" @click="fetchMessages" />
            </div>
            <p class="description-text">پیام‌ها فقط بین خریدار استعلام و شرکت پاسخ‌دهندهٔ انتخاب‌شده نمایش داده می‌شوند. ارسال پیام از سهمیهٔ اشتراک مصرف می‌کند.</p>
            <div v-if="loadingMessages && !messages.length" class="empty-section">در حال دریافت پیام‌ها…</div>
            <div v-else-if="!messages.length" class="empty-section">هنوز پیامی در این گفت‌وگو ثبت نشده است.</div>
            <div v-else class="message-list" aria-live="polite">
              <article v-for="message in messages" :key="message.id" class="message-bubble" :class="{ 'message-mine': message.senderCompanyId === myCompanyId }">
                <div class="message-meta"><strong>{{ messageSenderName(message) }}</strong><time>{{ formatDateTime(message.createdAt) }}</time></div>
                <p>{{ message.body }}</p>
              </article>
            </div>
            <form class="message-composer" @submit.prevent="sendInquiryMessage">
              <label v-if="isInquiryBuyer" class="message-recipient">شرکت پاسخ‌دهنده
                <select v-model="recipientCompanyId" required>
                  <option :value="null" disabled>انتخاب شرکت</option>
                  <option v-for="company in messageRecipients" :key="company.id" :value="company.id">{{ company.name }}</option>
                </select>
              </label>
              <Textarea v-model="messageDraft" rows="3" maxlength="5000" autoResize placeholder="پیام خود را بنویسید…" class="w-full" />
              <label v-if="smsAvailable" class="message-sms-option"><input v-model="notifyBySms" type="checkbox" /> ارسال اعلان پیامکی به گیرنده (یک سهمیه پیامک مصرف می‌کند)</label>
              <div class="message-send-row"><small>{{ messageDraft.trim().length.toLocaleString('fa-IR') }} / ۵۰۰۰</small><Button type="submit" label="ارسال پیام" icon="pi pi-send" :loading="sendingMessage" :disabled="!messageDraft.trim() || messageDraft.trim().length > 5000" /></div>
            </form>
          </div>
        </div>

        <!-- Right Column: Sidebar -->
        <div class="detail-sidebar">
          <!-- Quick Info Card -->
          <div class="sidebar-card">
            <h3>اطلاعات کلی</h3>
            <div class="sidebar-info">
              <div class="sidebar-info-item">
                <span class="info-label">تاریخ ایجاد</span>
                <span class="info-value">{{ formatDate(inquiry.createdAt) }}</span>
              </div>
              <div class="sidebar-info-item" v-if="inquiry.responseDeadline">
                <span class="info-label">مهلت پاسخ</span>
                <span class="info-value" :class="{ 'deadline-urgent': deadlineApproaching, 'deadline-passed': deadlinePassed }">
                  {{ formatDateTime(inquiry.responseDeadline) }}
                </span>
              </div>
              <div class="sidebar-info-item">
                <span class="info-label">تعداد اقلام</span>
                <span class="info-value">{{ inquiry.items?.length || 0 }}</span>
              </div>
              <div class="sidebar-info-item">
                <span class="info-label">تعداد پاسخ‌ها</span>
                <span class="info-value">{{ inquiry.responses?.length || 0 }}</span>
              </div>
              <div class="sidebar-info-item" v-if="inquiry.visibilityMode">
                <span class="info-label">حالت نمایش</span>
                <span class="info-value">{{ inquiry.visibilityMode }}</span>
              </div>
              <div class="sidebar-info-item" v-if="inquiry.confidential">
                <span class="info-label">محرمانه</span>
                <Tag value="بله" severity="danger" />
              </div>
            </div>
          </div>

          <!-- Status History Card -->
          <div class="sidebar-card" v-if="inquiry.statusHistory?.length">
            <h3>تاریخچه وضعیت</h3>
            <div class="status-timeline">
              <div v-for="entry in inquiry.statusHistory" :key="entry.id" class="timeline-item">
                <div class="timeline-dot" :class="'dot-' + (statusSeverity[entry.newStatus] || 'secondary')"></div>
                <div class="timeline-content">
                  <div class="timeline-transition">
                    <Tag :value="statusLabels[entry.previousStatus]" :severity="statusSeverity[entry.previousStatus]" size="small" />
                    <i class="pi pi-arrow-left"></i>
                    <Tag :value="statusLabels[entry.newStatus]" :severity="statusSeverity[entry.newStatus]" size="small" />
                  </div>
                  <span class="timeline-user">{{ entry.changedBy?.fullName || '-' }}</span>
                  <span class="timeline-date">{{ formatDate(entry.createdAt) }}</span>
                  <p v-if="entry.comment" class="timeline-comment">{{ entry.comment }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- Response Dialog -->
    <Dialog v-model:visible="showResponseDialog" :header="editingResponseId ? 'ویرایش پاسخ' : 'ارسال پاسخ'" :modal="true" :style="{ width: '700px' }">
      <div v-for="(item, index) in responseItems" :key="index" class="response-item-form">
        <h4 class="response-item-title">{{ item.productTitle }}</h4>
        <div class="response-item-grid">
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
            <Textarea v-model="item.description" placeholder="توضیحات پاسخ" rows="2" class="w-full" />
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
  padding: 1.5rem;
  max-width: 1400px;
  margin: 0 auto;
}

/* ── Page Header ────────────────────────────────────── */
.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 1.5rem;
  gap: 1rem;
  flex-wrap: wrap;
}

.page-header-left {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
}

.page-title-group h1 {
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0;
  color: var(--text-color);
  line-height: 1.4;
}

.page-meta {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.5rem;
  flex-wrap: wrap;
}

.meta-company {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.875rem;
  color: var(--text-color-secondary);
}

.page-header-actions {
  display: flex;
  gap: 0.5rem;
}

/* ── Deadline Banner ────────────────────────────────── */
.deadline-banner {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  margin-bottom: 1.5rem;
  background: var(--surface-hover);
  border: 1px solid var(--surface-border);
  border-radius: var(--content-border-radius);
  color: var(--text-color);
  font-size: 0.9rem;
}

.deadline-banner.deadline-urgent {
  background: color-mix(in srgb, var(--ds-color-warning) 10%, transparent);
  border-color: var(--ds-color-warning);
  color: var(--ds-color-warning);
}

.deadline-banner.deadline-passed {
  background: color-mix(in srgb, var(--ds-color-danger) 10%, transparent);
  border-color: var(--ds-color-danger);
  color: var(--ds-color-danger);
}

/* ── Main Grid ──────────────────────────────────────── */
.detail-grid {
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: 1.5rem;
  align-items: start;
}

.detail-main {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.detail-sidebar {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* ── Sections ───────────────────────────────────────── */
.detail-section {
  background: var(--surface-card);
  border: 1px solid var(--surface-border);
  border-radius: var(--content-border-radius);
  padding: 1.5rem;
  box-shadow: var(--ds-shadow-sm);
}

.detail-section h2 {
  font-size: 1rem;
  font-weight: 700;
  margin: 0 0 1rem;
  color: var(--text-color);
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.count-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 1.25rem;
  height: 1.25rem;
  padding: 0 0.375rem;
  background: var(--surface-hover);
  border-radius: var(--ds-radius-full);
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-color-secondary);
}

.description-text {
  color: var(--text-color);
  line-height: 1.7;
  margin: 0;
  white-space: pre-wrap;
}

/* ── Items List ─────────────────────────────────────── */
.items-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.item-card {
  padding: 1rem;
  background: var(--surface-hover);
  border: 1px solid var(--surface-border);
  border-radius: var(--content-border-radius);
}

.item-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.item-product {
  font-weight: 600;
  color: var(--text-color);
}

.item-quantity {
  font-size: 0.875rem;
  color: var(--text-color-secondary);
  font-weight: 500;
}

.item-description {
  margin: 0.5rem 0 0;
  font-size: 0.875rem;
  color: var(--text-color-secondary);
  line-height: 1.5;
}

.empty-section {
  text-align: center;
  padding: 2rem;
  color: var(--text-color-secondary);
}

.empty-section p {
  margin: 0;
}

/* ── Responses ──────────────────────────────────────── */
.message-section{border-top:1px solid var(--surface-border,#e5e7eb);padding-top:1.25rem}
.message-heading,.message-meta,.message-send-row{display:flex;align-items:center;justify-content:space-between;gap:.75rem}
.message-list{display:grid;gap:.75rem;max-height:420px;overflow:auto;margin:1rem 0}
.message-bubble{border:1px solid var(--surface-border,#e5e7eb);border-radius:10px;padding:.8rem 1rem;background:var(--surface-card,#fff);max-width:92%}
.message-bubble.message-mine{margin-inline-start:auto;background:var(--surface-ground,#f8fafc)}
.message-meta{font-size:.8rem;color:var(--text-color-secondary,#64748b);flex-wrap:wrap}
.message-bubble p{white-space:pre-wrap;overflow-wrap:anywhere;margin:.55rem 0 0;color:var(--text-color,#1f2937);line-height:1.8}
.message-composer{display:grid;gap:.65rem;margin-top:1rem}
.message-recipient{display:grid;gap:.4rem;max-width:360px;font-size:.9rem}
.message-sms-option{display:flex;align-items:center;gap:.5rem;font-size:.85rem;color:var(--text-color-secondary,#64748b)}.message-sms-option input{width:1rem;height:1rem;accent-color:var(--primary-color,#0f9e9a)}
.message-recipient select{padding:.65rem;border:1px solid var(--surface-border,#cbd5e1);border-radius:7px;background:var(--surface-card,#fff);color:inherit}
.message-send-row small{color:var(--text-color-secondary,#64748b)}
.responses-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.response-card {
  border: 1px solid var(--surface-border);
  border-radius: var(--content-border-radius);
  padding: 1rem;
  background: var(--surface-card);
}

.response-card.response-mine {
  border-color: var(--ds-color-primary);
  background: color-mix(in srgb, var(--ds-color-primary) 3%, transparent);
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

.response-company {
  font-weight: 600;
  color: var(--text-color);
}

.response-actions {
  display: flex;
  gap: 0.25rem;
  flex-wrap: wrap;
}

/* ── Attachments ────────────────────────────────────── */
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
  padding: 0.375rem 0.625rem;
  border: 1px solid var(--surface-border);
  border-radius: var(--content-border-radius);
  background: var(--surface-hover);
}

.attachment-chip a {
  color: var(--ds-color-primary);
  text-decoration: none;
  font-size: 0.85rem;
}

.attachment-chip a:hover {
  text-decoration: underline;
}

/* ── Sidebar ────────────────────────────────────────── */
.sidebar-card {
  background: var(--surface-card);
  border: 1px solid var(--surface-border);
  border-radius: var(--content-border-radius);
  padding: 1.25rem;
  box-shadow: var(--ds-shadow-sm);
}

.sidebar-card h3 {
  font-size: 0.9rem;
  font-weight: 700;
  margin: 0 0 1rem;
  color: var(--text-color);
}

.sidebar-info {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.sidebar-info-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.sidebar-info-item .info-label {
  font-size: 0.8rem;
  color: var(--text-color-secondary);
}

.sidebar-info-item .info-value {
  font-weight: 600;
  color: var(--text-color);
}

/* ── Status Timeline ────────────────────────────────── */
.status-timeline {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.timeline-item {
  display: flex;
  gap: 0.75rem;
  padding: 0.75rem 0;
  border-bottom: 1px solid var(--surface-border);
}

.timeline-item:last-child {
  border-bottom: none;
}

.timeline-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-top: 0.375rem;
  flex-shrink: 0;
}

.timeline-dot.dot-secondary { background: var(--text-color-secondary); }
.timeline-dot.dot-info { background: var(--ds-color-info); }
.timeline-dot.dot-success { background: var(--ds-color-success); }
.timeline-dot.dot-warn { background: var(--ds-color-warning); }
.timeline-dot.dot-danger { background: var(--ds-color-danger); }

.timeline-content {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  flex: 1;
}

.timeline-transition {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  flex-wrap: wrap;
}

.timeline-user {
  font-size: 0.8rem;
  color: var(--text-color-secondary);
}

.timeline-date {
  font-size: 0.75rem;
  color: var(--text-color-secondary);
}

.timeline-comment {
  margin: 0.25rem 0 0;
  font-size: 0.8rem;
  color: var(--text-color-secondary);
  line-height: 1.4;
}

/* ── Response Dialog ────────────────────────────────── */
.response-item-form {
  border: 1px solid var(--surface-border);
  border-radius: var(--content-border-radius);
  padding: 1rem;
  margin-bottom: 1rem;
}

.response-item-title {
  margin: 0 0 1rem;
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--text-color);
}

.response-item-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

/* ── Skeleton Loading ───────────────────────────────── */
.detail-skeleton {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.skeleton-header {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.skeleton-card {
  background: var(--surface-card);
  border: 1px solid var(--surface-border);
  border-radius: var(--content-border-radius);
  padding: 1.5rem;
}

.skeleton-line {
  background: linear-gradient(90deg, var(--surface-hover) 25%, var(--surface-border) 50%, var(--surface-hover) 75%);
  background-size: 200% 100%;
  animation: skeleton-pulse 1.5s ease-in-out infinite;
  border-radius: var(--ds-radius-sm);
}

.skeleton-title {
  width: 60%;
  height: 1.5rem;
}

.skeleton-subtitle {
  width: 40%;
  height: 1rem;
}

.skeleton-heading {
  width: 30%;
  height: 1rem;
  margin-bottom: 1rem;
}

.skeleton-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.skeleton-field {
  height: 2.5rem;
}

@keyframes skeleton-pulse {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* ── Error State ────────────────────────────────────── */
.state-block {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 3rem 1.5rem;
  text-align: center;
}

.state-icon {
  font-size: 2.5rem;
  margin-bottom: 0.25rem;
}

.state-icon.error {
  color: var(--ds-color-danger);
}

.state-block h3 {
  margin: 0;
  font-size: 1.05rem;
  color: var(--text-color);
}

.state-block p {
  margin: 0 0 0.75rem;
  color: var(--text-color-secondary);
  font-size: 0.9rem;
  max-width: 24rem;
}

.state-actions {
  display: flex;
  gap: 0.5rem;
}

/* ── Deadline Classes ───────────────────────────────── */
.deadline-urgent {
  color: var(--ds-color-warning) !important;
  font-weight: 600;
}

.deadline-passed {
  color: var(--ds-color-danger) !important;
  font-weight: 600;
}

/* ── Responsive ─────────────────────────────────────── */
@media (max-width: 1024px) {
  .detail-grid {
    grid-template-columns: 1fr;
  }

  .detail-sidebar {
    order: -1;
  }
}

@media (max-width: 767px) {
  .inquiry-detail-page {
    padding: 1rem;
  }

  .page-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .page-header-left {
    flex-direction: column;
  }

  .response-item-grid {
    grid-template-columns: 1fr;
  }

  .skeleton-grid {
    grid-template-columns: 1fr;
  }
}
</style>
