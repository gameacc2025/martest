import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'

const mocks = vi.hoisted(() => ({
  route: { params: { id: '1' } },
  getRetailOrder: vi.fn(),
  routerPush: vi.fn(),
}))

vi.mock('vue-router', () => ({
  useRoute: () => mocks.route,
  useRouter: () => ({ push: mocks.routerPush }),
}))
vi.mock('../../stores/products', () => ({
  useProductsStore: () => ({ getRetailOrder: mocks.getRetailOrder }),
}))

import OrderDetails from './OrderDetails.vue'

function orderFixture(paymentStatus = 'PENDING', attemptStatus = 'PENDING', redirectUrl = '/sandbox-payment/test') {
  return {
    id: 1,
    orderNumber: 'RTL-TEST-1',
    placedAt: '2026-11-26T10:00:00.000Z',
    grandTotal: '1000.00',
    currency: 'IRR',
    paymentStatus,
    paymentAttempts: [{ provider: 'sandbox', status: attemptStatus, redirectUrl }],
    sellerOrders: [{
      id: 10,
      companyNameSnapshot: 'فروشنده نمونه',
      status: 'SHIPPED',
      items: [],
      shipments: [{
        id: 100,
        carrier: 'شرکت حمل نمونه',
        trackingNumber: 'TRK-100',
        status: 'IN_TRANSIT',
        shippedAt: '2026-11-25T08:00:00.000Z',
        deliveredAt: null,
        trackingEvents: [{
          id: '1000',
          eventCode: 'IN_TRANSIT',
          description: 'مرسوله از مرکز پردازش خارج شد',
          location: 'تهران',
          occurredAt: '2026-11-25T09:00:00.000Z',
        }],
      }],
    }],
    recipientName: 'Customer',
    recipientPhone: '0000000000',
    province: 'Test',
    city: 'Test',
    addressLine: 'Test street',
    subtotal: '1000.00',
    shippingTotal: '0.00',
    taxTotal: '0.00',
  }
}

function mountOrderDetails() {
  return mount(OrderDetails, {
    global: {
      stubs: {
        Breadcrumb: true,
        WorkspacePageHeading: { template: '<header><slot name="actions" /></header>' },
        ProgressSpinner: true,
        Button: {
          props: ['label', 'disabled', 'loading'],
          emits: ['click'],
          template: '<button :disabled="disabled" @click="$emit(\'click\')">{{ label }}<slot /></button>',
        },
      },
    },
  })
}

describe('Website customer order payment actions', () => {
  let wrapper

  beforeEach(() => {
    mocks.route.params.id = '1'
    mocks.getRetailOrder.mockReset().mockResolvedValue(orderFixture())
    mocks.routerPush.mockReset()
  })

  it('renders seller shipment status, tracking number and customer-visible tracking events', async () => {
    wrapper = mountOrderDetails()
    await flushPromises()

    expect(wrapper.text()).toContain('رهگیری ارسال')
    expect(wrapper.text()).toContain('در مسیر')
    expect(wrapper.text()).toContain('TRK-100')
    expect(wrapper.text()).toContain('مرسوله از مرکز پردازش خارج شد')
    expect(wrapper.text()).toContain('تهران')
  })

  it('offers continuation only for a still-open sandbox payment attempt', async () => {
    wrapper = mountOrderDetails()
    await flushPromises()

    expect(wrapper.text()).toContain('ادامه پرداخت آزمایشی')
  })

  it.each(['FAILED', 'EXPIRED', 'CANCELLED', 'SUCCEEDED'])(
    'does not offer a stale payment continuation for %s attempts',
    async (attemptStatus) => {
      mocks.getRetailOrder.mockResolvedValueOnce(orderFixture('UNPAID', attemptStatus))
      wrapper = mountOrderDetails()
      await flushPromises()

      expect(wrapper.text()).not.toContain('ادامه پرداخت آزمایشی')
    },
  )

  it('does not offer payment continuation when the provider redirect URL is absent', async () => {
    mocks.getRetailOrder.mockResolvedValueOnce(orderFixture('UNPAID', 'PENDING', ''))
    wrapper = mountOrderDetails()
    await flushPromises()

    expect(wrapper.text()).not.toContain('ادامه پرداخت آزمایشی')
  })
})
