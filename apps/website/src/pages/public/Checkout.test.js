import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'

const mocks = vi.hoisted(() => ({
  cartItems: [],
  previewRetailCheckout: vi.fn(),
  routerPush: vi.fn(),
  routerReplace: vi.fn(),
}))

vi.mock('@telecom/shared-core/http/apiClient', () => ({ apiGet: vi.fn().mockResolvedValue([]) }))

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: mocks.routerPush, replace: mocks.routerReplace }),
}))
vi.mock('../../stores/cart', () => ({
  useCartStore: () => ({ items: mocks.cartItems }),
}))
vi.mock('../../stores/products', () => ({
  useProductsStore: () => ({ previewRetailCheckout: mocks.previewRetailCheckout }),
}))

import Checkout from './Checkout.vue'

const previewFixture = () => ({
  currency: 'IRR',
  items: [{
    productId: 1,
    title: 'روتر فیبر نوری',
    quantity: 2,
    unit: 'عدد',
    unitPrice: '1000.00',
    lineTotal: '2000.00',
    availableQuantity: 8,
    seller: { id: 10, name: 'فروشنده نمونه' },
  }],
  sellers: [],
  subtotal: '2000.00',
  fees: { shipping: null, tax: null, total: null },
  policyStatus: { shipping: 'NOT_CONFIGURED', tax: 'NOT_CONFIGURED', commission: 'NOT_CONFIGURED', payment: 'NOT_CONFIGURED' },
  orderPlacementEnabled: false,
  blockers: ['SHIPPING_POLICY_NOT_CONFIGURED', 'RETAIL_ORDER_PLACEMENT_DISABLED'],
})

function mountCheckout() {
  return mount(Checkout, {
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

describe('Website retail checkout preview', () => {
  let wrapper

  beforeEach(() => {
    mocks.cartItems = [{ id: 1, quantity: 2, name: 'روتر فیبر نوری', price: 900 }]
    mocks.previewRetailCheckout.mockReset().mockResolvedValue(previewFixture())
    mocks.routerPush.mockReset()
    mocks.routerReplace.mockReset()
  })

  it('submits product IDs and quantities to the server and renders authoritative totals', async () => {
    wrapper = mountCheckout()
    await flushPromises()

    expect(mocks.previewRetailCheckout).toHaveBeenCalledWith([{ productId: 1, quantity: 2 }])
    expect(wrapper.text()).toContain('روتر فیبر نوری')
    expect(wrapper.text()).toContain('فروشنده نمونه')
    expect(wrapper.text()).toContain('تعیین نشده')
    expect(wrapper.text()).toContain('ثبت سفارش تا فعال‌سازی صریح پیکربندی‌های تجاری غیرفعال است.')
    expect(wrapper.find('.place-order-button').element.disabled).toBe(true)
  })

  it('shows server stock/price validation errors without creating an order', async () => {
    mocks.previewRetailCheckout.mockRejectedValueOnce({ message: 'Insufficient available stock' })
    wrapper = mountCheckout()
    await flushPromises()

    expect(wrapper.find('[role="alert"]').text()).toContain('Insufficient available stock')
    expect(wrapper.find('.place-order-button').element.disabled).toBe(true)
  })

  it('returns to the cart when no items remain', async () => {
    mocks.cartItems = []
    wrapper = mountCheckout()
    await flushPromises()

    expect(mocks.previewRetailCheckout).not.toHaveBeenCalled()
    expect(mocks.routerReplace).toHaveBeenCalledWith({ name: 'customer-cart' })
  })
})
