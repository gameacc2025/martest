import { defineStore } from 'pinia'
import { ref } from 'vue'
import { apiGet, apiGetPaginated, apiPost, apiPatch, apiDelete } from '@telecom/shared-core/http/apiClient'
import { handleApiError } from '@telecom/api-client'
import { endpoints } from '@telecom/api-client'

export const useRoleStore = defineStore('admin-roles', () => {
  const roles = ref([])
  const loading = ref(false)
  const error = ref(null)
  const pagination = ref({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  })

  /**
   * Get roles with pagination and filtering
   * @param {Object} params - Filter parameters
   * @returns {Promise<Object>} Roles data
   */
  const getRoles = async (params = {}) => {
    try {
      loading.value = true
      error.value = null

      // Check if pagination is requested
      const hasPagination = params.page || params.limit

      let responseData, responseMeta
      if (hasPagination) {
        const result = await apiGetPaginated(endpoints.admin.roles, {
          params: {
            page: params.page || pagination.value.page,
            limit: params.limit || pagination.value.limit,
            search: params.search,
          }
        })
        responseData = result.data
        responseMeta = result.meta
      } else {
        // No pagination - returns plain array
        responseData = await apiGet(endpoints.admin.roles, {
          params: { search: params.search }
        })
        responseMeta = null
      }

      roles.value = Array.isArray(responseData) ? responseData : []
      pagination.value = {
        page: responseMeta?.page || 1,
        limit: responseMeta?.limit || 10,
        total: responseMeta?.total || roles.value.length,
        totalPages: responseMeta?.totalPages || 1,
      }

      return {
        roles: roles.value,
        page: pagination.value.page,
        limit: pagination.value.limit,
        total: pagination.value.total,
        totalPages: pagination.value.totalPages,
      }
    } catch (err) {
      error.value = handleApiError(err).message || 'خطا در دریافت نقش‌ها'
      console.error('Error fetching roles:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Get role by ID
   * @param {number} id - Role ID
   * @returns {Promise<Object>} Role data
   */
  const getRoleById = async (id) => {
    try {
      loading.value = true
      error.value = null

      const role = await apiGet(endpoints.admin.getRole(id))
      return role
    } catch (err) {
      error.value = handleApiError(err).message || 'خطا در دریافت نقش'
      console.error('Error fetching role:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Create role
   * @param {Object} data - Role data
   * @returns {Promise<Object>} Created role
   */
  const createRole = async (data) => {
    try {
      loading.value = true
      error.value = null

      const role = await apiPost(endpoints.admin.roles, data)
      return role
    } catch (err) {
      error.value = handleApiError(err).message || 'خطا در ایجاد نقش'
      console.error('Error creating role:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Update role
   * @param {number} id - Role ID
   * @param {Object} data - Update data
   * @returns {Promise<Object>} Updated role
   */
  const updateRole = async (id, data) => {
    try {
      loading.value = true
      error.value = null

      const role = await apiPatch(endpoints.admin.getRole(id), data)
      return role
    } catch (err) {
      error.value = handleApiError(err).message || 'خطا در بروزرسانی نقش'
      console.error('Error updating role:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Delete role
   * @param {number} id - Role ID
   * @returns {Promise<Object>} Success message
   */
  const deleteRole = async (id) => {
    try {
      loading.value = true
      error.value = null

      const result = await apiDelete(endpoints.admin.getRole(id))
      return result
    } catch (err) {
      error.value = handleApiError(err).message || 'خطا در حذف نقش'
      console.error('Error deleting role:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    roles,
    loading,
    error,
    pagination,
    getRoles,
    getRoleById,
    createRole,
    updateRole,
    deleteRole,
  }
})
