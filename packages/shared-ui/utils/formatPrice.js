/**
 * Format price with currency
 * @param {number} price - Price value
 * @param {string} currency - Currency code (default: IRR)
 * @returns {string} Formatted price
 */
export function formatPrice(price, currency = 'IRR') {
  if (price === null || price === undefined || price === '') return '-'

  const num = Number(price)
  if (!Number.isFinite(num) || num < 0) return '-'

  return new Intl.NumberFormat('fa-IR', {
    style: 'currency',
    currency: currency
  }).format(num)
}