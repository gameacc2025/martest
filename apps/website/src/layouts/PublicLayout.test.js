import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { reactive, nextTick } from 'vue'
import { createPinia, setActivePinia } from 'pinia'

const mocks = vi.hoisted(() => ({
  route: { current: null },
  routerPush: vi.fn(),
  categoryList: vi.fn(),
  inquiriesList: vi.fn(),
  apiGet: vi.fn(),
  apiGetPaginated: vi.fn(),
  logout: vi.fn(),
  auth: null,
}))

vi.mock('vue-router', () => ({
  useRoute: () => mocks.route.current,
  useRouter: () => ({ push: mocks.routerPush }),
}))

vi.mock('../stores/auth', () => ({
  useAuthStore: () => mocks.auth,
}))

vi.mock('@telecom/api-client', () => ({
  categoriesApi: { list: mocks.categoryList },
  inquiriesApi: { list: mocks.inquiriesList },
  endpoints: { notifications: { unreadCount: '/notifications/unread-count', list: '/notifications' } },
}))

vi.mock('@telecom/shared-core/http/apiClient', () => ({
  apiGet: mocks.apiGet,
  apiGetPaginated: mocks.apiGetPaginated,
}))

import PublicLayout from './PublicLayout.vue'

describe('PublicLayout responsive navigation', () => {
  let wrapper

  beforeEach(() => {
    vi.clearAllMocks()
    setActivePinia(createPinia())
    mocks.route.current = reactive({ name: 'products', path: '/', fullPath: '/', query: {} })
    mocks.auth = {
      user: null,
      profile: null,
      isAuthenticated: false,
      isCustomer: true,
      isStaff: false,
      isCompany: false,
      logout: mocks.logout,
    }
    mocks.categoryList.mockResolvedValue({ data: [] })
    mocks.inquiriesList.mockResolvedValue({ data: { data: [], meta: { total: 0 } } })
    mocks.apiGet.mockResolvedValue({ count: 0 })
    mocks.apiGetPaginated.mockResolvedValue({ data: [] })
  })

  afterEach(() => {
    wrapper?.unmount()
    wrapper = undefined
  })

  function mountLayout() {
    return mount(PublicLayout, {
      global: {
        stubs: {
          RouterLink: { template: '<a><slot /></a>' },
          RouterView: { template: '<div />' },
          MegaMenu: true,
          Menu: true,
          IconField: { template: '<div><slot /></div>' },
          InputIcon: true,
          InputText: { template: '<input />' },
        },
      },
    })
  }

  it('keeps the RFQ destination hidden for guests and exposes the commerce menu trigger' , async () => {
    wrapper = mountLayout()
    await flushPromises()
    expect(wrapper.find('.public-commerce-trigger').attributes('aria-label')).toBe('سبد خرید و استعلام')
    expect(wrapper.find('.public-rfq-link').exists()).toBe(false)
  })

  it('shows independent purchase and RFQ counts for signed-in customers', async () => {
    mocks.auth.isAuthenticated = true
    mocks.inquiriesList.mockResolvedValue({ data: { data: [{}], meta: { total: 12 } } })
    wrapper = mountLayout()
    await flushPromises()
    await wrapper.get('.public-commerce-trigger').trigger('click')
    await nextTick()

    const tabs = wrapper.findAll('.public-commerce-tab')
    expect(tabs).toHaveLength(2)
    expect(tabs[0].text()).toContain('خرید')
    expect(tabs[0].text()).toContain('۰')
    expect(tabs[1].text()).toContain('استعلام')
    expect(tabs[1].text()).toContain('۱۲')
  })

  it('loads and displays at most five recent notifications in a left-opening preview', async () => {
    mocks.auth.user = { id: 'customer-1' }
    mocks.auth.isAuthenticated = true
    mocks.apiGetPaginated.mockResolvedValue({ data: Array.from({ length: 7 }, (_, index) => ({ id: index + 1, title: `اعلان ${index + 1}`, message: 'متن اعلان', isRead: false })) })
    wrapper = mountLayout()
    await flushPromises()
    expect(mocks.apiGetPaginated).toHaveBeenCalledWith('/notifications?page=1&limit=5')
    await wrapper.get('.public-notifications-link').trigger('click')
    await nextTick()
    expect(wrapper.findAll('.public-notification-item')).toHaveLength(5)
    expect(wrapper.get('.public-notifications-menu').attributes('aria-label')).toBe('پنج اعلان آخر')
    expect(wrapper.get('.public-notifications-menu').element.querySelector('.public-notifications-menu__all')).toBeTruthy()
  })

  it('provides a keyboard-accessible skip link to the main content', async () => {
    wrapper = mountLayout()
    await flushPromises()

    expect(wrapper.get('.public-skip-link').attributes('href')).toBe('#public-main')
    expect(wrapper.get('#public-main').attributes('tabindex')).toBe('-1')
  })

  it('exposes the mobile navigation state through accessible button attributes', async () => {
    wrapper = mountLayout()
    await flushPromises()

    const toggle = wrapper.get('.public-mobile-toggle')
    expect(toggle.attributes('aria-expanded')).toBe('false')
    expect(toggle.attributes('aria-controls')).toBe('public-mobile-navigation')

    await toggle.trigger('click')
    await nextTick()

    expect(wrapper.get('.public-mobile-toggle').attributes('aria-expanded')).toBe('true')
    expect(wrapper.get('#public-mobile-navigation').exists()).toBe(true)
  })

  it('closes the mobile navigation when the route changes', async () => {
    wrapper = mountLayout()
    await flushPromises()
    await wrapper.get('.public-mobile-toggle').trigger('click')
    await nextTick()

    mocks.route.current.fullPath = '/products'
    await nextTick()

    expect(wrapper.find('#public-mobile-navigation').exists()).toBe(false)
    expect(wrapper.get('.public-mobile-toggle').attributes('aria-expanded')).toBe('false')
  })
})
