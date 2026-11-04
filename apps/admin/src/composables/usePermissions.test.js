import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { usePermissions } from './usePermissions.js'
import { useAuthStore } from '../stores/auth'
import { PERMISSIONS } from '@telecom/permissions'

/**
 * Authorization helpers used by every permission-dependent menu/panel in the
 * admin app. They must stay a thin, truthful view over the auth store's
 * permission logic (including the '*' wildcard and the SUPER_ADMIN label).
 */

function seed(overrides = {}) {
  const { permissions = ['users.read', 'products.read'], roles = ['SUPPORT'], ...rest } = overrides
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
    seed({ permissions: ['users.read'] })
    const { permissions } = usePermissions()

    expect(permissions.value).toEqual(['users.read'])
    expect(useAuthStore().userPermissions).toEqual(['users.read'])
  })

  it('can() grants exactly the seeded permissions', () => {
    seed()
    const { can } = usePermissions()

    expect(can(PERMISSIONS.USERS.READ)).toBe(true)
    expect(can('users.read')).toBe(true)
    expect(can(PERMISSIONS.USERS.DELETE)).toBe(false)
    expect(can('invented.permission')).toBe(false)
  })

  it("can() grants everything under the '*' wildcard", () => {
    seed({ permissions: ['*'] })
    const { can } = usePermissions()

    expect(can('anything.at.all')).toBe(true)
    expect(can(PERMISSIONS.ROLES.DELETE)).toBe(true)
  })

  it('canAny() needs one match, canAll() needs every match', () => {
    seed({ permissions: ['users.read'] })
    const { canAny, canAll } = usePermissions()

    expect(canAny([PERMISSIONS.USERS.READ, 'products.write'])).toBe(true)
    expect(canAll([PERMISSIONS.USERS.READ, 'products.write'])).toBe(false)
    expect(canAll([PERMISSIONS.USERS.READ])).toBe(true)
  })

  it('empty permission lists are treated as "no restriction" (shipped contract)', () => {
    seed({ permissions: [] })
    const { canAny, canAll } = usePermissions()

    expect(canAny([])).toBe(true)
    expect(canAll([])).toBe(true)
  })

  it('surfaces the SUPER_ADMIN label for UI gating', () => {
    seed({ permissions: ['*'], roles: ['SUPER_ADMIN'] })
    const { isSuperAdmin, isAdmin, can } = usePermissions()

    expect(isSuperAdmin.value).toBe(true)
    expect(isAdmin.value).toBe(true)
    expect(can('arbitrary')).toBe(true)
  })

  it('is not fooled by a privileged role without actual permissions', () => {
    // A role label alone must NOT grant permissions — RBAC is
    // permission-driven; roles only drive labels.
    seed({ permissions: [], roles: ['SUPER_ADMIN'] })
    const { can } = usePermissions()

    expect(can('users.delete')).toBe(false)
  })

  it('exposes the single-source permission constants via P', () => {
    const { P } = usePermissions()

    expect(P.USERS.READ).toBe('users.read')
    expect(P).toBe(PERMISSIONS)
  })
})