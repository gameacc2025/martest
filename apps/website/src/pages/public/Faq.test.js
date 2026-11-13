import { afterEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import Faq from './Faq.vue'

const faqFixtures = [
  { question: 'چه کسانی می‌توانند از بازارگاه استفاده کنند؟', answer: 'کاربران پس از ثبت‌نام و دریافت دسترسی لازم می‌توانند از امکانات حساب خود استفاده کنند.', isActive: true },
  { question: 'چطور محصول مناسب را پیدا کنم؟', answer: 'از دسته‌بندی‌ها و جستجوی محصولات استفاده کنید.', isActive: true },
  { question: 'چطور مشخصات فنی را بررسی کنم؟', answer: 'مشخصات ثبت‌شده در صفحه هر محصول قابل بررسی است.', isActive: true },
  { question: 'آیا می‌توان چند پیشنهاد را مقایسه کرد؟', answer: 'پیشنهادهای دریافتی را در فضای استعلام خود بررسی کنید.', isActive: true },
  { question: 'چطور با تأمین‌کننده ارتباط بگیرم؟', answer: 'از مسیرهای ارتباطی درج‌شده در پلتفرم استفاده کنید.', isActive: true },
  { question: 'چطور وضعیت درخواست را پیگیری کنم؟', answer: 'وضعیت درخواست از بخش استعلام‌های حساب قابل مشاهده است.', isActive: true },
  { question: 'آیا خرید آنلاین در دسترس است؟', answer: 'نسخه فعلی بر فرایند B2B و استعلام متمرکز است و وعده خرید اقساطی یا رهگیری سفارش نمی‌دهد.', isActive: true },
  { question: 'برای پرسش‌های دیگر چه کنم؟', answer: 'برای دریافت راهنمایی بیشتر با پشتیبانی تماس بگیرید.', isActive: true },
]
vi.mock('../../stores/cms', () => ({
  useCmsStore: () => ({
    activeFaqs: faqFixtures,
    faqCategories: [],
    fetchFaqs: vi.fn().mockResolvedValue(faqFixtures),
    fetchFaqCategories: vi.fn().mockResolvedValue([]),
  }),
}))

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

  it('allows only one answer to remain open at a time', async () => {
    wrapper = mountFaq()

    await wrapper.find('#faq-question-0').trigger('click')
    await wrapper.find('#faq-question-2').trigger('click')

    expect(wrapper.find('#faq-question-0').attributes('aria-expanded')).toBe('false')
    expect(wrapper.find('#faq-question-2').attributes('aria-expanded')).toBe('true')
    expect(wrapper.find('#faq-answer-0').exists()).toBe(false)
    expect(wrapper.find('#faq-answer-2').exists()).toBe(true)
    expect(wrapper.findAll('.faq-item--active')).toHaveLength(1)

    await wrapper.find('#faq-question-2').trigger('click')

    expect(wrapper.find('#faq-question-2').attributes('aria-expanded')).toBe('false')
    expect(wrapper.find('#faq-answer-2').exists()).toBe(false)
    expect(wrapper.findAll('.faq-item--active')).toHaveLength(0)
  })

  it('does not promise unsupported checkout, installment, return, or order-tracking flows', async () => {
    wrapper = mountFaq()
    await wrapper.find('#faq-question-6').trigger('click')
    const text = wrapper.text()

    expect(text).not.toContain('خرید اقساطی')
    expect(text).not.toContain('درخواست بازگشت کالا')
    expect(text).not.toContain('سفارشات من')
    expect(text).toContain('نسخه فعلی بر فرایند B2B و استعلام متمرکز است')
  })

  it('links support questions to the existing contact route', async () => {
    wrapper = mountFaq()
    await wrapper.find('#faq-question-7').trigger('click')

    expect(wrapper.find('.faq-support a').attributes('href')).toBe('contact')
  })
})
