import { describe, expect, it } from 'vitest'
import {
  PRODUCT_STATUSES,
  buildProductSegments,
  buildProductLegendItems,
  sumProductStatusCounts,
} from './dashboardPresentation.js'

const scenarios = {
  empty: Object.fromEntries(PRODUCT_STATUSES.map((status) => [status, 0])),
  normal: {
    PUBLISHED: 18,
    APPROVED: 2,
    PENDING_REVIEW: 4,
    DRAFT: 3,
    REJECTED: 1,
    HIDDEN: 1,
    ARCHIVED: 1,
  },
  highVolume: {
    PUBLISHED: 987654321,
    APPROVED: 123456,
    PENDING_REVIEW: 98765,
    DRAFT: 43210,
    REJECTED: 8765,
    HIDDEN: 321,
    ARCHIVED: 123,
  },
}

describe('Company dashboard product status scenarios', () => {
  it('renders an honest zero total for a new company', () => {
    const segments = buildProductSegments(scenarios.empty)
    expect(sumProductStatusCounts(segments)).toBe(0)
    expect(buildProductLegendItems(segments)).toEqual([])
  })

  it('reconciles a normal product catalogue across all lifecycle states', () => {
    const segments = buildProductSegments(scenarios.normal)
    expect(sumProductStatusCounts(segments)).toBe(30)
    expect(buildProductLegendItems(segments).reduce((sum, item) => sum + item.value, 0)).toBe(30)
    expect(segments.find((item) => item.label === 'پنهان').color).toBe('var(--ds-status-muted-fg)')
    expect(segments.find((item) => item.label === 'بایگانی').color).toBe('var(--ds-status-danger-fg)')
  })

  it('keeps high-volume counts numeric and identifies the dominant segment', () => {
    const segments = buildProductSegments(scenarios.highVolume)
    const total = sumProductStatusCounts(segments)
    const legend = buildProductLegendItems(segments)
    expect(total).toBe(987654321 + 123456 + 98765 + 43210 + 8765 + 321 + 123)
    expect(legend[0].percent).toBeGreaterThan(90)
    expect(legend[0].value.toLocaleString('fa-IR')).toContain('۹')
  })

  it('does not draw a partial chart when any server status count is missing', () => {
    const incomplete = { ...scenarios.normal, ARCHIVED: null }
    expect(buildProductSegments(incomplete)).toEqual([])
  })
})
