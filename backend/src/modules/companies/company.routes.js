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

function companyRouteAccess({ staffOnly = false } = {}) {
  return async function enforceCompanyRouteAccess(request, reply) {
    const user = request.user;
    if (!user) {
      return reply.code(401).send({ error: true, code: 'UNAUTHORIZED', message: 'Authentication required.' });
    }
    // AccessProfile.type, not SUPER_ADMIN role membership, selects the app context.
    if (user.accessType === 'STAFF') return;
    const callerCompanyId = user.companyId ?? user.accessProfile?.companyId;
    if (!staffOnly && user.accessType === 'COMPANY' &&
        Number(request.params?.id) > 0 &&
        Number(request.params.id) === Number(callerCompanyId)) {
      return;
    }
    return reply.code(403).send({
      error: true,
      code: 'ACCESS_TYPE_FORBIDDEN',
      message: staffOnly
        ? 'This company-management action requires STAFF context.'
        : 'COMPANY users may access only their own company.',
    });
  };
}

async function companyRoutes(fastify) {
  // All routes require authentication
  fastify.addHook('onRequest', fastify.authenticate);

  // ── Read routes ──────────────────────────────────────────
  fastify.get('/', { preHandler: [companyRouteAccess({ staffOnly: true }), requirePermission('companies.read')] }, ctrl.list);
  fastify.get('/:id', { preHandler: [companyRouteAccess(), requireAnyPermission('companies.read', 'company_profile.read')] }, ctrl.getOne);
  fastify.get('/:id/products', { preHandler: [companyRouteAccess(), requirePermission('companies.read')] }, ctrl.getProducts);
  fastify.get('/:id/settings', { preHandler: [companyRouteAccess({ staffOnly: true }), requireAnyPermission('companies.read', 'companies.manage_settings')] }, ctrl.getSettings);
  fastify.get('/:id/statistics', { preHandler: [companyRouteAccess(), requirePermission('companies.view_statistics')] }, ctrl.getStatistics);

  // ── Create / Update / Delete ─────────────────────────────
  fastify.post('/', { preHandler: [companyRouteAccess({ staffOnly: true }), requirePermission('companies.create')] }, ctrl.create);
  fastify.patch('/:id', { preHandler: [companyRouteAccess(), requireAnyPermission('companies.update', 'company_profile.update')] }, ctrl.update);
  fastify.delete('/:id', { preHandler: [companyRouteAccess({ staffOnly: true }), requirePermission('companies.delete')] }, ctrl.remove);
  fastify.patch('/:id/restore', { preHandler: [companyRouteAccess({ staffOnly: true }), requirePermission('companies.restore')] }, ctrl.restore);

  // ── Status management ───────────────────────────────────
  fastify.patch('/:id/status', { preHandler: [companyRouteAccess({ staffOnly: true }), requireAnyPermission('companies.activate', 'companies.deactivate')] }, ctrl.changeStatus);
  fastify.patch('/:id/verify', { preHandler: [companyRouteAccess({ staffOnly: true }), requirePermission('companies.update')] }, ctrl.toggleVerify);
  fastify.patch('/:id/logo', { preHandler: [companyRouteAccess(), requireAnyPermission('companies.update', 'company_profile.update')] }, ctrl.updateLogo);

  // ── Settings management ─────────────────────────────────
  fastify.patch('/:id/settings', { preHandler: [companyRouteAccess({ staffOnly: true }), requirePermission('companies.manage_settings')] }, ctrl.updateSettings);
}

module.exports = companyRoutes;