<script setup>
/**
 * DashboardHeader — professional SaaS-style top bar.
 *
 * One header shared by every dashboard role (Super Admin + Company users).
 * Purely presentational: it emits UI intents (toggle-sidebar, toggle-mobile)
 * and reads identity/theme from props. It never touches API calls or stores.
 *
 * Layout (RTL):
 *   [toggle] [company logo + name] [breadcrumb] ......... [search] [theme] [bell] [user ▾]
 *
 * Responsive:
 *   - Search collapses to an icon-triggered popover on small screens.
 *   - Breadcrumb + company name hide on narrow widths.
 */
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import Menu from 'primevue/menu'
import Badge from 'primevue/badge'
import Popover from 'primevue/popover'
import DashboardBreadcrumb from './DashboardBreadcrumb.vue'


const props = defineProps({
  // Whether the desktop sidebar is collapsed (affects the toggle icon).
  collapsed: { type: Boolean, default: false },
  // Whether the mobile navigation drawer is currently open.
  mobileOpen: { type: Boolean, default: false },
  // Optional live notification count for the bell badge.
  notificationCount: { type: Number, default: 0 },
  // User object from auth store.
  user: { type: Object, default: null },
  // Whether the user is a super admin.
  isSuperAdmin: { type: Boolean, default: false },
  // Whether the user is a company admin.
  isCompanyAdmin: { type: Boolean, default: false },
  // Current theme mode.
  isDark: { type: Boolean, default: false },
  // Current workspace context, supplied by the host application.
  workspaceLabel: { type: String, default: '' },
  // Route to the user's dashboard.
  dashboardRoute: { type: Object, default: () => ({ name: 'home' }) },
  // Route for the home breadcrumb.
  homeRoute: { type: Object, default: () => ({ name: 'home' }) },
  // Whether the header renders its own breadcrumb. Apps that show a per-page
  // breadcrumb (e.g. via PageHeader) can disable this to avoid duplication.
  showBreadcrumb: { type: Boolean, default: true },
})


const emit = defineEmits(['toggle-sidebar', 'toggle-mobile', 'toggle-theme', 'logout'])

const router = useRouter()

// ── Identity ────────────────────────────────────────────────
const displayName = computed(
  () => props.user?.displayName || props.user?.fullName || props.user?.username || 'کاربر'
)
const companyName = computed(() => props.user?.company?.name || '')
const companyLogo = computed(
  () => props.user?.company?.logoUrl || props.user?.company?.logo || ''
)
const roleLabel = computed(() => {
  if (props.isSuperAdmin) return 'مدیر کل'
  if (props.isCompanyAdmin) return 'مدیر شرکت'
  return 'کاربر'
})

// ── Search ──────────────────────────────────────────────────
const searchQuery = ref('')
const searchPanel = ref(null)

function submitSearch() {
  const q = searchQuery.value.trim()
  if (!q) return
  // The `search` route isn't registered in every app (e.g. the company app has
  // no dedicated search page). Guard so submitting never throws a router
  // "No match" error — no-op silently where search isn't available.
  if (router.hasRoute('search')) {
    router.push({ name: 'search', query: { q } })
  }
  searchPanel.value?.hide()
}

function toggleSearchPanel(event) {
  searchPanel.value?.toggle(event)
}

// ── User dropdown ───────────────────────────────────────────
const userMenu = ref(null)
const userMenuItems = computed(() => [
  { label: 'پروفایل من', icon: 'pi pi-user', command: () => router.push({ name: 'profile' }) },
  { label: 'داشبورد', icon: 'pi pi-th-large', command: () => router.push(dashboardRoute.value) },
  { separator: true },
  { label: 'خروج', icon: 'pi pi-sign-out', command: () => logout() },
])

function toggleUserMenu(event) {
  userMenu.value?.toggle(event)
}

function logout() {
  emit('logout')
}
</script>

<template>
  <header class="dash-header">
    <!-- Start: sidebar toggles, company identity, breadcrumb -->
    <div class="dash-header-start">
      <button
        type="button"
        class="dash-header-icon-btn dash-header-desktop-only"
        :aria-label="collapsed ? 'باز کردن منو' : 'جمع کردن منو'"
        :aria-expanded="!collapsed"
        aria-controls="dashboard-navigation"
        @click="emit('toggle-sidebar')"
      >
        <i class="pi" :class="collapsed ? 'pi-angle-double-right' : 'pi-bars'"></i>
      </button>

      <button
        type="button"
        class="dash-header-icon-btn dash-header-mobile-only"
        :aria-label="mobileOpen ? 'بستن منو' : 'باز کردن منو'"
        :aria-expanded="mobileOpen"
        aria-controls="dashboard-navigation"
        @click="emit('toggle-mobile')"
      >
        <i class="pi pi-bars"></i>
      </button>

      <div v-if="workspaceLabel" class="dash-header-workspace" aria-label="فضای کاری فعلی">
        <span class="dash-header-workspace-mark"><i class="pi pi-th-large"></i></span>
        <span class="dash-header-workspace-label">{{ workspaceLabel }}</span>
      </div>

      <!-- Company identity (logo + name) -->
      <div v-if="companyName" class="dash-header-company">
        <span class="dash-header-company-logo">
          <img v-if="companyLogo" :src="companyLogo" :alt="companyName" width="32" height="32" decoding="async" />
          <i v-else class="pi pi-building"></i>
        </span>
        <span class="dash-header-company-name">{{ companyName }}</span>
      </div>

      <span v-if="showBreadcrumb" class="dash-header-divider dash-header-desktop-only" aria-hidden="true"></span>

      <DashboardBreadcrumb v-if="showBreadcrumb" :home-route="homeRoute" class="dash-header-breadcrumb dash-header-desktop-only" />
    </div>

    <!-- End: search, theme, notifications, user -->
    <div class="dash-header-end">
      <!-- Inline search (desktop) -->
      <form class="dash-header-search dash-header-desktop-only" @submit.prevent="submitSearch">
        <i class="pi pi-search dash-header-search-icon" aria-hidden="true"></i>
        <input
          v-model="searchQuery"
          type="search"
          name="workspace-search"
          autocomplete="off"
          class="dash-header-search-input"
          placeholder="جستجو…"
          aria-label="جستجو"
        />
      </form>

      <!-- Search trigger (mobile) -->
      <button
        type="button"
        class="dash-header-icon-btn dash-header-mobile-only"
        aria-label="جستجو"
        aria-haspopup="dialog"
        @click="toggleSearchPanel"
      >
        <i class="pi pi-search"></i>
      </button>
      <Popover ref="searchPanel">
        <form class="dash-header-search-popover" @submit.prevent="submitSearch">
          <input
            v-model="searchQuery"
            type="search"
            name="workspace-search"
            autocomplete="off"
            class="dash-header-search-input"
            placeholder="جستجو…"
            aria-label="جستجو"
          />
        </form>
      </Popover>


      <!-- Theme switch -->
      <button
        type="button"
        class="dash-header-icon-btn"
        :aria-label="isDark ? 'حالت روشن' : 'حالت تیره'"
        :title="isDark ? 'تغییر به حالت روشن' : 'تغییر به حالت تیره'"
        @click="emit('toggle-theme')"
      >
        <i class="pi" :class="isDark ? 'pi-sun' : 'pi-moon'"></i>
      </button>

      <!-- Notifications -->
      <router-link
        :to="{ name: 'notifications' }"
        class="dash-header-icon-btn dash-header-bell"
        :aria-label="notificationCount > 0 ? `اعلان‌ها، ${notificationCount} خوانده‌نشده` : 'اعلان‌ها'"
      >
        <i class="pi pi-bell"></i>
        <Badge
          v-if="notificationCount > 0"
          :value="notificationCount"
          severity="danger"
          class="dash-header-bell-badge"
        />
      </router-link>

      <span class="dash-header-divider" aria-hidden="true"></span>

      <!-- User dropdown -->
      <button
        type="button"
        class="dash-header-user"
        aria-haspopup="menu"
        :aria-label="`منوی حساب کاربری، ${displayName}`"
        @click="toggleUserMenu"
      >
        <span class="dash-header-avatar">
          <img v-if="user?.avatarUrl" :src="user.avatarUrl" alt="" width="32" height="32" decoding="async" />
          <span v-else>{{ displayName.charAt(0) }}</span>
        </span>
        <span class="dash-header-user-meta">
          <span class="dash-header-user-name">{{ displayName }}</span>
          <span class="dash-header-user-role">{{ roleLabel }}</span>
        </span>
        <i class="pi pi-chevron-down dash-header-user-caret"></i>
      </button>

      <Menu ref="userMenu" :model="userMenuItems" :popup="true" class="dash-header-user-menu">
        <template #start>
          <div class="dash-header-user-card">
            <span class="dash-header-avatar dash-header-avatar--lg">
              <img v-if="user?.avatarUrl" :src="user.avatarUrl" alt="" width="44" height="44" decoding="async" />
              <span v-else>{{ displayName.charAt(0) }}</span>
            </span>
            <div class="dash-header-user-card-meta">
              <span class="dash-header-user-card-name">{{ displayName }}</span>
              <span class="dash-header-user-card-role">{{ roleLabel }}</span>
              <span v-if="companyName" class="dash-header-user-card-company">
                <i class="pi pi-building"></i> {{ companyName }}
              </span>
            </div>
          </div>
        </template>
      </Menu>
    </div>
  </header>
</template>

<style scoped>

.dash-header{position:sticky;top:0;z-index:100;display:flex;align-items:center;justify-content:space-between;gap:1rem;height:68px;padding:0 1.5rem;background:rgba(255,255,255,.94);border-bottom:1px solid var(--tm-line);box-shadow:0 2px 12px rgba(30,74,120,.035);backdrop-filter:blur(14px)}
.dash-header-start,.dash-header-end{display:flex;align-items:center;gap:.55rem;min-width:0}.dash-header-start{flex:1}
.dash-header-icon-btn{position:relative;display:inline-flex;align-items:center;justify-content:center;width:2.55rem;height:2.55rem;min-width:2.55rem;border:1px solid transparent;border-radius:50%;background:var(--tm-surface-alt);color:var(--tm-ink-soft);text-decoration:none;cursor:pointer;transition:.18s}
.dash-header-icon-btn:hover{border-color:var(--tm-line-strong);background:var(--tm-cyan-soft);color:var(--tm-cyan-deep)}.dash-header-icon-btn:focus-visible,.dash-header-user:focus-visible{outline:2px solid var(--tm-cyan);outline-offset:2px}.dash-header-icon-btn i{font-size:1.05rem}
.dash-header-bell-badge{position:absolute;top:-.12rem;inset-inline-end:-.12rem;transform:scale(.78);transform-origin:top right}
.dash-header-divider{width:1px;height:1.6rem;background:var(--tm-line);margin:0 .25rem;flex-shrink:0}
.dash-header-company{display:flex;align-items:center;gap:.5rem;min-width:0}.dash-header-company-logo{display:inline-flex;align-items:center;justify-content:center;width:2rem;height:2rem;overflow:hidden;flex-shrink:0;border-radius:9px;background:var(--tm-cyan-soft);color:var(--tm-cyan-deep)}.dash-header-company-logo img{width:100%;height:100%;object-fit:cover}.dash-header-company-name{max-width:12rem;overflow:hidden;color:var(--tm-ink);font-size:.8rem;font-weight:700;text-overflow:ellipsis;white-space:nowrap}
.dash-header-breadcrumb{min-width:0}
.dash-header-search{position:relative;display:flex;align-items:center}.dash-header-search-icon{position:absolute;inset-inline-start:.9rem;color:var(--tm-muted);font-size:.95rem;pointer-events:none}.dash-header-search-input{width:min(38vw,27rem);height:2.65rem;padding:0 .95rem;padding-inline-start:2.5rem;border:1px solid transparent;border-radius:999px;outline:0;background:var(--tm-surface-alt);color:var(--tm-ink);font-family:inherit;font-size:.78rem;transition:.18s}.dash-header-search-input::placeholder{color:var(--tm-faint)}.dash-header-search-input:focus{border-color:var(--tm-cyan);background:#fff;box-shadow:0 0 0 3px rgba(18,184,208,.12)}.dash-header-search-popover .dash-header-search-input{width:min(70vw,20rem);padding-inline-start:.9rem}
.dash-header-user{display:inline-flex;align-items:center;gap:.55rem;min-height:2.55rem;padding:.25rem .65rem;border:1px solid var(--tm-line);border-radius:999px;background:var(--tm-surface-alt);color:var(--tm-ink);cursor:pointer}.dash-header-user:hover{background:var(--tm-cyan-soft)}.dash-header-avatar{display:inline-flex;align-items:center;justify-content:center;width:2rem;height:2rem;overflow:hidden;flex-shrink:0;border-radius:50%;background:var(--tm-cyan-strong);color:#fff;font-size:.82rem;font-weight:800}.dash-header-avatar img{width:100%;height:100%;object-fit:cover}.dash-header-avatar--lg{width:2.75rem;height:2.75rem;font-size:1rem}
.dash-header-user-meta{display:flex;flex-direction:column;line-height:1.25;text-align:start}.dash-header-user-name{max-width:9rem;overflow:hidden;font-size:.77rem;font-weight:700;text-overflow:ellipsis;white-space:nowrap}.dash-header-user-role{color:var(--tm-muted);font-size:.65rem}.dash-header-user-caret{color:var(--tm-muted);font-size:.65rem}
.dash-header-user-card{display:flex;align-items:center;gap:.75rem;min-width:15rem;padding:1rem;border-bottom:1px solid var(--tm-line)}.dash-header-user-card-meta{display:flex;flex-direction:column;gap:.15rem;min-width:0}.dash-header-user-card-name{color:var(--tm-ink);font-size:.9rem;font-weight:700}.dash-header-user-card-role,.dash-header-user-card-company{color:var(--tm-muted);font-size:.72rem}.dash-header-user-card-company{display:inline-flex;align-items:center;gap:.3rem;margin-top:.15rem}
.dash-header-mobile-only{display:inline-flex}.dash-header-desktop-only{display:none}
@media(min-width:992px){.dash-header-mobile-only{display:none}.dash-header-desktop-only{display:inline-flex}.dash-header-breadcrumb.dash-header-desktop-only{display:flex}}
@media(max-width:575px){.dash-header{height:60px;padding:0 .65rem}.dash-header-company-name,.dash-header-user-meta,.dash-header-user-caret{display:none}.dash-header-search-input{width:2.55rem;padding:0}.dash-header-search-icon{display:none}.dash-header-workspace{display:none}}
@media(prefers-reduced-motion:reduce){.dash-header *{transition:none!important}}

</style>