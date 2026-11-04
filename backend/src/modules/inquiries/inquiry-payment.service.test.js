const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const Module = require('node:module');

const inquiryDir = __dirname;
function injectMock(relativePath, exportsObj) {
  const resolved = require.resolve(path.join(inquiryDir, relativePath));
  const original = require.cache[resolved];
  require.cache[resolved] = new Module(resolved);
  require.cache[resolved].exports = exportsObj;
  require.cache[resolved].loaded = true;
  test.after(() => {
    if (original) require.cache[resolved] = original;
    else delete require.cache[resolved];
  });
}

let subscription;
let plan;
let requestResponse;
let verifyResponse;
let activateOnOwnerLock = false;
const calls = [];
const providerCalls = [];
let providerRequests = 0;
const mockPrisma = {
  inquiryPlan: { findFirst: async () => plan },
  inquirySubscription: {
    findFirst: async (args) => {
      calls.push(['findFirst', args]);
      if (args.where?.paymentAuthority) return subscription?.paymentAuthority === args.where.paymentAuthority ? subscription : null;
      if (args.where?.id && subscription?.id !== args.where.id) return null;
      if (args.where?.companyId != null && subscription?.companyId !== args.where.companyId) return null;
      if (args.where?.userId != null && subscription?.userId !== args.where.userId) return null;
      if (args.where?.status === 'ACTIVE') return null;
      return subscription;
    },
    findUnique: async () => subscription,
    update: async ({ data }) => { subscription = { ...subscription, ...data }; calls.push(['update', data]); return subscription; },
    updateMany: async ({ data, where }) => {
      calls.push(['updateMany', { where, data }]);
      const statusMatches = !where.status
        || (typeof where.status === 'string' ? subscription?.status === where.status : where.status.in?.includes(subscription?.status));
      const verifiedMatches = where.paymentVerifiedAt === undefined
        || (where.paymentVerifiedAt === null ? subscription?.paymentVerifiedAt == null : subscription?.paymentVerifiedAt === where.paymentVerifiedAt);
      if (!subscription || !statusMatches || !verifiedMatches) return { count: 0 };
      subscription = { ...subscription, ...data };
      return { count: 1 };
    },
  },
  $queryRawUnsafe: async () => {
    if (activateOnOwnerLock && subscription) {
      activateOnOwnerLock = false;
      subscription = {
        ...subscription,
        status: 'ACTIVE',
        paymentVerifiedAt: new Date('2026-10-28T04:00:00.000Z'),
        paymentRefId: '12345',
        startsAt: new Date('2026-10-28T04:00:00.000Z'),
        endsAt: new Date('2026-11-27T04:00:00.000Z'),
        notes: 'activated by concurrent callback',
      };
    }
    return [];
  },
  $transaction: async (fn) => fn(mockPrisma),
};
injectMock('../../config/db', mockPrisma);
injectMock('./inquiry-subscription.service', {
  createPendingSubscription: async ({ ownerType, ownerId, planId, paymentReference }) => {
    subscription = {
      id: 7, planId, companyId: ownerType === 'company' ? ownerId : null,
      userId: ownerType === 'user' ? ownerId : null,
      status: 'PENDING_PAYMENT', paymentReference: paymentReference || null,
      paymentProvider: null, paymentAuthority: null, paymentAmount: null,
      startsAt: null, endsAt: null, paymentVerifiedAt: null, paymentRefId: null,
      plan: { ...plan },
    };
    return subscription;
  },
});

const {
  startSubscriptionPayment,
  handleSubscriptionPaymentCallback,
  retryPendingSubscriptionVerification,
} = require('./inquiry-payment.service');

const envKeys = ['ZARINPAL_MERCHANT_ID', 'ZARINPAL_SANDBOX', 'ZARINPAL_CALLBACK_URL', 'INQUIRY_SUBSCRIPTION_RESULT_URL'];
const oldEnv = Object.fromEntries(envKeys.map(key => [key, process.env[key]]));
const oldFetch = global.fetch;
test.beforeEach(() => {
  calls.length = 0;
  providerCalls.length = 0;
  providerRequests = 0;
  activateOnOwnerLock = false;
  plan = { id: 2, name: 'Basic', durationDays: 30, price: 1000, currency: 'IRR', isActive: true };
  subscription = null;
  requestResponse = { data: { code: 100, authority: 'A-test' }, errors: [] };
  verifyResponse = { data: { code: 100, ref_id: 12345 }, errors: [] };
  process.env.ZARINPAL_MERCHANT_ID = '';
  process.env.ZARINPAL_SANDBOX = 'true';
  process.env.ZARINPAL_CALLBACK_URL = 'http://localhost:3000/api/v1/inquiries/subscription/payment/callback';
  process.env.INQUIRY_SUBSCRIPTION_RESULT_URL = 'http://localhost:3001/inquiry-subscription';
  global.fetch = async (url, options) => {
    providerRequests += 1;
    const body = JSON.parse(options.body);
    providerCalls.push({ url: String(url), body });
    if (String(url).includes('/request.json')) return { ok: true, json: async () => requestResponse };
    if (String(url).includes('/verify.json')) return { ok: true, json: async () => verifyResponse };
    throw new Error('Unexpected payment endpoint');
  };
});
test.after(() => {
  for (const key of envKeys) {
    if (oldEnv[key] === undefined) delete process.env[key]; else process.env[key] = oldEnv[key];
  }
  global.fetch = oldFetch;
});

test('startSubscriptionPayment uses manual review when no merchant is configured', async () => {
  const result = await startSubscriptionPayment({ ownerType: 'company', ownerId: 5, planId: 2, paymentReference: 'receipt-1' });
  assert.equal(result.paymentMode, 'MANUAL_REVIEW');
  assert.equal(result.paymentUrl, null);
  assert.equal(result.subscription.paymentReference, 'receipt-1');
});

test('startSubscriptionPayment creates Zarinpal checkout and freezes the payable amount', async () => {
  process.env.ZARINPAL_MERCHANT_ID = 'merchant-test';
  const result = await startSubscriptionPayment({ ownerType: 'company', ownerId: 5, planId: 2 });
  assert.equal(result.paymentMode, 'ONLINE');
  assert.equal(result.paymentUrl, 'https://sandbox.zarinpal.com/pg/StartPay/A-test');
  assert.equal(result.subscription.paymentAuthority, 'A-test');
  assert.equal(subscription.paymentAmount, 1000);
  assert.equal(subscription.paymentProvider, 'ZARINPAL');
  assert.deepEqual(providerCalls[0].body, {
    merchant_id: 'merchant-test',
    amount: 1000,
    callback_url: 'http://localhost:3000/api/v1/inquiries/subscription/payment/callback',
    description: 'اشتراک استعلام: Basic',
  });
});

test('startSubscriptionPayment rejects Toman amounts that overflow the persisted Prisma Int before calling Zarinpal', async () => {
  process.env.ZARINPAL_MERCHANT_ID = 'merchant-test';
  plan = { ...plan, price: 214748365, currency: 'TOMAN' };

  await assert.rejects(
    () => startSubscriptionPayment({ ownerType: 'company', ownerId: 5, planId: 2 }),
    (error) => error.code === 'INVALID_PAYMENT_AMOUNT' && error.statusCode === 400,
  );
  assert.equal(providerRequests, 0);
  assert.equal(calls.some(([name]) => name === 'update'), false);
});

test('callback activates a subscription only after server-side verification succeeds', async () => {
  process.env.ZARINPAL_MERCHANT_ID = 'merchant-test';
  subscription = {
    id: 7, planId: 2, companyId: 5, userId: null, status: 'PENDING_PAYMENT',
    paymentProvider: 'ZARINPAL', paymentAuthority: 'A-test', paymentAmount: 1000,
    paymentVerifiedAt: null, paymentRefId: null, startsAt: null, endsAt: null,
    notes: 'pending', plan: { id: 2, name: 'Basic', durationDays: 30, price: 1000, currency: 'IRR', isActive: true },
  };
  const result = await handleSubscriptionPaymentCallback({ Authority: 'A-test', Status: 'OK' });
  assert.equal(result.payment, 'success');
  assert.equal(result.refId, '12345');
  assert.equal(subscription.status, 'ACTIVE');
  assert.ok(subscription.paymentVerifiedAt instanceof Date);
  assert.equal(subscription.paymentRefId, '12345');
  assert.equal(providerCalls[0].body.amount, 1000);
  assert.equal(providerCalls[0].body.authority, 'A-test');
});

test('callback replay after activation is idempotent and skips provider verification', async () => {
  process.env.ZARINPAL_MERCHANT_ID = 'merchant-test';
  subscription = {
    id: 7, planId: 2, companyId: 5, userId: null, status: 'ACTIVE',
    paymentProvider: 'ZARINPAL', paymentAuthority: 'A-test', paymentAmount: 1000,
    paymentVerifiedAt: new Date('2026-10-27T10:00:00.000Z'), paymentRefId: '12345',
    startsAt: new Date('2026-10-27T10:00:00.000Z'), endsAt: new Date('2026-11-26T10:00:00.000Z'),
    notes: 'verified', plan: { id: 2, name: 'Basic', durationDays: 30, price: 1000, currency: 'IRR', isActive: true },
  };
  global.fetch = async () => { throw new Error('verified callback replay must not call the provider'); };
  const result = await handleSubscriptionPaymentCallback({ Authority: 'A-test', Status: 'OK' });
  assert.equal(result.payment, 'success');
  assert.equal(result.refId, '12345');
  assert.equal(calls.filter(([name]) => name === 'updateMany').length, 0);
});

test('concurrent successful callback returns the already activated subscription after owner lock', async () => {
  process.env.ZARINPAL_MERCHANT_ID = 'merchant-test';
  subscription = {
    id: 7, planId: 2, companyId: 5, userId: null, status: 'PENDING_PAYMENT',
    paymentProvider: 'ZARINPAL', paymentAuthority: 'A-test', paymentAmount: 1000,
    paymentVerifiedAt: null, paymentRefId: null, startsAt: null, endsAt: null,
    notes: 'pending', plan: { id: 2, name: 'Basic', durationDays: 30, price: 1000, currency: 'IRR', isActive: true },
  };
  // Simulate another callback committing activation while this callback waits
  // for the owner-row lock, after its initial read but before the locked re-read.
  activateOnOwnerLock = true;

  const result = await handleSubscriptionPaymentCallback({ Authority: 'A-test', Status: 'OK' });

  assert.equal(result.payment, 'success');
  assert.equal(result.refId, '12345');
  assert.equal(subscription.status, 'ACTIVE');
  assert.equal(subscription.startsAt.toISOString(), '2026-10-28T04:00:00.000Z');
  assert.equal(subscription.endsAt.toISOString(), '2026-11-27T04:00:00.000Z');
  assert.equal(calls.filter(([name]) => name === 'updateMany').length, 0, 'does not try to activate or extend the already active subscription');
});

test('retryPendingSubscriptionVerification cannot inspect another owner subscription', async () => {
  subscription = {
    id: 7, planId: 2, companyId: 99, userId: null, status: 'PENDING_PAYMENT',
    paymentProvider: 'ZARINPAL', paymentAuthority: 'A-test', paymentAmount: 1000,
    paymentVerifiedAt: null, paymentRefId: null,
  };
  await assert.rejects(
    () => retryPendingSubscriptionVerification({ ownerType: 'company', ownerId: 5, subscriptionId: 7 }),
    (error) => error.code === 'SUBSCRIPTION_NOT_FOUND' && error.statusCode === 404,
  );
  assert.equal(providerRequests, 0);
});

test('retrying an already verified subscription returns success without another provider call', async () => {
  subscription = {
    id: 7, planId: 2, companyId: 5, userId: null, status: 'ACTIVE',
    paymentProvider: 'ZARINPAL', paymentAuthority: 'A-test', paymentAmount: 1000,
    paymentVerifiedAt: new Date('2026-10-27T10:00:00.000Z'), paymentRefId: '12345',
    startsAt: new Date('2026-10-27T10:00:00.000Z'), endsAt: new Date('2026-11-26T10:00:00.000Z'),
    notes: 'verified', plan: { id: 2, name: 'Basic', durationDays: 30, price: 1000, currency: 'IRR', isActive: true },
  };
  global.fetch = async () => { throw new Error('verified retry must not call the provider'); };
  const result = await retryPendingSubscriptionVerification({ ownerType: 'company', ownerId: 5, subscriptionId: 7 });
  assert.equal(result.payment, 'success');
  assert.equal(result.refId, '12345');
});

test('a server-verified payment can recover from a concurrent cancellation callback', async () => {
  process.env.ZARINPAL_MERCHANT_ID = 'merchant-test';
  subscription = {
    id: 7, planId: 2, companyId: 5, userId: null, status: 'CANCELLED',
    paymentProvider: 'ZARINPAL', paymentAuthority: 'A-test', paymentAmount: 1000,
    paymentVerifiedAt: null, paymentRefId: null, startsAt: null, endsAt: null,
    notes: 'cancel callback raced with verification', plan: { id: 2, name: 'Basic', durationDays: 30, price: 1000, currency: 'IRR', isActive: true },
  };
  const result = await handleSubscriptionPaymentCallback({ Authority: 'A-test', Status: 'OK' });
  assert.equal(result.payment, 'success');
  assert.equal(subscription.status, 'ACTIVE');
  assert.equal(subscription.paymentRefId, '12345');
});

test('callback never activates a payment that the provider did not verify', async () => {
  process.env.ZARINPAL_MERCHANT_ID = 'merchant-test';
  subscription = {
    id: 7, planId: 2, companyId: 5, userId: null, status: 'PENDING_PAYMENT',
    paymentProvider: 'ZARINPAL', paymentAuthority: 'A-test', paymentAmount: 1000,
    paymentVerifiedAt: null, paymentRefId: null, startsAt: null, endsAt: null,
    notes: 'pending', plan: { id: 2, name: 'Basic', durationDays: 30, price: 1000, currency: 'IRR', isActive: true },
  };
  verifyResponse = { data: { code: 400 }, errors: [{ code: 400 }] };
  const result = await handleSubscriptionPaymentCallback({ Authority: 'A-test', Status: 'OK' });
  assert.equal(result.payment, 'failed');
  assert.equal(subscription.status, 'CANCELLED');
});
