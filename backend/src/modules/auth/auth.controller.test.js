// =============================================================
// Unit tests — Auth controller (HTTP layer over auth.service)
//
// This is the ONLY place the refresh-token cookie options
// (httpOnly/secure/sameSite/path) get set — a mistake here (e.g.
// httpOnly:false, or forgetting secure in production) silently
// reopens the XSS/CSRF protections auth.service and the security
// hardening pass rely on. Covered independently of any real HTTP
// server: request/reply are plain recording stubs, and auth.service
// is mocked so no DB/bcrypt/JWT work happens.
//
// Run with:  node --test
// =============================================================

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const Module = require('node:module');

function injectMock(relativePath, exportsObj) {
  const resolved = require.resolve(path.join(__dirname, relativePath));
  const original = require.cache[resolved]; // may be undefined if never loaded yet
  require.cache[resolved] = new Module(resolved);
  require.cache[resolved].exports = exportsObj;
  require.cache[resolved].loaded = true;
  // IMPORTANT: require.cache is process-global. When multiple test files
  // run in the same process (the default in newer Node versions), a mock
  // left in place after this file finishes would leak into whichever
  // test file runs next and genuinely needs the real module — restore it
  // once this file's tests are done.
  test.after(() => {
    if (original) require.cache[resolved] = original;
    else delete require.cache[resolved];
  });
  return resolved;
}

// ── Mock auth.service — each fn just records its args and returns
//    whatever the current test fixture says. ────────────────────
const calls = {};
let fx;

function resetMocks() {
  Object.keys(calls).forEach((k) => delete calls[k]);
  fx = {};
}

const mockAuthService = {
  login: async (...args) => { calls.login = args; return fx.loginResult; },
  refresh: async (...args) => { calls.refresh = args; return fx.refreshResult; },
  logout: async (...args) => { calls.logout = args; },
  logoutAll: async (...args) => { calls.logoutAll = args; },
  getMe: async (...args) => { calls.getMe = args; return fx.meResult; },
  changeUserPassword: async (...args) => { calls.changeUserPassword = args; },
  register: async (...args) => { calls.register = args; return fx.registerResult; },
  registerCompany: async (...args) => { calls.registerCompany = args; return fx.registerCompanyResult; },
};

injectMock('./auth.service', mockAuthService);
injectMock('../../config/env', { nodeEnv: 'development' }); // secure:false path
const controller = require('./auth.controller');

test.beforeEach(() => resetMocks());

// ── Fake Fastify request/reply ───────────────────────────────
function makeReply() {
  const reply = {
    _statusCode: undefined,
    _body: undefined,
    _cookies: [],
    _clearedCookies: [],
    _headers: {},
    code(c) { this._statusCode = c; return this; },
    send(b) { this._body = b; return this; },
    header(name, value) { this._headers[name] = value; return this; },
    setCookie(name, value, opts) { this._cookies.push({ name, value, opts }); return this; },
    clearCookie(name, opts) { this._clearedCookies.push({ name, opts }); return this; },
  };
  return reply;
}

function makeRequest(overrides = {}) {
  return { body: {}, server: {}, ...overrides };
}

// ── login ─────────────────────────────────────────────────────

test('login: 400s with VALIDATION_ERROR when phone or password is missing', async () => {
  const reply = makeReply();
  await controller.login(makeRequest({ body: { phone: '', password: '' } }), reply);
  assert.equal(reply._statusCode, 400);
  assert.equal(reply._body.error.code, 'VALIDATION_ERROR');
  assert.equal(calls.login, undefined); // service never called
});

test('login: 400s when phone is only whitespace', async () => {
  const reply = makeReply();
  await controller.login(makeRequest({ body: { phone: '   ', password: 'x' } }), reply);
  assert.equal(reply._statusCode, 400);
});

test('login: trims the phone before passing it to the service', async () => {
  fx.loginResult = { user: {}, profile: {}, accessProfile: {}, roles: [], permissions: [], accessToken: 'AT', refreshToken: 'RT', expiresIn: 900 };
  const reply = makeReply();
  await controller.login(makeRequest({ body: { phone: '  09120000000  ', password: 'x', app: 'company' } }), reply);
  const [, loginValue, password, app] = calls.login;
  assert.equal(loginValue, '09120000000');
  assert.equal(password, 'x');
  assert.equal(app, 'company');
});

test('login: sets the refresh cookie with the correct security flags (dev: secure=false)', async () => {
  fx.loginResult = { user: {}, profile: {}, accessProfile: {}, roles: [], permissions: [], accessToken: 'AT', refreshToken: 'RT', expiresIn: 900 };
  const reply = makeReply();
  await controller.login(makeRequest({ body: { phone: '09120000000', password: 'x' } }), reply);

  assert.equal(reply._cookies.length, 1);
  const { name, value, opts } = reply._cookies[0];
  assert.equal(name, 'refreshToken');
  assert.equal(value, 'RT');
  assert.equal(opts.httpOnly, true);   // XSS protection — never negotiable
  assert.equal(opts.secure, false);    // dev env in this test
  assert.equal(opts.sameSite, 'strict'); // CSRF protection
  assert.equal(opts.path, '/api/v1/auth');
});

test('login: 200s with tokens + full auth context in the body; refreshToken only ever rides the cookie', async () => {
  fx.loginResult = {
    user: { id: 1 }, profile: { firstName: 'Ali' }, accessProfile: { type: 'CUSTOMER' },
    roles: ['CUSTOMER'], permissions: [], accessToken: 'AT', refreshToken: 'RT', expiresIn: 900,
  };
  const reply = makeReply();
  await controller.login(makeRequest({ body: { phone: '09120000000', password: 'x' } }), reply);

  assert.equal(reply._statusCode, 200);
  // Body: access token + expiry. The refresh token is deliberately absent —
  // it was already placed in the httpOnly cookie above and must never be
  // duplicated into a JS-readable response.
  assert.deepEqual(reply._body.data.tokens, { accessToken: 'AT', expiresIn: 900 });
  assert.equal(reply._cookies[0].value, 'RT');
  assert.deepEqual(reply._body.data.user, { id: 1 });
  assert.deepEqual(reply._body.data.accessProfile, { type: 'CUSTOMER' });
});

// ── refresh ───────────────────────────────────────────────────

test('refresh: rotates the cookie and returns a fresh access token (no refresh token in the body)', async () => {
  fx.refreshResult = { accessToken: 'AT2', refreshToken: 'RT2', expiresIn: 900 };
  const reply = makeReply();
  const req = makeRequest({ refreshTokenRecord: { id: 7 } });
  await controller.refresh(req, reply);

  assert.deepEqual(calls.refresh[1], { id: 7 });
  assert.equal(reply._cookies[0].value, 'RT2');
  assert.equal(reply._statusCode, 200);
  assert.deepEqual(reply._body.data.tokens, { accessToken: 'AT2', expiresIn: 900 });
});

// ── logout / logoutAll ───────────────────────────────────────

test('logout: revokes the specific refresh token record and clears the cookie', async () => {
  const reply = makeReply();
  await controller.logout(makeRequest({ refreshTokenRecord: { id: 42 } }), reply);

  assert.deepEqual(calls.logout, [42]);
  assert.equal(reply._clearedCookies.length, 1);
  assert.equal(reply._clearedCookies[0].name, 'refreshToken');
  assert.equal(reply._clearedCookies[0].opts.path, '/api/v1/auth');
  assert.equal(reply._statusCode, 200);
});

test('logoutAll: revokes by user id (not the refresh token record) and clears the cookie', async () => {
  const reply = makeReply();
  await controller.logoutAll(makeRequest({ user: { id: 99 } }), reply);

  assert.deepEqual(calls.logoutAll, [99]);
  assert.equal(reply._clearedCookies.length, 1);
});

// ── me ────────────────────────────────────────────────────────

test('me: returns the assembled context for request.user.id', async () => {
  fx.meResult = { user: { id: 5 }, profile: {}, accessProfile: {}, roles: [], permissions: [] };
  const reply = makeReply();
  await controller.me(makeRequest({ user: { id: 5 } }), reply);

  assert.deepEqual(calls.getMe, [5]);
  assert.deepEqual(reply._body.data, fx.meResult);
});

// ── adminChangeUserPassword ──────────────────────────────────

test('adminChangeUserPassword: 400s when the target id or new password is missing', async () => {
  const reply = makeReply();
  await controller.adminChangeUserPassword(
    makeRequest({ params: { id: '5' }, body: {} }),
    reply
  );
  assert.equal(reply._statusCode, 400);
  assert.equal(calls.changeUserPassword, undefined);
});

test('adminChangeUserPassword: 400s for a non-numeric / zero id', async () => {
  const reply = makeReply();
  await controller.adminChangeUserPassword(
    makeRequest({ params: { id: '0' }, body: { newPassword: 'x'.repeat(10) } }),
    reply
  );
  assert.equal(reply._statusCode, 400);
});

test('adminChangeUserPassword: coerces the id to a number and forwards to the service', async () => {
  const reply = makeReply();
  await controller.adminChangeUserPassword(
    makeRequest({ params: { id: '17' }, body: { newPassword: 'x'.repeat(10) } }),
    reply
  );
  assert.deepEqual(calls.changeUserPassword, [17, 'x'.repeat(10)]);
  assert.equal(reply._statusCode, 200);
});

// ── register / registerCompany ───────────────────────────────

test('register: 201s with the created user context (no tokens — registration never logs in)', async () => {
  fx.registerResult = { user: { id: 1 }, profile: {}, accessProfile: null, roles: [] };
  const reply = makeReply();
  await controller.register(makeRequest({
    body: { email: 'a@a.com', password: 'x'.repeat(10), firstName: 'Ali', lastName: 'Ahmadi', phone: '0912' },
  }), reply);

  assert.equal(reply._statusCode, 201);
  assert.equal(reply._body.data.tokens, undefined);
  assert.equal(reply._cookies.length, 0); // never sets a session cookie
});

test('registerCompany: 201s with the created company + manager context', async () => {
  fx.registerCompanyResult = { company: { id: 1, status: 'PENDING' }, user: { id: 2 }, accessProfile: { type: 'COMPANY', isActive: false } };
  const reply = makeReply();
  await controller.registerCompany(makeRequest({ body: { company: {}, manager: {} } }), reply);

  assert.equal(reply._statusCode, 201);
  assert.deepEqual(reply._body.data.company, fx.registerCompanyResult.company);
  assert.equal(reply._cookies.length, 0);
});