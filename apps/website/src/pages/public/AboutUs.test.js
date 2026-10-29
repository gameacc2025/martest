import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'

const { listProducts, routerPush } = vi.hoisted(() => ({
  listProducts: vi.fn(),
  routerPush: vi.fn(),
}))

vi.mock('@telecom/api-client', () => ({
  productsApi: { list: listProducts },
}))

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: routerPush }),
}))

import AboutUs from './AboutUs.vue'

const productFixture = () => ({
  id: 51,
  title: 'روتر سازمانی',
  company: { name: 'تأمین‌کننده واقعی از API' },
  prices: [{ price: 2450000, currency: 'IRR' }],
  images: [{ isPrimary: true, url: '/products/router-51.png' }],
})

const mountAboutUs = () => mount(AboutUs, {
  global: {
    stubs: {
      Breadcrumb: { template: '<nav aria-label="مسیر صفحه" />' },
      Button: {
        props: ['label', 'type', 'icon'],
        emits: ['click'],
        template: '<button type="button" @click="$emit(&quot;click&quot;)">{{ label }}</button>',
      },
      RouterLink: {
        props: ['to'],
        template: '<a :href="typeof to === \'string\' ? to : to.name"><slot /></a>',
      },
    },
  },
})

describe('Website About Us', () => {
  let wrapper

  beforeEach(() => {
    vi.clearAllMocks()
    listProducts.mockResolvedValue({ data: { items: [productFixture()] } })
  })

  afterEach(() => {
    wrapper?.unmount()
    wrapper = undefined
  })

  it('loads published products from the existing API and renders real product details', async () => {
    wrapper = mountAboutUs()
    await flushPromises()

    expect(listProducts).toHaveBeenCalledWith({ page: 1, limit: 6, status: 'PUBLISHED' })
    expect(wrapper.find('#about-title').text()).toContain('تجهیزات مخابراتی')
    expect(wrapper.find('.about-product__name').text()).toBe('روتر سازمانی')
    expect(wrapper.find('.about-product__vendor').text()).toBe('تأمین‌کننده واقعی از API')
    expect(wrapper.find('.about-product__image img').attributes('src')).toBe('/products/router-51.png')
    expect(wrapper.find('.about-values').exists()).toBe(true)
    expect(wrapper.find('.about-steps').exists()).toBe(true)
  })

  it('does not display unverified demo statistics, team members, or partner lists', async () => {
    wrapper = mountAboutUs()
    await flushPromises()

    expect(wrapper.find('.stats-bar').exists()).toBe(false)
    expect(wrapper.find('.team-grid').exists()).toBe(false)
    expect(wrapper.find('.partners-grid').exists()).toBe(false)
  })

  it('shows an explicit empty state when the API returns no published products', async () => {
    listProducts.mockResolvedValueOnce({ data: { items: [] } })
    wrapper = mountAboutUs()
    await flushPromises()

    expect(wrapper.find('[role="status"]').text()).toContain('محصول منتشرشده‌ای')
    expect(wrapper.find('.about-product').exists()).toBe(false)
  })

  it('announces API errors and retries using the same published-products request', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    listProducts.mockRejectedValueOnce(new Error('offline'))
    wrapper = mountAboutUs()
    await flushPromises()

    expect(wrapper.find('[role="alert"]').text()).toContain('دریافت محصولات ویژه ممکن نشد')

    listProducts.mockResolvedValueOnce({ data: { items: [productFixture()] } })
    await wrapper.find('[role="alert"] button').trigger('click')
    await flushPromises()

    expect(listProducts).toHaveBeenLastCalledWith({ page: 1, limit: 6, status: 'PUBLISHED' })
    expect(wrapper.find('.about-product__name').text()).toBe('روتر سازمانی')
    consoleError.mockRestore()
  })

  it('navigates to the existing product details route from the product card', async () => {
    wrapper = mountAboutUs()
    await flushPromises()

    await wrapper.find('.about-product__open').trigger('click')

    expect(routerPush).toHaveBeenCalledWith({
      name: 'product-details',
      params: { id: 51 },
    })
  })
})
