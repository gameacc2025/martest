const ctrl = require('./category.controller');
const { requireAccessType, requirePermission } = require('../../middlewares/rbac');

// Category management is a STAFF-only domain (no COMPANY/CUSTOMER role ever
// holds categories.* permissions in seed.js), same boundary used by products.
const STAFF_ONLY = ['STAFF'];

async function categoryRoutes(fastify) {
  // ── Public marketplace routes (no auth) ─────────────────────
  // Anonymous and logged-in visitors alike see ACTIVE categories only.
  // Admin/staff management listing must NOT use these — it uses the
  // authenticated GET /manage route below so it can see inactive ones too
  // (same split used by products: public GET / vs authenticated /my-products).
  fastify.get('/', ctrl.list);
  fastify.get('/:id', ctrl.getOne);
  fastify.get('/:id/products', ctrl.getProducts);
  fastify.get('/:id/subcategories', ctrl.listSubcategories);
  fastify.get('/:id/subcategories/:subId', ctrl.getSubcategory);

  // ── Authenticated routes ────────────────────────────────────
  // Wrapped in an encapsulated child scope so the auth hook only
  // applies to these routes, not the public GET routes above.
  fastify.register(async (authenticated) => {
    authenticated.addHook('onRequest', authenticated.authenticate);

    // IMPORTANT: /manage MUST be registered before /:id-style routes above
    // don't conflict since this is a distinct literal path, but keep it here
    // for readability next to the other authenticated routes.
    authenticated.get('/manage', {
      preHandler: [requireAccessType(...STAFF_ONLY), requirePermission('categories.read')],
      schema: { summary: 'List all categories (including inactive) for management', tags: ['Categories'] },
    }, ctrl.listForManagement);

    // Was hardcoded to requireRole('SUPER_ADMIN'), which silently ignored
    // the categories.* permissions already granted to ADMIN in seed.js —
    // an ADMIN user always got 403 here despite holding the permission.
    // Permission is now the actual gate; SUPER_ADMIN still passes via its
    // wildcard bypass in requirePermission.
    authenticated.post('/', { preHandler: [requireAccessType(...STAFF_ONLY), requirePermission('categories.create')] }, ctrl.create);
    authenticated.patch('/:id', { preHandler: [requireAccessType(...STAFF_ONLY), requirePermission('categories.update')] }, ctrl.update);
    authenticated.delete('/:id', { preHandler: [requireAccessType(...STAFF_ONLY), requirePermission('categories.delete')] }, ctrl.remove);

    authenticated.post('/:id/subcategories', { preHandler: [requireAccessType(...STAFF_ONLY), requirePermission('categories.create')] }, ctrl.createSubcategory);
    authenticated.patch('/:id/subcategories/:subId', { preHandler: [requireAccessType(...STAFF_ONLY), requirePermission('categories.update')] }, ctrl.updateSubcategory);
    authenticated.delete('/:id/subcategories/:subId', { preHandler: [requireAccessType(...STAFF_ONLY), requirePermission('categories.delete')] }, ctrl.removeSubcategory);
  });
}

module.exports = categoryRoutes;