/**
 * Notification Schemas — OpenAPI validation schemas for notification routes
 */

// ── Preferences ────────────────────────────────────────────────

const preferenceUpdateBodySchema = {
  type: 'array',
  minItems: 1,
  items: {
    type: 'object',
    required: ['eventType', 'channel', 'enabled'],
    additionalProperties: false,
    properties: {
      eventType: { type: 'string', minLength: 1 },
      channel: { type: 'string', enum: ['IN_APP', 'EMAIL', 'SMS'] },
      enabled: { type: 'boolean' },
    },
  },
};

const preferenceResponseSchema = {
  '2xx': {
    type: 'object',
    properties: {
      data: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            eventType: { type: 'string' },
            label: { type: 'string' },
            channels: {
              type: 'object',
              properties: {
                IN_APP: { type: 'boolean' },
                EMAIL: { type: 'boolean' },
                SMS: { type: 'boolean' },
              },
              additionalProperties: false,
            },
            defaults: {
              type: 'object',
              properties: {
                IN_APP: { type: 'boolean' },
                EMAIL: { type: 'boolean' },
                SMS: { type: 'boolean' },
              },
              additionalProperties: false,
            },
          },
        },
      },
      smsAvailable: { type: 'boolean' },
    },
  },
};

// ── Delivery monitoring (admin) ──────────────────────────────

const deliveryQuerySchema = {
  type: 'object',
  properties: {
    page: { type: 'integer', minimum: 1, default: 1 },
    limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
    status: { type: 'string', enum: ['PENDING', 'SENT', 'FAILED', 'SKIPPED'] },
    channel: { type: 'string', enum: ['IN_APP', 'EMAIL', 'SMS'] },
    eventType: { type: 'string' },
    userId: { type: 'integer', minimum: 1 },
    from: { type: 'string', format: 'date-time' },
    to: { type: 'string', format: 'date-time' },
  },
  additionalProperties: false,
};

const deliveryStatsSchema = {
  type: 'object',
  properties: {
    total: { type: 'integer' },
    byStatus: {
      type: 'object',
      properties: {
        PENDING: { type: 'integer' },
        SENT: { type: 'integer' },
        FAILED: { type: 'integer' },
        SKIPPED: { type: 'integer' },
      },
    },
    byChannel: {
      type: 'object',
      properties: {
        IN_APP: { type: 'integer' },
        EMAIL: { type: 'integer' },
        SMS: { type: 'integer' },
      },
    },
    recentFailures: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          eventType: { type: 'string' },
          channel: { type: 'string' },
          status: { type: 'string' },
          recipient: { type: 'string' },
          lastError: { type: 'string' },
          attempts: { type: 'integer' },
          maxAttempts: { type: 'integer' },
          nextAttemptAt: { type: 'string', format: 'date-time' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
    },
  },
};

module.exports = {
  preferenceUpdateBodySchema,
  preferenceResponseSchema,
  deliveryQuerySchema,
  deliveryStatsSchema,
};