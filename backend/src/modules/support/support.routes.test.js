const test = require('node:test');
const assert = require('node:assert/strict');
const Fastify = require('fastify');
const supportRoutes = require('./index');

async function buildTestApp() {
  const app = Fastify();
  app.decorate('authenticate', async (request) => {
    const accessType = request.headers['x-test-access'];
    if (!accessType) return;
    request.user = {
      id: 1,
      accessType,
      companyId: request.headers['x-test-company'] ? Number(request.headers['x-test-company']) : null,
      roles: accessType === 'CUSTOMER' ? ['CUSTOMER_USER'] : [],
      permissions: String(request.headers['x-test-permissions'] || '').split(',').filter(Boolean),
    };
  });
  await app.register(supportRoutes, { prefix: '/support' });
  await app.ready();
  return app;
}

test('support ticket routes reject unauthenticated requests', async () => {
  const app = await buildTestApp();
  try {
    const response = await app.inject({ method: 'GET', url: '/support/tickets' });
    assert.equal(response.statusCode, 401);
  } finally {
    await app.close();
  }
});

test('support staff-only queue endpoint rejects COMPANY and CUSTOMER contexts', async () => {
  const app = await buildTestApp();
  try {
    for (const access of ['COMPANY', 'CUSTOMER']) {
      const response = await app.inject({
        method: 'GET', url: '/support/queues',
        headers: { 'x-test-access': access, 'x-test-permissions': 'tickets.read,*' },
      });
      assert.equal(response.statusCode, 403);
    }
  } finally {
    await app.close();
  }
});

test('support staff mutations require the existing tickets.update permission', async () => {
  const app = await buildTestApp();
  try {
    const response = await app.inject({
      method: 'PATCH', url: '/support/tickets/1/status',
      headers: { 'x-test-access': 'STAFF', 'x-test-permissions': 'tickets.read,tickets.reply' },
      payload: { status: 'RESOLVED' },
    });
    assert.equal(response.statusCode, 403);
  } finally {
    await app.close();
  }
});

test('support request schemas reject invalid ticket payloads and IDs', async () => {
  const app = await buildTestApp();
  try {
    const headers = { 'x-test-access': 'CUSTOMER', 'x-test-permissions': 'tickets.create,tickets.read,tickets.reply' };
    const invalidTicket = await app.inject({
      method: 'POST', url: '/support/tickets', headers,
      payload: { subject: '', body: 'hello' },
    });
    assert.equal(invalidTicket.statusCode, 400);

    const invalidId = await app.inject({
      method: 'GET', url: '/support/tickets/not-an-id', headers,
    });
    assert.equal(invalidId.statusCode, 400);
  } finally {
    await app.close();
  }
});

test('customers cannot create internal-only support messages', async () => {
  const app = await buildTestApp();
  try {
    const response = await app.inject({
      method: 'POST', url: '/support/tickets/1/messages',
      headers: { 'x-test-access': 'CUSTOMER', 'x-test-permissions': 'tickets.reply' },
      payload: { body: 'private note', visibility: 'INTERNAL' },
    });
    assert.equal(response.statusCode, 403);
  } finally {
    await app.close();
  }
});
