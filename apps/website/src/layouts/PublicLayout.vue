<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { categoriesApi } from '@telecom/api-client'
import { apiGet } from '@telecom/shared-core/http/apiClient'
import PvButton from 'primevue/button'
import InputText from 'primevue/inputtext'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import Menu from 'primevue/menu'
import MegaMenu from '@telecom/shared-ui/components/common/MegaMenu.vue'

const authStore = useAuthStore()
const router = useRouter()
const route = useRoute()

// Keep the responsive navigation in sync with route changes (including
// browser back/forward) so it never remains open over a new page.
watch(() => route.fullPath, () => { mobileMenuOpen.value = false })

// CUSTOMER notifications live on the website. COMPANY and STAFF users are
// redirected to their own panels through the configured PKCE handoff URLs.
const companyAppUrl = import.meta.env.VITE_COMPANY_APP_URL || ''
const adminAppUrl = import.meta.env.VITE_ADMIN_APP_URL || ''

// Never link straight into a panel page: the panel has no session of its
// own yet (the access token is memory-only and dies with this tab), so a
// bare deep link would bounce the user out to /login. Instead we aim at the
// panel's /auth/start, which runs the PKCE handoff — website → start →
// mint → callback — and lands the user on `path` already signed in.
// No token ever travels in a URL.
function panelStartUrl(appUrl, path = '/') {
  return `${appUrl}/auth/start?redirect=${encodeURIComponent(path)}`
}

function goToCompanyApp(path = '/') {
  window.location.href = panelStartUrl(companyAppUrl, path)
}
function goToAdminApp(path = '/') {
  window.location.href = panelStartUrl(adminAppUrl, path)
}


const searchQuery = ref('')
const mobileMenuOpen = ref(false)
const notificationCount = ref(0)
const userMenu = ref(null)

const user = computed(() => authStore.user)
const isAuthenticated = computed(() => authStore.isAuthenticated)

// App membership is decided SOLELY by accessProfile.type. Roles/permissions
// never select the app — they only gate features inside it.
//   STAFF   → Admin App link
//   COMPANY → Company App link
const canAccessDashboard = computed(() => authStore.isStaff)
const canAccessCompanyDashboard = computed(() => authStore.isCompany)
const notificationHref = computed(() => {
  if (canAccessDashboard.value) return panelStartUrl(adminAppUrl, '/notifications')
  if (canAccessCompanyDashboard.value) return panelStartUrl(companyAppUrl, '/notifications')
  return '/notifications'
})


const displayName = computed(() => {
  const profile = authStore.profile
  const fullName = profile ? [profile.firstName, profile.lastName].filter(Boolean).join(' ') : ''
  return fullName || user.value?.email || 'کاربر'
})

// Dropdown menu items — visibility depends on the user's access level.
const userMenuItems = computed(() => {
  // Customer inquiries are managed in the Website. Company/STAFF users use
  // their own portal through the existing PKCE session handoff.
  const items = authStore.isCustomer
    ? [
        { label: 'پروفایل', icon: 'pi pi-user', command: () => router.push('/profile') },
        { label: 'آدرس‌های من', icon: 'pi pi-map-marker', command: () => router.push('/profile/addresses') },
        { label: 'استعلام‌های من', icon: 'pi pi-file', command: () => router.push('/my-inquiries') },
      ]
    : canAccessDashboard.value
      ? [
          { label: 'پروفایل', icon: 'pi pi-user', command: () => goToAdminApp('/profile') },
          { label: 'استعلام‌ها', icon: 'pi pi-file', command: () => goToAdminApp('/inquiries') },
        ]
      : [
          { label: 'پروفایل', icon: 'pi pi-user', command: () => goToCompanyApp('/profile') },
          { label: 'استعلام‌های من', icon: 'pi pi-file', command: () => goToCompanyApp('/profile?tab=inquiries') },
        ]
  if (canAccessDashboard.value) {
    items.push({
      label: 'پنل مدیریت',
      icon: 'pi pi-th-large',
      command: () => goToAdminApp('/admin-dashboard'),
    })
  } else if (canAccessCompanyDashboard.value) {
    items.push({
      label: 'داشبورد شرکت',
      icon: 'pi pi-th-large',
      command: () => goToCompanyApp('/company-dashboard'),
    })
  }

  items.push({ separator: true })
  items.push({ label: 'خروج', icon: 'pi pi-sign-out', command: () => logout() })
  return items
})

function toggleUserMenu(event) {
  userMenu.value?.toggle(event)
}


const navItems = [
  { name: 'صفحه اصلی', path: '/' },
  { name: 'درباره ما', path: '/about' },
  { name: 'تماس با ما', path: '/contact' }
]

const footerCategories = ref([])
const megaMenuCategories = ref([])

onMounted(async () => {
  // Fetch notification count for logged-in users
  if (isAuthenticated.value) {
    try {
      const result = await apiGet(endpoints.notifications.unreadCount)
      notificationCount.value = Number(result?.count ?? result?.data?.count ?? 0)
    } catch (err) {
      // Ignore
    }
  }

  // Load categories for MegaMenu and footer
  try {
    const response = await categoriesApi.list()
    const body = response.data
    const items = body?.data || body || []
    const allCategories = Array.isArray(items) ? items : []
    megaMenuCategories.value = allCategories
    footerCategories.value = allCategories.slice(0, 6)
  } catch (err) {
    console.error('Error loading categories:', err)
  }
})

function search() {
  if (searchQuery.value.trim()) {
    router.push({ name: 'search', query: { q: searchQuery.value } })
    searchQuery.value = ''
    mobileMenuOpen.value = false
  }
}

function logout() {
  authStore.logout()
  router.push({ name: 'home' })
}
</script>

<template>
  <div class="public-shell">
    <a class="public-skip-link" href="#public-main">رفتن به محتوای اصلی</a>
    <!-- Header -->
    <header class="public-header">
      <div class="public-utility-bar">
        <div class="public-container public-utility-inner">
          <span class="public-utility-message">
            <i class="pi pi-building" aria-hidden="true"></i>
            بازارگاه تخصصی تجهیزات مخابراتی و خرید سازمانی
          </span>
          <nav class="public-utility-links" aria-label="دسترسی‌های راهنما">
            <router-link :to="{ name: 'faq' }">راهنمای کاربران</router-link>
            <router-link :to="{ name: 'contact' }">ارتباط با ما</router-link>
          </nav>
        </div>
      </div>
      <div class="public-container">
        <div class="public-header-row">
          <!-- Right side: Logo + Navigation -->
          <div class="public-header-right">
            <router-link :to="{ name: 'home' }" class="public-logo" aria-label="صفحه اصلی بازارگاه مخابرات">
              <span class="public-logo-mark"><i class="pi pi-wifi"></i></span>
              <span class="public-logo-name">
                <strong>Telecom</strong>
                <small>Marketplace</small>
              </span>
            </router-link>

            <nav class="public-nav-desktop">
              <router-link to="/" class="public-nav-link" active-class="public-nav-link-active">صفحه اصلی</router-link>
              <MegaMenu :categories="megaMenuCategories" />
              <router-link to="/about" class="public-nav-link" active-class="public-nav-link-active">درباره ما</router-link>
              <router-link to="/contact" class="public-nav-link" active-class="public-nav-link-active">تماس با ما</router-link>
            </nav>
          </div>

          <!-- Left side: Search + Actions -->
          <div class="public-header-actions">
            <div class="public-search-desktop">
              <IconField>
                <InputIcon class="pi pi-search" />
                <InputText v-model="searchQuery" @keyup.enter="search" placeholder="جستجو..." class="public-search-input" />
              </IconField>
            </div>

            <template v-if="user">
              <a :href="notificationHref" class="public-icon-link public-notifications-link">
                <i class="pi pi-bell"></i>
                <span v-if="notificationCount > 0" class="public-cart-badge">{{ notificationCount }}</span>
              </a>

              <!-- User dropdown menu -->
              <button type="button" class="public-user-trigger" @click="toggleUserMenu" aria-haspopup="true">
                <span class="public-user-avatar">
                  <img v-if="authStore.profile?.avatar" :src="authStore.profile.avatar" alt="" />
                  <span v-else>{{ displayName.charAt(0) }}</span>
                </span>

                <span class="public-user-name">{{ displayName }}</span>
                <i class="pi pi-chevron-down public-user-caret"></i>
              </button>
              <Menu ref="userMenu" :model="userMenuItems" :popup="true" />
            </template>


            <template v-else>
              <router-link :to="{ name: 'login' }" class="p-button p-component public-btn-primary-link">
                ورود
              </router-link>
            </template>

            <!-- Mobile menu toggle -->
            <PvButton
              :icon="mobileMenuOpen ? 'pi pi-times' : 'pi pi-bars'"
              text
              rounded
              class="public-mobile-toggle"
              :aria-label="mobileMenuOpen ? 'بستن منوی موبایل' : 'باز کردن منوی موبایل'"
              :aria-expanded="mobileMenuOpen"
              aria-controls="public-mobile-navigation"
              @click="mobileMenuOpen = !mobileMenuOpen"
            />
          </div>
        </div>

        <!-- Mobile search -->
        <div v-if="mobileMenuOpen" class="public-search-mobile">
          <IconField>
            <InputIcon class="pi pi-search" />
            <InputText v-model="searchQuery" @keyup.enter="search" placeholder="جستجوی محصولات..." class="public-search-input-full" />
          </IconField>
        </div>
      </div>
    </header>

    <!-- Mobile Navigation -->
    <div v-if="mobileMenuOpen" id="public-mobile-navigation" class="public-mobile-nav">
      <nav class="public-container" aria-label="منوی اصلی موبایل">
        <ul class="public-mobile-nav-list">
          <li>
            <router-link :to="{ name: 'categories' }" @click="mobileMenuOpen = false" class="public-mobile-nav-link">
              <i class="pi pi-th-large"></i>
              <span>دسته‌بندی محصولات</span>
            </router-link>
          </li>
          <li v-for="item in navItems" :key="item.path">
            <router-link :to="item.path" @click="mobileMenuOpen = false" class="public-mobile-nav-link">
              {{ item.name }}
            </router-link>
          </li>
          <li v-if="user" class="public-mobile-auth">
            <a v-if="canAccessDashboard" :href="panelStartUrl(adminAppUrl, '/admin-dashboard')" @click="mobileMenuOpen = false" class="public-mobile-nav-link">
              <i class="pi pi-th-large"></i>
              <span>پنل مدیریت</span>
            </a>
            <a v-else-if="canAccessCompanyDashboard" :href="panelStartUrl(companyAppUrl, '/company-dashboard')" @click="mobileMenuOpen = false" class="public-mobile-nav-link">
              <i class="pi pi-th-large"></i>
              <span>داشبورد شرکت</span>
            </a>

            <a :href="notificationHref" @click="mobileMenuOpen = false" class="public-mobile-nav-link">
              <i class="pi pi-bell"></i>
              <span>اعلان‌ها {{ notificationCount > 0 ? `(${notificationCount})` : '' }}</span>
            </a>
            <router-link
              v-if="authStore.isCustomer"
              :to="{ name: 'profile' }"
              @click="mobileMenuOpen = false"
              class="public-mobile-nav-link"
            >
              <i class="pi pi-user"></i>
              <span>{{ displayName }}</span>
            </router-link>
            <a
              v-else-if="canAccessDashboard"
              :href="panelStartUrl(adminAppUrl, '/profile')"
              @click="mobileMenuOpen = false"
              class="public-mobile-nav-link"
            >
              <i class="pi pi-user"></i>
              <span>{{ displayName }}</span>
            </a>
            <a
              v-else
              :href="panelStartUrl(companyAppUrl, '/profile')"
              @click="mobileMenuOpen = false"
              class="public-mobile-nav-link"
            >
              <i class="pi pi-user"></i>
              <span>{{ displayName }}</span>
            </a>

          </li>
        </ul>
      </nav>
    </div>

    <!-- Main content -->
    <main id="public-main" class="public-main" tabindex="-1">
      <router-view></router-view>
    </main>

    <!-- Footer -->
    <footer class="public-footer">
      <div class="public-container public-footer-inner">
        <div class="public-footer-grid">
          <div>
            <h3 class="public-footer-heading">دسترسی سریع</h3>
            <ul class="public-footer-list">
              <li v-for="item in navItems" :key="item.path">
                <router-link :to="item.path" class="public-footer-link">{{ item.name }}</router-link>
              </li>
            </ul>
          </div>
          <div>
            <h3 class="public-footer-heading">دسته‌بندی‌ها</h3>
            <ul class="public-footer-list">
              <li v-for="cat in footerCategories" :key="cat.id">
                <router-link :to="{ name: 'products', query: { category: cat.slug } }" class="public-footer-link">{{ cat.nameFa }}</router-link>
              </li>
            </ul>
          </div>
          <div>
            <h3 class="public-footer-heading">خدمات مشتری</h3>
            <ul class="public-footer-list">
              <li><router-link :to="{ name: 'faq' }" class="public-footer-link">سوالات متداول</router-link></li>
              <li><router-link :to="{ name: 'contact' }" class="public-footer-link">تماس با ما</router-link></li>
              <li><router-link :to="{ name: 'about' }" class="public-footer-link">درباره ما</router-link></li>
              <li><router-link :to="{ name: 'terms' }" class="public-footer-link">قوانین و حریم خصوصی</router-link></li>
            </ul>
          </div>

          <!-- About Us (left side) -->
          <div class="public-footer-about">
            <div class="public-footer-brand">
              <i class="pi pi-wifi"></i>
              <span>Telecom Market</span>
            </div>
            <h3 class="public-footer-heading">درباره ما</h3>
            <p class="public-footer-about-text">
              بازارگاه تخصصی تجهیزات مخابراتی، با هدف ایجاد فضایی مطمئن برای
              خرید و فروش تجهیزات با کیفیت بالا راه‌اندازی شده است. ما با
              همکاری بهترین تولیدکنندگان و تأمین‌کنندگان، محصولات معتبر را
              با بهترین قیمت ارائه می‌دهیم.
            </p>
            <router-link :to="{ name: 'about' }" class="public-footer-about-btn">
              اطلاعات بیشتر درباره ما
            </router-link>
          </div>
        </div>

        <div class="public-footer-bottom">
          <p>© {{ new Date().getFullYear() }} Telecom Marketplace. تمام حقوق محفوظ است.</p>
        </div>
      </div>
    </footer>

  </div>
</template>

<style scoped>
.public-shell {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.public-skip-link {
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
.public-skip-link:focus {
  transform: translateY(0);
  outline: 3px solid var(--ds-color-focus);
  outline-offset: 2px;
}
.public-main:focus { outline: none; }

.public-container {
  width: 100%;
  max-width: var(--ds-container-max);
  margin: 0 auto;
  padding-inline: var(--ds-container-pad);
}

@media (min-width: 768px) {
  .public-container {
    padding-inline: var(--ds-container-pad-lg);
  }
}

.public-header {
  background: var(--surface-card);
  border-bottom: 1px solid var(--surface-border);
  position: sticky;
  top: 0;
  z-index: 100;
}

.public-header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 4rem;
  gap: 1rem;
}

.public-header-right {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-shrink: 0;
}

.public-logo {
  display: flex;
  align-items: center;
  font-size: 1.5rem;
  color: var(--primary-color);
  flex-shrink: 0;
}

.public-logo i {
  font-size: 1.5rem;
}

.public-search-desktop {
  display: none;
  max-width: 20rem;
}

.public-search-input,
.public-search-input-full {
  width: 100%;
}

.public-nav-desktop {
  display: none;
  align-items: center;
  gap: 1.5rem;
}

.public-nav-link {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-color-secondary);
  transition: color var(--transition-duration);
}

.public-nav-link:hover,
.public-nav-link-active {
  color: var(--primary-color);
}

.public-header-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.public-icon-link {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  border-radius: var(--content-border-radius);
  color: var(--text-color-secondary);
}

.public-icon-link:hover {
  background: var(--surface-hover);
}

.public-cart-badge {
  position: absolute;
  top: -0.25rem;
  inset-inline-end: -0.25rem;
  width: 1.25rem;
  height: 1.25rem;
  background: var(--primary-color);
  color: var(--primary-contrast-color);
  font-size: 0.65rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.public-profile-link {
  display: none;
}

.public-dashboard-btn {
  display: none;
  align-items: center;
  gap: 0.4rem;
  padding: 0.4rem 0.85rem;
  border-radius: var(--content-border-radius);
  background: var(--primary-color);
  color: #ffffff;
  font-size: 0.8rem;
  font-weight: 600;
  text-decoration: none;
  transition: background 0.2s;
}

.public-dashboard-btn:hover {
  background: var(--p-primary-400);
}

.public-dashboard-btn i {
  font-size: 0.85rem;
}

.public-notifications-link {
  display: none;
}

/* User dropdown trigger */
.public-user-trigger {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.35rem 0.6rem;
  border: 1px solid var(--surface-border);
  border-radius: 2rem;
  background: var(--surface-card);
  color: var(--text-color);
  cursor: pointer;
  transition: background 0.2s;
}

.public-user-trigger:hover {
  background: var(--surface-hover);
}

.public-user-avatar {
  width: 1.75rem;
  height: 1.75rem;
  border-radius: 50%;
  background: var(--primary-color);
  color: #fff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.85rem;
  font-weight: 700;
  overflow: hidden;
}

.public-user-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.public-user-name {
  display: none;
  font-size: 0.85rem;
  font-weight: 600;
  max-width: 8rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.public-user-caret {
  font-size: 0.7rem;
  color: var(--text-color-secondary);
}

.public-btn-primary-link {
  text-decoration: none;
}


.public-mobile-toggle {
  display: inline-flex;
}

.public-search-mobile {
  padding-bottom: 1rem;
}

.public-mobile-nav {
  background: var(--surface-card);
  border-bottom: 1px solid var(--surface-border);
}

.public-mobile-nav-list {
  list-style: none;
  margin: 0;
  padding: 1rem 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.public-mobile-nav-link {
  display: block;
  width: 100%;
  text-align: start;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  color: var(--text-color-secondary);
  border-radius: var(--content-border-radius);
  background: none;
  border: none;
  cursor: pointer;
}

.public-mobile-nav-link:hover {
  background: var(--surface-hover);
}

.public-mobile-nav-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.public-mobile-auth {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding-top: 0.5rem;
  border-top: 1px solid var(--surface-border);
}

.public-btn-full {
  width: 100%;
  text-align: center;
  justify-content: center;
}

.public-main {
  flex: 1;
}

.public-footer {
  /* Footer colors use a deliberate dark-teal palette that is
     intentionally not the same as the light-mode surface tokens.
     Scoped variables preserve the current visual result and
     enable dark-mode adaptation via .app-dark. */
  --footer-bg: #004d6f;
  --footer-border: #003a54;
  --footer-text: #d7eef6;
  --footer-heading: #ffffff;
  --footer-muted: #b9dcea;
  --footer-muted-hover: #ffffff;
  --footer-bottom: #9cc9da;
  --footer-accent: var(--primary-color);
  --footer-accent-hover: var(--p-primary-400);

  background: var(--footer-bg);
  border-top: 1px solid var(--footer-border);
  color: var(--footer-text);
}

/* Dark mode: use the same teal primary scale, shifted for dark surfaces.
   The accent teal remains the brand color. */
:global(.app-dark) .public-footer {
  --footer-bg: var(--p-surface-950);
  --footer-border: var(--p-surface-900);
  --footer-text: var(--p-surface-300);
  --footer-heading: var(--p-surface-0);
  --footer-muted: var(--p-surface-400);
  --footer-muted-hover: var(--p-surface-100);
  --footer-bottom: var(--p-surface-500);
}

.public-footer-inner {
  padding: 3rem 1rem 2rem;
}

.public-footer-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 2.5rem;
}

/* About Us block (left side) */
.public-footer-about {
  max-width: 420px;
  margin-inline-start: auto;
}


.public-footer-brand {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--footer-heading);
  margin-bottom: 1rem;
}

.public-footer-brand i {
  font-size: 1.5rem;
  color: var(--footer-accent);
}

.public-footer-about-text {
  font-size: 0.9rem;
  line-height: 2;
  color: var(--footer-muted);
  margin: 0 0 1.25rem;
}

.public-footer-about-btn {
  display: inline-flex;
  align-items: center;
  padding: 0.7rem 1.5rem;
  border-radius: 0.6rem;
  background: var(--footer-accent);
  color: var(--primary-contrast-color);
  font-weight: 700;
  font-size: 0.9rem;
  text-decoration: none;
  transition: background 0.2s ease;
}

.public-footer-about-btn:hover {
  background: var(--footer-accent-hover);
}

.public-footer-heading {
  font-weight: 700;
  color: var(--footer-heading);
  margin: 0 0 1rem 0;
}

.public-footer-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.public-footer-link {
  font-size: 0.875rem;
  color: var(--footer-muted);
  transition: color 0.2s ease;
}

.public-footer-link:hover {
  color: var(--footer-muted-hover);
}

.public-footer-bottom {
  margin-top: 2.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid rgba(255, 255, 255, 0.15);
  text-align: center;
  font-size: 0.875rem;
  color: var(--footer-bottom);
}

@media (min-width: 768px) {
  .public-search-desktop {
    display: flex;
  }

  .public-profile-link {
    display: inline-flex;
  }

  .public-notifications-link {
    display: inline-flex;
  }

  .public-dashboard-btn {
    display: inline-flex;
  }

  .public-user-name {
    display: inline;
  }

  .public-footer-grid {
    grid-template-columns: 1fr 1fr 1fr 1.5fr;
  }

}



@media (min-width: 992px) {
  .public-nav-desktop {
    display: flex;
  }

  .public-search-toggle,
  .public-mobile-toggle {
    display: none;
  }
}

/* Two-tier storefront header: compact utility strip + primary navigation. */
.public-utility-bar {
  min-height: 2.25rem;
  border-bottom: 1px solid color-mix(in srgb, var(--ds-on-navy) 12%, transparent);
  background: var(--ds-navy);
  color: var(--ds-on-navy-muted);
}
.public-utility-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  min-height: 2.25rem;
}
.public-utility-message,
.public-utility-links {
  display: inline-flex;
  align-items: center;
  gap: .55rem;
  font-size: .72rem;
  line-height: 1.5;
}
.public-utility-message i { color: var(--ds-brand); }
.public-utility-links { gap: 1.1rem; }
.public-utility-links a {
  color: var(--ds-on-navy);
  text-decoration: none;
  transition: color var(--ds-transition-fast);
}
.public-utility-links a:hover { color: var(--ds-brand); }
.public-utility-links a:focus-visible {
  outline: 2px solid var(--ds-brand);
  outline-offset: 3px;
  border-radius: 2px;
}
@media (max-width: 767px) {
  .public-utility-bar { display: none; }
}
/* Public marketplace shell — shared brand system, Paces-level polish. */
.public-header {
  background: color-mix(in srgb, var(--ds-color-surface) 94%, transparent);
  border-bottom-color: var(--ds-color-border);
  box-shadow: var(--ds-shadow-xs);
  backdrop-filter: blur(14px);
}
.public-logo {
  width: 2.5rem;
  height: 2.5rem;
  justify-content: center;
  border-radius: var(--ds-radius-lg);
  background: color-mix(in srgb, var(--ds-color-primary) 10%, transparent);
}
.public-nav-link {
  min-height: 2.5rem;
  display: inline-flex;
  align-items: center;
  position: relative;
  text-decoration: none;
  transition: color var(--ds-transition-fast);
}
.public-nav-link:hover,
.public-nav-link-active { color: var(--ds-color-primary); }
.public-nav-link-active::after {
  position: absolute;
  inset-inline: 0;
  bottom: -0.75rem;
  height: 2px;
  border-radius: 2px;
  background: var(--ds-color-primary);
  content: "";
}
.public-search-input {
  border-radius: var(--ds-radius-lg);
  background: var(--ds-color-surface-alt);
}
.public-icon-link,
.public-user-trigger {
  border-radius: var(--ds-radius-lg);
}
.public-mobile-nav {
  border-bottom: 1px solid var(--ds-color-border);
  box-shadow: var(--ds-shadow-sm);
}
@media (max-width: 767px) {
  .public-header-row { height: 3.75rem; }
  .public-nav-link-active::after { display: none; }
}

/* Public marketplace header: clear brand lockup and deliberate action grouping. */
.public-header-row { min-height: 4.5rem; }
.public-header-right { gap: clamp(.85rem, 1.8vw, 1.75rem); }
.public-logo {
  display: inline-flex;
  align-items: center;
  justify-content: flex-start;
  gap: .65rem;
  width: auto;
  height: auto;
  padding: .25rem 0;
  border-radius: 0;
  background: transparent;
  text-decoration: none;
}
.public-logo-mark {
  display: grid;
  place-items: center;
  width: 2.7rem;
  height: 2.7rem;
  flex: 0 0 auto;
  border: 1px solid color-mix(in srgb, var(--ds-color-primary) 22%, transparent);
  border-radius: .9rem;
  background: color-mix(in srgb, var(--ds-color-primary) 11%, var(--ds-color-surface));
  color: var(--ds-color-primary);
}
.public-logo-mark i { font-size: 1.35rem; }
.public-logo-name {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: .05rem;
  line-height: 1.1;
}
.public-logo-name strong {
  color: var(--ds-color-brand-deep);
  font-size: 1.05rem;
  font-weight: 850;
  letter-spacing: -.025em;
}
.public-logo-name small {
  color: var(--ds-color-text-muted);
  font-size: .62rem;
  font-weight: 700;
  letter-spacing: .12em;
  text-transform: uppercase;
}
.public-header-actions { gap: .6rem; }
.public-search-desktop { width: clamp(12rem, 19vw, 19rem); }
.public-search-desktop :deep(.p-iconfield) { width: 100%; }
.public-search-input { min-height: 2.7rem; border-color: var(--ds-color-border); }
.public-icon-link {
  width: 2.65rem;
  height: 2.65rem;
  align-items: center;
  justify-content: center;
  border: 1px solid transparent;
}
.public-icon-link:hover {
  border-color: var(--ds-color-border);
  color: var(--ds-color-primary);
}
.public-user-trigger {
  min-height: 2.65rem;
  border-radius: var(--ds-radius-pill);
  border-color: var(--ds-color-border);
  background: var(--ds-color-surface);
}
.public-user-trigger:hover { border-color: color-mix(in srgb, var(--ds-color-primary) 35%, var(--ds-color-border)); }
.public-mobile-nav {
  position: absolute;
  inset-inline: 0;
  z-index: 99;
  background: var(--ds-color-surface);
}
.public-mobile-nav-list { gap: .35rem; }
.public-mobile-nav-link {
  display: flex;
  align-items: center;
  gap: .7rem;
  min-height: 2.8rem;
  border-radius: var(--ds-radius-md);
}
.public-mobile-nav-link i { width: 1.2rem; color: var(--ds-color-primary); }
.public-main { min-width: 0; }
.public-mobile-toggle {
  width: 2.75rem;
  height: 2.75rem;
  min-width: 2.75rem;
  min-height: 2.75rem;
  color: var(--ds-color-text);
}
.public-mobile-toggle:focus-visible,
.public-user-trigger:focus-visible,
.public-icon-link:focus-visible,
.public-nav-link:focus-visible,
.public-mobile-nav-link:focus-visible {
  outline: 2px solid var(--ds-color-focus);
  outline-offset: 3px;
}
.public-mobile-nav {
  max-height: min(70vh, 34rem);
  overflow-y: auto;
  overscroll-behavior: contain;
  border-top: 1px solid var(--ds-color-border);
}
.public-mobile-nav-link { min-height: 2.9rem; }
.public-footer { background: var(--ds-navy); }
.public-footer-inner { padding-top: clamp(2.5rem, 5vw, 4rem); }
.public-footer-grid { align-items: start; }
.public-footer-bottom { margin-top: 3rem; }
@media (max-width: 767px) {
  .public-header-row { min-height: 4rem; height: 4rem; }
  .public-logo-mark { width: 2.45rem; height: 2.45rem; }
  .public-logo-name strong { font-size: .98rem; }
  .public-logo-name small { font-size: .57rem; }
  .public-user-trigger { padding: .25rem; border: 0; background: transparent; }
  .public-user-caret { display: none; }
}
@media (prefers-reduced-motion: reduce) {
  .public-shell *, .public-shell *::before, .public-shell *::after {
    scroll-behavior: auto !important;
    transition-duration: .01ms !important;
    animation-duration: .01ms !important;
  }
}

</style>