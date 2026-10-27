import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, shallowMount } from '@vue/test-utils'
import Notifications from './Notifications.vue'
import { apiGet, apiGetPaginated, apiPatch, apiPost } from '@telecom/shared-core/http/apiClient'

vi.mock('@telecom/shared-core/http/apiClient', () => ({
  apiGet: vi.fn(),
  apiGetPaginated: vi.fn(),
  apiPatch: vi.fn(),
  apiDelete: vi.fn(),
  apiPost: vi.fn(),
}))

vi.mock('primevue/usetoast', () => ({
  useToast: () => ({ add: vi.fn() }),
}))

describe('Website notification inbox', () => {
  let wrapper

  beforeEach(() => {
    vi.clearAllMocks()
    apiGet.mockResolvedValue({ count: 13 })
    apiPatch.mockResolvedValue({ success: true })
    apiPost.mockResolvedValue({ success: true, count: 1 })
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
  it('filters the unread folder without changing the independent folder counts', async () => {
    wrapper = shallowMount(Notifications, {
      global: { stubs: { 'router-link': { template: '<a><slot /></a>' } } },
    })
    await flushPromises()

    const folderButtons = wrapper.findAll('.folder-link:not(.category-link)')
    const countsBefore = folderButtons.map((button) => button.find('b').text())
    expect(folderButtons.map((button) => button.text())).toEqual([
      expect.stringContaining('همه پیام‌ها'),
      expect.stringContaining('خوانده‌نشده'),
      expect.stringContaining('خوانده‌شده'),
    ])

    await folderButtons[1].trigger('click')
    await flushPromises()

    expect(apiGetPaginated).toHaveBeenCalledWith('/settings/notifications?page=1&limit=20&unreadOnly=true')
    const countsAfter = wrapper.findAll('.folder-link:not(.category-link)').map((button) => button.find('b').text())
    expect(countsAfter).toEqual(countsBefore)
  })

  it('does not mark a notification as read just because it is selected on initial load', async () => {
    wrapper = shallowMount(Notifications, {
      global: { stubs: { 'router-link': { template: '<a><slot /></a>' } } },
    })
    await flushPromises()
    expect(apiPatch).not.toHaveBeenCalled()
    expect(wrapper.findAll('.message-row')[0].classes()).toContain('unread')
    expect(wrapper.findAll('.message-row')[0].find('.unread-dot').exists()).toBe(true)
    expect(apiGet).toHaveBeenCalledWith('/settings/notifications/unread-count')
  })

  it('marks a message read only on double-click, not on a single click', async () => {
    wrapper = shallowMount(Notifications, {
      global: { stubs: { 'router-link': { template: '<a><slot /></a>' } } },
    })

    await flushPromises()
    await wrapper.findAll('.message-row')[1].trigger('click')
    await flushPromises()
    expect(apiPatch).not.toHaveBeenCalledWith('/settings/notifications/7/read-state', { isRead: true })
    expect(wrapper.findAll('.message-row')[1].classes()).toContain('unread')

    await wrapper.findAll('.message-row')[1].trigger('dblclick')
    await flushPromises()
    expect(apiPatch).toHaveBeenCalledWith('/settings/notifications/7/read-state', { isRead: true })
    expect(wrapper.findAll('.message-row')[1].classes()).not.toContain('unread')
  })

  it('keeps a notification unread when the read request fails', async () => {
    wrapper = shallowMount(Notifications, {
      global: { stubs: { 'router-link': { template: '<a><slot /></a>' } } },
    })

    await flushPromises()
    apiPatch.mockRejectedValueOnce(new Error('network failure'))
    await wrapper.findAll('.message-row')[1].trigger('dblclick')
    await flushPromises()

    expect(wrapper.findAll('.message-row')[1].classes()).toContain('unread')
  })
  it('sends selected notification IDs to the bulk read-state endpoint', async () => {
    wrapper = shallowMount(Notifications, {
      global: { stubs: { 'router-link': { template: '<a><slot /></a>' } } },
    })
    await flushPromises()

    await wrapper.findAll('.row-checkbox')[1].setValue(true)
    await flushPromises()
    expect(wrapper.find('.bulk-actions').exists()).toBe(true)
    const markReadButton = wrapper.findComponent('[label="خوانده‌شده"]')
    expect(markReadButton.exists()).toBe(true)
    markReadButton.vm.$emit('click')
    await flushPromises()

    expect(apiPost).toHaveBeenCalledWith('/settings/notifications/bulk-read-state', {
      ids: [7],
      isRead: true,
    })
  })

})
