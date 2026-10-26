<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { inquiriesApi } from '@telecom/api-client'
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import ProgressSpinner from 'primevue/progressspinner'

const route = useRoute()
const router = useRouter()
const inquiries = ref([])
const selected = ref(null)
const loadingList = ref(false)
const loadingDetail = ref(false)
const saving = ref(false)
const decidingResponseId = ref(null)
const error = ref('')
const detailError = ref('')

const statusLabels = {
  DRAFT: 'پیش‌نویس',
  SUBMITTED: 'ارسال‌شده',
  OPEN: 'در حال دریافت پیشنهاد',
  CLOSED: 'بسته‌شده',
  EXPIRED: 'مهلت تمام‌شده',
  COMPLETED: 'تکمیل‌شده',
  CANCELLED: 'لغوشده',
}
const statusSeverity = {
  DRAFT: 'secondary',
  SUBMITTED: 'info',
  OPEN: 'success',
  CLOSED: 'warn',
  EXPIRED: 'danger',
  COMPLETED: 'success',
  CANCELLED: 'danger',
}
const isDetail = computed(() => Boolean(route.params.id))
const canCancel = computed(() => selected.value
  && ['DRAFT', 'SUBMITTED', 'OPEN'].includes(selected.value.status))
const canRevealEarly = computed(() => selected.value
  && ['SEALED', 'ANONYMOUS_SEALED'].includes(selected.value.visibilityMode)
  && selected.value.allowEarlyReveal
  && !selected.value.revealedAt
  && selected.value.responsesHidden)

function unwrapList(response) {
  const body = response?.data ?? response
  const payload = body?.data ?? body
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.data)) return payload.data
  return []
}
function unwrapInquiry(response) {
  const body = response?.data ?? response
  return body?.data ?? body
}
function formatDate(value) {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString('fa-IR')
}
function formatPrice(value) {
  const amount = Number(value)
  if (!Number.isFinite(amount)) return '—'
  return new Intl.NumberFormat('fa-IR', {
    style: 'currency',
    currency: 'IRR',
    maximumFractionDigits: 0,
  }).format(amount)
}
function responseLabel(response) {
  return response?.company?.name || 'پیشنهاد ثبت‌شده'
}

async function loadList() {
  loadingList.value = true
  error.value = ''
  try {
    inquiries.value = unwrapList(await inquiriesApi.list({ scope: 'sent', page: 1, limit: 50 }))
  } catch (err) {
    error.value = err?.response?.data?.message || err?.response?.data?.error?.message
      || err?.serverMessage || err?.message || 'دریافت استعلام‌ها ناموفق بود.'
  } finally {
    loadingList.value = false
  }
}

async function loadDetail() {
  const id = route.params.id
  if (!id) {
    selected.value = null
    detailError.value = ''
    return
  }
  loadingDetail.value = true
  detailError.value = ''
  try {
    selected.value = unwrapInquiry(await inquiriesApi.getById(id))
  } catch (err) {
    selected.value = null
    detailError.value = err?.response?.data?.message || err?.response?.data?.error?.message
      || err?.serverMessage || err?.message || 'دریافت جزئیات استعلام ناموفق بود.'
  } finally {
    loadingDetail.value = false
  }
}

async function refresh() {
  await loadList()
  if (route.params.id) await loadDetail()
}
async function cancelInquiry() {
  if (!selected.value || !canCancel.value || saving.value) return
  saving.value = true
  detailError.value = ''
  try {
    await inquiriesApi.changeStatus(selected.value.id, { status: 'CANCELLED' })
    await refresh()
  } catch (err) {
    detailError.value = err?.response?.data?.message || err?.response?.data?.error?.message
      || err?.serverMessage || err?.message || 'لغو استعلام ناموفق بود.'
  } finally {
    saving.value = false
  }
}
function canDecideResponse(response) {
  return selected.value?.status === 'OPEN'
    && response?.status === 'PENDING'
    && !selected.value?.responsesHidden
}

async function decideResponse(response, decision) {
  if (!selected.value || !canDecideResponse(response) || decidingResponseId.value) return
  const selecting = decision === 'SELECTED'
  const message = selecting
    ? 'با انتخاب این پیشنهاد، استعلام بسته و سایر پیشنهادهای در انتظار رد می‌شوند. ادامه می‌دهید؟'
    : 'آیا از رد این پیشنهاد مطمئن هستید؟'
  if (!window.confirm(message)) return
  decidingResponseId.value = response.id
  detailError.value = ''
  try {
    await inquiriesApi.decideResponse(selected.value.id, response.id, { decision })
    await refresh()
  } catch (err) {
    detailError.value = err?.response?.data?.message || err?.response?.data?.error?.message
      || err?.serverMessage || err?.message || 'تصمیم‌گیری روی پیشنهاد ناموفق بود.'
  } finally {
    decidingResponseId.value = null
  }
}

async function revealResponses() {
  if (!selected.value || saving.value) return
  saving.value = true
  detailError.value = ''
  try {
    await inquiriesApi.revealResponses(selected.value.id)
    await loadDetail()
  } catch (err) {
    detailError.value = err?.response?.data?.message || err?.response?.data?.error?.message
      || err?.serverMessage || err?.message || 'نمایش پیشنهادها انجام نشد.'
  } finally {
    saving.value = false
  }
}
function openInquiry(inquiry) {
  router.push({ name: 'my-inquiries', params: { id: inquiry.id } })
}
function backToList() {
  router.push({ name: 'my-inquiries' })
}

watch(() => route.params.id, () => {
  if (route.params.id) loadDetail()
  else selected.value = null
})
onMounted(async () => {
  await loadList()
  if (route.params.id) await loadDetail()
})
</script>

<template>
  <main class="my-inquiries-page" dir="rtl">
    <div class="inquiries-container">
      <header class="page-heading">
        <div>
          <p class="eyebrow">حساب کاربری</p>
          <h1>استعلام‌های من</h1>
          <p class="page-description">درخواست‌های قیمت، وضعیت بررسی و پیشنهادهای تأمین‌کنندگان را پیگیری کنید.</p>
        </div>
        <Button label="اشتراک استعلام" icon="pi pi-wallet" severity="primary" outlined @click="router.push({ name: 'inquiry-subscription' })" />
        <Button v-if="isDetail" label="بازگشت به فهرست" icon="pi pi-arrow-right" severity="secondary" outlined @click="backToList" />
        <Button v-else label="به‌روزرسانی" icon="pi pi-refresh" severity="secondary" outlined :loading="loadingList" @click="refresh" />
      </header>

      <section v-if="isDetail" class="detail-panel">
        <div v-if="loadingDetail" class="loading-state"><ProgressSpinner /><span>در حال دریافت جزئیات...</span></div>
        <div v-else-if="detailError && !selected" class="state-message error-message" role="alert">
          <i class="pi pi-exclamation-triangle"></i><p>{{ detailError }}</p>
          <Button label="تلاش دوباره" icon="pi pi-refresh" @click="loadDetail" />
        </div>
        <template v-else-if="selected">
          <div class="detail-heading">
            <div>
              <span class="inquiry-id">استعلام شماره {{ selected.id }}</span>
              <h2>{{ selected.title }}</h2>
              <p class="muted">ثبت‌شده در {{ formatDate(selected.createdAt) }}</p>
            </div>
            <Tag :value="statusLabels[selected.status] || selected.status" :severity="statusSeverity[selected.status] || 'secondary'" />
          </div>
          <p v-if="selected.description" class="description">{{ selected.description }}</p>
          <div class="metadata-grid">
            <div><span>اولویت</span><strong>{{ ({LOW:'کم',NORMAL:'عادی',HIGH:'زیاد',URGENT:'فوری'})[selected.priority] || 'عادی' }}</strong></div>
            <div><span>نوع استعلام</span><strong>{{ ({NORMAL:'عادی',SEALED:'محرمانه / پاکت بسته',ANONYMOUS_SEALED:'پاکت بسته ناشناس'})[selected.visibilityMode] || 'عادی' }}</strong></div>
            <div><span>مهلت پاسخ</span><strong>{{ formatDate(selected.responseDeadline) }}</strong></div>
            <div><span>تعداد پیشنهادها</span><strong>{{ selected.responseCount ?? selected.responses?.length ?? 0 }}</strong></div>
          </div>

          <section class="content-section">
            <h3>اقلام درخواستی</h3>
            <div v-if="!selected.items?.length" class="empty-inline">برای این استعلام قلمی ثبت نشده است.</div>
            <article v-for="item in selected.items || []" :key="item.id" class="item-row">
              <div class="item-main">
                <strong>{{ item.product?.title || 'محصول' }}</strong>
                <p v-if="item.description">{{ item.description }}</p>
                <small v-if="item.product?.company?.name">{{ item.product.company.name }}</small>
              </div>
              <span class="quantity">تعداد: {{ item.quantity }}</span>
            </article>
          </section>

          <section class="content-section">
            <div class="section-title-row">
              <h3>پیشنهادهای قیمت</h3>
              <Button v-if="canRevealEarly" label="نمایش پیشنهادها" icon="pi pi-eye" size="small" :loading="saving" @click="revealResponses" />
            </div>
            <div v-if="selected.responsesHidden" class="sealed-notice">
              <i class="pi pi-lock"></i>
              <div><strong>پیشنهادها فعلاً محرمانه هستند</strong><p>جزئیات پیشنهادها پس از پایان مهلت یا بازشدن مجاز پاکت‌ها نمایش داده می‌شود.</p></div>
            </div>
            <div v-else-if="!selected.responses?.length" class="empty-inline">هنوز پیشنهادی برای این استعلام ثبت نشده است.</div>
            <article v-for="response in selected.responses || []" :key="response.id" class="response-card">
              <div class="response-heading">
                <strong>{{ responseLabel(response) }}</strong>
                <Tag :value="({PENDING:'در انتظار بررسی',SELECTED:'انتخاب‌شده',REJECTED:'انتخاب‌نشده',EXPIRED:'منقضی‌شده',WITHDRAWN:'پس‌گرفته‌شده'})[response.status] || response.status" :severity="({SELECTED:'success',REJECTED:'danger',WITHDRAWN:'secondary'})[response.status] || 'info'" />
              </div>
              <div v-if="canDecideResponse(response)" class="response-decision-actions">
                <Button label="انتخاب پیشنهاد" icon="pi pi-check" size="small" severity="success" :loading="decidingResponseId === response.id" @click="decideResponse(response, 'SELECTED')" />
                <Button label="رد پیشنهاد" icon="pi pi-times" size="small" severity="danger" outlined :loading="decidingResponseId === response.id" @click="decideResponse(response, 'REJECTED')" />
              </div>
              <div v-for="item in response.items || []" :key="item.id" class="response-item">
                <span>{{ item.description || item.inquiryItem?.product?.title || 'پیشنهاد قیمت' }}</span>
                <strong>{{ formatPrice(item.price) }}</strong>
                <small v-if="item.deliveryTime">زمان تحویل: {{ item.deliveryTime }}</small>
              </div>
            </article>
          </section>

          <p v-if="detailError" class="inline-error" role="alert">{{ detailError }}</p>
          <footer class="detail-actions">
            <Button v-if="canCancel" label="لغو استعلام" icon="pi pi-times" severity="danger" outlined :loading="saving" @click="cancelInquiry" />
            <Button label="بازگشت به استعلام‌ها" icon="pi pi-arrow-right" severity="secondary" outlined @click="backToList" />
          </footer>
        </template>
      </section>

      <section v-else class="list-panel">
        <div v-if="loadingList && !inquiries.length" class="loading-state"><ProgressSpinner /><span>در حال دریافت استعلام‌ها...</span></div>
        <div v-else-if="error" class="state-message error-message" role="alert">
          <i class="pi pi-exclamation-triangle"></i><p>{{ error }}</p>
          <Button label="تلاش دوباره" icon="pi pi-refresh" @click="loadList" />
        </div>
        <div v-else-if="!inquiries.length" class="empty-state">
          <i class="pi pi-file-edit"></i>
          <h2>هنوز استعلامی ثبت نکرده‌اید</h2>
          <p>برای دریافت قیمت و شرایط فروش، وارد صفحه یک محصول شوید و گزینه استعلام قیمت را انتخاب کنید.</p>
          <Button label="مشاهده محصولات" icon="pi pi-shopping-bag" @click="router.push('/products')" />
        </div>
        <div v-else class="inquiry-list">
          <button v-for="inquiry in inquiries" :key="inquiry.id" type="button" class="inquiry-row" @click="openInquiry(inquiry)">
            <span class="row-icon"><i class="pi pi-file-edit"></i></span>
            <span class="row-main">
              <strong>{{ inquiry.title }}</strong>
              <small>{{ formatDate(inquiry.createdAt) }} · {{ inquiry._count?.items ?? 0 }} قلم · {{ inquiry._count?.responses ?? 0 }} پیشنهاد</small>
            </span>
            <Tag :value="statusLabels[inquiry.status] || inquiry.status" :severity="statusSeverity[inquiry.status] || 'secondary'" />
            <i class="pi pi-angle-left row-arrow"></i>
          </button>
        </div>
      </section>
    </div>
  </main>
</template>

<style scoped>
.my-inquiries-page{min-height:65vh;padding:32px 16px 64px;background:var(--surface-ground,#f7f9fb);color:var(--text-color,#1f2937)}
.inquiries-container{width:min(100%,1040px);margin:0 auto}
.page-heading,.detail-heading,.section-title-row,.response-heading,.detail-actions{display:flex;align-items:center;justify-content:space-between;gap:16px}
.page-heading{margin-bottom:24px;align-items:flex-start}
.page-heading h1{margin:4px 0 8px;font-size:clamp(1.6rem,3vw,2.2rem);font-weight:800}
.eyebrow,.muted,.page-description{color:var(--text-color-secondary,#667085)}
.eyebrow{margin:0;font-size:.85rem}
.page-description{margin:0;line-height:1.9}
.list-panel,.detail-panel{background:var(--surface-card,#fff);border:1px solid var(--surface-border,#e5e7eb);border-radius:16px;padding:clamp(16px,3vw,28px);box-shadow:0 8px 24px #1018280a}
.inquiry-list{display:grid;gap:10px}
.inquiry-row{display:flex;align-items:center;gap:14px;width:100%;padding:16px;border:1px solid var(--surface-border,#e5e7eb);border-radius:12px;background:transparent;color:inherit;text-align:right;cursor:pointer}
.inquiry-row:hover{border-color:#01bec2;background:#01bec20b}
.row-icon{display:grid;place-items:center;flex:0 0 42px;height:42px;border-radius:12px;background:#01bec21a;color:#008f93;font-size:1.1rem}
.row-main{display:grid;gap:6px;min-width:0;flex:1}
.row-main strong{overflow-wrap:anywhere}
.row-main small,.muted,.item-main small{color:var(--text-color-secondary,#667085)}
.row-arrow{color:var(--text-color-secondary,#667085)}
.detail-heading{align-items:flex-start;padding-bottom:18px;border-bottom:1px solid var(--surface-border,#e5e7eb)}
.detail-heading h2{margin:8px 0;font-size:1.4rem;overflow-wrap:anywhere}
.inquiry-id{font-size:.85rem;color:#008f93}
.description{white-space:pre-wrap;line-height:1.9;margin:18px 0}
.metadata-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin:20px 0}
.metadata-grid>div{display:grid;gap:8px;padding:14px;border-radius:10px;background:var(--surface-ground,#f8fafc)}
.metadata-grid span{font-size:.85rem;color:var(--text-color-secondary,#667085)}
.metadata-grid strong{overflow-wrap:anywhere}
.content-section{margin-top:26px}
.content-section h3{font-size:1.1rem;margin:0 0 14px}
.item-row,.response-card{display:flex;justify-content:space-between;align-items:flex-start;gap:16px;padding:14px;border:1px solid var(--surface-border,#e5e7eb);border-radius:10px;margin-top:10px}
.item-main{display:grid;gap:6px}
.item-main p{margin:0;line-height:1.8;white-space:pre-wrap}
.item-main small{font-size:.8rem}
.quantity{white-space:nowrap;font-size:.9rem}
.response-card{display:block}
.response-decision-actions{display:flex;flex-wrap:wrap;gap:8px;margin:10px 0 14px}
.response-heading{margin-bottom:10px}
.response-item{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:6px 14px;padding:10px 0;border-top:1px solid var(--surface-border,#e5e7eb)}
.response-item small{grid-column:1/-1;color:var(--text-color-secondary,#667085)}
.sealed-notice{display:flex;align-items:flex-start;gap:14px;padding:18px;border-radius:12px;background:#f0f9ff;color:#075985}
.sealed-notice>i{font-size:1.4rem}
.sealed-notice p{margin:6px 0 0;line-height:1.8}
.empty-state,.loading-state,.state-message{display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;gap:12px;padding:48px 16px}
.empty-state>i{font-size:2.5rem;color:#01a8ac}
.empty-state h2{margin:0;font-size:1.2rem}
.empty-state p{max-width:520px;color:var(--text-color-secondary,#667085);line-height:1.9}
.empty-inline{padding:18px;text-align:center;color:var(--text-color-secondary,#667085);border:1px dashed var(--surface-border,#d0d5dd);border-radius:10px}
.error-message{color:#b42318}
.inline-error{color:#b42318;margin-top:16px}
.detail-actions{justify-content:flex-start;margin-top:24px;flex-wrap:wrap}
@media(max-width:700px){.page-heading{flex-direction:column}.metadata-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.inquiry-row{flex-wrap:wrap}.row-main{flex-basis:calc(100% - 60px)}.item-row{flex-direction:column}.detail-heading{flex-direction:column}.response-heading{align-items:flex-start}}
</style>
