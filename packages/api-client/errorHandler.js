/**
 * @telecom/api-client — API Error Handler
 *
 * Handles common HTTP error statuses across the application.
 */

import { getErrorStatus, getErrorMessage, getErrorCode, getErrorDetails } from '@telecom/shared-core/http/apiClient'

// ── Default toast handler (no-op until set) ────────────────
let _toast = null

/**
 * Set the default toast instance for non-component contexts.
 * @param {Object} toastInstance - PrimeVue useToast() instance
 */
export function setDefaultToast(toastInstance) {
  _toast = toastInstance
}

/**
 * Show a toast from a non-component context (e.g. the auth store).
 * @param {string} severity - 'success' | 'info' | 'warn' | 'error'
 * @param {string} summary
 * @param {string} detail
 */
export function showSessionToast(severity, summary, detail) {
  showToast(null, severity, summary, detail)
}

/**
 * Show a toast notification.
 * @param {Object} [toast] - PrimeVue toast instance
 * @param {string} severity
 * @param {string} summary
 * @param {string} detail
 */
function showToast(toast, severity, summary, detail) {
  const t = toast || _toast
  if (t && typeof t.add === 'function') {
    t.add({ severity, summary, detail, life: 4000 })
  } else {
    console.warn(`[${severity}] ${summary}: ${detail}`)
  }
}

/**
 * Handle an API error with appropriate side effects.
 * @param {Error} error
 * @param {Object} [toast]
 * @returns {{ status: number|null, code: string, message: string, details: Array|Object|null }}
 */
export function handleApiError(error, toast = null) {
  const status = getErrorStatus(error)
  const message = getErrorMessage(error)
  const code = getErrorCode(error)
  const details = getErrorDetails(error)

  switch (status) {
    case 400:
    case 422:
      if (!details || (Array.isArray(details) && details.length === 0)) {
        showToast(toast, 'warn', 'خطای اعتبارسنجی', message || 'لطفاً ورودی‌ها را بررسی کنید.')
      }
      break
    case 401:
      // Session lifecycle is owned exclusively by the auth store.
      break
    case 403:
      showToast(toast, 'error', 'خطای دسترسی', message || 'شما دسترسی به این بخش ندارید.')
      break
    case 404:
      showToast(toast, 'warn', 'یافت نشد', message || 'منبع مورد نظر یافت نشد.')
      break
    case 409:
      showToast(toast, 'error', 'Conflict', message || 'تداخل در اطلاعات.')
      break
    case 500:
    case 502:
    case 503:
      showToast(toast, 'error', 'خطای سرور', message || 'خطایی در سرور رخ داده است. لطفاً بعداً تلاش کنید.')
      break
    default:
      if (status) {
        showToast(toast, 'error', 'خطا', message || `خطای (${status}).`)
      } else {
        showToast(toast, 'error', 'خطا', message || 'خطای شبکه. اتصال اینترنت را بررسی کنید.')
      }
      break
  }

  return { status, code, message, details }
}

export default { handleApiError, setDefaultToast }
