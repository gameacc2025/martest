import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import WorkspacePageHeading from './WorkspacePageHeading.vue'

describe('WorkspacePageHeading', () => {
  it('renders a clear compact title, description and meaningful page icon', () => {
    const wrapper = mount(WorkspacePageHeading, {
      props: { eyebrow: 'کنترل کاتالوگ', title: 'مدیریت محصولات', description: 'کاتالوگ محصولات را مدیریت کنید.', icon: 'pi pi-box', headingId: 'products-title' },
    })
    expect(wrapper.find('h1').attributes('id')).toBe('products-title')
    expect(wrapper.find('h1').text()).toBe('مدیریت محصولات')
    expect(wrapper.find('p').text()).toBe('کاتالوگ محصولات را مدیریت کنید.')
    expect(wrapper.find('.workspace-page-heading-eyebrow').exists()).toBe(false)
    expect(wrapper.find('.workspace-page-heading-icon').classes()).toContain('pi-box')
  })

  it('supports optional actions and omits an empty description', () => {
    const wrapper = mount(WorkspacePageHeading, {
      props: { title: 'مدیریت شرکت‌ها' },
      slots: { actions: '<button type="button">افزودن</button>' },
    })
    expect(wrapper.find('p').exists()).toBe(false)
    expect(wrapper.find('.workspace-page-heading-actions button').text()).toBe('افزودن')
  })
})
