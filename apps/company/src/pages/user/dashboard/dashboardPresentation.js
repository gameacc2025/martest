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
  const make = (key, label, value, icon, tone, to, hint = '') => ({
    key,
    label,
    value: value == null ? null : Number(value),
    icon,
    tone,
    to,
    hint: value == null ? 'داده در دسترس نیست' : hint,
  })
  return [
    make('active-inquiries', 'استعلام‌های فعال', stats?.received?.byStatus ? active : null, 'pi pi-inbox', 'violet', { name: 'company-inquiries', query: { scope: 'received' } }, 'شامل وضعیت‌های جدید و در حال بررسی'),
    make('answered-inquiries', 'استعلام‌های پاسخ‌داده‌شده', stats?.received?.byStatus ? answered : null, 'pi pi-reply', 'green', { name: 'company-inquiries', query: { scope: 'received' } }, 'بر اساس استعلام‌های دریافتی'),
    make('participated-inquiries', 'استعلام‌های مشارکت‌شده', responseTotal, 'pi pi-send', 'cyan', { name: 'company-inquiries' }, 'بر اساس پاسخ‌های ثبت‌شده'),
    make('approved-products', 'محصولات تأییدشده', approvedProducts, 'pi pi-check-circle', 'green', { name: 'manage-products', query: { status: 'APPROVED' } }, 'بر اساس کاتالوگ شرکت'),
    make('pending-products', 'محصولات تأییدنشده', unapprovedProducts, 'pi pi-clock', 'amber', { name: 'manage-products', query: { status: 'PENDING_REVIEW' } }, 'بر اساس کاتالوگ شرکت'),
  ]
}


export function sortRecentDashboardItems(items, limit = 5) {
  return [...(items || [])]
    .filter((item) => item?.createdAt && Number.isFinite(new Date(item.createdAt).getTime()))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, limit)
}
