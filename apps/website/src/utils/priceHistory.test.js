import { describe, expect, it } from 'vitest'
import { buildPriceHistoryPoints } from './priceHistory'

describe('buildPriceHistoryPoints', () => {
  const now = new Date('2026-10-27T12:00:00.000Z')

  it('keeps only valid snapshots inside the trailing six-month window and sorts chronologically', () => {
    const points = buildPriceHistoryPoints([
      { id: 1, recordedAt: '2026-04-26T12:00:00.000Z', price: 10, minQuantity: 1 },
      { id: 2, recordedAt: '2026-04-27T12:00:00.000Z', price: 20, minQuantity: 1 },
      { id: 3, recordedAt: '2026-10-20T12:00:00.000Z', price: 40, minQuantity: 1 },
      { id: 4, recordedAt: '2026-10-28T12:00:00.000Z', price: 50, minQuantity: 1 },
      { id: 5, recordedAt: 'not-a-date', price: 60, minQuantity: 1 },
      { id: 6, recordedAt: '2026-10-10T12:00:00.000Z', price: 'invalid', minQuantity: 1 },
    ], now)

    expect(points.map((point) => point.key)).toEqual([2, 3])
    expect(points.map((point) => point.price)).toEqual([20, 40])
  })

  it('normalizes bar widths against the highest price and preserves quantity/action metadata', () => {
    const points = buildPriceHistoryPoints([
      { id: 11, recordedAt: '2026-08-01T00:00:00.000Z', price: 25, minQuantity: 1, action: 'CREATED' },
      { id: 12, recordedAt: '2026-09-01T00:00:00.000Z', price: 100, minQuantity: 1, action: 'UPDATED' },
    ], now)

    expect(points.map((point) => point.width)).toEqual([25, 100])
    expect(points[0]).toMatchObject({ key: 11, minQuantity: 1, action: 'CREATED' })
    expect(points[0].label).toBeTruthy()
  })

  it('returns an empty list for non-array input and handles zero prices safely', () => {
    expect(buildPriceHistoryPoints(null, now)).toEqual([])
    const points = buildPriceHistoryPoints([
      { id: 1, recordedAt: '2026-08-01T00:00:00.000Z', price: 0 },
    ], now)
    expect(points).toHaveLength(1)
    expect(points[0].width).toBe(0)
  })
})
