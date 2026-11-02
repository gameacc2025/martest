<script setup>
import { ref } from 'vue'
import { useToast } from 'primevue/usetoast'
import { apiPatch } from '@telecom/shared-core/http/apiClient'
import { endpoints } from '@telecom/api-client'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Card from 'primevue/card'

const toast = useToast()

const saving = ref(false)

const form = ref({
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
})

async function changePassword() {
  if (!form.value.currentPassword || !form.value.newPassword) {
    toast.add({ severity: 'warn', summary: 'خطا', detail: 'لطفاً رمز عبور فعلی و جدید را وارد کنید', life: 3000 })
    return
  }

  if (form.value.newPassword !== form.value.confirmPassword) {
    toast.add({ severity: 'warn', summary: 'خطا', detail: 'رمز عبور جدید و تکرار آن مطابقت ندارند', life: 3000 })
    return
  }

  if (form.value.newPassword.length < 8) {
    toast.add({ severity: 'warn', summary: 'خطا', detail: 'رمز عبور باید حداقل ۸ کاراکتر باشد', life: 3000 })
    return
  }

  saving.value = true
  try {
    await apiPatch(endpoints.settings.changePassword, {
      currentPassword: form.value.currentPassword,
      newPassword: form.value.newPassword,
    })
    toast.add({ severity: 'success', summary: 'موفقیت', detail: 'رمز عبور با موفقیت تغییر کرد', life: 3000 })
    form.value = { currentPassword: '', newPassword: '', confirmPassword: '' }
  } catch (err) {
    toast.add({ severity: 'error', summary: 'خطا', detail: err.message || 'خطا در تغییر رمز عبور', life: 3000 })
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="change-password-page">
    <header class="page-header security-heading">
      <span class="security-heading-icon"><i class="pi pi-lock"></i></span>
      <div><span class="security-heading-eyebrow">امنیت حساب</span><h1>تغییر رمز عبور</h1><p>برای حفظ امنیت حساب، رمز فعلی و رمز جدید خود را وارد کنید.</p></div>
    </header>

    <Card class="form-section">
      <template #content>
        <div class="field">
          <label>رمز عبور فعلی</label>
          <InputText v-model="form.currentPassword" type="password" class="w-full" />
        </div>
        <div class="field">
          <label>رمز عبور جدید</label>
          <InputText v-model="form.newPassword" type="password" class="w-full" placeholder="حداقل ۸ کاراکتر" />
        </div>
        <div class="field">
          <label>تکرار رمز عبور جدید</label>
          <InputText v-model="form.confirmPassword" type="password" class="w-full" />
        </div>
        <Button label="تغییر رمز عبور" icon="pi pi-lock" :loading="saving" @click="changePassword" />
      </template>
    </Card>
  </div>
</template>

<style scoped>
.change-password-page {
  direction: rtl;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
}

.page-header h1 {
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0;
}

.form-section {
  background: var(--surface-card);
  border: 1px solid var(--surface-border);
  border-radius: var(--content-border-radius);
  max-width: 400px;
}

.change-password-page { display: flex; flex-direction: column; gap: var(--ds-space-5); }
.change-password-page .page-header {
  padding: var(--ds-space-5) var(--ds-space-6);
  background: var(--ds-color-surface);
  border: 1px solid var(--ds-color-border);
  border-radius: var(--ds-radius-xl);
  box-shadow: var(--ds-shadow-xs);
}
.change-password-page .page-header h1 { color: var(--ds-color-text); font-size: var(--ds-font-size-2xl); }
.change-password-page .form-section {
  max-width: 520px;
  border-color: var(--ds-color-border);
  border-radius: var(--ds-radius-xl);
  box-shadow: var(--ds-shadow-xs);
}
.change-password-page .field { gap: var(--ds-space-2); }
.change-password-page label { color: var(--ds-color-text); font-weight: var(--ds-font-weight-semibold); }
.change-password-page :deep(.p-inputtext) { border-radius: var(--ds-radius-md); }
@media (max-width: 640px) { .change-password-page .page-header { padding: var(--ds-space-4); } }


.change-password-page .page-header { margin-bottom: 0; }
.security-heading {
  align-items: center;
  gap: 1rem;
  padding: 1.25rem 1.5rem;
  border: 1px solid var(--ds-color-border);
  border-radius: var(--ds-radius-xl);
  background: var(--ds-color-surface);
  box-shadow: var(--ds-shadow-xs);
}
.security-heading-icon {
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
.security-heading > div { min-width: 0; }
.security-heading-eyebrow { display: block; color: var(--ds-color-primary); font-size: var(--ds-font-size-xs); font-weight: var(--ds-font-weight-bold); }
.security-heading h1 { margin: .2rem 0; color: var(--ds-color-text); font-size: var(--ds-font-size-2xl); font-weight: 800; }
.security-heading p { margin: .35rem 0 0; color: var(--ds-color-text-muted); font-size: var(--ds-font-size-sm); }
@media (max-width: 640px) { .security-heading { align-items: flex-start; padding: 1rem; } }

</style>