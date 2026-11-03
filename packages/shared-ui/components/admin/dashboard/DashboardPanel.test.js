import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import DashboardPanel from './DashboardPanel.vue'

describe('DashboardPanel', () => {
  it('shows a meaningful contextual icon beside the section title', () => {
    const wrapper = mount(DashboardPanel, {
      props: { title: 'جریان استعلام‌ها', icon: 'pi pi-inbox' },
      slots: { default: '<p>محتوای واقعی</p>' },
    })
    expect(wrapper.find('h2').text()).toBe('جریان استعلام‌ها')
    expect(wrapper.text()).toContain('محتوای واقعی')
    expect(wrapper.find('.dash-panel-title-icon').classes()).toContain('pi-inbox')
  })
})
