// =============================================================
// Company Routes — Permission-based RBAC
//
// All routes require authentication.
// Read routes require: companies.read OR company_profile.read (own)
// Write routes require: companies.create / companies.update / companies.delete
// Status routes require: companies.activate / companies.deactivate
// Settings routes require: companies.manage_settings
// Statistics routes require: companies.view_statistics
// =============================================================

const ctrl = require('./company.controller');
const { requirePermission, requireAnyPermission } = require('../../middlewares/rbac');

async function companyRoutes(fastify) {
  // All routes require authentication
  fastify.addHook('onRequest', fastify.authenticate);

  // ── Read routes ──────────────────────────────────────────
  fastify.get('/', { preHandler: [requirePermission('companies.read')] }, ctrl.list);
  fastify.get('/:id', { preHandler: [requirePermission('companies.read')] }, ctrl.getOne);
  fastify.get('/:id/products', { preHandler: [requirePermission('companies.read')] }, ctrl.getProducts);
  fastify.get('/:id/settings', { preHandler: [requireAnyPermission('companies.read', 'companies.manage_settings')] }, ctrl.getSettings);
  fastify.get('/:id/statistics', { preHandler: [requirePermission('companies.view_statistics')] }, ctrl.getStatistics);

  // ── Create / Update / Delete ─────────────────────────────
  fastify.post('/', { preHandler: [requirePermission('companies.create')] }, ctrl.create);
  fastify.patch('/:id', { preHandler: [requireAnyPermission('companies.update', 'company_profile.update')] }, ctrl.update);
  fastify.delete('/:id', { preHandler: [requirePermission('companies.delete')] }, ctrl.remove);
  fastify.patch('/:id/restore', { preHandler: [requirePermission('companies.restore')] }, ctrl.restore);

  // ── Status management ───────────────────────────────────
  fastify.patch('/:id/status', { preHandler: [requireAnyPermission('companies.activate', 'companies.deactivate')] }, ctrl.changeStatus);
  fastify.patch('/:id/verify', { preHandler: [requirePermission('companies.update')] }, ctrl.toggleVerify);
  fastify.patch('/:id/logo', { preHandler: [requireAnyPermission('companies.update', 'company_profile.update')] }, ctrl.updateLogo);

  // ── Settings management ─────────────────────────────────
  fastify.patch('/:id/settings', { preHandler: [requirePermission('companies.manage_settings')] }, ctrl.updateSettings);
}

module.exports = companyRoutes;