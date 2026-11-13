const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const Module = require('node:module');

const serviceDir = __dirname;
function injectMock(relativePath, exportsObj) {
  const resolved = require.resolve(path.join(serviceDir, relativePath));
  const original = require.cache[resolved];
  require.cache[resolved] = new Module(resolved);
  require.cache[resolved].exports = exportsObj;
  require.cache[resolved].loaded = true;
  test.after(() => {
    if (original) require.cache[resolved] = original;
    else delete require.cache[resolved];
  });
}

const calls = { sms: [], challengeCreate: [], challengeUpdateMany: [], userUpdate: [], sessionDelete: [] };
let user;
let challenge;
let providerReady = true;
let passwordValid = true;

function reset() {
  calls.sms = [];
  calls.challengeCreate = [];
  calls.challengeUpdateMany = [];
  calls.userUpdate = [];
  calls.sessionDelete = [];
  user = { id: 7, phone: '09123456789', status: 'ACTIVE', accessProfile: { isActive: true } };
  challenge = {
    id: 31,
    userId: 7,
    purpose: 'PASSWORD_RESET',
    channel: 'SMS',
    destination: '+989123456789',
    secretHash: 'hash:123456',
    expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    attemptCount: 0,
    maxAttempts: 5,
    consumedAt: null,
    invalidatedAt: null,
  };
  providerReady = true;
  passwordValid = true;
}
reset();

const tx = {
  authChallenge: {
    updateMany: async (args) => {
      calls.challengeUpdateMany.push(args);
      return { count: 1 };
    },
  },
  user: {
    update: async (args) => {
      calls.userUpdate.push(args);
      return { id: args.where.id };
    },
  },
  refreshToken: {
    deleteMany: async (args) => {
      calls.sessionDelete.push(args);
      return { count: 2 };
    },
  },
};

const prisma = {
  user: {
    findFirst: async () => user,
  },
  authChallenge: {
    count: async () => 0,
    findFirst: async (args) => args.where.createdAt ? null : challenge,
    create: async (args) => {
      calls.challengeCreate.push(args);
      return { id: 32 };
    },
    updateMany: async (args) => {
      calls.challengeUpdateMany.push(args);
      return { count: 1 };
    },
  },
  $transaction: async (callback) => callback(tx),
};

injectMock('../../config/db', prisma);
injectMock('../../utils/password', {
  hashPassword: async (value) => 'hash:' + value,
  verifyPassword: async (value, hash) => passwordValid && hash === 'hash:' + value,
});
injectMock('../notifications/notification.sms.provider', {
  hasRealProvider: () => providerReady,
  sendSms: async (payload) => { calls.sms.push(payload); return { provider: 'test' }; },
});
injectMock('../auth-challenges/authChallenges.utils', {
  createError: (status, code, message) => Object.assign(new Error(message), { status, code }),
});

const service = require('./password-recovery.service');

test('requestPasswordReset returns the same accepted shape for unknown accounts', async () => {
  reset();
  user = null;
  const result = await service.requestPasswordReset({ phone: '09123456789' });
  assert.deepEqual(result, { accepted: true });
  assert.equal(calls.sms.length, 0);
  assert.equal(calls.challengeCreate.length, 0);
});

test('requestPasswordReset fails closed when SMS is not configured', async () => {
  reset();
  providerReady = false;
  await assert.rejects(
    () => service.requestPasswordReset({ phone: '09123456789' }),
    (error) => error.code === 'PASSWORD_RECOVERY_UNAVAILABLE' && error.status === 503,
  );
});

test('requestPasswordReset creates a hashed, expiring challenge and sends SMS', async () => {
  reset();
  const result = await service.requestPasswordReset({ phone: '+989123456789' });
  assert.deepEqual(result, { accepted: true });
  assert.equal(calls.challengeCreate.length, 1);
  assert.equal(calls.challengeCreate[0].args, undefined);
  assert.equal(calls.challengeCreate[0].data.userId, 7);
  assert.equal(calls.challengeCreate[0].data.purpose, 'PASSWORD_RESET');
  assert.equal(calls.challengeCreate[0].data.channel, 'SMS');
  assert.match(calls.challengeCreate[0].data.secretHash, /^hash:\d{6}$/);
  assert.equal(calls.sms.length, 1);
  assert.match(calls.sms[0].body, /\d{6}/);
});

test('resetPassword consumes the OTP, changes password and revokes all sessions atomically', async () => {
  reset();
  await service.resetPassword({ phone: '09123456789', code: '123456', newPassword: 'NewSecurePass123' });
  assert.equal(calls.challengeUpdateMany.length, 1);
  assert.equal(calls.challengeUpdateMany[0].data.consumedAt instanceof Date, true);
  assert.equal(calls.userUpdate[0].data.passwordHash, 'hash:NewSecurePass123');
  assert.deepEqual(calls.sessionDelete[0].where, { userId: 7 });
});

test('resetPassword rejects an incorrect code and records an attempt', async () => {
  reset();
  passwordValid = false;
  await assert.rejects(
    () => service.resetPassword({ phone: '09123456789', code: '000000', newPassword: 'NewSecurePass123' }),
    (error) => error.code === 'INVALID_RESET_CODE',
  );
  assert.equal(calls.challengeUpdateMany.length, 1);
  assert.equal(calls.challengeUpdateMany[0].data.attemptCount.increment, 1);
  assert.equal(calls.userUpdate.length, 0);
  assert.equal(calls.sessionDelete.length, 0);
});
