const ctrl = require('./address.controller');
const { requireAccessType } = require('../../middlewares/rbac');

const idParams = {
  type: 'object',
  required: ['id'],
  additionalProperties: false,
  properties: { id: { type: 'integer', minimum: 1 } },
};

const addressProperties = {
  label: { type: 'string', minLength: 1, maxLength: 50 },
  recipientName: { type: 'string', minLength: 1, maxLength: 120 },
  recipientPhone: { type: 'string', minLength: 5, maxLength: 30 },
  province: { type: 'string', minLength: 1, maxLength: 100 },
  city: { type: 'string', minLength: 1, maxLength: 100 },
  addressLine: { type: 'string', minLength: 5, maxLength: 1000 },
  postalCode: { type: ['string', 'null'], maxLength: 30 },
  isDefault: { type: 'boolean' },
};

const createBody = {
  type: 'object',
  required: ['recipientName', 'recipientPhone', 'province', 'city', 'addressLine'],
  additionalProperties: false,
  properties: addressProperties,
};

const updateBody = {
  type: 'object',
  minProperties: 1,
  additionalProperties: false,
  properties: addressProperties,
};

async function addressRoutes(fastify) {
  fastify.addHook('onRequest', fastify.authenticate);
  fastify.addHook('preHandler', requireAccessType('CUSTOMER'));

  fastify.get('/', { schema: { summary: 'List the authenticated customer’s addresses', tags: ['Addresses'] } }, ctrl.list);
  fastify.post('/', { schema: { body: createBody, summary: 'Create a customer address', tags: ['Addresses'] } }, ctrl.create);
  fastify.get('/:id', { schema: { params: idParams, summary: 'Get an owned customer address', tags: ['Addresses'] } }, ctrl.getOne);
  fastify.patch('/:id', { schema: { params: idParams, body: updateBody, summary: 'Update an owned customer address', tags: ['Addresses'] } }, ctrl.update);
  fastify.patch('/:id/default', { schema: { params: idParams, summary: 'Set an owned customer address as default', tags: ['Addresses'] } }, ctrl.setDefault);
  fastify.delete('/:id', { schema: { params: idParams, summary: 'Delete an owned customer address', tags: ['Addresses'] } }, ctrl.remove);
}

module.exports = addressRoutes;
