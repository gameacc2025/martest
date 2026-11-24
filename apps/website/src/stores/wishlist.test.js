import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useWishlistStore } from './wishlist'

describe('website wishlist store', () => {
  beforeEach(() => {
    vi.unstubAllGlobals()
    localStorage.clear()
    setActivePinia(createPinia())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    localStorage.clear()
  })

  it('stores a product once even when IDs differ only by string/number type', () => {
    const wishlist = useWishlistStore()
    expect(wishlist.addToWishlist({ id: 42, title: 'روتر' })).toBe(true)
    expect(wishlist.addToWishlist({ id: '42', title: 'روتر تکراری' })).toBe(false)
    expect(wishlist.count).toBe(1)
    expect(wishlist.isInWishlist('42')).toBe(true)
    expect(JSON.parse(localStorage.getItem('wishlist'))).toHaveLength(1)
  })

  it('toggles, removes and clears items using normalized IDs', () => {
    const wishlist = useWishlistStore()
    expect(wishlist.toggleWishlist({ id: 7, title: 'محصول' })).toBe(true)
    expect(wishlist.toggleWishlist({ id: '7', title: 'محصول' })).toBe(false)
    expect(wishlist.items).toHaveLength(0)

    wishlist.addToWishlist({ id: 8 })
    wishlist.removeFromWishlist('8')
    expect(wishlist.items).toHaveLength(0)

    wishlist.addToWishlist({ id: 9 })
    wishlist.clearWishlist()
    expect(JSON.parse(localStorage.getItem('wishlist'))).toEqual([])
  })

  it('recovers from malformed stored JSON', () => {
    localStorage.setItem('wishlist', '{bad-json')
    setActivePinia(createPinia())
    expect(useWishlistStore().items).toEqual([])
  })

  it('works when localStorage is unavailable', () => {
    vi.stubGlobal('localStorage', undefined)
    setActivePinia(createPinia())
    const wishlist = useWishlistStore()
    expect(wishlist.addToWishlist({ id: 11 })).toBe(true)
    expect(wishlist.items).toHaveLength(1)
    wishlist.clearWishlist()
    expect(wishlist.items).toEqual([])
  })
})
