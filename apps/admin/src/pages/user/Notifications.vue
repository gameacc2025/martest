<script setup>
import { ref, onMounted } from 'vue'
import { useToast } from 'primevue/usetoast'
import { apiGet, apiPatch, apiDelete } from '@telecom/shared-core/http/apiClient'
import { endpoints } from '@telecom/api-client'
import Button from 'primevue/button'
import Card from 'primevue/card'
import ProgressSpinner from 'primevue/progressspinner'

const toast = useToast()

const notifications = ref([])
const unreadCount = ref(0)
const loading = ref(false)
const page = ref(1)
const totalPages = ref(1)

onMounted(() => {
  fetchNotifications()
  fetchUnreadCount()
})

async function fetchNotifications() {
  loading.value = true
  try {
    const result = await apiGet(`${endpoints.settings.notifications}?page=${page.value}&limit=20`)
    notifications.value = result.data || []
    totalPages.value = result.meta?.totalPages || 1
  } catch (err) {
    toast.add({ severity: 'error', summary: 'خطا', detail: 'خطا در دریافت اعلان‌ها', life: 3000 })
  } finally {
    loading.value = false
  }
}

async function fetchUnreadCount() {
  try {
    const result = await apiGet(`${endpoints.settings.notifications}/unread-count`)
    unreadCount.value = result.count || 0
  } catch (err) {
    console.error('Error fetching unread count:', err)
  }
}

async function markAsRead(notification) {
  try {
    await apiPatch(`${endpoints.settings.notifications}/${notification.id}/read`)
    notification.isRead = true
    unreadCount.value = Math.max(0, unreadCount.value - 1)
  } catch (err) {
    toast.add({ severity: 'error', summary: 'خطا', detail: 'خطا در بروزرسانی اعلان', life: 3000 })
  }
}

async function markAllAsRead() {
  try {
    await apiPatch(`${endpoints.settings.notifications}/read-all`)
    notifications.value.forEach(n => n.isRead = true)
    unreadCount.value = 0
    toast.add({ severity: 'success', summary: 'موفقیت', detail: 'همه اعلان‌ها خوانده شد', life: 3000 })
  } catch (err) {
    toast.add({ severity: 'error', summary: 'خطا', detail: 'خطا در بروزرسانی اعلان‌ها', life: 3000 })
  }
}

async function deleteNotification(notification) {
  try {
    await apiDelete(`${endpoints.settings.notifications}/${notification.id}`)
    notifications.value = notifications.value.filter(n => n.id !== notification.id)
    if (!notification.isRead) unreadCount.value = Math.max(0, unreadCount.value - 1)
    toast.add({ severity: 'success', summary: 'موفقیت', detail: 'اعلان حذف شد', life: 3000 })
  } catch (err) {
    toast.add({ severity: 'error', summary: 'خطا', detail: 'خطا در حذف اعلان', life: 3000 })
  }
}

function formatTime(date) {
  return new Date(date).toLocaleString('fa-IR')
}
</script>

<template>
  <div class="notifications-page">
    <div class="page-header">
      <h1>اعلان‌ها</h1>
      <div class="page-header-actions">
        <router-link to="/notification-management" class="management-link"><i class="pi pi-send"></i> ارسال و مدیریت اعلان‌ها</router-link>
        <span v-if="unreadCount > 0" class="unread-badge">{{ unreadCount }} خوانده نشده</span>
        <Button v-if="unreadCount > 0" label="همه خوانده شد" icon="pi pi-check" @click="markAllAsRead" />
      </div>
    </div>

    <div v-if="loading" class="text-center py-8">
      <ProgressSpinner />
    </div>

    <div v-else-if="notifications.length === 0" class="empty-state">
      <i class="pi pi-bell-slash text-4xl"></i>
      <p>اعلانی وجود ندارد</p>
    </div>

    <div v-else class="notifications-list">
      <div v-for="notification in notifications" :key="notification.id"
        class="notification-item" :class="{ unread: !notification.isRead }">
        <div class="notification-icon">
          <i class="pi pi-bell"></i>
        </div>
        <div class="notification-content">
          <h4>{{ notification.title }}</h4>
          <p>{{ notification.message }}</p>
          <span class="notification-time">{{ formatTime(notification.createdAt) }}</span>
        </div>
        <div class="notification-actions">
          <Button v-if="!notification.isRead" icon="pi pi-check" severity="success" rounded text
            v-tooltip.top="'خوانده شد'" @click="markAsRead(notification)" />
          <Button icon="pi pi-trash" severity="danger" rounded text
            v-tooltip.top="'حذف'" @click="deleteNotification(notification)" />
        </div>
      </div>
    </div>

    <div v-if="totalPages > 1" class="pagination mt-4">
      <Button label="قبلی" icon="pi pi-arrow-right" :disabled="page <= 1" @click="page--; fetchNotifications()" />
      <span>صفحه {{ page }} از {{ totalPages }}</span>
      <Button label="بعدی" icon="pi pi-arrow-left" :disabled="page >= totalPages" @click="page++; fetchNotifications()" />
    </div>
  </div>
</template>

<style scoped>
.notifications-page {
  direction: rtl;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
}

.page-header h1 {
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0;
}

.management-link { color: var(--primary-color); text-decoration: none; font-size: .9rem; }

.page-header-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.unread-badge {
  background: var(--primary-color);
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  font-size: 0.8rem;
  font-weight: 600;
}

.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  color: var(--text-color-secondary);
}

.empty-state i {
  margin-bottom: 1rem;
  opacity: 0.3;
}

.notifications-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.notification-item {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1rem;
  background: var(--surface-card);
  border: 1px solid var(--surface-border);
  border-radius: var(--content-border-radius);
  transition: background 0.2s;
}

.notification-item.unread {
  background: color-mix(in srgb, var(--primary-color) 5%, var(--surface-card));
  border-color: var(--primary-color);
}

.notification-icon {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;
  background: var(--surface-hover);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.notification-icon i {
  color: var(--primary-color);
}

.notification-content {
  flex: 1;
  min-width: 0;
}

.notification-content h4 {
  margin: 0 0 0.25rem;
  font-size: 0.95rem;
  font-weight: 600;
}

.notification-content p {
  margin: 0 0 0.25rem;
  font-size: 0.85rem;
  color: var(--text-color-secondary);
}

.notification-time {
  font-size: 0.75rem;
  color: var(--text-color-secondary);
}

.notification-actions {
  display: flex;
  gap: 0.25rem;
  flex-shrink: 0;
}

.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
}
</style>
