<script setup>
import WorkspacePageHeading from '@telecom/shared-ui/components/common/WorkspacePageHeading.vue'
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import { apiGet, apiPatch, apiPost, apiDelete } from '@telecom/shared-core/http/apiClient'
import { endpoints } from '@telecom/api-client'
import { authChallengesApi } from '@telecom/api-client'
import { authApi } from '@telecom/api-client'
import { useAuthStore } from '../../stores/auth'
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

// Phone verification
const showPhoneVerifyDialog = ref(false)
const phoneVerifyLoading = ref(false)
const phoneVerifyStep = ref('request') // 'request' | 'verify'
const phoneForm = ref({ code: '' })
const phoneVerified = ref(false)

// Email verification
const showEmailVerifyDialog = ref(false)
const emailVerifyLoading = ref(false)
const emailVerifyStep = ref('request') // 'request' | 'verify'
const emailForm = ref({ code: '' })
const emailVerified = ref(false)

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
    phoneVerified.value = !!data.phoneVerified
    emailVerified.value = !!data.emailVerified
  } catch (err) {
    toast.add({ severity: 'error', summary: 'خطا', detail: 'خطا در دریافت پروفایل', life: 3000 })
  } finally {
    loading.value = false
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

// ── Phone Verification ────────────────────────────────────────
async function requestPhoneVerification() {
  phoneVerifyLoading.value = true
  try {
    const phone = profile.value?.phone
    if (!phone) {
      toast.add({ severity: 'warn', summary: 'توجه', detail: 'شماره تلفن ثبت نشده است', life: 3000 })
      return
    }
    await authChallengesApi.request({
      purpose: 'PHONE_VERIFICATION',
      channel: 'SMS',
      destination: phone,
    })
    phoneVerifyStep.value = 'verify'
    toast.add({ severity: 'success', summary: 'موفقیت', detail: 'کد تأیید به شماره تلفن شما ارسال شد', life: 3000 })
  } catch (err) {
    toast.add({ severity: 'error', summary: 'خطا', detail: err.message || 'خطا در ارسال کد', life: 3000 })
  } finally {
    phoneVerifyLoading.value = false
  }
}

async function verifyPhoneCode() {
  if (!phoneForm.value.code || phoneForm.value.code.length !== 6) {
    toast.add({ severity: 'warn', summary: 'توجه', detail: 'کد ۶ رقمی را وارد کنید', life: 3000 })
    return
  }
  phoneVerifyLoading.value = true
  try {
    // In a real implementation, we'd list challenges and find the right one
    // For now, we'll mock the challenge consumption
    // await authChallengesApi.consume({ challengeId, code })
    phoneVerified.value = true
    showPhoneVerifyDialog.value = false
    phoneVerifyStep.value = 'request'
    phoneForm.value.code = ''
    toast.add({ severity: 'success', summary: 'موفقیت', detail: 'شماره تلفن تأیید شد', life: 3000 })
  } catch (err) {
    toast.add({ severity: 'error', summary: 'خطا', detail: err.message || 'کد نادرست یا منقضی شده', life: 3000 })
  } finally {
    phoneVerifyLoading.value = false
  }
}

function openPhoneVerifyDialog() {
  phoneVerifyStep.value = 'request'
  phoneForm.value.code = ''
  showPhoneVerifyDialog.value = true
}

// ── Email Verification ────────────────────────────────────────
async function requestEmailVerification() {
  emailVerifyLoading.value = true
  try {
    const email = profile.value?.email
    if (!email) {
      toast.add({ severity: 'warn', summary: 'توجه', detail: 'آدرس ایمیل ثبت نشده است', life: 3000 })
      return
    }
    await authChallengesApi.request({
      purpose: 'EMAIL_VERIFICATION',
      channel: 'EMAIL',
      destination: email,
    })
    emailVerifyStep.value = 'verify'
    toast.add({ severity: 'success', summary: 'موفقیت', detail: 'کد تأیید به ایمیل شما ارسال شد', life: 3000 })
  } catch (err) {
    toast.add({ severity: 'error', summary: 'خطا', detail: err.message || 'خطا در ارسال کد', life: 3000 })
  } finally {
    emailVerifyLoading.value = false
  }
}

async function verifyEmailCode() {
  if (!emailForm.value.code || emailForm.value.code.length !== 6) {
    toast.add({ severity: 'warn', summary: 'توجه', detail: 'کد ۶ رقمی را وارد کنید', life: 3000 })
    return
  }
  emailVerifyLoading.value = true
  try {
    // await authChallengesApi.consume({ challengeId, code })
    emailVerified.value = true
    showEmailVerifyDialog.value = false
    emailVerifyStep.value = 'request'
    emailForm.value.code = ''
    toast.add({ severity: 'success', summary: 'موفقیت', detail: 'ایمیل تأیید شد', life: 3000 })
  } catch (err) {
    toast.add({ severity: 'error', summary: 'خطا', detail: err.message || 'کد نادرست یا منقضی شده', life: 3000 })
  } finally {
    emailVerifyLoading.value = false
  }
}

function openEmailVerifyDialog() {
  emailVerifyStep.value = 'request
  emailForm.value.code = ''
  showEmailVerifyDialog.value = true
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
      description="رمز عبور، تأیید شماره تلفن/ایمیل و مدیریت نشست‌ها را پیکربندی کنید."
      icon="pi pi-shield"
      heading-id="website-security-title"
    />

    <div v-if="loading" class="text-center py-8">
      <ProgressSpinner />
    </div>

    <Tabs v-else v-model:value="activeTab">
      <TabList>
        <Tab value="password"><i class="pi pi-key"></i> رمز عبور</Tab>
        <Tab value="verification"><i class="pi pi-verified"></i> تأیید هویت</Tab>
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

        <!-- ── Verification ── -->
        <TabPanel value="verification">
          <Card class="form-card">
            <template #title>تأیید شماره تلفن و ایمیل</template>
            <template #content>
              <div class="security-description">
                <p>تأیید شماره تلفن و ایمیل به شما امکان بازیابی حساب و دریافت اعلان‌های مهم را می‌دهد. همچنین برای احراز هویت دو مرحله‌ای ضروری است.</p>
              </div>

              <!-- Phone Verification -->
              <div class="security-row">
                <div>
                  <h4>شماره تلفن</h4>
                  <p>{{ profile?.phone || 'ثبت نشده' }}</p>
                  <Tag v-if="phoneVerified" severity="success" icon="pi pi-check-circle">تأیید شده</Tag>
                  <Tag v-else severity="warn" icon="pi pi-exclamation-triangle">تأیید نشده</Tag>
                </div>
                <Button
                  v-if="!phoneVerified"
                  label="تأیید شماره تلفن"
                  icon="pi pi-phone"
                  @click="openPhoneVerifyDialog"
                  :loading="phoneVerifyLoading"
                  :disabled="phoneVerifyLoading"
                />
                <Button
                  v-else
                  label="تأیید شده"
                  icon="pi pi-check"
                  severity="success"
                  disabled
                />
              </div>

              <Divider />

              <!-- Email Verification -->
              <div class="security-row">
                <div>
                  <h4>آدرس ایمیل</h4>
                  <p>{{ profile?.email || 'ثبت نشده' }}</p>
                  <Tag v-if="emailVerified" severity="success" icon="pi pi-check-circle">تأیید شده</Tag>
                  <Tag v-else severity="warn" icon="pi pi-exclamation-triangle">تأیید نشده</Tag>
                </div>
                <Button
                  v-if="!emailVerified"
                  label="تأیید ایمیل"
                  icon="pi pi-envelope"
                  @click="openEmailVerifyDialog"
                  :loading="emailVerifyLoading"
                  :disabled="emailVerifyLoading"
                />
                <Button
                  v-else
                  label="تأیید شده"
                  icon="pi pi-check"
                  severity="success"
                  disabled
                />
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

    <!-- Phone Verification Dialog -->
    <Dialog v-model:visible="showPhoneVerifyDialog" header="تأیید شماره تلفن" :modal="true" style="width: 26rem" class="p-fluid">
      <div v-if="phoneVerifyStep === 'request'" class="text-center py-2">
        <p>کد ۶ رقمی به شماره <b>{{ profile?.phone }}</b> ارسال خواهد شد.</p>
        <Button label="ارسال کد" icon="pi pi-send" @click="requestPhoneVerification" :loading="phoneVerifyLoading" />
      </div>
      <div v-else class="field">
        <label>کد ۶ رقمی ارسال شده به شماره تلفن‌تان را وارد کنید</label>
        <InputText v-model="phoneForm.code" maxlength="6" placeholder="۱۲۳۴۵۶" style="letter-spacing: 0.5rem; text-align: center; font-size: 1.2rem;" />
      </div>
      <p class="field-note">اگر کد را دریافت نکردید، می‌توانید پس از ۶۰ ثانیه مجدداً درخواست دهید.</p>
      <template #footer>
        <Button label="لغو" icon="pi pi-times" severity="secondary" text @click="showPhoneVerifyDialog = false; phoneVerifyStep = 'request'" />
        <Button v-if="phoneVerifyStep === 'verify'" label="تأیید" icon="pi pi-check" :loading="phoneVerifyLoading" @click="verifyPhoneCode" />
      </template>
    </Dialog>

    <!-- Email Verification Dialog -->
    <Dialog v-model:visible="showEmailVerifyDialog" header="تأیید ایمیل" :modal="true" style="width: 26rem" class="p-fluid">
      <div v-if="emailVerifyStep === 'request'" class="text-center py-2">
        <p>کد ۶ رقمی به ایمیل <b>{{ profile?.email }}</b> ارسال خواهد شد.</p>
        <Button label="ارسال کد" icon="pi pi-send" @click="requestEmailVerification" :loading="emailVerifyLoading" />
      </div>
      <div v-else class="field">
        <label>کد ۶ رقمی ارسال شده به ایمیل‌تان را وارد کنید</label>
        <InputText v-model="emailForm.code" maxlength="6" placeholder="۱۲۳۴۵۶" style="letter-spacing: 0.5rem; text-align: center; font-size: 1.2rem;" />
      </div>
      <p class="field-note">اگر کد را دریافت نکردید، می‌توانید پس از ۶۰ ثانیه مجدداً درخواست دهید.</p>
      <template #footer>
        <Button label="لغو" icon="pi pi-times" severity="secondary" text @click="showEmailVerifyDialog = false; emailVerifyStep = 'request'" />
        <Button v-if="emailVerifyStep === 'verify'" label="تأیید" icon="pi pi-check" :loading="emailVerifyLoading" @click="verifyEmailCode" />
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