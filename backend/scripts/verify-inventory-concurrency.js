const Module = require('node:module');
const { randomUUID } = require('node:crypto');
const prisma = require('../src/config/db');

// The probe validates inventory state transitions, not AuditLog persistence.
// Avoid leaving immutable audit probe rows in the disposable runtime database.
const auditPath = require.resolve('../src/modules/audit/audit.service');
const auditModule = new Module(auditPath);
auditModule.filename = auditPath;
auditModule.loaded = true;
auditModule.exports = { recordAuditLogExplicit: async () => ({ id: 'runtime-probe' }) };
require.cache[auditPath] = auditModule;

const inventory = require('../src/modules/inventory/inventory.service');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function main() {
  const template = await prisma.product.findFirst({
    where: { deletedAt: null },
    select: { companyId: true, categoryId: true, subcategoryId: true, createdByUserId: true },
  });
  if (!template) throw new Error('No product template exists for the inventory concurrency probe.');

  const buyer = await prisma.user.findFirst({
    where: { status: 'ACTIVE' },
    select: { id: true },
  });
  if (!buyer) throw new Error('No active user exists for the inventory reservation probe.');

  const suffix = randomUUID().replace(/-/g, '');
  const product = await prisma.product.create({
    data: {
      ...template,
      title: 'Disposable Inventory Concurrency Probe',
      slug: `inventory-concurrency-probe-${suffix}`,
      status: 'DRAFT',
      visibility: 'PRIVATE',
      retailEnabled: true,
    },
    select: { id: true },
  });

  try {
    await prisma.inventoryBalance.create({
      data: { productId: product.id, onHand: 5, reserved: 0 },
    });

    const checkoutKeys = [
      `inventory-probe-a-${suffix}`,
      `inventory-probe-b-${suffix}`,
    ];
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    const attempts = await Promise.allSettled(checkoutKeys.map((checkoutKey) =>
      prisma.$transaction((tx) => inventory.reserveStock(tx, {
        productId: product.id,
        quantity: 4,
        buyerUserId: buyer.id,
        checkoutKey,
        expiresAt,
      }))
    ));

    const winners = attempts.filter((item) => item.status === 'fulfilled');
    const losers = attempts.filter((item) => item.status === 'rejected');
    assert(winners.length === 1 && losers.length === 1,
      `Expected one reservation winner and one loser; got ${winners.length}/${losers.length}.`);
    assert(losers[0].reason?.code === 'INSUFFICIENT_AVAILABLE_STOCK',
      `Expected loser to fail for insufficient stock; got ${losers[0].reason?.code || 'unknown'}.`);

    let balance = await prisma.inventoryBalance.findUnique({ where: { productId: product.id } });
    assert(balance.onHand === 5 && balance.reserved === 4,
      `Concurrent reservation broke inventory invariant: onHand=${balance.onHand}, reserved=${balance.reserved}.`);

    const reservation = await prisma.inventoryReservation.findFirst({
      where: { productId: product.id, status: 'ACTIVE' },
    });
    assert(reservation, 'The winning reservation was not persisted.');

    const replay = await prisma.$transaction((tx) => inventory.reserveStock(tx, {
      productId: product.id,
      quantity: 4,
      buyerUserId: buyer.id,
      checkoutKey: reservation.checkoutKey,
      expiresAt,
    }));
    assert(replay.reservation.id === reservation.id && replay.movement === null,
      'Exact checkout replay was not idempotent.');

    let stockAdjustmentError = null;
    try {
      await prisma.$transaction((tx) => inventory.adjustStock(tx, {
        productId: product.id,
        quantityDelta: -2,
        movementType: inventory.INVENTORY_MOVEMENT_TYPES.ADJUSTMENT_OUT,
        actorUserId: buyer.id,
        reason: 'Runtime reserved-stock invariant probe',
      }));
    } catch (error) {
      stockAdjustmentError = error;
    }
    assert(stockAdjustmentError?.code === 'STOCK_RESERVED',
      `Expected stock adjustment below reserved quantity to fail; got ${stockAdjustmentError?.code || 'no error'}.`);

    const transitions = await Promise.allSettled([
      prisma.$transaction((tx) => inventory.releaseReservation(tx, {
        reservationId: reservation.id,
        actorUserId: buyer.id,
        reason: 'Runtime release/consume race probe',
      })),
      prisma.$transaction((tx) => inventory.consumeReservation(tx, {
        reservationId: reservation.id,
        actorUserId: buyer.id,
        referenceType: 'InventoryProbe',
        referenceId: suffix,
      })),
    ]);
    const transitionWinners = transitions.filter((item) => item.status === 'fulfilled');
    const transitionLosers = transitions.filter((item) => item.status === 'rejected');
    assert(transitionWinners.length === 1 && transitionLosers.length === 1,
      `Expected one release/consume transition winner; got ${transitionWinners.length}/${transitionLosers.length}.`);
    assert(transitionLosers[0].reason?.code === 'RESERVATION_NOT_ACTIVE',
      `Expected losing transition to see terminal reservation; got ${transitionLosers[0].reason?.code || 'unknown'}.`);

    balance = await prisma.inventoryBalance.findUnique({ where: { productId: product.id } });
    const finalReservation = await prisma.inventoryReservation.findUnique({ where: { id: reservation.id } });
    const movementCount = await prisma.inventoryMovement.count({ where: { productId: product.id } });
    assert(balance.reserved === 0 && [1, 5].includes(balance.onHand),
      `Final stock invariant failed: onHand=${balance.onHand}, reserved=${balance.reserved}.`);
    assert(['RELEASED', 'CONSUMED'].includes(finalReservation.status),
      `Reservation ended in unexpected state: ${finalReservation.status}.`);
    assert(movementCount === 2,
      `Expected exactly reservation + terminal movement; found ${movementCount}.`);

    console.log('PASS: PostgreSQL serialized competing reservations and release/consume transitions; stock never fell below reservations and checkout replay was idempotent.');
  } finally {
    // InventoryMovement is intentionally append-only. Keep its probe ledger rows
    // in the disposable CI database; remove mutable state and soft-delete the
    // private draft product. The whole database is destroyed by the workflow.
    await prisma.inventoryReservation.deleteMany({ where: { productId: product.id } });
    await prisma.inventoryBalance.deleteMany({ where: { productId: product.id } });
    await prisma.product.update({
      where: { id: product.id },
      data: { deletedAt: new Date() },
    });
  }
}

main()
  .catch((error) => {
    console.error('Inventory concurrency validation failed:', {
      code: error?.code || null,
      message: error?.message || 'Unknown error',
    });
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
