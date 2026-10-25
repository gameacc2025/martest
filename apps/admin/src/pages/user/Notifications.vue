<script setup>
import { ref, computed, onMounted } from 'vue'
import { useToast } from 'primevue/usetoast'
import { apiGet, apiGetPaginated, apiPatch, apiDelete, apiPost } from '@telecom/shared-core/http/apiClient'
import { endpoints } from '@telecom/api-client'
import Button from 'primevue/button'
import ProgressSpinner from 'primevue/progressspinner'

const toast = useToast()
const notifications = ref([])
const unreadCount = ref(0)
const loading = ref(false)
const page = ref(1)
const totalPages = ref(1)
const total = ref(0)
const selectedId = ref(null)
const activeFolder = ref('all')
const activeCategory = ref('all')
const searchQuery = ref('')
const busyIds = ref(new Set())
const userFolders = ref([])
const targetFolderId = ref(null)
const appScope = 'ADMIN'

const folders = computed(() => [
  { id: 'all', label: 'همه پیام‌ها', icon: 'pi-inbox', count: total.value },
  { id: 'unread', label: 'خوانده‌نشده', icon: 'pi-envelope', count: unreadCount.value },
  { id: 'read', label: 'خوانده‌شده', icon: 'pi-check-circle', count: Math.max(0, total.value - unreadCount.value) },
  ...userFolders.value.map(folder => ({
    id: folder.id,
    label: folder.name,
    icon: folder.key === 'SAVED' ? 'pi-bookmark' : folder.key === 'INBOX' ? 'pi-inbox' : 'pi-folder',
    count: notifications.value.filter(item => (item.folderMemberships || []).some(m => m.folderId === folder.id || m.folder?.id === folder.id)).length,
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
    if (activeCategory.value !== 'all' && categoryFor(item) !== activeCategory.value) return false
    if (query && ![item.title, item.message, item.type].some(value => String(value || '').toLocaleLowerCase().includes(query))) return false
    return true
  })
})

const selectedNotification = computed(() =>
  visibleNotifications.value.find(item => item.id === selectedId.value) || null
)

const activeCategoryLabel = computed(() => {
  if (activeCategory.value === 'all') return 'همه دسته‌ها'
  return categoryDefinitions.find(item => item.id === activeCategory.value)?.label || 'سایر پیام‌ها'
})

onMounted(async () => {
  // Load server-managed folders before displaying messages.
  await fetchUserFolders()
  // Keep the unread counter in sync after the initially opened message is marked read.
  await fetchNotifications()
  await fetchUnreadCount()
})

async function fetchUserFolders() {
  try {
    const result = await apiGet(endpoints.notifications.folders(appScope))
    userFolders.value = Array.isArray(result) ? result : []
    const saved = userFolders.value.find(folder => folder.key === 'SAVED')
    targetFolderId.value = saved?.id ?? userFolders.value.find(folder => !folder.isSystem)?.id ?? null
  } catch {
    toast.add({ severity: 'error', summary: 'خطا', detail: 'دریافت پوشه‌ها انجام نشد.', life: 3000 })
  }
}

async function fetchNotifications() {
  loading.value = true
  try {
    const folderQuery = Number.isInteger(Number(activeFolder.value)) ? `&folderId=${Number(activeFolder.value)}` : ''
    const result = await apiGetPaginated(`${endpoints.notifications.list}?page=${page.value}&limit=20${folderQuery}`)
    const normalized = normalizeNotificationPage(result)
    notifications.value = normalized.data
    total.value = Number(normalized.meta?.total ?? notifications.value.length)
    totalPages.value = Math.max(1, Number(normalized.meta?.totalPages || 1))
    let openedNotification = notifications.value.find(item => item.id === selectedId.value)
    if (!openedNotification) {
      openedNotification = notifications.value[0] ?? null
      selectedId.value = openedNotification?.id ?? null
    }

    // The reading pane opens this message automatically, so persist its read state too.
    if (openedNotification && !openedNotification.isRead) {
      await markAsRead(openedNotification)
    }
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
}

function openNotification(item) {
  selectedId.value = item.id
  if (!item.isRead) markAsRead(item)
}

async function markAsRead(item) {
  if (item.isRead || busyIds.value.has(item.id)) return
  setBusy(item.id, true)
  try {
    await apiPatch(endpoints.notifications.read(item.id))
    item.isRead = true
    unreadCount.value = Math.max(0, unreadCount.value - 1)
  } catch {
    toast.add({ severity: 'error', summary: 'خطا', detail: 'وضعیت پیام به‌روزرسانی نشد.', life: 3000 })
  } finally {
    setBusy(item.id, false)
  }
}

async function markAllAsRead() {
  if (!unreadCount.value) return
  try {
    await apiPatch(endpoints.notifications.readAll)
    notifications.value.forEach(item => { item.isRead = true })
    unreadCount.value = 0
    toast.add({ severity: 'success', summary: 'انجام شد', detail: 'همه پیام‌های این صفحه خوانده شدند.', life: 3000 })
  } catch {
    toast.add({ severity: 'error', summary: 'خطا', detail: 'علامت‌گذاری پیام‌ها انجام نشد.', life: 3000 })
  }
}

async function deleteNotification(item) {
  try {
    await apiDelete(endpoints.notifications.remove(item.id))
    notifications.value = notifications.value.filter(row => row.id !== item.id)
    total.value = Math.max(0, total.value - 1)
    if (!item.isRead) unreadCount.value = Math.max(0, unreadCount.value - 1)
    if (selectedId.value === item.id) selectedId.value = visibleNotifications.value[0]?.id ?? notifications.value[0]?.id ?? null
    toast.add({ severity: 'success', summary: 'حذف شد', detail: 'پیام حذف شد.', life: 2500 })
  } catch {
    toast.add({ severity: 'error', summary: 'خطا', detail: 'حذف پیام انجام نشد.', life: 3000 })
  }
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
      folderId: Number(folderId), action, app: appScope,
      ...(action === 'move' && sourceFolderId ? { sourceFolderId } : {}),
    })
    toast.add({ severity: 'success', summary: 'انجام شد', detail: action === 'copy' ? 'پیام در پوشه مقصد هم قرار گرفت.' : 'پیام به پوشه مقصد منتقل شد.', life: 2500 })
    await fetchNotifications()
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
  selectedId.value = null
  if (folder === 'all' || Number.isInteger(Number(folder))) activeCategory.value = 'all'
  fetchNotifications()
}

function selectCategory(category) {
  activeCategory.value = category
  selectedId.value = null
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
      <div>
        <p class="eyebrow">مرکز پیام‌ها</p>
        <h1>صندوق اعلان‌های مدیریت</h1>
        <p class="subtitle">اعلان‌های دریافتی حساب مدیریتی را دسته‌بندی و مدیریت کنید.</p>
      </div>
      <div class="header-actions">
        <span class="unread-total"><i class="pi pi-envelope"></i>{{ unreadCount }} خوانده‌نشده</span>
        <router-link to="/notification-preferences" class="settings-link"><i class="pi pi-cog"></i> تنظیمات</router-link>
        <router-link to="/notification-management" class="settings-link"><i class="pi pi-send"></i> مدیریت و ارسال</router-link>
      </div>
    </header>

    <div class="mail-toolbar">
      <label class="search-box">
        <i class="pi pi-search" aria-hidden="true"></i>
        <input v-model="searchQuery" type="search" placeholder="جستجو در عنوان و متن پیام‌ها…" aria-label="جستجو در پیام‌ها">
        <button v-if="searchQuery" type="button" class="clear-search" aria-label="پاک کردن جستجو" @click="searchQuery = ''"><i class="pi pi-times"></i></button>
      </label>
      <div class="toolbar-actions">
        <span class="result-count">{{ visibleNotifications.length }} پیام در این صفحه</span>
        <Button v-if="unreadCount > 0" label="خواندن همه" icon="pi pi-check-circle" severity="secondary" text @click="markAllAsRead" />
        <Button icon="pi pi-refresh" severity="secondary" text rounded aria-label="تازه‌سازی پیام‌ها" :loading="loading" @click="fetchNotifications(); fetchUnreadCount()" />
      </div>
    </div>

    <div class="mail-layout">
      <aside class="mail-sidebar" aria-label="پوشه‌ها و دسته‌بندی پیام‌ها">
        <p class="sidebar-heading">پوشه‌ها</p>
        <button v-for="folder in folders" :key="folder.id" type="button" class="folder-link"
          :class="{ active: activeFolder === folder.id && activeCategory === 'all' }" @click="selectFolder(folder.id)">
          <i :class="['pi', folder.icon]" aria-hidden="true"></i>
          <span>{{ folder.label }}</span>
          <b v-if="folder.count">{{ folder.count }}</b>
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
          <span class="list-count">{{ visibleNotifications.length }}</span>
        </div>

        <div v-if="loading && !notifications.length" class="list-state"><ProgressSpinner /><p>در حال دریافت پیام‌ها…</p></div>
        <div v-else-if="!visibleNotifications.length" class="list-state empty-list">
          <i class="pi pi-inbox"></i>
          <strong>پیامی پیدا نشد</strong>
          <span>{{ searchQuery ? 'عبارت دیگری را جستجو کنید.' : 'در این پوشه اعلانی وجود ندارد.' }}</span>
        </div>
        <div v-else class="message-items">
          <button v-for="item in visibleNotifications" :key="item.id" type="button" class="message-row"
            :class="{ selected: selectedId === item.id, unread: !item.isRead }" @click="openNotification(item)">
            <span class="row-status" :class="{ 'is-unread': !item.isRead }"><i :class="['pi', item.isRead ? 'pi-envelope-open' : 'pi-envelope']"></i></span>
            <span class="row-content">
              <span class="row-topline"><strong>{{ item.title }}</strong><time>{{ formatTime(item.createdAt) }}</time></span>
              <span class="row-category">{{ typeLabel(item) }}</span>
              <span class="row-preview">{{ item.message }}</span>
            </span>
            <span v-if="!item.isRead" class="unread-dot" aria-label="خوانده‌نشده"></span>
          </button>
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
              <Button v-if="!selectedNotification.isRead" icon="pi pi-envelope-open" severity="secondary" text rounded aria-label="علامت‌گذاری به‌عنوان خوانده‌شده" :loading="busyIds.has(selectedNotification.id)" @click="markAsRead(selectedNotification)" />
              <Button icon="pi pi-trash" severity="danger" text rounded aria-label="حذف پیام" @click="deleteNotification(selectedNotification)" />
            </div>
          </div>
          <article class="message-detail">
            <h2>{{ selectedNotification.title }}</h2>
            <div class="message-meta">
              <span class="sender-avatar"><i class="pi pi-bell"></i></span>
              <div><strong>سامانه مخابرات</strong><time>{{ formatFullDate(selectedNotification.createdAt) }}</time></div>
            </div>
            <div class="message-body">{{ selectedNotification.message }}</div>
            <div class="folder-actions">
              <Button label="ذخیره‌شده‌ها" icon="pi pi-bookmark" severity="secondary" outlined @click="saveNotification(selectedNotification)" />
              <label class="folder-target">پوشه مقصد
                <select v-model="targetFolderId" aria-label="پوشه مقصد">
                  <option v-for="folder in userFolders" :key="folder.id" :value="folder.id">{{ folder.name }}</option>
                </select>
              </label>
              <Button label="کپی" icon="pi pi-copy" severity="secondary" outlined @click="applyFolderAction(selectedNotification, 'copy')" />
              <Button label="انتقال" icon="pi pi-folder-open" severity="secondary" @click="applyFolderAction(selectedNotification, 'move')" />
            </div>
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
.mail-page{direction:rtl;color:var(--text-color);min-width:0}
.mail-header{display:flex;align-items:center;justify-content:space-between;gap:1rem;flex-wrap:wrap;margin-bottom:1.25rem}
.eyebrow{margin:0 0 .25rem;color:var(--primary-color);font-size:.8rem;font-weight:700}
.mail-header h1{margin:0;font-size:1.55rem;font-weight:800;letter-spacing:-.02em}
.subtitle{margin:.4rem 0 0;color:var(--text-color-secondary);font-size:.9rem}
.header-actions,.toolbar-actions{display:flex;align-items:center;gap:.6rem;flex-wrap:wrap}
.unread-total,.settings-link{display:inline-flex;align-items:center;gap:.45rem;border-radius:8px;padding:.6rem .8rem;font-size:.85rem}
.unread-total{background:color-mix(in srgb,var(--primary-color) 10%,var(--surface-card));color:var(--primary-color);font-weight:700}
.settings-link{border:1px solid var(--surface-border);color:var(--text-color);text-decoration:none;background:var(--surface-card)}
.settings-link:hover{background:var(--surface-hover)}
.mail-toolbar{display:flex;justify-content:space-between;align-items:center;gap:.8rem;flex-wrap:wrap;margin-bottom:1rem}
.search-box{display:flex;align-items:center;gap:.6rem;flex:1;min-width:220px;max-width:560px;padding:.15rem .85rem;border:1px solid var(--surface-border);border-radius:9px;background:var(--surface-card);color:var(--text-color-secondary)}
.search-box:focus-within{border-color:var(--primary-color);box-shadow:0 0 0 2px color-mix(in srgb,var(--primary-color) 14%,transparent)}
.search-box input{width:100%;min-width:0;border:0;outline:0;background:transparent;color:var(--text-color);font:inherit;font-size:.88rem;padding:.65rem 0}
.search-box input::placeholder{color:var(--text-color-secondary)}
.clear-search{border:0;background:transparent;color:var(--text-color-secondary);cursor:pointer;padding:.3rem}
.result-count{font-size:.8rem;color:var(--text-color-secondary)}
.mail-layout{display:grid;grid-template-columns:190px minmax(280px,.95fr) minmax(320px,1.2fr);min-height:560px;border:1px solid var(--surface-border);border-radius:12px;background:var(--surface-card);overflow:hidden}
.mail-sidebar{padding:1rem .65rem;background:var(--surface-ground);border-left:1px solid var(--surface-border)}
.sidebar-heading{margin:.2rem .55rem .6rem;font-size:.73rem;font-weight:800;color:var(--text-color-secondary)}
.folder-link{display:flex;align-items:center;gap:.65rem;width:100%;min-height:39px;padding:.55rem .65rem;border:0;border-radius:7px;background:transparent;color:var(--text-color);text-align:right;font:inherit;font-size:.82rem;cursor:pointer}
.folder-link>i{width:1rem;color:var(--text-color-secondary);font-size:.9rem}
.folder-link span{flex:1}
.folder-link b{font-size:.72rem;color:var(--text-color-secondary);font-weight:600}
.folder-link:hover{background:var(--surface-hover)}
.folder-link.active{background:color-mix(in srgb,var(--primary-color) 12%,var(--surface-card));color:var(--primary-color);font-weight:700}
.folder-link.active>i,.folder-link.active b{color:var(--primary-color)}
.sidebar-divider{height:1px;background:var(--surface-border);margin:1rem .45rem}
.category-link{min-height:35px;font-size:.78rem}
.sidebar-note{display:flex;align-items:flex-start;gap:.45rem;margin:1.2rem .4rem .3rem;padding:.7rem;border:1px solid var(--surface-border);border-radius:8px;color:var(--text-color-secondary);font-size:.7rem;line-height:1.7}
.sidebar-note i{margin-top:.15rem;color:var(--primary-color)}
.message-list-panel{min-width:0;border-left:1px solid var(--surface-border);display:flex;flex-direction:column}
.list-heading{display:flex;align-items:center;justify-content:space-between;gap:.6rem;padding:.9rem 1rem;border-bottom:1px solid var(--surface-border)}
.list-heading h2{margin:0 0 .2rem;font-size:.95rem;font-weight:800}
.list-heading span{font-size:.73rem;color:var(--text-color-secondary)}
.list-count{display:grid;place-items:center;min-width:1.6rem;height:1.6rem;border-radius:6px;background:var(--surface-ground);color:var(--text-color-secondary);font-weight:700}
.message-items{flex:1}
.message-row{display:flex;align-items:flex-start;gap:.6rem;width:100%;padding:.85rem .75rem;border:0;border-bottom:1px solid var(--surface-border);background:var(--surface-card);color:var(--text-color);text-align:right;font:inherit;cursor:pointer}
.message-row:hover{background:var(--surface-hover)}
.message-row.selected{background:color-mix(in srgb,var(--primary-color) 8%,var(--surface-card));box-shadow:inset -3px 0 var(--primary-color)}
.message-row.unread .row-content>span:first-child strong{font-weight:800}
.row-status{display:grid;place-items:center;flex:none;width:1.8rem;height:1.8rem;border-radius:50%;background:var(--surface-ground);color:var(--text-color-secondary);font-size:.75rem}
.row-status.is-unread{background:color-mix(in srgb,var(--primary-color) 13%,var(--surface-card));color:var(--primary-color)}
.row-content{display:flex;flex-direction:column;gap:.3rem;min-width:0;flex:1}
.row-topline{display:flex;justify-content:space-between;align-items:baseline;gap:.5rem}
.row-topline strong{min-width:0;font-size:.82rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.row-topline time{flex:none;font-size:.66rem;color:var(--text-color-secondary)}
.row-category{font-size:.7rem;color:var(--primary-color);font-weight:700}
.row-preview{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;color:var(--text-color-secondary);font-size:.75rem;line-height:1.7;overflow-wrap:anywhere}
.unread-dot{width:7px;height:7px;flex:none;margin-top:.5rem;border-radius:50%;background:var(--primary-color)}
.reading-panel{min-width:0;background:var(--surface-card)}
.reading-toolbar{display:flex;align-items:center;justify-content:space-between;gap:.5rem;padding:.6rem .85rem;border-bottom:1px solid var(--surface-border)}
.reading-category{display:inline-flex;align-items:center;gap:.4rem;color:var(--text-color-secondary);font-size:.75rem}
.reading-category i{color:var(--primary-color)}
.reading-actions{display:flex;gap:.15rem}
.message-detail{padding:1.4rem 1.35rem}
.message-detail>h2{margin:0 0 1.3rem;font-size:1.25rem;line-height:1.8;font-weight:800;overflow-wrap:anywhere}
.message-meta{display:flex;align-items:center;gap:.7rem;padding-bottom:1.15rem;border-bottom:1px solid var(--surface-border)}
.sender-avatar{display:grid;place-items:center;width:2.5rem;height:2.5rem;flex:none;border-radius:50%;background:color-mix(in srgb,var(--primary-color) 12%,var(--surface-card));color:var(--primary-color)}
.message-meta>div{display:flex;flex-direction:column;gap:.25rem;min-width:0}
.message-meta strong{font-size:.82rem}
.message-meta time{font-size:.72rem;color:var(--text-color-secondary)}
.message-body{padding:1.2rem 0;white-space:pre-wrap;overflow-wrap:anywhere;line-height:2;font-size:.9rem;min-height:130px}
.message-footer{display:flex;align-items:center;gap:.45rem;padding-top:.8rem;border-top:1px solid var(--surface-border);font-size:.73rem;color:var(--text-color-secondary)}
.message-footer i{color:var(--primary-color)}
.reading-empty,.list-state{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:.6rem;min-height:300px;padding:2rem;text-align:center;color:var(--text-color-secondary)}
.reading-empty-icon{display:grid;place-items:center;width:3.5rem;height:3.5rem;border-radius:50%;background:var(--surface-ground);color:var(--primary-color);font-size:1.3rem}
.reading-empty h2{margin:.2rem 0 0;color:var(--text-color);font-size:1rem}
.reading-empty p,.list-state span,.list-state p{margin:0;font-size:.8rem;line-height:1.8}
.empty-list>i{font-size:1.7rem;opacity:.65}
.empty-list strong{font-size:.85rem;color:var(--text-color)}
.pagination{display:flex;align-items:center;justify-content:center;gap:.65rem;padding:.55rem;border-top:1px solid var(--surface-border);margin-top:auto}
.pagination span{font-size:.75rem;color:var(--text-color-secondary)}
@media(max-width:1180px){.mail-layout{grid-template-columns:170px minmax(260px,1fr)}.reading-panel{grid-column:1/-1;border-top:1px solid var(--surface-border)}.message-list-panel{border-left:0}.reading-panel .message-detail{padding:1rem 1.2rem}}
@media(max-width:700px){.mail-header{align-items:flex-start}.mail-header h1{font-size:1.35rem}.mail-layout{grid-template-columns:minmax(0,1fr)}.mail-sidebar{border-left:0;border-bottom:1px solid var(--surface-border);padding:.8rem}.mail-sidebar .folder-link{display:inline-flex;width:auto;margin:.1rem}.mail-sidebar .sidebar-heading,.mail-sidebar .sidebar-divider,.mail-sidebar .sidebar-note{display:none}.mail-sidebar .category-link{font-size:.75rem}.message-list-panel{border-bottom:1px solid var(--surface-border)}.reading-panel{grid-column:auto}.mail-toolbar{align-items:stretch}.search-box{max-width:none}.toolbar-actions{justify-content:space-between}.message-detail{padding:1rem}.row-topline{align-items:flex-start;flex-direction:column;gap:.15rem}}

.folder-actions{display:flex;align-items:center;gap:.65rem;flex-wrap:wrap;margin-top:1.25rem;padding-top:1rem;border-top:1px solid var(--surface-border,#e5e7eb)}
.folder-target{display:flex;align-items:center;gap:.5rem;font-size:.9rem}
.folder-target select{max-width:15rem;min-width:10rem;padding:.55rem;border:1px solid var(--surface-border,#d1d5db);border-radius:6px;background:var(--surface-card,#fff);color:inherit}
@media(max-width:560px){.folder-actions{align-items:stretch;flex-direction:column}.folder-target{align-items:stretch;flex-direction:column}.folder-target select{max-width:none;width:100%}}
</style>
