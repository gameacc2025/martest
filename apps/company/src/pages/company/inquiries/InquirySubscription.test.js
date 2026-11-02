import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'

const { apiGet, apiPost, routeState } = vi.hoisted(() => ({
  apiGet: vi.fn(),
  apiPost: vi.fn(),
  routeState: { query: {} },
}))

vi.mock('vue-router', () => ({
  useRoute: () => routeState,
}))

vi.mock('@telecom/shared-core/http/apiClient', () => ({
  apiGet,
  apiPost,
}))

import { endpoints } from '@telecom/api-client'
import InquirySubscription from './InquirySubscription.vue'

const plan = {
  id: 5,
  name: 'اشتراک پایه',
  description: 'طرح ماهانه شرکت',
  durationDays: 30,
  price: 2500000,
  currency: 'IRR',
  inquiriesPerPeriod: 10,
  responsesPerPeriod: 20,
  internalMessagesPerPeriod: 30,
  smsPerPeriod: 5,
  isActive: true,
}

describe('Company inquiry subscription workspace', () => {
  let wrapper

  beforeEach(() => {
    vi.clearAllMocks()
    routeState.query = {}
    apiGet.mockImplementation((url) => {
      if (url === endpoints.inquirySubscriptions.plans) return Promise.resolve({ data: [plan] })
      if (url === endpoints.inquirySubscriptions.mine) {
        return Promise.resolve({
          data: {
            subscriptions: [],
            quota: {
              quotas: {
                INQUIRY_CREATE: { limit: 10, used: 3, remaining: 7 },
              },
            },
          },
        })
      }
      return Promise.resolve({ data: {} })
    })
    apiPost.mockResolvedValue({ data: { success: true } })
  })

  afterEach(() => {
    wrapper?.unmount()
    wrapper = undefined
  })

  function mountPage() {
    wrapper = mount(InquirySubscription, {
      global: {
        stubs: {
          WorkspacePageHeading: {
            props: ['title', 'description', 'headingId'],
            template: '<header><h1 :id="headingId">{{ title }}</h1><p>{{ description }}</p><slot name="actions" /></header>',
          },
        },
      },
    })
    return wrapper
  }

  it('loads the real plan and exposes quota usage as an accessible progress indicator', async () => {
    mountPage()
    await flushPromises()

    expect(apiGet).toHaveBeenCalledWith(endpoints.inquirySubscriptions.plans)
    expect(apiGet).toHaveBeenCalledWith(endpoints.inquirySubscriptions.mine)
    expect(wrapper.find('#company-inquiry-subscription-title').text()).toBe('اشتراک استعلام شرکت')
    expect(wrapper.find('.plan-card').text()).toContain('اشتراک پایه')

    const meter = wrapper.find('[role="progressbar"]')
    expect(meter.attributes('aria-label')).toContain('ثبت استعلام')
    expect(meter.attributes('aria-valuemax')).toBe('10')
    expect(meter.attributes('aria-valuenow')).toBe('3')
    expect(meter.attributes('aria-valuetext')).toContain('۳ مصرف‌شده')
  })

  it('requires explicit plan selection before submitting a subscription request', async () => {
    mountPage()
    await flushPromises()

    const action = wrapper.find('.plan-action')
    expect(action.attributes('aria-pressed')).toBe('false')
    await action.trigger('click')
    await flushPromises()

    expect(action.attributes('aria-pressed')).toBe('true')
    expect(wrapper.find('.reference input').exists()).toBe(true)
    expect(apiPost).not.toHaveBeenCalled()

    await action.trigger('click')
    await flushPromises()

    expect(apiPost).toHaveBeenCalledWith(
      endpoints.inquirySubscriptions.request,
      expect.objectContaining({ planId: plan.id }),
    )
    expect(wrapper.find('[role="status"]').text()).toContain('درخواست ثبت شد')
  })
})
