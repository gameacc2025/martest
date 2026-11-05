<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { apiGet, apiPost } from '@telecom/shared-core/http/apiClient'
import { endpoints } from '@telecom/api-client'

const route = useRoute()
const plans = ref([])
const subscriptions = ref([])
const quota = ref(null)
const loading = ref(false)
const submitting = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const paymentReference = ref('')
const selectedPlanId = ref(null)

const currentSubscription = computed(() => subscriptions.value.find(s => s.status === 'ACTIVE' && s.endsAt && new Date(s.endsAt) > new Date()) || null)
const pendingSubscription = computed(() => subscriptions.value.find(s => s.status === 'PENDING_PAYMENT') || null)
const statusLabels = { PENDING_PAYMENT: 'در انتظار بررسی پرداخت', ACTIVE: 'فعال', EXPIRED: 'منقضی', CANCELLED: 'لغوشده', SUSPENDED: 'تعلیق‌شده' }
const usageLabels = {
  INQUIRY_CREATE: 'ثبت استعلام',
  RESPONSE_SUBMIT: 'پاسخ شرکت به استعلام',
  INTERNAL_MESSAGE: 'پیام داخلی',
  SMS: 'پیامک',
}
function money(value, currency = 'IRR') {
  const amount = Number(value || 0).toLocaleString('fa-IR')
  return currency === 'IRR' ? amount + ' ریال' : amount + ' ' + currency
}
function date(value) {
  return value ? new Date(value).toLocaleDateString('fa-IR') : '—'
}
function unwrap(result) { return result?.data?.data ?? result?.data ?? result ?? {} }

onMounted(async () => {
  await load()
  const paymentStatus = String(route.query.payment || '')
  if (paymentStatus === 'success') successMessage.value = 'پرداخت با موفقیت تأیید شد و اشتراک فعال شد.'
  else if (paymentStatus === 'cancelled') errorMessage.value = 'پرداخت لغو شد؛ اشتراک فعال نشده است.'
  else if (paymentStatus === 'failed') errorMessage.value = 'پرداخت تأیید نشد؛ اگر مبلغی کسر شده، با پشتیبانی تماس بگیرید.'
  else if (paymentStatus === 'pending') errorMessage.value = 'تأیید درگاه موقتاً در دسترس نبود؛ درخواست در انتظار بررسی باقی مانده است.'
})
async function load() {
  loading.value = true
  errorMessage.value = ''
  try {
    const [p, s] = await Promise.all([
      apiGet(endpoints.inquirySubscriptions.plans),
      apiGet(endpoints.inquirySubscriptions.mine),
    ])
    plans.value = Array.isArray(unwrap(p)) ? unwrap(p) : []
    const payload = unwrap(s)
    subscriptions.value = Array.isArray(payload.subscriptions) ? payload.subscriptions : []
    quota.value = payload.quota || null
  } catch {
    errorMessage.value = 'دریافت اطلاعات اشتراک انجام نشد. دسترسی حساب و اتصال سرور را بررسی کنید.'
  } finally {
    loading.value = false
  }
}
async function retryPayment() {
  if (!pendingSubscription.value?.id || pendingSubscription.value.paymentProvider !== 'ZARINPAL') return
  submitting.value = true
  errorMessage.value = ''
  successMessage.value = ''
  try {
    const response = await apiPost(endpoints.inquirySubscriptions.verifyPayment(pendingSubscription.value.id), {})
    const result = unwrap(response)
    await load()
    if (result.payment === 'success') successMessage.value = 'پرداخت با موفقیت تأیید شد و اشتراک فعال است.'
    else if (result.payment === 'pending') errorMessage.value = 'تأیید درگاه هنوز در دسترس نیست؛ چند لحظه دیگر دوباره تلاش کنید.'
    else errorMessage.value = 'پرداخت تأیید نشد. اگر مبلغی کسر شده، با پشتیبانی تماس بگیرید.'
  } catch (error) {
    errorMessage.value = error?.message || 'بررسی دوباره پرداخت انجام نشد.'
  } finally {
    submitting.value = false
  }
}

async function requestPlan(plan) {
  errorMessage.value = ''
  successMessage.value = ''
  if (pendingSubscription.value) {
    errorMessage.value = 'یک درخواست اشتراک در انتظار بررسی دارید؛ ابتدا وضعیت همان درخواست مشخص شود.'
    return
  }
  submitting.value = true
  try {
    const response = await apiPost(endpoints.inquirySubscriptions.request, {
      planId: plan.id,
      paymentReference: paymentReference.value.trim() || undefined,
    })
    const result = unwrap(response)
    if (result?.paymentUrl) {
      window.location.assign(result.paymentUrl)
      return
    }
    successMessage.value = 'درخواست ثبت شد. اگر درگاه آنلاین پیکربندی نشده باشد، اشتراک پس از بررسی و تأیید پرداخت توسط مدیر فعال می‌شود.'
    paymentReference.value = ''
    selectedPlanId.value = null
    await load()
  } catch (error) {
    errorMessage.value = error?.message || 'ثبت درخواست اشتراک انجام نشد.'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <main class="subscription-page" dir="rtl">
    <WorkspacePageHeading
      title="اشتراک استعلام"
      description="سهمیه استعلام، پاسخ شرکت‌ها، پیام داخلی و پیامک بر اساس طرح اشتراک محاسبه می‌شود."
      heading-id="public-inquiry-subscription-title"
    >
      <template #actions>
        <button type="button" class="secondary refresh-action" :disabled="loading" @click="load">
          <i class="pi pi-refresh" aria-hidden="true"></i> به‌روزرسانی
        </button>
      </template>
    </WorkspacePageHeading>

    <p v-if="errorMessage" class="notice error" role="alert">{{ errorMessage }}</p>
    <p v-if="successMessage" class="notice success" role="status">{{ successMessage }}</p>
    <p v-if="loading" role="status" aria-live="polite" aria-busy="true">در حال دریافت اطلاعات…</p>

    <section v-if="currentSubscription" class="panel active">
      <div><span class="eyebrow">اشتراک فعلی</span><h2>{{ currentSubscription.plan?.name || 'اشتراک فعال' }}</h2><p>اعتبار تا {{ date(currentSubscription.endsAt) }}</p></div>
      <span class="status active-pill">فعال</span>
    </section>
    <section v-else-if="pendingSubscription" class="panel pending">
      <div><span class="eyebrow">درخواست در انتظار</span><h2>{{ pendingSubscription.plan?.name }}</h2><p>شماره پیگیری: {{ pendingSubscription.paymentProvider === 'ZARINPAL' ? (pendingSubscription.paymentRefId || 'پرداخت آنلاین') : (pendingSubscription.paymentReference || 'ثبت نشده') }}</p><p>{{ pendingSubscription.paymentProvider === 'ZARINPAL' ? 'پرداخت آنلاین ثبت شده؛ اگر تأیید موقتاً ناموفق بود، وضعیت را دوباره بررسی کنید.' : 'این درخواست تا بررسی و تأیید مدیر فعال نمی‌شود.' }}</p><button v-if="pendingSubscription.paymentProvider === 'ZARINPAL'" class="secondary" :disabled="submitting" @click="retryPayment">{{ submitting ? 'در حال بررسی…' : 'بررسی دوباره پرداخت' }}</button></div>
      <span class="status pending-pill">در انتظار بررسی</span>
    </section>

    <section v-if="quota?.quotas" class="panel">
      <h2>مصرف سهمیه در دوره جاری</h2>
      <div class="quota-grid">
        <article v-for="(item, key) in quota.quotas" :key="key" class="quota">
          <span>{{ usageLabels[key] || key }}</span>
          <strong>{{ item.remaining.toLocaleString('fa-IR') }} <small>از {{ item.limit.toLocaleString('fa-IR') }} باقی‌مانده</small></strong>
          <div class="meter" role="progressbar" :aria-label="'مصرف سهمیه ' + (usageLabels[key] || key)" aria-valuemin="0" :aria-valuemax="Math.max(1, Number(item.limit) || 0)" :aria-valuenow="Number(item.used) || 0"><span :style="{ width: (item.limit ? Math.min(100, item.used / item.limit * 100) : 100) + '%' }"></span></div>
        </article>
      </div>
    </section>

    <section class="plans-section">
      <div class="section-heading"><h2>طرح‌های موجود</h2><p>طرح را انتخاب کنید تا درخواست اشتراک برای بررسی ثبت شود.</p></div>
      <div v-if="!loading && !plans.length" class="panel empty">در حال حاضر طرح فعالی برای خرید تعریف نشده است.</div>
      <div class="plans-grid">
        <article v-for="plan in plans" :key="plan.id" class="plan-card" :class="{ chosen: selectedPlanId === plan.id }">
          <div class="plan-head"><h3>{{ plan.name }}</h3><span>{{ plan.durationDays.toLocaleString('fa-IR') }} روز</span></div>
          <p class="description">{{ plan.description || 'طرح اشتراک خدمات استعلام' }}</p>
          <strong class="price">{{ money(plan.price, plan.currency) }}</strong>
          <ul>
            <li>ثبت استعلام: {{ plan.inquiriesPerPeriod.toLocaleString('fa-IR') }}</li>
            <li>پاسخ شرکت: {{ plan.responsesPerPeriod.toLocaleString('fa-IR') }}</li>
            <li>پیام داخلی: {{ plan.internalMessagesPerPeriod.toLocaleString('fa-IR') }}</li>
            <li>پیامک: {{ plan.smsPerPeriod.toLocaleString('fa-IR') }}</li>
          </ul>
          <label v-if="selectedPlanId === plan.id" class="reference">شماره پیگیری پرداخت (در صورت پرداخت خارج از سامانه)
            <input v-model="paymentReference" maxlength="120" placeholder="شماره پیگیری"/>
          </label>
          <button class="primary" :disabled="submitting || !!currentSubscription || !!pendingSubscription" @click="selectedPlanId === plan.id ? requestPlan(plan) : selectedPlanId = plan.id">
            {{ submitting && selectedPlanId === plan.id ? 'در حال ثبت…' : selectedPlanId === plan.id ? 'ثبت درخواست برای بررسی' : 'انتخاب طرح' }}
          </button>
        </article>
      </div>
      <p class="footnote">در صورت پیکربندی درگاه آنلاین، پس از انتخاب طرح به صفحه پرداخت منتقل می‌شوید. در غیر این صورت درخواست برای بررسی دستی ثبت می‌شود؛ شماره پیگیری به‌تنهایی تأیید پرداخت نیست.</p>
    </section>
  </main>
</template>

<style scoped>
.subscription-page { display: flex; flex-direction: column; gap: 1.25rem; max-width: 80rem; margin: 0 auto; padding: clamp(1rem, 2vw, 1.75rem); direction: rtl; color: var(--ds-color-text); }
.subscription-page .panel { padding: 1.25rem; border: 1px solid var(--ds-color-border); border-radius: var(--ds-radius-md); background: var(--ds-color-surface); box-shadow: var(--tm-card-shadow); }
.subscription-page .panel.active { border-inline-start: 3px solid var(--ds-color-success); }
.subscription-page .panel.pending { border-inline-start: 3px solid var(--ds-color-warning); }
.subscription-page .quota-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr)); gap: .75rem; margin-top: 1rem; }
.subscription-page .quota { display: grid; gap: .5rem; padding: .85rem; border: 1px solid var(--ds-color-border); border-radius: var(--ds-radius-sm); background: var(--ds-color-surface-alt); }
.subscription-page .quota strong { color: var(--ds-color-text); font-size: 1.15rem; font-variant-numeric: tabular-nums; }
.subscription-page .quota small { color: var(--ds-color-text-muted); font-size: .75rem; font-weight: 400; }
.subscription-page .meter { overflow: hidden; height: .45rem; border-radius: 999px; background: var(--ds-color-border); }
.subscription-page .meter > span { display: block; height: 100%; border-radius: inherit; background: var(--ds-color-primary); transition: width var(--ds-transition-fast); }
.subscription-page .plans-section { display: grid; gap: 1rem; }
.subscription-page .section-heading {
  display: flex; align-items: flex-end; justify-content: space-between; flex-wrap: wrap;
  gap: .75rem; padding-bottom: .75rem; border-bottom: 1px solid var(--ds-color-border);
}
.subscription-page .section-heading h2 { margin: 0; color: var(--ds-color-text); font-size: 1.15rem; }
.subscription-page .section-heading p { margin: .3rem 0 0; color: var(--ds-color-text-muted); font-size: var(--ds-font-size-sm); }
.subscription-page .status { display: inline-flex; align-items: center; min-height: 1.75rem; padding: .2rem .65rem; border-radius: 999px; font-size: .75rem; font-weight: 700; white-space: nowrap; }
.subscription-page .active-pill { background: color-mix(in srgb, var(--ds-color-success) 12%, var(--ds-color-surface)); color: var(--ds-color-success); }
.subscription-page .pending-pill { background: color-mix(in srgb, var(--ds-color-warning) 12%, var(--ds-color-surface)); color: var(--ds-color-warning); }
.subscription-page .plans-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 17rem), 1fr)); gap: 1rem; margin-top: 1rem; }
.subscription-page .plan-card { display: flex; min-width: 0; flex-direction: column; gap: 1rem; padding: 1.25rem; border: 1px solid var(--ds-color-border); border-radius: var(--ds-radius-md); background: var(--ds-color-surface); box-shadow: var(--tm-card-shadow); transition: border-color var(--ds-transition-fast), background-color var(--ds-transition-fast); }
.subscription-page .plan-card.chosen { border-color: var(--ds-color-primary); box-shadow: inset 0 0 0 1px var(--ds-color-primary); }
.subscription-page .plan-head { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: .5rem; }
.subscription-page .plan-head h3 { margin: 0; color: var(--ds-color-text); font-size: 1.05rem; }
.subscription-page .plan-head span { color: var(--ds-color-text-muted); font-size: .8rem; }
.subscription-page .description { min-height: 3rem; margin: 0; color: var(--ds-color-text-muted); line-height: 1.8; }
.subscription-page .price { color: var(--ds-color-text); font-size: 1.5rem; font-weight: 750; font-variant-numeric: tabular-nums; }
.subscription-page .plan-card ul { display: grid; gap: .5rem; margin: 0; padding-inline-start: 1.2rem; color: var(--ds-color-text-muted); font-size: .9rem; }
.subscription-page .reference { display: grid; gap: .4rem; color: var(--ds-color-text); font-size: .85rem; }
.subscription-page input { min-height: 2.75rem; padding: .65rem .75rem; border: 1px solid var(--ds-color-border); border-radius: var(--ds-radius-sm); background: var(--ds-color-surface); color: inherit; font: inherit; }
.subscription-page input:focus-visible { outline: 2px solid var(--ds-color-focus); outline-offset: 2px; }
.subscription-page button { min-height: 2.75rem; font-family: inherit; }
.subscription-page .notice { padding: .75rem 1rem; border: 1px solid transparent; border-radius: var(--ds-radius-sm); }
.subscription-page .notice.error { border-color: color-mix(in srgb, var(--ds-color-danger) 30%, transparent); background: color-mix(in srgb, var(--ds-color-danger) 8%, var(--ds-color-surface)); color: var(--ds-color-danger); }
.subscription-page .notice.success { border-color: color-mix(in srgb, var(--ds-color-success) 30%, transparent); background: color-mix(in srgb, var(--ds-color-success) 8%, var(--ds-color-surface)); color: var(--ds-color-success); }
.subscription-page .primary { padding: .7rem 1rem; border: 1px solid var(--ds-color-primary); border-radius: var(--ds-radius-sm); background: var(--ds-color-primary); color: var(--ds-color-primary-contrast); font-weight: 700; cursor: pointer; }
.subscription-page .primary:hover { background: var(--ds-color-primary-hover); }
.subscription-page .secondary { padding: .65rem .9rem; border: 1px solid var(--ds-color-border); border-radius: var(--ds-radius-sm); background: var(--ds-color-surface); color: var(--ds-color-text); cursor: pointer; }
.subscription-page button:focus-visible { outline: 2px solid var(--ds-color-focus); outline-offset: 2px; }
.subscription-page button:disabled { opacity: .55; cursor: not-allowed; }
.subscription-page .state { padding: 2rem; text-align: center; color: var(--ds-color-text-muted); }
@media (max-width: 640px) { .subscription-page .plan-card { padding: 1rem; } }
@media (prefers-reduced-motion: reduce) { .subscription-page .meter > span, .subscription-page .plan-card { transition: none; } }
</style>