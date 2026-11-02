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
        <span class="system-setting-symbol"><i class="pi pi-shield"></i></span>
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

      <div v-if="loading" class="system-setting-state" role="status">
        <i class="pi pi-spin pi-spinner"></i> در حال بارگذاری تنظیمات...
      </div>
      <div v-if="error" class="system-setting-error" role="alert">
        <i class="pi pi-exclamation-circle"></i><span>{{ error }}</span>
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
.system-settings-heading {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.25rem 1.5rem;
  border: 1px solid var(--ds-color-border);
  border-radius: var(--ds-radius-xl);
  background: linear-gradient(110deg, color-mix(in srgb, var(--ds-color-primary) 8%, var(--ds-color-surface)), var(--ds-color-surface) 72%);
  box-shadow: var(--ds-shadow-xs);
}
.system-settings-icon,
.system-setting-symbol {
  display: grid;
  place-items: center;
  width: 3.2rem;
  height: 3.2rem;
  flex: 0 0 auto;
  border-radius: 1rem;
  background: var(--ds-color-primary-soft);
  color: var(--ds-color-primary);
  font-size: 1.3rem;
}
.system-settings-heading > div { min-width: 0; }
.system-settings-heading h1 { margin: .2rem 0; color: var(--ds-color-text); font-size: var(--ds-font-size-2xl); font-weight: 800; }
.system-settings-heading p { margin: .35rem 0 0; color: var(--ds-color-text-muted); font-size: var(--ds-font-size-sm); }
.system-setting-card {
  max-width: 56rem;
  padding: clamp(1rem, 2vw, 1.5rem);
  border: 1px solid var(--ds-color-border);
  border-radius: var(--ds-radius-xl);
  background: var(--ds-color-surface);
  box-shadow: var(--ds-shadow-xs);
}
.system-setting-heading { display: flex; align-items: flex-start; gap: 1rem; }
.system-setting-symbol { background: var(--ds-color-info-soft); }
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
.threshold-control :deep(.p-inputnumber-input) { width: 100%; border-radius: var(--ds-radius-md); }
.threshold-control :deep(.p-button) { min-height: 2.75rem; border-radius: var(--ds-radius-md); }
.threshold-control :deep(.p-button:focus-visible),
.threshold-control :deep(.p-inputnumber-input:focus-visible) {
  outline: 2px solid var(--ds-color-focus);
  outline-offset: 2px;
}
.system-setting-state,
.system-setting-note,
.system-setting-error { display: flex; align-items: center; gap: .5rem; margin-top: 1rem; font-size: var(--ds-font-size-sm); line-height: 1.8; }
.system-setting-state,
.system-setting-note { color: var(--ds-color-text-muted); }
.system-setting-error { flex-wrap: wrap; color: var(--ds-color-danger); }
@media (max-width: 640px) {
  .system-settings-heading { align-items: flex-start; padding: 1rem; }
  .system-settings-icon, .system-setting-symbol { width: 2.75rem; height: 2.75rem; }
  .system-setting-heading { flex-direction: column; }
  .threshold-control { align-items: stretch; }
  .threshold-control-row { align-items: stretch; flex-direction: column; }
  .threshold-control :deep(.p-inputnumber), .threshold-control-row :deep(.p-button) { width: 100%; }
}
</style>