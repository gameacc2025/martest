import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import StoreProductCard from './StoreProductCard.vue'

const RouterLinkStub = {
  props: ['to'],
  template: '<a :data-route="to?.name" :data-product-id="to?.params?.id"><slot /></a>',
}

const baseProduct = {
  id: 42,
  title: 'مودم فیبر نوری',
  brand: 'FiberPro',
  model: 'XG-1200',
  sku: 'FP-XG1200',
  company: { name: 'تأمین‌کننده آزمایشی', isVerified: true },
  prices: [{ price: 1200000 }],
  images: [{ isPrimary: true, url: '/product-42.png' }],
}

const mountCard = (props = {}, slots = {}) => mount(StoreProductCard, {
  props: { product: baseProduct, priceLabel: '۱٬۲۰۰٬۰۰۰ ریال', ...props },
  slots,
  global: { stubs: { RouterLink: RouterLinkStub } },
})

describe('StoreProductCard', () => {
  it('renders product identity, brand, model, SKU and the destination route', () => {
    const wrapper = mountCard({ to: { name: 'product-details', params: { id: 42 } } })
    expect(wrapper.find('.product-card__name').text()).toBe('مودم فیبر نوری')
    expect(wrapper.find('.product-card__brand').text()).toBe('FiberPro')
    expect(wrapper.find('.product-meta').text()).toContain('XG-1200')
    expect(wrapper.find('.product-meta').text()).toContain('FP-XG1200')
    expect(wrapper.find('.product-card__main').attributes('data-route')).toBe('product-details')
    expect(wrapper.find('.product-card__main').attributes('data-product-id')).toBe('42')
  })

  it('shows the verified-supplier badge only when the caller says the company is verified', () => {
    expect(mountCard({ verified: true }).find('.product-verified').exists()).toBe(true)
    expect(mountCard({ verified: false }).find('.product-verified').exists()).toBe(false)
  })

  it('derives an honest price caption and keeps the caller-provided price label', () => {
    const priced = mountCard()
    expect(priced.find('.product-card-price small').text()).toBe('شروع قیمت از')
    expect(priced.find('.product-card-price b').text()).toBe('۱٬۲۰۰٬۰۰۰ ریال')

    const noPrice = mountCard({ product: { ...baseProduct, prices: [] }, priceLabel: 'استعلام قیمت' })
    expect(noPrice.find('.product-card-price small').text()).toBe('قیمت')
    expect(noPrice.find('.product-card-price b').text()).toBe('استعلام قیمت')
  })

  it('renders the sales-mode chip supplied by the page', () => {
    const wrapper = mountCard({ mode: { kind: 'fixed', label: 'فروش خرده‌فروشی' } })
    expect(wrapper.find('.product-card__mode').text()).toBe('فروش خرده‌فروشی')
    expect(wrapper.find('.product-card__mode').classes()).toContain('product-card__mode--fixed')
  })

  it('never invents ranking, discounts or sales volume', () => {
    const wrapper = mountCard()
    expect(wrapper.find('.store-product-card__rank').exists()).toBe(false)
    expect(wrapper.text()).not.toContain('تخفیف')
    expect(wrapper.text()).not.toContain('فروش‌رفته')

    const ranked = mountCard({ rank: 3 })
    expect(ranked.find('.store-product-card__rank').text()).toBe('#۳')
  })

  it('falls back to an explicit action slot and stable footer hooks', () => {
    const wrapper = mountCard({ to: { name: 'product-details', params: { id: 42 } } }, {
      action: '<a class="custom-action">مشاهده محصول</a>',
    })
    expect(wrapper.find('.product-card-footer').exists()).toBe(true)
    expect(wrapper.find('.product-card-footer .custom-action').text()).toBe('مشاهده محصول')
  })

  it('falls back to a placeholder when the API provides no usable image', () => {
    const wrapper = mountCard({ product: { ...baseProduct, images: [] } })
    expect(wrapper.find('.product-card__media img').exists()).toBe(false)
    expect(wrapper.find('.product-card__media .pi-box').exists()).toBe(true)
  })
})