/**
 * @telecom/auth
 *
 * Barrel exports for authentication store, bridge, and permission composables.
 */
export { createAuthStore } from './store.js'

// Cross-app session handoff — PKCE code flow, never a token in a URL.
//   sessionHandoff.js  pure helpers (verifier/challenge/state, URL parsing)
//   handoffClient.js   the two API calls (mint on the website, redeem in
//                      the panel)
export {
  isExternalUrl,
  beginPanelHandoff,
  readPendingHandoff,
  clearPendingHandoff,
  parseCallbackHash,
  readMintRequest,
  buildCallbackUrl,
  generateVerifier,
  generateState,
  challengeFor,
  HANDOFF_APPS,
} from './sessionHandoff.js'
export { mintHandoffCode, redeemHandoffCode } from './handoffClient.js'

// Router injection helpers — re-exported so apps can wire their router into
// the auth layer without reaching into @telecom/shared-core directly.
export { setAuthRouter, getAuthRouter } from '@telecom/shared-core/http/authBridge'