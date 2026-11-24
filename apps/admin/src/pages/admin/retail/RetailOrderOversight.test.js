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
          template: '<div class="table-stub"><div v-for="row in value" :key="row.id">{{ row.orderNumber }} {{ row.recipientName }}<button :aria-label="' + "'جزئیات سفارش ' + row.orderNumber" + '" @click="$emit(\'row-detail\', row)">جزئیات</button></div></div>',
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
    })
    expect(wrapper.text()).toContain('TM-RETAIL-00071')
    expect(wrapper.text()).toContain('مشتری آزمایشی')
    expect(wrapper.text()).toContain('کل سفارش‌های منطبق با فیلتر')
    expect(wrapper.text()).toContain('۱')
  })

  it('loads and renders seller splits, payment attempts, transactions and stock reservations in the detail view', async () => {
    mocks.getOrder.mockResolvedValueOnce({
      data: { data: {
        id: 71,
        orderNumber: 'TM-RETAIL-00071',
        recipientName: 'مشتری آزمایشی',
        province: 'تهران',
        city: 'تهران',
        status: 'PAID',
        paymentStatus: 'PAID',
        currency: 'IRR',
        subtotal: '2500000',
        shippingTotal: '0',
        taxTotal: '0',
        grandTotal: '2500000',
        sellerOrders: [{
          id: 1,
          sellerOrderNumber: 'TM-S-00071-01',
          companyNameSnapshot: 'فروشنده نمونه',
          status: 'ACCEPTED',
          currency: 'IRR',
          sellerNetTotal: '2400000',
          items: [{ id: 1, productTitleSnapshot: 'روتر فیبر نوری', skuSnapshot: 'SKU-1', quantity: 1, unitPrice: '2500000', lineTotal: '2500000', currency: 'IRR' }],
          shipments: [{ id: 2, carrier: 'شرکت حمل نمونه', trackingNumber: 'TRACK-1', trackingEvents: [{ id: 3, eventCode: 'PICKED_UP', description: 'تحویل به حمل‌کننده', occurredAt: '2026-11-24T10:00:00.000Z' }] }],
        }],
        paymentAttempts: [{ id: 4, provider: 'sandbox', status: 'SUCCEEDED', amount: '2500000', currency: 'IRR' }],
        paymentTransactions: [{ id: 5, provider: 'sandbox', transactionType: 'CAPTURE', status: 'SUCCEEDED', amount: '2500000', currency: 'IRR' }],
        inventoryReservations: [{ id: 6, productId: 42, quantity: 1, status: 'CONSUMED', expiresAt: '2026-11-24T11:00:00.000Z' }],
      } },
    })

    const wrapper = mountPage()
    await flushPromises()
    await wrapper.get('[aria-label="جزئیات سفارش TM-RETAIL-00071"]').trigger('click')
    await flushPromises()

    expect(mocks.getOrder).toHaveBeenCalledWith(71)
    expect(wrapper.text()).toContain('فروشنده نمونه')
    expect(wrapper.text()).toContain('روتر فیبر نوری')
    expect(wrapper.text()).toContain('sandbox')
    expect(wrapper.text()).toContain('CAPTURE')
    expect(wrapper.text()).toContain('رزروهای موجودی')
    expect(wrapper.text()).toContain('تحویل به حمل‌کننده')
  })

  it('shows an accessible error state when the oversight API is unavailable', async () => {
    mocks.listOrders.mockRejectedValueOnce({ message: 'Service unavailable' })
    const wrapper = mountPage()
    await flushPromises()

    expect(wrapper.find('[role="alert"]').exists()).toBe(true)
    expect(wrapper.find('[role="alert"]').text()).toContain('Service unavailable')
  })
})
