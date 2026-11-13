<template>
  <div class="user-profile-page">
    <main class="ds-container ds-page" aria-labelledby="public-profile-title" :aria-busy="profileLoading || saving">
      <WorkspacePageHeading
        eyebrow="حساب کاربری"
        title="پروفایل من"
        description="مشخصات هویتی، اطلاعات تماس و دسترسی‌های حساب کاربری خود را مدیریت کنید."
        icon="pi pi-user"
        heading-id="public-profile-title"
      >
        <template #actions><Breadcrumb :home="home" :model="items" class="profile-breadcrumb" /></template>
      </WorkspacePageHeading>

      <div v-if="profileError" class="profile-error" role="alert">
        <i class="pi pi-exclamation-triangle" aria-hidden="true"></i>
        <span>{{ profileError }}</span>
        <Button label="تلاش دوباره" icon="pi pi-refresh" severity="secondary" outlined :loading="profileLoading" @click="loadUserProfile" />
      </div>

      <div v-if="profileLoading && !user.fullName" class="profile-loading" role="status" aria-live="polite" aria-busy="true">
        <i class="pi pi-spin pi-spinner" aria-hidden="true"></i><span>در حال دریافت اطلاعات حساب…</span>
      </div>

      <div v-else-if="!profileError" class="profile-layout">
        <aside class="profile-sidebar" aria-label="اطلاعات و منوی حساب کاربری">
          <Card class="profile-identity-card">
            <template #content>
              <div class="profile-identity">
                <img v-if="user.avatar" :src="user.avatar" :alt="'تصویر پروفایل ' + (user.fullName || 'کاربر')" width="100" height="100" decoding="async" class="profile-avatar" />
                <span v-else class="profile-avatar-fallback" aria-hidden="true">{{ userInitial }}</span>
                <h2>{{ user.fullName || user.email || 'کاربر' }}</h2>
                <p class="profile-email">{{ user.email || 'ایمیلی ثبت نشده است' }}</p>
                <span class="profile-type"><i class="pi pi-user" aria-hidden="true"></i>{{ userTypeLabel }}</span>
              </div>
              <div class="profile-primary-actions">
                <Button label="ویرایش پروفایل" icon="pi pi-pencil" outlined class="profile-action" @click="editProfile" />
                <Button label="تغییر رمز عبور" icon="pi pi-key" outlined severity="secondary" class="profile-action" @click="changePassword" />
              </div>
            </template>
          </Card>

          <Card class="profile-menu-card">
            <template #title>دسترسی‌های حساب</template>
            <template #content>
              <nav class="profile-menu" aria-label="منوی حساب کاربری">
                <router-link :to="{ name: 'notifications' }" class="profile-menu-action"><i class="pi pi-bell" aria-hidden="true"></i><span>اعلان‌ها</span></router-link>
                <router-link to="/profile/addresses" class="profile-menu-action"><i class="pi pi-map-marker" aria-hidden="true"></i><span>آدرس‌های من</span></router-link>
                <Button label="خروج از حساب" icon="pi pi-sign-out" text severity="danger" class="profile-menu-action profile-menu-action--danger" @click="logout" />
              </nav>
            </template>
          </Card>
        </aside>

        <section class="profile-main" aria-labelledby="profile-details-title">
          <Tabs v-model:value="activeTab">
            <TabList>
              <Tab value="account"><i class="pi pi-id-card"></i> اطلاعات حساب</Tab>
              <Tab value="edit"><i class="pi pi-pencil"></i> ویرایش پروفایل</Tab>
              <Tab value="security"><i class="pi pi-lock"></i> امنیت</Tab>
            </TabList>
            <TabPanels>
              <!-- Account Info Tab -->
              <TabPanel value="account">
                <Card class="profile-details-card">
                  <template #title>
                    <div class="profile-card-heading">
                      <div><h2 id="profile-details-title">اطلاعات حساب</h2><p>مشخصات ثبت‌شده برای حساب کاربری شما</p></div>
                    </div>
                  </template>
                  <template #content>
                    <dl class="profile-details-grid">
                      <div class="profile-detail-row"><dt>نام و نام خانوادگی</dt><dd>{{ user.fullName || user.displayName || user.name || 'ثبت نشده' }}</dd></div>
                      <div class="profile-detail-row"><dt>ایمیل</dt><dd>{{ user.email || 'ثبت نشده' }}</dd></div>
                      <div class="profile-detail-row"><dt>شماره تلفن</dt><dd>{{ user.phone || 'ثبت نشده' }}</dd></div>
                      <div class="profile-detail-row"><dt>تاریخ عضویت</dt><dd>{{ formatDate(user.createdAt) }}</dd></div>
                      <div class="profile-detail-row"><dt>نوع حساب</dt><dd><span class="profile-type-inline">{{ userTypeLabel }}</span></dd></div>
                    </dl>
                  </template>
                </Card>
              </TabPanel>

              <!-- Edit Profile Tab -->
              <TabPanel value="edit">
                <Card class="form-card">
                  <template #title>ویرایش پروفایل</template>
                  <template #content>
                    <form @submit.prevent="saveProfile" class="space-y-4">
                      <p v-if="formError" class="text-red-600 text-sm" role="alert">{{ formError }}</p>
                      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label for="profile-first-name" class="profile-field-label">نام</label>
                          <InputText
                            id="profile-first-name"
                            v-model="editForm.firstName"
                            name="firstName"
                            autocomplete="given-name"
                            placeholder="نام خود را وارد کنید"
                            class="w-full"
                          />
                        </div>
                        <div>
                          <label for="profile-last-name" class="profile-field-label">نام خانوادگی</label>
                          <InputText
                            id="profile-last-name"
                            v-model="editForm.lastName"
                            name="lastName"
                            autocomplete="family-name"
                            placeholder="نام خانوادگی خود را وارد کنید"
                            class="w-full"
                          />
                        </div>
                      </div>

                      <div>
                        <label class="profile-field-label">تصویر پروفایل</label>
                        <FileUpload
                          mode="basic"
                          name="avatar"
                          aria-label="انتخاب تصویر پروفایل"
                          accept="image/jpeg,image/png,image/webp"
                          :chooseLabel="saving ? 'در حال پردازش…' : 'انتخاب تصویر'"
                          :maxFileSize="1000000"
                          :disabled="saving"
                          @select="onAvatarUpload"
                          class="w-full"
                        />
                      </div>

                      <div class="flex gap-2 justify-end">
                        <Button
                          type="button"
                          label="انصراف"
                          icon="pi pi-times"
                          class="p-button-outlined"
                          @click="activeTab = 'account'"
                        />
                        <Button
                          type="submit"
                          label="ذخیره تغییرات"
                          icon="pi pi-check"
                          class="p-button-primary"
                          :loading="saving"
                        />
                      </div>
                    </form>
                  </template>
                </Card>
              </TabPanel>

              <!-- Security Tab -->
              <TabPanel value="security">
                <Card class="form-card">
                  <template #title>امنیت</template>
                  <template #content>
                    <div class="security-row">
                      <div>
                        <h4>رمز عبور</h4>
                        <p>برای حفظ امنیت حساب، رمز عبور خود را به‌صورت دوره‌ای تغییر دهید.</p>
                      </div>
                      <Button label="تغییر رمز عبور" icon="pi pi-key" @click="changePassword" />
                    </div>
                    <div class="security-row">
                      <div>
                        <h4>نشست‌های فعال</h4>
                        <p>دستگاه‌هایی که در حال حاضر در حساب شما وارد شده‌اند.</p>
                      </div>
                      <Button label="مشاهده همه" icon="pi pi-list" severity="secondary" outlined @click="loadSessions" />
                    </div>
                    <div class="security-row">
                      <div>
                        <h4>ورودهای اخیر</h4>
                        <p>تاریخچه ورودهای اخیر به حساب شما.</p>
                      </div>
                      <Button label="مشاهده همه" icon="pi pi-list" severity="secondary" outlined @click="loadLoginHistory" />
                    </div>
                  </template>
                </Card>
              </TabPanel>
            </TabPanels>
          </Tabs>
        </section>
      </div>
    </main>

    <!-- Change Password Dialog -->
    <Dialog
      v-model:visible="changePasswordDialog"
      header="تغییر رمز عبور"
      :modal="true"
      class="p-fluid"
    >
      <form @submit.prevent="saveNewPassword" class="space-y-4">
        <p v-if="formError" class="text-red-600 text-sm" role="alert">{{ formError }}</p>
        <div>
          <label for="profile-current-password" class="profile-field-label">رمز عبور فعلی</label>
          <Password
            inputId="profile-current-password"
            v-model="passwordForm.currentPassword"
            name="currentPassword"
            autocomplete="current-password"
            placeholder="رمز عبور فعلی را وارد کنید"
            class="w-full"
            :feedback="false"
            toggleMask
          />
        </div>

        <div>
          <label for="profile-new-password" class="profile-field-label">رمز عبور جدید</label>
          <Password
            inputId="profile-new-password"
            v-model="passwordForm.newPassword"
            name="newPassword"
            autocomplete="new-password"
            placeholder="رمز عبور جدید را وارد کنید"
            class="w-full"
            :feedback="false"
            toggleMask
          />
        </div>

        <div>
          <label for="profile-confirm-password" class="profile-field-label">تکرار رمز عبور جدید</label>
          <Password
            inputId="profile-confirm-password"
            v-model="passwordForm.confirmPassword"
            name="confirmPassword"
            autocomplete="new-password"
            placeholder="رمز عبور جدید را مجدداً وارد کنید"
            class="w-full"
            :feedback="false"
            toggleMask
          />
        </div>

        <div class="flex gap-2 justify-end">
          <Button
            type="button"
            label="انصراف"
            icon="pi pi-times"
            class="p-button-outlined"
            @click="changePasswordDialog = false"
          />
          <Button
            type="submit"
            label="تغییر رمز عبور"
            icon="pi pi-check"
            class="p-button-primary"
            :loading="saving"
          />
        </div>
      </form>
    </Dialog>

    <!-- Active Sessions Dialog -->
    <Dialog v-model:visible="showSessionsDialog" header="نشست‌های فعال" :modal="true" style="width: 50rem" :breakpoints="{ '640px': '95vw', '1024px': '75vw' }" class="p-fluid">
      <div v-if="sessionsLoading" class="text-center py-6">
        <ProgressSpinner style="width: 40px; height: 40px" />
      </div>
      <div v-else class="sessions-content">
        <div v-if="activeSessions.length === 0" class="text-center py-4">
          <i class="pi pi-info-circle" style="font-size: 2rem; color: var(--text-color-secondary)" />
          <p>نشست فعالی یافت نشد.</p>
        </div>
        <template v-else>
          <div class="session-list">
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
      </div>
      <template #footer>
        <Button label="بستن" icon="pi pi-times" severity="secondary" text @click="showSessionsDialog = false" />
      </template>
    </Dialog>

    <!-- Login History Dialog -->
    <Dialog v-model:visible="showLoginHistoryDialog" header="ورودهای اخیر" :modal="true" style="width: 50rem" :breakpoints="{ '640px': '95vw', '1024px': '75vw' }" class="p-fluid">
      <div v-if="sessionsLoading" class="text-center py-6">
        <ProgressSpinner style="width: 40px; height: 40px" />
      </div>
      <div v-else class="login-history-content">
        <div v-if="loginHistory.length === 0" class="text-center py-4">
          <i class="pi pi-info-circle" style="font-size: 2rem; color: var(--text-color-secondary)" />
          <p>تاریخچه ورود یافت نشد.</p>
        </div>
        <template v-else>
          <div class="login-history-list">
            <div class="login-history-header">
              <span>تاریخ و زمان</span>
              <span>IP</span>
              <span>موقعیت</span>
              <span>دستگاه / مرورگر</span>
              <span>نتیجه</span>
            </div>
            <div class="login-history-item" v-for="entry in loginHistory" :key="entry.id">
              <div class="login-history-time">{{ formatDate(entry.createdAt) }}</div>
              <div class="login-history-ip">{{ entry.ipAddress || '—' }}</div>
              <div class="login-history-location">{{ entry.location || '—' }}</div>
              <div class="login-history-device">{{ entry.userAgent || '—' }}</div>
              <div class="login-history-result">
                <Tag :severity="entry.success ? 'success' : 'danger'">
                  {{ entry.success ? 'موفق' : 'ناموفق' }}
                </Tag>
              </div>
            </div>
          </div>
        </template>
      </div>
      <template #footer>
        <Button label="بستن" icon="pi pi-times" severity="secondary" text @click="showLoginHistoryDialog = false" />
      </template>
    </Dialog>
  </div>
</template>

<script setup>
import WorkspacePageHeading from '@telecom/shared-ui/components/common/WorkspacePageHeading.vue'
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth'
import Breadcrumb from 'primevue/breadcrumb'
import Button from 'primevue/button'
import Card from 'primevue/card'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import Password from 'primevue/password'
import FileUpload from 'primevue/fileupload'
import Tabs from 'primevue/tabs'
import TabList from 'primevue/tablist'
import Tab from 'primevue/tab'
import TabPanels from 'primevue/tabpanels'
import TabPanel from 'primevue/tabpanel'
import Tag from 'primevue/tag'
import Badge from 'primevue/badge'
import ProgressSpinner from 'primevue/progressspinner'
import Avatar from 'primevue/avatar'

const router = useRouter()
const authStore = useAuthStore()

const user = ref({})
const profileLoading = ref(false)
const profileError = ref('')
const userInitial = computed(() => (user.value.fullName || user.value.email || 'ک').trim().slice(0, 1).toLocaleUpperCase('fa-IR'))
const userTypeLabel = computed(() => ({ STAFF: 'کارمند بازارگاه', COMPANY: 'کاربر شرکت', CUSTOMER: 'کاربر عادی' }[user.value.userType] || 'کاربر'))

const changePasswordDialog = ref(false)
const saving = ref(false)
const formError = ref('')

const home = ref({
  icon: 'pi pi-home',
  to: '/'
})

const items = ref([
  { label: 'پروفایل کاربر', to: '/profile' }
])

const editForm = ref({
  firstName: '',
  lastName: '',
})

const passwordForm = ref({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

// Session management
const sessionsLoading = ref(false)
const activeSessions = ref([])
const loginHistory = ref([])
const showSessionsDialog = ref(false)
const showLoginHistoryDialog = ref(false)
const revokingSession = ref(null)

onMounted(async () => {
  await loadUserProfile()
})

const loadUserProfile = async () => {
  profileLoading.value = true
  profileError.value = ''
  try {
    const context = await authStore.getProfile()
    const identity = context?.user || {}
    const profile = context?.profile || {}
    const fullName = [profile.firstName, profile.lastName].filter(Boolean).join(' ')
    user.value = {
      ...identity,
      ...profile,
      fullName,
      phone: identity.phone || '',
      userType: context?.accessProfile?.type
        || (context?.roles?.includes('CUSTOMER_USER') ? 'CUSTOMER' : 'کاربر'),
    }
    editForm.value = {
      firstName: profile.firstName || '',
      lastName: profile.lastName || '',
    }
  } catch (error) {
    profileError.value = error?.serverMessage || error?.message || 'دریافت اطلاعات پروفایل ناموفق بود.'
  } finally {
    profileLoading.value = false
  }
}

const formatDate = (date) => {
  if (!date) return 'نامشخص'
  return new Date(date).toLocaleDateString('fa-IR')
}

const editProfile = () => {
  formError.value = ''
  activeTab.value = 'edit'
}

const changePassword = () => {
  formError.value = ''
  changePasswordDialog.value = true
}

const saveProfile = async () => {
  formError.value = ''
  const firstName = editForm.value.firstName.trim()
  const lastName = editForm.value.lastName.trim()

  if (!firstName || !lastName) {
    formError.value = 'نام و نام خانوادگی الزامی است.'
    return
  }
  if (firstName.length > 50 || lastName.length > 50) {
    formError.value = 'نام و نام خانوادگی باید حداکثر ۵۰ نویسه باشند.'
    return
  }
  if (saving.value) return

  saving.value = true
  try {
    // The backend profile API accepts only firstName and lastName here.
    await authStore.updateProfile({ firstName, lastName })
    await loadUserProfile()
    activeTab.value = 'account'
  } catch (error) {
    formError.value = error?.serverMessage || error?.message || 'ذخیره پروفایل ناموفق بود.'
  } finally {
    saving.value = false
  }
}

const saveNewPassword = async () => {
  formError.value = ''
  if (!passwordForm.value.currentPassword || passwordForm.value.currentPassword.length < 6) {
    formError.value = 'رمز عبور فعلی باید حداقل ۶ نویسه باشد.'
    return
  }
  if (!passwordForm.value.newPassword || passwordForm.value.newPassword.length < 8) {
    formError.value = 'رمز عبور جدید باید حداقل ۸ نویسه باشد.'
    return
  }
  if (passwordForm.value.newPassword.length > 100) {
    formError.value = 'رمز عبور جدید نمی‌تواند بیشتر از ۱۰۰ نویسه باشد.'
    return
  }
  if (passwordForm.value.newPassword !== passwordForm.value.confirmPassword) {
    formError.value = 'تکرار رمز عبور جدید با رمز عبور یکسان نیست.'
    return
  }
  if (saving.value) return

  saving.value = true
  try {
    await authStore.changePassword({
      currentPassword: passwordForm.value.currentPassword,
      newPassword: passwordForm.value.newPassword,
    })
    passwordForm.value = {
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    }
    changePasswordDialog.value = false
  } catch (error) {
    formError.value = error?.serverMessage || error?.message || 'تغییر رمز عبور ناموفق بود.'
  } finally {
    saving.value = false
  }
}

const onAvatarUpload = async (event) => {
  formError.value = ''
  const file = event.files?.[0]
  if (!file) return
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    formError.value = 'فقط تصویر JPEG، PNG یا WebP قابل بارگذاری است.'
    return
  }
  if (file.size > 1_000_000) {
    formError.value = 'حجم تصویر باید حداکثر یک مگابایت باشد.'
    return
  }
  if (saving.value) return

  saving.value = true
  try {
    await authStore.uploadAvatar(file)
    await loadUserProfile()
  } catch (error) {
    formError.value = error?.serverMessage || error?.message || 'بارگذاری تصویر پروفایل ناموفق بود.'
  } finally {
    saving.value = false
  }
}

const logout = async () => {
  if (saving.value) return
  await authStore.logout()
  router.push({ name: 'login' })
}

// Session management
const activeTab = ref('account')

async function loadSessions() {
  showSessionsDialog.value = true
  sessionsLoading.value = true
  try {
    // For now, we'll use mock data since the API endpoint doesn't exist yet
    // TODO: Replace with actual API call when backend implements session management
    // const { data } = await apiGet('/auth/sessions')
    // activeSessions.value = data

    // Mock data for demo
    activeSessions.value = [
      {
        id: 'current',
        deviceName: 'Chrome on Windows',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        ipAddress: '192.168.1.100',
        location: 'تهران، ایران',
        lastActivityAt: new Date().toISOString(),
        isCurrent: true,
        deviceIcon: 'pi pi-desktop',
      },
      {
        id: 'sess_2',
        deviceName: 'Mobile App',
        userAgent: 'TelecomMarket/1.0 (iOS 17.2)',
        ipAddress: '192.168.1.101',
        location: 'تهران، ایران',
        lastActivityAt: new Date(Date.now() - 3600000).toISOString(),
        isCurrent: false,
        deviceIcon: 'pi pi-mobile',
      },
    ]
  } catch (err) {
    toast.add({ severity: 'error', summary: 'خطا', detail: 'خطا در دریافت نشست‌ها', life: 3000 })
  } finally {
    sessionsLoading.value = false
  }
}

async function loadLoginHistory() {
  showLoginHistoryDialog.value = true
  sessionsLoading.value = true
  try {
    // Mock data for demo
    // TODO: Replace with actual API call when backend implements login history
    loginHistory.value = [
      {
        id: 1,
        createdAt: new Date().toISOString(),
        ipAddress: '192.168.1.100',
        location: 'تهران، ایران',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        success: true,
      },
      {
        id: 2,
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        ipAddress: '192.168.1.100',
        location: 'تهران، ایران',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        success: true,
      },
      {
        id: 3,
        createdAt: new Date(Date.now() - 172800000).toISOString(),
        ipAddress: '192.168.1.50',
        location: 'مشهد، ایران',
        userAgent: 'Mozilla/5.0 (Linux; Android 14)',
        success: false,
      },
    ]
  } catch (err) {
    toast.add({ severity: 'error', summary: 'خطا', detail: 'خطا در دریافت تاریخچه ورود', life: 3000 })
  } finally {
    sessionsLoading.value = false
  }
}

async function revokeSession(sessionId) {
  revokingSession.value = sessionId
  try {
    // TODO: Replace with actual API call when backend implements session revocation
    // await apiDelete(`/auth/sessions/${sessionId}`)
    activeSessions.value = activeSessions.value.filter(s => s.id !== sessionId)
    toast.add({ severity: 'success', summary: 'موفقیت', detail: 'نشست لغو شد', life: 3000 })
  } catch (err) {
    toast.add({ severity: 'error', summary: 'خطا', detail: 'خطا در لغو نشست', life: 3000 })
  } finally {
    revokingSession.value = null
  }
}
</script>

<style scoped>
.user-profile-page { direction: rtl; color: var(--ds-color-text); }
.user-profile-page > .ds-container { display: flex; flex-direction: column; gap: var(--ds-space-5); }
.profile-layout {
  display: grid;
  grid-template-columns: minmax(250px, .78fr) minmax(0, 2.22fr);
  align-items: start;
  gap: var(--ds-space-5);
}
.profile-sidebar,
.profile-main { display: flex; flex-direction: column; gap: var(--ds-space-4); min-width: 0; }
.user-profile-page :deep(.p-card) {
  overflow: hidden;
  border: 1px solid var(--ds-color-border);
  border-radius: var(--ds-radius-md);
  background: var(--ds-color-surface);
  box-shadow: var(--ds-shadow-sm);
}
.user-profile-page :deep(.p-card-body) { padding: clamp(1rem, 2vw, 1.5rem); }
.user-profile-page :deep(.p-card-title) { margin-bottom: var(--ds-space-4); color: var(--ds-color-text); }
.profile-identity { display: flex; flex-direction: column; align-items: center; text-align: center; }
.profile-avatar,
.profile-avatar-fallback {
  display: grid;
  place-items: center;
  width: 6.25rem;
  height: 6.25rem;
  margin-bottom: 1rem;
  border: 2px solid var(--ds-color-border);
  border-radius: 50%;
  object-fit: cover;
}
.profile-avatar-fallback {
  background: var(--ds-color-brand-deep);
  color: var(--ds-color-on-brand);
  font-size: 2rem;
  font-weight: var(--ds-font-weight-bold);
}
.profile-identity h2 { margin: 0; color: var(--ds-color-text); font-size: var(--ds-font-size-lg); font-weight: var(--ds-font-weight-bold); overflow-wrap: anywhere; }
.profile-email { margin: .35rem 0 0; color: var(--ds-color-text-muted); font-size: var(--ds-font-size-sm); overflow-wrap: anywhere; }
.profile-type,
.profile-type-inline {
  display: inline-flex;
  align-items: center;
  gap: .35rem;
  padding: .35rem .65rem;
  border-radius: var(--ds-radius-pill);
  background: var(--ds-color-primary-soft);
  color: var(--ds-color-primary);
  font-size: var(--ds-font-size-xs);
  font-weight: var(--ds-font-weight-bold);
}
.profile-type { margin-top: .8rem; }
.profile-primary-actions { display: grid; gap: .6rem; margin-top: 1.25rem; }
.profile-action { width: 100%; min-height: 2.75rem; justify-content: center; }
.profile-menu { display: grid; gap: .35rem; }
 .profile-menu-action {
  display: flex;
  width: 100%;
  min-height: 2.75rem;
  align-items: center;
  justify-content: flex-start;
  gap: .75rem;
  padding: .65rem .75rem;
  border-radius: var(--ds-radius-sm);
  color: var(--ds-color-text);
  font-size: var(--ds-font-size-sm);
  font-weight: var(--ds-font-weight-semibold);
  text-decoration: none;
  transition: background-color var(--ds-transition-fast), color var(--ds-transition-fast);
}
.profile-menu-action:hover { background: var(--ds-color-surface-hover); }
.profile-menu-action:focus-visible { outline: 2px solid var(--ds-color-focus); outline-offset: 2px; }
.profile-menu-action--danger { color: var(--ds-color-danger); }
.profile-card-heading { display: flex; align-items: center; gap: .8rem; }
.profile-card-heading h2 { margin: 0; font-size: var(--ds-font-size-lg); font-weight: var(--ds-font-weight-bold); }
.profile-card-heading p { margin: .2rem 0 0; color: var(--ds-color-text-muted); font-size: var(--ds-font-size-xs); font-weight: var(--ds-font-weight-normal); }
.profile-details-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: .75rem; margin: 0; }
.profile-detail-row {
  display: flex;
  flex-direction: column;
  gap: .4rem;
  min-width: 0;
  padding: .85rem 0;
  border: 0;
  border-bottom: 1px solid var(--ds-color-border);
  border-radius: 0;
  background: transparent;
}
.profile-detail-row dt { color: var(--ds-color-text-muted); font-size: var(--ds-font-size-xs); font-weight: var(--ds-font-weight-semibold); }
.profile-detail-row dd { margin: 0; color: var(--ds-color-text); font-size: var(--ds-font-size-sm); font-weight: var(--ds-font-weight-semibold); overflow-wrap: anywhere; }
.profile-loading,
.profile-error {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: .75rem;
  min-height: 7rem;
  padding: 1rem;
  border: 1px solid var(--ds-color-border);
  border-radius: var(--ds-radius-md);
  background: var(--ds-color-surface);
  color: var(--ds-color-text-muted);
  box-shadow: none;
}
.profile-loading i { color: var(--ds-color-primary); }
.profile-error { flex-wrap: wrap; border-color: color-mix(in srgb, var(--ds-color-danger) 28%, transparent); background: var(--ds-color-danger-soft); color: var(--ds-color-danger); }
.user-profile-page :deep(.p-dialog) { width: min(100% - 2rem, 38rem); }
.user-profile-page :deep(.p-dialog-content) { padding-top: var(--ds-space-4); }
.user-profile-page .profile-field-label { display: block; margin-bottom: .45rem; color: var(--ds-color-text); font-size: var(--ds-font-size-sm); font-weight: var(--ds-font-weight-semibold); }
.user-profile-page :deep(.p-inputtext),
.user-profile-page :deep(.p-password-input) { width: 100%; min-height: 2.75rem; }
.user-profile-page :deep(.p-fileupload-choose),
.user-profile-page :deep(.p-button) { min-height: 2.75rem; border-radius: var(--ds-radius-md); }
.user-profile-page :deep(.p-button:focus-visible),
.user-profile-page :deep(.p-inputtext:focus-visible),
.user-profile-page :deep(.p-password-input:focus-visible) {
  outline: 2px solid var(--ds-color-focus);
  outline-offset: 2px;
}
@media (max-width: 900px) {
  .profile-layout { grid-template-columns: minmax(0, 1fr); }
  .profile-sidebar { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); align-items: start; }
}
@media (max-width: 640px) {
  .profile-sidebar,
  .profile-details-grid { grid-template-columns: minmax(0, 1fr); }
  .profile-card-heading { align-items: flex-start; }
}
</style>