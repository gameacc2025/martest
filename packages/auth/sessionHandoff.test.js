// =============================================================
// Unit tests — PKCE cross-app session handoff helpers
// (beginPanelHandoff / readPendingHandoff / parseCallbackHash /
//  readMintRequest / buildCallbackUrl / challengeFor / isExternalUrl)
//
// This is the mechanism that lets a STAFF/COMPANY user, after logging
// in on the centralized website app, land already-authenticated on the
// admin/company app (a different origin).
//
// The properties that matter most here, security-wise:
//   1. The PKCE VERIFIER never travels — it stays in the panel tab's
//      sessionStorage; only its SHA-256 challenge goes over the URL.
//   2. No token of any kind ever appears in a URL.
//   3. A callback is only accepted by the tab that started the flow
//      (state match) and only while the pending verifier is fresh.
//
// This package has no test runner configured of its own; run these via
// node's built-in runner directly:
//   node --test packages/auth/sessionHandoff.test.js
// (requires a workspace install — `pnpm install` at the repo root).
// =============================================================

import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import {
  isExternalUrl,
  generateVerifier,
  generateState,
  challengeFor,
  beginPanelHandoff,
  readPendingHandoff,
  clearPendingHandoff,
  parseCallbackHash,
  readMintRequest,
  buildCallbackUrl,
} from './sessionHandoff.js';

// ── Minimal browser stubs ───────────────────────────────────────
// sessionHandoff.js only touches window.location/history equivalents,
// sessionStorage, btoa/atob, crypto — stub exactly that, nothing more.
function installBrowserStubs() {
  const session = {};
  const store = {};

  globalThis.sessionStorage = {
    getItem: (k) => (k in session ? session[k] : null),
    setItem: (k, v) => { session[k] = String(v); },
    removeItem: (k) => { delete session[k]; },
  };
  globalThis.localStorage = {
    getItem: (k) => (k in store ? store[k] : null),
    setItem: (k, v) => { store[k] = v; },
    removeItem: (k) => { delete store[k]; },
  };

  globalThis.btoa = (s) => Buffer.from(s, 'binary').toString('base64');
  globalThis.atob = (s) => Buffer.from(s, 'base64').toString('binary');

  return { session, store };
}

const B64URL_43 = /^[A-Za-z0-9_-]{43}$/;

// ── isExternalUrl ───────────────────────────────────────────────

test('isExternalUrl distinguishes cross-origin URLs from internal paths', () => {
  assert.equal(isExternalUrl('https://admin.example.com/admin'), true);
  assert.equal(isExternalUrl('http://company.example.com/dashboard'), true);
  assert.equal(isExternalUrl('/company-dashboard'), false);
  assert.equal(isExternalUrl('/login?redirect=%2Ffoo'), false);
  assert.equal(isExternalUrl(''), false);
  assert.equal(isExternalUrl(undefined), false);
});

// ── Verifier / challenge ────────────────────────────────────────

test('generateVerifier produces a 43-char base64url secret that differs every call', () => {
  installBrowserStubs();
  const a = generateVerifier();
  const b = generateVerifier();
  assert.match(a, B64URL_43);
  assert.match(b, B64URL_43);
  assert.notEqual(a, b);
});

test('generateState produces a non-empty base64url value that differs every call', () => {
  installBrowserStubs();
  const a = generateState();
  const b = generateState();
  assert.ok(a.length > 10);
  assert.notEqual(a, b);
  assert.match(a, /^[A-Za-z0-9_-]+$/);
});

test('challengeFor is base64url(SHA-256(verifier)) — deterministic and verifier-independent', async () => {
  installBrowserStubs();
  const verifier = generateVerifier();

  const challenge = await challengeFor(verifier);
  assert.match(challenge, B64URL_43);

  // Deterministic: same input → same challenge (the server recomputes it).
  assert.equal(await challengeFor(verifier), challenge);

  // Correct algorithm: matches Node's own SHA-256 → base64url.
  const expected = createHash('sha256').update(verifier, 'utf8').digest('base64url');
  assert.equal(challenge, expected);

  // A different verifier yields a different challenge.
  assert.notEqual(await challengeFor(generateVerifier()), challenge);
});

// ── beginPanelHandoff (step 1) ──────────────────────────────────

test('beginPanelHandoff sends challenge+state to the website, verifier stays local', async () => {
  const { session } = installBrowserStubs();

  const url = await beginPanelHandoff({
    app: 'admin',
    websiteUrl: 'https://site.example.com',
    redirect: '/admin-dashboard',
  });

  const parsed = new URL(url);
  assert.equal(parsed.origin + parsed.pathname, 'https://site.example.com/login');
  assert.equal(parsed.searchParams.get('app'), 'admin');
  assert.match(parsed.searchParams.get('challenge'), B64URL_43);
  assert.ok(parsed.searchParams.get('state'));

  // THE critical property: the verifier must not appear in the URL.
  const pending = JSON.parse(session['telecom.handoff.pending.admin']);
  assert.ok(pending.verifier, 'verifier was not stored for later redemption');
  assert.ok(!url.includes(pending.verifier), 'verifier leaked into the website URL');

  // …and the challenge really is the hash of that verifier.
  assert.equal(parsed.searchParams.get('challenge'), await challengeFor(pending.verifier));
});

test('beginPanelHandoff only accepts an internal redirect path (and keeps it local)', async () => {
  installBrowserStubs();
  await beginPanelHandoff({
    app: 'company',
    websiteUrl: 'https://site.example.com',
    redirect: '/company-dashboard?tab=1',
  });
  let pending = readPendingHandoff('company');
  assert.equal(pending.redirect, '/company-dashboard?tab=1');

  await beginPanelHandoff({
    app: 'company',
    websiteUrl: 'https://site.example.com',
    redirect: 'https://evil.example.com/steal',
  });
  pending = readPendingHandoff('company');
  assert.equal(pending.redirect, null, 'absolute URL accepted as a redirect target');
});

test('beginPanelHandoff rejects an unknown app', async () => {
  installBrowserStubs();
  await assert.rejects(
    () => beginPanelHandoff({ app: 'root', websiteUrl: 'https://site.example.com' }),
    /Unknown handoff app/
  );
});

// ── readPendingHandoff / clearPendingHandoff ────────────────────

test('readPendingHandoff returns null when this tab never started a handoff', () => {
  installBrowserStubs();
  assert.equal(readPendingHandoff('admin'), null);
  // Even if SOME other app left something behind.
  globalThis.sessionStorage.setItem('telecom.handoff.pending.company', JSON.stringify({
    verifier: 'x', state: 'y', createdAt: Date.now(),
  }));
  assert.equal(readPendingHandoff('admin'), null);
});

test('readPendingHandoff round-trips verifier, state and redirect', async () => {
  installBrowserStubs();
  await beginPanelHandoff({
    app: 'company',
    websiteUrl: 'https://site.example.com',
    redirect: '/company-dashboard',
  });

  const pending = readPendingHandoff('company');
  assert.match(pending.verifier, B64URL_43);
  assert.ok(pending.state);
  assert.equal(pending.redirect, '/company-dashboard');
});

test('readPendingHandoff drops expired pending flows', async () => {
  installBrowserStubs();
  globalThis.sessionStorage.setItem('telecom.handoff.pending.admin', JSON.stringify({
    verifier: 'v', state: 's', createdAt: Date.now() - 6 * 60 * 1000,
  }));
  assert.equal(readPendingHandoff('admin'), null);
  assert.equal(globalThis.sessionStorage.getItem('telecom.handoff.pending.admin'), null);
});

test('readPendingHandoff ignores corrupt storage', () => {
  installBrowserStubs();
  globalThis.sessionStorage.setItem('telecom.handoff.pending.admin', '{not json');
  assert.equal(readPendingHandoff('admin'), null);
});

test('clearPendingHandoff removes only the given app entry', async () => {
  installBrowserStubs();
  await beginPanelHandoff({ app: 'admin', websiteUrl: 'https://site.example.com' });
  await beginPanelHandoff({ app: 'company', websiteUrl: 'https://site.example.com' });

  clearPendingHandoff('admin');
  assert.equal(readPendingHandoff('admin'), null);
  assert.ok(readPendingHandoff('company'));
});

// ── parseCallbackHash (step 3 input) ────────────────────────────

test('parseCallbackHash extracts code and state from the panel fragment', () => {
  assert.deepEqual(parseCallbackHash('#code=ABC123&state=xyz'), { code: 'ABC123', state: 'xyz' });
  assert.deepEqual(parseCallbackHash('#state=xyz&code=ABC123'), { code: 'ABC123', state: 'xyz' });
});

test('parseCallbackHash rejects anything that is not a complete callback', () => {
  assert.equal(parseCallbackHash(''), null);
  assert.equal(parseCallbackHash('#code=ABC123'), null);            // no state
  assert.equal(parseCallbackHash('#state=xyz'), null);               // no code
  assert.equal(parseCallbackHash('#/auth/callback'), null);
  assert.equal(parseCallbackHash('#some-other-anchor'), null);
  assert.equal(parseCallbackHash(undefined), null);
});

// ── readMintRequest (website side of step 2) ────────────────────

test('readMintRequest parses a well-formed handoff request', () => {
  const challenge = 'A'.repeat(43);
  const req = readMintRequest(`?app=admin&challenge=${challenge}&state=abc`);
  assert.deepEqual(req, { app: 'admin', challenge, state: 'abc' });

  // Accepts a URLSearchParams instance too.
  const params = new URLSearchParams();
  params.set('app', 'company');
  params.set('challenge', challenge);
  params.set('state', 'abc');
  assert.equal(readMintRequest(params).app, 'company');
});

test('readMintRequest rejects malformed or foreign requests', () => {
  const challenge = 'A'.repeat(43);
  assert.equal(readMintRequest(''), null);
  assert.equal(readMintRequest(`?challenge=${challenge}&state=abc`), null);                 // no app
  assert.equal(readMintRequest(`?app=hacker&challenge=${challenge}&state=abc`), null);      // bad app
  assert.equal(readMintRequest('?app=admin&challenge=short&state=abc'), null);              // bad challenge
  assert.equal(readMintRequest(`?app=admin&challenge=${challenge}`), null);                 // no state
  // A challenge carrying URL-safe-alphabet junk outside the 43-char shape.
  assert.equal(readMintRequest('?app=admin&challenge=../../../etc/passwd&state=abc'), null);
});

// ── buildCallbackUrl (website → panel return leg) ───────────────

test('buildCallbackUrl points at the panel callback and carries only code+state', () => {
  const url = buildCallbackUrl('https://admin.example.com', { code: 'C0DE', state: 'xyz' });
  const parsed = new URL(url);
  assert.equal(parsed.origin + parsed.pathname, 'https://admin.example.com/auth/callback');
  assert.equal(parsed.hash, '#code=C0DE&state=xyz');
  assert.equal(parsed.search, '');
});

test('no helper ever puts a token or verifier in a URL', async () => {
  const { session } = installBrowserStubs();
  const start = await beginPanelHandoff({
    app: 'admin',
    websiteUrl: 'https://site.example.com',
    redirect: '/admin-dashboard',
  });
  const callback = buildCallbackUrl('https://admin.example.com', { code: 'C0DE', state: 'xyz' });
  const { verifier } = JSON.parse(session['telecom.handoff.pending.admin']);

  for (const url of [start, callback]) {
    assert.ok(!/accessToken|refreshToken|bearer/i.test(url), `token-ish material in ${url}`);
    assert.ok(!url.includes(verifier), 'the PKCE verifier leaked into a URL');
  }
});
