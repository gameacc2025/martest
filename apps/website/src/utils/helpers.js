/**
 * Format price with currency
 * @param {number} price - Price value
 * @param {string} currency - Currency code (default: IRR)
 * @returns {string} Formatted price
 */
export function formatPrice(price, currency = 'IRR') {
  if (price === null || price === undefined) return '-'

  const formatted = new Intl.NumberFormat('fa-IR', {
    style: 'currency',
    currency: currency,
    currencyDisplay: 'narrowSymbol'
  }).format(price)

  return formatted
}

/**
 * Format date to Persian
 * @param {string|Date} date - Date to format
 * @param {string} format - Format type (date, datetime, time)
 * @returns {string} Formatted date
 */
export function formatDate(date, format = 'date') {
  if (!date) return '-'

  const d = new Date(date)
  const options = {
    date: { year: 'numeric', month: 'long', day: 'numeric' },
    datetime: { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' },
    time: { hour: '2-digit', minute: '2-digit' }
  }

  return new Intl.DateTimeFormat('fa-IR', options[format] || options.date).format(d)
}

/**
 * Truncate text
 * @param {string} text - Text to truncate
 * @param {number} length - Max length
 * @returns {string} Truncated text
 */
export function truncate(text, length = 50) {
  if (!text) return ''
  if (text.length <= length) return text
  return text.slice(0, length) + '...'
}

/**
 * Check if user has specific role(s)
 * @param {Object} user - User object
 * @param {...string} roles - Roles to check
 * @returns {boolean} True if user has any of the roles
 */
export function hasRole(user, ...roles) {
  if (!user?.roles) return false
  return roles.some(role => user.roles.includes(role))
}

/**
 * Check if user has specific permission(s)
 * @param {Object} user - User object
 * @param {...string} permissions - Permissions to check
 * @returns {boolean} True if user has any of the permissions
 */
export function hasPermission(user, ...permissions) {
  if (!user?.permissions) return false
  return permissions.some(permission => user.permissions.includes(permission))
}

/**
 * Debounce function
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in ms
 * @returns {Function} Debounced function
 */
export function debounce(func, wait) {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

/**
 * Generate unique ID
 * @returns {string} Unique ID
 */
export function generateId() {
  return Math.random().toString(36).substring(2, 9) + Date.now().toString(36)
}

/**
 * Get initials from name
 * @param {string} name - Full name
 * @returns {string} Initials
 */
export function getInitials(name) {
  if (!name) return '?'
  return name.split(' ')
    .filter(part => part.length > 0)
    .map(part => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

/**
 * Status label mapping
 */
export const statusLabels = {
  PUBLISHED: { label: 'منتشر', class: 'badge-success' },
  DRAFT: { label: 'پیشنویس', class: 'badge-gray' },
  ARCHIVED: { label: 'آرشیو', class: 'badge-danger' },
  ACTIVE: { label: 'فعال', class: 'badge-success' },
  INACTIVE: { label: 'غیرفعال', class: 'badge-danger' },
  PENDING: { label: 'در انتظار', class: 'badge-warning' },
  COMPLETED: { label: 'تکمیل شده', class: 'badge-success' },
  CANCELLED: { label: 'لغو شده', class: 'badge-danger' }
}

/**
 * Role label mapping
 */
export const roleLabels = {
  SUPER_ADMIN: 'مدیر سیستم',
  COMPANY_ADMIN: 'مدیر شرکت',
  BUYER: 'خریدار',
  SELLER: 'فروشنده'
}

/**
 * Company type label mapping
 */
export const companyTypeLabels = {
  MANUFACTURER: 'تولیدکننده',
  IMPORTER: 'واردکننده',
  TELECOM_OPERATOR: 'شرکت مخابراتی',
  DISTRIBUTOR: 'توزیع کننده',
  RETAILER: 'خرده فروش'
}