import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { reactive } from 'vue'

const { getProducts, getCategories, routeState } = vi.hoisted(() => ({
  getProducts: vi.fn(),
  getCategories: vi.fn(),
  addItem: vi.fn(),
  routeState: { current: null },
}))
vi.mock('vue-router', () => ({ useRoute: () => routeState.current }))
vi.mock('../../stores/products', () => ({ useProductsStore: () => ({ getProducts, getCategories }) }))
vi.mock('../../stores/cart', () => ({ useCartStore: () => ({ addItem }) }))
import ProductListing from './ProductListing.vue'

const productFixture = (overrides = {}) => ({
  id: 42, title: 'مودم فیبر نوری', brand: 'FiberPro', model: 'XG-1200', sku: 'FP-XG1200',
  retailEnabled: true, finalPrice: 1200000, company: { name: 'تأمین‌کننده آزمایشی', isVerified: true },
  prices: [{ price: 1200000 }], images: [{ isPrimary: true, url: '/product-42.png' }],
  category: { id: 7, nameFa: 'فیبر نوری' }, categoryId: 7, ...overrides,
})
const mountListing = () => mount(ProductListing, { global: { stubs: {
  RouterLink: { props: ['to'], template: '<a :data-route="to.name" :data-product-id="to.params?.id" :data-category="to.query?.category"><slot /></a>' },
} } })

describe('Website Product Listing — Telecom Market.html reference', () => {
  let wrapper
  beforeEach(() => {
    vi.clearAllMocks()
    addItem.mockReturnValue(true)
    routeState.current = reactive({ name: 'products', query: { category: '7' } })
    getCategories.mockResolvedValue([{ id: 7, nameFa: 'فیبر نوری', productCount: 12 }])
    getProducts.mockResolvedValue({ data: [productFixture()], meta: { page: 1, limit: 24, total: 1, totalPages: 1 } })
  })
  afterEach(() => { wrapper?.unmount(); wrapper = undefined })

  it('loads published products with the route category and supported default ordering', async () => {
    wrapper = mountListing()
    await flushPromises()
    expect(getCategories).toHaveBeenCalledOnce()
    expect(getProducts).toHaveBeenCalledWith(expect.objectContaining({
      page: 1, limit: 24, status: 'PUBLISHED', categoryId: 7, sortBy: 'createdAt', sortOrder: 'desc',
    }))
    expect(wrapper.find('.prods').exists()).toBe(true)
    expect(wrapper.find('.bar').text()).toContain('۱ محصول')
    expect(wrapper.find('.ph h1').text()).toBe('همه محصولات')
  })

  it('renders the reference breadcrumb, filter sidebar and product-card markup', async () => {
    wrapper = mountListing()
    await flushPromises()
    expect(wrapper.find('.bc').text()).toContain('صفحه اصلی')
    expect(wrapper.find('.fl').exists()).toBe(true)
    expect(wrapper.find('.filter-select').exists()).toBe(true)
    expect(wrapper.find('.products-area .prods').exists()).toBe(true)
    expect(wrapper.find('.lay').exists()).toBe(true)
    expect(wrapper.find('.p .im').exists()).toBe(true)
  })

  it('applies the retail-only filter through the existing API query', async () => {
    routeState.current.query = { retail: '1' }
    wrapper = mountListing()
    await flushPromises()
    expect(getProducts).toHaveBeenCalledWith(expect.objectContaining({ retailEnabled: true }))
    expect(wrapper.find('.filter-select').element.value).toBe('retail')
  })

  it('links products to the existing product-details route', async () => {
    wrapper = mountListing()
    await flushPromises()
    const link = wrapper.find('.products-area .p .im')
    expect(link.attributes('data-route')).toBe('product-details')
    expect(link.attributes('data-product-id')).toBe('42')
  })

  it('adds a fixed-price product to the existing cart store', async () => {
    wrapper = mountListing()
    await flushPromises()
    await wrapper.get('.p .ac button').trigger('click')
    expect(addItem).toHaveBeenCalledWith(expect.objectContaining({ id: 42, price: 1200000 }))
    expect(wrapper.find('[role="status"]').text()).toContain('محصول به سبد خرید اضافه شد')
  })

  it('renders supplier verification, category, SKU and price from live product data', async () => {
    wrapper = mountListing()
    await flushPromises()
    expect(wrapper.find('.p .br').text()).toContain('FiberPro')
    expect(wrapper.find('.p .br').text()).toContain('تأییدشده')
    expect(wrapper.find('.p .sk').text()).toContain('FP-XG1200')
    expect(wrapper.find('.p .im em').text()).toContain('فیبر نوری')
    expect(wrapper.find('.p .pr').text()).toContain('ریال')
  })

  it('filters inquiry-only products without fabricating a price', async () => {
    getProducts.mockResolvedValueOnce({ data: [productFixture({ id: 43, retailEnabled: false, prices: [] })], meta: { total: 1, totalPages: 1 } })
    wrapper = mountListing()
    await flushPromises()
    expect(wrapper.find('.p .pr').text()).toContain('قیمت با استعلام')
  })

  it('announces catalogue loading errors accessibly', async () => {
    getProducts.mockRejectedValueOnce(new Error('offline'))
    wrapper = mountListing()
    await flushPromises()
    expect(wrapper.find('.empty-state').text()).toContain('دریافت محصولات ناموفق بود')
    expect(wrapper.find('.empty-state button').exists()).toBe(true)
  })

  it('shows an empty catalogue state', async () => {
    getProducts.mockResolvedValueOnce({ data: [], meta: { total: 0, totalPages: 0 } })
    wrapper = mountListing()
    await flushPromises()
    expect(wrapper.find('.empty-state').text()).toContain('محصولی یافت نشد')
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
