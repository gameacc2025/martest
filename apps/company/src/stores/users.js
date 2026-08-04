import { defineStore } from 'pinia'
import { ref } from 'vue'
import { apiGet, apiPost, apiPatch, apiDelete } from '@telecom/shared-core/http/apiClient'
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

  const create = async (data) => {
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

  // Roles are the single source of truth for permissions in this system —
  // there is no per-user direct-permission override (see
  // backend/src/modules/users/user.service.js setUserAccess: "Direct
  // user-permissions were removed from the domain model"). This previously
  // tried to PATCH /users/:id with a `permissionIds` field that
  // updateUserBody doesn't even declare — it never worked, for anyone,
  // regardless of role. Changing a user's ROLE via the dedicated /access
  // endpoint is the actual supported mechanism.
  const setRole = async (id, roleId) => {
    try {
      loading.value = true
      error.value = null
      const user = await apiPatch(endpoints.users.access(id), { roleId })
      return user
    } catch (err) {
      error.value = handleApiError(err).message || 'خطا در تغییر نقش کاربر'
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

  // Toggles AccessProfile.isActive — the real panel-access on/off switch.
  // (Previously this store had a `deactivate()` that PATCHed User.status to
  // 'REJECTED', which is the account-approval field, not an active/inactive
  // toggle — wrong field, and with no way to reverse it from the UI at all.)
  const setAccessActive = async (id, isActive) => {
    try {
      loading.value = true
      error.value = null
      const user = await apiPatch(endpoints.users.accessActive(id), { isActive })
      return user
    } catch (err) {
      error.value = handleApiError(err).message || 'خطا در تغییر وضعیت دسترسی'
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
    list, getUserById, create, setRole, updateUser, setAccessActive, remove,
  }
})