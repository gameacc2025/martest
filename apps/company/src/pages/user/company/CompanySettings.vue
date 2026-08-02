<script setup>
import { ref, onMounted } from 'vue'
import { useToast } from 'primevue/usetoast'
import { apiGet, apiPatch } from '@telecom/shared-core/http/apiClient'
import { endpoints } from '@telecom/api-client'
import { useAuthStore } from '../../../stores/auth'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import ProgressSpinner from 'primevue/progressspinner'
import Tag from 'primevue/tag'
import ToggleSwitch from 'primevue/toggleswitch'
import Tab from 'primevue/tab'
import TabList from 'primevue/tablist'
import TabPanel from 'primevue/tabpanel'
import TabPanels from 'primevue/tabpanels'
import Tabs from 'primevue/tabs'

const toast = useToast()
const authStore = useAuthStore()

const activeTab = ref('profile')
const loading = ref(false)
const savingProfile = ref(false)
const savingContact = ref(false)
const companyId = ref(null)

const profile = ref({
  name: '',
  nameEn: '',
  description: '',
})

const contact = ref({
  email: '',
  phone: '',
  address: '',
  website: '',
})

const notifications = ref({
  emailInquiryAlerts: true,
  emailProductAlerts: true,
  emailNewMessages: true,
})

const companyMeta = ref({
  nationalId: '',
  registrationNumber: '',
  status: '',
  isVerified: false,
})

onMounted(() => {
  companyId.value = authStore.companyId

  if (companyId.value) fetchCompany()
})

async function fetchCompany() {
  loading.value = true
  try {
    const response = await apiGet(`${endpoints.companies.get(companyId.value)}`)
    const company = response.data || response
    profile.value = {
      name: company.name || '',
      nameEn: company.nameEn || '',
      description: company.description || '',
    }
    contact.value = {
      email: company.email || '',
      phone: company.phone || '',
      address: company.address || '',
      website: company.website || '',
    }
    companyMeta.value = {
      nationalId: company.nationalId || '',
      registrationNumber: company.registrationNumber || '',
      status: company.status || '',
      isVerified: company.isVerified || false,
    }
  } catch (err) {
    toast.add({ severity: 'error', summary: 'خطا', detail: 'خطا در دریافت اطلاعات شرکت', life: 3000 })
  } finally {
    loading.value = false
  }
}

async function saveProfile() {
  savingProfile.value = true
  try {
    await apiPatch(endpoints.companies.update(companyId.value), profile.value)
    toast.add({ severity: 'success', summary: 'موفقیت', detail: 'اطلاعات پروفایل بروزرسانی شد', life: 3000 })
  } catch (err) {
    toast.add({ severity: 'error', summary: 'خطا', detail: err.message || 'خطا در بروزرسانی', life: 3000 })
  } finally {
    savingProfile.value = false
  }
}

async function saveContact() {
  savingContact.value = true
  try {
    await apiPatch(endpoints.companies.update(companyId.value), contact.value)
    toast.add({ severity: 'success', summary: 'موفقیت', detail: 'اطلاعات تماس بروزرسانی شد', life: 3000 })
  } catch (err) {
    toast.add({ severity: 'error', summary: 'خطا', detail: err.message || 'خطا در بروزرسانی', life: 3000 })
  } finally {
    savingContact.value = false
  }
}

function saveNotifications() {
  toast.add({ severity: 'success', summary: 'موفقیت', detail: 'تنظیمات اعلان‌ها ذخیره شد', life: 3000 })
}

const statusLabels = { ACTIVE: 'فعال', PENDING: 'در انتظار تأیید', INACTIVE: 'غیرفعال', SUSPENDED: 'تعلیق' }
const statusSeverity = { ACTIVE: 'success', PENDING: 'warn', INACTIVE: 'secondary', SUSPENDED: 'danger' }
</script>

<template>
  <div class="settings-page">
    <div class="page-header">
      <h1>تنظیمات شرکت</h1>
    </div>

    <div v-if="loading" class="text-center py-8">
      <ProgressSpinner />
    </div>

    <template v-else>
      <Tabs v-model:value="activeTab">
        <TabList>
          <Tab value="profile">پروفایل شرکت</Tab>
          <Tab value="contact">اطلاعات تماس</Tab>
          <Tab value="notifications">اعلان‌ها</Tab>
          <Tab value="security">امنیت</Tab>
        </TabList>
        <TabPanels>
          <!-- Profile Tab -->
          <TabPanel value="profile">
            <div class="tab-content">
              <div class="meta-info">
                <div class="meta-item">
                  <span class="meta-label">شناسه ملی</span>
                  <span class="meta-value">{{ companyMeta.nationalId || '—' }}</span>
                </div>
                <div class="meta-item">
                  <span class="meta-label">شماره ثبت</span>
                  <span class="meta-value">{{ companyMeta.registrationNumber || '—' }}</span>
                </div>
                <div class="meta-item">
                  <span class="meta-label">وضعیت</span>
                  <Tag :value="statusLabels[companyMeta.status] || companyMeta.status" :severity="statusSeverity[companyMeta.status] || 'secondary'" />
                </div>
                <div class="meta-item">
                  <span class="meta-label">تأیید</span>
                  <Tag v-if="companyMeta.isVerified" value="تأیید شده" severity="success" />
                  <Tag v-else value="در انتظار تأیید" severity="warn" />
                </div>
              </div>

              <div class="form-section">
                <h3>اطلاعات پایه</h3>
                <div class="field">
                  <label>نام شرکت</label>
                  <InputText v-model="profile.name" class="w-full" />
                </div>
                <div class="field">
                  <label>نام انگلیسی</label>
                  <InputText v-model="profile.nameEn" class="w-full" />
                </div>
                <div class="field">
                  <label>توضیحات</label>
                  <Textarea v-model="profile.description" rows="4" class="w-full" />
                </div>
                <div class="field">
                  <label>لوگو</label>
                  <div class="logo-upload">
                    <div class="logo-preview">
                      <i class="pi pi-building"></i>
                    </div>
                    <Button label="تغییر لوگو" icon="pi pi-upload" severity="secondary" outlined size="small" />
                  </div>
                </div>
              </div>

              <div class="tab-actions">
                <Button label="ذخیره پروفایل" icon="pi pi-check" :loading="savingProfile" @click="saveProfile" />
              </div>
            </div>
          </TabPanel>

          <!-- Contact Tab -->
          <TabPanel value="contact">
            <div class="tab-content">
              <div class="form-section">
                <h3>اطلاعات تماس</h3>
                <div class="field">
                  <label>ایمیل</label>
                  <InputText v-model="contact.email" class="w-full" type="email" />
                </div>
                <div class="field">
                  <label>تلفن</label>
                  <InputText v-model="contact.phone" class="w-full" />
                </div>
                <div class="field">
                  <label>آدرس</label>
                  <Textarea v-model="contact.address" rows="3" class="w-full" />
                </div>
                <div class="field">
                  <label>وب‌سایت</label>
                  <InputText v-model="contact.website" class="w-full" placeholder="https://" />
                </div>
              </div>

              <div class="tab-actions">
                <Button label="ذخیره اطلاعات تماس" icon="pi pi-check" :loading="savingContact" @click="saveContact" />
              </div>
            </div>
          </TabPanel>

          <!-- Notifications Tab -->
          <TabPanel value="notifications">
            <div class="tab-content">
              <div class="form-section">
                <h3>تنظیمات اعلان‌ها</h3>
                <div class="switch-list">
                  <div class="switch-row">
                    <div>
                      <span class="switch-label">اعلان استعلام‌ها</span>
                      <small class="switch-hint">دریافت ایمیل هنگام دریافت استعلام جدید</small>
                    </div>
                    <ToggleSwitch v-model="notifications.emailInquiryAlerts" />
                  </div>
                  <div class="switch-row">
                    <div>
                      <span class="switch-label">اعلان محصولات</span>
                      <small class="switch-hint">دریافت ایمیل هنگام تأیید یا رد محصول</small>
                    </div>
                    <ToggleSwitch v-model="notifications.emailProductAlerts" />
                  </div>
                  <div class="switch-row">
                    <div>
                      <span class="switch-label">اعلان پیام‌ها</span>
                      <small class="switch-hint">دریافت ایمیل هنگام دریافت پیام جدید</small>
                    </div>
                    <ToggleSwitch v-model="notifications.emailNewMessages" />
                  </div>
                </div>
              </div>

              <div class="tab-actions">
                <Button label="ذخیره تنظیمات" icon="pi pi-check" @click="saveNotifications" />
              </div>
            </div>
          </TabPanel>

          <!-- Security Tab -->
          <TabPanel value="security">
            <div class="tab-content">
              <div class="form-section">
                <h3>تغییر رمز عبور</h3>
                <p class="section-hint">برای تغییر رمز عبور به صفحه اختصاصی مراجعه کنید.</p>
                <router-link :to="{ name: 'change-password' }">
                  <Button label="تغییر رمز عبور" icon="pi pi-key" severity="secondary" outlined />
                </router-link>
              </div>

              <div class="form-section">
                <h3>جلسات فعال</h3>
                <p class="section-hint">مدیریت دستگاه‌های متصل به حساب شما.</p>
                <div class="session-item">
                  <div class="session-info">
                    <i class="pi pi-desktop"></i>
                    <div>
                      <span class="session-device">مرورگر فعلی</span>
                      <span class="session-time">آخرین فعالیت: همین الان</span>
                    </div>
                  </div>
                  <Tag value="فعال" severity="success" />
                </div>
              </div>
            </div>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </template>
  </div>
</template>

<style scoped>
.settings-page {
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

.tab-content {
  padding: 1.5rem 0;
}

.meta-info {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: var(--surface-ground);
  border-radius: var(--content-border-radius);
}

.meta-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.meta-label {
  font-size: 0.8rem;
  color: var(--text-color-secondary);
}

.meta-value {
  font-weight: 600;
  font-size: 0.9rem;
}

.form-section {
  margin-bottom: 1.5rem;
}

.form-section h3 {
  font-size: 1rem;
  font-weight: 700;
  margin: 0 0 1rem;
  color: var(--primary-color);
  border-bottom: 1px solid var(--surface-border);
  padding-bottom: 0.5rem;
}

.section-hint {
  color: var(--text-color-secondary);
  font-size: 0.85rem;
  margin: 0 0 1rem;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  margin-bottom: 1rem;
}

.field label {
  font-weight: 600;
  font-size: 0.9rem;
}

.w-full {
  width: 100%;
}

.logo-upload {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.logo-preview {
  width: 4rem;
  height: 4rem;
  border-radius: var(--ds-radius-md);
  background: var(--ds-color-info-soft);
  color: var(--ds-color-primary);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
}

.switch-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.switch-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.85rem 1rem;
  border: 1px solid var(--surface-border);
  border-radius: var(--content-border-radius);
  background: var(--surface-ground);
}

.switch-label {
  display: block;
  font-weight: 600;
}

.switch-hint {
  display: block;
  color: var(--text-color-secondary);
  font-size: 0.8rem;
}

.session-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  border: 1px solid var(--surface-border);
  border-radius: var(--content-border-radius);
  background: var(--surface-ground);
}

.session-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.session-info i {
  font-size: 1.25rem;
  color: var(--text-color-secondary);
}

.session-device {
  display: block;
  font-weight: 600;
}

.session-time {
  display: block;
  font-size: 0.8rem;
  color: var(--text-color-secondary);
}

.tab-actions {
  padding-top: 1rem;
  border-top: 1px solid var(--surface-border);
}

@media (max-width: 768px) {
  .meta-info {
    grid-template-columns: 1fr 1fr;
  }
}

@media (max-width: 480px) {
  .meta-info {
    grid-template-columns: 1fr;
  }
}
</style>
