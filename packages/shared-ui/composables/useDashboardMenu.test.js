import { reactive } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const routerMock = vi.hoisted(() => ({
  hasRoute: vi.fn(() => true),
}))

vi.mock('vue-router', () => ({
  useRouter: () => routerMock,
}))

import { useDashboardMenu } from './useDashboardMenu.js'

function visibleItemsFor(roles, permissions = ['*']) {
  const authStore = reactive({
    // Mirrors the real @telecom/auth store: identity and authorization are
    // separate; roles are NOT nested under user.
    user: { id: 'user-1' },
    roles,
    hasPermission: (permission) =>
      permissions.includes('*') ||
      (Array.isArray(permission)
        ? permission.some((entry) => permissions.includes(entry))
        : permissions.includes(permission)),
  })

  const { menu } = useDashboardMenu(authStore)
  return menu.value.flatMap((section) => section.items)
}

function findItem(items, title) {
  return items.find((item) => item.title === title)
}

describe('useDashboardMenu role resolution', () => {
  beforeEach(() => {
    routerMock.hasRoute.mockReset()
    routerMock.hasRoute.mockReturnValue(true)
  })

  it('shows Admin dashboard and order submenus for a platform admin', () => {
    const items = visibleItemsFor(['ADMIN'])
    expect(findItem(items, 'داشبورد')?.route).toBe('admin-dashboard')

    const orders = findItem(items, 'سفارشات')
    expect(orders?.children.map((child) => child.query.status)).toEqual([
      'همه',
      'در انتظار پردازش',
      'ارسال‌شده',
      'تحویل‌شده',
      'مرجوعی',
    ])
  })

  it('shows Company dashboard and order submenus for a company user', () => {
    const items = visibleItemsFor(['COMPANY_USER'])
    expect(findItem(items, 'داشبورد')?.route).toBe('company-dashboard')

    const orders = findItem(items, 'سفارشات')
    expect(orders?.children.map((child) => child.query.status)).toEqual([
      'همه',
      'جدید؛ نیازمند پذیرش',
      'در حال آماده‌سازی',
      'ارسال‌شده',
      'تحویل‌شده',
    ])
  })

  it('supports role objects returned by compatible auth contexts', () => {
    const items = visibleItemsFor([{ name: 'COMPANY_MANAGER' }])
    expect(findItem(items, 'داشبورد')?.route).toBe('company-dashboard')
    expect(findItem(items, 'سفارشات')?.children).toHaveLength(5)
  })

  it('does not show another app dashboard when the user has no matching role', () => {
    const items = visibleItemsFor([])
    expect(findItem(items, 'داشبورد')).toBeUndefined()
    expect(findItem(items, 'سفارشات')).toBeUndefined()
  })

  it('continues to enforce explicit permission gates for permission-based items', () => {
    const items = visibleItemsFor(['ADMIN'], [])
    expect(findItem(items, 'داشبورد')?.route).toBe('admin-dashboard')
    expect(findItem(items, 'کاربران')).toBeUndefined()
  })

  it('hides links whose named route is not registered in the current app', () => {
    routerMock.hasRoute.mockImplementation((name) => name !== 'admin-dashboard')
    const items = visibleItemsFor(['ADMIN'])
    expect(findItem(items, 'داشبورد')).toBeUndefined()
  })
})
