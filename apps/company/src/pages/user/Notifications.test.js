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

describe('Company notification inbox', () => {
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
    expect(wrapper.findAll('.row-sender')).toHaveLength(3)
    expect(wrapper.findAll('.row-subject')).toHaveLength(3)
    expect(wrapper.find('.row-sender').text()).toBe('سامانه مخابرات')
    expect(wrapper.find('.row-subject').text()).toContain('تست1')
    expect(wrapper.find('input[name="notification-search"]').attributes('autocomplete')).toBe('off')
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
  it('keeps read-state filters out of the two fixed mailbox folders', async () => {
    wrapper = shallowMount(Notifications, {
      global: { stubs: { 'router-link': { template: '<a><slot /></a>' } } },
    })
    await flushPromises()

    const folderLabels = wrapper.findAll('button[data-folder-id]').map(button => button.text())
    expect(folderLabels.some(label => label.includes('خوانده‌نشده'))).toBe(false)
    expect(folderLabels.some(label => label.includes('خوانده‌شده'))).toBe(false)
    expect(folderLabels.some(label => label.includes('همه پیام‌ها'))).toBe(false)
    expect(wrapper.findAll('.category-link').length).toBeGreaterThan(0)
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

  it('uses a native keyboard-operable button for opening each message', async () => {
    wrapper = shallowMount(Notifications, {
      global: { stubs: { 'router-link': { template: '<a><slot /></a>' } } },
    })
    await flushPromises()

    const openButton = wrapper.find('.message-row-open')
    expect(openButton.element.tagName).toBe('BUTTON')
    expect(openButton.attributes('type')).toBe('button')
    expect(openButton.attributes('aria-expanded')).toBe('false')
    await openButton.trigger('click')
    expect(openButton.attributes('aria-expanded')).toBe('true')
    expect(wrapper.find('.reading-overlay').exists()).toBe(true)
    expect(apiPatch).not.toHaveBeenCalled()
  })

  it('marks a message read only on double-click, not on a single click', async () => {
    wrapper = shallowMount(Notifications, {
      global: { stubs: { 'router-link': { template: '<a><slot /></a>' } } },
    })

    await flushPromises()
    await wrapper.findAll('.message-row-open')[1].trigger('click')
    await flushPromises()
    expect(apiPatch).not.toHaveBeenCalledWith('/settings/notifications/7/read-state', { isRead: true })
    expect(wrapper.findAll('.message-row')[1].classes()).toContain('unread')

    await wrapper.findAll('.message-row-open')[1].trigger('dblclick')
    await flushPromises()
    expect(apiPatch).toHaveBeenCalledWith('/settings/notifications/7/read-state', { isRead: true })
    expect(wrapper.findAll('.message-row')[1].classes()).not.toContain('unread')
  })

  it('sends selected notification IDs to the bulk read-state endpoint', async () => {
    wrapper = shallowMount(Notifications, {
      global: { stubs: { 'router-link': { template: '<a><slot /></a>' } } },
    })
    await flushPromises()

    await wrapper.findAll('.row-checkbox')[1].setValue(true)
    await flushPromises()
    expect(wrapper.find('.bulk-actions').exists()).toBe(true)
    const markReadButton = wrapper.findComponent('[aria-label="خوانده‌شده"]')
    expect(markReadButton.exists()).toBe(true)
    markReadButton.vm.$emit('click')
    await flushPromises()

    expect(apiPost).toHaveBeenCalledWith('/settings/notifications/bulk-read-state', {
      ids: [7],
      isRead: true,
    })
  })


  it('closes the right-side reading drawer without changing notification state', async () => {
    wrapper = shallowMount(Notifications, {
      global: { stubs: { 'router-link': { template: '<a><slot /></a>' } } },
    })
    await flushPromises()
    await wrapper.find('.message-row-open').trigger('click')
    expect(wrapper.find('.reading-overlay').exists()).toBe(true)
    const closeButton = wrapper.findComponent('[aria-label="بستن جزئیات اعلان"]')
    expect(closeButton.exists()).toBe(true)
    closeButton.vm.$emit('click')
    await flushPromises()
    expect(wrapper.find('.reading-overlay').exists()).toBe(false)
    expect(apiPatch).not.toHaveBeenCalled()
  })

  it('renders the email-client two-column inbox with folders and an integrated search toolbar', async () => {
    wrapper = shallowMount(Notifications, {
      global: { stubs: { 'router-link': { template: '<a><slot /></a>' } } },
    })
    await flushPromises()
    expect(wrapper.find('.mail-sidebar').exists()).toBe(true)
    expect(wrapper.find('.message-list-panel').exists()).toBe(true)
    expect(wrapper.find('.list-toolbar').exists()).toBe(true)
    expect(wrapper.find('.list-search').exists()).toBe(true)
    expect(wrapper.find('.mail-toolbar').exists()).toBe(false)
  })
  it('keeps the mail inbox RTL and renders compact icon-only header actions', async () => {
    wrapper = shallowMount(Notifications, {
      global: { stubs: { 'router-link': { template: '<a v-bind="$attrs"><slot /></a>' } } },
    })
    await flushPromises()

    expect(wrapper.find('.mail-page').attributes('dir')).toBe('rtl')
    expect(wrapper.find('.header-actions .pi-envelope').exists()).toBe(true)
    expect(wrapper.find('.header-actions .pi-cog').exists()).toBe(true)
    expect(wrapper.find('.header-actions .settings-link').exists()).toBe(false)
    expect(wrapper.find('.list-search input').exists()).toBe(true)
  })


  it('renders only the shared layout breadcrumb and keeps the mailbox heading', async () => {
    wrapper = shallowMount(Notifications, {
      global: { stubs: { 'router-link': { template: '<a><slot /></a>' } } },
    })
    await flushPromises()
    expect(wrapper.find('.mail-header h1').text()).toBe('صندوق اعلان‌ها')
    expect(wrapper.find('.mail-breadcrumb').exists()).toBe(false)
    expect(wrapper.find('.page-header-pro').exists()).toBe(false)
  })
})
