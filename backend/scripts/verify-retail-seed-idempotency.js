const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const seedRetail = require('../prisma/seeds/retail');

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: process.env.DATABASE_URL,
    max: 5,
    connectionTimeoutMillis: 5000,
    idleTimeoutMillis: 30000,
  }),
});

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function main() {
  const products = await prisma.product.findMany({
    where: {
      slug: { startsWith: 'demo-' },
      retailEnabled: true,
      status: 'PUBLISHED',
      visibility: 'PUBLIC',
      deletedAt: null,
      company: { status: 'ACTIVE', deletedAt: null },
    },
    select: { id: true, slug: true },
    orderBy: { id: 'asc' },
  });
  assert(products.length > 0, 'No retail-enabled demo products were created by the demo marketplace seed.');

  const productIds = products.map((product) => product.id);
  const readSnapshot = async () => {
    const [balances, movements] = await Promise.all([
      prisma.inventoryBalance.findMany({
        where: { productId: { in: productIds } },
        select: { productId: true, onHand: true, reserved: true },
        orderBy: { productId: 'asc' },
      }),
      prisma.inventoryMovement.findMany({
        where: { productId: { in: productIds }, referenceType: 'DemoRetailSeed' },
        select: { productId: true, quantityDelta: true, idempotencyKey: true },
        orderBy: { productId: 'asc' },
      }),
    ]);
    return { balances, movements };
  };

  const before = await readSnapshot();
  assert(before.balances.length === products.length,
    `Expected one balance for each demo retail product; got ${before.balances.length}/${products.length}.`);
  assert(before.movements.length === products.length,
    `Expected one immutable initial receipt for each demo retail product; got ${before.movements.length}/${products.length}.`);

  const balanceByProduct = new Map(before.balances.map((balance) => [balance.productId, balance]));
  for (const movement of before.movements) {
    const balance = balanceByProduct.get(movement.productId);
    assert(balance, `Initial movement has no balance for product ${movement.productId}.`);
    assert(balance.reserved === 0, `Demo seed must not fabricate active reservations for product ${movement.productId}.`);
    assert(movement.quantityDelta === balance.onHand,
      `Initial receipt does not reconcile to onHand for product ${movement.productId}.`);
    assert(movement.idempotencyKey === `demo-retail-initial-receipt-${movement.productId}`,
      `Unexpected initial receipt idempotency key for product ${movement.productId}.`);
  }

  const result = await seedRetail(prisma);
  assert(result.skipped === false, 'Retail seed unexpectedly skipped its active demo fixture path.');
  assert(result.balancesCreated === 0 && result.movementsCreated === 0,
    'A repeated retail seed attempted to create new stock or ledger movements.');
  assert(result.balancesSkipped === products.length,
    `Expected the seed to skip all existing balances; skipped ${result.balancesSkipped}/${products.length}.`);

  const after = await readSnapshot();
  assert(JSON.stringify(before) === JSON.stringify(after),
    'A repeated retail seed changed existing stock balances or immutable movement history.');

  console.log(`PASS: ${products.length} demo retail balances and immutable receipt movements remain unchanged on repeated seed execution.`);
}

main()
  .catch((error) => {
    console.error('Retail seed idempotency validation failed:', {
      code: error?.code || null,
      message: error?.message || 'Unknown error',
    });
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
