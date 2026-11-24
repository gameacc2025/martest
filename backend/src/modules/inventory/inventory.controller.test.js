const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const Module = require('node:module');

function injectMock(relativePath, exportsObj) {
  const resolved = require.resolve(path.join(__dirname, relativePath));
  const original = require.cache[resolved];
  require.cache[resolved] = new Module(resolved);
  require.cache[resolved].exports = exportsObj;
  require.cache[resolved].loaded = true;
  test.after(() => {
    if (original) require.cache[resolved] = original;
    else delete require.cache[resolved];
  });
}

const tx = { marker: 'inventory-transaction' };
let transactionCalls = 0;
let receivedArgs = null;
let ownedProduct = null;
let productScopeQuery = null;
let balanceCalls = 0;
let reservationLookup = null;

const dbMock = {
  $transaction: async (callback) => {
    transactionCalls += 1;
    return callback(tx);
  },
  product: {
    findFirst: async (args) => {
      productScopeQuery = args;
      return ownedProduct;
    },
  },
};
injectMock('../../config/db', dbMock);

injectMock('./inventory.service', {
  INVENTORY_MOVEMENT_TYPES: { RECEIPT: 'RECEIPT' },
  getBalance: async (productId) => { balanceCalls++; return { productId, onHand: 5, reserved: 1 }; },
  getAvailableStock: async (productId) => ({ productId, available: 4 }),
  getMovements: async () => ({ items: [], total: 0 }),
  getActiveReservations: async () => [],
  getReservationByCheckoutKey: async (client, checkoutKey) => {
    reservationLookup = { client, checkoutKey };
    return { id: 1, productId: 77, checkoutKey };
  },
  adjustStock: async (transaction, args) => {
    assert.equal(transaction, tx);
    receivedArgs = args;
    return { balance: { productId: args.productId, onHand: args.quantityDelta, reserved: 0 } };
  },
});

injectMock('../products/product.service', {
  toPositiveInt: (value) => {
    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed <= 0) throw new Error('Invalid positive integer');
    return parsed;
  },
});

const controller = require('./inventory.controller');

test('adjustStock runs the Prisma transaction and forwards the authenticated actor', async () => {
  transactionCalls = 0;
  receivedArgs = null;
  let response;
  const reply = {
    send(value) {
      response = value;
      return value;
    },
    code() {
      return this;
    },
  };

  await controller.adjustStock({
    params: { id: '7' },
    body: {
      quantityDelta: 5,
      movementType: 'RECEIPT',
      referenceType: 'TestReceipt',
      referenceId: 'receipt-7',
      idempotencyKey: 'inventory-controller-test-7',
      reason: 'Controller regression test',
    },
    user: { id: 42 },
  }, reply);

  assert.equal(transactionCalls, 1);
  assert.deepEqual(receivedArgs, {
    productId: 7,
    quantityDelta: 5,
    movementType: 'RECEIPT',
    actorUserId: 42,
    referenceType: 'TestReceipt',
    referenceId: 'receipt-7',
    idempotencyKey: 'inventory-controller-test-7',
    reason: 'Controller regression test',
    metadata: undefined,
  });
  assert.ok(response);
});

test('COMPANY inventory reads are scoped to the authenticated company product set', async () => {
  ownedProduct = null;
  productScopeQuery = null;
  balanceCalls = 0;
  let statusCode = 200;
  let response;
  const reply = {
    send(value) { response = value; return value; },
    code(value) { statusCode = value; return this; },
  };

  await controller.getBalance({ params: { id: '77' }, user: { id: 42, accessType: 'COMPANY', companyId: 12 } }, reply);

  assert.equal(statusCode, 404);
  assert.equal(response.error.code, 'NOT_FOUND');
  assert.deepEqual(productScopeQuery.where, { id: 77, companyId: 12, deletedAt: null });
  assert.equal(balanceCalls, 0);
});

test('COMPANY can read inventory only for its own product', async () => {
  ownedProduct = { id: 77 };
  balanceCalls = 0;
  let response;
  const reply = { send(value) { response = value; return value; }, code() { return this; } };

  await controller.getBalance({ params: { id: '77' }, user: { id: 42, accessType: 'COMPANY', companyId: 12 } }, reply);

  assert.equal(balanceCalls, 1);
  assert.equal(response.data.available, 4);
});

test('reservation lookup receives the Prisma client and applies company ownership checks', async () => {
  ownedProduct = null;
  reservationLookup = null;
  let statusCode = 200;
  let response;
  const reply = {
    send(value) { response = value; return value; },
    code(value) { statusCode = value; return this; },
  };

  await controller.getReservationByCheckoutKey({
    params: { checkoutKey: 'company-reservation-lookup-key' },
    user: { id: 42, accessType: 'COMPANY', companyId: 12 },
  }, reply);

  assert.equal(reservationLookup.client, dbMock);
  assert.equal(reservationLookup.checkoutKey, 'company-reservation-lookup-key');
  assert.equal(statusCode, 404);
  assert.equal(response.error.code, 'NOT_FOUND');
});
