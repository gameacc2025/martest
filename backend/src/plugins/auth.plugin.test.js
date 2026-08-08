// مسیر فایل: backend/src/plugins/auth.plugin.test.js
// =============================================================
// Tests — auth Fastify plugin (fastify.authenticate / fastify.authenticateRefresh)
//
// Run with:  node --test
//
// This decorates every protected route in the app, so a bug here is
// an app-wide auth bypass or an app-wide lockout. It had zero
// coverage. Because @fastify/jwt's request.jwtVerify() and
// @fastify/cookie are genuinely load-bearing here (not just plumbing),
// these tests spin up a REAL Fastify instance and use fastify.inject()
// rather than hand-mocking request/reply — anything less would not
// actually exercise the JWT verification this plugin depends on.
//
// Mocked: config/db (prisma.refreshToken) — the only real I/O boundary.
// Real: @fastify/jwt, @fastify/cookie, utils/token.js, config/env (with
// test secrets injected).
// =============================================================

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const Module = require('node:module');
const Fastify = require('fastify');

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

const ENV = {
  jwtAccessSecret: 'test-access-secret',
  jwtAccessExpiresIn: '15m',
  jwtRefreshSecret: 'test-refresh-secret',
  jwtRefreshExpiresIn: '7d',
};
injectMock('../config/env', ENV);

const dbCalls = { findUnique: [], delete: [] };
let fx;
function resetDb() {
  dbCalls.findUnique = [];
  dbCalls.delete = [];
  fx = { tokenRecord: null };
}
resetDb();

const mockPrisma = {
  refreshToken: {
    findUnique: async (args) => { dbCalls.findUnique.push(args); return fx.tokenRecord; },
    delete: async (args) => { dbCalls.delete.push(args); },
  },
};
injectMock('../config/db', mockPrisma);

const authPlugin = require('./auth.plugin');
const { hashRefreshToken } = require('../utils/token');

async function buildApp() {
  const app = Fastify();
  await app.register(authPlugin);

  app.get('/protected', { preHandler: app.authenticate }, async (request) => {
    return { user: request.user };
  });

  app.get('/refresh-only', { preHandler: app.authenticateRefresh }, async (request) => {
    return { tokenRecordId: request.refreshTokenRecord.id, raw: request.rawRefreshToken };
  });

  await app.ready();
  return app;
}

function signAccess(app, payload, opts = {}) {
  return app.jwt.sign(
    { sub: 1, email: 'a@a.com', roles: [], permissions: [], accessType: null, companyId: null, type: 'access', ...payload },
    { key: ENV.jwtAccessSecret, expiresIn: '15m', ...opts }
  );
}

function signRefresh(app, payload, opts = {}) {
  return app.jwt.sign(
    { sub: 1, type: 'refresh', ...payload },
    { key: ENV.jwtRefreshSecret, expiresIn: '7d', ...opts }
  );
}

// ── authenticate — access token verification ─────────────────

test('authenticate: a valid access token passes through, normalizing the payload onto request.user', async () => {
  const app = await buildApp();
  const token = signAccess(app, { sub: 42, email: 'x@x.com', roles: ['SUPER_ADMIN'], permissions: ['a', 'b'], accessType: 'STAFF', companyId: null });

  const res = await app.inject({ method: 'GET', url: '/protected', headers: { authorization: `Bearer ${token}` } });

  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.json().user, {
    id: 42, email: 'x@x.com', roles: ['SUPER_ADMIN'], permissions: ['a', 'b'], accessType: 'STAFF', companyId: null,
  });
  await app.close();
});

test('authenticate: missing roles/permissions/email/accessType/companyId in the payload default to [] / null, not undefined', async () => {
  const app = await buildApp();
  const token = app.jwt.sign({ sub: 1, type: 'access' }, { key: ENV.jwtAccessSecret });

  const res = await app.inject({ method: 'GET', url: '/protected', headers: { authorization: `Bearer ${token}` } });
  assert.deepEqual(res.json().user, { id: 1, email: null, roles: [], permissions: [], accessType: null, companyId: null });
  await app.close();
});

test('authenticate: no Authorization header -> 401 UNAUTHORIZED', async () => {
  const app = await buildApp();
  const res = await app.inject({ method: 'GET', url: '/protected' });
  assert.equal(res.statusCode, 401);
  assert.equal(res.json().code, 'UNAUTHORIZED');
  await app.close();
});

test('authenticate: a garbage/malformed token -> 401 UNAUTHORIZED', async () => {
  const app = await buildApp();
  const res = await app.inject({ method: 'GET', url: '/protected', headers: { authorization: 'Bearer not-a-real-jwt' } });
  assert.equal(res.statusCode, 401);
  assert.equal(res.json().code, 'UNAUTHORIZED');
  await app.close();
});

test('authenticate: a token signed with the WRONG secret -> 401 (signature mismatch, not silently accepted)', async () => {
  const app = await buildApp();
  const token = app.jwt.sign({ sub: 1, type: 'access' }, { key: 'wrong-secret' });
  const res = await app.inject({ method: 'GET', url: '/protected', headers: { authorization: `Bearer ${token}` } });
  assert.equal(res.statusCode, 401);
  await app.close();
});

test('authenticate: an EXPIRED access token -> 401 TOKEN_EXPIRED (distinct code from a generally invalid token)', async () => {
  const app = await buildApp();
  const token = app.jwt.sign({ sub: 1, type: 'access' }, { key: ENV.jwtAccessSecret, expiresIn: '1ms' });
  await new Promise((resolve) => setTimeout(resolve, 20));
  const res = await app.inject({ method: 'GET', url: '/protected', headers: { authorization: `Bearer ${token}` } });
  assert.equal(res.statusCode, 401);
  assert.equal(res.json().code, 'TOKEN_EXPIRED');
  await app.close();
});

test('authenticate: a REFRESH token used against a route protected by authenticate() is rejected as the wrong token type', async () => {
  const app = await buildApp();
  const refreshToken = signRefresh(app, { sub: 1 });
  // Sign it with the access secret so JWT verification succeeds — the point is
  // that even a well-formed, correctly-signed "access-secret" token still gets
  // rejected if its `type` claim isn't 'access'.
  const wrongTypeToken = app.jwt.sign({ sub: 1, type: 'refresh' }, { key: ENV.jwtAccessSecret });
  const res = await app.inject({ method: 'GET', url: '/protected', headers: { authorization: `Bearer ${wrongTypeToken}` } });
  assert.equal(res.statusCode, 401);
  assert.equal(res.json().code, 'INVALID_TOKEN_TYPE');
  await app.close();
});

// ── authenticateRefresh — refresh token verification ──────────

test('authenticateRefresh: no refreshToken cookie -> 401 NO_REFRESH_TOKEN', async () => {
  const app = await buildApp();
  const res = await app.inject({ method: 'GET', url: '/refresh-only' });
  assert.equal(res.statusCode, 401);
  assert.equal(res.json().code, 'NO_REFRESH_TOKEN');
  await app.close();
});

test('authenticateRefresh: a malformed cookie value -> 401 INVALID_REFRESH_TOKEN', async () => {
  const app = await buildApp();
  const res = await app.inject({ method: 'GET', url: '/refresh-only', cookies: { refreshToken: 'garbage' } });
  assert.equal(res.statusCode, 401);
  assert.equal(res.json().code, 'INVALID_REFRESH_TOKEN');
  await app.close();
});

test('authenticateRefresh: a well-formed but wrong-secret refresh token -> 401 INVALID_REFRESH_TOKEN', async () => {
  const app = await buildApp();
  const badToken = app.jwt.sign({ sub: 1, type: 'refresh' }, { key: 'not-the-refresh-secret' });
  const res = await app.inject({ method: 'GET', url: '/refresh-only', cookies: { refreshToken: badToken } });
  assert.equal(res.statusCode, 401);
  assert.equal(res.json().code, 'INVALID_REFRESH_TOKEN');
  await app.close();
});

test('authenticateRefresh: an ACCESS token (type mismatch) presented as a refresh cookie -> 401 INVALID_TOKEN_TYPE', async () => {
  const app = await buildApp();
  // Correctly signed with the refresh secret, but type:'access' instead of 'refresh'.
  const token = app.jwt.sign({ sub: 1, type: 'access' }, { key: ENV.jwtRefreshSecret });
  const res = await app.inject({ method: 'GET', url: '/refresh-only', cookies: { refreshToken: token } });
  assert.equal(res.statusCode, 401);
  assert.equal(res.json().code, 'INVALID_TOKEN_TYPE');
  await app.close();
});

test('authenticateRefresh: a valid token with no matching DB record (revoked/never existed) -> 401 REFRESH_TOKEN_REVOKED', async () => {
  resetDb();
  fx.tokenRecord = null;
  const app = await buildApp();
  const token = signRefresh(app, { sub: 1 });

  const res = await app.inject({ method: 'GET', url: '/refresh-only', cookies: { refreshToken: token } });
  assert.equal(res.statusCode, 401);
  assert.equal(res.json().code, 'REFRESH_TOKEN_REVOKED');
  // looked up by the SHA-256 hash of the raw token, never the raw token itself
  assert.equal(dbCalls.findUnique[0].where.token, hashRefreshToken(token));
  await app.close();
});

test('authenticateRefresh: a DB record that has expired (clock drift) -> 401 REFRESH_TOKEN_EXPIRED, and the stale record is deleted', async () => {
  resetDb();
  const token = 'placeholder'; // set below once app exists (needs app.jwt)
  const app = await buildApp();
  const realToken = signRefresh(app, { sub: 1 });
  fx.tokenRecord = { id: 99, expiresAt: new Date(Date.now() - 1000), user: { id: 1, status: 'ACTIVE' } };

  const res = await app.inject({ method: 'GET', url: '/refresh-only', cookies: { refreshToken: realToken } });
  assert.equal(res.statusCode, 401);
  assert.equal(res.json().code, 'REFRESH_TOKEN_EXPIRED');
  assert.deepEqual(dbCalls.delete[0], { where: { id: 99 } });
  await app.close();
});

test('authenticateRefresh: a valid, non-expired token for a NON-ACTIVE user -> 401 USER_DISABLED, without deleting the token', async () => {
  resetDb();
  const app = await buildApp();
  const token = signRefresh(app, { sub: 1 });
  fx.tokenRecord = { id: 5, expiresAt: new Date(Date.now() + 1000000), user: { id: 1, status: 'SUSPENDED' } };

  const res = await app.inject({ method: 'GET', url: '/refresh-only', cookies: { refreshToken: token } });
  assert.equal(res.statusCode, 401);
  assert.equal(res.json().error.code, 'USER_DISABLED');
  assert.equal(dbCalls.delete.length, 0);
  await app.close();
});

test('authenticateRefresh: a fully valid refresh flow attaches refreshTokenRecord + rawRefreshToken to the request', async () => {
  resetDb();
  const app = await buildApp();
  const token = signRefresh(app, { sub: 7 });
  fx.tokenRecord = { id: 123, expiresAt: new Date(Date.now() + 1000000), user: { id: 7, status: 'ACTIVE' } };

  const res = await app.inject({ method: 'GET', url: '/refresh-only', cookies: { refreshToken: token } });
  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.json(), { tokenRecordId: 123, raw: token });
  await app.close();
});
