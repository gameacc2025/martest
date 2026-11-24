const ctrl = require('./retail.controller');
const orderCtrl = require('./retail-order.controller');
const sellerOrderCtrl = require('./retail-seller-order.controller');
const { requireAccessType, requirePermission } = require('../../middlewares/rbac');

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

const sandboxPaymentParams = {
  type: 'object',
  required: ['authority'],
  additionalProperties: false,
  properties: { authority: { type: 'string', minLength: 24, maxLength: 200 } },
};

const orderListQuery = {
  type: 'object',
  additionalProperties: false,
  properties: {
    page: { type: 'integer', minimum: 1, default: 1 },
    limit: { type: 'integer', minimum: 1, maximum: 50, default: 20 },
  },
};

const sellerOrderListQuery = {
  type: 'object',
  additionalProperties: false,
  properties: {
    page: { type: 'integer', minimum: 1, default: 1 },
    limit: { type: 'integer', minimum: 1, maximum: 50, default: 20 },
    status: { type: 'string', enum: ['PENDING_ACCEPTANCE', 'ACCEPTED', 'REJECTED', 'PROCESSING', 'READY_TO_SHIP', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'RETURN_REQUESTED', 'PARTIALLY_RETURNED', 'RETURNED'] },
  },
};

const sellerOrderTransitionBody = {
  type: 'object',
  required: ['action'],
  additionalProperties: false,
  properties: {
    action: { type: 'string', enum: ['ACCEPT', 'START_PROCESSING', 'READY_TO_SHIP', 'SHIP', 'DELIVER'] },
    carrier: { type: 'string', maxLength: 120 },
    trackingNumber: { type: 'string', maxLength: 160 },
    location: { type: 'string', maxLength: 240 },
    description: { type: 'string', maxLength: 500 },
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

    customer.get('/payments/sandbox/:authority', {
      schema: {
        params: sandboxPaymentParams,
        summary: 'Get an authenticated customer’s sandbox payment details',
        tags: ['Retail'],
      },
    }, orderCtrl.getSandboxPayment);

    customer.post('/payments/sandbox/:authority/confirm', {
      schema: {
        params: sandboxPaymentParams,
        summary: 'Confirm a test-only sandbox payment and consume reserved stock',
        tags: ['Retail'],
      },
    }, orderCtrl.confirmSandboxPayment);

    customer.get('/orders/:id', {
      schema: {
        params: orderParams,
        summary: 'Get one retail order owned by the authenticated customer',
        tags: ['Retail'],
      },
    }, orderCtrl.getOrder);
  });

  // Company seller operations are tenant-scoped by request.user.companyId in every query.
  fastify.register(async function companyRetailRoutes(company) {
    company.addHook('onRequest', company.authenticate);
    company.addHook('preHandler', requireAccessType('COMPANY'));

    company.get('/company/orders', {
      preHandler: requirePermission('retail.orders.read'),
      schema: {
        querystring: sellerOrderListQuery,
        summary: 'List paid retail seller orders belonging to the authenticated company',
        tags: ['Retail Seller'],
      },
    }, sellerOrderCtrl.listOrders);

    company.get('/company/orders/:id', {
      preHandler: requirePermission('retail.orders.read'),
      schema: {
        params: orderParams,
        summary: 'Get a paid seller order belonging to the authenticated company',
        tags: ['Retail Seller'],
      },
    }, sellerOrderCtrl.getOrder);

    company.post('/company/orders/:id/transitions', {
      preHandler: requirePermission('retail.orders.manage'),
      schema: {
        params: orderParams,
        body: sellerOrderTransitionBody,
        summary: 'Advance a company seller order through an explicit fulfillment transition',
        tags: ['Retail Seller'],
      },
    }, sellerOrderCtrl.transitionOrder);
  });
}

module.exports = retailRoutes;
