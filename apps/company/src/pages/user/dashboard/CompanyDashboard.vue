<template>
  <div class="company-dashboard">
    <TemPageHeader :title="companyName ? 'خوش آمدید، ' + companyName : 'داشبورد شرکت'">
      <template #actions>
        <span class="company-dashboard-status">
          <span class="company-dashboard-status-dot" :class="{ 'is-active': company?.status === 'ACTIVE' }"></span>
          {{ companyStatusLabel }}
          <span v-if="company?.isVerified" class="company-dashboard-verified">
            <i class="pi pi-verified" aria-hidden="true"></i> تأیید شده
          </span>
        </span>
        <router-link :to="{ name: 'manage-product-create' }" class="tm-btn tm-btn--accent">
          <i class="pi pi-plus" aria-hidden="true"></i> افزودن محصول
        </router-link>
      </template>
    </TemPageHeader>

    <!-- Alerts — actionable items first -->
    <div v-if="alerts.length" class="cd-alerts">
      <div v-for="alert in alerts" :key="alert.id" class="cd-alert" :class="`cd-alert--${alert.severity}`">
        <div class="cd-alert-icon">
          <i :class="alert.icon"></i>
        </div>
        <div class="cd-alert-body">
          <span class="cd-alert-message">{{ alert.message }}</span>
        </div>
        <router-link v-if="alert.to" :to="alert.to" class="cd-alert-action">
          مشاهده
          <i class="pi pi-angle-left"></i>
        </router-link>
      </div>
    </div>

    <section class="cd-kpi-groups" aria-label="شاخص‌های کلیدی شرکت">
      <div class="cd-kpi-group">
        <div class="cd-kpi-group__heading"><h2>محصولات</h2><span>وضعیت کاتالوگ شرکت</span></div>
        <div class="cd-kpi-group__grid">
          <TemStatCard label="کل محصولات" :value="totalCompanyProducts" icon="pi pi-box" tone="primary" :loading="productsLoading" :to="{ name: 'manage-products' }" zero-meta="هنوز محصولی ثبت نشده است" />
          <TemStatCard label="منتشرشده" :value="publishedProducts" icon="pi pi-check-circle" tone="success" :loading="productsLoading" :to="{ name: 'manage-products', query: { status: 'PUBLISHED' } }" zero-meta="محصول منتشرشده‌ای ندارید" />
          <TemStatCard label="در انتظار بررسی" :value="pendingReviewProducts" icon="pi pi-clock" tone="warning" featured :loading="productsLoading" :to="{ name: 'manage-products', query: { status: 'PENDING_REVIEW' } }" zero-meta="درخواستی برای بررسی ندارید" />
        </div>
      </div>
      <div class="cd-kpi-group">
        <div class="cd-kpi-group__heading"><h2>استعلام‌ها</h2><span>فرصت‌های پاسخ‌گویی شرکت</span></div>
        <div class="cd-kpi-group__grid">
          <TemStatCard label="استعلام‌های دریافتی" :value="receivedInquiries" icon="pi pi-inbox" tone="primary" featured :loading="statsLoading" :to="{ name: 'company-inquiries', query: { scope: 'received' } }" zero-meta="هنوز استعلامی دریافت نکرده‌اید" />
          <TemStatCard label="استعلام‌های باز" :value="openInquiryCount" icon="pi pi-folder-open" tone="info" :loading="statsLoading" :to="{ name: 'company-inquiries', query: { scope: 'received', status: 'OPEN' } }" zero-meta="استعلام بازی وجود ندارد" />
          <TemStatCard label="پاسخ‌های در انتظار" :value="pendingResponses" icon="pi pi-reply" tone="danger" featured :loading="statsLoading" :to="{ name: 'company-inquiries', query: { scope: 'received', status: 'SUBMITTED' } }" zero-meta="پاسخ معوقی ندارید" />
        </div>
      </div>
      <div class="cd-kpi-group">
        <div class="cd-kpi-group__heading"><h2>عملکرد</h2><span>شاخص‌های پاسخ‌گویی و جایگاه</span></div>
        <div class="cd-kpi-group__grid">
          <TemStatCard label="نرخ پاسخ‌دهی"  :value="companyResponseRate === null ? null : companyResponseRate.toLocaleString('fa-IR') + '٪'" icon="pi pi-chart-line" tone="success" :loading="statsLoading"  :meta="companyResponseRate === 0 ? 'هنوز پاسخی با نتیجه ثبت نشده است' : 'بر اساس آمار ثبت‌شده استعلام‌ها'" zero-meta="هنوز داده کافی برای محاسبه وجود ندارد" />
          <TemStatCard label="رتبه شرکت" :value="companyRank ? companyRank.toLocaleString('fa-IR') : null" icon="pi pi-star" tone="warning" :loading="statsLoading" :meta="companyRankTotal ? 'از ' + companyRankTotal.toLocaleString('fa-IR') + ' شرکت' : 'پس از محاسبه رتبه توسط سامانه نمایش داده می‌شود'" zero-meta="رتبه‌ای برای شرکت ثبت نشده است" />
        </div>
      </div>
    </section>

    <!-- Stats error (non-blocking) -->
    <TemPanel v-if="statsError" title="آمار داشبورد" icon="pi pi-exclamation-triangle">
      <NoDataState
        icon="pi pi-exclamation-triangle"
        title="خطا در دریافت آمار داشبورد"
        description="بارگذاری آمار با مشکل مواجه شد. لطفاً دوباره تلاش کنید."
        retryable
        :loading="statsLoading"
        size="sm"
        @retry="retryAll"
      />
    </TemPanel>

    <TemPanel title="وضعیت محصولات" icon="pi pi-chart-pie">
      <template #actions><span class="cd-hint">تفکیک بر اساس وضعیت فعلی کاتالوگ</span></template>
      <div v-if="productsLoading" class="cd-chart-skeleton" aria-busy="true">
        <span v-for="n in 4" :key="n"></span>
      </div>
      <NoDataState v-else-if="productsError" icon="pi pi-exclamation-triangle" title="خطا در دریافت محصولات" description="اتصال به فهرست محصولات برقرار نشد. دوباره تلاش کنید." retryable @retry="fetchProducts" />
      <NoDataState v-else-if="!productStatusCounts" icon="pi pi-chart-pie" title="آمار تفکیکی محصولات در دسترس نیست" description="داده وضعیت محصولات از سرویس مدیریت دریافت نشد." retryable @retry="fetchProducts" />
      <div v-else-if="productTotal === 0" class="cd-chart-empty">
        <i class="pi pi-box" aria-hidden="true"></i>
        <strong>هنوز محصولی ثبت نشده است</strong>
        <span>با ثبت اولین محصول، وضعیت کاتالوگ در این بخش نمایش داده می‌شود.</span>
        <router-link :to="{ name: 'manage-product-create' }" class="tm-btn tm-btn--sm">ثبت محصول</router-link>
      </div>
      <div v-else-if="dominantProductSegment" class="cd-product-progress-list">
        <div v-for="segment in productLegendItems" :key="segment.label" class="cd-product-progress-item">
          <div class="cd-product-progress-heading">
            <span><i :style="{ background: segment.color }"></i>{{ segment.label }}</span>
            <strong>{{ segment.value.toLocaleString('fa-IR') }} <small>({{ segment.percent.toLocaleString('fa-IR') }}٪)</small></strong>
          </div>
          <div class="tm-meter"><span class="tm-meter__fill" :style="{ width: segment.percent + '%', background: segment.color }"></span></div>
        </div>
      </div>
      <div v-else class="cd-donut-row">
        <TemDonutChart :segments="productSegments" :center-value="productTotal.toLocaleString('fa-IR')" center-label="محصول" />
        <TemLegend :items="productLegendItems" />
      </div>
    </TemPanel>

    <!-- Primary operations -->
    <section class="company-dashboard-operations" aria-label="عملیات اصلی شرکت">
      <TemPanel title="جریان استعلام‌ها" icon="pi pi-sitemap">
        <template #actions>
          <router-link :to="{ name: 'company-inquiries' }" class="tm-btn tm-btn--ghost tm-btn--sm">مشاهده همه</router-link>
        </template>
        <InquiryPipeline :stages="pipelineStages" :loading="statsLoading" />
      </TemPanel>
      <TemPanel title="دسترسی سریع" icon="pi pi-bolt">
        <QuickActions :actions="quickActions" />
      </TemPanel>
    </section>

    <TemPanel title="فروش خرده‌فروشی" icon="pi pi-shopping-cart">
      <div class="cd-commerce-grid">
        <div class="cd-commerce-metric"><span>سفارش‌های جدید</span><strong>—</strong><small>پس از اتصال سرویس سفارش نمایش داده می‌شود</small></div>
        <div class="cd-commerce-metric"><span>سفارش‌های در حال ارسال</span><strong>—</strong><small>داده عملیاتی هنوز در دسترس نیست</small></div>
        <div class="cd-commerce-metric"><span>سفارش‌های تحویل‌شده</span><strong>—</strong><small>داده عملیاتی هنوز در دسترس نیست</small></div>
        <div class="cd-commerce-metric"><span>فروش و درآمد</span><strong>—</strong><small>پس از راه‌اندازی API مالی نمایش داده می‌شود</small></div>
        <div class="cd-commerce-metric cd-commerce-metric--notice"><span><i class="pi pi-exclamation-triangle" aria-hidden="true"></i> هشدار موجودی</span><p>سرویس موجودی متصل نیست؛ در حال حاضر نمی‌توان کمبود موجودی را محاسبه کرد.</p></div>
      </div>
      <div class="cd-commerce-actions">
        <router-link :to="{ name: 'company-retail-orders' }" class="tm-btn tm-btn--ghost tm-btn--sm">پیش‌نمایش سفارش‌ها</router-link>
        <router-link :to="{ name: 'manage-products' }" class="tm-btn tm-btn--ghost tm-btn--sm">مدیریت محصولات</router-link>
      </div>
    </TemPanel>

    <!-- Activity -->
    <div class="cd-grid cd-grid--1-1">
      <TemPanel title="مهلت‌های پیشرو" icon="pi pi-calendar-clock">
        <template #actions>
          <router-link :to="{ name: 'company-inquiries' }" class="tm-btn tm-btn--ghost tm-btn--sm">استعلام‌ها</router-link>
        </template>
        <EntityList
          :items="upcomingDeadlines"
          :loading="inquiriesLoading"
          empty-message="مهلت نزدیکی وجود ندارد."
        />
      </TemPanel>

      <TemPanel title="فعالیت‌های اخیر" icon="pi pi-history">
        <EntityList :items="recentActivities" :loading="statsLoading" empty-message="فعالیتی ثبت نشده است." />
      </TemPanel>
    </div>

    <TemPanel title="خلاصه شرکت" icon="pi pi-building">
      <template #actions>
        <router-link :to="{ name: 'company-settings' }" class="tm-btn tm-btn--ghost tm-btn--sm">ویرایش پروفایل شرکت</router-link>
      </template>
      <div v-if="companyLoading" class="cd-summary" aria-busy="true">
        <span class="cd-summary-logo cd-skeleton"></span>
        <div class="cd-summary-main">
          <span class="cd-skeleton cd-skeleton-line cd-skeleton-line--lg"></span>
          <span class="cd-skeleton cd-skeleton-line cd-skeleton-line--sm"></span>
          <div class="cd-skeleton-tags"><span class="cd-skeleton cd-skeleton-tag"></span><span class="cd-skeleton cd-skeleton-tag"></span></div>
        </div>
      </div>
      <div v-else class="cd-summary">
        <span class="cd-summary-logo">
          <img v-if="companyLogo" :src="companyLogo" :alt="companyName" width="64" height="64" decoding="async" />
          <i v-else class="pi pi-building" aria-hidden="true"></i>
        </span>
        <div class="cd-summary-main">
          <h3 class="cd-summary-name">{{ companyName || 'نام شرکت ثبت نشده است' }}</h3>
          <p v-if="company?.nameEn" class="cd-summary-sub" dir="ltr">{{ company.nameEn }}</p>
          <div class="cd-summary-tags">
            <span class="tm-pill" :class="company?.status === 'ACTIVE' ? 'tm-pill--success' : 'tm-pill--warning'">{{ companyStatusLabel }}</span>
            <span v-if="company?.isVerified" class="tm-pill tm-pill--info"><i class="pi pi-verified" aria-hidden="true"></i> تأیید شده</span>
          </div>
        </div>
      </div>
    </TemPanel>

    <!-- Recent products -->
    <TemPanel title="محصولات اخیر" icon="pi pi-box">
      <template #actions>
        <router-link :to="{ name: 'manage-products' }" class="tm-btn tm-btn--ghost tm-btn--sm">همه محصولات</router-link>
      </template>
      <EntityList :items="recentProducts" :loading="productsLoading" empty-message="هنوز محصولی ثبت نشده است." />
    </TemPanel>
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
import { PRODUCT_STATUSES, buildProductSegments, buildProductLegendItems, sumProductStatusCounts } from './dashboardPresentation.js'

import QuickActions from '@telecom/shared-ui/components/admin/dashboard/QuickActions.vue'
import EntityList from '@telecom/shared-ui/components/admin/dashboard/EntityList.vue'
import InquiryPipeline from '@telecom/shared-ui/components/admin/dashboard/InquiryPipeline.vue'
import TemPageHeader from '@telecom/shared-ui/components/ui/TemPageHeader.vue'
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

// ── Quick actions ───────────────────────────────────────────
const quickActions = [
  { label: 'پاسخ به استعلام‌های معلق', icon: 'pi pi-reply', to: { name: 'company-inquiries', query: { scope: 'received', status: 'SUBMITTED' } }, tone: 'primary' },
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
  productsError.value = false
  try {
    const [listResult, ...statusResults] = await Promise.allSettled([
      productsApi.myProducts({ limit: 20, sort: 'createdAt:desc' }),
      ...PRODUCT_STATUSES.map((status) => productsApi.myProducts({ page: 1, limit: 1, status })),
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
.company-dashboard {
  direction: rtl;
  display: flex;
  flex-direction: column;
  gap: var(--ds-section-gap);
}
.cd-kpi-groups { display: grid; gap: var(--ds-space-6); }
.company-dashboard-operations { display: grid; grid-template-columns: minmax(0, 1.2fr) minmax(260px, .8fr); gap: var(--ds-space-4); align-items: start; }
@media (max-width: 900px) { .company-dashboard-operations { grid-template-columns: minmax(0, 1fr); } }

.cd-kpi-group { min-width: 0; }
.cd-kpi-group__heading { display: flex; align-items: baseline; gap: .65rem; margin-bottom: .75rem; }
.cd-kpi-group__heading h2 { margin: 0; font-size: 1rem; font-weight: 800; color: var(--ds-color-text); }
.cd-kpi-group__heading span { color: var(--ds-color-text-muted); font-size: .8125rem; }
.cd-kpi-group__grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 240px), 1fr)); gap: var(--ds-space-3); }
.cd-chart-skeleton { display: grid; grid-template-columns: repeat(4, 1fr); align-items: end; gap: 1rem; height: 150px; padding: 1rem; }
.cd-chart-skeleton span { height: 45%; border-radius: 8px; background: var(--ds-color-surface-alt); animation: cd-pulse 1.2s ease-in-out infinite; }
.cd-chart-skeleton span:nth-child(2) { height: 72%; } .cd-chart-skeleton span:nth-child(3) { height: 56%; } .cd-chart-skeleton span:nth-child(4) { height: 88%; }
.cd-chart-empty { display: flex; flex-direction: column; align-items: center; gap: .65rem; padding: 2rem; color: var(--ds-color-text-muted); text-align: center; }
.cd-chart-empty > i { font-size: 1.5rem; color: var(--ds-color-primary); }
.cd-chart-empty strong { color: var(--ds-color-text); }
.cd-product-progress-list { display: grid; gap: 1rem; max-width: 760px; }
.cd-product-progress-heading { display: flex; justify-content: space-between; align-items: center; gap: 1rem; margin-bottom: .45rem; color: var(--ds-color-text); font-size: .875rem; }
.cd-product-progress-heading > span { display: inline-flex; align-items: center; gap: .5rem; }
.cd-product-progress-heading i { width: .65rem; height: .65rem; border-radius: 2px; }
.cd-product-progress-heading small { color: var(--ds-color-text-muted); font-weight: 500; }
.cd-donut-row { display: grid; grid-template-columns: minmax(150px, 190px) minmax(0, 1fr); align-items: center; gap: 1.25rem; max-width: 720px; }
.cd-donut-row :deep(.tm-donut-wrap) { max-width: 190px; }
.cd-commerce-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 240px), 1fr)); gap: .75rem; }
.cd-commerce-metric { display: flex; flex-direction: column; gap: .35rem; min-height: 112px; padding: .9rem 1rem; border: 1px solid var(--ds-color-border); border-radius: var(--ds-radius-md); background: var(--ds-color-surface-alt); }
.cd-commerce-metric > span { color: var(--ds-color-text-muted); font-size: .8125rem; font-weight: 700; }
.cd-commerce-metric strong { color: var(--ds-color-text); font-size: 1.25rem; }
.cd-commerce-metric small,.cd-commerce-metric p { margin: 0; color: var(--ds-color-text-muted); font-size: .8125rem; line-height: 1.6; }
.cd-commerce-metric--notice { grid-column: span 2; }
.cd-commerce-metric--notice > span { color: var(--ds-status-warning-fg); }
.cd-commerce-actions { display: flex; flex-wrap: wrap; gap: .5rem; margin-top: 1rem; }

/* Page header */
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}
.page-header h1 {
  font-size: var(--ds-font-size-2xl);
  font-weight: var(--ds-font-weight-bold);
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

/* ── Alerts — card-style with icon + action (skill: "helpful message + action") */
.cd-alerts {
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-3);
}
.cd-alert {
  display: flex;
  align-items: center;
  gap: var(--ds-space-3);
  padding: var(--ds-space-3) var(--ds-space-4);
  border-radius: var(--ds-radius-md);
  font-size: var(--ds-font-size-sm);
  border: 1px solid transparent;
}
.cd-alert-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.25rem;
  height: 2.25rem;
  border-radius: var(--ds-radius-md);
  flex-shrink: 0;
}
.cd-alert-icon i { font-size: 1.1rem; }
.cd-alert-body { flex: 1; min-width: 0; }
.cd-alert-message { font-weight: var(--ds-font-weight-medium); }
.cd-alert-action {
  display: inline-flex;
  align-items: center;
  gap: var(--ds-space-1);
  padding: var(--ds-space-2) var(--ds-space-3);
  border-radius: var(--ds-radius-md);
  font-size: var(--ds-font-size-sm);
  font-weight: var(--ds-font-weight-semibold);
  text-decoration: none;
  color: inherit;
  white-space: nowrap;
  transition: opacity var(--ds-transition);
}
.cd-alert-action:hover { opacity: 0.8; }
.cd-alert--warning {
  background: var(--ds-color-warning-soft);
  color: var(--ds-color-warning);
  border-color: var(--ds-color-warning);
  border-opacity: 0.2;
}
.cd-alert--warning .cd-alert-icon { background: var(--ds-color-warning); color: var(--ds-color-surface); }
.cd-alert--warning .cd-alert-action { background: var(--ds-color-warning); color: var(--ds-color-surface); }
.cd-alert--danger {
  background: var(--ds-color-danger-soft);
  color: var(--ds-color-danger);
  border-color: var(--ds-color-danger);
  border-opacity: 0.2;
}
.cd-alert--danger .cd-alert-icon { background: var(--ds-color-danger); color: var(--ds-color-surface); }
.cd-alert--danger .cd-alert-action { background: var(--ds-color-danger); color: var(--ds-color-surface); }

/* ── KPI grid */
.cd-kpis {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--ds-space-4);
}

.company-dashboard-analytics { min-width: 0; }
.cd-analytics-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1.25rem; }
.cd-analytics-block { min-width: 0; padding: .9rem 1rem .65rem; border: 1px solid var(--ds-color-border); border-radius: 12px; background: var(--ds-color-surface); }
.cd-analytics-heading { display: flex; align-items: baseline; justify-content: space-between; flex-wrap: wrap; gap: .5rem; margin-bottom: .35rem; }
.cd-analytics-heading strong { color: var(--ds-color-text); font-size: .85rem; font-weight: 700; }
.cd-analytics-heading span { color: var(--ds-color-text-muted); font-size: .72rem; }

/* ── Two-column grids */
.cd-grid { display: grid; gap: var(--ds-space-6); }
.cd-grid--2-1 { grid-template-columns: 2fr 1fr; }
.cd-grid--1-1 { grid-template-columns: 1fr 1fr; }

/* ── Company summary */
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

/* ── Skeleton loading for company summary */
.cd-skeleton {
  background: var(--ds-color-surface-alt);
  border-radius: var(--ds-radius-sm);
  animation: cd-pulse 1.2s ease-in-out infinite;
}
.cd-skeleton-line { display: block; height: 1rem; margin-bottom: var(--ds-space-2); }
.cd-skeleton-line--lg { width: 10rem; }
.cd-skeleton-line--sm { width: 6rem; margin-bottom: 0; }
.cd-skeleton-tags { display: flex; gap: var(--ds-space-2); margin-top: var(--ds-space-2); }
.cd-skeleton-tag { width: 4rem; height: 1.25rem; border-radius: var(--ds-radius-pill); }
@keyframes cd-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

/* ── Responsive */
@media (max-width: 1200px) {
  .cd-kpis { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 991px) {
  .cd-grid--2-1,
  .cd-grid--1-1 { grid-template-columns: 1fr; }
}
@media (max-width: 575px) {
  .cd-kpis { grid-template-columns: 1fr; }
  .cd-donut-row { grid-template-columns: minmax(0, 1fr); justify-items: center; }
  .cd-commerce-metric--notice { grid-column: auto; }
  .cd-kpi-group__heading { flex-wrap: wrap; }
  .company-dashboard-operations { grid-template-columns: minmax(0, 1fr); }
  .cd-alert { flex-wrap: wrap; }
  .cd-alert-action { width: 100%; justify-content: center; margin-top: var(--ds-space-1); }
}

/* Paces-inspired dashboard rhythm with company-scoped data unchanged. */
.cd-kpis { grid-template-columns: repeat(auto-fit, minmax(min(100%, 220px), 1fr)); }
.cd-grid--1-1 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
.cd-grid--2-1 { grid-template-columns: minmax(0, 2fr) minmax(280px, 1fr); }
@media (max-width: 900px) {
  .cd-grid--1-1,
  .cd-grid--2-1 { grid-template-columns: minmax(0, 1fr); }
}
@media (max-width: 640px) {
  .company-dashboard .page-header { padding: var(--ds-space-4); }
}
.company-dashboard-hero {
  display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap;
  gap: var(--ds-space-5); min-height: 9rem; padding: clamp(1.25rem, 2.5vw, 2rem);
  position:relative; overflow:hidden; border-radius:16px; background:var(--ds-hero-gradient); color:#fff;
}
.company-dashboard-hero::before { content:""; position:absolute; inset:0; pointer-events:none; opacity:.42; background:radial-gradient(circle at 82% 25%,rgba(255,255,255,.3),transparent 20%),radial-gradient(circle at 74% 110%,rgba(14,220,226,.4),transparent 34%),repeating-radial-gradient(circle at 83% 52%,transparent 0 28px,rgba(255,255,255,.12) 29px 30px,transparent 31px 55px); }
.company-dashboard-hero-copy,.company-dashboard-hero-actions { position:relative; z-index:1; }
.company-dashboard-hero-copy { min-width: 0; }
.company-dashboard-hero h1 {
  margin: 0; color: inherit; font-size: clamp(1.4rem, 2.2vw, 1.85rem);
  font-weight: var(--ds-font-weight-bold); line-height: 1.4; text-wrap: balance;
}
.company-dashboard-hero p { max-width: 44rem; margin: .5rem 0 0; color: var(--ds-color-on-brand-muted); line-height: var(--ds-line-height-relaxed); }
.company-dashboard-hero-status {
  display: inline-flex; align-items: center; flex-wrap: wrap; gap: .45rem;
  margin-top: .8rem; color: var(--ds-color-on-brand-muted); font-size: var(--ds-font-size-xs);
}
.company-dashboard-status-dot { width: .5rem; height: .5rem; border-radius: 50%; background: var(--ds-color-warning); }
.company-dashboard-status-dot.is-active { background: var(--ds-color-success); }
.company-dashboard-verified { display: inline-flex; align-items: center; gap: .3rem; margin-inline-start: .5rem; color: var(--ds-brand); }
.company-dashboard-hero-actions { display: flex; align-items: center; flex-wrap: wrap; gap: .65rem; }
.company-dashboard-secondary-action {
  display: inline-flex; min-height: 2.75rem; align-items: center; justify-content: center;
  gap: .5rem; padding: .6rem .9rem; border: 1px solid rgba(255,255,255,.38);
  border-radius: var(--ds-radius-md); color: var(--ds-color-on-brand); text-decoration: none;
  font-weight: var(--ds-font-weight-semibold);
}
.company-dashboard-secondary-action:hover { background: rgba(255,255,255,.09); }
.company-dashboard-secondary-action:focus-visible { outline: 2px solid var(--ds-brand); outline-offset: 3px; }
.company-dashboard-operations {
  display: grid;
  grid-template-columns: minmax(0, 1.4fr) minmax(280px, .8fr);
  gap: var(--ds-space-5);
  align-items: stretch;
}
.company-dashboard-operations > * { min-width: 0; }
.cd-hint { color: var(--ds-color-text-muted); font-size: var(--ds-font-size-xs); }
.company-dashboard-overview { display:grid; grid-template-columns:minmax(0,1.65fr) minmax(290px,1fr); gap:1rem; direction:ltr; align-items:stretch; }
.company-dashboard-overview > * { min-width:0; direction:rtl; }
.company-dashboard .cd-kpis { grid-template-columns:repeat(2,minmax(0,1fr)); grid-template-rows:repeat(2,minmax(0,1fr)); gap:.75rem; }
.company-dashboard .cd-grid--1-1 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
.company-dashboard .cd-grid--2-1 { grid-template-columns: minmax(0, 1.4fr) minmax(280px, .8fr); }
@media (max-width: 1100px) {
  .company-dashboard-overview,
  .company-dashboard-operations,
  .company-dashboard .cd-grid--2-1 { grid-template-columns: 1fr; }
}
@media (max-width: 900px) {
  .company-dashboard .cd-grid--1-1 { grid-template-columns: 1fr; }
}
@media (max-width: 640px) {
  .company-dashboard .cd-kpis { grid-template-columns:repeat(2,minmax(0,1fr)); }
  .company-dashboard-hero { align-items: flex-start; flex-direction: column; min-height: 0; }
  .company-dashboard-hero-actions { width: 100%; }
  .company-dashboard-hero-actions > * { flex: 1 1 auto; }
  .company-dashboard-secondary-action { width: 100%; }
}

/* ---- tem dashboard additions ---- */
.company-dashboard-status {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 0 8px;
  font-size: 12px;
  color: var(--tm-muted);
}
.company-dashboard-status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--tm-amber);
  flex: none;
}
.company-dashboard-status-dot.is-active { background: var(--tm-green); }
.company-dashboard-verified {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-inline-start: 4px;
  color: #0c8a6e;
  font-weight: 600;
}
.cd-donut-row {
  display: grid;
  grid-template-columns: minmax(120px, 160px) 1fr;
  gap: 18px;
  align-items: center;
  padding: 8px 0;
}
.cd-analytics-block {
  border: 1px solid var(--tm-line);
  border-radius: var(--tm-radius);
  background: var(--tm-surface-alt);
  padding: 14px 16px;
}
@media (max-width: 575px) {
  .cd-donut-row { grid-template-columns: 1fr; }
}
</style>
