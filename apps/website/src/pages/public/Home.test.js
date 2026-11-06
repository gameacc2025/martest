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

describe('Website homepage — Telecom Market reference', () => {
  it('uses live product, category and campaign APIs rather than fabricated catalogue data', () => {
    expect(source).toContain("bannersApi.listActive('HOME_HERO')")
    expect(source).toContain('productsApi.list(params)')
    expect(source).toContain('productsApi.list({ ...params, featured: true })')
    expect(source).toContain('retailEnabled: true')
    expect(source).toContain('productsStore.getCategories()')
    expect(source).not.toContain('mockData')
    expect(source).not.toContain('const stats =')
  })

  it('matches the reference hero structure and supports both search modes', () => {
    expect(source).toContain('تجهیزات پروژه‌تان را')
    expect(source).toContain('سریع و مطمئن تأمین کنید')
    expect(source).toContain('خرید فوری')
    expect(source).toContain('خرید سازمانی / استعلام')
    expect(source).toContain('searchMode')
    expect(source).toContain('@submit.prevent="heroSearch"')
    expect(source).toContain('home-hero__featured')
  })

  it('renders live categories and products through the shared storefront widgets', () => {
    expect(source).toContain('StoreCategoryCard')
    expect(source).toContain('StoreProductCard')
    expect(source).toContain('home-category-track')
    expect(source).toContain('recentProducts.slice(0, 4)')
    expect(source).toContain('retailLatestProducts.slice(0, 4)')
    expect(source).toContain('categoryIcon(category)')
    expect(source).toContain('productRoute(product)')
  })

  it('uses the extracted reference benefit, offer, FAQ and catalog widgets', () => {
    expect(source).toContain('StoreBenefitGrid')
    expect(source).toContain('StoreOfferBanner')
    expect(source).toContain('StoreFaqList')
    expect(source).toContain('StoreCatalogRequest')
    expect(source).toContain('disabled-reason')
  })

  it('keeps the best-seller shelf honest until real order data exists', () => {
    expect(source).toContain('پرفروش‌ترین محصولات خرده‌فروشی')
    expect(source).toContain('دادهٔ واقعی سفارش و فروش')
    expect(source).not.toContain('const bestSellingProducts')
  })

  it('uses the reference design tokens and responsive layouts', () => {
    expect(source).toContain('--tm-canvas:#f4f5fa')
    expect(source).toContain('linear-gradient(135deg,#0a2540,#126b8a)')
    expect(source).toContain('grid-template-columns:repeat(4,minmax(0,1fr))')
    expect(source).toContain('@media(max-width:900px)')
    expect(source).toContain('prefers-reduced-motion:reduce')
  })

  it('keeps inquiry pricing and product presentation based on actual product fields', () => {
    expect(source).toContain('productSalesMode(product)')
    expect(source).toContain('productPriceLabel(product)')
    expect(source).toContain('company?.isVerified')
    expect(source).toContain("name: 'my-inquiries'")
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
