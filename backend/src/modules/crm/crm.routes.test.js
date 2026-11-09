const test = require('node:test');
const assert = require('node:assert/strict');
const Fastify = require('fastify');
const crmRoutes = require('./index');

async function buildTestApp() {
  const app = Fastify();
  app.decorate('authenticate', async (request) => {
    const accessType = request.headers['x-test-access'];
    if (!accessType) return;
    request.user = {
      id: 1,
      accessType,
      permissions: String(request.headers['x-test-permissions'] || '').split(',').filter(Boolean),
    };
  });
  await app.register(crmRoutes, { prefix: '/crm' });
  await app.ready();
  return app;
}

test('CRM routes reject unauthenticated requests', async () => {
  const app = await buildTestApp();
  try {
    const response = await app.inject({ method: 'GET', url: '/crm/dashboard' });
    assert.equal(response.statusCode, 401);
  } finally {
    await app.close();
  }
});

test('CRM routes reject COMPANY even with wildcard permissions', async () => {
  const app = await buildTestApp();
  try {
    const response = await app.inject({
      method: 'GET',
      url: '/crm/dashboard',
      headers: { 'x-test-access': 'COMPANY', 'x-test-permissions': '*' },
    });
    assert.equal(response.statusCode, 403);
  } finally {
    await app.close();
  }
});

test('CRM routes reject CUSTOMER even with legacy RFQ lead permissions', async () => {
  const app = await buildTestApp();
  try {
    const response = await app.inject({
      method: 'GET',
      url: '/crm/dashboard',
      headers: { 'x-test-access': 'CUSTOMER', 'x-test-permissions': 'leads.read,leads.create' },
    });
    assert.equal(response.statusCode, 403);
  } finally {
    await app.close();
  }
});

test('STAFF without the exact CRM permission is rejected', async () => {
  const app = await buildTestApp();
  try {
    const response = await app.inject({
      method: 'GET',
      url: '/crm/dashboard',
      headers: { 'x-test-access': 'STAFF', 'x-test-permissions': 'leads.read,inquiries.read' },
    });
    assert.equal(response.statusCode, 403);
  } finally {
    await app.close();
  }
});
