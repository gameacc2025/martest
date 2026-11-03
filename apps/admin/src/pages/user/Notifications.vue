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
    if (!notifications.value.some(item => item.id === selectedId.value)) selectedId.value = notifications.value[0]?.id ?? null
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
      <div class="mail-title-group"><span class="mail-brand-mark" aria-hidden="true"><i class="pi pi-envelope"></i></span><div class="mail-title-copy"><h1>صندوق اعلان‌های مدیریت</h1>
        <p class="subtitle">اعلان‌های دریافتی حساب مدیریتی را دسته‌بندی و مدیریت کنید.</p></div></div>
      <div class="header-actions">
        <span class="unread-total"><i class="pi pi-envelope"></i>{{ unreadCount }} خوانده‌نشده</span>
        <router-link to="/notification-preferences" class="settings-link"><i class="pi pi-cog"></i> تنظیمات</router-link>
        <router-link to="/notification-management" class="settings-link"><i class="pi pi-send"></i> مدیریت و ارسال</router-link>
      </div>
    </header>

    <div class="mail-toolbar">
      <label class="search-box">
        <i class="pi pi-search" aria-hidden="true"></i>
        <input v-model="searchQuery" type="search" name="notification-search" autocomplete="off" placeholder="جستجو در عنوان و متن پیام‌ها…" aria-label="جستجو در پیام‌ها">
        <button v-if="searchQuery" type="button" class="clear-search" aria-label="پاک کردن جستجو" @click="searchQuery = ''"><i class="pi pi-times"></i></button>
      </label>
      <div class="toolbar-actions">
        <span class="result-count">{{ visibleNotifications.length }} پیام در این صفحه</span>
        <div v-if="hasSelectedNotifications" class="bulk-actions">
          <span>{{ selectedIds.size }} انتخاب‌شده</span>
          <Button label="خوانده‌شده" icon="pi pi-envelope-open" severity="secondary" text size="small" :disabled="bulkBusy" @click="bulkSetReadState(true)" />
          <Button label="خوانده‌نشده" icon="pi pi-envelope" severity="secondary" text size="small" :disabled="bulkBusy" @click="bulkSetReadState(false)" />
          <Button label="حذف" icon="pi pi-trash" severity="danger" text size="small" :disabled="bulkBusy" @click="bulkDeleteNotifications" />
          <Button icon="pi pi-times" severity="secondary" text rounded size="small" aria-label="لغو انتخاب" :disabled="bulkBusy" @click="clearSelection" />
        </div>
        <Button label="خواندن همه" icon="pi pi-check-circle" severity="secondary" text :loading="bulkBusy" @click="markAllAsRead" />
        <Button icon="pi pi-refresh" severity="secondary" text rounded aria-label="تازه‌سازی پیام‌ها" :loading="loading" @click="fetchNotifications(); fetchUnreadCount()" />
      </div>
    </div>

    <div class="mail-layout">
      <aside class="mail-sidebar" aria-label="پوشه‌ها و دسته‌بندی پیام‌ها">
        <p class="sidebar-heading">پوشه‌ها</p>
        <button v-for="folder in folders" :key="folder.id" type="button" class="folder-link" :data-folder-id="folder.id"
          :class="{ active: activeFolder === folder.id && activeCategory === 'all' }" @click="selectFolder(folder.id)">
          <i :class="['pi', folder.icon]" aria-hidden="true"></i>
          <span>{{ folder.label }}</span>
          <b>{{ folder.count }}</b>
        </button>

        <div class="sidebar-divider"></div>
        <p class="sidebar-heading">دسته‌بندی‌ها</p>
        <button type="button" class="folder-link" :class="{ active: activeCategory === 'all' }" @click="selectCategory('all')">
          <i class="pi pi-th-large" aria-hidden="true"></i><span>همه دسته‌ها</span>
        </button>
        <button v-for="category in categoryFolders" :key="category.id" type="button" class="folder-link category-link"
          :class="{ active: activeCategory === category.id }" @click="selectCategory(category.id)">
          <i :class="['pi', category.icon]" aria-hidden="true"></i><span>{{ category.label }}</span><b>{{ category.count }}</b>
        </button>

        <div class="sidebar-note"><i class="pi pi-info-circle"></i><span>دسته‌بندی بر اساس نوع اعلان انجام می‌شود.</span></div>
      </aside>

      <section class="message-list-panel" aria-label="فهرست پیام‌ها">
        <div class="list-heading">
          <div>
            <h2>{{ activeCategoryLabel }}</h2>
            <span>{{ activeFolder === 'unread' ? 'پیام‌های خوانده‌نشده' : activeFolder === 'read' ? 'پیام‌های خوانده‌شده' : 'جدیدترین پیام‌ها' }}</span>
          </div>
          <label class="select-visible">
            <input type="checkbox" :checked="allVisibleSelected" :indeterminate="hasSelectedNotifications && !allVisibleSelected" :disabled="!visibleNotifications.length" @change="toggleVisibleSelection($event.target.checked)">
            <span>انتخاب صفحه</span>
          </label>
          <span class="list-count">{{ visibleNotifications.length }}</span>
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
              <span class="row-status" aria-hidden="true"><i class="pi pi-building"></i></span>
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

      <section class="reading-panel" aria-label="متن پیام انتخاب‌شده">
        <template v-if="selectedNotification">
          <div class="reading-toolbar">
            <span class="reading-category"><i class="pi pi-tag"></i>{{ typeLabel(selectedNotification) }}</span>
            <div class="reading-actions">
              <Button :icon="selectedNotification.isRead ? 'pi pi-envelope' : 'pi pi-envelope-open'" severity="secondary" text rounded
                :aria-label="selectedNotification.isRead ? 'علامت‌گذاری به‌عنوان خوانده‌نشده' : 'علامت‌گذاری به‌عنوان خوانده‌شده'"
                :loading="busyIds.has(selectedNotification.id)" @click="setNotificationReadState(selectedNotification, !selectedNotification.isRead)" />
              <Button icon="pi pi-trash" severity="danger" text rounded aria-label="حذف پیام" :loading="busyIds.has(selectedNotification.id)" @click="deleteNotification(selectedNotification)" />
              <Button icon="pi pi-bookmark" severity="secondary" text rounded aria-label="ذخیره پیام" @click="saveNotification(selectedNotification)" />
              <select v-model="targetFolderId" class="inline-folder-select" aria-label="انتقال به پوشه">
                <option v-for="folder in userFolders" :key="folder.id" :value="folder.id">{{ notificationFolderLabel(folder) }}</option>
              </select>
              <Button icon="pi pi-folder-open" severity="secondary" text rounded aria-label="انتقال به پوشه انتخاب‌شده" @click="applyFolderAction(selectedNotification, 'move')" />
            </div>
          </div>
          <article class="message-detail">
            <h2>{{ selectedNotification.title }}</h2>
            <div class="message-meta">
              <span class="sender-avatar"><i class="pi pi-bell"></i></span>
              <div><strong>سامانه مخابرات</strong><time>{{ formatFullDate(selectedNotification.createdAt) }}</time></div>
            </div>
            <div class="message-body">{{ selectedNotification.message }}</div>
            <div class="message-footer"><i class="pi pi-shield"></i> این پیام از طرف سامانه ارسال شده است.</div>
          </article>
        </template>
        <div v-else class="reading-empty">
          <div class="reading-empty-icon"><i class="pi pi-envelope"></i></div>
          <h2>پیامی را انتخاب کنید</h2>
          <p>برای مشاهده متن کامل، یکی از پیام‌های فهرست را انتخاب کنید.</p>
        </div>
      </section>
    </div>
  </section>
</template>

<style scoped>
/* Email-client composition: compact typography, layered mail surfaces and clear reading flow. */
.mail-page{padding:1rem;background:var(--ds-color-background);color:var(--ds-color-text);font-family:var(--ds-font-family);min-width:0}
.mail-header{display:flex;align-items:center;justify-content:space-between;gap:1.25rem;margin:0 0 .85rem;padding:1rem 1.25rem;border:1px solid color-mix(in srgb,var(--ds-on-navy) 12%,transparent);border-radius:12px;border-bottom:3px solid var(--ds-brand);background:var(--ds-navy);box-shadow:var(--ds-shadow-sm)}
.mail-title-group{display:flex;align-items:center;gap:.85rem;min-width:0}
.mail-brand-mark{display:grid;place-items:center;flex:0 0 2.65rem;width:2.65rem;height:2.65rem;border:1px solid color-mix(in srgb,var(--ds-brand) 45%,transparent);border-radius:9px;background:color-mix(in srgb,var(--ds-brand) 18%,transparent);color:var(--ds-brand);font-size:1.1rem}
.mail-title-copy{min-width:0}
.mail-header h1{margin:0;color:var(--ds-on-navy);font-size:1.15rem;line-height:1.5;font-weight:700;letter-spacing:0}
.mail-header .subtitle{margin:.15rem 0 0;color:var(--ds-on-navy-muted);font-size:.8rem;line-height:1.6}
.header-actions{display:flex;align-items:center;justify-content:flex-end;gap:.5rem;flex-wrap:wrap}
.unread-total{display:inline-flex;align-items:center;gap:.4rem;min-height:2.75rem;padding:.45rem .7rem;border:1px solid color-mix(in srgb,var(--ds-brand) 35%,transparent);border-radius:7px;background:color-mix(in srgb,var(--ds-brand) 15%,transparent);color:var(--ds-on-navy);font-size:.78rem;font-weight:700;font-variant-numeric:tabular-nums}
.settings-link{display:inline-flex;align-items:center;gap:.4rem;min-height:2.75rem;padding:.45rem .7rem;border:1px solid color-mix(in srgb,var(--ds-on-navy) 24%,transparent);border-radius:7px;background:transparent;color:var(--ds-on-navy);font-size:.78rem;text-decoration:none}
.settings-link:hover{background:color-mix(in srgb,var(--ds-on-navy) 10%,transparent)}
.mail-toolbar{display:flex;align-items:center;justify-content:space-between;gap:.75rem;flex-wrap:wrap;margin:0 0 .75rem;padding:.65rem .8rem;border:1px solid var(--ds-color-border);border-radius:10px;background:var(--ds-color-surface);box-shadow:var(--ds-shadow-xs)}
.search-box{display:flex;align-items:center;gap:.55rem;flex:1 1 280px;max-width:520px;min-height:2.75rem;padding:0 .75rem;border:1px solid var(--ds-color-border);border-radius:7px;background:var(--ds-color-surface-alt);color:var(--ds-color-text-muted)}
.search-box:focus-within{border-color:var(--ds-color-primary);box-shadow:0 0 0 2px color-mix(in srgb,var(--ds-color-primary) 18%,transparent)}
.search-box input{width:100%;min-width:0;padding:.55rem 0;border:0;outline:0;background:transparent;color:var(--ds-color-text);font:inherit;font-size:.82rem}
.search-box input::placeholder{color:var(--ds-color-text-muted)}
.clear-search{display:grid;place-items:center;width:2rem;height:2rem;border:0;border-radius:5px;background:transparent;color:var(--ds-color-text-muted);cursor:pointer}
.clear-search:hover{background:var(--ds-color-surface-hover);color:var(--ds-color-text)}
.toolbar-actions{display:flex;align-items:center;gap:.3rem;flex-wrap:wrap}
.result-count{color:var(--ds-color-text-muted);font-size:.74rem;font-variant-numeric:tabular-nums}
.bulk-actions{display:flex;align-items:center;gap:.15rem;padding:.2rem .35rem;border:1px solid var(--ds-color-border);border-radius:7px;background:var(--ds-color-surface-alt)}
.bulk-actions>span{color:var(--ds-color-primary-text);font-size:.72rem;font-weight:700;white-space:nowrap}
.mail-layout{display:grid;grid-template-columns:205px minmax(330px,390px) minmax(0,1fr);min-height:min(720px,calc(100vh - 220px));overflow:hidden;border:1px solid var(--ds-color-border);border-radius:12px;background:var(--ds-color-surface);box-shadow:var(--ds-shadow-sm)}
.mail-sidebar{min-width:0;padding:.9rem .7rem;border-inline-end:1px solid var(--ds-color-border);background:var(--ds-color-surface-alt)}
.sidebar-heading{margin:.25rem .55rem .5rem;color:var(--ds-color-text-muted);font-size:.69rem;font-weight:700}
.folder-link{display:flex;align-items:center;gap:.6rem;width:100%;min-height:2.75rem;margin:.12rem 0;padding:.45rem .6rem;border:0;border-radius:6px;background:transparent;color:var(--ds-color-text);text-align:start;font:inherit;font-size:.78rem;cursor:pointer;transition:background-color var(--ds-transition-fast),color var(--ds-transition-fast)}
.folder-link>i{width:1rem;color:var(--ds-color-text-muted);font-size:.85rem}
.folder-link span{flex:1;min-width:0}
.folder-link b{color:var(--ds-color-text-muted);font-size:.7rem;font-weight:600;font-variant-numeric:tabular-nums}
.folder-link:hover{background:var(--ds-color-surface-hover)}
.folder-link.active{background:var(--ds-color-primary-soft);color:var(--ds-color-primary-text);font-weight:700}
.folder-link.active>i,.folder-link.active b{color:var(--ds-color-primary-text)}
.sidebar-divider{height:1px;margin:.8rem .5rem;background:var(--ds-color-border)}
.category-link{min-height:2.75rem;font-size:.75rem}
.sidebar-note{margin:.9rem .35rem 0;padding:.6rem;border:1px solid var(--ds-color-border);border-radius:7px;background:var(--ds-color-surface);color:var(--ds-color-text-muted);font-size:.68rem;line-height:1.65}
.message-list-panel{display:flex;flex-direction:column;min-width:0;border-inline-end:1px solid var(--ds-color-border);background:var(--ds-color-surface)}
.list-heading{display:flex;align-items:center;justify-content:space-between;gap:.5rem;min-height:3.6rem;padding:.65rem .8rem;border-bottom:1px solid var(--ds-color-border);background:var(--ds-color-surface)}
.list-heading h2{margin:0;color:var(--ds-color-text);font-size:.88rem;font-weight:700}
.list-heading>div>span{display:block;margin-top:.1rem;color:var(--ds-color-text-muted);font-size:.68rem}
.select-visible{display:inline-flex;align-items:center;gap:.3rem;color:var(--ds-color-text-muted);font-size:.68rem;white-space:nowrap}
.select-visible input,.row-checkbox{width:.95rem;height:.95rem;accent-color:var(--ds-color-primary);cursor:pointer}
.list-count{display:grid;place-items:center;min-width:1.55rem;height:1.55rem;border-radius:5px;background:var(--ds-color-surface-alt);color:var(--ds-color-text-muted);font-size:.7rem;font-weight:700;font-variant-numeric:tabular-nums}
.message-items{flex:1}
.message-row{display:flex;align-items:center;gap:.25rem;min-width:0;padding:.45rem .4rem;border:0;border-bottom:1px solid var(--ds-color-border);background:var(--ds-color-surface);color:var(--ds-color-text);transition:background-color var(--ds-transition-fast)}
.message-row:hover{background:var(--ds-color-surface-hover)}
.message-row.selected{background:color-mix(in srgb,var(--ds-color-primary) 9%,var(--ds-color-surface));box-shadow:inset -3px 0 var(--ds-color-primary)}
.message-row.unread{background:color-mix(in srgb,var(--ds-color-primary) 4%,var(--ds-color-surface))}
.message-row.unread .row-sender,.message-row.unread .row-subject strong{color:var(--ds-color-text);font-weight:800}
.row-select{display:grid;place-items:center;flex:0 0 2rem;min-height:2.75rem;cursor:pointer}
.message-row-open{display:flex;align-items:center;gap:.55rem;flex:1;min-width:0;min-height:3.65rem;padding:.35rem .2rem;border:0;background:transparent;color:inherit;text-align:start;font:inherit;cursor:pointer}
.message-row-open:focus-visible,.folder-link:focus-visible,.clear-search:focus-visible{outline:2px solid var(--ds-color-focus);outline-offset:-2px}
.row-status{display:grid;place-items:center;flex:0 0 2rem;width:2rem;height:2rem;border:1px solid color-mix(in srgb,var(--ds-color-primary) 20%,transparent);border-radius:50%;background:var(--ds-color-primary-soft);color:var(--ds-color-primary-text);font-size:.82rem}
.row-content{display:flex;flex-direction:column;gap:.18rem;min-width:0;flex:1}
.row-topline{display:flex;align-items:baseline;justify-content:space-between;gap:.4rem;min-width:0}
.row-sender{overflow:hidden;color:var(--ds-color-text-muted);font-size:.72rem;font-weight:600;text-overflow:ellipsis;white-space:nowrap}
.row-topline time{flex:0 0 auto;color:var(--ds-color-text-muted);font-size:.65rem;font-variant-numeric:tabular-nums}
.row-subject{display:flex;align-items:center;gap:.4rem;min-width:0}
.row-subject strong{overflow:hidden;color:var(--ds-color-text);font-size:.78rem;font-weight:600;text-overflow:ellipsis;white-space:nowrap}
.row-category{flex:0 0 auto;padding:.1rem .35rem;border-radius:4px;background:var(--ds-color-primary-soft);color:var(--ds-color-primary-text);font-size:.61rem;font-weight:600}
.row-preview{display:-webkit-box;overflow:hidden;color:var(--ds-color-text-muted);font-size:.7rem;line-height:1.55;-webkit-box-orient:vertical;-webkit-line-clamp:1;overflow-wrap:anywhere}
.unread-dot{flex:0 0 6px;width:6px;height:6px;margin-inline:.2rem;border-radius:50%;background:var(--ds-brand)}
.row-actions{display:flex;align-items:center;flex:0 0 auto;gap:0;opacity:.65}
.message-row:hover .row-actions,.message-row.selected .row-actions{opacity:1}
.row-actions :deep(.p-button),.reading-actions :deep(.p-button),.bulk-actions :deep(.p-button){min-width:2.75rem;min-height:2.75rem}
.reading-panel{min-width:0;background:var(--ds-color-surface)}
.reading-toolbar{display:flex;align-items:center;justify-content:space-between;gap:.5rem;min-height:3.6rem;padding:.55rem .85rem;border-bottom:1px solid var(--ds-color-border);background:var(--ds-color-surface-alt)}
.reading-category{display:inline-flex;align-items:center;gap:.35rem;color:var(--ds-color-text-muted);font-size:.72rem}
.reading-category i{color:var(--ds-color-primary-text)}
.reading-actions{display:flex;align-items:center;gap:.1rem}
.inline-folder-select{max-width:8rem;min-width:6rem;min-height:2.75rem;padding:.35rem .45rem;border:1px solid var(--ds-color-border);border-radius:6px;background:var(--ds-color-surface);color:var(--ds-color-text);font:inherit;font-size:.7rem}
.message-detail{max-width:860px;margin-inline:auto;padding:1.5rem clamp(1rem,3vw,2.25rem)}
.message-detail>h2{margin:.25rem 0 1rem;padding-bottom:.9rem;border-bottom:1px solid var(--ds-color-border);color:var(--ds-color-text);font-size:1.2rem;line-height:1.55;font-weight:700;overflow-wrap:anywhere}
.message-meta{display:flex;align-items:center;gap:.7rem;padding:.5rem 0 1rem}
.sender-avatar{display:grid;place-items:center;flex:0 0 2.45rem;width:2.45rem;height:2.45rem;border-radius:50%;background:var(--ds-navy);color:var(--ds-on-navy);font-size:.95rem}
.message-meta>div{display:flex;flex-direction:column;gap:.15rem;min-width:0}
.message-meta strong{color:var(--ds-color-text);font-size:.78rem;font-weight:700}
.message-meta time{color:var(--ds-color-text-muted);font-size:.69rem}
.message-body{min-height:150px;padding:1.25rem 0;color:var(--ds-color-text);font-size:.85rem;line-height:2;white-space:pre-wrap;overflow-wrap:anywhere}
.message-footer{display:flex;align-items:center;gap:.4rem;padding-top:.75rem;border-top:1px solid var(--ds-color-border);color:var(--ds-color-text-muted);font-size:.7rem}
.message-footer i{color:var(--ds-color-primary-text)}
.reading-empty,.list-state{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:.55rem;min-height:280px;padding:1.5rem;color:var(--ds-color-text-muted);text-align:center}
.reading-empty-icon{display:grid;place-items:center;width:3rem;height:3rem;border-radius:50%;background:var(--ds-color-primary-soft);color:var(--ds-color-primary-text);font-size:1.1rem}
.reading-empty h2{margin:.15rem 0 0;color:var(--ds-color-text);font-size:.9rem}
.reading-empty p,.list-state p,.list-state span{margin:0;font-size:.76rem;line-height:1.8}
.empty-list>i{font-size:1.5rem}
.empty-list strong{color:var(--ds-color-text);font-size:.8rem}
.pagination{display:flex;align-items:center;justify-content:center;gap:.6rem;min-height:3rem;margin-top:auto;padding:.4rem;border-top:1px solid var(--ds-color-border)}
.pagination span{color:var(--ds-color-text-muted);font-size:.72rem;font-variant-numeric:tabular-nums}
.mail-page button{font-family:inherit}
.mail-page button:focus-visible,.mail-page a:focus-visible,.mail-page select:focus-visible{outline:2px solid var(--ds-color-focus);outline-offset:2px}
@media(max-width:1180px){.mail-layout{grid-template-columns:190px minmax(290px,1fr);min-height:620px}.reading-panel{grid-column:1/-1;border-top:1px solid var(--ds-color-border)}.message-list-panel{border-inline-end:0}}
@media(max-width:760px){.mail-page{padding:.65rem}.mail-header{align-items:flex-start;flex-direction:column;padding:.85rem}.header-actions{width:100%;justify-content:flex-start}.mail-toolbar{align-items:stretch}.search-box{max-width:none;flex-basis:100%}.toolbar-actions{justify-content:space-between}.mail-layout{grid-template-columns:minmax(0,1fr);min-height:0}.mail-sidebar{border-inline-end:0;border-bottom:1px solid var(--ds-color-border);padding:.7rem}.mail-sidebar .sidebar-heading,.mail-sidebar .sidebar-divider,.mail-sidebar .sidebar-note{display:none}.mail-sidebar .folder-link{display:inline-flex;width:auto;min-height:2.3rem;margin:.1rem}.message-list-panel{border-inline-end:0;border-bottom:1px solid var(--ds-color-border)}.message-row{padding-inline:.25rem}.row-select{flex-basis:1.8rem}.row-actions{gap:0}.message-detail{padding:1rem}}
@media(prefers-reduced-motion:reduce){.mail-page *,.mail-page *::before,.mail-page *::after{scroll-behavior:auto!important;transition-duration:.01ms!important;animation-duration:.01ms!important;animation-iteration-count:1!important}}


</style>