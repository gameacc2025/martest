const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const Module = require('node:module');
const Fastify = require('fastify');

function injectMock(relativePath, exportsObj) {
  const resolved = require.resolve(path.join(__dirname, relativePath));
  const original = require.cache[resolved];
  const mockModule = new Module(resolved);
  mockModule.filename = resolved;
  mockModule.loaded = true;
  mockModule.exports = exportsObj;
  require.cache[resolved] = mockModule;
  test.after(() => {
    if (original) require.cache[resolved] = original;
    else delete require.cache[resolved];
  });
}

const hits = { sellerList: 0, sellerGet: 0, sellerTransition: 0, customerOrders: 0, adminList: 0, adminGet: 0 };
injectMock('./retail.controller', {
  listCatalog: async (_request, reply) => reply.send({ data: [] }),
  getCatalogProduct: async (_request, reply) => reply.send({ data: {} }),
  previewCheckout: async (_request, reply) => reply.send({ data: {} }),
});
injectMock('./retail-order.controller', {
  placeOrder: async (_request, reply) => reply.code(201).send({ data: {} }),
  listOrders: async (_request, reply) => { hits.customerOrders++; return reply.send({ data: [] }); },
  getOrder: async (_request, reply) => reply.send({ data: {} }),
  getSandboxPayment: async (_request, reply) => reply.send({ data: {} }),
  confirmSandboxPayment: async (_request, reply) => reply.send({ data: {} }),
});
injectMock('./retail-admin.controller', {
  listOrders: async (_request, reply) => { hits.adminList++; return reply.send({ data: [], meta: { total: 0 } }); },
  getOrder: async (_request, reply) => { hits.adminGet++; return reply.send({ data: {} }); },
});
injectMock('./retail-seller-order.controller', {
  listOrders: async (_request, reply) => { hits.sellerList++; return reply.send({ data: [] }); },
  getOrder: async (_request, reply) => { hits.sellerGet++; return reply.send({ data: {} }); },
  transitionOrder: async (_request, reply) => { hits.sellerTransition++; return reply.send({ data: {} }); },
});

const retailRoutes = require('./retail.routes');

async function buildApp() {
  const app = Fastify();
  app.decorate('authenticate', async (request, reply) => {
    const raw = request.headers['x-test-user'];
    if (!raw) return reply.code(401).send({ error: true, code: 'UNAUTHORIZED' });
    request.user = JSON.parse(raw);
  });
  await app.register(retailRoutes, { prefix: '/api/v1/retail' });
  await app.ready();
  return app;
}
function headers(accessType, permissions, companyId = 77) {
  return { 'x-test-user': JSON.stringify({ id: 42, companyId, accessType, permissions }) };
}

test.beforeEach(() => {
  Object.keys(hits).forEach((key) => { hits[key] = 0; });
});

test('COMPANY with retail.orders.read can list only through seller route guard', async () => {
  const app = await buildApp();
  const response = await app.inject({
    method: 'GET',
    url: '/api/v1/retail/company/orders',
    headers: headers('COMPANY', ['retail.orders.read']),
  });
  assert.equal(response.statusCode, 200);
  assert.equal(hits.sellerList, 1);
  await app.close();
});

test('STAFF and CUSTOMER contexts cannot enter company seller order routes', async () => {
  const app = await buildApp();
  const staff = await app.inject({
    method: 'GET',
    url: '/api/v1/retail/company/orders',
    headers: headers('STAFF', ['retail.orders.read']),
  });
  const customer = await app.inject({
    method: 'GET',
    url: '/api/v1/retail/company/orders',
    headers: headers('CUSTOMER', ['retail.orders.read']),
  });
  assert.equal(staff.statusCode, 403);
  assert.equal(customer.statusCode, 403);
  assert.equal(hits.sellerList, 0);
  await app.close();
});

test('COMPANY without retail.orders.read cannot view seller orders', async () => {
  const app = await buildApp();
  const response = await app.inject({
    method: 'GET',
    url: '/api/v1/retail/company/orders',
    headers: headers('COMPANY', ['products.read']),
  });
  assert.equal(response.statusCode, 403);
  assert.equal(hits.sellerList, 0);
  await app.close();
});

test('seller fulfillment transition requires retail.orders.manage', async () => {
  const app = await buildApp();
  const readOnly = await app.inject({
    method: 'POST',
    url: '/api/v1/retail/company/orders/501/transitions',
    headers: headers('COMPANY', ['retail.orders.read']),
    payload: { action: 'ACCEPT' },
  });
  const manager = await app.inject({
    method: 'POST',
    url: '/api/v1/retail/company/orders/501/transitions',
    headers: headers('COMPANY', ['retail.orders.read', 'retail.orders.manage']),
    payload: { action: 'ACCEPT' },
  });
  assert.equal(readOnly.statusCode, 403);
  assert.equal(manager.statusCode, 200);
  assert.equal(hits.sellerTransition, 1);
  await app.close();
});

test('STAFF retail oversight requires the dedicated retail.admin.read permission', async () => {
  const app = await buildApp();
  const missingPermission = await app.inject({
    method: 'GET',
    url: '/api/v1/retail/admin/orders',
    headers: headers('STAFF', ['retail.orders.read']),
  });
  const allowed = await app.inject({
    method: 'GET',
    url: '/api/v1/retail/admin/orders?page=1&limit=20&exceptionOnly=true',
    headers: headers('STAFF', ['retail.admin.read']),
  });
  const invalidFilter = await app.inject({
    method: 'GET',
    url: '/api/v1/retail/admin/orders?exceptionOnly=not-a-boolean',
    headers: headers('STAFF', ['retail.admin.read']),
  });
  assert.equal(missingPermission.statusCode, 403);
  assert.equal(allowed.statusCode, 200);
  assert.equal(invalidFilter.statusCode, 400);
  assert.equal(hits.adminList, 1);
  await app.close();
});

test('COMPANY and CUSTOMER contexts cannot enter STAFF retail oversight', async () => {
  const app = await buildApp();
  const company = await app.inject({
    method: 'GET',
    url: '/api/v1/retail/admin/orders',
    headers: headers('COMPANY', ['retail.admin.read']),
  });
  const customer = await app.inject({
    method: 'GET',
    url: '/api/v1/retail/admin/orders',
    headers: headers('CUSTOMER', ['retail.admin.read']),
  });
  assert.equal(company.statusCode, 403);
  assert.equal(customer.statusCode, 403);
  assert.equal(hits.adminList, 0);
  await app.close();
});

test('CUSTOMER order history remains available through the separate customer route', async () => {
  const app = await buildApp();
  const response = await app.inject({
    method: 'GET',
    url: '/api/v1/retail/orders',
    headers: headers('CUSTOMER', ['inquiries.read']),
  });
  assert.equal(response.statusCode, 200);
  assert.equal(hits.customerOrders, 1);
  await app.close();
});
