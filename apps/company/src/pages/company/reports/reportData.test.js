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
    const fetchPage = vi.fn(async () => page([{ id: 1 }], 1, 3))
    await expect(fetchAllPages(fetchPage, 2)).rejects.toThrow('دریافت گزارش کامل نشد')
  })

  it('rejects page sizes above the backend cap', async () => {
    await expect(fetchAllPages(async () => page([], 1, 0), 500)).rejects.toThrow(RangeError)
  })
})
