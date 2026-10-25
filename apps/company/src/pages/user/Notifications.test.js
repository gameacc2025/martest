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

describe('Company notification inbox', () => {
  let wrapper

  beforeEach(() => {
    vi.clearAllMocks()
    apiGet.mockResolvedValue({ count: 1 })
    apiGetPaginated.mockResolvedValue({
      data: [{
        id: 101,
        type: 'PRODUCT_APPROVED',
        title: 'محصول تأیید شد',
        message: 'محصول شما پس از بررسی تأیید شد.',
        isRead: false,
        createdAt: '2026-10-24T12:00:00.000Z',
      }],
      meta: { page: 1, limit: 20, total: 1, totalPages: 1 },
    })
  })

  afterEach(() => {
    wrapper?.unmount()
    wrapper = undefined
  })

  it('renders notification rows from the paginated API response', async () => {
    wrapper = shallowMount(Notifications, {
      global: {
        stubs: {
          'router-link': { template: '<a><slot /></a>' },
        },
      },
    })

    await flushPromises()

    expect(apiGetPaginated).toHaveBeenCalledWith('/settings/notifications?page=1&limit=20')
    expect(wrapper.findAll('.message-row')).toHaveLength(1)
    expect(wrapper.find('.message-row').text()).toContain('محصول تأیید شد')
    expect(wrapper.text()).toContain('محصول شما پس از بررسی تأیید شد.')
  })
})
