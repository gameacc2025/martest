const prisma = require('../src/config/db');

const CONSTRAINT_NAME = 'ProductPriceTier_no_overlapping_ranges';

async function main() {
  const template = await prisma.product.findFirst({
    where: { deletedAt: null },
    select: { companyId: true, categoryId: true, subcategoryId: true, createdByUserId: true },
  });
  if (!template) throw new Error('No seeded product is available for the disposable concurrency probe.');

  const suffix = `${process.pid}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const probe = await prisma.product.create({
    data: {
      ...template,
      title: 'Disposable Price Tier Concurrency Probe',
      slug: `price-tier-concurrency-probe-${suffix}`,
      status: 'DRAFT',
      visibility: 'PRIVATE',
    },
    select: { id: true },
  });

  try {
    const outcomes = await Promise.allSettled([
      prisma.productPriceTier.create({
        data: { productId: probe.id, minQuantity: 1, maxQuantity: null, price: 100 },
      }),
      prisma.productPriceTier.create({
        data: { productId: probe.id, minQuantity: 2, maxQuantity: 3, price: 90 },
      }),
    ]);

    const fulfilled = outcomes.filter((item) => item.status === 'fulfilled');
    const rejected = outcomes.filter((item) => item.status === 'rejected');
    if (fulfilled.length !== 1 || rejected.length !== 1) {
      throw new Error(`Expected exactly one concurrent overlapping insert to succeed; got ${fulfilled.length} successes and ${rejected.length} failures.`);
    }

    const conflict = rejected[0].reason;
    const conflictDetails = `${conflict?.meta?.database_error || ''} ${conflict?.message || ''}`;
    if (!['P2004', '23P01'].includes(conflict?.code) || !conflictDetails.includes(CONSTRAINT_NAME)) {
      throw new Error(`Concurrent insert failed for an unexpected reason (code=${conflict?.code || 'unknown'}).`);
    }

    await prisma.productPriceTier.deleteMany({ where: { productId: probe.id } });
    await prisma.productPriceTier.create({
      data: { productId: probe.id, minQuantity: 1, maxQuantity: 2147483647, price: 1 },
    });

    console.log('PASS: PostgreSQL rejected one concurrent overlapping price tier and accepted max Int inclusive upper bound.');
  } finally {
    await prisma.product.delete({ where: { id: probe.id } });
  }
}

main()
  .catch((error) => {
    console.error('Price Tier concurrency validation failed:', {
      code: error?.code || null,
      message: error?.message || 'Unknown error',
      databaseError: error?.meta?.database_error || null,
    });
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
