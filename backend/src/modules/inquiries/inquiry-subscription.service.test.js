const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const Module = require('node:module');

const dbPath = require.resolve('../../config/db', { paths: [__dirname] });
const originalDb = require.cache[dbPath];
const calls = { subscription: [], aggregate: [], create: [] };
let enabled = true;
let subscription = null;
let used = 0;
const mockPrisma = {
  systemSetting: { findUnique: async () => ({ value: enabled ? 'true' : 'false' }) },
  inquirySubscription: { findFirst: async (args) => { calls.subscription.push(args); return subscription; } },
  inquiryUsageEvent: {
    aggregate: async (args) => { calls.aggregate.push(args); return { _sum: { quantity: used } }; },
    create: async (args) => { calls.create.push(args); return args.data; },
  },
};
require.cache[dbPath] = new Module(dbPath);
require.cache[dbPath].exports = mockPrisma;
require.cache[dbPath].loaded = true;
test.after(() => {
  if (originalDb) require.cache[dbPath] = originalDb;
  else delete require.cache[dbPath];
});

const { consumeUsage, getQuotaSummary } = require('./inquiry-subscription.service');

function reset() {
  calls.subscription.length = 0;
  calls.aggregate.length = 0;
  calls.create.length = 0;
  enabled = true;
  used = 0;
  subscription = {
    id: 12, planId: 3, status: 'ACTIVE', startsAt: new Date('2026-10-01T00:00:00Z'),
    endsAt: new Date('2026-11-01T00:00:00Z'),
    plan: { id: 3, name: 'Basic', isActive: true, inquiriesPerPeriod: 5, responsesPerPeriod: 3, internalMessagesPerPeriod: 30, smsPerPeriod: 10 },
  };
}

test('quota enforcement is rollout-gated and does not consume usage while disabled', async () => {
  reset(); enabled = false;
  const result = await consumeUsage({ ownerType: 'company', ownerId: 4, usageType: 'RESPONSE_SUBMIT' });
  assert.equal(result.enforced, false);
  assert.equal(calls.create.length, 0);
  assert.equal(calls.subscription.length, 0);
});

test('enforced quota requires an active subscription', async () => {
  reset(); subscription = null;
  await assert.rejects(() => consumeUsage({ ownerType: 'user', ownerId: 8, usageType: 'INQUIRY_CREATE' }), (error) => {
    assert.equal(error.code, 'INQUIRY_SUBSCRIPTION_REQUIRED');
    assert.equal(error.statusCode, 403);
    return true;
  });
});

test('quota blocks consumption when the configured plan limit has been reached', async () => {
  reset(); used = 3;
  await assert.rejects(() => consumeUsage({ ownerType: 'company', ownerId: 4, usageType: 'RESPONSE_SUBMIT' }), (error) => {
    assert.equal(error.code, 'INQUIRY_QUOTA_EXCEEDED');
    assert.deepEqual(error.details, { usageType: 'RESPONSE_SUBMIT', used: 3, limit: 3, remaining: 0, subscriptionId: 12, endsAt: subscription.endsAt });
    return true;
  });
  assert.equal(calls.create.length, 0);
});

test('successful usage is recorded transactionally and returns remaining quota', async () => {
  reset(); used = 1;
  const result = await consumeUsage({ ownerType: 'company', ownerId: 4, usageType: 'RESPONSE_SUBMIT', referenceType: 'Inquiry', referenceId: 91, idempotencyKey: 'rfq-response:91:4' });
  assert.equal(result.enforced, true);
  assert.equal(result.used, 2);
  assert.equal(result.remaining, 1);
  assert.equal(calls.create[0].data.subscriptionId, 12);
  assert.equal(calls.create[0].data.referenceId, '91');
  assert.equal(calls.create[0].data.idempotencyKey, 'rfq-response:91:4');
});

test('quota summary reports usage, remaining allowance and subscription period', async () => {
  reset(); used = 2;
  const result = await getQuotaSummary('company', 4);
  assert.equal(result.enforced, true);
  assert.equal(result.subscription.planName, 'Basic');
  assert.deepEqual(result.quotas.RESPONSE_SUBMIT, { used: 2, limit: 3, remaining: 1 });
});
