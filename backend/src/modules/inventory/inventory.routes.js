const ctrl = require('./inventory.controller');
const { requireAccessType, requirePermission } = require('../../middlewares/rbac');

const MANAGE_TYPES = ['STAFF'];
const VIEW_TYPES = ['COMPANY', 'STAFF'];

const idParamSchema = {
  type: 'object',
  required: ['id'],
  properties: { id: { type: 'integer', minimum: 1 } },
};

const checkoutKeyParamSchema = {
  type: 'object',
  required: ['checkoutKey'],
  properties: { checkoutKey: { type: 'string', minLength: 1, maxLength: 160 } },
};

const adjustStockBodySchema = {
  type: 'object',
  required: ['quantityDelta', 'movementType'],
  additionalProperties: false,
  properties: {
    quantityDelta: { type: 'integer' },
    movementType: { type: 'string', enum: ['RECEIPT', 'ADJUSTMENT_IN', 'ADJUSTMENT_OUT', 'RESERVATION', 'RELEASE', 'SALE', 'RETURN', 'DAMAGE'] },
    referenceType: { type: 'string', maxLength: 60 },
    referenceId: { type: 'string', maxLength: 100 },
    idempotencyKey: { type: 'string', maxLength: 160 },
    reason: { type: 'string', maxLength: 500 },
    metadata: { type: 'object', additionalProperties: true },
  },
};

const bulkAdjustBodySchema = {
  type: 'object',
  required: ['adjustments'],
  additionalProperties: false,
  properties: {
    adjustments: {
      type: 'array',
      minItems: 1,
      items: {
        type: 'object',
        required: ['productId', 'quantityDelta', 'movementType'],
        additionalProperties: false,
        properties: {
          productId: { type: 'integer', minimum: 1 },
          quantityDelta: { type: 'integer' },
          movementType: { type: 'string', enum: ['RECEIPT', 'ADJUSTMENT_IN', 'ADJUSTMENT_OUT', 'RESERVATION', 'RELEASE', 'SALE', 'RETURN', 'DAMAGE'] },
          referenceType: { type: 'string', maxLength: 60 },
          referenceId: { type: 'string', maxLength: 100 },
          idempotencyKey: { type: 'string', maxLength: 160 },
          reason: { type: 'string', maxLength: 500 },
          metadata: { type: 'object', additionalProperties: true },
        },
      },
    },
  },
};

const expireReservationsQuerySchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    before: { type: 'string', format: 'date-time' },
  },
};

const movementsQuerySchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    page: { type: 'integer', minimum: 1 },
    limit: { type: 'integer', minimum: 1, maximum: 100 },
    movementType: { type: 'string', enum: ['RECEIPT', 'ADJUSTMENT_IN', 'ADJUSTMENT_OUT', 'RESERVATION', 'RELEASE', 'SALE', 'RETURN', 'DAMAGE'] },
    from: { type: 'string', format: 'date-time' },
    to: { type: 'string', format: 'date-time' },
  },
};

async function inventoryRoutes(fastify) {
  // All inventory routes require authentication
  fastify.register(async (authenticated) => {
    authenticated.addHook('onRequest', authenticated.authenticate);

    // ── Public/Company view routes (COMPANY + STAFF) ─────────────
    // Company users can view their own products' inventory
    authenticated.get('/:id/balance', {
      preHandler: [requireAccessType(...VIEW_TYPES), requirePermission('products.read')],
      schema: { params: idParamSchema, summary: 'Get inventory balance for a product', tags: ['Inventory'] },
    }, ctrl.getBalance);

    authenticated.get('/:id/available', {
      preHandler: [requireAccessType(...VIEW_TYPES), requirePermission('products.read')],
      schema: { params: idParamSchema, summary: 'Get available stock for a product', tags: ['Inventory'] },
    }, ctrl.getAvailableStock);

    authenticated.get('/:id/movements', {
      preHandler: [requireAccessType(...VIEW_TYPES), requirePermission('products.read')],
      schema: { params: idParamSchema, querystring: movementsQuerySchema, summary: 'List inventory movements for a product', tags: ['Inventory'] },
    }, ctrl.listMovements);

    authenticated.get('/:id/reservations', {
      preHandler: [requireAccessType(...VIEW_TYPES), requirePermission('products.read')],
      schema: { params: idParamSchema, summary: 'List active reservations for a product', tags: ['Inventory'] },
    }, ctrl.listActiveReservations);

    authenticated.get('/reservations/:checkoutKey', {
      preHandler: [requireAccessType(...VIEW_TYPES), requirePermission('products.read')],
      schema: { params: checkoutKeyParamSchema, summary: 'Get reservation by checkout key', tags: ['Inventory'] },
    }, ctrl.getReservationByCheckoutKey);

    // ── STAFF-only management routes ─────────────────────────────
    // Stock adjustments require products.update permission
    authenticated.post('/:id/adjust', {
      preHandler: [requireAccessType(...MANAGE_TYPES), requirePermission('products.update')],
      schema: { params: idParamSchema, body: adjustStockBodySchema, summary: 'Adjust physical stock (receipt, adjustment, damage, etc.)', tags: ['Inventory'] },
    }, ctrl.adjustStock);

    authenticated.post('/bulk-adjust', {
      preHandler: [requireAccessType(...MANAGE_TYPES), requirePermission('products.update')],
      schema: { body: bulkAdjustBodySchema, summary: 'Bulk stock adjustment (initial setup, corrections)', tags: ['Inventory'] },
    }, ctrl.bulkAdjustStock);

    // Reservation expiration job (typically called by scheduler)
    authenticated.post('/expire-reservations', {
      preHandler: [requireAccessType(...MANAGE_TYPES), requirePermission('products.update')],
      schema: { querystring: expireReservationsQuerySchema, summary: 'Expire old reservations and release stock', tags: ['Inventory'] },
    }, ctrl.expireReservations);
  });
}

module.exports = inventoryRoutes;