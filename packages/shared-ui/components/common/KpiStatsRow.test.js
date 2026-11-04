import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import KpiStatsRow from './KpiStatsRow.vue'
import KpiCard from '../admin/dashboard/KpiCard.vue'

describe('KpiStatsRow', () => {
  it('renders one metric card per item with label and value', () => {
    const wrapper = mount(KpiStatsRow, {
      props: {
        items: [
          { label: 'کل نقش‌ها', value: 12, icon: 'pi pi-shield' },
          { label: 'کل کاربران', value: 48, icon: 'pi pi-users', tone: 'info' },
        ],
      },
      global: { stubs: { RouterLink: { template: '<a><slot /></a>', props: ['to'] } } },
    })
    const cards = wrapper.findAllComponents(KpiCard)
    expect(cards).toHaveLength(2)
    expect(cards[0].props('label')).toBe('کل نقش‌ها')
    expect(cards[0].props('value')).toBe(12)
    expect(cards[1].props('tone')).toBe('info')
    expect(wrapper.find('.kpi-stats-row').exists()).toBe(true)
  })

  it('forwards the loading state to every card', () => {
    const wrapper = mount(KpiStatsRow, {
      props: {
        loading: true,
        items: [{ label: 'کل استعلام‌ها', value: 3 }],
      },
      global: { stubs: { RouterLink: { template: '<a><slot /></a>', props: ['to'] } } },
    })
    const cards = wrapper.findAllComponents(KpiCard)
    expect(cards[0].props('loading')).toBe(true)
    expect(wrapper.find('.kpi-card-value--skeleton').exists()).toBe(true)
  })
})
