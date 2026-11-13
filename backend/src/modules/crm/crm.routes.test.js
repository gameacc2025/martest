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

test('CRM lead creation validates required fields and score bounds before service execution', async () => {
  const app = await buildTestApp();
  try {
    const headers = { 'x-test-access': 'STAFF', 'x-test-permissions': 'crm.leads.create' };
    const missingName = await app.inject({ method: 'POST', url: '/crm/leads', headers, payload: { score: 10 } });
    assert.equal(missingName.statusCode, 400);
    const invalidScore = await app.inject({ method: 'POST', url: '/crm/leads', headers, payload: { displayName: 'Lead', score: 101 } });
    assert.equal(invalidScore.statusCode, 400);
    const unexpectedField = await app.inject({ method: 'POST', url: '/crm/leads', headers, payload: { displayName: 'Lead', isAdmin: true } });
    assert.equal(unexpectedField.statusCode, 400);
  } finally {
    await app.close();
  }
});

test('CRM lead update rejects empty payloads and out-of-range scores', async () => {
  const app = await buildTestApp();
  try {
    const headers = { 'x-test-access': 'STAFF', 'x-test-permissions': 'crm.leads.update' };
    const empty = await app.inject({ method: 'PATCH', url: '/crm/leads/1', headers, payload: {} });
    assert.equal(empty.statusCode, 400);
    const invalidScore = await app.inject({ method: 'PATCH', url: '/crm/leads/1', headers, payload: { score: -1 } });
    assert.equal(invalidScore.statusCode, 400);
    const invalidId = await app.inject({ method: 'PATCH', url: '/crm/leads/not-an-id', headers, payload: { score: 10 } });
    assert.equal(invalidId.statusCode, 400);
  } finally {
    await app.close();
  }
});

test('CRM lead assignment, status and merge commands validate their required contracts', async () => {
  const app = await buildTestApp();
  try {
    const assign = await app.inject({
      method: 'POST', url: '/crm/leads/1/assign',
      headers: { 'x-test-access': 'STAFF', 'x-test-permissions': 'crm.leads.assign' },
      payload: {},
    });
    assert.equal(assign.statusCode, 400);

    const status = await app.inject({
      method: 'POST', url: '/crm/leads/1/status',
      headers: { 'x-test-access': 'STAFF', 'x-test-permissions': 'crm.leads.update' },
      payload: { status: 'CONVERTED' },
    });
    assert.equal(status.statusCode, 400);

    const merge = await app.inject({
      method: 'POST', url: '/crm/leads/1/merge',
      headers: { 'x-test-access': 'STAFF', 'x-test-permissions': 'crm.leads.merge' },
      payload: { targetLeadId: 2 },
    });
    assert.equal(merge.statusCode, 400);
  } finally {
    await app.close();
  }
});
