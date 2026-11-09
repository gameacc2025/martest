// =============================================================
// Unit tests — Auth Challenges service
//
// Run with:  node --test
//
// Mocks:
//   - config/db      -> mockPrisma (records calls, returns fixtures)
//   - utils/password -> controllable hashPassword / verifyPassword
// =============================================================

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
  return resolved;
}

// ── Mock Prisma client ───────────────────────────────────────
const calls = {
  challengeCreate: [],
  challengeFindUnique: [],
  challengeFindMany: [],
  challengeUpdate: [],
  challengeUpdateMany: [],
  challengeCount: [],
  userFindUnique: [],
};

let fx;

function resetMocks() {
  Object.keys(calls).forEach((k) => (calls[k] = []));
  fx = {
    user: { id: 1, phone: '09120000000', email: 'test@example.com', status: 'ACTIVE', accessProfile: { isActive: true, type: 'CUSTOMER' } },
    challenge: { id: 10, userId: 1, purpose: 'PASSWORD_RESET', channel: 'SMS', destination: '+989120000000', secretHash: 'hashed:123456', expiresAt: new Date(Date.now() + 15 * 60 * 1000), attemptCount: 0, maxAttempts: 5, consumedAt: null, invalidatedAt: null, createdAt: new Date() },
  };
}
resetMocks();

const mockPrisma = {
  user: {
    findUnique: async (args) => {
      calls.userFindUnique.push(args);
      if (args.where.id !== undefined) return fx.user;
      return null;
    },
  },
  authChallenge: {
    create: async (args) => {
      calls.challengeCreate.push(args);
      return { id: 10, ...args.data };
    },
    findUnique: async (args) => {
      calls.challengeFindUnique.push(args);
      if (args.where.id !== undefined) return fx.challenge;
      return null;
    },
    findMany: async (args) => {
      calls.challengeFindMany.push(args);
      return [fx.challenge];
    },
    update: async (args) => {
      calls.challengeUpdate.push(args);
      return { ...fx.challenge, ...args.data };
    },
    updateMany: async (args) => {
      calls.challengeUpdateMany.push(args);
      return { count: 1 };
    },
    count: async (args) => {
      calls.challengeCount.push(args);
      return 0; // default: no rate limit hits
    },
  },
};

injectMock('../../config/db', mockPrisma);

// ── Mock utils/password ──────────────────────────────────────
let nextVerifyResult = true;
const passwordCalls = { verify: [], hash: [] };
injectMock('../../utils/password', {
  hashPassword: async (plain) => {
    passwordCalls.hash.push(plain);
    return `hashed:${plain}`;
  },
  verifyPassword: async (plain, hash) => {
    passwordCalls.verify.push({ plain, hash });
    return nextVerifyResult;
  },
});

// Now load the real service
const service = require('./authChallenges.service');

function baseResetAll() {
  resetMocks();
  nextVerifyResult = true;
  passwordCalls.verify = [];
  passwordCalls.hash = [];
}

// ── Helpers ──────────────────────────────────────────────────

async function createDefaultUser() {
  return fx.user;
}

// ── requestChallenge ─────────────────────────────────────────

test('requestChallenge: rejects invalid purpose', async () => {
  baseResetAll();
  mockPrisma.authChallenge.count = async () => 0;
  await assert.rejects(
    () => service.requestChallenge({ userId: 1, purpose: 'INVALID', channel: 'SMS', destination: '09120000000' }),
    (err) => err.status === 400 && err.code === 'INVALID_PURPOSE',
  );
});

test('requestChallenge: rejects invalid channel for purpose', async () => {
  baseResetAll();
  mockPrisma.authChallenge.count = async () => 0;
  await assert.rejects(
    () => service.requestChallenge({ userId: 1, purpose: 'PHONE_VERIFICATION', channel: 'EMAIL', destination: 'test@example.com' }),
    (err) => err.status === 400 && err.code === 'INVALID_CHANNEL',
  );
});

test('requestChallenge: rejects non-existent user', async () => {
  baseResetAll();
  mockPrisma.authChallenge.count = async () => 0;
  fx.user = null;
  await assert.rejects(
    () => service.requestChallenge({ userId: 999, purpose: 'PASSWORD_RESET', channel: 'SMS', destination: '09120000000' }),
    (err) => err.status === 404 && err.code === 'NOT_FOUND',
  );
});

test('requestChallenge: rejects inactive user', async () => {
  baseResetAll();
  mockPrisma.authChallenge.count = async () => 0;
  fx.user = { ...fx.user, status: 'REJECTED' };
  await assert.rejects(
    () => service.requestChallenge({ userId: 1, purpose: 'PASSWORD_RESET', channel: 'SMS', destination: '09120000000' }),
    (err) => err.status === 403 && err.code === 'ACCOUNT_DISABLED',
  );
});

test('requestChallenge: rejects deactivated STAFF access profile', async () => {
  baseResetAll();
  mockPrisma.authChallenge.count = async () => 0;
  fx.user = { ...fx.user, accessProfile: { isActive: false, type: 'STAFF' } };
  await assert.rejects(
    () => service.requestChallenge({ userId: 1, purpose: 'PASSWORD_RESET', channel: 'SMS', destination: '09120000000' }),
    (err) => err.status === 403 && err.code === 'ACCESS_DISABLED',
  );
});

test('requestChallenge: rejects mismatched destination (phone)', async () => {
  baseResetAll();
  mockPrisma.authChallenge.count = async () => 0;
  await assert.rejects(
    () => service.requestChallenge({ userId: 1, purpose: 'PASSWORD_RESET', channel: 'SMS', destination: '09130000000' }),
    (err) => err.status === 400 && err.code === 'DESTINATION_MISMATCH',
  );
});

test('requestChallenge: rejects mismatched destination (email)', async () => {
  baseResetAll();
  mockPrisma.authChallenge.count = async () => 0;
  await assert.rejects(
    () => service.requestChallenge({ userId: 1, purpose: 'EMAIL_VERIFICATION', channel: 'EMAIL', destination: 'wrong@example.com' }),
    (err) => err.status === 400 && err.code === 'DESTINATION_MISMATCH',
  );
});

test('requestChallenge: rate limits per user/purpose/channel', async () => {
  baseResetAll();
  // Mock count to return limit reached
  mockPrisma.authChallenge.count = async () => 3; // MAX_REQUESTS_PER_WINDOW
  await assert.rejects(
    () => service.requestChallenge({ userId: 1, purpose: 'PASSWORD_RESET', channel: 'SMS', destination: '09120000000', ipAddress: '1.2.3.4' }),
    (err) => err.status === 429 && err.code === 'RATE_LIMITED',
  );
});

test('requestChallenge: rate limits per destination per hour', async () => {
  baseResetAll();
  // First call (user/purpose/channel) returns 0, second (destination) returns 5
  let callCount = 0;
  mockPrisma.authChallenge.count = async (args) => {
    callCount++;
    if (callCount === 1) return 0; // user limit
    return 5; // destination limit
  };
  await assert.rejects(
    () => service.requestChallenge({ userId: 1, purpose: 'PASSWORD_RESET', channel: 'SMS', destination: '09120000000' }),
    (err) => err.status === 429 && err.code === 'RATE_LIMITED',
  );
});

test('requestChallenge: creates challenge with hashed code', async () => {
  baseResetAll();
  mockPrisma.authChallenge.count = async () => 0;
  const result = await service.requestChallenge({ userId: 1, purpose: 'PASSWORD_RESET', channel: 'SMS', destination: '09120000000' });
  assert.ok(result.challengeId);
  assert.ok(result.expiresIn === 900); // 15 minutes
  assert.ok(result.resendCooldown === 60); // 60 seconds
  assert.equal(calls.challengeCreate.length, 1);
  const createArgs = calls.challengeCreate[0];
  assert.equal(createArgs.data.userId, 1);
  assert.equal(createArgs.data.purpose, 'PASSWORD_RESET');
  assert.equal(createArgs.data.channel, 'SMS');
  assert.equal(createArgs.data.destination, '+989120000000');
  assert.ok(createArgs.data.secretHash.startsWith('hashed:'));
  assert.ok(createArgs.data.expiresAt instanceof Date);
  assert.equal(createArgs.data.maxAttempts, 5);
});

test('requestChallenge: invalidates previous pending challenges', async () => {
  baseResetAll();
  mockPrisma.authChallenge.count = async () => 0;
  await service.requestChallenge({ userId: 1, purpose: 'PASSWORD_RESET', channel: 'SMS', destination: '09120000000' });
  assert.equal(calls.challengeUpdateMany.length, 1);
  const updateArgs = calls.challengeUpdateMany[0];
  assert.deepEqual(updateArgs.where.userId, 1);
  assert.deepEqual(updateArgs.where.purpose, 'PASSWORD_RESET');
  assert.deepEqual(updateArgs.where.channel, 'SMS');
  assert.ok(updateArgs.data.invalidatedAt instanceof Date);
});

test('requestChallenge: normalizes Iranian phone numbers', async () => {
  baseResetAll();
  mockPrisma.authChallenge.count = async () => 0;
  await service.requestChallenge({ userId: 1, purpose: 'PASSWORD_RESET', channel: 'SMS', destination: '09120000000' });
  assert.equal(calls.challengeCreate[0].data.destination, '+989120000000');
});

// ── verifyChallenge ──────────────────────────────────────────

test('verifyChallenge: rejects non-existent challenge', async () => {
  baseResetAll();
  fx.challenge = null;
  await assert.rejects(
    () => service.verifyChallenge({ challengeId: '999', code: '123456' }),
    (err) => err.status === 404 && err.code === 'CHALLENGE_NOT_FOUND',
  );
});

test('verifyChallenge: rejects consumed challenge', async () => {
  baseResetAll();
  fx.challenge = { ...fx.challenge, consumedAt: new Date() };
  await assert.rejects(
    () => service.verifyChallenge({ challengeId: '10', code: '123456' }),
    (err) => err.status === 400 && err.code === 'CHALLENGE_CONSUMED',
  );
});

test('verifyChallenge: rejects invalidated challenge', async () => {
  baseResetAll();
  fx.challenge = { ...fx.challenge, invalidatedAt: new Date() };
  await assert.rejects(
    () => service.verifyChallenge({ challengeId: '10', code: '123456' }),
    (err) => err.status === 400 && err.code === 'CHALLENGE_INVALIDATED',
  );
});

test('verifyChallenge: rejects expired challenge', async () => {
  baseResetAll();
  fx.challenge = { ...fx.challenge, expiresAt: new Date(Date.now() - 1000) };
  await assert.rejects(
    () => service.verifyChallenge({ challengeId: '10', code: '123456' }),
    (err) => err.status === 400 && err.code === 'CHALLENGE_EXPIRED',
  );
});

test('verifyChallenge: rejects after max attempts', async () => {
  baseResetAll();
  fx.challenge = { ...fx.challenge, attemptCount: 5, maxAttempts: 5 };
  await assert.rejects(
    () => service.verifyChallenge({ challengeId: '10', code: '123456' }),
    (err) => err.status === 400 && err.code === 'MAX_ATTEMPTS_EXCEEDED',
  );
  // Should auto-invalidate
  assert.equal(calls.challengeUpdate.length, 1);
  assert.ok(calls.challengeUpdate[0].data.invalidatedAt instanceof Date);
});

test('verifyChallenge: rejects wrong code, increments attempt count', async () => {
  baseResetAll();
  nextVerifyResult = false;
  await assert.rejects(
    () => service.verifyChallenge({ challengeId: '10', code: 'wrong' }),
    (err) => err.status === 400 && err.code === 'INVALID_CODE',
  );
  assert.equal(calls.challengeUpdate.length, 1);
  assert.equal(calls.challengeUpdate[0].data.attemptCount.increment, 1);
});

test('verifyChallenge: succeeds with correct code', async () => {
  baseResetAll();
  nextVerifyResult = true;
  const result = await service.verifyChallenge({ challengeId: '10', code: '123456' });
  assert.equal(result.valid, true);
  assert.equal(result.purpose, 'PASSWORD_RESET');
  assert.equal(result.remainingAttempts, 4); // maxAttempts - attemptCount - 1
  assert.equal(calls.challengeUpdate.length, 1);
  assert.equal(calls.challengeUpdate[0].data.attemptCount.increment, 1);
});

// ── consumeChallenge ─────────────────────────────────────────

test('consumeChallenge: rejects non-existent challenge', async () => {
  baseResetAll();
  fx.challenge = null;
  await assert.rejects(
    () => service.consumeChallenge({ challengeId: '999', code: '123456' }),
    (err) => err.status === 404 && err.code === 'CHALLENGE_NOT_FOUND',
  );
});

test('consumeChallenge: idempotent - returns success if already consumed', async () => {
  baseResetAll();
  fx.challenge = { ...fx.challenge, consumedAt: new Date() };
  const result = await service.consumeChallenge({ challengeId: '10', code: '123456' });
  assert.equal(result.consumed, true);
  assert.equal(result.purpose, 'PASSWORD_RESET');
  assert.equal(result.userId, 1);
});

test('consumeChallenge: rejects invalidated challenge', async () => {
  baseResetAll();
  fx.challenge = { ...fx.challenge, invalidatedAt: new Date() };
  await assert.rejects(
    () => service.consumeChallenge({ challengeId: '10', code: '123456' }),
    (err) => err.status === 400 && err.code === 'CHALLENGE_INVALIDATED',
  );
});

test('consumeChallenge: rejects expired challenge', async () => {
  baseResetAll();
  fx.challenge = { ...fx.challenge, expiresAt: new Date(Date.now() - 1000) };
  await assert.rejects(
    () => service.consumeChallenge({ challengeId: '10', code: '123456' }),
    (err) => err.status === 400 && err.code === 'CHALLENGE_EXPIRED',
  );
});

test('consumeChallenge: rejects after max attempts', async () => {
  baseResetAll();
  fx.challenge = { ...fx.challenge, attemptCount: 5, maxAttempts: 5 };
  await assert.rejects(
    () => service.consumeChallenge({ challengeId: '10', code: '123456' }),
    (err) => err.status === 400 && err.code === 'MAX_ATTEMPTS_EXCEEDED',
  );
});

test('consumeChallenge: rejects wrong code', async () => {
  baseResetAll();
  nextVerifyResult = false;
  await assert.rejects(
    () => service.consumeChallenge({ challengeId: '10', code: 'wrong' }),
    (err) => err.status === 400 && err.code === 'INVALID_CODE',
  );
});

test('consumeChallenge: succeeds and marks consumed', async () => {
  baseResetAll();
  nextVerifyResult = true;
  const result = await service.consumeChallenge({ challengeId: '10', code: '123456' });
  assert.equal(result.consumed, true);
  assert.equal(result.purpose, 'PASSWORD_RESET');
  assert.equal(result.userId, 1);
  // Should update with consumedAt
  const updateCall = calls.challengeUpdate.find(c => c.data.consumedAt !== undefined);
  assert.ok(updateCall, 'consumedAt should be set');
  assert.ok(updateCall.data.consumedAt instanceof Date);
});

// ── listUserChallenges ───────────────────────────────────────

test('listUserChallenges: returns formatted challenges', async () => {
  baseResetAll();
  const challenges = await service.listUserChallenges(1);
  assert.equal(challenges.length, 1);
  const c = challenges[0];
  assert.equal(c.id, 10);
  assert.equal(c.purpose, 'PASSWORD_RESET');
  assert.equal(c.channel, 'SMS');
  assert.ok(c.destinationMasked.includes('XXX'));
  assert.ok(c.expiresAt);
  assert.equal(c.attemptCount, 0);
  assert.equal(c.maxAttempts, 5);
  assert.equal(c.status, 'PENDING');
});

test('listUserChallenges: maps status correctly', async () => {
  baseResetAll();
  fx.challenge = { ...fx.challenge, consumedAt: new Date() };
  let challenges = await service.listUserChallenges(1);
  assert.equal(challenges[0].status, 'CONSUMED');

  fx.challenge = { ...fx.challenge, consumedAt: null, invalidatedAt: new Date() };
  challenges = await service.listUserChallenges(1);
  assert.equal(challenges[0].status, 'INVALIDATED');

  fx.challenge = { ...fx.challenge, invalidatedAt: null, expiresAt: new Date(Date.now() - 1000) };
  challenges = await service.listUserChallenges(1);
  assert.equal(challenges[0].status, 'EXPIRED');
});

// ── Utility functions ────────────────────────────────────────

test('normalizePhone: handles Iranian mobile numbers', () => {
  assert.equal(service.normalizePhone('09120000000'), '+989120000000');
  assert.equal(service.normalizePhone('989120000000'), '+989120000000');
  assert.equal(service.normalizePhone('+989120000000'), '+989120000000');
});

test('normalizeEmail: lowercases and trims', () => {
  assert.equal(service.normalizeEmail('  TEST@EXAMPLE.COM  '), 'test@example.com');
});

test('maskDestination: masks phone', () => {
  assert.equal(service.maskDestination('+989120000000', 'SMS'), '+989 XXX 0000');
});

test('maskDestination: masks email', () => {
  assert.equal(service.maskDestination('test@example.com', 'EMAIL'), 't***t@example.com');
});

test('generateCode: produces 6-digit string', () => {
  const code = service.generateCode();
  assert.match(code, /^\d{6}$/);
});

test('PURPOSE_CHANNEL_MAP: has correct mappings', () => {
  assert.deepEqual(service.PURPOSE_CHANNEL_MAP.PASSWORD_RESET, ['SMS', 'EMAIL']);
  assert.deepEqual(service.PURPOSE_CHANNEL_MAP.PHONE_VERIFICATION, ['SMS']);
  assert.deepEqual(service.PURPOSE_CHANNEL_MAP.EMAIL_VERIFICATION, ['EMAIL']);
  assert.deepEqual(service.PURPOSE_CHANNEL_MAP.LOGIN_MFA, ['SMS', 'EMAIL']);
});