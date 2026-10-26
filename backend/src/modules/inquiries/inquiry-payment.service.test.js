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
const calls = [];
const mockPrisma = {
  inquiryPlan: { findFirst: async () => plan },
  inquirySubscription: {
    findFirst: async (args) => {
      calls.push(['findFirst', args]);
      if (args.where?.paymentAuthority) return subscription?.paymentAuthority === args.where.paymentAuthority ? subscription : null;
      if (args.where?.status === 'ACTIVE') return null;
      return subscription;
    },
    findUnique: async () => subscription,
    update: async ({ data }) => { subscription = { ...subscription, ...data }; calls.push(['update', data]); return subscription; },
    updateMany: async ({ data, where }) => {
      calls.push(['updateMany', { where, data }]);
      if (!subscription || subscription.status !== where.status) return { count: 0 };
      subscription = { ...subscription, ...data };
      return { count: 1 };
    },
  },
  $queryRawUnsafe: async () => [],
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

const { startSubscriptionPayment, handleSubscriptionPaymentCallback } = require('./inquiry-payment.service');

const envKeys = ['ZARINPAL_MERCHANT_ID', 'ZARINPAL_SANDBOX', 'ZARINPAL_CALLBACK_URL', 'INQUIRY_SUBSCRIPTION_RESULT_URL'];
const oldEnv = Object.fromEntries(envKeys.map(key => [key, process.env[key]]));
const oldFetch = global.fetch;
test.beforeEach(() => {
  calls.length = 0;
  plan = { id: 2, name: 'Basic', durationDays: 30, price: 1000, currency: 'IRR', isActive: true };
  subscription = null;
  requestResponse = { data: { code: 100, authority: 'A-test' }, errors: [] };
  verifyResponse = { data: { code: 100, ref_id: 12345 }, errors: [] };
  process.env.ZARINPAL_MERCHANT_ID = '';
  process.env.ZARINPAL_SANDBOX = 'true';
  process.env.ZARINPAL_CALLBACK_URL = 'http://localhost:3000/api/v1/inquiries/subscription/payment/callback';
  process.env.INQUIRY_SUBSCRIPTION_RESULT_URL = 'http://localhost:3001/inquiry-subscription';
  global.fetch = async (url, options) => {
    const body = JSON.parse(options.body);
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
