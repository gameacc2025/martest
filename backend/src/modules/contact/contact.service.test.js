const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const Module = require('node:module');

const envPath = require.resolve(path.join(__dirname, '../../config/env'));
const originalEnv = require.cache[envPath];
require.cache[envPath] = new Module(envPath);
require.cache[envPath].exports = {
  smtpHost: null,
  smtpPort: 587,
  smtpUser: null,
  smtpPass: null,
  smtpFrom: 'noreply@example.test',
  contactInboxEmail: null,
};
require.cache[envPath].loaded = true;

const service = require('./contact.service');

test.after(() => {
  if (originalEnv) require.cache[envPath] = originalEnv;
  else delete require.cache[envPath];
});

test('contact delivery refuses to claim success when SMTP or recipient is not configured', async () => {
  await assert.rejects(
    service.sendContactMessage({
      name: 'Test User',
      email: 'test@example.com',
      phone: '',
      subject: 'general_question',
      message: 'A sufficiently long test message.',
    }),
    (error) => {
      assert.equal(error.statusCode, 503);
      assert.equal(error.code, 'CONTACT_DELIVERY_NOT_CONFIGURED');
      return true;
    },
  );
});
