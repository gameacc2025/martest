<script setup>
/**
 * AdminLayout
 *
 * Dashboard shell for the admin portal. Wraps shared UI components
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
const dashboardRoute = computed(() => ({ name: 'admin-dashboard' }))
const homeRoute = computed(() => ({ name: 'admin-dashboard' }))

function toggleMobile() {
  mobileOpen.value = !mobileOpen.value
}

function closeMobile() {
  mobileOpen.value = false
}

// Close the mobile drawer whenever the route changes (a nav item was clicked).
watch(() => route.fullPath, closeMobile)

// Lock body scroll while the mobile drawer is open, then restore the
// exact inline value that was present before the drawer opened.
let previousBodyOverflow = ''
let bodyScrollLocked = false

function releaseBodyScrollLock() {
  if (!bodyScrollLocked) return
  document.body.style.overflow = previousBodyOverflow
  bodyScrollLocked = false
}

watch(mobileOpen, (open) => {
  if (open) {
    if (!bodyScrollLocked) {
      previousBodyOverflow = document.body.style.overflow
      bodyScrollLocked = true
    }
    document.body.style.overflow = 'hidden'
    return
  }

  releaseBodyScrollLock()
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
  releaseBodyScrollLock()
})
</script>

<template>
  <div
    class="dash-layout"
    :class="{ 'dash-layout--collapsed': sidebarCollapsed }"
  >
    <a class="dash-layout-skip" href="#main-content">رفتن به محتوای اصلی</a>
    <!-- Sidebar: fixed on desktop, drawer on mobile -->
    <div id="dashboard-navigation" class="dash-layout-sidebar" :class="{ 'dash-layout-sidebar--open': mobileOpen }">
      <DashboardSidebar
        :collapsed="sidebarCollapsed"
        :mobile-open="mobileOpen"
        :menu-items="menu"
        :user="authStore.user"
        @navigate="closeMobile"
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
        :mobile-open="mobileOpen"
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

      <!-- Breadcrumb is intentionally outside the constrained content wrapper. -->
      <PageHeader :home-route="homeRoute" />

      <div class="dash-layout-content">
        <main id="main-content" class="dash-layout-page" tabindex="-1">
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
  --dash-sidebar-width: 256px;
  --dash-sidebar-collapsed-width: 76px;
  --dash-header-height: 4rem;


  display: flex;
  min-height: 100vh;
  background: var(--tm-canvas);
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

/* tem canvas + full-bleed workspace proportions. */
.dash-layout {
  background: var(--tm-canvas);
}

.dash-layout-content {
  max-width: none;
  padding: 0 clamp(1rem, 1.55vw, 1.65rem) 1.5rem;
}

.dash-layout-page {
  padding-top: 0.8rem;
}

@media (min-width: 1600px) {
  .dash-layout-content { padding-inline: 1.65rem; }
}

@media (max-width: 575px) {
  .dash-layout-content { padding-inline: 0.75rem; }
}


/* Keyboard users can bypass the navigation chrome and enter page content. */
.dash-layout-skip {
  position: fixed;
  z-index: 2000;
  inset-block-start: .5rem;
  inset-inline-start: .5rem;
  transform: translateY(-160%);
  padding: .7rem 1rem;
  border: 1px solid var(--ds-color-primary);
  border-radius: var(--ds-radius-md);
  background: var(--ds-color-surface);
  color: var(--ds-color-text);
  font-size: var(--ds-font-size-sm);
  font-weight: var(--ds-font-weight-bold);
  text-decoration: none;
  box-shadow: var(--ds-shadow-md);
  transition: transform var(--ds-transition-fast);
}
.dash-layout-skip:focus {
  transform: translateY(0);
  outline: 3px solid var(--ds-color-focus);
  outline-offset: 2px;
}
.dash-layout-page:focus-visible { outline: 2px solid var(--ds-color-focus); outline-offset: 3px; }
</style>