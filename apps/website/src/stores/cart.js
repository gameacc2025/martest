import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

const STORAGE_KEY = 'cart'

function readStoredItems() {
  if (typeof localStorage === 'undefined') return []
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
    return Array.isArray(value) ? value.filter((item) => item && item.id != null) : []
  } catch {
    return []
  }
}

function toPositiveInteger(value, fallback = 1) {
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback
}

export const useCartStore = defineStore('cart', () => {
  const items = ref(readStoredItems())

  const itemCount = computed(() => items.value.reduce((total, item) => total + toPositiveInteger(item.quantity), 0))
  const subtotal = computed(() => items.value.reduce((total, item) => {
    const price = Number(item.price)
    return total + (Number.isFinite(price) && price > 0 ? price : 0) * toPositiveInteger(item.quantity)
  }, 0))

  function persist() {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items.value))
    }
  }

  function addItem(product, quantity = 1) {
    if (!product || product.id == null) return false
    const amount = toPositiveInteger(quantity, 0)
    const price = Number(product.price ?? product.prices?.[0]?.price)
    if (!amount || !Number.isFinite(price) || price <= 0) return false

    const existing = items.value.find((item) => String(item.id) === String(product.id))
    if (existing) {
      existing.quantity = toPositiveInteger(existing.quantity) + amount
    } else {
      const firstImage = Array.isArray(product.images) ? product.images[0] : null
      items.value.push({
        id: product.id,
        name: product.name || product.title || 'محصول',
        price,
        currency: product.currency || product.prices?.[0]?.currency || 'IRR',
        image: typeof firstImage === 'string' ? firstImage : firstImage?.url || product.image || null,
        quantity: amount,
      })
    }

    persist()
    return true
  }

  function removeItem(productId) {
    items.value = items.value.filter((item) => String(item.id) !== String(productId))
    persist()
  }

  function updateQuantity(productId, newQuantity) {
    const quantity = Number(newQuantity)
    const item = items.value.find((entry) => String(entry.id) === String(productId))
    if (!item || !Number.isInteger(quantity) || quantity < 1) return false
    item.quantity = quantity
    persist()
    return true
  }

  function clearCart() {
    items.value = []
    persist()
  }

  function loadFromLocalStorage() {
    items.value = readStoredItems()
    return items.value
  }

  return {
    items,
    itemCount,
    subtotal,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    loadFromLocalStorage,
  }
})
