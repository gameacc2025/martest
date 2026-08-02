<template>
  <div class="company-dashboard">
    <!-- Page header (simple, uniform with other dashboard pages) -->
    <div class="page-header">
      <h1>داشبورد شرکت</h1>
      <div class="page-header-actions">
        <router-link :to="{ name: 'my-products' }">
          <Button label="افزودن محصول" icon="pi pi-plus" />
        </router-link>
      </div>
    </div>

    <!-- Company summary -->
    <DashboardPanel title="خلاصه شرکت" icon="pi pi-building">
      <template #actions>
        <router-link :to="{ name: 'company-settings' }" class="cd-link">ویرایش پروفایل</router-link>
      </template>
      <div class="cd-summary">
        <span class="cd-summary-logo">
          <img v-if="companyLogo" :src="companyLogo" :alt="companyName" />
          <i v-else class="pi pi-building"></i>
        </span>
        <div class="cd-summary-main">
          <h3 class="cd-summary-name">{{ companyName || '—' }}</h3>
          <p v-if="company?.nameEn" class="cd-summary-sub">{{ company.nameEn }}</p>
          <div class="cd-summary-tags">
            <span class="cd-tag" :class="company?.status === 'ACTIVE' ? 'cd-tag--success' : 'cd-tag--warning'">
              <i class="pi pi-circle-fill"></i>
              {{ companyStatusLabel }}
            </span>
            <span v-if="company?.isVerified" class="cd-tag cd-tag--info">
              <i class="pi pi-verified"></i> تأیید شده
            </span>
          </div>
        </div>
      </div>
    </DashboardPanel>

    <!-- Stats error (non-blocking) -->
    <DashboardPanel v-if="statsError" title="آمار داشبورد" icon="pi pi-exclamation-triangle">
      <NoDataState
        icon="pi pi-exclamation-triangle"
        title="خطا در دریافت آمار داشبورد"
        description="بارگذاری آمار با مشکل مواجه شد. لطفاً دوباره تلاش کنید."
        retryable
        :loading="statsLoading"
        size="sm"
        @retry="retryAll"
      />
    </DashboardPanel>

    <!-- Alerts / Warnings -->
    <DashboardPanel v-if="alerts.length" title="هشدارها" icon="pi pi-exclamation-triangle">
      <div class="cd-alerts">
        <div v-for="alert in alerts" :key="alert.id" class="cd-alert" :class="`cd-alert--${alert.severity}`">
          <i :class="alert.icon"></i>
          <span>{{ alert.message }}</span>
          <router-link v-if="alert.to" :to="alert.to" class="cd-alert-link">مشاهده</router-link>
        </div>
      </div>
    </DashboardPanel>

    <!-- KPI cards -->
    <div class="cd-kpis">
      <KpiCard
        label="محصولات منتشر شده"
        :value="publishedProducts"
        icon="pi pi-check-circle"
        tone="success"
        :loading="productsLoading"
        :to="{ name: 'company-products' }"
      />
      <KpiCard
        label="استعلام‌های دریافتی"
        :value="receivedInquiries"
        icon="pi pi-inbox"
        tone="primary"
        :loading="statsLoading"
        :to="{ name: 'company-inquiries' }"
      />
      <KpiCard
        label="پاسخ‌های در انتظار"
        :value="pendingResponses"
        icon="pi pi-clock"
        tone="warning"
        :loading="statsLoading"
        :to="{ name: 'company-inquiries' }"
      />
      <KpiCard
        label="محصولات فعال"
        :value="activeProducts"
        icon="pi pi-box"
        tone="info"
        :loading="productsLoading"
        :to="{ name: 'company-products' }"
      />
    </div>

    <!-- Inquiry pipeline -->
    <DashboardPanel title="جریان استعلام‌ها" icon="pi pi-sitemap">
      <InquiryPipeline :stages="pipelineStages" :loading="statsLoading" />
    </DashboardPanel>

    <!-- Two column: recent products + score -->
    <div class="cd-grid cd-grid--2-1">
      <DashboardPanel title="محصولات اخیر" icon="pi pi-box" :to="{ name: 'company-products' }">
        <EntityList :items="recentProducts" :loading="productsLoading" empty-message="هنوز محصولی ثبت نشده است." />
      </DashboardPanel>

      <DashboardPanel title="امتیاز و رتبه شرکت" icon="pi pi-star">
        <ScoreCard
          :score="companyScore"
          :max="100"
          label="امتیاز عملکرد"
          :rank="companyRank"
          :rank-total="companyRankTotal"
          tone="primary"
          :loading="statsLoading"
        />
      </DashboardPanel>
    </div>

    <!-- Two column: recent activities + upcoming deadlines -->
    <div class="cd-grid cd-grid--1-1">
      <DashboardPanel title="فعالیت‌های اخیر" icon="pi pi-history">
        <EntityList :items="recentActivities" :loading="statsLoading" empty-message="فعالیتی ثبت نشده است." />
      </DashboardPanel>

      <DashboardPanel title="مهلت‌های پیش‌رو" icon="pi pi-calendar-clock" :to="{ name: 'company-inquiries' }">
        <EntityList
          :items="upcomingDeadlines"
          :loading="inquiriesLoading"
          empty-message="مهلت نزدیکی وجود ندارد."
        />
      </DashboardPanel>
    </div>

    <!-- Quick actions -->
    <DashboardPanel title="دسترسی سریع" icon="pi pi-bolt">
      <QuickActions :actions="quickActions" />
    </DashboardPanel>
  </div>
</template>

<script setup>
/**
 * CompanyDashboard — B2B command center for a company representative.
 *
 * In this marketplace each user represents exactly one company (no separate
 * "company admin" role). This dashboard helps them manage products, price
 * inquiries, company info and marketplace visibility.
 *
 * Built from the same reusable, presentational dashboard components as the
 * admin command center. This page is the only place that talks to APIs; all
 * data comes from existing endpoints (inquiry stats + products list). No
 * backend changes and no fabricated business logic — anything the API does not
 * provide (e.g. a company score) degrades gracefully to an empty state.
 */
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import { inquiriesApi, productsApi } from '@telecom/api-client'
import { useAuthStore } from '../../../stores/auth'
import { NoDataState } from '@telecom/shared-ui/components/common/feedback'
import Button from 'primevue/button'

import KpiCard from '@telecom/shared-ui/components/admin/dashboard/KpiCard.vue'
import QuickActions from '@telecom/shared-ui/components/admin/dashboard/QuickActions.vue'
import DashboardPanel from '@telecom/shared-ui/components/admin/dashboard/DashboardPanel.vue'
import EntityList from '@telecom/shared-ui/components/admin/dashboard/EntityList.vue'
import InquiryPipeline from '@telecom/shared-ui/components/admin/dashboard/InquiryPipeline.vue'
import ScoreCard from '@telecom/shared-ui/components/admin/dashboard/ScoreCard.vue'

const router = useRouter()
const toast = useToast()
const auth = useAuthStore()

// ── State ───────────────────────────────────────────────────
const stats = ref(null)
const statsLoading = ref(true)
const statsError = ref(false)

const products = ref([])
const productsLoading = ref(true)

const openInquiries = ref([])
const inquiriesLoading = ref(true)

// ── Identity ────────────────────────────────────────────────
const company = computed(() => auth.company || null)

const companyName = computed(() => company.value?.name || '')
const companyLogo = computed(() => company.value?.logoUrl || company.value?.logo || '')
const companyStatusLabel = computed(() =>
  company.value?.status === 'ACTIVE' ? 'فعال' : company.value?.status === 'PENDING' ? 'در انتظار تأیید' : company.value?.status || '—'
)

// ── KPIs (from real /inquiries/stats + products list) ───────
const receivedInquiries = computed(() => stats.value?.received?.total ?? 0)
const pendingResponses = computed(() => stats.value?.responses?.awaiting ?? 0)
const publishedProducts = computed(
  () => products.value.filter((p) => p.status === 'PUBLISHED' || p.status === 'APPROVED').length
)
const activeProducts = computed(
  () => products.value.filter((p) => p.status !== 'ARCHIVED' && p.status !== 'REJECTED').length
)

// ── Inquiry pipeline (real received.byStatus) ───────────────
const pipelineStages = computed(() => {
  const by = stats.value?.received?.byStatus || {}
  return [
    { key: 'new', label: 'جدید', value: by.SUBMITTED ?? by.OPEN ?? 0, tone: 'info', icon: 'pi pi-inbox', to: { name: 'company-inquiries' } },
    { key: 'reviewing', label: 'در حال بررسی', value: by.OPEN ?? 0, tone: 'primary', icon: 'pi pi-search', to: { name: 'company-inquiries' } },
    { key: 'answered', label: 'پاسخ‌داده‌شده', value: (by.CLOSED ?? 0) + (by.COMPLETED ?? 0), tone: 'success', icon: 'pi pi-check', to: { name: 'company-inquiries' } },
    { key: 'expired', label: 'منقضی‌شده', value: by.EXPIRED ?? 0, tone: 'danger', icon: 'pi pi-calendar-times', to: { name: 'company-inquiries' } },
  ]
})

// ── Company score / rank (only if the API provides it) ──────
const companyScore = computed(() => {
  const rate = stats.value?.responses?.successRate
  return typeof rate === 'number' ? Math.round(rate) : null
})
const companyRank = computed(() => stats.value?.ranking?.position ?? null)
const companyRankTotal = computed(() => stats.value?.ranking?.total ?? null)

// ── Recent products (real products list) ────────────────────
const recentProducts = computed(() =>
  products.value.slice(0, 5).map((p) => ({
    id: p.id,
    title: p.title,
    subtitle: p.category?.nameFa || '',
    icon: 'pi pi-box',
    badge: productStatusLabel(p.status),
    badgeTone: productStatusTone(p.status),
    to: { name: 'company-products' },
  }))
)

// ── Recent activities (real recent inquiries + responses) ───
const recentActivities = computed(() => {
  const events = []
  for (const inq of stats.value?.recentInquiries || []) {
    events.push({
      id: `inq-${inq.id}`,
      title: inq.title || 'استعلام',
      subtitle: 'استعلام دریافت شد',
      icon: 'pi pi-inbox',
      meta: formatDate(inq.createdAt),
      _date: inq.createdAt,
      to: inq.id ? { name: 'company-inquiry-detail', params: { id: inq.id } } : null,
    })
  }
  for (const res of stats.value?.recentResponses || []) {
    events.push({
      id: `res-${res.id}`,
      title: res.inquiry?.title || 'پاسخ',
      subtitle: `پاسخ ${responseStatusLabel(res.status)}`,
      icon: res.status === 'SELECTED' ? 'pi pi-trophy' : 'pi pi-send',
      badge: responseStatusLabel(res.status),
      badgeTone: responseStatusTone(res.status),
      meta: formatDate(res.createdAt),
      _date: res.createdAt,
      to: res.inquiry?.id ? { name: 'company-inquiry-detail', params: { id: res.inquiry.id } } : null,
    })
  }
  return events
    .filter((e) => e._date)
    .sort((a, b) => new Date(b._date) - new Date(a._date))
    .slice(0, 8)
})

// ── Upcoming deadlines (real open received inquiries) ───────
const upcomingDeadlines = computed(() =>
  openInquiries.value
    .filter((inq) => inq.responseDeadline)
    .sort((a, b) => new Date(a.responseDeadline) - new Date(b.responseDeadline))
    .slice(0, 6)
    .map((inq) => ({
      id: inq.id,
      title: inq.title || 'استعلام',
      subtitle: inq.company?.name || '',
      icon: 'pi pi-clock',
      badge: remainingLabel(inq.responseDeadline),
      badgeTone: remainingTone(inq.responseDeadline),
      to: { name: 'company-inquiry-detail', params: { id: inq.id } },
    }))
)

// ── Quick actions ───────────────────────────────────────────
const quickActions = [
  { label: 'استعلام‌ها', icon: 'pi pi-inbox', to: { name: 'company-inquiries' }, tone: 'primary' },
  { label: 'محصولات شرکت', icon: 'pi pi-box', to: { name: 'manage-products' }, tone: 'success' },
  { label: 'افزودن محصول', icon: 'pi pi-plus', to: { name: 'manage-product-create' }, tone: 'info' },
  { label: 'گزارش‌ها', icon: 'pi pi-chart-bar', to: { name: 'company-reports' }, tone: 'secondary' },
  { label: 'کاربران شرکت', icon: 'pi pi-users', to: { name: 'company-users' }, tone: 'secondary' },
  { label: 'پروفایل شرکت', icon: 'pi pi-building', to: { name: 'company-settings' }, tone: 'warning' },
]

// ── Alerts / Warnings ─────────────────────────────────────
const alerts = computed(() => {
  const items = []
  const incomplete = products.value.filter((p) => p.status === 'DRAFT')
  if (incomplete.length > 0) {
    items.push({
      id: 'incomplete-products',
      severity: 'warning',
      icon: 'pi pi-file-edit',
      message: `${incomplete.length} محصول ناقص (پیش‌نویس) نیازمند تکمیل و ارسال برای بررسی`,
      to: { name: 'manage-products' },
    })
  }
  const rejected = products.value.filter((p) => p.status === 'REJECTED')
  if (rejected.length > 0) {
    items.push({
      id: 'rejected-products',
      severity: 'danger',
      icon: 'pi pi-times-circle',
      message: `${rejected.length} محصول رد شده نیازمند بازبینی و اصلاح`,
      to: { name: 'manage-products' },
    })
  }
  const expiringInquiries = openInquiries.value.filter((inq) => {
    if (!inq.responseDeadline) return false
    const ms = new Date(inq.responseDeadline).getTime() - Date.now()
    return ms > 0 && ms <= 24 * 60 * 60 * 1000
  })
  if (expiringInquiries.length > 0) {
    items.push({
      id: 'expiring-inquiries',
      severity: 'warning',
      icon: 'pi pi-clock',
      message: `${expiringInquiries.length} استعلام تا ۲۴ ساعت دیگر منقضی می‌شود`,
      to: { name: 'company-inquiries' },
    })
  }
  return items
})

// ── Helpers ─────────────────────────────────────────────────
function formatDate(v) {
  if (!v) return '—'
  try { return new Date(v).toLocaleDateString('fa-IR') } catch { return '—' }
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
  return 'gray'
}

const RESPONSE_STATUS_LABELS = {
  PENDING: 'در انتظار', SELECTED: 'انتخاب‌شده', REJECTED: 'ردشده',
  EXPIRED: 'منقضی', WITHDRAWN: 'پس‌گرفته‌شده',
}
function responseStatusLabel(s) { return RESPONSE_STATUS_LABELS[s] || s || '—' }
function responseStatusTone(s) {
  if (s === 'SELECTED') return 'success'
  if (s === 'REJECTED' || s === 'EXPIRED') return 'danger'
  if (s === 'PENDING') return 'warning'
  return 'gray'
}

function remainingMs(deadline) {
  if (!deadline) return null
  return new Date(deadline).getTime() - Date.now()
}
function remainingLabel(deadline) {
  const ms = remainingMs(deadline)
  if (ms === null) return '—'
  if (ms <= 0) return 'منقضی شده'
  const hours = Math.floor(ms / (60 * 60 * 1000))
  const days = Math.floor(hours / 24)
  if (days >= 1) return `${days.toLocaleString('fa-IR')} روز`
  if (hours >= 1) return `${hours.toLocaleString('fa-IR')} ساعت`
  const mins = Math.max(1, Math.floor(ms / (60 * 1000)))
  return `${mins.toLocaleString('fa-IR')} دقیقه`
}
function remainingTone(deadline) {
  const ms = remainingMs(deadline)
  if (ms === null || ms <= 0) return 'danger'
  if (ms <= 24 * 60 * 60 * 1000) return 'warning'
  return 'success'
}

function unwrapList(res) {
  const body = res?.data ?? res
  return body?.data?.data || body?.data || body?.items || (Array.isArray(body) ? body : []) || []
}

// ── Fetchers ────────────────────────────────────────────────
async function fetchStats() {
  statsLoading.value = true
  statsError.value = false
  try {
    const res = await inquiriesApi.getStats()
    const body = res?.data ?? res
    stats.value = body?.data ?? body
  } catch (err) {
    statsError.value = true
    console.error('Error fetching inquiry stats:', err)
  } finally {
    statsLoading.value = false
  }
}

async function fetchProducts() {
  productsLoading.value = true
  try {
    // Company dashboard shows the company's own products across ALL statuses,
    // so use the authenticated management endpoint (not the public list which
    // only returns PUBLISHED products).
    const res = await productsApi.myProducts({ limit: 20, sort: 'createdAt:desc' })
    products.value = unwrapList(res)
  } catch (err) {
    console.error('Error fetching products:', err)
    products.value = []
  } finally {
    productsLoading.value = false
  }
}

async function fetchOpenInquiries() {
  inquiriesLoading.value = true
  try {
    const res = await inquiriesApi.list({
      scope: 'received',
      status: 'OPEN',
      limit: 10,
      sortBy: 'responseDeadline',
      sortOrder: 'asc',
    })
    openInquiries.value = unwrapList(res)
  } catch (err) {
    console.error('Error fetching open inquiries:', err)
    openInquiries.value = []
  } finally {
    inquiriesLoading.value = false
  }
}

function retryAll() {
  fetchStats()
  fetchProducts()
  fetchOpenInquiries()
}

onMounted(() => {
  fetchStats()
  fetchProducts()
  fetchOpenInquiries()
})
</script>

<style scoped>
.company-dashboard {
  direction: rtl;
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-6);
}

/* Simple page header — uniform with other dashboard pages (Products, etc.). */
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}
.page-header h1 {
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0;
}
.page-header-actions {
  display: flex;
  gap: 0.5rem;
}

.cd-link {
  font-size: var(--ds-font-size-sm);
  font-weight: var(--ds-font-weight-semibold);
  color: var(--ds-color-primary);
  text-decoration: none;
}
.cd-link:hover { text-decoration: underline; }

/* Company summary */
.cd-summary {
  display: flex;
  align-items: center;
  gap: var(--ds-space-4);
}
.cd-summary-logo {
  width: 4rem;
  height: 4rem;
  border-radius: var(--ds-radius-md);
  background: var(--ds-color-info-soft);
  color: var(--ds-color-primary);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  flex-shrink: 0;
  font-size: 1.75rem;
}
.cd-summary-logo img { width: 100%; height: 100%; object-fit: cover; }
.cd-summary-name {
  font-size: var(--ds-font-size-lg);
  font-weight: var(--ds-font-weight-bold);
  color: var(--ds-color-text);
  margin: 0;
}
.cd-summary-sub {
  font-size: var(--ds-font-size-sm);
  color: var(--ds-color-text-muted);
  margin: var(--ds-space-1) 0 0;
}
.cd-summary-tags {
  display: flex;
  gap: var(--ds-space-2);
  margin-top: var(--ds-space-2);
  flex-wrap: wrap;
}
.cd-tag {
  display: inline-flex;
  align-items: center;
  gap: var(--ds-space-1);
  font-size: var(--ds-font-size-xs);
  font-weight: var(--ds-font-weight-semibold);
  padding: 0.2rem 0.6rem;
  border-radius: var(--ds-radius-pill);
}
.cd-tag i { font-size: 0.55rem; }
.cd-tag--success { background: var(--ds-color-success-soft); color: var(--ds-color-success); }
.cd-tag--warning { background: var(--ds-color-warning-soft); color: var(--ds-color-warning); }
.cd-tag--info { background: var(--ds-color-info-soft); color: var(--ds-color-info); }

/* KPI grid */
.cd-kpis {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--ds-space-4);
}

/* Two-column grids */
.cd-grid { display: grid; gap: var(--ds-space-6); }
.cd-grid--2-1 { grid-template-columns: 2fr 1fr; }
.cd-grid--1-1 { grid-template-columns: 1fr 1fr; }

/* Alerts */
.cd-alerts {
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-2);
}
.cd-alert {
  display: flex;
  align-items: center;
  gap: var(--ds-space-3);
  padding: var(--ds-space-3) var(--ds-space-4);
  border-radius: var(--ds-radius-md);
  font-size: var(--ds-font-size-sm);
}
.cd-alert i { font-size: 1.1rem; flex-shrink: 0; }
.cd-alert--warning { background: var(--ds-color-warning-soft); color: var(--ds-color-warning); }
.cd-alert--danger { background: var(--ds-color-danger-soft); color: var(--ds-color-danger); }
.cd-alert-link {
  margin-inline-start: auto;
  color: inherit;
  font-weight: var(--ds-font-weight-semibold);
  text-decoration: underline;
}

@media (max-width: 1200px) {
  .cd-kpis { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 991px) {
  .cd-grid--2-1,
  .cd-grid--1-1 { grid-template-columns: 1fr; }
}
@media (max-width: 575px) {
  .cd-kpis { grid-template-columns: 1fr; }
}
</style>
