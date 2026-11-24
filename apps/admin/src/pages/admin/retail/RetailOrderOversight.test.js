import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'

const mocks = vi.hoisted(() => ({
  listOrders: vi.fn(),
  getOrder: vi.fn(),
}))

vi.mock('@telecom/api-client', () => ({
  retailAdminApi: {
    listOrders: mocks.listOrders,
    getOrder: mocks.getOrder,
  },
}))

import RetailOrderOversight from './RetailOrderOversight.vue'

function mountPage() {
  return mount(RetailOrderOversight, {
    global: {
      stubs: {
        WorkspacePageHeading: true,
        DataTable: {
          props: ['value'],
          template: '<div class="table-stub"><div v-for="row in value" :key="row.id">{{ row.orderNumber }} {{ row.recipientName }}</div></div>',
        },
        Column: true,
        Dialog: {
          props: ['visible', 'header'],
          template: '<div v-if="visible" class="dialog-stub"><slot /><slot name="footer" /></div>',
        },
        Button: {
          props: ['label', 'disabled', 'loading'],
          emits: ['click'],
          template: '<button :disabled="disabled" @click="$emit(\'click\')">{{ label }}</button>',
        },
        InputText: {
          props: ['modelValue'],
          emits: ['update:modelValue'],
          template: '<input :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />',
        },
        Select: true,
        Tag: { props: ['value'], template: '<span>{{ value }}</span>' },
        ProgressSpinner: true,
      },
    },
  })
}

describe('Admin retail order oversight', () => {
  beforeEach(() => {
    mocks.listOrders.mockReset().mockResolvedValue({
      data: {
        data: [{
          id: 71,
          orderNumber: 'TM-RETAIL-00071',
          recipientName: 'مشتری آزمایشی',
          province: 'تهران',
          city: 'تهران',
          status: 'PAID',
          paymentStatus: 'PAID',
          currency: 'IRR',
          grandTotal: '2500000',
          sellerOrders: [{ id: 1 }],
          createdAt: '2026-11-24T10:00:00.000Z',
        }],
        meta: { page: 1, limit: 20, total: 1, totalPages: 1 },
      },
    })
    mocks.getOrder.mockReset()
  })

  it('loads authoritative retail orders and renders server pagination totals', async () => {
    const wrapper = mountPage()
    await flushPromises()

    expect(mocks.listOrders).toHaveBeenCalledWith({
      page: 1,
      limit: 20,
      search: undefined,
      status: undefined,
      paymentStatus: undefined,
      exceptionOnly: undefined,
    })
    expect(wrapper.text()).toContain('TM-RETAIL-00071')
    expect(wrapper.text()).toContain('مشتری آزمایشی')
    expect(wrapper.text()).toContain('کل سفارش‌های منطبق با فیلتر')
    expect(wrapper.text()).toContain('۱')
  })

  it('loads the read-only exception queue with the server-side exception filter', async () => {
    const wrapper = mountPage()
    await flushPromises()

    await wrapper.find('input[type="checkbox"]').setValue(true)
    await wrapper.find('.retail-filters').trigger('submit')
    await flushPromises()

    expect(mocks.listOrders).toHaveBeenLastCalledWith({
      page: 1,
      limit: 20,
      search: undefined,
      status: undefined,
      paymentStatus: undefined,
      exceptionOnly: true,
    })
  })

  it('explains that the exception queue includes webhook verification and processing failures', async () => {
    const wrapper = mountPage()
    await flushPromises()

    expect(wrapper.text()).toContain('امضای نامعتبر یا webhook ردشده/ناموفق')
  })

  it('shows an accessible error state when the oversight API is unavailable', async () => {
    mocks.listOrders.mockRejectedValueOnce({ message: 'Service unavailable' })
    const wrapper = mountPage()
    await flushPromises()

    expect(wrapper.find('[role="alert"]').exists()).toBe(true)
    expect(wrapper.find('[role="alert"]').text()).toContain('Service unavailable')
  })
})
