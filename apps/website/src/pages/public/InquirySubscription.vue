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
    <header class="heading">
      <div><h1>اشتراک استعلام</h1><p>سهمیه استعلام، پاسخ شرکت‌ها، پیام داخلی و پیامک بر اساس طرح اشتراک محاسبه می‌شود.</p></div>
      <button class="secondary" :disabled="loading" @click="load">به‌روزرسانی</button>
    </header>

    <p v-if="errorMessage" class="notice error" role="alert">{{ errorMessage }}</p>
    <p v-if="successMessage" class="notice success" role="status">{{ successMessage }}</p>
    <p v-if="loading">در حال دریافت اطلاعات…</p>

    <section v-if="currentSubscription" class="panel active">
      <div><span class="eyebrow">اشتراک فعلی</span><h2>{{ currentSubscription.plan?.name || 'اشتراک فعال' }}</h2><p>اعتبار تا {{ date(currentSubscription.endsAt) }}</p></div>
      <span class="status active-pill">فعال</span>
    </section>
    <section v-else-if="pendingSubscription" class="panel pending">
      <div><span class="eyebrow">درخواست در انتظار</span><h2>{{ pendingSubscription.plan?.name }}</h2><p>شماره پیگیری: {{ pendingSubscription.paymentReference || 'ثبت نشده' }}</p><p>{{ pendingSubscription.paymentProvider === 'ZARINPAL' ? 'پرداخت آنلاین ثبت شده و نتیجه پس از تأیید سمت سرور به‌روزرسانی می‌شود.' : 'این درخواست تا بررسی و تأیید مدیر فعال نمی‌شود.' }}</p></div>
      <span class="status pending-pill">در انتظار بررسی</span>
    </section>

    <section v-if="quota?.quotas" class="panel">
      <h2>مصرف سهمیه در دوره جاری</h2>
      <div class="quota-grid">
        <article v-for="(item, key) in quota.quotas" :key="key" class="quota">
          <span>{{ usageLabels[key] || key }}</span>
          <strong>{{ item.remaining.toLocaleString('fa-IR') }} <small>از {{ item.limit.toLocaleString('fa-IR') }} باقی‌مانده</small></strong>
          <div class="meter"><span :style="{ width: (item.limit ? Math.min(100, item.used / item.limit * 100) : 100) + '%' }"></span></div>
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
.subscription-page{display:grid;gap:1.25rem;color:var(--text-color,#1f2937)}
.heading,.section-heading{display:flex;justify-content:space-between;align-items:center;gap:1rem}
h1{font-size:1.45rem;margin:0 0 .35rem}h2{font-size:1.08rem;margin:0 0 .75rem}h3{margin:0;font-size:1.05rem}
p{line-height:1.8;color:var(--text-color-secondary,#64748b);margin:.25rem 0}
.panel,.plan-card{background:var(--surface-card,#fff);border:1px solid var(--surface-border,#e5e7eb);border-radius:12px;padding:1.2rem}
.active{border-color:#10b981}.pending{border-color:#f59e0b}
.eyebrow{font-size:.8rem;color:var(--text-color-secondary,#64748b)}
.status{white-space:nowrap;border-radius:999px;padding:.4rem .8rem;font-size:.85rem}.active-pill{background:#d1fae5;color:#065f46}.pending-pill{background:#fef3c7;color:#92400e}
.quota-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:1rem}.quota{padding:1rem;border:1px solid var(--surface-border,#e5e7eb);border-radius:8px;display:grid;gap:.75rem}.quota>span{font-size:.9rem}.quota strong{font-size:1.2rem}.quota small{font-size:.8rem;font-weight:400;color:var(--text-color-secondary,#64748b)}.meter{height:6px;border-radius:999px;background:var(--surface-ground,#f1f5f9);overflow:hidden}.meter span{display:block;height:100%;background:#0ea5a4}
.plans-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:1rem;margin-top:1rem}.plan-card{display:flex;flex-direction:column;gap:1rem}.plan-card.chosen{border-color:#0d9488;box-shadow:0 0 0 1px #0d9488}.plan-head{display:flex;justify-content:space-between;align-items:center;gap:.5rem}.plan-head span{font-size:.8rem;color:var(--text-color-secondary,#64748b)}.description{min-height:3rem}.price{font-size:1.4rem}.plan-card ul{padding-right:1.2rem;margin:0;display:grid;gap:.45rem;font-size:.9rem}.reference{display:grid;gap:.4rem;font-size:.85rem}input{padding:.7rem;border:1px solid var(--surface-border,#cbd5e1);border-radius:7px;background:var(--surface-ground,#fff);color:inherit}
button{border:0;border-radius:7px;padding:.75rem 1rem;cursor:pointer}.primary{background:#0f9e9a;color:#fff;margin-top:auto}.secondary{background:var(--surface-hover,#eef2f7);color:inherit}.primary:disabled,.secondary:disabled{opacity:.55;cursor:not-allowed}
.notice{padding:.8rem 1rem;border-radius:8px}.error{background:#fee2e2;color:#991b1b}.success{background:#d1fae5;color:#065f46}.empty{color:var(--text-color-secondary,#64748b)}.footnote{font-size:.85rem}
@media(max-width:800px){.quota-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.heading,.section-heading{align-items:flex-start;flex-direction:column}}
@media(max-width:480px){.quota-grid{grid-template-columns:1fr}}
</style>
