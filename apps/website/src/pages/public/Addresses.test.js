import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'

const { apiGet, apiPost, apiPatch, apiDelete, routerPush } = vi.hoisted(() => ({
  apiGet: vi.fn(),
  apiPost: vi.fn(),
  apiPatch: vi.fn(),
  apiDelete: vi.fn(),
  routerPush: vi.fn(),
}))

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: routerPush }),
}))

vi.mock('@telecom/shared-core/http/apiClient', () => ({
  apiGet,
  apiPost,
  apiPatch,
  apiDelete,
}))

import { endpoints } from '@telecom/api-client'
import Addresses from './Addresses.vue'

const addressRows = [
  {
    id: 1,
    label: 'دفتر مرکزی',
    recipientName: 'مریم احمدی',
    recipientPhone: '09120000000',
    province: 'تهران',
    city: 'تهران',
    addressLine: 'خیابان نمونه، پلاک ۱۰',
    postalCode: '1234567890',
    isDefault: true,
  },
  {
    id: 2,
    label: 'انبار',
    recipientName: 'علی رضایی',
    recipientPhone: '09121111111',
    province: 'البرز',
    city: 'کرج',
    addressLine: 'بلوار نمونه، پلاک ۲۰',
    postalCode: '',
    isDefault: false,
  },
]

describe('Website address book workspace', () => {
  let wrapper

  beforeEach(() => {
    vi.clearAllMocks()
    apiGet.mockResolvedValue(addressRows)
    apiPost.mockResolvedValue({ success: true })
    apiPatch.mockResolvedValue({ success: true })
    apiDelete.mockResolvedValue({ success: true })
  })

  afterEach(() => {
    wrapper?.unmount()
    wrapper = undefined
  })

  function mountPage() {
    wrapper = mount(Addresses, {
      global: {
        stubs: {
          WorkspacePageHeading: {
            props: ['title', 'description', 'headingId'],
            template: '<header><h1 :id="headingId">{{ title }}</h1><slot name="actions" /></header>',
          },
        },
      },
    })
    return wrapper
  }

  it('renders API-backed addresses and identifies the default address', async () => {
    mountPage()
    await flushPromises()

    expect(apiGet).toHaveBeenCalledWith(endpoints.addresses.list)
    expect(wrapper.findAll('.address-card')).toHaveLength(2)
    expect(wrapper.text()).toContain('دفتر مرکزی')
    expect(wrapper.text()).toContain('آدرس پیش‌فرض')
    expect(wrapper.text()).toContain('خیابان نمونه، پلاک ۱۰')
    expect(wrapper.findAll('.address-pin i')).toHaveLength(2)
    expect(wrapper.findAll('.make-default')).toHaveLength(1)
  })

  it('opens an associated-label address form from the add action', async () => {
    mountPage()
    await flushPromises()

    await wrapper.findAll('button').find(button => button.text().includes('افزودن آدرس جدید')).trigger('click')

    expect(wrapper.find('.address-form').exists()).toBe(true)
    const recipientLabel = wrapper.findAll('.address-form label').find(label => label.text().includes('نام تحویل‌گیرنده'))
    expect(recipientLabel).toBeTruthy()
    expect(recipientLabel.find('input[required]').exists()).toBe(true)
    expect(wrapper.find('.default-choice').text()).toContain('آدرس پیش‌فرض')
  })

  it('shows an intentional empty state when the API returns no addresses', async () => {
    apiGet.mockResolvedValueOnce([])
    mountPage()
    await flushPromises()

    expect(wrapper.find('.empty-state').exists()).toBe(true)
    expect(wrapper.find('.empty-icon .pi-map-marker').exists()).toBe(true)
    expect(wrapper.text()).toContain('هنوز آدرسی ثبت نکرده‌اید')
  })
})
