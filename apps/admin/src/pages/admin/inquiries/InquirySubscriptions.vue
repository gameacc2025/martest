<script setup>
import { computed, onMounted, ref } from 'vue'
import { apiGet, apiPost, apiPatch } from '@telecom/shared-core/http/apiClient'
import { endpoints } from '@telecom/api-client'

const loading = ref(false)
const saving = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const settings = ref({ subscriptionEnforcement: false })
const plans = ref([])
const subscriptions = ref([])
const form = ref({
  code: '', name: '', description: '', durationDays: 30, price: 0, currency: 'IRR',
  inquiriesPerPeriod: 5, responsesPerPeriod: 3, internalMessagesPerPeriod: 30, smsPerPeriod: 0, isActive: true,
})
const pending = computed(() => subscriptions.value.filter(item => item.status === 'PENDING_PAYMENT'))
const statusLabels = { PENDING_PAYMENT: 'در انتظار تأیید پرداخت', ACTIVE: 'فعال', EXPIRED: 'منقضی', CANCELLED: 'لغو شده', SUSPENDED: 'تعلیق شده' }
const usageLabels = { inquiriesPerPeriod: 'ثبت استعلام', responsesPerPeriod: 'پاسخ شرکت', internalMessagesPerPeriod: 'پیام داخلی', smsPerPeriod: 'پیامک' }

function unwrap(value) { return value?.data?.data ?? value?.data ?? value ?? {} }
function money(value, currency = 'IRR') {
  const amount = Number(value || 0).toLocaleString('fa-IR')
  return currency === 'IRR' ? amount + ' ریال' : amount + ' ' + currency
}
function date(value) { return value ? new Date(value).toLocaleDateString('fa-IR') : '—' }
function ownerName(item) {
  if (item.company) return 'شرکت: ' + (item.company.name || ('#' + item.company.id))
  if (item.user) return item.user.phone || item.user.email || ('کاربر #' + item.user.id)
  return 'مالک نامشخص'
}

onMounted(loadAll)
async function loadAll() {
  loading.value = true
  errorMessage.value = ''
  try {
    const [settingsResult, plansResult, subsResult] = await Promise.all([
      apiGet(endpoints.inquirySubscriptions.adminSettings),
      apiGet(endpoints.inquirySubscriptions.adminPlans),
      apiGet(endpoints.inquirySubscriptions.adminSubscriptions),
    ])
    settings.value = { subscriptionEnforcement: !!unwrap(settingsResult).subscriptionEnforcement }
    plans.value = Array.isArray(unwrap(plansResult)) ? unwrap(plansResult) : []
    subscriptions.value = Array.isArray(unwrap(subsResult)) ? unwrap(subsResult) : []
  } catch {
    errorMessage.value = 'دریافت اطلاعات اشتراک انجام نشد؛ مجوز مدیریت تنظیمات و اتصال سرور را بررسی کنید.'
  } finally {
    loading.value = false
  }
}
async function toggleEnforcement() {
  errorMessage.value = ''
  successMessage.value = ''
  saving.value = true
  const next = !settings.value.subscriptionEnforcement
  if (next && !window.confirm('با فعال‌کردن این گزینه، حساب‌های بدون اشتراک فعال نمی‌توانند استعلام ثبت کنند یا به استعلام پاسخ دهند. آیا طرح‌ها و اشتراک‌های لازم را آماده کرده‌اید؟')) {
    saving.value = false
    return
  }
  try {
    const result = await apiPatch(endpoints.inquirySubscriptions.adminSettings, { subscriptionEnforcement: next })
    settings.value.subscriptionEnforcement = !!unwrap(result).subscriptionEnforcement
    successMessage.value = settings.value.subscriptionEnforcement
      ? 'کنترل سهمیه فعال شد؛ حساب‌های فاقد اشتراک فعال، دسترسی محدود خواهند داشت.'
      : 'کنترل سهمیه غیرفعال شد.'
  } catch {
    errorMessage.value = 'ذخیره تنظیم کنترل سهمیه انجام نشد.'
  } finally {
    saving.value = false
  }
}
async function createPlan() {
  errorMessage.value = ''
  successMessage.value = ''
  if (!/^[a-z0-9][a-z0-9_-]{1,49}$/.test(form.value.code.trim().toLowerCase())) {
    errorMessage.value = 'کد طرح باید ۲ تا ۵۰ نویسه و شامل حروف انگلیسی کوچک، عدد، خط تیره یا زیرخط باشد.'
    return
  }
  saving.value = true
  try {
    await apiPost(endpoints.inquirySubscriptions.adminPlans, {
      ...form.value,
      code: form.value.code.trim().toLowerCase(),
      name: form.value.name.trim(),
      description: form.value.description.trim() || undefined,
      durationDays: Number(form.value.durationDays),
      price: Number(form.value.price),
      inquiriesPerPeriod: Number(form.value.inquiriesPerPeriod),
      responsesPerPeriod: Number(form.value.responsesPerPeriod),
      internalMessagesPerPeriod: Number(form.value.internalMessagesPerPeriod),
      smsPerPeriod: Number(form.value.smsPerPeriod),
    })
    successMessage.value = 'طرح اشتراک ساخته شد.'
    form.value = { ...form.value, code: '', name: '', description: '' }
    await loadAll()
  } catch (error) {
    errorMessage.value = error?.message || 'ساخت طرح انجام نشد.'
  } finally {
    saving.value = false
  }
}
async function activateSubscription(item) {
  if (!window.confirm('تأیید می‌کنید پرداخت این درخواست را خارج از سامانه بررسی کرده‌اید؟')) return
  errorMessage.value = ''
  successMessage.value = ''
  saving.value = true
  try {
    await apiPost(endpoints.inquirySubscriptions.activate(item.id), { paymentConfirmed: true, notes: 'پرداخت توسط مدیر خارج از سامانه بررسی و تأیید شد.' })
    successMessage.value = 'اشتراک با موفقیت فعال شد.'
    await loadAll()
  } catch (error) {
    errorMessage.value = error?.message || 'فعال‌سازی اشتراک انجام نشد.'
  } finally {
    saving.value = false
  }
}

async function rejectSubscription(item) {
  const notes = window.prompt('دلیل رد درخواست اشتراک #' + item.id + ' را وارد کنید:')
  if (notes === null) return
  if (!notes.trim()) {
    errorMessage.value = 'برای رد درخواست، ثبت دلیل الزامی است.'
    return
  }
  errorMessage.value = ''
  successMessage.value = ''
  saving.value = true
  try {
    await apiPost(endpoints.inquirySubscriptions.reject(item.id), { notes: notes.trim() })
    successMessage.value = 'درخواست اشتراک رد شد.'
    await loadAll()
  } catch (error) {
    errorMessage.value = error?.message || 'رد درخواست انجام نشد.'
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <main class="subscription-admin" dir="rtl">
    <header class="heading">
      <div><h1>مدیریت اشتراک‌های استعلام</h1><p>طرح‌ها، سهمیه‌ها و درخواست‌های خرید را مدیریت کنید.</p></div>
      <button class="secondary" :disabled="loading" @click="loadAll">به‌روزرسانی</button>
    </header>
    <p v-if="errorMessage" class="notice error" role="alert">{{ errorMessage }}</p>
    <p v-if="successMessage" class="notice success" role="status">{{ successMessage }}</p>

    <section class="panel enforcement">
      <div><h2>کنترل اجباری سهمیه</h2><p>در حالت فعال، ثبت استعلام و پاسخ شرکت به اشتراک فعال و سهمیهٔ باقی‌مانده نیاز دارد. قبل از فعال‌کردن، طرح و اشتراک معتبر بسازید.</p></div>
      <button :class="settings.subscriptionEnforcement ? 'danger' : 'primary'" :disabled="saving" @click="toggleEnforcement">
        {{ settings.subscriptionEnforcement ? 'فعال است؛ غیرفعال کن' : 'غیرفعال است؛ فعال کن' }}
      </button>
    </section>

    <section class="panel">
      <h2>ایجاد طرح اشتراک</h2>
      <form class="plan-form" @submit.prevent="createPlan">
        <label>کد یکتا<input v-model="form.code" required maxlength="50" placeholder="basic-monthly"/></label>
        <label>نام طرح<input v-model="form.name" required maxlength="100" placeholder="اشتراک پایه"/></label>
        <label>مدت اعتبار (روز)<input v-model.number="form.durationDays" required type="number" min="1" max="3650"/></label>
        <label>قیمت<input v-model.number="form.price" required type="number" min="0" step="1"/></label>
        <label>واحد پول<select v-model="form.currency"><option value="IRR">ریال</option><option value="TOMAN">تومان</option><option value="EUR">EUR</option><option value="USD">USD</option></select></label>
        <label>سهمیه ثبت استعلام<input v-model.number="form.inquiriesPerPeriod" required type="number" min="0"/></label>
        <label>سهمیه پاسخ شرکت<input v-model.number="form.responsesPerPeriod" required type="number" min="0"/></label>
        <label>سهمیه پیام داخلی<input v-model.number="form.internalMessagesPerPeriod" required type="number" min="0"/></label>
        <label>سهمیه پیامک<input v-model.number="form.smsPerPeriod" required type="number" min="0"/></label>
        <label class="wide">توضیحات<input v-model="form.description" maxlength="1000" placeholder="شرح امکانات و شرایط طرح"/></label>
        <label class="checkbox"><input v-model="form.isActive" type="checkbox"/> طرح فعال باشد</label>
        <button class="primary" type="submit" :disabled="saving">ایجاد طرح</button>
      </form>
    </section>

    <section class="panel">
      <h2>طرح‌های تعریف‌شده ({{ plans.length.toLocaleString('fa-IR') }})</h2>
      <div v-if="!plans.length" class="muted">هنوز طرحی ثبت نشده است.</div>
      <div v-else class="table-wrap"><table><thead><tr><th>طرح</th><th>قیمت</th><th>مدت</th><th>سهمیه‌ها</th><th>وضعیت</th></tr></thead>
        <tbody><tr v-for="plan in plans" :key="plan.id"><td><strong>{{ plan.name }}</strong><small>{{ plan.code }}</small></td><td>{{ money(plan.price, plan.currency) }}</td><td>{{ plan.durationDays }} روز</td><td><small v-for="(label, key) in usageLabels" :key="key">{{ label }}: {{ Number(plan[key] || 0).toLocaleString('fa-IR') }}<br/></small></td><td><span :class="plan.isActive ? 'pill on' : 'pill off'">{{ plan.isActive ? 'فعال' : 'غیرفعال' }}</span></td></tr></tbody>
      </table></div>
    </section>

    <section class="panel">
      <h2>درخواست‌های در انتظار تأیید ({{ pending.length.toLocaleString('fa-IR') }})</h2>
      <p class="muted">فعال‌سازی دستی فقط پس از بررسی واقعی پرداخت انجام شود. شماره پیگیری به‌تنهایی مدرک پرداخت نیست.</p>
      <div v-if="!pending.length" class="muted">درخواستی در انتظار بررسی نیست.</div>
      <div v-else class="table-wrap"><table><thead><tr><th>مالک</th><th>طرح</th><th>شماره پیگیری</th><th>ثبت درخواست</th><th>عملیات</th></tr></thead>
        <tbody><tr v-for="item in pending" :key="item.id"><td>{{ ownerName(item) }}</td><td>{{ item.plan?.name || '—' }}</td><td>{{ item.paymentReference || 'ثبت نشده' }}</td><td>{{ date(item.createdAt) }}</td><td class="actions"><button class="primary small" :disabled="saving" @click="activateSubscription(item)">تأیید پرداخت و فعال‌سازی</button><button class="danger small" :disabled="saving" @click="rejectSubscription(item)">رد درخواست</button></td></tr></tbody>
      </table></div>
    </section>

    <section class="panel">
      <h2>آخرین اشتراک‌ها ({{ subscriptions.length.toLocaleString('fa-IR') }})</h2>
      <div v-if="!subscriptions.length" class="muted">اشتراکی ثبت نشده است.</div>
      <div v-else class="table-wrap"><table><thead><tr><th>مالک</th><th>طرح</th><th>وضعیت</th><th>شروع</th><th>پایان</th></tr></thead>
        <tbody><tr v-for="item in subscriptions" :key="item.id"><td>{{ ownerName(item) }}</td><td>{{ item.plan?.name || '—' }}</td><td><span class="pill" :class="item.status === 'ACTIVE' ? 'on' : item.status === 'PENDING_PAYMENT' ? 'wait' : 'off'">{{ statusLabels[item.status] || item.status }}</span></td><td>{{ date(item.startsAt) }}</td><td>{{ date(item.endsAt) }}</td></tr></tbody>
      </table></div>
    </section>
  </main>
</template>

<style scoped>
.subscription-admin{display:grid;gap:1rem;color:var(--text-color,#1f2937)}.heading{display:flex;justify-content:space-between;align-items:center;gap:1rem}h1{font-size:1.45rem;margin:0 0 .35rem}h2{font-size:1.05rem;margin:0 0 .85rem}p{line-height:1.8;color:var(--text-color-secondary,#64748b);margin:.25rem 0}.panel{padding:1.2rem;border:1px solid var(--surface-border,#e5e7eb);border-radius:12px;background:var(--surface-card,#fff)}.enforcement{display:flex;align-items:center;justify-content:space-between;gap:1rem}.plan-form{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:1rem}.plan-form label{display:grid;gap:.4rem;font-size:.9rem}.plan-form .wide{grid-column:span 2}.plan-form .checkbox{display:flex;align-items:center;gap:.5rem}.plan-form input:not([type=checkbox]),.plan-form select{min-width:0;padding:.7rem;border:1px solid var(--surface-border,#cbd5e1);border-radius:7px;background:var(--surface-ground,#fff);color:inherit}.plan-form input[type=checkbox]{width:1rem;height:1rem}button{border:0;border-radius:7px;padding:.7rem 1rem;cursor:pointer;white-space:nowrap}.primary{background:#0f9e9a;color:#fff}.danger{background:#b91c1c;color:#fff}.actions{display:flex;gap:.5rem;flex-wrap:wrap}.secondary{background:var(--surface-hover,#eef2f7);color:inherit}.danger{background:#b91c1c;color:#fff}.small{padding:.5rem .7rem;font-size:.85rem}button:disabled{opacity:.55;cursor:not-allowed}.notice{padding:.8rem 1rem;border-radius:8px}.error{background:#fee2e2;color:#991b1b}.success{background:#d1fae5;color:#065f46}.muted{color:var(--text-color-secondary,#64748b);padding:.5rem 0}.table-wrap{width:100%;overflow:auto}table{border-collapse:collapse;width:100%;min-width:650px;text-align:right}th,td{padding:.75rem;border-bottom:1px solid var(--surface-border,#e5e7eb);vertical-align:top}th{font-weight:600;font-size:.85rem}td small{display:block;color:var(--text-color-secondary,#64748b);font-size:.8rem;margin-top:.2rem}.pill{display:inline-block;border-radius:999px;padding:.3rem .65rem;font-size:.8rem;white-space:nowrap}.on{background:#d1fae5;color:#065f46}.off{background:#e5e7eb;color:#374151}.wait{background:#fef3c7;color:#92400e}@media(max-width:800px){.plan-form{grid-template-columns:repeat(2,minmax(0,1fr))}.enforcement,.heading{align-items:flex-start;flex-direction:column}}@media(max-width:520px){.plan-form{grid-template-columns:1fr}.plan-form .wide{grid-column:auto}}
</style>
