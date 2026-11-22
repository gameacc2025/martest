/**
 * Resolve the active inquiry KPI from the supported InquiryStats API contract.
 * STAFF statistics are platform-wide; the API exposes currently open inquiries
 * as received.new / received.byStatus.OPEN rather than a top-level total.
 */
export function getActiveInquiryCount(response) {
  const body = response?.data ?? response
  const data = body?.data ?? body
  const candidates = [
    data?.active,
    data?.open,
    data?.activeInquiries,
    data?.counts?.active,
    data?.received?.new,
    data?.received?.byStatus?.OPEN,
    data?.sent?.byStatus?.OPEN,
  ]
  const value = candidates.find((candidate) => candidate !== undefined && candidate !== null)
  if (value === undefined) return null
  const count = Number(value)
  return Number.isFinite(count) && count >= 0 ? count : null
}


export function getDashboardServiceStatus({ loading = false, error = false, available = true } = {}) {
  if (loading) return 'unknown'
  return error || !available ? 'degraded' : 'operational'
}
