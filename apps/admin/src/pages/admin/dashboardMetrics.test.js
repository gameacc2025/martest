import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { emptyAdminDashboardStats, getActiveInquiryCount, getDashboardServiceStatus, createLatestRequestGuard } from './dashboardMetrics.js'

const dashboardCandidates = [
  resolve(process.cwd(), 'apps/admin/src/pages/admin/Dashboard.vue'),
  resolve(process.cwd(), 'src/pages/admin/Dashboard.vue'),
]
const dashboardPath = dashboardCandidates.find(existsSync)
if (!dashboardPath) throw new Error('Could not locate Admin Dashboard.vue')
const dashboardSource = readFileSync(dashboardPath, 'utf8')

describe('getActiveInquiryCount', () => {
  it('reads the authoritative OPEN count from the InquiryStats response', () => {
    expect(getActiveInquiryCount({
      received: {
        total: 18,
        new: 6,
        byStatus: { SUBMITTED: 2, OPEN: 6, CLOSED: 10 },
      },
    })).toBe(6)
  })

  it('supports the nested API-client response envelope', () => {
    expect(getActiveInquiryCount({
      data: {
        data: { received: { byStatus: { OPEN: 4 } } },
      },
    })).toBe(4)
  })

  it('uses only the documented received OPEN aggregate and ignores unrelated counters', () => {
    expect(getActiveInquiryCount({ active: 9, received: { new: 3 } })).toBe(3)
    expect(getActiveInquiryCount({ counts: { active: '7' } })).toBe(null)
    expect(getActiveInquiryCount({ sent: { byStatus: { OPEN: 8 } } })).toBe(null)
  })

  it('does not mistake the total inquiry count for the active count', () => {
    expect(getActiveInquiryCount({ received: { total: 18, byStatus: { CLOSED: 18 } } })).toBe(null)
    expect(getActiveInquiryCount({ total: 18 })).toBe(null)
  })

  it('returns null for missing, invalid, or negative count data', () => {
    expect(getActiveInquiryCount(null)).toBe(null)
    expect(getActiveInquiryCount({ received: { new: 'not-a-number' } })).toBe(null)
    expect(getActiveInquiryCount({ received: { new: -1 } })).toBe(null)
    expect(getActiveInquiryCount({ received: { new: 1.5 } })).toBe(null)
  })
})


describe('emptyAdminDashboardStats', () => {
  it('clears every KPI and recent-user list instead of retaining stale values after a failed request', () => {
    const empty = emptyAdminDashboardStats()
    expect(empty).toMatchObject({
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
    })
  })
})

describe('Admin dashboard list failure states', () => {
  it('shows retryable errors instead of empty lists for companies and products', () => {
    expect(dashboardSource).toContain('v-if="companiesError"')
    expect(dashboardSource).toContain('@click="fetchCompanies"')
    expect(dashboardSource).toContain('v-if="productsError"')
    expect(dashboardSource).toContain('@click="fetchProducts"')
  })

  it('guards every dashboard fetcher against stale overlapping responses', () => {
    for (const key of ['stats', 'inquiryStats', 'companies', 'products', 'pendingProducts']) {
      expect(dashboardSource).toContain(`requestGuard.begin('${key}')`)
      expect(dashboardSource).toContain(`requestGuard.isCurrent('${key}', requestId)`)
    }
  })

  it('disables list retry controls while their latest request is loading', () => {
    expect(dashboardSource).toContain(':disabled="loadingCompanies"')
    expect(dashboardSource).toContain(':disabled="loadingProducts"')
    expect(dashboardSource).toContain(':disabled="loadingPending"')
  })

  it('offers retry actions for failed platform and inquiry statistics', () => {
    expect(dashboardSource).toContain('v-if="statsError"')
    expect(dashboardSource).toContain('@click="fetchStats"')
    expect(dashboardSource).toContain(':disabled="loadingStats"')
    expect(dashboardSource).toContain('v-if="inquiryStatsError"')
    expect(dashboardSource).toContain('@click="fetchInquiryStats"')
    expect(dashboardSource).toContain(':disabled="loadingInquiryStats"')
  })

  it('shows pending-queue failure before the legitimate empty-queue state', () => {
    const failureIndex = dashboardSource.indexOf('v-else-if="pendingProductsError"')
    const emptyIndex = dashboardSource.indexOf('v-else-if="!pendingProducts.length"')
    expect(failureIndex).toBeGreaterThan(-1)
    expect(emptyIndex).toBeGreaterThan(failureIndex)
    expect(dashboardSource).toContain('@click="fetchPendingProducts"')
    expect(dashboardSource).toContain('خالی بودن این فهرست تأیید نشده است')
  })
})

describe('createLatestRequestGuard', () => {
  it('ignores stale responses independently for each dashboard data source', () => {
    const guard = createLatestRequestGuard()
    const firstCompaniesRequest = guard.begin('companies')
    const firstStatsRequest = guard.begin('stats')
    const latestCompaniesRequest = guard.begin('companies')

    expect(guard.isCurrent('companies', firstCompaniesRequest)).toBe(false)
    expect(guard.isCurrent('companies', latestCompaniesRequest)).toBe(true)
    expect(guard.isCurrent('stats', firstStatsRequest)).toBe(true)
  })

  it('keeps a newer retry authoritative even when an older request settles last', () => {
    const guard = createLatestRequestGuard()
    const older = guard.begin('pendingProducts')
    const newer = guard.begin('pendingProducts')

    expect(guard.isCurrent('pendingProducts', newer)).toBe(true)
    expect(guard.isCurrent('pendingProducts', older)).toBe(false)
  })
})

describe('getDashboardServiceStatus', () => {
  it('does not report an unverified loading service as operational', () => {
    expect(getDashboardServiceStatus({ loading: true })).toBe('unknown')
  })
  it('keeps unrequested services unknown and reports failures/missing data as degraded', () => {
    expect(getDashboardServiceStatus({ error: null })).toBe('unknown')
    expect(getDashboardServiceStatus({ error: true })).toBe('degraded')
    expect(getDashboardServiceStatus({ error: false, available: false })).toBe('degraded')
  })
  it('reports a completed successful request as operational', () => {
    expect(getDashboardServiceStatus({ loading: false, error: false, available: true })).toBe('operational')
  })
})
