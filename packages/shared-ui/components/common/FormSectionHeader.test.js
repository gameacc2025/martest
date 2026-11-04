import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import FormSectionHeader from './FormSectionHeader.vue'

describe('FormSectionHeader', () => {
  it('uses the section title and description as the hierarchy without an icon tile', () => {
    const wrapper = mount(FormSectionHeader, {
      props: { title: 'اطلاعات پایه', description: 'مشخصات اصلی محصول را وارد کنید.', icon: 'pi pi-box' },
    })
    expect(wrapper.find('h2').text()).toBe('اطلاعات پایه')
    expect(wrapper.find('p').text()).toBe('مشخصات اصلی محصول را وارد کنید.')
    expect(wrapper.find('.form-section-heading__icon').exists()).toBe(false)
  })

  it('renders optional actions', () => {
    const wrapper = mount(FormSectionHeader, {
      props: { title: 'قیمت‌گذاری' },
      slots: { actions: '<button type="button">افزودن ردیف</button>' },
    })
    expect(wrapper.find('.form-section-heading__actions button').text()).toBe('افزودن ردیف')
  })
})
