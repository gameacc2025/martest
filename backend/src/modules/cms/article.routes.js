const ctrl = require('./article.controller');
const { requireExactAccessType, requirePermission } = require('../../middlewares/rbac');
const { articleProperties } = require('./article.schemas');

const idParams = { type: 'object', required: ['id'], properties: { id: { type: 'integer', minimum: 1 } } };
const slugParams = { type: 'object', required: ['slug'], properties: { slug: { type: 'string', minLength: 1, maxLength: 220 } } };
const revisionParams = { type: 'object', required: ['id', 'revisionNo'], properties: { id: { type: 'integer', minimum: 1 }, revisionNo: { type: 'integer', minimum: 1 } } };

const publicQuery = {
  type: 'object',
  properties: {
    page: { type: 'integer', minimum: 1, default: 1 },
    limit: { type: 'integer', minimum: 1, maximum: 50, default: 10 },
    category: { type: 'string' },
    tag: { type: 'string' },
    type: { type: 'string', enum: ['NEWS', 'ARTICLE', 'GUIDE'] },
    search: { type: 'string' },
    featured: { type: 'boolean' },
  },
};

const previewTokenParams = { type: 'object', required: ['token'], properties: { token: { type: 'string', minLength: 64, maxLength: 64 } } };

const adminQuery = {
  type: 'object',
  properties: {
    page: { type: 'integer', minimum: 1, default: 1 },
    limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
    search: { type: 'string' },
    status: { type: 'string', enum: ['DRAFT', 'IN_REVIEW', 'SCHEDULED', 'PUBLISHED', 'ARCHIVED'] },
    type: { type: 'string', enum: ['NEWS', 'ARTICLE', 'GUIDE'] },
    authorUserId: { type: 'integer' },
  },
};

const createBody = { type: 'object', required: ['title', 'content'], additionalProperties: false, properties: articleProperties };
const updateBody = { type: 'object', minProperties: 1, additionalProperties: false, properties: articleProperties };
const statusBody = { type: 'object', required: ['status'], additionalProperties: false, properties: { status: { type: 'string', enum: ['DRAFT', 'IN_REVIEW', 'SCHEDULED', 'PUBLISHED', 'ARCHIVED'] } } };

async function articleRoutes(fastify) {
  // Public routes
  fastify.get('/', { schema: { tags: ['CMS - Articles (Public)'], summary: 'List published articles', querystring: publicQuery } }, ctrl.listPublic);
  fastify.get('/:slug', { schema: { tags: ['CMS - Articles (Public)'], summary: 'Get published article by slug', params: slugParams } }, ctrl.getPublicBySlug);
  fastify.get('/id/:id', { schema: { tags: ['CMS - Articles (Public)'], summary: 'Get published article by ID', params: idParams } }, ctrl.getPublicById);

  // Public preview route (for draft/review articles via signed token)
  fastify.get('/preview/:token', {
    schema: { tags: ['CMS - Articles (Public)'], summary: 'Get article by preview token (draft/review)', params: previewTokenParams },
  }, ctrl.getByPreviewToken);

  // Admin routes
  fastify.get('/manage', {
    onRequest: [fastify.authenticate],
    preHandler: [requireExactAccessType('STAFF'), requirePermission('cms.articles.read')],
    schema: { tags: ['CMS - Articles (Admin)'], summary: 'List articles for admin', querystring: adminQuery },
  }, ctrl.listAdmin);

  fastify.get('/manage/:id', {
    onRequest: [fastify.authenticate],
    preHandler: [requireExactAccessType('STAFF'), requirePermission('cms.articles.read')],
    schema: { tags: ['CMS - Articles (Admin)'], summary: 'Get article by ID for admin', params: idParams },
  }, ctrl.getAdmin);

  fastify.post('/manage', {
    onRequest: [fastify.authenticate],
    preHandler: [requireExactAccessType('STAFF'), requirePermission('cms.articles.create')],
    schema: { tags: ['CMS - Articles (Admin)'], summary: 'Create article', body: createBody },
  }, ctrl.create);

  fastify.patch('/manage/:id', {
    onRequest: [fastify.authenticate],
    preHandler: [requireExactAccessType('STAFF'), requirePermission('cms.articles.update')],
    schema: { tags: ['CMS - Articles (Admin)'], summary: 'Update article', params: idParams, body: updateBody },
  }, ctrl.update);

  fastify.patch('/manage/:id/status', {
    onRequest: [fastify.authenticate],
    preHandler: [requireExactAccessType('STAFF'), requirePermission('cms.articles.update')],
    schema: { tags: ['CMS - Articles (Admin)'], summary: 'Change article status', params: idParams, body: statusBody },
  }, ctrl.changeStatus);

  fastify.delete('/manage/:id', {
    onRequest: [fastify.authenticate],
    preHandler: [requireExactAccessType('STAFF'), requirePermission('cms.articles.delete')],
    schema: { tags: ['CMS - Articles (Admin)'], summary: 'Archive article', params: idParams },
  }, ctrl.deleteArticle);

  fastify.get('/manage/:id/revisions', {
    onRequest: [fastify.authenticate],
    preHandler: [requireExactAccessType('STAFF'), requirePermission('cms.articles.read')],
    schema: { tags: ['CMS - Articles (Admin)'], summary: 'List article revisions', params: idParams },
  }, ctrl.listRevisions);

  fastify.get('/manage/:id/revisions/:revisionNo', {
    onRequest: [fastify.authenticate],
    preHandler: [requireExactAccessType('STAFF'), requirePermission('cms.articles.read')],
    schema: { tags: ['CMS - Articles (Admin)'], summary: 'Get article revision', params: revisionParams },
  }, ctrl.getRevision);

  fastify.post('/manage/:id/revisions/:revisionNo/restore', {
    onRequest: [fastify.authenticate],
    preHandler: [requireExactAccessType('STAFF'), requirePermission('cms.articles.update')],
    schema: { tags: ['CMS - Articles (Admin)'], summary: 'Restore article to a specific revision', params: revisionParams },
  }, ctrl.restoreRevision);

  fastify.post('/manage/:id/preview-token', {
    onRequest: [fastify.authenticate],
    preHandler: [requireExactAccessType('STAFF'), requirePermission('cms.articles.read')],
    schema: { tags: ['CMS - Articles (Admin)'], summary: 'Generate preview token for draft/review article', params: idParams },
  }, ctrl.generatePreviewToken);
}

module.exports = articleRoutes;