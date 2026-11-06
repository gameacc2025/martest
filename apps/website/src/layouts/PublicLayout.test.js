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
    expect(wrapper.find('.public-commerce-trigger').attributes('aria-label')).toBe('سبد خرید')
    expect(wrapper.find('.public-rfq-link').exists()).toBe(false)
  })

  it('opens the left-side cart drawer and exposes an empty-cart recovery action', async () => {
    wrapper = mountLayout()
    await flushPromises()
    await wrapper.get('.public-commerce-trigger').trigger('click')
    await nextTick()

    expect(wrapper.get('.public-cart-drawer').attributes('aria-label')).toBe('سبد خرید')
    expect(wrapper.get('.public-cart-drawer__empty').text()).toContain('سبد خرید خالی است')
    expect(wrapper.get('.public-cart-drawer__empty a').text()).toContain('مشاهده محصولات')
  })

  it('opens a searchable header popover from the search icon', async () => {
    wrapper = mountLayout()
    await flushPromises()
    await wrapper.get('.public-search-trigger').trigger('click')
    await nextTick()

    expect(wrapper.get('#public-search-popover').exists()).toBe(true)
    expect(wrapper.get('#public-header-search').exists()).toBe(true)
  })

  it('shows only the catalogue entry in the primary navigation', async () => {
    wrapper = mountLayout()
    await flushPromises()
    const links = wrapper.findAll('.public-nav-link').map(link => link.text().trim())
    expect(links).toContain('منوی اصلی')
    expect(links).not.toContain('صفحه اصلی')
  })

  it('loads and displays at most five recent notifications in a left-side drawer', async () => {
    mocks.auth.user = { id: 'customer-1' }
    mocks.auth.isAuthenticated = true
    mocks.apiGetPaginated.mockResolvedValue({ data: Array.from({ length: 7 }, (_, index) => ({ id: index + 1, title: `اعلان ${index + 1}`, message: 'متن اعلان', isRead: false })) })
    wrapper = mountLayout()
    await flushPromises()
    expect(mocks.apiGetPaginated).toHaveBeenCalledWith('/notifications?page=1&limit=5')
    await wrapper.get('.public-notifications-link').trigger('click')
    await nextTick()
    expect(wrapper.find('.public-notifications-layer').exists()).toBe(true)
    expect(wrapper.findAll('.public-notification-item')).toHaveLength(5)
    expect(wrapper.get('.public-notifications-drawer').attributes('aria-label')).toBe('اعلان‌های اخیر')
    expect(wrapper.get('.public-notifications-drawer').element.querySelector('.public-notifications-menu__all')).toBeTruthy()
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
