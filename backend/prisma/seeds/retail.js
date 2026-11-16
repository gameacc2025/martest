// Development-only, repeatable retail inventory fixtures.
// Creates InventoryBalance, InventoryMovement, and InventoryReservation records for demo products.
// Run with: node prisma/seed.js (invoked by the global seed orchestrator)

async function seedRetail(prisma) {
  if (process.env.NODE_ENV === 'production') {
    console.log('[retail-seed] Production detected; demo retail fixtures skipped.');
    return { skipped: true };
  }

  // Get all products that are retail-enabled
  const retailProducts = await prisma.product.findMany({
    where: {
      retailEnabled: true,
      status: 'PUBLISHED',
      visibility: 'PUBLIC',
      deletedAt: null,
      company: { status: 'ACTIVE', deletedAt: null },
    },
    include: {
      company: { select: { id: true, name: true } },
      prices: {
        where: { minQuantity: { lte: 1 }, validTo: { gte: new Date() }, validFrom: { lte: new Date() } },
        orderBy: { validFrom: 'desc' },
        take: 1,
      },
    },
  });

  if (retailProducts.length === 0) {
    console.warn('[retail-seed] No retail-enabled published products found; retail fixtures skipped.');
    return { skipped: true, reason: 'no_retail_products' };
  }

  // Get a STAFF user for audit/actor fields
  const staffProfile = await prisma.accessProfile.findFirst({
    where: { type: 'STAFF', isActive: true },
    orderBy: { userId: 'asc' },
    select: { userId: true },
  });
  const actorUserId = staffProfile?.userId ?? null;

  const results = {
    balancesCreated: 0,
    balancesUpdated: 0,
    movementsCreated: 0,
    reservationsCreated: 0,
  };

  // Inventory movement types and reservation statuses
  const MOVEMENT_TYPES = {
    RECEIPT: 'RECEIPT',
    ADJUSTMENT_IN: 'ADJUSTMENT_IN',
    ADJUSTMENT_OUT: 'ADJUSTMENT_OUT',
    RESERVATION: 'RESERVATION',
    RELEASE: 'RELEASE',
    SALE: 'SALE',
    RETURN: 'RETURN',
    DAMAGE: 'DAMAGE',
  };

  // Seed inventory for each retail product
  for (const product of retailProducts) {
    // Upsert inventory balance with realistic stock levels
    const initialOnHand = Math.floor(Math.random() * 200) + 50; // 50-250 units
    const initialReserved = Math.floor(Math.random() * 20); // 0-20 reserved

    const balance = await prisma.inventoryBalance.upsert({
      where: { productId: product.id },
      update: {
        onHand: initialOnHand,
        reserved: initialReserved,
      },
      create: {
        productId: product.id,
        onHand: initialOnHand,
        reserved: initialReserved,
      },
    });

    if (balance.id) {
      results.balancesCreated++;
    } else {
      results.balancesUpdated++;
    }

    // Create initial RECEIPT movement for the stock
    await prisma.inventoryMovement.create({
      data: {
        productId: product.id,
        actorUserId,
        movementType: MOVEMENT_TYPES.RECEIPT,
        quantityDelta: initialOnHand,
        referenceType: 'InitialStockSeed',
        referenceId: `seed-${product.id}`,
        idempotencyKey: `initial-receipt-${product.id}`,
        reason: `Initial stock seeding for retail product ${product.sku ?? product.title}`,
        metadata: { seeded: true, productSku: product.sku, companyId: product.companyId },
      },
    });
    results.movementsCreated++;

    // If there's reserved stock, create RESERVATION movements
    if (initialReserved > 0) {
      await prisma.inventoryMovement.create({
        data: {
          productId: product.id,
          actorUserId,
          movementType: MOVEMENT_TYPES.RESERVATION,
          quantityDelta: -initialReserved,
          referenceType: 'SeedReservation',
          referenceId: `seed-res-${product.id}`,
          idempotencyKey: `seed-reservation-${product.id}`,
          reason: `Initial reservation seeding for retail product ${product.sku ?? product.title}`,
          metadata: { seeded: true, productSku: product.sku, companyId: product.companyId },
        },
      });
      results.movementsCreated++;

      // Create corresponding active reservation records (simulating pending orders)
      const buyerUsers = await prisma.user.findMany({
        where: { status: 'ACTIVE' },
        take: 3,
        select: { id: true },
      });

      for (let i = 0; i < Math.min(initialReserved, buyerUsers.length); i++) {
        const qty = Math.min(5, initialReserved - (i * 5)); // Split reserved qty
        if (qty <= 0) break;

        await prisma.inventoryReservation.create({
          data: {
            productId: product.id,
            buyerUserId: buyerUsers[i].id,
            quantity: qty,
            checkoutKey: `seed-checkout-${product.id}-${i}`,
            expiresAt: new Date(Date.now() + 86400000 * 7), // 7 days
            status: 'ACTIVE',
          },
        });
        results.reservationsCreated++;
      }
    }

    // Add some additional movement history (simulated stock adjustments)
    const movementHistory = [
      { type: MOVEMENT_TYPES.ADJUSTMENT_IN, delta: Math.floor(Math.random() * 20) + 5, reason: 'Stock reconciliation adjustment' },
      { type: MOVEMENT_TYPES.RETURN, delta: Math.floor(Math.random() * 10) + 2, reason: 'Customer return received' },
    ];

    for (const mv of movementHistory) {
      if (mv.delta > 0) {
        await prisma.inventoryMovement.create({
          data: {
            productId: product.id,
            actorUserId,
            movementType: mv.type,
            quantityDelta: mv.delta,
            referenceType: 'SeedAdjustment',
            referenceId: `seed-adj-${product.id}-${mv.type.toLowerCase()}`,
            idempotencyKey: `seed-${mv.type.toLowerCase()}-${product.id}-${Date.now()}`,
            reason: mv.reason,
            metadata: { seeded: true, productSku: product.sku },
          },
        });
        results.movementsCreated++;
      }
    }
  }

  // Create a few expired reservations to test expiration logic
  const expiredProducts = retailProducts.slice(0, Math.min(2, retailProducts.length));
  const buyerUsers = await prisma.user.findMany({
    where: { status: 'ACTIVE' },
    take: 2,
    select: { id: true },
  });

  if (buyerUsers.length > 0) {
    for (let i = 0; i < expiredProducts.length; i++) {
      const product = expiredProducts[i];
      await prisma.inventoryReservation.create({
        data: {
          productId: product.id,
          buyerUserId: buyerUsers[i % buyerUsers.length].id,
          quantity: 10,
          checkoutKey: `seed-expired-${product.id}`,
          expiresAt: new Date(Date.now() - 86400000), // 1 day ago
          status: 'ACTIVE', // Will be expired by the expireReservations job
        },
      });
      results.reservationsCreated++;
    }
  }

  console.log('[retail-seed] Retail demo fixtures ready:', results);
  return { skipped: false, ...results };
}

module.exports = seedRetail;