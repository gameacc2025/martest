import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useCartStore } from './cart'

describe('website cart store', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  afterEach(() => {
    localStorage.clear()
  })

  it('adds a priced product and increments an existing line', () => {
    const cart = useCartStore()
    const product = { id: 12, title: 'روتر سازمانی', prices: [{ price: '1250000' }], images: [{ url: '/router.webp' }] }

    expect(cart.addItem(product, 2)).toBe(true)
    expect(cart.addItem(product, 1)).toBe(true)
    expect(cart.items).toHaveLength(1)
    expect(cart.items[0]).toMatchObject({
      id: 12,
      name: 'روتر سازمانی',
      price: 1250000,
      image: '/router.webp',
      quantity: 3,
    })
    expect(cart.itemCount).toBe(3)
    expect(cart.subtotal).toBe(3750000)
  })

  it('rejects missing products, invalid quantities and non-positive prices', () => {
    const cart = useCartStore()

    expect(cart.addItem(null)).toBe(false)
    expect(cart.addItem({ id: 1, title: 'بدون قیمت', prices: [] })).toBe(false)
    expect(cart.addItem({ id: 2, title: 'محصول', price: 100 }, 0)).toBe(false)
    expect(cart.items).toHaveLength(0)
  })

  it('updates only to a positive integer quantity', () => {
    const cart = useCartStore()
    cart.addItem({ id: 1, title: 'محصول', price: 250 }, 2)

    expect(cart.updateQuantity(1, 4)).toBe(true)
    expect(cart.items[0].quantity).toBe(4)
    expect(cart.updateQuantity(1, 0)).toBe(false)
    expect(cart.updateQuantity(1, 1.5)).toBe(false)
    expect(cart.items[0].quantity).toBe(4)
  })

  it('removes a line and clears the persisted cart', () => {
    const cart = useCartStore()
    cart.addItem({ id: 1, title: 'اول', price: 100 })
    cart.addItem({ id: 2, title: 'دوم', price: 200 })

    cart.removeItem(1)
    expect(cart.items.map((item) => item.id)).toEqual([2])

    cart.clearCart()
    expect(cart.items).toEqual([])
    expect(JSON.parse(localStorage.getItem('cart'))).toEqual([])
  })

  it('recovers from malformed local storage without crashing', () => {
    localStorage.setItem('cart', '{invalid-json')
    setActivePinia(createPinia())

    expect(useCartStore().items).toEqual([])
  })
})
