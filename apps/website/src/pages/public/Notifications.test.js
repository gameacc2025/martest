import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, shallowMount } from '@vue/test-utils'
import Notifications from './Notifications.vue'
import { apiGet, apiGetPaginated } from '@telecom/shared-core/http/apiClient'

vi.mock('@telecom/shared-core/http/apiClient', () => ({
  apiGet: vi.fn(),
  apiGetPaginated: vi.fn(),
  apiPatch: vi.fn(),
  apiDelete: vi.fn(),
}))

vi.mock('primevue/usetoast', () => ({
  useToast: () => ({ add: vi.fn() }),
}))

describe('Website notification inbox', () => {
  let wrapper

  beforeEach(() => {
    vi.clearAllMocks()
    apiGet.mockResolvedValue({ count: 13 })
    apiGetPaginated.mockResolvedValue({
      data: [
        {
          id: 26,
          userId: 4,
          type: 'ADMIN_ANNOUNCEMENT',
          data: { source: 'admin' },
          title: 'تست1',
          message: 'تست1',
          isRead: false,
          createdAt: '2026-10-25T06:40:52.060Z',
        },
        {
          id: 7,
          userId: 4,
          type: null,
          data: null,
          title: 'وضعیت محصول تغییر کرد',
          message: 'محصول «مودم فیبر نوری GPON» برای بررسی کارشناسی ارسال شد.',
          isRead: false,
          createdAt: '2026-10-24T16:51:12.496Z',
        },
        {
          id: 8,
          userId: 4,
          type: null,
          data: null,
          title: 'پاسخ جدید به استعلام',
          message: 'یک شرکت تأمین‌کننده به استعلام تجهیزات شبکه شما پاسخ داده است.',
          isRead: false,
          createdAt: '2026-10-24T16:26:12.496Z',
        },
      ],
      meta: { page: 1, limit: 20, total: 14, totalPages: 1 },
    })
  })

  afterEach(() => {
    wrapper?.unmount()
    wrapper = undefined
  })

  it('renders messages from the paginated response, including legacy null types', async () => {
    wrapper = shallowMount(Notifications, {
      global: {
        stubs: {
          'router-link': { template: '<a><slot /></a>' },
        },
      },
    })

    await flushPromises()

    expect(apiGetPaginated).toHaveBeenCalledWith('/settings/notifications?page=1&limit=20')
    expect(wrapper.findAll('.message-row')).toHaveLength(3)
    expect(wrapper.text()).toContain('تست1')
    expect(wrapper.text()).toContain('وضعیت محصول تغییر کرد')
    expect(wrapper.text()).toContain('پاسخ جدید به استعلام')
    expect(wrapper.text()).toContain('اطلاعیه‌ها')
    expect(wrapper.text()).toContain('محصولات')
    expect(wrapper.text()).toContain('استعلام‌ها')

    // Legacy type:null notifications must be categorized by their text,
    // not swallowed by the generic "other" category.
    const categoryButtons = wrapper.findAll('.category-link')
    expect(categoryButtons.map(button => button.text())).toContain('محصولات1')
    await categoryButtons.find(button => button.text().includes('محصولات')).trigger('click')
    expect(wrapper.findAll('.message-row')).toHaveLength(1)
    expect(wrapper.find('.message-row').text()).toContain('وضعیت محصول تغییر کرد')
  })
})
