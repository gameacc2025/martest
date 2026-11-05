/**
 * useDashboardMenu
 *
 * Resolves the shared dashboard navigation against the current app router,
 * the auth store's top-level roles array, and the user's permissions.
 */
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { dashboardMenu } from '../config/navigation/dashboardMenu.js'

function getRoleNames(roles) {
  if (!Array.isArray(roles)) return []
  return roles
    .map((role) => (typeof role === 'string' ? role : role?.name || role?.role?.name))
    .filter(Boolean)
}

/**
 * @param {object} authStore - Pinia auth store instance.
 *   The auth package keeps identity in user and authorization in roles /
 *   permissions. Do not read roles from authStore.user.
 */
export function useDashboardMenu(authStore) {
  const roleNames = computed(() => getRoleNames(authStore.roles))

  let router = null
  try {
    router = useRouter()
  } catch {
    router = null
  }

  function matchesRole(item) {
    if (!item.roles || item.roles.length === 0) return true
    return item.roles.some((role) => roleNames.value.includes(role))
  }

  function matchesPermission(item) {
    if (!item.permission) return true
    return authStore.hasPermission(item.permission)
  }

  function routeExists(item) {
    if (!item.route) return true
    if (!router || typeof router.hasRoute !== 'function') return true
    return router.hasRoute(item.route)
  }

  function isSelfVisible(item) {
    return matchesRole(item) && matchesPermission(item) && routeExists(item)
  }

  function resolveItem(item) {
    if (!isSelfVisible(item)) return null
    if (Array.isArray(item.children) && item.children.length > 0) {
      const children = item.children.map(resolveItem).filter(Boolean)
      if (children.length === 0) return null
      return { ...item, children }
    }
    return item
  }

  const menu = computed(() =>
    dashboardMenu
      .map((section) => ({
        section: section.section,
        items: (section.items || []).map(resolveItem).filter(Boolean),
      }))
      .filter((section) => section.items.length > 0)
  )

  return { menu }
}

export default useDashboardMenu
