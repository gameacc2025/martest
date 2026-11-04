/**
 * useDashboardMenu
 *
 * Turns the shared `dashboardMenu` config into the list of sections/items the
 * current user is allowed to see. The SAME menu drives every role — this
 * composable only decides visibility, it never builds a different menu shell.
 *
 * Visibility per item (all must pass):
 *   matchesRole       = no `roles` OR user has one of the listed roles
 *   matchesPermission = no `permission` OR user has it (SUPER_ADMIN bypasses)
 *   routeExists       = no `route` OR the route is registered in THIS app's router
 *
 * Why routeExists matters: the menu config is shared by both the admin and the
 * company apps, but each app only registers its own routes. An item like
 * `admin-dashboard` exists only in the admin router; if it ever rendered inside
 * the company app, its <router-link :to="{name:'admin-dashboard'}"> would throw
 * "No match for {name:'admin-dashboard'}" and crash the sidebar. Filtering by
 * the live router makes the shared menu self-healing per app.
 *
 * Note on roles vs. permissions: SUPER_ADMIN bypasses *permission* checks, but
 * NOT *role* checks. `roles` scopes an item to a specific area/app.
 *
 * Sections with zero visible items are dropped so the sidebar stays clean.
 *
 * Note: this reads role/permission state straight from the auth store — it does
 * not touch API calls, the auth flow, or backend logic.
 */

import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { dashboardMenu } from '../config/navigation/dashboardMenu.js'

function getRoleNames(user) {
  if (!user || !Array.isArray(user.roles)) return []
  return user.roles
    .map((r) => (typeof r === 'string' ? r : r?.name || r?.role?.name))
    .filter(Boolean)
}

/**
 * @param {object} authStore - Pinia auth store instance (injected by host app)
 *   Must expose: user (ref), isSuperAdmin (computed), hasPermission (fn)
 */
export function useDashboardMenu(authStore) {
  const roleNames = computed(() => getRoleNames(authStore.user))

  // The router of the app that mounted this composable (admin or company).
  // useRouter() is safe here because useDashboardMenu runs inside a layout's
  // setup(). Guarded so the composable never hard-crashes if used elsewhere.
  let router = null
  try {
    router = useRouter()
  } catch {
    router = null
  }

  function matchesRole(item) {
    if (!item.roles || item.roles.length === 0) return true
    // Role scoping is intentionally NOT bypassed for SUPER_ADMIN — `roles`
    // marks which app/area an item belongs to. SUPER_ADMIN still bypasses
    // *permission* checks via matchesPermission below.
    return item.roles.some((role) => roleNames.value.includes(role))
  }

  function matchesPermission(item) {
    if (!item.permission) return true
    return authStore.hasPermission(item.permission)
  }

  function routeExists(item) {
    // External links and pure parent items have no `route` → always allowed.
    if (!item.route) return true
    // If we couldn't get a router, don't block anything (fail open).
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
