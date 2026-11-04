<template>
  <div class="admin-dashboard">
    <section class="admin-dashboard-overview">
    <section class="admin-dashboard-hero" aria-labelledby="admin-dashboard-title">
      <div class="admin-dashboard-hero-copy">
        <h1 id="admin-dashboard-title">داشبورد مدیریت</h1>
        <p>نمایی یکپارچه از کاربران، شرکت‌ها، محصولات و جریان استعلام‌های پلتفرم.</p>
      </div>
      <div class="admin-dashboard-hero-actions">
        <router-link :to="{ name: 'admin-product-create' }">
          <Button label="ایجاد محصول" icon="pi pi-plus" />
        </router-link>
        <router-link :to="{ name: 'admin-inquiries' }" class="admin-dashboard-secondary-action">
          <i class="pi pi-inbox" aria-hidden="true"></i><span>مدیریت استعلام‌ها</span>
        </router-link>
      </div>
    </section>

    <!-- KPI cards -->

    <div class="admin-dashboard-kpis">
      <KpiCard
        label="کاربران کل"
        :value="stats.totalUsers"
        icon="pi pi-users"
        tone="primary"
        :loading="loadingStats"
        :to="{ name: 'admin-users' }"
      />
      <KpiCard
        label="شرکت‌ها"
        :value="stats.totalCompanies"
        icon="pi pi-building"
        tone="info"
        :loading="loadingStats"
        :to="{ name: 'admin-companies' }"
      />
      <KpiCard
        label="محصولات کل"
        :value="stats.totalProducts"
        icon="pi pi-box"
        tone="success"
        :loading="loadingStats"
        :to="{ name: 'admin-products' }"
      />
      <KpiCard
        label="استعلام‌های فعال"
        :value="activeInquiries"
        icon="pi pi-inbox"
        tone="warning"
        :loading="loadingInquiryStats"
        :to="{ name: 'admin-inquiries' }"
      />
    </div>
    </section>

    <!-- Stats error (non-blocking) -->
    <Message v-if="statsError" severity="error" :closable="false" class="admin-dashboard-msg">
      {{ statsError }}
    </Message>

    <section class="admin-dashboard-analytics" aria-label="آمار و تحلیل پلتفرم">
      <DashboardPanel title="نمای کلی پلتفرم" icon="pi pi-chart-bar" class="admin-dashboard-analytics-panel">
        <template #actions><span class="admin-dashboard-hint">مقایسه حجم داده‌های ثبت‌شده در سامانه</span></template>
        <div class="admin-dashboard-chart-layout">
          <div class="admin-dashboard-chart-main">
            <AnalyticsChart :series="analyticsSeries" :loading="loadingStats || loadingInquiryStats" tone="primary" :height="250" />
          </div>
          <div class="admin-dashboard-chart-aside">
            <div class="admin-dashboard-chart-stat">
              <span>کاربران ثبت‌شده</span><strong>{{ (stats.totalUsers || 0).toLocaleString('fa-IR') }}</strong>
            </div>
            <div class="admin-dashboard-chart-stat">
              <span>شرکت‌های ثبت‌شده</span><strong>{{ (stats.totalCompanies || 0).toLocaleString('fa-IR') }}</strong>
            </div>
            <div class="admin-dashboard-chart-stat">
              <span>محصولات سامانه</span><strong>{{ (stats.totalProducts || 0).toLocaleString('fa-IR') }}</strong>
            </div>
            <div class="admin-dashboard-chart-stat">
              <span>استعلام‌های فعال</span><strong>{{ activeInquiries === null ? '—' : activeInquiries.toLocaleString('fa-IR') }}</strong>
            </div>
          </div>
        </div>
      </DashboardPanel>
    </section>

    <!-- Operational shortcuts and service health are secondary to analytics. -->
    <section class="admin-dashboard-workspace" aria-label="ابزارهای عملیاتی">
      <DashboardPanel title="دسترسی سریع" icon="pi pi-bolt" class="admin-dashboard-quick">
        <template #actions><span class="admin-dashboard-hint">میان‌برهای مدیریت</span></template>
        <QuickActions :actions="quickActions" />
      </DashboardPanel>
      <DashboardPanel title="سلامت سرویس‌ها" icon="pi pi-server" class="admin-dashboard-health">
        <template #actions><span class="admin-dashboard-hint">وضعیت اتصال</span></template>
        <SystemStatus :services="systemServices" />
      </DashboardPanel>
    </section>

    <!-- Latest lists -->
    <div class="admin-dashboard-grid admin-dashboard-grid--3">
      <DashboardPanel
        title="آخرین شرکت‌ها"
        icon="pi pi-building"
        :to="{ name: 'admin-companies' }"
      >
        <EntityList :items="latestCompanies" :loading="loadingCompanies" />
      </DashboardPanel>

      <DashboardPanel
        title="آخرین کاربران"
        icon="pi pi-user-plus"
        :to="{ name: 'admin-users' }"
      >
        <EntityList :items="latestUsers" :loading="loadingStats" />
      </DashboardPanel>

      <DashboardPanel
        title="آخرین محصولات"
        icon="pi pi-box"
        :to="{ name: 'admin-products' }"
      >
        <EntityList :items="latestProducts" :loading="loadingProducts" />
      </DashboardPanel>
    </div>

    <!-- Recent activity: products pending approval (actionable) -->
    <DashboardPanel
      title="فعالیت اخیر — محصولات در انتظار تأیید"
      icon="pi pi-clock"
      :to="{ name: 'admin-products' }"
    >
      <SkeletonLoader v-if="loadingPending" variant="table" :count="4" :columns="5" />

      <EmptyState
        v-else-if="!pendingProducts.length"
        icon="pi pi-check-circle"
        title="همه‌چیز مرتب است"
        description="هیچ محصولی در انتظار تأیید نیست."
        size="sm"
      />


      <div v-else class="admin-dashboard-table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>عنوان</th>
              <th>شرکت</th>
              <th>دسته‌بندی</th>
              <th>تاریخ</th>
              <th>عملیات</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="product in pendingProducts" :key="product.id">
              <td class="font-semibold" data-label="عنوان">{{ product.title }}</td>
              <td data-label="شرکت">{{ product.company?.name || '—' }}</td>
              <td data-label="دسته‌بندی">{{ product.category?.nameFa || '—' }}</td>
              <td data-label="تاریخ">{{ formatDate(product.createdAt) }}</td>
              <td data-label="عملیات">

                <div class="flex gap-2">
                  <Button
                    icon="pi pi-check"
                    severity="success"
                    rounded
                    text
                    aria-label="تأیید محصول"
                    v-tooltip.top="'تأیید'"
                    :loading="approvingId === product.id"
                    @click="approveProduct(product)"
                  />
                  <Button
                    icon="pi pi-times"
                    severity="danger"
                    rounded
                    text
                    aria-label="رد محصول"
                    v-tooltip.top="'رد'"
                    @click="openRejectDialog(product)"
                  />
                  <router-link :to="{ name: 'admin-product-edit', params: { id: product.id } }">
                    <Button icon="pi pi-eye" severity="info" rounded text aria-label="مشاهده محصول" v-tooltip.top="'مشاهده'" />
                  </router-link>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </DashboardPanel>

    <!-- Reject dialog -->
    <Dialog
      v-model:visible="showRejectDialog"
      header="رد محصول"
      :modal="true"
      :style="{ width: '32rem' }"
      :breakpoints="{ '640px': '92vw' }"
    >

      <div class="field">
        <label>علت رد <span class="text-red-500">*</span></label>
        <Textarea v-model="rejectReason" placeholder="علت رد محصول را وارد کنید..." rows="3" class="w-full" />
      </div>
      <template #footer>
        <Button label="انصراف" icon="pi pi-times" severity="secondary" text @click="showRejectDialog = false" />
        <Button label="رد محصول" icon="pi pi-times" severity="danger" :loading="rejectingId !== null" @click="rejectProduct" />
      </template>
    </Dialog>
  </div>
</template>

<script setup>
/**
 * Admin Dashboard — enterprise marketplace command center.
 *
 * Composed entirely from reusable, presentational dashboard components
 * (KpiCard, QuickActions, DashboardPanel, EntityList,
 * SystemStatus, AnalyticsChart). This page is the ONLY place that talks to the
 * stores/APIs; the child components stay dumb and API-agnostic so they're ready
 * for any data source.
 *
 * Data sources (all existing endpoints — no backend changes, no fake business
 * logic): admin stats, inquiry stats, companies list, products list.
 */
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth'
import { useStatsStore } from '../../stores/stats'
import { productsApi, companiesApi, inquiriesApi } from '@telecom/api-client'

import { useToast } from 'primevue/usetoast'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import Textarea from 'primevue/textarea'
import Message from 'primevue/message'
import { SkeletonLoader, EmptyState } from '@telecom/shared-ui/components/common/feedback'


import KpiCard from '@telecom/shared-ui/components/admin/dashboard/KpiCard.vue'
import QuickActions from '@telecom/shared-ui/components/admin/dashboard/QuickActions.vue'
import DashboardPanel from '@telecom/shared-ui/components/admin/dashboard/DashboardPanel.vue'
import EntityList from '@telecom/shared-ui/components/admin/dashboard/EntityList.vue'
import SystemStatus from '@telecom/shared-ui/components/admin/dashboard/SystemStatus.vue'
import AnalyticsChart from '@telecom/shared-ui/components/admin/dashboard/AnalyticsChart.vue'

const authStore = useAuthStore()
const statsStore = useStatsStore()
const toast = useToast()
const router = useRouter()

// ── State ───────────────────────────────────────────────────
const stats = ref({ totalUsers: 0, totalCompanies: 0, totalProducts: 0, recentUsers: [] })
const loadingStats = ref(false)
const statsError = ref(null)

const activeInquiries = ref(null)
const loadingInquiryStats = ref(false)

const companies = ref([])
const loadingCompanies = ref(false)

const products = ref([])
const loadingProducts = ref(false)

const pendingProductsDirect = ref([])
const loadingPending = ref(false)

const approvingId = ref(null)
const rejectingId = ref(null)
const showRejectDialog = ref(false)
const rejectReason = ref('')
const productToReject = ref(null)

// ── Derived view models ─────────────────────────────────────
const latestUsers = computed(() =>
  (stats.value.recentUsers || []).slice(0, 5).map((u) => ({
    id: u.id,
    title: u.fullName || u.username || u.email,
    subtitle: u.email,
    initial: (u.fullName || u.username || '?').charAt(0),
    badge: userStatusLabel(u.status),
    badgeTone: userStatusTone(u.status),
    meta: formatDate(u.createdAt),
  }))
)

const latestCompanies = computed(() =>
  companies.value.slice(0, 5).map((c) => ({
    id: c.id,
    title: c.name || c.companyName || '—',
    subtitle: c.nameEn || c.industry || '',
    avatar: c.logoUrl || c.logo || '',
    icon: 'pi pi-building',
    meta: formatDate(c.createdAt),
    to: { name: 'admin-companies' },
  }))
)

const latestProducts = computed(() =>
  products.value.slice(0, 5).map((p) => ({
    id: p.id,
    title: p.title,
    subtitle: p.company?.name || p.category?.nameFa || '',
    icon: 'pi pi-box',
    badge: productStatusLabel(p.status),
    badgeTone: productStatusTone(p.status),
    to: { name: 'admin-product-edit', params: { id: p.id } },
  }))
)

const pendingProducts = computed(() => pendingProductsDirect.value.slice(0, 8))

// Analytics: real entity counts (no fabricated time-series).
const analyticsSeries = computed(() => [
  { label: 'کاربران', value: stats.value.totalUsers || 0 },
  { label: 'شرکت‌ها', value: stats.value.totalCompanies || 0 },
  { label: 'محصولات', value: stats.value.totalProducts || 0 },
  { label: 'استعلام‌ها', value: activeInquiries.value || 0 },
])

// System status derived from whether each data source responded.
const systemServices = computed(() => [
  { name: 'سرویس آمار', status: serviceStatus(!statsError.value && !loadingStats.value, loadingStats.value) },
  { name: 'سرویس شرکت‌ها', status: serviceStatus(!loadingCompanies.value, loadingCompanies.value) },
  { name: 'سرویس محصولات', status: serviceStatus(!loadingProducts.value, loadingProducts.value) },
  { name: 'سرویس استعلام‌ها', status: serviceStatus(activeInquiries.value !== null, loadingInquiryStats.value) },
])

function serviceStatus(ok, loading) {
  if (loading) return 'unknown'
  return ok ? 'operational' : 'degraded'
}

const quickActions = [
  { label: 'مدیریت کاربران', icon: 'pi pi-users', to: { name: 'admin-users' }, tone: 'primary' },
  { label: 'مدیریت شرکت‌ها', icon: 'pi pi-building', to: { name: 'admin-companies' }, tone: 'info' },
  { label: 'مدیریت محصولات', icon: 'pi pi-box', to: { name: 'admin-products' }, tone: 'success' },
  { label: 'دسته‌بندی‌ها', icon: 'pi pi-folder', to: { name: 'admin-categories' }, tone: 'warning' },
  { label: 'سفارشات', icon: 'pi pi-shopping-cart', to: { name: 'admin-orders' }, tone: 'primary' },
  { label: 'استعلام‌ها', icon: 'pi pi-inbox', to: { name: 'admin-inquiries' }, tone: 'danger' },
]

// ── Formatting / label helpers ──────────────────────────────
function formatDate(value) {
  if (!value) return '—'
  try {
    return new Date(value).toLocaleDateString('fa-IR')
  } catch {
    return '—'
  }
}

function userStatusLabel(status) {
  return status === 'ACTIVE' ? 'فعال' : status === 'PENDING' ? 'در انتظار' : status === 'REJECTED' ? 'رد شده' : '—'
}
function userStatusTone(status) {
  return status === 'ACTIVE' ? 'success' : status === 'PENDING' ? 'warning' : status === 'REJECTED' ? 'danger' : 'gray'
}
function productStatusLabel(status) {
  if (status === 'PUBLISHED') return 'منتشر شده'
  if (status === 'APPROVED') return 'تأیید شده'
  if (status === 'PENDING_REVIEW') return 'در انتظار تأیید'
  if (status === 'DRAFT') return 'پیش‌نویس'
  if (status === 'REJECTED') return 'رد شده'
  if (status === 'HIDDEN') return 'پنهان'
  if (status === 'ARCHIVED') return 'بایگانی'
  return status || '—'
}
function productStatusTone(status) {
  if (status === 'PUBLISHED' || status === 'APPROVED') return 'success'
  if (status === 'PENDING_REVIEW') return 'warning'
  if (status === 'REJECTED') return 'danger'
  if (status === 'DRAFT' || status === 'HIDDEN' || status === 'ARCHIVED') return 'gray'
  return 'gray'
}

// Normalize the various list envelopes used across the API layer.
function unwrapList(res) {
  const body = res?.data ?? res
  return body?.data?.data || body?.data || body?.items || (Array.isArray(body) ? body : []) || []
}

// ── Fetchers ────────────────────────────────────────────────
async function fetchStats() {
  try {
    loadingStats.value = true
    statsError.value = null
    const data = await statsStore.getDashboardStats()
    stats.value = data || stats.value
  } catch (err) {
    statsError.value = 'خطا در دریافت آمار سیستم'
    console.error('Error fetching stats:', err)
  } finally {
    loadingStats.value = false
  }
}

async function fetchInquiryStats() {
  try {
    loadingInquiryStats.value = true
    const res = await inquiriesApi.getStats()
    const body = res?.data ?? res
    const data = body?.data ?? body
    // Be tolerant of shape: prefer an explicit "active/open" count if present.
    activeInquiries.value =
      data?.active ?? data?.open ?? data?.activeInquiries ?? data?.counts?.active ?? data?.total ?? 0
  } catch (err) {
    console.error('Error fetching inquiry stats:', err)
    activeInquiries.value = null
  } finally {
    loadingInquiryStats.value = false
  }
}

async function fetchCompanies() {
  try {
    loadingCompanies.value = true
    const res = await companiesApi.list({ limit: 5, sort: 'createdAt:desc' })
    companies.value = unwrapList(res)
  } catch (err) {
    console.error('Error fetching companies:', err)
    companies.value = []
  } finally {
    loadingCompanies.value = false
  }
}

async function fetchProducts() {
  try {
    loadingProducts.value = true
    // Admin overview needs products of every status (incl. PENDING_REVIEW for
    // the approval queue), so use the authenticated management endpoint.
    const res = await productsApi.myProducts({ limit: 10, sort: 'createdAt:desc' })
    products.value = unwrapList(res)
  } catch (err) {
    console.error('Error fetching products:', err)
    products.value = []
  } finally {
    loadingProducts.value = false
  }
}

async function fetchPendingProducts() {
  try {
    loadingPending.value = true
    const res = await productsApi.myProducts({ status: 'PENDING_REVIEW', limit: 20 })
    pendingProductsDirect.value = unwrapList(res)
  } catch (err) {
    console.error('Error fetching pending products:', err)
    pendingProductsDirect.value = []
  } finally {
    loadingPending.value = false
  }
}

// ── Product approval workflow (existing behavior preserved) ──
async function approveProduct(product) {
  try {
    approvingId.value = product.id
    await productsApi.approve(product.id, 'تأیید توسط مدیر سیستم')
    toast.add({ severity: 'success', summary: 'موفقیت', detail: `محصول "${product.title}" تأیید شد`, life: 3000 })
    await Promise.all([fetchProducts(), fetchPendingProducts()])
  } catch (err) {
    toast.add({ severity: 'error', summary: 'خطا', detail: err.message || 'خطا در تأیید محصول', life: 3000 })
  } finally {
    approvingId.value = null
  }
}

function openRejectDialog(product) {
  productToReject.value = product
  rejectReason.value = ''
  showRejectDialog.value = true
}

async function rejectProduct() {
  if (!rejectReason.value.trim()) {
    toast.add({ severity: 'warn', summary: 'خطا', detail: 'لطفاً علت رد را وارد کنید', life: 3000 })
    return
  }
  try {
    rejectingId.value = productToReject.value.id
    await productsApi.reject(productToReject.value.id, rejectReason.value)
    toast.add({ severity: 'success', summary: 'موفقیت', detail: `محصول "${productToReject.value.title}" رد شد`, life: 3000 })
    showRejectDialog.value = false
    await Promise.all([fetchProducts(), fetchPendingProducts()])
  } catch (err) {
    toast.add({ severity: 'error', summary: 'خطا', detail: err.message || 'خطا در رد محصول', life: 3000 })
  } finally {
    rejectingId.value = null
  }
}

  // The platform admin dashboard aggregates system-wide stats. App membership
  // is decided by accessProfile.type (STAFF) at the router/landing gate, so we
  // don't re-derive it here. Feature access WITHIN the app is permission-based:
  // this page requires dashboard.read.
onMounted(() => {
  if (!authStore.hasPermission('dashboard.read')) {
    router.replace({ name: 'admin-dashboard' })
    return
  }


  // Fire independent requests in parallel.
  fetchStats()
  fetchInquiryStats()
  fetchCompanies()
  fetchProducts()
  fetchPendingProducts()
})
</script>

<style scoped>
.admin-dashboard {
  direction: rtl;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.admin-dashboard-overview { display:grid; grid-template-columns:minmax(0,1.65fr) minmax(290px,1fr); gap:1rem; direction:ltr; align-items:stretch; }
.admin-dashboard-overview > * { min-width:0; direction:rtl; }
.admin-dashboard-hero {
  position:relative; overflow:hidden; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap;
  gap: var(--ds-space-5); min-height: 8.5rem; padding: clamp(1.25rem, 2.5vw, 2rem);
  border-radius: 16px; background: var(--ds-hero-gradient); color: #fff;
}
.admin-dashboard-hero::before { content:""; position:absolute; inset:0; pointer-events:none; opacity:.42; background: radial-gradient(circle at 82% 28%, rgba(255,255,255,.3), transparent 19%), radial-gradient(circle at 74% 110%, rgba(14,220,226,.4), transparent 34%), repeating-radial-gradient(circle at 83% 52%, transparent 0 28px, rgba(255,255,255,.12) 29px 30px, transparent 31px 55px); }
.admin-dashboard-hero-copy, .admin-dashboard-hero-actions { position:relative; z-index:1; }
.admin-dashboard-hero-copy { min-width: 0; }
.admin-dashboard-hero h1 {
  margin: 0; color: inherit; font-size: clamp(1.5rem, 2.3vw, 1.9rem);
  font-weight: var(--ds-font-weight-bold); line-height: 1.4; text-wrap: balance;
}
.admin-dashboard-hero p { max-width: 44rem; margin: .5rem 0 0; color: var(--ds-color-on-brand-muted); line-height: var(--ds-line-height-relaxed); }
.admin-dashboard-hero-actions { display: flex; align-items: center; flex-wrap: wrap; gap: .65rem; }
.admin-dashboard-secondary-action {
  display: inline-flex; min-height: 2.75rem; align-items: center; justify-content: center;
  gap: .5rem; padding: .6rem .9rem; border: 1px solid rgba(255,255,255,.38);
  border-radius: var(--ds-radius-md); color: var(--ds-color-on-brand); text-decoration: none;
  font-weight: var(--ds-font-weight-semibold);
}
.admin-dashboard-secondary-action:hover { background: rgba(255,255,255,.09); }
.admin-dashboard-secondary-action:focus-visible { outline: 2px solid var(--ds-brand); outline-offset: 3px; }
.admin-dashboard-workspace {
  display: grid;
  grid-template-columns: minmax(0, 1.5fr) minmax(280px, .85fr);
  align-items: stretch;
  gap: var(--ds-space-5);
}
.admin-dashboard-workspace > * { min-width: 0; }



.admin-dashboard-kpis { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); grid-template-rows:repeat(2,minmax(0,1fr)); gap:.75rem; }

.admin-dashboard-grid {
  display: grid;
  gap: var(--ds-space-5);
}

.admin-dashboard-grid--2-1 {
  grid-template-columns: 2fr 1fr;
}

.admin-dashboard-grid--3 {
  grid-template-columns: repeat(3, 1fr);
}

.admin-dashboard-hint {
  font-size: var(--ds-font-size-xs);
  color: var(--ds-color-text-muted);
}

.admin-dashboard-table-wrap {
  overflow-x: auto;
}

/* Base table styling (desktop). */
.data-table {
  width: 100%;
  border-collapse: collapse;
}
.data-table th,
.data-table td {
  padding: var(--ds-space-3);
  text-align: start;
  border-bottom: 1px solid var(--ds-color-border);
  font-size: var(--ds-font-size-sm);
}
.data-table th {
  font-weight: var(--ds-font-weight-semibold);
  color: var(--ds-color-text-muted);
  white-space: nowrap;
}


/* Responsive breakpoints */

@media (max-width: 1200px) { .admin-dashboard-overview { grid-template-columns:minmax(0,1.2fr) minmax(260px,1fr); } }

@media (max-width: 1200px) {
  .admin-dashboard-workspace { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .admin-dashboard-quick { grid-column: auto; }
}
@media (max-width: 991px) {
  .admin-dashboard-grid--2-1,
  .admin-dashboard-grid--3,
  .admin-dashboard-workspace { grid-template-columns: 1fr; }
  .admin-dashboard-quick { grid-column: auto; }
}

@media (max-width: 575px) {
  .admin-dashboard-kpis {
    grid-template-columns: 1fr;
  }

  /* Stacked-card table: no horizontal scroll on small screens.
     Each row becomes a card and each cell shows its column label. */
  .admin-dashboard-table-wrap { overflow-x: visible; }
  .data-table thead { display: none; }
  .data-table,
  .data-table tbody,
  .data-table tr,
  .data-table td {
    display: block;
    width: 100%;
  }
  .data-table tr {
    border: 1px solid var(--ds-color-border);
    border-radius: var(--ds-radius-md);
    margin-bottom: var(--ds-space-3);
    padding: var(--ds-space-2);
  }
  .data-table td {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--ds-space-3);
    border-bottom: 1px solid var(--ds-color-border);
    padding: var(--ds-space-2) var(--ds-space-3);
  }
  .data-table tr td:last-child { border-bottom: none; }
  /* Show the column name (from data-label) before each value. */
  .data-table td::before {
    content: attr(data-label);
    font-weight: var(--ds-font-weight-semibold);
    color: var(--ds-color-text-muted);
    font-size: var(--ds-font-size-xs);
  }
}


/* Paces-inspired dashboard rhythm with API-backed widgets unchanged. */
.admin-dashboard-kpis { grid-template-columns: repeat(auto-fit, minmax(min(100%, 220px), 1fr)); }
.admin-dashboard-grid--2-1 { grid-template-columns: minmax(0, 2fr) minmax(280px, 1fr); }
.admin-dashboard-grid--3 { grid-template-columns: repeat(auto-fit, minmax(min(100%, 280px), 1fr)); }
@media (max-width: 900px) {
  .admin-dashboard-grid--2-1 { grid-template-columns: minmax(0, 1fr); }
}
@media (max-width: 640px) {
  .admin-dashboard-overview { grid-template-columns:1fr; direction:rtl; }
  .admin-dashboard-kpis { grid-template-columns:repeat(2,minmax(0,1fr)); }
  .admin-dashboard-hero { align-items: flex-start; flex-direction: column; min-height: 0; }
  .admin-dashboard-hero-actions { width: 100%; }
  .admin-dashboard-hero-actions > * { flex: 1 1 auto; }
  .admin-dashboard-secondary-action { width: 100%; }
}
</style>