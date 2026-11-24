<template>
  <main class="retail-orders-page ds-page" dir="rtl" aria-labelledby="retail-orders-title" :aria-busy="store.loading">
    <header class="page-heading">
      <div><span class="eyebrow">COMPANY · RETAIL OPERATIONS</span><h1 id="retail-orders-title">سفارش‌های خرده‌فروشی شرکت</h1>
        <p>فقط سفارش‌های پرداخت‌شده و متعلق به شرکت شما در این بخش نمایش داده می‌شوند.</p></div>
      <Button label="به‌روزرسانی" icon="pi pi-refresh" severity="secondary" outlined :loading="store.loading" @click="loadOrders" />
    </header>

    <section class="filters" aria-label="فیلتر سفارش‌ها">
      <label for="order-status-filter">وضعیت سفارش</label>
      <select id="order-status-filter" v-model="statusFilter" @change="loadOrders">
        <option value="">همه وضعیت‌ها</option>
        <option value="PENDING_ACCEPTANCE">در انتظار پذیرش</option>
        <option value="ACCEPTED">پذیرفته‌شده</option>
        <option value="PROCESSING">در حال آماده‌سازی</option>
        <option value="READY_TO_SHIP">آماده ارسال</option>
        <option value="SHIPPED">ارسال‌شده</option>
        <option value="DELIVERED">تحویل‌شده</option>
      </select>
    </section>

    <div v-if="store.loading && !store.orders.length" class="state" role="status"><ProgressSpinner style="width:2rem;height:2rem" />در حال دریافت سفارش‌های شرکت...</div>
    <div v-else-if="store.error" class="state error-state" role="alert">
      <strong>دریافت سفارش‌ها ناموفق بود</strong><p>{{ store.error }}</p>
      <Button label="تلاش دوباره" icon="pi pi-refresh" severity="secondary" outlined @click="loadOrders" />
    </div>
    <div v-else-if="!store.orders.length" class="state">
      <i class="pi pi-inbox" aria-hidden="true"></i><strong>سفارشی برای نمایش وجود ندارد</strong>
      <p>سفارش‌های پرداخت‌شده‌ای که به شرکت شما تعلق داشته باشند، در اینجا ظاهر می‌شوند.</p>
    </div>

    <section v-else class="orders-list" aria-label="سفارش‌های فروشنده">
      <article v-for="order in store.orders" :key="order.id" class="seller-order-card">
        <header class="order-heading">
          <div><span>شماره سفارش فروشنده</span><strong>{{ order.sellerOrderNumber }}</strong><small>سفارش اصلی: {{ order.order?.orderNumber }}</small></div>
          <span class="status-pill">{{ statusLabel(order.status) }}</span>
        </header>
        <div class="buyer-details">
          <span><i class="pi pi-user" aria-hidden="true"></i>{{ order.order?.recipientName }}</span>
          <span><i class="pi pi-phone" aria-hidden="true"></i>{{ order.order?.recipientPhone }}</span>
          <span><i class="pi pi-map-marker" aria-hidden="true"></i>{{ order.order?.province }}، {{ order.order?.city }}</span>
        </div>
        <div class="item-list">
          <div v-for="item in order.items || []" :key="item.id" class="order-item">
            <img v-if="item.imageUrlSnapshot" :src="item.imageUrlSnapshot" :alt="item.productTitleSnapshot" loading="lazy" />
            <div v-else class="item-placeholder"><i class="pi pi-image" aria-hidden="true"></i></div>
            <div class="item-copy"><strong>{{ item.productTitleSnapshot }}</strong><small>کد: {{ item.skuSnapshot || '—' }} · تعداد: {{ item.quantity.toLocaleString('fa-IR') }}</small></div>
            <strong>{{ formatPrice(item.lineTotal, item.currency) }}</strong>
          </div>
        </div>
        <div class="order-footer">
          <div><span>جمع اقلام</span><strong>{{ formatPrice(order.subtotal, order.currency) }}</strong></div>
          <div class="actions" v-if="canManageOrders">
            <Button v-if="order.status === 'PENDING_ACCEPTANCE'" label="پذیرش سفارش" icon="pi pi-check" size="small" :loading="busyOrderId === order.id" @click="runTransition(order, 'ACCEPT')" />
            <Button v-else-if="order.status === 'ACCEPTED'" label="شروع آماده‌سازی" icon="pi pi-box" size="small" :loading="busyOrderId === order.id" @click="runTransition(order, 'START_PROCESSING')" />
            <Button v-else-if="order.status === 'PROCESSING'" label="آماده ارسال" icon="pi pi-check-circle" size="small" :loading="busyOrderId === order.id" @click="runTransition(order, 'READY_TO_SHIP')" />
            <Button v-else-if="order.status === 'READY_TO_SHIP'" label="ثبت ارسال" icon="pi pi-truck" size="small" @click="openShipmentDialog(order)" />
            <Button v-else-if="order.status === 'SHIPPED'" label="تأیید تحویل" icon="pi pi-verified" size="small" severity="success" :loading="busyOrderId === order.id" @click="runTransition(order, 'DELIVER')" />
          </div>
          <span v-else class="read-only-note">دسترسی مشاهده فقط</span>
        </div>
        <div v-if="order.shipments?.length" class="shipment-list">
          <div v-for="shipment in order.shipments" :key="shipment.id">
            <span>{{ shipment.carrier || 'حمل‌ونقل' }} · {{ shipment.trackingNumber || 'بدون کد رهگیری' }}</span>
            <small>{{ shipment.status }}</small>
          </div>
        </div>
      </article>
      <nav v-if="store.meta.totalPages > 1" class="pagination" aria-label="صفحه‌بندی سفارش‌ها">
        <Button label="قبلی" severity="secondary" text :disabled="page <= 1" @click="changePage(page - 1)" />
        <span>صفحه {{ page.toLocaleString('fa-IR') }} از {{ store.meta.totalPages.toLocaleString('fa-IR') }}</span>
        <Button label="بعدی" severity="secondary" text :disabled="page >= store.meta.totalPages" @click="changePage(page + 1)" />
      </nav>
    </section>

    <Dialog v-model:visible="shipmentDialogOpen" modal header="ثبت اطلاعات ارسال" :style="{ width: 'min(92vw, 30rem)' }">
      <form class="shipment-form" @submit.prevent="submitShipment">
        <label for="shipment-carrier">شرکت حمل‌ونقل</label>
        <InputText id="shipment-carrier" v-model="shipment.carrier" maxlength="120" required />
        <label for="shipment-tracking">کد رهگیری</label>
        <InputText id="shipment-tracking" v-model="shipment.trackingNumber" maxlength="160" required />
        <label for="shipment-location">مبدأ یا موقعیت (اختیاری)</label>
        <InputText id="shipment-location" v-model="shipment.location" maxlength="240" />
        <p v-if="dialogError" class="dialog-error" role="alert">{{ dialogError }}</p>
        <div class="dialog-actions">
          <Button label="انصراف" severity="secondary" text type="button" @click="shipmentDialogOpen = false" />
          <Button label="ثبت ارسال" icon="pi pi-truck" type="submit" :loading="busyOrderId === selectedOrder?.id" />
        </div>
      </form>
    </Dialog>
  </main>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import ProgressSpinner from 'primevue/progressspinner'
import { useAuthStore } from '../../../stores/auth'
import { useRetailOrdersStore } from '../../../stores/retailOrders'

const store = useRetailOrdersStore()
const authStore = useAuthStore()
const canManageOrders = computed(() => authStore.hasPermission('retail.orders.manage'))
const statusFilter = ref('')
const page = ref(1)
const busyOrderId = ref(null)
const shipmentDialogOpen = ref(false)
const selectedOrder = ref(null)
const dialogError = ref('')
const shipment = ref({ carrier: '', trackingNumber: '', location: '' })

function formatPrice(value, currency = 'IRR') {
  const amount = Number(value)
  if (!Number.isFinite(amount)) return '—'
  try { return new Intl.NumberFormat('fa-IR', { style: 'currency', currency }).format(amount) }
  catch { return new Intl.NumberFormat('fa-IR').format(amount) }
}
function statusLabel(value) {
  return ({ PENDING_ACCEPTANCE: 'در انتظار پذیرش', ACCEPTED: 'پذیرفته‌شده', REJECTED: 'ردشده', PROCESSING: 'در حال آماده‌سازی', READY_TO_SHIP: 'آماده ارسال', SHIPPED: 'ارسال‌شده', DELIVERED: 'تحویل‌شده', CANCELLED: 'لغوشده', RETURN_REQUESTED: 'درخواست مرجوعی', PARTIALLY_RETURNED: 'مرجوعی جزئی', RETURNED: 'مرجوع‌شده' })[value] || value
}
async function loadOrders() {
  await store.fetchOrders({ page: page.value, limit: 20, ...(statusFilter.value ? { status: statusFilter.value } : {}) }).catch(() => {})
}
async function changePage(next) { page.value = next; await loadOrders() }
async function runTransition(order, action, extra = {}) {
  busyOrderId.value = order.id
  try {
    await store.transitionOrder(order.id, { action, ...extra })
    await loadOrders()
  } catch (error) {
    store.error = error?.serverMessage || error?.message || 'تغییر وضعیت سفارش انجام نشد.'
  } finally { busyOrderId.value = null }
}
function openShipmentDialog(order) {
  selectedOrder.value = order
  shipment.value = { carrier: '', trackingNumber: '', location: '' }
  dialogError.value = ''
  shipmentDialogOpen.value = true
}
async function submitShipment() {
  if (!selectedOrder.value) return
  busyOrderId.value = selectedOrder.value.id
  dialogError.value = ''
  try {
    await runTransition(selectedOrder.value, 'SHIP', shipment.value)
    shipmentDialogOpen.value = false
  } catch (error) {
    dialogError.value = error?.serverMessage || error?.message || 'ثبت اطلاعات ارسال انجام نشد.'
  } finally { busyOrderId.value = null }
}
onMounted(loadOrders)
</script>

<style scoped>
.retail-orders-page { padding: 1.5rem; color: var(--ds-color-text); }
.page-heading { display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; margin-bottom: 1.25rem; }
.page-heading h1 { margin: .3rem 0; font-size: 1.25rem; font-weight: 800; }
.page-heading p { margin: 0; color: var(--ds-color-text-muted); font-size: .82rem; line-height: 1.8; }
.eyebrow { color: var(--ds-color-primary); font-size: .68rem; font-weight: 700; letter-spacing: .08em; }
.filters { display: flex; align-items: center; gap: .75rem; padding: .85rem 1rem; margin-bottom: 1rem; border: 1px solid var(--ds-color-border); border-radius: var(--ds-radius-lg); background: var(--ds-color-surface); }
.filters label { color: var(--ds-color-text-muted); font-size: .8rem; }
.filters select { min-width: 12rem; min-height: 2.4rem; padding: .35rem .65rem; border: 1px solid var(--ds-color-border); border-radius: var(--ds-radius-md); background: var(--ds-color-surface); color: var(--ds-color-text); }
.orders-list { display: grid; gap: 1rem; }
.seller-order-card { overflow: hidden; border: 1px solid var(--ds-color-border); border-radius: var(--ds-radius-xl); background: var(--ds-color-surface); }
.order-heading { display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; padding: 1rem 1.1rem; }
.order-heading > div { display: grid; gap: .2rem; }
.order-heading span, .order-heading small { color: var(--ds-color-text-muted); font-size: .72rem; }
.order-heading strong { font-size: .9rem; }
.status-pill { padding: .25rem .65rem; border-radius: 999px; background: var(--ds-color-surface-hover); color: var(--ds-color-text); white-space: nowrap; }
.buyer-details { display: flex; flex-wrap: wrap; gap: .6rem 1rem; padding: .75rem 1.1rem; border-block: 1px solid var(--ds-color-border); color: var(--ds-color-text-muted); font-size: .75rem; }
.buyer-details span { display: inline-flex; align-items: center; gap: .35rem; }
.item-list { padding: 0 1.1rem; }
.order-item { display: grid; grid-template-columns: 2.8rem minmax(0, 1fr) auto; align-items: center; gap: .75rem; padding: .75rem 0; border-bottom: 1px solid var(--ds-color-border); }
.order-item img, .item-placeholder { width: 2.8rem; height: 2.8rem; object-fit: contain; border-radius: var(--ds-radius-md); background: var(--ds-color-surface-hover); }
.item-placeholder { display: grid; place-items: center; color: var(--ds-color-text-muted); }
.item-copy { display: grid; gap: .2rem; min-width: 0; }
.item-copy strong { font-size: .82rem; }
.item-copy small { color: var(--ds-color-text-muted); font-size: .72rem; }
.order-item > strong { font-size: .8rem; white-space: nowrap; }
.order-footer { display: flex; justify-content: space-between; align-items: center; gap: 1rem; padding: .9rem 1.1rem; }
.order-footer > div:first-child { display: grid; gap: .2rem; }
.order-footer > div:first-child span { color: var(--ds-color-text-muted); font-size: .72rem; }
.order-footer > div:first-child strong { font-size: .9rem; }
.actions { display: flex; flex-wrap: wrap; gap: .5rem; }
.read-only-note { color: var(--ds-color-text-muted); font-size: .75rem; }
.shipment-list { display: grid; gap: .4rem; padding: .75rem 1.1rem; border-top: 1px solid var(--ds-color-border); color: var(--ds-color-text-muted); font-size: .75rem; }
.shipment-list > div { display: flex; justify-content: space-between; gap: 1rem; }
.state { display: flex; min-height: 14rem; flex-direction: column; align-items: center; justify-content: center; gap: .65rem; color: var(--ds-color-text-muted); text-align: center; }
.state > i { font-size: 1.7rem; }
.state p { margin: 0; font-size: .8rem; }
.error-state { color: var(--ds-color-danger, var(--ds-status-danger-fg)); }
.pagination { display: flex; justify-content: center; align-items: center; gap: 1rem; padding: 1rem; font-size: .8rem; }
.shipment-form { display: grid; gap: .5rem; }
.shipment-form label { margin-top: .4rem; font-size: .8rem; font-weight: 600; }
.shipment-form :deep(input) { width: 100%; }
.dialog-actions { display: flex; justify-content: flex-end; gap: .5rem; margin-top: 1rem; }
.dialog-error { color: var(--ds-color-danger, var(--ds-status-danger-fg)); font-size: .8rem; }
@media (max-width: 640px) { .retail-orders-page { padding: 1rem; } .page-heading, .order-footer { align-items: flex-start; flex-direction: column; } .filters { align-items: flex-start; flex-direction: column; } .filters select { width: 100%; } .order-item { grid-template-columns: 2.5rem minmax(0, 1fr); } .order-item img, .item-placeholder { width: 2.5rem; height: 2.5rem; } .order-item > strong { grid-column: 2; } }
</style>
