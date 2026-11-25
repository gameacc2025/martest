const test = require('node:test');
const assert = require('node:assert/strict');
const Fastify = require('fastify');
const supportRoutes = require('./index');
const supportService = require('./support.service');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

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

test('SLA detail route forwards authenticated caller context for service-level tenant scoping', async () => {
  const original = supportService.getSlaDetails;
  let received;
  supportService.getSlaDetails = async (...args) => {
    received = args;
    return { isPaused: false };
  };
  const app = await buildTestApp();
  try {
    const response = await app.inject({
      method: 'GET',
      url: '/support/tickets/42/sla',
      headers: { 'x-test-access': 'CUSTOMER', 'x-test-permissions': 'tickets.read' },
    });
    assert.equal(response.statusCode, 200);
    assert.equal(received[1], 42);
    assert.deepEqual(received[2], {
      id: 1,
      accessType: 'CUSTOMER',
      companyId: null,
      roles: ['CUSTOMER_USER'],
      permissions: ['tickets.read'],
    });
  } finally {
    supportService.getSlaDetails = original;
    await app.close();
  }
});

test('attachment download route forwards the exact ticket, message and attachment IDs', async () => {
  const original = supportService.downloadAttachment;
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'support-route-download-'));
  const filePath = path.join(directory, 'private.txt');
  fs.writeFileSync(filePath, '');
  let received;
  supportService.downloadAttachment = async (...args) => {
    received = args;
    return { filePath, originalName: 'private.txt', mimeType: 'text/plain', sizeBytes: 0 };
  };
  const app = await buildTestApp();
  try {
    const response = await app.inject({
      method: 'GET',
      url: '/support/tickets/1/messages/42/attachments/7/download',
      headers: { 'x-test-access': 'CUSTOMER', 'x-test-permissions': 'tickets.read' },
    });
    assert.equal(response.statusCode, 200);
    assert.equal(received[1], '1');
    assert.equal(received[2], '42');
    assert.equal(received[3], '7');
  } finally {
    supportService.downloadAttachment = original;
    await app.close();
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

test('attachment delete route forwards the exact ticket, message and attachment IDs', async () => {
  const original = supportService.deleteAttachment;
  let received;
  supportService.deleteAttachment = async (...args) => { received = args; return { success: true }; };
  const app = await buildTestApp();
  try {
    const response = await app.inject({
      method: 'DELETE',
      url: '/support/tickets/1/messages/42/attachments/7',
      headers: { 'x-test-access': 'CUSTOMER', 'x-test-permissions': 'tickets.reply' },
    });
    assert.equal(response.statusCode, 200);
    assert.equal(received[1], '1');
    assert.equal(received[2], '42');
    assert.equal(received[3], '7');
  } finally {
    supportService.deleteAttachment = original;
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
