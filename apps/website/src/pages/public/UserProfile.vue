<template>
  <div class="user-profile-page">
    <div class="ds-container ds-page">
      <div class="mb-6">
        <h1 class="text-2xl font-bold">پروفایل کاربر</h1>
        <Breadcrumb :home="home" :model="items" class="mt-2" />
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <!-- Sidebar -->
        <div class="lg:col-span-1">
          <Card>
            <template #content>
              <div class="text-center">
                <img
                  :src="user.avatarUrl || '/placeholder-avatar.jpg'"
                  alt="Avatar"
                  class="w-24 h-24 rounded-full mx-auto mb-4 object-cover"
                />
                <h2 class="text-lg font-bold">{{ user.fullName || user.displayName || user.name }}</h2>
                <p class="text-gray-500">{{ user.email }}</p>
                <p class="text-sm text-gray-400 mt-2">{{ user.role }}</p>

                <div class="mt-6 space-y-2">
                  <Button
                    label="ویرایش پروفایل"
                    icon="pi pi-pencil"
                    class="w-full p-button-outlined"
                    @click="editProfile"
                  />
                  <Button
                    label="تغییر رمز عبور"
                    icon="pi pi-key"
                    class="w-full p-button-outlined"
                    @click="changePassword"
                  />
                </div>
              </div>
            </template>
          </Card>

          <Card class="mt-4">
            <template #title>منوی کاربری</template>
            <template #content>
              <div class="space-y-2">
                <Button
                  label="اعلان ها"
                  icon="pi pi-bell"
                  class="w-full p-button-text justify-start"
                  @click="goToNotifications"
                  :badge="notificationCount"
                  badgeClass="p-badge-danger"
                />
                <Button
                  label="آدرس ها"
                  icon="pi pi-map-marker"
                  class="w-full p-button-text justify-start"
                  @click="goToAddresses"
                />
                <Button
                  label="تراکنش ها"
                  icon="pi pi-credit-card"
                  class="w-full p-button-text justify-start"
                  @click="goToTransactions"
                />
                <Button
                  label="خروج"
                  icon="pi pi-sign-out"
                  class="w-full p-button-text p-button-danger justify-start"
                  @click="logout"
                />
              </div>
            </template>
          </Card>
        </div>

        <!-- Main Content -->
        <div class="lg:col-span-3">
          <Card>
            <template #title>اطلاعات پروفایل</template>
            <template #content>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 class="font-semibold mb-4">اطلاعات شخصی</h3>
                  <div class="space-y-3">
                    <div class="flex justify-between">
                      <span class="text-gray-500">نام و نام خانوادگی:</span>
                      <span>{{ user.fullName || user.displayName || user.name }}</span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-gray-500">ایمیل:</span>
                      <span>{{ user.email }}</span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-gray-500">شماره تلفن:</span>
                      <span>{{ user.phoneNumber || 'ثبت نشده' }}</span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-gray-500">درباره من:</span>
                      <span>{{ user.bio || 'ثبت نشده' }}</span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-gray-500">تاریخ عضویت:</span>
                      <span>{{ formatDate(user.createdAt) }}</span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-gray-500">نوع کاربر:</span>
                      <span>{{ user.userType || 'کاربر عادی' }}</span>
                    </div>
                  </div>
                </div>

              </div>
            </template>
          </Card>

        </div>
      </div>
    </div>

    <!-- Edit Profile Dialog -->
    <Dialog
      v-model:visible="editProfileDialog"
      header="ویرایش پروفایل"
      :modal="true"
      class="p-fluid"
    >
      <form @submit.prevent="saveProfile" class="space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium mb-2">نام</label>
            <InputText
              v-model="editForm.firstName"
              placeholder="نام خود را وارد کنید"
              class="w-full"
            />
          </div>
          <div>
            <label class="block text-sm font-medium mb-2">نام خانوادگی</label>
            <InputText
              v-model="editForm.lastName"
              placeholder="نام خانوادگی خود را وارد کنید"
              class="w-full"
            />
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium mb-2">نام نمایشی</label>
            <InputText
              v-model="editForm.displayName"
              placeholder="نام نمایشی خود را وارد کنید"
              class="w-full"
            />
          </div>
          <div>
            <label class="block text-sm font-medium mb-2">شماره تلفن</label>
            <InputText
              v-model="editForm.phoneNumber"
              placeholder="شماره تلفن خود را وارد کنید"
              class="w-full"
            />
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium mb-2">درباره من</label>
          <Textarea
            v-model="editForm.bio"
            placeholder="توضیحاتی درباره خود بنویسید"
            class="w-full"
            rows="3"
          />
        </div>

        <div>
          <label class="block text-sm font-medium mb-2">آواتار</label>
          <FileUpload
            mode="basic"
            name="avatar"
            accept="image/*"
            :maxFileSize="1000000"
            @upload="onAvatarUpload"
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
        <div>
          <label class="block text-sm font-medium mb-2">رمز عبور فعلی</label>
          <Password
            v-model="passwordForm.currentPassword"
            placeholder="رمز عبور فعلی را وارد کنید"
            class="w-full"
            :feedback="false"
            toggleMask
          />
        </div>

        <div>
          <label class="block text-sm font-medium mb-2">رمز عبور جدید</label>
          <Password
            v-model="passwordForm.newPassword"
            placeholder="رمز عبور جدید را وارد کنید"
            class="w-full"
            :feedback="false"
            toggleMask
          />
        </div>

        <div>
          <label class="block text-sm font-medium mb-2">تکرار رمز عبور جدید</label>
          <Password
            v-model="passwordForm.confirmPassword"
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
import { ref, onMounted } from 'vue'
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
const notificationCount = ref('0')

const editProfileDialog = ref(false)
const changePasswordDialog = ref(false)
const saving = ref(false)

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
  phone: '',
  avatar: null
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
  try {
    const data = await authStore.getProfile()
    user.value = data
    editForm.value = {
      firstName: data.firstName || '',
      lastName: data.lastName || '',
      phone: data.phone || '',
      avatar: data.avatar || null
    }
  } catch (error) {
    console.error('Error loading user profile:', error)
  }
}

const formatDate = (date) => {
  if (!date) return 'نامشخص'
  return new Date(date).toLocaleDateString('fa-IR')
}

const editProfile = () => {
  editProfileDialog.value = true
}

const changePassword = () => {
  changePasswordDialog.value = true
}

const saveProfile = async () => {
  saving.value = true
  try {
    // Only send fields that have changed
    const updateData = {
      firstName: editForm.value.firstName,
      lastName: editForm.value.lastName,
      displayName: editForm.value.displayName,
      phoneNumber: editForm.value.phoneNumber,
      bio: editForm.value.bio
    }

    // Remove undefined/null values
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === null || updateData[key] === undefined || updateData[key] === '') {
        delete updateData[key]
      }
    })

    await authStore.updateProfile(updateData)
    await loadUserProfile()
    editProfileDialog.value = false
  } catch (error) {
    console.error('Error updating profile:', error)
  } finally {
    saving.value = false
  }
}

const saveNewPassword = async () => {
  saving.value = true
  try {
    await authStore.changePassword(passwordForm.value)
    passwordForm.value = {
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    }
    changePasswordDialog.value = false
  } catch (error) {
    console.error('Error changing password:', error)
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
      console.error('Error uploading avatar:', error)
    }
  }
}

const goToNotifications = () => {
  router.push({ name: 'notifications' })
}

const goToAddresses = () => {
  router.push('/profile/addresses')
}

const goToTransactions = () => {
  router.push('/profile/transactions')
}

const logout = async () => {
  await authStore.logout()
  router.push({ name: 'login' })
}
</script>

<style scoped>
.user-profile-page {
  direction: rtl;
}

.order-item {
  transition: all 0.2s ease;
}

.order-item:hover {
  background-color: #f8f9fa;
}
</style>