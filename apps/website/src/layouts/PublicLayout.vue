<script setup>
/**
 * PublicLayout — website shell.
 *
 * Visual language: unified "tem" system (navy utility strip, white command
 * header, cyan/blue accents, pale canvas, Vazirmatn RTL).
 *
 * All existing behaviour is preserved verbatim: PKCE panel handoff links,
 * customer/company/staff menu branching, notification unread count, search
 * routing, category loading for the mega menu and footer, and mobile nav.
 */
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useCartStore } from '../stores/cart'
import { categoriesApi, endpoints } from '@telecom/api-client'
import { apiGet } from '@telecom/shared-core/http/apiClient'
import PvButton from 'primevue/button'
import InputText from 'primevue/inputtext'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import Menu from 'primevue/menu'
import MegaMenu from '@telecom/shared-ui/components/common/MegaMenu.vue'
import BrandMark from '@telecom/shared-ui/components/common/BrandMark.vue'

const authStore = useAuthStore()
const cartStore = useCartStore()
const cartItemCount = computed(() => cartStore.itemCount)
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
const headerSearchVisible = ref(false)
const showHeaderSearch = computed(() => route.name !== 'home' || headerSearchVisible.value)
function updateHeaderSearchVisibility() { headerSearchVisible.value = window.scrollY > 320 }
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
        { label: 'سفارش‌های من', icon: 'pi pi-shopping-bag', command: () => router.push('/orders') },
        { label: 'پشتیبانی و تیکت‌ها', icon: 'pi pi-headphones', command: () => router.push('/support/tickets') },
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
  window.addEventListener('scroll', updateHeaderSearchVisibility, { passive: true })
  updateHeaderSearchVisibility()
  // Fetch notification count for logged-in users
  if (isAuthenticated.value) {
    try {
      const result = await apiGet(endpoints.notifications.unreadCount)
      notificationCount.value = Number(result?.count ?? result?.data?.count ?? 0)
    } catch (err) {
      // Non-blocking: the badge simply stays hidden.
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

onUnmounted(() => window.removeEventListener('scroll', updateHeaderSearchVisibility))

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
  <div class="public-shell site-shell">
    <a class="public-skip-link" href="#public-main">رفتن به محتوای اصلی</a>

    <!-- Utility strip -->
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

    <!-- Command header -->
    <header class="public-header">
      <div class="public-container">
        <div class="public-header-row">
          <div class="public-header-right">
            <router-link :to="{ name: 'home' }" class="public-logo" aria-label="صفحه اصلی بازارگاه مخابرات">
              <BrandMark class="public-logo-mark" :size="38" />
              <span class="public-logo-name"><strong>Telecom Market</strong></span>
            </router-link>

            <nav class="public-nav-desktop" aria-label="منوی اصلی">
              <router-link to="/" class="public-nav-link" active-class="public-nav-link-active">صفحه اصلی</router-link>
              <router-link to="/products" class="public-nav-link" active-class="public-nav-link-active">همه محصولات</router-link>
              <MegaMenu :categories="megaMenuCategories" />
              <router-link to="/about" class="public-nav-link" active-class="public-nav-link-active">درباره ما</router-link>
              <router-link to="/contact" class="public-nav-link" active-class="public-nav-link-active">تماس با ما</router-link>
            </nav>
          </div>

          <div class="public-header-actions">
            <div class="public-commerce-actions" aria-label="خرید و استعلام">
              <router-link to="/cart" class="public-icon-link public-cart-link" aria-label="سبد خرید">
                <i class="pi pi-shopping-cart" aria-hidden="true"></i>
                <span v-if="cartItemCount > 0" class="public-notification-badge">{{ cartItemCount > 99 ? '۹۹+' : cartItemCount.toLocaleString('fa-IR') }}</span>
              </router-link>
              <router-link v-if="authStore.isCustomer" to="/my-inquiries" class="public-icon-link public-rfq-link" aria-label="لیست استعلام‌ها">
                <i class="pi pi-file-edit" aria-hidden="true"></i>
              </router-link>
            </div>
            <div v-if="showHeaderSearch" class="public-search-desktop">
              <IconField>
                <InputIcon class="pi pi-search" />
                <InputText
                  v-model="searchQuery"
                  @keyup.enter="search"
                  placeholder="جستجوی محصول، برند یا شرکت…"
                  aria-label="جستجوی محصولات"
                  class="public-search-input"
                />
              </IconField>
            </div>

            <template v-if="user">
              <a :href="notificationHref" class="public-icon-link public-notifications-link" aria-label="اعلان‌ها">
                <i class="pi pi-bell" aria-hidden="true"></i>
                <span v-if="notificationCount > 0" class="public-notification-badge">{{ notificationCount }}</span>
              </a>

              <button type="button" class="public-user-trigger" @click="toggleUserMenu" aria-haspopup="true">
                <span class="public-user-avatar">
                  <img v-if="authStore.profile?.avatar" :src="authStore.profile.avatar" alt="" width="32" height="32" decoding="async" />
                  <span v-else>{{ displayName.charAt(0) }}</span>
                </span>
                <span class="public-user-name">{{ displayName }}</span>
                <i class="pi pi-chevron-down public-user-caret"></i>
              </button>
              <Menu ref="userMenu" :model="userMenuItems" :popup="true" />
            </template>

            <template v-else>
              <router-link :to="{ name: 'login' }" class="tm-btn tm-btn--sm public-login-link">
                ورود / ثبت‌نام
              </router-link>
            </template>

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

        <div v-if="mobileMenuOpen && showHeaderSearch" class="public-search-mobile">
          <IconField>
            <InputIcon class="pi pi-search" />
            <InputText
              v-model="searchQuery"
              @keyup.enter="search"
              placeholder="جستجوی محصولات..."
              aria-label="جستجوی محصولات"
              class="public-search-input-full"
            />
          </IconField>
        </div>
      </div>
    </header>

    <!-- Mobile navigation -->
    <div v-if="mobileMenuOpen" id="public-mobile-navigation" class="public-mobile-nav">
      <nav class="public-container" aria-label="منوی اصلی موبایل">
        <ul class="public-mobile-nav-list">
          <li>
            <router-link :to="{ name: 'products' }" @click="mobileMenuOpen = false" class="public-mobile-nav-link">
              <i class="pi pi-box"></i>
              <span>همه محصولات</span>
            </router-link>
          </li>
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
          <li v-else>
            <router-link :to="{ name: 'login' }" @click="mobileMenuOpen = false" class="public-mobile-nav-link">
              <i class="pi pi-sign-in"></i>
              <span>ورود / ثبت‌نام</span>
            </router-link>
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
          <div class="public-footer-about">
            <div class="public-footer-brand">
              <BrandMark :size="34" />
              <span>Telecom Market</span>
            </div>
            <p class="public-footer-about-text">
              فضایی برای مشاهده تجهیزات مخابراتی، بررسی اطلاعات ثبت‌شده محصولات
              و ارتباط با تأمین‌کنندگان. کاربران می‌توانند بر اساس دسته‌بندی و
              مشخصات فنی جستجو کنند و در صورت نیاز درخواست استعلام ثبت کنند.
            </p>
            <router-link :to="{ name: 'about' }" class="public-footer-about-btn">
              اطلاعات بیشتر درباره ما
            </router-link>
          </div>

          <div>
            <h3 class="public-footer-heading">دسترسی سریع</h3>
            <ul class="public-footer-list">
              <li><router-link to="/" class="public-footer-link">صفحه اصلی</router-link></li>
              <li><router-link to="/products" class="public-footer-link">همه محصولات</router-link></li>
              <li><router-link to="/categories" class="public-footer-link">دسته‌بندی‌ها</router-link></li>
              <li><router-link to="/about" class="public-footer-link">درباره ما</router-link></li>
            </ul></div>

          <div>
            <h3 class="public-footer-heading">دسته‌بندی‌ها</h3>
            <ul class="public-footer-list">
              <li v-for="cat in footerCategories" :key="cat.id">
                <router-link :to="{ name: 'products', query: { category: cat.id } }" class="public-footer-link">{{ cat.nameFa }}</router-link>
              </li>
            </ul>
          </div>

          <div>
            <h3 class="public-footer-heading">خدمات مشتری</h3>
            <ul class="public-footer-list">
              <li><router-link :to="{ name: 'faq' }" class="public-footer-link">سوالات متداول</router-link></li>
              <li><router-link :to="{ name: 'contact' }" class="public-footer-link">تماس با ما</router-link></li>
              <li><router-link :to="{ name: 'terms' }" class="public-footer-link">قوانین و حریم خصوصی</router-link></li>
            </ul>
          </div>
        </div>

        <div class="public-footer-bottom">
          <p>© {{ new Date().getFullYear() }} Telecom Market. تمام حقوق محفوظ است.</p>
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
  inset-block-start: 0.5rem;
  inset-inline-start: 0.5rem;
  transform: translateY(-160%);
  padding: 0.7rem 1rem;
  border: 1px solid var(--tm-blue);
  border-radius: var(--tm-radius);
  background: #fff;
  color: var(--tm-ink);
  font-size: var(--tm-fs-sm);
  font-weight: 700;
  text-decoration: none;
  box-shadow: var(--tm-shadow-md);
  transition: transform 0.16s ease;
}
.public-skip-link:focus { transform: translateY(0); outline: 3px solid var(--tm-cyan); outline-offset: 2px; }
.public-main:focus { outline: 2px solid var(--tm-cyan); outline-offset: 3px; }

.public-container {
  width: 100%;
  max-width: var(--ds-container-max-wide);
  margin-inline: auto;
  padding-inline: var(--ds-container-pad);
}

/* ---------- Utility strip ---------- */
.public-utility-bar {
  background: var(--tm-navy);
  color: #d5e2f0;
  font-size: 12px;
}
.public-utility-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  min-height: 36px;
}
.public-utility-message { display: inline-flex; align-items: center; gap: 8px; }
.public-utility-message i { color: var(--tm-cyan); font-size: 12px; }
.public-utility-links { display: flex; align-items: center; gap: 18px; }
.public-utility-links a { color: #d5e2f0; text-decoration: none; }
.public-utility-links a:hover { color: var(--tm-cyan); }

/* ---------- Header ---------- */
.public-header {
  background: #fff;
  border-bottom: 1px solid var(--tm-line);
  position: sticky;
  top: 0;
  z-index: 100;
}

.public-header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 62px;
  gap: 16px;
}

.public-header-right { display: flex; align-items: center; gap: 26px; min-width: 0; }

.public-logo {
  display: flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;
  flex-shrink: 0;
}
.public-logo-name { display: flex; flex-direction: column; line-height: 1.1; }
.public-logo-name strong { font-size: 17px; font-weight: 700; color: var(--tm-navy); }
.public-logo-name small { font-size: 10px; letter-spacing: 0.16em; color: var(--tm-muted); text-transform: uppercase; }

.public-nav-desktop { display: none; align-items: center; gap: clamp(10px, 1.1vw, 18px); flex-wrap: nowrap; white-space: nowrap; }
.public-nav-link {
  font-size: 13px;
  font-weight: 600;
  color: var(--tm-ink-soft);
  white-space: nowrap;
  text-decoration: none;
  padding: 6px 0;
  border-bottom: 2px solid transparent;
  transition: color 0.15s ease, border-color 0.15s ease;
}
.public-nav-link:hover { color: var(--tm-blue); }
.public-nav-link-active { color: var(--tm-blue); border-bottom-color: var(--tm-cyan); }

.public-header-actions { display: flex; align-items: center; gap: 7px; margin-inline-start: auto; flex: none; }
.public-commerce-actions { display: inline-flex; align-items: center; gap: 4px; padding-inline-end: 6px; border-inline-end: 1px solid var(--tm-line); }
.public-search-desktop { display: none; width: 290px; }
.public-search-input,
.public-search-input-full { width: 100%; }
.public-search-input :deep(.p-inputtext) { border-radius: var(--tm-radius-pill); padding-inline-start: 2.2rem; background: var(--tm-surface-alt); }

.public-icon-link {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: var(--tm-radius);
  color: var(--tm-ink-soft);
  text-decoration: none;
}
.public-icon-link:hover { background: var(--tm-cyan-soft); color: var(--tm-cyan-deep); }

.public-notification-badge {
  position: absolute;
  top: 1px;
  inset-inline-end: 1px;
  min-width: 17px;
  height: 17px;
  padding: 0 4px;
  background: var(--tm-red);
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  border-radius: var(--tm-radius-pill);
  display: grid;
  place-items: center;
}

.public-user-trigger {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 4px 8px 4px 4px;
  border: 1px solid var(--tm-line);
  border-radius: var(--tm-radius-pill);
  background: #fff;
  cursor: pointer;
  font-family: inherit;
}
.public-user-trigger:hover { border-color: var(--tm-cyan-strong); }
.public-user-trigger:focus-visible,.public-icon-link:focus-visible,.public-nav-link:focus-visible { outline: 2px solid var(--ds-color-focus); outline-offset: 3px; }
.public-user-avatar {
  display: grid;
  place-items: center;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  overflow: hidden;
  background: var(--tm-blue-soft);
  color: var(--tm-blue-strong);
  font-size: 12px;
  font-weight: 700;
  flex: none;
}
.public-user-avatar img { width: 100%; height: 100%; object-fit: cover; }
.public-user-name { font-size: 12px; font-weight: 600; color: var(--tm-ink); max-width: 120px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.public-user-caret { font-size: 10px; color: var(--tm-muted); }

.public-login-link { text-decoration: none; }

.public-search-mobile { padding-bottom: 14px; }

/* ---------- Mobile nav ---------- */
.public-mobile-nav {
  background: #fff;
  border-bottom: 1px solid var(--tm-line);
  box-shadow: var(--tm-shadow-sm);
}
.public-mobile-nav-list { list-style: none; margin: 0; padding: 8px 0 16px; display: flex; flex-direction: column; gap: 2px; }
.public-mobile-nav-link {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 11px 12px;
  border-radius: var(--tm-radius);
  color: var(--tm-ink-soft);
  font-size: 13px;
  font-weight: 600;
  text-decoration: none;
}
.public-mobile-nav-link:hover { background: var(--tm-surface-alt); color: var(--tm-blue); }
.public-mobile-nav-link i { color: var(--tm-muted); }
.public-mobile-auth { border-top: 1px solid var(--tm-line); margin-top: 8px; padding-top: 8px; }

/* ---------- Main ---------- */
.public-main { flex: 1; padding: 24px 0 48px; }

/* ---------- Footer ---------- */
.public-footer {
  background: linear-gradient(180deg, var(--tm-navy) 0%, var(--tm-navy-deep) 100%);
  color: rgba(255,255,255,.24);
  padding: 42px 0 0;
  margin-top: auto;
}
.public-footer-grid {
  display: grid;
  grid-template-columns: minmax(260px, 1.6fr) repeat(3, minmax(180px, 1fr));
  gap: clamp(1.25rem, 2vw, 2rem);
  padding-bottom: 32px;
}
.public-footer-heading {
  margin: 0 0 14px;
  font-size: 13px;
  font-weight: 700;
  color: #fff;
}
.public-footer-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 9px; }
.public-footer-link { color: #d5e2f0; font-size: 12.5px; text-decoration: none; }
.public-footer-link:hover { color: var(--tm-cyan); }
.public-footer-brand { display: flex; align-items: center; gap: 9px; color: #fff; font-size: 16px; font-weight: 700; margin-bottom: 12px; }
.public-footer-about-text { margin: 0 0 14px; font-size: 12.5px; line-height: 1.9; color: rgba(255,255,255,.72); }
.public-footer-about-btn {
  display: inline-flex;
  padding: 7px 14px;
  border: 1px solid rgba(46, 211, 238, 0.5);
  border-radius: var(--tm-radius-pill);
  color: var(--tm-cyan);
  font-size: 12px;
  font-weight: 600;
  text-decoration: none;
}
.public-footer-about-btn:hover { background: rgba(46, 211, 238, 0.12); }
.public-footer-bottom {
  border-top: 1px solid rgba(207, 217, 238, 0.14);
  padding: 16px 0;
  font-size: 11.5px;
  color: rgba(255,255,255,.55);
  text-align: center;
}

@media (min-width: 992px) {
  .public-nav-desktop { display: flex; }
  .public-search-desktop { display: block; }
  .public-mobile-toggle { display: none !important; }
  .public-search-mobile { display: none; }
}

@media (max-width: 1199px) {
  .public-header-right { gap: 12px; }
  .public-nav-desktop { gap: 10px; }
  .public-logo-name strong { font-size: 15px; }
  .public-search-desktop { width: 205px; }
}

@media (max-width: 991px) {
  .public-utility-message { font-size: 11px; }
  .public-user-name { display: none; }
  .public-footer-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .public-footer-about { grid-column: 1 / -1; }
}

@media (max-width: 575px) {
  .public-utility-links { display: none; }
  .public-footer-grid { grid-template-columns: minmax(0, 1fr); }
  .public-main { padding-top: 16px; }
}
</style>