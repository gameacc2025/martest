import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'

const { getCategories, getProducts, routerPush } = vi.hoisted(() => ({ getCategories: vi.fn(), getProducts: vi.fn(), routerPush: vi.fn() }))
vi.mock('vue-router', () => ({ useRouter: () => ({ push: routerPush }), RouterLink: { props: ['to'], template: '<a><slot /></a>' } }))
vi.mock('../../stores/products', () => ({ useProductsStore: () => ({ getCategories, getProducts }) }))
import Categories from './Categories.vue'

const categoryFixture = () => ({
  id: 7, slug: 'fiber-optic', nameFa: 'فیبر نوری', nameEn: 'Fiber Optic',
  productCount: 12, children: [{ id: 71, nameFa: 'کابل فیبر نوری' }, { id: 72, nameFa: 'OTDR' }],
})
const mountCategories = () => mount(Categories, { global: { stubs: {
  RouterLink: { props: ['to'], template: '<a :data-route="to.name"><slot /></a>' },
} } })

describe('Website Categories — Telecom Market.html reference', () => {
  let wrapper
  beforeEach(() => { vi.clearAllMocks(); getCategories.mockResolvedValue([categoryFixture()]); getProducts.mockResolvedValue({ data: [], meta: { total: 12 } }) })
  afterEach(() => { wrapper?.unmount(); wrapper = undefined })

  it('loads live categories and renders the reference category panels', async () => {
    wrapper = mountCategories()
    await flushPromises()
    expect(getCategories).toHaveBeenCalledOnce()
    expect(getProducts).toHaveBeenCalledWith({ page: 1, limit: 1, status: 'PUBLISHED', categoryId: 7 })
    expect(wrapper.find('.ph h1').text()).toBe('همه دسته‌بندی‌ها')
    expect(wrapper.find('.breadcrumb').text()).toContain('صفحه اصلی')
    expect(wrapper.find('.breadcrumb').text()).toContain('همه دسته‌بندی‌ها')
    expect(wrapper.find('.g3').exists()).toBe(true)
    expect(wrapper.find('.cb-header-img').exists()).toBe(true)
    expect(wrapper.find('.cb-top-info h3').text()).toBe('فیبر نوری')
    expect(wrapper.find('.cb-top-info small').text()).toContain('۱۲')
    expect(wrapper.findAll('.cb li').map(node => node.text())).toEqual(['کابل فیبر نوری', 'OTDR'])
  })

  it('navigates category panels to the existing products route using category IDs', async () => {
    wrapper = mountCategories()
    await flushPromises()
    await wrapper.get('.cb-footer button').trigger('click')
    expect(routerPush).toHaveBeenCalledWith({ name: 'products', query: { category: 7 } })
  })

  it('announces loading, empty and error states accessibly', async () => {
    let resolveCategories
    getCategories.mockReturnValueOnce(new Promise(resolve => { resolveCategories = resolve }))
    wrapper = mountCategories()
    await flushPromises()
    expect(wrapper.find('[role="status"]').text()).toContain('در حال دریافت دسته‌بندی‌ها')
    resolveCategories([categoryFixture()])
    await flushPromises()
    expect(wrapper.find('.g3').exists()).toBe(true)
    wrapper.unmount()

    getCategories.mockResolvedValueOnce([])
    wrapper = mountCategories()
    await flushPromises()
    expect(wrapper.find('[role="status"]').text()).toContain('دسته‌بندی فعالی')
    wrapper.unmount()

    getCategories.mockRejectedValueOnce(new Error('offline'))
    wrapper = mountCategories()
    await flushPromises()
    expect(wrapper.find('[role="alert"]').text()).toContain('دریافت دسته‌بندی‌ها ناموفق بود')
  })
})
