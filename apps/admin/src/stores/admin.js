import { defineStore } from 'pinia'
import { ref } from 'vue'
import { apiGet, apiGetPaginated, apiPost, apiPatch, apiDelete } from '@telecom/shared-core/http/apiClient'
import { handleApiError } from '@telecom/api-client'
import { endpoints } from '@telecom/api-client'

export const useAdminStore = defineStore('admin', () => {
  const users = ref([])
  const companies = ref([])
  const products = ref([])
  const orders = ref([])
  const stats = ref({})
  const loading = ref(false)
  const error = ref(null)

  // Users
  const getUsers = async (params = {}) => {
    try {
      loading.value = true
      error.value = null
      const { data } = await apiGetPaginated(endpoints.users.list, { params })
      users.value = data || []
      return data
    } catch (err) {
      error.value = handleApiError(err).message || 'خطا در دریافت لیست کاربران'
      throw err
    } finally {
      loading.value = false
    }
  }

  const getUserById = async (id) => {
    try {
      loading.value = true
      error.value = null
      const user = await apiGet(endpoints.users.get(id))
      return user
    } catch (err) {
      error.value = handleApiError(err).message || 'خطا در دریافت اطلاعات کاربر'
      throw err
    } finally {
      loading.value = false
    }
  }

  const createUser = async (data) => {
    try {
      loading.value = true
      error.value = null
      const user = await apiPost(endpoints.users.create, data)
      return user
    } catch (err) {
      error.value = handleApiError(err).message || 'خطا در ایجاد کاربر'
      throw err
    } finally {
      loading.value = false
    }
  }

  const updateUser = async (id, data) => {
    try {
      loading.value = true
      error.value = null
      const user = await apiPatch(endpoints.users.update(id), data)
      return user
    } catch (err) {
      error.value = handleApiError(err).message || 'خطا در بروزرسانی کاربر'
      throw err
    } finally {
      loading.value = false
    }
  }

  const deleteUser = async (id) => {
    try {
      loading.value = true
      error.value = null
      await apiDelete(endpoints.users.delete(id))
      return true
    } catch (err) {
      error.value = handleApiError(err).message || 'خطا در حذف کاربر'
      throw err
    } finally {
      loading.value = false
    }
  }

  // Companies
  const getCompanies = async (params = {}) => {
    try {
      loading.value = true
      error.value = null
      const { data } = await apiGetPaginated(endpoints.companies.list, { params })
      companies.value = data || []
      return data
    } catch (err) {
      error.value = handleApiError(err).message || 'خطا در دریافت لیست شرکت ها'
      throw err
    } finally {
      loading.value = false
    }
  }

  const getCompanyById = async (id) => {
    try {
      loading.value = true
      error.value = null
      const company = await apiGet(endpoints.companies.get(id))
      return company
    } catch (err) {
      error.value = handleApiError(err).message || 'خطا در دریافت اطلاعات شرکت'
      throw err
    } finally {
      loading.value = false
    }
  }

  const createCompany = async (data) => {
    try {
      loading.value = true
      error.value = null
      const company = await apiPost(endpoints.companies.create, data)
      return company
    } catch (err) {
      error.value = handleApiError(err).message || 'خطا در ایجاد شرکت'
      throw err
    } finally {
      loading.value = false
    }
  }

  const updateCompany = async (id, data) => {
    try {
      loading.value = true
      error.value = null
      const company = await apiPatch(endpoints.companies.update(id), data)
      return company
    } catch (err) {
      error.value = handleApiError(err).message || 'خطا در بروزرسانی شرکت'
      throw err
    } finally {
      loading.value = false
    }
  }

  const deleteCompany = async (id) => {
    try {
      loading.value = true
      error.value = null
      await apiDelete(endpoints.companies.delete(id))
      return true
    } catch (err) {
      error.value = handleApiError(err).message || 'خطا در حذف شرکت'
      throw err
    } finally {
      loading.value = false
    }
  }

  // Products
  const getProducts = async (params = {}) => {
    try {
      loading.value = true
      error.value = null
      const { data } = await apiGetPaginated(endpoints.products.list, { params })
      products.value = data || []
      return data
    } catch (err) {
      error.value = handleApiError(err).message || 'خطا در دریافت لیست محصولات'
      throw err
    } finally {
      loading.value = false
    }
  }

  const getProductById = async (id) => {
    try {
      loading.value = true
      error.value = null
      const product = await apiGet(endpoints.products.get(id))
      return product
    } catch (err) {
      error.value = handleApiError(err).message || 'خطا در دریافت اطلاعات محصول'
      throw err
    } finally {
      loading.value = false
    }
  }

  const createProduct = async (data) => {
    try {
      loading.value = true
      error.value = null
      const product = await apiPost(endpoints.products.create, data)
      return product
    } catch (err) {
      error.value = handleApiError(err).message || 'خطا در ایجاد محصول'
      throw err
    } finally {
      loading.value = false
    }
  }

  const updateProduct = async (id, data) => {
    try {
      loading.value = true
      error.value = null
      const product = await apiPatch(endpoints.products.update(id), data)
      return product
    } catch (err) {
      error.value = handleApiError(err).message || 'خطا در بروزرسانی محصول'
      throw err
    } finally {
      loading.value = false
    }
  }

  const deleteProduct = async (id) => {
    try {
      loading.value = true
      error.value = null
      await apiDelete(endpoints.products.delete(id))
      return true
    } catch (err) {
      error.value = handleApiError(err).message || 'خطا در حذف محصول'
      throw err
    } finally {
      loading.value = false
    }
  }

  // Orders
  const getOrders = async (params = {}) => {
    try {
      loading.value = true
      error.value = null
      const { data } = await apiGetPaginated(endpoints.orders.list, { params })
      orders.value = data || []
      return data
    } catch (err) {
      error.value = handleApiError(err).message || 'خطا در دریافت لیست سفارشات'
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
      return order
    } catch (err) {
      error.value = handleApiError(err).message || 'خطا در دریافت اطلاعات سفارش'
      throw err
    } finally {
      loading.value = false
    }
  }

  const updateOrder = async (id, data) => {
    try {
      loading.value = true
      error.value = null
      const order = await apiPatch(endpoints.orders.update(id), data)
      return order
    } catch (err) {
      error.value = handleApiError(err).message || 'خطا در بروزرسانی سفارش'
      throw err
    } finally {
      loading.value = false
    }
  }

  const deleteOrder = async (id) => {
    try {
      loading.value = true
      error.value = null
      await apiDelete(endpoints.orders.delete(id))
      return true
    } catch (err) {
      error.value = handleApiError(err).message || 'خطا در حذف سفارش'
      throw err
    } finally {
      loading.value = false
    }
  }

  // Stats
  const getAdminStats = async () => {
    try {
      loading.value = true
      error.value = null
      const data = await apiGet(endpoints.admin.stats)
      stats.value = data
      return data
    } catch (err) {
      error.value = handleApiError(err).message || 'خطا در دریافت آمار'
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    // State
    users,
    companies,
    products,
    orders,
    stats,
    loading,
    error,

    // User actions
    getUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser,

    // Company actions
    getCompanies,
    getCompanyById,
    createCompany,
    updateCompany,
    deleteCompany,

    // Product actions
    getProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,

    // Order actions
    getOrders,
    getOrderById,
    updateOrder,
    deleteOrder,

    // Stats actions
    getAdminStats
  }
})
