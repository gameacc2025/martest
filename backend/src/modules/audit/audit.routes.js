// =============================================================
// Audit Log Routes — Fastify route definitions
//
// All routes require STAFF authentication with audit_logs permissions.
// Mounted at /api/v1/audit in app.js
// =============================================================

const controller = require('./audit.controller');
const { requirePermission, requireExactAccessType } = require('../../middlewares/rbac');

/**
 * Audit Log Routes
 * @param {FastifyInstance} fastify
 */
async function auditRoutes(fastify) {
  // All routes require authentication + STAFF context
  fastify.addHook('preHandler', fastify.authenticate);

  // GET /audit/logs - Search audit logs
  fastify.get('/audit/logs', {
    schema: {
      tags: ['Audit Logs'],
      summary: 'Search audit logs',
      description: 'Search and filter audit logs with pagination. STAFF only with audit_logs.read permission.',
      security: [{ bearerAuth: [] }, { cookieAuth: [] }],
      querystring: {
        type: 'object',
        properties: {
          action: { type: 'string' },
          entityType: { type: 'string' },
          entityId: { type: 'string', pattern: '^\\d+$' },
          userId: { type: 'string', pattern: '^\\d+$' },
          ipAddress: { type: 'string' },
          severity: { type: 'string', enum: ['INFO', 'WARN', 'ERROR', 'CRITICAL'] },
          dateFrom: { type: 'string', format: 'date-time' },
          dateTo: { type: 'string', format: 'date-time' },
          page: { type: 'integer', minimum: 1, default: 1 },
          pageSize: { type: 'integer', minimum: 1, maximum: 500, default: 50 },
          sortBy: { type: 'string', enum: ['occurredAt', 'action', 'entityType', 'entityId', 'actorUserId', 'ipAddress', 'severity'], default: 'occurredAt' },
          sortOrder: { type: 'string', enum: ['asc', 'desc'], default: 'desc' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'integer' },
                  action: { type: 'string' },
                  entityType: { type: 'string' },
                  entityId: { type: 'integer' },
                  userId: { type: 'integer' },
                  userEmail: { type: 'string' },
                  userPhone: { type: 'string' },
                  ipAddress: { type: 'string' },
                  userAgent: { type: 'string' },
                  severity: { type: 'string', enum: ['INFO', 'WARN', 'ERROR', 'CRITICAL'] },
                  metadata: { type: 'object' },
                  createdAt: { type: 'string', format: 'date-time' },
                },
              },
            },
            meta: {
              type: 'object',
              properties: {
                total: { type: 'integer' },
                page: { type: 'integer' },
                pageSize: { type: 'integer' },
                totalPages: { type: 'integer' },
              },
            },
          },
        },
      },
    },
    preHandler: [requireExactAccessType('STAFF'), requirePermission('audit_logs.read')],
    handler: controller.searchAuditLogsHandler,
  });

  // GET /audit/logs/stats - Get audit log statistics
  fastify.get('/audit/logs/stats', {
    schema: {
      tags: ['Audit Logs'],
      summary: 'Get audit log statistics',
      description: 'Get aggregated statistics for audit log dashboard. STAFF only with audit_logs.read permission.',
      security: [{ bearerAuth: [] }, { cookieAuth: [] }],
      querystring: {
        type: 'object',
        properties: {
          dateFrom: { type: 'string', format: 'date-time' },
          dateTo: { type: 'string', format: 'date-time' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                total: { type: 'integer' },
                bySeverity: { type: 'object' },
                topActions: {
                  type: 'array',
                  items: { type: 'object', properties: { action: { type: 'string' }, count: { type: 'integer' } } },
                },
                topEntityTypes: {
                  type: 'array',
                  items: { type: 'object', properties: { entityType: { type: 'string' }, count: { type: 'integer' } } },
                },
                recentErrors: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: { type: 'integer' },
                      action: { type: 'string' },
                      entityType: { type: 'string' },
                      entityId: { type: 'integer' },
                      severity: { type: 'string' },
                      createdAt: { type: 'string', format: 'date-time' },
                      metadata: { type: 'object' },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    preHandler: [requireExactAccessType('STAFF'), requirePermission('audit_logs.read')],
    handler: controller.getAuditStatsHandler,
  });

  // GET /audit/logs/:id - Get single audit log entry
  fastify.get('/audit/logs/:id', {
    schema: {
      tags: ['Audit Logs'],
      summary: 'Get audit log by ID',
      description: 'Retrieve a single audit log entry. STAFF only with audit_logs.read permission.',
      security: [{ bearerAuth: [] }, { cookieAuth: [] }],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', pattern: '^\\d+$' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                id: { type: 'integer' },
                action: { type: 'string' },
                entityType: { type: 'string' },
                entityId: { type: 'integer' },
                userId: { type: 'integer' },
                userEmail: { type: 'string' },
                userPhone: { type: 'string' },
                ipAddress: { type: 'string' },
                userAgent: { type: 'string' },
                severity: { type: 'string', enum: ['INFO', 'WARN', 'ERROR', 'CRITICAL'] },
                metadata: { type: 'object' },
                createdAt: { type: 'string', format: 'date-time' },
              },
            },
          },
        },
      },
    },
    preHandler: [requireExactAccessType('STAFF'), requirePermission('audit_logs.read')],
    handler: controller.getAuditLogByIdHandler,
  });

  // GET /audit/logs/export - Export audit logs
  fastify.get('/audit/logs/export', {
    schema: {
      tags: ['Audit Logs'],
      summary: 'Export audit logs',
      description: 'Export audit logs as CSV or JSON. STAFF only with audit_logs.export permission.',
      security: [{ bearerAuth: [] }, { cookieAuth: [] }],
      querystring: {
        type: 'object',
        properties: {
          format: { type: 'string', enum: ['csv', 'json'], default: 'json' },
          action: { type: 'string' },
          entityType: { type: 'string' },
          entityId: { type: 'string', pattern: '^\\d+$' },
          userId: { type: 'string', pattern: '^\\d+$' },
          ipAddress: { type: 'string' },
          severity: { type: 'string', enum: ['INFO', 'WARN', 'ERROR', 'CRITICAL'] },
          dateFrom: { type: 'string', format: 'date-time' },
          dateTo: { type: 'string', format: 'date-time' },
          sortBy: { type: 'string', enum: ['occurredAt', 'action', 'entityType', 'entityId', 'actorUserId', 'ipAddress', 'severity'], default: 'occurredAt' },
          sortOrder: { type: 'string', enum: ['asc', 'desc'], default: 'desc' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'object', additionalProperties: true },
          },
        },
      },
    },
    preHandler: [requireExactAccessType('STAFF'), requirePermission('audit_logs.export')],
    handler: controller.exportAuditLogsHandler,
  });
}

module.exports = auditRoutes;