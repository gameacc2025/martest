const ctrl = require('./product.controller');
// Use the CENTRAL, two-layer RBAC middleware instead of ad-hoc guards.
//   - requireAccessType(...types) → strict app-context boundary (STAFF | COMPANY | CUSTOMER)
//   - requirePermission(...perms)  → fine-grained permission within that context
// SUPER_ADMIN grants a permission override only in STAFF context; it never
// bypasses requireAccessType or turns a COMPANY/CUSTOMER session into STAFF.
const { requireAccessType, requirePermission } = require('../../middlewares/rbac');

// Product management is a COMPANY + STAFF concern. CUSTOMER is buyer-only
// (Architecture Decision AD-1) and must never reach management routes.
const MANAGE_TYPES = ['COMPANY', 'STAFF'];
// Approval/rejection/hide/archive/restore are STAFF-only. Publishing is
// allowed to STAFF with products.publish and to the owning COMPANY after
// STAFF approval; service-level checks enforce ownership and approval state.
const STAFF_ONLY = ['STAFF'];


const productStatuses = ['DRAFT', 'PENDING_REVIEW', 'APPROVED', 'REJECTED', 'PUBLISHED', 'HIDDEN', 'ARCHIVED'];
const productVisibilities = ['PUBLIC', 'PRIVATE', 'COMPANY_ONLY'];

const idParamSchema = {
  type: 'object',
  required: ['id'],
  properties: { id: { type: 'integer', minimum: 1 } },
};

const imageParamSchema = {
  type: 'object',
  required: ['id', 'imageId'],
  properties: { id: { type: 'integer', minimum: 1 }, imageId: { type: 'integer', minimum: 1 } },
};

const documentParamSchema = {
  type: 'object',
  required: ['id', 'documentId'],
  properties: { id: { type: 'integer', minimum: 1 }, documentId: { type: 'integer', minimum: 1 } },
};

const productBodyProperties = {
  title: { type: 'string', minLength: 1, maxLength: 255 },
  shortDescription: { type: 'string' },
  description: { type: 'string' },
  sku: { type: 'string', maxLength: 100 },
  brand: { type: 'string', maxLength: 100 },
  model: { type: 'string', maxLength: 100 },
  specifications: { type: 'object', additionalProperties: true },
  status: { type: 'string', enum: productStatuses },
  visibility: { type: 'string', enum: productVisibilities },
  isFeatured: { type: 'boolean' },
  companyId: { type: 'integer', minimum: 1 },
  categoryId: { type: 'integer', minimum: 1 },
  subcategoryId: { type: 'integer', minimum: 1 },
  priceTiers: {
    type: 'array',
    items: {
      type: 'object',
      required: ['minQuantity', 'price'],
      additionalProperties: false,
      properties: {
        minQuantity: { type: 'integer', minimum: 1 },
        maxQuantity: { type: 'integer', minimum: 1 },
        price: { type: 'number', minimum: 0 },
        unit: { type: 'string' },
        validFrom: { type: 'string', format: 'date-time' },
        validTo: { type: 'string', format: 'date-time' },
      },
    },
  },
};

const createProductSchema = {
  body: {
    type: 'object',
    required: ['title', 'categoryId', 'subcategoryId'],
    additionalProperties: false,
    properties: productBodyProperties,
  },
};

const updateProductSchema = {
  params: idParamSchema,
  body: {
    type: 'object',
    minProperties: 1,
    additionalProperties: false,
    // `changeReason` is edit-only: it's recorded in the product status history
    // (see updateProduct) and is not a Product column, so the service strips it
    // before persisting. It is intentionally NOT part of the create schema.
    properties: {
      ...productBodyProperties,
      priceTiers: {
        type: 'array',
        items: {
          type: 'object',
          required: ['minQuantity', 'price'],
          additionalProperties: false,
          properties: {
            id: { type: 'integer', minimum: 1 },
            minQuantity: { type: 'integer', minimum: 1 },
            maxQuantity: { anyOf: [{ type: 'integer', minimum: 1 }, { type: 'null' }] },
            price: { type: 'number', minimum: 0 },
            unit: { anyOf: [{ type: 'string' }, { type: 'null' }] },
            validFrom: { type: 'string', format: 'date-time' },
            validTo: { type: 'string', format: 'date-time' },
          },
        },
      },
      changeReason: { type: 'string', maxLength: 2000 },
    },
  },
};


const priceTierBodySchema = {
  type: 'object',
  required: ['minQuantity', 'price'],
  additionalProperties: false,
  properties: {
    minQuantity: { type: 'integer', minimum: 1 },
    maxQuantity: { type: 'integer', minimum: 1 },
    price: { type: 'number', minimum: 0 },
    unit: { type: 'string' },
    validFrom: { type: 'string', format: 'date-time' },
    validTo: { type: 'string', format: 'date-time' },
  },
};

const sortImagesSchema = {
  params: idParamSchema,
  body: {
    type: 'object',
    required: ['images'],
    additionalProperties: false,
    properties: {
      images: {
        type: 'array',
        minItems: 1,
        items: {
          type: 'object',
          required: ['id', 'sortOrder'],
          additionalProperties: false,
          properties: {
            id: { type: 'integer', minimum: 1 },
            sortOrder: { type: 'integer', minimum: 0 },
          },
        },
      },
    },
  },
};

const statusActionSchema = {
  params: idParamSchema,
  body: {
    type: 'object',
    additionalProperties: false,
    properties: { comment: { type: 'string', maxLength: 2000 } },
  },
};

async function productRoutes(fastify) {
  // ── Public marketplace routes (no auth) ────────────────────
  // Concept #1: the PUBLIC marketplace. Anonymous and logged-in visitors alike
  // see only PUBLISHED + PUBLIC products across ALL companies here. Dashboard /
  // management listings must NOT use these routes — they use the authenticated
  // GET /my-products endpoint below so they can see every status.
  fastify.get('/', ctrl.list);
  fastify.get('/:id/price-history', { schema: { params: idParamSchema, summary: 'Get complete public retail price history for charting', tags: ['Products'] } }, ctrl.getPriceHistory);
  fastify.get('/:id', { schema: { params: idParamSchema } }, ctrl.getOne);

  // ── Authenticated routes ───────────────────────────────────
  // Wrapped in an encapsulated child scope so the auth hook only
  // applies to these routes, not the public GET routes above.
  fastify.register(async (authenticated) => {
    authenticated.addHook('onRequest', authenticated.authenticate);

    // IMPORTANT: /my-products MUST be before /:id to avoid route conflict
    authenticated.get('/my-products', {
      preHandler: [requireAccessType(...MANAGE_TYPES), requirePermission('products.read')],
      schema: { summary: 'List products available to the current management user', tags: ['Products'] },
    }, ctrl.myProducts);

    // Authenticated single-product fetch for MANAGEMENT/edit. Unlike the public
    // GET /:id (which only reveals PUBLISHED products to anonymous callers),
    // this passes request.user to the service so a company user can load their
    // own product in ANY status (DRAFT/PENDING_REVIEW/REJECTED/...) and
    // SUPER_ADMIN can load any product. Ownership is enforced in the service.
    authenticated.get('/:id/manage', {
      preHandler: [requireAccessType(...MANAGE_TYPES), requirePermission('products.read')],
      schema: { params: idParamSchema, summary: 'Get a product for management/edit', tags: ['Products'] },
    }, ctrl.getOne);

    authenticated.get('/:id/history', {
      preHandler: [requireAccessType(...MANAGE_TYPES), requirePermission('products.read')],
      schema: { params: idParamSchema, summary: 'Get product change history', tags: ['Products'] },
    }, ctrl.getHistory);

    // Immutable audit trail. RBAC is enforced here and tenant ownership again
    // inside the service to protect direct/internal call paths.
    authenticated.get('/:id/activity', {
      preHandler: [requireAccessType(...MANAGE_TYPES), requirePermission('products.read')],
      schema: { params: idParamSchema, summary: 'Get product activity log', tags: ['Products'] },
    }, ctrl.getActivity);

    // ── Core product CRUD ───────────────────────────────────
    // Two-layer RBAC: domain boundary (COMPANY|STAFF) + fine-grained
    // permission. COMPANY ownership stays enforced inside the service;
    // STAFF may cross company boundaries only with the exact operation permission,
    // which is also checked by the service for direct/internal call paths.
    authenticated.post('/', {
      preHandler: [requireAccessType(...MANAGE_TYPES), requirePermission('products.create')],
      schema: createProductSchema,
    }, ctrl.create);
    authenticated.patch('/:id', {
      preHandler: [requireAccessType(...MANAGE_TYPES), requirePermission('products.update')],
      schema: updateProductSchema,
    }, ctrl.update);
    authenticated.delete('/:id', {
      preHandler: [requireAccessType(...MANAGE_TYPES), requirePermission('products.delete')],
      schema: { params: idParamSchema },
    }, ctrl.remove);

    // ── Workflow transitions ─────────────────────────────────
    // submit-review is the COMPANY hand-off; approve/reject/hide/archive/restore
    // remain STAFF moderation actions. Publication is allowed to the owning
    // COMPANY after STAFF approval, and is gated by products.publish.
    authenticated.post('/:id/submit-review', {
      preHandler: [requireAccessType(...MANAGE_TYPES), requirePermission('products.submit_review')],
      schema: statusActionSchema,
    }, ctrl.submitReview);
    authenticated.post('/:id/approve', {
      preHandler: [requireAccessType(...STAFF_ONLY), requirePermission('products.approve')],
      schema: statusActionSchema,
    }, ctrl.approve);
    authenticated.post('/:id/reject', {
      preHandler: [requireAccessType(...STAFF_ONLY), requirePermission('products.reject')],
      schema: statusActionSchema,
    }, ctrl.reject);
    authenticated.post('/:id/publish', {
      preHandler: [requireAccessType(...MANAGE_TYPES), requirePermission('products.publish')],
      schema: statusActionSchema,
    }, ctrl.publish);
    authenticated.post('/:id/hide', {
      preHandler: [requireAccessType(...STAFF_ONLY), requirePermission('products.hide')],
      schema: statusActionSchema,
    }, ctrl.hide);
    authenticated.post('/:id/archive', {
      preHandler: [requireAccessType(...STAFF_ONLY), requirePermission('products.archive')],
      schema: statusActionSchema,
    }, ctrl.archive);
    authenticated.post('/:id/restore-draft', {
      preHandler: [requireAccessType(...STAFF_ONLY), requirePermission('products.review')],
      schema: statusActionSchema,
    }, ctrl.restoreDraft);

    // ── Price tiers ──────────────────────────────────────────
    // No dedicated price permission exists in the catalogue; price tiers are
    // part of editing a product, so they are gated by products.update.
    authenticated.post('/:id/price-tiers', {
      preHandler: [requireAccessType(...MANAGE_TYPES), requirePermission('products.update')],
      schema: { params: idParamSchema, body: priceTierBodySchema },
    }, ctrl.addPriceTier);
    authenticated.patch('/:id/price-tiers/:tierId', {
      preHandler: [requireAccessType(...MANAGE_TYPES), requirePermission('products.update')],
      schema: {
        params: {
          type: 'object',
          required: ['id', 'tierId'],
          properties: { id: { type: 'integer', minimum: 1 }, tierId: { type: 'integer', minimum: 1 } },
        },
        body: { ...priceTierBodySchema, required: [], minProperties: 1 },
      },
    }, ctrl.updatePriceTier);
    authenticated.delete('/:id/price-tiers/:tierId', {
      preHandler: [requireAccessType(...MANAGE_TYPES), requirePermission('products.update')],
      schema: {
        params: {
          type: 'object',
          required: ['id', 'tierId'],
          properties: { id: { type: 'integer', minimum: 1 }, tierId: { type: 'integer', minimum: 1 } },
        },
      },
    }, ctrl.deletePriceTier);

    // ── Media: images ────────────────────────────────────────
    // Gated by product_images.* permissions (COMPANY_USER can create/update
    // but not delete — see seed ROLE_PERMISSIONS). Ownership is still enforced
    // inside the service via assertCanManageProductById().
    authenticated.post('/:id/images', {
      preHandler: [requireAccessType(...MANAGE_TYPES), requirePermission('product_images.create')],
      schema: { params: idParamSchema, consumes: ['multipart/form-data'] },
    }, ctrl.uploadImage);
    authenticated.delete('/:id/images/:imageId', {
      preHandler: [requireAccessType(...MANAGE_TYPES), requirePermission('product_images.delete')],
      schema: { params: imageParamSchema },
    }, ctrl.deleteImage);
    authenticated.patch('/:id/images/:imageId/primary', {
      preHandler: [requireAccessType(...MANAGE_TYPES), requirePermission('product_images.update')],
      schema: { params: imageParamSchema },
    }, ctrl.setPrimaryImage);
    authenticated.patch('/:id/images/sort', {
      preHandler: [requireAccessType(...MANAGE_TYPES), requirePermission('product_images.update')],
      schema: sortImagesSchema,
    }, ctrl.sortImages);

    // ── Media: documents ─────────────────────────────────────
    authenticated.post('/:id/documents', {
      preHandler: [requireAccessType(...MANAGE_TYPES), requirePermission('product_documents.create')],
      schema: { params: idParamSchema, consumes: ['multipart/form-data'] },
    }, ctrl.uploadDocument);
    authenticated.delete('/:id/documents/:documentId', {
      preHandler: [requireAccessType(...MANAGE_TYPES), requirePermission('product_documents.delete')],
      schema: { params: documentParamSchema },
    }, ctrl.deleteDocument);

  });

}

module.exports = productRoutes;
