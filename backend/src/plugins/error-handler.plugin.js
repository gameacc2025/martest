// =============================================================
// Error Handler Plugin
//
// Centralized error handling for the entire Fastify app.
// Maps known error types to appropriate HTTP responses:
//
//   Fastify validation error  → 400 with field details
//   Prisma P2002 (duplicate)  → 409 Conflict
//   Prisma P2025 (not found)  → 404 Not Found
//   App thrown errors         → use error.statusCode
//   Unexpected errors         → 500 (hide internals in production)
//
// Error response format (consistent across all endpoints):
//   { error: { code: string, message: string, details?: array|object } }
// =============================================================

const fp = require('fastify-plugin');
const { nodeEnv } = require('../config/env');

// Map Prisma error codes to HTTP responses
const PRISMA_ERROR_MAP = {
  P2002: { status: 409, code: 'DUPLICATE_ENTRY', message: 'A record with this value already exists.' },
  P2025: { status: 404, code: 'NOT_FOUND', message: 'The requested record was not found.' },
  P2003: { status: 400, code: 'FOREIGN_KEY_VIOLATION', message: 'Related record not found.' },
  P2014: { status: 400, code: 'RELATION_VIOLATION', message: 'This operation violates a database relation.' },
};

module.exports = fp(async function errorHandlerPlugin(fastify) {

  fastify.setErrorHandler(function handleError(error, request, reply) {
    // Log all errors (but at warn level to not flood logs)
    fastify.log.warn({ err: error, url: request.url, method: request.method }, 'Request error');

    // ── Fastify schema validation error ───────────────────────
    if (error.validation) {
      return reply.code(400).send({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request data.',
          details: error.validation.map((v) => ({
            field: v.instancePath?.replace('/', '') || v.params?.missingProperty || 'unknown',
            message: v.message,
          })),
        },
      });
    }

    // ── Prisma known errors ───────────────────────────────────
    if (error.code && PRISMA_ERROR_MAP[error.code]) {
      const mapped = PRISMA_ERROR_MAP[error.code];
      return reply.code(mapped.status).send({
        error: {
          code: mapped.code,
          message: mapped.message,
        },
      });
    }

    // ── App-thrown errors (service layer throws { statusCode, message }) ──
    if (error.statusCode && error.statusCode < 500) {
      return reply.code(error.statusCode).send({
        error: {
          code: error.code || 'APP_ERROR',
          message: error.message,
          ...(error.details && { details: error.details }),
        },
      });
    }

    // ── Unexpected / Internal server errors ───────────────────
    // In production: never expose internal details to the client
    // In development: include the stack trace for debugging
    const isDev = nodeEnv === 'development';
    fastify.log.error(error, 'Unhandled error');

    return reply.code(500).send({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred. Please try again later.',
        ...(isDev && { debug: error.message, stack: error.stack }),
      },
    });
  });

  // ── 404 handler for unknown routes ───────────────────────────
  fastify.setNotFoundHandler(function handleNotFound(request, reply) {
    return reply.code(404).send({
      error: {
        code: 'NOT_FOUND',
        message: `Route ${request.method} ${request.url} not found.`,
      },
    });
  });
});
