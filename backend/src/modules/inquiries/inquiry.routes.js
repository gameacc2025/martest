const ctrl = require('./inquiry.controller');
// Priority 1 (RBAC): every protected route must have BOTH authorization layers
//   1. requireAccessType(...) → domain boundary (STAFF | COMPANY | CUSTOMER)
//   2. requireAnyPermission(...) → fine-grained action permission
// SUPER_ADMIN bypasses both layers (handled inside the central middleware).
const { requireAccessType, requireAnyPermission } = require('../../middlewares/rbac');

// Access-type sets, derived from the seed ROLE_PERMISSIONS: the union of the
// domains whose roles hold the permissions required by each route.
//   ALL_TYPES    → read/create flows shared by STAFF, COMPANY and CUSTOMER.
//   MANAGE_TYPES → update/status/respond flows held only by STAFF & COMPANY
//                  (CUSTOMER has no *.update / inquiries.respond permission).
const ALL_TYPES = ['STAFF', 'COMPANY', 'CUSTOMER'];
const MANAGE_TYPES = ['STAFF', 'COMPANY'];

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
  fastify.addHook('onRequest', fastify.authenticate);

  fastify.get('/', {
    preHandler: [requireAccessType(...ALL_TYPES), requireAnyPermission('leads.read', 'inquiries.read')],
    schema: { querystring: listQuerySchema },
  }, ctrl.list);

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


  fastify.patch('/:id/status', {
    preHandler: [requireAccessType(...MANAGE_TYPES), requireAnyPermission('leads.update', 'inquiries.update')],
    schema: { params: inquiryParamsSchema, body: statusBodySchema },
  }, ctrl.changeStatus);

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

  fastify.get('/:id/responses', {
    preHandler: [requireAccessType(...ALL_TYPES), requireAnyPermission('inquiries.read', 'inquiries.respond', 'leads.read')],
    schema: { params: inquiryParamsSchema },
  }, ctrl.listResponses);

  fastify.post('/:id/responses', {
    preHandler: [requireAccessType(...MANAGE_TYPES), requireAnyPermission('inquiries.respond', 'leads.update')],
    schema: {
      params: {
        type: 'object',
        required: ['id'],
        properties: { id: { type: 'integer' } },
      },
      body: responseBodySchema,
    },
  }, ctrl.submitResponse);

  fastify.patch('/:id/responses/:responseId', {
    preHandler: [requireAccessType(...MANAGE_TYPES), requireAnyPermission('inquiries.respond', 'leads.update')],
    schema: {
      params: inquiryResponseParamsSchema,
      body: responseBodySchema,
    },
  }, ctrl.updateResponse);

  // Withdraw a response (soft — status becomes WITHDRAWN).
  fastify.post('/:id/responses/:responseId/withdraw', {
    preHandler: [requireAccessType(...MANAGE_TYPES), requireAnyPermission('inquiries.respond', 'leads.update')],
    schema: {
      params: inquiryResponseParamsSchema,
      body: withdrawResponseBodySchema,
    },
  }, ctrl.withdrawResponse);

  // Upload a file attachment to a response (multipart/form-data).
  fastify.post('/:id/responses/:responseId/attachments', {
    preHandler: [requireAccessType(...MANAGE_TYPES), requireAnyPermission('inquiries.respond', 'leads.update')],
    schema: {
      params: inquiryResponseParamsSchema,
      consumes: ['multipart/form-data'],
    },
  }, ctrl.uploadResponseAttachment);

  // Delete a response attachment.
  fastify.delete('/:id/responses/:responseId/attachments/:attachmentId', {
    preHandler: [requireAccessType(...MANAGE_TYPES), requireAnyPermission('inquiries.respond', 'leads.update')],
    schema: { params: inquiryResponseAttachmentParamsSchema },
  }, ctrl.deleteResponseAttachment);

}


module.exports = inquiryRoutes;