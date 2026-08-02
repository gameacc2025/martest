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
    <div class="page-header">
      <h1>تغییر رمز عبور</h1>
    </div>

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
</style>
