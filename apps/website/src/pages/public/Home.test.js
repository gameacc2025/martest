import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const homePath = [
  resolve(process.cwd(), 'apps/website/src/pages/public/Home.vue'),
  resolve(process.cwd(), 'src/pages/public/Home.vue'),
].find(existsSync)

if (!homePath) throw new Error('Could not locate the Website homepage source file')
const source = readFileSync(homePath, 'utf8')

describe('Website homepage redesign contracts', () => {
  it('keeps the production API and category store as the source of page data', () => {
    expect(source).toContain('productsApi.list(params)')
    expect(source).toContain('productsApi.list({ ...params, limit: 8, featured: true })')
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
    expect(source).toContain('type="button" class="category-card"')
    expect(source).toContain('<router-link v-for="product in featuredProducts"')
    expect(source).toContain('class="product-card"')
    expect(source).toContain('.product-card:focus-visible')
  })


  it('uses a static search-first hero with a compact branded identity', () => {
    expect(source).toContain('class="hero-eyebrow"')
    expect(source).toContain('role="search"')
    expect(source).toContain('name="homepage-search"')
    expect(source).toContain('autocomplete="off"')
    expect(source).not.toContain('hero-play-toggle')
    expect(source).not.toContain('setInterval(')
  })

  it('shows supplier trust and explicit inquiry pricing when no price tier exists', () => {
    expect(source).toContain('company?.isVerified')
    expect(source).toContain('استعلام از تأمین‌کننده')
    expect(source).toContain('class="product-card-cta"')
    expect(source).toContain('class="product-sku"')
  })

  it('does not publish unsupported hard-coded marketplace statistics or claims', () => {
    expect(source).not.toContain('const stats =')
    expect(source).not.toContain('+250')
    expect(source).not.toContain('+1,500')
    expect(source).not.toContain('+5,000')
    expect(source).not.toContain('بیش از ۲۵۰ تأمین‌کننده')
    expect(source).toContain('ثبت درخواست برای دریافت پیشنهاد تأمین‌کنندگان')
    expect(source).toContain('class="feature-icon"')
  })

  it('uses the shared design system for the redesigned page', () => {
    expect(source).toContain('class="home-page ds-page"')
    expect(source).toContain('class="home-container ds-container ds-stack"')
    expect(source).toContain('class="section-block ds-card"')
    expect(source).toContain('var(--ds-color-background)')
  })
})
