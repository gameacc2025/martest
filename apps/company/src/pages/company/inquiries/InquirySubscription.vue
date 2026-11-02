<script setup>
import WorkspacePageHeading from '@telecom/shared-ui/components/common/WorkspacePageHeading.vue'
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
    const result = response?.data?.data ?? response?.data ?? response
    if (result?.paymentUrl) {
      window.location.assign(result.paymentUrl)
      return
    }
    successMessage.value = 'درخواست ثبت شد. در صورت نبود درگاه آنلاین، اشتراک پس از بررسی و تأیید پرداخت توسط مدیر فعال می‌شود.'
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
      eyebrow="اشتراک و سهمیه خدمات"
      title="اشتراک استعلام شرکت"
      description="طرح فعال، میزان مصرف و درخواست خرید را مدیریت کنید؛ سهمیه‌ها بر اساس دوره اشتراک محاسبه می‌شوند."
      icon="pi pi-wallet"
      heading-id="company-inquiry-subscription-title"
    >
      <template #actions>
        <button type="button" class="secondary refresh-action" :disabled="loading" @click="load">
          <i class="pi pi-refresh" aria-hidden="true"></i> به‌روزرسانی
        </button>
      </template>
    </WorkspacePageHeading>

    <p v-if="errorMessage" class="notice error" role="alert">{{ errorMessage }}</p>
    <p v-if="successMessage" class="notice success" role="status">{{ successMessage }}</p>
    <div v-if="loading" class="subscription-loading" role="status"><i class="pi pi-spin pi-spinner" aria-hidden="true"></i><span>در حال دریافت اطلاعات اشتراک…</span></div>

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
          <span class="quota-label">{{ usageLabels[key] || key }}</span>
          <strong>{{ item.remaining.toLocaleString('fa-IR') }} <small>از {{ item.limit.toLocaleString('fa-IR') }} باقی‌مانده</small></strong>
          <div
            class="meter"
            role="progressbar"
            :aria-label="'مصرف سهمیه ' + (usageLabels[key] || key)"
            aria-valuemin="0"
            :aria-valuemax="Math.max(1, Number(item.limit) || 0)"
            :aria-valuenow="item.limit ? Math.min(Number(item.limit), Number(item.used) || 0) : 0"
            :aria-valuetext="item.limit ? ((Number(item.used) || 0).toLocaleString('fa-IR') + ' مصرف‌شده از ' + Number(item.limit).toLocaleString('fa-IR')) : 'بدون سقف مشخص'"
          >
            <span :style="{ width: (item.limit ? Math.min(100, item.used / item.limit * 100) : 100) + '%' }"></span>
          </div>
        </article>
      </div>
    </section>

    <section class="plans-section">
      <div class="section-heading"><div><span class="eyebrow">انتخاب پلن</span><h2>طرح‌های موجود</h2><p>طرح را انتخاب کنید تا درخواست اشتراک برای بررسی ثبت شود.</p></div></div>
      <div v-if="!loading && !plans.length" class="panel empty">در حال حاضر طرح فعالی برای خرید تعریف نشده است.</div>
      <div class="plans-grid">
        <article v-for="plan in plans" :key="plan.id" class="plan-card" :class="{ chosen: selectedPlanId === plan.id }">
          <div class="plan-head"><h3>{{ plan.name }}</h3><span class="plan-duration"><i class="pi pi-calendar" aria-hidden="true"></i>{{ plan.durationDays.toLocaleString('fa-IR') }} روز</span></div>
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
          <button type="button" class="primary plan-action" :aria-pressed="selectedPlanId === plan.id" :disabled="submitting || !!currentSubscription || !!pendingSubscription" @click="selectedPlanId === plan.id ? requestPlan(plan) : selectedPlanId = plan.id">
            {{ submitting && selectedPlanId === plan.id ? 'در حال ثبت…' : selectedPlanId === plan.id ? 'ثبت درخواست برای بررسی' : 'انتخاب طرح' }}
          </button>
        </article>
      </div>
      <p class="footnote">اگر درگاه آنلاین پیکربندی شده باشد، پس از ثبت درخواست به صفحه پرداخت منتقل می‌شوید. در غیر این صورت درخواست برای بررسی دستی ثبت می‌شود؛ شماره پیگیری به‌تنهایی تأیید پرداخت نیست.</p>
    </section>
  </main>
</template>

<style scoped>
.subscription-page {
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-5);
  min-width: 0;
  color: var(--ds-color-text);
}
.subscription-page h1,
.subscription-page h2,
.subscription-page h3 { margin-top: 0; color: var(--ds-color-text); }
.subscription-page h2 { margin-bottom: .45rem; font-size: var(--ds-font-size-lg); font-weight: var(--ds-font-weight-bold); }
.subscription-page p { margin: .25rem 0 0; color: var(--ds-color-text-muted); font-size: var(--ds-font-size-sm); line-height: 1.85; }
.subscription-page .eyebrow {
  display: inline-flex;
  align-items: center;
  gap: .4rem;
  color: var(--ds-color-primary);
  font-size: var(--ds-font-size-xs);
  font-weight: var(--ds-font-weight-bold);
}
.subscription-page .refresh-action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: .5rem;
  min-height: 2.75rem;
  padding: .65rem .95rem;
  border: 1px solid var(--ds-color-border);
  border-radius: var(--ds-radius-md);
  background: var(--ds-color-surface-alt);
  color: var(--ds-color-text);
  font: inherit;
  font-size: var(--ds-font-size-sm);
  font-weight: var(--ds-font-weight-semibold);
  cursor: pointer;
}
.subscription-page .refresh-action:hover { border-color: var(--ds-color-primary); color: var(--ds-color-primary); }
.subscription-page .refresh-action:disabled { opacity: .55; cursor: not-allowed; }
.subscription-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: .75rem;
  min-height: 8rem;
  border: 1px dashed var(--ds-color-border);
  border-radius: var(--ds-radius-xl);
  color: var(--ds-color-text-muted);
}
.subscription-loading i { color: var(--ds-color-primary); }
.subscription-page .notice {
  padding: .9rem 1rem;
  border: 1px solid transparent;
  border-radius: var(--ds-radius-lg);
  font-size: var(--ds-font-size-sm);
  line-height: 1.8;
}
.subscription-page .notice.error { border-color: color-mix(in srgb, var(--ds-color-danger) 25%, transparent); background: var(--ds-color-danger-soft); color: var(--ds-color-danger); }
.subscription-page .notice.success { border-color: color-mix(in srgb, var(--ds-color-success) 25%, transparent); background: var(--ds-color-success-soft); color: var(--ds-color-success); }
.subscription-page .panel,
.subscription-page .plan-card {
  min-width: 0;
  padding: clamp(1rem, 2vw, 1.4rem);
  border: 1px solid var(--ds-color-border);
  border-radius: var(--ds-radius-xl);
  background: var(--ds-color-surface);
  box-shadow: var(--ds-shadow-xs);
}
.subscription-page .active { border-inline-start: 4px solid var(--ds-color-success); }
.subscription-page .pending { border-inline-start: 4px solid var(--ds-color-warning); }
.subscription-page .status {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  min-height: 2rem;
  padding: .35rem .75rem;
  border-radius: var(--ds-radius-pill);
  font-size: var(--ds-font-size-xs);
  font-weight: var(--ds-font-weight-bold);
}
.subscription-page .active-pill { background: var(--ds-color-success-soft); color: var(--ds-color-success); }
.subscription-page .pending-pill { background: var(--ds-color-warning-soft); color: var(--ds-color-warning); }
.subscription-page .quota-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: var(--ds-space-4);
  margin-top: var(--ds-space-4);
}
.subscription-page .quota {
  display: flex;
  flex-direction: column;
  gap: .7rem;
  min-width: 0;
  padding: 1rem;
  border: 1px solid var(--ds-color-border);
  border-radius: var(--ds-radius-lg);
  background: var(--ds-color-surface-alt);
}
.subscription-page .quota-label { color: var(--ds-color-text-muted); font-size: var(--ds-font-size-sm); font-weight: var(--ds-font-weight-semibold); }
.subscription-page .quota strong { color: var(--ds-color-text); font-size: var(--ds-font-size-xl); font-variant-numeric: tabular-nums; }
.subscription-page .quota small { display: block; margin-top: .15rem; color: var(--ds-color-text-muted); font-size: var(--ds-font-size-xs); font-weight: var(--ds-font-weight-normal); }
.subscription-page .meter { height: .5rem; overflow: hidden; border-radius: var(--ds-radius-pill); background: var(--ds-color-border); }
.subscription-page .meter span { display: block; height: 100%; border-radius: inherit; background: var(--ds-color-primary); transition: width var(--ds-transition); }
.subscription-page .plans-section { display: flex; flex-direction: column; gap: var(--ds-space-4); }
.subscription-page .section-heading h2 { margin: .2rem 0; font-size: var(--ds-font-size-xl); }
.subscription-page .plans-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 250px), 1fr));
  align-items: stretch;
  gap: var(--ds-space-4);
}
.subscription-page .plan-card {
  display: flex;
  flex-direction: column;
  gap: .9rem;
  transition: border-color var(--ds-transition), box-shadow var(--ds-transition), transform var(--ds-transition);
}
.subscription-page .plan-card:hover { transform: translateY(-2px); box-shadow: var(--ds-shadow-md); }
.subscription-page .plan-card.chosen { border-color: var(--ds-color-primary); box-shadow: 0 0 0 2px color-mix(in srgb, var(--ds-color-primary) 16%, transparent); }
.subscription-page .plan-head { display: flex; align-items: flex-start; justify-content: space-between; gap: .65rem; }
.subscription-page .plan-head h3 { margin: 0; font-size: var(--ds-font-size-lg); font-weight: var(--ds-font-weight-bold); }
.subscription-page .plan-duration { display: inline-flex; align-items: center; gap: .35rem; flex: 0 0 auto; color: var(--ds-color-text-muted); font-size: var(--ds-font-size-xs); }
.subscription-page .description { min-height: 3rem; }
.subscription-page .price { display: block; color: var(--ds-color-primary); font-size: var(--ds-font-size-2xl); font-weight: var(--ds-font-weight-extrabold); font-variant-numeric: tabular-nums; }
.subscription-page .plan-card ul { display: grid; gap: .55rem; margin: 0; padding: 1rem 1.2rem 0 0; border-top: 1px solid var(--ds-color-border); color: var(--ds-color-text-muted); font-size: var(--ds-font-size-sm); }
.subscription-page .reference { display: grid; gap: .45rem; color: var(--ds-color-text); font-size: var(--ds-font-size-sm); font-weight: var(--ds-font-weight-semibold); }
.subscription-page input {
  width: 100%;
  min-height: 2.75rem;
  box-sizing: border-box;
  padding: .65rem .8rem;
  border: 1px solid var(--ds-color-border);
  border-radius: var(--ds-radius-md);
  background: var(--ds-color-surface);
  color: var(--ds-color-text);
  font: inherit;
}
.subscription-page input:focus-visible,
.subscription-page button:focus-visible {
  outline: 2px solid var(--ds-color-focus);
  outline-offset: 2px;
}
.subscription-page .primary,
.subscription-page .secondary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 2.75rem;
  padding: .65rem 1rem;
  border: 1px solid transparent;
  border-radius: var(--ds-radius-md);
  font: inherit;
  font-size: var(--ds-font-size-sm);
  font-weight: var(--ds-font-weight-bold);
  cursor: pointer;
}
.subscription-page .primary { margin-top: auto; background: var(--ds-color-primary); color: var(--ds-color-primary-contrast); }
.subscription-page .primary:hover { background: var(--ds-color-primary-hover); }
.subscription-page .secondary { background: var(--ds-color-surface-alt); border-color: var(--ds-color-border); color: var(--ds-color-text); }
.subscription-page button:disabled { opacity: .55; cursor: not-allowed; }
.subscription-page .empty { color: var(--ds-color-text-muted); }
.subscription-page .footnote { padding: .85rem 1rem; border-inline-start: 3px solid var(--ds-color-info); border-radius: var(--ds-radius-md); background: var(--ds-color-info-soft); font-size: var(--ds-font-size-xs); }
@media (max-width: 1100px) {
  .subscription-page .quota-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
@media (max-width: 640px) {
  .subscription-page .quota-grid { grid-template-columns: 1fr; }
  .subscription-page .panel { padding: 1rem; }
  .subscription-page .plan-head { align-items: flex-start; }
}
@media (prefers-reduced-motion: reduce) {
  .subscription-page *, .subscription-page *::before, .subscription-page *::after { transition-duration: .01ms !important; animation-duration: .01ms !important; }
}
</style>