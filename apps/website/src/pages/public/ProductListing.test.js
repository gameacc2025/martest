import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { reactive } from 'vue'

const { getProducts, getCategories, routeState } = vi.hoisted(() => ({
  getProducts: vi.fn(),
  getCategories: vi.fn(),
  routeState: { current: null },
}))

vi.mock('vue-router', () => ({ useRoute: () => routeState.current }))
vi.mock('../../stores/products', () => ({ useProductsStore: () => ({ getProducts, getCategories }) }))

import ProductListing from './ProductListing.vue'

describe('Website Product Listing — Telecom Market reference', () => {
  let wrapper
  const mountListing = () => mount(ProductListing, { global: { stubs: {
    RouterLink: { props: ['to'], template: '<a :data-route="to.name" :data-product-id="to.params?.id" :data-category="to.query?.category"><slot /></a>' },
    StoreFilterPanel: { template: '<aside class="filter-stub"><slot /></aside>' },
    Button: { props: ['label'], template: '<button><slot />{{ label }}</button>' },
    InputText: { template: '<input />' },
    InputNumber: { template: '<input />' },
    Select: { props: ['options', 'modelValue'], template: '<div class="select-stub" />' },
    ProgressSpinner: { template: '<span>loading</span>' },
    Paginator: { template: '<nav />' },
  } } })

  beforeEach(() => {
    vi.clearAllMocks()
    routeState.current = reactive({ name: 'products', query: { category: '7' } })
    getCategories.mockResolvedValue([{ id: 7, nameFa: 'فیبر نوری', productCount: 12 }])
    getProducts.mockResolvedValue({
      data: [{
        id: 42, title: 'مودم فیبر نوری', brand: 'FiberPro', model: 'XG-1200', sku: 'FP-XG1200',
        company: { name: 'تأمین‌کننده آزمایشی', isVerified: true },
        prices: [{ price: 1200000 }], images: [{ isPrimary: true, url: '/product-42.png' }],
      }],
      meta: { page: 1, limit: 24, total: 1, totalPages: 1 },
    })
  })

  afterEach(() => { wrapper?.unmount(); wrapper = undefined })

  it('loads published products with the route category and server-supported sort', async () => {
    wrapper = mountListing()
    await flushPromises()
    expect(getCategories).toHaveBeenCalledOnce()
    expect(getProducts).toHaveBeenCalledWith(expect.objectContaining({
      page: 1, limit: 24, status: 'PUBLISHED', categoryId: 7, sortBy: 'createdAt', sortOrder: 'desc',
    }))
    expect(wrapper.find('.reference-product-grid').exists()).toBe(true)
    expect(wrapper.find('.reference-products-toolbar').text()).toContain('۱ محصول')
    expect(wrapper.find('.reference-page-heading h1').text()).toBe('همه محصولات')
  })

  it('renders the reference breadcrumb, filter sidebar and three-column product grid', async () => {
    wrapper = mountListing()
    await flushPromises()
    expect(wrapper.find('.reference-breadcrumb').text()).toContain('صفحه اصلی')
    expect(wrapper.find('.filter-stub').exists()).toBe(true)
    expect(wrapper.find('.reference-search').exists()).toBe(true)
    expect(wrapper.find('.reference-category-choice').exists()).toBe(true)
    expect(wrapper.find('.reference-product-grid').exists()).toBe(true)
    expect(wrapper.find('.reference-catalog-layout').exists()).toBe(true)
  })

  it('applies the retail-only filter through the public API', async () => {
    routeState.current.query = { retail: '1' }
    wrapper = mountListing()
    await flushPromises()
    expect(getProducts).toHaveBeenCalledWith(expect.objectContaining({ retailEnabled: true }))
    expect(wrapper.find('.reference-filter-choice input').exists()).toBe(true)
  })

  it('links products to the existing product-details route', async () => {
    wrapper = mountListing()
    await flushPromises()
    const link = wrapper.find('.product-card__main')
    expect(link.attributes('data-route')).toBe('product-details')
    expect(link.attributes('data-product-id')).toBe('42')
  })

  it('renders supplier verification, metadata and inquiry/retail price from API data', async () => {
    wrapper = mountListing()
    await flushPromises()
    expect(wrapper.find('.product-card__brand').text()).toContain('FiberPro')
    expect(wrapper.find('.product-meta').text()).toContain('XG-1200')
    expect(wrapper.find('.product-meta').text()).toContain('FP-XG1200')
    expect(wrapper.find('.product-verified').text()).toContain('تأمین‌کننده تأییدشده')
    expect(wrapper.find('.product-card-price').text()).toContain('شروع قیمت از')
  })

  it('clearly labels products without a public price as inquiry-priced', async () => {
    getProducts.mockResolvedValueOnce({ data: [{ id: 43, title: 'آنتن مخابراتی', company: { name: 'تأمین‌کننده' }, prices: [] }], meta: { page: 1, limit: 24, total: 1, totalPages: 1 } })
    wrapper = mountListing()
    await flushPromises()
    expect(wrapper.find('.product-card-price').text()).toContain('استعلام قیمت')
  })

  it('announces catalogue loading errors accessibly', async () => {
    getProducts.mockRejectedValueOnce(new Error('offline'))
    wrapper = mountListing()
    await flushPromises()
    expect(wrapper.find('[role="alert"]').exists()).toBe(true)
    expect(wrapper.find('[role="alert"]').text()).toContain('خطا در دریافت محصولات')
  })

  it('shows an empty catalogue state', async () => {
    getProducts.mockResolvedValueOnce({ data: [], meta: { page: 1, limit: 24, total: 0, totalPages: 0 } })
    wrapper = mountListing()
    await flushPromises()
    expect(wrapper.find('.reference-state').text()).toContain('محصولی یافت نشد')
  })

  it('keeps route-query category changes connected to product loading', async () => {
    wrapper = mountListing()
    await flushPromises()
    getProducts.mockClear()
    routeState.current.query.category = '9'
    await flushPromises()
    expect(getProducts).toHaveBeenCalledWith(expect.objectContaining({ categoryId: 9, status: 'PUBLISHED' }))
  })
})
