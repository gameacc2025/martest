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

  it('makes category and product tiles keyboard accessible', () => {
    expect(source).toContain('role="button" tabindex="0"')
    expect(source).toContain('@keydown.enter.prevent="viewCategoryProducts(category.id)"')
    expect(source).toContain('@keydown.enter.prevent="goToProduct(product)"')
    expect(source).toContain('.product-card:focus-visible')
  })


  it('provides a manual pause control and pauses while the hero is hovered or focused', () => {
    expect(source).toContain('class="hero-play-toggle"')
    expect(source).toContain(':aria-pressed="slideshowPaused"')
    expect(source).toContain('function toggleSlideshow()')
    expect(source).toContain('@mouseenter="onSlideshowEnter"')
    expect(source).toContain('@focusin="onSlideshowFocusIn"')
    expect(source).toContain("prefers-reduced-motion: reduce")
  })

  it('does not publish unsupported hard-coded marketplace statistics or claims', () => {
    expect(source).not.toContain('const stats =')
    expect(source).not.toContain('+250')
    expect(source).not.toContain('+1,500')
    expect(source).not.toContain('+5,000')
    expect(source).not.toContain('بیش از ۲۵۰ تأمین‌کننده')
    expect(source).toContain('ثبت درخواست برای دریافت پیشنهاد تأمین‌کنندگان')
  })

  it('uses the shared design system for the redesigned page', () => {
    expect(source).toContain('class="home-page ds-page"')
    expect(source).toContain('class="home-container ds-container ds-stack"')
    expect(source).toContain('class="section-block ds-card"')
    expect(source).toContain('var(--ds-color-background)')
  })
})
