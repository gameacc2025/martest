import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useCartStore = defineStore('cart', () => {
  const items = ref(JSON.parse(localStorage.getItem('cart') || '[]'))

  const itemCount = computed(() => items.value.reduce((total, item) => total + item.quantity, 0))
  const subtotal = computed(() => items.value.reduce((total, item) => total + (item.price * item.quantity), 0))

  // Add to cart
  function addItem(product, quantity = 1) {
    const existingItem = items.value.find(item => item.id === product.id)

    if (existingItem) {
      existingItem.quantity += quantity
    } else {
      items.value.push({
        id: product.id,
        name: product.title,
        price: product.prices?.[0]?.price || 0,
        currency: product.prices?.[0]?.currency || 'IRR',
        image: product.images?.[0] || null,
        quantity
      })
    }

    saveToLocalStorage()
  }

  // Remove from cart
  function removeItem(productId) {
    items.value = items.value.filter(item => item.id !== productId)
    saveToLocalStorage()
  }

  // Update quantity
  function updateQuantity(productId, newQuantity) {
    const item = items.value.find(item => item.id === productId)
    if (item && newQuantity > 0) {
      item.quantity = newQuantity
      saveToLocalStorage()
    }
  }

  // Clear cart
  function clearCart() {
    items.value = []
    saveToLocalStorage()
  }

  // Save to localStorage
  function saveToLocalStorage() {
    localStorage.setItem('cart', JSON.stringify(items.value))
  }

  // Load from localStorage
  function loadFromLocalStorage() {
    items.value = JSON.parse(localStorage.getItem('cart') || '[]')
  }

  return {
    items,
    itemCount,
    subtotal,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    loadFromLocalStorage
  }
})