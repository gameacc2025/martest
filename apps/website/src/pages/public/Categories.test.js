import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, shallowMount } from '@vue/test-utils'

const { routerPush, getCategories } = vi.hoisted(() => ({
  routerPush: vi.fn(),
  getCategories: vi.fn(),
}))

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: routerPush }),
}))

vi.mock('../../stores/products', () => ({
  useProductsStore: () => ({ getCategories }),
}))

import Categories from './Categories.vue'

const categoryFixture = () => ({
  id: 7,
  slug: 'fiber-optic',
  nameFa: 'فیبر نوری',
  nameEn: 'Fiber Optic',
  description: 'تجهیزات ارتباطی فیبر نوری',
  productCount: 12,
  image: '/categories/fiber.png',
})

describe('Website Categories', () => {
  let wrapper

  beforeEach(() => {
    vi.clearAllMocks()
    getCategories.mockResolvedValue([categoryFixture()])
  })

  afterEach(() => {
    wrapper?.unmount()
    wrapper = undefined
  })

  it('loads live categories and renders category details', async () => {
    wrapper = shallowMount(Categories)
    await flushPromises()

    expect(getCategories).toHaveBeenCalledOnce()
    expect(wrapper.find('#categories-title').text()).toBe('دسته‌بندی محصولات')
    expect(wrapper.find('.cat-name').text()).toBe('فیبر نوری')
    expect(wrapper.find('.cat-desc').text()).toContain('تجهیزات ارتباطی')
    expect(wrapper.find('.cat-thumb-img').attributes('src')).toBe('/categories/fiber.png')
    expect(wrapper.find('.cat-grid').exists()).toBe(true)
  })

  it('navigates with the existing products route and category query', async () => {
    wrapper = shallowMount(Categories)
    await flushPromises()

    wrapper.findComponent('[label="مشاهده محصولات"]').vm.$emit('click')

    expect(routerPush).toHaveBeenCalledWith({
      name: 'products',
      query: { category: 7 },
    })
  })

  it('announces an accessible loading state while categories are pending', async () => {
    let resolveCategories
    getCategories.mockReturnValueOnce(new Promise(resolve => {
      resolveCategories = resolve
    }))
    wrapper = shallowMount(Categories)
    await flushPromises()

    expect(wrapper.find('[role="status"]').text()).toContain('در حال دریافت دسته بندی ها')

    resolveCategories([categoryFixture()])
    await flushPromises()
    expect(wrapper.find('.cat-grid').exists()).toBe(true)
  })

  it('shows an explicit empty state when the API returns no categories', async () => {
    getCategories.mockResolvedValueOnce([])
    wrapper = shallowMount(Categories)
    await flushPromises()

    expect(wrapper.find('[role="status"]').text()).toContain('دسته‌بندی‌ای موجود نیست')
    expect(wrapper.find('.cat-grid').exists()).toBe(false)
  })

  it('announces a category-loading error accessibly', async () => {
    getCategories.mockRejectedValueOnce(new Error('offline'))
    wrapper = shallowMount(Categories)
    await flushPromises()

    expect(wrapper.find('[role="alert"]').text()).toContain('خطا در دریافت دسته بندی ها')
    expect(wrapper.find('.cat-grid').exists()).toBe(false)
  })
})
