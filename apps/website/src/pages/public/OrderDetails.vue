<template>
  <main class="order-details-page ds-container ds-page" dir="rtl" aria-labelledby="order-title" :aria-busy="loading">
    <WorkspacePageHeading title="جزئیات سفارش" description="وضعیت، اقلام و اطلاعات تحویل سفارش شما." icon="pi pi-file-check" heading-id="order-title">
      <template #actions><Breadcrumb :home="home" :model="breadcrumbs" /></template>
    </WorkspacePageHeading>
    <div v-if="loading" class="order-state" role="status"><ProgressSpinner style="width:2rem;height:2rem" />در حال دریافت سفارش...</div>
    <div v-else-if="error" class="order-state order-error" role="alert">
      <strong>دریافت سفارش ناموفق بود</strong><p>{{ error }}</p>
      <Button label="بازگشت به سفارش‌ها" severity="secondary" outlined @click="goToOrders" />
    </div>
    <div v-else-if="!order" class="order-state"><h2>سفارش یافت نشد</h2><Button label="بازگشت به سفارش‌ها" @click="goToOrders" /></div>
    <template v-else>
      <section class="order-summary-card">
        <div><span>شماره سفارش</span><strong>{{ order.orderNumber }}</strong><small>{{ formatDate(order.placedAt) }}</small></div>
        <div class="order-total"><span>مبلغ کل</span><strong>{{ formatPrice(order.grandTotal, order.currency) }}</strong></div>
        <div class="status-pair"><span>وضعیت سفارش: {{ statusLabel(order.status) }}</span><span>وضعیت پرداخت: {{ paymentStatusLabel(order.paymentStatus) }}</span></div>
      </section>

      <div v-if="order.paymentStatus !== 'PAID' && paymentUrl" class="payment-reminder" role="status">
        <span>پرداخت این سفارش هنوز تکمیل نشده است.</span>
        <Button label="ادامه پرداخت آزمایشی" icon="pi pi-arrow-left" @click="router.push(paymentUrl)" />
      </div>

      <div class="order-layout">
        <section class="order-main">
          <article v-for="seller in order.sellerOrders || []" :key="seller.id" class="seller-card">
            <header><div><span>فروشنده</span><strong>{{ seller.companyNameSnapshot }}</strong></div><span class="seller-status">{{ sellerStatusLabel(seller.status) }}</span></header>
            <div v-for="item in seller.items || []" :key="item.id" class="order-item">
              <img v-if="item.imageUrlSnapshot" :src="item.imageUrlSnapshot" :alt="item.productTitleSnapshot" loading="lazy" />
              <div v-else class="order-item-placeholder"><i class="pi pi-image" aria-hidden="true"></i></div>
              <div class="order-item-info"><strong>{{ item.productTitleSnapshot }}</strong><span>کد کالا: {{ item.skuSnapshot || '—' }}</span><span>تعداد: {{ item.quantity.toLocaleString('fa-IR') }}</span></div>
              <strong>{{ formatPrice(item.lineTotal, item.currency) }}</strong>
            </div>
          </article>
        </section>
        <aside class="order-side">
          <section class="side-card">
            <h2>نشانی تحویل</h2>
            <p>{{ order.recipientName }}</p><p>{{ order.recipientPhone }}</p>
            <p>{{ order.province }}، {{ order.city }}، {{ order.addressLine }}</p>
            <p v-if="order.postalCode">کد پستی: {{ order.postalCode }}</p>
          </section>
          <section class="side-card">
            <h2>خلاصه مالی</h2>
            <div><span>جمع کالاها</span><strong>{{ formatPrice(order.subtotal, order.currency) }}</strong></div>
            <div><span>هزینه ارسال</span><strong>{{ formatPrice(order.shippingTotal, order.currency) }}</strong></div>
            <div><span>مالیات</span><strong>{{ formatPrice(order.taxTotal, order.currency) }}</strong></div>
            <div class="grand-total"><span>مبلغ نهایی</span><strong>{{ formatPrice(order.grandTotal, order.currency) }}</strong></div>
          </section>
        </aside>
      </div>
    </template>
  </main>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Breadcrumb from 'primevue/breadcrumb'
import Button from 'primevue/button'
import ProgressSpinner from 'primevue/progressspinner'
import WorkspacePageHeading from '@telecom/shared-ui/components/common/WorkspacePageHeading.vue'
import { useProductsStore } from '../../stores/products'

const route = useRoute()
const router = useRouter()
const productsStore = useProductsStore()
const order = ref(null)
const loading = ref(false)
const error = ref('')
const home = { icon: 'pi pi-home', to: '/' }
const breadcrumbs = computed(() => [{ label: 'سفارش‌های من', to: '/orders' }, { label: order.value?.orderNumber || 'جزئیات سفارش' }])
const paymentUrl = computed(() => order.value?.paymentAttempts?.find(attempt => attempt.provider === 'sandbox' && attempt.status !== 'SUCCEEDED')?.redirectUrl || '')

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
function sellerStatusLabel(value) {
  return ({ PENDING_ACCEPTANCE: 'در انتظار پذیرش فروشنده', ACCEPTED: 'پذیرفته‌شده', REJECTED: 'ردشده', PROCESSING: 'در حال آماده‌سازی', READY_TO_SHIP: 'آماده ارسال', SHIPPED: 'ارسال‌شده', DELIVERED: 'تحویل‌شده', CANCELLED: 'لغوشده' })[value] || value
}
async function loadOrder() {
  loading.value = true
  error.value = ''
  try { order.value = await productsStore.getRetailOrder(route.params.id) }
  catch (err) { order.value = null; error.value = err?.serverMessage || err?.message || 'سفارش پیدا نشد.' }
  finally { loading.value = false }
}
function goToOrders() { router.push({ name: 'customer-orders' }) }
onMounted(loadOrder)
watch(() => route.params.id, loadOrder)
</script>

<style scoped>
.order-details-page { color: var(--ds-color-text); }
.order-summary-card, .seller-card, .side-card { border: 1px solid var(--ds-color-border); border-radius: var(--ds-radius-lg); background: var(--ds-color-surface); }
.order-summary-card { display: grid; grid-template-columns: 1fr auto; gap: .75rem; padding: 1.1rem 1.2rem; margin-bottom: 1rem; }
.order-summary-card > div:first-child { display: grid; gap: .25rem; }
.order-summary-card span, .order-summary-card small { color: var(--ds-color-text-muted); font-size: .75rem; }
.order-summary-card strong { font-size: .95rem; }
.order-total { display: grid; gap: .25rem; text-align: end; }
.order-total strong { color: var(--ds-color-primary); }
.status-pair { display: flex; flex-wrap: wrap; gap: .6rem 1.2rem; grid-column: 1 / -1; padding-top: .75rem; border-top: 1px solid var(--ds-color-border); }
.payment-reminder { display: flex; align-items: center; justify-content: space-between; gap: 1rem; padding: .9rem 1rem; margin-bottom: 1rem; border: 1px solid var(--ds-color-border); border-radius: var(--ds-radius-lg); background: var(--ds-color-surface-muted, var(--ds-color-surface-hover)); font-size: .82rem; }
.order-layout { display: grid; grid-template-columns: minmax(0, 1fr) 19rem; gap: 1rem; align-items: start; }
.order-main, .order-side { display: grid; gap: 1rem; min-width: 0; }
.seller-card { padding: 1rem; }
.seller-card > header { display: flex; justify-content: space-between; gap: 1rem; padding-bottom: .75rem; border-bottom: 1px solid var(--ds-color-border); }
.seller-card > header > div { display: grid; gap: .2rem; }
.seller-card > header span, .order-item-info span { color: var(--ds-color-text-muted); font-size: .75rem; }
.seller-card > header strong { font-size: .88rem; }
.seller-status { align-self: start; padding: .2rem .5rem; border-radius: 999px; background: var(--ds-color-surface-hover); }
.order-item { display: grid; grid-template-columns: 3.5rem minmax(0, 1fr) auto; gap: .8rem; align-items: center; padding: .85rem 0; border-bottom: 1px solid var(--ds-color-border); }
.order-item:last-child { border-bottom: 0; }
.order-item img, .order-item-placeholder { width: 3.5rem; height: 3.5rem; border-radius: var(--ds-radius-md); object-fit: contain; background: var(--ds-color-surface-hover); }
.order-item-placeholder { display: grid; place-items: center; color: var(--ds-color-text-muted); }
.order-item-info { display: grid; gap: .2rem; min-width: 0; }
.order-item-info strong { font-size: .84rem; }
.order-item > strong { font-size: .82rem; white-space: nowrap; }
.side-card { padding: 1rem; }
.side-card h2 { margin: 0 0 .75rem; font-size: .9rem; }
.side-card p { margin: .35rem 0; color: var(--ds-color-text-muted); font-size: .78rem; line-height: 1.8; }
.side-card > div { display: flex; justify-content: space-between; gap: .75rem; padding: .55rem 0; font-size: .78rem; }
.side-card > div span { color: var(--ds-color-text-muted); }
.side-card .grand-total { margin-top: .4rem; padding-top: .8rem; border-top: 1px solid var(--ds-color-border); font-weight: 700; }
.order-state { display: flex; min-height: 14rem; flex-direction: column; align-items: center; justify-content: center; gap: .75rem; color: var(--ds-color-text-muted); text-align: center; }
.order-error { color: var(--ds-color-danger, var(--ds-status-danger-fg)); }
@media (max-width: 850px) { .order-layout { grid-template-columns: 1fr; } }
@media (max-width: 560px) { .order-summary-card { grid-template-columns: 1fr; } .order-total { text-align: start; } .payment-reminder { align-items: flex-start; flex-direction: column; } .order-item { grid-template-columns: 3rem minmax(0, 1fr); } .order-item img, .order-item-placeholder { width: 3rem; height: 3rem; } .order-item > strong { grid-column: 2; } }
</style>
