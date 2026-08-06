// =============================================================
// Cross-app session handoff
//
// Login/Register are centralized on the website app. When a STAFF or
// COMPANY user logs in there, they need to land already authenticated
// on the admin/company app (a different origin), not on that app's
// own (now-removed) login page.
//
// Only the access token + auth context travel, via a URL fragment
// (never sent to a server, stripped from history immediately on
// arrival). The refresh token is never included here — it always
// lives in the httpOnly cookie set by the backend, scoped to the API
// host, so it is already sent by the browser on API calls made from
// ANY frontend origin. That's what lets the receiving app silently
// refresh once the handed-off access token expires, with no further
// handoff needed.
//
// Deliberately dependency-free (no Pinia, no @telecom/shared-core) —
// see storageKeys.js for why.
// =============================================================

import { STORAGE_KEYS, writeStored } from './storageKeys.js'

const SESSION_HANDOFF_HASH_PREFIX = '#session='

/**
 * True if `url` points at a different origin (i.e. a separate frontend
 * app) rather than an internal path on the current app.
 * @param {string} url
 */
export function isExternalUrl(url) {
  return typeof url === 'string' && /^https?:\/\//i.test(url)
}

/**
 * Build a "go to this other app, already signed in" URL.
 * @param {string} targetUrl - absolute URL of the destination (e.g. `${adminAppUrl}/admin`)
 * @param {object} ctx - the auth context returned by login()/registerCompany() etc: { user, profile, accessProfile, roles, permissions, tokens }
 */
export function buildSessionHandoffUrl(targetUrl, ctx) {
  const payload = {
    user: ctx.user,
    profile: ctx.profile,
    accessProfile: ctx.accessProfile,
    roles: ctx.roles,
    permissions: ctx.permissions,
    tokens: ctx.tokens?.accessToken
      ? { accessToken: ctx.tokens.accessToken, expiresIn: ctx.tokens.expiresIn }
      : null,
  }
  const encoded = btoa(encodeURIComponent(JSON.stringify(payload)))
  const [base] = targetUrl.split('#')
  return `${base}${SESSION_HANDOFF_HASH_PREFIX}${encoded}`
}

/**
 * Call once, as early as possible on app boot (before mounting — see
 * each app's main.js), to consume an incoming session handoff
 * fragment produced by buildSessionHandoffUrl(). Writes straight to
 * localStorage (no Pinia instance needed yet) using the same
 * STORAGE_KEYS every app already reads on startup, and strips the
 * fragment from the URL so it never lingers in browser history.
 * @returns {boolean} true if a handoff was found and applied
 */
export function bootstrapSessionFromUrl() {
  const hash = window.location.hash
  if (!hash || !hash.startsWith(SESSION_HANDOFF_HASH_PREFIX)) return false

  let applied = false
  try {
    const encoded = hash.slice(SESSION_HANDOFF_HASH_PREFIX.length)
    const payload = JSON.parse(decodeURIComponent(atob(encoded)))
    if (payload?.tokens?.accessToken) {
      writeStored(STORAGE_KEYS.user, payload.user ?? null)
      writeStored(STORAGE_KEYS.profile, payload.profile ?? null)
      writeStored(STORAGE_KEYS.accessProfile, payload.accessProfile ?? null)
      writeStored(STORAGE_KEYS.roles, payload.roles ?? [])
      writeStored(STORAGE_KEYS.permissions, payload.permissions ?? [])
      writeStored(STORAGE_KEYS.tokens, payload.tokens)
      localStorage.setItem(STORAGE_KEYS.token, payload.tokens.accessToken)
      applied = true
    }
  } catch {
    applied = false
  } finally {
    // Always strip the fragment — even on failure — so a malformed or
    // stale payload never lingers in the URL/history.
    window.history.replaceState(null, '', window.location.pathname + window.location.search)
  }
  return applied
}