// =============================================================
// Permission Routes
//
// Route map:
//   GET    /api/v1/permissions           → list permissions
//   GET    /api/v1/permissions/:id       → get permission by ID
//   POST   /api/v1/permissions           → create permission
//   PATCH  /api/v1/permissions/:id       → update permission
//   DELETE /api/v1/permissions/:id       → delete permission
// =============================================================

const ctrl = require('./permission.controller');
const { requirePermission } = require('../../middlewares/rbac');
const { idParam, createPermissionBody, updatePermissionBody } = require('./permission.schemas');

async function permissionRoutes(fastify) {
  fastify.get('/', {
    onRequest: [fastify.authenticate],
    preHandler: [requirePermission('permissions.read')],
    schema: {
      summary: 'List permissions',
      tags: ['Permissions'],
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'integer', minimum: 1 },
          limit: { type: 'integer', minimum: 1, maximum: 100 },
          search: { type: 'string' },
          group: { type: 'string' },
          grouped: { type: 'boolean' },
        },
      },
    },
  }, ctrl.list);

  fastify.get('/:id', {
    onRequest: [fastify.authenticate],
    preHandler: [requirePermission('permissions.read')],
    schema: {
      summary: 'Get permission by ID',
      tags: ['Permissions'],
      params: idParam,
    },
  }, ctrl.getById);

  fastify.post('/', {
    onRequest: [fastify.authenticate],
    preHandler: [requirePermission('permissions.create')],
    schema: {
      summary: 'Create permission',
      tags: ['Permissions'],
      body: createPermissionBody,
    },
  }, ctrl.create);

  fastify.patch('/:id', {
    onRequest: [fastify.authenticate],
    preHandler: [requirePermission('permissions.update')],
    schema: {
      summary: 'Update permission',
      tags: ['Permissions'],
      params: idParam,
      body: updatePermissionBody,
    },
  }, ctrl.update);

  fastify.delete('/:id', {
    onRequest: [fastify.authenticate],
    preHandler: [requirePermission('permissions.delete')],
    schema: {
      summary: 'Delete permission',
      tags: ['Permissions'],
      params: idParam,
    },
  }, ctrl.remove);
}

module.exports = permissionRoutes;