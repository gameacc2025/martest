// Design-system component library — reusable, token-driven, PrimeVue-compatible.
export { default as Table } from './Table.vue'
// Enterprise data table — the single shared table for all admin lists.
export { default as DataTable } from './DataTable.vue'

export { default as Badge } from './Badge.vue'
export { default as Button } from './Button.vue'
export { default as Input } from './Input.vue'
export { default as Card } from './Card.vue'
export { default as Dialog } from './Dialog.vue'
export { default as Pagination } from './Pagination.vue'
// `Modal` kept as a backward-compatible alias for the DS `Dialog`.
export { default as Modal } from './Modal.vue'
export { default as Loading } from './Loading.vue'

// Enterprise page header — breadcrumb + icon/title/description + actions slot.
export { default as PageHeader } from './PageHeader.vue'

// Reusable form UI patterns (sections, fields, grid, actions, alerts).
export * from './form'

// Feedback / state components (skeletons, empty, no-data, 403, 404, 500).
export * from './feedback'



