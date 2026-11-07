<script setup>
import { ref, computed, onMounted } from 'vue'
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
import WorkspacePageHeading from '@telecom/shared-ui/components/common/WorkspacePageHeading.vue'

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

const canManageProfile = computed(() => authStore.hasPermission('company_profile.update') || authStore.hasPermission('companies.update'))

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
const statusIcons = { ACTIVE: 'pi-check-circle', PENDING: 'pi-clock', INACTIVE: 'pi-minus-circle', SUSPENDED: 'pi-ban' }
</script>

<template>
  <div class="settings-page">
    <!-- Loading State -->
    <div v-if="loading" class="settings-skeleton">
      <div class="skeleton-header">
        <div class="skeleton-line skeleton-title"></div>
      </div>
      <div class="skeleton-card">
        <div class="skeleton-grid">
          <div class="skeleton-line skeleton-field" v-for="i in 4" :key="i"></div>
        </div>
      </div>
      <div class="skeleton-card">
        <div class="skeleton-line skeleton-heading"></div>
        <div class="skeleton-line skeleton-field" v-for="i in 3" :key="i"></div>
      </div>
    </div>

    <template v-else>
      <!-- Page Header with Trust Signals -->
      <WorkspacePageHeading
        heading-id="company-settings-title"
        icon="pi pi-building"
        title="تنظیمات شرکت"
        description="اطلاعات عمومی، راه‌های تماس، اعلان‌ها و امنیت حساب شرکت را مدیریت کنید."
      >
        <template #actions>
          <div class="trust-badges">
            <div class="trust-badge" :class="'badge-' + (statusSeverity[companyMeta.status] || 'secondary')">
              <i class="pi" :class="statusIcons[companyMeta.status] || 'pi-question-circle'"></i>
              <span>{{ statusLabels[companyMeta.status] || companyMeta.status }}</span>
            </div>
            <div class="trust-badge" :class="companyMeta.isVerified ? 'badge-verified' : 'badge-pending'">
              <i class="pi" :class="companyMeta.isVerified ? 'pi-verified' : 'pi-clock'"></i>
              <span>{{ companyMeta.isVerified ? 'تأیید شده' : 'در انتظار تأیید' }}</span>
            </div>
          </div>
        </template>
      </WorkspacePageHeading>

      <!-- Tabs -->
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
              <!-- Read-only Metadata -->
              <div class="meta-section">
                <h3>اطلاعات سیستمی</h3>
                <p class="section-hint">این اطلاعات توسط مدیر سیستم مدیریت می‌شود.</p>
                <div class="meta-grid">
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
                    <Tag :value="statusLabels[companyMeta.status] || companyMeta.status" :severity="statusSeverity[companyMeta.status] || 'secondary'" :icon="statusIcons[companyMeta.status]" />
                  </div>
                  <div class="meta-item">
                    <span class="meta-label">تأیید هویت</span>
                    <Tag v-if="companyMeta.isVerified" value="تأیید شده" severity="success" icon="pi-verified" />
                    <Tag v-else value="در انتظار تأیید" severity="warn" icon="pi-clock" />
                  </div>
                </div>
              </div>

              <!-- Editable Profile -->
              <div class="form-section" v-if="canManageProfile">
                <h3>اطلاعات پایه</h3>
                <p class="section-hint">اطلاعات قابل ویرایش شرکت</p>
                <div class="form-grid">
                  <div class="field">
                    <label for="companyName">نام شرکت <span class="required">*</span></label>
                    <InputText id="companyName" v-model="profile.name" name="companyName" autocomplete="organization" class="w-full" />
                  </div>
                  <div class="field">
                    <label for="companyNameEn">نام انگلیسی</label>
                    <InputText id="companyNameEn" v-model="profile.nameEn" name="companyNameEn" autocomplete="off" class="w-full" />
                  </div>
                </div>
                <div class="field">
                  <label for="companyDescription">توضیحات</label>
                  <Textarea id="companyDescription" v-model="profile.description" name="companyDescription" rows="4" class="w-full" placeholder="معرفی کوتاه شرکت…" />
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

              <div class="tab-actions" v-if="canManageProfile">
                <Button label="ذخیره پروفایل" icon="pi pi-check" :loading="savingProfile" @click="saveProfile" />
              </div>
            </div>
          </TabPanel>

          <!-- Contact Tab -->
          <TabPanel value="contact">
            <div class="tab-content">
              <div class="form-section" v-if="canManageProfile">
                <h3>اطلاعات تماس</h3>
                <p class="section-hint">اطلاعات تماس برای خریداران و شرکای تجاری</p>
                <div class="form-grid">
                  <div class="field">
                    <label for="companyEmail">ایمیل</label>
                    <InputText id="companyEmail" v-model="contact.email" name="companyEmail" autocomplete="email" class="w-full" type="email" placeholder="info@company.com" />
                  </div>
                  <div class="field">
                    <label for="companyPhone">تلفن</label>
                    <InputText id="companyPhone" v-model="contact.phone" name="companyPhone" autocomplete="tel" inputmode="tel" class="w-full" placeholder="021-XXXXXXXX" />
                  </div>
                </div>
                <div class="field">
                  <label for="companyAddress">آدرس</label>
                  <Textarea id="companyAddress" v-model="contact.address" name="companyAddress" rows="3" class="w-full" placeholder="آدرس کامل شرکت…" />
                </div>
                <div class="field">
                  <label for="companyWebsite">وب‌سایت</label>
                  <InputText id="companyWebsite" v-model="contact.website" name="companyWebsite" autocomplete="url" type="url" class="w-full" placeholder="https://example.com" />
                </div>
              </div>

              <div class="tab-actions" v-if="canManageProfile">
                <Button label="ذخیره اطلاعات تماس" icon="pi pi-check" :loading="savingContact" @click="saveContact" />
              </div>
            </div>
          </TabPanel>

          <!-- Notifications Tab -->
          <TabPanel value="notifications">
            <div class="tab-content">
              <div class="form-section">
                <h3>تنظیمات اعلان‌ها</h3>
                <p class="section-hint">نحوه دریافت اعلان‌ها را مدیریت کنید</p>
                <div class="switch-list">
                  <div class="switch-row">
                    <div class="switch-info">
                      <i class="pi pi-envelope"></i>
                      <div>
                        <span class="switch-label">اعلان استعلام‌ها</span>
                        <small class="switch-hint">دریافت ایمیل هنگام دریافت استعلام جدید</small>
                      </div>
                    </div>
                    <ToggleSwitch v-model="notifications.emailInquiryAlerts" />
                  </div>
                  <div class="switch-row">
                    <div class="switch-info">
                      <i class="pi pi-box"></i>
                      <div>
                        <span class="switch-label">اعلان محصولات</span>
                        <small class="switch-hint">دریافت ایمیل هنگام تأیید یا رد محصول</small>
                      </div>
                    </div>
                    <ToggleSwitch v-model="notifications.emailProductAlerts" />
                  </div>
                  <div class="switch-row">
                    <div class="switch-info">
                      <i class="pi pi-comment"></i>
                      <div>
                        <span class="switch-label">اعلان پیام‌ها</span>
                        <small class="switch-hint">دریافت ایمیل هنگام دریافت پیام جدید</small>
                      </div>
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
/* tem-tokenised organisation settings: bare page head, tabbed card, dense
   form sections and quiet read-only metadata. */
.settings-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
  direction: rtl;
}

.trust-badges { display: flex; flex-wrap: wrap; gap: 8px; }
.trust-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 30px;
  padding: 4px 12px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
}
.trust-badge i { font-size: 12px; }

.badge-success, .badge-verified {
  border: 1px solid color-mix(in srgb, var(--tm-green) 30%, transparent);
  background: var(--tm-green-soft);
  color: var(--ds-status-success-fg);
}
.badge-warn, .badge-pending {
  border: 1px solid color-mix(in srgb, var(--tm-amber) 30%, transparent);
  background: var(--tm-amber-soft);
  color: var(--ds-status-warning-fg);
}
.badge-danger {
  border: 1px solid color-mix(in srgb, var(--tm-red) 30%, transparent);
  background: var(--tm-red-soft);
  color: var(--ds-status-danger-fg);
}
.badge-secondary {
  border: 1px solid var(--tm-line);
  background: var(--tm-surface-alt);
  color: var(--tm-muted);
}

/* Tabbed settings card */
:deep(.p-tabs) { background: transparent; }
:deep(.p-tablist) {
  padding: 0 12px;
  border: 1px solid var(--tm-line);
  border-radius: var(--tm-radius-lg) var(--tm-radius-lg) 0 0;
  background: var(--tm-surface);
}
:deep(.p-tab) {
  min-height: 48px;
  padding: 0 18px;
  color: var(--tm-muted);
  font-size: var(--tm-fs-sm);
  font-weight: 600;
}
:deep(.p-tab.p-tab-active) {
  color: var(--tm-blue);
  border-color: var(--tm-blue);
}
:deep(.p-tabpanels) {
  padding: 0;
  border: 1px solid var(--tm-line);
  border-top: 0;
  border-radius: 0 0 var(--tm-radius-lg) var(--tm-radius-lg);
  background: var(--tm-surface);
}

.tab-content { display: grid; gap: 16px; padding: 20px; }

/* Read-only metadata */
.meta-section {
  padding: 20px;
  border: 1px solid var(--tm-line);
  border-radius: var(--tm-radius-lg);
  background: var(--tm-surface-alt);
}
.meta-section h3,
.form-section h3 {
  margin: 0;
  color: var(--tm-ink);
  font-size: 14px;
  font-weight: 700;
}
.section-hint {
  margin: 4px 0 14px;
  color: var(--tm-muted);
  font-size: var(--tm-fs-sm);
}
.meta-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
}
.meta-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
  padding: 12px 14px;
  border: 1px solid var(--tm-line);
  border-radius: var(--tm-radius);
  background: var(--tm-surface);
}
.meta-label { color: var(--tm-muted); font-size: 11px; }
.meta-value { color: var(--tm-ink); font-weight: 600; overflow-wrap: anywhere; }

/* Editable form sections */
.form-section {
  padding: 20px;
  border: 1px solid var(--tm-line);
  border-radius: var(--tm-radius-lg);
  background: var(--tm-surface);
}
.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.field { display: flex; flex-direction: column; gap: 6px; margin-bottom: 14px; }
.field label { color: var(--tm-ink); font-size: 12.5px; font-weight: 600; }
.required { color: var(--tm-red); }
.w-full { width: 100%; }
.logo-upload { display: flex; align-items: center; gap: 14px; }
.logo-preview {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  border-radius: var(--tm-radius);
  background: var(--tm-cyan-soft);
  color: var(--tm-cyan-deep);
  font-size: 24px;
}

/* Preference switches and sessions */
.switch-list { display: flex; flex-direction: column; gap: 10px; }
.switch-row,
.session-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding: 14px;
  border: 1px solid var(--tm-line);
  border-radius: var(--tm-radius);
  background: var(--tm-surface-alt);
}
.switch-info,
.session-info { display: flex; align-items: center; gap: 10px; }
.switch-info > i,
.session-info i { color: var(--tm-cyan-deep); font-size: 16px; }
.switch-label,
.session-device { display: block; color: var(--tm-ink); font-size: 13px; font-weight: 600; }
.switch-hint,
.session-time { display: block; color: var(--tm-muted); font-size: 11.5px; }

.tab-actions {
  display: flex;
  justify-content: flex-start;
  padding-top: 4px;
}

/* Skeleton */
.settings-skeleton { display: flex; flex-direction: column; gap: 16px; }
.skeleton-header { display: flex; flex-direction: column; gap: 8px; }
.skeleton-card {
  padding: 20px;
  border: 1px solid var(--tm-line);
  border-radius: var(--tm-radius-lg);
  background: var(--tm-surface);
}
.skeleton-line {
  border-radius: 6px;
  background: linear-gradient(90deg, var(--tm-surface-alt) 25%, var(--tm-line) 50%, var(--tm-surface-alt) 75%);
  background-size: 200% 100%;
  animation: skeleton-pulse 1.5s ease-in-out infinite;
}
.skeleton-title { width: 40%; height: 22px; }
.skeleton-heading { width: 30%; height: 16px; margin-bottom: 12px; }
.skeleton-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.skeleton-field { height: 38px; }
@keyframes skeleton-pulse {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

@media (max-width: 767px) {
  .meta-grid { grid-template-columns: 1fr 1fr; }
  .form-grid,
  .skeleton-grid { grid-template-columns: 1fr; }
  :deep(.p-tablist) { overflow-x: auto; }
  :deep(.p-tab) { white-space: nowrap; }
  .tab-actions,
  .tab-actions :deep(.p-button) { width: 100%; }
}
@media (max-width: 480px) {
  .meta-grid { grid-template-columns: 1fr; }
  .trust-badges { width: 100%; }
  .trust-badge { flex: 1; justify-content: center; }
}
</style>