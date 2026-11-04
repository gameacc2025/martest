import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import KpiCard from './KpiCard.vue'

describe('KpiCard', () => {
  it('renders the supplied value, label and contextual icon tile', () => {
    const wrapper = mount(KpiCard, { props: { label: 'محصولات منتشر شده', value: 1250, icon: 'pi pi-box' } })
    expect(wrapper.find('.kpi-card-label').text()).toBe('محصولات منتشر شده')
    expect(wrapper.find('.kpi-card-value').text()).toBe('۱٬۲۵۰')
    expect(wrapper.find('.kpi-card-label').find('i').exists()).toBe(false)
    expect(wrapper.find('.kpi-card-icon i').classes()).toContain('pi-box')
    expect(wrapper.find('.kpi-card-icon').attributes('aria-hidden')).toBe('true')
  })

  it('shows a loading placeholder and keeps the supplied destination', () => {
    const wrapper = mount(KpiCard, {
      props: { label: 'استعلام‌ها', value: 0, loading: true, to: { name: 'inquiries' } },
      global: { stubs: { RouterLink: { template: '<a><slot /></a>', props: ['to'] } } },
    })
    expect(wrapper.find('.kpi-card-value--skeleton').exists()).toBe(true)
    expect(wrapper.find('.kpi-card-destination').exists()).toBe(true)
  })
})
