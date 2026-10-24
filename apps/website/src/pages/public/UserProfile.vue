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
                  label="سفارشات من"
                  icon="pi pi-shopping-bag"
                  class="w-full p-button-text justify-start"
                  @click="goToOrders"
                />
                <Button
                  label="لیست علاقه مندی ها"
                  icon="pi pi-heart"
                  class="w-full p-button-text justify-start"
                  @click="goToWishlist"
                />
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

                <div>
                  <h3 class="font-semibold mb-4">آمار کاربر</h3>
                  <div class="space-y-3">
                    <div class="flex justify-between">
                      <span class="text-gray-500">تعداد سفارشات:</span>
                      <span>{{ userStats.orderCount || 0 }}</span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-gray-500">مبلغ کل سفارشات:</span>
                      <span>{{ formatPrice(userStats.totalSpent || 0) }}</span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-gray-500">تعداد نظرات:</span>
                      <span>{{ userStats.reviewCount || 0 }}</span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-gray-500">امتیاز کلی:</span>
                      <Rating :modelValue="userStats.averageRating || 0" :cancel="false" readonly />
                    </div>
                  </div>
                </div>
              </div>
            </template>
          </Card>

          <!-- Recent Orders -->
          <Card class="mt-4">
            <template #title>آخرین سفارشات</template>
            <template #content>
              <div v-if="recentOrders.length === 0" class="text-center py-4 text-gray-500">
                سفارشی یافت نشد
              </div>
              <div v-else class="space-y-4">
                <div
                  v-for="order in recentOrders"
                  :key="order.id"
                  class="order-item p-4 border rounded-lg"
                >
                  <div class="flex justify-between items-start">
                    <div>
                      <h4 class="font-semibold">سفارش #{{ order.orderNumber }}</h4>
                      <p class="text-sm text-gray-500">{{ formatDate(order.createdAt) }}</p>
                      <p class="text-sm mt-1">
                        <span :class="getOrderStatusClass(order.status)">
                          {{ getOrderStatusText(order.status) }}
                        </span>
                      </p>
                    </div>
                    <div class="text-right">
                      <p class="font-semibold">{{ formatPrice(order.total) }}</p>
                      <p class="text-sm text-gray-500">{{ order.items ? order.items.length : 0 }} محصول</p>
                    </div>
                  </div>
                  <div class="mt-2">
                    <Button
                      label="مشاهده جزئیات"
                      icon="pi pi-eye"
                      class="p-button-text p-button-sm"
                      @click="viewOrder(order.id)"
                    />
                  </div>
                </div>
              </div>
            </template>
            <template #footer>
              <Button
                label="مشاهده همه سفارشات"
                icon="pi pi-list"
                class="p-button-outlined"
                @click="goToOrders"
              />
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
import { useOrderStore } from '../../stores/orders'
import Breadcrumb from 'primevue/breadcrumb'
import Button from 'primevue/button'
import Card from 'primevue/card'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import Password from 'primevue/password'
import Rating from 'primevue/rating'
import FileUpload from 'primevue/fileupload'

const router = useRouter()
const authStore = useAuthStore()
const orderStore = useOrderStore()

const user = ref({})
const userStats = ref({})
const recentOrders = ref([])
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
  await loadUserStats()
  await loadRecentOrders()
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

const loadUserStats = async () => {
  try {
    const data = await orderStore.getUserStats()
    userStats.value = data
  } catch (error) {
    console.error('Error loading user stats:', error)
  }
}

const loadRecentOrders = async () => {
  try {
    const data = await orderStore.getRecentOrders(5)
    recentOrders.value = data
  } catch (error) {
    console.error('Error loading recent orders:', error)
  }
}

const formatPrice = (price) => {
  return new Intl.NumberFormat('fa-IR', {
    style: 'currency',
    currency: 'IRR'
  }).format(price)
}

const formatDate = (date) => {
  if (!date) return 'نامشخص'
  return new Date(date).toLocaleDateString('fa-IR')
}

const getOrderStatusText = (status) => {
  const statusMap = {
    pending: 'در انتظار پردازش',
    processing: 'در حال پردازش',
    shipped: 'ارسال شده',
    delivered: 'تحویل داده شده',
    cancelled: 'لغو شده',
    refunded: 'مرجوع شده'
  }
  return statusMap[status] || status
}

const getOrderStatusClass = (status) => {
  const statusClass = {
    pending: 'text-yellow-600',
    processing: 'text-blue-600',
    shipped: 'text-purple-600',
    delivered: 'text-green-600',
    cancelled: 'text-red-600',
    refunded: 'text-orange-600'
  }
  return statusClass[status] || 'text-gray-600'
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

const goToOrders = () => {
  router.push({ name: 'orders' })
}

const goToWishlist = () => {
  router.push({ name: 'wishlist' })
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

const viewOrder = (orderId) => {
  router.push({ name: 'order-details', params: { id: orderId } })
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