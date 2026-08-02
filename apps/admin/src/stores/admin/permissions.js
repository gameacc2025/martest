import { defineStore } from 'pinia'
import { ref } from 'vue'
import { apiGet, apiGetPaginated, apiPost, apiPatch, apiDelete } from '@telecom/shared-core/http/apiClient'
import { handleApiError } from '@telecom/api-client'
import { endpoints } from '@telecom/api-client'

export const usePermissionStore = defineStore('admin-permissions', () => {
  const permissions = ref([])
  const loading = ref(false)
  const error = ref(null)
  const pagination = ref({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  })

  /**
   * Get permissions with pagination and filtering
   * @param {Object} params - Filter parameters
   * @returns {Promise<Object>} Permissions data
   */
  const getPermissions = async (params = {}) => {
    try {
      loading.value = true
      error.value = null

      // Check if pagination is requested
      const hasPagination = params.page || params.limit

      let responseData, responseMeta
      if (hasPagination) {
        const result = await apiGetPaginated(endpoints.admin.permissions, {
          params: {
            page: params.page || pagination.value.page,
            limit: params.limit || pagination.value.limit,
            search: params.search,
          }
        })
        responseData = result.data
        responseMeta = result.meta
      } else {
        // No pagination - returns plain array or grouped object
        responseData = await apiGet(endpoints.admin.permissions, {
          params: { search: params.search, grouped: params.grouped }
        })
        responseMeta = null
      }

      permissions.value = Array.isArray(responseData) ? responseData : []
      pagination.value = {
        page: responseMeta?.page || 1,
        limit: responseMeta?.limit || 10,
        total: responseMeta?.total || permissions.value.length,
        totalPages: responseMeta?.totalPages || 1,
      }

      return {
        permissions: permissions.value,
        page: pagination.value.page,
        limit: pagination.value.limit,
        total: pagination.value.total,
        totalPages: pagination.value.totalPages,
      }
    } catch (err) {
      error.value = handleApiError(err).message || 'خطا در دریافت مجوزها'
      console.error('Error fetching permissions:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Get permission by ID
   * @param {number} id - Permission ID
   * @returns {Promise<Object>} Permission data
   */
  const getPermissionById = async (id) => {
    try {
      loading.value = true
      error.value = null

      const permission = await apiGet(endpoints.admin.getPermission(id))
      return permission
    } catch (err) {
      error.value = handleApiError(err).message || 'خطا در دریافت مجوز'
      console.error('Error fetching permission:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Create permission
   * @param {Object} data - Permission data
   * @returns {Promise<Object>} Created permission
   */
  const createPermission = async (data) => {
    try {
      loading.value = true
      error.value = null

      const permission = await apiPost(endpoints.admin.permissions, data)
      return permission
    } catch (err) {
      error.value = handleApiError(err).message || 'خطا در ایجاد مجوز'
      console.error('Error creating permission:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Update permission
   * @param {number} id - Permission ID
   * @param {Object} data - Update data
   * @returns {Promise<Object>} Updated permission
   */
  const updatePermission = async (id, data) => {
    try {
      loading.value = true
      error.value = null

      const permission = await apiPatch(endpoints.admin.getPermission(id), data)
      return permission
    } catch (err) {
      error.value = handleApiError(err).message || 'خطا در بروزرسانی مجوز'
      console.error('Error updating permission:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Delete permission
   * @param {number} id - Permission ID
   * @returns {Promise<Object>} Success message
   */
  const deletePermission = async (id) => {
    try {
      loading.value = true
      error.value = null

      const result = await apiDelete(endpoints.admin.getPermission(id))
      return result
    } catch (err) {
      error.value = handleApiError(err).message || 'خطا در حذف مجوز'
      console.error('Error deleting permission:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    permissions,
    loading,
    error,
    pagination,
    getPermissions,
    getPermissionById,
    createPermission,
    updatePermission,
    deletePermission,
  }
})
