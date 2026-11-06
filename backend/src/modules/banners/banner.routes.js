const ctrl = require('./banner.controller');
const { requireExactAccessType, requirePermission } = require('../../middlewares/rbac');

const idParams = { type: 'object', required: ['id'], properties: { id: { type: 'integer', minimum: 1 } } };
const bannerProperties = {
  title: { type: 'string', minLength: 1, maxLength: 120 },
  description: { type: 'string', maxLength: 300 },
  imageUrl: { type: 'string', minLength: 1, maxLength: 1000 },
  targetUrl: { type: 'string', maxLength: 1000 },
  ctaLabel: { type: 'string', maxLength: 40 },
  placement: { type: 'string', enum: ['HOME_HERO'] },
  sortOrder: { type: 'integer', minimum: 0, maximum: 100000 },
  status: { type: 'string', enum: ['DRAFT', 'PUBLISHED', 'ARCHIVED'] },
  isActive: { type: 'boolean' },
  startsAt: { type: 'string', format: 'date-time' },
  endsAt: { type: 'string', format: 'date-time' },
};

async function bannerRoutes(fastify) {
  fastify.get('/active', { schema: { tags: ['Banners'], summary: 'Get active public promotional banners' } }, ctrl.listPublic);

  fastify.get('/manage', {
    onRequest: [fastify.authenticate], preHandler: [requireExactAccessType('STAFF'), requirePermission('banners.read')],
    schema: { tags: ['Banners'], summary: 'List promotional banners for staff' },
  }, ctrl.listAdmin);
  fastify.get('/manage/:id', {
    onRequest: [fastify.authenticate], preHandler: [requireExactAccessType('STAFF'), requirePermission('banners.read')],
    schema: { params: idParams, tags: ['Banners'] },
  }, ctrl.getAdmin);
  fastify.post('/manage', {
    onRequest: [fastify.authenticate], preHandler: [requireExactAccessType('STAFF'), requirePermission('banners.create')],
    schema: { tags: ['Banners'], body: { type: 'object', required: ['title', 'imageUrl'], additionalProperties: false, properties: bannerProperties } },
  }, ctrl.create);
  fastify.patch('/manage/:id', {
    onRequest: [fastify.authenticate], preHandler: [requireExactAccessType('STAFF'), requirePermission('banners.update')],
    schema: { params: idParams, tags: ['Banners'], body: { type: 'object', minProperties: 1, additionalProperties: false, properties: bannerProperties } },
  }, ctrl.update);
  fastify.delete('/manage/:id', {
    onRequest: [fastify.authenticate], preHandler: [requireExactAccessType('STAFF'), requirePermission('banners.delete')],
    schema: { params: idParams, tags: ['Banners'] },
  }, ctrl.archive);
  fastify.post('/manage/upload', {
    onRequest: [fastify.authenticate], preHandler: [requireExactAccessType('STAFF'), requirePermission('media.upload')],
    schema: { tags: ['Banners'], consumes: ['multipart/form-data'], summary: 'Upload a promotional banner image' },
  }, ctrl.upload);
}
module.exports = bannerRoutes;
