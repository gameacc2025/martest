/**
 * usePermissions Composable — Company Portal
 *
 * Centralized permission checking utility.
 * Wraps the auth store's permission methods for use in components.
 */

import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { PERMISSIONS } from '@telecom/permissions'

export function usePermissions() {
  const authStore = useAuthStore()

  const permissions = computed(() => authStore.userPermissions)
  const isSuperAdmin = computed(() => authStore.isSuperAdmin)
  const isAdmin = computed(() => authStore.isAdmin)

  /**
   * Check if user has a specific permission.
   * @param {string} permission - Permission string (e.g., PERMISSIONS.PRODUCTS.READ)
   * @returns {boolean}
   */
  function can(permission) {
    return authStore.hasPermission(permission)
  }

  /**
   * Check if user has ANY of the given permissions.
   * @param {string[]} permissionList
   * @returns {boolean}
   */
  function canAny(permissionList) {
    return authStore.hasAnyPermission(permissionList)
  }

  /**
   * Check if user has ALL of the given permissions.
   * @param {string[]} permissionList
   * @returns {boolean}
   */
  function canAll(permissionList) {
    if (!permissionList || permissionList.length === 0) return true
    if (authStore.isSuperAdmin) return true
    return permissionList.every(p => authStore.userPermissions.includes(p))
  }

  return {
    permissions,
    isSuperAdmin,
    isAdmin,
    can,
    canAny,
    canAll,
    // Expose permission constants for convenience
    P: PERMISSIONS,
  }
}

export default usePermissions
