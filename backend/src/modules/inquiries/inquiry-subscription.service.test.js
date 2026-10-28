const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const Module = require('node:module');

const dbPath = require.resolve(path.join(__dirname, '../../config/db'));
const originalDb = require.cache[dbPath];
const calls = { subscription: [], aggregate: [], create: [] };
let enforcement = true;
let activeSubscription;
let pendingSubscription;
let activePlan;
let used = 0;

const mockPrisma = {
  systemSetting: {
    findUnique: async () => ({ value: enforcement ? 'true' : 'false' }),
  },
  inquiryPlan: {
    findFirst: async (args) => { calls.plan = args; return activePlan; },
  },
  inquirySubscription: {
    findFirst: async (args) => {
      calls.subscription.push(args);
      if (args.where?.status === 'PENDING_PAYMENT') return pendingSubscription;
      return activeSubscription;
    },
    create: async (args) => {
      calls.createdSubscription = args;
      return { id: 44, ...args.data, plan: activePlan };
    },
  },
  inquiryUsageEvent: {
    aggregate: async (args) => { calls.aggregate.push(args); return { _sum: { quantity: used } }; },
    create: async (args) => { calls.create.push(args); return { id: calls.create.length, ...args.data }; },
  },
};
require.cache[dbPath] = new Module(dbPath);
require.cache[dbPath].exports = mockPrisma;
require.cache[dbPath].loaded = true;

test.after(() => {
  if (originalDb) require.cache[dbPath] = originalDb;
  else delete require.cache[dbPath];
});

const { consumeUsage, getQuotaSummary, createPendingSubscription } = require('./inquiry-subscription.service');

function reset() {
  calls.subscription.length = 0;
  calls.aggregate.length = 0;
  calls.create.length = 0;
  calls.subscription.length = 0;
  calls.plan = null;
  calls.createdSubscription = null;
  enforcement = true;
  used = 0;
  pendingSubscription = null;
  activePlan = { id: 3, code: 'basic', name: 'Basic', durationDays: 30, price: 100, currency: 'IRR', isActive: true };
  activeSubscription = {
    id: 12,
    planId: 3,
    status: 'ACTIVE',
    startsAt: new Date('2026-10-01T00:00:00.000Z'),
    endsAt: new Date('2026-11-01T00:00:00.000Z'),
    plan: {
      id: 3,
      name: 'Basic',
      isActive: true,
      inquiriesPerPeriod: 5,
      responsesPerPeriod: 3,
      internalMessagesPerPeriod: 30,
      smsPerPeriod: 10,
    },
  };
}

test('disabled enforcement does not require a subscription or record usage', async () => {
  reset();
  enforcement = false;
  const result = await consumeUsage({ ownerType: 'company', ownerId: 4, usageType: 'RESPONSE_SUBMIT' });
  assert.equal(result.enforced, false);
  assert.equal(calls.subscription.length, 0);
  assert.equal(calls.create.length, 0);
});

test('enforced quota rejects an owner without an active subscription', async () => {
  reset();
  activeSubscription = null;
  await assert.rejects(
    () => consumeUsage({ ownerType: 'user', ownerId: 8, usageType: 'INQUIRY_CREATE' }),
    (error) => error.code === 'INQUIRY_SUBSCRIPTION_REQUIRED' && error.statusCode === 403,
  );
  assert.equal(calls.create.length, 0);
});

test('quota is blocked at the configured limit', async () => {
  reset();
  used = 3;
  await assert.rejects(
    () => consumeUsage({ ownerType: 'company', ownerId: 4, usageType: 'RESPONSE_SUBMIT' }),
    (error) => error.code === 'INQUIRY_QUOTA_EXCEEDED'
      && error.details.used === 3
      && error.details.limit === 3
      && error.details.remaining === 0,
  );
  assert.equal(calls.create.length, 0);
});

test('successful consumption records one auditable usage event and remaining allowance', async () => {
  reset();
  used = 1;
  const result = await consumeUsage({
    ownerType: 'company',
    ownerId: 4,
    usageType: 'RESPONSE_SUBMIT',
    referenceType: 'Inquiry',
    referenceId: 91,
    tx: mockPrisma,
  });
  assert.equal(result.enforced, true);
  assert.equal(result.used, 2);
  assert.equal(result.limit, 3);
  assert.equal(result.remaining, 1);
  assert.equal(calls.create[0].data.subscriptionId, 12);
  assert.equal(calls.create[0].data.referenceId, '91');
});

test('quota summary reports usage and remaining quota for each usage type', async () => {
  reset();
  used = 2;
  const result = await getQuotaSummary('company', 4);
  assert.equal(result.enforced, true);
  assert.equal(result.subscription.planName, 'Basic');
  assert.deepEqual(result.quotas.RESPONSE_SUBMIT, { used: 2, limit: 3, remaining: 1 });
  assert.deepEqual(result.quotas.INTERNAL_MESSAGE, { used: 2, limit: 30, remaining: 28 });
});

test('SMS quota remains enforced when general inquiry quota rollout is disabled', async () => {
  reset();
  enforcement = false;
  const result = await consumeUsage({
    ownerType: 'company',
    ownerId: 4,
    usageType: 'SMS',
    referenceType: 'InquiryMessage',
    referenceId: 92,
    forceEnforcement: true,
    tx: mockPrisma,
  });
  assert.equal(result.enforced, true);
  assert.equal(result.limit, 10);
  assert.equal(result.remaining, 9);
  assert.equal(calls.create[0].data.usageType, 'SMS');
});

test('paid SMS requires an active subscription even while inquiry enforcement is disabled', async () => {
  reset();
  enforcement = false;
  activeSubscription = null;
  await assert.rejects(
    () => consumeUsage({ ownerType: 'user', ownerId: 8, usageType: 'SMS', forceEnforcement: true }),
    (error) => error.code === 'INQUIRY_SUBSCRIPTION_REQUIRED' && error.statusCode === 403,
  );
  assert.equal(calls.create.length, 0);
});


test('createPendingSubscription blocks another pending request even when it targets a different plan', async () => {
  reset();
  activeSubscription = null;
  pendingSubscription = { id: 99, planId: 1, status: 'PENDING_PAYMENT' };

  await assert.rejects(
    () => createPendingSubscription({ ownerType: 'company', ownerId: 4, planId: 3 }),
    (error) => error.code === 'PENDING_SUBSCRIPTION_EXISTS' && error.details.subscriptionId === 99,
  );

  assert.deepEqual(calls.subscription[1].where, { companyId: 4, status: 'PENDING_PAYMENT' });
  assert.equal(calls.createdSubscription, null);
});

test('createPendingSubscription allows one pending request when the owner has none', async () => {
  reset();
  activeSubscription = null;

  const result = await createPendingSubscription({
    ownerType: 'company',
    ownerId: 4,
    planId: 3,
    paymentReference: 'receipt-123',
  });

  assert.equal(result.status, 'PENDING_PAYMENT');
  assert.equal(result.planId, 3);
  assert.equal(result.companyId, 4);
  assert.equal(result.paymentReference, 'receipt-123');
  assert.deepEqual(calls.subscription[1].where, { companyId: 4, status: 'PENDING_PAYMENT' });
  assert.equal(calls.createdSubscription.data.status, 'PENDING_PAYMENT');
});
