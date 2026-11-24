<template>
  <main class="orders-page ds-container ds-page" dir="rtl" aria-labelledby="orders-title" :aria-busy="loading">
    <WorkspacePageHeading title="سفارش‌های من" description="وضعیت سفارش‌های ثبت‌شده و پرداخت‌های شما." icon="pi pi-shopping-bag" heading-id="orders-title">
      <template #actions><Breadcrumb :home="home" :model="breadcrumbs" /></template>
    </WorkspacePageHeading>
    <div v-if="loading" class="orders-state" role="status"><ProgressSpinner style="width:2rem;height:2rem" />در حال دریافت سفارش‌ها...</div>
    <div v-else-if="error" class="orders-state orders-error" role="alert">
      <strong>دریافت سفارش‌ها ناموفق بود</strong><p>{{ error }}</p>
      <Button label="تلاش دوباره" icon="pi pi-refresh" severity="secondary" outlined @click="loadOrders" />
    </div>
    <div v-else-if="orders.length === 0" class="orders-state">
      <i class="pi pi-shopping-bag" aria-hidden="true"></i><h2>هنوز سفارشی ثبت نکرده‌اید</h2>
      <p>پس از ثبت سفارش خرده‌فروشی، وضعیت آن را از این صفحه دنبال کنید.</p>
      <Button label="مشاهده محصولات" icon="pi pi-arrow-left" @click="router.push({ name: 'products' })" />
    </div>
    <section v-else class="orders-list" aria-label="فهرست سفارش‌ها">
      <article v-for="order in orders" :key="order.id" class="order-card">
        <div class="order-card-heading">
          <div><span class="order-number-label">شماره سفارش</span><strong>{{ order.orderNumber }}</strong></div>
          <span class="order-status">{{ statusLabel(order.status) }}</span>
        </div>
        <div class="order-card-meta">
          <span>{{ formatDate(order.placedAt) }}</span><span>{{ order.sellerOrders?.length || 0 }} فروشنده</span>
          <strong>{{ formatPrice(order.grandTotal, order.currency) }}</strong>
        </div>
        <div class="order-card-footer">
          <span>پرداخت: {{ paymentStatusLabel(order.paymentStatus) }}</span>
          <Button label="جزئیات سفارش" icon="pi pi-arrow-left" severity="secondary" outlined size="small" @click="router.push({ name: 'customer-order-details', params: { id: order.id } })" />
        </div>
      </article>
      <nav v-if="meta.totalPages > 1" class="orders-pagination" aria-label="صفحه‌بندی سفارش‌ها">
        <Button label="قبلی" severity="secondary" text :disabled="page <= 1" @click="changePage(page - 1)" />
        <span>صفحه {{ page.toLocaleString('fa-IR') }} از {{ meta.totalPages.toLocaleString('fa-IR') }}</span>
        <Button label="بعدی" severity="secondary" text :disabled="page >= meta.totalPages" @click="changePage(page + 1)" />
      </nav>
    </section>
  </main>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import Breadcrumb from 'primevue/breadcrumb'
import Button from 'primevue/button'
import ProgressSpinner from 'primevue/progressspinner'
import WorkspacePageHeading from '@telecom/shared-ui/components/common/WorkspacePageHeading.vue'
import { useProductsStore } from '../../stores/products'

const router = useRouter()
const productsStore = useProductsStore()
const orders = ref([])
const loading = ref(false)
const error = ref('')
const page = ref(1)
const meta = ref({ totalPages: 1, total: 0 })
const home = { icon: 'pi pi-home', to: '/' }
const breadcrumbs = [{ label: 'سفارش‌های من', to: '/orders' }]

function formatPrice(value, currency = 'IRR') {
  const amount = Number(value)
  if (!Number.isFinite(amount)) return '—'
  try { return new Intl.NumberFormat('fa-IR', { style: 'currency', currency }).format(amount) }
  catch { return new Intl.NumberFormat('fa-IR').format(amount) }
}
function formatDate(value) {
  const date = new Date(value)
  return Number.isFinite(date.getTime()) ? new Intl.DateTimeFormat('fa-IR', { dateStyle: 'medium', timeStyle: 'short' }).format(date) : '—'
}
function statusLabel(value) {
  return ({ PENDING_PAYMENT: 'در انتظار پرداخت', PAYMENT_EXPIRED: 'مهلت پرداخت پایان یافت', PAID: 'پرداخت‌شده', PROCESSING: 'در حال پردازش', PARTIALLY_FULFILLED: 'ارسال بخشی از سفارش', FULFILLED: 'ارسال‌شده', COMPLETED: 'تکمیل‌شده', CANCELLED: 'لغوشده', PARTIALLY_CANCELLED: 'لغو بخشی از سفارش' })[value] || value
}
function paymentStatusLabel(value) {
  return ({ UNPAID: 'پرداخت‌نشده', PENDING: 'در انتظار پرداخت', PAID: 'پرداخت‌شده', PARTIALLY_REFUNDED: 'بازپرداخت جزئی', REFUNDED: 'بازپرداخت‌شده', FAILED: 'ناموفق' })[value] || value
}
async function loadOrders() {
  loading.value = true
  error.value = ''
  try {
    const result = await productsStore.getRetailOrders({ page: page.value, limit: 20 })
    orders.value = Array.isArray(result?.data) ? result.data : []
    meta.value = result?.meta || { totalPages: 1, total: orders.value.length }
  } catch (err) {
    orders.value = []
    error.value = err?.serverMessage || err?.message || 'ارتباط با سرور برقرار نشد.'
  } finally { loading.value = false }
}
function changePage(nextPage) { page.value = nextPage; loadOrders() }
onMounted(loadOrders)
</script>

<style scoped>
.orders-page { color: var(--ds-color-text); }
.orders-list { display: grid; gap: .85rem; }
.order-card { padding: 1.1rem 1.2rem; border: 1px solid var(--ds-color-border); border-radius: var(--ds-radius-lg); background: var(--ds-color-surface); }
.order-card-heading, .order-card-meta, .order-card-footer { display: flex; align-items: center; justify-content: space-between; gap: 1rem; }
.order-card-heading > div { display: grid; gap: .25rem; }
.order-number-label { color: var(--ds-color-text-muted); font-size: .72rem; }
.order-card-heading strong { font-size: .9rem; }
.order-status { padding: .25rem .6rem; border-radius: 999px; background: var(--ds-color-surface-muted, var(--ds-color-surface-hover)); font-size: .75rem; }
.order-card-meta { flex-wrap: wrap; padding: .85rem 0; margin-top: .7rem; border-block: 1px solid var(--ds-color-border); color: var(--ds-color-text-muted); font-size: .78rem; }
.order-card-meta strong { color: var(--ds-color-text); font-size: .88rem; }
.order-card-footer { padding-top: .75rem; color: var(--ds-color-text-muted); font-size: .78rem; }
.orders-state { display: flex; min-height: 15rem; flex-direction: column; align-items: center; justify-content: center; gap: .7rem; color: var(--ds-color-text-muted); text-align: center; }
.orders-state > i { font-size: 1.8rem; }
.orders-state h2 { margin: 0; color: var(--ds-color-text); }
.orders-state p { margin: 0; max-width: 42ch; font-size: .82rem; line-height: 1.8; }
.orders-error { color: var(--ds-color-danger, var(--ds-status-danger-fg)); }
.orders-pagination { display: flex; align-items: center; justify-content: center; gap: 1rem; padding: 1rem; font-size: .8rem; }
@media (max-width: 600px) { .order-card-heading, .order-card-footer { align-items: flex-start; flex-direction: column; } .order-card-meta { align-items: flex-start; flex-direction: column; } }
</style>
