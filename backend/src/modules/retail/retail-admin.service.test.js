const test = require('node:test');
const assert = require('node:assert/strict');
const Module = require('node:module');

const dbPath = require.resolve('../../config/db');
const originalDb = require.cache[dbPath];
const dbMock = new Module(dbPath);
dbMock.filename = dbPath;
dbMock.loaded = true;
dbMock.exports = {};
require.cache[dbPath] = dbMock;
const service = require('./retail-admin.service');
test.after(() => {
  if (originalDb) require.cache[dbPath] = originalDb;
  else delete require.cache[dbPath];
});

test('admin retail order filters compose exact status, payment and search predicates', () => {
  assert.deepEqual(service.buildWhere({
    status: 'PAID',
    paymentStatus: 'PAID',
    search: ' TM-2026 ',
  }), {
    AND: [
      { status: 'PAID' },
      { paymentStatus: 'PAID' },
      { OR: [
        { orderNumber: { contains: 'TM-2026', mode: 'insensitive' } },
        { recipientName: { contains: 'TM-2026', mode: 'insensitive' } },
        { recipientPhone: { contains: 'TM-2026' } },
      ] },
    ],
  });
});

test('admin exception queue composes payment/order exceptions with other filters', () => {
  assert.deepEqual(service.buildWhere({ exceptionOnly: true }), {
    OR: [
      { status: { in: ['PAYMENT_EXPIRED', 'CANCELLED', 'PARTIALLY_CANCELLED'] } },
      { paymentStatus: { in: ['FAILED', 'PARTIALLY_REFUNDED', 'REFUNDED'] } },
    ],
  });
  assert.deepEqual(service.buildWhere({ exceptionOnly: true, search: 'TM-42' }), {
    AND: [
      { OR: [
        { orderNumber: { contains: 'TM-42', mode: 'insensitive' } },
        { recipientName: { contains: 'TM-42', mode: 'insensitive' } },
        { recipientPhone: { contains: 'TM-42' } },
      ] },
      { OR: [
        { status: { in: ['PAYMENT_EXPIRED', 'CANCELLED', 'PARTIALLY_CANCELLED'] } },
        { paymentStatus: { in: ['FAILED', 'PARTIALLY_REFUNDED', 'REFUNDED'] } },
      ] },
    ],
  });
});

test('admin order list is paginated deterministically and excludes direct buyer contact fields', () => {
  const select = service.ADMIN_RETAIL_ORDER_LIST_SELECT;
  assert.equal(select.recipientName, true);
  assert.equal(select.recipientPhone, undefined);
  assert.deepEqual(select.sellerOrders.orderBy, { id: 'asc' });
  assert.deepEqual(select.paymentAttempts.orderBy, { createdAt: 'desc' });
});

test('admin order detail exposes seller fulfillment and payment reconciliation without full address or buyer identifiers', () => {
  const select = service.ADMIN_RETAIL_ORDER_DETAIL_SELECT;
  assert.ok(select.sellerOrders.select.items);
  assert.ok(select.sellerOrders.select.shipments);
  assert.ok(select.paymentTransactions);
  assert.ok(select.inventoryReservations);
  assert.equal(select.inventoryReservations.select.buyerUserId, undefined);
  assert.equal(select.recipientPhone, undefined);
  assert.equal(select.addressLine, undefined);
  assert.equal(select.postalCode, undefined);
  assert.equal(select.buyerUserId, undefined);
});
