const test = require('node:test');
const assert = require('node:assert/strict');
const Fastify = require('fastify');
const correlationIdPlugin = require('./correlationId');

test('correlation middleware preserves bounded safe client correlation IDs', async () => {
  const app = Fastify();
  try {
    await app.register(correlationIdPlugin);
    app.get('/', async (request) => ({ correlationId: request.correlationId }));

    const response = await app.inject({
      method: 'GET',
      url: '/',
      headers: { 'x-correlation-id': 'trace:request-123' },
    });

    assert.equal(response.statusCode, 200);
    assert.equal(response.json().correlationId, 'trace:request-123');
    assert.equal(response.headers['x-correlation-id'], 'trace:request-123');
  } finally {
    await app.close();
  }
});

test('correlation middleware replaces overlong client IDs with a bounded UUID', async () => {
  const app = Fastify();
  try {
    await app.register(correlationIdPlugin);
    app.get('/', async (request) => ({ correlationId: request.correlationId }));

    const response = await app.inject({
      method: 'GET',
      url: '/',
      headers: { 'x-request-id': 'x'.repeat(101) },
    });

    const correlationId = response.json().correlationId;
    assert.equal(response.statusCode, 200);
    assert.match(correlationId, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    assert.equal(response.headers['x-correlation-id'], correlationId);
    assert.ok(correlationId.length <= 100);
  } finally {
    await app.close();
  }
});
