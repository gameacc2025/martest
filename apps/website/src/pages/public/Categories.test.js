import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'

const { getCategories } = vi.hoisted(() => ({ getCategories: vi.fn() }))
vi.mock('../../stores/products', () => ({ useProductsStore: () => ({ getCategories }) }))

import Categories from './Categories.vue'

const categoryFixture = () => ({
  id: 7, slug: 'fiber-optic', nameFa: 'فیبر نوری', nameEn: 'Fiber Optic',
  description: 'تجهیزات ارتباطی فیبر نوری', productCount: 12, image: '/categories/fiber.png',
})

const mountCategories = () => mount(Categories, { global: { stubs: {
  RouterLink: { props: ['to'], template: '<a class="category-card" :data-route="to.name" :data-category="to.query?.category"><slot /></a>' },
  ProgressSpinner: { template: '<span class="spinner-stub" />' },
} } })

describe('Website Categories — Telecom Market reference', () => {
  let wrapper
  beforeEach(() => { vi.clearAllMocks(); getCategories.mockResolvedValue([categoryFixture()]) })
  afterEach(() => { wrapper?.unmount(); wrapper = undefined })

  it('loads live categories and renders the reference page heading and category details', async () => {
    wrapper = mountCategories()
    await flushPromises()
    expect(getCategories).toHaveBeenCalledOnce()
    expect(wrapper.find('#categories-title').text()).toBe('دسته‌بندی محصولات')
    expect(wrapper.find('.cat-name').text()).toBe('فیبر نوری')
    expect(wrapper.find('.cat-desc').text()).toContain('تجهیزات ارتباطی')
    expect(wrapper.find('.cat-thumb-img').attributes('src')).toBe('/categories/fiber.png')
    expect(wrapper.find('.cat-grid').exists()).toBe(true)
  })

  it('links each category to the existing products route with its category id', async () => {
    wrapper = mountCategories()
    await flushPromises()
    const link = wrapper.find('a.category-card')
    expect(link.attributes('data-route')).toBe('products')
    expect(link.attributes('data-category')).toBe('7')
  })

  it('announces loading, empty and error states accessibly', async () => {
    let resolveCategories
    getCategories.mockReturnValueOnce(new Promise(resolve => { resolveCategories = resolve }))
    wrapper = mountCategories()
    await flushPromises()
    expect(wrapper.find('[role="status"]').text()).toContain('در حال دریافت دسته بندی ها')
    resolveCategories([categoryFixture()])
    await flushPromises()
    expect(wrapper.find('.cat-grid').exists()).toBe(true)
    wrapper.unmount()

    getCategories.mockResolvedValueOnce([])
    wrapper = mountCategories()
    await flushPromises()
    expect(wrapper.find('[role="status"]').text()).toContain('دسته‌بندی فعالی')
    wrapper.unmount()

    getCategories.mockRejectedValueOnce(new Error('offline'))
    wrapper = mountCategories()
    await flushPromises()
    expect(wrapper.find('[role="alert"]').text()).toContain('خطا در دریافت دسته بندی ها')
  })
})
