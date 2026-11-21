const prisma = require('../../config/db');
const { recordAuditLogExplicit } = require('../audit/audit.service');
const { AUDIT_ACTIONS } = require('../audit/audit.events');

/**
 * Inventory Service
 *
 * Provides atomic stock operations for retail products.
 * All balance/movement/reservation operations use database transactions
 * with row-level locking to ensure consistency under concurrent access.
 *
 * Key invariants:
 * - onHand >= 0 (no negative physical stock)
 * - reserved >= 0 (no negative reserved quantity)
 * - available = onHand - reserved >= 0 (no over-allocation)
 * - Every stock change creates an InventoryMovement audit record
 * - Reservations expire automatically and release stock
 */

const INVENTORY_MOVEMENT_TYPES = {
  RECEIPT: 'RECEIPT',
  ADJUSTMENT_IN: 'ADJUSTMENT_IN',
  ADJUSTMENT_OUT: 'ADJUSTMENT_OUT',
  RESERVATION: 'RESERVATION',
  RELEASE: 'RELEASE',
  SALE: 'SALE',
  RETURN: 'RETURN',
  DAMAGE: 'DAMAGE',
};

const RESERVATION_STATUSES = {
  ACTIVE: 'ACTIVE',
  CONSUMED: 'CONSUMED',
  RELEASED: 'RELEASED',
  EXPIRED: 'EXPIRED',
};

/**
 * Get or create inventory balance for a product.
 * Uses row-level lock to prevent race conditions.
 * @param {Prisma.TransactionClient} tx - Prisma transaction client
 * @param {number} productId - Product ID
 * @returns {Promise<{id: number, productId: number, onHand: number, reserved: number}>}
 */
async function getOrCreateBalance(tx, productId) {
  // Try to find existing balance with lock
  let balance = await tx.inventoryBalance.findUnique({
    where: { productId },
    select: { id: true, productId: true, onHand: true, reserved: true },
  });

  if (!balance) {
    // Create new balance with zero stock
    balance = await tx.inventoryBalance.create({
      data: {
        productId,
        onHand: 0,
        reserved: 0,
      },
      select: { id: true, productId: true, onHand: true, reserved: true },
    });
  }

  return balance;
}

/**
 * Atomically adjust physical stock (onHand) with validation.
 * Creates an InventoryMovement record for audit trail.
 *
 * @param {Prisma.TransactionClient} tx - Prisma transaction client
 * @param {Object} params
 * @param {number} params.productId - Product ID
 * @param {number} params.quantityDelta - Change in onHand (positive = increase, negative = decrease)
 * @param {string} params.movementType - InventoryMovementType enum value
 * @param {number} [params.actorUserId] - User performing the action
 * @param {string} [params.referenceType] - Reference entity type (e.g., 'RetailOrder')
 * @param {string} [params.referenceId] - Reference entity ID
 * @param {string} [params.idempotencyKey] - Idempotency key for duplicate prevention
 * @param {string} [params.reason] - Human-readable reason
 * @param {Object} [params.metadata] - Additional structured metadata
 * @returns {Promise<{balance: Object, movement: Object}>}
 */
async function adjustStock(tx, {
  productId,
  quantityDelta,
  movementType,
  actorUserId,
  referenceType,
  referenceId,
  idempotencyKey,
  reason,
  metadata,
}) {
  // Validate movement type
  if (!Object.values(INVENTORY_MOVEMENT_TYPES).includes(movementType)) {
    throw { statusCode: 400, code: 'INVALID_MOVEMENT_TYPE', message: `Invalid movement type: ${movementType}` };
  }

  // Idempotency check
  if (idempotencyKey) {
    const existing = await tx.inventoryMovement.findUnique({
      where: { idempotencyKey },
      select: { id: true },
    });
    if (existing) {
      throw { statusCode: 409, code: 'IDEMPOTENCY_CONFLICT', message: 'Operation already processed' };
    }
  }

  // Lock the balance row and get current state
  const balance = await getOrCreateBalance(tx, productId);
  const newOnHand = balance.onHand + quantityDelta;

  if (newOnHand < 0) {
    throw {
      statusCode: 400,
      code: 'INSUFFICIENT_STOCK',
      message: `Insufficient stock: requested ${Math.abs(quantityDelta)}, available ${balance.onHand}`,
      available: balance.onHand,
    };
  }

  // Update balance
  const updatedBalance = await tx.inventoryBalance.update({
    where: { productId },
    data: { onHand: newOnHand },
    select: { id: true, productId: true, onHand: true, reserved: true, updatedAt: true },
  });

  // Create movement record
  const movement = await tx.inventoryMovement.create({
    data: {
      productId,
      actorUserId: actorUserId ?? null,
      movementType,
      quantityDelta,
      referenceType: referenceType ?? null,
      referenceId: referenceId ?? null,
      idempotencyKey: idempotencyKey ?? null,
      reason: reason ?? null,
      metadata: metadata ?? null,
    },
    select: {
      id: true,
      productId: true,
      actorUserId: true,
      movementType: true,
      quantityDelta: true,
      referenceType: true,
      referenceId: true,
      idempotencyKey: true,
      reason: true,
      metadata: true,
      createdAt: true,
    },
  });

  await recordAuditLogExplicit({
    tx,
    actorUserId: actorUserId ?? null,
    actorAccessType: 'STAFF',
    companyId: null,
    action: AUDIT_ACTIONS.INVENTORY_ITEM_CREATED,
    entityType: 'InventoryMovement',
    entityId: movement.id,
    after: movement,
    metadata: { movementType, quantityDelta, reason },
  });

  return { balance: updatedBalance, movement };
}

/**
 * Atomically reserve stock for an order/checkout.
 * Decreases available stock by increasing reserved quantity.
 *
 * @param {Prisma.TransactionClient} tx - Prisma transaction client
 * @param {Object} params
 * @param {number} params.productId - Product ID
 * @param {number} params.quantity - Quantity to reserve
 * @param {number} params.buyerUserId - Buyer user ID
 * @param {number} [params.orderId] - RetailOrder ID (optional, for linking)
 * @param {string} params.checkoutKey - Unique checkout identifier for idempotency
 * @param {Date} params.expiresAt - Reservation expiry timestamp
 * @param {string} [params.reason] - Reason for reservation
 * @returns {Promise<{reservation: Object, balance: Object, movement: Object}>}
 */
async function reserveStock(tx, {
  productId,
  quantity,
  buyerUserId,
  orderId,
  checkoutKey,
  expiresAt,
  reason,
}) {
  if (quantity <= 0) {
    throw { statusCode: 400, code: 'INVALID_QUANTITY', message: 'Reservation quantity must be positive' };
  }

  // Check for existing reservation with same checkout key (idempotency)
  const existingReservation = await tx.inventoryReservation.findUnique({
    where: { checkoutKey },
    select: { id: true, status: true, quantity: true, productId: true },
  });
  if (existingReservation) {
    if (existingReservation.productId !== productId) {
      throw { statusCode: 409, code: 'CHECKOUT_KEY_CONFLICT', message: 'Checkout key already used for different product' };
    }
    if (existingReservation.status === RESERVATION_STATUSES.ACTIVE) {
      // Return existing active reservation (idempotent)
      const balance = await tx.inventoryBalance.findUnique({
        where: { productId },
        select: { id: true, productId: true, onHand: true, reserved: true },
      });
      return { reservation: existingReservation, balance, movement: null };
    }
    // If previous reservation was consumed/released/expired, we fall through to create new
  }

  // Lock balance and check available stock
  const balance = await getOrCreateBalance(tx, productId);
  const available = balance.onHand - balance.reserved;

  if (quantity > available) {
    throw {
      statusCode: 400,
      code: 'INSUFFICIENT_AVAILABLE_STOCK',
      message: `Insufficient available stock: requested ${quantity}, available ${available}`,
      available,
      onHand: balance.onHand,
      reserved: balance.reserved,
    };
  }

  // Update balance: increase reserved
  const updatedBalance = await tx.inventoryBalance.update({
    where: { productId },
    data: { reserved: balance.reserved + quantity },
    select: { id: true, productId: true, onHand: true, reserved: true, updatedAt: true },
  });

  // Create reservation
  const reservation = await tx.inventoryReservation.create({
    data: {
      productId,
      buyerUserId,
      orderId: orderId ?? null,
      quantity,
      checkoutKey,
      expiresAt,
      status: RESERVATION_STATUSES.ACTIVE,
    },
    select: {
      id: true,
      productId: true,
      buyerUserId: true,
      orderId: true,
      quantity: true,
      status: true,
      checkoutKey: true,
      expiresAt: true,
      consumedAt: true,
      releasedAt: true,
      createdAt: true,
    },
  });

  // Create movement record for reservation
  const movement = await tx.inventoryMovement.create({
    data: {
      productId,
      actorUserId: buyerUserId,
      movementType: INVENTORY_MOVEMENT_TYPES.RESERVATION,
      quantityDelta: -quantity, // Reserved stock is not physically removed but not available
      referenceType: 'InventoryReservation',
      referenceId: String(reservation.id),
      idempotencyKey: checkoutKey,
      reason: reason ?? `Stock reserved for checkout ${checkoutKey}`,
      metadata: { buyerUserId, orderId: orderId ?? null },
    },
    select: {
      id: true,
      productId: true,
      actorUserId: true,
      movementType: true,
      quantityDelta: true,
      referenceType: true,
      referenceId: true,
      idempotencyKey: true,
      reason: true,
      metadata: true,
      createdAt: true,
    },
  });

  await recordAuditLogExplicit({
    tx,
    actorUserId: buyerUserId,
    actorAccessType: 'CUSTOMER', // or STAFF depending on context
    companyId: null,
    action: AUDIT_ACTIONS.INVENTORY_RESERVATION_CREATED,
    entityType: 'InventoryReservation',
    entityId: reservation.id,
    after: reservation,
    metadata: { quantity, checkoutKey, expiresAt: reservation.expiresAt },
  });

  return { reservation, balance: updatedBalance, movement };
}

/**
 * Atomically release a reservation, making stock available again.
 *
 * @param {Prisma.TransactionClient} tx - Prisma transaction client
 * @param {Object} params
 * @param {number} params.reservationId - Reservation ID
 * @param {number} [params.actorUserId] - User releasing the reservation
 * @param {string} [params.reason] - Reason for release
 * @returns {Promise<{reservation: Object, balance: Object, movement: Object}>}
 */
async function releaseReservation(tx, { reservationId, actorUserId, reason }) {
  // Lock reservation row
  const reservation = await tx.inventoryReservation.findUnique({
    where: { id: reservationId },
    select: { id: true, productId: true, quantity: true, status: true, buyerUserId: true, checkoutKey: true },
  });

  if (!reservation) {
    throw { statusCode: 404, code: 'RESERVATION_NOT_FOUND', message: 'Reservation not found' };
  }

  if (reservation.status !== RESERVATION_STATUSES.ACTIVE) {
    throw {
      statusCode: 400,
      code: 'RESERVATION_NOT_ACTIVE',
      message: `Cannot release reservation with status ${reservation.status}`,
    };
  }

  // Lock balance and decrease reserved
  const balance = await getOrCreateBalance(tx, reservation.productId);
  const newReserved = balance.reserved - reservation.quantity;

  if (newReserved < 0) {
    // Data inconsistency - should not happen with proper locking
    throw { statusCode: 500, code: 'INVENTORY_INCONSISTENCY', message: 'Reserved quantity would go negative' };
  }

  const updatedBalance = await tx.inventoryBalance.update({
    where: { productId: reservation.productId },
    data: { reserved: newReserved },
    select: { id: true, productId: true, onHand: true, reserved: true, updatedAt: true },
  });

  // Update reservation status
  const updatedReservation = await tx.inventoryReservation.update({
    where: { id: reservationId },
    data: {
      status: RESERVATION_STATUSES.RELEASED,
      releasedAt: new Date(),
    },
    select: {
      id: true,
      productId: true,
      buyerUserId: true,
      orderId: true,
      quantity: true,
      status: true,
      checkoutKey: true,
      expiresAt: true,
      consumedAt: true,
      releasedAt: true,
      createdAt: true,
    },
  });

  // Create movement record for release
  const movement = await tx.inventoryMovement.create({
    data: {
      productId: reservation.productId,
      actorUserId: actorUserId ?? reservation.buyerUserId,
      movementType: INVENTORY_MOVEMENT_TYPES.RELEASE,
      quantityDelta: reservation.quantity, // Released stock becomes available
      referenceType: 'InventoryReservation',
      referenceId: String(reservationId),
      idempotencyKey: `release-${reservation.checkoutKey}-${Date.now()}`,
      reason: reason ?? `Reservation released: ${reservation.checkoutKey}`,
      metadata: { buyerUserId: reservation.buyerUserId },
    },
    select: {
      id: true,
      productId: true,
      actorUserId: true,
      movementType: true,
      quantityDelta: true,
      referenceType: true,
      referenceId: true,
      idempotencyKey: true,
      reason: true,
      metadata: true,
      createdAt: true,
    },
  });

  return { reservation: updatedReservation, balance: updatedBalance, movement };
}

/**
 * Atomically consume a reservation (convert to sale).
 * Moves stock from reserved to physically removed (onHand decreases).
 *
 * @param {Prisma.TransactionClient} tx - Prisma transaction client
 * @param {Object} params
 * @param {number} params.reservationId - Reservation ID
 * @param {number} [params.actorUserId] - User consuming the reservation
 * @param {string} [params.referenceType] - Reference entity type (e.g., 'RetailOrder')
 * @param {string} [params.referenceId] - Reference entity ID
 * @param {string} [params.reason] - Reason for consumption
 * @returns {Promise<{reservation: Object, balance: Object, movement: Object}>}
 */
async function consumeReservation(tx, { reservationId, actorUserId, referenceType, referenceId, reason }) {
  // Lock reservation row
  const reservation = await tx.inventoryReservation.findUnique({
    where: { id: reservationId },
    select: { id: true, productId: true, quantity: true, status: true, buyerUserId: true, checkoutKey: true, orderId: true },
  });

  if (!reservation) {
    throw { statusCode: 404, code: 'RESERVATION_NOT_FOUND', message: 'Reservation not found' };
  }

  if (reservation.status !== RESERVATION_STATUSES.ACTIVE) {
    throw {
      statusCode: 400,
      code: 'RESERVATION_NOT_ACTIVE',
      message: `Cannot consume reservation with status ${reservation.status}`,
    };
  }

  // Lock balance: decrease both reserved and onHand
  const balance = await getOrCreateBalance(tx, reservation.productId);
  const newReserved = balance.reserved - reservation.quantity;
  const newOnHand = balance.onHand - reservation.quantity;

  if (newReserved < 0 || newOnHand < 0) {
    throw { statusCode: 500, code: 'INVENTORY_INCONSISTENCY', message: 'Stock would go negative on consumption' };
  }

  const updatedBalance = await tx.inventoryBalance.update({
    where: { productId: reservation.productId },
    data: { reserved: newReserved, onHand: newOnHand },
    select: { id: true, productId: true, onHand: true, reserved: true, updatedAt: true },
  });

  // Update reservation status
  const updatedReservation = await tx.inventoryReservation.update({
    where: { id: reservationId },
    data: {
      status: RESERVATION_STATUSES.CONSUMED,
      consumedAt: new Date(),
      orderId: referenceId ? Number(referenceId) : reservation.orderId,
    },
    select: {
      id: true,
      productId: true,
      buyerUserId: true,
      orderId: true,
      quantity: true,
      status: true,
      checkoutKey: true,
      expiresAt: true,
      consumedAt: true,
      releasedAt: true,
      createdAt: true,
    },
  });

  // Create movement record for sale
  const movement = await tx.inventoryMovement.create({
    data: {
      productId: reservation.productId,
      actorUserId: actorUserId ?? reservation.buyerUserId,
      movementType: INVENTORY_MOVEMENT_TYPES.SALE,
      quantityDelta: -reservation.quantity,
      referenceType: referenceType ?? 'RetailOrder',
      referenceId: referenceId ?? (reservation.orderId ? String(reservation.orderId) : null),
      idempotencyKey: `consume-${reservation.checkoutKey}-${Date.now()}`,
      reason: reason ?? `Reservation consumed for order ${referenceId ?? reservation.orderId}`,
      metadata: { buyerUserId: reservation.buyerUserId, checkoutKey: reservation.checkoutKey },
    },
    select: {
      id: true,
      productId: true,
      actorUserId: true,
      movementType: true,
      quantityDelta: true,
      referenceType: true,
      referenceId: true,
      idempotencyKey: true,
      reason: true,
      metadata: true,
      createdAt: true,
    },
  });

  return { reservation: updatedReservation, balance: updatedBalance, movement };
}

/**
 * Expire old reservations and release their stock.
 * This can be run as a scheduled job.
 *
 * @param {Prisma.TransactionClient} tx - Prisma transaction client
 * @param {Date} [before] - Expire reservations before this timestamp (default: now)
 * @returns {Promise<number>} - Number of expired reservations
 */
async function expireReservations(tx, before = new Date()) {
  const expiredReservations = await tx.inventoryReservation.findMany({
    where: {
      status: RESERVATION_STATUSES.ACTIVE,
      expiresAt: { lt: before },
    },
    select: { id: true, productId: true, quantity: true, checkoutKey: true, buyerUserId: true },
  });

  let expiredCount = 0;

  for (const reservation of expiredReservations) {
    await tx.$transaction(async (innerTx) => {
      // Lock balance
      const balance = await getOrCreateBalance(innerTx, reservation.productId);
      const newReserved = balance.reserved - reservation.quantity;

      if (newReserved < 0) {
        // Log inconsistency but don't fail the batch
        console.error(`Inventory inconsistency: product ${reservation.productId} reserved would go negative`);
        return;
      }

      await innerTx.inventoryBalance.update({
        where: { productId: reservation.productId },
        data: { reserved: newReserved },
      });

      await innerTx.inventoryReservation.update({
        where: { id: reservation.id },
        data: { status: RESERVATION_STATUSES.EXPIRED, releasedAt: new Date() },
      });

      await innerTx.inventoryMovement.create({
        data: {
          productId: reservation.productId,
          actorUserId: reservation.buyerUserId,
          movementType: INVENTORY_MOVEMENT_TYPES.RELEASE,
          quantityDelta: reservation.quantity,
          referenceType: 'InventoryReservation',
          referenceId: String(reservation.id),
          idempotencyKey: `expire-${reservation.checkoutKey}-${Date.now()}`,
          reason: `Reservation expired: ${reservation.checkoutKey}`,
          metadata: { buyerUserId: reservation.buyerUserId, expiredAt: before.toISOString() },
        },
      });

      await recordAuditLogExplicit({
        innerTx,
        actorUserId: reservation.buyerUserId,
        actorAccessType: 'SYSTEM',
        companyId: null,
        action: AUDIT_ACTIONS.INVENTORY_RESERVATION_EXPIRED,
        entityType: 'InventoryReservation',
        entityId: reservation.id,
        before: { status: 'ACTIVE', quantity: reservation.quantity },
        after: { status: 'EXPIRED', quantity: reservation.quantity },
        metadata: { checkoutKey: reservation.checkoutKey, expiredAt: before.toISOString() },
      });

      expiredCount++;
    });
  }

  return expiredCount;
}

/**
 * Get current inventory balance for a product.
 * @param {Prisma.TransactionClient|PrismaClient} tx - Prisma transaction client or main client
 * @param {number} productId - Product ID
 * @returns {Promise<Object|null>}
 */
async function getBalance(tx, productId) {
  return tx.inventoryBalance.findUnique({
    where: { productId },
    select: { id: true, productId: true, onHand: true, reserved: true, createdAt: true, updatedAt: true },
  });
}

/**
 * Get available stock (onHand - reserved) for a product.
 * @param {Prisma.TransactionClient|PrismaClient} tx - Prisma transaction client or main client
 * @param {number} productId - Product ID
 * @returns {Promise<{onHand: number, reserved: number, available: number}>}
 */
async function getAvailableStock(tx, productId) {
  const balance = await getBalance(tx, productId);
  if (!balance) return { onHand: 0, reserved: 0, available: 0 };
  return {
    onHand: balance.onHand,
    reserved: balance.reserved,
    available: balance.onHand - balance.reserved,
  };
}

/**
 * Get inventory movements for a product with pagination.
 * @param {Prisma.TransactionClient|PrismaClient} tx - Prisma transaction client or main client
 * @param {Object} params
 * @param {number} params.productId - Product ID
 * @param {number} [params.skip] - Pagination offset
 * @param {number} [params.take] - Pagination limit
 * @param {string} [params.movementType] - Filter by movement type
 * @param {Date} [params.from] - Filter by date from
 * @param {Date} [params.to] - Filter by date to
 * @returns {Promise<{items: Array, total: number}>}
 */
async function getMovements(tx, { productId, skip = 0, take = 50, movementType, from, to }) {
  const where = { productId: Number(productId) };
  if (movementType) where.movementType = movementType;
  if (from || to) {
    where.createdAt = {};
    if (from) where.createdAt.gte = from;
    if (to) where.createdAt.lte = to;
  }

  const [items, total] = await Promise.all([
    tx.inventoryMovement.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        productId: true,
        actorUserId: true,
        movementType: true,
        quantityDelta: true,
        referenceType: true,
        referenceId: true,
        idempotencyKey: true,
        reason: true,
        metadata: true,
        createdAt: true,
        actor: { select: { id: true, email: true, profile: { select: { firstName: true, lastName: true } } } },
      },
    }),
    tx.inventoryMovement.count({ where }),
  ]);

  return { items, total };
}

/**
 * Get active reservations for a product.
 * @param {Prisma.TransactionClient|PrismaClient} tx - Prisma transaction client or main client
 * @param {number} productId - Product ID
 * @returns {Promise<Array>}
 */
async function getActiveReservations(tx, productId) {
  return tx.inventoryReservation.findMany({
    where: {
      productId: Number(productId),
      status: RESERVATION_STATUSES.ACTIVE,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      productId: true,
      buyerUserId: true,
      orderId: true,
      quantity: true,
      status: true,
      checkoutKey: true,
      expiresAt: true,
      createdAt: true,
      buyer: { select: { id: true, email: true, profile: { select: { firstName: true, lastName: true } } } },
    },
  });
}

/**
 * Get reservation by checkout key (idempotency lookup).
 * @param {Prisma.TransactionClient|PrismaClient} tx - Prisma transaction client or main client
 * @param {string} checkoutKey - Checkout key
 * @returns {Promise<Object|null>}
 */
async function getReservationByCheckoutKey(tx, checkoutKey) {
  return tx.inventoryReservation.findUnique({
    where: { checkoutKey },
    select: {
      id: true,
      productId: true,
      buyerUserId: true,
      orderId: true,
      quantity: true,
      status: true,
      checkoutKey: true,
      expiresAt: true,
      consumedAt: true,
      releasedAt: true,
      createdAt: true,
    },
  });
}

/**
 * Adjust stock with raw SQL for maximum atomicity (fallback for high concurrency).
 * Uses PostgreSQL advisory locks for cross-transaction coordination.
 *
 * @param {Object} params
 * @param {number} params.productId
 * @param {number} params.delta - Quantity change (positive or negative)
 * @param {string} params.movementType
 * @param {number} [params.actorUserId]
 * @param {string} [params.referenceType]
 * @param {string} [params.referenceId]
 * @param {string} [params.idempotencyKey]
 * @param {string} [params.reason]
 * @returns {Promise<{onHand: number, reserved: number, movementId: bigint}>}
 */
async function adjustStockAtomic(params) {
  const { productId, delta, movementType, actorUserId, referenceType, referenceId, idempotencyKey, reason } = params;

  // Use a transaction with row-level locking
  return prisma.$transaction(async (tx) => {
    // Lock the balance row
    const balance = await tx.inventoryBalance.findUnique({
      where: { productId },
      select: { onHand: true, reserved: true },
    });

    if (!balance) {
      throw { statusCode: 404, code: 'PRODUCT_NOT_FOUND', message: 'Product inventory balance not found' };
    }

    const newOnHand = balance.onHand + delta;
    if (newOnHand < 0) {
      throw {
        statusCode: 400,
        code: 'INSUFFICIENT_STOCK',
        message: `Insufficient stock: available ${balance.onHand}`,
        available: balance.onHand,
      };
    }

    // Update balance
    await tx.inventoryBalance.update({
      where: { productId },
      data: { onHand: newOnHand },
    });

    // Create movement
    const movement = await tx.inventoryMovement.create({
      data: {
        productId,
        actorUserId: actorUserId ?? null,
        movementType,
        quantityDelta: delta,
        referenceType: referenceType ?? null,
        referenceId: referenceId ?? null,
        idempotencyKey: idempotencyKey ?? null,
        reason: reason ?? null,
      },
      select: { id: true },
    });

    return { onHand: newOnHand, reserved: balance.reserved, movementId: movement.id };
  }, { isolationLevel: 'Serializable' });
}

module.exports = {
  INVENTORY_MOVEMENT_TYPES,
  RESERVATION_STATUSES,
  getOrCreateBalance,
  adjustStock,
  reserveStock,
  releaseReservation,
  consumeReservation,
  expireReservations,
  getBalance,
  getAvailableStock,
  getMovements,
  getActiveReservations,
  getReservationByCheckoutKey,
  adjustStockAtomic,
};