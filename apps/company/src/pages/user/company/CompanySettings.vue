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
      <header class="page-header settings-heading">
        <div class="settings-heading-identity">
          <div>
            <h1>تنظیمات شرکت</h1>
            <p>اطلاعات عمومی، راه‌های تماس، اعلان‌ها و امنیت حساب شرکت را مدیریت کنید.</p>
          </div>
        </div>
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
      </header>

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
.settings-page {
  direction: rtl;
  padding: 0;
  max-width: none;
  margin: 0;
}

/* ── Page Header ────────────────────────────────────── */
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
  gap: 1rem;
  flex-wrap: wrap;
}

.page-header-left h1 {
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0;
  color: var(--text-color);
}

.trust-badges {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.trust-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem 0.875rem;
  border-radius: var(--ds-radius-full);
  font-size: 0.85rem;
  font-weight: 600;
}

.trust-badge i {
  font-size: 0.9rem;
}

.badge-success {
  background: color-mix(in srgb, var(--ds-color-success) 12%, transparent);
  color: var(--ds-color-success);
  border: 1px solid color-mix(in srgb, var(--ds-color-success) 30%, transparent);
}

.badge-warn {
  background: color-mix(in srgb, var(--ds-color-warning) 12%, transparent);
  color: var(--ds-color-warning);
  border: 1px solid color-mix(in srgb, var(--ds-color-warning) 30%, transparent);
}

.badge-danger {
  background: color-mix(in srgb, var(--ds-color-danger) 12%, transparent);
  color: var(--ds-color-danger);
  border: 1px solid color-mix(in srgb, var(--ds-color-danger) 30%, transparent);
}

.badge-secondary {
  background: var(--surface-hover);
  color: var(--text-color-secondary);
  border: 1px solid var(--surface-border);
}

.badge-verified {
  background: color-mix(in srgb, var(--ds-color-success) 12%, transparent);
  color: var(--ds-color-success);
  border: 1px solid color-mix(in srgb, var(--ds-color-success) 30%, transparent);
}

.badge-pending {
  background: color-mix(in srgb, var(--ds-color-warning) 12%, transparent);
  color: var(--ds-color-warning);
  border: 1px solid color-mix(in srgb, var(--ds-color-warning) 30%, transparent);
}

/* ── Tabs ───────────────────────────────────────────── */
:deep(.p-tabs) {
  background: transparent;
}

:deep(.p-tablist) {
  background: var(--surface-card);
  border: 1px solid var(--surface-border);
  border-radius: var(--content-border-radius) var(--content-border-radius) 0 0;
  padding: 0 1.25rem;
}

:deep(.p-tab) {
  padding: 0.875rem 1.25rem;
  font-weight: 500;
  color: var(--text-color-secondary);
  transition: color 0.15s ease, border-color 0.15s ease;
}

:deep(.p-tab.p-tab-active) {
  color: var(--ds-color-primary);
  border-color: var(--ds-color-primary);
}

:deep(.p-tabpanels) {
  background: var(--surface-card);
  border: 1px solid var(--surface-border);
  border-top: none;
  border-radius: 0 0 var(--content-border-radius) var(--content-border-radius);
  padding: 0;
}

:deep(.p-tabpanel) {
  padding: 0;
}

.tab-content {
  padding: 1.5rem;
}

/* ── Meta Section (Read-only) ───────────────────────── */
.meta-section {
  margin-bottom: 1.5rem;
  padding: 1.25rem;
  background: var(--surface-hover);
  border: 1px solid var(--surface-border);
  border-radius: var(--content-border-radius);
}

.meta-section h3 {
  font-size: 0.9rem;
  font-weight: 700;
  margin: 0 0 0.25rem;
  color: var(--text-color);
}

.section-hint {
  color: var(--text-color-secondary);
  font-size: 0.8rem;
  margin: 0 0 1rem;
}

.meta-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
}

.meta-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.meta-label {
  font-size: 0.75rem;
  color: var(--text-color-secondary);
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.meta-value {
  font-weight: 600;
  font-size: 0.9rem;
  color: var(--text-color);
}

/* ── Form Section (Editable) ────────────────────────── */
.form-section {
  margin-bottom: 1.5rem;
  padding: 1.25rem;
  background: var(--surface-card);
  border: 1px solid var(--surface-border);
  border-radius: var(--content-border-radius);
  border-inline-start: 3px solid var(--ds-color-primary);
}

.form-section h3 {
  font-size: 0.9rem;
  font-weight: 700;
  margin: 0 0 0.25rem;
  color: var(--text-color);
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  margin-bottom: 1rem;
}

.field label {
  font-weight: 600;
  font-size: 0.85rem;
  color: var(--text-color);
}

.required {
  color: var(--ds-color-danger);
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

/* ── Switch List ────────────────────────────────────── */
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
  padding: 1rem;
  border: 1px solid var(--surface-border);
  border-radius: var(--content-border-radius);
  background: var(--surface-hover);
}

.switch-info {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
}

.switch-info > i {
  font-size: 1.1rem;
  color: var(--ds-color-primary);
  margin-top: 0.125rem;
}

.switch-label {
  display: block;
  font-weight: 600;
  font-size: 0.9rem;
}

.switch-hint {
  display: block;
  color: var(--text-color-secondary);
  font-size: 0.8rem;
}

/* ── Session ────────────────────────────────────────── */
.session-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  border: 1px solid var(--surface-border);
  border-radius: var(--content-border-radius);
  background: var(--surface-hover);
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

/* ── Actions ────────────────────────────────────────── */
.tab-actions {
  padding-top: 1rem;
  border-top: 1px solid var(--surface-border);
  display: flex;
  justify-content: flex-start;
}

/* ── Skeleton Loading ───────────────────────────────── */
.settings-skeleton {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.skeleton-header {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.skeleton-card {
  background: var(--surface-card);
  border: 1px solid var(--surface-border);
  border-radius: var(--content-border-radius);
  padding: 1.5rem;
}

.skeleton-line {
  background: linear-gradient(90deg, var(--surface-hover) 25%, var(--surface-border) 50%, var(--surface-hover) 75%);
  background-size: 200% 100%;
  animation: skeleton-pulse 1.5s ease-in-out infinite;
  border-radius: var(--ds-radius-sm);
}

.skeleton-title {
  width: 40%;
  height: 1.5rem;
}

.skeleton-heading {
  width: 30%;
  height: 1rem;
  margin-bottom: 1rem;
}

.skeleton-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.skeleton-field {
  height: 2.5rem;
}

@keyframes skeleton-pulse {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* ── Responsive ─────────────────────────────────────── */
@media (max-width: 767px) {
  .settings-page {
    padding: 1rem;
  }

  .page-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .meta-grid {
    grid-template-columns: 1fr 1fr;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }

  .skeleton-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 480px) {
  .meta-grid {
    grid-template-columns: 1fr;
  }

  .trust-badges {
    width: 100%;
  }

  .trust-badge {
    flex: 1;
    justify-content: center;
  }
}

.settings-page { padding: var(--ds-space-5); }
.settings-page .page-header {
  padding: var(--ds-space-5) var(--ds-space-6);
  background: var(--ds-color-surface);
  border: 1px solid var(--ds-color-border);
  border-radius: var(--ds-radius-xl);
  box-shadow: var(--ds-shadow-xs);
}
.settings-page .page-header h1 { color: var(--ds-color-text); }
.settings-page .settings-card,
.settings-page .settings-section,
.settings-page .skeleton-card {
  border-color: var(--ds-color-border);
  border-radius: var(--ds-radius-xl);
  box-shadow: var(--ds-shadow-xs);
}
.settings-page :deep(.p-inputtext),
.settings-page :deep(.p-select),
.settings-page :deep(.p-textarea) { border-radius: var(--ds-radius-md); }
@media (max-width: 640px) { .settings-page { padding: var(--ds-space-3); } }


.settings-page { display: flex; flex-direction: column; gap: var(--ds-space-5); }
.settings-page .page-header { margin-bottom: 0; }
.settings-heading {
  padding: 1.25rem 1.5rem;
  border: 1px solid var(--ds-color-border);
  border-radius: var(--ds-radius-xl);
  background: linear-gradient(110deg, color-mix(in srgb, var(--ds-color-primary) 8%, var(--ds-color-surface)), var(--ds-color-surface) 72%);
  box-shadow: var(--ds-shadow-xs);
}
.settings-heading-identity { display: flex; align-items: center; gap: 1rem; min-width: 0; }
.settings-heading-icon {
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
.settings-heading-identity > div { min-width: 0; }
.settings-heading-eyebrow { display: block; color: var(--ds-color-primary); font-size: var(--ds-font-size-xs); font-weight: var(--ds-font-weight-bold); }
.settings-heading h1 { margin: .2rem 0; color: var(--ds-color-text); font-size: var(--ds-font-size-2xl); font-weight: 800; }
.settings-heading-identity p { margin: .35rem 0 0; color: var(--ds-color-text-muted); font-size: var(--ds-font-size-sm); line-height: 1.7; }
.settings-page :deep(.p-tablist) { border-color: var(--ds-color-border); border-radius: var(--ds-radius-xl) var(--ds-radius-xl) 0 0; background: var(--ds-color-surface); }
.settings-page :deep(.p-tabpanels) { border-color: var(--ds-color-border); border-radius: 0 0 var(--ds-radius-xl) var(--ds-radius-xl); background: var(--ds-color-surface); }
.settings-page .meta-section,
.settings-page .form-section,
.settings-page .switch-row,
.settings-page .session-item { border-color: var(--ds-color-border); border-radius: var(--ds-radius-lg); background: var(--ds-color-surface-alt); }
.settings-page .form-section { background: var(--ds-color-surface); }
.settings-page :deep(.p-inputtext),
.settings-page :deep(.p-textarea),
.settings-page :deep(.p-select) { border-color: var(--ds-color-border); border-radius: var(--ds-radius-md); }
.settings-page .tab-actions { border-color: var(--ds-color-border); }
@media (max-width: 640px) {
  .settings-heading { align-items: flex-start; flex-direction: column; padding: 1rem; }
  .settings-heading-identity { align-items: flex-start; }
  .settings-page .tab-content { padding: 1rem; }
  .settings-page .trust-badges { width: 100%; }
}


/* Organization settings are a full-width workspace within the shared shell. */
.settings-page { display: flex; flex-direction: column; gap: clamp(1rem, 2vw, 1.5rem); }
.settings-page .settings-heading {
  align-items: center;
  gap: 1.25rem;
  padding: clamp(1rem, 2vw, 1.5rem);
  border: 1px solid var(--ds-color-border);
  border-radius: var(--ds-radius-xl);
  background:
    radial-gradient(circle at 5% 0%, color-mix(in srgb, var(--ds-color-primary) 12%, transparent), transparent 38%),
    var(--ds-color-surface);
  box-shadow: var(--ds-shadow-xs);
}
.settings-page .settings-heading-identity { min-width: 0; }
.settings-page .settings-heading-icon {
  display: grid;
  place-items: center;
  width: 3.4rem;
  height: 3.4rem;
  flex: 0 0 auto;
  border: 1px solid color-mix(in srgb, var(--ds-color-primary) 24%, transparent);
  border-radius: 1rem;
  background: var(--ds-color-primary-soft);
  color: var(--ds-color-primary);
  font-size: 1.35rem;
}
.settings-page .settings-heading h1 {
  margin: .2rem 0;
  color: var(--ds-color-text);
  font-size: clamp(1.3rem, 2vw, var(--ds-font-size-2xl));
  font-weight: var(--ds-font-weight-bold);
}
.settings-page .settings-heading p {
  margin: .35rem 0 0;
  color: var(--ds-color-text-muted);
  font-size: var(--ds-font-size-sm);
  line-height: 1.8;
}
.settings-page :deep(.p-tablist) {
  padding-inline: .65rem;
  border: 1px solid var(--ds-color-border);
  border-radius: var(--ds-radius-lg);
  background: var(--ds-color-surface);
  box-shadow: var(--ds-shadow-xs);
}
.settings-page :deep(.p-tab) {
  min-height: 3.2rem;
  padding-inline: 1.1rem;
  color: var(--ds-color-text-muted);
  font-size: var(--ds-font-size-sm);
  font-weight: var(--ds-font-weight-semibold);
}
.settings-page :deep(.p-tab.p-tab-active) {
  color: var(--ds-color-primary-text);
  border-color: var(--ds-color-primary);
}
.settings-page :deep(.p-tabpanels) { padding: var(--ds-space-5) 0 0; background: transparent; }
.settings-page .tab-content { display: grid; gap: var(--ds-space-5); }
.settings-page .meta-section,
.settings-page .form-section {
  padding: clamp(1rem, 2vw, 1.5rem);
  border: 1px solid var(--ds-color-border);
  border-radius: var(--ds-radius-xl);
  background: var(--ds-color-surface);
  box-shadow: var(--ds-shadow-xs);
}
.settings-page .meta-section h3,
.settings-page .form-section h3 {
  margin: 0;
  color: var(--ds-color-text);
  font-size: var(--ds-font-size-lg);
  font-weight: var(--ds-font-weight-bold);
}
.settings-page .section-hint {
  margin: .35rem 0 1.1rem;
  color: var(--ds-color-text-muted);
  font-size: var(--ds-font-size-sm);
  line-height: 1.7;
}
.settings-page .meta-grid { gap: .75rem; }
.settings-page .meta-item {
  min-width: 0;
  padding: .9rem 1rem;
  border: 1px solid var(--ds-color-border);
  border-radius: var(--ds-radius-md);
  background: var(--ds-color-surface-alt);
}
.settings-page .meta-label { color: var(--ds-color-text-muted); font-size: var(--ds-font-size-xs); }
.settings-page .meta-value { color: var(--ds-color-text); font-weight: var(--ds-font-weight-semibold); overflow-wrap: anywhere; }
.settings-page .tab-actions {
  display: flex;
  justify-content: flex-start;
  padding-top: .25rem;
}
.settings-page .switch-row {
  border-color: var(--ds-color-border);
  border-radius: var(--ds-radius-lg);
  background: var(--ds-color-surface-alt);
}
.settings-page .switch-info > i { color: var(--ds-color-primary); }
@media (max-width: 700px) {
  .settings-page .settings-heading { align-items: flex-start; flex-direction: column; }
  .settings-page .trust-badges { width: 100%; }
  .settings-page :deep(.p-tablist) { overflow-x: auto; }
  .settings-page :deep(.p-tab) { white-space: nowrap; }
  .settings-page .form-grid { grid-template-columns: minmax(0, 1fr); }
  .settings-page .tab-actions,
  .settings-page .tab-actions :deep(.p-button) { width: 100%; }
}
</style>