const ctrl = require('./retail.controller');
const orderCtrl = require('./retail-order.controller');
const { requireAccessType } = require('../../middlewares/rbac');

const idParams = {
  type: 'object',
  required: ['id'],
  additionalProperties: false,
  properties: { id: { type: 'integer', minimum: 1 } },
};

const catalogQuery = {
  type: 'object',
  additionalProperties: false,
  properties: {
    search: { type: 'string', maxLength: 100 },
    categoryId: { type: 'integer', minimum: 1 },
    minPrice: { type: 'number', minimum: 0 },
    maxPrice: { type: 'number', minimum: 0 },
    page: { type: 'integer', minimum: 1, default: 1 },
    limit: { type: 'integer', minimum: 1, maximum: 100, default: 24 },
    sortBy: { type: 'string', enum: ['createdAt', 'updatedAt', 'title'], default: 'createdAt' },
    sortOrder: { type: 'string', enum: ['asc', 'desc'], default: 'desc' },
  },
};

const checkoutItemsSchema = {
  type: 'array',
  minItems: 1,
  maxItems: 50,
  items: {
    type: 'object',
    required: ['productId', 'quantity'],
    additionalProperties: false,
    properties: {
      productId: { type: 'integer', minimum: 1 },
      quantity: { type: 'integer', minimum: 1, maximum: 10000 },
    },
  },
};

const checkoutPreviewBody = {
  type: 'object',
  required: ['items'],
  additionalProperties: false,
  properties: { items: checkoutItemsSchema },
};

const orderParams = {
  type: 'object',
  required: ['id'],
  additionalProperties: false,
  properties: { id: { type: 'integer', minimum: 1 } },
};

const orderListQuery = {
  type: 'object',
  additionalProperties: false,
  properties: {
    page: { type: 'integer', minimum: 1, default: 1 },
    limit: { type: 'integer', minimum: 1, maximum: 50, default: 20 },
  },
};

const placeOrderHeaders = {
  type: 'object',
  required: ['idempotency-key'],
  additionalProperties: true,
  properties: {
    'idempotency-key': { type: 'string', minLength: 8, maxLength: 160 },
  },
};

const placeOrderBody = {
  type: 'object',
  required: ['addressId', 'items'],
  additionalProperties: false,
  properties: {
    addressId: { type: 'integer', minimum: 1 },
    items: checkoutItemsSchema,
  },
};

async function retailRoutes(fastify) {
  // Public catalog: only published/public products with explicit retail enablement
  // and a currently valid minQuantity=1 price tier are returned.
  fastify.get('/catalog', {
    schema: {
      querystring: catalogQuery,
      summary: 'List public products eligible for B2C retail purchase',
      tags: ['Retail'],
    },
  }, ctrl.listCatalog);

  fastify.get('/catalog/:id', {
    schema: {
      params: idParams,
      summary: 'Get a public retail-enabled product and current stock state',
      tags: ['Retail'],
    },
  }, ctrl.getCatalogProduct);

  // Customer checkout preview is authenticated and strictly CUSTOMER-context.
  // It validates live price/stock but never creates an order or payment.
  fastify.register(async function customerRetailRoutes(customer) {
    customer.addHook('onRequest', customer.authenticate);
    customer.addHook('preHandler', requireAccessType('CUSTOMER'));

    customer.post('/checkout/preview', {
      schema: {
        body: checkoutPreviewBody,
        summary: 'Validate current retail prices and available stock before checkout',
        tags: ['Retail'],
      },
    }, ctrl.previewCheckout);

    customer.post('/orders', {
      schema: {
        headers: placeOrderHeaders,
        body: placeOrderBody,
        summary: 'Place an idempotent customer retail order and reserve stock',
        tags: ['Retail'],
      },
    }, orderCtrl.placeOrder);

    customer.get('/orders', {
      schema: {
        querystring: orderListQuery,
        summary: 'List the authenticated customer’s retail orders',
        tags: ['Retail'],
      },
    }, orderCtrl.listOrders);

    customer.get('/orders/:id', {
      schema: {
        params: orderParams,
        summary: 'Get one retail order owned by the authenticated customer',
        tags: ['Retail'],
      },
    }, orderCtrl.getOrder);
  });
}

module.exports = retailRoutes;
