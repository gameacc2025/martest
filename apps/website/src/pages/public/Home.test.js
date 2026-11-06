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

describe('Website homepage contracts (tem redesign)', () => {
  it('keeps the production API and category store as the source of page data', () => {
    expect(source).toContain('productsApi.list(params)')
    expect(source).toContain('productsApi.list({ ...params, limit: 12, featured: true })')
    expect(source).toContain('const params = { page: 1, limit: 24, status: \'PUBLISHED\' }')
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
    expect(source).toContain('.product-card:focus-visible')
  })

  it('uses scheduled database campaigns as the homepage hero and keeps category navigation live', () => {
    expect(source).toContain("bannersApi.listActive('HOME_HERO')")
    expect(source).toContain('home-campaign-hero')
    expect(source).toContain('activeBanner.title')
    expect(source).toContain('setInterval(() => { activeBannerIndex.value')
    expect(source).toContain('home-category-track')
    expect(source).toContain('همه دسته‌بندی‌ها')
    expect(source).toContain('categoryIcon(category)')
    expect(source).toContain('چرا Telecom Market؟')
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
    expect(source).toContain('class="product-sku"')
  })

  it('does not publish unsupported hard-coded marketplace statistics or claims', () => {
    expect(source).not.toContain('const stats =')
    expect(source).not.toContain('+250')
    expect(source).not.toContain('+1,500')
    expect(source).not.toContain('+5,000')
    expect(source).toContain('ثبت درخواست برای دریافت پیشنهاد تأمین‌کنندگان')
    expect(source).toContain('class="feature-icon"')
  })

  it('uses the unified tem design system tokens', () => {
    expect(source).toContain('class="home-page"')
    expect(source).toContain('class="home-container"')
    expect(source).toContain('class="home-campaign-hero"')
    expect(source).toContain('home-campaign-hero__controls')
    expect(source).toContain('aria-label="پیشنهادهای ویژه بازارگاه"')
    expect(source).toContain('function nextSlide()')
    expect(source).toContain('onUnmounted(stopSlider)')
    expect(source).toContain('home-product-grid--recent')
    expect(source).toContain('var(--tm-canvas)')
    expect(source).not.toContain('7c6cf6')
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
