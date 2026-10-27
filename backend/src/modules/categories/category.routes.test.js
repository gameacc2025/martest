// مسیر فایل: backend/src/modules/categories/category.routes.test.js
// =============================================================
// Integration tests — Category routes (schema validation + permission wiring)
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
  'list', 'getOne', 'getProducts', 'listForManagement',
  'create', 'update', 'remove',
  'listSubcategories', 'getSubcategory',
  'createSubcategory', 'updateSubcategory', 'removeSubcategory',
];
for (const name of controllerMethods) {
  trivialController[name] = async (request, reply) => {
    hit[name] = true;
    return reply.code(200).send({ ok: true });
  };
}
injectMock('./category.controller', trivialController);

const categoryRoutes = require('./category.routes');

async function buildApp() {
  const app = Fastify();
  app.decorate('authenticate', async (request) => {
    const raw = request.headers['x-test-user'];
    if (raw) request.user = JSON.parse(raw);
  });
  await app.register(categoryRoutes, { prefix: '/api/v1/categories' });
  await app.ready();
  return app;
}

function userHeader(accessType, permissions, roles = []) {
  return { 'x-test-user': JSON.stringify({ roles, permissions, accessType }) };
}

test.beforeEach(() => { Object.keys(hit).forEach((k) => delete hit[k]); });

// ── Public routes (no auth required) ──────────────────────────

test('COMPANY context cannot manage categories even with SUPER_ADMIN wildcard permissions', async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: 'POST',
    url: '/api/v1/categories',
    headers: userHeader('COMPANY', ['*'], ['SUPER_ADMIN']),
    payload: { name: 'Sensitive category' },
  });
  assert.equal(res.statusCode, 403);
  assert.equal(hit.create, undefined);
  await app.close();
});

test('GET /: public, reaches the controller without auth', async () => {
  const app = await buildApp();
  const res = await app.inject({ method: 'GET', url: '/api/v1/categories' });
  assert.equal(res.statusCode, 200);
  assert.equal(hit.list, true);
  await app.close();
});

test('GET /:id: public, reaches the controller without auth', async () => {
  const app = await buildApp();
  const res = await app.inject({ method: 'GET', url: '/api/v1/categories/1' });
  assert.equal(res.statusCode, 200);
  assert.equal(hit.getOne, true);
  await app.close();
});

test('GET /:id/products: public', async () => {
  const app = await buildApp();
  const res = await app.inject({ method: 'GET', url: '/api/v1/categories/1/products' });
  assert.equal(res.statusCode, 200);
  assert.equal(hit.getProducts, true);
  await app.close();
});

test('GET /:id/subcategories: public', async () => {
  const app = await buildApp();
  const res = await app.inject({ method: 'GET', url: '/api/v1/categories/1/subcategories' });
  assert.equal(res.statusCode, 200);
  assert.equal(hit.listSubcategories, true);
  await app.close();
});

test('GET /:id/subcategories/:subId: public', async () => {
  const app = await buildApp();
  const res = await app.inject({ method: 'GET', url: '/api/v1/categories/1/subcategories/2' });
  assert.equal(res.statusCode, 200);
  assert.equal(hit.getSubcategory, true);
  await app.close();
});

// ── Authenticated routes: /manage ─────────────────────────────

test('GET /manage: requires authenticate + categories.read permission', async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: 'GET',
    url: '/api/v1/categories/manage',
    headers: userHeader('STAFF', ['categories.read']),
  });
  assert.equal(res.statusCode, 200);
  assert.equal(hit.listForManagement, true);
  await app.close();
});

test('GET /manage: without permission -> 403', async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: 'GET',
    url: '/api/v1/categories/manage',
    headers: userHeader('STAFF', []),
  });
  assert.equal(res.statusCode, 403);
  assert.equal(hit.listForManagement, undefined);
  await app.close();
});

test('GET /manage: COMPANY access type is rejected (STAFF only)', async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: 'GET',
    url: '/api/v1/categories/manage',
    headers: userHeader('COMPANY', ['categories.read']),
  });
  assert.equal(res.statusCode, 403);
  await app.close();
});

// ── POST / (create) ──────────────────────────────────────────

test('POST /: requires categories.create + STAFF access type', async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: 'POST',
    url: '/api/v1/categories',
    headers: userHeader('STAFF', ['categories.create']),
    payload: { name: 'Test Category' },
  });
  assert.equal(res.statusCode, 200);
  assert.equal(hit.create, true);
  await app.close();
});

test('POST /: without permission -> 403', async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: 'POST',
    url: '/api/v1/categories',
    headers: userHeader('STAFF', []),
    payload: { name: 'Test Category' },
  });
  assert.equal(res.statusCode, 403);
  await app.close();
});

test('POST /: without auth -> 401', async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: 'POST',
    url: '/api/v1/categories',
    payload: { name: 'Test Category' },
  });
  assert.equal(res.statusCode, 401);
  await app.close();
});

// ── PATCH /:id (update) ──────────────────────────────────────

test('PATCH /:id: requires categories.update + STAFF', async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: 'PATCH',
    url: '/api/v1/categories/1',
    headers: userHeader('STAFF', ['categories.update']),
    payload: { name: 'Updated' },
  });
  assert.equal(res.statusCode, 200);
  assert.equal(hit.update, true);
  await app.close();
});

test('PATCH /:id: without permission -> 403', async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: 'PATCH',
    url: '/api/v1/categories/1',
    headers: userHeader('STAFF', []),
    payload: { name: 'Updated' },
  });
  assert.equal(res.statusCode, 403);
  await app.close();
});

// ── DELETE /:id (remove) ─────────────────────────────────────

test('DELETE /:id: requires categories.delete + STAFF', async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: 'DELETE',
    url: '/api/v1/categories/1',
    headers: userHeader('STAFF', ['categories.delete']),
  });
  assert.equal(res.statusCode, 200);
  assert.equal(hit.remove, true);
  await app.close();
});

test('DELETE /:id: without permission -> 403', async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: 'DELETE',
    url: '/api/v1/categories/1',
    headers: userHeader('STAFF', []),
  });
  assert.equal(res.statusCode, 403);
  await app.close();
});

// ── Subcategory routes ───────────────────────────────────────

test('POST /:id/subcategories: requires categories.create + STAFF', async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: 'POST',
    url: '/api/v1/categories/1/subcategories',
    headers: userHeader('STAFF', ['categories.create']),
    payload: { name: 'Sub' },
  });
  assert.equal(res.statusCode, 200);
  assert.equal(hit.createSubcategory, true);
  await app.close();
});

test('PATCH /:id/subcategories/:subId: requires categories.update + STAFF', async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: 'PATCH',
    url: '/api/v1/categories/1/subcategories/2',
    headers: userHeader('STAFF', ['categories.update']),
    payload: { name: 'Updated Sub' },
  });
  assert.equal(res.statusCode, 200);
  assert.equal(hit.updateSubcategory, true);
  await app.close();
});

test('DELETE /:id/subcategories/:subId: requires categories.delete + STAFF', async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: 'DELETE',
    url: '/api/v1/categories/1/subcategories/2',
    headers: userHeader('STAFF', ['categories.delete']),
  });
  assert.equal(res.statusCode, 200);
  assert.equal(hit.removeSubcategory, true);
  await app.close();
});

test('SUPER_ADMIN bypasses all category permission checks', async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: 'POST',
    url: '/api/v1/categories',
    headers: { 'x-test-user': JSON.stringify({ roles: ['SUPER_ADMIN'], permissions: ['*'], accessType: 'STAFF' }) },
    payload: { name: 'Test' },
  });
  assert.equal(res.statusCode, 200);
  assert.equal(hit.create, true);
  await app.close();
});
