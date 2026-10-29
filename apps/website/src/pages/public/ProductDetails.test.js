import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, shallowMount } from '@vue/test-utils'
import { reactive } from 'vue'

const {
  routerPush,
  getProductById,
  apiGet,
  createInquiry,
  hasAnyPermission,
  authState,
  routeState,
} = vi.hoisted(() => ({
  routerPush: vi.fn(),
  getProductById: vi.fn(),
  apiGet: vi.fn(),
  createInquiry: vi.fn(),
  hasAnyPermission: vi.fn(),
  authState: { isAuthenticated: false },
  routeState: { current: null },
}))

vi.mock('vue-router', () => ({
  useRoute: () => routeState.current,
  useRouter: () => ({ push: routerPush }),
}))

vi.mock('../../stores/products', () => ({
  useProductsStore: () => ({ getProductById }),
}))

vi.mock('../../stores/auth', () => ({
  useAuthStore: () => ({
    get isAuthenticated() { return authState.isAuthenticated },
    hasAnyPermission,
  }),
}))

vi.mock('@telecom/shared-core/http/apiClient', () => ({
  apiGet,
}))

vi.mock('@telecom/api-client', () => ({
  inquiriesApi: { create: createInquiry },
}))

import ProductDetails from './ProductDetails.vue'

const productFixture = () => ({
  id: 42,
  title: 'روتر فیبر نوری',
  brand: 'نمونه',
  model: 'R-100',
  sku: 'R100',
  category: { nameFa: 'فیبر نوری' },
  images: [
    { id: 1, isPrimary: true, url: '/primary.png' },
    { id: 2, isPrimary: false, url: '/secondary.png' },
  ],
  prices: [
    { id: 1, price: 1200000, minQuantity: 1, label: 'تکی' },
    { id: 2, price: 1000000, minQuantity: 10, label: 'عمده' },
  ],
  company: { id: 9, name: 'شرکت نمونه' },
  specifications: {
    standard: { 'سرعت انتقال': '10Gbps' },
    attributes: [{ title: 'تعداد پورت', value: 4 }],
  },
  tags: ['شبکه'],
})

describe('Website Product Details', () => {
  let wrapper

  beforeEach(() => {
    vi.clearAllMocks()
    authState.isAuthenticated = false
    hasAnyPermission.mockReturnValue(false)
    routeState.current = reactive({ params: { id: '42' }, query: {} })
    getProductById.mockResolvedValue(productFixture())
    apiGet.mockResolvedValue({ data: [] })
    createInquiry.mockResolvedValue({ success: true })
  })

  afterEach(() => {
    wrapper?.unmount()
    wrapper = undefined
  })

  it('loads the product using the route id and renders real product details', async () => {
    wrapper = shallowMount(ProductDetails)
    await flushPromises()

    expect(getProductById).toHaveBeenCalledWith('42')
    expect(wrapper.find('h1.product-title').text()).toContain('روتر فیبر نوری')
    expect(wrapper.text()).toContain('شرکت نمونه')
    expect(wrapper.text()).toContain('مشخصات فنی')
    expect(wrapper.find('.main-image').attributes('src')).toBe('/primary.png')
  })

  it('announces a not-found state when the store returns no product', async () => {
    getProductById.mockResolvedValueOnce({})
    wrapper = shallowMount(ProductDetails)
    await flushPromises()

    expect(wrapper.find('[role="status"]').text()).toContain('محصول پیدا نشد')
  })

  it('announces API failures without replacing them with the not-found state', async () => {
    getProductById.mockRejectedValueOnce({ status: 404, message: 'محصول در دسترس نیست' })
    wrapper = shallowMount(ProductDetails)
    await flushPromises()

    expect(wrapper.find('[role="alert"]').text()).toContain('محصول در دسترس نیست')
    expect(wrapper.text()).not.toContain('محصول پیدا نشد')
  })

  it('reloads the product when the route id changes', async () => {
    wrapper = shallowMount(ProductDetails)
    await flushPromises()
    getProductById.mockClear()

    routeState.current.params.id = '43'
    await flushPromises()

    expect(getProductById).toHaveBeenCalledWith('43')
  })

  it('switches the gallery image using the existing thumbnail control', async () => {
    wrapper = shallowMount(ProductDetails)
    await flushPromises()

    await wrapper.findAll('.thumbnail-button')[1].trigger('click')

    expect(wrapper.find('.main-image').attributes('src')).toBe('/secondary.png')
    expect(wrapper.findAll('.thumbnail-button')[1].attributes('aria-pressed')).toBe('true')
  })

  it('shows the inquiry action only for an authenticated user with the required permission', async () => {
    wrapper = shallowMount(ProductDetails)
    await flushPromises()
    expect(wrapper.find('[aria-label="ثبت استعلام قیمت"]').exists()).toBe(false)
    wrapper.unmount()

    authState.isAuthenticated = true
    hasAnyPermission.mockReturnValue(true)
    wrapper = shallowMount(ProductDetails)
    await flushPromises()

    expect(hasAnyPermission).toHaveBeenCalledWith(['inquiries.create', 'leads.create'])
    expect(wrapper.find('[aria-label="ثبت استعلام قیمت"]').exists()).toBe(true)
  })
})
