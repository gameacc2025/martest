// مسیر فایل: backend/src/modules/admin/admin.routes.test.js
// =============================================================
// Integration tests — Admin routes (permission wiring)
//
// Run with:  node --test
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

injectMock('../../config/db', {});

const hit = {};
const trivialController = {
  getStats: async (request, reply) => {
    hit.getStats = true;
    return reply.code(200).send({ ok: true });
  },
};
injectMock('./admin.controller', trivialController);

const adminRoutes = require('./admin.routes');

async function buildApp() {
  const app = Fastify();
  app.decorate('authenticate', async (request, reply) => {
    const raw = request.headers['x-test-user'];
    if (!raw) {
      return reply.code(401).send({ error: true, code: 'UNAUTHORIZED', message: 'Authentication required.' });
    }
    request.user = JSON.parse(raw);
  });
  await app.register(adminRoutes, { prefix: '/api/v1/admin' });
  await app.ready();
  return app;
}

function userHeader(permissions) {
  return { 'x-test-user': JSON.stringify({ roles: [], permissions }) };
}

test.beforeEach(() => { Object.keys(hit).forEach((k) => delete hit[k]); });

test('GET /stats: requires users.read permission', async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: 'GET',
    url: '/api/v1/admin/stats',
    headers: userHeader(['users.read']),
  });
  assert.equal(res.statusCode, 200);
  assert.equal(hit.getStats, true);
  await app.close();
});

test('GET /stats: without permission -> 403', async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: 'GET',
    url: '/api/v1/admin/stats',
    headers: userHeader([]),
  });
  assert.equal(res.statusCode, 403);
  assert.equal(hit.getStats, undefined);
  await app.close();
});

test('GET /stats: without auth -> 401', async () => {
  const app = await buildApp();
  const res = await app.inject({ method: 'GET', url: '/api/v1/admin/stats' });
  assert.equal(res.statusCode, 401);
  await app.close();
});

test('GET /stats: SUPER_ADMIN bypasses permission check', async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: 'GET',
    url: '/api/v1/admin/stats',
    headers: { 'x-test-user': JSON.stringify({ roles: ['SUPER_ADMIN'], permissions: ['*'] }) },
  });
  assert.equal(res.statusCode, 200);
  assert.equal(hit.getStats, true);
  await app.close();
});
