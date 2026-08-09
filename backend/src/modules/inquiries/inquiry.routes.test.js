// مسیر فایل: backend/src/modules/inquiries/inquiry.routes.test.js
// =============================================================
// Integration tests — Inquiry routes (permission + schema wiring)
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
  'list', 'stats', 'getById', 'create', 'update', 'listItems',
  'changeStatus', 'addItem', 'updateItem', 'deleteItem',
  'listResponses', 'submitResponse', 'updateResponse',
  'withdrawResponse', 'uploadResponseAttachment', 'deleteResponseAttachment',
];
for (const name of controllerMethods) {
  trivialController[name] = async (request, reply) => {
    hit[name] = true;
    return reply.code(200).send({ ok: true });
  };
}
injectMock('./inquiry.controller', trivialController);

const inquiryRoutes = require('./inquiry.routes');

async function buildApp() {
  const app = Fastify();
  app.decorate('authenticate', async (request, reply) => {
    const raw = request.headers['x-test-user'];
    if (!raw) {
      return reply.code(401).send({ error: true, code: 'UNAUTHORIZED', message: 'Authentication required.' });
    }
    request.user = JSON.parse(raw);
  });
  await app.register(inquiryRoutes, { prefix: '/api/v1/inquiries' });
  await app.ready();
  return app;
}

function userHeader(accessType, permissions) {
  return { 'x-test-user': JSON.stringify({ roles: [], permissions, accessType }) };
}

test.beforeEach(() => { Object.keys(hit).forEach((k) => delete hit[k]); });

// ── Auth: all routes require authentication ────────────────────

test('GET /: without auth -> 401', async () => {
  const app = await buildApp();
  const res = await app.inject({ method: 'GET', url: '/api/v1/inquiries' });
  assert.equal(res.statusCode, 401);
  await app.close();
});

test('POST /: without auth -> 401', async () => {
  const app = await buildApp();
  const res = await app.inject({ method: 'POST', url: '/api/v1/inquiries', payload: { title: 'T', items: [] } });
  assert.equal(res.statusCode, 401);
  await app.close();
});

// ── GET / (list) — ALL_TYPES + leads.read/inquiries.read ──────

test('GET /: STAFF with leads.read -> 200', async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: 'GET',
    url: '/api/v1/inquiries',
    headers: userHeader('STAFF', ['leads.read']),
  });
  assert.equal(res.statusCode, 200);
  assert.equal(hit.list, true);
  await app.close();
});

test('GET /: COMPANY with inquiries.read -> 200', async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: 'GET',
    url: '/api/v1/inquiries',
    headers: userHeader('COMPANY', ['inquiries.read']),
  });
  assert.equal(res.statusCode, 200);
  assert.equal(hit.list, true);
  await app.close();
});

test('GET /: CUSTOMER with leads.read -> 200 (ALL_TYPES includes CUSTOMER)', async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: 'GET',
    url: '/api/v1/inquiries',
    headers: userHeader('CUSTOMER', ['leads.read']),
  });
  assert.equal(res.statusCode, 200);
  assert.equal(hit.list, true);
  await app.close();
});

test('GET /: without permission -> 403', async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: 'GET',
    url: '/api/v1/inquiries',
    headers: userHeader('STAFF', []),
  });
  assert.equal(res.statusCode, 403);
  assert.equal(hit.list, undefined);
  await app.close();
});

// ── GET /stats ───────────────────────────────────────────────

test('GET /stats: requires leads.read or inquiries.read', async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: 'GET',
    url: '/api/v1/inquiries/stats',
    headers: userHeader('STAFF', ['leads.read']),
  });
  assert.equal(res.statusCode, 200);
  assert.equal(hit.stats, true);
  await app.close();
});

// ── GET /:id ─────────────────────────────────────────────────

test('GET /:id: STAFF with leads.read -> 200', async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: 'GET',
    url: '/api/v1/inquiries/1',
    headers: userHeader('STAFF', ['leads.read']),
  });
  assert.equal(res.statusCode, 200);
  assert.equal(hit.getById, true);
  await app.close();
});

// ── POST / (create) — ALL_TYPES + leads.create/inquiries.create

test('POST /: STAFF with leads.create -> 200', async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: 'POST',
    url: '/api/v1/inquiries',
    headers: userHeader('STAFF', ['leads.create']),
    payload: { title: 'Inquiry', items: [{ productId: 1, quantity: 10 }] },
  });
  assert.equal(res.statusCode, 200);
  assert.equal(hit.create, true);
  await app.close();
});

test('POST /: missing required title -> 400 (schema validation)', async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: 'POST',
    url: '/api/v1/inquiries',
    headers: userHeader('STAFF', ['leads.create']),
    payload: { items: [{ productId: 1, quantity: 10 }] },
  });
  assert.equal(res.statusCode, 400);
  assert.equal(hit.create, undefined);
  await app.close();
});

test('POST /: missing required items -> 400', async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: 'POST',
    url: '/api/v1/inquiries',
    headers: userHeader('STAFF', ['leads.create']),
    payload: { title: 'Test' },
  });
  assert.equal(res.statusCode, 400);
  await app.close();
});

test('POST /: empty items array -> 400 (minItems: 1)', async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: 'POST',
    url: '/api/v1/inquiries',
    headers: userHeader('STAFF', ['leads.create']),
    payload: { title: 'Test', items: [] },
  });
  assert.equal(res.statusCode, 400);
  await app.close();
});

// ── PATCH /:id (update) — MANAGE_TYPES only ──────────────────

test('PATCH /:id: STAFF with leads.update -> 200', async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: 'PATCH',
    url: '/api/v1/inquiries/1',
    headers: userHeader('STAFF', ['leads.update']),
    payload: { title: 'Updated' },
  });
  assert.equal(res.statusCode, 200);
  assert.equal(hit.update, true);
  await app.close();
});

test('PATCH /:id: CUSTOMER cannot update (MANAGE_TYPES excludes CUSTOMER)', async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: 'PATCH',
    url: '/api/v1/inquiries/1',
    headers: userHeader('CUSTOMER', ['leads.update']),
    payload: { title: 'Updated' },
  });
  assert.equal(res.statusCode, 403);
  await app.close();
});

// ── PATCH /:id/status — MANAGE_TYPES ─────────────────────────

test('PATCH /:id/status: STAFF with leads.update -> 200', async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: 'PATCH',
    url: '/api/v1/inquiries/1/status',
    headers: userHeader('STAFF', ['leads.update']),
    payload: { status: 'OPEN' },
  });
  assert.equal(res.statusCode, 200);
  assert.equal(hit.changeStatus, true);
  await app.close();
});

test('PATCH /:id/status: invalid status enum -> 400', async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: 'PATCH',
    url: '/api/v1/inquiries/1/status',
    headers: userHeader('STAFF', ['leads.update']),
    payload: { status: 'INVALID_STATUS' },
  });
  assert.equal(res.statusCode, 400);
  await app.close();
});

// ── POST /:id/items ──────────────────────────────────────────

test('POST /:id/items: STAFF with leads.update -> 200', async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: 'POST',
    url: '/api/v1/inquiries/1/items',
    headers: userHeader('STAFF', ['leads.update']),
    payload: { productId: 1, quantity: 5 },
  });
  assert.equal(res.statusCode, 200);
  assert.equal(hit.addItem, true);
  await app.close();
});

// ── PATCH /:id/items/:itemId ─────────────────────────────────

test('PATCH /:id/items/:itemId: STAFF with leads.update -> 200', async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: 'PATCH',
    url: '/api/v1/inquiries/1/items/2',
    headers: userHeader('STAFF', ['leads.update']),
    payload: { quantity: 10 },
  });
  assert.equal(res.statusCode, 200);
  assert.equal(hit.updateItem, true);
  await app.close();
});

// ── DELETE /:id/items/:itemId — MANAGE_TYPES ─────────────────

test('DELETE /:id/items/:itemId: STAFF with leads.delete -> 200', async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: 'DELETE',
    url: '/api/v1/inquiries/1/items/2',
    headers: userHeader('STAFF', ['leads.delete']),
  });
  assert.equal(res.statusCode, 200);
  assert.equal(hit.deleteItem, true);
  await app.close();
});

// ── POST /:id/responses — MANAGE_TYPES ───────────────────────

test('POST /:id/responses: COMPANY with inquiries.respond -> 200', async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: 'POST',
    url: '/api/v1/inquiries/1/responses',
    headers: userHeader('COMPANY', ['inquiries.respond']),
    payload: {
      items: [{ inquiryItemId: 1, price: 1000, deliveryTime: '3 days', description: 'desc', availableQuantity: 50 }],
    },
  });
  assert.equal(res.statusCode, 200);
  assert.equal(hit.submitResponse, true);
  await app.close();
});

// ── GET /:id/responses — ALL_TYPES ───────────────────────────

test('GET /:id/responses: CUSTOMER with inquiries.read -> 200', async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: 'GET',
    url: '/api/v1/inquiries/1/responses',
    headers: userHeader('CUSTOMER', ['inquiries.read']),
  });
  assert.equal(res.statusCode, 200);
  assert.equal(hit.listResponses, true);
  await app.close();
});

// ── SUPER_ADMIN bypass ───────────────────────────────────────

test('SUPER_ADMIN bypasses all inquiry permission checks', async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: 'GET',
    url: '/api/v1/inquiries',
    headers: { 'x-test-user': JSON.stringify({ roles: ['SUPER_ADMIN'], permissions: ['*'], accessType: 'STAFF' }) },
  });
  assert.equal(res.statusCode, 200);
  assert.equal(hit.list, true);
  await app.close();
});
