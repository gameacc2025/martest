import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, shallowMount } from '@vue/test-utils'
import { reactive } from 'vue'

const { getProducts, getCategories, routeState } = vi.hoisted(() => ({
  getProducts: vi.fn(),
  getCategories: vi.fn(),
  routeState: { current: null },
}))

vi.mock('vue-router', () => ({
  useRoute: () => routeState.current,
}))

vi.mock('../../stores/products', () => ({
  useProductsStore: () => ({ getProducts, getCategories }),
}))

import ProductListing from './ProductListing.vue'

describe('Website Product Listing', () => {
  let wrapper

  const mountListing = () => shallowMount(ProductListing, { global: { stubs: {
    WorkspacePageHeading: false,
    RouterLink: { props: ['to'], template: '<a class="product-card" :data-route="to.name" :data-product-id="to.params?.id"><slot /></a>' },
  } } })

  beforeEach(() => {
    vi.clearAllMocks()
    routeState.current = reactive({ query: { category: '7' } })
    getCategories.mockResolvedValue([{ id: 7, nameFa: 'فیبر نوری' }])
    getProducts.mockResolvedValue({
      data: [{
        id: 42,
        title: 'مودم فیبر نوری',
        brand: 'FiberPro',
        model: 'XG-1200',
        sku: 'FP-XG1200',
        company: { name: 'تأمین‌کننده آزمایشی', isVerified: true },
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
    wrapper = mountListing()
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

  it('links each product card to its existing product-details route', async () => {
    wrapper = mountListing()
    await flushPromises()

    const link = wrapper.find('.product-card')
    expect(link.attributes('data-route')).toBe('product-details')
    expect(link.attributes('data-product-id')).toBe('42')
  })

  it('renders product identity, supplier trust and a clear details action from API data', async () => {
    wrapper = mountListing()
    await flushPromises()

    expect(wrapper.find('.product-meta').text()).toContain('FiberPro')
    expect(wrapper.find('.product-meta').text()).toContain('XG-1200')
    expect(wrapper.find('.product-meta').text()).toContain('FP-XG1200')
    expect(wrapper.find('.product-verified').text()).toContain('تأمین‌کننده تأییدشده')
    expect(wrapper.find('.product-card-footer').text()).toContain('جزئیات محصول')
    expect(wrapper.find('.product-card-price').text()).toContain('شروع قیمت از')
  })

  it('clearly presents inquiry pricing when the API has no published price tier', async () => {
    getProducts.mockResolvedValueOnce({
      data: [{ id: 43, title: 'آنتن مخابراتی', company: { name: 'تأمین‌کننده' }, prices: [] }],
      meta: { page: 1, limit: 12, total: 1, totalPages: 1 },
    })
    wrapper = mountListing()
    await flushPromises()

    expect(wrapper.find('.product-card-price').text()).toContain('استعلام از تأمین‌کننده')
    expect(wrapper.find('.product-verified').exists()).toBe(false)
  })

  it('announces product loading errors accessibly', async () => {
    getProducts.mockRejectedValueOnce(new Error('offline'))
    wrapper = mountListing()
    await flushPromises()

    expect(wrapper.find('[role="alert"]').exists()).toBe(true)
    expect(wrapper.find('[role="alert"]').text()).toContain('خطا در دریافت محصولات')
  })

  it('shows the empty state when the live API returns no products', async () => {
    getProducts.mockResolvedValueOnce({
      data: [],
      meta: { page: 1, limit: 12, total: 0, totalPages: 0 },
    })
    wrapper = mountListing()
    await flushPromises()

    expect(wrapper.find('[role="status"]').text()).toContain('هیچ محصولی یافت نشد')
  })

  it('keeps route-query category changes connected to product loading', async () => {
    wrapper = mountListing()
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
