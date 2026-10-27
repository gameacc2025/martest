export function buildPriceHistoryPoints(records, now = new Date()) {
  const cutoff = new Date(now)
  cutoff.setMonth(cutoff.getMonth() - 6)

  const entries = (Array.isArray(records) ? records : [])
    .map((record, index) => {
      const date = new Date(record?.recordedAt)
      return {
        key: record?.id ?? index,
        date,
        price: Number(record?.price),
        minQuantity: record?.minQuantity,
        action: record?.action,
      }
    })
    .filter((point) => Number.isFinite(point.price)
      && point.price >= 0
      && !Number.isNaN(point.date.getTime())
      && point.date >= cutoff
      && point.date <= now)
    .sort((a, b) => a.date - b.date)

  const maxPrice = Math.max(...entries.map((point) => point.price), 0)
  return entries.map((point) => ({
    ...point,
    label: point.date.toLocaleDateString('fa-IR', { month: 'short', year: 'numeric' }),
    width: maxPrice > 0 ? Math.max(3, point.price / maxPrice * 100) : 0,
  }))
}
