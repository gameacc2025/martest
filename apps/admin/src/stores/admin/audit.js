import { defineStore } from 'pinia'
import { ref } from 'vue'
import { apiGet, apiGetPaginated } from '@telecom/shared-core/http/apiClient'
import { handleApiError } from '@telecom/api-client'
import { endpoints } from '@telecom/api-client'

export const useAuditStore = defineStore('admin-audit', () => {
  const logs = ref([])
  const loading = ref(false)
  const error = ref(null)
  const pagination = ref({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 1,
  })
  const stats = ref({})

  /**
   * Search audit logs with filters and pagination
   * @param {Object} params - Filter parameters
   * @returns {Promise<Object>} Audit logs data
   */
  const searchAuditLogs = async (params = {}) => {
    try {
      loading.value = true
      error.value = null

      const result = await apiGetPaginated(endpoints.audit.logs, {
        params: {
          page: params.page || pagination.value.page,
          limit: params.limit || pagination.value.limit,
          action: params.action || undefined,
          entityType: params.entityType || undefined,
          entityId: params.entityId || undefined,
          userId: params.userId || undefined,
          ipAddress: params.ipAddress || undefined,
          severity: params.severity || undefined,
          dateFrom: params.dateFrom || undefined,
          dateTo: params.dateTo || undefined,
          sortBy: params.sortBy || 'occurredAt',
          sortOrder: params.sortOrder || 'desc',
        }
      })

      logs.value = Array.isArray(result.data) ? result.data : []
      pagination.value = {
        page: result.meta?.page || 1,
        limit: result.meta?.limit || 50,
        total: result.meta?.total || 0,
        totalPages: result.meta?.totalPages || 1,
      }

      return {
        logs: logs.value,
        page: pagination.value.page,
        limit: pagination.value.limit,
        total: pagination.value.total,
        totalPages: pagination.value.totalPages,
      }
    } catch (err) {
      error.value = handleApiError(err).message || 'خطا در دریافت لاگ‌های حسابرسی'
      console.error('Error fetching audit logs:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Get audit log statistics for dashboard
   * @param {Object} params - Date range filters
   * @returns {Promise<Object>} Audit log statistics
   */
  const getAuditStats = async (params = {}) => {
    try {
      loading.value = true
      error.value = null

      const result = await apiGet(endpoints.audit.stats, {
        params: {
          dateFrom: params.dateFrom || undefined,
          dateTo: params.dateTo || undefined,
        }
      })

      stats.value = result.data || result
      return stats.value
    } catch (err) {
      error.value = handleApiError(err).message || 'خطا در دریافت آمار حسابرسی'
      console.error('Error fetching audit stats:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Get a single audit log entry by ID
   * @param {number} id - Audit log ID
   * @returns {Promise<Object>} Audit log entry
   */
  const getAuditLogById = async (id) => {
    try {
      loading.value = true
      error.value = null

      const log = await apiGet(endpoints.audit.get(id))
      return log
    } catch (err) {
      error.value = handleApiError(err).message || 'خطا در دریافت لاگ حسابرسی'
      console.error('Error fetching audit log:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Export audit logs (CSV/JSON)
   * @param {Object} params - Filter parameters and format
   * @returns {Promise<Blob>} Export file
   */
  const exportAuditLogs = async (params = {}) => {
    try {
      loading.value = true
      error.value = null

      const result = await apiGet(endpoints.audit.export, {
        params: {
          format: params.format || 'json',
          action: params.action || undefined,
          entityType: params.entityType || undefined,
          entityId: params.entityId || undefined,
          userId: params.userId || undefined,
          ipAddress: params.ipAddress || undefined,
          severity: params.severity || undefined,
          dateFrom: params.dateFrom || undefined,
          dateTo: params.dateTo || undefined,
          sortBy: params.sortBy || 'occurredAt',
          sortOrder: params.sortOrder || 'desc',
        },
        responseType: 'blob',
      })

      return result
    } catch (err) {
      error.value = handleApiError(err).message || 'خطا در صادرات لاگ‌های حسابرسی'
      console.error('Error exporting audit logs:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    logs,
    stats,
    loading,
    error,
    pagination,
    searchAuditLogs,
    getAuditStats,
    getAuditLogById,
    exportAuditLogs,
  }
})