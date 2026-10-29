import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const source = readFileSync(fileURLToPath(new URL('./Home.vue', import.meta.url)), 'utf8')

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

  it('uses the shared design system for the redesigned page', () => {
    expect(source).toContain('class="home-page ds-page"')
    expect(source).toContain('class="home-container ds-container ds-stack"')
    expect(source).toContain('class="section-block ds-card"')
    expect(source).toContain('var(--ds-color-background)')
  })
})
