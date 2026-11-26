import { describe, expect, it, vi } from 'vitest'
import { fetchAllPages } from './reportData.js'

function page(data, pageNumber, total, limit = 2) {
  return {
    data,
    meta: {
      total,
      page: pageNumber,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  }
}

describe('fetchAllPages', () => {
  it('fetches every page and returns all rows in API order', async () => {
    const fetchPage = vi.fn(async (pageNumber) => {
      if (pageNumber === 1) return page([{ id: 1 }, { id: 2 }], 1, 5)
      if (pageNumber === 2) return page([{ id: 3 }, { id: 4 }], 2, 5)
      return page([{ id: 5 }], 3, 5)
    })

    await expect(fetchAllPages(fetchPage, 2)).resolves.toEqual([
      { id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }, { id: 5 },
    ])
    expect(fetchPage).toHaveBeenNthCalledWith(1, 1, 2)
    expect(fetchPage).toHaveBeenNthCalledWith(2, 2, 2)
    expect(fetchPage).toHaveBeenNthCalledWith(3, 3, 2)
  })

  it('returns an empty report when the API reports zero records', async () => {
    const fetchPage = vi.fn(async () => page([], 1, 0))
    await expect(fetchAllPages(fetchPage, 2)).resolves.toEqual([])
    expect(fetchPage).toHaveBeenCalledTimes(1)
  })

  it('fails visibly when the result count changes during pagination', async () => {
    const fetchPage = vi.fn()
      .mockResolvedValueOnce(page([{ id: 1 }, { id: 2 }], 1, 4))
      .mockResolvedValueOnce(page([{ id: 3 }], 2, 3))

    await expect(fetchAllPages(fetchPage, 2)).rejects.toThrow('داده‌های گزارش هنگام دریافت تغییر کرده‌اند')
  })

  it('fails rather than silently returning a partial report', async () => {
    const fetchPage = vi.fn()
      .mockResolvedValueOnce(page([{ id: 1 }], 1, 3))
      .mockResolvedValueOnce(page([], 2, 3))
    await expect(fetchAllPages(fetchPage, 2)).rejects.toThrow('دریافت گزارش کامل نشد')
  })

  it('rejects duplicate product IDs even when page totals and row counts match', async () => {
    const fetchPage = vi.fn()
      .mockResolvedValueOnce(page([{ id: 1 }, { id: 2 }], 1, 4))
      .mockResolvedValueOnce(page([{ id: 2 }, { id: 4 }], 2, 4));

    await expect(fetchAllPages(fetchPage, 2)).rejects.toThrow('شناسه تکراری');
  });

  it('rejects report rows without a stable record ID', async () => {
    const fetchPage = vi.fn(async () => page([{ title: 'No ID' }], 1, 1));
    await expect(fetchAllPages(fetchPage, 2)).rejects.toThrow('شناسه معتبر ندارد');
  });

  it('loads a 10,000-row report across all 100 API pages without dropping or duplicating rows', async () => {
    const total = 10_000
    const limit = 100
    const fetchPage = vi.fn(async (pageNumber) => {
      const start = (pageNumber - 1) * limit
      const rows = Array.from({ length: Math.min(limit, total - start) }, (_, offset) => ({
        id: start + offset + 1,
      }))
      return page(rows, pageNumber, total, limit)
    })

    const result = await fetchAllPages(fetchPage, limit)

    expect(fetchPage).toHaveBeenCalledTimes(100)
    expect(result).toHaveLength(total)
    expect(result[0]).toEqual({ id: 1 })
    expect(result.at(-1)).toEqual({ id: total })
    expect(new Set(result.map(row => row.id)).size).toBe(total)
  })

  it('rejects page sizes above the backend cap', async () => {
    await expect(fetchAllPages(async () => page([], 1, 0), 500)).rejects.toThrow(RangeError)
  })
})
