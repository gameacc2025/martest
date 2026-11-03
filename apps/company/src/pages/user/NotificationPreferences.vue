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
      eventType: event.eventType,
      channel,
      enabled: Boolean(event.channels?.[channel]),
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
        <div><h1>تنظیمات اعلان‌ها</h1><p>روش دریافت اعلان‌های مربوط به شرکت خود را مدیریت کنید.</p></div>
      </div>
      <router-link to="/notifications" class="back-link"><i class="pi pi-arrow-right"></i> بازگشت به صندوق اعلان‌ها</router-link>
    </header>
    <div v-if="loading" class="state" role="status" aria-live="polite" aria-busy="true"><ProgressSpinner /> <p>در حال دریافت تنظیمات…</p></div>
    <div v-else class="settings-card" :aria-busy="saving ? 'true' : 'false'">
      <div class="table-wrap"><table>
        <thead><tr><th>رویداد</th><th>داخل برنامه</th><th>ایمیل</th><th>پیامک</th></tr></thead>
        <tbody><tr v-for="event in preferences" :key="event.eventType">
          <th scope="row"><strong>{{ event.label }}</strong><small>{{ event.eventType }}</small></th>
          <td><input v-model="event.channels.IN_APP" type="checkbox" :aria-label="`${event.label}: داخل برنامه`"></td>
          <td><input v-model="event.channels.EMAIL" type="checkbox" :aria-label="`${event.label}: ایمیل`"></td>
          <td><span class="muted">{{ smsAvailable ? (event.channels.SMS ? 'فعال' : 'خاموش') : 'غیرفعال' }}</span></td>
        </tr><tr v-if="!preferences.length"><td colspan="4" class="muted">تنظیمی برای نمایش وجود ندارد.</td></tr></tbody>
      </table></div>
      <footer><span class="muted">تنظیمات برای اعلان‌های آینده اعمال می‌شود.</span><Button label="ذخیره تنظیمات" icon="pi pi-save" :loading="saving" :disabled="loading || saving" @click="savePreferences" /></footer>
    </div>
  </section>
</template>

<style scoped>
.notification-preferences { display: flex; flex-direction: column; gap: 1.25rem; direction: rtl; color: var(--ds-color-text); }
.page-header {
  display: flex; align-items: flex-end; justify-content: space-between; flex-wrap: wrap; gap: 1rem;
  margin: 0; padding: 0 0 1rem; border: 0; border-bottom: 1px solid var(--ds-color-border);
  border-radius: 0; background: transparent; box-shadow: none;
}
.preferences-heading-identity { display: flex; align-items: center; min-width: 0; }
.preferences-heading-icon, .preferences-eyebrow { display: none; }
.page-header h1 { margin: 0; color: var(--ds-color-text); font-size: clamp(1.35rem, 2vw, 1.75rem); font-weight: 750; line-height: 1.4; }
.page-header p { margin: .35rem 0 0; color: var(--ds-color-text-muted); font-size: var(--ds-font-size-sm); line-height: 1.8; }
.back-link {
  display: inline-flex; min-height: 2.75rem; align-items: center; gap: .5rem;
  padding: .55rem .8rem; border: 1px solid var(--ds-color-border); border-radius: var(--ds-radius-sm);
  background: var(--ds-color-surface); color: var(--ds-color-text); font-size: var(--ds-font-size-sm);
  font-weight: 600; text-decoration: none;
}
.back-link:hover { background: var(--ds-color-surface-hover); }
.back-link:focus-visible { outline: 2px solid var(--ds-color-focus); outline-offset: 2px; }
.settings-card { overflow: hidden; border: 1px solid var(--ds-color-border); border-radius: var(--ds-radius-md); background: var(--ds-color-surface); box-shadow: none; }
.table-wrap { overflow-x: auto; }
table { width: 100%; min-width: 620px; border-collapse: collapse; }
th, td { padding: 1rem 1.1rem; border-bottom: 1px solid var(--ds-color-border); text-align: start; }
thead th { background: var(--ds-color-surface-alt); color: var(--ds-color-text-muted); font-size: var(--ds-font-size-xs); font-weight: 700; white-space: nowrap; }
tbody th { min-width: 15rem; color: var(--ds-color-text); font-weight: 600; }
tbody th small { display: block; margin-top: .25rem; color: var(--ds-color-text-muted); font-size: var(--ds-font-size-xs); direction: ltr; text-align: right; }
td { min-width: 7rem; text-align: center; }
tbody tr:hover th, tbody tr:hover td { background: var(--ds-color-surface-hover); }
input[type="checkbox"] { width: 1.2rem; height: 1.2rem; accent-color: var(--ds-color-primary); cursor: pointer; }
input[type="checkbox"]:focus-visible { outline: 2px solid var(--ds-color-focus); outline-offset: 3px; }
.muted { color: var(--ds-color-text-muted); font-size: var(--ds-font-size-xs); }
.settings-card footer {
  display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 1rem;
  padding: 1rem 1.25rem; border-top: 1px solid var(--ds-color-border); background: var(--ds-color-surface-alt);
}
.settings-card footer :deep(.p-button) { min-height: 2.75rem; }
.state { display: grid; place-items: center; min-height: 14rem; color: var(--ds-color-text-muted); }
@media (max-width: 640px) {
  .page-header { align-items: stretch; flex-direction: column; }
  .back-link { align-self: flex-start; }
  .settings-card footer { align-items: stretch; flex-direction: column; }
  .settings-card footer :deep(.p-button) { width: 100%; justify-content: center; }
}
</style>