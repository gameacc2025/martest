import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import StoreBenefitGrid from './StoreBenefitGrid.vue'
import StoreFaqList from './StoreFaqList.vue'
import StoreOfferBanner from './StoreOfferBanner.vue'
import StoreCatalogRequest from './StoreCatalogRequest.vue'
import StoreBreadcrumb from './StoreBreadcrumb.vue'
import StorePageHeading from './StorePageHeading.vue'

const RouterLinkStub = {
  props: ['to'],
  template: '<a :data-route="to?.name"><slot /></a>',
}

describe('Reference storefront widgets', () => {
  it('renders benefit cards from supplied reference data', () => {
    const wrapper = mount(StoreBenefitGrid, {
      props: { items: [{ icon: 'pi pi-shield', title: 'گارانتی اصالت', description: 'تضمین اصالت کالا' }] },
    })
    expect(wrapper.findAll('.store-benefit-card')).toHaveLength(1)
    expect(wrapper.text()).toContain('گارانتی اصالت')
    expect(wrapper.text()).toContain('تضمین اصالت کالا')
  })

  it('renders the FAQ items and opens the first answer by default', () => {
    const wrapper = mount(StoreFaqList, {
      props: { items: [
        { question: 'پرسش اول', answer: 'پاسخ اول' },
        { question: 'پرسش دوم', answer: 'پاسخ دوم' },
      ] },
    })
    expect(wrapper.findAll('details')).toHaveLength(2)
    expect(wrapper.find('details').attributes('open')).toBeDefined()
    expect(wrapper.text()).toContain('پاسخ دوم')
  })

  it('links the offer banner to the supplied catalogue destination', () => {
    const wrapper = mount(StoreOfferBanner, {
      props: { title: 'پیشنهاد ویژه', description: 'تجهیزات خرده‌فروشی', actionLabel: 'مشاهده محصولات', actionTo: { name: 'products' } },
      global: { stubs: { RouterLink: RouterLinkStub } },
    })
    expect(wrapper.text()).toContain('پیشنهاد ویژه')
    expect(wrapper.find('a').attributes('data-route')).toBe('products')
  })

  it('renders the reference breadcrumb items and route destinations', () => {
    const wrapper = mount(StoreBreadcrumb, {
      props: { items: [{ label: 'صفحه اصلی', to: { name: 'home' } }, { label: 'همه محصولات' }] },
      global: { stubs: { RouterLink: RouterLinkStub } },
    })
    expect(wrapper.find('a').attributes('data-route')).toBe('home')
    expect(wrapper.text()).toContain('همه محصولات')
  })

  it('renders the compact reference page heading', () => {
    const wrapper = mount(StorePageHeading, { props: { headingId: 'catalog-title', title: 'همه محصولات', description: 'توضیح صفحه' } })
    expect(wrapper.find('#catalog-title').text()).toBe('همه محصولات')
    expect(wrapper.text()).toContain('توضیح صفحه')
  })

  it('keeps the catalog request form disabled until a real submit service exists', () => {
    const wrapper = mount(StoreCatalogRequest, { props: { disabled: true, disabledReason: 'سرویس هنوز متصل نیست' } })
    const button = wrapper.find('button')
    expect(button.element.disabled).toBe(true)
    expect(button.attributes('title')).toBe('سرویس هنوز متصل نیست')
    expect(wrapper.find('input[type="email"]').exists()).toBe(true)
  })
})
