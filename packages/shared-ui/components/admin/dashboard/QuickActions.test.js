import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import QuickActions from './QuickActions.vue'

describe('QuickActions', () => {
  it('renders supplied destinations with their contextual icon and compact navigation hierarchy', () => {
    const wrapper = mount(QuickActions, {
      props: { actions: [{ label: 'مدیریت محصولات', icon: 'pi pi-box', to: { name: 'products' } }] },
      global: { stubs: { RouterLink: { template: '<a :href="String(to.name)"><slot /></a>', props: ['to'] } } },
    })
    expect(wrapper.find('nav[aria-label="دسترسی سریع"]').exists()).toBe(true)
    expect(wrapper.find('.quick-action-label').text()).toBe('مدیریت محصولات')
    expect(wrapper.find('.quick-action-icon').classes()).toContain('pi-box')
    expect(wrapper.find('a').attributes('href')).toBe('products')
  })
})
