<template>
  <main class="system-settings-page" dir="rtl">
    <WorkspacePageHeading
      eyebrow="پیکربندی و سیاست‌های سامانه"
      title="تنظیمات سیستم"
      description="مقادیر عملیاتی و قواعد عمومی بازارگاه را مدیریت کنید."
      icon="pi pi-cog"
      heading-id="system-settings-title"
    />

    <section class="system-setting-card" aria-labelledby="product-edit-threshold-title">
      <div class="system-setting-heading">
        <div class="system-setting-copy">
          <h2 id="product-edit-threshold-title">سقف ویرایش‌های پس از تأیید محصول</h2>
          <p>
            هر بار که یک شرکت محتوای محصولِ تأییدشده را ویرایش کند، شمارنده «ویرایش بدون بازبینی» یک واحد افزایش می‌یابد.
            وقتی به این سقف برسد، محصول به‌صورت خودکار برای بازبینی مجدد به وضعیت «در انتظار بررسی» برمی‌گردد و مدیران مطلع می‌شوند.
          </p>
        </div>
      </div>

      <div class="threshold-control">
        <label for="product-edit-threshold">حداکثر دفعات ویرایش</label>
        <div class="threshold-control-row">
          <InputNumber
            inputId="product-edit-threshold"
            v-model="threshold"
            name="productEditThreshold"
            :min="1"
            :max="1000"
            :showButtons="true"
            buttonLayout="horizontal"
            decrementButtonIcon="pi pi-minus"
            incrementButtonIcon="pi pi-plus"
            :disabled="saving || loading || !!error"
          />
          <Button label="ذخیره تنظیمات" icon="pi pi-check" :loading="saving" :disabled="loading || !!error" @click="saveThreshold" />
        </div>
      </div>

      <div v-if="loading" class="system-setting-state" role="status" aria-live="polite" aria-busy="true">
        <i class="pi pi-spin pi-spinner" aria-hidden="true"></i> در حال بارگذاری تنظیمات…
      </div>
      <div v-if="error" class="system-setting-error" role="alert">
        <i class="pi pi-exclamation-circle" aria-hidden="true"></i><span>{{ error }}</span>
        <Button label="تلاش مجدد" icon="pi pi-refresh" text size="small" severity="secondary" @click="loadSettings" />
      </div>
      <p v-else-if="!configured" class="system-setting-note">
        این تنظیم هنوز در سیستم ثبت نشده است؛ مقدار پیش‌فرض (۵) نمایش داده می‌شود.
      </p>
    </section>
  </main>
</template>

<script setup>
import WorkspacePageHeading from '@telecom/shared-ui/components/common/WorkspacePageHeading.vue'
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
<style scoped>
.system-settings-page { display: flex; flex-direction: column; gap: var(--ds-space-5); direction: rtl; }
.system-settings-page .ds-page-heading {
  padding: 0 0 var(--ds-space-4);
  border: 0;
  border-bottom: 1px solid var(--ds-color-border);
  border-radius: 0;
  background: transparent;
  box-shadow: none;
}
.system-setting-card {
  width: 100%;
  max-width: 56rem;
  padding: clamp(1rem, 2vw, 1.5rem);
  border: 1px solid var(--ds-color-border);
  border-radius: var(--ds-radius-md);
  background: var(--ds-color-surface);
}
.system-setting-heading { display: flex; align-items: flex-start; gap: 1rem; }
.system-setting-copy { min-width: 0; }
.system-setting-copy h2 { margin: 0 0 .5rem; color: var(--ds-color-text); font-size: var(--ds-font-size-lg); font-weight: var(--ds-font-weight-bold); }
.system-setting-copy p { max-width: 58rem; margin: 0; color: var(--ds-color-text-muted); font-size: var(--ds-font-size-sm); line-height: 1.9; }
.threshold-control {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 1rem;
  margin-top: 1.5rem;
  padding-top: 1.25rem;
  border-top: 1px solid var(--ds-color-border);
}
.threshold-control > label { display: block; margin-bottom: .4rem; color: var(--ds-color-text); font-size: var(--ds-font-size-sm); font-weight: var(--ds-font-weight-semibold); }
.threshold-control-row { display: flex; align-items: center; gap: .75rem; }
.threshold-control :deep(.p-inputnumber) { width: 10rem; }
.threshold-control :deep(.p-inputnumber-input) { width: 100%; min-height: var(--ds-touch-target); border-radius: var(--ds-radius-md); }
.threshold-control :deep(.p-button) { min-height: var(--ds-touch-target); border-radius: var(--ds-radius-md); }
.threshold-control :deep(.p-button:focus-visible),
.threshold-control :deep(.p-inputnumber-input:focus-visible) { outline: 2px solid var(--ds-color-focus); outline-offset: 2px; }
.system-setting-state,
.system-setting-note,
.system-setting-error { display: flex; align-items: center; gap: .5rem; margin-top: 1rem; font-size: var(--ds-font-size-sm); line-height: 1.8; }
.system-setting-state,
.system-setting-note { color: var(--ds-color-text-muted); }
.system-setting-error { flex-wrap: wrap; color: var(--ds-color-danger); }
@media (max-width: 640px) {
  .system-setting-heading { flex-direction: column; }
  .threshold-control { align-items: stretch; }
  .threshold-control-row { align-items: stretch; flex-direction: column; }
  .threshold-control :deep(.p-inputnumber),
  .threshold-control-row :deep(.p-button) { width: 100%; }
}
</style>