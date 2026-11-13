import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import WorkspacePageHeading from './WorkspacePageHeading.vue'

describe('WorkspacePageHeading', () => {
  it('renders a single titled h1 with the given id', () => {
    const wrapper = mount(WorkspacePageHeading, {
      props: { title: 'مدیریت محصولات', headingId: 'products-title' },
    })
    expect(wrapper.find('h1').attributes('id')).toBe('products-title')
    expect(wrapper.find('h1').text()).toBe('مدیریت محصولات')
  })

  it('keeps the heading available to assistive technology by default', () => {
    const wrapper = mount(WorkspacePageHeading, {
      props: { title: 'مدیریت شرکت‌ها' },
    })
    expect(wrapper.find('h1').exists()).toBe(true)
    expect(wrapper.find('.workspace-page-heading-copy--sr-only').exists()).toBe(true)
  })

  it('applies the sr-only modifier when requested (breadcrumb already shows location)', () => {
    const wrapper = mount(WorkspacePageHeading, {
      props: { title: 'مدیریت نقش‌ها', srOnly: true },
    })
    expect(wrapper.find('h1').exists()).toBe(true)
    expect(wrapper.find('.workspace-page-heading-copy--sr-only').exists()).toBe(true)
  })

  it('supports optional actions and omits an empty description', () => {
    const wrapper = mount(WorkspacePageHeading, {
      props: { title: 'مدیریت شرکت‌ها' },
      slots: { actions: '<button type="button">افزودن</button>' },
    })
    expect(wrapper.find('.workspace-page-heading-actions button').text()).toBe('افزودن')
  })
})
