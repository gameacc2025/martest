import { afterEach, describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import Faq from './Faq.vue'

const mountFaq = () => mount(Faq, {
  global: {
    stubs: {
      RouterLink: {
        props: ['to'],
        template: '<a :href="typeof to === \'string\' ? to : to.name"><slot /></a>',
      },
    },
  },
})

describe('Website FAQ', () => {
  let wrapper

  afterEach(() => {
    wrapper?.unmount()
    wrapper = undefined
  })

  it('renders the B2B inquiry questions and shared design-system page structure', () => {
    wrapper = mountFaq()

    expect(wrapper.find('#faq-title').text()).toBe('سوالات متداول')
    expect(wrapper.findAll('.faq-question')).toHaveLength(8)
    expect(wrapper.find('.faq-hero').exists()).toBe(true)
    expect(wrapper.find('.faq-support').text()).toContain('تماس با ما')
  })

  it('toggles answers with accessible expanded and controlled-region semantics', async () => {
    wrapper = mountFaq()
    const question = wrapper.find('#faq-question-1')

    expect(question.attributes('aria-expanded')).toBe('false')
    expect(question.attributes('aria-controls')).toBe('faq-answer-1')
    expect(wrapper.find('#faq-answer-1').exists()).toBe(false)

    await question.trigger('click')

    expect(question.attributes('aria-expanded')).toBe('true')
    expect(wrapper.find('#faq-answer-1').attributes('role')).toBe('region')
    expect(wrapper.find('#faq-answer-1').text()).toContain('دسترسی لازم')
  })

  it('keeps multiple answers independently expandable', async () => {
    wrapper = mountFaq()

    await wrapper.find('#faq-question-0').trigger('click')
    await wrapper.find('#faq-question-2').trigger('click')

    expect(wrapper.find('#faq-question-0').attributes('aria-expanded')).toBe('true')
    expect(wrapper.find('#faq-question-2').attributes('aria-expanded')).toBe('true')

    await wrapper.find('#faq-question-0').trigger('click')

    expect(wrapper.find('#faq-question-0').attributes('aria-expanded')).toBe('false')
    expect(wrapper.find('#faq-question-2').attributes('aria-expanded')).toBe('true')
  })

  it('does not promise unsupported checkout, installment, return, or order-tracking flows', () => {
    wrapper = mountFaq()
    const text = wrapper.text()

    expect(text).not.toContain('خرید اقساطی')
    expect(text).not.toContain('درخواست بازگشت کالا')
    expect(text).not.toContain('سفارشات من')
    expect(text).toContain('نسخه فعلی بر فرایند B2B و استعلام متمرکز است')
  })

  it('links support questions to the existing contact route', async () => {
    wrapper = mountFaq()
    await wrapper.find('#faq-question-7').trigger('click')

    expect(wrapper.find('#faq-answer-7 a').attributes('href')).toBe('contact')
    expect(wrapper.find('.faq-support a').attributes('href')).toBe('contact')
  })
})
