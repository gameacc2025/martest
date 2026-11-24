import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, shallowMount } from '@vue/test-utils'

const mocks = vi.hoisted(() => ({
  getStats: vi.fn(),
  listInquiries: vi.fn(),
  myProducts: vi.fn(),
  routerPush: vi.fn(),
  toast: { add: vi.fn() },
  company: { id: 11, name: 'شرکت آزمایشی' },
}))

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: mocks.routerPush }),
}))
vi.mock('primevue/usetoast', () => ({
  useToast: () => mocks.toast,
}))
vi.mock('@telecom/api-client', () => ({
  inquiriesApi: { getStats: mocks.getStats, list: mocks.listInquiries },
  productsApi: { myProducts: mocks.myProducts },
}))
vi.mock('../../../stores/auth', () => ({
  useAuthStore: () => ({ company: mocks.company }),
}))

import CompanyDashboard from './CompanyDashboard.vue'

const emptyList = () => ({ data: { data: [], meta: { total: 0 } } })
const emptyStats = () => ({
  data: {
    data: {
      received: { total: 0, byStatus: { SUBMITTED: 0, OPEN: 0, CLOSED: 0, COMPLETED: 0, EXPIRED: 0 } },
      responses: { total: 0, awaiting: 0, successRate: 0 },
      recentInquiries: [],
      recentResponses: [],
    },
  },
})

function mountDashboard() {
  return shallowMount(CompanyDashboard, {
    global: {
      stubs: {
        RouterLink: true,
      },
    },
  })
}

describe('CompanyDashboard retryable data failures', () => {
  let wrapper

  beforeEach(() => {
    mocks.getStats.mockReset().mockRejectedValueOnce(new Error('stats unavailable')).mockResolvedValue(emptyStats())
    mocks.listInquiries.mockReset().mockRejectedValueOnce(new Error('inquiries unavailable')).mockResolvedValue(emptyList())
    mocks.myProducts.mockReset().mockRejectedValue(new Error('products unavailable'))
    mocks.routerPush.mockReset()
    mocks.toast.add.mockReset()
  })

  it('shows an accessible retry action and reloads all failed dashboard data', async () => {
    wrapper = mountDashboard()
    await flushPromises()

    expect(wrapper.get('.cd-dashboard-retry[role="alert"]').text()).toContain('تلاش دوباره')
    expect(mocks.getStats).toHaveBeenCalledTimes(1)
    expect(mocks.listInquiries).toHaveBeenCalledTimes(1)
    expect(mocks.myProducts).toHaveBeenCalledTimes(8)

    mocks.myProducts.mockResolvedValue(emptyList())
    await wrapper.get('.cd-dashboard-retry button').trigger('click')
    await flushPromises()

    expect(mocks.getStats).toHaveBeenCalledTimes(2)
    expect(mocks.listInquiries).toHaveBeenCalledTimes(2)
    expect(mocks.myProducts).toHaveBeenCalledTimes(16)
    expect(wrapper.find('.cd-dashboard-retry').exists()).toBe(false)
  })

  it('does not expose a retry banner when all dashboard requests succeed', async () => {
    mocks.getStats.mockReset().mockResolvedValue(emptyStats())
    mocks.listInquiries.mockReset().mockResolvedValue(emptyList())
    mocks.myProducts.mockReset().mockResolvedValue(emptyList())

    wrapper = mountDashboard()
    await flushPromises()

    expect(wrapper.find('.cd-dashboard-retry').exists()).toBe(false)
  })
})
