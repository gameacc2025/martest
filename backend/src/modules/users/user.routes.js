// =============================================================
// User Routes — CRUD + access management
//
// Route map:
//   GET    /api/v1/users          → list users (users.read)
//   GET    /api/v1/users/:id      → single user (users.read)
//   POST   /api/v1/users          → create user (users.create)
//   PATCH  /api/v1/users/:id      → update user (users.update)
//   PATCH  /api/v1/users/:id/access → set roles & permissions (users.update)
//   DELETE /api/v1/users/:id      → delete user (users.delete)
// =============================================================

const ctrl = require('./user.controller');
const { requirePermission, requireAnyPermission } = require('../../middlewares/rbac');
const { createUserBody, updateUserBody, setAccessBody, setAccessActiveBody, moveCompanyBody } = require('./user.schemas');


async function userRoutes(fastify) {

  fastify.get('/', {
    onRequest: [fastify.authenticate],
    preHandler: [requirePermission('users.read')],
    schema: { summary: 'List users (with pagination & search)', tags: ['Users'] },
  }, ctrl.list);

  fastify.post('/', {
    onRequest: [fastify.authenticate],
    preHandler: [requirePermission('users.create')],
    schema: {
      summary: 'Create a new user',
      tags: ['Users'],
      body: createUserBody,
    },
  }, ctrl.create);

  fastify.get('/:id', {
    onRequest: [fastify.authenticate],
    preHandler: [requirePermission('users.read')],
    schema: {
      summary: 'Get user by ID',
      tags: ['Users'],
      params: { type: 'object', required: ['id'], properties: { id: { type: 'integer', minimum: 1 } } },
    },
  }, ctrl.getById);

  fastify.patch('/:id', {
    onRequest: [fastify.authenticate],
    preHandler: [requirePermission('users.update')],
    schema: {
      summary: 'Update user profile',
      tags: ['Users'],
      params: { type: 'object', required: ['id'], properties: { id: { type: 'integer', minimum: 1 } } },
      body: updateUserBody,
    },
  }, ctrl.update);

  fastify.patch('/:id/access', {
    onRequest: [fastify.authenticate],
    // تخصیص نقش نیازمند دسترسی اختصاصی users.assign_roles است
    preHandler: [requirePermission('users.assign_roles')],
    schema: {
      summary: 'Set user roles and permissions (full replace)',
      tags: ['Users'],
      params: { type: 'object', required: ['id'], properties: { id: { type: 'integer', minimum: 1 } } },
      body: setAccessBody,
    },
  }, ctrl.setAccess);

  fastify.patch('/:id/access-active', {
    onRequest: [fastify.authenticate],
    preHandler: [requirePermission('users.update')],
    schema: {
      summary: 'Activate/deactivate AccessProfile panel access',
      tags: ['Users'],
      params: { type: 'object', required: ['id'], properties: { id: { type: 'integer', minimum: 1 } } },
      body: setAccessActiveBody,
    },
  }, ctrl.setAccessActive);

  fastify.patch('/:id/company', {
    onRequest: [fastify.authenticate],
    // Moving a user between companies is a privileged, admin-only action.
    preHandler: [requirePermission('users.update')],
    schema: {
      summary: 'Move a user to a different company (SUPER_ADMIN only)',
      tags: ['Users'],
      params: { type: 'object', required: ['id'], properties: { id: { type: 'integer', minimum: 1 } } },
      body: moveCompanyBody,
    },
  }, ctrl.moveCompany);

  fastify.delete('/:id', {
    onRequest: [fastify.authenticate],
    preHandler: [requirePermission('users.delete')],
    schema: {
      summary: 'Delete a user',
      tags: ['Users'],
      params: { type: 'object', required: ['id'], properties: { id: { type: 'integer', minimum: 1 } } },
    },
  }, ctrl.remove);
}

module.exports = userRoutes;
