import { defineStore } from 'pinia'
import { ref } from 'vue'
import { apiGet, apiGetPaginated } from '@telecom/shared-core/http/apiClient'
import { handleApiError } from '@telecom/api-client'
import { endpoints } from '@telecom/api-client'

export const useProductsStore = defineStore('products', () => {
  const products = ref([])
  const featuredProducts = ref([])
  const categories = ref([])
  const brands = ref([])
  const loading = ref(false)
  const error = ref(null)

  const getProducts = async (params = {}) => {
    try {
      loading.value = true
      error.value = null

      const { data, meta } = await apiGetPaginated(endpoints.products.list, { params })
      return { data, meta }
    } catch (err) {
      error.value = handleApiError(err).message || 'خطا در دریافت محصولات'
      console.error('Error fetching products:', err)
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
      error.value = handleApiError(err).message || 'خطا در دریافت محصول'
      console.error('Error fetching product:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const getFeaturedProducts = async (limit = 5) => {
    try {
      loading.value = true
      error.value = null

      const data = await apiGet(endpoints.products.list, { params: { featured: true, limit } })
      featuredProducts.value = data || []
      return featuredProducts.value
    } catch (err) {
      error.value = handleApiError(err).message || 'خطا در دریافت محصولات ویژه'
      console.error('Error fetching featured products:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const getCategories = async () => {
    try {
      loading.value = true
      error.value = null

      const data = await apiGet(endpoints.categories.list)
      categories.value = data || []
      return categories.value
    } catch (err) {
      error.value = handleApiError(err).message || 'خطا در دریافت دسته بندی ها'
      console.error('Error fetching categories:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const getBrands = async () => {
    try {
      loading.value = true
      error.value = null

      // Note: brands endpoint may not exist yet, using categories as fallback
      const data = await apiGet(endpoints.categories.list)
      brands.value = data || []
      return brands.value
    } catch (err) {
      error.value = handleApiError(err).message || 'خطا در دریافت برندها'
      console.error('Error fetching brands:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const searchProducts = async (query, params = {}) => {
    try {
      loading.value = true
      error.value = null

      const { data, meta } = await apiGetPaginated(endpoints.products.list, { params: { search: query, ...params } })
      return { data, meta }
    } catch (err) {
      error.value = handleApiError(err).message || 'خطا در جستجوی محصولات'
      console.error('Error searching products:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    products,
    featuredProducts,
    categories,
    brands,
    loading,
    error,
    getProducts,
    getProductById,
    getFeaturedProducts,
    getCategories,
    getBrands,
    searchProducts
  }
})
