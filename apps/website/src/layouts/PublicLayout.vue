<script setup>
/**
 * PublicLayout — website shell.
 *
 * Visual language: unified "tem" system (navy utility strip, white command
 * header, cyan/blue accents, pale canvas, Vazirmatn RTL).
 *
 * All existing behaviour is preserved verbatim: PKCE panel handoff links,
 * customer/company/staff menu branching, notification unread count, search
 * routing, live notification, search, account, cart and mobile navigation behaviour.
 */
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useCartStore } from '../stores/cart'
import { inquiriesApi, endpoints } from '@telecom/api-client'
import { apiGet, apiGetPaginated } from '@telecom/shared-core/http/apiClient'
import PvButton from 'primevue/button'
import Menu from 'primevue/menu'
import Drawer from 'primevue/drawer'

const authStore = useAuthStore()
const cartStore = useCartStore()
const cartItemCount = computed(() => cartStore.itemCount)
const cartDrawerOpen = ref(false)
const myInquiryCount = ref(null)
const router = useRouter()
const route = useRoute()

// Keep the responsive navigation in sync with route changes (including
// browser back/forward) so it never remains open over a new page.
watch(() => route.fullPath, () => { mobileMenuOpen.value = false; cartDrawerOpen.value = false; notificationDrawerOpen.value = false })
watch(() => [authStore.isAuthenticated, authStore.isCustomer], () => { fetchMyInquiryCount(); fetchHeaderNotifications() })

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


const mobileMenuOpen = ref(false)
const notificationCount = ref(0)
const latestNotifications = ref([])
const notificationDrawerOpen = ref(false)
const notificationLoading = ref(false)
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

async function fetchMyInquiryCount() {
  if (!authStore.isAuthenticated || !authStore.isCustomer) {
    myInquiryCount.value = null
    return
  }
  try {
    const result = await inquiriesApi.list({ scope: 'sent', page: 1, limit: 1 })
    const body = result?.data ?? result
    const payload = body?.data ?? body
    const meta = payload?.meta ?? body?.meta
    const total = Number(meta?.total ?? meta?.totalItems)
    if (Number.isFinite(total)) myInquiryCount.value = total
    else if (Array.isArray(payload)) myInquiryCount.value = payload.length
    else if (Array.isArray(payload?.data)) myInquiryCount.value = payload.data.length
    else myInquiryCount.value = null
  } catch {
    myInquiryCount.value = null
  }
}

function countLabel(value) {
  const count = Number(value) || 0
  return count > 99 ? '۹۹+' : count.toLocaleString('fa-IR')
}

function closeCartDrawer() { cartDrawerOpen.value = false }
function closeNotificationDrawer() { notificationDrawerOpen.value = false }

function normalizeHeaderNotifications(result) {
  if (Array.isArray(result)) return result
  if (Array.isArray(result?.data)) return result.data
  if (Array.isArray(result?.data?.data)) return result.data.data
  if (Array.isArray(result?.notifications)) return result.notifications
  return []
}

async function fetchHeaderNotifications() {
  if (!authStore.isAuthenticated) {
    notificationCount.value = 0
    latestNotifications.value = []
    return
  }
  notificationLoading.value = true
  try {
    const [countResult, listResult] = await Promise.all([
      apiGet(endpoints.notifications.unreadCount),
      apiGetPaginated(`${endpoints.notifications.list}?page=1&limit=5`),
    ])
    notificationCount.value = Number(countResult?.count ?? countResult?.data?.count ?? 0)
    latestNotifications.value = normalizeHeaderNotifications(listResult).slice(0, 5)
  } catch {
    latestNotifications.value = []
  } finally {
    notificationLoading.value = false
  }
}

function formatNotificationTime(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleString('fa-IR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function openNotificationCenter() {
  closeNotificationDrawer()
  if (authStore.isCustomer) router.push({ name: 'notifications' })
  else window.location.href = notificationHref.value
}

function toggleUserMenu(event) {
  userMenu.value?.toggle(event)
}


const navItems = [
  { name: 'درباره ما', path: '/about', icon: 'pi pi-info-circle' },
  { name: 'تماس با ما', path: '/contact', icon: 'pi pi-phone' }
]


onMounted(async () => {
  fetchMyInquiryCount()
  // Keep the header badge and its five-message preview in sync with live notifications.
  await fetchHeaderNotifications()

})


function logout() {
  authStore.logout()
  router.push({ name: 'products' })
}
</script>

<template>
  <div class="public-shell site-shell">
    <a class="public-skip-link" href="#public-main">رفتن به محتوای اصلی</a>

    <!-- Utility strip -->
    <div class="public-utility-bar">
      <div class="public-container public-utility-inner">
        <span class="public-utility-message"><b>آخرین خبر:</b> بازارگاه تخصصی تجهیزات شبکه و مخابرات</span>
        <nav class="public-utility-links" aria-label="دسترسی‌های راهنما">
          <router-link :to="{ name: 'faq' }">راهنمای کاربران</router-link>
          <span aria-hidden="true">·</span>
          <router-link :to="{ name: 'contact' }">تماس با ما</router-link>
        </nav>
      </div>
    </div>

    <!-- Command header -->
    <header class="public-header">
      <div class="public-container">
        <div class="public-header-row">
          <div class="public-header-right">
            <router-link :to="{ name: 'home' }" class="public-logo" aria-label="صفحه اصلی بازارگاه تجهیزات مخابراتی">
              <i class="public-logo-symbol" aria-hidden="true"></i>
              <span class="public-logo-name"><strong>Telecom Market</strong></span>
            </router-link>

            <nav class="public-nav-desktop" aria-label="منوی اصلی">
              <router-link :to="{ name: 'home' }" class="public-nav-link" active-class="public-nav-link-active"><i class="pi pi-home" aria-hidden="true"></i><span>صفحه اصلی</span></router-link>
              <router-link :to="{ name: 'products' }" class="public-nav-link" active-class="public-nav-link-active"><i class="pi pi-box" aria-hidden="true"></i><span>محصولات</span></router-link>
              <router-link :to="{ name: 'categories' }" class="public-nav-link" active-class="public-nav-link-active"><span>دسته‌بندی</span></router-link>
              <span class="public-nav-link public-nav-link--static">برندها</span>
              <router-link to="/about" class="public-nav-link" active-class="public-nav-link-active"><i class="pi pi-info-circle" aria-hidden="true"></i><span>درباره ما</span></router-link>
              <router-link to="/contact" class="public-nav-link" active-class="public-nav-link-active"><i class="pi pi-phone" aria-hidden="true"></i><span>تماس با ما</span></router-link>
            </nav>
          </div>

          <div class="public-header-actions">
            <div v-if="user" class="public-authenticated-actions">
              <div class="public-notifications-actions" @keydown.esc.stop.prevent="closeNotificationDrawer">
                <button type="button" class="public-icon-link public-notifications-link" aria-label="اعلان‌ها" aria-controls="public-notifications-menu"  :aria-expanded="notificationDrawerOpen" @click.stop="notificationDrawerOpen = true">
                  <i class="pi pi-bell" aria-hidden="true"></i>
                  <span v-if="notificationCount > 0" class="public-notification-badge">{{ countLabel(notificationCount) }}</span>
                </button>
                <Drawer
                  id="public-notifications-menu"
                  v-model:visible="notificationDrawerOpen"
                  position="left"
                  :modal="true"
                  :dismissable="true"
                  :block-scroll="true"
                  :show-close-icon="false"
                  class="public-notifications-drawer"
                  :style="{ width: 'min(410px, 92vw)' }"
                  aria-label="اعلان‌های اخیر"
                >
                  <template #header>
                    <header class="public-notifications-menu__header">
                      <div class="public-notifications-menu__heading"><strong>اعلان‌های اخیر</strong><span>آخرین ۵ اعلان</span></div>
                      <span v-if="notificationCount > 0" class="public-notifications-menu__unread">{{ countLabel(notificationCount) }} خوانده‌نشده</span>
                      <button type="button" class="public-notifications-close" aria-label="بستن اعلان‌ها" @click="closeNotificationDrawer"><i class="pi pi-times" aria-hidden="true"></i></button>
                    </header>
                  </template>
                  <div v-if="notificationLoading" class="public-notifications-menu__state" role="status">در حال دریافت اعلان‌ها…</div>
                  <div v-else-if="latestNotifications.length" class="public-notifications-menu__list">
                    <button v-for="item in latestNotifications" :key="item.id" type="button" class="public-notification-item" :class="{ 'is-unread': !item.isRead }" @click="openNotificationCenter">
                      <span class="public-notification-item__dot" aria-hidden="true"></span>
                      <span class="public-notification-item__body">
                        <strong>{{ item.title || 'اعلان جدید' }}</strong>
                        <span>{{ item.message || item.body || 'برای مشاهده جزئیات، صندوق اعلان‌ها را باز کنید.' }}</span>
                        <time v-if="item.createdAt || item.created_at" :datetime="item.createdAt || item.created_at">{{ formatNotificationTime(item.createdAt || item.created_at) }}</time>
                      </span>
                    </button>
                  </div>
                  <div v-else class="public-notifications-menu__state">اعلانی برای نمایش وجود ندارد.</div>
                  <template #footer>
                    <button type="button" class="public-notifications-menu__all" @click="openNotificationCenter">مشاهده همه اعلان‌ها <i class="pi pi-arrow-left" aria-hidden="true"></i></button>
                  </template>
                </Drawer>
              </div>

            <div class="public-commerce-actions" @keydown.esc.stop.prevent="closeCartDrawer">
              <button type="button" class="public-icon-link public-commerce-trigger" aria-label="سبد خرید" aria-controls="public-cart-drawer" :aria-expanded="cartDrawerOpen" @click.stop="cartDrawerOpen = true">
                <i class="pi pi-shopping-cart" aria-hidden="true"></i>
                <span v-if="cartItemCount > 0" class="public-notification-badge">{{ countLabel(cartItemCount) }}</span>
              </button>
            </div>

              <button type="button" class="public-user-trigger" @click="toggleUserMenu" aria-haspopup="true">
                <span class="public-user-avatar">
                  <img v-if="authStore.profile?.avatar" :src="authStore.profile.avatar" alt="" width="32" height="32" decoding="async" />
                  <span v-else>{{ displayName.charAt(0) }}</span>
                </span>
                <span class="public-user-name">{{ displayName }}</span>
                <i class="pi pi-chevron-down public-user-caret" aria-hidden="true"></i>
              </button>
              <Menu ref="userMenu" :model="userMenuItems" :popup="true" />
            </div>

            <div v-else class="public-guest-actions">
              <router-link :to="{ name: 'login' }" class="tm-btn tm-btn--sm public-login-link">
                ورود / ثبت‌نام
              </router-link>
            </div>

            <div v-if="!user" class="public-commerce-actions" @keydown.esc.stop.prevent="closeCartDrawer">
              <button type="button" class="public-icon-link public-commerce-trigger" aria-label="سبد خرید" aria-controls="public-cart-drawer" :aria-expanded="cartDrawerOpen" @click.stop="cartDrawerOpen = true">
                <i class="pi pi-shopping-cart" aria-hidden="true"></i>
                <span v-if="cartItemCount > 0" class="public-notification-badge">{{ countLabel(cartItemCount) }}</span>
              </button>
            </div>

            <PvButton
              :icon="mobileMenuOpen ? 'pi pi-times' : 'pi pi-compass'"
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

      </div>
    </header>

    <Drawer
      id="public-cart-drawer"
      v-model:visible="cartDrawerOpen"
      position="left"
      :modal="true"
      :dismissable="true"
      :block-scroll="true"
      :show-close-icon="false"
      class="public-cart-drawer"
      :style="{ width: 'min(440px, 94vw)' }"
      aria-label="سبد خرید"
    >
      <template #header>
        <header class="public-cart-drawer__header">
          <div><strong>سبد خرید شما</strong><span>{{ countLabel(cartItemCount) }} قلم کالا</span></div>
          <button type="button" aria-label="بستن سبد خرید" @click="closeCartDrawer"><i class="pi pi-times"></i></button>
        </header>
      </template>
      <div v-if="cartStore.items.length" class="public-cart-drawer__items">
        <article v-for="item in cartStore.items" :key="item.id" class="public-cart-item">
          <router-link :to="{ name: 'product-details', params: { id: item.id } }" class="public-cart-item__image" @click="closeCartDrawer">
            <img v-if="item.image" :src="item.image" :alt="item.name" loading="lazy" />
            <i v-else class="pi pi-box" aria-hidden="true"></i>
          </router-link>
          <div class="public-cart-item__body">
            <router-link :to="{ name: 'product-details', params: { id: item.id } }" @click="closeCartDrawer">{{ item.name }}</router-link>
            <strong>{{ Number(item.price).toLocaleString('fa-IR') }} ریال</strong>
            <div class="public-cart-item__controls">
              <button type="button" :aria-label="'افزایش تعداد ' + item.name" @click="cartStore.updateQuantity(item.id, item.quantity + 1)"><i class="pi pi-plus"></i></button>
              <span>{{ countLabel(item.quantity) }}</span>
              <button type="button" :aria-label="'کاهش تعداد ' + item.name" :disabled="item.quantity <= 1" @click="cartStore.updateQuantity(item.id, item.quantity - 1)"><i class="pi pi-minus"></i></button>
              <button type="button" class="remove" :aria-label="'حذف ' + item.name" @click="cartStore.removeItem(item.id)"><i class="pi pi-trash"></i></button>
            </div>
          </div>
        </article>
      </div>
      <div v-else class="public-cart-drawer__empty"><i class="pi pi-shopping-bag"></i><strong>سبد خرید خالی است</strong><span>محصولات موردنیازتان را به سبد اضافه کنید.</span><router-link :to="{ name: 'products' }" class="tm-btn tm-btn--accent" @click="closeCartDrawer">مشاهده محصولات</router-link></div>
      <template #footer>
        <footer v-if="cartStore.items.length" class="public-cart-drawer__footer">
          <div><span>جمع کل</span><strong>{{ Number(cartStore.subtotal).toLocaleString('fa-IR') }} ریال</strong></div>
          <button type="button" class="public-cart-continue" @click="closeCartDrawer">ادامه خرید</button>
          <router-link to="/checkout" class="tm-btn tm-btn--accent" @click="closeCartDrawer">ادامه و تسویه حساب <i class="pi pi-arrow-left"></i></router-link>
        </footer>
      </template>
    </Drawer>

    <!-- Mobile navigation -->
    <div v-if="mobileMenuOpen" id="public-mobile-navigation" class="public-mobile-nav">
      <nav class="public-container" aria-label="منوی اصلی موبایل">
        <ul class="public-mobile-nav-list">
          <li>
            <router-link :to="{ name: 'home' }" @click="mobileMenuOpen = false" class="public-mobile-nav-link">
              <i class="pi pi-home"></i>
              <span>صفحه اصلی</span>
            </router-link>
          </li>
          <li>
            <router-link :to="{ name: 'products' }" @click="mobileMenuOpen = false" class="public-mobile-nav-link">
              <i class="pi pi-box"></i>
              <span>محصولات</span>
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
              <i :class="item.icon || 'pi pi-circle'" aria-hidden="true"></i><span>{{ item.name }}</span>
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
              <span>اعلان‌ها {{ notificationCount > 0 ? '(' + countLabel(notificationCount) + ')' : '' }}</span>
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
            <div class="public-footer-brand"><i class="public-logo-symbol" aria-hidden="true"></i><span>Telecom Market</span></div>
            <p class="public-footer-about-text">بازارگاه تخصصی تجهیزات شبکه و مخابرات؛ جستجوی محصولات، بررسی مشخصات و ثبت درخواست استعلام سازمانی.</p>
          </div>
          <div>
            <h3 class="public-footer-heading">دسترسی سریع</h3>
            <ul class="public-footer-list">
              <li><router-link :to="{ name: 'home' }" class="public-footer-link">صفحه اصلی</router-link></li>
              <li><router-link :to="{ name: 'products' }" class="public-footer-link">همه محصولات</router-link></li>
              <li><router-link :to="{ name: 'categories' }" class="public-footer-link">دسته‌بندی‌ها</router-link></li>
              <li><router-link :to="{ name: 'my-inquiries' }" class="public-footer-link">ثبت استعلام</router-link></li>
            </ul>
          </div>
          <div>
            <h3 class="public-footer-heading">پشتیبانی</h3>
            <ul class="public-footer-list">
              <li><router-link :to="{ name: 'faq' }" class="public-footer-link">راهنمای کاربران</router-link></li>
              <li><router-link :to="{ name: 'terms' }" class="public-footer-link">قوانین و مقررات</router-link></li>
              <li><router-link :to="{ name: 'terms' }" class="public-footer-link">حریم خصوصی</router-link></li>
              <li><router-link :to="{ name: 'contact' }" class="public-footer-link">تماس با ما</router-link></li>
            </ul>
          </div>
          <div>
            <h3 class="public-footer-heading">آخرین مطالب وبلاگ</h3>
            <p class="public-footer-about-text">مطالب آموزشی و اخبار پس از اتصال سرویس محتوای منتشرشده در این بخش نمایش داده می‌شوند.</p>
          </div>
          <div>
            <h3 class="public-footer-heading">ارتباط با ما</h3>
            <p class="public-footer-about-text">برای ارتباط با پشتیبانی و ارسال پیام، از فرم تماس با ما استفاده کنید.</p>
            <router-link :to="{ name: 'contact' }" class="public-footer-link">ورود به صفحه تماس با ما ←</router-link>
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
  background: var(--tm-surface);
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
  font-size: 13px;
}
.public-utility-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  min-height: 36px;
}
.public-utility-message { display: inline-flex; align-items: center; gap: 8px; }
.public-utility-message i { color: var(--tm-cyan); font-size: 13px; }
.public-utility-links { display: flex; align-items: center; gap: 18px; }
.public-utility-links a { color: #d5e2f0; text-decoration: none; }
.public-utility-links a:hover { color: var(--tm-cyan); }

/* ---------- Header ---------- */
.public-header {
  background: var(--tm-surface);
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
.public-logo-name strong { font-size: 17px; font-weight: 700; color: var(--tm-ink); }
.public-logo-name small { font-size: 13px; letter-spacing: 0.16em; color: var(--tm-muted); text-transform: uppercase; }

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
.public-commerce-actions { position: relative; display: inline-flex; align-items: center; padding-inline-end: 6px; border-inline-end: 1px solid var(--tm-line); }
.public-commerce-trigger { border: 0; background: transparent; cursor: pointer; }
.public-commerce-menu { position: absolute; inset-inline-end: 0; inset-block-start: calc(100% + 8px); z-index: 1200; display: grid; gap: 4px; min-width: 220px; padding: 8px; border: 1px solid var(--tm-line); border-radius: 12px; background: var(--tm-surface); box-shadow: var(--tm-shadow-lg); }
.public-commerce-tab { display: flex; align-items: center; justify-content: space-between; gap: 1rem; min-height: 44px; padding: .55rem .7rem; border-radius: 8px; color: var(--tm-ink); text-decoration: none; font-size: 13px; font-weight: 700; }
.public-commerce-tab > span { display: inline-flex; align-items: center; gap: .55rem; }
.public-commerce-tab > b { color: var(--tm-blue); font-variant-numeric: tabular-nums; }
.public-commerce-tab:hover,.public-commerce-tab:focus-visible { background: var(--tm-surface-alt); outline: none; }
.public-commerce-tab:focus-visible { box-shadow: 0 0 0 2px var(--ds-color-focus); }
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
  font-size: 13px;
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
  background: var(--tm-surface);
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
  font-size: 13px;
  font-weight: 700;
  flex: none;
}
.public-user-avatar img { width: 100%; height: 100%; object-fit: cover; }
.public-user-name { font-size: 13px; font-weight: 600; color: var(--tm-ink); max-width: 180px; white-space: normal; overflow-wrap: anywhere; line-height: 1.4; }
.public-user-caret { font-size: 13px; color: var(--tm-muted); }

.public-login-link { text-decoration: none; }

.public-search-mobile { padding-bottom: 14px; }

/* ---------- Mobile nav ---------- */
.public-mobile-nav {
  background: var(--tm-surface);
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
.public-main { flex: 1; padding: 10px 0 48px; }

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
.public-footer-link { color: #d5e2f0; font-size: 13px; text-decoration: none; }
.public-footer-link:hover { color: var(--tm-cyan); }
.public-footer-brand { display: flex; align-items: center; gap: 9px; color: #fff; font-size: 16px; font-weight: 700; margin-bottom: 12px; }
.public-footer-about-text { margin: 0 0 14px; font-size: 13px; line-height: 1.9; color: rgba(255,255,255,.72); }
.public-footer-bottom {
  border-top: 1px solid rgba(207, 217, 238, 0.14);
  padding: 16px 0;
  font-size: 13px;
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
  .public-utility-message { font-size: 13px; }
  .public-user-name { display: none; }
  .public-footer-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .public-footer-about { grid-column: 1 / -1; }
}

@media (max-width: 575px) {
  .public-utility-links { display: none; }
  .public-footer-grid { grid-template-columns: minmax(0, 1fr); }
  .public-main { padding-top: 16px; }
}


/* Fixed notification drawer slides in from the physical left edge, like the dashboard inbox. */
.public-notifications-actions { position: static; display: inline-flex; align-items: center; }
.public-notifications-link { border: 0; background: transparent; cursor: pointer; }
.public-notifications-drawer { display: flex; flex-direction: column; height: 100%; overflow: hidden; border-inline-end: 1px solid var(--tm-line); background: var(--tm-surface); text-align: start; }
.public-notifications-drawer .p-drawer-header,.public-cart-drawer .p-drawer-header { padding: 0; border: 0; }
.public-notifications-drawer .p-drawer-content { display: flex; flex: 1; min-height: 0; flex-direction: column; padding: 0; }
.public-notifications-drawer .p-drawer-footer { padding: 0; border-top: 1px solid var(--tm-line); }
.public-notifications-menu__header { display: flex; align-items: center; gap: 12px; min-height: 76px; padding: 16px 18px; border-bottom: 1px solid var(--tm-line); color: var(--tm-ink); }
.public-notifications-menu__heading { display: grid; flex: 1; gap: 4px; }
.public-notifications-menu__heading strong { font-size: 15px; font-weight: 700; }
.public-notifications-menu__heading span,.public-notifications-menu__unread { color: var(--tm-muted); font-size: 11px; }
.public-notifications-close { display: grid; place-items: center; width: 34px; height: 34px; border: 1px solid var(--tm-line); border-radius: 8px; background: var(--tm-surface); color: var(--tm-ink-soft); cursor: pointer; }
.public-notifications-menu__list { flex: 1; overflow-y: auto; }
.public-notification-item { display: flex; align-items: flex-start; gap: 10px; width: 100%; padding: 16px 17px; border: 0; border-bottom: 1px solid var(--tm-line); background: transparent; color: var(--tm-ink); text-align: start; cursor: pointer; font: inherit; }
.public-notification-item:hover { background: var(--tm-canvas); }
.public-notification-item.is-unread { background: color-mix(in srgb,var(--tm-cyan) 6%,var(--tm-surface)); }
.public-notification-item__dot { flex: 0 0 7px; width: 7px; height: 7px; margin-top: 6px; border-radius: 50%; background: transparent; }
.public-notification-item.is-unread .public-notification-item__dot { background: var(--tm-cyan); }
.public-notification-item__body { display: grid; min-width: 0; gap: 5px; }
.public-notification-item__body strong { overflow: hidden; color: var(--tm-ink); font-size: 12px; font-weight: 700; text-overflow: ellipsis; white-space: nowrap; }
.public-notification-item__body > span { display: -webkit-box; overflow: hidden; color: var(--tm-ink-soft); font-size: 11px; line-height: 1.8; -webkit-box-orient: vertical; -webkit-line-clamp: 3; }
.public-notification-item__body time { color: var(--tm-muted); font-size: 10px; }
.public-notifications-menu__state { display: grid; flex: 1; place-items: center; padding: 22px 14px; color: var(--tm-muted); font-size: 12px; text-align: center; }
.public-notifications-menu__all { display: flex; align-items: center; justify-content: center; gap: 8px; width: 100%; min-height: 52px; border: 0; border-top: 1px solid var(--tm-line); background: var(--tm-surface); color: var(--tm-blue); font: inherit; font-size: 12px; font-weight: 700; cursor: pointer; }
.public-notifications-menu__all:hover { background: var(--tm-canvas); }
.public-notification-item:focus-visible,.public-notifications-menu__all:focus-visible,.public-notifications-close:focus-visible { outline: 2px solid var(--ds-color-focus); outline-offset: -2px; }
@media (prefers-reduced-motion: reduce) { .public-notifications-drawer { animation: none; } }

/* Search popover and physical-left cart drawer */
.public-header .public-container{position:relative}
.public-search-trigger{border:0;background:transparent;cursor:pointer}
.public-search-popover{position:absolute;z-index:1300;top:calc(100% + 8px);inset-inline-end:16px;width:min(520px,calc(100vw - 32px));padding:18px;border:1px solid var(--tm-line);border-radius:14px;background:var(--tm-surface);box-shadow:var(--tm-shadow-lg);text-align:start}
.public-search-popover>label{display:block;margin-bottom:10px;color:var(--tm-ink);font-size:13px;font-weight:750}
.public-search-popover__field{display:flex;align-items:center;gap:9px;min-height:48px;padding:5px 10px;border:1px solid var(--tm-line);border-radius:10px;background:var(--tm-surface-alt)}
.public-search-popover__field>i{color:var(--tm-muted)}
.public-search-popover__field :deep(input){flex:1;min-width:0;border:0;outline:0;background:transparent;box-shadow:none}
.public-search-popover__field button{min-height:36px;padding:0 16px;border:0;border-radius:8px;background:var(--tm-blue);color:#fff;font:inherit;font-size:12px;font-weight:700;cursor:pointer}
.public-search-popover__field button:disabled{opacity:.45;cursor:not-allowed}
.public-search-popover>span{display:block;margin-top:9px;color:var(--tm-muted);font-size:11px}
.public-cart-drawer{display:flex;flex-direction:column;height:100%;background:var(--tm-surface)}
.public-cart-drawer .p-drawer-content{display:flex;flex:1;min-height:0;flex-direction:column;padding:0}
.public-cart-drawer .p-drawer-footer{padding:0;border-top:1px solid var(--tm-line)}
.public-cart-drawer__header{display:flex;align-items:center;justify-content:space-between;min-height:78px;padding:16px 20px;border-bottom:1px solid var(--tm-line)}
.public-cart-drawer__header>div{display:grid;gap:4px}.public-cart-drawer__header strong{font-size:16px;color:var(--tm-ink)}.public-cart-drawer__header span{font-size:11px;color:var(--tm-muted)}
.public-cart-drawer__header button{display:grid;place-items:center;width:36px;height:36px;border:1px solid var(--tm-line);border-radius:9px;background:transparent;color:var(--tm-ink);cursor:pointer}
.public-cart-drawer__items{flex:1;overflow:auto;padding:4px 18px}
.public-cart-item{display:flex;gap:13px;padding:16px 0;border-bottom:1px solid var(--tm-line)}
.public-cart-item__image{display:grid;place-items:center;flex:0 0 82px;width:82px;height:82px;overflow:hidden;border:1px solid var(--tm-line);border-radius:10px;background:var(--tm-canvas);color:var(--tm-muted)}
.public-cart-item__image img{width:100%;height:100%;object-fit:contain}
.public-cart-item__body{display:flex;flex:1;min-width:0;flex-direction:column;align-items:flex-start;gap:7px}
.public-cart-item__body>a{display:-webkit-box;overflow:hidden;color:var(--tm-ink);font-size:12px;font-weight:700;line-height:1.8;text-decoration:none;-webkit-line-clamp:2;-webkit-box-orient:vertical}
.public-cart-item__body>strong{color:var(--tm-blue);font-size:12px}
.public-cart-item__controls{display:flex;align-items:center;gap:9px;margin-top:auto}
.public-cart-item__controls button{display:grid;place-items:center;width:26px;height:26px;border:1px solid var(--tm-line);border-radius:7px;background:var(--tm-surface);color:var(--tm-ink-soft);cursor:pointer}
.public-cart-item__controls button:disabled{opacity:.35;cursor:not-allowed}.public-cart-item__controls .remove{margin-inline-start:5px;color:var(--tm-red)}
.public-cart-item__controls span{min-width:18px;text-align:center;font-size:12px;font-weight:700}
.public-cart-drawer__empty{display:flex;flex:1;flex-direction:column;align-items:center;justify-content:center;gap:12px;padding:24px;text-align:center;color:var(--tm-muted)}
.public-cart-drawer__empty>i{font-size:42px;color:var(--tm-cyan)}.public-cart-drawer__empty strong{color:var(--tm-ink);font-size:15px}.public-cart-drawer__empty span{font-size:12px}
.public-cart-drawer__footer{display:grid;gap:12px;padding:18px 20px calc(18px + env(safe-area-inset-bottom));border-top:1px solid var(--tm-line);background:var(--tm-surface)}
.public-cart-drawer__footer>div{display:flex;align-items:center;justify-content:space-between;padding-bottom:10px;color:var(--tm-ink-soft);font-size:13px}
.public-cart-drawer__footer>div strong{color:var(--tm-ink);font-size:16px}
.public-cart-continue{min-height:42px;border:1px solid var(--tm-line);border-radius:9px;background:var(--tm-surface);color:var(--tm-ink);font:inherit;font-size:12px;font-weight:700;cursor:pointer}
.public-cart-drawer__footer>.tm-btn{display:flex;align-items:center;justify-content:center;gap:8px;text-decoration:none}
@media(prefers-reduced-motion:reduce){.public-cart-drawer{animation:none}}


/* Match the reference Telecom Market.html storefront shell while retaining live account controls. */
.public-utility-inner { min-height: 32px; }
.public-utility-message { color: #c9d1ee; font-size: 12px; }
.public-utility-message b { color: #7fe3ff; font-weight: 700; }
.public-utility-links { gap: 7px; color: #c9d1ee; font-size: 12px; }
.public-header { position: relative; top: auto; }
.public-header-row { min-height: 68px; }
.public-header-right { gap: 22px; }
.public-nav-desktop { gap: 22px; }
.public-nav-link i { display: none; }
.public-footer-grid { grid-template-columns: 1.5fr 1fr 1fr 1.2fr 1.4fr; gap: 28px; }
.public-footer-about-text { color: #9aa3c2; }
.public-footer-link { color: #9aa3c2; }
.public-footer-bottom { display: flex; justify-content: space-between; flex-wrap: wrap; gap: 10px; text-align: start; }
@media(max-width:1100px) {
  .public-header-right { gap: 14px; }
  .public-nav-desktop { gap: 13px; }
  .public-nav-link { font-size: 12px; }
  .public-footer-grid { grid-template-columns: repeat(3,minmax(0,1fr)); }
}
@media(max-width:767px) {
  .public-header-row { min-height: 58px; }
  .public-footer-grid { grid-template-columns: repeat(2,minmax(0,1fr)); }
  .public-footer-about { grid-column: 1/-1; }
}
@media(max-width:480px) {
  .public-footer-grid { grid-template-columns: 1fr; }
}

.public-container { max-width: 1240px; padding-inline: 20px; }
.public-logo-symbol { display: block; flex: none; width: 36px; height: 36px; border-radius: 10px; background: linear-gradient(135deg,#2aa7e8,#6c5ce7); }
.public-user-trigger { padding: 4px 0; border: 0; border-radius: 0; background: transparent; }
.public-user-trigger:hover { border: 0; background: transparent; }
.public-user-avatar,.public-user-caret { display: none; }
.public-user-name { display: inline; max-width: 180px; white-space: nowrap; }
.public-commerce-actions { order: 1; border: 0; padding: 0; }
.public-notifications-actions { order: 2; }
.public-authenticated-actions,.public-guest-actions { display: contents; }
.public-user-trigger { order: 3; }
.public-header-actions > .public-mobile-toggle { order: 4; }
.public-search-trigger,.public-search-popover { display: none !important; }
@media(max-width:991px){.public-user-name{display:inline}}
/* Telecom Market.html storefront shell alignment */
.public-shell {
  --tm-blue: #6c5ce7;
  --tm-blue-strong: #6c5ce7;
  --tm-cyan: #2aa7e8;
  --tm-cyan-strong: #2aa7e8;
  --tm-cyan-deep: #6c5ce7;
  --tm-cyan-soft: #eceaff;
  --tm-blue-soft: #eceaff;
  --tm-navy: #0b1020;
  --tm-navy-deep: #0b1020;
  --tm-canvas: #f4f5fa;
  --tm-surface: #fff;
  --tm-line: #e4e7f2;
  --tm-ink: #12182b;
  --tm-muted: #6b7390;
  background: var(--tm-canvas);
  color: var(--tm-ink);
  font-family: Vazirmatn, Tahoma, sans-serif;
}
.public-utility-bar { background: #0b1020; color: #c9d1ee; font-size: 12px; }
.public-utility-message i { color: #7fe3ff; }
.public-header { background: #fff; border-bottom-color: #e4e7f2; }
.public-header-row { min-height: 68px; }
.public-header-right { gap: 22px; }
.public-nav-desktop { gap: 22px; }
.public-nav-link { padding-block: 8px; font-size: 14px; font-weight: 500; }
.public-nav-link i { display: none; }
.public-nav-link-active { color: #6c5ce7; border-bottom-color: #6c5ce7; font-weight: 700; }
.public-logo-name strong { font-size: 18px; font-weight: 800; }
.public-icon-link { border-radius: 10px; color: #6b7390; }
.public-icon-link:hover { background: #eceaff; color: #6c5ce7; }
.public-notification-badge { min-width: 17px; height: 17px; background: #6c5ce7; font-size: 10px; }
.public-main { padding: 0; background: #f4f5fa; }
.public-footer { background: #0b1020; padding-top: 40px; }
.public-footer-grid { grid-template-columns: 1.5fr 1fr 1fr 1.2fr; gap: 28px; }
.public-footer-heading { font-size: 14px; }
.public-footer-link { color: #9aa3c2; }
.public-footer-about-text { color: #9aa3c2; }
.public-footer-bottom { border-top-color: #1d2440; }
@media (max-width: 1100px) {
  .public-header-right { gap: 14px; }
  .public-nav-desktop { gap: 13px; }
  .public-nav-link { font-size: 12px; }
}
@media (max-width: 767px) {
  .public-header-row { min-height: 58px; }
  .public-utility-inner { min-height: 32px; }
  .public-utility-links { gap: 10px; }
  .public-footer-grid { grid-template-columns: 1fr 1fr; }
  .public-main { padding-bottom: 28px; }
}
@media (max-width: 480px) {
  .public-utility-message { font-size: 10px; }
  .public-utility-links { font-size: 10px; }
  .public-footer-grid { grid-template-columns: 1fr; }
}


@media(prefers-color-scheme:dark){.public-shell:not([data-theme="light"]){--tm-canvas:#0e1220;--tm-surface:#171c30;--tm-line:#262d49;--tm-ink:#eef0f8;--tm-muted:#9aa3c2;background:#0e1220;color:#eef0f8}.public-shell:not([data-theme="light"]) .public-header{background:#171c30;border-bottom-color:#262d49}.public-shell:not([data-theme="light"]) .public-main{background:#0e1220}.public-shell:not([data-theme="light"]) .public-user-name{color:#eef0f8}}
.public-guest-actions .public-login-link { order: 3; }
 .public-nav-link--static { cursor: default; }\n/* Final responsive column contract from Telecom Market.html (after legacy shell rules). */
.public-footer-grid { grid-template-columns: 1.5fr 1fr 1fr 1.2fr 1.4fr; }
@media(max-width:1100px){.public-footer-grid{grid-template-columns:repeat(3,minmax(0,1fr))}}
@media(max-width:767px){.public-footer-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media(max-width:480px){.public-footer-grid{grid-template-columns:1fr}}
</style>
