<template>
  <div class="system-settings-page" :style="{ padding: '1.5rem', direction: 'rtl' }">
    <div class="page-header" :style="{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }">
      <h1 style="font-size: 1.4rem; font-weight: 700; margin: 0; color: var(--text-color)">تنظیمات سیستم</h1>
    </div>

    <div class="card" style="background: var(--surface-card); border: 1px solid var(--surface-border); border-radius: 12px; max-width: 42rem;">
      <div class="setting-row" :style="{ padding: '1.5rem', borderBottom: '1px solid var(--surface-border)' }">
        <div class="setting-head" :style="{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }">
          <div>
            <h3 style="margin: 0 0 0.35rem; font-size: 1.05rem; color: var(--text-color)">سقف ویرایش‌های پس از تأیید محصول</h3>
            <p style="margin: 0; color: var(--text-color-secondary); font-size: 0.88rem; line-height: 1.9; max-width: 30rem">
              هر بار که یک شرکت محتوای محصولِ تأییدشده را ویرایش کند، شمارنده «ویرایش بدون بازبینی» یک واحد افزایش می‌یابد.
              وقتی به این سقف برسد، محصول به‌صورت خودکار برای بازبینی مجدد به وضعیت «در انتظار بررسی» برمی‌گردد و مدیران مطلع می‌شوند.
            </p>
          </div>
          <div class="threshold-control" :style="{ display: 'flex', alignItems: 'center', gap: '0.75rem' }">
            <InputNumber v-model="threshold" :min="1" :max="1000" :showButtons="true" buttonLayout="horizontal"
              decrementButtonIcon="pi pi-minus" incrementButtonIcon="pi pi-plus" style="width: 9rem"
              :disabled="saving || loading || !!error" />
            <Button label="ذخیره" icon="pi pi-check" :loading="saving" :disabled="loading || !!error" @click="saveThreshold" />
          </div>
        </div>

        <div v-if="loading" class="loading" style="margin-top: 0.75rem; color: var(--text-color-secondary); font-size: 0.88rem;">
          <i class="pi pi-spin pi-spinner" /> در حال بارگذاری تنظیمات...
        </div>
        <div v-if="error" style="margin-top: 0.75rem; color: var(--p-red-600); font-size: 0.88rem; display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
          <i class="pi pi-exclamation-circle" /> {{ error }}
          <Button label="تلاش مجدد" icon="pi pi-refresh" text size="small" severity="secondary" @click="loadSettings" />
        </div>
        <p v-else-if="!configured" style="margin: 0.75rem 0 0; color: var(--text-color-secondary); font-size: 0.8rem;">
          این تنظیم هنوز در سیستم ثبت نشده است؛ مقدار پیش‌فرض (۵) نمایش داده می‌شود.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { adminApi } from '@telecom/api-client'
import { useToast } from 'primevue/usetoast'
import InputNumber from 'primevue/inputnumber'

const toast = useToast()

const loading = ref(true)
const saving = ref(false)
const error = ref('')
const configured = ref(false)
const threshold = ref(5)

async function loadSettings() {
  loading.value = true
  error.value = ''
  try {
    const res = await adminApi.getSystemSettings()
    const body = res.data
    const settings = body?.data || body || {}
    // The setting may genuinely be absent (never configured). Keep the value
    // but flag it so the UI can show the "default" hint instead of a stale one.
    configured.value = settings.productReviewEditThreshold != null && settings.productReviewEditThreshold !== ''
    threshold.value = Number(settings.productReviewEditThreshold) || 5
  } catch (err) {
    configured.value = false
    const status = err.status ?? err.response?.status
    error.value = err.response?.data?.error?.message || err.serverMessage || (status ? (err.message || 'خطا در دریافت تنظیمات') : 'ارتباط با سرور برقرار نشد')
  } finally {
    loading.value = false
  }
}

async function saveThreshold() {
  const value = Number(threshold.value)
  if (!Number.isInteger(value) || value < 1) {
    toast.add({ severity: 'warn', summary: 'خطا', detail: 'سقف باید عدد صحیح بزرگتر از صفر باشد', life: 3000 })
    return
  }
  saving.value = true
  try {
    await adminApi.updateProductReviewThreshold(value)
    toast.add({ severity: 'success', summary: 'موفقیت', detail: 'سقف ویرایش‌ها با موفقیت ذخیره شد', life: 3000 })
    await loadSettings()
  } catch (err) {
    toast.add({ severity: 'error', summary: 'خطا', detail: err.response?.data?.error?.message || err.message || 'خطا در ذخیره تنظیم', life: 4000 })
  } finally {
    saving.value = false
  }
}

onMounted(loadSettings)
</script>