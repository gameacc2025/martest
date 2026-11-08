import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { reactive, ref, nextTick } from 'vue'
import { createPinia, setActivePinia } from 'pinia'

const mocks = vi.hoisted(() => ({
  route: { current: null },
  routerPush: vi.fn(),
  categoryList: vi.fn(),
  productsList: vi.fn(),
  inquiriesList: vi.fn(),
  apiGet: vi.fn(),
  apiGetPaginated: vi.fn(),
  logout: vi.fn(),
  auth: null,
  theme: null,
  toggleTheme: vi.fn(),
}))

vi.mock('vue-router', () => ({
  useRoute: () => mocks.route.current,
  useRouter: () => ({ push: mocks.routerPush }),
}))

vi.mock('../stores/auth', () => ({
  useAuthStore: () => mocks.auth,
}))

vi.mock('@telecom/shared-ui', () => ({
  useTheme: () => ({ theme: mocks.theme, toggle: mocks.toggleTheme }),
}))

vi.mock('@telecom/api-client', () => ({
  categoriesApi: { list: mocks.categoryList },
  productsApi: { list: mocks.productsList },
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
    mocks.theme = ref('light')
    mocks.toggleTheme.mockImplementation(() => { mocks.theme.value = mocks.theme.value === 'dark' ? 'light' : 'dark' })
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
    mocks.productsList.mockResolvedValue({ data: { data: [{ brand: 'Cisco' }, { brand: 'Nokia' }, { brand: 'Cisco' }] } })
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
          RouterLink: { props: ['to'], template: '<a :data-route="to?.name || to"><slot /></a>' },
          RouterView: { template: '<div />' },
          Drawer: { inheritAttrs: false, props: ['visible'], emits: ['update:visible'], template: '<div v-if="visible" v-bind="$attrs"><slot name="header" /><slot /><slot name="footer" /></div>' },
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
    expect(wrapper.get('.public-cart-drawer').attributes('position')).toBe('left')
    expect(wrapper.get('.public-cart-drawer__empty').text()).toContain('سبد خرید خالی است')
    expect(wrapper.get('.public-cart-drawer__empty a').text()).toContain('مشاهده محصولات')
  })

  it('exposes the persistent shared light/dark theme toggle in the public header', async () => {
    wrapper = mountLayout()
    await flushPromises()
    const toggle = wrapper.get('.public-theme-toggle')
    expect(toggle.attributes('aria-label')).toBe('تغییر به تم تیره')
    expect(toggle.attributes('aria-pressed')).toBe('false')
    await toggle.trigger('click')
    await nextTick()
    expect(mocks.toggleTheme).toHaveBeenCalledOnce()
    expect(wrapper.get('.public-theme-toggle').attributes('aria-label')).toBe('تغییر به تم روشن')
    expect(wrapper.get('.public-theme-toggle').attributes('aria-pressed')).toBe('true')
  })

  it('exposes the NewTemp search icon and retains commerce actions', async () => {
    wrapper = mountLayout()
    await flushPromises()
    expect(wrapper.get('.public-search-trigger').attributes('aria-label')).toBe('جستجوی محصولات')
    await wrapper.get('.public-search-trigger').trigger('click')
    expect(mocks.routerPush).toHaveBeenCalledWith({ name: 'search' })
    expect(wrapper.get('.public-commerce-trigger').attributes('aria-label')).toBe('سبد خرید')
    expect(wrapper.get('.public-login-link').exists()).toBe(true)
  })

  it('matches the NewTemp utility strip, simple navigation and four-column footer', async () => {
    wrapper = mountLayout()
    await flushPromises()
    expect(wrapper.get('.public-utility-message').text()).toContain('خرید فوری و استعلام سازمانی')
    const navLabels = wrapper.findAll('.public-nav-link').map(link => link.text().trim())
    expect(navLabels).toContain('دسته‌بندی')
    expect(navLabels).toContain('اخبار و مقالات')
    expect(navLabels).not.toContain('جستجو')
    expect(navLabels).not.toContain('درباره ما')
    expect(navLabels).not.toContain('تماس با ما')
    expect(navLabels).not.toContain('سوالات متداول')
    expect(wrapper.get('.public-search-trigger').text()).toBe('')
    expect(wrapper.find('.public-footer-grid').element.children).toHaveLength(5)
    expect(wrapper.get('.public-footer-grid').text()).not.toContain('آخرین مطالب وبلاگ')
    expect(wrapper.get('.public-footer-grid').text()).toContain('تماس با ما')
    expect(wrapper.get('.public-footer-grid').text()).toContain('درباره ما')
    expect(wrapper.get('.public-footer-grid').text()).toContain('برندها')
    expect(wrapper.get('.public-footer-grid').text()).toContain('Cisco')
    expect(wrapper.get('.public-footer-grid').text()).toContain('Nokia')
    const faqFooterLink = wrapper.findAll('.public-footer-link').find(link => link.text().trim() === 'سوالات متداول')
    expect(faqFooterLink).toBeTruthy()
    expect(faqFooterLink.attributes('data-route')).toBe('faq')
  })

  it('shows separate homepage and product-catalogue destinations in the primary navigation', async () => {
    wrapper = mountLayout()
    await flushPromises()
    const links = wrapper.findAll('.public-nav-link').map(link => link.text().trim())
    expect(links).toContain('صفحه اصلی')
    expect(links).toContain('محصولات')
  })


  it('routes the brand and primary homepage item to the real homepage, with a separate catalogue link', async () => {
    wrapper = mountLayout()
    await flushPromises()
    const links = wrapper.findAll('.public-nav-link')
    const homeLink = links.find(link => link.text().includes('صفحه اصلی'))
    const productsLink = links.find(link => link.text().includes('محصولات'))
    expect(homeLink).toBeTruthy()
    expect(productsLink).toBeTruthy()
    expect(homeLink.attributes('data-route')).toBe('home')
    expect(productsLink.attributes('data-route')).toBe('products')
    expect(wrapper.get('.public-logo').attributes('data-route')).toBe('home')
    expect(wrapper.get('.public-logo').attributes('aria-label')).toContain('صفحه اصلی')
  })


  it('shows the account avatar beside the user menu trigger', async () => {
    mocks.auth.user = { id: 'customer-1' }
    mocks.auth.isAuthenticated = true
    mocks.auth.profile = { firstName: 'مریم', avatar: 'https://cdn.example.test/avatar.png' }
    wrapper = mountLayout()
    await flushPromises()
    expect(wrapper.get('.public-user-avatar img').attributes('src')).toBe('https://cdn.example.test/avatar.png')
    expect(wrapper.get('.public-user-avatar').isVisible()).toBe(true)
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
    expect(wrapper.find('.public-notifications-drawer').exists()).toBe(true)
    expect(wrapper.findAll('.public-notification-item')).toHaveLength(5)
    expect(wrapper.get('.public-notifications-drawer').attributes('aria-label')).toBe('اعلان‌های اخیر')
    expect(wrapper.get('.public-notifications-drawer').attributes('position')).toBe('left')
    expect(wrapper.find('.public-cart-drawer').exists()).toBe(false)
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
