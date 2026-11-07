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
const messagesOpen = ref(false)
const sampleMessages = ref([
  { id: 1, sender: 'تأمین‌کننده تجهیزات شبکه', subject: 'پیگیری پاسخ استعلام', preview: 'لطفاً زمان تحویل پیشنهادی را بررسی بفرمایید.', time: '۱۰:۴۲', unread: true },
  { id: 2, sender: 'واحد خرید شرکت آریا', subject: 'درخواست پیش‌فاکتور', preview: 'برای تعداد درخواستی امکان ارائه تخفیف وجود دارد؟', time: 'دیروز', unread: true },
  { id: 3, sender: 'سامانه مخابرات', subject: 'وضعیت بررسی محصول', preview: 'مدارک محصول برای بررسی تکمیلی ارجاع شد.', time: 'دیروز', unread: true },
  { id: 4, sender: 'شرکت ارتباط‌گستر', subject: 'پاسخ به پیام شما', preview: 'مشخصات فنی ارسال‌شده دریافت شد.', time: '۲ روز پیش', unread: false },
  { id: 5, sender: 'واحد بازرگانی', subject: 'هماهنگی ارسال کالا', preview: 'لطفاً آدرس تحویل را تأیید کنید.', time: '۳ روز پیش', unread: false },
])
const newMessageCount = computed(() => sampleMessages.value.filter(message => message.unread).length)

function toggleMessages() { messagesOpen.value = !messagesOpen.value }
function closeMessages() { messagesOpen.value = false }

// Dashboard route for the header
const dashboardRoute = computed(() => ({ name: 'company-dashboard' }))
const homeRoute = computed(() => ({ name: 'company-dashboard' }))

function toggleMobile() {
  mobileOpen.value = !mobileOpen.value
}

function closeMobile() {
  mobileOpen.value = false
  closeMessages()
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
  if (e.key === 'Escape') { closeMobile(); closeMessages() }
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
      >
        <template #messages>
          <button type="button" class="company-message-trigger" :class="{ 'is-open': messagesOpen }" aria-label="پیام‌ها" :aria-expanded="messagesOpen" @click="toggleMessages">
            <i class="pi pi-envelope" aria-hidden="true"></i>
            <span v-if="newMessageCount" class="company-message-trigger__badge">{{ newMessageCount > 9 ? '۹+' : newMessageCount }}</span>
          </button>
        </template>
      </DashboardHeader>
      <div v-if="messagesOpen" class="company-message-backdrop" @click="closeMessages"></div>
      <aside v-if="messagesOpen" class="company-message-drawer" aria-label="پیام‌های اخیر" @click.stop>
        <div class="company-message-drawer__head"><div><strong>پیام‌ها</strong><span>{{ newMessageCount.toLocaleString('fa-IR') }} پیام جدید</span></div><button type="button" aria-label="بستن پیام‌ها" @click="closeMessages"><i class="pi pi-times"></i></button></div>
        <div class="company-message-sample-note"><i class="pi pi-info-circle"></i> پیام‌های نمایشی؛ تا زمان اتصال API پیام‌ها</div>
        <div class="company-message-list">
          <router-link v-for="message in sampleMessages" :key="message.id" :to="{ name: 'notifications' }" class="company-message-item" :class="{ 'is-unread': message.unread }" @click="closeMessages">
            <span class="company-message-item__avatar"><i class="pi pi-user"></i></span><span class="company-message-item__body"><span class="company-message-item__top"><strong>{{ message.sender }}</strong><time>{{ message.time }}</time></span><b>{{ message.subject }}</b><small>{{ message.preview }}</small></span><i v-if="message.unread" class="company-message-item__dot" aria-label="خوانده‌نشده"></i>
          </router-link>
        </div>
        <router-link :to="{ name: 'notifications' }" class="company-message-drawer__footer" @click="closeMessages">مشاهده همه پیام‌ها <i class="pi pi-angle-left"></i></router-link>
      </aside>

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
.company-message-trigger{position:relative;display:inline-flex;align-items:center;justify-content:center;width:40px;height:40px;flex:0 0 40px;border:1px solid var(--tm-line);border-radius:50%;background:var(--tm-surface);color:var(--tm-ink);cursor:pointer}
.company-message-trigger:hover,.company-message-trigger.is-open{background:var(--tm-surface-alt);border-color:var(--tm-primary)}
.company-message-trigger__badge{position:absolute;top:-4px;inset-inline-end:-4px;display:grid;place-items:center;min-width:18px;height:18px;padding:0 4px;border:2px solid var(--tm-surface);border-radius:10px;background:var(--ds-status-danger-fg);color:#FFFFFF;font-size:10px;font-weight:700}
.company-message-backdrop{position:fixed;z-index:110;inset:4rem 0 0;background:rgba(17,25,40,.16)}
.company-message-drawer{position:fixed;z-index:111;top:4rem;left:0;display:flex;flex-direction:column;width:min(390px,calc(100vw - 18px));height:calc(100vh - 4rem);overflow:hidden;border:1px solid var(--tm-line);border-top:0;border-radius:0 0 6px 0;background:var(--tm-surface);box-shadow:8px 10px 28px rgba(18,30,55,.16);direction:rtl}
.company-message-drawer__head{display:flex;align-items:center;justify-content:space-between;padding:17px 18px 13px;border-bottom:1px solid var(--tm-line)}
.company-message-drawer__head>div{display:flex;flex-direction:column;gap:3px}.company-message-drawer__head strong{color:var(--tm-ink);font-size:15px}.company-message-drawer__head span{color:var(--tm-muted);font-size:11px}
.company-message-drawer__head button{display:grid;place-items:center;width:30px;height:30px;border:0;border-radius:4px;background:var(--tm-surface-alt);color:var(--tm-muted);cursor:pointer}
.company-message-sample-note{display:flex;align-items:center;gap:7px;padding:9px 16px;background:var(--ds-status-warning-bg);color:var(--ds-status-warning-fg);font-size:10px}
.company-message-list{flex:1;overflow:auto}
.company-message-item{display:flex;align-items:flex-start;gap:10px;padding:14px;border-bottom:1px solid var(--tm-line);color:inherit;text-decoration:none}
.company-message-item:hover,.company-message-item.is-unread{background:var(--tm-surface-alt)}
.company-message-item__avatar{display:grid;place-items:center;width:34px;height:34px;flex:0 0 34px;border-radius:50%;background:color-mix(in srgb, var(--ds-brand-secondary) 12%, transparent);color:var(--ds-brand-secondary)}
.company-message-item__body{display:flex;flex:1;min-width:0;flex-direction:column;gap:4px}
.company-message-item__top{display:flex;align-items:center;justify-content:space-between;gap:8px}.company-message-item__top strong{overflow:hidden;color:var(--tm-ink);font-size:11px;text-overflow:ellipsis;white-space:nowrap}.company-message-item__top time{flex:none;color:var(--tm-muted);font-size:10px}
.company-message-item__body b{color:var(--tm-ink);font-size:12px;font-weight:650}.company-message-item__body small{overflow:hidden;color:var(--tm-muted);font-size:11px;text-overflow:ellipsis;white-space:nowrap}
.company-message-item__dot{width:7px;height:7px;flex:0 0 7px;margin-top:5px;border-radius:50%;background:var(--ds-brand-secondary)}
.company-message-drawer__footer{display:flex;align-items:center;justify-content:center;gap:7px;padding:14px;border-top:1px solid var(--tm-line);color:var(--tm-primary);font-size:12px;font-weight:700;text-decoration:none}
@media(max-width:575px){.company-message-drawer{width:min(360px,calc(100vw - 12px))}}
</style>