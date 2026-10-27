// =============================================================
// Role Routes — Role management only
//
// Permissions are now managed via /api/v1/permissions (see modules/permissions).
//
// Permissions used (from the seed catalogue):
//   roles.read   → list + view roles
//   roles.create → create role
//   roles.update → update role (+ assign permissions to it)
//   roles.delete → delete role (non-system only)
//
// Route map:
//   GET    /api/v1/roles         → list roles           (roles.read)
//   GET    /api/v1/roles/:id     → single role          (roles.read)
//   POST   /api/v1/roles         → create role          (roles.create)
//   PATCH  /api/v1/roles/:id     → update role          (roles.update)
//   DELETE /api/v1/roles/:id     → delete role          (roles.delete)
// =============================================================

const ctrl = require('./role.controller');
const { requirePermission, requireAnyPermission, requireExactAccessType } = require('../../middlewares/rbac');
const { createRoleBody, updateRoleBody } = require('./role.schemas');

const idParam = { type: 'object', required: ['id'], properties: { id: { type: 'integer', minimum: 1 } } };

async function roleRoutes(fastify) {
  fastify.get('/', {
    onRequest: [fastify.authenticate],
    preHandler: [requireExactAccessType('STAFF'), requirePermission('roles.read')],
    schema: { summary: 'List all roles with their permissions', tags: ['Roles'] },
  }, ctrl.listRoles);

  // Not role management — lets a caller (e.g. COMPANY_MANAGER, who lacks
  // roles.read) pick a role while creating/editing a user in their own
  // domain. Must be registered before GET /:id.
  fastify.get('/assignable', {
    onRequest: [fastify.authenticate],
    preHandler: [requireExactAccessType('STAFF', 'COMPANY'), requireAnyPermission('users.create', 'users.assign_roles')],
    schema: { summary: 'List roles assignable by the caller (scoped to their own accessType)', tags: ['Roles'] },
  }, ctrl.listAssignableRoles);

  fastify.post('/', {
    onRequest: [fastify.authenticate],
    preHandler: [requireExactAccessType('STAFF'), requirePermission('roles.create')],
    schema: { summary: 'Create a new role', tags: ['Roles'], body: createRoleBody },
  }, ctrl.createRole);

  fastify.get('/:id', {
    onRequest: [fastify.authenticate],
    preHandler: [requireExactAccessType('STAFF'), requirePermission('roles.read')],
    schema: { summary: 'Get role by ID', tags: ['Roles'], params: idParam },
  }, ctrl.getRole);

  fastify.patch('/:id', {
    onRequest: [fastify.authenticate],
    preHandler: [requireExactAccessType('STAFF'), requirePermission('roles.update')],
    schema: { summary: 'Update role', tags: ['Roles'], params: idParam, body: updateRoleBody },
  }, ctrl.updateRole);

  fastify.delete('/:id', {
    onRequest: [fastify.authenticate],
    preHandler: [requireExactAccessType('STAFF'), requirePermission('roles.delete')],
    schema: { summary: 'Delete role (system roles cannot be deleted)', tags: ['Roles'], params: idParam },
  }, ctrl.deleteRole);
}

module.exports = roleRoutes;