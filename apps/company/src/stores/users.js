import { defineStore } from 'pinia'
import { ref } from 'vue'
import { apiGet, apiPatch, apiDelete } from '@telecom/shared-core/http/apiClient'
import { handleApiError } from '@telecom/api-client'
import { endpoints } from '@telecom/api-client'

export const useCompanyUsersStore = defineStore('companyUsers', () => {
  const users = ref([])
  const loading = ref(false)
  const error = ref(null)
  const total = ref(0)

  const list = async (params = {}) => {
    try {
      loading.value = true
      error.value = null
      const { data, meta } = await apiGet(endpoints.users.list, { params: { ...params, companyId: params.companyId } })
      users.value = data || []
      total.value = meta?.total || 0
      return { users: users.value, meta }
    } catch (err) {
      error.value = handleApiError(err).message || 'خطا در دریافت کاربران'
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
      error.value = handleApiError(err).message || 'خطا در دریافت کاربر'
      throw err
    } finally {
      loading.value = false
    }
  }

  const updatePermissions = async (id, permissionIds) => {
    try {
      loading.value = true
      error.value = null
      const user = await apiPatch(endpoints.users.update(id), { permissionIds })
      return user
    } catch (err) {
      error.value = handleApiError(err).message || 'خطا در بروزرسانی مجوزها'
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

  const deactivate = async (id) => {
    try {
      loading.value = true
      error.value = null
      await apiPatch(endpoints.users.update(id), { status: 'REJECTED' })
      return true
    } catch (err) {
      error.value = handleApiError(err).message || 'خطا در غیرفعال‌سازی کاربر'
      throw err
    } finally {
      loading.value = false
    }
  }

  const remove = async (id) => {
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

  return {
    users, loading, error, total,
    list, getUserById, updatePermissions, updateUser, deactivate, remove,
  }
})
