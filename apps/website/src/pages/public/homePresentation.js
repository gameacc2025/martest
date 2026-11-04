import { formatPrice } from '../../utils/helpers'

/**
 * Resolve the presentation mode from fields actually supplied by the public
 * product projection. A price without retail eligibility is not a buy-now
 * promise; products without a public price stay inquiry-first.
 */
export function productSalesMode(product) {
  if (Array.isArray(product?.priceTiers) && product.priceTiers.length > 0) {
    return { kind: 'volume', label: 'قیمت پله‌ای' }
  }
  if (product?.retailEnabled && Number(product?.finalPrice ?? product?.price) > 0) {
    return { kind: 'fixed', label: 'قیمت ثابت' }
  }
  return { kind: 'inquiry', label: 'استعلامی' }
}

export function productPriceLabel(product) {
  const mode = productSalesMode(product)
  const fixedPrice = product?.finalPrice ?? product?.price
  if (mode.kind === 'fixed') return formatPrice(fixedPrice)
  if (mode.kind === 'volume') {
    const firstTier = product.priceTiers[0]
    const tierPrice = firstTier?.unitPrice ?? firstTier?.price
    return Number(tierPrice) > 0 ? `از ${formatPrice(tierPrice)}` : 'قیمت پله‌ای'
  }
  return 'استعلامی'
}
