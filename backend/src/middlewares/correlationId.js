// =============================================================
// Correlation ID Middleware
//
// Attaches a correlation ID to each request for tracing across
// services and audit logs. Reads from x-request-id or x-correlation-id
// headers, or generates a new one.
// =============================================================

const fp = require('fastify-plugin');

module.exports = fp(async function correlationIdPlugin(fastify) {
  fastify.addHook('onRequest', async (request, reply) => {
    // Check for incoming correlation ID in headers
    const headerId = request.headers['x-request-id'] || request.headers['x-correlation-id'];

    if (headerId) {
      request.correlationId = headerId;
    } else {
      // Generate new correlation ID: timestamp + random suffix
      request.correlationId = `req-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    }

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