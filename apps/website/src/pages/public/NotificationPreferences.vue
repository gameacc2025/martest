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
      <div class="preferences-heading-identity">
        
        <div><h1>تنظیمات اعلان‌ها</h1><p class="muted">انتخاب کنید هر رویداد از چه راهی به شما اطلاع داده شود.</p></div>
      </div>
      <router-link class="button button-secondary" to="/notifications">بازگشت به اعلان‌ها</router-link>
    </header>
    <p v-if="errorMessage" class="notice error" role="alert">{{ errorMessage }}</p>
    <p v-if="successMessage" class="notice success" role="status">{{ successMessage }}</p>
    <div v-if="loading" class="state" role="status" aria-live="polite" aria-busy="true">در حال بارگذاری تنظیمات…</div>
    <div v-else class="settings-card" :aria-busy="saving ? 'true' : 'false'">
      <div class="table-wrap"><table>
        <thead><tr><th>رویداد</th><th>داخل برنامه</th><th>ایمیل</th><th>پیامک</th></tr></thead>
        <tbody>
          <tr v-for="event in preferences" :key="event.eventType">
            <th scope="row"><strong>{{ event.label }}</strong><small>{{ event.eventType }}</small></th>
            <td><input v-model="event.channels.IN_APP" type="checkbox" :aria-label="`${event.label}: اعلان داخل برنامه`"></td>
            <td><input v-model="event.channels.EMAIL" type="checkbox" :aria-label="`${event.label}: ایمیل`"></td>
            <td><span class="unavailable" :title="smsAvailable ? 'در دسترس' : 'ارسال پیامک هنوز فعال نیست'">{{ smsAvailable ? (event.channels.SMS ? 'فعال' : 'خاموش') : 'به‌زودی' }}</span></td>
          </tr>
          <tr v-if="!preferences.length"><td colspan="4" class="muted">تنظیمی برای نمایش وجود ندارد.</td></tr>
        </tbody>
      </table></div>
      <footer class="actions"><p>تغییرات پس از ذخیره روی اعلان‌های بعدی اعمال می‌شوند.</p><button class="button button-primary" :disabled="saving" @click="savePreferences">{{ saving ? 'در حال ذخیره…' : 'ذخیره تنظیمات' }}</button></footer>
    </div>
  </section>
</template>

<style scoped>
.preferences-page { display: flex; flex-direction: column; gap: 1.25rem; direction: rtl; color: var(--ds-color-text); }
.page-heading {
  display: flex; align-items: flex-end; justify-content: space-between; flex-wrap: wrap; gap: 1rem;
  margin: 0; padding: 0 0 1rem; border: 0; border-bottom: 1px solid var(--ds-color-border);
  border-radius: 0; background: transparent; box-shadow: none;
}
.preferences-heading-identity { display: flex; align-items: center; min-width: 0; }
.preferences-heading-icon, .eyebrow { display: none; }
.page-heading h1 { margin: 0; color: var(--ds-color-text); font-size: clamp(1.35rem, 2vw, 1.75rem); font-weight: 750; line-height: 1.4; }
.page-heading .muted { margin: .35rem 0 0; color: var(--ds-color-text-muted); font-size: var(--ds-font-size-sm); line-height: 1.8; }
.button {
  display: inline-flex; min-height: 2.75rem; align-items: center; justify-content: center; gap: .45rem;
  padding: .6rem .9rem; border: 1px solid transparent; border-radius: var(--ds-radius-sm);
  font: inherit; font-size: var(--ds-font-size-sm); font-weight: 650; text-decoration: none; cursor: pointer;
}
.button-primary { background: var(--ds-color-primary); color: var(--ds-color-on-primary); }
.button-primary:hover { background: var(--ds-color-primary-hover); }
.button-secondary { background: var(--ds-color-surface); border-color: var(--ds-color-border); color: var(--ds-color-text); }
.button-secondary:hover { background: var(--ds-color-surface-hover); }
.button:focus-visible { outline: 2px solid var(--ds-color-focus); outline-offset: 2px; }
.button:disabled { opacity: .55; cursor: not-allowed; }
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
.unavailable { color: var(--ds-color-text-muted); font-size: var(--ds-font-size-xs); }
.actions {
  display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 1rem;
  padding: 1rem 1.25rem; border-top: 1px solid var(--ds-color-border); background: var(--ds-color-surface-alt);
}
.actions p { margin: 0; color: var(--ds-color-text-muted); font-size: var(--ds-font-size-sm); }
.notice { padding: .75rem 1rem; border: 1px solid transparent; border-radius: var(--ds-radius-sm); margin: 0; }
.error { border-color: color-mix(in srgb, var(--ds-color-danger) 25%, transparent); background: color-mix(in srgb, var(--ds-color-danger) 8%, var(--ds-color-surface)); color: var(--ds-color-danger); }
.success { border-color: color-mix(in srgb, var(--ds-color-success) 25%, transparent); background: color-mix(in srgb, var(--ds-color-success) 8%, var(--ds-color-surface)); color: var(--ds-color-success); }
.state { padding: 3rem; text-align: center; color: var(--ds-color-text-muted); }
@media (max-width: 640px) {
  .page-heading { align-items: stretch; flex-direction: column; }
  .page-heading .button { align-self: flex-start; }
  .actions { align-items: stretch; flex-direction: column; }
  .actions .button { width: 100%; }
}
</style>