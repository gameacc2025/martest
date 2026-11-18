import { describe, expect, it } from 'vitest'
import { getActiveInquiryCount } from './dashboardMetrics.js'

describe('getActiveInquiryCount', () => {
  it('reads the authoritative OPEN count from the InquiryStats response', () => {
    expect(getActiveInquiryCount({
      received: {
        total: 18,
        new: 6,
        byStatus: { SUBMITTED: 2, OPEN: 6, CLOSED: 10 },
      },
    })).toBe(6)
  })

  it('supports the nested API-client response envelope', () => {
    expect(getActiveInquiryCount({
      data: {
        data: { received: { byStatus: { OPEN: 4 } } },
      },
    })).toBe(4)
  })

  it('prefers explicit active counts when provided by a compatible API version', () => {
    expect(getActiveInquiryCount({ active: 9, received: { new: 3 } })).toBe(9)
    expect(getActiveInquiryCount({ counts: { active: '7' } })).toBe(7)
  })

  it('does not mistake the total inquiry count for the active count', () => {
    expect(getActiveInquiryCount({ received: { total: 18, byStatus: { CLOSED: 18 } } })).toBe(null)
    expect(getActiveInquiryCount({ total: 18 })).toBe(null)
  })

  it('returns null for missing, invalid, or negative count data', () => {
    expect(getActiveInquiryCount(null)).toBe(null)
    expect(getActiveInquiryCount({ received: { new: 'not-a-number' } })).toBe(null)
    expect(getActiveInquiryCount({ received: { new: -1 } })).toBe(null)
  })
})
