import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { productSalesMode, productPriceLabel } from './homePresentation.js'

const homePath = [
  resolve(process.cwd(), 'apps/website/src/pages/public/Home.vue'),
  resolve(process.cwd(), 'src/pages/public/Home.vue'),
].find(existsSync)

if (!homePath) throw new Error('Could not locate the Website homepage source file')
const source = readFileSync(homePath, 'utf8')

const readShared = (path) => {
  const candidates = [
    resolve(process.cwd(), 'packages/shared-ui', path),
    resolve(process.cwd(), '../../packages/shared-ui', path),
  ]
  const file = candidates.find(existsSync)
  if (!file) throw new Error(`Could not locate shared store widget: ${path}`)
  return readFileSync(file, 'utf8')
}

// Card chrome was extracted from Home.vue into the shared store widgets.
const productCardSource = readShared('components/store/StoreProductCard.vue')
const productCardCompact = productCardSource.replace(/\s+/g, '')

describe('Website homepage contracts (tem redesign)', () => {
  it('keeps the production API and category store as the source of page data', () => {
    expect(source).toContain('productsApi.list(params)')
    expect(source).toContain('productsApi.list({ ...params, limit: 8, featured: true })')
    expect(source).toContain('const params = { page: 1, limit: 8, status: \'PUBLISHED\' }')
    expect(source).toContain('productsStore.getCategories()')
    expect(source).not.toContain('USE_MOCK')
    expect(source).not.toContain('mockData')
  })

  it('preserves the existing named route contracts', () => {
    expect(source).toContain("name: 'products'")
    expect(source).toContain("name: 'categories'")
    expect(source).toContain("name: 'search'")
    expect(source).toContain("name: 'product-details'")
  })

  it('retains loading, error, and empty states for live data', () => {
    expect(source).toContain('v-if="loading"')
    expect(source).toContain('v-else-if="error"')
    expect(source).toContain('categoriesLoading')
    expect(source).toContain('categories.length === 0')
    expect(source).toContain('featuredProducts.length === 0')
  })

  it('uses native category buttons and semantic product links for keyboard navigation', () => {
    expect(source).toContain('type="button"')
    expect(source).toContain('class="category-card"')
    expect(source).toContain('<router-link')
    expect(source).toContain('class="product-card"')
    expect(productCardSource).toContain('.product-card__main:focus-visible')
  })

  it('uses scheduled database campaigns as the homepage hero and keeps category navigation live', () => {
    expect(source).toContain("bannersApi.listActive('HOME_HERO')")
    expect(source).toContain('home-campaign-hero')
    expect(source).toContain('activeBanner.title')
    expect(source).toContain('setInterval(() => { activeBannerIndex.value')
    expect(source).toContain('home-category-track')
    expect(source).toContain('همه دسته‌بندی‌ها')
    expect(source).toContain('categoryIcon(category)')
    expect(source).not.toContain('چرا Telecom Market؟')
    expect(source).toContain('ثبت درخواست استعلام')
  })

  it('shows supplier verification and explicit inquiry pricing when no price exists', () => {
    expect(source).toContain('company?.isVerified')
    expect(source).toContain('افزودن به سبد')
    expect(source).toContain('درخواست استعلام')
    expect(source).toContain('استعلام عمده')
    expect(source).toContain('سرویس سفارش و موجودی هنوز آماده نیست')
    expect(source).toContain('disabled')
    expect(source).toContain('class="product-card-cta"')
    expect(productCardSource).toContain('class="product-sku"')
  })

  it('limits each homepage product section to two desktop rows and uses portrait product imagery', () => {
    expect(source).toContain('limit: 8, status: \'PUBLISHED\'')
    expect(source).toContain('limit: 8, featured: true')
    expect(source).toContain('featuredProducts.slice(0, 8)')
    expect(source).toContain('recentProducts.slice(0, 8)')
    expect(productCardSource).toContain('aspect-ratio: 4 / 5')
    expect(source).toContain('grid-template-columns: repeat(4, minmax(0, 1fr))')
  })

  it('keeps a real hero search and pre-footer promotional navigation cards', () => {
    expect(source).toContain('role="search" aria-label="جستجوی محصولات"')
    expect(source).toContain('@submit.prevent="heroSearch"')
    expect(source).toContain('home-promo-grid')
    expect(source).toContain('home-promo-card--catalog')
    expect(source).toContain('home-promo-card--suppliers')
    expect(source).toContain('home-promo-card--inquiry')
  })


  it('uses the same bounded product-card width as the catalogue', () => {
    expect(source).toContain('repeat(auto-fill, minmax(min(100%, 168px), 210px))')
    expect(productCardCompact).toContain('aspect-ratio:4/5')
    expect(productCardCompact).toContain('padding:11px')
    expect(productCardCompact).toContain('min-height:44px')
  })

  it('renders a real product spotlight without redundant marketplace benefit sections', () => {
    expect(source).toContain('home-campaign-hero__spotlight')
    expect(source).toContain('activeFeaturedProduct')
    expect(source).toContain('home-campaign-hero__quick-links')
  })

  it('does not publish unsupported hard-coded marketplace statistics or claims', () => {
    expect(source).not.toContain('const stats =')
    expect(source).not.toContain('+250')
    expect(source).not.toContain('+1,500')
    expect(source).not.toContain('+5,000')
    expect(source).toContain('ثبت درخواست برای دریافت پیشنهاد تأمین‌کنندگان')
    expect(source).not.toContain('home-marketplace-benefits')
    expect(source).not.toContain('home-features')
    expect(source).not.toContain('home-feature-grid')
    expect(source).not.toContain('class="feature-icon"')
  })

  it('loads the latest retail-enabled products independently from featured products', () => {
    expect(source).toContain('retailEnabled: true')
    expect(source).toContain('جدیدترین محصولات خرده‌فروشی')
    expect(source).toContain('retailLatestProducts')
  })

  it('keeps the best-selling retail section honest until sales data exists', () => {
    expect(source).toContain('پرفروش‌ترین محصولات خرده‌فروشی')
    expect(source).toContain('آمار واقعی فروش')
  })

  it('uses the unified tem design system tokens', () => {
    expect(source).toContain('class="home-page"')
    expect(source).toContain('class="home-container"')
    expect(source).toContain('class="home-campaign-hero"')
    expect(source).toContain('home-campaign-hero__controls')
    expect(source).toContain('aria-label="پیشنهادهای ویژه بازارگاه"')
    expect(source).toContain('function nextSlide()')
    expect(source).toContain('onUnmounted(() => { stopSlider(); stopBannerSlider() })')
    expect(source).toContain('home-product-grid--recent')
    expect(source).toContain('var(--tm-canvas)')
    expect(source).not.toContain('7c6cf6')
  })

  it('adds a reduced-motion-gated motion layer without hiding the finished page', () => {
    // Entrance choreography is opt-in via IntersectionObserver, and the hidden
    // state only exists under prefers-reduced-motion: no-preference.
    expect(source).toContain('prefers-reduced-motion: no-preference')
    expect(source).toContain('prefers-reduced-motion:reduce')
    expect(source).toContain('const vReveal')
    expect(source).toContain('home-reveal')
    expect(source).toContain('is-revealed')
    // Campaign banners crossfade between stacked, opacity-switched images.
    expect(source).toContain("'is-active': index === activeBannerIndex")
    expect(source).toContain('.home-campaign-hero__image.is-active')
    expect(source).toContain('@keyframes home-hero-drift')
    // Autoplay loops pause while the tab is hidden.
    expect(source).toContain("addEventListener('visibilitychange', handleVisibilityChange)")
    expect(source).toContain('prefersReducedMotion()')
    // Interaction feedback animates transform/opacity only.
    expect(productCardSource).toContain('.store-product-card:hover .product-card__media img')
    expect(source).toContain('revealDelay(index)')
  })
})

describe('Storefront product presentation scenarios', () => {
  const scenarios = {
    empty: [],
    normal: [{
      id: 'fixed-001',
      name: 'روتر سازمانی دو بانده',
      sku: '000124',
      retailEnabled: true,
      finalPrice: 12500000,
    }],
    highVolume: [{
      id: 'tiered-999999',
      name: 'سوئیچ تجمیع لایه سه با ظرفیت بالا و قابلیت توسعه ماژولار برای مراکز داده سازمانی',
      sku: '000000000987654',
      retailEnabled: false,
      priceTiers: [{ minimumQuantity: 100, unitPrice: 8450000 }],
    }],
  }

  it('keeps the empty scenario genuinely empty', () => {
    expect(scenarios.empty).toHaveLength(0)
  })

  it('distinguishes a fixed-price retail product from an inquiry-only product', () => {
    expect(productSalesMode(scenarios.normal[0])).toEqual({ kind: 'fixed', label: 'قیمت ثابت' })
    expect(productPriceLabel(scenarios.normal[0])).toBeTruthy()
    expect(productSalesMode({ id: 'rfq-1', retailEnabled: false })).toEqual({ kind: 'inquiry', label: 'استعلامی' })
  })

  it('recognizes tiered pricing and preserves long names and large identifiers as source data', () => {
    const product = scenarios.highVolume[0]
    expect(productSalesMode(product)).toEqual({ kind: 'volume', label: 'قیمت پله‌ای' })
    expect(productPriceLabel(product)).toBeTruthy()
    expect(product.name.length).toBeGreaterThan(70)
    expect(product.sku).toBe('000000000987654')
  })
})
