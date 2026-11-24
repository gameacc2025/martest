import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

const STORAGE_KEY = 'wishlist'

function readStoredItems() {
  if (typeof localStorage === 'undefined') return []
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
    return Array.isArray(parsed) ? parsed.filter((item) => item && item.id != null) : []
  } catch {
    return []
  }
}

function persist(items) {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  } catch {
    // Storage can be unavailable in private browsing or constrained contexts.
  }
}

export const useWishlistStore = defineStore('wishlist', () => {
  const items = ref(readStoredItems())

  const count = computed(() => items.value.length)
  const isInWishlist = computed(() => (productId) => {
    return items.value.some((item) => String(item.id) === String(productId))
  })

  const addToWishlist = (product) => {
    if (!product || product.id == null) return false
    const exists = items.value.some((item) => String(item.id) === String(product.id))
    if (exists) return false
    items.value.push({ ...product })
    persist(items.value)
    return true
  }

  const removeFromWishlist = (productId) => {
    items.value = items.value.filter((item) => String(item.id) !== String(productId))
    persist(items.value)
  }

  const toggleWishlist = (product) => {
    if (!product || product.id == null) return false
    if (isInWishlist.value(product.id)) {
      removeFromWishlist(product.id)
      return false
    }
    addToWishlist(product)
    return true
  }

  const clearWishlist = () => {
    items.value = []
    persist(items.value)
  }

  return {
    items,
    count,
    isInWishlist,
    addToWishlist,
    removeFromWishlist,
    toggleWishlist,
    clearWishlist,
  }
})
