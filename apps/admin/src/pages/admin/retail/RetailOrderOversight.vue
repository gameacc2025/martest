<template>
  <main class="retail-oversight" dir="rtl">
    <WorkspacePageHeading
      title="نظارت بر سفارش‌های خرده‌فروشی"
      description="مشاهده سفارش‌های ثبت‌شده، تفکیک فروشندگان، وضعیت پرداخت و گردش موجودی؛ این صفحه عملیاتی و فقط‌خواندنی است."
      heading-id="retail-oversight-title"
    />

    <section class="retail-summary" aria-label="خلاصه نتایج">
      <article class="summary-card">
        <span>کل سفارش‌های منطبق با فیلتر</span>
        <strong>{{ pagination.total.toLocaleString('fa-IR') }}</strong>
      </article>
      <article class="summary-card">
        <span>پرداخت موفق در صفحه جاری</span>
        <strong>{{ pageCount('PAID').toLocaleString('fa-IR') }}</strong>
      </article>
      <article class="summary-card">
        <span>در انتظار پرداخت در صفحه جاری</span>
        <strong>{{ pageCount('PENDING').toLocaleString('fa-IR') }}</strong>
      </article>
      <article class="summary-card">
        <span>خطای پرداخت در صفحه جاری</span>
        <strong>{{ pageCount('FAILED').toLocaleString('fa-IR') }}</strong>
      </article>
    </section>

    <section class="retail-panel" aria-labelledby="retail-orders-heading">
      <form class="retail-filters" @submit.prevent="applyFilters">
        <label class="search-field">
          <span>جستجوی سفارش</span>
          <InputText v-model="filters.search" placeholder="شماره سفارش، نام گیرنده یا تلفن" aria-label="جستجوی سفارش" />
        </label>
        <label>
          <span>وضعیت سفارش</span>
          <Select
            v-model="filters.status"
            :options="orderStatusOptions"
            option-label="label"
            option-value="value"
            placeholder="همه وضعیت‌ها"
            show-clear
            aria-label="فیلتر وضعیت سفارش"
          />
        </label>
        <label>
          <span>وضعیت پرداخت</span>
          <Select
            v-model="filters.paymentStatus"
            :options="paymentStatusOptions"
            option-label="label"
            option-value="value"
            placeholder="همه پرداخت‌ها"
            show-clear
            aria-label="فیلتر وضعیت پرداخت"
          />
        </label>
        <div class="filter-actions">
          <Button type="submit" label="اعمال فیلتر" icon="pi pi-filter" />
          <Button type="button" label="پاک‌کردن" icon="pi pi-times" severity="secondary" outlined @click="clearFilters" />
        </div>
      </form>

      <div class="panel-heading">
        <div>
          <h2 id="retail-orders-heading">فهرست سفارش‌ها</h2>
          <p>اطلاعات سفارش و پرداخت از API خرده‌فروشی دریافت می‌شود.</p>
        </div>
        <Button label="بازخوانی" icon="pi pi-refresh" severity="secondary" outlined :loading="loading" @click="loadOrders" />
      </div>

      <div v-if="error" class="state state-error" role="alert">
        <i class="pi pi-exclamation-triangle" aria-hidden="true"></i>
        <span>{{ error }}</span>
        <Button label="تلاش دوباره" icon="pi pi-refresh" severity="secondary" outlined @click="loadOrders" />
      </div>
      <div v-else-if="loading && !orders.length" class="state" role="status">
        <ProgressSpinner style="width: 2rem; height: 2rem" stroke-width="4" />
        <span>در حال دریافت سفارش‌ها...</span>
      </div>
      <div v-else-if="!orders.length" class="state" role="status">
        <i class="pi pi-inbox" aria-hidden="true"></i>
        <strong>سفارشی با این فیلترها پیدا نشد</strong>
        <span>فیلترها را تغییر دهید یا بعداً دوباره بررسی کنید.</span>
      </div>
      <DataTable v-else :value="orders" data-key="id" striped-rows responsive-layout="scroll" class="retail-table">
        <Column field="orderNumber" header="شماره سفارش">
          <template #body="{ data }"><strong class="order-number">{{ data.orderNumber }}</strong></template>
        </Column>
        <Column header="خریدار / مقصد">
          <template #body="{ data }">
            <div class="buyer-cell">
              <strong>{{ data.recipientName || '—' }}</strong>
              <span>{{ [data.province, data.city].filter(Boolean).join('، ') || 'مقصد ثبت نشده' }}</span>
            </div>
          </template>
        </Column>
        <Column header="وضعیت سفارش">
          <template #body="{ data }"><Tag :value="orderStatusLabel(data.status)" :severity="orderSeverity(data.status)" /></template>
        </Column>
        <Column header="پرداخت">
          <template #body="{ data }"><Tag :value="paymentStatusLabel(data.paymentStatus)" :severity="paymentSeverity(data.paymentStatus)" /></template>
        </Column>
        <Column header="فروشندگان">
          <template #body="{ data }">{{ (data.sellerOrders || []).length.toLocaleString('fa-IR') }}</template>
        </Column>
        <Column header="مبلغ کل">
          <template #body="{ data }"><strong>{{ money(data.grandTotal, data.currency) }}</strong></template>
        </Column>
        <Column header="تاریخ">
          <template #body="{ data }">{{ dateLabel(data.placedAt || data.createdAt) }}</template>
        </Column>
        <Column header="جزئیات">
          <template #body="{ data }">
            <Button icon="pi pi-eye" rounded text severity="secondary" :aria-label="'جزئیات سفارش ' + data.orderNumber" @click="openOrder(data)" />
          </template>
        </Column>
      </DataTable>

      <footer v-if="pagination.totalPages > 1" class="pagination-bar">
        <span>صفحه {{ pagination.page.toLocaleString('fa-IR') }} از {{ pagination.totalPages.toLocaleString('fa-IR') }} — {{ pagination.total.toLocaleString('fa-IR') }} سفارش</span>
        <div>
          <Button label="قبلی" icon="pi pi-chevron-right" severity="secondary" outlined size="small" :disabled="pagination.page <= 1 || loading" @click="changePage(pagination.page - 1)" />
          <Button label="بعدی" icon="pi pi-chevron-left" icon-pos="right" severity="secondary" outlined size="small" :disabled="pagination.page >= pagination.totalPages || loading" @click="changePage(pagination.page + 1)" />
        </div>
      </footer>
    </section>

    <Dialog v-model:visible="detailVisible" modal :header="detail?.orderNumber ? 'جزئیات سفارش ' + detail.orderNumber : 'جزئیات سفارش'" :style="{ width: 'min(960px, 94vw)' }" :breakpoints="{ '640px': '96vw' }">
      <div v-if="detailLoading" class="state" role="status">
        <ProgressSpinner style="width: 2rem; height: 2rem" stroke-width="4" />
        <span>در حال دریافت جزئیات...</span>
      </div>
      <div v-else-if="detailError" class="state state-error" role="alert">{{ detailError }}</div>
      <div v-else-if="detail" class="order-detail">
        <section class="detail-grid" aria-label="اطلاعات سفارش">
          <div><span>گیرنده</span><strong>{{ detail.recipientName || '—' }}</strong></div>
          <div><span>مقصد</span><strong>{{ [detail.province, detail.city].filter(Boolean).join('، ') || '—' }}</strong></div>
          <div><span>وضعیت سفارش</span><Tag :value="orderStatusLabel(detail.status)" :severity="orderSeverity(detail.status)" /></div>
          <div><span>وضعیت پرداخت</span><Tag :value="paymentStatusLabel(detail.paymentStatus)" :severity="paymentSeverity(detail.paymentStatus)" /></div>
          <div><span>جمع کالاها</span><strong>{{ money(detail.subtotal, detail.currency) }}</strong></div>
          <div><span>هزینه ارسال</span><strong>{{ money(detail.shippingTotal, detail.currency) }}</strong></div>
          <div><span>مالیات</span><strong>{{ money(detail.taxTotal, detail.currency) }}</strong></div>
          <div><span>مبلغ نهایی</span><strong>{{ money(detail.grandTotal, detail.currency) }}</strong></div>
        </section>

        <section class="detail-section">
          <h3>تفکیک سفارش فروشندگان</h3>
          <div v-if="!detail.sellerOrders?.length" class="muted">اطلاعات تفکیک فروشنده ثبت نشده است.</div>
          <article v-for="seller in detail.sellerOrders || []" :key="seller.id" class="seller-card">
            <header>
              <div><strong>{{ seller.companyNameSnapshot || 'فروشنده' }}</strong><span>{{ seller.sellerOrderNumber }}</span></div>
              <Tag :value="sellerStatusLabel(seller.status)" :severity="sellerSeverity(seller.status)" />
            </header>
            <div class="seller-total">خالص فروشنده: <strong>{{ money(seller.sellerNetTotal, seller.currency || detail.currency) }}</strong></div>
            <DataTable v-if="seller.items?.length" :value="seller.items" size="small" responsive-layout="scroll">
              <Column field="productTitleSnapshot" header="محصول" />
              <Column field="skuSnapshot" header="شناسه کالا" />
              <Column header="تعداد"><template #body="{ data }">{{ Number(data.quantity).toLocaleString('fa-IR') }}</template></Column>
              <Column header="قیمت واحد"><template #body="{ data }">{{ money(data.unitPrice, data.currency) }}</template></Column>
              <Column header="جمع"><template #body="{ data }">{{ money(data.lineTotal, data.currency) }}</template></Column>
            </DataTable>
            <div v-for="shipment in seller.shipments || []" :key="shipment.id" class="shipment-row">
              <span>ارسال: {{ shipment.carrier || '—' }} · کد رهگیری: {{ shipment.trackingNumber || '—' }}</span>
              <span v-for="event in shipment.trackingEvents || []" :key="event.id">{{ event.description || event.eventCode }} — {{ dateLabel(event.occurredAt) }}</span>
            </div>
          </article>
        </section>

        <section class="detail-section">
          <h3>سوابق پرداخت</h3>
          <div v-if="!detail.paymentAttempts?.length && !detail.paymentTransactions?.length" class="muted">سابقه پرداختی ثبت نشده است.</div>
          <div v-for="attempt in detail.paymentAttempts || []" :key="'attempt-' + attempt.id" class="history-row">
            <span>درگاه {{ attempt.provider }} · تلاش {{ attempt.id }} · {{ paymentAttemptLabel(attempt.status) }}</span>
            <strong>{{ money(attempt.amount, attempt.currency) }}</strong>
          </div>
          <div v-for="transaction in detail.paymentTransactions || []" :key="'transaction-' + transaction.id" class="history-row">
            <span>{{ transaction.transactionType }} · {{ transaction.provider }} · {{ transaction.status }}</span>
            <strong>{{ money(transaction.amount, transaction.currency) }}</strong>
          </div>
        </section>

        <section class="detail-section">
          <h3>رزروهای موجودی</h3>
          <div v-if="!detail.inventoryReservations?.length" class="muted">رزروی ثبت نشده است.</div>
          <div v-for="reservation in detail.inventoryReservations || []" :key="reservation.id" class="history-row">
            <span>محصول #{{ reservation.productId }} · تعداد {{ Number(reservation.quantity).toLocaleString('fa-IR') }} · {{ reservationLabel(reservation.status) }}</span>
            <span>انقضا: {{ dateLabel(reservation.expiresAt) }}</span>
          </div>
        </section>
      </div>
      <template #footer><Button label="بستن" severity="secondary" text @click="detailVisible = false" /></template>
    </Dialog>
  </main>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { retailAdminApi } from '@telecom/api-client'
import WorkspacePageHeading from '@telecom/shared-ui/components/common/WorkspacePageHeading.vue'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Dialog from 'primevue/dialog'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import Tag from 'primevue/tag'
import ProgressSpinner from 'primevue/progressspinner'

const orders = ref([])
const loading = ref(false)
const error = ref('')
const detailVisible = ref(false)
const detailLoading = ref(false)
const detailError = ref('')
const detail = ref(null)
const filters = reactive({ search: '', status: null, paymentStatus: null })
const pagination = ref({ page: 1, limit: 20, total: 0, totalPages: 1 })
let requestSequence = 0

const orderStatusOptions = [
  { label: 'در انتظار پرداخت', value: 'PENDING_PAYMENT' },
  { label: 'پرداخت‌شده', value: 'PAID' },
  { label: 'در حال پردازش', value: 'PROCESSING' },
  { label: 'تحویل جزئی', value: 'PARTIALLY_FULFILLED' },
  { label: 'تکمیل‌شده', value: 'COMPLETED' },
  { label: 'لغوشده', value: 'CANCELLED' },
  { label: 'انقضای پرداخت', value: 'PAYMENT_EXPIRED' },
  { label: 'لغو جزئی', value: 'PARTIALLY_CANCELLED' },
]
const paymentStatusOptions = [
  { label: 'پرداخت‌نشده', value: 'UNPAID' },
  { label: 'در انتظار', value: 'PENDING' },
  { label: 'پرداخت موفق', value: 'PAID' },
  { label: 'بازپرداخت جزئی', value: 'PARTIALLY_REFUNDED' },
  { label: 'بازپرداخت کامل', value: 'REFUNDED' },
  { label: 'ناموفق', value: 'FAILED' },
]
const pageCount = (status) => orders.value.filter(order => order.paymentStatus === status).length

function unwrapList(response) {
  const payload = response?.data ?? response
  return {
    items: Array.isArray(payload?.data) ? payload.data : Array.isArray(payload?.items) ? payload.items : [],
    meta: payload?.meta || {},
  }
}
function unwrapDetail(response) {
  const payload = response?.data ?? response
  return payload?.data ?? payload?.item ?? payload
}
function errorMessage(err) {
  return err?.response?.data?.message || err?.response?.data?.error?.message || err?.serverMessage || err?.message || 'دریافت اطلاعات سفارش با خطا مواجه شد.'
}
async function loadOrders() {
  const current = ++requestSequence
  loading.value = true
  error.value = ''
  try {
    const response = await retailAdminApi.listOrders({
      page: pagination.value.page,
      limit: pagination.value.limit,
      search: filters.search.trim() || undefined,
      status: filters.status || undefined,
      paymentStatus: filters.paymentStatus || undefined,
    })
    if (current !== requestSequence) return
    const result = unwrapList(response)
    orders.value = result.items
    pagination.value = {
      page: Number(result.meta.page) || pagination.value.page,
      limit: Number(result.meta.limit) || pagination.value.limit,
      total: Number(result.meta.total) || 0,
      totalPages: Math.max(Number(result.meta.totalPages) || 1, 1),
    }
  } catch (err) {
    if (current !== requestSequence) return
    orders.value = []
    error.value = errorMessage(err)
  } finally {
    if (current === requestSequence) loading.value = false
  }
}
function applyFilters() {
  pagination.value.page = 1
  loadOrders()
}
function clearFilters() {
  filters.search = ''
  filters.status = null
  filters.paymentStatus = null
  applyFilters()
}
function changePage(page) {
  pagination.value.page = page
  loadOrders()
}
async function openOrder(order) {
  detailVisible.value = true
  detailLoading.value = true
  detailError.value = ''
  detail.value = null
  try {
    const response = await retailAdminApi.getOrder(order.id)
    detail.value = unwrapDetail(response)
  } catch (err) {
    detailError.value = errorMessage(err)
  } finally {
    detailLoading.value = false
  }
}
function money(value, currency = 'IRR') {
  const amount = Number(value)
  if (!Number.isFinite(amount)) return '—'
  try { return new Intl.NumberFormat('fa-IR', { style: 'currency', currency }).format(amount) }
  catch { return new Intl.NumberFormat('fa-IR').format(amount) }
}
function dateLabel(value) {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString('fa-IR')
}
function orderStatusLabel(status) {
  return ({
    PENDING_PAYMENT: 'در انتظار پرداخت', PAID: 'پرداخت‌شده', PROCESSING: 'در حال پردازش',
    PARTIALLY_FULFILLED: 'تحویل جزئی', FULFILLED: 'ارسال کامل', COMPLETED: 'تکمیل‌شده',
    CANCELLED: 'لغوشده', PAYMENT_EXPIRED: 'انقضای پرداخت', PARTIALLY_CANCELLED: 'لغو جزئی',
  })[status] || status || 'نامشخص'
}
function orderSeverity(status) {
  return ({ PAID: 'success', FULFILLED: 'success', COMPLETED: 'success', PROCESSING: 'info', PARTIALLY_FULFILLED: 'info', PENDING_PAYMENT: 'warn', PAYMENT_EXPIRED: 'danger', CANCELLED: 'danger', PARTIALLY_CANCELLED: 'warn' })[status] || 'secondary'
}
function paymentStatusLabel(status) {
  return ({ UNPAID: 'پرداخت‌نشده', PENDING: 'در انتظار', PAID: 'موفق', PARTIALLY_REFUNDED: 'بازپرداخت جزئی', REFUNDED: 'بازپرداخت‌شده', FAILED: 'ناموفق' })[status] || status || 'نامشخص'
}
function paymentSeverity(status) {
  return ({ PAID: 'success', PARTIALLY_REFUNDED: 'warn', REFUNDED: 'secondary', PENDING: 'warn', FAILED: 'danger', UNPAID: 'secondary' })[status] || 'secondary'
}
function sellerStatusLabel(status) {
  return ({ PENDING_ACCEPTANCE: 'در انتظار پذیرش', ACCEPTED: 'پذیرفته‌شده', PROCESSING: 'در حال آماده‌سازی', READY_TO_SHIP: 'آماده ارسال', SHIPPED: 'ارسال‌شده', DELIVERED: 'تحویل‌شده', CANCELLED: 'لغوشده', RETURN_REQUESTED: 'درخواست مرجوعی', RETURNED: 'مرجوع‌شده', PARTIALLY_RETURNED: 'مرجوعی جزئی', REJECTED: 'ردشده' })[status] || status || 'نامشخص'
}
function sellerSeverity(status) {
  return ({ DELIVERED: 'success', SHIPPED: 'info', READY_TO_SHIP: 'info', PROCESSING: 'info', ACCEPTED: 'success', REJECTED: 'danger', CANCELLED: 'danger', RETURN_REQUESTED: 'warn', RETURNED: 'secondary' })[status] || 'warn'
}
function paymentAttemptLabel(status) {
  return ({ CREATED: 'ایجادشده', REDIRECTED: 'هدایت‌شده', PENDING: 'در انتظار', SUCCEEDED: 'موفق', FAILED: 'ناموفق', EXPIRED: 'منقضی', CANCELLED: 'لغوشده' })[status] || status
}
function reservationLabel(status) {
  return ({ ACTIVE: 'فعال', CONSUMED: 'مصرف‌شده', RELEASED: 'آزادشده', EXPIRED: 'منقضی' })[status] || status
}
onMounted(loadOrders)
</script>

<style scoped>
.retail-oversight { display: flex; flex-direction: column; gap: var(--ds-space-5); direction: rtl; min-width: 0; }
.retail-summary { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: var(--ds-space-3); }
.summary-card { display: flex; flex-direction: column; gap: .5rem; min-width: 0; padding: 1rem 1.1rem; border: 1px solid var(--ds-color-border); border-radius: var(--ds-card-radius); background: var(--ds-color-surface); }
.summary-card span { color: var(--ds-color-text-muted); font-size: var(--ds-font-size-xs); }
.summary-card strong { color: var(--ds-color-text); font-size: 1.4rem; font-variant-numeric: tabular-nums; }
.retail-panel { min-width: 0; overflow: hidden; border: 1px solid var(--ds-color-border); border-radius: var(--ds-card-radius); background: var(--ds-color-surface); }
.retail-filters { display: flex; flex-wrap: wrap; align-items: end; gap: .75rem; padding: 1rem; border-bottom: 1px solid var(--ds-color-border); }
.retail-filters label { display: flex; flex: 1 1 12rem; flex-direction: column; gap: .35rem; min-width: 10rem; }
.retail-filters label span { color: var(--ds-color-text-muted); font-size: .75rem; }
.retail-filters .search-field { flex: 2 1 18rem; }
.retail-filters :deep(.p-inputtext), .retail-filters :deep(.p-select) { width: 100%; }
.filter-actions { display: flex; gap: .5rem; }
.panel-heading { display: flex; justify-content: space-between; align-items: center; gap: 1rem; padding: 1.1rem 1rem; }
.panel-heading h2 { margin: 0; font-size: 1rem; }
.panel-heading p { margin: .35rem 0 0; color: var(--ds-color-text-muted); font-size: .78rem; }
.state { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: .75rem; min-height: 13rem; padding: 1.25rem; color: var(--ds-color-text-muted); text-align: center; }
.state > i { font-size: 1.5rem; }
.state-error { color: var(--ds-status-danger-fg, var(--ds-color-danger)); }
.order-number { direction: ltr; unicode-bidi: plaintext; }
.buyer-cell { display: flex; flex-direction: column; gap: .2rem; min-width: 8rem; }
.buyer-cell span, .muted { color: var(--ds-color-text-muted); font-size: .75rem; }
.pagination-bar { display: flex; justify-content: space-between; align-items: center; gap: 1rem; padding: 1rem; border-top: 1px solid var(--ds-color-border); color: var(--ds-color-text-muted); font-size: .78rem; }
.pagination-bar > div { display: flex; gap: .5rem; }
.order-detail { display: flex; flex-direction: column; gap: 1.25rem; }
.detail-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: .75rem; padding: 1rem; border: 1px solid var(--ds-color-border); border-radius: var(--ds-radius-lg); }
.detail-grid > div { display: flex; flex-direction: column; align-items: flex-start; gap: .35rem; min-width: 0; }
.detail-grid span { color: var(--ds-color-text-muted); font-size: .72rem; }
.detail-grid strong { font-size: .84rem; overflow-wrap: anywhere; }
.detail-section { display: flex; flex-direction: column; gap: .75rem; }
.detail-section h3 { margin: 0; font-size: .9rem; }
.seller-card { display: flex; flex-direction: column; gap: .7rem; padding: .9rem; border: 1px solid var(--ds-color-border); border-radius: var(--ds-radius-lg); }
.seller-card > header { display: flex; justify-content: space-between; align-items: center; gap: .75rem; }
.seller-card > header > div { display: flex; flex-direction: column; gap: .2rem; }
.seller-card > header span, .seller-total { color: var(--ds-color-text-muted); font-size: .75rem; }
.seller-total strong { color: var(--ds-color-text); }
.history-row, .shipment-row { display: flex; flex-wrap: wrap; justify-content: space-between; gap: .5rem; padding: .6rem 0; border-bottom: 1px solid var(--ds-color-border); font-size: .78rem; }
.shipment-row { flex-direction: column; }
@media (max-width: 900px) { .retail-summary { grid-template-columns: repeat(2, minmax(0, 1fr)); } .detail-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (max-width: 560px) { .panel-heading, .pagination-bar { align-items: stretch; flex-direction: column; } .filter-actions { width: 100%; } .filter-actions :deep(button) { flex: 1; } }
</style>
