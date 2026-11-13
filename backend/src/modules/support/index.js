const service = require('./support.service');
const { requireAccessType, requireExactAccessType, requirePermission } = require('../../middlewares/rbac');

const idParams = { type: 'object', required: ['id'], properties: { id: { type: 'string', pattern: '^[1-9][0-9]*$' } } };
const ticketCreateSchema = { body: { type: 'object', required: ['subject', 'body'], additionalProperties: false, properties: {
  subject: { type: 'string', minLength: 1, maxLength: 200 },
  body: { type: 'string', minLength: 1, maxLength: 10000 },
  categoryId: { anyOf: [{ type: 'integer', minimum: 1 }, { type: 'string', pattern: '^[1-9][0-9]*$' }, { type: 'null' }] },
  priority: { type: 'string', enum: ['LOW', 'NORMAL', 'HIGH', 'URGENT'] },
} } };
const messageSchema = { params: idParams, body: { type: 'object', required: ['body'], additionalProperties: false, properties: {
  body: { type: 'string', minLength: 1, maxLength: 10000 },
  visibility: { type: 'string', enum: ['PUBLIC', 'INTERNAL'] },
} } };
const statusSchema = { params: idParams, body: { type: 'object', required: ['status'], additionalProperties: false, properties: {
  status: { type: 'string', enum: ['OPEN', 'IN_PROGRESS', 'WAITING_CUSTOMER', 'WAITING_COMPANY', 'RESOLVED', 'CLOSED', 'SPAM'] },
  reason: { type: 'string', maxLength: 1000 },
} } };
const assignSchema = { params: idParams, body: { type: 'object', minProperties: 1, additionalProperties: false, properties: {
  queueId: { anyOf: [{ type: 'integer', minimum: 1 }, { type: 'string', pattern: '^[1-9][0-9]*$' }] },
  assignedUserId: { anyOf: [{ type: 'integer', minimum: 1 }, { type: 'string', pattern: '^[1-9][0-9]*$' }] },
  reason: { type: 'string', maxLength: 500 },
} } };
const ok = (result) => result && result.data !== undefined && result.meta ? { success: true, data: result.data, meta: result.meta } : { success: true, data: result };
const wrap = (handler) => async (request, reply) => reply.send(ok(await handler(request)));

async function supportRoutes(fastify) {
  fastify.addHook('onRequest', fastify.authenticate);
  const allUsers = (permission) => [requireAccessType('CUSTOMER', 'COMPANY', 'STAFF'), requirePermission(permission)];
  const staff = (permission) => [requireExactAccessType('STAFF'), requirePermission(permission)];

  fastify.get('/categories', { preHandler: allUsers('tickets.read') }, wrap(() => service.listCategories()));
  fastify.get('/tickets', { preHandler: allUsers('tickets.read') }, wrap((r) => service.listTickets(r.user, r.query)));
  fastify.post('/tickets', { schema: ticketCreateSchema, preHandler: allUsers('tickets.create') }, wrap((r) => service.createTicket(r.user, r.body)));
  fastify.get('/tickets/:id', { schema: { params: idParams }, preHandler: allUsers('tickets.read') }, wrap((r) => service.getTicket(r.user, r.params.id)));
  fastify.post('/tickets/:id/messages', { schema: messageSchema, preHandler: allUsers('tickets.reply') }, wrap((r) => service.addMessage(r.user, r.params.id, r.body)));
  fastify.patch('/tickets/:id/status', { schema: statusSchema, preHandler: staff('tickets.update') }, wrap((r) => service.changeStatus(r.user, r.params.id, r.body.status, r.body.reason)));
  fastify.post('/tickets/:id/assign', { schema: assignSchema, preHandler: staff('tickets.update') }, wrap((r) => service.assignTicket(r.user, r.params.id, r.body)));
  fastify.get('/queues', { preHandler: staff('tickets.read') }, wrap(() => service.listQueues()));
}

module.exports = supportRoutes;
