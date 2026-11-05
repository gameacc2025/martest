<template>
  <div class="company-dashboard">
    <div v-if="alerts.length" class="cd-alerts">
      <div v-for="alert in alerts" :key="alert.id" class="cd-alert" :class="`cd-alert--${alert.severity}`">
        <div class="cd-alert-icon"><i :class="alert.icon"></i></div><div class="cd-alert-body"><span class="cd-alert-message">{{ alert.message }}</span></div>
        <router-link v-if="alert.to" :to="alert.to" class="cd-alert-action">مشاهده <i class="pi pi-angle-left"></i></router-link>
      </div>
    </div>
    <section class="cd-dashboard-metrics" aria-label="آمار عملکرد شرکت">
      <router-link v-for="metric in dashboardMetrics" :key="metric.key" :to="metric.to" class="cd-dashboard-metric" :class="`cd-dashboard-metric--${metric.tone}`">
        <span class="cd-dashboard-metric__icon"><i :class="metric.icon" aria-hidden="true"></i></span>
        <span class="cd-dashboard-metric__content">
          <span class="cd-dashboard-metric__label">{{ metric.label }}</span><strong>{{ Number(metric.value).toLocaleString('fa-IR') }}</strong>
          <small><span v-if="metric.sample" class="cd-sample-tag">نمونه</span>{{ metric.sample ? 'عدد نمایشی تا اتصال API' : metric.hint }}</small>
        </span>
      </router-link>
    </section>
    <section class="cd-dashboard-columns" aria-label="نمای کلی فعالیت شرکت">
      <div class="cd-dashboard-main">
        <div class="cd-dashboard-two-up">
          <TemPanel title="فعالیت‌های اخیر" icon="pi pi-history"><EntityList :items="recentActivities" :loading="statsLoading" empty-message="فعالیتی ثبت نشده است." /></TemPanel>
          <TemPanel title="استعلام‌های پیشرو" icon="pi pi-calendar-clock">
            <template #actions><router-link :to="{ name: 'company-inquiries' }" class="tm-btn tm-btn--ghost tm-btn--sm">مشاهده همه</router-link></template>
            <EntityList :items="upcomingDeadlines" :loading="inquiriesLoading" empty-message="استعلام دارای مهلت پاسخ ثبت نشده است." />
          </TemPanel>
        </div>
        <div class="cd-dashboard-three-up">
          <TemPanel title="محصولات اخیر تأییدشده" icon="pi pi-check-circle">
            <template #actions><router-link :to="{ name: 'manage-products', query: { status: 'APPROVED' } }" class="tm-btn tm-btn--ghost tm-btn--sm">همه</router-link></template>
            <EntityList :items="recentApprovedProducts" :loading="productsLoading" empty-message="محصول تأییدشده‌ای در فهرست اخیر نیست." />
          </TemPanel>
          <TemPanel title="محصولات اخیر تأییدنشده" icon="pi pi-clock">
            <template #actions><router-link :to="{ name: 'manage-products', query: { status: 'PENDING_REVIEW' } }" class="tm-btn tm-btn--ghost tm-btn--sm">همه</router-link></template>
            <EntityList :items="recentPendingProducts" :loading="productsLoading" empty-message="محصولی در انتظار تأیید نیست." />
          </TemPanel>
          <TemPanel title="آخرین استعلام‌های پاسخ‌داده‌شده" icon="pi pi-reply">
            <template #actions><router-link :to="{ name: 'company-inquiries' }" class="tm-btn tm-btn--ghost tm-btn--sm">همه</router-link></template>
            <EntityList :items="recentAnsweredInquiries" :loading="statsLoading" empty-message="پاسخ ثبت‌شده‌ای وجود ندارد." />
          </TemPanel>
        </div>
      </div>
      <aside class="cd-dashboard-aside">
        <TemPanel title="دسترسی سریع" icon="pi pi-bolt"><QuickActions :actions="quickActions" /></TemPanel>
        <TemPanel title="میزان فروش" icon="pi pi-chart-line">
          <template #actions><span class="cd-sample-tag">داده نمونه</span></template>
          <div class="cd-sales-chart">
            <div class="cd-sales-chart__summary"><strong>۵۶٫۸ <small>میلیون تومان</small></strong><span><i class="pi pi-arrow-up-left" aria-hidden="true"></i> ۱۸٫۶٪ <small>نسبت به ماه قبل</small></span></div>
            <svg class="cd-sales-chart__plot" viewBox="0 0 320 150" role="img" aria-label="نمودار نمونه فروش در دوازده ماه گذشته">
              <defs><linearGradient id="cd-sales-area" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stop-color="#7c6cf6" stop-opacity=".24"/><stop offset="100%" stop-color="#7c6cf6" stop-opacity="0"/></linearGradient></defs>
              <path d="M8 120H312 M8 82H312 M8 44H312" class="cd-sales-chart__grid"/>
              <path d="M8 118 L35 108 L62 112 L89 91 L116 96 L143 76 L170 82 L197 59 L224 65 L251 42 L278 48 L312 18 L312 132 L8 132 Z" fill="url(#cd-sales-area)"/>
              <path d="M8 118 L35 108 L62 112 L89 91 L116 96 L143 76 L170 82 L197 59 L224 65 L251 42 L278 48 L312 18" class="cd-sales-chart__line"/>
              <circle cx="312" cy="18" r="4" class="cd-sales-chart__point"/>
            </svg>
            <div class="cd-sales-chart__months"><span>آذر</span><span>دی</span><span>بهمن</span><span>اسفند</span><span>فروردین</span><span>اردیبهشت</span><span>خرداد</span><span>تیر</span><span>مرداد</span><span>شهریور</span><span>مهر</span><span>آبان</span></div>
            <p class="cd-sales-chart__note">مقادیر نمایشی هستند و پس از آماده‌شدن API فروش با داده واقعی جایگزین می‌شوند.</p>
          </div>
        </TemPanel>
      </aside>
    </section>
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
import { PRODUCT_STATUSES, buildProductSegments, buildProductLegendItems, sumProductStatusCounts, buildCompanyDashboardMetrics } from './dashboardPresentation.js'

import QuickActions from '@telecom/shared-ui/components/admin/dashboard/QuickActions.vue'
import EntityList from '@telecom/shared-ui/components/admin/dashboard/EntityList.vue'
import InquiryPipeline from '@telecom/shared-ui/components/admin/dashboard/InquiryPipeline.vue'
import TemStatCard from '@telecom/shared-ui/components/ui/TemStatCard.vue'
import TemPanel from '@telecom/shared-ui/components/ui/TemPanel.vue'
import TemDonutChart from '@telecom/shared-ui/components/ui/TemDonutChart.vue'
import TemLegend from '@telecom/shared-ui/components/ui/TemLegend.vue'

const router = useRouter()
const toast = useToast()
const auth = useAuthStore()

// ── State ───────────────────────────────────────────────────
const stats = ref(null)
const statsLoading = ref(true)
const statsError = ref(false)

const products = ref([])
const productsByStatus = ref({})
const totalCompanyProducts = ref(null)
const productStatusCounts = ref(null)
const productsLoading = ref(true)
const productsError = ref(false)

const openInquiries = ref([])
const inquiriesLoading = ref(true)

const companyLoading = ref(true)

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
const publishedProducts = computed(() => productStatusCounts.value?.PUBLISHED ?? null)
const pendingReviewProducts = computed(() => productStatusCounts.value?.PENDING_REVIEW ?? null)
const openInquiryCount = computed(() => stats.value?.received?.byStatus?.OPEN ?? 0)

// ── Inquiry pipeline (real received.byStatus) ───────────────
const pipelineStages = computed(() => {
  const by = stats.value?.received?.byStatus || {}
  return [
    { key: 'new', label: 'جدید', value: by.SUBMITTED ?? 0, tone: 'info', icon: 'pi pi-inbox', to: { name: 'company-inquiries', query: { scope: 'received', status: 'SUBMITTED' } } },
    { key: 'reviewing', label: 'در حال بررسی', value: by.OPEN ?? 0, tone: 'primary', icon: 'pi pi-search', to: { name: 'company-inquiries', query: { scope: 'received', status: 'OPEN' } } },
    { key: 'answered', label: 'پاسخ‌داده‌شده', value: (by.CLOSED ?? 0) + (by.COMPLETED ?? 0), tone: 'success', icon: 'pi pi-check', to: { name: 'company-inquiries' } },
    { key: 'expired', label: 'منقضی‌شده', value: by.EXPIRED ?? 0, tone: 'danger', icon: 'pi pi-calendar-times', to: { name: 'company-inquiries', query: { scope: 'received', status: 'EXPIRED' } } },
  ]
})

// Product lifecycle counts come from server-side status filters, not the first 20 rows.
const productSegments = computed(() => buildProductSegments(productStatusCounts.value))
const productTotal = computed(() => sumProductStatusCounts(productSegments.value))
const productLegendItems = computed(() => buildProductLegendItems(productSegments.value))
const dominantProductSegment = computed(() => productLegendItems.value.find((item) => item.percent > 90) || null)

// ── Company score / rank (only if the API provides it) ──────
const companyRank = computed(() => stats.value?.ranking?.position ?? null)
const companyRankTotal = computed(() => stats.value?.ranking?.total ?? null)
const companyResponseRate = computed(() => {
  const value = stats.value?.responses?.successRate
  return typeof value === 'number' && Number.isFinite(value) ? Math.round(value * 10) / 10 : null
})

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

const recentApprovedProducts = computed(() => [...(productsByStatus.value.APPROVED || []), ...(productsByStatus.value.PUBLISHED || [])].slice(0, 5).map(p => ({ id: p.id, title: p.title, subtitle: p.category?.nameFa || 'محصول شرکت', icon: 'pi pi-box', badge: 'تأیید شده', badgeTone: 'success', to: { name: 'manage-products', query: { status: 'APPROVED' } } })))
const recentPendingProducts = computed(() => [...(productsByStatus.value.PENDING_REVIEW || []), ...(productsByStatus.value.DRAFT || []), ...(productsByStatus.value.REJECTED || [])].slice(0, 5).map(p => ({ id: p.id, title: p.title, subtitle: p.category?.nameFa || 'نیازمند بررسی', icon: 'pi pi-clock', badge: productStatusLabel(p.status), badgeTone: 'warning', to: { name: 'manage-products', query: { status: 'PENDING_REVIEW' } } })))
const recentAnsweredInquiries = computed(() => {
  const seen = new Set()
  return (stats.value?.recentResponses || []).filter(r => {
    const id = r.inquiry?.id
    if (!id || seen.has(id)) return false
    seen.add(id)
    return true
  }).slice(0, 5).map(r => ({ id: r.inquiry.id, title: r.inquiry.title || 'استعلام', subtitle: 'آخرین پاسخ: ' + responseStatusLabel(r.status), icon: 'pi pi-reply', badge: responseStatusLabel(r.status), badgeTone: responseStatusTone(r.status), meta: formatDate(r.createdAt), to: { name: 'company-inquiry-detail', params: { id: r.inquiry.id } } }))
})
const dashboardMetrics = computed(() => buildCompanyDashboardMetrics({ stats: stats.value, productStatusCounts: productStatusCounts.value }))

// ── Quick actions ────────────────────────────────────────────
const quickActions = [
  { label: 'پاسخ به استعلام‌های معلق', icon: 'pi pi-reply', to: { name: 'company-inquiries', query: { scope: 'received', status: 'SUBMITTED' } }, tone: 'primary' },
  { label: 'مدیریت محصولات', icon: 'pi pi-box', to: { name: 'manage-products' }, tone: 'secondary' },
  { label: 'مشاهده همه استعلام‌ها', icon: 'pi pi-inbox', to: { name: 'company-inquiries' }, tone: 'secondary' },
  { label: 'مشاهده سفارش‌ها', icon: 'pi pi-shopping-cart', to: { name: 'company-retail-orders' }, tone: 'secondary' },
  { label: 'ویرایش پروفایل شرکت', icon: 'pi pi-building', to: { name: 'company-settings' }, tone: 'secondary' },
]

// ── Alerts / Warnings ─────────────────────────────────────
const alerts = computed(() => {
  const items = []
  const incomplete = productStatusCounts.value?.DRAFT ?? 0
  if (incomplete > 0) {
    items.push({
      id: 'incomplete-products',
      severity: 'warning',
      icon: 'pi pi-file-edit',
      message: `${incomplete.toLocaleString('fa-IR')} محصول ناقص (پیش‌نویس) نیازمند تکمیل و ارسال برای بررسی`,
      to: { name: 'manage-products', query: { status: 'DRAFT' } },
    })
  }
  const rejected = productStatusCounts.value?.REJECTED ?? 0
  if (rejected > 0) {
    items.push({
      id: 'rejected-products',
      severity: 'danger',
      icon: 'pi pi-times-circle',
      message: `${rejected.toLocaleString('fa-IR')} محصول رد شده نیازمند بازبینی و اصلاح`,
      to: { name: 'manage-products', query: { status: 'REJECTED' } },
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
  if (status === 'PUBLISHED') return 'success'
  if (status === 'APPROVED') return 'info'
  if (status === 'PENDING_REVIEW') return 'warning'
  if (status === 'REJECTED' || status === 'ARCHIVED') return 'danger'
  return 'gray'
}

const RESPONSE_STATUS_LABELS = {
  PENDING: 'در انتظار', SELECTED: 'انتخاب‌شده', REJECTED: 'رد شده',
  EXPIRED: 'منقضی‌شده', WITHDRAWN: 'پس‌گرفته‌شده',
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
  productsError.value = false
  try {
    const [listResult, ...statusResults] = await Promise.allSettled([
      productsApi.myProducts({ limit: 20, sort: 'createdAt:desc' }),
      ...PRODUCT_STATUSES.map((status) => productsApi.myProducts({ page: 1, limit: 5, sort: 'createdAt:desc', status })),
    ])
    if (listResult.status !== 'fulfilled') throw listResult.reason

    const res = listResult.value
    products.value = unwrapList(res)
    const body = res?.data ?? res
    const meta = body?.data?.meta ?? body?.meta
    const overallTotal = Number(meta?.total)
    totalCompanyProducts.value = Number.isFinite(overallTotal) ? overallTotal : null

    const counts = {}
    PRODUCT_STATUSES.forEach((status, index) => {
      const result = statusResults[index]
      if (result.status !== 'fulfilled') { counts[status] = null; return }
      const responseBody = result.value?.data ?? result.value
      const responseMeta = responseBody?.data?.meta ?? responseBody?.meta
      const count = Number(responseMeta?.total)
      counts[status] = Number.isFinite(count) ? count : null
    })
    productStatusCounts.value = PRODUCT_STATUSES.every((status) => counts[status] !== null) ? counts : null
    const statusProducts = {}
    PRODUCT_STATUSES.forEach((status, index) => {
      const result = statusResults[index]
      statusProducts[status] = result.status === 'fulfilled' ? unwrapList(result.value) : []
    })
    productsByStatus.value = statusProducts
    if (totalCompanyProducts.value === null && productStatusCounts.value) {
      totalCompanyProducts.value = PRODUCT_STATUSES.reduce((sum, status) => sum + counts[status], 0)
    }
  } catch (err) {
    productsError.value = true
    products.value = []
    productStatusCounts.value = null
    console.error('Error fetching company product dashboard data:', err)
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
  // Company data comes from auth store — mark loaded once available
  if (company.value) {
    companyLoading.value = false
  } else {
    const unwatch = setInterval(() => {
      if (company.value) {
        companyLoading.value = false
        clearInterval(unwatch)
      }
    }, 50)
    // Safety: stop checking after 3s even if no company data
    setTimeout(() => { companyLoading.value = false }, 3000)
  }
})
</script>

<style scoped>
.company-dashboard{direction:rtl;display:flex;flex-direction:column;gap:18px;min-width:0}
.company-dashboard :deep(.tm-panel){height:100%;min-width:0;border:1px solid var(--tm-line);border-radius:4px;background:var(--tm-surface);box-shadow:0 1px 3px rgba(20,20,60,.04)}
.company-dashboard :deep(.tm-panel__head){min-height:48px;padding:12px 15px}
.company-dashboard :deep(.tm-panel__head h3){font-size:.9rem;font-weight:650}
.company-dashboard :deep(.tm-panel__body){padding:12px 15px}
.cd-dashboard-metrics{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}
.cd-dashboard-metric{display:flex;align-items:center;gap:9px;min-width:0;min-height:80px;padding:9px 11px;border:1px solid var(--tm-line);border-radius:4px;background:var(--tm-surface);box-shadow:0 1px 3px rgba(20,20,60,.04);color:var(--tm-ink);text-decoration:none;transition:transform .18s ease,box-shadow .18s ease}
.cd-dashboard-metric:hover{transform:translateY(-2px);box-shadow:0 5px 14px rgba(20,20,60,.08)}
.cd-dashboard-metric__icon{display:grid;place-items:center;width:34px;height:34px;flex:0 0 34px;border-radius:6px;font-size:16px}
.cd-dashboard-metric--violet .cd-dashboard-metric__icon{color:#7c6cf6;background:#efedff}.cd-dashboard-metric--green .cd-dashboard-metric__icon{color:#16a765;background:#e7f8ef}.cd-dashboard-metric--cyan .cd-dashboard-metric__icon{color:#1699c9;background:#e5f6fc}.cd-dashboard-metric--amber .cd-dashboard-metric__icon{color:#c98712;background:#fff5df}.cd-dashboard-metric--orange .cd-dashboard-metric__icon{color:#e75f37;background:#fff0e9}
.cd-dashboard-metric__content{display:flex;flex-direction:column;min-width:0;gap:3px}.cd-dashboard-metric__label{overflow:hidden;color:var(--tm-muted);font-size:.74rem;font-weight:600;text-overflow:ellipsis;white-space:nowrap}.cd-dashboard-metric__content strong{color:var(--tm-ink);font-size:1.12rem;font-weight:650;line-height:1.25;font-variant-numeric:tabular-nums}.cd-dashboard-metric__content small{display:flex;align-items:center;gap:5px;min-height:15px;color:var(--tm-muted);font-size:.64rem;line-height:1.4}
.cd-sample-tag{display:inline-flex;padding:1px 5px;border-radius:3px;background:#fff2d8;color:#98630b;font-size:.62rem;font-weight:700}
.cd-dashboard-columns{display:grid;grid-template-columns:minmax(0,1.9fr) minmax(290px,1fr);gap:18px;align-items:start}.cd-dashboard-main,.cd-dashboard-aside{display:grid;min-width:0;gap:18px}.cd-dashboard-two-up{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px;align-items:stretch}.cd-dashboard-three-up{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:18px;align-items:stretch}
.cd-sales-chart{display:flex;flex-direction:column;gap:9px;min-width:0}
.cd-sales-chart__summary{display:flex;align-items:flex-end;justify-content:space-between;gap:8px}
.cd-sales-chart__summary>strong{color:var(--tm-ink);font-size:1.25rem;font-weight:750;line-height:1.2}
.cd-sales-chart__summary>strong small{color:var(--tm-muted);font-size:.68rem;font-weight:500}
.cd-sales-chart__summary>span{display:flex;align-items:center;gap:3px;color:#16a765;font-size:.72rem;font-weight:700;white-space:nowrap}
.cd-sales-chart__summary>span small{color:var(--tm-muted);font-size:.62rem;font-weight:500}
.cd-sales-chart__plot{display:block;width:100%;height:auto;overflow:visible}
.cd-sales-chart__grid{fill:none;stroke:var(--tm-line);stroke-width:1;stroke-dasharray:3 4}
.cd-sales-chart__line{fill:none;stroke:#7c6cf6;stroke-width:3;stroke-linecap:round;stroke-linejoin:round}
.cd-sales-chart__point{fill:#fff;stroke:#7c6cf6;stroke-width:3}
.cd-sales-chart__months{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:5px 2px;color:var(--tm-muted);font-size:.61rem;text-align:center}
.cd-sales-chart__note{margin:0;padding-top:8px;border-top:1px solid var(--tm-line);color:var(--tm-muted);font-size:.65rem;line-height:1.6}
@media(max-width:1280px){.cd-dashboard-three-up{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media(max-width:1000px){.cd-dashboard-columns{grid-template-columns:minmax(0,1fr)}.cd-dashboard-aside{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media(max-width:720px){.cd-dashboard-metrics{grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.cd-dashboard-two-up,.cd-dashboard-three-up,.cd-dashboard-aside{grid-template-columns:minmax(0,1fr);gap:12px}.cd-dashboard-metric{min-height:74px;padding:8px;gap:8px}.cd-dashboard-metric__icon{width:32px;height:32px;flex-basis:32px}.cd-dashboard-metric__content strong{font-size:1rem}}
@media(max-width:390px){.cd-dashboard-metrics{grid-template-columns:minmax(0,1fr)}}
@media(prefers-reduced-motion:reduce){.cd-dashboard-metric{transition:none}}
</style>
