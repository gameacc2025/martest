<script setup>
import { ref, onMounted } from 'vue'
import { apiGet, apiPatch } from '@telecom/shared-core/http/apiClient'
import { endpoints } from '@telecom/api-client'

const preferences = ref([])
const loading = ref(false)
const saving = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const smsAvailable = ref(false)

onMounted(loadPreferences)

async function loadPreferences() {
  loading.value = true
  errorMessage.value = ''
  try {
    const result = await apiGet(endpoints.notifications.preferences)
    preferences.value = result?.data || []
    smsAvailable.value = Boolean(result?.smsAvailable)
  } catch {
    errorMessage.value = 'بارگذاری تنظیمات اعلان‌ها انجام نشد.'
  } finally {
    loading.value = false
  }
}

async function savePreferences() {
  saving.value = true
  errorMessage.value = ''
  successMessage.value = ''
  try {
    const updates = preferences.value.flatMap(event => ['IN_APP', 'EMAIL'].map(channel => ({
      eventType: event.eventType,
      channel,
      enabled: Boolean(event.channels?.[channel]),
    })))
    const result = await apiPatch(endpoints.notifications.preferences, updates)
    if (Array.isArray(result?.data)) preferences.value = result.data
    successMessage.value = 'تنظیمات اعلان‌ها ذخیره شد.'
  } catch {
    errorMessage.value = 'ذخیره تنظیمات انجام نشد. دوباره تلاش کنید.'
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <section class="ds-container ds-page preferences-page" dir="rtl">
    <header class="page-heading">
      <div><p class="eyebrow">حساب کاربری</p><h1>تنظیمات اعلان‌ها</h1><p class="muted">انتخاب کنید هر رویداد از چه راهی به شما اطلاع داده شود.</p></div>
      <router-link class="button button-secondary" to="/notifications">بازگشت به اعلان‌ها</router-link>
    </header>
    <p v-if="errorMessage" class="notice error" role="alert">{{ errorMessage }}</p>
    <p v-if="successMessage" class="notice success" role="status">{{ successMessage }}</p>
    <div v-if="loading" class="state">در حال بارگذاری تنظیمات…</div>
    <div v-else class="settings-card">
      <div class="table-wrap"><table>
        <thead><tr><th>رویداد</th><th>داخل برنامه</th><th>ایمیل</th><th>پیامک</th></tr></thead>
        <tbody>
          <tr v-for="event in preferences" :key="event.eventType">
            <th scope="row"><strong>{{ event.label }}</strong><small>{{ event.eventType }}</small></th>
            <td><input v-model="event.channels.IN_APP" type="checkbox" :aria-label="`${event.label}: اعلان داخل برنامه`"></td>
            <td><input v-model="event.channels.EMAIL" type="checkbox" :aria-label="`${event.label}: ایمیل`"></td>
            <td><span class="unavailable" :title="smsAvailable ? 'در دسترس' : 'ارسال پیامک هنوز فعال نیست'">{{ smsAvailable ? (event.channels.SMS ? 'فعال' : 'خاموش') : 'به‌زودی' }}</span></td>
          </tr>
        </tbody>
      </table></div>
      <footer class="actions"><p>تغییرات پس از ذخیره روی اعلان‌های بعدی اعمال می‌شوند.</p><button class="button button-primary" :disabled="saving" @click="savePreferences">{{ saving ? 'در حال ذخیره…' : 'ذخیره تنظیمات' }}</button></footer>
    </div>
  </section>
</template>

<style scoped>
.preferences-page{direction:rtl}.page-heading{display:flex;align-items:center;justify-content:space-between;gap:1rem;flex-wrap:wrap;margin-bottom:1.5rem}.page-heading h1{margin:.2rem 0;font-size:1.6rem;font-weight:800}.eyebrow{margin:0;color:var(--primary-color);font-size:.85rem}.muted,.actions p{color:var(--text-color-secondary);font-size:.9rem}.button{display:inline-flex;align-items:center;justify-content:center;border:1px solid transparent;border-radius:8px;padding:.65rem .9rem;font:inherit;text-decoration:none;cursor:pointer}.button:disabled{opacity:.5;cursor:not-allowed}.button-primary{background:var(--primary-color);color:#fff}.button-secondary{background:var(--surface-card);border-color:var(--surface-border);color:var(--text-color)}.settings-card{border:1px solid var(--surface-border);border-radius:12px;background:var(--surface-card);overflow:hidden}.table-wrap{overflow-x:auto}table{width:100%;border-collapse:collapse}th,td{padding:.9rem 1rem;border-bottom:1px solid var(--surface-border);text-align:right}thead th{background:var(--surface-ground);font-size:.85rem}tbody th{font-weight:500}tbody th small{display:block;color:var(--text-color-secondary);font-size:.72rem;margin-top:.25rem}td{text-align:center}input[type=checkbox]{width:1.1rem;height:1.1rem;accent-color:var(--primary-color)}.unavailable{font-size:.8rem;color:var(--text-color-secondary)}.actions{display:flex;align-items:center;justify-content:space-between;gap:1rem;padding:1rem;flex-wrap:wrap}.notice{padding:.75rem 1rem;border-radius:8px;margin-bottom:1rem}.error{background:var(--red-50);color:var(--red-700)}.success{background:var(--green-50);color:var(--green-700)}.state{padding:3rem;text-align:center;color:var(--text-color-secondary)}
</style>
