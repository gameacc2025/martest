/**
 * useSidebarState
 *
 * Shared, persisted collapse state for the dashboard sidebar. Exposed as a
 * module-level singleton so every consumer (the sidebar's own collapse button
 * and the header toggle) stays in sync and the choice survives reloads via
 * localStorage.
 *
 * UI state only — no API, auth, or permission logic here.
 */
import { ref, watch } from 'vue'

const STORAGE_KEY = 'dashboard.sidebar.collapsed'

function readInitial() {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'true'
  } catch {
    return false
  }
}

// Singleton refs shared across all callers.
const collapsed = ref(readInitial())

watch(collapsed, (value) => {
  try {
    localStorage.setItem(STORAGE_KEY, value ? 'true' : 'false')
  } catch {
    /* ignore persistence errors (private mode, quota, etc.) */
  }
})

export function useSidebarState() {
  function toggle() {
    collapsed.value = !collapsed.value
  }

  function setCollapsed(value) {
    collapsed.value = !!value
  }

  return { collapsed, toggle, setCollapsed }
}

export default useSidebarState
