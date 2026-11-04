import { defineStore } from 'pinia'
import { ref } from 'vue'
import { apiGet } from '@telecom/shared-core/http/apiClient'
import { handleApiError } from '@telecom/api-client'
import { endpoints } from '@telecom/api-client'

export const useStatsStore = defineStore('stats', () => {
  const stats = ref({
    totalUsers: 0,
    activeUsers: 0,
    totalProducts: 0,
    totalOrders: 0,
    totalCompanies: 0,
    totalRoles: 0,
    totalPermissions: 0,
    recentUsers: []
  })

  const loading = ref(false)
  const error = ref(null)

  const getDashboardStats = async () => {
    try {
      loading.value = true
      error.value = null

      const data = await apiGet(endpoints.admin.stats)

      // Map the admin stats response to the stats object
      stats.value = {
        totalUsers: data.counts?.users || 0,
        activeUsers: data.counts?.activeUsers || 0,
        totalProducts: data.counts?.products || 0,
        totalOrders: data.counts?.orders || 0,
        totalCompanies: data.counts?.companies || 0,
        totalRoles: data.counts?.roles || 0,
        totalPermissions: data.counts?.permissions || 0,
        recentUsers: data.recentUsers || []
      }
      return stats.value
    } catch (err) {
      error.value = handleApiError(err).message || 'خطا در دریافت آمار'
      console.error('Error fetching dashboard stats:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    stats,
    loading,
    error,
    getDashboardStats
  }
})
