/**
 * Product Management Configuration — Admin Portal
 *
 * Defines product status labels, severity colors, allowed transitions,
 * and UI action rules for the admin portal.
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
// Admin users can perform all transitions.
export const ALLOWED_TRANSITIONS = {
  submitReview: { from: ['DRAFT', 'REJECTED'], to: 'PENDING_REVIEW' },
  approve: { from: ['PENDING_REVIEW'], to: 'APPROVED' },
  reject: { from: ['PENDING_REVIEW'], to: 'REJECTED' },
  publish: { from: ['APPROVED', 'HIDDEN'], to: 'PUBLISHED' },
  hide: { from: ['PUBLISHED'], to: 'HIDDEN' },
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

// ── Approval Status Labels ──────────────────────────────────
export const APPROVAL_STATUS_LABELS = {
  PENDING_REVIEW: 'در انتظار بررسی',
  APPROVED: 'تأیید شده',
  REJECTED: 'رد شده',
}

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
 * Check if a product is pending review.
 * @param {object} product
 * @returns {boolean}
 */
export function isPendingReview(product) {
  return product?.status === 'PENDING_REVIEW'
}

/**
 * Check if a product can be approved.
 * @param {object} product
 * @returns {boolean}
 */
export function canApprove(product) {
  return ALLOWED_TRANSITIONS.approve.from.includes(product?.status)
}

/**
 * Check if a product can be rejected.
 * @param {object} product
 * @returns {boolean}
 */
export function canReject(product) {
  return ALLOWED_TRANSITIONS.reject.from.includes(product?.status)
}

/**
 * Check if a product can be published.
 * @param {object} product
 * @returns {boolean}
 */
export function canPublish(product) {
  return ALLOWED_TRANSITIONS.publish.from.includes(product?.status)
}

/**
 * Check if a product can be hidden.
 * @param {object} product
 * @returns {boolean}
 */
export function canHide(product) {
  return ALLOWED_TRANSITIONS.hide.from.includes(product?.status)
}

export function canArchive(product) {
  return ALLOWED_TRANSITIONS.archive.from.includes(product?.status)
}

/**
 * Check if a product can be restored to draft.
 * @param {object} product
 * @returns {boolean}
 */
export function canRestoreDraft(product) {
  return ALLOWED_TRANSITIONS.restoreDraft.from.includes(product?.status)
}

/**
 * Get the list of allowed actions for a product.
 * @param {object} product
 * @returns {string[]}
 */
export function getAllowedActions(product) {
  const actions = []
  if (canApprove(product)) actions.push('approve')
  if (canReject(product)) actions.push('reject')
  if (canPublish(product)) actions.push('publish')
  if (canHide(product)) actions.push('hide')
  if (canArchive(product)) actions.push('archive')
  if (canRestoreDraft(product)) actions.push('restoreDraft')
  actions.push('duplicate')
  return actions
}

/**
 * Number of post-approval edits a company made that are not yet covered by a
 * re-review (Product.editsSinceApproval). Only meaningful on APPROVED /
 * PUBLISHED / HIDDEN; 0 elsewhere.
 * @param {object} product
 * @returns {number}
 */
export function getUnreviewedEditCount(product) {
  return ['APPROVED', 'PUBLISHED', 'HIDDEN'].includes(product?.status)
    ? (product?.editsSinceApproval || 0)
    : 0
}
