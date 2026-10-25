<script setup>
import { ref, onMounted } from 'vue'
import { useToast } from 'primevue/usetoast'
import Button from 'primevue/button'
import ProgressSpinner from 'primevue/progressspinner'
import { apiGet, apiPatch } from '@telecom/shared-core/http/apiClient'
import { endpoints } from '@telecom/api-client'

const toast = useToast()
const preferences = ref([])
const loading = ref(false)
const saving = ref(false)
const smsAvailable = ref(false)

onMounted(loadPreferences)

async function loadPreferences() {
  loading.value = true
  try {
    const result = await apiGet(endpoints.notifications.preferences)
    preferences.value = result?.data || []
    smsAvailable.value = Boolean(result?.smsAvailable)
  } catch {
    toast.add({ severity: 'error', summary: 'خطا', detail: 'بارگذاری تنظیمات اعلان‌ها انجام نشد.', life: 3500 })
  } finally {
    loading.value = false
  }
}

async function savePreferences() {
  saving.value = true
  try {
    const updates = preferences.value.flatMap(event => ['IN_APP', 'EMAIL'].map(channel => ({
      eventType: event.eventType, channel, enabled: Boolean(event.channels?.[channel]),
    })))
    const result = await apiPatch(endpoints.notifications.preferences, updates)
    if (Array.isArray(result?.data)) preferences.value = result.data
    toast.add({ severity: 'success', summary: 'ذخیره شد', detail: 'تنظیمات اعلان‌ها ذخیره شد.', life: 3000 })
  } catch {
    toast.add({ severity: 'error', summary: 'خطا', detail: 'ذخیره تنظیمات انجام نشد.', life: 3500 })
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <section class="notification-preferences" dir="rtl">
    <header class="page-header"><div><h1>تنظیمات اعلان‌ها</h1><p>کانال دریافت هر نوع اعلان را برای حساب خود انتخاب کنید.</p></div><router-link to="/notifications" class="back-link"><i class="pi pi-arrow-right"></i> بازگشت به صندوق اعلان‌ها</router-link></header>
    <div v-if="loading" class="state"><ProgressSpinner /><p>در حال دریافت تنظیمات…</p></div>
    <div v-else class="settings-card"><div class="table-wrap"><table>
      <thead><tr><th>رویداد</th><th>داخل برنامه</th><th>ایمیل</th><th>پیامک</th></tr></thead>
      <tbody><tr v-for="event in preferences" :key="event.eventType"><th scope="row"><strong>{{ event.label }}</strong><small>{{ event.eventType }}</small></th><td><input v-model="event.channels.IN_APP" type="checkbox" :aria-label="`${event.label}: داخل برنامه`"></td><td><input v-model="event.channels.EMAIL" type="checkbox" :aria-label="`${event.label}: ایمیل`"></td><td><span class="muted">{{ smsAvailable ? (event.channels.SMS ? 'فعال' : 'خاموش') : 'غیرفعال' }}</span></td></tr></tbody>
    </table></div><footer><span class="muted">تنظیمات برای اعلان‌های آینده اعمال می‌شود.</span><Button label="ذخیره تنظیمات" icon="pi pi-save" :loading="saving" :disabled="loading || saving" @click="savePreferences" /></footer></div>
  </section>
</template>

<style scoped>
.notification-preferences{direction:rtl}.page-header{display:flex;align-items:center;justify-content:space-between;gap:1rem;flex-wrap:wrap;margin-bottom:1.5rem}.page-header h1{margin:0;font-size:1.5rem;font-weight:700}.page-header p,.muted{color:var(--text-color-secondary);font-size:.85rem}.back-link{color:var(--primary-color);text-decoration:none}.settings-card{border:1px solid var(--surface-border);border-radius:12px;background:var(--surface-card);overflow:hidden}.table-wrap{overflow-x:auto}table{width:100%;border-collapse:collapse}th,td{padding:.85rem 1rem;border-bottom:1px solid var(--surface-border);text-align:right}thead th{background:var(--surface-ground);font-size:.85rem}td{text-align:center}tbody th{font-weight:500}tbody th small{display:block;color:var(--text-color-secondary);font-size:.72rem;margin-top:.25rem}input[type=checkbox]{width:1.1rem;height:1.1rem;accent-color:var(--primary-color)}footer{display:flex;align-items:center;justify-content:space-between;gap:1rem;padding:1rem;flex-wrap:wrap}.state{text-align:center;padding:3rem}
</style>