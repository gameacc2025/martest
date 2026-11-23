import { describe, expect, it } from 'vitest'
import {
  buildProductReportKpis,
  buildProductReportSeries,
  buildInquiryReportKpis,
  buildInquiryReportSeries,
  INQUIRY_REPORT_STATUSES,
} from './reportMetrics.js'

describe('company report metrics', () => {
  it('counts every product lifecycle status and keeps the total reconciled', () => {
    const products = [
      'DRAFT', 'PENDING_REVIEW', 'APPROVED', 'PUBLISHED', 'REJECTED', 'HIDDEN', 'ARCHIVED',
    ].map((status, id) => ({ id, status }))
    const kpis = buildProductReportKpis(products)
    expect(kpis.total).toBe(7)
    expect(Object.values(kpis).slice(1).reduce((sum, count) => sum + count, 0)).toBe(kpis.total)
    expect(buildProductReportSeries(kpis)).toHaveLength(7)
  })

  it('combines sent and received counts for all inquiry statuses', () => {
    const stats = {
      sent: { total: 3, byStatus: { DRAFT: 1, OPEN: 2 } },
      received: { total: 4, byStatus: { SUBMITTED: 1, CLOSED: 1, COMPLETED: 1, CANCELLED: 1 } },
    }
    const kpis = buildInquiryReportKpis(stats)
    expect(kpis.total).toBe(7)
    expect(kpis.draft).toBe(1)
    expect(kpis.open).toBe(2)
    expect(kpis.submitted).toBe(1)
    expect(kpis.closed).toBe(1)
    expect(kpis.completed).toBe(1)
    expect(kpis.cancelled).toBe(1)
    expect(buildInquiryReportSeries(kpis)).toHaveLength(INQUIRY_REPORT_STATUSES.length)
    expect(buildInquiryReportSeries(kpis).reduce((sum, item) => sum + item.value, 0)).toBe(kpis.total)
  })

  it('treats omitted grouped statuses as zero and rejects invalid API totals', () => {
    expect(buildInquiryReportKpis({ sent: { total: 0 }, received: { total: 0 } }).total).toBe(0)
    expect(buildInquiryReportKpis({ sent: { total: -1 }, received: { total: 0 } })).toBeNull()
    expect(buildInquiryReportKpis(null)).toBeNull()
  })
})
