/**
 * Product Management Configuration — Company Portal
 *
 * Defines product status labels, severity colors, allowed transitions,
 * and UI action rules for the company portal.
 *
 * This is the SINGLE source of truth for product-related UI logic.
 */

// ── Status Labels (Persian) ─────────────────────────────────
export const STATUS_LABELS = {
  DRAFT: 'پیش\u200cنویس',
  PENDING_REVIEW: 'در انتظار تأیید',
  APPROVED: 'تأیید شده',
  REJECTED: 'رد شده',
  PUBLISHED: 'منتشر شده',
  HIDDEN: 'پنهان',
  ARCHIVED: 'بایگانی',
}

// ── Status Severity (PrimeVue Tag) ──────────────────────────
export const STATUS_SEVERITY = {
  DRAFT: 'secondary',
  PENDING_REVIEW: 'warn',
  APPROVED: 'info',
  REJECTED: 'danger',
  PUBLISHED: 'success',
  HIDDEN: 'secondary',
  ARCHIVED: 'danger',
}

// ── Status Transitions (backend truth) ──────────────────────
// Company users can only perform certain actions on their products.
export const ALLOWED_TRANSITIONS = {
  submitReview: { from: ['DRAFT', 'REJECTED'], to: 'PENDING_REVIEW' },
  archive: { from: ['DRAFT', 'REJECTED', 'APPROVED', 'PUBLISHED', 'HIDDEN'], to: 'ARCHIVED' },
  restoreDraft: { from: ['PENDING_REVIEW', 'APPROVED', 'REJECTED', 'HIDDEN', 'ARCHIVED'], to: 'DRAFT' },
}

// ── Status Filter Options ───────────────────────────────────
export const STATUS_OPTIONS = [
  { label: 'همه وضعیت\u200cها', value: null },
  { label: 'پیش\u200cنویس', value: 'DRAFT' },
  { label: 'در انتظار تأیید', value: 'PENDING_REVIEW' },
  { label: 'تأیید شده', value: 'APPROVED' },
  { label: 'رد شده', value: 'REJECTED' },
  { label: 'منتشر شده', value: 'PUBLISHED' },
  { label: 'پنهان', value: 'HIDDEN' },
  { label: 'بایگانی', value: 'ARCHIVED' },
]

// ── Helper Functions ────────────────────────────────────────

/**
 * Get the Persian label for a product status.
 * @param {string} status
 * @returns {string}
 */
export function getStatusLabel(status) {
  return STATUS_LABELS[status] || status || '—'
}

/**
 * Get the PrimeVue Tag severity for a product status.
 * @param {string} status
 * @returns {string}
 */
export function getStatusSeverity(status) {
  return STATUS_SEVERITY[status] || 'secondary'
}

/**
 * Check if a product can be submitted for review.
 * @param {object} product
 * @returns {boolean}
 */
export function canSubmitForReview(product) {
  return product?.status === 'DRAFT' || product?.status === 'REJECTED'
}

/**
 * Check if a product can be edited.
 * Company users can only edit DRAFT products.
 * @param {object} product
 * @returns {boolean}
 */
export function canEdit(product) {
  return product?.status === 'DRAFT'
}

/**
 * Check if a product can be archived.
 * @param {object} product
 * @returns {boolean}
 */
export function canArchive(product) {
  const archiveable = ['DRAFT', 'REJECTED', 'APPROVED', 'PUBLISHED', 'HIDDEN']
  return archiveable.includes(product?.status)
}

/**
 * Get the list of allowed actions for a product.
 * @param {object} product
 * @returns {string[]}
 */
export function getAllowedActions(product) {
  const actions = []
  if (canSubmitForReview(product)) actions.push('submitReview')
  if (canEdit(product)) actions.push('edit')
  if (canArchive(product)) actions.push('archive')
  actions.push('duplicate')
  return actions
}
