import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { reactive } from 'vue'

const {
  routerPush,
  searchProducts,
  getCategories,
  addToCart,
  addToWishlist,
  routeState,
} = vi.hoisted(() => ({
  routerPush: vi.fn(),
  searchProducts: vi.fn(),
  getCategories: vi.fn(),
  addToCart: vi.fn(),
  addToWishlist: vi.fn(),
  routeState: { current: null },
}))

vi.mock('vue-router', () => ({
  useRoute: () => routeState.current,
  useRouter: () => ({ push: routerPush }),
}))

vi.mock('../../stores/products', () => ({
  useProductsStore: () => ({ searchProducts, getCategories }),
}))

vi.mock('../../stores/cart', () => ({
  useCartStore: () => ({ addToCart }),
}))

vi.mock('../../stores/wishlist', () => ({
  useWishlistStore: () => ({ addToWishlist }),
}))

import SearchResults from './SearchResults.vue'

const productFixture = () => ({
  id: 42,
  title: 'مودم فیبر نوری',
  prices: [{ price: 1250000 }],
  images: [
    { isPrimary: false, url: '/alternate.png' },
    { isPrimary: true, url: '/primary.png' },
  ],
  specifications: { standard: { ports: 4 } },
})

const mountSearchResults = () => mount(SearchResults, {
  global: {
    stubs: {
      InputText: {
        props: ['modelValue', 'placeholder', 'id'],
        emits: ['update:modelValue'],
        template: '<input :id="id" :value="modelValue" :placeholder="placeholder" @input="$emit(&quot;update:modelValue&quot;, $event.target.value)" />',
      },
      Button: {
        props: ['label', 'type', 'icon', 'ariaExpanded'],
        emits: ['click'],
        template: '<button type="button" @click="$emit(&quot;click&quot;)">{{ label }}</button>',
      },
      Card: {
        template: '<article class="card-stub"><header><slot name="title" /></header><div><slot name="content" /></div></article>',
      },
      Tree: { template: '<div class="tree-stub" />' },
      Slider: { template: '<div class="slider-stub" />' },
      Select: { template: '<div class="select-stub" />' },
      ProgressSpinner: { template: '<span class="spinner-stub" />' },
      Paginator: { template: '<nav class="paginator-stub" />' },
      ProductCard: {
        props: ['product'],
        emits: ['view-product', 'add-to-cart', 'toggle-wishlist'],
        template: '<article class="product-card"><h3>{{ product.name }}</h3><button type="button" @click="$emit(&quot;view-product&quot;, product)">مشاهده محصول</button></article>',
      },
    },
  },
})

describe('Website Search Results', () => {
  let wrapper

  beforeEach(() => {
    vi.clearAllMocks()
    routeState.current = reactive({ query: { q: 'فیبر نوری' } })
    getCategories.mockResolvedValue([{ id: 7, parentId: null, name: 'تجهیزات شبکه' }])
    searchProducts.mockResolvedValue({
      data: [productFixture()],
      meta: { page: 1, limit: 12, total: 1, totalPages: 1 },
    })
  })

  afterEach(() => {
    wrapper?.unmount()
    wrapper = undefined
  })

  it('uses the route query and existing store API parameters, then renders normalized live results', async () => {
    wrapper = mountSearchResults()
    await flushPromises()

    expect(getCategories).toHaveBeenCalledOnce()
    expect(searchProducts).toHaveBeenCalledWith('فیبر نوری', {
      page: 1,
      limit: 12,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    })
    expect(wrapper.find('#search-results-title').text()).toContain('فیبر نوری')
    expect(wrapper.find('.product-card h3').text()).toBe('مودم فیبر نوری')
    expect(wrapper.find('.sr-results-count').text()).toContain('۱')
  })

  it('submits a new query through the existing search store and synchronizes the URL', async () => {
    wrapper = mountSearchResults()
    await flushPromises()
    searchProducts.mockClear()

    await wrapper.find('#product-search-query').setValue('روتر')
    await wrapper.find('form[role="search"]').trigger('submit')
    await flushPromises()

    expect(searchProducts).toHaveBeenCalledWith('روتر', {
      page: 1,
      limit: 12,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    })
    expect(routerPush).toHaveBeenCalledWith({ query: { q: 'روتر' } })
    expect(wrapper.find('#search-results-title').text()).toContain('روتر')
  })

  it('shows an explicit empty state when the API returns no products', async () => {
    searchProducts.mockResolvedValueOnce({ data: [], meta: { total: 0 } })
    wrapper = mountSearchResults()
    await flushPromises()

    expect(wrapper.find('[role="status"]').text()).toContain('محصولی پیدا نشد')
    expect(wrapper.find('.product-card').exists()).toBe(false)
  })

  it('announces API failures and provides a retry action', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    searchProducts.mockRejectedValueOnce(new Error('offline'))
    wrapper = mountSearchResults()
    await flushPromises()

    expect(wrapper.find('[role="alert"]').text()).toContain('دریافت نتایج ناموفق بود')
    expect(wrapper.find('[role="alert"]').text()).toContain('اتصال به سرویس جستجو')
    expect(wrapper.find('.product-card').exists()).toBe(false)

    searchProducts.mockResolvedValueOnce({ data: [productFixture()], meta: { total: 1 } })
    await wrapper.find('[role="alert"] button').trigger('click')
    await flushPromises()

    expect(wrapper.find('.product-card').exists()).toBe(true)
    consoleError.mockRestore()
  })

  it('navigates to the existing product-details route from a result card', async () => {
    wrapper = mountSearchResults()
    await flushPromises()

    await wrapper.find('.product-card button').trigger('click')

    expect(routerPush).toHaveBeenCalledWith({
      name: 'product-details',
      params: { id: 42 },
    })
  })

  it('reacts to route query changes without replacing the search API contract', async () => {
    wrapper = mountSearchResults()
    await flushPromises()
    searchProducts.mockClear()

    routeState.current.query.q = 'سوئیچ شبکه'
    await flushPromises()

    expect(searchProducts).toHaveBeenCalledWith('سوئیچ شبکه', {
      page: 1,
      limit: 12,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    })
    expect(wrapper.find('#product-search-query').element.value).toBe('سوئیچ شبکه')
  })
})
