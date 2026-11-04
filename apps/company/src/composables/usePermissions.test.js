import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { usePermissions } from './usePermissions.js'
import { useAuthStore } from '../stores/auth'
import { PERMISSIONS } from '@telecom/permissions'

/**
 * Authorization helpers used by every permission-dependent menu/page in the
 * company app. They must stay a thin, truthful view over the auth store's
 * permission logic (including the '*' wildcard and the SUPER_ADMIN label).
 */

function seed(overrides = {}) {
  const { permissions = ['products.read', 'inquiries.read'], roles = ['COMPANY_USER'], ...rest } = overrides
  localStorage.setItem('user', JSON.stringify({ id: 1, email: 'a@b.c', ...rest }))
  localStorage.setItem('permissions', JSON.stringify(permissions))
  localStorage.setItem('roles', JSON.stringify(roles))
}

beforeEach(() => {
  localStorage.clear()
  window.sessionStorage.clear()
  setActivePinia(createPinia())
})

describe('usePermissions', () => {
  it('mirrors the store permission list reactively', () => {
    seed({ permissions: ['products.read'] })
    const { permissions } = usePermissions()

    expect(permissions.value).toEqual(['products.read'])
    expect(useAuthStore().userPermissions).toEqual(['products.read'])
  })

  it('can() grants exactly the seeded permissions', () => {
    seed()
    const { can } = usePermissions()

    expect(can(PERMISSIONS.PRODUCTS.READ)).toBe(true)
    expect(can('products.read')).toBe(true)
    expect(can(PERMISSIONS.PRODUCTS.DELETE)).toBe(false)
    expect(can('invented.permission')).toBe(false)
  })

  it("can() grants everything under the '*' wildcard", () => {
    seed({ permissions: ['*'] })
    const { can } = usePermissions()

    expect(can('anything.at.all')).toBe(true)
    expect(can(PERMISSIONS.USERS.CREATE)).toBe(true)
  })

  it('canAny() needs one match, canAll() needs every match', () => {
    seed({ permissions: ['products.read'] })
    const { canAny, canAll } = usePermissions()

    expect(canAny([PERMISSIONS.PRODUCTS.READ, 'orders.write'])).toBe(true)
    expect(canAll([PERMISSIONS.PRODUCTS.READ, 'orders.write'])).toBe(false)
    expect(canAll([PERMISSIONS.PRODUCTS.READ])).toBe(true)
  })

  it('empty permission lists are treated as "no restriction" (shipped contract)', () => {
    seed({ permissions: [] })
    const { canAny, canAll } = usePermissions()

    expect(canAny([])).toBe(true)
    expect(canAll([])).toBe(true)
  })

  it('a COMPANY_MANAGER role drives the admin label but not rogue permissions', () => {
    seed({ permissions: [], roles: ['COMPANY_MANAGER'] })
    const { isAdmin, can } = usePermissions()

    expect(isAdmin.value).toBe(true)
    expect(can('products.delete')).toBe(false) // permission-driven, not role-driven
  })

  it('exposes the single-source permission constants via P', () => {
    const { P } = usePermissions()

    expect(P.PRODUCTS.READ).toBe('products.read')
    expect(P).toBe(PERMISSIONS)
  })
})