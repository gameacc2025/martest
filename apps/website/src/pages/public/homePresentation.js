import { formatPrice } from '../../utils/helpers'

function priceTiersOf(product) {
  if (Array.isArray(product?.prices)) return product.prices
  if (Array.isArray(product?.priceTiers)) return product.priceTiers
  return []
}

function isTierCurrent(tier, now = Date.now()) {
  const validFrom = tier?.validFrom ? new Date(tier.validFrom).getTime() : Number.NEGATIVE_INFINITY
  const validTo = tier?.validTo ? new Date(tier.validTo).getTime() : Number.POSITIVE_INFINITY
  return (!Number.isFinite(validFrom) || validFrom <= now)
    && (!Number.isFinite(validTo) || validTo >= now)
}

export function retailUnitPrice(product) {
  const directPrice = Number(product?.finalPrice ?? product?.price)
  if (Number.isFinite(directPrice) && directPrice > 0) return directPrice

  const retailTier = priceTiersOf(product).find((tier) => {
    const minQuantity = Number(tier?.minQuantity ?? tier?.minOrderQty ?? 1)
    const maxQuantity = tier?.maxQuantity == null ? Number.POSITIVE_INFINITY : Number(tier.maxQuantity)
    return minQuantity <= 1 && maxQuantity >= 1 && isTierCurrent(tier)
      && Number(tier?.price ?? tier?.unitPrice) > 0
  })
  const tierPrice = Number(retailTier?.price ?? retailTier?.unitPrice)
  return Number.isFinite(tierPrice) && tierPrice > 0 ? tierPrice : null
}

/**
 * The public Product projection returns prices, not priceTiers, and does not
 * synthesize finalPrice. Use the actual minQuantity=1 tier for retail.
 * A public price alone is not a buy-now promise unless retailEnabled is true.
 */
export function productSalesMode(product) {
  const tiers = priceTiersOf(product)
  const retailPrice = retailUnitPrice(product)
  if (product?.retailEnabled && retailPrice != null) {
    return { kind: 'fixed', label: 'قیمت خرده‌فروشی' }
  }
  if (tiers.length > 0) {
    return { kind: 'volume', label: 'قیمت پله‌ای' }
  }
  return { kind: 'inquiry', label: 'استعلامی' }
}

export function productPriceLabel(product) {
  const mode = productSalesMode(product)
  if (mode.kind === 'fixed') return formatPrice(retailUnitPrice(product))
  if (mode.kind === 'volume') {
    const firstTier = priceTiersOf(product)[0]
    const tierPrice = Number(firstTier?.unitPrice ?? firstTier?.price)
    return Number.isFinite(tierPrice) && tierPrice > 0 ? `از ${formatPrice(tierPrice)}` : 'قیمت پله‌ای'
  }
  return 'استعلامی'
}
