// =============================================================
// Unit tests — session handoff (buildSessionHandoffUrl,
// bootstrapSessionFromUrl, isExternalUrl)
//
// This is the mechanism that lets a STAFF/COMPANY user, after logging
// in on the centralized website app, land already-authenticated on
// the admin/company app (a different origin) instead of hitting a
// second login page. It works by putting the access token + auth
// context in a URL fragment (never sent to any server) and reading it
// back on the target app's first paint.
//
// The property that matters most here, security-wise: the REFRESH
// token must never travel through this mechanism — only the
// short-lived access token. That's asserted explicitly below, not
// just assumed.
//
// This package has no test runner configured of its own; run these
// via node's built-in runner directly:
//   node --test packages/auth/store.test.js
// (requires a workspace install — `pnpm install` at the repo root —
// since store.js's other exports pull in @telecom/shared-core etc.)
// =============================================================

import test from 'node:test';
import assert from 'node:assert/strict';
import { buildSessionHandoffUrl, bootstrapSessionFromUrl, isExternalUrl } from './sessionHandoff.js';

// ── Minimal browser stubs ───────────────────────────────────────
// store.js's handoff functions only touch window.location, history,
// localStorage, btoa/atob — stub exactly that, nothing more.
function installBrowserStubs({ pathname = '/dashboard', search = '' } = {}) {
  const state = { hash: '', pathname, search };
  const historyLog = [];

  globalThis.window = {
    location: {
      get hash() { return state.hash; },
      set hash(v) { state.hash = v; },
      get pathname() { return state.pathname; },
      get search() { return state.search; },
    },
    history: {
      replaceState(_data, _title, url) {
        historyLog.push(url);
        const [path, ...rest] = url.split('?');
        state.pathname = path;
        state.search = rest.length ? '?' + rest.join('?') : '';
        state.hash = '';
      },
    },
  };

  const store = {};
  globalThis.localStorage = {
    getItem: (k) => (k in store ? store[k] : null),
    setItem: (k, v) => { store[k] = v; },
    removeItem: (k) => { delete store[k]; },
  };

  globalThis.btoa = (s) => Buffer.from(s, 'binary').toString('base64');
  globalThis.atob = (s) => Buffer.from(s, 'base64').toString('binary');

  return { state, historyLog, store };
}

const sampleCtx = {
  user: { id: 1, email: 'manager@acme.test' },
  profile: { firstName: 'Ali', lastName: 'Rezaei' },
  accessProfile: { type: 'COMPANY', companyId: 5 },
  roles: ['COMPANY_MANAGER'],
  permissions: ['products.manage', 'inquiries.view'],
  tokens: {
    accessToken: 'ACCESS.TOKEN.VALUE',
    refreshToken: 'REFRESH.TOKEN.SHOULD.NEVER.LEAK',
    expiresIn: 900,
  },
};

test('isExternalUrl distinguishes cross-origin URLs from internal paths', () => {
  assert.equal(isExternalUrl('https://admin.example.com/admin'), true);
  assert.equal(isExternalUrl('http://company.example.com/dashboard'), true);
  assert.equal(isExternalUrl('/company-dashboard'), false);
  assert.equal(isExternalUrl('/login?redirect=%2Ffoo'), false);
  assert.equal(isExternalUrl(''), false);
  assert.equal(isExternalUrl(undefined), false);
});

test('buildSessionHandoffUrl never includes the refresh token', () => {
  installBrowserStubs();
  const url = buildSessionHandoffUrl('https://company.example.com/company-dashboard', sampleCtx);

  assert.ok(!url.includes('REFRESH.TOKEN.SHOULD.NEVER.LEAK'), 'refresh token leaked into the handoff URL');
  assert.ok(url.startsWith('https://company.example.com/company-dashboard#session='));
});

test('buildSessionHandoffUrl + bootstrapSessionFromUrl round-trip the auth context correctly', () => {
  const { state } = installBrowserStubs({ pathname: '/company-dashboard', search: '' });

  const url = buildSessionHandoffUrl('https://company.example.com/company-dashboard', sampleCtx);
  // Simulate arriving on the target app: only the fragment survives a
  // full-page navigation, so put just that part into our stub location.
  state.hash = '#' + url.split('#')[1];

  const applied = bootstrapSessionFromUrl();
  assert.equal(applied, true);

  assert.equal(localStorage.getItem('token'), 'ACCESS.TOKEN.VALUE');
  assert.deepEqual(JSON.parse(localStorage.getItem('user')), sampleCtx.user);
  assert.deepEqual(JSON.parse(localStorage.getItem('profile')), sampleCtx.profile);
  assert.deepEqual(JSON.parse(localStorage.getItem('accessProfile')), sampleCtx.accessProfile);
  assert.deepEqual(JSON.parse(localStorage.getItem('roles')), sampleCtx.roles);
  assert.deepEqual(JSON.parse(localStorage.getItem('permissions')), sampleCtx.permissions);

  const storedTokens = JSON.parse(localStorage.getItem('tokens'));
  assert.equal(storedTokens.accessToken, 'ACCESS.TOKEN.VALUE');
  assert.equal(storedTokens.expiresIn, 900);
  // The refresh token must not have been written to localStorage either
  // — it was never in the payload to begin with (see the test above).
  assert.equal(storedTokens.refreshToken, undefined);
});

test('bootstrapSessionFromUrl strips the fragment from the URL after use', () => {
  const { state } = installBrowserStubs({ pathname: '/company-dashboard', search: '?x=1' });
  const url = buildSessionHandoffUrl('https://company.example.com/company-dashboard', sampleCtx);
  state.hash = '#' + url.split('#')[1];

  bootstrapSessionFromUrl();

  assert.equal(state.hash, '');
  assert.equal(state.pathname, '/company-dashboard');
  assert.equal(state.search, '?x=1');
});

test('bootstrapSessionFromUrl is a no-op (returns false) when there is no handoff fragment', () => {
  installBrowserStubs({ pathname: '/company-dashboard' });
  const applied = bootstrapSessionFromUrl();
  assert.equal(applied, false);
  assert.equal(localStorage.getItem('token'), null);
});

test('bootstrapSessionFromUrl safely ignores a malformed/corrupted fragment (and still strips it)', () => {
  const { state } = installBrowserStubs({ pathname: '/company-dashboard' });
  state.hash = '#session=not-valid-base64!!!';

  const applied = bootstrapSessionFromUrl();

  assert.equal(applied, false);
  assert.equal(localStorage.getItem('token'), null);
  assert.equal(state.hash, ''); // still cleaned up — no stale payload left in the URL
});

test('bootstrapSessionFromUrl ignores an unrelated hash (e.g. an in-page anchor)', () => {
  installBrowserStubs();
  window.location.hash = '#some-other-anchor';

  const applied = bootstrapSessionFromUrl();

  assert.equal(applied, false);
  // Not our prefix — must be left completely alone, not stripped.
  assert.equal(window.location.hash, '#some-other-anchor');
});