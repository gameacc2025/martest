const ctrl = require('./category.controller');
const { requireRole } = require('../../middlewares/rbac');

async function categoryRoutes(fastify) {
  // ── Public routes (no auth) ────────────────────────────────
  fastify.get('/', ctrl.list);
  fastify.get('/:id', ctrl.getOne);
  fastify.get('/:id/products', ctrl.getProducts);
  fastify.get('/:id/subcategories', ctrl.listSubcategories);
  fastify.get('/:id/subcategories/:subId', ctrl.getSubcategory);

  // ── Authenticated routes (write operations) ────────────────
  // Wrapped in an encapsulated child scope so the auth hook only
  // applies to these routes, not the public GET routes above.
  fastify.register(async (authenticated) => {
    authenticated.addHook('onRequest', authenticated.authenticate);

    authenticated.post('/', { preHandler: [requireRole('SUPER_ADMIN')] }, ctrl.create);
    authenticated.patch('/:id', { preHandler: [requireRole('SUPER_ADMIN')] }, ctrl.update);
    authenticated.delete('/:id', { preHandler: [requireRole('SUPER_ADMIN')] }, ctrl.remove);

    authenticated.post('/:id/subcategories', { preHandler: [requireRole('SUPER_ADMIN')] }, ctrl.createSubcategory);
    authenticated.patch('/:id/subcategories/:subId', { preHandler: [requireRole('SUPER_ADMIN')] }, ctrl.updateSubcategory);
    authenticated.delete('/:id/subcategories/:subId', { preHandler: [requireRole('SUPER_ADMIN')] }, ctrl.removeSubcategory);
  });
}

module.exports = categoryRoutes;
