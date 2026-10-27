// مسیر فایل: backend/src/modules/roles/role.routes.test.js
// =============================================================
// Integration tests — Role routes (permission + schema wiring)
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
for (const name of ['listRoles', 'listAssignableRoles', 'createRole', 'getRole', 'updateRole', 'deleteRole']) {
  trivialController[name] = async (request, reply) => {
    hit[name] = true;
    return reply.code(200).send({ ok: true });
  };
}
injectMock('./role.controller', trivialController);

const roleRoutes = require('./role.routes');

async function buildApp() {
  const app = Fastify();
  app.decorate('authenticate', async (request) => {
    const raw = request.headers['x-test-user'];
    if (raw) request.user = JSON.parse(raw);
  });
  await app.register(roleRoutes, { prefix: '/api/v1/roles' });
  await app.ready();
  return app;
}

function userHeader(permissions, { accessType = 'STAFF', roles = [] } = {}) {
  return { 'x-test-user': JSON.stringify({ accessType, roles, permissions }) };
}

test.beforeEach(() => { Object.keys(hit).forEach((k) => delete hit[k]); });

// ── GET / (list) — roles.read ───────────────────────────────

test('COMPANY context cannot administer role definitions even with SUPER_ADMIN and wildcard permissions', async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: 'POST',
    url: '/api/v1/roles',
    headers: userHeader(['*'], { accessType: 'COMPANY', roles: ['SUPER_ADMIN'] }),
    payload: { name: 'COMPANY_ADMIN', scope: 'COMPANY' },
  });
  assert.equal(res.statusCode, 403);
  assert.equal(hit.createRole, undefined);
  await app.close();
});

test('GET /: requires roles.read', async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: 'GET',
    url: '/api/v1/roles',
    headers: userHeader(['roles.read']),
  });
  assert.equal(res.statusCode, 200);
  assert.equal(hit.listRoles, true);
  await app.close();
});

test('GET /: without permission -> 403', async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: 'GET',
    url: '/api/v1/roles',
    headers: userHeader([]),
  });
  assert.equal(res.statusCode, 403);
  await app.close();
});

test('GET /: without auth -> 401', async () => {
  const app = await buildApp();
  const res = await app.inject({ method: 'GET', url: '/api/v1/roles' });
  assert.equal(res.statusCode, 401);
  await app.close();
});

// ── GET /assignable — users.create or users.assign_roles ─────

test('GET /assignable: requires users.create or users.assign_roles', async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: 'GET',
    url: '/api/v1/roles/assignable',
    headers: userHeader(['users.create']),
  });
  assert.equal(res.statusCode, 200);
  assert.equal(hit.listAssignableRoles, true);
  await app.close();
});

test('GET /assignable: users.assign_roles also works', async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: 'GET',
    url: '/api/v1/roles/assignable',
    headers: userHeader(['users.assign_roles']),
  });
  assert.equal(res.statusCode, 200);
  assert.equal(hit.listAssignableRoles, true);
  await app.close();
});

test('GET /assignable: without either permission -> 403', async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: 'GET',
    url: '/api/v1/roles/assignable',
    headers: userHeader([]),
  });
  assert.equal(res.statusCode, 403);
  await app.close();
});

// ── POST / (create) — roles.create ─────────────────────────

test('POST /: requires roles.create', async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: 'POST',
    url: '/api/v1/roles',
    headers: userHeader(['roles.create']),
    payload: { name: 'NEW_ROLE', label: 'New Role', scope: 'COMPANY' },
  });
  assert.equal(res.statusCode, 200);
  assert.equal(hit.createRole, true);
  await app.close();
});

test('POST /: without permission -> 403', async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: 'POST',
    url: '/api/v1/roles',
    headers: userHeader([]),
    payload: { name: 'NEW_ROLE', label: 'New Role', scope: 'COMPANY' },
  });
  assert.equal(res.statusCode, 403);
  await app.close();
});

// ── GET /:id — roles.read ───────────────────────────────────

test('GET /:id: requires roles.read', async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: 'GET',
    url: '/api/v1/roles/1',
    headers: userHeader(['roles.read']),
  });
  assert.equal(res.statusCode, 200);
  assert.equal(hit.getRole, true);
  await app.close();
});

test('GET /:id: non-integer id -> 400 (params schema)', async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: 'GET',
    url: '/api/v1/roles/abc',
    headers: userHeader(['roles.read']),
  });
  assert.equal(res.statusCode, 400);
  await app.close();
});

// ── PATCH /:id (update) — roles.update ──────────────────────

test('PATCH /:id: requires roles.update', async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: 'PATCH',
    url: '/api/v1/roles/1',
    headers: userHeader(['roles.update']),
    payload: { label: 'Updated' },
  });
  assert.equal(res.statusCode, 200);
  assert.equal(hit.updateRole, true);
  await app.close();
});

// ── DELETE /:id — roles.delete ──────────────────────────────

test('DELETE /:id: requires roles.delete', async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: 'DELETE',
    url: '/api/v1/roles/1',
    headers: userHeader(['roles.delete']),
  });
  assert.equal(res.statusCode, 200);
  assert.equal(hit.deleteRole, true);
  await app.close();
});

test('DELETE /:id: without permission -> 403', async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: 'DELETE',
    url: '/api/v1/roles/1',
    headers: userHeader([]),
  });
  assert.equal(res.statusCode, 403);
  await app.close();
});

// ── SUPER_ADMIN bypass ───────────────────────────────────────

test('SUPER_ADMIN bypasses all role permission checks', async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: 'GET',
    url: '/api/v1/roles',
    headers: { 'x-test-user': JSON.stringify({ roles: ['SUPER_ADMIN'], permissions: ['*'] }) },
  });
  assert.equal(res.statusCode, 200);
  assert.equal(hit.listRoles, true);
  await app.close();
});
