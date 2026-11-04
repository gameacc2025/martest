// =============================================================
// Cross-app session handoff — PKCE code flow (NO token in a URL)
//
// Login/Register are centralized on the website app. A STAFF/COMPANY
// user who authenticates there must land already signed in on the
// admin/company panel — a DIFFERENT origin. This module implements the
// browser side of that exchange; the server side is
// backend/src/modules/auth/handoff.service.js.
//
// Flow (three hops, never a token in a URL):
//   1. PANEL  beginPanelHandoff()  — the panel tab generates a random
//      `verifier`, keeps it in ITS sessionStorage, sends only
//      base64url(SHA-256(verifier)) (`challenge`) + a random `state`
//      to the website login page.
//   2. WEBSITE (see Login.vue) — once authenticated, mints a one-time
//      60s code bound to that challenge via POST /auth/handoff and
//      redirects back to the panel's /auth/callback#code&state.
//   3. PANEL  readPendingHandoff() + parseCallbackHash() — the callback
//      page sends code + the verifier it kept. Only this tab can redeem:
//      a code intercepted from the URL is useless without the verifier.
//
// Deliberately dependency-free (no Pinia, no @telecom/shared-core) —
// see storageKeys.js for why. The only imports it may take are other
// dependency-free modules from this package.
// =============================================================

const SESSION_HANDOFF_HASH_PREFIX = '#'
const PENDING_KEY_PREFIX = 'telecom.handoff.pending.'
// The server-side code TTL is 60s; the pending verifier must not outlive
// a realistic round trip by much either.
const PENDING_TTL_MS = 5 * 60 * 1000

export const HANDOFF_APPS = ['admin', 'company']

/**
 * True if `url` points at a different origin (i.e. a separate frontend
 * app) rather than an internal path on the current app.
 * @param {string} url
 */
export function isExternalUrl(url) {
  return typeof url === 'string' && /^https?:\/\//i.test(url)
}

function toBase64Url(bytes) {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function randomBase64Url(byteLength) {
  const bytes = new Uint8Array(byteLength)
  globalThis.crypto.getRandomValues(bytes)
  return toBase64Url(bytes)
}

/**
 * The PKCE verifier: 32 random bytes, base64url (43 chars). NEVER leaves
 * the panel tab that created it — it lives in that tab's sessionStorage
 * until the callback redeems it.
 */
export function generateVerifier() {
  return randomBase64Url(32)
}

/**
 * Anti-CSRF state for the callback leg: proves the redirect back to the
 * panel was started by THIS tab.
 */
export function generateState() {
  return randomBase64Url(16)
}

/**
 * base64url(SHA-256(verifier)) — what actually travels to the website
 * and on to the server. Safe to expose: without the verifier it is
 * meaningless.
 * @param {string} verifier
 * @returns {Promise<string>} 43-char base64url string
 */
export async function challengeFor(verifier) {
  const digest = await globalThis.crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(verifier)
  )
  return toBase64Url(new Uint8Array(digest))
}

function pendingKey(app) {
  return `${PENDING_KEY_PREFIX}${app}`
}

/**
 * Step 1 — panel side. Generate the verifier/challenge pair, park the
 * verifier in this tab's sessionStorage, and produce the website login
 * URL to navigate to.
 *
 * @param {object} opts
 * @param {'admin'|'company'} opts.app - which panel is signing in
 * @param {string} opts.websiteUrl - origin of the centralized login app
 * @param {string} [opts.redirect] - internal path to land on after redeem
 * @returns {Promise<string>} absolute URL of the website login page
 */
export async function beginPanelHandoff({ app, websiteUrl, redirect = null }) {
  if (!HANDOFF_APPS.includes(app)) {
    throw new Error(`Unknown handoff app: ${app}`)
  }
  const verifier = generateVerifier()
  const challenge = await challengeFor(verifier)
  const state = generateState()

  sessionStorage.setItem(
    pendingKey(app),
    JSON.stringify({
      verifier,
      state,
      redirect: typeof redirect === 'string' && redirect.startsWith('/') ? redirect : null,
      createdAt: Date.now(),
    })
  )

  const url = new URL('login', websiteUrl)
  url.searchParams.set('app', app)
  url.searchParams.set('state', state)
  url.searchParams.set('challenge', challenge)
  return url.toString()
}

/**
 * Read (and validate freshness of) the pending handoff this tab started.
 * Returns null when absent/expired/corrupt — i.e. this tab did not start
 * a handoff, so a callback must not be accepted.
 * @param {'admin'|'company'} app
 */
export function readPendingHandoff(app) {
  if (!HANDOFF_APPS.includes(app)) return null
  let pending = null
  try {
    pending = JSON.parse(sessionStorage.getItem(pendingKey(app)))
  } catch {
    return null
  }
  if (!pending?.verifier || !pending?.state) return null
  if (Date.now() - (pending.createdAt || 0) > PENDING_TTL_MS) {
    clearPendingHandoff(app)
    return null
  }
  return pending
}

export function clearPendingHandoff(app) {
  if (!HANDOFF_APPS.includes(app)) return
  sessionStorage.removeItem(pendingKey(app))
}

/**
 * Parse the panel callback fragment: `#code=<one-time code>&state=<state>`.
 * @param {string} hash - window.location.hash
 * @returns {{code: string, state: string}|null}
 */
export function parseCallbackHash(hash) {
  if (typeof hash !== 'string' || !hash.startsWith(SESSION_HANDOFF_HASH_PREFIX)) return null
  const params = new URLSearchParams(hash.slice(SESSION_HANDOFF_HASH_PREFIX.length))
  const code = params.get('code')
  const state = params.get('state')
  if (!code || !state) return null
  return { code, state }
}

/**
 * Website side — parse the handoff request the panel put on the login
 * URL (`/login?app=admin&state=...&challenge=...`).
 *
 * @param {string|URLSearchParams} search - window.location.search (or params)
 * @returns {{app: string, challenge: string, state: string}|null}
 */
export function readMintRequest(search) {
  const params =
    search instanceof URLSearchParams ? search : new URLSearchParams(typeof search === 'string' ? search : '')
  const app = params.get('app')
  const challenge = params.get('challenge')
  const state = params.get('state')
  if (!HANDOFF_APPS.includes(app) || !challenge || !state) return null
  if (!/^[A-Za-z0-9_-]{43}$/.test(challenge)) return null
  return { app, challenge, state }
}

/**
 * Build the URL the website redirects to after minting a code:
 * `<panel origin>/auth/callback#code=...&state=...`
 *
 * The code rides in the fragment (never sent to any server as part of
 * the URL) and is single-use + 60s anyway; the state ties it to the tab
 * that started the flow.
 *
 * @param {string} panelUrl - absolute origin of the target panel
 * @param {{code: string, state: string}} params
 */
export function buildCallbackUrl(panelUrl, { code, state }) {
  const url = new URL('/auth/callback', panelUrl)
  url.hash = `code=${encodeURIComponent(code)}&state=${encodeURIComponent(state)}`
  return url.toString()
}
