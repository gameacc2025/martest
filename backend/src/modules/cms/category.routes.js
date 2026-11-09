const ctrl = require('./category.controller');
const { requireExactAccessType, requirePermission } = require('../../middlewares/rbac');
const { categoryProperties } = require('./category.schemas');

const idParams = { type: 'object', required: ['id'], properties: { id: { type: 'integer', minimum: 1 } } };

const publicQuery = {
  type: 'object',
  properties: {
    activeOnly: { type: 'boolean', default: true },
  },
};

const adminQuery = {
  type: 'object',
  properties: {
    page: { type: 'integer', minimum: 1, default: 1 },
    limit: { type: 'integer', minimum: 1, maximum: 100, default: 50 },
    search: { type: 'string' },
    isActive: { type: 'boolean' },
  },
};

const createBody = { type: 'object', required: ['name'], additionalProperties: false, properties: categoryProperties };
const updateBody = { type: 'object', minProperties: 1, additionalProperties: false, properties: categoryProperties };

async function categoryRoutes(fastify) {
  // Public routes
  fastify.get('/', { schema: { tags: ['CMS - Categories (Public)'], summary: 'List article categories', querystring: publicQuery } }, ctrl.listPublic);

  // Admin routes
  fastify.get('/manage', {
    onRequest: [fastify.authenticate],
    preHandler: [requireExactAccessType('STAFF'), requirePermission('cms.categories.read')],
    schema: { tags: ['CMS - Categories (Admin)'], summary: 'List categories for admin', querystring: adminQuery },
  }, ctrl.listAdmin);

  fastify.get('/manage/:id', {
    onRequest: [fastify.authenticate],
    preHandler: [requireExactAccessType('STAFF'), requirePermission('cms.categories.read')],
    schema: { tags: ['CMS - Categories (Admin)'], summary: 'Get category by ID for admin', params: idParams },
  }, ctrl.getAdmin);

  fastify.post('/manage', {
    onRequest: [fastify.authenticate],
    preHandler: [requireExactAccessType('STAFF'), requirePermission('cms.categories.create')],
    schema: { tags: ['CMS - Categories (Admin)'], summary: 'Create category', body: createBody },
  }, ctrl.create);

  fastify.patch('/manage/:id', {
    onRequest: [fastify.authenticate],
    preHandler: [requireExactAccessType('STAFF'), requirePermission('cms.categories.update')],
    schema: { tags: ['CMS - Categories (Admin)'], summary: 'Update category', params: idParams, body: updateBody },
  }, ctrl.update);

  fastify.delete('/manage/:id', {
    onRequest: [fastify.authenticate],
    preHandler: [requireExactAccessType('STAFF'), requirePermission('cms.categories.delete')],
    schema: { tags: ['CMS - Categories (Admin)'], summary: 'Delete category', params: idParams },
  }, ctrl.deleteCategory);
}

module.exports = categoryRoutes;