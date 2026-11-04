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
  { status: 'PUBLISHED', label: 'منتشرشده', color: 'var(--ds-status-success-fg)' },
  { status: 'APPROVED', label: 'تأییدشده، آماده انتشار', color: 'var(--ds-status-info-fg)' },
  { status: 'PENDING_REVIEW', label: 'در انتظار بررسی', color: 'var(--ds-status-warning-fg)' },
  { status: 'DRAFT', label: 'پیش‌نویس', color: 'var(--ds-status-muted-fg)' },
  { status: 'REJECTED', label: 'ردشده', color: 'var(--ds-status-danger-fg)' },
]

export function buildProductSegments(counts) {
  if (!counts || PRODUCT_STATUSES.some((status) => !Number.isFinite(counts[status]) || counts[status] < 0)) return []
  return [
    ...SEGMENT_DEFINITIONS.map((segment) => ({
      label: segment.label,
      value: counts[segment.status],
      color: segment.color,
    })),
    {
      label: 'پنهان / بایگانی',
      value: counts.HIDDEN + counts.ARCHIVED,
      color: 'var(--ds-color-neutral)',
    },
  ]
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
