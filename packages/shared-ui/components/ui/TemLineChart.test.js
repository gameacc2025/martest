import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import TemLineChart from './TemLineChart.vue'

const componentSource = readFileSync(new URL('./TemLineChart.vue', import.meta.url), 'utf8')

describe('TemLineChart accessibility and states', () => {
  it('exposes each named series, period and source value to assistive technology', () => {
    const wrapper = mount(TemLineChart, {
      props: {
        labels: ['مهر', 'آبان'],
        series: [
          { label: 'استعلام‌ها', values: [0, 4] },
          { label: 'محصولات', values: [3, 8] },
        ],
      },
    })

    const chart = wrapper.get('svg[role="img"]')
    expect(chart.attributes('aria-label')).toContain('نمودار روند')
    expect(chart.attributes('aria-label')).toContain('استعلام‌ها')
    expect(chart.attributes('aria-label')).toContain('مهر')
    expect(chart.attributes('aria-label')).toContain('آبان')
    expect(chart.attributes('aria-label')).toContain('محصولات')
    expect(chart.attributes('aria-label')).toContain('۴')
    expect(chart.attributes('aria-label')).toContain('۸')
  })

  it('describes empty data without drawing a misleading chart', () => {
    const wrapper = mount(TemLineChart, { props: { labels: [], series: [] } })

    expect(wrapper.find('svg[role="img"]').exists()).toBe(false)
    expect(wrapper.find('.tm-empty').text()).toContain('داده‌ای برای نمایش نیست')
  })

  it('marks the chart busy and hides its decorative skeleton from assistive technology', () => {
    const wrapper = mount(TemLineChart, {
      props: { loading: true, series: [{ label: 'استعلام‌ها', values: [1, 2] }] },
    })

    expect(wrapper.get('.tm-line-chart').attributes('aria-busy')).toBe('true')
    expect(wrapper.get('.tm-line-chart__loading').attributes('aria-hidden')).toBe('true')
    expect(wrapper.find('svg[role="img"]').exists()).toBe(false)
  })

  it('respects the operating system reduced-motion preference for its loading skeleton', () => {
    expect(componentSource).toContain('@media(prefers-reduced-motion:reduce)')
    expect(componentSource).toContain('.tm-line-chart__loading span{animation:none}')
  })

  it('uses stable fallback names for series without labels', () => {
    const wrapper = mount(TemLineChart, {
      props: { labels: ['امروز'], series: [{ values: [12] }] },
    })

    expect(wrapper.get('svg[role="img"]').attributes('aria-label')).toContain('سری 1')
    expect(wrapper.get('svg[role="img"]').attributes('aria-label')).toContain('۱۲')
  })
})
