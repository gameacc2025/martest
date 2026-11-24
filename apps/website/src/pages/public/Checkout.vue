<template>
  <main class="checkout-page ds-page" dir="rtl">
    <div class="ds-container checkout-shell">
      <WorkspacePageHeading
        title="بازبینی سفارش"
        description="قیمت و موجودی اقلام از سرور دوباره بررسی می‌شود."
        heading-id="checkout-title"
      >
        <template #actions><Breadcrumb :home="home" :model="breadcrumbs" /></template>
      </WorkspacePageHeading>

      <div class="checkout-notice" role="status">
        <i class="pi pi-shield" aria-hidden="true"></i>
        <div>
          <strong>اعتبارسنجی سمت سرور</strong>
          <p>قیمت‌های ذخیره‌شده در مرورگر مبنای سفارش نیستند. این مرحله قیمت و موجودی فعلی را از PostgreSQL می‌خواند و هنوز هیچ سفارش، رزرو موجودی یا پرداختی ایجاد نمی‌کند.</p>
        </div>
      </div>

      <div v-if="cartItems.length === 0" class="checkout-empty">
        <h2>سبد خرید شما خالی است</h2>
        <p>برای ادامه، ابتدا محصولی به سبد خرید اضافه کنید.</p>
        <Button label="بازگشت به سبد خرید" icon="pi pi-arrow-right" severity="secondary" @click="goToCart" />
      </div>

      <div v-else class="checkout-layout">
        <section class="checkout-main" aria-labelledby="preview-title" :aria-busy="loading">
          <header class="section-heading">
            <div>
              <h2 id="preview-title">پیش‌نمایش اقلام</h2>
              <p>هر بار که تعداد اقلام تغییر کند، اعتبارسنجی دوباره انجام می‌شود.</p>
            </div>
            <Button label="به‌روزرسانی" icon="pi pi-refresh" severity="secondary" outlined size="small" :loading="loading" @click="loadPreview" />
          </header>

          <div v-if="loading && !preview" class="checkout-state" role="status">
            <ProgressSpinner style="width: 2rem; height: 2rem" strokeWidth="4" />
            <span>در حال بررسی قیمت و موجودی...</span>
          </div>
          <div v-else-if="error" class="checkout-state checkout-error" role="alert">
            <i class="pi pi-exclamation-triangle" aria-hidden="true"></i>
            <strong>اعتبارسنجی سبد خرید انجام نشد</strong>
            <p>{{ error }}</p>
            <Button label="تلاش دوباره" icon="pi pi-refresh" severity="secondary" outlined @click="loadPreview" />
          </div>
          <template v-else-if="preview">
            <article v-for="item in preview.items" :key="item.productId" class="preview-item">
              <div class="preview-item-main">
                <strong>{{ item.title }}</strong>
                <span>{{ item.seller?.name || 'فروشنده' }} · {{ item.quantity.toLocaleString('fa-IR') }} {{ item.unit || 'عدد' }}</span>
                <small>موجودی قابل خرید هنگام بررسی: {{ item.availableQuantity.toLocaleString('fa-IR') }}</small>
              </div>
              <div class="preview-item-price">
                <span>{{ formatPrice(item.unitPrice, preview.currency) }} × {{ item.quantity.toLocaleString('fa-IR') }}</span>
                <strong>{{ formatPrice(item.lineTotal, preview.currency) }}</strong>
              </div>
            </article>

            <div v-if="preview.sellers?.length > 1" class="seller-groups">
              <h3>تفکیک فروشندگان</h3>
              <div v-for="seller in preview.sellers" :key="seller.companyId" class="seller-row">
                <span>{{ seller.sellerName || 'فروشنده' }}</span>
                <strong>{{ formatPrice(seller.subtotal, preview.currency) }}</strong>
              </div>
            </div>
          </template>
        </section>

        <aside class="checkout-summary" aria-labelledby="summary-title">
          <h2 id="summary-title">خلاصه محاسبات سرور</h2>
          <div class="summary-row">
            <span>جمع کالاها</span>
            <strong>{{ preview ? formatPrice(preview.subtotal, preview.currency) : '—' }}</strong>
          </div>
          <div class="summary-row">
            <span>هزینه ارسال</span>
            <strong>{{ preview?.fees?.shipping != null ? formatPrice(preview.fees.shipping, preview.currency) : 'تعیین نشده' }}</strong>
          </div>
          <div class="summary-row">
            <span>مالیات</span>
            <strong>{{ preview?.fees?.tax != null ? formatPrice(preview.fees.tax, preview.currency) : 'تعیین نشده' }}</strong>
          </div>
          <div class="summary-total">
            <span>مبلغ نهایی</span>
            <strong>{{ preview?.fees?.total != null ? formatPrice(preview.fees.total, preview.currency) : 'پس از تعیین سیاست‌ها' }}</strong>
          </div>

          <div v-if="preview" class="policy-blockers" role="status" aria-live="polite">
            <h3>موارد لازم پیش از ثبت سفارش</h3>
            <ul>
              <li v-for="code in preview.blockers" :key="code">{{ blockerLabel(code) }}</li>
            </ul>
          </div>

          <Button label="ثبت سفارش هنوز فعال نیست" icon="pi pi-lock" class="place-order-button" disabled />
          <p class="summary-disclaimer">هیچ مبلغی دریافت نمی‌شود و هیچ موجودی‌ای رزرو نمی‌شود. پس از تعیین سیاست‌های تجاری و اتصال درگاه، همین مسیر به ثبت سفارش واقعی متصل خواهد شد.</p>
          <Button label="بازگشت به سبد خرید" icon="pi pi-arrow-right" severity="secondary" text class="back-button" @click="goToCart" />
        </aside>
      </div>
    </div>
  </main>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import Breadcrumb from 'primevue/breadcrumb'
import Button from 'primevue/button'
import ProgressSpinner from 'primevue/progressspinner'
import WorkspacePageHeading from '@telecom/shared-ui/components/common/WorkspacePageHeading.vue'
import { useCartStore } from '../../stores/cart'
import { useProductsStore } from '../../stores/products'

const router = useRouter()
const cartStore = useCartStore()
const productsStore = useProductsStore()
const cartItems = computed(() => cartStore.items)
const cartFingerprint = computed(() => cartItems.value.map(item => String(item.id) + ':' + String(item.quantity)).join('|'))
const loading = ref(false)
const error = ref('')
const preview = ref(null)
let requestSequence = 0

const home = { icon: 'pi pi-home', to: '/' }
const breadcrumbs = [{ label: 'سبد خرید', to: '/cart' }, { label: 'بازبینی سفارش', to: '/checkout' }]

function formatPrice(value, currency = 'IRR') {
  const amount = Number(value)
  if (!Number.isFinite(amount)) return '—'
  try {
    return new Intl.NumberFormat('fa-IR', { style: 'currency', currency }).format(amount)
  } catch {
    return new Intl.NumberFormat('fa-IR').format(amount)
  }
}

function blockerLabel(code) {
  const labels = {
    SHIPPING_POLICY_NOT_CONFIGURED: 'سیاست هزینه و روش ارسال باید تعیین شود.',
    TAX_POLICY_NOT_CONFIGURED: 'قواعد مالیات باید تعیین و پیکربندی شود.',
    COMMISSION_POLICY_NOT_CONFIGURED: 'نرخ کمیسیون و سهم فروشنده باید مشخص شود.',
    PAYMENT_POLICY_NOT_CONFIGURED: 'درگاه پرداخت باید انتخاب و پیکربندی شود.',
    RETAIL_ORDER_PAYMENT_WORKFLOW_PENDING: 'ثبت سفارش، پرداخت و تأیید callback هنوز تکمیل نشده است.',
  }
  return labels[code] || code
}

async function loadPreview() {
  if (!cartItems.value.length) {
    preview.value = null
    await router.replace({ name: 'customer-cart' })
    return
  }

  const currentRequest = ++requestSequence
  loading.value = true
  error.value = ''
  try {
    const items = cartItems.value.map(item => ({
      productId: Number(item.id),
      quantity: Number(item.quantity),
    }))
    const response = await productsStore.previewRetailCheckout(items)
    if (currentRequest !== requestSequence) return
    preview.value = response?.data?.data ?? response?.data ?? response
  } catch (err) {
    if (currentRequest !== requestSequence) return
    preview.value = null
    error.value = err?.response?.data?.error?.message
      || err?.serverMessage
      || err?.message
      || 'ارتباط با سرور برقرار نشد. لطفاً دوباره تلاش کنید.'
  } finally {
    if (currentRequest === requestSequence) loading.value = false
  }
}

function goToCart() {
  router.push({ name: 'customer-cart' })
}

watch(cartFingerprint, () => {
  if (cartItems.value.length) loadPreview()
})
onMounted(loadPreview)
</script>

<style scoped>
.checkout-page { color: var(--ds-color-text); }
.checkout-shell { padding-block: var(--ds-space-6) var(--ds-space-12); }
.checkout-notice { display: flex; gap: .85rem; margin-bottom: 1.25rem; padding: 1rem 1.1rem; border: 1px solid color-mix(in srgb, var(--ds-color-primary) 30%, var(--ds-color-border)); border-radius: var(--ds-radius-lg); background: var(--ds-color-primary-soft); }
.checkout-notice > i { margin-top: .15rem; color: var(--ds-color-primary); font-size: 1.15rem; }
.checkout-notice strong { font-size: .9rem; }
.checkout-notice p { margin: .3rem 0 0; color: var(--ds-color-text-muted); font-size: .8rem; line-height: 1.8; }
.checkout-layout { display: grid; grid-template-columns: minmax(0, 1fr) 20rem; gap: 1.25rem; align-items: start; }
.checkout-main, .checkout-summary { min-width: 0; border: 1px solid var(--ds-color-border); border-radius: var(--ds-radius-xl); background: var(--ds-color-surface); }
.checkout-main { padding: clamp(1rem, 2vw, 1.5rem); }
.checkout-summary { position: sticky; top: 1rem; padding: 1.25rem; }
.section-heading { display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; margin-bottom: 1.25rem; }
.section-heading h2, .checkout-summary h2 { margin: 0; font-size: 1rem; font-weight: 700; }
.section-heading p { margin: .3rem 0 0; color: var(--ds-color-text-muted); font-size: .8rem; }
.checkout-state { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: .75rem; min-height: 16rem; color: var(--ds-color-text-muted); font-size: .85rem; text-align: center; }
.checkout-error { padding: 1rem; color: var(--ds-color-danger, var(--ds-status-danger-fg)); }
.checkout-error > i { font-size: 1.4rem; }
.checkout-error p { max-width: 44ch; line-height: 1.8; }
.preview-item { display: flex; justify-content: space-between; gap: 1rem; padding: 1rem 0; border-bottom: 1px solid var(--ds-color-border); }
.preview-item-main, .preview-item-price { display: flex; flex-direction: column; gap: .3rem; min-width: 0; }
.preview-item-main strong { font-size: .88rem; }
.preview-item-main span, .preview-item-main small, .preview-item-price span { color: var(--ds-color-text-muted); font-size: .75rem; line-height: 1.7; }
.preview-item-price { align-items: flex-end; white-space: nowrap; }
.preview-item-price strong { font-size: .88rem; }
.seller-groups { margin-top: 1.25rem; padding-top: 1rem; border-top: 1px solid var(--ds-color-border); }
.seller-groups h3, .policy-blockers h3 { margin: 0 0 .7rem; font-size: .85rem; }
.seller-row, .summary-row { display: flex; justify-content: space-between; gap: .75rem; padding: .6rem 0; color: var(--ds-color-text-muted); font-size: .8rem; }
.seller-row strong, .summary-row strong { color: var(--ds-color-text); }
.checkout-summary h2 { padding-bottom: .9rem; border-bottom: 1px solid var(--ds-color-border); }
.summary-total { display: flex; flex-direction: column; gap: .4rem; padding: 1rem 0; border-top: 1px solid var(--ds-color-border); }
.summary-total span { color: var(--ds-color-text-muted); font-size: .78rem; }
.summary-total strong { color: var(--ds-color-primary); font-size: .95rem; }
.policy-blockers { margin-top: .75rem; padding: .9rem; border: 1px solid var(--ds-color-border); border-radius: var(--ds-radius-lg); background: var(--ds-color-surface-muted, var(--ds-color-surface-hover)); }
.policy-blockers ul { margin: 0; padding-inline-start: 1.1rem; color: var(--ds-color-text-muted); font-size: .74rem; line-height: 1.9; }
.place-order-button { width: 100%; justify-content: center; margin-top: 1rem; }
.summary-disclaimer { margin: .75rem 0 0; color: var(--ds-color-text-muted); font-size: .72rem; line-height: 1.8; }
.back-button { width: 100%; justify-content: center; margin-top: .5rem; }
.checkout-empty { padding: 2.5rem 1rem; border: 1px dashed var(--ds-color-border); border-radius: var(--ds-radius-xl); text-align: center; }
.checkout-empty h2 { margin: 0; font-size: 1.1rem; }
.checkout-empty p { color: var(--ds-color-text-muted); }
@media (max-width: 900px) { .checkout-layout { grid-template-columns: minmax(0, 1fr); } .checkout-summary { position: static; } }
@media (max-width: 560px) { .preview-item { flex-direction: column; } .preview-item-price { align-items: flex-start; } }
</style>
