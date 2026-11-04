<script setup>
/**
 * Admin Dashboard — marketplace command center.
 *
 * Composed from the shared Tem widget library plus the existing presentational
 * dashboard components. This page is the ONLY place that talks to stores/APIs;
 * child components stay dumb so they remain reusable.
 *
 * Data sources (all existing endpoints — no backend changes, no fabricated
 * business logic): admin stats, inquiry stats, companies list, products list.
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

import TemPageHeader from '@telecom/shared-ui/components/ui/TemPageHeader.vue'
import TemStatCard from '@telecom/shared-ui/components/ui/TemStatCard.vue'
import TemPanel from '@telecom/shared-ui/components/ui/TemPanel.vue'
import TemBarChart from '@telecom/shared-ui/components/ui/TemBarChart.vue'
import QuickActions from '@telecom/shared-ui/components/admin/dashboard/QuickActions.vue'
import EntityList from '@telecom/shared-ui/components/admin/dashboard/EntityList.vue'
import SystemStatus from '@telecom/shared-ui/components/admin/dashboard/SystemStatus.vue'

const authStore = useAuthStore()
const statsStore = useStatsStore()
const toast = useToast()
const router = useRouter()

// ── State ───────────────────────────────────────────────────
const stats = ref({ totalUsers: 0, activeUsers: 0, totalCompanies: 0, totalProducts: 0, pendingProducts: 0, totalInquiries: 0, recentUsers: [] })
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
  { label: 'مرکز CRM', icon: 'pi pi-address-book', to: { name: 'admin-crm' }, tone: 'info' },
  { label: 'تیکت‌ها', icon: 'pi pi-headphones', to: { name: 'admin-tickets' }, tone: 'primary' },
  { label: 'سفارش خرده‌فروشی', icon: 'pi pi-shopping-cart', to: { name: 'admin-retail-orders' }, tone: 'success' },
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

<template>
  <div class="admin-dashboard">
    <TemPageHeader
      title="داشبورد مدیریت"
      description="نمایی یکپارچه از کاربران، شرکت‌ها، محصولات و جریان استعلام‌های پلتفرم."
      :crumb="[{ label: 'پنل مدیریت', to: { name: 'admin-dashboard' } }, { label: 'داشبورد' }]"
    >
      <template #actions>
        <router-link :to="{ name: 'admin-product-create' }" class="tm-btn">
          <i class="pi pi-plus" aria-hidden="true"></i> ایجاد محصول
        </router-link>
        <router-link :to="{ name: 'admin-inquiries' }" class="tm-btn tm-btn--ghost">
          <i class="pi pi-inbox" aria-hidden="true"></i> مدیریت استعلام‌ها
        </router-link>
      </template>
    </TemPageHeader>

    <Message v-if="statsError" severity="error" :closable="false" class="admin-dashboard-msg">
      {{ statsError }}
    </Message>

    <!-- KPI row -->
    <section class="tm-grid tm-grid--stats" aria-label="آمار کلیدی پلتفرم">
      <TemStatCard
        label="کاربران کل"
        :value="stats.totalUsers"
        icon="pi pi-users"
        tone="primary"
        :loading="loadingStats"
        :to="{ name: 'admin-users' }"
      />
      <TemStatCard
        label="شرکت‌ها"
        :value="stats.totalCompanies"
        icon="pi pi-building"
        tone="accent"
        :loading="loadingStats"
        :to="{ name: 'admin-companies' }"
      />
      <TemStatCard
        label="محصولات کل"
        :value="stats.totalProducts"
        icon="pi pi-box"
        tone="success"
        :loading="loadingStats"
        :to="{ name: 'admin-products' }"
      />
      <TemStatCard
        label="استعلام‌های فعال"
        :value="activeInquiries"
        icon="pi pi-inbox"
        tone="warning"
        :loading="loadingInquiryStats"
        :to="{ name: 'admin-inquiries' }"
      />
      <TemStatCard
        label="کاربران فعال"
        :value="stats.activeUsers"
        icon="pi pi-user-check"
        tone="success"
        :loading="loadingStats"
        :to="{ name: 'admin-users' }"
      />
      <TemStatCard
        label="محصولات در انتظار بررسی"
        :value="stats.pendingProducts"
        icon="pi pi-clock"
        tone="warning"
        :loading="loadingStats"
        :to="{ name: 'admin-products' }"
      />
      <TemStatCard
        label="کل استعلام‌ها"
        :value="stats.totalInquiries"
        icon="pi pi-comments"
        tone="accent"
        :loading="loadingStats"
        :to="{ name: 'admin-inquiries' }"
      />
    </section>

    <!-- Analytics + workspace -->
    <div class="admin-dashboard-split">
      <TemPanel title="نمای کلی پلتفرم" subtitle="مقایسه حجم داده‌های ثبت‌شده در سامانه">
        <TemBarChart :series="analyticsSeries" :height="260" :loading="loadingStats || loadingInquiryStats" />
      </TemPanel>

      <div class="admin-dashboard-side">
        <TemPanel title="دسترسی سریع" icon="pi pi-bolt">
          <QuickActions :actions="quickActions" />
        </TemPanel>
        <TemPanel title="سلامت سرویس‌ها" icon="pi pi-server">
          <SystemStatus :services="systemServices" />
        </TemPanel>
      </div>
    </div>

    <!-- Latest lists -->
    <div class="admin-dashboard-grid">
      <TemPanel title="آخرین شرکت‌ها" icon="pi pi-building">
        <template #actions>
          <router-link :to="{ name: 'admin-companies' }" class="tm-btn tm-btn--ghost tm-btn--sm">همه</router-link>
        </template>
        <EntityList :items="latestCompanies" :loading="loadingCompanies" />
      </TemPanel>

      <TemPanel title="آخرین کاربران" icon="pi pi-user-plus">
        <template #actions>
          <router-link :to="{ name: 'admin-users' }" class="tm-btn tm-btn--ghost tm-btn--sm">همه</router-link>
        </template>
        <EntityList :items="latestUsers" :loading="loadingStats" />
      </TemPanel>

      <TemPanel title="آخرین محصولات" icon="pi pi-box">
        <template #actions>
          <router-link :to="{ name: 'admin-products' }" class="tm-btn tm-btn--ghost tm-btn--sm">همه</router-link>
        </template>
        <EntityList :items="latestProducts" :loading="loadingProducts" />
      </TemPanel>
    </div>

    <!-- Product approval queue (actionable business workflow) -->
    <TemPanel title="فعالیت اخیر — محصولات در انتظار تأیید" icon="pi pi-clock" flush>
      <template #actions>
        <router-link :to="{ name: 'admin-products' }" class="tm-btn tm-btn--ghost tm-btn--sm">صف بررسی</router-link>
      </template>

      <div v-if="loadingPending" class="admin-dashboard-pad">
        <SkeletonLoader variant="table" :count="4" :columns="5" />
      </div>

      <div v-else-if="!pendingProducts.length" class="admin-dashboard-pad">
        <EmptyState
          icon="pi pi-check-circle"
          title="همه‌چیز مرتب است"
          description="هیچ محصولی در انتظار تأیید نیست."
          size="sm"
        />
      </div>

      <div v-else class="admin-dashboard-table-wrap">
        <table class="tm-table">
          <caption class="sr-only">محصولات در انتظار تأیید</caption>
          <thead>
            <tr>
              <th scope="col">عنوان</th>
              <th scope="col">شرکت</th>
              <th scope="col">دسته‌بندی</th>
              <th scope="col">تاریخ</th>
              <th scope="col">عملیات</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="product in pendingProducts" :key="product.id">
              <td class="admin-dashboard-cell-title" data-label="عنوان">{{ product.title }}</td>
              <td data-label="شرکت">{{ product.company?.name || '—' }}</td>
              <td data-label="دسته‌بندی">{{ product.category?.nameFa || '—' }}</td>
              <td data-label="تاریخ">{{ formatDate(product.createdAt) }}</td>
              <td data-label="عملیات">
                <div class="admin-dashboard-row-actions">
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
    </TemPanel>

    <Dialog
      v-model:visible="showRejectDialog"
      header="رد محصول"
      :modal="true"
      :style="{ width: '32rem' }"
      :breakpoints="{ '640px': '92vw' }"
    >
      <div class="field">
        <label for="reject-reason">علت رد <span class="text-red-500">*</span></label>
        <Textarea id="reject-reason" v-model="rejectReason" placeholder="علت رد محصول را وارد کنید..." rows="3" class="w-full" />
      </div>
      <template #footer>
        <Button label="انصراف" icon="pi pi-times" severity="secondary" text @click="showRejectDialog = false" />
        <Button label="رد محصول" icon="pi pi-times" severity="danger" :loading="rejectingId !== null" @click="rejectProduct" />
      </template>
    </Dialog>
  </div>
</template>

<style scoped>
.admin-dashboard {
  direction: rtl;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.admin-dashboard-msg { margin: 0; }

.admin-dashboard-split {
  display: grid;
  grid-template-columns: minmax(0, 1.9fr) minmax(280px, 1fr);
  gap: 16px;
  align-items: start;
}

.admin-dashboard-side {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 0;
}

.admin-dashboard-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 280px), 1fr));
  gap: 16px;
}

.admin-dashboard-pad { padding: 16px; }
.admin-dashboard-table-wrap { overflow-x: auto; }
.admin-dashboard-cell-title { font-weight: 600; color: var(--tm-ink); }
.admin-dashboard-row-actions { display: flex; align-items: center; gap: 2px; }

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

@media (max-width: 991px) {
  .admin-dashboard-split { grid-template-columns: 1fr; }
}

@media (max-width: 640px) {
  .admin-dashboard-table-wrap { overflow-x: visible; }
  .admin-dashboard-table-wrap .tm-table thead { display: none; }
  .admin-dashboard-table-wrap .tm-table,
  .admin-dashboard-table-wrap .tm-table tbody,
  .admin-dashboard-table-wrap .tm-table tr,
  .admin-dashboard-table-wrap .tm-table td { display: block; width: 100%; }
  .admin-dashboard-table-wrap .tm-table tr {
    border: 1px solid var(--tm-line);
    border-radius: var(--tm-radius);
    margin: 10px;
    padding: 6px;
  }
  .admin-dashboard-table-wrap .tm-table td {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 8px 10px;
  }
  .admin-dashboard-table-wrap .tm-table td::before {
    content: attr(data-label);
    font-weight: 700;
    color: var(--tm-muted);
    font-size: 11px;
  }
}
</style>