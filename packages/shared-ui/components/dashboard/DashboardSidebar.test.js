import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'

vi.mock('vue-router', () => ({
  useRoute: () => ({ name: null }),
}))

import DashboardSidebar from './DashboardSidebar.vue'

describe('DashboardSidebar planned roadmap entries', () => {
  it('renders planned modules as disabled text, never as navigation links', () => {
    const wrapper = mount(DashboardSidebar, {
      props: {
        menuItems: [{
          section: 'ماژول‌های آینده',
          items: [{
            title: 'مدیریت ارتباط با مشتری (CRM)',
            icon: 'pi pi-address-book',
            planned: true,
            badge: { value: 'آینده', severity: 'secondary' },
          }],
        }],
      },
      global: {
        stubs: {
          BrandMark: true,
          Badge: true,
          RouterLink: true,
        },
        directives: {
          tooltip: () => {},
        },
      },
    })

    const planned = wrapper.find('.dash-sidebar-link--planned')
    expect(planned.exists()).toBe(true)
    expect(planned.element.tagName).toBe('SPAN')
    expect(planned.attributes('aria-disabled')).toBe('true')
    expect(planned.text()).toContain('مدیریت ارتباط با مشتری (CRM)')
    expect(wrapper.find('a.dash-sidebar-link--planned').exists()).toBe(false)
    expect(wrapper.find('button.dash-sidebar-link--planned').exists()).toBe(false)
  })
})
