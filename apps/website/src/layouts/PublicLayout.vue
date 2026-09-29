<script setup>
import { ref, computed, onMounted } from 'vue'
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

// The website is a PUBLIC marketplace only — it has no dashboard, profile, or
// notifications routes. Those live in separate apps (company / admin). We link
// out to them via env-configured origins instead of internal router names.
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


const displayName = computed(() => {
  const profile = authStore.profile
  const fullName = profile ? [profile.firstName, profile.lastName].filter(Boolean).join(' ') : ''
  return fullName || user.value?.email || 'کاربر'
})

// Dropdown menu items — visibility depends on the user's access level.
const userMenuItems = computed(() => {
  // Profile / inquiries / notifications live in the company dashboard app.
  const items = [
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
      const result = await apiGet('/api/v1/notifications/unread-count')
      notificationCount.value = result.count || 0
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
  }
}

function logout() {
  authStore.logout()
  router.push({ name: 'home' })
}
</script>

<template>
  <div class="public-shell">
    <!-- Header -->
    <header class="public-header">
      <div class="public-container">
        <div class="public-header-row">
          <!-- Right side: Logo + Navigation -->
          <div class="public-header-right">
            <router-link :to="{ name: 'home' }" class="public-logo">
              <i class="pi pi-wifi"></i>
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
              <a :href="panelStartUrl(companyAppUrl, '/notifications')" class="public-icon-link public-notifications-link">
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
              icon="pi pi-bars"
              text
              rounded
              class="public-mobile-toggle"
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
    <div v-if="mobileMenuOpen" class="public-mobile-nav">
      <nav class="public-container">
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

            <a :href="panelStartUrl(companyAppUrl, '/notifications')" @click="mobileMenuOpen = false" class="public-mobile-nav-link">
              <i class="pi pi-bell"></i>
              <span>اعلان‌ها {{ notificationCount > 0 ? `(${notificationCount})` : '' }}</span>
            </a>
            <a :href="panelStartUrl(companyAppUrl, '/profile')" @click="mobileMenuOpen = false" class="public-mobile-nav-link">
              <i class="pi pi-user"></i>
              <span>{{ displayName }}</span>
            </a>

          </li>
        </ul>
      </nav>
    </div>

    <!-- Main content -->
    <main class="public-main">
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

.public-container {
  width: 100%;
  max-width: 1440px;
  margin: 0 auto;
  padding: 0 2rem;
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
  background: #004d6f;
  border-top: 1px solid #003a54;
  color: #d7eef6;
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
  color: #ffffff;
  margin-bottom: 1rem;
}

.public-footer-brand i {
  font-size: 1.5rem;
  color: var(--primary-color);
}

.public-footer-about-text {
  font-size: 0.9rem;
  line-height: 2;
  color: #b9dcea;
  margin: 0 0 1.25rem;
}

.public-footer-about-btn {
  display: inline-flex;
  align-items: center;
  padding: 0.7rem 1.5rem;
  border-radius: 0.6rem;
  background: var(--primary-color);
  color: #ffffff;
  font-weight: 700;
  font-size: 0.9rem;
  text-decoration: none;
  transition: background 0.2s ease;
}

.public-footer-about-btn:hover {
  background: var(--p-primary-400);
}

.public-footer-heading {
  font-weight: 700;
  color: #ffffff;
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
  color: #b9dcea;
  transition: color 0.2s ease;
}

.public-footer-link:hover {
  color: #ffffff;
}

.public-footer-bottom {
  margin-top: 2.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid rgba(255, 255, 255, 0.15);
  text-align: center;
  font-size: 0.875rem;
  color: #9cc9da;
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
</style>
