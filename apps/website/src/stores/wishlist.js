import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useWishlistStore = defineStore('wishlist', () => {
  const items = ref(JSON.parse(localStorage.getItem('wishlist')) || [])

  const count = computed(() => items.value.length)

  const isInWishlist = computed(() => (productId) => {
    return items.value.some(item => item.id === productId)
  })

  const addToWishlist = (product) => {
    const existingItem = items.value.find(item => item.id === product.id)
    if (!existingItem) {
      items.value.push(product)
      saveToLocalStorage()
    }
  }

  const removeFromWishlist = (productId) => {
    items.value = items.value.filter(item => item.id !== productId)
    saveToLocalStorage()
  }

  const toggleWishlist = (product) => {
    const existingIndex = items.value.findIndex(item => item.id === product.id)
    if (existingIndex >= 0) {
      removeFromWishlist(product.id)
    } else {
      addToWishlist(product)
    }
  }

  const clearWishlist = () => {
    items.value = []
    saveToLocalStorage()
  }

  const saveToLocalStorage = () => {
    localStorage.setItem('wishlist', JSON.stringify(items.value))
  }

  return {
    items,
    count,
    isInWishlist,
    addToWishlist,
    removeFromWishlist,
    toggleWishlist,
    clearWishlist
  }
})