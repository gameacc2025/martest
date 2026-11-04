// =============================================================
// Handoff API client — the only two HTTP calls of the PKCE flow.
//
// Split from sessionHandoff.js on purpose: THAT module must stay free of
// imports so its security-critical logic can be unit-tested with node's
// built-in runner (no bundler, no import.meta.env). This one needs the
// shared HTTP client, so it lives here.
//
//   mintHandoffCode   — WEBSITE side: authenticated (the caller's access
//                       token proves "this user is handing THEMSELVES
//                       off"), returns { code, expiresIn }.
//   redeemHandoffCode — PANEL side: exchanges code + the verifier this
//                       tab kept for a full auth context (same shape as
//                       a login response) and sets the refresh cookie.
// =============================================================

import { apiPost } from '@telecom/shared-core/http/apiClient'
import { endpoints } from '@telecom/api-client'

/**
 * @param {{app: 'admin'|'company', challenge: string}} params
 * @returns {Promise<{code: string, expiresIn: number}>}
 */
export function mintHandoffCode({ app, challenge }) {
  return apiPost(endpoints.auth.handoff, { app, challenge })
}

/**
 * @param {{app: 'admin'|'company', code: string, verifier: string}} params
 * @returns {Promise<{user, profile, accessProfile, roles, permissions, tokens}>}
 */
export function redeemHandoffCode({ app, code, verifier }) {
  return apiPost(endpoints.auth.handoffRedeem, { app, code, verifier })
}
