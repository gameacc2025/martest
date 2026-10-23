import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { apiGet, apiGetPaginated, apiPost, apiPatch, handleApiError, endpoints } from '@telecom/api-client'

export const useOrderStore = defineStore('orders', () => {
  const orders = ref([])
  const currentOrder = ref(null)
  const loading = ref(false)
  const error = ref(null)
  const total = ref(0)
  const stats = ref({})

  const getOrders = async (params = {}) => {
    try {
      loading.value = true
      error.value = null
      const { data, meta } = await apiGetPaginated(endpoints.orders.myOrders, { params })
      orders.value = data || []
      total.value = meta?.total || 0
      return { data, meta }
    } catch (err) {
      error.value = handleApiError(err).message || 'خطا در دریافت سفارشات'
      console.error('Error fetching orders:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const getOrderById = async (id) => {
    try {
      loading.value = true
      error.value = null
      const order = await apiGet(endpoints.orders.get(id))
      currentOrder.value = order
      return order
    } catch (err) {
      error.value = handleApiError(err).message || 'خطا در دریافت سفارش'
      console.error('Error fetching order:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const createOrder = async (data) => {
    try {
      loading.value = true
      error.value = null
      const order = await apiPost(endpoints.orders.create, data)
      return order
    } catch (err) {
      error.value = handleApiError(err).message || 'خطا در ایجاد سفارش'
      console.error('Error creating order:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const cancelOrder = async (id) => {
    try {
      loading.value = true
      error.value = null
      await apiPatch(endpoints.orders.update(id), { status: 'cancelled' })
      return true
    } catch (err) {
      error.value = handleApiError(err).message || 'خطا در لغو سفارش'
      console.error('Error cancelling order:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const getUserStats = async () => {
    try {
      loading.value = true
      error.value = null
      const data = await apiGet(`${endpoints.orders.myOrders}/stats`)
      stats.value = data || {}
      return stats.value
    } catch (err) {
      error.value = handleApiError(err).message || 'خطا در دریافت آمار کاربر'
      console.error('Error fetching user stats:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const getRecentOrders = async (limit = 5) => {
    try {
      loading.value = true
      error.value = null
      const data = await apiGet(endpoints.orders.myOrders, { params: { limit } })
      return data || []
    } catch (err) {
      error.value = handleApiError(err).message || 'خطا در دریافت سفارشات اخیر'
      console.error('Error fetching recent orders:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    orders,
    currentOrder,
    loading,
    error,
    total,
    stats,
    getOrders,
    getOrderById,
    createOrder,
    cancelOrder,
    getUserStats,
    getRecentOrders
  }
})