import { defineStore } from 'pinia'
import { ref } from 'vue'
import { apiGet, apiGetPaginated, apiPost } from '@telecom/shared-core/http/apiClient'
import { handleApiError } from '@telecom/api-client'
import { endpoints } from '@telecom/api-client'

export const useOrderStore = defineStore('orders', () => {
  const orders = ref([])
  const recentOrders = ref([])
  const loading = ref(false)
  const error = ref(null)

  /**
   * Get user's order statistics
   * @returns {Promise<Object>} User order statistics
   */
  const getUserStats = async () => {
    try {
      loading.value = true
      error.value = null

      const stats = await apiGet(`${endpoints.orders.myOrders}/stats`)
      return stats
    } catch (err) {
      error.value = handleApiError(err).message || 'خطا در دریافت آمار سفارشات'
      console.error('Error fetching user order stats:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Get user's recent orders
   * @param {number} limit - Number of recent orders to fetch
   * @returns {Promise<Array>} Array of recent orders
   */
  const getRecentOrders = async (limit = 5) => {
    try {
      loading.value = true
      error.value = null

      const ordersData = await apiGet(endpoints.orders.myOrders, { params: { limit } })
      recentOrders.value = ordersData || []
      return recentOrders.value
    } catch (err) {
      error.value = handleApiError(err).message || 'خطا در دریافت سفارشات اخیر'
      console.error('Error fetching recent orders:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Get all orders (with optional filters)
   * @param {Object} params - Filter parameters
   * @returns {Promise<Object>} Orders data with { data, meta }
   */
  const getOrders = async (params = {}) => {
    try {
      loading.value = true
      error.value = null

      const { data, meta } = await apiGetPaginated(endpoints.orders.list, { params })
      orders.value = data || []
      return { data: orders.value, meta }
    } catch (err) {
      error.value = handleApiError(err).message || 'خطا در دریافت سفارشات'
      console.error('Error fetching orders:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Get order by ID
   * @param {string} id - Order ID
   * @returns {Promise<Object>} Order data
   */
  const getOrderById = async (id) => {
    try {
      loading.value = true
      error.value = null

      const order = await apiGet(endpoints.orders.get(id))
      return order
    } catch (err) {
      error.value = handleApiError(err).message || 'خطا در دریافت سفارش'
      console.error('Error fetching order:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Create a new order
   * @param {Object} data - Order data
   * @returns {Promise<Object>} Created order data
   */
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

  return {
    orders,
    recentOrders,
    loading,
    error,
    getUserStats,
    getRecentOrders,
    getOrders,
    getOrderById,
    createOrder
  }
})
