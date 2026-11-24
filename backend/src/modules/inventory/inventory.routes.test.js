// inventory.routes.test.js — Integration tests for inventory routes
// Run with: node --test

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

// Create a single mock controller with all methods
const hit = {};
const controllerMethods = [
  'getBalance', 'getAvailableStock', 'listMovements', 'listActiveReservations',
  'getReservationByCheckoutKey', 'adjustStock', 'bulkAdjustStock', 'expireReservations'
];
const mockController = {};
for (const name of controllerMethods) {
  hit[name] = false;
  mockController[name] = async (request, reply) => {
    hit[name] = true;
    return reply.code(200).send({ ok: true });
  };
}
injectMock('./inventory.controller', mockController);

const inventoryRoutes = require('./inventory.routes');

async function buildApp() {
  const app = Fastify();
  app.decorate('authenticate', async (request, reply) => {
    const raw = request.headers['x-test-user'];
    if (!raw) {
      return reply.code(401).send({ error: true, code: 'UNAUTHORIZED', message: 'Authentication required.' });
    }
    request.user = JSON.parse(raw);
  });
  await app.register(inventoryRoutes, { prefix: '/api/v1/inventory' });
  await app.ready();
  return app;
}

function userHeader(accessType, permissions) {
  return { 'x-test-user': JSON.stringify({ roles: [], permissions, accessType }) };
}

test.beforeEach(() => { Object.keys(hit).forEach((k) => hit[k] = false); });

// ── All routes require authentication ────────────────────────────────────

test('GET /:id/balance: without auth -> 401', async () => {
  const app = await buildApp();
  const res = await app.inject({ method: 'GET', url: '/api/v1/inventory/1/balance' });
  assert.equal(res.statusCode, 401);
  await app.close();
});

test('GET /:id/available: without auth -> 401', async () => {
  const app = await buildApp();
  const res = await app.inject({ method: 'GET', url: '/api/v1/inventory/1/available' });
  assert.equal(res.statusCode, 401);
  await app.close();
});

test('GET /:id/movements: without auth -> 401', async () => {
  const app = await buildApp();
  const res = await app.inject({ method: 'GET', url: '/api/v1/inventory/1/movements' });
  assert.equal(res.statusCode, 401);
  await app.close();
});

test('GET /:id/reservations: without auth -> 401', async () => {
  const app = await buildApp();
  const res = await app.inject({ method: 'GET', url: '/api/v1/inventory/1/reservations' });
  assert.equal(res.statusCode, 401);
  await app.close();
});

test('GET /reservations/:checkoutKey: without auth -> 401', async () => {
  const app = await buildApp();
  const res = await app.inject({ method: 'GET', url: '/api/v1/inventory/reservations/key123' });
  assert.equal(res.statusCode, 401);
  await app.close();
});

test('POST /:id/adjust: without auth -> 401', async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: 'POST',
    url: '/api/v1/inventory/1/adjust',
    payload: { quantityDelta: 10, movementType: 'RECEIPT' }
  });
  assert.equal(res.statusCode, 401);
  await app.close();
});

test('POST /bulk-adjust: without auth -> 401', async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: 'POST',
    url: '/api/v1/inventory/bulk-adjust',
    payload: { adjustments: [{ productId: 1, quantityDelta: 10, movementType: 'RECEIPT' }] }
  });
  assert.equal(res.statusCode, 401);
  await app.close();
});

test('POST /expire-reservations: without auth -> 401', async () => {
  const app = await buildApp();
  const res = await app.inject({ method: 'POST', url: '/api/v1/inventory/expire-reservations' });
  assert.equal(res.statusCode, 401);
  await app.close();
});

// ── Access type checks (COMPANY + STAFF for read, STAFF only for write) ─────

test('GET /:id/balance: COMPANY with retail.inventory.read -> 200', async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: 'GET', url: '/api/v1/inventory/1/balance',
    headers: userHeader('COMPANY', ['retail.inventory.read']),
  });
  assert.equal(res.statusCode, 200);
  assert.equal(hit.getBalance, true);
  await app.close();
});

test('GET /:id/balance: STAFF with retail.inventory.read -> 200', async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: 'GET', url: '/api/v1/inventory/1/balance',
    headers: userHeader('STAFF', ['retail.inventory.read']),
  });
  assert.equal(res.statusCode, 200);
  assert.equal(hit.getBalance, true);
  await app.close();
});

test('GET /:id/balance: CUSTOMER denied -> 403', async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: 'GET', url: '/api/v1/inventory/1/balance',
    headers: userHeader('CUSTOMER', ['retail.inventory.read']),
  });
  assert.equal(res.statusCode, 403);
  assert.equal(hit.getBalance, false);
  await app.close();
});

test('GET /:id/balance: without permission -> 403', async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: 'GET', url: '/api/v1/inventory/1/balance',
    headers: userHeader('COMPANY', []),
  });
  assert.equal(res.statusCode, 403);
  await app.close();
});

test('GET /:id/available: COMPANY with retail.inventory.read -> 200', async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: 'GET', url: '/api/v1/inventory/1/available',
    headers: userHeader('COMPANY', ['retail.inventory.read']),
  });
  assert.equal(res.statusCode, 200);
  assert.equal(hit.getAvailableStock, true);
  await app.close();
});

test('GET /:id/movements: COMPANY with retail.inventory.read -> 200', async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: 'GET', url: '/api/v1/inventory/1/movements',
    headers: userHeader('COMPANY', ['retail.inventory.read']),
  });
  assert.equal(res.statusCode, 200);
  assert.equal(hit.listMovements, true);
  await app.close();
});

test('GET /:id/reservations: COMPANY with retail.inventory.read -> 200', async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: 'GET', url: '/api/v1/inventory/1/reservations',
    headers: userHeader('COMPANY', ['retail.inventory.read']),
  });
  assert.equal(res.statusCode, 200);
  assert.equal(hit.listActiveReservations, true);
  await app.close();
});

test('GET /reservations/:checkoutKey: COMPANY with retail.inventory.read -> 200', async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: 'GET', url: '/api/v1/inventory/reservations/key123',
    headers: userHeader('COMPANY', ['retail.inventory.read']),
  });
  assert.equal(res.statusCode, 200);
  assert.equal(hit.getReservationByCheckoutKey, true);
  await app.close();
});

// ── Write operations: STAFF only with products.update ─────────────────────

test('POST /:id/adjust: STAFF with products.update -> 200', async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: 'POST', url: '/api/v1/inventory/1/adjust',
    headers: userHeader('STAFF', ['products.update']),
    payload: { quantityDelta: 10, movementType: 'RECEIPT' }
  });
  assert.equal(res.statusCode, 200);
  assert.equal(hit.adjustStock, true);
  await app.close();
});

test('POST /:id/adjust: COMPANY denied -> 403', async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: 'POST', url: '/api/v1/inventory/1/adjust',
    headers: userHeader('COMPANY', ['products.update']),
    payload: { quantityDelta: 10, movementType: 'RECEIPT' }
  });
  assert.equal(res.statusCode, 403);
  assert.equal(hit.adjustStock, false);
  await app.close();
});

test('POST /:id/adjust: STAFF without products.update -> 403', async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: 'POST', url: '/api/v1/inventory/1/adjust',
    headers: userHeader('STAFF', ['retail.inventory.read']),
    payload: { quantityDelta: 10, movementType: 'RECEIPT' }
  });
  assert.equal(res.statusCode, 403);
  await app.close();
});

test('POST /bulk-adjust: STAFF with products.update -> 200', async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: 'POST', url: '/api/v1/inventory/bulk-adjust',
    headers: userHeader('STAFF', ['products.update']),
    payload: { adjustments: [{ productId: 1, quantityDelta: 10, movementType: 'RECEIPT' }] }
  });
  assert.equal(res.statusCode, 200);
  assert.equal(hit.bulkAdjustStock, true);
  await app.close();
});

test('POST /expire-reservations: STAFF with products.update -> 200', async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: 'POST', url: '/api/v1/inventory/expire-reservations',
    headers: userHeader('STAFF', ['products.update']),
  });
  assert.equal(res.statusCode, 200);
  assert.equal(hit.expireReservations, true);
  await app.close();
});

// ── Parameter validation ─────────────────────────────────────────────────

test('GET /:id/balance: non-integer id -> 400', async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: 'GET', url: '/api/v1/inventory/abc/balance',
    headers: userHeader('STAFF', ['retail.inventory.read']),
  });
  assert.equal(res.statusCode, 400);
  await app.close();
});

test('POST /:id/adjust: missing quantityDelta -> 400', async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: 'POST', url: '/api/v1/inventory/1/adjust',
    headers: userHeader('STAFF', ['products.update']),
    payload: { movementType: 'RECEIPT' }
  });
  assert.equal(res.statusCode, 400);
  await app.close();
});

test('POST /:id/adjust: missing movementType -> 400', async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: 'POST', url: '/api/v1/inventory/1/adjust',
    headers: userHeader('STAFF', ['products.update']),
    payload: { quantityDelta: 10 }
  });
  assert.equal(res.statusCode, 400);
  await app.close();
});

test('POST /:id/adjust: invalid movementType -> 400', async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: 'POST', url: '/api/v1/inventory/1/adjust',
    headers: userHeader('STAFF', ['products.update']),
    payload: { quantityDelta: 10, movementType: 'INVALID' }
  });
  assert.equal(res.statusCode, 400);
  await app.close();
});

test('POST /:id/adjust: non-integer quantityDelta -> 400', async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: 'POST', url: '/api/v1/inventory/1/adjust',
    headers: userHeader('STAFF', ['products.update']),
    payload: { quantityDelta: 'ten', movementType: 'RECEIPT' }
  });
  assert.equal(res.statusCode, 400);
  await app.close();
});

test('POST /bulk-adjust: empty adjustments array -> 400', async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: 'POST', url: '/api/v1/inventory/bulk-adjust',
    headers: userHeader('STAFF', ['products.update']),
    payload: { adjustments: [] }
  });
  assert.equal(res.statusCode, 400);
  await app.close();
});

test('POST /bulk-adjust: missing adjustments array -> 400', async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: 'POST', url: '/api/v1/inventory/bulk-adjust',
    headers: userHeader('STAFF', ['products.update']),
    payload: {}
  });
  assert.equal(res.statusCode, 400);
  await app.close();
});

test('POST /bulk-adjust: non-integer quantityDelta in item -> 400', async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: 'POST', url: '/api/v1/inventory/bulk-adjust',
    headers: userHeader('STAFF', ['products.update']),
    payload: { adjustments: [{ productId: 1, quantityDelta: 'ten', movementType: 'RECEIPT' }] }
  });
  assert.equal(res.statusCode, 400);
  await app.close();
});

// ── SUPER_ADMIN bypass ──────────────────────────────────────────────────

test('SUPER_ADMIN in STAFF context bypasses permission checks', async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: 'POST', url: '/api/v1/inventory/1/adjust',
    headers: { 'x-test-user': JSON.stringify({ roles: ['SUPER_ADMIN'], permissions: ['*'], accessType: 'STAFF' }) },
    payload: { quantityDelta: 10, movementType: 'RECEIPT' }
  });
  assert.equal(res.statusCode, 200);
  assert.equal(hit.adjustStock, true);
  await app.close();
});

test('SUPER_ADMIN in COMPANY context cannot access STAFF-only write endpoints', async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: 'POST', url: '/api/v1/inventory/1/adjust',
    headers: { 'x-test-user': JSON.stringify({ roles: ['SUPER_ADMIN'], permissions: ['*'], accessType: 'COMPANY' }) },
    payload: { quantityDelta: 10, movementType: 'RECEIPT' }
  });
  assert.equal(res.statusCode, 403);
  await app.close();
});