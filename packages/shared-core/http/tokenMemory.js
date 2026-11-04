/**
 * Access token — JS-memory only.
 *
 * The access token must NEVER touch localStorage/sessionStorage:
 * it is the only secret the browser JS layer holds, and memory
 * dies with the tab. On reload the app silently re-obtains a fresh
 * access token by calling /auth/refresh with the httpOnly cookie.
 *
 * Lives in shared-core (not @telecom/auth) so the HTTP layer can
 * import it without creating a package-level cycle.
 */

let accessToken = null
const listeners = new Set()

export const getAccessToken = () => accessToken

export function setAccessToken(token) {
  accessToken = token || null
  listeners.forEach((fn) => {
    try {
      fn(accessToken)
    } catch {
      // a broken listener must not break token updates
    }
  })
}

export const clearAccessToken = () => setAccessToken(null)

/**
 * Subscribe to token changes (used by the auth store to keep its
 * reactive ref in sync). Returns an unsubscribe function.
 */
export function onAccessTokenChange(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}
