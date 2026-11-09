const ctrl = require('./faq.controller');
const { requireExactAccessType, requirePermission } = require('../../middlewares/rbac');
const { faqProperties } = require('./faq.schemas');

const idParams = { type: 'object', required: ['id'], properties: { id: { type: 'integer', minimum: 1 } } };

const publicQuery = {
  type: 'object',
  properties: {
    category: { type: 'string' },
  },
};

const adminQuery = {
  type: 'object',
  properties: {
    page: { type: 'integer', minimum: 1, default: 1 },
    limit: { type: 'integer', minimum: 1, maximum: 100, default: 50 },
    search: { type: 'string' },
    category: { type: 'string' },
    isActive: { type: 'boolean' },
  },
};

const createBody = { type: 'object', required: ['question', 'answer'], additionalProperties: false, properties: faqProperties };
const updateBody = { type: 'object', minProperties: 1, additionalProperties: false, properties: faqProperties };

async function faqRoutes(fastify) {
  // Public routes
  fastify.get('/', { schema: { tags: ['CMS - FAQ (Public)'], summary: 'List published FAQs', querystring: publicQuery } }, ctrl.listPublic);
  fastify.get('/categories', { schema: { tags: ['CMS - FAQ (Public)'], summary: 'List FAQ categories' } }, ctrl.listCategories);

  // Admin routes
  fastify.get('/manage', {
    onRequest: [fastify.authenticate],
    preHandler: [requireExactAccessType('STAFF'), requirePermission('cms.faqs.read')],
    schema: { tags: ['CMS - FAQ (Admin)'], summary: 'List FAQs for admin', querystring: adminQuery },
  }, ctrl.listAdmin);

  fastify.get('/manage/:id', {
    onRequest: [fastify.authenticate],
    preHandler: [requireExactAccessType('STAFF'), requirePermission('cms.faqs.read')],
    schema: { tags: ['CMS - FAQ (Admin)'], summary: 'Get FAQ by ID for admin', params: idParams },
  }, ctrl.getAdmin);

  fastify.post('/manage', {
    onRequest: [fastify.authenticate],
    preHandler: [requireExactAccessType('STAFF'), requirePermission('cms.faqs.create')],
    schema: { tags: ['CMS - FAQ (Admin)'], summary: 'Create FAQ', body: createBody },
  }, ctrl.create);

  fastify.patch('/manage/:id', {
    onRequest: [fastify.authenticate],
    preHandler: [requireExactAccessType('STAFF'), requirePermission('cms.faqs.update')],
    schema: { tags: ['CMS - FAQ (Admin)'], summary: 'Update FAQ', params: idParams, body: updateBody },
  }, ctrl.update);

  fastify.delete('/manage/:id', {
    onRequest: [fastify.authenticate],
    preHandler: [requireExactAccessType('STAFF'), requirePermission('cms.faqs.delete')],
    schema: { tags: ['CMS - FAQ (Admin)'], summary: 'Delete FAQ', params: idParams },
  }, ctrl.deleteFaq);
}

module.exports = faqRoutes;