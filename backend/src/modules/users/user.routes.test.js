// مسیر فایل: backend/src/modules/users/user.routes.test.js
// =============================================================
// Integration tests — User routes (permission + schema wiring)
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
const controllerMethods = [
  'list', 'getById', 'create', 'update', 'setAccess', 'remove',
  'setAccessActive', 'moveCompany', 'search', 'searchFields', 'listFields',
];
for (const name of controllerMethods) {
  trivialController[name] = async (request, reply) => {
    hit[name] = true;
    return reply.code(200).send({ ok: true });
  };
}
injectMock('./user.controller', trivialController);

const userRoutes = require('./user.routes');

async function buildApp() {
  const app = Fastify();
  app.decorate('authenticate', async (request) => {
    const raw = request.headers['x-test-user'];
    if (raw) request.user = JSON.parse(raw);
  });
  await app.register(userRoutes, { prefix: '/api/v1/users' });
  await app.ready();
  return app;
}

function userHeader(permissions) {
  return { 'x-test-user': JSON.stringify({ roles: [], permissions }) };
}

test.beforeEach(() => { Object.keys(hit).forEach((k) => delete hit[k]); });

// ── GET / (list) — users.read ────────────────────────────────

test('GET /: requires users.read', async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: 'GET',
    url: '/api/v1/users',
    headers: userHeader(['users.read']),
  });
  assert.equal(res.statusCode, 200);
  assert.equal(hit.list, true);
  await app.close();
});

test('GET /: without permission -> 403', async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: 'GET',
    url: '/api/v1/users',
    headers: userHeader([]),
  });
  assert.equal(res.statusCode, 403);
  await app.close();
});

test('GET /: without auth -> 401', async () => {
  const app = await buildApp();
  const res = await app.inject({ method: 'GET', url: '/api/v1/users' });
  assert.equal(res.statusCode, 401);
  await app.close();
});

// ── POST / (create) — users.create ──────────────────────────

test('POST /: requires users.create', async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: 'POST',
    url: '/api/v1/users',
    headers: userHeader(['users.create']),
    payload: { phone: '09120000000', email: 'a@a.com', password: 'password123', firstName: 'Ali', lastName: 'Rezaei' },
  });
  assert.equal(res.statusCode, 200);
  assert.equal(hit.create, true);
  await app.close();
});

test('POST /: without permission -> 403', async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: 'POST',
    url: '/api/v1/users',
    headers: userHeader([]),
    payload: { phone: '09120000000', email: 'a@a.com', password: 'password123', firstName: 'Ali', lastName: 'Rezaei' },
  });
  assert.equal(res.statusCode, 403);
  await app.close();
});

// ── GET /:id — users.read ───────────────────────────────────

test('GET /:id: requires users.read', async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: 'GET',
    url: '/api/v1/users/1',
    headers: userHeader(['users.read']),
  });
  assert.equal(res.statusCode, 200);
  assert.equal(hit.getById, true);
  await app.close();
});

test('GET /:id: non-integer id -> 400 (params schema)', async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: 'GET',
    url: '/api/v1/users/abc',
    headers: userHeader(['users.read']),
  });
  assert.equal(res.statusCode, 400);
  await app.close();
});

// ── PATCH /:id (update) — users.update ──────────────────────

test('PATCH /:id: requires users.update', async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: 'PATCH',
    url: '/api/v1/users/1',
    headers: userHeader(['users.update']),
    payload: { email: 'new@a.com' },
  });
  assert.equal(res.statusCode, 200);
  assert.equal(hit.update, true);
  await app.close();
});

// ── PATCH /:id/access — users.assign_roles ──────────────────

test('PATCH /:id/access: requires users.assign_roles', async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: 'PATCH',
    url: '/api/v1/users/1/access',
    headers: userHeader(['users.assign_roles']),
    payload: { roleId: 1 },
  });
  assert.equal(res.statusCode, 200);
  assert.equal(hit.setAccess, true);
  await app.close();
});

test('PATCH /:id/access: without permission -> 403', async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: 'PATCH',
    url: '/api/v1/users/1/access',
    headers: userHeader([]),
    payload: { roleId: 1 },
  });
  assert.equal(res.statusCode, 403);
  await app.close();
});

// ── PATCH /:id/access-active — users.activate|users.deactivate

test('PATCH /:id/access-active: requires users.activate or users.deactivate', async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: 'PATCH',
    url: '/api/v1/users/1/access-active',
    headers: userHeader(['users.activate']),
    payload: { isActive: true },
  });
  assert.equal(res.statusCode, 200);
  assert.equal(hit.setAccessActive, true);
  await app.close();
});

test('PATCH /:id/access-active: users.deactivate also works', async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: 'PATCH',
    url: '/api/v1/users/1/access-active',
    headers: userHeader(['users.deactivate']),
    payload: { isActive: false },
  });
  assert.equal(res.statusCode, 200);
  assert.equal(hit.setAccessActive, true);
  await app.close();
});

test('PATCH /:id/access-active: without either permission -> 403', async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: 'PATCH',
    url: '/api/v1/users/1/access-active',
    headers: userHeader([]),
    payload: { isActive: true },
  });
  assert.equal(res.statusCode, 403);
  await app.close();
});

// ── PATCH /:id/company — users.update ───────────────────────

test('PATCH /:id/company: requires users.update', async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: 'PATCH',
    url: '/api/v1/users/1/company',
    headers: userHeader(['users.update']),
    payload: { companyId: 2 },
  });
  assert.equal(res.statusCode, 200);
  assert.equal(hit.moveCompany, true);
  await app.close();
});

// ── DELETE /:id — users.delete ──────────────────────────────

test('DELETE /:id: requires users.delete', async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: 'DELETE',
    url: '/api/v1/users/1',
    headers: userHeader(['users.delete']),
  });
  assert.equal(res.statusCode, 200);
  assert.equal(hit.remove, true);
  await app.close();
});

test('DELETE /:id: without permission -> 403', async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: 'DELETE',
    url: '/api/v1/users/1',
    headers: userHeader([]),
  });
  assert.equal(res.statusCode, 403);
  await app.close();
});

// ── SUPER_ADMIN bypass ───────────────────────────────────────

test('SUPER_ADMIN bypasses all user permission checks', async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: 'GET',
    url: '/api/v1/users',
    headers: { 'x-test-user': JSON.stringify({ roles: ['SUPER_ADMIN'], permissions: ['*'] }) },
  });
  assert.equal(res.statusCode, 200);
  assert.equal(hit.list, true);
  await app.close();
});
