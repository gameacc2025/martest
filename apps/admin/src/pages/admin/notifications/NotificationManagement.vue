<script setup>
import { ref, onMounted } from 'vue'
import { apiGet, apiPost } from '@telecom/shared-core/http/apiClient'
import { endpoints } from '@telecom/api-client'

const form = ref({ title: '', message: '', audience: 'ALL_ACTIVE', channels: ['IN_APP', 'EMAIL'] })
const sending = ref(false)
const loading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const stats = ref(null)
const deliveries = ref([])
const deliveryMeta = ref({ total: 0, totalPages: 1 })

onMounted(loadMonitoring)

async function sendNotification() {
  errorMessage.value = ''
  successMessage.value = ''
  if (!form.value.channels.length) {
    errorMessage.value = 'حداقل یک کانال ارسال انتخاب کنید.'
    return
  }
  if (!window.confirm('اعلان برای مخاطبان انتخاب‌شده ارسال شود؟')) return
  sending.value = true
  try {
    const result = await apiPost(endpoints.admin.notifications.send, {
      title: form.value.title.trim(),
      message: form.value.message.trim(),
      audience: form.value.audience,
      channels: [...form.value.channels],
    })
    const summary = result?.data || result
    successMessage.value = `درخواست ارسال ثبت شد. مخاطبان: ${summary.recipients ?? 0}، اعلان درون‌برنامه‌ای: ${summary.inAppCreated ?? 0}، ایمیل در صف: ${summary.emailQueued ?? 0}، ایمیل ردشده: ${summary.emailSkipped ?? 0}.`
    form.value.title = ''
    form.value.message = ''
    await loadMonitoring()
  } catch (error) {
    errorMessage.value = error?.message || 'ارسال اعلان انجام نشد. مجوز و اتصال API را بررسی کنید.'
  } finally {
    sending.value = false
  }
}

async function loadMonitoring() {
  loading.value = true
  try {
    const [statsResult, deliveryResult] = await Promise.all([
      apiGet(endpoints.admin.notifications.deliveryStats),
      apiGet(`${endpoints.admin.notifications.deliveries}?page=1&limit=10`),
    ])
    stats.value = statsResult?.data || statsResult
    deliveries.value = Array.isArray(deliveryResult?.data) ? deliveryResult.data : []
    deliveryMeta.value = deliveryResult?.meta || { total: deliveries.value.length, totalPages: 1 }
  } catch {
    // Sending requires notifications.send; monitoring may separately require delivery.view.
    // Keep the compose form usable even when monitoring permission is absent.
  } finally {
    loading.value = false
  }
}

function formatDate(value) {
  return value ? new Date(value).toLocaleString('fa-IR') : '—'
}
function statusLabel(status) {
  return ({ PENDING: 'در صف', SENT: 'ارسال‌شده', FAILED: 'ناموفق', SKIPPED: 'ردشده' })[status] || status || '—'
}
</script>

<template>
  <section class="notification-management" dir="rtl">
    <header class="page-header">
      <div><p class="eyebrow">ارتباط با کاربران</p><h1>مدیریت و ارسال اعلان‌ها</h1><p class="muted">ارسال اطلاعیه به کاربران فعال و پیگیری صف ایمیل.</p></div>
      <router-link to="/notifications" class="back-link"><i class="pi pi-inbox"></i> صندوق اعلان‌های ادمین</router-link>
    </header>

    <div class="management-grid">
      <form class="panel compose-panel" @submit.prevent="sendNotification">
        <h2><i class="pi pi-send"></i> ایجاد اطلاعیه</h2>
        <label for="notification-title">عنوان</label>
        <input id="notification-title" v-model="form.title" required maxlength="120" class="field" placeholder="عنوان کوتاه و روشن">
        <label for="notification-message">متن پیام</label>
        <textarea id="notification-message" v-model="form.message" required maxlength="5000" rows="5" class="field" placeholder="متن اطلاعیه را بنویسید"></textarea>
        <label for="notification-audience">مخاطبان</label>
        <select id="notification-audience" v-model="form.audience" class="field">
          <option value="ALL_ACTIVE">تمام کاربران فعال</option>
          <option value="CUSTOMER">کاربران عادی</option>
          <option value="COMPANY">کاربران شرکت‌ها</option>
          <option value="STAFF">کارکنان سایت</option>
        </select>
        <fieldset class="channel-fieldset">
          <legend>کانال‌های ارسال</legend>
          <label class="check"><input v-model="form.channels" type="checkbox" value="IN_APP"> اعلان داخل برنامه</label>
          <label class="check"><input v-model="form.channels" type="checkbox" value="EMAIL"> ایمیل</label>
          <p class="muted">تنظیمات شخصی کاربران رعایت می‌شود؛ ایمیل‌ها در صف قرار می‌گیرند و توسط worker ارسال می‌شوند. پیامک هنوز فعال نیست.</p>
        </fieldset>
        <p v-if="errorMessage" class="notice error" role="alert">{{ errorMessage }}</p>
        <p v-if="successMessage" class="notice success" role="status">{{ successMessage }}</p>
        <button class="primary-button" type="submit" :disabled="sending || !form.title.trim() || !form.message.trim() || !form.channels.length">{{ sending ? 'در حال ثبت…' : 'تأیید و ارسال اعلان' }}</button>
      </form>

      <aside class="panel status-panel">
        <h2><i class="pi pi-chart-bar"></i> وضعیت تحویل</h2>
        <p v-if="loading" class="muted">در حال بارگذاری آمار…</p>
        <template v-else-if="stats">
          <div class="stat-grid">
            <div><span>کل</span><strong>{{ stats.total ?? 0 }}</strong></div>
            <div><span>در صف</span><strong>{{ stats.byStatus?.PENDING ?? 0 }}</strong></div>
            <div><span>ارسال‌شده</span><strong>{{ stats.byStatus?.SENT ?? 0 }}</strong></div>
            <div><span>ناموفق</span><strong>{{ stats.byStatus?.FAILED ?? 0 }}</strong></div>
          </div>
        </template>
        <p v-else class="muted">آمار در دسترس نیست؛ ممکن است مجوز مشاهده تحویل‌ها لازم باشد.</p>
        <p class="operational-note">تنظیمات SMTP از متغیرهای محیطی بک‌اند خوانده می‌شود؛ اطلاعات محرمانه در این صفحه نمایش داده نمی‌شود.</p>
      </aside>
    </div>

    <section class="panel delivery-panel">
      <div class="section-heading"><h2><i class="pi pi-history"></i> آخرین تحویل‌ها</h2><button class="secondary-button" :disabled="loading" @click="loadMonitoring">به‌روزرسانی</button></div>
      <p v-if="!loading && !deliveries.length" class="muted">رکوردی برای نمایش وجود ندارد یا مجوز مشاهده تاریخچه در دسترس نیست.</p>
      <div v-else class="table-wrap"><table>
        <thead><tr><th>گیرنده</th><th>رویداد</th><th>کانال</th><th>وضعیت</th><th>تلاش</th><th>تاریخ</th></tr></thead>
        <tbody><tr v-for="row in deliveries" :key="row.id">
          <td>{{ row.recipient || ('کاربر #' + row.userId) }}</td><td>{{ row.eventType }}</td><td>{{ row.channel }}</td><td><span class="status" :class="'status-' + String(row.status).toLowerCase()">{{ statusLabel(row.status) }}</span></td><td>{{ row.attempts }} / {{ row.maxAttempts }}</td><td>{{ formatDate(row.createdAt) }}</td>
        </tr></tbody>
      </table></div>
      <p class="muted">نمایش {{ deliveries.length }} مورد از {{ deliveryMeta.total || deliveries.length }} رکورد اخیر.</p>
    </section>
  </section>
</template>

<style scoped>
.notification-management{direction:rtl;display:grid;gap:1rem}.page-header,.section-heading{display:flex;align-items:center;justify-content:space-between;gap:1rem;flex-wrap:wrap}.page-header{margin-bottom:.5rem}.page-header h1{font-size:1.55rem;font-weight:800;margin:.2rem 0}.eyebrow{margin:0;color:var(--primary-color);font-size:.85rem}.muted{color:var(--text-color-secondary);font-size:.85rem;line-height:1.8}.back-link{color:var(--primary-color);text-decoration:none}.management-grid{display:grid;grid-template-columns:minmax(0,1.4fr) minmax(280px,1fr);gap:1rem}.panel{border:1px solid var(--surface-border);border-radius:12px;background:var(--surface-card);padding:1.25rem;min-width:0}.panel h2{font-size:1.05rem;font-weight:750;margin:0 0 1.1rem}.panel h2 i{color:var(--primary-color);margin-left:.4rem}.compose-panel{display:grid;gap:.65rem}.compose-panel label{font-size:.9rem;font-weight:600}.field{width:100%;box-sizing:border-box;border:1px solid var(--surface-border);border-radius:8px;background:var(--surface-ground);color:var(--text-color);padding:.75rem;font:inherit}.field:focus{outline:2px solid color-mix(in srgb,var(--primary-color) 40%,transparent);outline-offset:1px}.channel-fieldset{border:1px solid var(--surface-border);border-radius:8px;padding:.75rem;display:grid;gap:.7rem}.channel-fieldset legend{font-weight:650;padding:0 .4rem}.check{display:flex;align-items:center;gap:.5rem;font-weight:400!important}.check input{accent-color:var(--primary-color)}.primary-button,.secondary-button{border:1px solid transparent;border-radius:8px;padding:.7rem 1rem;font:inherit;cursor:pointer}.primary-button{background:var(--primary-color);color:#fff}.secondary-button{background:var(--surface-ground);border-color:var(--surface-border);color:var(--text-color)}button:disabled{opacity:.5;cursor:not-allowed}.notice{padding:.75rem;border-radius:8px;font-size:.9rem}.error{background:var(--red-50);color:var(--red-700)}.success{background:var(--green-50);color:var(--green-700)}.stat-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:.75rem}.stat-grid div{padding:1rem;border-radius:9px;background:var(--surface-ground);display:grid;gap:.3rem}.stat-grid span{font-size:.8rem;color:var(--text-color-secondary)}.stat-grid strong{font-size:1.5rem}.operational-note{border-top:1px solid var(--surface-border);padding-top:1rem;margin-top:1rem;font-size:.85rem;line-height:1.8;color:var(--text-color-secondary)}.delivery-panel{margin-top:.25rem}.section-heading h2{margin-bottom:.75rem}.table-wrap{overflow-x:auto}table{width:100%;border-collapse:collapse;font-size:.85rem}th,td{padding:.7rem .65rem;text-align:right;border-bottom:1px solid var(--surface-border);white-space:nowrap}thead th{background:var(--surface-ground)}.status{display:inline-block;border-radius:999px;padding:.2rem .5rem;font-size:.75rem}.status-pending{background:var(--orange-50);color:var(--orange-700)}.status-sent{background:var(--green-50);color:var(--green-700)}.status-failed{background:var(--red-50);color:var(--red-700)}.status-skipped{background:var(--surface-ground);color:var(--text-color-secondary)}@media(max-width:850px){.management-grid{grid-template-columns:1fr}.panel{padding:1rem}}
</style>
