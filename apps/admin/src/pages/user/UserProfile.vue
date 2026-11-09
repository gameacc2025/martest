<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import { apiGet, apiPatch, apiPost, apiDelete } from '@telecom/shared-core/http/apiClient'
import { endpoints } from '@telecom/api-client'
import { authApi } from '@telecom/api-client'
import { useAuthStore } from '../../stores/auth'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import Password from 'primevue/password'
import Card from 'primevue/card'
import Avatar from 'primevue/avatar'
import Tag from 'primevue/tag'
import Dialog from 'primevue/dialog'
import Tabs from 'primevue/tabs'
import TabList from 'primevue/tablist'
import Tab from 'primevue/tab'
import TabPanels from 'primevue/tabpanels'
import TabPanel from 'primevue/tabpanel'
import ProgressSpinner from 'primevue/progressspinner'
import Divider from 'primevue/divider'
import Badge from 'primevue/badge'

const toast = useToast()
const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const loading = ref(false)
const saving = ref(false)
const profile = ref(null)

// Active tab is synced with ?tab= so the header menu can deep-link here.
const activeTab = ref(route.query.tab || 'account')
watch(activeTab, (val) => {
  router.replace({ query: { ...route.query, tab: val } })
})

const editForm = ref({
  firstName: '',
  lastName: '',
  displayName: '',
  bio: '',
  avatarUrl: '',
})

// Session management
const sessionsLoading = ref(false)
const activeSessions = ref([])
const revokingSession = ref(null)

onMounted(() => {
  fetchProfile()
})

const roleNames = computed(() => {
  const roles = profile.value?.roles || []
  return roles.map((r) => (typeof r === 'string' ? r : r.role?.name || r.name || r.label)).filter(Boolean)
})

const company = computed(() => profile.value?.company || authStore.company || null)


function statusLabel(status) {
  return status === 'ACTIVE' ? 'فعال' : status === 'PENDING' ? 'در انتظار' : status === 'REJECTED' ? 'رد شده' : status || '—'
}
function statusSeverity(status) {
  return status === 'ACTIVE' ? 'success' : status === 'PENDING' ? 'warn' : 'danger'
}
function formatDate(value) {
  if (!value) return '—'
  try {
    return new Date(value).toLocaleDateString('fa-IR')
  } catch {
    return '—'
  }
}

async function fetchProfile() {
  loading.value = true
  try {
    const data = await apiGet(endpoints.settings.profile)
    profile.value = data
    editForm.value = {
      firstName: data.firstName || '',
      lastName: data.lastName || '',
      displayName: data.displayName || '',
      bio: data.bio || '',
      avatarUrl: data.avatarUrl || '',
    }
  } catch (err) {
    toast.add({ severity: 'error', summary: 'خطا', detail: 'خطا در دریافت پروفایل', life: 3000 })
  } finally {
    loading.value = false
  }
}

async function saveProfile() {
  saving.value = true
  try {
    const payload = {
      firstName: editForm.value.firstName || undefined,
      lastName: editForm.value.lastName || undefined,
      displayName: editForm.value.displayName || undefined,
      bio: editForm.value.bio || undefined,
    }
    const updated = await apiPatch(endpoints.settings.profile, payload)
    profile.value = { ...profile.value, ...updated }
    // Keep the auth store (and header) in sync.
    if (authStore.user) {
      authStore.user = { ...authStore.user, ...updated }
      localStorage.setItem('user', JSON.stringify(authStore.user))
    }
    toast.add({ severity: 'success', summary: 'موفقیت', detail: 'پروفایل بروزرسانی شد', life: 3000 })
  } catch (err) {
    toast.add({ severity: 'error', summary: 'خطا', detail: err.message || 'خطا در بروزرسانی پروفایل', life: 3000 })
  } finally {
    saving.value = false
  }
}

// ── Change password ──────────────────────────────────────────
const showPasswordDialog = ref(false)
const changingPassword = ref(false)
const passwordForm = ref({ currentPassword: '', newPassword: '', confirmPassword: '' })

function openPasswordDialog() {
  passwordForm.value = { currentPassword: '', newPassword: '', confirmPassword: '' }
  showPasswordDialog.value = true
}

async function submitPasswordChange() {
  if (passwordForm.value.newPassword.length < 8) {
    toast.add({ severity: 'warn', summary: 'توجه', detail: 'رمز جدید باید حداقل ۸ کاراکتر باشد', life: 3000 })
    return
  }
  if (passwordForm.value.newPassword !== passwordForm.value.confirmPassword) {
    toast.add({ severity: 'warn', summary: 'توجه', detail: 'رمز جدید و تکرار آن یکسان نیستند', life: 3000 })
    return
  }
  changingPassword.value = true
  try {
    await apiPatch(endpoints.settings.changePassword, {
      currentPassword: passwordForm.value.currentPassword,
      newPassword: passwordForm.value.newPassword,
    })
    showPasswordDialog.value = false
    toast.add({
      severity: 'success',
      summary: 'موفقیت',
      detail: 'رمز عبور تغییر کرد. برای امنیت، لطفاً دوباره وارد شوید.',
      life: 4000,
    })
    // Refresh tokens were revoked server-side; log out so the user re-authenticates.
    setTimeout(() => authStore.logout({ redirectTo: '/login' }), 1500)
  } catch (err) {
    toast.add({ severity: 'error', summary: 'خطا', detail: err.message || 'خطا در تغییر رمز عبور', life: 3000 })
  } finally {
    changingPassword.value = false
  }
}

// ── Logout ───────────────────────────────────────────────────
function logout() {
  authStore.logout({ redirectTo: '/login' })
}

// ── Session Management ─────────────────────────────────────────
async function loadSessions() {
  sessionsLoading.value = true
  try {
    const { data } = await authApi.getSessions()
    // Map the session data to include deviceIcon for display
    activeSessions.value = (data.sessions || []).map(session => ({
      ...session,
      deviceIcon: detectDeviceIcon(session.userAgent),
    }))
  } catch (err) {
    toast.add({ severity: 'error', summary: 'خطا', detail: 'خطا در دریافت نشست‌ها', life: 3000 })
  } finally {
    sessionsLoading.value = false
  }
}

async function revokeSession(sessionId) {
  revokingSession.value = sessionId
  try {
    await authApi.revokeSession(sessionId)
    // If revoking the current session, the server clears the cookie
    // The auth store will handle the redirect on the next request
    const session = activeSessions.value.find(s => String(s.id) === String(sessionId))
    if (session?.isCurrent) {
      setTimeout(() => authStore.logout({ redirectTo: '/login' }), 1500)
    }
    activeSessions.value = activeSessions.value.filter(s => String(s.id) !== String(sessionId))
    toast.add({ severity: 'success', summary: 'موفقیت', detail: 'نشست لغو شد', life: 3000 })
  } catch (err) {
    toast.add({ severity: 'error', summary: 'خطا', detail: 'خطا در لغو نشست', life: 3000 })
  } finally {
    revokingSession.value = null
  }
}

async function revokeAllSessions() {
  try {
    await apiPost(endpoints.auth.logoutAll)
    toast.add({ severity: 'success', summary: 'موفقیت', detail: 'تمام نشست‌ها لغو شدند', life: 3000 })
    setTimeout(() => authStore.logout({ redirectTo: '/login' }), 1500)
  } catch (err) {
    toast.add({ severity: 'error', summary: 'خطا', detail: 'خطا در لغو همه نشست‌ها', life: 3000 })
  }
}

function detectDeviceIcon(userAgent) {
  if (!userAgent) return 'pi pi-desktop'
  const ua = userAgent.toLowerCase()
  if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone') || ua.includes('ipad')) {
    return 'pi pi-mobile'
  }
  if (ua.includes('tablet')) {
    return 'pi pi-tablet'
  }
  return 'pi pi-desktop'
}
</script>

<template>
  <div class="profile-page">
    <header class="page-header profile-heading">
      <span class="profile-heading-icon"><i class="pi pi-user"></i></span>
      <div><span class="profile-heading-eyebrow">حساب کاربری</span><h1>پروفایل من</h1><p>اطلاعات حساب، تنظیمات شخصی و گزینه‌های امنیتی را مدیریت کنید.</p></div>
    </header>

    <div v-if="loading" class="text-center py-8">
      <ProgressSpinner />
    </div>

    <Tabs v-else v-model:value="activeTab">
      <TabList>
        <Tab value="account"><i class="pi pi-id-card"></i> اطلاعات</Tab>
        <Tab value="edit"><i class="pi pi-pencil"></i> ویرایش</Tab>
        <Tab value="security"><i class="pi pi-lock"></i> امنیت</Tab>
      </TabList>

      <TabPanels>
        <!-- ── Profile ── -->
        <TabPanel value="account">
          <div class="account-grid">
            <Card class="account-summary">
              <template #content>
                <div class="summary-inner">
                  <Avatar
                    v-if="profile?.avatarUrl"
                    :image="profile.avatarUrl"
                    size="xlarge"
                    shape="circle"
                  />
                  <Avatar
                    v-else
                    :label="(profile?.displayName || profile?.fullName || profile?.username || 'U').charAt(0)"
                    size="xlarge"
                    shape="circle"
                  />
                  <h2>{{ profile?.displayName || profile?.fullName || profile?.username }}</h2>
                  <p>{{ profile?.email }}</p>
                  <Tag :severity="statusSeverity(profile?.status)">{{ statusLabel(profile?.status) }}</Tag>
                  <Button
                    label="خروج از حساب"
                    icon="pi pi-sign-out"
                    severity="secondary"
                    outlined
                    class="logout-btn"
                    @click="logout"
                  />
                </div>
              </template>
            </Card>

            <Card class="account-details">
              <template #title>اطلاعات حساب</template>
              <template #content>
                <div class="detail-row"><span>نام کاربری</span><b>{{ profile?.username || '—' }}</b></div>
                <div class="detail-row"><span>نام</span><b>{{ profile?.firstName || '—' }}</b></div>
                <div class="detail-row"><span>نام خانوادگی</span><b>{{ profile?.lastName || '—' }}</b></div>
                <div class="detail-row"><span>نام نمایشی</span><b>{{ profile?.displayName || '—' }}</b></div>
                <div class="detail-row"><span>ایمیل</span><b>{{ profile?.email || '—' }}</b></div>
                <div class="detail-row"><span>تلفن</span><b>{{ profile?.phoneNumber || '—' }}</b></div>
                <div class="detail-row"><span>شرکت</span><b>{{ company?.name || '—' }}</b></div>
                <div class="detail-row">
                  <span>نقش‌ها</span>
                  <b>{{ roleNames.length ? roleNames.join('، ') : '—' }}</b>
                </div>
                <div class="detail-row"><span>وضعیت</span><b>{{ statusLabel(profile?.status) }}</b></div>
                <div class="detail-row"><span>تاریخ عضویت</span><b>{{ formatDate(profile?.createdAt) }}</b></div>
              </template>
            </Card>
          </div>
        </TabPanel>

        <!-- ── Edit ── -->
        <TabPanel value="edit">
          <Card class="form-card">
            <template #title>ویرایش اطلاعات</template>
            <template #content>
              <div class="form-grid">
                <div class="field">
                  <label>نام</label>
                  <InputText v-model="editForm.firstName" class="w-full" />
                </div>
                <div class="field">
                  <label>نام خانوادگی</label>
                  <InputText v-model="editForm.lastName" class="w-full" />
                </div>
                <div class="field">
                  <label>نام نمایشی</label>
                  <InputText v-model="editForm.displayName" class="w-full" />
                </div>
                <div class="field field-full">
                  <label>بیوگرافی</label>
                  <Textarea v-model="editForm.bio" rows="3" class="w-full" />
                </div>
              </div>
              <p class="field-note">
                نام کاربری، ایمیل، تلفن، شرکت، نقش‌ها و وضعیت از این بخش قابل تغییر نیستند.
              </p>
              <Button label="ذخیره تغییرات" icon="pi pi-check" :loading="saving" @click="saveProfile" />
            </template>
          </Card>
        </TabPanel>

        <!-- ── Security ── -->
        <TabPanel value="security">
          <Card class="form-card">
            <template #title>امنیت</template>
            <template #content>
              <div class="security-row">
                <div>
                  <h4>رمز عبور</h4>
                  <p>برای حفظ امنیت حساب، رمز عبور خود را به‌صورت دوره‌ای تغییر دهید.</p>
                </div>
                <Button label="تغییر رمز عبور" icon="pi pi-key" @click="openPasswordDialog" />
              </div>

              <Divider />

              <div class="security-row">
                <div>
                  <h4>نشست‌های فعال</h4>
                  <p>لیست دستگاه‌هایی که در حال حاضر در حساب شما وارد شده‌اند.</p>
                </div>
              </div>

              <div class="sessions-actions">
                <Button
                  label="بارگذاری نشست‌ها"
                  icon="pi pi-refresh"
                  severity="secondary"
                  outlined
                  @click="loadSessions"
                  :loading="sessionsLoading"
                />
                <Button
                  label="خروج از همه دستگاه‌ها"
                  icon="pi pi-sign-out"
                  severity="danger"
                  outlined
                  @click="revokeAllSessions"
                />
              </div>

              <div v-if="sessionsLoading" class="text-center py-6">
                <ProgressSpinner style="width: 40px; height: 40px" />
              </div>

              <div v-else-if="activeSessions.length === 0" class="text-center py-4">
                <i class="pi pi-info-circle" style="font-size: 2rem; color: var(--text-color-secondary)" />
                <p>نشست فعالی یافت نشد. برای مشاهده، روی «بارگذاری نشست‌ها» کلیک کنید.</p>
              </div>

              <div v-else class="session-list">
                <div class="session-header">
                  <span>دستگاه / مرورگر</span>
                  <span>IP</span>
                  <span>موقعیت</span>
                  <span>آخرین فعالیت</span>
                  <span>جریان</span>
                </div>
                <div class="session-item" v-for="session in activeSessions" :key="session.id">
                  <div class="session-device">
                    <i :class="session.deviceIcon || 'pi pi-desktop'" />
                    <span>{{ session.deviceName || session.userAgent || 'ناشناس' }}</span>
                    <Badge v-if="session.isCurrent" value="نشست جاری" severity="success" size="small" style="margin-right: 0.5rem" />
                  </div>
                  <div class="session-ip">{{ session.ipAddress || '—' }}</div>
                  <div class="session-location">{{ session.location || '—' }}</div>
                  <div class="session-last-activity">{{ formatDate(session.lastActivityAt) }}</div>
                  <div class="session-actions">
                    <Button
                      v-if="!session.isCurrent"
                      icon="pi pi-sign-out"
                      severity="danger"
                      rounded
                      text
                      size="small"
                      @click="revokeSession(session.id)"
                      :disabled="revokingSession === session.id"
                    />
                  </div>
                </div>
              </div>
            </template>
          </Card>
        </TabPanel>
      </TabPanels>
    </Tabs>

    <!-- Change password dialog -->
    <Dialog v-model:visible="showPasswordDialog" header="تغییر رمز عبور" :modal="true" style="width: 26rem" class="p-fluid">
      <div class="field">
        <label>رمز عبور فعلی</label>
        <Password v-model="passwordForm.currentPassword" :feedback="false" toggleMask fluid />
      </div>
      <div class="field">
        <label>رمز عبور جدید</label>
        <Password v-model="passwordForm.newPassword" toggleMask fluid />
      </div>
      <div class="field">
        <label>تکرار رمز عبور جدید</label>
        <Password v-model="passwordForm.confirmPassword" :feedback="false" toggleMask fluid />
      </div>
      <template #footer>
        <Button label="لغو" icon="pi pi-times" severity="secondary" text @click="showPasswordDialog = false" />
        <Button label="ذخیره" icon="pi pi-check" :loading="changingPassword" @click="submitPasswordChange" />
      </template>
    </Dialog>
  </div>
</template>

<style scoped>
.profile-page {
  direction: rtl;
}

.page-header {
  margin-bottom: 1.5rem;
}

.page-header h1 {
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0;
}

.account-grid {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 1.5rem;
}

.summary-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  text-align: center;
}

.summary-inner h2 {
  margin: 0;
  font-size: 1.2rem;
}

.summary-inner p {
  margin: 0;
  color: var(--text-color-secondary);
  font-size: 0.85rem;
}

.logout-btn {
  margin-top: 0.5rem;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.5rem 0;
  border-bottom: 1px solid var(--surface-border);
  font-size: 0.9rem;
}

.detail-row span {
  color: var(--text-color-secondary);
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 1rem;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  margin-bottom: 0.75rem;
}

.field label {
  font-size: 0.85rem;
  color: var(--text-color-secondary);
}

.field-full {
  grid-column: 1 / -1;
}

.field-note {
  font-size: 0.8rem;
  color: var(--text-color-secondary);
  margin: 0 0 1rem;
}

.security-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem 0;
  border-bottom: 1px solid var(--surface-border);
}

.security-row h4 {
  margin: 0 0 0.25rem;
}

.security-row p {
  margin: 0;
  font-size: 0.85rem;
  color: var(--text-color-secondary);
}

.security-row.disabled {
  opacity: 0.6;
}

.sessions-actions {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
}

.session-header {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr 0.5fr;
  gap: 1rem;
  padding: 0.75rem 0;
  border-bottom: 2px solid var(--ds-color-border);
  font-weight: 600;
  color: var(--text-color-secondary);
  font-size: 0.85rem;
}

.session-item {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr 0.5fr;
  gap: 1rem;
  align-items: center;
  padding: 0.75rem 0;
  border-bottom: 1px solid var(--ds-color-border);
}

.session-device {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.session-device i {
  font-size: 1.25rem;
  color: var(--ds-color-primary);
}

.session-ip,
.session-location,
.session-last-activity {
  font-size: 0.85rem;
  color: var(--ds-color-text);
}

.session-actions {
  display: flex;
  justify-content: flex-end;
}

@media (max-width: 767px) {
  .account-grid,
  .form-grid {
    grid-template-columns: 1fr;
  }
}

.profile-page { display: flex; flex-direction: column; gap: var(--ds-space-5); }
.profile-page .page-header {
  padding: var(--ds-space-5) var(--ds-space-6);
  background: var(--ds-color-surface);
  border: 1px solid var(--ds-color-border);
  border-radius: var(--ds-radius-xl);
  box-shadow: var(--ds-shadow-xs);
}
.profile-page .page-header h1 { color: var(--ds-color-text); font-size: var(--ds-font-size-2xl); }
.profile-page .account-grid { grid-template-columns: minmax(240px, .8fr) minmax(0, 1.8fr); }
.profile-page :deep(.p-card) {
  border: 1px solid var(--ds-color-border);
  border-radius: var(--ds-radius-xl);
  box-shadow: var(--ds-shadow-xs);
}
.profile-page :deep(.p-tabpanels) { background: transparent; }
@media (max-width: 900px) { .profile-page .account-grid { grid-template-columns: minmax(0, 1fr); } }
@media (max-width: 640px) { .profile-page .page-header { padding: var(--ds-space-4); } }


.profile-page .page-header { margin-bottom: 0; }
.profile-heading {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.25rem 1.5rem;
  border: 1px solid var(--ds-color-border);
  border-radius: var(--ds-radius-xl);
  background: linear-gradient(110deg, color-mix(in srgb, var(--ds-color-primary) 8%, var(--ds-color-surface)), var(--ds-color-surface) 72%);
  box-shadow: var(--ds-shadow-xs);
}
.profile-heading-icon {
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
.profile-heading > div { min-width: 0; }
.profile-heading-eyebrow { display: block; color: var(--ds-color-primary); font-size: var(--ds-font-size-xs); font-weight: var(--ds-font-weight-bold); }
.profile-heading h1 { margin: .2rem 0; color: var(--ds-color-text); font-size: var(--ds-font-size-2xl); font-weight: 800; }
.profile-heading p { margin: .35rem 0 0; color: var(--ds-color-text-muted); font-size: var(--ds-font-size-sm); }
.profile-page :deep(.p-tablist) { border: 1px solid var(--ds-color-border); border-radius: var(--ds-radius-xl) var(--ds-radius-xl) 0 0; background: var(--ds-color-surface); }
.profile-page :deep(.p-tabpanels) { border: 1px solid var(--ds-color-border); border-top: 0; border-radius: 0 0 var(--ds-radius-xl) var(--ds-radius-xl); background: var(--ds-color-surface); }
.profile-page .detail-row,
.profile-page .security-row { border-color: var(--ds-color-border); }
.profile-page .field label { color: var(--ds-color-text); font-weight: var(--ds-font-weight-semibold); }
.profile-page :deep(.p-inputtext),
.profile-page :deep(.p-textarea) { border-color: var(--ds-color-border); border-radius: var(--ds-radius-md); }
@media (max-width: 640px) {
  .profile-heading { align-items: flex-start; padding: 1rem; }
  .profile-heading-icon { width: 2.75rem; height: 2.75rem; }
}

@media (max-width: 767px) {
  .session-header,
  .session-item {
    grid-template-columns: 1fr;
    gap: 0.5rem;
  }

  .security-row {
    flex-direction: column;
    align-items: flex-start;
  }

  .sessions-actions {
    flex-direction: column;
  }

  .sessions-actions button {
    width: 100%;
  }
}

</style>