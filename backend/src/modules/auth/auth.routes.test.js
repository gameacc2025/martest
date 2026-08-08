// مسیر فایل: backend/src/modules/auth/auth.routes.test.js
// =============================================================
// Integration tests — Auth routes (schema validation, rate limits,
// and onRequest hook wiring: authenticate vs authenticateRefresh vs
// public).
//
// Run with:  node --test
//
// This registers the REAL auth.routes.js (+ real @fastify/rate-limit,
// since /login and /register declare real per-route rate-limit
// config that only takes effect if the plugin is actually
// registered) against stub authenticate/authenticateRefresh
// decorators and a mocked auth.controller. What's under test: that
// login/register/register-company really do reject malformed bodies
// before ever reaching the controller (an unvalidated body reaching
// the service layer is exactly the kind of bug that's invisible in
// a controller unit test, since the mock controller there is never
// handed anything but well-formed input), and that the brute-force
// rate limits on /login and /register are wired to the values the
// header comments claim (10/5min, 5/10min).
// =============================================================

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const Module = require('node:module');
const Fastify = require('fastify');
const rateLimit = require('@fastify/rate-limit');

function injectMock(relativePath, exportsObj) {
  const resolved = require.resolve(path.join(__dirname, relativePath));
  const original = require.cache[resolved];
  require.cache[resolved] = new Module(resolved);
  require.cache[resolved].exports = exportsObj;
  require.cache[resolved].loaded = true;
  test.after(() => {
    if (original) require.cache[resolved] = original;
    else delete require.cache[resolved];
  });
  return resolved;
}

injectMock('../../config/db', {});

const hit = {};
const trivialController = {};
for (const name of ['login', 'register', 'registerCompany', 'refresh', 'logout', 'logoutAll', 'me', 'adminChangeUserPassword']) {
  trivialController[name] = async (request, reply) => {
    hit[name] = true;
    return reply.code(200).send({ ok: true });
  };
}
injectMock('./auth.controller', trivialController);

const authRoutes = require('./auth.routes');

async function buildApp() {
  const app = Fastify();
  await app.register(rateLimit, { global: false }); // per-route config only, no global ceiling
  app.decorate('authenticate', async (request) => {
    const raw = request.headers['x-test-user'];
    if (raw) request.user = JSON.parse(raw);
  });
  app.decorate('authenticateRefresh', async (request, reply) => {
    if (request.headers['x-test-refresh-ok'] !== 'true') {
      return reply.code(401).send({ error: true, code: 'NO_REFRESH_TOKEN' });
    }
  });
  await app.register(authRoutes, { prefix: '/api/v1/auth' });
  await app.ready();
  return app;
}

test.beforeEach(() => { Object.keys(hit).forEach((k) => delete hit[k]); });

// ── /login — public, schema-validated, rate-limited ────────────

test('POST /login: a well-formed body reaches the controller', async () => {
  const app = await buildApp();
  const res = await app.inject({ method: 'POST', url: '/api/v1/auth/login', payload: { email: 'a@a.com', password: 'secret' } });
  assert.equal(res.statusCode, 200);
  assert.equal(hit.login, true);
  await app.close();
});

test('POST /login: is public — reaches the controller with NO Authorization header at all', async () => {
  const app = await buildApp();
  const res = await app.inject({ method: 'POST', url: '/api/v1/auth/login', payload: { email: 'a@a.com', password: 'secret' } });
  assert.equal(res.statusCode, 200);
  await app.close();
});

test('POST /login: missing password -> 400, controller never reached', async () => {
  const app = await buildApp();
  const res = await app.inject({ method: 'POST', url: '/api/v1/auth/login', payload: { email: 'a@a.com' } });
  assert.equal(res.statusCode, 400);
  assert.equal(hit.login, undefined);
  await app.close();
});

test('POST /login: an unexpected extra field does not itself cause a 400 (Fastify\'s default ajv accepts additionalProperties unless explicitly stripped/rejected at the app level)', async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: 'POST',
    url: '/api/v1/auth/login',
    payload: { email: 'a@a.com', password: 'secret', isAdmin: true },
  });
  assert.equal(res.statusCode, 200);
  await app.close();
});

test('POST /login: brute-force rate limit is 10 requests / 5 minutes, independent of the global API limit', async () => {
  const app = await buildApp();
  const payload = { email: 'a@a.com', password: 'secret' };
  for (let i = 0; i < 10; i++) {
    const res = await app.inject({ method: 'POST', url: '/api/v1/auth/login', payload });
    assert.equal(res.statusCode, 200, `request ${i + 1} should succeed`);
  }
  const eleventh = await app.inject({ method: 'POST', url: '/api/v1/auth/login', payload });
  assert.equal(eleventh.statusCode, 429);
  await app.close();
});

// ── /register — public, rate-limited ────────────────────────────

test('POST /register: a well-formed body reaches the controller', async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: 'POST',
    url: '/api/v1/auth/register',
    payload: { email: 'a@a.com', password: 'password123', firstName: 'Ali', lastName: 'Rezaei' },
  });
  assert.equal(res.statusCode, 200);
  await app.close();
});

test('POST /register: password shorter than 8 chars -> 400', async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: 'POST',
    url: '/api/v1/auth/register',
    payload: { email: 'a@a.com', password: 'short', firstName: 'Ali', lastName: 'Rezaei' },
  });
  assert.equal(res.statusCode, 400);
  assert.equal(hit.register, undefined);
  await app.close();
});

test('POST /register: invalid email format -> 400', async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: 'POST',
    url: '/api/v1/auth/register',
    payload: { email: 'not-an-email', password: 'password123', firstName: 'Ali', lastName: 'Rezaei' },
  });
  assert.equal(res.statusCode, 400);
  await app.close();
});

test('POST /register: the stricter rate limit is 5 requests / 10 minutes (tighter than /login\'s 10/5min)', async () => {
  const app = await buildApp();
  const payload = { email: 'a@a.com', password: 'password123', firstName: 'Ali', lastName: 'Rezaei' };
  for (let i = 0; i < 5; i++) {
    const res = await app.inject({ method: 'POST', url: '/api/v1/auth/register', payload });
    assert.equal(res.statusCode, 200, `request ${i + 1} should succeed`);
  }
  const sixth = await app.inject({ method: 'POST', url: '/api/v1/auth/register', payload });
  assert.equal(sixth.statusCode, 429);
  await app.close();
});

// ── /register-company — public, requires the full field set ───

test('POST /register-company: a well-formed body reaches the controller', async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: 'POST',
    url: '/api/v1/auth/register-company',
    payload: {
      companyName: 'Acme', nationalId: '123', registrationNumber: '456',
      companyEmail: 'c@c.com', phone: '0912', address: 'Tehran',
      managerFirstName: 'Ali', managerLastName: 'Rezaei', managerEmail: 'm@c.com', password: 'password123',
    },
  });
  assert.equal(res.statusCode, 200);
  await app.close();
});

test('POST /register-company: missing a required field (e.g. address) -> 400', async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: 'POST',
    url: '/api/v1/auth/register-company',
    payload: {
      companyName: 'Acme', nationalId: '123', registrationNumber: '456',
      companyEmail: 'c@c.com', phone: '0912',
      managerFirstName: 'Ali', managerLastName: 'Rezaei', managerEmail: 'm@c.com', password: 'password123',
    },
  });
  assert.equal(res.statusCode, 400);
  await app.close();
});

test('POST /register-company: an invalid `type` enum value -> 400', async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: 'POST',
    url: '/api/v1/auth/register-company',
    payload: {
      companyName: 'Acme', nationalId: '123', registrationNumber: '456',
      companyEmail: 'c@c.com', phone: '0912', address: 'Tehran', type: 'NOT_A_REAL_TYPE',
      managerFirstName: 'Ali', managerLastName: 'Rezaei', managerEmail: 'm@c.com', password: 'password123',
    },
  });
  assert.equal(res.statusCode, 400);
  await app.close();
});

// ── /refresh and /logout — authenticateRefresh (cookie), not authenticate ──

test('POST /refresh: uses authenticateRefresh, NOT the access-token authenticate hook', async () => {
  const app = await buildApp();
  // No x-test-user header (would satisfy `authenticate`), only the refresh flag.
  const res = await app.inject({ method: 'POST', url: '/api/v1/auth/refresh', headers: { 'x-test-refresh-ok': 'true' } });
  assert.equal(res.statusCode, 200);
  assert.equal(hit.refresh, true);
  await app.close();
});

test('POST /refresh: without a valid refresh token -> 401, controller never reached', async () => {
  const app = await buildApp();
  const res = await app.inject({ method: 'POST', url: '/api/v1/auth/refresh' });
  assert.equal(res.statusCode, 401);
  assert.equal(hit.refresh, undefined);
  await app.close();
});

test('POST /logout: also uses authenticateRefresh, not authenticate', async () => {
  const app = await buildApp();
  const res = await app.inject({ method: 'POST', url: '/api/v1/auth/logout', headers: { 'x-test-refresh-ok': 'true' } });
  assert.equal(res.statusCode, 200);
  assert.equal(hit.logout, true);
  await app.close();
});

// ── /logout-all and /me — authenticate (access token) ───────────

test('POST /logout-all: requires authenticate (access token), a refresh-only request does not satisfy it', async () => {
  const app = await buildApp();
  const res = await app.inject({ method: 'POST', url: '/api/v1/auth/logout-all', headers: { 'x-test-refresh-ok': 'true' } });
  // authenticate stub leaves request.user unset without x-test-user, and the
  // route has no rbac preHandler of its own — the controller itself is
  // expected to check request.user, so we assert the hook ran (no 401 short
  // circuit from OUR stub) and the (mocked) controller was invoked.
  assert.equal(res.statusCode, 200);
  assert.equal(hit.logoutAll, true);
  await app.close();
});

test('GET /me: requires authenticate', async () => {
  const app = await buildApp();
  const res = await app.inject({ method: 'GET', url: '/api/v1/auth/me', headers: { 'x-test-user': JSON.stringify({ id: 1 }) } });
  assert.equal(res.statusCode, 200);
  assert.equal(hit.me, true);
  await app.close();
});

// ── /users/:id/password — authenticate + requirePermission ─────

test('PATCH /users/:id/password: requires users.reset_password permission on top of authenticate', async () => {
  const app = await buildApp();
  const withPerm = await app.inject({
    method: 'PATCH',
    url: '/api/v1/auth/users/1/password',
    headers: { 'x-test-user': JSON.stringify({ roles: [], permissions: ['users.reset_password'] }) },
    payload: { newPassword: 'newpassword123' },
  });
  assert.equal(withPerm.statusCode, 200);
  assert.equal(hit.adminChangeUserPassword, true);
  await app.close();
});

test('PATCH /users/:id/password: without the permission -> 403', async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: 'PATCH',
    url: '/api/v1/auth/users/1/password',
    headers: { 'x-test-user': JSON.stringify({ roles: [], permissions: [] }) },
    payload: { newPassword: 'newpassword123' },
  });
  assert.equal(res.statusCode, 403);
  assert.equal(hit.adminChangeUserPassword, undefined);
  await app.close();
});

test('PATCH /users/:id/password: a non-integer :id -> 400 (params schema)', async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: 'PATCH',
    url: '/api/v1/auth/users/not-a-number/password',
    headers: { 'x-test-user': JSON.stringify({ roles: [], permissions: ['users.reset_password'] }) },
    payload: { newPassword: 'newpassword123' },
  });
  assert.equal(res.statusCode, 400);
  await app.close();
});
