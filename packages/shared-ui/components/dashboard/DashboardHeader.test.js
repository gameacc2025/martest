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

describe('DashboardHeader workspace context', () => {
  it('renders the host application workspace label', () => {
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

    expect(wrapper.find('.dash-header-workspace').exists()).toBe(true)
    expect(wrapper.find('.dash-header-workspace-label').text()).toBe('مدیریت بازارگاه')
    expect(wrapper.find('.dash-header-workspace').attributes('aria-label')).toBe('فضای کاری فعلی')
  })

  it('does not render an empty workspace identity when no label is supplied', () => {
    const wrapper = mount(DashboardHeader, {
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
  })
})
