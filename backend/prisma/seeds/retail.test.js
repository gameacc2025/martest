const test = require('node:test');
const assert = require('node:assert/strict');

const seedRetail = require('./retail');

function createPrisma({ products = [], existingBalances = new Map() } = {}) {
  const calls = { balanceCreates: [], movementCreates: [], transactions: 0 };
  const tx = {
    inventoryBalance: {
      findUnique: async ({ where }) => existingBalances.get(where.productId) ?? null,
      create: async ({ data }) => {
        calls.balanceCreates.push(data);
        return { id: calls.balanceCreates.length, ...data };
      },
    },
    inventoryMovement: {
      findUnique: async () => null,
      create: async ({ data }) => {
        calls.movementCreates.push(data);
        return { id: calls.movementCreates.length, ...data };
      },
    },
  };
  const prisma = {
    product: { findMany: async () => products },
    accessProfile: { findFirst: async () => ({ userId: 17 }) },
    $transaction: async (callback) => {
      calls.transactions += 1;
      return callback(tx);
    },
  };
  return { prisma, calls };
}

test('retail seed creates deterministic demo-only stock and one immutable receipt', async () => {
  const product = {
    id: 41,
    slug: 'demo-router-alpha',
    sku: 'DEMO-41',
    title: 'Demo router',
    companyId: 9,
  };
  const { prisma, calls } = createPrisma({ products: [product] });

  const result = await seedRetail(prisma);

  assert.equal(result.skipped, false);
  assert.equal(result.productsChecked, 1);
  assert.equal(result.balancesCreated, 1);
  assert.equal(result.balancesSkipped, 0);
  assert.equal(result.movementsCreated, 1);
  assert.equal(result.reservationsCreated, 0);
  assert.equal(calls.balanceCreates.length, 1);
  assert.equal(calls.movementCreates.length, 1);
  assert.equal(calls.balanceCreates[0].productId, product.id);
  assert.ok(calls.balanceCreates[0].onHand >= 40 && calls.balanceCreates[0].onHand <= 200);
  assert.equal(calls.balanceCreates[0].reserved, 0);
  assert.equal(calls.movementCreates[0].quantityDelta, calls.balanceCreates[0].onHand);
  assert.equal(calls.movementCreates[0].movementType, 'RECEIPT');
  assert.equal(calls.movementCreates[0].idempotencyKey, 'demo-retail-initial-receipt-41');
  assert.equal(calls.movementCreates[0].actorUserId, 17);
});

test('retail seed preserves an existing operational balance without creating movements', async () => {
  const product = { id: 42, slug: 'demo-router-existing', sku: 'DEMO-42', title: 'Existing', companyId: 9 };
  const existingBalance = { id: 100, onHand: 73, reserved: 8 };
  const { prisma, calls } = createPrisma({
    products: [product],
    existingBalances: new Map([[product.id, existingBalance]]),
  });

  const result = await seedRetail(prisma);

  assert.equal(result.balancesCreated, 0);
  assert.equal(result.balancesSkipped, 1);
  assert.equal(result.movementsCreated, 0);
  assert.deepEqual(calls.balanceCreates, []);
  assert.deepEqual(calls.movementCreates, []);
});

test('retail seed skips production without querying or mutating demo inventory', async () => {
  const previousNodeEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = 'production';
  try {
    const prisma = {
      product: { findMany: async () => { throw new Error('must not query in production'); } },
    };
    const result = await seedRetail(prisma);
    assert.deepEqual(result, { skipped: true, reason: 'production' });
  } finally {
    if (previousNodeEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = previousNodeEnv;
  }
});

test('retail seed reports no demo products as a safe skip', async () => {
  const { prisma, calls } = createPrisma({ products: [] });
  const result = await seedRetail(prisma);

  assert.deepEqual(result, { skipped: true, reason: 'no_retail_demo_products' });
  assert.equal(calls.transactions, 0);
});
