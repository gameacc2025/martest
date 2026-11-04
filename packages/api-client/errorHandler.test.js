import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { handleApiError, setDefaultToast, showSessionToast } from './errorHandler.js'

/**
 * handleApiError is the single funnel every app passes API failures through.
 * What matters:
 *   1. It always returns a NORMALIZED { status, code, message, details }
 *      regardless of how the error was shaped, so callers/renderers can rely
 *      on one contract.
 *   2. Status → toast routing: 403/404/409/5xx toast, 400/422 toast only when
 *      the server sent no field details, and **401 never toasts** — logout and
 *      session toasts are owned exclusively by the auth store (otherwise users
 *      would see two competing messages on expiry).
 *   3. A network failure (no status) still surfaces a helpful message.
 *
 * The toast boundary is a tiny spy object (`{ add }`), exactly like the
 * PrimeVue toast instance it doubles for.
 */

function makeToast() {
  return { add: vi.fn() }
}

let warnSpy

beforeEach(() => {
  setDefaultToast(null) // module-level default toast must not leak across tests
  warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
})

afterEach(() => {
  warnSpy.mockRestore()
})

function errorWith(props) {
  return Object.assign(new Error(props.message || 'err'), props)
}

describe('returned contract', () => {
  it('normalizes direct error props to { status, code, message, details }', () => {
    const error = errorWith({
      status: 404,
      code: 'NOT_FOUND',
      serverMessage: 'محصول یافت نشد',
      details: { id: 3 },
      message: 'prepended server message',
    })

    const result = handleApiError(error, makeToast())

    expect(result).toEqual({
      status: 404,
      code: 'NOT_FOUND',
      message: 'محصول یافت نشد',
      details: { id: 3 },
    })
  })

  it('still returns a full contract for an unknown/network error', () => {
    const result = handleApiError(new TypeError('Failed to fetch'), makeToast())

    expect(result.status).toBeNull()
    expect(result.code).toBe('UNKNOWN_ERROR')
    expect(result.message).toBe('Failed to fetch')
    expect(result.details).toBeNull()
    expect(typeof result.message).toBe('string') // callers render this directly
  })
})

describe('status → toast routing', () => {
  it('401: NO toast at all (session lifecycle belongs to the auth store)', () => {
    const toast = makeToast()
    const result = handleApiError(errorWith({ status: 401, code: 'TOKEN_EXPIRED' }), toast)

    expect(toast.add).not.toHaveBeenCalled()
    expect(warnSpy).not.toHaveBeenCalled()
    expect(result.status).toBe(401) // still reported to the caller
  })

  it('403: access-denied error toast carrying the server message', () => {
    const toast = makeToast()
    handleApiError(errorWith({ status: 403, serverMessage: 'no access' }), toast)

    expect(toast.add).toHaveBeenCalledTimes(1)
    expect(toast.add).toHaveBeenCalledWith(
      expect.objectContaining({ severity: 'error', summary: 'خطای دسترسی', detail: 'no access' }),
    )
  })

  it('404: warning toast', () => {
    const toast = makeToast()
    handleApiError(errorWith({ status: 404, serverMessage: 'missing' }), toast)
    expect(toast.add).toHaveBeenCalledWith(
      expect.objectContaining({ severity: 'warn', summary: 'یافت نشد', detail: 'missing' }),
    )
  })

  it('409: conflict error toast', () => {
    const toast = makeToast()
    handleApiError(errorWith({ status: 409 }), toast)
    expect(toast.add).toHaveBeenCalledWith(
      expect.objectContaining({ severity: 'error', summary: 'Conflict' }),
    )
  })

  it('500/502/503: server error toast', () => {
    for (const status of [500, 502, 503]) {
      const toast = makeToast()
      handleApiError(errorWith({ status, message: `boom ${status}` }), toast)
      expect(toast.add).toHaveBeenCalledWith(
        expect.objectContaining({ severity: 'error', summary: 'خطای سرور', detail: `boom ${status}` }),
      )
    }
  })

  it('400/422 with NO details: validation warning toast', () => {
    for (const status of [400, 422]) {
      const toast = makeToast()
      handleApiError(errorWith({ status, message: 'invalid', details: null }), toast)
      expect(toast.add).toHaveBeenCalledTimes(1)
      expect(toast.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'warn' }))
    }
  })

  it('400/422 WITH field details: silent — the form renders them inline', () => {
    const toast = makeToast()
    const result = handleApiError(
      errorWith({ status: 422, details: [{ field: 'email', message: 'bad' }] }),
      toast,
    )

    expect(toast.add).not.toHaveBeenCalled()
    expect(result.details).toEqual([{ field: 'email', message: 'bad' }])
  })

  it('400/422 with an EMPTY details array is still treated as "no details"', () => {
    const toast = makeToast()
    handleApiError(errorWith({ status: 400, details: [] }), toast)
    expect(toast.add).toHaveBeenCalledTimes(1)
    expect(toast.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'warn' }))
  })

  it('an unmatched status still surfaces an error toast', () => {
    const toast = makeToast()
    const result = handleApiError(errorWith({ status: 418 }), toast)

    expect(toast.add).toHaveBeenCalledTimes(1)
    expect(toast.add).toHaveBeenCalledWith(
      expect.objectContaining({ severity: 'error', summary: 'خطا' }),
    )
    // getErrorMessage() always yields a usable string, never a blank bubble.
    expect(result.message).not.toBe('')
  })

  it('a statusless network failure uses the network-failure wording', () => {
    const toast = makeToast()
    handleApiError({ message: 'Network error: Failed to fetch' }, toast)
    expect(toast.add).toHaveBeenCalledWith(
      expect.objectContaining({
        severity: 'error',
        detail: 'Network error: Failed to fetch',
      }),
    )
  })

  it('every toast is scheduled with a 4s lifetime', () => {
    const toast = makeToast()
    handleApiError(errorWith({ status: 403 }), toast)
    expect(toast.add.mock.calls[0][0]).toMatchObject({ life: 4000 })
  })
})

describe('toast instance selection', () => {
  it('prefers the per-call toast over the registered default', () => {
    const registered = makeToast()
    const perCall = makeToast()
    setDefaultToast(registered)

    handleApiError(errorWith({ status: 404 }), perCall)

    expect(perCall.add).toHaveBeenCalledTimes(1)
    expect(registered.add).not.toHaveBeenCalled()
  })

  it('falls back to the registered default toast', () => {
    const registered = makeToast()
    setDefaultToast(registered)

    handleApiError(errorWith({ status: 404 }))

    expect(registered.add).toHaveBeenCalledTimes(1)
  })

  it('warns on the console instead of crashing when no toast is available', () => {
    expect(() => handleApiError(errorWith({ status: 500 }))).not.toThrow()
    expect(warnSpy).toHaveBeenCalledTimes(1)
  })

  it('showSessionToast (auth store hook) routes through the default toast', () => {
    const registered = makeToast()
    setDefaultToast(registered)

    showSessionToast('info', 'نشست شما', 'refreshed')

    expect(registered.add).toHaveBeenCalledWith(
      expect.objectContaining({ severity: 'info', summary: 'نشست شما', detail: 'refreshed' }),
    )
  })
})