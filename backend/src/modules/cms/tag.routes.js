const ctrl = require('./tag.controller');
const { requireExactAccessType, requirePermission } = require('../../middlewares/rbac');
const { tagProperties } = require('./tag.schemas');

const idParams = { type: 'object', required: ['id'], properties: { id: { type: 'integer', minimum: 1 } } };

const adminQuery = {
  type: 'object',
  properties: {
    page: { type: 'integer', minimum: 1, default: 1 },
    limit: { type: 'integer', minimum: 1, maximum: 100, default: 50 },
    search: { type: 'string' },
  },
};

const createBody = { type: 'object', required: ['name'], additionalProperties: false, properties: tagProperties };
const updateBody = { type: 'object', minProperties: 1, additionalProperties: false, properties: tagProperties };

async function tagRoutes(fastify) {
  // Public routes
  fastify.get('/', { schema: { tags: ['CMS - Tags (Public)'], summary: 'List article tags' } }, ctrl.listPublic);

  // Admin routes
  fastify.get('/manage', {
    onRequest: [fastify.authenticate],
    preHandler: [requireExactAccessType('STAFF'), requirePermission('cms.tags.read')],
    schema: { tags: ['CMS - Tags (Admin)'], summary: 'List tags for admin', querystring: adminQuery },
  }, ctrl.listAdmin);

  fastify.get('/manage/:id', {
    onRequest: [fastify.authenticate],
    preHandler: [requireExactAccessType('STAFF'), requirePermission('cms.tags.read')],
    schema: { tags: ['CMS - Tags (Admin)'], summary: 'Get tag by ID for admin', params: idParams },
  }, ctrl.getAdmin);

  fastify.post('/manage', {
    onRequest: [fastify.authenticate],
    preHandler: [requireExactAccessType('STAFF'), requirePermission('cms.tags.create')],
    schema: { tags: ['CMS - Tags (Admin)'], summary: 'Create tag', body: createBody },
  }, ctrl.create);

  fastify.patch('/manage/:id', {
    onRequest: [fastify.authenticate],
    preHandler: [requireExactAccessType('STAFF'), requirePermission('cms.tags.update')],
    schema: { tags: ['CMS - Tags (Admin)'], summary: 'Update tag', params: idParams, body: updateBody },
  }, ctrl.update);

  fastify.delete('/manage/:id', {
    onRequest: [fastify.authenticate],
    preHandler: [requireExactAccessType('STAFF'), requirePermission('cms.tags.delete')],
    schema: { tags: ['CMS - Tags (Admin)'], summary: 'Delete tag', params: idParams },
  }, ctrl.deleteTag);
}

module.exports = tagRoutes;