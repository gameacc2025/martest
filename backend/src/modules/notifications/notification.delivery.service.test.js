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

// Mock prisma layer
const fx = {
  deliveries: [],
  updates: [],
  skips: [],
  counts: {},
  groupBys: [],
  findManyArgs: [],
};

function resetMocks() {
  fx.deliveries = [];
  fx.updates = [];
  fx.skips = [];
  fx.counts = {};
  fx.groupBys = [];
  fx.findManyArgs = [];
}

const mockPrisma = {
  notificationPreference: { findMany: async () => [], upsert: async (a) => ({ id: 1, ...a.data }) },
  notificationDelivery: {
    findMany: async (args) => {
      fx.findManyArgs.push(args);
      let results = [...fx.deliveries];
      if (args.where) {
        if (args.where.status) results = results.filter(d => d.status === args.where.status);
        if (args.where.channel) results = results.filter(d => d.channel === args.where.channel);
        if (args.where.eventType) results = results.filter(d => d.eventType === args.where.eventType);
        if (args.where.userId) results = results.filter(d => d.userId === args.where.userId);
        if (args.where.attempts) {
          if (args.where.attempts.lt !== undefined) results = results.filter(d => d.attempts < args.where.attempts.lt);
        }
      }
      const now = new Date();
      results = results.filter(d => !d.nextAttemptAt || d.nextAttemptAt <= now);
      results.sort((a, b) => (a.nextAttemptAt || new Date(0)) - (b.nextAttemptAt || new Date(0)));
      if (args.take) results = results.slice(0, args.take);
      return results;
    },
    count: async (args) => {
      fx.counts.where = args.where;
      let results = [...fx.deliveries];
      if (args.where) {
        if (args.where.status) results = results.filter(d => d.status === args.where.status);
        if (args.where.channel) results = results.filter(d => d.channel === args.where.channel);
        if (args.where.eventType) results = results.filter(d => d.eventType === args.where.eventType);
        if (args.where.userId) results = results.filter(d => d.userId === args.where.userId);
      }
      return results.length;
    },
    groupBy: async (args) => {
      fx.groupBys.push(args);
      const keyName = args.by ? args.by[0] : 'status';
      const results = {};
      fx.deliveries.forEach(d => { const val = d[keyName]; results[val] = (results[val] || 0) + 1; });
      return Object.entries(results).map(([key, _count]) => ({ [keyName]: key, _count }));
    },
    update: async (args) => {
      fx.updates.push(args);
      const id = args.where.id;
      const idx = fx.deliveries.findIndex(d => d.id === id);
      if (idx !== -1) fx.deliveries[idx] = { ...fx.deliveries[idx], ...args.data };
      return fx.deliveries[idx];
    },
  },
};

resetMocks();
injectMock('../../config/db', mockPrisma);
injectMock('../../config/env', {
  notificationMaxAttempts: 3,
  notificationPollIntervalMs: 5000,
  nodeEnv: 'test',
});

// Mock email provider
const emailCalls = [];
let emailShouldFail = false;

const mockEmailProvider = {
  sendEmail: async (opts) => { emailCalls.push(opts); if (emailShouldFail) throw new Error('SMTP connection refused'); return { messageId: 'test-msg-id', provider: 'smtp' }; },
  sendEmailConsole: async (opts) => { emailCalls.push(opts); return { messageId: 'console-msg-id', provider: 'console' }; },
  hasRealProvider: () => false,
};

function resetEmailMocks() { emailCalls.length = 0; emailShouldFail = false; }
function setEmailShouldFail(v) { emailShouldFail = v; }

injectMock('./notification.email.provider', mockEmailProvider);

const { processPendingDeliveries, calculateBackoff, getDeliveryStats, listDeliveries } = require('./notification.delivery.service');

// Tests

test('processPendingDeliveries: no provider configured -> skips all', async () => {
  resetMocks(); resetEmailMocks();
  fx.deliveries = [{ id: 1, status: 'PENDING', channel: 'EMAIL', recipient: 'a@test.com', subject: 'Hi', body: 'Hello', attempts: 0, nextAttemptAt: null, userId: 1, eventType: 'TEST_EVENT' }];
  const result = await processPendingDeliveries({ limit: 100 });
  assert.equal(result.processed, 0);
  assert.equal(result.reason, 'no_provider');
  assert.equal(emailCalls.length, 0);
});

test('processPendingDeliveries: processes PENDING EMAIL deliveries', async () => {
  resetMocks(); resetEmailMocks();
  mockEmailProvider.hasRealProvider = () => true;
  fx.deliveries = [{ id: 1, status: 'PENDING', channel: 'EMAIL', recipient: 'a@test.com', subject: 'Hi', body: 'Hello', attempts: 0, nextAttemptAt: null, userId: 1, eventType: 'TEST_EVENT' }];
  const result = await processPendingDeliveries({ limit: 100 });
  assert.equal(result.processed, 1);
  assert.equal(result.sent, 1);
  assert.equal(emailCalls.length, 1);
  assert.equal(emailCalls[0].to, 'a@test.com');
  const updated = fx.updates.find(u => u.where.id === 1);
  assert.ok(updated);
  assert.equal(updated.data.status, 'SENT');
});

test('processPendingDeliveries: handles provider failure with retry', async () => {
  resetMocks(); resetEmailMocks();
  mockEmailProvider.hasRealProvider = () => true;
  emailShouldFail = true;
  fx.deliveries = [{ id: 1, status: 'PENDING', channel: 'EMAIL', recipient: 'a@test.com', subject: 'Hi', body: 'Hello', attempts: 0, nextAttemptAt: null, userId: 1, eventType: 'TEST_EVENT' }];
  const result = await processPendingDeliveries({ limit: 100 });
  assert.equal(result.processed, 1);
  assert.equal(result.sent, 0);
  assert.equal(result.failed, 1);
  const updated = fx.updates.find(u => u.where.id === 1);
  assert.ok(updated);
  assert.equal(updated.data.status, 'PENDING');
  assert.equal(updated.data.attempts, 1);
});

test('processPendingDeliveries: skips deliveries with no recipient', async () => {
  resetMocks(); resetEmailMocks();
  mockEmailProvider.hasRealProvider = () => true;
  fx.deliveries = [{ id: 1, status: 'PENDING', channel: 'EMAIL', recipient: null, subject: 'Hi', body: 'Hello', attempts: 0, nextAttemptAt: null, userId: 1, eventType: 'TEST_EVENT' }];
  const result = await processPendingDeliveries({ limit: 100 });
  assert.equal(result.processed, 1);
  assert.equal(result.failed, 1);
  assert.equal(emailCalls.length, 0);
});

test('processPendingDeliveries: respects max attempts', async () => {
  resetMocks(); resetEmailMocks();
  mockEmailProvider.hasRealProvider = () => true;
  fx.deliveries = [{ id: 1, status: 'PENDING', channel: 'EMAIL', recipient: 'a@test.com', subject: 'Hi', body: 'Hello', attempts: 3, nextAttemptAt: null, userId: 1, eventType: 'TEST_EVENT' }];
  const result = await processPendingDeliveries({ limit: 100 });
  assert.equal(result.processed, 0);
});

test('processPendingDeliveries: respects nextAttemptAt scheduling', async () => {
  resetMocks(); resetEmailMocks();
  mockEmailProvider.hasRealProvider = () => true;
  const futureDate = new Date(Date.now() + 3600000);
  fx.deliveries = [{ id: 1, status: 'PENDING', channel: 'EMAIL', recipient: 'a@test.com', subject: 'Hi', body: 'Hello', attempts: 0, nextAttemptAt: futureDate, userId: 1, eventType: 'TEST_EVENT' }];
  const result = await processPendingDeliveries({ limit: 100 });
  assert.equal(result.processed, 0);
});

test('calculateBackoff: returns exponential backoff dates', () => {
  const first = calculateBackoff(1);
  const second = calculateBackoff(2);
  const third = calculateBackoff(3);
  assert.ok(first > new Date(0));
  assert.ok(second > first);
  assert.ok(third > second);
});

test('getDeliveryStats: returns counts by status and channel', async () => {
  resetMocks();
  fx.deliveries = [
    { id: 1, status: 'SENT', channel: 'EMAIL', eventType: 'TEST_EVENT', userId: 1 },
    { id: 2, status: 'FAILED', channel: 'EMAIL', eventType: 'TEST_EVENT', userId: 1 },
    { id: 3, status: 'PENDING', channel: 'IN_APP', eventType: 'TEST_EVENT', userId: 2 },
  ];
  const result = await getDeliveryStats({});
  assert.equal(result.total, 3);
  assert.equal(result.byStatus.SENT, 1);
  assert.equal(result.byChannel.EMAIL, 2);
});

test('listDeliveries: returns paginated results', async () => {
  resetMocks();
  fx.deliveries = [
    { id: 1, status: 'SENT', channel: 'EMAIL', createdAt: new Date() },
    { id: 2, status: 'PENDING', channel: 'EMAIL', createdAt: new Date() },
    { id: 3, status: 'FAILED', channel: 'IN_APP', createdAt: new Date() },
  ];
  const result = await listDeliveries({ page: 1, limit: 2 });
  assert.equal(result.data.length, 2);
  assert.equal(result.meta.total, 3);
  assert.equal(result.meta.totalPages, 2);
});

test('listDeliveries: filters by status and channel', async () => {
  resetMocks();
  fx.deliveries = [
    { id: 1, status: 'SENT', channel: 'EMAIL', eventType: 'TEST_EVENT', userId: 1 },
    { id: 2, status: 'FAILED', channel: 'EMAIL', eventType: 'TEST_EVENT', userId: 1 },
    { id: 3, status: 'PENDING', channel: 'IN_APP', eventType: 'OTHER_EVENT', userId: 2 },
  ];
  const result = await listDeliveries({ status: 'FAILED', channel: 'EMAIL' });
  assert.equal(result.data.length, 1);
  assert.equal(result.data[0].id, 2);
});