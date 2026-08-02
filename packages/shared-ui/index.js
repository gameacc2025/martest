/**
 * @telecom/shared-ui
 *
 * Barrel exports for shared UI components, theme, composables, and config.
 */
export { default as theme } from './theme.js'

// Composables
export { useSidebarState } from './composables/useSidebarState.js'
export { useTheme } from './composables/useTheme.js'
export { useDashboardMenu } from './composables/useDashboardMenu.js'

// Config
export * from './config/productReservedSpecificationKeys.js'
export { dashboardMenu, PUBLIC_SITE_URL } from './config/navigation/dashboardMenu.js'
