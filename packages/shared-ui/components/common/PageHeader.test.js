import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import PageHeader from './PageHeader.vue'

describe('PageHeader', () => {
  it('renders a lightweight breadcrumb without duplicating the page heading', () => {
    const wrapper = mount(PageHeader, {
      global: { stubs: { DashboardBreadcrumb: { template: '<span class="breadcrumb-test-stub">مسیر صفحه</span>' } } },
    })
    expect(wrapper.find('nav[aria-label="مسیر صفحه"]').exists()).toBe(true)
    expect(wrapper.find('.breadcrumb-test-stub').text()).toBe('مسیر صفحه')
    expect(wrapper.find('h1').exists()).toBe(false)
    expect(wrapper.find('.page-header-pro__eyebrow').exists()).toBe(false)
  })
})
