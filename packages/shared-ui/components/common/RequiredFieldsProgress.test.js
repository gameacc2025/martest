import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import RequiredFieldsProgress from './RequiredFieldsProgress.vue'

describe('RequiredFieldsProgress', () => {
  it('shows completed and pending required fields with an accurate percentage', () => {
    const wrapper = mount(RequiredFieldsProgress, {
      props: {
        eyebrow: 'آمادگی ثبت محصول',
        title: 'اطلاعات ضروری',
        checks: [
          { key: 'title', label: 'عنوان محصول', complete: true },
          { key: 'category', label: 'دسته‌بندی', complete: false },
        ],
      },
    })

    expect(wrapper.text()).toContain('آمادگی ثبت محصول')
    expect(wrapper.text()).toContain('عنوان محصول')
    expect(wrapper.text()).toContain('دسته‌بندی')
    expect(wrapper.text()).toContain('۱ از ۲')
    expect(wrapper.find('[role="progressbar"]').attributes('aria-valuenow')).toBe('50')
    expect(wrapper.findAll('.progress-check.is-complete')).toHaveLength(1)
  })

  it('treats an empty checklist as complete without dividing by zero', () => {
    const wrapper = mount(RequiredFieldsProgress, { props: { checks: [] } })

    expect(wrapper.find('[role="progressbar"]').attributes('aria-valuenow')).toBe('100')
    expect(wrapper.text()).toContain('۰ از ۰')
  })
})
