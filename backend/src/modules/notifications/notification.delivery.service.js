// مسیر فایل: backend/src/modules/notifications/notification.delivery.service.js
// =============================================================
// Notification Delivery Worker
//
// Background worker that processes queued PENDING NotificationDelivery rows.
// Called via cron job or dedicated worker process.
//
// For EMAIL: picks up PENDING rows, sends via the email provider adapter,
// updates status to SENT on success or FAILED on error.
//
// For SMS: implementation is reserved for future Twilio integration.
// =============================================================

const prisma = require('../../config/db');
const emailProvider = require('./notification.email.provider');
const { notificationMaxAttempts, notificationPollIntervalMs } = require('../../config/env');

// Default poll limit if not configured
const POLL_LIMIT = 100;

/**
 * Process pending EMAIL deliveries.
 * Picks up to `limit` PENDING rows, attempts delivery, updates status.
 * @param {Object} options
 * @param {number} options.limit - Max rows to process (default 100)
 * @returns {Promise<{ processed: number, sent: number, failed: number }>}
 */
async function processPendingDeliveries({ limit = POLL_LIMIT } = {}) {
  const results = { processed: 0, sent: 0, failed: 0, errors: [] };

  // If no real email provider is configured, log and return early
  const realProvider = emailProvider.hasRealProvider();
  if (!realProvider) {
    console.log('[delivery] No email provider configured — skipping delivery processing');
    return { processed: 0, sent: 0, failed: 0, skipped: limit, reason: 'no_provider' };
  }

  // Fetch PENDING deliveries (order by nextAttemptAt to prioritize)
  const deliveries = await prisma.notificationDelivery.findMany({
    where: {
      status: 'PENDING',
      channel: 'EMAIL',
      // Only process if: no nextAttemptAt, or nextAttemptAt <= now
      OR: [
        { nextAttemptAt: null },
        { nextAttemptAt: { lte: new Date() } },
      ],
      // Don't retry past max attempts
      attempts: { lt: notificationMaxAttempts },
    },
    orderBy: { nextAttemptAt: 'asc' },
    take: limit,
  });

  if (!deliveries.length) {
    return { processed: 0, sent: 0, failed: 0, errors: [] };
  }

  for (const delivery of deliveries) {
    results.processed += 1;

    try {
      // Skip if recipient email is missing
      if (!delivery.recipient) {
        console.warn(`[delivery] Skipping delivery #${delivery.id} — no recipient email`);
        await markDeliverySkipped(delivery.id, 'No recipient email');
        results.failed += 1;
        continue;
      }

      // Send the email
      const emailOpts = {
        to: delivery.recipient,
        subject: delivery.subject || '',
        text: delivery.body || '',
        html: undefined, // Could add HTML template support later
      };

      await emailProvider.sendEmail(emailOpts);

      // Mark as sent
      await prisma.notificationDelivery.update({
        where: { id: delivery.id },
        data: {
          status: 'SENT',
          sentAt: new Date(),
          attempts: delivery.attempts + 1,
          updatedAt: new Date(),
        },
      });
      results.sent += 1;

    } catch (error) {
      // Increment attempts and update nextAttemptAt with backoff
      const newAttempts = delivery.attempts + 1;
      const isExhausted = newAttempts >= notificationMaxAttempts;

      await prisma.notificationDelivery.update({
        where: { id: delivery.id },
        data: {
          status: isExhausted ? 'FAILED' : 'PENDING',
          attempts: newAttempts,
          lastError: error.message?.substring(0, 500) || String(error),
          nextAttemptAt: isExhausted ? null : calculateBackoff(newAttempts),
          updatedAt: new Date(),
        },
      });

      if (isExhausted) {
        results.failed += 1;
        results.errors.push({ id: delivery.id, error: error.message });
      } else {
        results.failed += 1;
        console.log(`[delivery] Will retry delivery #${delivery.id} (attempt ${newAttempts})`);
      }
    }
  }

  return results;
}

/**
 * Mark a delivery as SKIPPED (e.g., missing recipient, invalid email).
 */
async function markDeliverySkipped(id, reason) {
  await prisma.notificationDelivery.update({
    where: { id },
    data: {
      status: 'SKIPPED',
      lastError: reason,
      sentAt: null,
      updatedAt: new Date(),
    },
  });
}

/**
 * Calculate exponential backoff for retries.
 * @param {number} attempt - The attempt number (1-indexed)
 * @returns {Date} Next attempt time
 */
function calculateBackoff(attempt) {
  // Base: 5 seconds, then exponential
  const baseMs = 5000;
  const delayMs = baseMs * Math.pow(2, attempt - 1);
  return new Date(Date.now() + delayMs);
}

/**
 * Admin: Get delivery statistics.
 * @param {Object} options
 */
async function getDeliveryStats(options = {}) {
  const {
    status,
    channel,
    eventType,
    userId,
    page = 1,
    limit = 20,
  } = options;

  let whereClause = {};

  if (status) whereClause.status = status;
  if (channel) whereClause.channel = channel;
  if (eventType) whereClause.eventType = { contains: eventType };
  if (userId) whereClause.userId = userId;

  const [total, byStatus, byChannel, recentFailures] = await Promise.all([
    prisma.notificationDelivery.count({ where: whereClause }),

    prisma.notificationDelivery.groupBy({
      by: ['status'],
      where: whereClause,
      _count: true,
    }),

    prisma.notificationDelivery.groupBy({
      by: ['channel'],
      where: whereClause,
      _count: true,
    }),

    prisma.notificationDelivery.findMany({
      where: { ...whereClause, status: 'FAILED' },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        eventType: true,
        channel: true,
        status: true,
        recipient: true,
        lastError: true,
        attempts: true,
        maxAttempts: true,
        nextAttemptAt: true,
        createdAt: true,
      },
    }),
  ]);

  // Normalize the byStatus and byChannel results
  const byStatusMap = { PENDING: 0, SENT: 0, FAILED: 0, SKIPPED: 0 };
  for (const { status, _count } of byStatus) {
    byStatusMap[status] = _count;
  }

  const byChannelMap = { IN_APP: 0, EMAIL: 0, SMS: 0 };
  for (const { channel, _count } of byChannel) {
    byChannelMap[channel] = _count;
  }

  return {
    total,
    byStatus: byStatusMap,
    byChannel: byChannelMap,
    recentFailures,
  };
}

/**
 * Admin: List deliveries (for monitoring page).
 */
async function listDeliveries(options = {}) {
  const {
    status,
    channel,
    eventType,
    userId,
    page = 1,
    limit = 20,
  } = options;

  let whereClause = {};

  if (status) whereClause.status = status;
  if (channel) whereClause.channel = channel;
  if (eventType) whereClause.eventType = { contains: eventType };
  if (userId) whereClause.userId = userId;

  const [data, total] = await Promise.all([
    prisma.notificationDelivery.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.notificationDelivery.count({ where: whereClause }),
  ]);

  return {
    data,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

module.exports = {
  processPendingDeliveries,
  calculateBackoff,
  getDeliveryStats,
  listDeliveries,
};