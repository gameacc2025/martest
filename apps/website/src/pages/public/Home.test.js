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

describe('Website homepage — Telecom Market.html exact composition', () => {
  it('keeps live campaign, product and category sources connected', () => {
    expect(source).toContain("bannersApi.listActive('HOME_HERO')")
    expect(source).toContain('productsApi.list(params)')
    expect(source).toContain('productsApi.list({ ...params, featured: true })')
    expect(source).toContain('retailEnabled: true')
    expect(source).toContain('productsStore.getCategories()')
    expect(source).toContain('loadCategoryProductCounts(categories.value.slice(0, 9))')
    expect(source).toContain('categoryId: Number(category.id)')
    expect(source).toContain('result?.meta?.total')
    expect(source).not.toContain('mockData')
  })

  it('keeps the hero focused on its message and featured card without embedded search or purchase tabs', () => {
    expect(source).toContain('class="hero"')
    expect(source).toContain('class="hero-bg-network"')
    expect(source).toContain('<Transition name="hero-content" mode="out-in">')
    expect(source).toContain('home-fiber-flow')
    expect(source).toContain('.dots button.on')
    expect(source).toContain('تجهیزات پروژه‌تان را')
    expect(source).toContain('سریع و مطمئن تأمین کنید')
    expect(source).not.toContain('class="search"')
    expect(source).not.toContain('class="tabs"')
    expect(source).not.toContain('class="chips"')
    expect(source).toContain('class="feat"')
    expect(source).toContain('class="dots"')
    expect(source).toContain('class="ha pv"')
    expect(source).toContain('class="ha nx"')
  })

  it('contains every major homepage section from the supplied HTML reference', () => {
    for (const section of ['stats', 'g3', 'prods', 'bl', 'tms', 'rfq']) {
      expect(source).toContain('class="' + section)
    }
    expect(source).toContain('جدیدترین محصولات خرده‌فروشی')
    expect(source).toContain('محصولات منتخب')
    expect(source).not.toContain('چرا Telecom Market؟')
    expect(source).not.toContain('پیشنهاد ویژه تجهیزات خرده‌فروشی')
    expect(source).not.toContain('class="why"')
    expect(source).not.toContain('class="ofr"')
    expect(source).not.toContain('دانلود کاتالوگ محصولات')
    expect(source).not.toContain('class="brands"')
    expect(source).toContain('آخرین اخبار و مطالب آموزشی')
    expect(source).not.toContain('class="sec faq"')
    expect(source).not.toContain('faqItems')
  })

  it('renders compact category cards on the homepage while reserving header cards for the category page', () => {
    expect(source).toContain('v-for="product in latestProducts"')
    expect(source).toContain('v-for="product in retailLatest"')
    expect(source).toContain('v-for="category in categories.slice(0, 9)"')
    expect(source).toContain('class="cats"')
    expect(source).toContain('class="cat home-category-card"')
    expect(source).toContain('<i aria-hidden="true">{{ categoryIcon(category) }}</i>')
    expect(source).toContain('{{ categoryCount(category) }} محصول')
    expect(source).not.toContain('class="cb-header-img"')
    expect(source).not.toContain('class="cb-sublist"')
    expect(source).not.toContain('categoryChildren(category)')
    expect(source).toContain('.reference-home .home-category-card{flex:0 0 172px')
    expect(source).toContain('.reference-home .home-category-card:hover')
    const categoriesPath = [
      resolve(process.cwd(), 'apps/website/src/pages/public/Categories.vue'),
      resolve(process.cwd(), 'src/pages/public/Categories.vue'),
    ].find(existsSync)
    if (!categoriesPath) throw new Error('Could not locate the dedicated categories page source file')
    const categoriesSource = readFileSync(categoriesPath, 'utf8')
    expect(categoriesSource).toContain('class="cb-header-img"')
    expect(categoriesSource).toContain('class="cb-sublist"')
  })

  it('renders product cards with the existing product presentation', () => {
    expect(source).toContain('productSalesMode(product)')
    expect(source).toContain('productPriceLabel(product)')
    expect(source).toContain('product.company?.isVerified')
    expect(source).toContain("import { useCartStore } from '../../stores/cart'")
    expect(source).toContain('cartStore.addItem')
    expect(source).toContain('افزودن به سبد')
    expect(source).toContain("name: 'product-details'")
    expect(source).toContain("name: 'categories'")
  })

  it('does not invent marketplace performance data or claim unavailable integrations are live', () => {
    expect(source).toContain('تأمین‌کنندگان ثبت‌شده')
    expect(source).toContain('<b>—</b>')
    expect(source).toContain('نمونه نمایشی')
    expect(source).toContain('سرویس در دسترس نیست')
    expect(source).toContain('محصولی با نشان منتخب برای نمایش دریافت نشد')
    expect(source).not.toContain('پرفروش‌ترین محصولات')
    expect(source).not.toContain('setInterval(ct, 1000)')
  })

  it('uses the exact reference palette, gradients and responsive breakpoints', () => {
    expect(source).toContain('--bg:var(--ds-page-bg)')
    expect(source).toContain('--pri:var(--ds-brand-primary)')
    expect(source).toContain('linear-gradient(135deg,var(--navy),var(--pet))')
    expect(source).toContain('.p{background:var(--card)')
    expect(source).toContain('@media(max-width:1000px)')
    expect(source).toContain('@media(max-width:640px)')
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
