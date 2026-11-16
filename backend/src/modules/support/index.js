const service = require('./support.service');
const { requireAccessType, requireExactAccessType, requirePermission } = require('../../middlewares/rbac');
const prisma = require('../../config/db');

function toId(value, field = 'id') {
  const id = Number(value);
  if (!Number.isSafeInteger(id) || id < 1) {
    const error = new Error(`شناسه ${field} معتبر نیست.`);
    error.statusCode = 400;
    error.code = 'SUPPORT_INVALID_ID';
    throw error;
  }
  return id;
}

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
const attachmentParamsSchema = { params: { type: 'object', required: ['id', 'messageId', 'attachmentId'], additionalProperties: false, properties: {
  id: { type: 'string', pattern: '^[1-9][0-9]*$' },
  messageId: { type: 'string', pattern: '^[1-9][0-9]*$' },
  attachmentId: { type: 'string', pattern: '^[1-9][0-9]*$' },
} } };
const slaParamsSchema = { params: { type: 'object', required: ['id'], additionalProperties: false, properties: {
  id: { type: 'string', pattern: '^[1-9][0-9]*$' },
} } };
const queueParamsSchema = { params: { type: 'object', required: ['queueId'], additionalProperties: false, properties: {
  queueId: { type: 'string', pattern: '^[1-9][0-9]*$' },
} } };
const ok = (result) => result && result.data !== undefined && result.meta ? { success: true, data: result.data, meta: result.meta } : { success: true, data: result };
const wrap = (handler) => async (request, reply) => reply.send(ok(await handler(request)));

// Multipart handler for file uploads
const uploadSchema = { params: { type: 'object', required: ['id', 'messageId'], additionalProperties: false, properties: {
  id: { type: 'string', pattern: '^[1-9][0-9]*$' },
  messageId: { type: 'string', pattern: '^[1-9][0-9]*$' },
} }, consumes: ['multipart/form-data'] };

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

  // SLA endpoints
  fastify.get('/tickets/:id/sla', { schema: { params: slaParamsSchema }, preHandler: allUsers('tickets.read') }, wrap((r) => service.getSlaDetails(prisma, toId(r.params.id))));
  fastify.post('/tickets/:id/sla/pause', { schema: { params: slaParamsSchema, body: { type: 'object', required: ['reason'], properties: { reason: { type: 'string', maxLength: 500 } } } }, preHandler: staff('tickets.update') }, wrap((r) => service.pauseSla(prisma, toId(r.params.id), r.user.id, r.body.reason)));
  fastify.post('/tickets/:id/sla/resume', { schema: { params: slaParamsSchema, body: { type: 'object', required: ['reason'], properties: { reason: { type: 'string', maxLength: 500 } } } }, preHandler: staff('tickets.update') }, wrap((r) => service.resumeSla(prisma, toId(r.params.id), r.user.id, r.body.reason)));

  // Queue management endpoints (STAFF only)
  fastify.get('/queues/:queueId/tickets', { schema: { params: queueParamsSchema, querystring: { type: 'object', properties: { page: { type: 'string' }, limit: { type: 'string' }, status: { type: 'string' } } } }, preHandler: staff('tickets.read') }, wrap((r) => service.listTicketsByQueue(r.user, toId(r.params.queueId), r.query)));
  fastify.get('/queues/:queueId/stats', { schema: { params: queueParamsSchema }, preHandler: staff('tickets.read') }, wrap((r) => service.getQueueStats(r.user, toId(r.params.queueId))));

  // Attachment endpoints
  fastify.post('/tickets/:id/messages/:messageId/attachments', { schema: uploadSchema, preHandler: allUsers('tickets.reply') }, async (request, reply) => {
    const file = await request.file();
    const result = await service.uploadAttachment(request.user, request.params.id, request.params.messageId, file);
    reply.send(ok(result));
  });

  fastify.get('/tickets/:id/messages/:messageId/attachments/:attachmentId/download', { schema: { params: attachmentParamsSchema }, preHandler: allUsers('tickets.read') }, async (request, reply) => {
    const result = await service.downloadAttachment(request.user, request.params.id, request.params.attachmentId);
    const fs = require('fs');
    const stream = fs.createReadStream(result.filePath);
    reply.header('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(result.originalName)}`);
    reply.header('Content-Type', result.mimeType);
    reply.header('Content-Length', result.sizeBytes);
    return reply.send(stream);
  });

  fastify.delete('/tickets/:id/messages/:messageId/attachments/:attachmentId', { schema: { params: attachmentParamsSchema }, preHandler: allUsers('tickets.reply') }, wrap((r) => service.deleteAttachment(r.user, r.params.id, r.params.attachmentId)));
}

module.exports = supportRoutes;
