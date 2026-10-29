import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, shallowMount } from '@vue/test-utils'
import { reactive } from 'vue'

const { routerPush, getProducts, getCategories, routeState } = vi.hoisted(() => ({
  routerPush: vi.fn(),
  getProducts: vi.fn(),
  getCategories: vi.fn(),
  routeState: { current: null },
}))

vi.mock('vue-router', () => ({
  useRoute: () => routeState.current,
  useRouter: () => ({ push: routerPush }),
}))

vi.mock('../../stores/products', () => ({
  useProductsStore: () => ({ getProducts, getCategories }),
}))

import ProductListing from './ProductListing.vue'

describe('Website Product Listing', () => {
  let wrapper

  beforeEach(() => {
    vi.clearAllMocks()
    routeState.current = reactive({ query: { category: '7' } })
    getCategories.mockResolvedValue([{ id: 7, nameFa: 'فیبر نوری' }])
    getProducts.mockResolvedValue({
      data: [{
        id: 42,
        title: 'مودم فیبر نوری',
        company: { name: 'تأمین‌کننده آزمایشی' },
        prices: [{ price: 1200000 }],
        images: [{ isPrimary: true, url: '/product-42.png' }],
      }],
      meta: { page: 1, limit: 12, total: 1, totalPages: 1 },
    })
  })

  afterEach(() => {
    wrapper?.unmount()
    wrapper = undefined
  })

  it('preserves the initial category query and API/store parameter contract', async () => {
    wrapper = shallowMount(ProductListing)
    await flushPromises()

    expect(getCategories).toHaveBeenCalledOnce()
    expect(getProducts).toHaveBeenCalledWith({
      page: 1,
      limit: 12,
      status: 'PUBLISHED',
      categoryId: 7,
    })
    expect(wrapper.find('.product-card').exists()).toBe(true)
    expect(wrapper.find('#products-page-title').text()).toBe('محصولات')
  })

  it('navigates to the existing product-details route on keyboard activation', async () => {
    wrapper = shallowMount(ProductListing)
    await flushPromises()

    await wrapper.find('.product-card').trigger('keydown.enter')

    expect(routerPush).toHaveBeenCalledWith({
      name: 'product-details',
      params: { id: 42 },
    })
  })

  it('announces product loading errors accessibly', async () => {
    getProducts.mockRejectedValueOnce(new Error('offline'))
    wrapper = shallowMount(ProductListing)
    await flushPromises()

    expect(wrapper.find('[role="alert"]').exists()).toBe(true)
    expect(wrapper.find('[role="alert"]').text()).toContain('خطا در دریافت محصولات')
  })

  it('shows the empty state when the live API returns no products', async () => {
    getProducts.mockResolvedValueOnce({
      data: [],
      meta: { page: 1, limit: 12, total: 0, totalPages: 0 },
    })
    wrapper = shallowMount(ProductListing)
    await flushPromises()

    expect(wrapper.find('[role="status"]').text()).toContain('هیچ محصولی یافت نشد')
  })

  it('keeps route-query category changes connected to product loading', async () => {
    wrapper = shallowMount(ProductListing)
    await flushPromises()
    getProducts.mockClear()

    routeState.current.query.category = '9'
    await flushPromises()

    expect(getProducts).toHaveBeenCalledWith({
      page: 1,
      limit: 12,
      status: 'PUBLISHED',
      categoryId: 9,
    })
  })
})
