import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  list: vi.fn(),
  toastAdd: vi.fn(),
  hasPermission: vi.fn(() => true),
}))

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: mocks.push }),
  useRoute: () => ({ query: {} }),
}))

vi.mock('primevue/usetoast', () => ({
  useToast: () => ({ add: mocks.toastAdd }),
}))

vi.mock('@telecom/api-client', () => ({
  inquiriesApi: { list: mocks.list },
}))

vi.mock('../../../stores/auth', () => ({
  useAuthStore: () => ({ hasPermission: mocks.hasPermission }),
}))

import InquiryList from './InquiryList.vue'

describe('Company InquiryList', () => {
  let wrapper

  beforeEach(() => {
    vi.clearAllMocks()
    mocks.hasPermission.mockReturnValue(true)
    mocks.list.mockResolvedValue({
      data: [],
      meta: { page: 1, limit: 10, total: 0 },
    })
  })

  afterEach(() => {
    wrapper?.unmount()
    wrapper = undefined
  })

  function mountPage() {
    return mount(InquiryList, {
      global: {
        stubs: {
          WorkspacePageHeading: true,
          Toolbar: true,
          Tabs: { template: '<div class="p-tabs"><slot /></div>' },
          TabList: { template: '<div><slot /></div>' },
          Tab: { template: '<button><slot /></button>' },
          TabPanels: { template: '<div><slot /></div>' },
          TabPanel: { template: '<section><slot /></section>' },
          DataTable: { template: '<div><slot /></div>' },
          Column: true,
          Tag: true,
          InputText: true,
          Select: true,
          Button: {
            props: ['label', 'icon'],
            emits: ['click'],
            template: '<button type="button" @click="$emit(\'click\')">{{ label }}</button>',
          },
        },
      },
    })
  }

  it('shows a recoverable error state instead of a misleading empty inbox', async () => {
    mocks.list.mockRejectedValueOnce(new Error('offline'))
    wrapper = mountPage()
    await flushPromises()

    expect(wrapper.get('[role="alert"]').text()).toContain('دریافت استعلام‌ها ناموفق بود')
    expect(wrapper.get('[role="alert"]').text()).toContain('تلاش مجدد')
    expect(wrapper.find('.p-tabs').exists()).toBe(false)
  })

  it('retries the existing list endpoint and returns to the inbox after success', async () => {
    mocks.list
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce({
        data: [],
        meta: { page: 1, limit: 10, total: 0 },
      })
    wrapper = mountPage()
    await flushPromises()

    await wrapper.get('[role="alert"] button').trigger('click')
    await flushPromises()

    expect(mocks.list).toHaveBeenCalledTimes(2)
    expect(wrapper.find('[role="alert"]').exists()).toBe(false)
    expect(wrapper.find('.p-tabs').exists()).toBe(true)
  })
})
