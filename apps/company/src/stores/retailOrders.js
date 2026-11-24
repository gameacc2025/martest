import { defineStore } from 'pinia'
import { ref } from 'vue'
import { apiGet, apiGetPaginated, apiPost } from '@telecom/shared-core/http/apiClient'
import { endpoints } from '@telecom/api-client'

export const useRetailOrdersStore = defineStore('company-retail-orders', () => {
  const orders = ref([])
  const currentOrder = ref(null)
  const meta = ref({ page: 1, limit: 20, total: 0, totalPages: 1 })
  const loading = ref(false)
  const error = ref('')

  async function fetchOrders(params = {}) {
    loading.value = true
    error.value = ''
    try {
      const result = await apiGetPaginated(endpoints.retail.sellerOrders, { params })
      orders.value = Array.isArray(result?.data) ? result.data : []
      meta.value = result?.meta || meta.value
      return result
    } catch (err) {
      error.value = err?.serverMessage || err?.message || 'دریافت سفارش‌های شرکت ناموفق بود.'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function fetchOrder(id) {
    loading.value = true
    error.value = ''
    try {
      currentOrder.value = await apiGet(endpoints.retail.sellerOrder(id))
      return currentOrder.value
    } catch (err) {
      error.value = err?.serverMessage || err?.message || 'دریافت جزئیات سفارش ناموفق بود.'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function transitionOrder(id, payload) {
    loading.value = true
    error.value = ''
    try {
      const updated = await apiPost(endpoints.retail.transitionSellerOrder(id), payload)
      currentOrder.value = updated
      const index = orders.value.findIndex(order => String(order.id) === String(updated.id))
      if (index >= 0) orders.value[index] = { ...orders.value[index], ...updated }
      return updated
    } catch (err) {
      error.value = err?.serverMessage || err?.message || 'تغییر وضعیت سفارش ناموفق بود.'
      throw err
    } finally {
      loading.value = false
    }
  }

  return { orders, currentOrder, meta, loading, error, fetchOrders, fetchOrder, transitionOrder }
})
