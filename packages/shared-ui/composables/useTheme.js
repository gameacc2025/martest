/**
 * useTheme
 *
 * Shared, persisted light/dark theme state for the app. PrimeVue is configured
 * with `darkModeSelector: '.app-dark'` (see main.js), so switching themes is a
 * matter of toggling that class on the document root. Exposed as a module-level
 * singleton so every consumer (e.g. the header switch) stays in sync, and the
 * choice survives reloads via localStorage.
 *
 * UI state only — no API, auth, or business logic.
 */
import { ref, watch } from 'vue'

const STORAGE_KEY = 'dashboard.theme'
const DARK_CLASS = 'app-dark'

function readInitial() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'dark' || stored === 'light') return stored
  } catch {
    /* ignore */
  }
  // Fall back to the OS preference on first visit.
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }
  return 'light'
}

const theme = ref(readInitial())

function apply(value) {
  const root = document.documentElement
  if (value === 'dark') {
    root.classList.add(DARK_CLASS)
  } else {
    root.classList.remove(DARK_CLASS)
  }
}

// Keep the DOM + storage in sync with the ref.
watch(
  theme,
  (value) => {
    apply(value)
    try {
      localStorage.setItem(STORAGE_KEY, value)
    } catch {
      /* ignore persistence errors */
    }
  },
  { immediate: true }
)

export function useTheme() {
  const isDark = () => theme.value === 'dark'

  function toggle() {
    theme.value = theme.value === 'dark' ? 'light' : 'dark'
  }

  function setTheme(value) {
    theme.value = value === 'dark' ? 'dark' : 'light'
  }

  return { theme, isDark, toggle, setTheme }
}

export default useTheme
