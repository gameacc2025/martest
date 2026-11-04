/**
 * Reserved Specification Keys / Titles
 *
 * Category, Subcategory, Brand and Model are PRODUCT CORE fields. They must
 * never be duplicated inside the product `specifications` block (neither as a
 * standard template value nor as a user-defined attribute).
 *
 * This module is the single source of truth used by:
 *   - ProductForm.vue                 (render + payload filtering)
 *   - SpecificationTitleAutoComplete  (block selecting/creating reserved names)
 *
 * Matching is case-insensitive and covers both the English keys and the
 * Persian labels shown in the UI.
 */

// Canonical reserved keys (English, lower-case).
export const RESERVED_SPEC_KEYS = ['brand', 'model', 'category', 'subcategory']

// Human-facing labels (English + Persian) that should also be treated as
// reserved so users cannot recreate a core field under a localized name.
export const RESERVED_SPEC_TITLES = [
  'brand',
  'model',
  'category',
  'subcategory',
  'برند',
  'مدل',
  'دسته‌بندی',
  'دسته بندی',
  'زیردسته',
  'زیر دسته',
]

// Pre-normalized set for fast lookups.
const RESERVED_SET = new Set(
  [...RESERVED_SPEC_KEYS, ...RESERVED_SPEC_TITLES].map((v) => normalizeSpecTitle(v))
)

/**
 * Normalize a title/key for comparison: trim, lower-case, collapse internal
 * whitespace, and unify the Persian zero-width non-joiner (‌) with a space.
 * @param {string} value
 * @returns {string}
 */
export function normalizeSpecTitle(value) {
  return String(value ?? '')
    .replace(/\u200c/g, ' ') // ZWNJ → space (دسته‌بندی ↔ دسته بندی)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
}

/**
 * Is the given title/key a reserved product core field?
 * @param {string} value
 * @returns {boolean}
 */
export function isReservedSpecTitle(value) {
  return RESERVED_SET.has(normalizeSpecTitle(value))
}

export default {
  RESERVED_SPEC_KEYS,
  RESERVED_SPEC_TITLES,
  normalizeSpecTitle,
  isReservedSpecTitle,
}
