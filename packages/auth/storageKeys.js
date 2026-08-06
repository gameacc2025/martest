// =============================================================
// localStorage key definitions + safe read/write helpers.
//
// Deliberately dependency-free (no Pinia, no @telecom/shared-core):
// both store.js (the Pinia auth store) and sessionHandoff.js (the
// cross-app login handoff, which has nothing to do with Pinia) need
// these, and keeping this file free of heavier imports means
// sessionHandoff.js's security-critical logic can be unit-tested with
// node's built-in test runner — no bundler required.
// =============================================================

export const STORAGE_KEYS = {
  user: 'user',
  profile: 'profile',
  accessProfile: 'accessProfile',
  roles: 'roles',
  permissions: 'permissions',
  tokens: 'tokens',
  // Raw access token, kept in sync for the HTTP layer (AuthMiddleware reads
  // localStorage.getItem('token') directly to attach the Authorization header).
  token: 'token',
}

/**
 * Safely parse a JSON value from localStorage. Returns `fallback` on any
 * missing / "undefined" / "null" / malformed value, and cleans the slot.
 */
export function readStored(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    if (!raw || raw === 'undefined' || raw === 'null') {
      if (raw === 'undefined' || raw === 'null') localStorage.removeItem(key)
      return fallback
    }
    return JSON.parse(raw)
  } catch {
    return fallback
  }
}

export function writeStored(key, value) {
  if (value === null || value === undefined) {
    localStorage.removeItem(key)
  } else {
    localStorage.setItem(key, JSON.stringify(value))
  }
}