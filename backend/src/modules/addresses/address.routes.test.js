const test = require('node:test');
const assert = require('node:assert/strict');
const Fastify = require('fastify');
const Module = require('node:module');
const path = require('node:path');

const hits = [];
const controller = {};
for (const name of ['list', 'create', 'getOne', 'update', 'setDefault', 'remove']) {
  controller[name] = async (_request, reply) => {
    hits.push(name);
    return reply.code(name === 'create' ? 201 : name === 'remove' ? 204 : 200).send();
  };
}

const controllerPath = require.resolve(path.join(__dirname, 'address.controller'));
const originalController = require.cache[controllerPath];
require.cache[controllerPath] = new Module(controllerPath);
require.cache[controllerPath].exports = controller;
require.cache[controllerPath].loaded = true;

test.after(() => {
  if (originalController) require.cache[controllerPath] = originalController;
  else delete require.cache[controllerPath];
});

const addressRoutes = require('./address.routes');

async function buildApp(user) {
  const app = Fastify();
  app.decorate('authenticate', async (request) => { request.user = user; });
  await app.register(addressRoutes, { prefix: '/addresses' });
  await app.ready();
  return app;
}

test.beforeEach(() => { hits.length = 0; });

test('AccessProfile-less CUSTOMER_USER can access own address endpoints', async () => {
  const app = await buildApp({ id: 7, accessType: null, roles: ['CUSTOMER_USER'] });
  const response = await app.inject({ method: 'GET', url: '/addresses' });
  assert.equal(response.statusCode, 200);
  assert.deepEqual(hits, ['list']);
  await app.close();
});

test('COMPANY cannot access customer address endpoints', async () => {
  const app = await buildApp({ id: 8, accessType: 'COMPANY', companyId: 3, roles: ['COMPANY_USER'] });
  const response = await app.inject({ method: 'GET', url: '/addresses' });
  assert.equal(response.statusCode, 403);
  assert.deepEqual(hits, []);
  await app.close();
});

test('STAFF with wildcard permission and stray companyId cannot access customer address endpoints', async () => {
  const app = await buildApp({ id: 9, accessType: 'STAFF', companyId: 3, roles: ['SUPER_ADMIN'], permissions: ['*'] });
  const response = await app.inject({ method: 'GET', url: '/addresses' });
  assert.equal(response.statusCode, 403);
  assert.deepEqual(hits, []);
  await app.close();
});

test('CUSTOMER_USER fallback does not grant customer context to SUPER_ADMIN', async () => {
  const app = await buildApp({ id: 10, accessType: null, roles: ['CUSTOMER_USER', 'SUPER_ADMIN'], permissions: ['*'] });
  const response = await app.inject({ method: 'GET', url: '/addresses' });
  assert.equal(response.statusCode, 403);
  assert.deepEqual(hits, []);
  await app.close();
});
