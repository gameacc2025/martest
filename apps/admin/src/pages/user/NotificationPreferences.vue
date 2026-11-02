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
    <header class="page-header preferences-heading">
      <div class="preferences-heading-identity">
        <span class="preferences-heading-icon"><i class="pi pi-bell"></i></span>
        <div><span class="preferences-eyebrow">حساب مدیریتی</span><h1>تنظیمات اعلان‌ها</h1><p>کانال دریافت هر نوع اعلان را برای حساب خود انتخاب کنید.</p></div>
      </div>
      <router-link to="/notifications" class="back-link"><i class="pi pi-arrow-right"></i> بازگشت به صندوق اعلان‌ها</router-link>
    </header>
    <div v-if="loading" class="state"><ProgressSpinner /><p>در حال دریافت تنظیمات…</p></div>
    <div v-else class="settings-card"><div class="table-wrap"><table>
      <thead><tr><th>رویداد</th><th>داخل برنامه</th><th>ایمیل</th><th>پیامک</th></tr></thead>
      <tbody><tr v-for="event in preferences" :key="event.eventType"><th scope="row"><strong>{{ event.label }}</strong><small>{{ event.eventType }}</small></th><td><input v-model="event.channels.IN_APP" type="checkbox" :aria-label="`${event.label}: داخل برنامه`"></td><td><input v-model="event.channels.EMAIL" type="checkbox" :aria-label="`${event.label}: ایمیل`"></td><td><span class="muted">{{ smsAvailable ? (event.channels.SMS ? 'فعال' : 'خاموش') : 'غیرفعال' }}</span></td></tr></tbody>
    </table></div><footer><span class="muted">تنظیمات برای اعلان‌های آینده اعمال می‌شود.</span><Button label="ذخیره تنظیمات" icon="pi pi-save" :loading="saving" :disabled="loading || saving" @click="savePreferences" /></footer></div>
  </section>
</template>

<style scoped>
.notification-preferences{direction:rtl}.page-header{display:flex;align-items:center;justify-content:space-between;gap:1rem;flex-wrap:wrap;margin-bottom:1.5rem}.page-header h1{margin:0;font-size:1.5rem;font-weight:700}.page-header p,.muted{color:var(--text-color-secondary);font-size:.85rem}.back-link{color:var(--primary-color);text-decoration:none}.settings-card{border:1px solid var(--surface-border);border-radius:12px;background:var(--surface-card);overflow:hidden}.table-wrap{overflow-x:auto}table{width:100%;border-collapse:collapse}th,td{padding:.85rem 1rem;border-bottom:1px solid var(--surface-border);text-align:right}thead th{background:var(--surface-ground);font-size:.85rem}td{text-align:center}tbody th{font-weight:500}tbody th small{display:block;color:var(--text-color-secondary);font-size:.72rem;margin-top:.25rem}input[type=checkbox]{width:1.1rem;height:1.1rem;accent-color:var(--primary-color)}footer{display:flex;align-items:center;justify-content:space-between;gap:1rem;padding:1rem;flex-wrap:wrap}.state{text-align:center;padding:3rem}

.notification-preferences .page-header {
  padding: var(--ds-space-5) var(--ds-space-6);
  background: var(--ds-color-surface);
  border: 1px solid var(--ds-color-border);
  border-radius: var(--ds-radius-xl);
  box-shadow: var(--ds-shadow-xs);
}
.notification-preferences .page-header h1 { color: var(--ds-color-text); font-size: var(--ds-font-size-2xl); }
.notification-preferences .settings-card {
  border: 1px solid var(--ds-color-border);
  border-radius: var(--ds-radius-xl);
  background: var(--ds-color-surface);
  box-shadow: var(--ds-shadow-xs);
  overflow: hidden;
}
.notification-preferences table { width: 100%; border-collapse: collapse; }
.notification-preferences th,
.notification-preferences td {
  padding: var(--ds-space-4) var(--ds-space-5);
  border-bottom: 1px solid var(--ds-color-border);
  text-align: start;
}
.notification-preferences thead th {
  background: var(--ds-color-surface-alt);
  color: var(--ds-color-text-muted);
  font-size: var(--ds-font-size-xs);
}
@media (max-width: 640px) { .notification-preferences .page-header { padding: var(--ds-space-4); } }


.notification-preferences { display: flex; flex-direction: column; gap: var(--ds-space-5); }
.notification-preferences .page-header { margin-bottom: 0; }
.preferences-heading-identity { display: flex; align-items: center; gap: 1rem; min-width: 0; }
.preferences-heading-icon {
  display: grid;
  place-items: center;
  width: 3.1rem;
  height: 3.1rem;
  flex: 0 0 auto;
  border-radius: var(--ds-radius-lg);
  background: var(--ds-color-primary-soft);
  color: var(--ds-color-primary);
  font-size: 1.25rem;
}
.preferences-eyebrow {
  display: block;
  color: var(--ds-color-primary);
  font-size: var(--ds-font-size-xs);
  font-weight: var(--ds-font-weight-bold);
}
.notification-preferences .page-header h1 { margin: .2rem 0; }
.notification-preferences .page-header p { margin: .25rem 0 0; color: var(--ds-color-text-muted); line-height: 1.7; }
.notification-preferences .back-link {
  display: inline-flex;
  align-items: center;
  gap: .45rem;
  white-space: nowrap;
  text-decoration: none;
  font-weight: var(--ds-font-weight-semibold);
}
.notification-preferences .settings-card footer {
  border-top: 1px solid var(--ds-color-border);
  background: var(--ds-color-surface-alt);
}
.notification-preferences .table-wrap { overflow-x: auto; }
.notification-preferences table { min-width: 38rem; }
.notification-preferences tbody tr:hover { background: var(--ds-color-surface-hover); }
.notification-preferences input[type="checkbox"] { width: 1.15rem; height: 1.15rem; accent-color: var(--ds-color-primary); }
@media (max-width: 640px) {
  .notification-preferences .page-header { align-items: stretch; flex-direction: column; }
  .preferences-heading-identity { align-items: flex-start; }
  .notification-preferences .back-link { align-self: flex-start; }
}

</style>