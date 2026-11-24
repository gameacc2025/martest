<template>
  <main class="sandbox-payment-page ds-container ds-page" dir="rtl" aria-labelledby="sandbox-payment-title" :aria-busy="loading || confirming">
    <WorkspacePageHeading title="پرداخت آزمایشی" description="این درگاه فقط برای آزمون چرخه سفارش است و هیچ برداشت واقعی انجام نمی‌دهد." icon="pi pi-shield" heading-id="sandbox-payment-title">
      <template #actions><Breadcrumb :home="home" :model="breadcrumbs" /></template>
    </WorkspacePageHeading>
    <section v-if="loading" class="payment-state" role="status"><ProgressSpinner style="width:2rem;height:2rem" />در حال دریافت اطلاعات پرداخت...</section>
    <section v-else-if="error" class="payment-state payment-error" role="alert">
      <strong>اطلاعات پرداخت در دسترس نیست</strong><p>{{ error }}</p>
      <Button label="بازگشت به سفارش‌ها" severity="secondary" outlined @click="router.push({ name: 'customer-orders' })" />
    </section>
    <section v-else-if="attempt" class="payment-card">
      <div class="sandbox-label"><i class="pi pi-info-circle" aria-hidden="true"></i> محیط آزمایشی — بدون تراکنش بانکی واقعی</div>
      <div class="payment-row"><span>شماره سفارش</span><strong>{{ attempt.order.orderNumber }}</strong></div>
      <div class="payment-row"><span>مبلغ قابل پرداخت</span><strong class="payment-amount">{{ formatPrice(attempt.amount, attempt.currency) }}</strong></div>
      <div class="payment-row"><span>وضعیت پرداخت</span><strong>{{ statusLabel(attempt.status) }}</strong></div>
      <div v-if="attempt.expiresAt" class="payment-expiry">مهلت پرداخت: {{ formatDate(attempt.expiresAt) }}</div>
      <p v-if="message" class="payment-message" role="status">{{ message }}</p>
      <Button
        v-if="attempt.status !== 'SUCCEEDED'"
        label="تأیید پرداخت آزمایشی"
        icon="pi pi-check"
        class="confirm-button"
        :loading="confirming"
        :disabled="confirming || attempt.status !== 'CREATED' && attempt.status !== 'PENDING' && attempt.status !== 'REDIRECTED'"
        @click="confirmPayment"
      />
      <Button v-else label="مشاهده سفارش" icon="pi pi-arrow-left" class="confirm-button" @click="router.push({ name: 'customer-order-details', params: { id: attempt.order.id } })" />
      <p class="payment-disclaimer">تأیید این صفحه فقط وضعیت Sandbox را در سرور تغییر می‌دهد. درگاه واقعی، اطلاعات کارت یا پرداخت زنده در این مسیر وجود ندارد.</p>
    </section>
  </main>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Breadcrumb from 'primevue/breadcrumb'
import Button from 'primevue/button'
import ProgressSpinner from 'primevue/progressspinner'
import WorkspacePageHeading from '@telecom/shared-ui/components/common/WorkspacePageHeading.vue'
import { apiGet, apiPost } from '@telecom/shared-core/http/apiClient'
import { endpoints } from '@telecom/api-client'

const route = useRoute()
const router = useRouter()
const attempt = ref(null)
const loading = ref(false)
const confirming = ref(false)
const error = ref('')
const message = ref('')
const home = { icon: 'pi pi-home', to: '/' }
const breadcrumbs = [{ label: 'سفارش‌های من', to: '/orders' }, { label: 'پرداخت آزمایشی' }]

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
  return ({ CREATED: 'ایجاد شده — در انتظار تأیید', PENDING: 'در انتظار تأیید', REDIRECTED: 'در انتظار تأیید', SUCCEEDED: 'موفق', FAILED: 'ناموفق', EXPIRED: 'منقضی شده', CANCELLED: 'لغو شده' })[value] || value
}
async function loadPayment() {
  loading.value = true
  error.value = ''
  try {
    attempt.value = await apiGet(endpoints.retail.sandboxPayment(route.params.authority))
    if (attempt.value?.status === 'SUCCEEDED') message.value = 'این پرداخت قبلاً در محیط آزمایشی تأیید شده است.'
  } catch (err) {
    error.value = err?.serverMessage || err?.message || 'پرداخت پیدا نشد یا به این حساب تعلق ندارد.'
  } finally { loading.value = false }
}
async function confirmPayment() {
  if (confirming.value || !attempt.value) return
  confirming.value = true
  error.value = ''
  message.value = ''
  try {
    const order = await apiPost(endpoints.retail.confirmSandboxPayment(route.params.authority), {})
    message.value = 'پرداخت آزمایشی در سرور تأیید شد.'
    await router.push({ name: 'customer-order-details', params: { id: order.id } })
  } catch (err) {
    error.value = err?.serverMessage || err?.message || 'تأیید پرداخت آزمایشی انجام نشد.'
  } finally { confirming.value = false }
}
onMounted(loadPayment)
</script>

<style scoped>
.sandbox-payment-page { color: var(--ds-color-text); }
.payment-card { max-width: 38rem; margin-inline: auto; padding: 1.25rem; border: 1px solid var(--ds-color-border); border-radius: var(--ds-radius-xl); background: var(--ds-color-surface); }
.sandbox-label { display: flex; align-items: center; gap: .5rem; padding: .75rem; margin-bottom: .75rem; border-radius: var(--ds-radius-md); background: var(--ds-color-surface-hover); color: var(--ds-color-text-muted); font-size: .8rem; }
.payment-row { display: flex; justify-content: space-between; gap: 1rem; padding: .9rem 0; border-bottom: 1px solid var(--ds-color-border); font-size: .85rem; }
.payment-row span { color: var(--ds-color-text-muted); }
.payment-amount { color: var(--ds-color-primary); font-size: 1.05rem; }
.payment-expiry, .payment-disclaimer { margin-top: .8rem; color: var(--ds-color-text-muted); font-size: .75rem; line-height: 1.8; }
.confirm-button { width: 100%; justify-content: center; margin-top: 1rem; }
.payment-state { display: flex; min-height: 14rem; flex-direction: column; align-items: center; justify-content: center; gap: .75rem; color: var(--ds-color-text-muted); text-align: center; }
.payment-error { color: var(--ds-color-danger, var(--ds-status-danger-fg)); }
.payment-message { color: var(--ds-color-success, var(--ds-status-success-fg)); font-size: .8rem; }
</style>
