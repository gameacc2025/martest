// Development-only, deterministic retail inventory fixtures for explicitly seeded demo products.
// Never initialize or overwrite operational inventory for real marketplace products.

function deterministicInitialStock(slug) {
  let hash = 2166136261;
  for (const character of String(slug)) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619) >>> 0;
  }
  return 40 + (hash % 161);
}

async function seedRetail(prisma) {
  if (process.env.NODE_ENV === 'production') {
    console.log('[retail-seed] Production detected; demo retail fixtures skipped.');
    return { skipped: true, reason: 'production' };
  }

  // Only products created by the demo marketplace seed may receive synthetic stock.
  // A real seller product is never assigned invented inventory by a generic seed.
  const retailProducts = await prisma.product.findMany({
    where: {
      slug: { startsWith: 'demo-' },
      retailEnabled: true,
      status: 'PUBLISHED',
      visibility: 'PUBLIC',
      deletedAt: null,
      company: { status: 'ACTIVE', deletedAt: null },
    },
    select: { id: true, slug: true, sku: true, title: true, companyId: true },
    orderBy: { id: 'asc' },
  });

  if (retailProducts.length === 0) {
    console.warn('[retail-seed] No retail-enabled demo products found; retail fixtures skipped.');
    return { skipped: true, reason: 'no_retail_demo_products' };
  }

  const staffProfile = await prisma.accessProfile.findFirst({
    where: { type: 'STAFF', isActive: true },
    orderBy: { userId: 'asc' },
    select: { userId: true },
  });
  const actorUserId = staffProfile?.userId ?? null;

  const results = {
    productsChecked: retailProducts.length,
    balancesCreated: 0,
    balancesSkipped: 0,
    movementsCreated: 0,
    reservationsCreated: 0,
  };

  for (const product of retailProducts) {
    await prisma.$transaction(async (tx) => {
      const existingBalance = await tx.inventoryBalance.findUnique({
        where: { productId: product.id },
        select: { id: true, onHand: true, reserved: true },
      });

      // Existing balances may be real operational stock. Never reset or normalize them.
      if (existingBalance) {
        results.balancesSkipped++;
        return;
      }

      const idempotencyKey = `demo-retail-initial-receipt-${product.id}`;
      const existingMovement = await tx.inventoryMovement.findUnique({
        where: { idempotencyKey },
        select: { id: true },
      });
      if (existingMovement) {
        throw new Error(
          `Retail seed found an immutable initial-stock movement without its balance for product ${product.id}; manual reconciliation is required.`
        );
      }

      const initialOnHand = deterministicInitialStock(product.slug);
      await tx.inventoryBalance.create({
        data: {
          productId: product.id,
          onHand: initialOnHand,
          reserved: 0,
        },
      });

      await tx.inventoryMovement.create({
        data: {
          productId: product.id,
          actorUserId,
          movementType: 'RECEIPT',
          quantityDelta: initialOnHand,
          referenceType: 'DemoRetailSeed',
          referenceId: product.slug,
          idempotencyKey,
          reason: `Deterministic demo stock initialization for ${product.sku || product.title}`,
          metadata: {
            seeded: true,
            demoOnly: true,
            productSlug: product.slug,
            productSku: product.sku,
            companyId: product.companyId,
          },
        },
      });

      results.balancesCreated++;
      results.movementsCreated++;
    });
  }

  console.log('[retail-seed] Deterministic demo retail fixtures ready:', results);
  return { skipped: false, ...results };
}

module.exports = seedRetail;
