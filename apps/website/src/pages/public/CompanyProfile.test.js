import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { reactive } from 'vue'

const { getProducts, routerPush, addToCart, addToWishlist, routeState } = vi.hoisted(() => ({
  getProducts: vi.fn(),
  routerPush: vi.fn(),
  addToCart: vi.fn(),
  addToWishlist: vi.fn(),
  routeState: { current: null },
}))

vi.mock('vue-router', () => ({
  useRoute: () => routeState.current,
  useRouter: () => ({ push: routerPush }),
}))

vi.mock('../../stores/products', () => ({
  useProductsStore: () => ({ getProducts }),
}))

vi.mock('../../stores/cart', () => ({
  useCartStore: () => ({ addToCart }),
}))

vi.mock('../../stores/wishlist', () => ({
  useWishlistStore: () => ({ addToWishlist }),
}))

import CompanyProfile from './CompanyProfile.vue'

const productFixture = () => ({
  id: 82,
  title: 'تجهیزات انتقال نوری',
  companyId: 37,
  company: { id: 37, name: 'شرکت ارتباطات نمونه', type: 'SUPPLIER' },
  prices: [{ price: 3150000 }],
  images: [{ isPrimary: true, url: '/products/optical-82.png' }],
  specifications: { standard: { ports: 8 } },
})

const mountCompanyProfile = () => mount(CompanyProfile, {
  global: {
    stubs: {
      Breadcrumb: { template: '<nav aria-label="مسیر صفحه" />' },
      Button: {
        props: ['label', 'type', 'icon'],
        emits: ['click'],
        template: '<button type="button" @click="$emit(&quot;click&quot;)">{{ label }}</button>',
      },
      ProgressSpinner: { template: '<span class="spinner-stub" />' },
      Paginator: {
        props: ['first', 'rows', 'totalRecords'],
        emits: ['page'],
        template: '<button type="button" class="next-page" @click="$emit(&quot;page&quot;, { page: 1, rows: rows })">صفحه بعد</button>',
      },
      ProductCard: {
        props: ['product'],
        emits: ['view-product', 'add-to-cart', 'toggle-wishlist'],
        template: '<article class="product-card"><h3>{{ product.name }}</h3><button type="button" @click="$emit(&quot;view-product&quot;, product)">مشاهده</button></article>',
      },
    },
  },
})

describe('Website Company Profile', () => {
  let wrapper

  beforeEach(() => {
    vi.clearAllMocks()
    routeState.current = reactive({ params: { id: '37' } })
    getProducts.mockResolvedValue({
      data: [productFixture()],
      meta: { page: 1, limit: 12, total: 1, totalPages: 1 },
    })
  })

  afterEach(() => {
    wrapper?.unmount()
    wrapper = undefined
  })

  it('uses the public products API contract and derives public company details from published catalog data', async () => {
    wrapper = mountCompanyProfile()
    await flushPromises()

    expect(getProducts).toHaveBeenCalledWith({ page: 1, limit: 12, companyId: 37 })
    expect(wrapper.find('#company-profile-title').text()).toContain('شرکت ارتباطات نمونه')
    expect(wrapper.find('.company-type').text()).toBe('SUPPLIER')
    expect(wrapper.find('.product-card h3').text()).toBe('تجهیزات انتقال نوری')
    expect(wrapper.find('.company-hero__meta').text()).toContain('۱ محصول عمومی')
    expect(wrapper.find('[aria-labelledby="company-products-title"]').text()).not.toContain('نظرات')
    expect(wrapper.text()).not.toContain('دنبال کردن')
  })

  it('reloads the public catalog when the route company ID changes', async () => {
    wrapper = mountCompanyProfile()
    await flushPromises()
    getProducts.mockClear()

    routeState.current.params.id = '45'
    await flushPromises()

    expect(getProducts).toHaveBeenCalledWith({ page: 1, limit: 12, companyId: 45 })
  })

  it('shows an explicit empty state when the company has no public products', async () => {
    getProducts.mockResolvedValueOnce({ data: [], meta: { total: 0 } })
    wrapper = mountCompanyProfile()
    await flushPromises()

    expect(wrapper.find('[role="status"]').text()).toContain('محصول عمومی برای نمایش وجود ندارد')
    expect(wrapper.find('.product-card').exists()).toBe(false)
  })

  it('announces API errors and retries with the same public catalog contract', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    getProducts.mockRejectedValueOnce(new Error('offline'))
    wrapper = mountCompanyProfile()
    await flushPromises()

    expect(wrapper.find('[role="alert"]').text()).toContain('دریافت اطلاعات شرکت ناموفق بود')

    getProducts.mockResolvedValueOnce({ data: [productFixture()], meta: { total: 1 } })
    await wrapper.find('[role="alert"] button').trigger('click')
    await flushPromises()

    expect(getProducts).toHaveBeenLastCalledWith({ page: 1, limit: 12, companyId: 37 })
    expect(wrapper.find('.product-card').exists()).toBe(true)
    consoleError.mockRestore()
  })

  it('navigates to the existing product-details route', async () => {
    wrapper = mountCompanyProfile()
    await flushPromises()

    await wrapper.find('.product-card button').trigger('click')

    expect(routerPush).toHaveBeenCalledWith({
      name: 'product-details',
      params: { id: 82 },
    })
  })

  it('requests the next page using the public catalog pagination contract', async () => {
    wrapper = mountCompanyProfile()
    await flushPromises()
    getProducts.mockClear()

    await wrapper.find('.next-page').trigger('click')
    await flushPromises()

    expect(getProducts).toHaveBeenCalledWith({ page: 2, limit: 12, companyId: 37 })
  })
})
