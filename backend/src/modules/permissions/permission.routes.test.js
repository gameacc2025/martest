// مسیر فایل: backend/src/modules/permissions/permission.routes.test.js
// =============================================================
// Integration tests — Permission routes (permission wiring)
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
const trivialController = {};
for (const name of ['list', 'getById', 'create', 'update', 'remove']) {
  trivialController[name] = async (request, reply) => {
    hit[name] = true;
    return reply.code(200).send({ ok: true });
  };
}
injectMock('./permission.controller', trivialController);

const permissionRoutes = require('./permission.routes');

async function buildApp() {
  const app = Fastify();
  app.decorate('authenticate', async (request, reply) => {
    const raw = request.headers['x-test-user'];
    if (!raw) {
      return reply.code(401).send({ error: true, code: 'UNAUTHORIZED', message: 'Authentication required.' });
    }
    request.user = JSON.parse(raw);
  });
  await app.register(permissionRoutes, { prefix: '/api/v1/permissions' });
  await app.ready();
  return app;
}

function userHeader(permissions, { accessType = 'STAFF', roles = [] } = {}) {
  return { 'x-test-user': JSON.stringify({ accessType, roles, permissions }) };
}

test.beforeEach(() => { Object.keys(hit).forEach((k) => delete hit[k]); });

// ── GET / (list) — permissions.read ─────────────────────────

test('COMPANY context cannot read or change permission definitions with SUPER_ADMIN wildcard permissions', async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: 'PATCH',
    url: '/api/v1/permissions/1',
    headers: userHeader(['*'], { accessType: 'COMPANY', roles: ['SUPER_ADMIN'] }),
    payload: { name: 'users.delete' },
  });
  assert.equal(res.statusCode, 403);
  assert.equal(hit.update, undefined);
  await app.close();
});

test('GET /: requires permissions.read', async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: 'GET',
    url: '/api/v1/permissions',
    headers: userHeader(['permissions.read']),
  });
  assert.equal(res.statusCode, 200);
  assert.equal(hit.list, true);
  await app.close();
});

test('GET /: without permission -> 403', async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: 'GET',
    url: '/api/v1/permissions',
    headers: userHeader([]),
  });
  assert.equal(res.statusCode, 403);
  await app.close();
});

test('GET /: without auth -> 401', async () => {
  const app = await buildApp();
  const res = await app.inject({ method: 'GET', url: '/api/v1/permissions' });
  assert.equal(res.statusCode, 401);
  await app.close();
});

// ── GET /:id — permissions.read ─────────────────────────────

test('GET /:id: requires permissions.read', async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: 'GET',
    url: '/api/v1/permissions/1',
    headers: userHeader(['permissions.read']),
  });
  assert.equal(res.statusCode, 200);
  assert.equal(hit.getById, true);
  await app.close();
});

test('GET /:id: non-integer id -> 400 (params schema)', async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: 'GET',
    url: '/api/v1/permissions/abc',
    headers: userHeader(['permissions.read']),
  });
  assert.equal(res.statusCode, 400);
  await app.close();
});

// ── POST / (create) — permissions.create ────────────────────

test('POST /: requires permissions.create', async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: 'POST',
    url: '/api/v1/permissions',
    headers: userHeader(['permissions.create']),
    payload: { name: 'test.permission', label: 'Test Permission' },
  });
  assert.equal(res.statusCode, 200);
  assert.equal(hit.create, true);
  await app.close();
});

test('POST /: without permission -> 403', async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: 'POST',
    url: '/api/v1/permissions',
    headers: userHeader([]),
    payload: { name: 'test.permission', label: 'Test Permission' },
  });
  assert.equal(res.statusCode, 403);
  await app.close();
});

// ── PATCH /:id (update) — permissions.update ────────────────

test('PATCH /:id: requires permissions.update', async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: 'PATCH',
    url: '/api/v1/permissions/1',
    headers: userHeader(['permissions.update']),
    payload: { label: 'Updated' },
  });
  assert.equal(res.statusCode, 200);
  assert.equal(hit.update, true);
  await app.close();
});

// ── DELETE /:id — permissions.delete ────────────────────────

test('DELETE /:id: requires permissions.delete', async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: 'DELETE',
    url: '/api/v1/permissions/1',
    headers: userHeader(['permissions.delete']),
  });
  assert.equal(res.statusCode, 200);
  assert.equal(hit.remove, true);
  await app.close();
});

test('DELETE /:id: without permission -> 403', async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: 'DELETE',
    url: '/api/v1/permissions/1',
    headers: userHeader([]),
  });
  assert.equal(res.statusCode, 403);
  await app.close();
});

// ── SUPER_ADMIN bypass ───────────────────────────────────────

test('SUPER_ADMIN bypasses all permission checks', async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: 'GET',
    url: '/api/v1/permissions',
    headers: { 'x-test-user': JSON.stringify({ accessType: 'STAFF', roles: ['SUPER_ADMIN'], permissions: ['*'] }) },
  });
  assert.equal(res.statusCode, 200);
  assert.equal(hit.list, true);
  await app.close();
});
