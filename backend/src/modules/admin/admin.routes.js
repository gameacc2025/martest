// =============================================================
// Admin Routes — Dashboard statistics + system settings
//
// User management  → /api/v1/users
// Role management  → /api/v1/roles
// Permissions      → /api/v1/permissions
//
// Route map:
//   GET   /api/v1/admin/stats                          → dashboard statistics
//   GET   /api/v1/admin/settings                       → system settings
//   PATCH /api/v1/admin/settings/product-review-threshold → edit review threshold
// =============================================================

const ctrl = require('./admin.controller');
const { requirePermission } = require('../../middlewares/rbac');

const thresholdBodySchema = {
  type: 'object',
  required: ['value'],
  additionalProperties: false,
  properties: { value: { type: 'integer', minimum: 1, maximum: 1000 } },
};

async function adminRoutes(fastify) {
  fastify.get('/stats', {
    onRequest: [fastify.authenticate],
    preHandler: [requirePermission('users.read')],
    schema: {
      summary: 'Get admin dashboard statistics',
      tags: ['Admin'],
    },
  }, ctrl.getStats);

  // System settings are a manage-only concern. Neither role needs them at
  // read time for the dashboard; requirePermission below grants access to
  // SUPER_ADMIN (bypass layer) and any role holding system_settings.manage
  // (seeded into SUPER_ADMIN only today — see prisma/seed.js).
  fastify.get('/settings', {
    onRequest: [fastify.authenticate],
    preHandler: [requirePermission('system_settings.manage')],
    schema: {
      summary: 'Get system settings',
      tags: ['Admin'],
    },
  }, ctrl.getSettings);

  fastify.patch('/settings/product-review-threshold', {
    onRequest: [fastify.authenticate],
    preHandler: [requirePermission('system_settings.manage')],
    schema: {
      summary: 'Update product review edit threshold',
      tags: ['Admin'],
      body: thresholdBodySchema,
    },
  }, ctrl.updateReviewEditThreshold);


  // ── RFQ subscription monetization ───────────────────────────
  const inquiryPlanSchema = {
    type: 'object',
    required: ['code', 'name', 'durationDays', 'price'],
    additionalProperties: false,
    properties: {
      code: { type: 'string', minLength: 2, maxLength: 50 },
      name: { type: 'string', minLength: 1, maxLength: 100 },
      description: { type: 'string', maxLength: 1000 },
      durationDays: { type: 'integer', minimum: 1, maximum: 3650 },
      price: { type: 'number', minimum: 0 },
      currency: { type: 'string', minLength: 3, maxLength: 8 },
      inquiriesPerPeriod: { type: 'integer', minimum: 0, maximum: 100000000 },
      responsesPerPeriod: { type: 'integer', minimum: 0, maximum: 100000000 },
      internalMessagesPerPeriod: { type: 'integer', minimum: 0, maximum: 100000000 },
      smsPerPeriod: { type: 'integer', minimum: 0, maximum: 100000000 },
      isActive: { type: 'boolean' },
    },
  };

  fastify.get('/inquiry-monetization/settings', {
    onRequest: [fastify.authenticate], preHandler: [requirePermission('system_settings.manage')],
  }, ctrl.getInquiryMonetizationSettingsCtrl);

  fastify.patch('/inquiry-monetization/settings', {
    onRequest: [fastify.authenticate], preHandler: [requirePermission('system_settings.manage')],
    schema: { body: { type: 'object', required: ['subscriptionEnforcement'], additionalProperties: false, properties: { subscriptionEnforcement: { type: 'boolean' } } } },
  }, ctrl.updateInquiryMonetizationSettingsCtrl);

  fastify.get('/inquiry-plans', {
    onRequest: [fastify.authenticate], preHandler: [requirePermission('system_settings.manage')],
  }, ctrl.listInquiryPlansCtrl);

  fastify.post('/inquiry-plans', {
    onRequest: [fastify.authenticate], preHandler: [requirePermission('system_settings.manage')],
    schema: { body: inquiryPlanSchema },
  }, ctrl.createInquiryPlanCtrl);


  fastify.patch('/inquiry-plans/:id', {
    onRequest: [fastify.authenticate], preHandler: [requirePermission('system_settings.manage')],
    schema: {
      params: { type: 'object', required: ['id'], properties: { id: { type: 'integer', minimum: 1 } } },
      body: {
        type: 'object', minProperties: 1, additionalProperties: false,
        properties: {
          name: { type: 'string', minLength: 1, maxLength: 100 },
          description: { type: 'string', maxLength: 1000 },
          durationDays: { type: 'integer', minimum: 1, maximum: 3650 },
          price: { type: 'number', minimum: 0 },
          currency: { type: 'string', minLength: 3, maxLength: 8 },
          inquiriesPerPeriod: { type: 'integer', minimum: 0, maximum: 100000000 },
          responsesPerPeriod: { type: 'integer', minimum: 0, maximum: 100000000 },
          internalMessagesPerPeriod: { type: 'integer', minimum: 0, maximum: 100000000 },
          smsPerPeriod: { type: 'integer', minimum: 0, maximum: 100000000 },
          isActive: { type: 'boolean' },
        },
      },
    },
  }, ctrl.updateInquiryPlanCtrl);

  fastify.get('/inquiry-subscriptions', {
    onRequest: [fastify.authenticate], preHandler: [requirePermission('system_settings.manage')],
  }, ctrl.listInquirySubscriptionsCtrl);

  fastify.post('/inquiry-subscriptions/:id/activate', {
    onRequest: [fastify.authenticate], preHandler: [requirePermission('system_settings.manage')],
    schema: {
      params: { type: 'object', required: ['id'], properties: { id: { type: 'integer', minimum: 1 } } },
      body: { type: 'object', required: ['paymentConfirmed'], additionalProperties: false, properties: { paymentConfirmed: { type: 'boolean', const: true }, notes: { type: 'string', maxLength: 1000 } } },
    },
  }, ctrl.activatePendingInquirySubscriptionCtrl);


  fastify.post('/inquiry-subscriptions/:id/reject', {
    onRequest: [fastify.authenticate], preHandler: [requirePermission('system_settings.manage')],
    schema: {
      params: { type: 'object', required: ['id'], properties: { id: { type: 'integer', minimum: 1 } } },
      body: { type: 'object', additionalProperties: false, properties: { notes: { type: 'string', maxLength: 1000 } } },
    },
  }, ctrl.rejectPendingInquirySubscriptionCtrl);

  fastify.post('/inquiry-subscriptions/grant', {
    onRequest: [fastify.authenticate], preHandler: [requirePermission('system_settings.manage')],
    schema: { body: { type: 'object', required: ['planId'], additionalProperties: false, properties: { planId: { type: 'integer', minimum: 1 }, companyId: { type: 'integer', minimum: 1 }, userId: { type: 'integer', minimum: 1 }, notes: { type: 'string', maxLength: 1000 } } } },
  }, ctrl.grantInquirySubscriptionCtrl);

  // ── Admin-created announcements ───────────────────────────────
  fastify.post('/notifications/send', {
    onRequest: [fastify.authenticate],
    preHandler: [requirePermission('notifications.send')],
    schema: {
      summary: 'Send an announcement to active users',
      tags: ['Notifications'],
      body: {
        type: 'object',
        required: ['title', 'message', 'audience', 'channels'],
        additionalProperties: false,
        properties: {
          title: { type: 'string', minLength: 1, maxLength: 120 },
          message: { type: 'string', minLength: 1, maxLength: 5000 },
          audience: { type: 'string', enum: ['ALL_ACTIVE', 'CUSTOMER', 'COMPANY', 'STAFF'] },
          channels: { type: 'array', minItems: 1, uniqueItems: true, items: { type: 'string', enum: ['IN_APP', 'EMAIL'] } },
        },
      },
    },
  }, ctrl.sendNotificationCtrl);

  // ── Admin-managed notification folders ───────────────────────
  fastify.get('/notifications/folders', {
    onRequest: [fastify.authenticate],
    preHandler: [requirePermission('system_settings.manage')],
    schema: { summary: 'List notification folders', tags: ['Notifications'] },
  }, ctrl.listNotificationFoldersCtrl);

  fastify.post('/notifications/folders', {
    onRequest: [fastify.authenticate],
    preHandler: [requirePermission('system_settings.manage')],
    schema: {
      summary: 'Create a notification folder', tags: ['Notifications'],
      body: { type: 'object', required: ['name', 'scope'], additionalProperties: false,
        properties: {
          name: { type: 'string', minLength: 2, maxLength: 60 },
          scope: { type: 'string', enum: ['ALL', 'WEBSITE', 'COMPANY', 'ADMIN'] },
          sortOrder: { type: 'integer', minimum: 0, maximum: 10000 },
        },
      },
    },
  }, ctrl.createNotificationFolderCtrl);

  fastify.patch('/notifications/folders/:id', {
    onRequest: [fastify.authenticate],
    preHandler: [requirePermission('system_settings.manage')],
    schema: {
      summary: 'Update a notification folder', tags: ['Notifications'],
      params: { type: 'object', required: ['id'], properties: { id: { type: 'integer', minimum: 1 } } },
      body: { type: 'object', minProperties: 1, additionalProperties: false,
        properties: {
          name: { type: 'string', minLength: 2, maxLength: 60 },
          scope: { type: 'string', enum: ['ALL', 'WEBSITE', 'COMPANY', 'ADMIN'] },
          sortOrder: { type: 'integer', minimum: 0, maximum: 10000 },
          isActive: { type: 'boolean' },
        },
      },
    },
  }, ctrl.updateNotificationFolderCtrl);

  // ── Notification delivery monitoring ──────────────────────────
  fastify.get('/notifications/delivery-stats', {
    onRequest: [fastify.authenticate],
    preHandler: [requirePermission('delivery.view')],
    schema: {
      summary: 'Get notification delivery statistics',
      tags: ['Admin'],
    },
  }, ctrl.getDeliveryStatsCtrl);

  fastify.get('/notifications/deliveries', {
    onRequest: [fastify.authenticate],
    preHandler: [requirePermission('delivery.view')],
    schema: {
      summary: 'List notification deliveries for monitoring',
      tags: ['Admin'],
    },
  }, ctrl.listDeliveriesCtrl);
}

module.exports = adminRoutes;