const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const Module = require('node:module');

let companyOrder = null;
let sellerOrderUpdate = null;
let aggregateUpdate = null;
let shipmentCreate = null;
let auditCalls = [];

const tx = {
  sellerOrder: {
    findFirst: async () => companyOrder,
    update: async ({ where, data }) => {
      sellerOrderUpdate = { where, data };
      companyOrder = { ...companyOrder, ...data };
      return companyOrder;
    },
    findMany: async () => [{ status: companyOrder?.status }],
  },
  retailOrder: {
    update: async ({ where, data }) => { aggregateUpdate = { where, data }; return { id: where.id, ...data }; },
  },
  shipment: {
    create: async ({ data }) => { shipmentCreate = data; return { id: 33 }; },
    update: async () => ({ id: 33 }),
  },
};

function injectMock(relativePath, exportsObj) {
  const resolved = require.resolve(path.join(__dirname, relativePath));
  const original = require.cache[resolved];
  const mockModule = new Module(resolved);
  mockModule.filename = resolved;
  mockModule.loaded = true;
  mockModule.exports = exportsObj;
  require.cache[resolved] = mockModule;
  test.after(() => {
    if (original) require.cache[resolved] = original;
    else delete require.cache[resolved];
  });
}

injectMock('../../config/db', {
  $transaction: async (callback) => callback(tx),
  sellerOrder: {
    findMany: async () => [],
    count: async () => 0,
    findFirst: async ({ where }) => {
      if (where.companyId !== 77) return null;
      return companyOrder;
    },
  },
});
injectMock('../audit/audit.service', {
  recordAuditLogExplicit: async (entry) => { auditCalls.push(entry); },
});
injectMock('../audit/audit.events', {
  AUDIT_ACTIONS: { RETAIL_SELLER_ORDER_STATUS_CHANGED: 'RETAIL_SELLER_ORDER_STATUS_CHANGED' },
});

const service = require('./retail-seller-order.service');

function fixture(status = 'PENDING_ACCEPTANCE') {
  return {
    id: 501,
    orderId: 900,
    companyId: 77,
    status,
    order: { paymentStatus: 'PAID', status: 'PAID', orderNumber: 'TM-ORDER-900' },
    shipments: [],
  };
}

test.beforeEach(() => {
  companyOrder = fixture();
  sellerOrderUpdate = null;
  aggregateUpdate = null;
  shipmentCreate = null;
  auditCalls = [];
});

test('seller order lookup is scoped to companyId and paid parent order', async () => {
  companyOrder = null;
  await assert.rejects(service.getCompanySellerOrder(88, 501), { code: 'SELLER_ORDER_NOT_FOUND' });
});

test('company acceptance advances only its own paid seller order and audits the transition', async () => {
  const result = await service.transitionCompanySellerOrder(77, 42, 501, { action: 'ACCEPT' });

  assert.equal(sellerOrderUpdate.where.id, 501);
  assert.equal(sellerOrderUpdate.data.status, 'ACCEPTED');
  assert.ok(sellerOrderUpdate.data.acceptedAt instanceof Date);
  assert.equal(aggregateUpdate.where.id, 900);
  assert.equal(aggregateUpdate.data.status, 'PROCESSING');
  assert.equal(auditCalls.length, 1);
  assert.equal(auditCalls[0].companyId, 77);
  assert.equal(auditCalls[0].entityId, 501);
  assert.equal(result.status, 'ACCEPTED');
});

test('seller shipment transition requires tracking details and creates a tracking event', async () => {
  companyOrder = fixture('READY_TO_SHIP');
  assert.throws(() => service.normalizeTransition({ action: 'SHIP', carrier: 'Carrier' }), { code: 'SHIPMENT_DETAILS_REQUIRED' });

  const result = await service.transitionCompanySellerOrder(77, 42, 501, {
    action: 'SHIP',
    carrier: 'Carrier X',
    trackingNumber: 'TRACK-501',
    location: 'Tehran',
  });

  assert.equal(sellerOrderUpdate.data.status, 'SHIPPED');
  assert.equal(shipmentCreate.carrier, 'Carrier X');
  assert.equal(shipmentCreate.trackingNumber, 'TRACK-501');
  assert.equal(shipmentCreate.status, 'IN_TRANSIT');
  assert.equal(shipmentCreate.trackingEvents.create.eventCode, 'SHIPPED');
  assert.equal(aggregateUpdate.data.status, 'FULFILLED');
  assert.equal(result.status, 'SHIPPED');
});

test('seller order cannot advance before parent payment is verified', async () => {
  companyOrder.order.paymentStatus = 'PENDING';
  await assert.rejects(
    service.transitionCompanySellerOrder(77, 42, 501, { action: 'ACCEPT' }),
    { code: 'ORDER_NOT_PAID' }
  );
});

test('seller cannot skip explicit fulfillment states', async () => {
  await assert.rejects(
    service.transitionCompanySellerOrder(77, 42, 501, { action: 'SHIP', carrier: 'Carrier X', trackingNumber: 'TRACK-501' }),
    { code: 'INVALID_SELLER_ORDER_TRANSITION' }
  );
});
