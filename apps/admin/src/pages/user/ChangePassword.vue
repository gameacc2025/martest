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
  <main class="change-password-page" aria-labelledby="change-password-title" :aria-busy="saving">
    <div class="page-header">
      <h1 id="change-password-title">تغییر رمز عبور</h1>
    </div>

    <Card class="form-section">
      <template #content>
        <div class="field">
          <label for="current-password">رمز عبور فعلی</label>
          <InputText id="current-password" name="currentPassword" v-model="form.currentPassword" type="password" autocomplete="current-password" required class="w-full" />
        </div>
        <div class="field">
          <label for="new-password">رمز عبور جدید</label>
          <InputText id="new-password" name="newPassword" v-model="form.newPassword" type="password" autocomplete="new-password" minlength="8" required aria-describedby="new-password-hint" class="w-full" placeholder="حداقل ۸ کاراکتر" />
          <small id="new-password-hint" class="field-hint">حداقل ۸ کاراکتر</small>
        </div>
        <div class="field">
          <label for="confirm-password">تکرار رمز عبور جدید</label>
          <InputText id="confirm-password" name="confirmPassword" v-model="form.confirmPassword" type="password" autocomplete="new-password" required class="w-full" />
        </div>
        <Button type="button" label="تغییر رمز عبور" icon="pi pi-lock" :loading="saving" :disabled="saving" @click="changePassword" />
      </template>
    </Card>
  </main>
</template>

<style scoped>
.change-password-page { display: flex; flex-direction: column; gap: var(--ds-space-5); direction: rtl; }
.change-password-page .page-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  margin: 0;
  padding: 0 0 var(--ds-space-4);
  border: 0;
  border-bottom: 1px solid var(--ds-color-border);
  border-radius: 0;
  background: transparent;
  box-shadow: none;
}
.change-password-page .page-header h1 { margin: 0; color: var(--ds-color-text); font-size: var(--ds-font-size-2xl); font-weight: var(--ds-font-weight-bold); }
.change-password-page .page-header p { margin: .35rem 0 0; color: var(--ds-color-text-muted); font-size: var(--ds-font-size-sm); line-height: 1.8; }
.change-password-page .form-section {
  width: 100%;
  max-width: 34rem;
  border: 1px solid var(--ds-color-border);
  border-radius: var(--ds-radius-md);
  background: var(--ds-color-surface);
  box-shadow: none;
}
.change-password-page .field { display: flex; flex-direction: column; gap: var(--ds-space-2); margin-bottom: var(--ds-space-4); }
.change-password-page .field label { color: var(--ds-color-text); font-size: var(--ds-font-size-sm); font-weight: var(--ds-font-weight-semibold); cursor: pointer; }
.change-password-page .field-hint { color: var(--ds-color-text-muted); font-size: var(--ds-font-size-xs); }
.change-password-page :deep(.p-inputtext) { min-height: var(--ds-touch-target); border-radius: var(--ds-radius-md); }
.change-password-page :deep(.p-inputtext:focus-visible),
.change-password-page :deep(.p-button:focus-visible) { outline: 2px solid var(--ds-color-focus); outline-offset: 2px; }
.change-password-page :deep(.p-button) { min-height: var(--ds-touch-target); }
@media (max-width: 640px) { .change-password-page .form-section { max-width: none; } }
</style>