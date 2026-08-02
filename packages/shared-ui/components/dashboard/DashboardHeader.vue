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
    <!-- Start: sidebar toggles, company identity, breadcrumb -->
    <div class="dash-header-start">
      <button
        type="button"
        class="dash-header-icon-btn dash-header-desktop-only"
        aria-label="جمع کردن منو"
        @click="emit('toggle-sidebar')"
      >
        <i class="pi" :class="collapsed ? 'pi-angle-double-right' : 'pi-bars'"></i>
      </button>

      <button
        type="button"
        class="dash-header-icon-btn dash-header-mobile-only"
        aria-label="باز کردن منو"
        @click="emit('toggle-mobile')"
      >
        <i class="pi pi-bars"></i>
      </button>

      <!-- Company identity (logo + name) -->
      <div v-if="companyName" class="dash-header-company">
        <span class="dash-header-company-logo">
          <img v-if="companyLogo" :src="companyLogo" :alt="companyName" />
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
        <i class="pi pi-search dash-header-search-icon"></i>
        <input
          v-model="searchQuery"
          type="search"
          class="dash-header-search-input"
          placeholder="جستجو..."
          aria-label="جستجو"
        />
      </form>

      <!-- Search trigger (mobile) -->
      <button
        type="button"
        class="dash-header-icon-btn dash-header-mobile-only"
        aria-label="جستجو"
        @click="toggleSearchPanel"
      >
        <i class="pi pi-search"></i>
      </button>
      <Popover ref="searchPanel">
        <form class="dash-header-search-popover" @submit.prevent="submitSearch">
          <input
            v-model="searchQuery"
            type="search"
            class="dash-header-search-input"
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
        @click="emit('toggle-theme')"
      >
        <i class="pi" :class="isDark ? 'pi-sun' : 'pi-moon'"></i>
      </button>

      <!-- Notifications -->
      <router-link
        :to="{ name: 'notifications' }"
        class="dash-header-icon-btn dash-header-bell"
        aria-label="اعلان‌ها"
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
        aria-haspopup="true"
        @click="toggleUserMenu"
      >
        <span class="dash-header-avatar">
          <img v-if="user?.avatarUrl" :src="user.avatarUrl" alt="" />
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
              <img v-if="user?.avatarUrl" :src="user.avatarUrl" alt="" />
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
.dash-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  height: var(--dash-header-height, 4rem);
  padding: 0 1.25rem;
  background: var(--surface-card);
  border-bottom: 1px solid var(--surface-border);
  position: sticky;
  top: 0;
  z-index: 100;
}

.dash-header-start,
.dash-header-end {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-width: 0;
}

.dash-header-start {
  flex: 1;
}

/* ---- Icon buttons ---- */
.dash-header-icon-btn {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  border: none;
  background: transparent;
  border-radius: var(--content-border-radius, 8px);
  color: var(--text-color-secondary);
  cursor: pointer;
  text-decoration: none;
  transition: background-color var(--transition-duration, 0.2s), color var(--transition-duration, 0.2s);
}

.dash-header-icon-btn:hover {
  background: var(--surface-hover);
  color: var(--text-color);
}

.dash-header-icon-btn i {
  font-size: 1.15rem;
}

.dash-header-bell-badge {
  position: absolute;
  top: 0.25rem;
  inset-inline-end: 0.25rem;
  transform: scale(0.75);
  transform-origin: top right;
}

/* ---- Divider ---- */
.dash-header-divider {
  width: 1px;
  height: 1.75rem;
  background: var(--surface-border);
  margin: 0 0.25rem;
  flex-shrink: 0;
}

/* ---- Company identity ---- */
.dash-header-company {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-width: 0;
}

.dash-header-company-logo {
  width: 2rem;
  height: 2rem;
  border-radius: var(--content-border-radius, 8px);
  background: var(--surface-hover);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  flex-shrink: 0;
  color: var(--primary-color);
}

.dash-header-company-logo img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.dash-header-company-name {
  font-weight: 600;
  font-size: 0.9rem;
  color: var(--text-color);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 12rem;
}

/* ---- Breadcrumb ---- */
.dash-header-breadcrumb {
  min-width: 0;
}

/* ---- Search ---- */
.dash-header-search {
  position: relative;
  display: flex;
  align-items: center;
}

.dash-header-search-icon {
  position: absolute;
  inset-inline-start: 0.75rem;
  font-size: 0.9rem;
  color: var(--text-color-secondary);
  pointer-events: none;
}

.dash-header-search-input {
  width: 14rem;
  max-width: 100%;
  height: 2.5rem;
  padding: 0 0.9rem;
  padding-inline-start: 2.25rem;
  border: 1px solid var(--surface-border);
  border-radius: 2rem;
  background: var(--surface-ground);
  color: var(--text-color);
  font-family: inherit;
  font-size: 0.85rem;
  outline: none;
  transition: border-color var(--transition-duration, 0.2s), box-shadow var(--transition-duration, 0.2s);
}

.dash-header-search-input:focus {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 1px var(--primary-color);
}

.dash-header-search-popover .dash-header-search-input {
  width: min(70vw, 18rem);
  padding-inline-start: 0.9rem;
}

/* ---- User button ---- */
.dash-header-user {
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.3rem 0.6rem;
  border: 1px solid var(--surface-border);
  border-radius: 2rem;
  background: var(--surface-card);
  color: var(--text-color);
  cursor: pointer;
  transition: background-color var(--transition-duration, 0.2s);
}

.dash-header-user:hover {
  background: var(--surface-hover);
}

.dash-header-avatar {
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  background: var(--primary-color);
  color: var(--primary-contrast-color);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.9rem;
  overflow: hidden;
  flex-shrink: 0;
}

.dash-header-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.dash-header-avatar--lg {
  width: 2.75rem;
  height: 2.75rem;
  font-size: 1.1rem;
}

.dash-header-user-meta {
  display: flex;
  flex-direction: column;
  line-height: 1.1;
  text-align: start;
}

.dash-header-user-name {
  font-size: 0.85rem;
  font-weight: 600;
  max-width: 9rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dash-header-user-role {
  font-size: 0.7rem;
  color: var(--text-color-secondary);
}

.dash-header-user-caret {
  font-size: 0.7rem;
  color: var(--text-color-secondary);
}

/* ---- User dropdown card (menu #start) ---- */
.dash-header-user-card {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  border-bottom: 1px solid var(--surface-border);
  min-width: 15rem;
}

.dash-header-user-card-meta {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  min-width: 0;
}

.dash-header-user-card-name {
  font-weight: 700;
  color: var(--text-color);
  font-size: 0.95rem;
}

.dash-header-user-card-role {
  font-size: 0.78rem;
  color: var(--text-color-secondary);
}

.dash-header-user-card-company {
  font-size: 0.78rem;
  color: var(--text-color-secondary);
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  margin-top: 0.15rem;
}

/* ============================================
   Responsive visibility helpers
   ============================================ */
.dash-header-mobile-only {
  display: inline-flex;
}
.dash-header-desktop-only {
  display: none;
}

@media (min-width: 992px) {
  .dash-header-mobile-only {
    display: none;
  }
  .dash-header-desktop-only {
    display: inline-flex;
  }
  .dash-header-breadcrumb.dash-header-desktop-only {
    display: flex;
  }
}

/* Hide company name label on very narrow screens (logo stays). */
@media (max-width: 575px) {
  .dash-header-company-name {
    display: none;
  }
  .dash-header-user-meta {
    display: none;
  }
  .dash-header {
    padding: 0 0.75rem;
  }
}
</style>
