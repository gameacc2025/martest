import { afterEach, describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import Terms from './Terms.vue'

const mountTerms = () => mount(Terms, {
  global: {
    stubs: {
      RouterLink: {
        props: ['to'],
        template: '<a :href="typeof to === \'string\' ? to : to.name"><slot /></a>',
      },
    },
  },
})

describe('Website Terms and Privacy page', () => {
  let wrapper

  afterEach(() => {
    wrapper?.unmount()
    wrapper = undefined
  })

  it('renders the legal page using the shared design system and RTL semantics', () => {
    wrapper = mountTerms()

    expect(wrapper.find('main[dir="rtl"][aria-labelledby="terms-title"]').exists()).toBe(true)
    expect(wrapper.find('#terms-title').text()).toBe('قوانین و حریم خصوصی')
    expect(wrapper.findAll('.terms-section')).toHaveLength(4)
    expect(wrapper.find('.terms-breadcrumb a').attributes('href')).toBe('home')
  })

  it('preserves the existing terms and privacy sections and their meaning', () => {
    wrapper = mountTerms()
    const content = wrapper.text()

    for (const phrase of [
      'با استفاده از خدمات ما، شما موافقت خود را با شرایط و قوانین زیر اعلام میکنید.',
      'شما مسئول حفظ محرمانگی اطلاعات حساب کاربری خود هستید',
      'این اطلاعات شامل نام، ایمیل، شماره تلفن و سایر اطلاعات تماس میباشد.',
      'ما اطلاعات شما را به اشخاص ثالث بدون رضایت شما منتقل نخواهیم کرد',
      'هیچ روش انتقال اطلاعات در اینترنت 100% امن نیست',
      'توصیه میکنیم به طور منظم این صفحه را بررسی کنید',
    ]) {
      expect(content).toContain(phrase)
    }
  })

  it('does not introduce unsupported legal, security, or compliance claims', () => {
    wrapper = mountTerms()
    const content = wrapper.text()

    expect(content).not.toContain('گواهینامه امنیتی')
    expect(content).not.toContain('ذخیره‌سازی اطلاعات تا')
    expect(content).not.toContain('مطابق GDPR')
  })

  it('uses semantic section headings and token-based styling', () => {
    wrapper = mountTerms()

    expect(wrapper.find('#terms-usage').element.tagName).toBe('H2')
    expect(wrapper.find('#terms-privacy').element.tagName).toBe('H2')
    expect(wrapper.find('.terms-hero.ds-card').exists()).toBe(true)
    expect(wrapper.find('.terms-section.ds-card').exists()).toBe(true)
  })
})
