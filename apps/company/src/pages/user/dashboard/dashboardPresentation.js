export const PRODUCT_STATUSES = Object.freeze([
  'PUBLISHED',
  'APPROVED',
  'PENDING_REVIEW',
  'DRAFT',
  'REJECTED',
  'HIDDEN',
  'ARCHIVED',
])

const SEGMENT_DEFINITIONS = [
  { status: 'PUBLISHED', label: 'منتشر شده', color: 'var(--ds-status-success-fg)' },
  { status: 'APPROVED', label: 'تأیید شده', color: 'var(--ds-status-info-fg)' },
  { status: 'PENDING_REVIEW', label: 'در انتظار تأیید', color: 'var(--ds-status-warning-fg)' },
  { status: 'DRAFT', label: 'پیش‌نویس', color: 'var(--ds-status-muted-fg)' },
  { status: 'HIDDEN', label: 'پنهان', color: 'var(--ds-status-muted-fg)' },
  { status: 'ARCHIVED', label: 'بایگانی', color: 'var(--ds-status-danger-fg)' },
  { status: 'REJECTED', label: 'رد شده', color: 'var(--ds-status-danger-fg)' },
]

export function buildProductSegments(counts) {
  if (!counts || PRODUCT_STATUSES.some((status) => !Number.isFinite(counts[status]) || counts[status] < 0)) return []
  return SEGMENT_DEFINITIONS.map((segment) => ({
    label: segment.label,
    value: counts[segment.status],
    color: segment.color,
  }))
}

export function sumProductStatusCounts(segments) {
  return segments.reduce((sum, segment) => sum + (Number(segment.value) || 0), 0)
}

export function buildProductLegendItems(segments) {
  const total = sumProductStatusCounts(segments)
  if (!total) return []
  return segments
    .filter((segment) => segment.value > 0)
    .map((segment) => ({
      ...segment,
      percent: Math.round((segment.value / total) * 100),
    }))
}

export function buildCompanyDashboardMetrics({ stats, productStatusCounts }) {
  const by = stats?.received?.byStatus || {}
  const responseTotal = stats?.responses?.total ?? stats?.responses?.count ?? null
  const active = Number(by.SUBMITTED || 0) + Number(by.OPEN || 0)
  const answered = Number(by.CLOSED || 0) + Number(by.COMPLETED || 0)
  const approvedProducts = productStatusCounts && Number.isFinite(productStatusCounts.APPROVED) && Number.isFinite(productStatusCounts.PUBLISHED) ? productStatusCounts.APPROVED + productStatusCounts.PUBLISHED : null
  const unapprovedProducts = productStatusCounts && ['PENDING_REVIEW', 'DRAFT', 'REJECTED'].every(status => Number.isFinite(productStatusCounts[status])) ? productStatusCounts.PENDING_REVIEW + productStatusCounts.DRAFT + productStatusCounts.REJECTED : null
  const make = (key, label, actual, sampleValue, icon, tone, to, hint = '') => ({
    key, label, value: actual == null ? sampleValue : actual,
    sample: actual == null, icon, tone, to, hint,
  })
  return [
    make('active-inquiries', 'استعلام‌های فعال', stats?.received?.byStatus ? active : null, 18, 'pi pi-inbox', 'violet', { name: 'company-inquiries', query: { scope: 'received', status: 'OPEN' } }, 'آمار واقعی استعلام‌ها'),
    make('answered-inquiries', 'استعلام‌های پاسخ‌داده‌شده', stats?.received?.byStatus ? answered : null, 12, 'pi pi-reply', 'green', { name: 'company-inquiries', query: { scope: 'received' } }, 'آمار واقعی استعلام‌ها'),
    make('participated-inquiries', 'استعلام‌های مشارکت‌شده', responseTotal, 9, 'pi pi-send', 'cyan', { name: 'company-inquiries' }),
    make('approved-products', 'محصولات تأییدشده', approvedProducts, 24, 'pi pi-check-circle', 'green', { name: 'manage-products', query: { status: 'APPROVED' } }, 'آمار واقعی کاتالوگ'),
    make('pending-products', 'محصولات تأییدنشده', unapprovedProducts, 5, 'pi pi-clock', 'amber', { name: 'manage-products', query: { status: 'PENDING_REVIEW' } }),
    make('active-orders', 'سفارش‌های فعال', null, 11, 'pi pi-shopping-cart', 'violet', { name: 'company-retail-orders' }),
    make('shipping-orders', 'سفارش‌های در حال ارسال', null, 4, 'pi pi-truck', 'cyan', { name: 'company-retail-orders' }),
    make('delivered-orders', 'سفارش‌های تحویل‌شده', null, 28, 'pi pi-check-square', 'green', { name: 'company-retail-orders' }),
  ]
}
