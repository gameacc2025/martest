<script setup>
import { ref, computed, onMounted } from 'vue'
import { useToast } from 'primevue/usetoast'
import { apiGet, apiGetPaginated, apiPatch, apiDelete, apiPost } from '@telecom/shared-core/http/apiClient'
import { endpoints } from '@telecom/api-client'
import { normalizeFixedNotificationFolders, notificationFolderLabel } from '@telecom/shared-ui/utils/notificationFolders'
import Button from 'primevue/button'
import ProgressSpinner from 'primevue/progressspinner'

const toast = useToast()
const notifications = ref([])
const unreadCount = ref(0)
const loading = ref(false)
const page = ref(1)
const totalPages = ref(1)
const total = ref(0)
const folderCounts = ref({ all: 0, read: 0, unread: 0 })
const selectedId = ref(null)
const activeFolder = ref('all')
const activeCategory = ref('all')
const searchQuery = ref('')
const busyIds = ref(new Set())
const selectedIds = ref(new Set())
const bulkBusy = ref(false)
const userFolders = ref([])
const targetFolderId = ref(null)
const folders = computed(() => [
  { id: 'all', label: 'همه پیام‌ها', icon: 'pi-inbox', count: folderCounts.value.all },
  { id: 'unread', label: 'خوانده‌نشده', icon: 'pi-envelope', count: unreadCount.value },
  { id: 'read', label: 'خوانده‌شده', icon: 'pi-check-circle', count: folderCounts.value.read },
  ...userFolders.value.map(folder => ({
    id: folder.id,
    label: notificationFolderLabel(folder),
    icon: folder.key === 'SAVED' ? 'pi-bookmark' : folder.key === 'INBOX' ? 'pi-inbox' : 'pi-folder',
    count: folderCounts.value[folder.id] ?? 0,
  })),
])

const categoryDefinitions = [
  { id: 'product', label: 'محصولات', icon: 'pi-box', matches: type => type.startsWith('PRODUCT_') },
  { id: 'inquiry', label: 'استعلام‌ها', icon: 'pi-file-edit', matches: type => type.startsWith('INQUIRY_') },
  { id: 'company', label: 'شرکت و عضویت', icon: 'pi-building', matches: type => type.startsWith('COMPANY_') },
  { id: 'account', label: 'حساب کاربری', icon: 'pi-user', matches: type => /^(USER_|ACCOUNT_|AUTH_)/.test(type) },
  { id: 'system', label: 'اطلاعیه‌ها', icon: 'pi-megaphone', matches: type => /^(ANNOUNCEMENT_|SYSTEM_)/.test(type) },
  { id: 'other', label: 'سایر پیام‌ها', icon: 'pi-bell', matches: type => !type || !['PRODUCT_', 'INQUIRY_', 'COMPANY_', 'USER_', 'ACCOUNT_', 'AUTH_', 'ANNOUNCEMENT_', 'SYSTEM_'].some(prefix => type.startsWith(prefix)) },
]

function normalizeNotificationPage(result) {
  const data = Array.isArray(result) ? result
    : Array.isArray(result?.data) ? result.data
      : Array.isArray(result?.data?.data) ? result.data.data
        : Array.isArray(result?.notifications) ? result.notifications : []
  const meta = result?.meta || result?.data?.meta || result?.pagination || {}
  return { data, meta }
}

function categoryFor(item) {
  const type = String(item?.type || '').toUpperCase()
  if (type === 'ADMIN_ANNOUNCEMENT' || type.startsWith('ANNOUNCEMENT_') || type.startsWith('SYSTEM_')) return 'system'
  if (type) {
    const typedCategory = categoryDefinitions.find(category => category.id !== 'other' && category.matches(type))
    if (typedCategory) return typedCategory.id
    return 'other'
  }

  // Legacy notifications may have a null type. Classify those from their
  // human-readable title/message so they do not all fall into "Other".
  const text = `${item?.title || ''} ${item?.message || ''}`.toLocaleLowerCase()
  if (/محصول|product|مودم|سوئیچ شبکه/.test(text)) return 'product'
  if (/استعلام|inquiry|مهلت پاسخ|پاسخ جدید/.test(text)) return 'inquiry'
  if (/شرکت|عضویت|ثبت شرکت/.test(text)) return 'company'
  if (/حساب کاربری|خوش آمدید|رمز عبور|ورود|account|welcome/.test(text)) return 'account'
  if (/اطلاعیه|announcement|system/.test(text)) return 'system'
  return 'other'
}

const categoryFolders = computed(() => categoryDefinitions
  .map(category => ({
    ...category,
    count: notifications.value.filter(item => categoryFor(item) === category.id).length,
  }))
  .filter(category => category.count > 0))

const visibleNotifications = computed(() => {
  const query = searchQuery.value.trim().toLocaleLowerCase()
  return notifications.value.filter(item => {
    if (activeFolder.value === 'unread' && item.isRead) return false
    if (activeFolder.value === 'read' && !item.isRead) return false
    if (Number.isInteger(Number(activeFolder.value))) {
      const folderId = Number(activeFolder.value)
      const memberships = (item.folderMemberships || []).map(m => Number(m.folderId ?? m.folder?.id))
      if (!memberships.includes(folderId)) return false
    }
    if (activeCategory.value !== 'all' && categoryFor(item) !== activeCategory.value) return false
    if (query && ![item.title, item.message, item.type].some(value => String(value || '').toLocaleLowerCase().includes(query))) return false
    return true
  })
})

const selectedNotification = computed(() =>
  visibleNotifications.value.find(item => item.id === selectedId.value) || null
)
const allVisibleSelected = computed(() =>
  visibleNotifications.value.length > 0 && visibleNotifications.value.every(item => selectedIds.value.has(item.id))
)
const hasSelectedNotifications = computed(() => selectedIds.value.size > 0)

const activeCategoryLabel = computed(() => {
  if (activeCategory.value === 'all') return 'همه دسته‌ها'
  return categoryDefinitions.find(item => item.id === activeCategory.value)?.label || 'سایر پیام‌ها'
})

onMounted(async () => {
  // Load server-managed folders before displaying messages.
  await fetchUserFolders()
  // Load independent folder totals and the global unread count.
  await fetchNotifications()
  await fetchUnreadCount()
})

async function fetchUserFolders() {
  try {
    const result = await apiGet(endpoints.notifications.folders())
    userFolders.value = normalizeFixedNotificationFolders(result)
    const saved = userFolders.value.find(folder => folder.key === 'SAVED')
    targetFolderId.value = saved?.id ?? null
  } catch {
    toast.add({ severity: 'error', summary: 'خطا', detail: 'دریافت پوشه‌ها انجام نشد.', life: 3000 })
  }
}

async function fetchNotifications() {
  loading.value = true
  try {
    const params = new URLSearchParams({ page: String(page.value), limit: '20' })
    if (Number.isInteger(Number(activeFolder.value))) params.set('folderId', String(Number(activeFolder.value)))
    if (activeFolder.value === 'unread') params.set('unreadOnly', 'true')
    if (activeFolder.value === 'read') params.set('readOnly', 'true')
    const result = await apiGetPaginated(`${endpoints.notifications.list}?${params.toString()}`)
    const normalized = normalizeNotificationPage(result)
    notifications.value = normalized.data
    total.value = Number(normalized.meta?.total ?? notifications.value.length)
    totalPages.value = Math.max(1, Number(normalized.meta?.totalPages || 1))
    if (!notifications.value.some(item => item.id === selectedId.value)) selectedId.value = null
    selectedIds.value = new Set([...selectedIds.value].filter(id => notifications.value.some(item => item.id === id)))
  } catch {
    toast.add({ severity: 'error', summary: 'خطا', detail: 'دریافت اعلان‌ها انجام نشد. دوباره تلاش کنید.', life: 3500 })
  } finally {
    loading.value = false
  }
}

async function fetchUnreadCount() {
  try {
    const result = await apiGet(endpoints.notifications.unreadCount)
    unreadCount.value = Number(result?.count ?? result?.data?.count ?? 0)
  } catch (err) {
    console.error('Error fetching unread count:', err)
  }
  await fetchFolderCounts()
}

async function fetchFolderCounts() {
  try {
    const countFor = async (folderId = null) => {
      const params = new URLSearchParams({ page: '1', limit: '1' })
      if (folderId !== null) params.set('folderId', String(folderId))
      const result = await apiGetPaginated(`${endpoints.notifications.list}?${params.toString()}`)
      const normalized = normalizeNotificationPage(result)
      return Number(normalized.meta?.total ?? normalized.data.length)
    }
    const [allCount, ...folderResults] = await Promise.all([
      countFor(),
      ...userFolders.value.map(folder => countFor(folder.id)),
    ])
    const nextCounts = {
      ...folderCounts.value,
      all: allCount,
      read: Math.max(0, allCount - unreadCount.value),
    }
    userFolders.value.forEach((folder, index) => {
      nextCounts[folder.id] = folderResults[index]
    })
    folderCounts.value = nextCounts
  } catch (err) {
    console.error('Error fetching notification folder counts:', err)
  }
}

function openNotification(item) {
  selectedId.value = item.id
}

function closeNotification() {
  selectedId.value = null
}

async function openNotificationAndMarkRead(item) {
  openNotification(item)
  if (!item.isRead) await setNotificationReadState(item, true)
}

async function setNotificationReadState(item, isRead) {
  if (item.isRead === isRead || busyIds.value.has(item.id)) return
  setBusy(item.id, true)
  try {
    await apiPatch(endpoints.notifications.readState(item.id), { isRead })
    item.isRead = isRead
    unreadCount.value = Math.max(0, unreadCount.value + (isRead ? -1 : 1))
    if ((activeFolder.value === 'unread' || activeFolder.value === 'read') && !visibleNotifications.value.some(row => row.id === item.id)) {
      selectedId.value = null
      await fetchNotifications()
    }
    await fetchUnreadCount()
  } catch {
    toast.add({ severity: 'error', summary: 'خطا', detail: 'وضعیت پیام به‌روزرسانی نشد.', life: 3000 })
  } finally { setBusy(item.id, false) }
}

async function markAllAsRead() {
  bulkBusy.value = true
  try {
    await apiPatch(endpoints.notifications.readAll)
    notifications.value.forEach(item => { item.isRead = true })
    unreadCount.value = 0
    toast.add({ severity: 'success', summary: 'انجام شد', detail: 'همه پیام‌های خوانده‌نشده به‌عنوان خوانده‌شده علامت خوردند.', life: 3000 })
    await fetchNotifications()
    await fetchUnreadCount()
  } catch {
    toast.add({ severity: 'error', summary: 'خطا', detail: 'خواندن همه پیام‌ها انجام نشد.', life: 3000 })
  } finally { bulkBusy.value = false }
}

function toggleSelection(id, checked) {
  const next = new Set(selectedIds.value)
  if (checked) next.add(id); else next.delete(id)
  selectedIds.value = next
}
function toggleVisibleSelection(checked) {
  const next = new Set(selectedIds.value)
  for (const item of visibleNotifications.value) { if (checked) next.add(item.id); else next.delete(item.id) }
  selectedIds.value = next
}
function clearSelection() { selectedIds.value = new Set() }

async function bulkSetReadState(isRead) {
  const ids = [...selectedIds.value]
  if (!ids.length) return
  bulkBusy.value = true
  try {
    await apiPost(endpoints.notifications.bulkReadState, { ids, isRead })
    const selectedIdSet = new Set(ids)
    let unreadDelta = 0
    for (const item of notifications.value) {
      if (!selectedIdSet.has(item.id) || item.isRead === isRead) continue
      unreadDelta += isRead ? -1 : 1
      item.isRead = isRead
    }
    unreadCount.value = Math.max(0, unreadCount.value + unreadDelta)
    clearSelection()
    await fetchNotifications(); await fetchUnreadCount()
    toast.add({ severity: 'success', summary: 'انجام شد', detail: isRead ? 'پیام‌های انتخاب‌شده خوانده شدند.' : 'پیام‌های انتخاب‌شده خوانده‌نشده شدند.', life: 3000 })
  } catch {
    toast.add({ severity: 'error', summary: 'خطا', detail: 'به‌روزرسانی پیام‌های انتخاب‌شده انجام نشد.', life: 3000 })
  } finally { bulkBusy.value = false }
}

async function deleteNotification(item) {
  if (busyIds.value.has(item.id)) return
  setBusy(item.id, true)
  try {
    await apiDelete(endpoints.notifications.remove(item.id))
    selectedIds.value = new Set([...selectedIds.value].filter(id => id !== item.id))
    if (selectedId.value === item.id) selectedId.value = null
    await fetchNotifications(); await fetchUnreadCount()
    toast.add({ severity: 'success', summary: 'حذف شد', detail: 'پیام حذف شد.', life: 2500 })
  } catch {
    toast.add({ severity: 'error', summary: 'خطا', detail: 'حذف پیام انجام نشد.', life: 3000 })
  } finally { setBusy(item.id, false) }
}

async function bulkDeleteNotifications() {
  const ids = [...selectedIds.value]
  if (!ids.length) return
  bulkBusy.value = true
  try {
    await apiPost(endpoints.notifications.bulkDelete, { ids })
    clearSelection(); selectedId.value = null
    await fetchNotifications(); await fetchUnreadCount()
    toast.add({ severity: 'success', summary: 'حذف شد', detail: `${ids.length} پیام حذف شد.`, life: 3000 })
  } catch {
    toast.add({ severity: 'error', summary: 'خطا', detail: 'حذف گروهی پیام‌ها انجام نشد.', life: 3000 })
  } finally { bulkBusy.value = false }
}

async function applyFolderAction(item, action, folderId = targetFolderId.value) {
  if (!folderId) {
    toast.add({ severity: 'warn', summary: 'پوشه انتخاب نشده', detail: 'ابتدا پوشه مقصد را انتخاب کنید.', life: 3000 })
    return
  }
  const memberships = (item.folderMemberships || []).map(m => m.folderId ?? m.folder?.id)
  const inbox = userFolders.value.find(folder => folder.key === 'INBOX')
  let sourceFolderId = Number.isInteger(Number(activeFolder.value)) ? Number(activeFolder.value) : null
  if (!sourceFolderId || !memberships.includes(sourceFolderId)) {
    sourceFolderId = inbox && memberships.includes(inbox.id) ? inbox.id : (memberships[0] ?? inbox?.id)
  }
  try {
    await apiPost(endpoints.notifications.changeFolder(item.id), {
      folderId: Number(folderId), action,
      ...(action === 'move' && sourceFolderId ? { sourceFolderId } : {}),
    })
    toast.add({ severity: 'success', summary: 'انجام شد', detail: action === 'copy' ? 'پیام در پوشه مقصد هم قرار گرفت.' : 'پیام به پوشه مقصد منتقل شد.', life: 2500 })
    await fetchNotifications()
    await fetchUnreadCount()
  } catch {
    toast.add({ severity: 'error', summary: 'خطا', detail: 'تغییر پوشه پیام انجام نشد.', life: 3000 })
  }
}

async function saveNotification(item) {
  const saved = userFolders.value.find(folder => folder.key === 'SAVED')
  if (!saved) return
  await applyFolderAction(item, 'copy', saved.id)
}

function setBusy(id, value) {
  const next = new Set(busyIds.value)
  if (value) next.add(id)
  else next.delete(id)
  busyIds.value = next
}

function selectFolder(folder) {
  activeFolder.value = folder
  page.value = 1
  selectedId.value = null
  clearSelection()
  activeCategory.value = 'all'
  fetchNotifications()
}

function selectCategory(category) {
  activeCategory.value = category
  page.value = 1
  selectedId.value = null
  clearSelection()
}

function formatTime(value) {
  if (!value) return '—'
  return new Date(value).toLocaleString('fa-IR', {
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

function formatFullDate(value) {
  if (!value) return '—'
  return new Date(value).toLocaleString('fa-IR', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

function typeLabel(item) {
  return categoryDefinitions.find(category => category.id === categoryFor(item))?.label || 'سایر پیام‌ها'
}
</script>

<template>
  <section class="mail-page" dir="rtl">
    <header class="mail-header">
      <div class="mail-title-group">
        <div class="mail-title-copy">
          <h1>صندوق اعلان‌ها</h1>
          <nav class="mail-breadcrumb" aria-label="مسیر صفحه"><span>پنل کاربری</span><i class="pi pi-angle-left"></i><span>اعلان‌ها</span><i class="pi pi-angle-left"></i><strong>{{ activeCategoryLabel }}</strong></nav>
        </div>
      </div>
      <div class="header-actions">
        <span class="unread-total"><i class="pi pi-envelope"></i>{{ unreadCount }} خوانده‌نشده</span>
        <router-link to="/notification-preferences" class="settings-link"><i class="pi pi-cog"></i> تنظیمات اعلان‌ها</router-link>
      </div>
    </header>

    <div class="mail-layout">
      <aside class="mail-sidebar" aria-label="پوشه‌ها و دسته‌بندی پیام‌ها">
        <div class="sidebar-top"><span><i class="pi pi-inbox"></i> صندوق پیام‌ها</span><span class="sidebar-total">{{ folderCounts.all }}</span></div>
        <router-link to="/notification-preferences" class="sidebar-compose"><i class="pi pi-cog"></i> تنظیمات اعلان‌ها</router-link>
        <p class="sidebar-section-title">پوشه‌ها</p>

        <button v-for="folder in folders" :key="folder.id" type="button" class="folder-link" :data-folder-id="folder.id"
          :class="{ active: activeFolder === folder.id && activeCategory === 'all' }" @click="selectFolder(folder.id)">
          <i :class="['pi', folder.icon]" aria-hidden="true"></i>
          <span>{{ folder.label }}</span>
          <b>{{ folder.count }}</b>
        </button>

        <div class="sidebar-divider"></div>
        <p class="sidebar-section-title">برچسب‌ها</p>
        <button type="button" class="folder-link" :class="{ active: activeCategory === 'all' }" @click="selectCategory('all')">
          <i class="pi pi-th-large" aria-hidden="true"></i><span>همه دسته‌ها</span>
        </button>
        <button v-for="category in categoryFolders" :key="category.id" type="button" class="folder-link category-link"
          :class="{ active: activeCategory === category.id }" @click="selectCategory(category.id)">
          <i :class="['pi', category.icon]" aria-hidden="true"></i><span>{{ category.label }}</span><b>{{ category.count }}</b>
        </button>


      </aside>

      <section class="message-list-panel" aria-label="فهرست پیام‌ها">
        <div class="list-toolbar">
          <div class="list-toolbar-left">
            <label class="select-visible" title="انتخاب همه پیام‌های این صفحه">
              <input type="checkbox" :checked="allVisibleSelected" :indeterminate="hasSelectedNotifications && !allVisibleSelected" :disabled="!visibleNotifications.length" @change="toggleVisibleSelection($event.target.checked)">
              <span>{{ activeCategoryLabel }}</span>
            </label>
            <span class="list-count">{{ visibleNotifications.length }}</span>
          </div>
          <label class="search-box list-search">
            <i class="pi pi-search" aria-hidden="true"></i>
            <input v-model="searchQuery" type="search" name="notification-search" autocomplete="off" placeholder="جستجو در اعلان‌ها…" aria-label="جستجو در پیام‌ها">
            <button v-if="searchQuery" type="button" class="clear-search" aria-label="پاک کردن جستجو" @click="searchQuery = ''"><i class="pi pi-times"></i></button>
          </label>
          <div class="toolbar-actions">
            <span class="result-count">{{ total }} پیام</span>
            <div v-if="hasSelectedNotifications" class="bulk-actions">
              <Button label="خوانده‌شده" icon="pi pi-envelope-open" severity="secondary" text size="small" :disabled="bulkBusy" @click="bulkSetReadState(true)" />
              <Button label="خوانده‌نشده" icon="pi pi-envelope" severity="secondary" text size="small" :disabled="bulkBusy" @click="bulkSetReadState(false)" />
              <Button label="حذف" icon="pi pi-trash" severity="danger" text size="small" :disabled="bulkBusy" @click="bulkDeleteNotifications" />
              <Button icon="pi pi-times" severity="secondary" text rounded size="small" aria-label="لغو انتخاب" :disabled="bulkBusy" @click="clearSelection" />
            </div>
            <Button icon="pi pi-refresh" severity="secondary" text rounded aria-label="تازه‌سازی پیام‌ها" :loading="loading" @click="fetchNotifications(); fetchUnreadCount()" />
            <Button icon="pi pi-envelope-open" severity="secondary" text rounded aria-label="خواندن همه اعلان‌ها" :loading="bulkBusy" @click="markAllAsRead" />
          </div>
        </div>

        <div v-if="loading && !notifications.length" class="list-state"><ProgressSpinner /><p>در حال دریافت پیام‌ها…</p></div>
        <div v-else-if="!visibleNotifications.length" class="list-state empty-list">
          <i class="pi pi-inbox"></i>
          <strong>پیامی پیدا نشد</strong>
          <span>{{ searchQuery ? 'عبارت دیگری را جستجو کنید.' : 'در این پوشه اعلانی وجود ندارد.' }}</span>
        </div>
        <div v-else class="message-items">
          <article v-for="item in visibleNotifications" :key="item.id" class="message-row"
            :class="{ selected: selectedId === item.id, unread: !item.isRead }">
            <label class="row-select" :aria-label="`انتخاب پیام ${item.title}`">
              <input type="checkbox" class="row-checkbox" :checked="selectedIds.has(item.id)"
                @change="toggleSelection(item.id, $event.target.checked)">
            </label>
            <button type="button" class="message-row-open" :aria-pressed="selectedId === item.id"
              @click="openNotification(item)" @dblclick="openNotificationAndMarkRead(item)">
              <span class="row-status" aria-hidden="true"><i class="pi pi-bell"></i></span>
              <span class="row-content">
                <span class="row-topline"><strong class="row-sender">سامانه مخابرات</strong><time>{{ formatTime(item.createdAt) }}</time></span>
                <span class="row-subject"><strong>{{ item.title }}</strong><span class="row-category">{{ typeLabel(item) }}</span></span>
                <span class="row-preview">{{ item.message }}</span>
              </span>
              <span v-if="!item.isRead" class="unread-dot" aria-label="خوانده‌نشده"></span>
            </button>
            <span class="row-actions">
              <Button :icon="item.isRead ? 'pi pi-envelope' : 'pi pi-envelope-open'" severity="secondary" text rounded size="small"
                :aria-label="item.isRead ? 'علامت‌گذاری به‌عنوان خوانده‌نشده' : 'علامت‌گذاری به‌عنوان خوانده‌شده'"
                :loading="busyIds.has(item.id)" @click="setNotificationReadState(item, !item.isRead)" />
              <Button icon="pi pi-trash" severity="danger" text rounded size="small" aria-label="حذف پیام" :loading="busyIds.has(item.id)" @click="deleteNotification(item)" />
            </span>
          </article>
        </div>

        <footer v-if="totalPages > 1" class="pagination">
          <Button icon="pi pi-chevron-right" severity="secondary" text rounded aria-label="صفحه قبل" :disabled="page <= 1 || loading" @click="page--; fetchNotifications()" />
          <span>{{ page }} از {{ totalPages }}</span>
          <Button icon="pi pi-chevron-left" severity="secondary" text rounded aria-label="صفحه بعد" :disabled="page >= totalPages || loading" @click="page++; fetchNotifications()" />
        </footer>
      </section>

    </div>

    <div v-if="selectedNotification" class="reading-overlay" @click.self="closeNotification">
      <aside class="reading-drawer" role="dialog" aria-modal="true" aria-labelledby="notification-detail-title" @keydown.esc="closeNotification">
        <header class="drawer-toolbar">
          <div class="drawer-tool-group">
            <Button :icon="selectedNotification.isRead ? 'pi pi-envelope' : 'pi pi-envelope-open'" severity="secondary" text rounded
              :aria-label="selectedNotification.isRead ? 'علامت‌گذاری به‌عنوان خوانده‌نشده' : 'علامت‌گذاری به‌عنوان خوانده‌شده'"
              :loading="busyIds.has(selectedNotification.id)" @click="setNotificationReadState(selectedNotification, !selectedNotification.isRead)" />
            <Button icon="pi pi-refresh" severity="secondary" text rounded aria-label="بروزرسانی فهرست" :loading="loading" @click="fetchNotifications()" />
          </div>
          <Button icon="pi pi-times" severity="secondary" text rounded aria-label="بستن جزئیات اعلان" @click="closeNotification" />
        </header>

        <div class="drawer-scroll">
          <div class="drawer-subject-line">
            <h2 id="notification-detail-title">{{ selectedNotification.title }}</h2>
            <time>{{ formatFullDate(selectedNotification.createdAt) }}</time>
          </div>
          <div class="drawer-sender">
            <span class="sender-avatar"><i class="pi pi-bell"></i></span>
            <div class="sender-copy">
              <strong>سامانه مخابرات</strong>
              <span>برای شما</span>
            </div>
            <div class="drawer-message-actions">
              <Button icon="pi pi-bookmark" severity="secondary" text rounded aria-label="ذخیره اعلان" @click="saveNotification(selectedNotification)" />
              <Button icon="pi pi-folder-open" severity="secondary" text rounded aria-label="انتقال به پوشه ذخیره‌شده" @click="applyFolderAction(selectedNotification, 'move', targetFolderId)" />
              <Button icon="pi pi-trash" severity="danger" text rounded aria-label="حذف اعلان" :loading="busyIds.has(selectedNotification.id)" @click="deleteNotification(selectedNotification)" />
            </div>
          </div>
          <div class="drawer-message-content">
            <span class="drawer-category">{{ typeLabel(selectedNotification) }}</span>
            <p>{{ selectedNotification.message }}</p>
            <div class="message-footer"><i class="pi pi-shield"></i> این پیام از طرف سامانه ارسال شده است.</div>
          </div>
          <div class="drawer-folder-control">
            <label for="notification-target-folder">پوشه مقصد</label>
            <select id="notification-target-folder" v-model="targetFolderId" class="inline-folder-select" aria-label="انتخاب پوشه مقصد">
              <option v-for="folder in userFolders" :key="folder.id" :value="folder.id">{{ notificationFolderLabel(folder) }}</option>
            </select>
            <Button label="انتقال" icon="pi pi-folder-open" severity="secondary" outlined size="small" @click="applyFolderAction(selectedNotification, 'move')" />
          </div>
        </div>
      </aside>
    </div>
  </section>
</template>

<style scoped>
.mail-page{min-width:0;padding:1rem;background:#f3f5fa;color:#17243a;font-family:var(--ds-font-family);direction:rtl}
.mail-header{display:flex;align-items:center;justify-content:space-between;gap:1rem;min-height:4.4rem;margin:0 0 .85rem;padding:.25rem .1rem;background:transparent}
.mail-title-copy h1{margin:0;color:#17243a;font-size:1.08rem;font-weight:700;line-height:1.5}
.mail-breadcrumb{display:flex;align-items:center;gap:.5rem;margin-top:.22rem;color:#818da5;font-size:.7rem}
.mail-breadcrumb i{font-size:.62rem}.mail-breadcrumb strong{color:#27364d;font-weight:600}
.header-actions{display:flex;align-items:center;gap:.5rem}
.unread-total{display:inline-flex;align-items:center;gap:.4rem;padding:.48rem .7rem;border-radius:5px;background:#eeedff;color:#7668e8;font-size:.72rem;font-weight:700}
.settings-link{display:inline-flex;align-items:center;gap:.4rem;padding:.48rem .7rem;border:1px solid #e7e8f0;border-radius:5px;background:#fff;color:#46536a;font-size:.72rem;text-decoration:none}
.mail-layout{display:grid;direction:ltr;grid-template-columns:260px minmax(0,1fr);min-height:calc(100vh - 130px);overflow:hidden;border:1px solid #e9eaf2;border-radius:5px;background:#fff;box-shadow:0 2px 12px rgba(26,39,68,.035)}
.mail-sidebar{direction:rtl;min-width:0;padding:.75rem .65rem;border-inline-start:1px solid #eceef5;background:#fff}
.sidebar-top{display:flex;align-items:center;justify-content:space-between;min-height:3rem;margin:0 0 .65rem;padding:.35rem .6rem;color:#23324a;font-size:.8rem;font-weight:700}
.sidebar-top span:first-child{display:flex;align-items:center;gap:.5rem}.sidebar-top i{color:#8175ee}
.sidebar-total{display:grid;place-items:center;min-width:1.35rem;height:1.35rem;border-radius:4px;background:#8275f4;color:#fff;font-size:.65rem}
.sidebar-compose{display:flex;align-items:center;justify-content:center;gap:.45rem;min-height:2.55rem;margin:0 0 .9rem;border:1px solid #eeeff6;border-radius:20px;background:#f8f9fc;color:#33435d;font-size:.76rem;text-decoration:none}
.sidebar-compose:hover{border-color:#d9d5ff;background:#f2f0ff;color:#7668e8}
.sidebar-section-title{margin:.85rem .55rem .45rem;color:#9aa5b9;font-size:.63rem;font-weight:700;letter-spacing:.02em}
.folder-link{display:flex;align-items:center;gap:.55rem;width:100%;min-height:2.45rem;margin:.14rem 0;padding:.4rem .55rem;border:1px dashed #edf0f6;border-radius:4px;background:#fff;color:#26354b;text-align:start;font:inherit;font-size:.74rem;cursor:pointer;transition:background .15s,border-color .15s}
.folder-link>i{width:1rem;color:#8c9bb2;font-size:.8rem}.folder-link span{flex:1;min-width:0}.folder-link b{color:#8a96aa;font-size:.67rem;font-weight:600}
.folder-link:hover{border-color:#dcd8ff;background:#faf9ff}.folder-link.active{border-color:#d9d5ff;background:#f3f1ff;color:#7769eb}.folder-link.active>i,.folder-link.active b{color:#7769eb}
.sidebar-divider{height:1px;margin:.8rem .4rem;background:#edf0f5}
.category-link{min-height:2.35rem}.category-link>i{font-size:.65rem}
.message-list-panel{display:flex;direction:rtl;flex-direction:column;min-width:0;background:#fff}
.list-toolbar{display:flex;align-items:center;gap:.8rem;min-height:4.1rem;padding:.55rem .8rem;border-bottom:1px solid #eceef5;background:#f8f9fc}
.list-toolbar-left{display:flex;align-items:center;gap:.55rem;flex:0 0 auto}
.select-visible{display:inline-flex;align-items:center;gap:.45rem;color:#26354b;font-size:.76rem;white-space:nowrap}
.select-visible input,.row-checkbox{width:.9rem;height:.9rem;accent-color:#8174f0;cursor:pointer}
.list-count{color:#8a96aa;font-size:.68rem}
.search-box{display:flex;align-items:center;gap:.5rem;min-width:100px;min-height:2.35rem;padding:0 .7rem;border:1px solid #e3e7f0;border-radius:20px;background:#fff;color:#98a4b7}
.search-box:focus-within{border-color:#bdb6ff;box-shadow:0 0 0 2px #8174f018}
.search-box input{width:100%;min-width:0;padding:.45rem 0;border:0;outline:0;background:transparent;color:#26354b;font:inherit;font-size:.7rem}
.search-box input::placeholder{color:#9aa5b8}.list-search{flex:1}
.clear-search{display:grid;place-items:center;width:1.6rem;height:1.6rem;border:0;border-radius:50%;background:transparent;color:#8a96aa;cursor:pointer}
.toolbar-actions{display:flex;align-items:center;gap:.15rem;flex:0 0 auto}
.result-count{color:#8a96aa;font-size:.67rem;white-space:nowrap}
.bulk-actions{display:flex;align-items:center;gap:.05rem;padding:.1rem .2rem;border:1px solid #e9eaf2;border-radius:5px;background:#fff}
.message-items{flex:1;min-width:0}
.message-row{display:flex;align-items:center;gap:.45rem;min-width:0;min-height:4.55rem;padding:.35rem .7rem;border:0;border-bottom:1px solid #edf0f5;background:#fff;color:#17243a;transition:background .14s}
.message-row:hover{background:#fafaff}.message-row.selected{background:#f7f6ff;box-shadow:inset -3px 0 #8275f4}
.message-row.unread{background:#fff}.message-row.unread .row-subject strong,.message-row.unread .row-sender{font-weight:750;color:#17243a}
.row-select{display:grid;place-items:center;flex:0 0 1.25rem;min-height:2rem;cursor:pointer}
.message-row-open{display:flex;align-items:center;gap:.65rem;flex:1;min-width:0;min-height:3.6rem;padding:.25rem .15rem;border:0;background:transparent;color:inherit;text-align:start;font:inherit;cursor:pointer}
.message-row-open:focus-visible,.folder-link:focus-visible{outline:2px solid #8174f0;outline-offset:2px}
.row-status{display:grid;place-items:center;flex:0 0 2rem;width:2rem;height:2rem;border-radius:50%;background:#f0efff;color:#7d70eb;font-size:.8rem}
.row-content{display:flex;flex-direction:column;gap:.12rem;min-width:0;flex:1}
.row-topline{display:flex;align-items:center;justify-content:space-between;gap:.5rem;min-width:0}
.row-sender{overflow:hidden;color:#26354b;font-size:.7rem;font-weight:600;text-overflow:ellipsis;white-space:nowrap}
.row-topline time{flex:0 0 auto;color:#52617a;font-size:.65rem;font-variant-numeric:tabular-nums}
.row-subject{display:flex;align-items:center;gap:.4rem;min-width:0}
.row-subject strong{overflow:hidden;color:#17243a;font-size:.73rem;font-weight:600;text-overflow:ellipsis;white-space:nowrap}
.row-category{flex:0 0 auto;padding:.08rem .32rem;border-radius:3px;background:#eeedff;color:#7568e7;font-size:.59rem;font-weight:600}
.row-preview{display:-webkit-box;overflow:hidden;color:#8a99b2;font-size:.68rem;line-height:1.5;-webkit-box-orient:vertical;-webkit-line-clamp:1;overflow-wrap:anywhere}
.unread-dot{flex:0 0 6px;width:6px;height:6px;margin-inline:.2rem;border-radius:50%;background:#8275f4}
.row-actions{display:flex;align-items:center;flex:0 0 auto;gap:0;opacity:.55}.message-row:hover .row-actions,.message-row.selected .row-actions{opacity:1}
.row-actions :deep(.p-button),.bulk-actions :deep(.p-button),.toolbar-actions :deep(.p-button){min-width:2rem;min-height:2rem;width:2rem;height:2rem;color:#8175ed}
.list-state{display:flex;flex:1;flex-direction:column;align-items:center;justify-content:center;gap:.55rem;min-height:280px;padding:1.5rem;color:#8b98ad;text-align:center}
.list-state p,.list-state span{margin:0;font-size:.74rem;line-height:1.8}.empty-list>i{font-size:1.5rem}.empty-list strong{color:#26354b;font-size:.8rem}
.pagination{display:flex;align-items:center;justify-content:center;gap:.6rem;min-height:3rem;margin-top:auto;padding:.4rem;border-top:1px solid #edf0f5}
.pagination span{color:#8a96aa;font-size:.7rem;font-variant-numeric:tabular-nums}
.mail-page button{font-family:inherit}.mail-page button:focus-visible,.mail-page a:focus-visible,.mail-page select:focus-visible{outline:2px solid #8174f0;outline-offset:2px}
@media(max-width:1050px){.mail-layout{grid-template-columns:220px minmax(0,1fr)}.list-toolbar{flex-wrap:wrap}.list-search{order:3;flex-basis:100%}}
@media(max-width:700px){.mail-page{padding:.55rem}.mail-header{align-items:flex-start;flex-direction:column;padding:.25rem 0}.header-actions{width:100%;justify-content:flex-start}.mail-layout{grid-template-columns:minmax(0,1fr);min-height:0}.mail-sidebar{border-inline-end:0;border-bottom:1px solid #eceef5;padding:.55rem}.sidebar-top,.sidebar-compose,.sidebar-section-title,.sidebar-divider{display:none}.mail-sidebar .folder-link{display:inline-flex;width:auto;min-height:2.15rem;margin:.1rem}.list-toolbar{gap:.45rem;padding:.5rem}.list-toolbar-left{flex:1}.list-search{order:0;flex-basis:100%}.toolbar-actions{margin-inline-start:auto}.message-row{padding-inline:.25rem;gap:.25rem}.row-select{flex-basis:1rem}.row-status{flex-basis:1.7rem;width:1.7rem;height:1.7rem}.row-actions :deep(.p-button){min-width:1.8rem;width:1.8rem;height:1.8rem}}
@media(prefers-reduced-motion:reduce){.mail-page *,.mail-page *::before,.mail-page *::after{scroll-behavior:auto!important;transition-duration:.01ms!important;animation-duration:.01ms!important;animation-iteration-count:1!important}}
</style>

<style>
.reading-overlay{position:fixed;inset:0;z-index:1200;display:flex;justify-content:flex-end;background:rgba(10,18,30,.52);backdrop-filter:blur(1.5px)}
.reading-drawer{display:flex;flex-direction:column;width:min(46rem,52vw);height:100%;min-width:0;background:#fff;color:#182235;box-shadow:-12px 0 36px rgba(12,24,40,.18);border-inline-start:1px solid #e9eaf2;direction:rtl;animation:notification-drawer-in .22s ease-out both}
.drawer-toolbar{position:sticky;top:0;z-index:2;display:flex;align-items:center;justify-content:space-between;gap:.75rem;min-height:3.35rem;padding:.35rem .75rem;border-bottom:1px solid #eceef5;background:#fff}
.drawer-tool-group{display:flex;align-items:center;gap:.2rem}
.drawer-scroll{flex:1;min-height:0;overflow-y:auto;padding:1.2rem 1.35rem 1.5rem}
.drawer-subject-line{display:flex;align-items:flex-start;justify-content:space-between;gap:1rem;margin:.1rem 0 1.25rem}
.drawer-subject-line h2{margin:0;color:#17243a;font-size:1.12rem;line-height:1.8;font-weight:700}
.drawer-subject-line time{flex:0 0 auto;padding-top:.35rem;color:#8a96aa;font-size:.72rem;white-space:nowrap}
.drawer-sender{display:flex;align-items:center;gap:.75rem;padding:0 0 1rem;border-bottom:1px solid #eceef5}
.drawer-sender .sender-avatar{display:grid;place-items:center;flex:0 0 2.5rem;width:2.5rem;height:2.5rem;border-radius:50%;background:#eeedff;color:#7c70eb}
.sender-copy{display:flex;flex:1;min-width:0;flex-direction:column;gap:.12rem}.sender-copy strong{font-size:.85rem}.sender-copy span{color:#8a96aa;font-size:.72rem}
.drawer-message-actions{display:flex;align-items:center;gap:.1rem}
.drawer-message-content{padding:1.2rem 0;min-height:12rem;color:#26354b;font-size:.88rem;line-height:2}
.drawer-message-content p{margin:.7rem 0 1.5rem;white-space:pre-wrap;overflow-wrap:anywhere}
.drawer-category{display:inline-flex;padding:.16rem .55rem;border-radius:5px;background:#f3f4fa;color:#7e8ba1;font-size:.7rem}
.drawer-message-content .message-footer{display:flex;align-items:center;gap:.4rem;margin-top:1.5rem;padding-top:.8rem;border-top:1px solid #eceef5;color:#8a96aa;font-size:.75rem}
.drawer-folder-control{display:flex;align-items:center;gap:.55rem;flex-wrap:wrap;padding:1rem 0;border-top:1px solid #eceef5}
.drawer-folder-control label{color:#8a96aa;font-size:.76rem}
.drawer-folder-control .inline-folder-select{min-width:9rem;min-height:2.25rem;padding:.35rem .55rem;border:1px solid #e3e7f0;border-radius:6px;background:#fff;color:#26354b}
@keyframes notification-drawer-in{from{transform:translateX(24px);opacity:.75}to{transform:translateX(0);opacity:1}}
@media(max-width:760px){.reading-drawer{width:min(100%,32rem)}.drawer-scroll{padding:1rem}.drawer-subject-line{flex-direction:column;gap:.35rem}.drawer-subject-line time{padding:0}}
@media(prefers-reduced-motion:reduce){.reading-drawer{animation:none}}
</style>