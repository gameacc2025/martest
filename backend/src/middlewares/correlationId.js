// =============================================================
// Correlation ID Middleware
//
// Attaches a correlation ID to each request for tracing across
// services and audit logs. Reads from x-request-id or x-correlation-id
// headers, or generates a new one.
// =============================================================

const fp = require('fastify-plugin');
const { randomUUID } = require('node:crypto');

module.exports = fp(async function correlationIdPlugin(fastify) {
  fastify.addHook('onRequest', async (request, reply) => {
    // Check for incoming correlation ID in headers
    const headerId = request.headers['x-request-id'] || request.headers['x-correlation-id'];
    const safeHeaderId = typeof headerId === 'string'
      && headerId.length <= 100
      && /^[A-Za-z0-9._:-]+$/.test(headerId);

    // Keep IDs bounded to the AuditLog column and reject control/format
    // characters. Client-provided IDs are correlation hints, not authority.
    request.correlationId = safeHeaderId ? headerId : randomUUID();

    // Also expose on reply for response header
    reply.correlationId = request.correlationId;
  });

  // Add correlation ID to response headers for client-side tracing
  fastify.addHook('onSend', async (request, reply, payload) => {
    if (reply.correlationId) {
      reply.header('x-correlation-id', reply.correlationId);
    }
    return payload;
  });
});