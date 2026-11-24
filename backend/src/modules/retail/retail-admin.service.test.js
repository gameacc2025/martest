const test = require('node:test');
const assert = require('node:assert/strict');
const service = require('./retail-admin.service');

test('admin retail order filters compose exact status, payment and search predicates', () => {
  assert.deepEqual(service.buildWhere({
    status: 'PAID',
    paymentStatus: 'PAID',
    search: ' TM-2026 ',
  }), {
    status: 'PAID',
    paymentStatus: 'PAID',
    OR: [
      { orderNumber: { contains: 'TM-2026', mode: 'insensitive' } },
      { recipientName: { contains: 'TM-2026', mode: 'insensitive' } },
      { recipientPhone: { contains: 'TM-2026' } },
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
  assert.equal(select.recipientPhone, undefined);
  assert.equal(select.addressLine, undefined);
  assert.equal(select.postalCode, undefined);
  assert.equal(select.buyerUserId, undefined);
});
