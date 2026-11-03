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
        </section>
      </div>
    </main>

    <!-- Edit Profile Dialog -->
    <Dialog
      v-model:visible="editProfileDialog"
      header="ویرایش پروفایل"
      :modal="true"
      class="p-fluid"
    >
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
            accept="image/*"
            chooseLabel="انتخاب تصویر"
            :maxFileSize="1000000"
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
            @click="editProfileDialog = false"
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
    </Dialog>

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

const router = useRouter()
const authStore = useAuthStore()

const user = ref({})
const profileLoading = ref(false)
const profileError = ref('')
const userInitial = computed(() => (user.value.fullName || user.value.email || 'ک').trim().slice(0, 1).toLocaleUpperCase('fa-IR'))
const userTypeLabel = computed(() => ({ STAFF: 'کارمند بازارگاه', COMPANY: 'کاربر شرکت', CUSTOMER: 'کاربر عادی' }[user.value.userType] || 'کاربر'))

const editProfileDialog = ref(false)
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
  editProfileDialog.value = true
}

const changePassword = () => {
  formError.value = ''
  changePasswordDialog.value = true
}

const saveProfile = async () => {
  formError.value = ''
  saving.value = true
  try {
    // The backend profile API accepts only firstName and lastName here.
    const updateData = {}
    if (editForm.value.firstName?.trim()) updateData.firstName = editForm.value.firstName.trim()
    if (editForm.value.lastName?.trim()) updateData.lastName = editForm.value.lastName.trim()
    if (Object.keys(updateData).length === 0) {
      editProfileDialog.value = false
      return
    }
    await authStore.updateProfile(updateData)
    await loadUserProfile()
    editProfileDialog.value = false
  } catch (error) {
    formError.value = error?.serverMessage || error?.message || 'ذخیره پروفایل ناموفق بود.'
  } finally {
    saving.value = false
  }
}

const saveNewPassword = async () => {
  formError.value = ''
  saving.value = true
  try {
    if (passwordForm.value.newPassword !== passwordForm.value.confirmPassword) {
      throw new Error('تکرار رمز عبور جدید با رمز عبور یکسان نیست.')
    }
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
  const file = event.files[0]
  if (file) {
    try {
      await authStore.uploadAvatar(file)
      await loadUserProfile()
    } catch (error) {
      formError.value = error?.serverMessage || error?.message || 'بارگذاری تصویر پروفایل ناموفق بود.'
    }
  }
}

const logout = async () => {
  await authStore.logout()
  router.push({ name: 'login' })
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
  box-shadow: none;
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