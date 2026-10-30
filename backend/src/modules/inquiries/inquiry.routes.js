const ctrl = require('./inquiry.controller');
// Priority 1 (RBAC): every protected route must have BOTH authorization layers
//   1. requireAccessType(...) → domain boundary (STAFF | COMPANY | CUSTOMER)
//   2. requireAnyPermission(...) → fine-grained action permission
// SUPER_ADMIN's wildcard bypasses the permission layer only; requireAccessType
// always enforces the AccessProfile app-context boundary, including for SUPER_ADMIN.
const { requireAccessType, requireAnyPermission } = require('../../middlewares/rbac');

// Access-type sets, derived from the seed ROLE_PERMISSIONS: the union of the
// domains whose roles hold the permissions required by each route.
//   ALL_TYPES    → read/create flows shared by STAFF, COMPANY and CUSTOMER.
//   MANAGE_TYPES → update/status/respond flows held only by STAFF & COMPANY
//                  (CUSTOMER has no *.update / inquiries.respond permission).
const ALL_TYPES = ['STAFF', 'COMPANY', 'CUSTOMER'];
const MANAGE_TYPES = ['STAFF', 'COMPANY'];
// Supplier quote lifecycle is company-only. Staff can administer inquiry
// records, but must never impersonate a supplier when submitting or editing quotes.
const SUPPLIER_TYPES = ['COMPANY'];

const INQUIRY_PRIORITIES = ['LOW', 'NORMAL', 'HIGH', 'URGENT'];

const INQUIRY_VISIBILITY_MODES = ['NORMAL', 'SEALED', 'ANONYMOUS_SEALED'];

const inquiryBodySchema = {
  type: 'object',
  required: ['title', 'items'],
  additionalProperties: false,
  properties: {
    title: { type: 'string', minLength: 1 },
    description: { type: 'string' },
    companyId: { type: 'integer' },
    status: { type: 'string', enum: ['DRAFT'] },

    // ── Phase 2: professional inquiry fields ────────────────
    priority: { type: 'string', enum: INQUIRY_PRIORITIES },
    visibilityMode: { type: 'string', enum: INQUIRY_VISIBILITY_MODES },
    confidential: { type: 'boolean' },
    publishDate: { type: 'string', format: 'date-time' },
    responseDeadline: { type: 'string', format: 'date-time' },
    autoClose: { type: 'boolean' },
    allowEarlyReveal: { type: 'boolean' },
    allowEditResponse: { type: 'boolean' },
    allowWithdrawResponse: { type: 'boolean' },

    items: {
      type: 'array',
      minItems: 1,
      items: {
        type: 'object',
        required: ['productId', 'quantity'],
        additionalProperties: false,
        properties: {
          productId: { type: 'integer' },
          description: { type: 'string' },
          quantity: { type: 'integer', minimum: 1 },
          attachment: { type: 'string' },
        },
      },
    },
  },
};

const inquiryUpdateBodySchema = {
  type: 'object',
  minProperties: 1,
  additionalProperties: false,
  properties: {
    title: { type: 'string', minLength: 1 },
    description: { type: 'string' },
    priority: { type: 'string', enum: INQUIRY_PRIORITIES },
    visibilityMode: { type: 'string', enum: INQUIRY_VISIBILITY_MODES },
    confidential: { type: 'boolean' },
    publishDate: { type: ['string', 'null'], format: 'date-time' },
    responseDeadline: { type: ['string', 'null'], format: 'date-time' },
    autoClose: { type: 'boolean' },
    allowEarlyReveal: { type: 'boolean' },
    allowEditResponse: { type: 'boolean' },
    allowWithdrawResponse: { type: 'boolean' },
  },
};


const statusBodySchema = {
  type: 'object',
  required: ['status'],
  additionalProperties: false,
  properties: {
    status: { type: 'string', enum: ['DRAFT', 'SUBMITTED', 'OPEN', 'CLOSED', 'EXPIRED', 'COMPLETED', 'CANCELLED'] },
    comment: { type: 'string' },
  },
};

const responseBodySchema = {
  type: 'object',
  required: ['items'],
  additionalProperties: false,
  properties: {
    companyId: { type: 'integer' },
    status: { type: 'string', enum: ['PENDING'] },
    items: {
      type: 'array',
      minItems: 1,
      items: {
        type: 'object',
        required: ['inquiryItemId', 'price', 'deliveryTime', 'description', 'availableQuantity'],
        additionalProperties: false,
        properties: {
          inquiryItemId: { type: 'integer' },
          price: { type: 'number', minimum: 0 },
          currency: { type: 'string', default: 'IRR' },
          availableQuantity: { type: 'integer', minimum: 0 },
          deliveryTime: { type: 'string', minLength: 1 },
          description: { type: 'string', minLength: 1 },
        },
      },
    },
  },
};

const itemBodySchema = {
  type: 'object',
  required: ['productId', 'quantity'],
  additionalProperties: false,
  properties: {
    productId: { type: 'integer' },
    quantity: { type: 'integer', minimum: 1 },
    description: { type: 'string' },
    attachment: { type: 'string' },
  },
};

const itemUpdateBodySchema = {
  type: 'object',
  minProperties: 1,
  additionalProperties: false,
  properties: {
    productId: { type: 'integer' },
    quantity: { type: 'integer', minimum: 1 },
    description: { type: 'string' },
    attachment: { type: 'string' },
  },
};

const inquiryParamsSchema = {
  type: 'object',
  required: ['id'],
  properties: { id: { type: 'integer' } },
};

const inquiryItemParamsSchema = {
  type: 'object',
  required: ['id', 'itemId'],
  properties: {
    id: { type: 'integer' },
    itemId: { type: 'integer' },
  },
};

const inquiryResponseParamsSchema = {
  type: 'object',
  required: ['id', 'responseId'],
  properties: {
    id: { type: 'integer' },
    responseId: { type: 'integer' },
  },
};

const inquiryResponseAttachmentParamsSchema = {
  type: 'object',
  required: ['id', 'responseId', 'attachmentId'],
  properties: {
    id: { type: 'integer' },
    responseId: { type: 'integer' },
    attachmentId: { type: 'integer' },
  },
};

const withdrawResponseBodySchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    companyId: { type: 'integer' },
  },
};


const listQuerySchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    page: { type: 'integer', minimum: 1 },
    limit: { type: 'integer', minimum: 1, maximum: 100 },
    search: { type: 'string' },
    status: { type: 'string', enum: ['DRAFT', 'SUBMITTED', 'OPEN', 'CLOSED', 'EXPIRED', 'COMPLETED', 'CANCELLED'] },
    scope: { type: 'string', enum: ['sent', 'received', 'all'] },
    sortBy: { type: 'string', enum: ['id', 'title', 'status', 'createdAt', 'updatedAt', 'responseDeadline'] },
    sortOrder: { type: 'string', enum: ['asc', 'desc'] },
  },
};

async function inquiryRoutes(fastify) {
  // Zarinpal redirects the customer back without our JWT. Keep this one
  // provider callback public; the handler verifies Authority with Zarinpal
  // server-to-server before it can activate any subscription.
  fastify.addHook('onRequest', async (request, reply) => {
    if (String(request.routeOptions?.url || '').endsWith('/subscription/payment/callback')) return;
    return fastify.authenticate(request, reply);
  });

  fastify.get('/', {
    preHandler: [requireAccessType(...ALL_TYPES), requireAnyPermission('leads.read', 'inquiries.read')],
    schema: { querystring: listQuerySchema },
  }, ctrl.list);

  // Plans and self-service subscription requests.
  fastify.get('/subscription/payment/callback', {
    config: { rateLimit: { max: 30, timeWindow: '1 minute' } },
  }, ctrl.subscriptionPaymentCallback);

  fastify.get('/plans', {
    preHandler: [requireAccessType(...ALL_TYPES), requireAnyPermission('leads.read', 'inquiries.read', 'inquiries.create')],
  }, ctrl.listPlans);

  fastify.post('/subscription/:id/verify-payment', {
    preHandler: [requireAccessType('COMPANY', 'CUSTOMER'), requireAnyPermission('inquiries.read', 'inquiries.create', 'inquiries.respond')],
    schema: { params: { type: 'object', required: ['id'], properties: { id: { type: 'string', minLength: 1, maxLength: 10 } } } },
  }, ctrl.retrySubscriptionPayment);

  fastify.get('/subscription/me', {
    preHandler: [requireAccessType('COMPANY', 'CUSTOMER'), requireAnyPermission('inquiries.read', 'inquiries.create', 'inquiries.respond')],
  }, ctrl.mySubscriptions);

  fastify.post('/subscription', {
    preHandler: [requireAccessType('COMPANY', 'CUSTOMER'), requireAnyPermission('inquiries.create', 'inquiries.respond')],
    schema: { body: { type: 'object', required: ['planId'], additionalProperties: false, properties: { planId: { type: 'integer', minimum: 1 }, paymentReference: { type: 'string', maxLength: 120 } } } },
  }, ctrl.requestSubscription);

  // Current subscription and remaining RFQ quota for the caller.
  fastify.get('/quota', {
    preHandler: [requireAccessType('COMPANY', 'CUSTOMER'), requireAnyPermission('leads.read', 'inquiries.read', 'inquiries.create')],
  }, ctrl.quota);

  // Dashboard statistics scoped to the caller's company (aggregated live).
  fastify.get('/stats', {
    preHandler: [requireAccessType(...ALL_TYPES), requireAnyPermission('leads.read', 'inquiries.read')],
  }, ctrl.stats);


  fastify.get('/:id', {
    preHandler: [requireAccessType(...ALL_TYPES), requireAnyPermission('leads.read', 'inquiries.read')],
    schema: { params: inquiryParamsSchema },
  }, ctrl.getById);

  fastify.post('/', {

    preHandler: [requireAccessType(...ALL_TYPES), requireAnyPermission('leads.create', 'inquiries.create')],
    schema: { body: inquiryBodySchema },
  }, ctrl.create);

  fastify.patch('/:id', {
    preHandler: [requireAccessType(...MANAGE_TYPES), requireAnyPermission('leads.update', 'inquiries.update')],
    schema: { params: inquiryParamsSchema, body: inquiryUpdateBodySchema },
  }, ctrl.update);

  fastify.get('/:id/items', {
    preHandler: [requireAccessType(...ALL_TYPES), requireAnyPermission('leads.read', 'inquiries.read')],
    schema: { params: inquiryParamsSchema },
  }, ctrl.listItems);


  // Buyers may cancel their own inquiry; STAFF/COMPANY lifecycle changes
  // still require the corresponding update permission and are owner-scoped in the service.
  fastify.patch('/:id/status', {
    preHandler: [requireAccessType(...ALL_TYPES), requireAnyPermission('leads.update', 'inquiries.update', 'inquiries.create')],
    schema: { params: inquiryParamsSchema, body: statusBodySchema },
  }, ctrl.changeStatus);

  fastify.post('/:id/reveal', {
    preHandler: [requireAccessType(...ALL_TYPES), requireAnyPermission('leads.read', 'inquiries.read', 'leads.update', 'inquiries.update')],
    schema: { params: inquiryParamsSchema },
  }, ctrl.revealResponses);

  fastify.post('/:id/items', {
    preHandler: [requireAccessType(...ALL_TYPES), requireAnyPermission('leads.update', 'inquiries.create')],
    schema: { params: inquiryParamsSchema, body: itemBodySchema },
  }, ctrl.addItem);

  fastify.patch('/:id/items/:itemId', {
    preHandler: [requireAccessType(...ALL_TYPES), requireAnyPermission('leads.update', 'inquiries.create')],
    schema: { params: inquiryItemParamsSchema, body: itemUpdateBodySchema },
  }, ctrl.updateItem);

  fastify.delete('/:id/items/:itemId', {
    preHandler: [requireAccessType(...MANAGE_TYPES), requireAnyPermission('leads.delete', 'inquiries.create')],
    schema: { params: inquiryItemParamsSchema },
  }, ctrl.deleteItem);


  // Private buyer/supplier conversation. A supplier can only message after
  // submitting a response; each send consumes the sender's message quota.
  fastify.get('/:id/messages', {
    preHandler: [requireAccessType('STAFF', 'COMPANY', 'CUSTOMER'), requireAnyPermission('leads.read', 'inquiries.read')],
    schema: { params: inquiryParamsSchema },
  }, ctrl.listMessages);

  fastify.post('/:id/messages', {
    preHandler: [requireAccessType('COMPANY', 'CUSTOMER'), requireAnyPermission('inquiries.create', 'inquiries.respond')],
    schema: {
      params: inquiryParamsSchema,
      body: {
        type: 'object', required: ['message'], additionalProperties: false,
        properties: {
          message: { type: 'string', minLength: 1, maxLength: 5000 },
          recipientCompanyId: { type: 'integer', minimum: 1 },
          notifyBySms: { type: 'boolean' },
        },
      },
    },
  }, ctrl.sendMessage);

  fastify.get('/:id/responses', {
    preHandler: [requireAccessType(...ALL_TYPES), requireAnyPermission('inquiries.read', 'inquiries.respond', 'leads.read')],
    schema: { params: inquiryParamsSchema },
  }, ctrl.listResponses);

  fastify.post('/:id/responses', {
    preHandler: [requireAccessType(...SUPPLIER_TYPES), requireAnyPermission('inquiries.respond')],
    schema: {
      params: {
        type: 'object',
        required: ['id'],
        properties: { id: { type: 'integer' } },
      },
      body: responseBodySchema,
    },
  }, ctrl.submitResponse);

  fastify.patch('/:id/responses/:responseId/decision', {
    preHandler: [requireAccessType(...ALL_TYPES), requireAnyPermission('inquiries.create', 'inquiries.update', 'leads.update')],
    schema: {
      params: inquiryResponseParamsSchema,
      body: {
        type: 'object',
        required: ['decision'],
        additionalProperties: false,
        properties: {
          decision: { type: 'string', enum: ['SELECTED', 'REJECTED'] },
          comment: { type: 'string', maxLength: 2000 },
        },
      },
    },
  }, ctrl.decideResponse);

  fastify.patch('/:id/responses/:responseId', {
    preHandler: [requireAccessType(...SUPPLIER_TYPES), requireAnyPermission('inquiries.respond')],
    schema: {
      params: inquiryResponseParamsSchema,
      body: responseBodySchema,
    },
  }, ctrl.updateResponse);

  // Withdraw a response (soft — status becomes WITHDRAWN).
  fastify.post('/:id/responses/:responseId/withdraw', {
    preHandler: [requireAccessType(...SUPPLIER_TYPES), requireAnyPermission('inquiries.respond')],
    schema: {
      params: inquiryResponseParamsSchema,
      body: withdrawResponseBodySchema,
    },
  }, ctrl.withdrawResponse);

  // Upload a file attachment to a response (multipart/form-data).
  fastify.post('/:id/responses/:responseId/attachments', {
    preHandler: [requireAccessType(...SUPPLIER_TYPES), requireAnyPermission('inquiries.respond')],
    schema: {
      params: inquiryResponseParamsSchema,
      consumes: ['multipart/form-data'],
    },
  }, ctrl.uploadResponseAttachment);

  // Delete a response attachment.
  fastify.delete('/:id/responses/:responseId/attachments/:attachmentId', {
    preHandler: [requireAccessType(...SUPPLIER_TYPES), requireAnyPermission('inquiries.respond')],
    schema: { params: inquiryResponseAttachmentParamsSchema },
  }, ctrl.deleteResponseAttachment);

}


module.exports = inquiryRoutes;
