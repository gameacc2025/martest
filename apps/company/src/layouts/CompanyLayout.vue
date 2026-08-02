<script setup>
/**
 * CompanyLayout
 *
 * Dashboard shell for the company portal. Wraps shared UI components
 * from @telecom/shared-ui and provides app-specific state (auth, theme, menu).
 */
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import DashboardHeader from '@telecom/shared-ui/components/dashboard/DashboardHeader.vue'
import DashboardSidebar from '@telecom/shared-ui/components/dashboard/DashboardSidebar.vue'
import DashboardFooter from '@telecom/shared-ui/components/dashboard/DashboardFooter.vue'
import PageHeader from '@telecom/shared-ui/components/common/PageHeader.vue'
import { useSidebarState } from '@telecom/shared-ui/composables/useSidebarState'
import { useTheme } from '@telecom/shared-ui/composables/useTheme'
import { useAuthStore } from '../stores/auth'
import { useDashboardMenu } from '@telecom/shared-ui'

const route = useRoute()
const authStore = useAuthStore()
const { isDark, toggle: toggleTheme } = useTheme()
const { menu } = useDashboardMenu(authStore)

// Desktop: sidebar collapsed to icon rail (shared + persisted in localStorage).
const { collapsed: sidebarCollapsed, toggle: toggleSidebar } = useSidebarState()
// Mobile: drawer open.
const mobileOpen = ref(false)

// Dashboard route for the header
const dashboardRoute = computed(() => ({ name: 'company-dashboard' }))
const homeRoute = computed(() => ({ name: 'company-dashboard' }))

function toggleMobile() {
  mobileOpen.value = !mobileOpen.value
}

function closeMobile() {
  mobileOpen.value = false
}

// Close the mobile drawer whenever the route changes (a nav item was clicked).
watch(() => route.fullPath, closeMobile)

// Lock body scroll while the mobile drawer is open.
watch(mobileOpen, (open) => {
  document.body.style.overflow = open ? 'hidden' : ''
})

function onKeydown(e) {
  if (e.key === 'Escape') closeMobile()
}

onMounted(() => {
  // RTL + language, consistent with the rest of the dashboard.
  document.documentElement.setAttribute('dir', 'rtl')
  document.documentElement.lang = 'fa'
  window.addEventListener('keydown', onKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown)
  document.body.style.overflow = ''
})
</script>

<template>
  <div
    class="dash-layout"
    :class="{ 'dash-layout--collapsed': sidebarCollapsed }"
  >
    <!-- Sidebar: fixed on desktop, drawer on mobile -->
    <div class="dash-layout-sidebar" :class="{ 'dash-layout-sidebar--open': mobileOpen }">
      <DashboardSidebar
        :collapsed="sidebarCollapsed"
        :mobile-open="mobileOpen"
        :menu-items="menu"
        @navigate="closeMobile"
        @toggle-collapse="toggleSidebar"
      />

    </div>

    <!-- Mobile overlay -->
    <div
      v-if="mobileOpen"
      class="dash-layout-overlay"
      @click="closeMobile"
    ></div>

    <!-- Main column -->
    <div class="dash-layout-main">
      <DashboardHeader
        :collapsed="sidebarCollapsed"
        :user="authStore.user"
        :is-super-admin="authStore.isSuperAdmin"
        :is-company-admin="authStore.isCompanyAdmin"
        :is-dark="isDark"
        :dashboard-route="dashboardRoute"
        :home-route="homeRoute"
        :show-breadcrumb="false"
        @toggle-sidebar="toggleSidebar"
        @toggle-mobile="toggleMobile"
        @toggle-theme="toggleTheme"
        @logout="authStore.logout()"
      />

      <div class="dash-layout-content">
        <!-- One clean white breadcrumb bar for every dashboard page. -->
        <PageHeader :home-route="homeRoute" />

        <main class="dash-layout-page">
          <router-view v-slot="{ Component, route }">
            <transition name="page" mode="out-in">
              <component :is="Component" :key="route.path" />
            </transition>
          </router-view>
        </main>

        <DashboardFooter />
      </div>
    </div>
  </div>
</template>

<style scoped>
.dash-layout {
  --dash-sidebar-width: 240px;
  --dash-sidebar-collapsed-width: 76px;
  --dash-header-height: 4rem;


  display: flex;
  min-height: 100vh;
  background: var(--surface-ground);
  direction: rtl;
}

/* ---- Sidebar wrapper ---- */
.dash-layout-sidebar {
  flex-shrink: 0;
  width: var(--dash-sidebar-width);
  transition: width var(--transition-duration, 0.2s);
}

.dash-layout--collapsed .dash-layout-sidebar {
  width: var(--dash-sidebar-collapsed-width);
}

/* ---- Main column ---- */
.dash-layout-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.dash-layout-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 1600px;
  margin: 0 auto;
  padding: 0 1.5rem 1.5rem;
}

.dash-layout-page {
  flex: 1;
  padding-top: 0.5rem;
}

.dash-layout-overlay {
  display: none;
}

/* ============================================
   Desktop: fixed sidebar
   ============================================ */
@media (min-width: 992px) {
  .dash-layout-sidebar {
    position: sticky;
    top: 0;
    height: 100vh;
  }
}

/* ============================================
   Mobile: off-canvas drawer
   ============================================ */
@media (max-width: 991px) {
  .dash-layout-sidebar {
    position: fixed;
    top: 0;
    inset-inline-start: 0;
    height: 100vh;
    width: var(--dash-sidebar-width);
    z-index: 1001;
    transform: translateX(100%); /* off-canvas on the right for RTL */
    transition: transform var(--transition-duration, 0.25s);
    box-shadow: 0 0 24px rgba(0, 0, 0, 0.18);
  }

  /* In RTL the sidebar sits on the right; translate it out to the right. */
  [dir='rtl'] .dash-layout-sidebar {
    transform: translateX(100%);
  }
  [dir='ltr'] .dash-layout-sidebar {
    transform: translateX(-100%);
  }

  .dash-layout-sidebar--open {
    transform: translateX(0) !important;
  }

  /* Collapsed state is a desktop-only concept; force full width on mobile. */
  .dash-layout--collapsed .dash-layout-sidebar {
    width: var(--dash-sidebar-width);
  }

  .dash-layout-overlay {
    display: block;
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.45);
    z-index: 1000;
  }

  .dash-layout-content {
    padding: 0 1rem 1rem;
  }
}

@media (max-width: 575px) {
  .dash-layout-content {
    padding: 0 0.75rem 0.75rem;
  }
}
</style>
