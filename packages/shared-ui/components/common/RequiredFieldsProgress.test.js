import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import RequiredFieldsProgress from './RequiredFieldsProgress.vue'

describe('RequiredFieldsProgress', () => {
  it('calculates completion from the supplied checks and exposes progress semantics', () => {
    const wrapper = mount(RequiredFieldsProgress, {
      props: {
        eyebrow: 'این متن تزئینی نباید نمایش داده شود',
        title: 'اطلاعات ضروری',
        checks: [
          { key: 'title', label: 'عنوان', complete: true },
          { key: 'category', label: 'دسته‌بندی', complete: false },
        ],
      },
    })
    expect(wrapper.find('.progress-track').attributes('aria-valuenow')).toBe('50')
    expect(wrapper.find('.progress-value').text()).toContain('۱')
    expect(wrapper.find('.progress-eyebrow').exists()).toBe(false)
  })

  it('treats an empty checklist as complete', () => {
    const wrapper = mount(RequiredFieldsProgress, { props: { checks: [] } })
    expect(wrapper.find('.progress-track').attributes('aria-valuenow')).toBe('100')
  })
})
