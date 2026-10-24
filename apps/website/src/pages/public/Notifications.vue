<template>
  <div class="notifications-page">
    <div class="ds-container ds-page">
      <div class="mb-6">
        <h1 class="text-2xl font-bold">اعلان ها</h1>
        <Breadcrumb :home="home" :model="items" class="mt-2" />
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <!-- Sidebar -->
        <div class="lg:col-span-1">
          <Card>
            <template #title>فیلتر اعلان ها</template>
            <template #content>
              <div class="space-y-4">
                <div>
                  <h3 class="font-semibold mb-2">نوع اعلان</h3>
                  <SelectButton
                    v-model="typeFilter"
                    :options="typeOptions"
                    optionLabel="label"
                    optionValue="value"
                    multiple
                    class="w-full"
                  />
                </div>

                <div>
                  <h3 class="font-semibold mb-2">وضعیت</h3>
                  <SelectButton
                    v-model="statusFilter"
                    :options="statusOptions"
                    optionLabel="label"
                    optionValue="value"
                    class="w-full"
                  />
                </div>

                <Button
                  label="اعمال فیلترها"
                  icon="pi pi-check"
                  class="w-full p-button-primary"
                  @click="applyFilters"
                />
                <Button
                  label="حذف فیلترها"
                  icon="pi pi-times"
                  class="w-full p-button-outlined p-button-secondary mt-2"
                  @click="clearFilters"
                />
              </div>
            </template>
          </Card>

          <Card class="mt-4">
            <template #title>عملیات گروهی</template>
            <template #content>
              <div class="space-y-2">
                <Button
                  label="علامت گذاری همه به عنوان خوانده شده"
                  icon="pi pi-envelope-open"
                  class="w-full p-button-outlined"
                  @click="markAllAsRead"
                />
                <Button
                  label="حذف همه اعلان ها"
                  icon="pi pi-trash"
                  class="w-full p-button-outlined p-button-danger"
                  @click="deleteAllNotifications"
                />
              </div>
            </template>
          </Card>
        </div>

        <!-- Notifications List -->
        <div class="lg:col-span-3">
          <div class="flex justify-between items-center mb-4">
            <div class="text-gray-600">
              {{ totalNotifications }} اعلان یافت شد
            </div>
            <div class="flex gap-2">
              <Select
                v-model="sortOption"
                :options="sortOptions"
                optionLabel="label"
                optionValue="value"
                class="w-full md:w-14rem"
                @change="onSortChange"
              />
            </div>
          </div>

          <div v-if="loading" class="text-center py-8">
            <ProgressSpinner />
            <p class="mt-4">در حال بارگذاری...</p>
          </div>

          <div v-else-if="notifications.length === 0" class="text-center py-8">
            <i class="pi pi-bell text-4xl text-gray-400 mb-4"></i>
            <h3 class="text-xl font-semibold mb-2">هیچ اعلانی یافت نشد</h3>
            <p class="text-gray-500">شما هیچ اعلانی ندارید</p>
          </div>

              <div v-else class="space-y-4">
                <Card
                  v-for="notification in notifications"
                  :key="notification.id"
                  class="notification-card"
                  :class="{ 'bg-blue-50 border-blue-200': !notification.read }"
                >
              <template #content>
                <div class="flex gap-3">
                  <div class="flex-shrink-0">
                    <i
                      :class="[getNotificationIcon(notification.type), {
                        'text-blue-500': notification.type === 'info',
                        'text-green-500': notification.type === 'success',
                        'text-yellow-500': notification.type === 'warning',
                        'text-red-500': notification.type === 'error'
                      }]"
                      class="text-2xl"
                    ></i>
                  </div>
                  <div class="flex-1">
                    <div class="flex justify-between items-start">
                      <div>
                        <h3 class="font-semibold">{{ notification.title }}</h3>
                        <p class="text-sm text-gray-500 mt-1">
                          {{ formatDate(notification.createdAt) }}
                        </p>
                      </div>
                      <span
                        v-if="!notification.read"
                        class="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-medium"
                      >
                        جدید
                      </span>
                    </div>
                    <p class="mt-2 text-gray-600">{{ notification.message }}</p>
                    <div class="mt-3 flex gap-2">
                      <Button
                        v-if="notification.actionUrl"
                        label="مشاهده"
                        icon="pi pi-eye"
                        class="p-button-text p-button-sm"
                        @click="viewNotification(notification)"
                      />
                      <Button
                        label="حذف"
                        icon="pi pi-trash"
                        class="p-button-text p-button-danger p-button-sm"
                        @click="deleteNotification(notification.id)"
                      />
                    </div>
                  </div>
                </div>
              </template>
            </Card>
          </div>

          <div class="mt-8">
            <Paginator
              :rows="perPage"
              :totalRecords="totalNotifications"
              :rowsPerPageOptions="[10, 20, 50, 100]"
              @page="onPageChange"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth'
import Breadcrumb from 'primevue/breadcrumb'
import Button from 'primevue/button'
import Card from 'primevue/card'
import SelectButton from 'primevue/selectbutton'
import Select from 'primevue/select'
import ProgressSpinner from 'primevue/progressspinner'
import Paginator from 'primevue/paginator'

const router = useRouter()
const authStore = useAuthStore()

const notifications = ref([])
const loading = ref(false)
const totalNotifications = ref(0)
const perPage = ref(10)
const currentPage = ref(1)

const typeFilter = ref([])
const statusFilter = ref('all')
const sortOption = ref('date_desc')

const home = ref({
  icon: 'pi pi-home',
  to: '/'
})

const items = ref([
  { label: 'اعلان ها', to: '/notifications' }
])

const typeOptions = ref([
  { label: 'همه', value: '' },
  { label: 'اطلاع رسانی', value: 'info' },
  { label: 'موفقیت', value: 'success' },
  { label: 'هشدار', value: 'warning' },
  { label: 'خطا', value: 'error' },
  { label: 'سفارش', value: 'order' },
  { label: 'پرداخت', value: 'payment' },
  { label: 'تخفیف', value: 'promotion' }
])

const statusOptions = ref([
  { label: 'همه', value: 'all' },
  { label: 'خوانده نشده', value: 'unread' },
  { label: 'خوانده شده', value: 'read' }
])

const sortOptions = ref([
  { label: 'تاریخ: جدیدترین', value: 'date_desc' },
  { label: 'تاریخ: قدیمی ترین', value: 'date_asc' },
  { label: 'نوع: A به Z', value: 'type_asc' },
  { label: 'نوع: Z به A', value: 'type_desc' }
])

onMounted(async () => {
  await loadNotifications()
})

const loadNotifications = async () => {
  loading.value = true
  try {
    const params = {
      page: currentPage.value,
      limit: perPage.value,
      types: typeFilter.value.length > 0 ? typeFilter.value.join(',') : undefined,
      status: statusFilter.value === 'all' ? undefined : statusFilter.value,
      sortBy: getSortField(),
      sortOrder: getSortOrder()
    }

    const data = await authStore.getNotifications(params)
    notifications.value = data.notifications
    totalNotifications.value = data.total
  } catch (error) {
    console.error('Error loading notifications:', error)
  } finally {
    loading.value = false
  }
}

const applyFilters = () => {
  currentPage.value = 1
  loadNotifications()
}

const clearFilters = () => {
  typeFilter.value = []
  statusFilter.value = 'all'
  sortOption.value = 'date_desc'
  currentPage.value = 1
  loadNotifications()
}

const onSortChange = () => {
  loadNotifications()
}

const onPageChange = (event) => {
  currentPage.value = event.page + 1
  perPage.value = event.rows
  loadNotifications()
}

const getSortField = () => {
  const [field] = sortOption.value.split('_')
  return field === 'date' ? 'createdAt' : field
}

const getSortOrder = () => {
  const [, order] = sortOption.value.split('_')
  return order
}

const formatDate = (date) => {
  if (!date) return 'نامشخص'
  return new Date(date).toLocaleDateString('fa-IR', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

const getNotificationIcon = (type) => {
  const iconMap = {
    info: 'pi pi-info-circle',
    success: 'pi pi-check-circle',
    warning: 'pi pi-exclamation-triangle',
    error: 'pi pi-exclamation-circle',
    order: 'pi pi-shopping-bag',
    payment: 'pi pi-credit-card',
    promotion: 'pi pi-gift'
  }
  return iconMap[type] || 'pi pi-bell'
}

const viewNotification = (notification) => {
  if (notification.actionUrl) {
    router.push(notification.actionUrl)
  }
  // Mark as read
  markAsRead(notification.id)
}

const markAsRead = async (notificationId) => {
  try {
    await authStore.markNotificationAsRead(notificationId)
    const notification = notifications.value.find(n => n.id === notificationId)
    if (notification) {
      notification.read = true
    }
  } catch (error) {
    console.error('Error marking notification as read:', error)
  }
}

const markAllAsRead = async () => {
  try {
    await authStore.markAllNotificationsAsRead()
    notifications.value.forEach(n => n.read = true)
  } catch (error) {
    console.error('Error marking all notifications as read:', error)
  }
}

const deleteNotification = async (notificationId) => {
  try {
    await authStore.deleteNotification(notificationId)
    notifications.value = notifications.value.filter(n => n.id !== notificationId)
    totalNotifications.value--
  } catch (error) {
    console.error('Error deleting notification:', error)
  }
}

const deleteAllNotifications = async () => {
  try {
    await authStore.deleteAllNotifications()
    notifications.value = []
    totalNotifications.value = 0
  } catch (error) {
    console.error('Error deleting all notifications:', error)
  }
}
</script>

<style scoped>
.notifications-page {
  direction: rtl;
}

.notification-card {
  transition: all 0.2s ease;
  border-left: 4px solid transparent;
}

.notification-card:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.notification-card:not(.bg-blue-50) {
  border-left-color: #e5e7eb;
}

.notification-card.bg-blue-50 {
  border-left-color: #3b82f6;
}
</style>