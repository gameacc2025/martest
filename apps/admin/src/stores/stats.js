import { defineStore } from 'pinia'
import { ref } from 'vue'
import { apiGet } from '@telecom/shared-core/http/apiClient'
import { handleApiError } from '@telecom/api-client'
import { endpoints } from '@telecom/api-client'

export const useStatsStore = defineStore('stats', () => {
  const stats = ref({
    totalUsers: 0,
    activeUsers: 0,
    pendingProducts: 0,
    totalInquiries: 0,
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
        totalUsers: data.counts?.users ?? null,
        activeUsers: data.counts?.activeUsers ?? null,
        pendingProducts: data.counts?.pendingProducts ?? null,
        totalInquiries: data.counts?.inquiries ?? null,
        totalProducts: data.counts?.products ?? null,
        totalOrders: data.counts?.orders ?? null,
        totalCompanies: data.counts?.companies ?? null,
        totalRoles: data.counts?.roles ?? null,
        totalPermissions: data.counts?.permissions ?? null,
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
