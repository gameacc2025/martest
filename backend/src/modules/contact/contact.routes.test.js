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
}

const sent = [];
injectMock('./contact.service', {
  sendContactMessage: async (payload) => {
    sent.push(payload);
    return { success: true };
  },
});
const contactRoutes = require('./contact.routes');

async function buildApp() {
  const app = Fastify();
  await app.register(require('@fastify/rate-limit'), { max: 300, timeWindow: '1 minute' });
  await app.register(contactRoutes, { prefix: '/api/v1/contact' });
  await app.ready();
  return app;
}

test('POST /messages sends a validated public contact message without authentication', async () => {
  sent.length = 0;
  const app = await buildApp();
  const response = await app.inject({
    method: 'POST',
    url: '/api/v1/contact/messages',
    payload: {
      name: 'Test User',
      email: 'test@example.com',
      phone: '09120000000',
      subject: 'general_question',
      message: 'This is a valid contact message.',
    },
  });

  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.json(), { success: true });
  assert.equal(sent.length, 1);
  assert.equal(sent[0].email, 'test@example.com');
  await app.close();
});

test('POST /messages rejects invalid payloads', async () => {
  sent.length = 0;
  const app = await buildApp();
  const response = await app.inject({
    method: 'POST',
    url: '/api/v1/contact/messages',
    payload: { name: 'A', email: 'invalid', subject: 'unknown', message: 'short' },
  });
  assert.equal(response.statusCode, 400);
  assert.equal(sent.length, 0);
  await app.close();
});
