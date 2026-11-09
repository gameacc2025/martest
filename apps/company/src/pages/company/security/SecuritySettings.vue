<script setup>
import WorkspacePageHeading from '@telecom/shared-ui/components/common/WorkspacePageHeading.vue'
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import { apiGet, apiPatch, apiPost, apiDelete } from '@telecom/shared-core/http/apiClient'
import { endpoints } from '@telecom/api-client'
import { authApi } from '@telecom/api-client'
import { useAuthStore } from '../../../stores/auth'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
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
import Checkbox from 'primevue/checkbox'
import Divider from 'primevue/divider'
import Tooltip from 'primevue/tooltip'

const toast = useToast()
const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const loading = ref(false)
const profile = ref(null)

// Active tab is synced with ?tab= so the header menu can deep-link here.
const activeTab = ref(route.query.tab || 'password')
watch(activeTab, (val) => {
  router.replace({ query: { ...route.query, tab: val } })
})

// Password change form
const showPasswordDialog = ref(false)
const changingPassword = ref(false)
const passwordForm = ref({ currentPassword: '', newPassword: '', confirmPassword: '' })

// MFA form
const showMfaDialog = ref(false)
const mfaLoading = ref(false)
const mfaForm = ref({ method: 'SMS', code: '' })
const mfaEnabled = ref(false)
const mfaMethod = ref('SMS')

// Session management
const sessionsLoading = ref(false)
const activeSessions = ref([])
const revokingSession = ref(null)

onMounted(() => {
  fetchProfile()
  loadMfaStatus()
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
  } catch (err) {
    toast.add({ severity: 'error', summary: 'خطا', detail: 'خطا در دریافت پروفایل', life: 3000 })
  } finally {
    loading.value = false
  }
}

async function loadMfaStatus() {
  try {
    // Check if user has MFA enabled via phone/email verification
    // In a real implementation, this would check user's MFA settings
    // For now, we'll mock it based on phone/email verification status
    mfaEnabled.value = !!(profile.value?.phoneVerified || profile.value?.emailVerified)
    mfaMethod.value = profile.value?.phoneVerified ? 'SMS' : 'EMAIL'
  } catch (err) {
    console.error('Error loading MFA status:', err)
  }
}

// ── Change password ──────────────────────────────────────────
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

// ── MFA ──────────────────────────────────────────────────────
async function toggleMfa() {
  mfaLoading.value = true
  try {
    if (mfaEnabled.value) {
      // Disable MFA - would call API to disable
      // await apiPost('/auth/mfa/disable')
      mfaEnabled.value = false
      toast.add({ severity: 'success', summary: 'موفقیت', detail: 'احراز هویت دو مرحله‌ای غیرفعال شد', life: 3000 })
    } else {
      // Enable MFA - open dialog to verify
      openMfaDialog()
    }
  } catch (err) {
    toast.add({ severity: 'error', summary: 'خطا', detail: 'خطا در تغییر تنظیمات MFA', life: 3000 })
  } finally {
    mfaLoading.value = false
  }
}

function openMfaDialog() {
  mfaForm.value = { method: mfaMethod.value, code: '' }
  showMfaDialog.value = true
}

async function submitMfaEnable() {
  if (!mfaForm.value.code || mfaForm.value.code.length !== 6) {
    toast.add({ severity: 'warn', summary: 'توجه', detail: 'کد ۶ رقمی را وارد کنید', life: 3000 })
    return
  }
  mfaLoading.value = true
  try {
    // In a real implementation, this would verify the challenge
    // await authChallengesApi.consume({ challengeId, code })
    mfaEnabled.value = true
    mfaMethod.value = mfaForm.value.method
    showMfaDialog.value = false
    toast.add({ severity: 'success', summary: 'موفقیت', detail: 'احراز هویت دو مرحله‌ای فعال شد', life: 3000 })
  } catch (err) {
    toast.add({ severity: 'error', summary: 'خطا', detail: err.message || 'خطا در فعال‌سازی MFA', life: 3000 })
  } finally {
    mfaLoading.value = false
  }
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

async function revokeAllSessions() {
  try {
    await apiPost(endpoints.auth.logoutAll)
    toast.add({ severity: 'success', summary: 'موفقیت', detail: 'تمام نشست‌ها لغو شدند', life: 3000 })
    setTimeout(() => authStore.logout({ redirectTo: '/login' }), 1500)
  } catch (err) {
    toast.add({ severity: 'error', summary: 'خطا', detail: 'خطا در لغو همه نشست‌ها', life: 3000 })
  }
}
</script>

<template>
  <div class="security-settings-page">
    <WorkspacePageHeading
      eyebrow="تنظیمات امنیتی"
      title="امنیت حساب"
      description="رمز عبور، احراز هویت دو مرحله‌ای و مدیریت نشست‌ها را پیکربندی کنید."
      icon="pi pi-shield"
      heading-id="company-security-title"
    />

    <div v-if="loading" class="text-center py-8">
      <ProgressSpinner />
    </div>

    <Tabs v-else v-model:value="activeTab">
      <TabList>
        <Tab value="password"><i class="pi pi-key"></i> رمز عبور</Tab>
        <Tab value="mfa"><i class="pi pi-lock"></i> احراز هویت دو مرحله‌ای</Tab>
        <Tab value="sessions"><i class="pi pi-desktop"></i> نشست‌های فعال</Tab>
      </TabList>

      <TabPanels>
        <!-- ── Password ── -->
        <TabPanel value="password">
          <Card class="form-card">
            <template #title>تغییر رمز عبور</template>
            <template #content>
              <div class="security-description">
                <p>برای حفظ امنیت حساب، رمز عبور خود را به‌صورت دوره‌ای تغییر دهید. از رمز عبور قوی و منحصر به فرد استفاده کنید.</p>
              </div>
              <Button label="تغییر رمز عبور" icon="pi pi-key" @click="openPasswordDialog" />
            </template>
          </Card>
        </TabPanel>

        <!-- ── MFA ── -->
        <TabPanel value="mfa">
          <Card class="form-card">
            <template #title>احراز هویت دو مرحله‌ای (2FA)</template>
            <template #content>
              <div class="security-description">
                <p>احراز هویت دو مرحله‌ای لایه امنیتی اضافی به حساب شما اضافه می‌کند. پس از فعال‌سازی، علاوه بر رمز عبور، کد یکبار مصرف نیز برای ورود مورد نیاز است.</p>
              </div>

              <div class="security-row">
                <div>
                  <h4>وضعیت: {{ mfaEnabled ? 'فعال' : 'غیرفعال' }}</h4>
                  <p v-if="mfaEnabled">روش فعلی: {{ mfaMethod === 'SMS' ? 'پیامک (SMS)' : 'ایمیل' }}</p>
                </div>
                <Button
                  :label="mfaEnabled ? 'غیرفعال کردن' : 'فعال‌سازی'"
                  :icon="mfaEnabled ? 'pi pi-lock-open' : 'pi pi-lock'"
                  :severity="mfaEnabled ? 'danger' : 'primary'"
                  @click="toggleMfa"
                  :loading="mfaLoading"
                  :disabled="mfaLoading"
                />
              </div>

              <Divider v-if="!mfaEnabled" />

              <div v-if="!mfaEnabled" class="mfa-setup">
                <h4>روش احراز هویت را انتخاب کنید:</h4>
                <div class="field">
                  <label>روش ارسال کد</label>
                  <div class="radio-group">
                    <label class="radio-option">
                      <input type="radio" v-model="mfaMethod" value="SMS" />
                      <span>پیامک (SMS) به شماره تلفن تأییدشده</span>
                    </label>
                    <label class="radio-option">
                      <input type="radio" v-model="mfaMethod" value="EMAIL" />
                      <span>ایمیل به آدرس تأییدشده</span>
                    </label>
                  </div>
                </div>
                <Button label="ادامه و ارسال کد" icon="pi pi-arrow-right" @click="openMfaDialog" />
              </div>
            </template>
          </Card>
        </TabPanel>

        <!-- ── Sessions ── -->
        <TabPanel value="sessions">
          <Card class="form-card">
            <template #title>نشست‌های فعال</template>
            <template #content>
              <div class="security-description">
                <p>لیست دستگاه‌هایی که در حال حاضر در حساب شما وارد شده‌اند. می‌توانید نشست‌های مشکوک را لغو کنید.</p>
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

    <!-- MFA Enable Dialog -->
    <Dialog v-model:visible="showMfaDialog" header="فعالسازی احراز هویت دو مرحله‌ای" :modal="true" style="width: 26rem" class="p-fluid">
      <div class="field">
        <label>کد ۶ رقمی ارسال شده به {{ mfaForm.method === 'SMS' ? 'شماره تلفن' : 'ایمیل' }}-تان را وارد کنید</label>
        <InputText v-model="mfaForm.code" maxlength="6" placeholder="۱۲۳۴۵۶" style="letter-spacing: 0.5rem; text-align: center; font-size: 1.2rem;" />
      </div>
      <p class="field-note">اگر کد را دریافت نکردید، می‌توانید پس از ۶۰ ثانیه مجدداً درخواست دهید.</p>
      <template #footer>
        <Button label="لغو" icon="pi pi-times" severity="secondary" text @click="showMfaDialog = false" />
        <Button label="تأیید و فعال‌سازی" icon="pi pi-check" :loading="mfaLoading" @click="submitMfaEnable" />
      </template>
    </Dialog>
  </div>
</template>

<script>
import Badge from 'primevue/badge'

export default {
  components: { Badge },
}
</script>

<style scoped>
.security-settings-page {
  direction: rtl;
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-5);
}

.security-description {
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: var(--ds-color-surface-hover);
  border-radius: var(--ds-radius-md);
  border: 1px solid var(--ds-color-border);
}

.security-description p {
  margin: 0;
  color: var(--ds-color-text);
  line-height: 1.7;
}

.security-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem 0;
  border-bottom: 1px solid var(--ds-color-border);
}

.security-row h4 {
  margin: 0 0 0.25rem;
}

.security-row p {
  margin: 0;
  font-size: 0.85rem;
  color: var(--text-color-secondary);
}

.mfa-setup {
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--ds-color-border);
}

.mfa-setup h4 {
  margin: 0 0 1rem;
}

.radio-group {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.radio-option {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  cursor: pointer;
}

.radio-option input {
  accent-color: var(--ds-color-primary);
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

.field-note {
  font-size: 0.8rem;
  color: var(--text-color-secondary);
  margin: 0.5rem 0 0;
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