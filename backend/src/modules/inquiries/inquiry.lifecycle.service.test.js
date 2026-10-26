const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const Module = require('node:module');

const serviceDir = __dirname;
const dbPath = require.resolve(path.join(serviceDir, '../../config/db'));
const dispatchPath = require.resolve(path.join(serviceDir, '../notifications/notification.dispatch.service'));
let publishCandidates = [{ id: 1 }];
let expiryCandidates = [{ id: 2 }];
const updateCalls = [];
const dispatchCalls = [];

const mockPrisma = {
  inquiry: {
    findMany: async (args) => args.where.status === 'SUBMITTED' ? publishCandidates : expiryCandidates,
    updateMany: async (args) => {
      updateCalls.push(args);
      return { count: 1 };
    },
    findUnique: async ({ where }) => where.id === 1
      ? { id: 1, title: 'Scheduled', companyId: 10, buyerUserId: null, items: [{ product: { companyId: 20 } }] }
      : { id: 2, title: 'Expired', companyId: null, buyerUserId: 77, responses: [{ companyId: 20, status: 'PENDING' }] },
  },
  inquiryItem: {
    findMany: async () => [{ product: { companyId: 20 } }],
  },
  inquiryStatusHistory: {
    create: async ({ data }) => ({ ...data }),
  },
  $transaction: async (callback) => callback(mockPrisma),
};

const originalDb = require.cache[dbPath];
require.cache[dbPath] = new Module(dbPath);
require.cache[dbPath].exports = mockPrisma;
require.cache[dbPath].loaded = true;

const originalDispatch = require.cache[dispatchPath];
require.cache[dispatchPath] = new Module(dispatchPath);
require.cache[dispatchPath].exports = {
  dispatchNotification: async (...args) => {
    dispatchCalls.push(args);
    return {};
  },
};
require.cache[dispatchPath].loaded = true;

const { processInquiryLifecycle } = require('./inquiry.lifecycle.service');

test.after(() => {
  if (originalDb) require.cache[dbPath] = originalDb;
  else delete require.cache[dbPath];
  if (originalDispatch) require.cache[dispatchPath] = originalDispatch;
  else delete require.cache[dispatchPath];
});

test('processInquiryLifecycle publishes due inquiries and expires auto-close inquiries once', async () => {
  updateCalls.length = 0;
  dispatchCalls.length = 0;
  const result = await processInquiryLifecycle({ now: new Date('2026-10-26T15:00:00.000Z') });
  assert.deepEqual(result, { published: 1, expired: 1 });
  assert.equal(updateCalls.length, 2);
  assert.equal(updateCalls[0].where.status, 'SUBMITTED');
  assert.equal(updateCalls[1].where.status, 'OPEN');
  assert.ok(dispatchCalls.some(([event]) => event === 'INQUIRY_PUBLISHED'));
  assert.ok(dispatchCalls.some(([event]) => event === 'INQUIRY_STATUS_CHANGED'));
});
