import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import FormSectionHeader from './FormSectionHeader.vue'

describe('FormSectionHeader', () => {
  it('renders the section title, description and icon', () => {
    const wrapper = mount(FormSectionHeader, {
      props: {
        title: 'مشخصات فنی',
        description: 'ویژگی‌های استاندارد محصول',
        icon: 'pi pi-sliders-h',
      },
    })

    expect(wrapper.find('h2').text()).toBe('مشخصات فنی')
    expect(wrapper.find('p').text()).toBe('ویژگی‌های استاندارد محصول')
    expect(wrapper.find('.form-section-heading__icon i').classes()).toContain('pi-sliders-h')
  })

  it('renders the optional actions slot without requiring it', () => {
    const plain = mount(FormSectionHeader, { props: { title: 'اطلاعات پایه' } })
    expect(plain.find('.form-section-heading__actions').exists()).toBe(false)

    const withAction = mount(FormSectionHeader, {
      props: { title: 'قیمت‌گذاری' },
      slots: { actions: '<button type="button">افزودن ردیف</button>' },
    })
    expect(withAction.find('.form-section-heading__actions button').text()).toBe('افزودن ردیف')
  })
})
