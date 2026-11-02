import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'

const routeState = vi.hoisted(() => ({
  meta: { title: 'مدیریت کاربران', section: 'مدیریت' },
}))

vi.mock('vue-router', () => ({
  useRoute: () => routeState,
}))

import PageHeader from './PageHeader.vue'

describe('PageHeader', () => {
  it('renders the active route title and section context', () => {
    const wrapper = mount(PageHeader, {
      global: {
        stubs: {
          DashboardBreadcrumb: {
            template: '<nav class="breadcrumb-test-stub">مسیر صفحه</nav>',
          },
        },
      },
    })

    expect(wrapper.find('.page-header-pro__title').text()).toBe('مدیریت کاربران')
    expect(wrapper.find('.page-header-pro__eyebrow').text()).toBe('مدیریت')
    expect(wrapper.find('.breadcrumb-test-stub').exists()).toBe(true)
  })

  it('falls back to a useful title and context when route metadata is absent', async () => {
    routeState.meta = {}
    const wrapper = mount(PageHeader, {
      global: {
        stubs: {
          DashboardBreadcrumb: true,
        },
      },
    })

    expect(wrapper.find('.page-header-pro__title').text()).toBe('داشبورد')
    expect(wrapper.find('.page-header-pro__eyebrow').text()).toBe('فضای کاری')
  })
})
