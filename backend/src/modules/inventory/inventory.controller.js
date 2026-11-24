const prisma = require('../../config/db');
const svc = require('./inventory.service');
const { getPaginationParams, buildPaginatedResponse } = require('../../utils/pagination');
const { success } = require('../../utils/success');
const { toPositiveInt } = require('../products/product.service');

/**
 * Inventory Controller
 *
 * HTTP handlers for inventory balance, movements, and reservations.
 * STAFF-only access for management operations.
 * COMPANY users can view their own products' inventory.
 */

async function getBalance(request, reply) {
  const productId = toPositiveInt(request.params.id, 'productId');
  const balance = await svc.getBalance(productId);
  if (!balance) return reply.code(404).send({ error: { code: 'NOT_FOUND', message: 'Inventory balance not found' } });
  return reply.send(success({
    ...balance,
    available: balance.onHand - balance.reserved,
  }));
}

async function getAvailableStock(request, reply) {
  const productId = toPositiveInt(request.params.id, 'productId');
  const stock = await svc.getAvailableStock(productId);
  return reply.send(success(stock));
}

async function listMovements(request, reply) {
  const productId = toPositiveInt(request.params.id, 'productId');
  const { page, limit, skip, take } = getPaginationParams(request.query);
  const { movementType, from, to } = request.query;

  const { items, total } = await svc.getMovements({
    productId,
    skip,
    take,
    movementType,
    from: from ? new Date(from) : undefined,
    to: to ? new Date(to) : undefined,
  });

  return reply.send(buildPaginatedResponse(items, total, page, limit));
}

async function listActiveReservations(request, reply) {
  const productId = toPositiveInt(request.params.id, 'productId');
  const reservations = await svc.getActiveReservations(productId);
  return reply.send(success(reservations));
}

async function getReservationByCheckoutKey(request, reply) {
  const { checkoutKey } = request.params;
  const reservation = await svc.getReservationByCheckoutKey(checkoutKey);
  if (!reservation) return reply.code(404).send({ error: { code: 'NOT_FOUND', message: 'Reservation not found' } });
  return reply.send(success(reservation));
}

/**
 * STAFF-only: Adjust physical stock (receipt, adjustment, damage, etc.)
 * Requires products.update permission
 */
async function adjustStock(request, reply) {
  const productId = toPositiveInt(request.params.id, 'productId');
  const { quantityDelta, movementType, referenceType, referenceId, idempotencyKey, reason, metadata } = request.body;

  if (quantityDelta === undefined || quantityDelta === null || !Number.isInteger(Number(quantityDelta))) {
    return reply.code(400).send({ error: { code: 'VALIDATION_ERROR', message: 'quantityDelta must be an integer' } });
  }
  if (!movementType || !Object.values(svc.INVENTORY_MOVEMENT_TYPES).includes(movementType)) {
    return reply.code(400).send({ error: { code: 'VALIDATION_ERROR', message: 'Invalid or missing movementType' } });
  }

  const result = await prisma.$transaction(async (tx) => {
    return svc.adjustStock(tx, {
      productId,
      quantityDelta: Number(quantityDelta),
      movementType,
      actorUserId: request.user.id,
      referenceType,
      referenceId,
      idempotencyKey,
      reason,
      metadata,
    });
  });

  return reply.send(success(result));
}

/**
 * STAFF-only: Bulk stock adjustment (for initial stock setup, corrections)
 */
async function bulkAdjustStock(request, reply) {
  const { adjustments } = request.body;

  if (!Array.isArray(adjustments) || adjustments.length === 0) {
    return reply.code(400).send({ error: { code: 'VALIDATION_ERROR', message: 'adjustments must be a non-empty array' } });
  }

  const results = [];
  for (const adj of adjustments) {
    const productId = toPositiveInt(adj.productId, 'productId');
    const quantityDelta = Number(adj.quantityDelta);
    const movementType = adj.movementType;

    if (!Number.isInteger(quantityDelta)) {
      return reply.code(400).send({ error: { code: 'VALIDATION_ERROR', message: `quantityDelta must be integer for product ${productId}` } });
    }
    if (!Object.values(svc.INVENTORY_MOVEMENT_TYPES).includes(movementType)) {
      return reply.code(400).send({ error: { code: 'VALIDATION_ERROR', message: `Invalid movementType for product ${productId}` } });
    }

    const result = await prisma.$transaction(async (tx) => {
      return svc.adjustStock(tx, {
        productId,
        quantityDelta,
        movementType,
        actorUserId: request.user.id,
        referenceType: adj.referenceType,
        referenceId: adj.referenceId,
        idempotencyKey: adj.idempotencyKey,
        reason: adj.reason,
        metadata: adj.metadata,
      });
    });
    results.push(result);
  }

  return reply.send(success(results));
}

/**
 * Run reservation expiration job (STAFF only, typically called by scheduler)
 */
async function expireReservations(request, reply) {
  const { before } = request.query;
  const count = await prisma.$transaction(async (tx) => {
    return svc.expireReservations(tx, before ? new Date(before) : new Date());
  });
  return reply.send(success({ expiredCount: count }));
}

module.exports = {
  getBalance,
  getAvailableStock,
  listMovements,
  listActiveReservations,
  getReservationByCheckoutKey,
  adjustStock,
  bulkAdjustStock,
  expireReservations,
};