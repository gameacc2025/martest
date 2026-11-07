<script setup>
/**
 * DashboardHeader — tem-style top bar (`tem/telecom.html` `.tp`).
 *
 * One header shared by every dashboard role (Super Admin + Company users).
 * Purely presentational: it emits UI intents (toggle-sidebar, toggle-mobile)
 * and reads identity/theme from props. It never touches API calls or stores.
 *
 * Composition (RTL, matching the reference):
 *   [nav toggles + workspace/breadcrumb] .... [search pill] [theme] [bell] [user ▾]
 *
 * Responsive:
 *   - Search collapses to an icon-triggered popover on small screens.
 *   - Workspace/breadcrumb hide on narrow widths.
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
    <!-- Start: navigation toggles, workspace context, breadcrumb -->
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

      <!-- Company identity (logo + name) -->
      <div v-if="companyName" class="dash-header-company">
        <span class="dash-header-company-logo">
          <img v-if="companyLogo" :src="companyLogo" :alt="companyName" width="28" height="28" decoding="async" />
          <i v-else class="pi pi-building"></i>
        </span>
        <span class="dash-header-company-name">{{ companyName }}</span>
      </div>

      <DashboardBreadcrumb
        v-if="showBreadcrumb"
        :home-route="homeRoute"
        class="dash-header-breadcrumb dash-header-desktop-only"
      />
    </div>

    <!-- End: search pill, icon buttons, account chip -->
    <div class="dash-header-end">
      <!-- Inline search pill (desktop) — tem `.sr` -->
      <form class="dash-header-pill dash-header-desktop-only" role="search" @submit.prevent="submitSearch">
        <input
          v-model="searchQuery"
          type="search"
          name="workspace-search"
          autocomplete="off"
          class="dash-header-pill-input"
          placeholder="جستجو در محصولات، شرکت‌ها و ..."
          aria-label="جستجو"
        />
        <button type="submit" class="dash-header-pill-go" aria-label="جستجو">
          <i class="pi pi-search" aria-hidden="true"></i>
        </button>
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
        <form class="dash-header-search-popover" role="search" @submit.prevent="submitSearch">
          <input
            v-model="searchQuery"
            type="search"
            name="workspace-search"
            autocomplete="off"
            class="dash-header-pill-input"
            placeholder="جستجو..."
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

      <slot name="messages" />

      <!-- User chip — tem `.us` -->
      <button
        type="button"
        class="dash-header-user"
        aria-haspopup="menu"
        :aria-label="`منوی حساب کاربری، ${displayName}`"
        @click="toggleUserMenu"
      >
        <span class="dash-header-avatar">
          <img v-if="user?.avatarUrl" :src="user.avatarUrl" alt="" width="40" height="40" decoding="async" />
          <span v-else>{{ displayName.charAt(0) }}</span>
        </span>
        <span class="dash-header-user-meta">
          <span class="dash-header-user-name">{{ displayName }} <i class="pi pi-chevron-down dash-header-user-caret"></i></span>
          <span class="dash-header-user-role">{{ roleLabel }}</span>
        </span>
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
/* tem `.tp` — a calm top row floating on the pale canvas; no card or rule. */
.dash-header {
  position: sticky;
  top: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  min-height: 72px;
  padding: 14px clamp(14px, 1.6vw, 24px);
  background: var(--ds-header-bg);
  border: 0;
  box-shadow: none;
}
.dash-header-start,
.dash-header-end { display: flex; align-items: center; gap: 12px; min-width: 0; }
.dash-header-start { flex: 0 1 auto; }
.dash-header-end { flex: 1 1 auto; justify-content: flex-end; }

/* tem `.ib` — round, light, softly shadowed icon button. */
.dash-header-icon-btn {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 46px;
  height: 46px;
  min-width: 46px;
  border: 0;
  border-radius: 50%;
  background: var(--ds-color-surface-hover);
  color: var(--tm-ink-soft);
  box-shadow: 0 2px 6px rgba(20, 40, 90, 0.08);
  text-decoration: none;
  cursor: pointer;
  transition: background-color 0.16s ease, color 0.16s ease;
}
.dash-header-icon-btn:hover { background: var(--tm-cyan-soft); color: var(--tm-cyan-deep); }
.dash-header-icon-btn:focus-visible,
.dash-header-user:focus-visible,
.dash-header-pill-go:focus-visible { outline: 2px solid var(--tm-cyan-strong); outline-offset: 2px; }
.dash-header-icon-btn i { font-size: 18px; }
.dash-header-bell-badge { position: absolute; top: -2px; inset-inline-end: -2px; transform: scale(0.8); transform-origin: top right; }

/* tem `.sr` — wide pill search field. */
.dash-header-pill {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex: 1 1 auto;
  min-width: 0;
  max-width: 520px;
  height: 46px;
  padding: 0 18px 0 8px;
  border-radius: 6px;
  background: var(--ds-color-surface-hover);
  box-shadow: 0 2px 6px rgba(20, 40, 90, 0.05);
}
.dash-header-pill-input {
  flex: 1;
  min-width: 0;
  height: 100%;
  padding: 0;
  border: 0;
  outline: 0;
  background: transparent;
  color: var(--tm-ink);
  font-family: inherit;
  font-size: 14px;
}
.dash-header-pill-input::placeholder { color: var(--ds-text-secondary); }
.dash-header-pill-go {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  flex: none;
  border: 0;
  border-radius: 50%;
  background: transparent;
  color: var(--ds-text-secondary);
  cursor: pointer;
}
.dash-header-pill-go:hover { color: var(--tm-blue); }
.dash-header-search-popover .dash-header-pill-input {
  width: min(70vw, 20rem);
  height: 40px;
  padding: 0 14px;
  border-radius: 6px;
  background: var(--ds-color-surface-hover);
}

/* Company identity */
.dash-header-company { display: flex; align-items: center; gap: 8px; min-width: 0; }
.dash-header-company-logo {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  overflow: hidden;
  flex-shrink: 0;
  border-radius: 6px;
  background: var(--tm-cyan-soft);
  color: var(--tm-cyan-deep);
}
.dash-header-company-logo img { width: 100%; height: 100%; object-fit: cover; }
.dash-header-company-name {
  max-width: 12rem;
  overflow: hidden;
  color: var(--tm-ink);
  font-size: 13px;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.dash-header-breadcrumb { min-width: 0; }

/* tem `.us` — avatar + name + role. */
.dash-header-user {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  min-height: 46px;
  padding: 3px 10px 3px 4px;
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: var(--tm-ink);
  cursor: pointer;
}
.dash-header-user:hover { background: var(--ds-color-surface-hover); }
.dash-header-avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  overflow: hidden;
  flex-shrink: 0;
  border-radius: 50%;
  background: var(--ds-brand-secondary);
  color: #fff;
  font-size: 16px;
  font-weight: 700;
}
.dash-header-avatar img { width: 100%; height: 100%; object-fit: cover; }
.dash-header-avatar--lg { width: 44px; height: 44px; font-size: 18px; }
.dash-header-user-meta { display: flex; flex-direction: column; line-height: 1.3; text-align: start; }
.dash-header-user-name {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  max-width: 10rem;
  overflow: hidden;
  font-size: 14px;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.dash-header-user-caret { font-size: 10px; color: var(--tm-muted); }
.dash-header-user-role { color: var(--ds-text-muted); font-size: 11px; }
.dash-header-user-card { display: flex; align-items: center; gap: 0.75rem; min-width: 15rem; padding: 1rem; border-bottom: 1px solid var(--tm-line); }
.dash-header-user-card-meta { display: flex; flex-direction: column; gap: 0.15rem; min-width: 0; }
.dash-header-user-card-name { color: var(--tm-ink); font-size: 0.9rem; font-weight: 700; }
.dash-header-user-card-role,
.dash-header-user-card-company { color: var(--tm-muted); font-size: 0.72rem; }
.dash-header-user-card-company { display: inline-flex; align-items: center; gap: 0.3rem; margin-top: 0.15rem; }

.dash-header-mobile-only { display: inline-flex; }
.dash-header-desktop-only { display: none; }
@media (min-width: 992px) {
  .dash-header-mobile-only { display: none; }
  .dash-header-desktop-only { display: inline-flex; }
  .dash-header-pill.dash-header-desktop-only { display: flex; }
  .dash-header-breadcrumb.dash-header-desktop-only { display: flex; }
}
@media (max-width: 991px) {
  .dash-header { gap: 10px; }
}
@media (max-width: 575px) {
  .dash-header { min-height: 64px; padding: 10px 12px; }
  .dash-header-company-name,
  .dash-header-user-meta { display: none; }
  .dash-header-icon-btn { width: 42px; height: 42px; min-width: 42px; }
}
@media (prefers-reduced-motion: reduce) {
  .dash-header * { transition: none !important; }
}
</style>