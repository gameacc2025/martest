const ctrl = require('./page.controller');
const { requireExactAccessType, requirePermission } = require('../../middlewares/rbac');
const { pageProperties } = require('./page.schemas');

const idParams = { type: 'object', required: ['id'], properties: { id: { type: 'integer', minimum: 1 } } };
const slugParams = { type: 'object', required: ['slug'], properties: { slug: { type: 'string', minLength: 1, maxLength: 100 } } };

const publicQuery = {
  type: 'object',
  properties: {},
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

const createBody = { type: 'object', required: ['slug', 'title', 'content'], additionalProperties: false, properties: pageProperties };
const updateBody = { type: 'object', minProperties: 1, additionalProperties: false, properties: pageProperties };
const upsertBody = {
  type: 'object',
  required: ['title', 'content'],
  additionalProperties: false,
  properties: {
    title: pageProperties.title,
    content: pageProperties.content,
    contentFormat: pageProperties.contentFormat,
    metaTitle: pageProperties.metaTitle,
    metaDescription: pageProperties.metaDescription,
    canonicalUrl: pageProperties.canonicalUrl,
    isIndexable: pageProperties.isIndexable,
    isActive: pageProperties.isActive,
  },
};

async function pageRoutes(fastify) {
  // Public routes
  fastify.get('/', { schema: { tags: ['CMS - Pages (Public)'], summary: 'List static pages', querystring: publicQuery } }, ctrl.listPublic);
  fastify.get('/:slug', { schema: { tags: ['CMS - Pages (Public)'], summary: 'Get static page by slug', params: slugParams } }, ctrl.getPublicBySlug);

  // Admin routes
  fastify.get('/manage', {
    onRequest: [fastify.authenticate],
    preHandler: [requireExactAccessType('STAFF'), requirePermission('cms.pages.read')],
    schema: { tags: ['CMS - Pages (Admin)'], summary: 'List pages for admin', querystring: adminQuery },
  }, ctrl.listAdmin);

  fastify.get('/manage/:id', {
    onRequest: [fastify.authenticate],
    preHandler: [requireExactAccessType('STAFF'), requirePermission('cms.pages.read')],
    schema: { tags: ['CMS - Pages (Admin)'], summary: 'Get page by ID for admin', params: idParams },
  }, ctrl.getAdmin);

  fastify.get('/manage/slug/:slug', {
    onRequest: [fastify.authenticate],
    preHandler: [requireExactAccessType('STAFF'), requirePermission('cms.pages.read')],
    schema: { tags: ['CMS - Pages (Admin)'], summary: 'Get page by slug for admin', params: slugParams },
  }, ctrl.getAdminBySlug);

  fastify.post('/manage', {
    onRequest: [fastify.authenticate],
    preHandler: [requireExactAccessType('STAFF'), requirePermission('cms.pages.create')],
    schema: { tags: ['CMS - Pages (Admin)'], summary: 'Create page', body: createBody },
  }, ctrl.create);

  fastify.patch('/manage/:id', {
    onRequest: [fastify.authenticate],
    preHandler: [requireExactAccessType('STAFF'), requirePermission('cms.pages.update')],
    schema: { tags: ['CMS - Pages (Admin)'], summary: 'Update page', params: idParams, body: updateBody },
  }, ctrl.update);

  fastify.put('/manage/slug/:slug', {
    onRequest: [fastify.authenticate],
    preHandler: [requireExactAccessType('STAFF'), requirePermission('cms.pages.update')],
    schema: { tags: ['CMS - Pages (Admin)'], summary: 'Upsert page by slug', params: slugParams, body: upsertBody },
  }, ctrl.upsert);

  fastify.delete('/manage/:id', {
    onRequest: [fastify.authenticate],
    preHandler: [requireExactAccessType('STAFF'), requirePermission('cms.pages.delete')],
    schema: { tags: ['CMS - Pages (Admin)'], summary: 'Delete page', params: idParams },
  }, ctrl.deletePage);
}

module.exports = pageRoutes;