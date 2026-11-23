export const INQUIRY_REPORT_STATUSES = Object.freeze([
  { key: 'draft', status: 'DRAFT', label: 'پیش‌نویس' },
  { key: 'submitted', status: 'SUBMITTED', label: 'ارسال‌شده' },
  { key: 'open', status: 'OPEN', label: 'باز' },
  { key: 'closed', status: 'CLOSED', label: 'بسته‌شده' },
  { key: 'expired', status: 'EXPIRED', label: 'منقضی‌شده' },
  { key: 'completed', status: 'COMPLETED', label: 'تکمیل‌شده' },
  { key: 'cancelled', status: 'CANCELLED', label: 'لغوشده' },
])

const PRODUCT_REPORT_STATUSES = Object.freeze([
  { key: 'draft', status: 'DRAFT', label: 'پیش‌نویس' },
  { key: 'pending', status: 'PENDING_REVIEW', label: 'در انتظار بررسی' },
  { key: 'approved', status: 'APPROVED', label: 'تأیید شده' },
  { key: 'published', status: 'PUBLISHED', label: 'منتشر شده' },
  { key: 'rejected', status: 'REJECTED', label: 'رد شده' },
  { key: 'hidden', status: 'HIDDEN', label: 'پنهان' },
  { key: 'archived', status: 'ARCHIVED', label: 'بایگانی' },
])

export function buildProductReportKpis(products = []) {
  const rows = Array.isArray(products) ? products : []
  const counts = Object.fromEntries(
    PRODUCT_REPORT_STATUSES.map(({ key, status }) => [key, rows.filter((product) => product?.status === status).length]),
  )
  return { total: rows.length, ...counts }
}

export function buildProductReportSeries(kpis) {
  if (!kpis) return []
  return PRODUCT_REPORT_STATUSES.map(({ key, label }) => ({ label, value: kpis[key] }))
}

function readCount(value) {
  if (value === undefined || value === null) return 0
  const count = Number(value)
  return Number.isInteger(count) && count >= 0 ? count : null
}

export function buildInquiryReportKpis(stats) {
  const sentTotal = readCount(stats?.sent?.total)
  const receivedTotal = readCount(stats?.received?.total)
  if (sentTotal === null || receivedTotal === null) return null

  const counts = {}
  for (const { key, status } of INQUIRY_REPORT_STATUSES) {
    const sent = readCount(stats?.sent?.byStatus?.[status])
    const received = readCount(stats?.received?.byStatus?.[status])
    if (sent === null || received === null) return null
    counts[key] = sent + received
  }

  return { total: sentTotal + receivedTotal, ...counts }
}

export function buildInquiryReportSeries(kpis) {
  if (!kpis) return []
  return INQUIRY_REPORT_STATUSES.map(({ key, label }) => ({ label, value: kpis[key] }))
}
