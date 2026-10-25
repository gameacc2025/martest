<script setup>
import { ref, onMounted } from 'vue'
import { apiGet, apiPatch, apiDelete } from '@telecom/shared-core/http/apiClient'
import { endpoints } from '@telecom/api-client'

const notifications = ref([])
const unreadCount = ref(0)
const loading = ref(false)
const errorMessage = ref('')
const page = ref(1)
const limit = ref(20)
const total = ref(0)
const totalPages = ref(1)
const busyIds = ref(new Set())

onMounted(load)

async function load() {
  loading.value = true
  errorMessage.value = ''
  try {
    const result = await apiGet(`${endpoints.notifications.list}?page=${page.value}&limit=${limit.value}`)
    notifications.value = Array.isArray(result?.data) ? result.data : (Array.isArray(result?.data?.data) ? result.data.data : [])
    const meta = result?.meta || result?.data?.meta || {}
    total.value = Number(meta.total || notifications.value.length)
    totalPages.value = Math.max(1, Number(meta.totalPages || 1))
    const count = await apiGet(endpoints.notifications.unreadCount)
    unreadCount.value = Number(count?.count ?? count?.data?.count ?? 0)
  } catch {
    errorMessage.value = 'دریافت اعلان‌ها با خطا مواجه شد. دوباره تلاش کنید.'
  } finally {
    loading.value = false
  }
}

async function markAsRead(item) {
  if (item.isRead) return
  busyIds.value = new Set([...busyIds.value, item.id])
  try {
    await apiPatch(endpoints.notifications.read(item.id))
    item.isRead = true
    unreadCount.value = Math.max(0, unreadCount.value - 1)
  } catch {
    errorMessage.value = 'به‌روزرسانی وضعیت اعلان انجام نشد.'
  } finally {
    const next = new Set(busyIds.value)
    next.delete(item.id)
    busyIds.value = next
  }
}

async function markAllAsRead() {
  try {
    await apiPatch(endpoints.notifications.readAll)
    notifications.value = notifications.value.map(item => ({ ...item, isRead: true }))
    unreadCount.value = 0
  } catch {
    errorMessage.value = 'علامت‌گذاری اعلان‌ها انجام نشد.'
  }
}

async function removeNotification(item) {
  try {
    await apiDelete(endpoints.notifications.remove(item.id))
    notifications.value = notifications.value.filter(row => row.id !== item.id)
    total.value = Math.max(0, total.value - 1)
    if (!item.isRead) unreadCount.value = Math.max(0, unreadCount.value - 1)
  } catch {
    errorMessage.value = 'حذف اعلان انجام نشد.'
  }
}

function formatDate(value) {
  if (!value) return '—'
  return new Date(value).toLocaleString('fa-IR')
}
</script>

<template>
  <section class="ds-container ds-page notification-page" dir="rtl">
    <header class="page-heading">
      <div>
        <p class="eyebrow">حساب کاربری</p>
        <h1>اعلان‌های من</h1>
        <p class="muted">اعلان‌های مربوط به حساب و فعالیت‌های شما</p>
      </div>
      <div class="heading-actions">
        <span class="count">{{ unreadCount }} خوانده‌نشده</span>
        <button v-if="unreadCount" class="button button-secondary" :disabled="loading" @click="markAllAsRead">خواندن همه</button>
        <router-link class="button button-primary" to="/notification-preferences">تنظیمات اعلان</router-link>
      </div>
    </header>

    <p v-if="errorMessage" class="message message-error" role="alert">{{ errorMessage }}</p>
    <div v-if="loading" class="state">در حال دریافت اعلان‌ها…</div>
    <div v-else-if="!notifications.length" class="state empty">
      <i class="pi pi-bell-slash" aria-hidden="true"></i>
      <h2>هنوز اعلانی ندارید</h2>
      <p>اعلان‌های مربوط به حساب شما در این قسمت نمایش داده می‌شوند.</p>
    </div>
    <div v-else class="notification-list">
      <article v-for="item in notifications" :key="item.id" class="notification-card" :class="{ unread: !item.isRead }">
        <span class="notification-icon"><i class="pi pi-bell" aria-hidden="true"></i></span>
        <div class="notification-body">
          <div class="notification-title-row">
            <h2>{{ item.title }}</h2>
            <span v-if="!item.isRead" class="new-badge">جدید</span>
          </div>
          <p>{{ item.message }}</p>
          <time :datetime="item.createdAt">{{ formatDate(item.createdAt) }}</time>
        </div>
        <div class="notification-actions">
          <button v-if="!item.isRead" class="icon-button" :disabled="busyIds.has(item.id)" aria-label="علامت‌گذاری به‌عنوان خوانده‌شده" @click="markAsRead(item)"><i class="pi pi-check"></i></button>
          <button class="icon-button danger" aria-label="حذف اعلان" @click="removeNotification(item)"><i class="pi pi-trash"></i></button>
        </div>
      </article>
    </div>
    <footer v-if="totalPages > 1" class="pagination">
      <button class="button button-secondary" :disabled="page <= 1 || loading" @click="page--; load()">قبلی</button>
      <span>صفحه {{ page }} از {{ totalPages }} · {{ total }} اعلان</span>
      <button class="button button-secondary" :disabled="page >= totalPages || loading" @click="page++; load()">بعدی</button>
    </footer>
  </section>
</template>

<style scoped>
.notification-page{direction:rtl}.page-heading{display:flex;justify-content:space-between;align-items:center;gap:1rem;margin-bottom:1.5rem;flex-wrap:wrap}.page-heading h1{margin:.2rem 0;font-size:1.6rem;font-weight:800}.eyebrow{margin:0;color:var(--primary-color);font-size:.85rem}.muted,time{color:var(--text-color-secondary);font-size:.85rem}.heading-actions,.notification-title-row,.notification-actions,.pagination{display:flex;align-items:center;gap:.6rem;flex-wrap:wrap}.count,.new-badge{border-radius:999px;padding:.3rem .65rem;background:color-mix(in srgb,var(--primary-color) 12%,var(--surface-card));color:var(--primary-color);font-size:.8rem}.button{display:inline-flex;align-items:center;justify-content:center;border:1px solid transparent;border-radius:8px;padding:.65rem .9rem;font:inherit;text-decoration:none;cursor:pointer}.button:disabled,.icon-button:disabled{opacity:.5;cursor:not-allowed}.button-primary{background:var(--primary-color);color:#fff}.button-secondary{background:var(--surface-card);border-color:var(--surface-border);color:var(--text-color)}.state{padding:3rem 1rem;text-align:center;color:var(--text-color-secondary)}.empty i{font-size:2rem}.empty h2{color:var(--text-color);font-size:1.1rem}.notification-list{display:grid;gap:.75rem}.notification-card{display:flex;align-items:flex-start;gap:1rem;padding:1rem;border:1px solid var(--surface-border);border-radius:12px;background:var(--surface-card)}.notification-card.unread{border-color:var(--primary-color);background:color-mix(in srgb,var(--primary-color) 4%,var(--surface-card))}.notification-icon{width:2.5rem;height:2.5rem;display:grid;place-items:center;flex:none;border-radius:50%;background:var(--surface-ground);color:var(--primary-color)}.notification-body{flex:1;min-width:0}.notification-title-row{justify-content:space-between}.notification-body h2{margin:0;font-size:1rem;font-weight:700}.notification-body p{margin:.45rem 0;line-height:1.8;overflow-wrap:anywhere}.notification-actions{align-self:center}.icon-button{border:0;background:transparent;color:var(--text-color-secondary);padding:.5rem;border-radius:8px;cursor:pointer}.icon-button:hover{background:var(--surface-hover)}.icon-button.danger:hover{color:var(--red-500)}.pagination{justify-content:center;margin-top:1.5rem}.message-error{padding:.75rem 1rem;border-radius:8px;background:var(--red-50);color:var(--red-700);margin-bottom:1rem}@media(max-width:640px){.page-heading{align-items:flex-start}.notification-card{gap:.65rem;padding:.75rem}.notification-actions{flex-direction:column}}
</style>
