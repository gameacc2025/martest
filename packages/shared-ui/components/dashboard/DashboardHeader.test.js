import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'

const router = vi.hoisted(() => ({
  hasRoute: vi.fn(() => false),
  push: vi.fn(),
}))

vi.mock('vue-router', () => ({
  useRouter: () => router,
}))

import DashboardHeader from './DashboardHeader.vue'

describe('DashboardHeader', () => {
  it('never renders the removed workspace identity chip', () => {
    const wrapper = mount(DashboardHeader, {
      props: { workspaceLabel: 'مدیریت بازارگاه' },
      global: {
        stubs: {
          Menu: true,
          Badge: true,
          Popover: true,
          DashboardBreadcrumb: true,
          RouterLink: { template: '<a><slot /></a>' },
        },
      },
    })

    expect(wrapper.find('.dash-header-workspace').exists()).toBe(false)
    expect(wrapper.text()).not.toContain('مدیریت بازارگاه')
  })

  it('provides descriptive labels for notification, theme and account controls', () => {
    const wrapper = mount(DashboardHeader, {
      props: {
        notificationCount: 3,
        user: { displayName: 'مدیر سامانه' },
      },
      global: {
        stubs: {
          Menu: true,
          Badge: true,
          Popover: true,
          DashboardBreadcrumb: true,
          RouterLink: { template: '<a><slot /></a>' },
        },
      },
    })

    expect(wrapper.find('.dash-header-bell').attributes('aria-label')).toContain('3')
    expect(wrapper.find('button[aria-label="حالت تیره"]').exists()).toBe(true)
    expect(wrapper.find('button[aria-haspopup="menu"]').attributes('aria-label')).toContain('مدیر سامانه')
  })

  it('exposes expanded/collapsed navigation state on desktop and mobile toggles', async () => {
    const wrapper = mount(DashboardHeader, {
      props: { collapsed: true, mobileOpen: true },
      global: {
        stubs: {
          Menu: true,
          Badge: true,
          Popover: true,
          DashboardBreadcrumb: true,
          RouterLink: { template: '<a><slot /></a>' },
        },
      },
    })

    const desktopToggle = wrapper.find('.dash-header-desktop-only')
    const mobileToggle = wrapper.find('.dash-header-start .dash-header-mobile-only')
    expect(desktopToggle.attributes('aria-label')).toBe('باز کردن منو')
    expect(desktopToggle.attributes('aria-expanded')).toBe('false')
    expect(mobileToggle.attributes('aria-label')).toBe('بستن منو')
    expect(mobileToggle.attributes('aria-expanded')).toBe('true')
    expect(mobileToggle.attributes('aria-controls')).toBe('dashboard-navigation')

    await wrapper.setProps({ collapsed: false, mobileOpen: false })
    expect(wrapper.find('.dash-header-desktop-only').attributes('aria-label')).toBe('جمع کردن منو')
    expect(wrapper.find('.dash-header-start .dash-header-mobile-only').attributes('aria-label')).toBe('باز کردن منو')
  })})
