/**
 * Resolve the active inquiry KPI from the supported InquiryStats API contract.
 * STAFF statistics are platform-wide; the API exposes currently open inquiries
 * as received.new / received.byStatus.OPEN rather than a top-level total.
 */
export function getActiveInquiryCount(response) {
  const body = response?.data ?? response
  const data = body?.data ?? body
  // F1 contract: active means received OPEN inquiries only. Do not fall back
  // to sent inquiries or legacy generic counters that may mean something else.
  const value = data?.received?.new ?? data?.received?.byStatus?.OPEN
  if (value === undefined || value === null) return null
  const count = Number(value)
  return Number.isInteger(count) && count >= 0 ? count : null
}


export function getDashboardServiceStatus({ loading = false, error = null, available = true } = {}) {
  if (loading || error === null) return 'unknown'
  return error || !available ? 'degraded' : 'operational'
}


export function emptyAdminDashboardStats() {
  return {
    totalUsers: null,
    activeUsers: null,
    totalCompanies: null,
    totalProducts: null,
    pendingProducts: null,
    totalInquiries: null,
    totalOrders: null,
    totalRoles: null,
    totalPermissions: null,
    recentUsers: [],
  }
}
