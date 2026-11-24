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

injectMock('../../config/db', {
  $transaction: async (callback) => {
    transactionCalls += 1;
    return callback(tx);
  },
});

injectMock('./inventory.service', {
  INVENTORY_MOVEMENT_TYPES: { RECEIPT: 'RECEIPT' },
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
