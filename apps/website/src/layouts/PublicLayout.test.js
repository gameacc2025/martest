import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { reactive, nextTick } from 'vue'
import { createPinia, setActivePinia } from 'pinia'

const mocks = vi.hoisted(() => ({
  route: { current: null },
  routerPush: vi.fn(),
  categoryList: vi.fn(),
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
}))

vi.mock('@telecom/shared-core/http/apiClient', () => ({
  apiGet: vi.fn(),
}))

import PublicLayout from './PublicLayout.vue'

describe('PublicLayout responsive navigation', () => {
  let wrapper

  beforeEach(() => {
    vi.clearAllMocks()
    setActivePinia(createPinia())
    mocks.route.current = reactive({ name: 'home', path: '/', fullPath: '/', query: {} })
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
