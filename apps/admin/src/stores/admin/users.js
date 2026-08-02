import { defineStore } from 'pinia'
import { ref } from 'vue'
import { apiGet, apiGetPaginated, apiPost, apiPatch, apiDelete } from '@telecom/shared-core/http/apiClient'
import { handleApiError } from '@telecom/api-client'
import { endpoints } from '@telecom/api-client'

export const useUserStore = defineStore('admin-users', () => {
  const users = ref([])
  const loading = ref(false)
  const error = ref(null)
  const pagination = ref({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  })

  /**
   * Get users with pagination and filtering
   * @param {Object} params - Filter parameters
   * @returns {Promise<Object>} Users data
   */
  const getUsers = async (params = {}) => {
    try {
      loading.value = true
      error.value = null

      const { data, meta } = await apiGetPaginated(endpoints.users.list, {
        params: {
          page: params.page || pagination.value.page,
          limit: params.limit || pagination.value.limit,
          search: params.search || undefined,
          // status is a first-class filter now (ACTIVE / PENDING / REJECTED)
          status: params.status || undefined,
          type: params.type || undefined,
          sortBy: params.sortBy || undefined,
          sortOrder: params.sortOrder || undefined,
        }
      })


      users.value = Array.isArray(data) ? data : []
      pagination.value = {
        page: meta?.page || 1,
        limit: meta?.limit || 10,
        total: meta?.total || 0,
        totalPages: meta?.totalPages || 1,
      }

      return {
        users: users.value,
        page: pagination.value.page,
        limit: pagination.value.limit,
        total: pagination.value.total,
        totalPages: pagination.value.totalPages,
      }
    } catch (err) {
      error.value = handleApiError(err).message || 'خطا در دریافت کاربران'
      console.error('Error fetching users:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Get user by ID
   * @param {number} id - User ID
   * @returns {Promise<Object>} User data
   */
  const getUserById = async (id) => {
    try {
      loading.value = true
      error.value = null

      const user = await apiGet(endpoints.users.get(id))
      return user
    } catch (err) {
      error.value = handleApiError(err).message || 'خطا در دریافت کاربر'
      console.error('Error fetching user:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Create user.
   *
   * Maps directly to the backend domain model:
   *   - User          → email, phone, password, status
   *   - Profile       → firstName, lastName
   *   - AccessProfile → type (STAFF | COMPANY | CUSTOMER), companyId
   *   - Roles         → roleIds[]
   *
   * @param {Object} data - User form data
   * @returns {Promise<Object>} Created user
   */
  const createUser = async (data) => {
    try {
      loading.value = true
      error.value = null

      const payload = {
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
      }

      if (data.phone) payload.phone = data.phone
      if (data.type) payload.type = data.type
      // Company is only meaningful for COMPANY members.
      if (data.type === 'COMPANY' && data.companyId) payload.companyId = data.companyId
      if (data.status) payload.status = data.status

      // roleId (single) or roleIds (array) → backend expects roleIds[]
      const roleIds = data.roleIds
        ? data.roleIds
        : (data.roleId ? [data.roleId] : [])
      if (roleIds.length) payload.roleIds = roleIds

      const user = await apiPost(endpoints.users.create, payload)

      // Direct permissions (if provided) are assigned via the access endpoint
      // after creation, since the create body does not accept permissionIds.
      const permissionIds = data.permissionIds || []
      if (user?.id && (roleIds.length || permissionIds.length)) {
        await apiPatch(endpoints.users.access(user.id), {
          roleId: roleIds.length ? roleIds[0] : null,
          permissionIds,
        })
      }

      return user
    } catch (err) {
      error.value = handleApiError(err).message || 'خطا در ایجاد کاربر'
      console.error('Error creating user:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Update user.
   *
   * Splits the incoming form data across the three backend surfaces:
   *   - PATCH /users/:id           → identity + profile + access (type/company)
   *   - PATCH /users/:id/access    → role + direct permissions
   *   - PATCH /auth/users/:id/password → optional password reset
   *
   * @param {number} id - User ID
   * @param {Object} data - Update data
   * @returns {Promise<Object>} Updated user
   */
  const updateUser = async (id, data) => {
    try {
      loading.value = true
      error.value = null

      const payload = {}
      if (data.email !== undefined) payload.email = data.email
      if (data.phone !== undefined) payload.phone = data.phone || null
      if (data.firstName !== undefined) payload.firstName = data.firstName || null
      if (data.lastName !== undefined) payload.lastName = data.lastName || null
      if (data.avatar !== undefined) payload.avatar = data.avatar || null
      if (data.status !== undefined) payload.status = data.status
      if (data.type !== undefined) payload.type = data.type
      // Company relation only applies to COMPANY members; STAFF/CUSTOMER → null.
      if (data.type !== undefined || data.companyId !== undefined) {
        payload.companyId = data.type === 'COMPANY' ? (data.companyId || null) : null
      }
      if (data.isAccessActive !== undefined) payload.isAccessActive = data.isAccessActive

      const user = await apiPatch(endpoints.users.update(id), payload)

      // Roles / direct permissions → access endpoint (requires users.assign_roles)
      if (data.roleId !== undefined || data.roleIds !== undefined || data.permissionIds !== undefined) {
        const roleId = data.roleId !== undefined
          ? data.roleId
          : (data.roleIds && data.roleIds.length > 0 ? data.roleIds[0] : null)
        await apiPatch(endpoints.users.access(id), {
          roleId: roleId || null,
          permissionIds: data.permissionIds || [],
        })
      }

      // Optional password reset (requires users.reset_password)
      if (data.password) {
        await apiPatch(endpoints.users.resetPassword(id), { newPassword: data.password })
      }

      return user
    } catch (err) {
      error.value = handleApiError(err).message || 'خطا در بروزرسانی کاربر'
      console.error('Error updating user:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Delete user
   * @param {number} id - User ID
   * @returns {Promise<Object>} Success message
   */
  const deleteUser = async (id) => {
    try {
      loading.value = true
      error.value = null

      const result = await apiDelete(endpoints.users.delete(id))
      return result
    } catch (err) {
      error.value = handleApiError(err).message || 'خطا در حذف کاربر'
      console.error('Error deleting user:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Update user status
   * @param {number} id - User ID
   * @param {string} status - User status (ACTIVE, PENDING, REJECTED)
   * @returns {Promise<Object>} Updated user
   */
  const updateUserStatus = async (id, status) => {
    try {
      loading.value = true
      error.value = null

      const user = await apiPatch(endpoints.users.update(id), { status })
      return user
    } catch (err) {
      error.value = handleApiError(err).message || 'خطا در بروزرسانی وضعیت کاربر'
      console.error('Error updating user status:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Set user access (role and direct permissions)
   * @param {number} id - User ID
   * @param {Object} data - { roleId, permissionIds }
   * @returns {Promise<Object>} Updated access
   */
  const setUserAccess = async (id, data) => {
    try {
      loading.value = true
      error.value = null

      const access = await apiPatch(endpoints.users.access(id), {
        roleId: data.roleId ?? (data.roleIds && data.roleIds.length ? data.roleIds[0] : null),
        permissionIds: data.permissionIds || [],
      })
      return access
    } catch (err) {
      error.value = handleApiError(err).message || 'خطا در بروزرسانی دسترسی کاربر'
      console.error('Error updating user access:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    users,
    loading,
    error,
    pagination,
    getUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser,
    updateUserStatus,
    setUserAccess,
  }
})
