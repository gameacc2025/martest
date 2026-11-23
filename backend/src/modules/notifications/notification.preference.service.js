// مسیر فایل: backend/src/modules/notifications/notification.preference.service.js
// =============================================================
// User notification preferences (flow/06 §3):
//
// Every (user, event, channel) combination is individually toggleable —
// NO channel is mandatory. A missing preference row means "use the
// event's channel defaults" (IN_APP + EMAIL on, SMS off), so a user who
// never touches the settings page gets the sensible defaults.
//
// The effective matrix returned by getPreferences() is what the settings
// page renders: one row per event with the resolved boolean per channel.
// The dispatch service (notification.dispatch.service.js) reads the same
// stored rows + the same fallback logic, so what the user configures here
// is exactly what dispatch honours.
// =============================================================

const prisma = require('../../config/db');
const smsProvider = require('./notification.sms.provider');
const { recordAuditLogExplicit } = require('../audit/audit.service');
const { AUDIT_ACTIONS } = require('../audit/audit.events');
const { getEvent, isKnownEvent, listEventKeys, listEvents, DEFAULT_CHANNELS } = require('./notification.events');

// Channel order is significant for the preferences UI (IN_APP, EMAIL, SMS).
const CHANNELS = ['IN_APP', 'EMAIL', 'SMS'];

/**
 * Effective preference matrix for one user: the event catalog (defaults)
 * overlaid with the user's stored overrides.
 *
 * @param {number} userId
 * @returns {Promise<{ data: Array<{ eventType: string, label: string, channels: Object, defaults: Object }>, smsAvailable: boolean }>}
 */
async function getPreferences(userId) {
  const stored = await prisma.notificationPreference.findMany({
    where: { userId },
  });
  const storedBySlot = new Map(stored.map((row) => [`${row.eventType}:${row.channel}`, row.enabled]));

  const smsAvailable = smsProvider.hasRealProvider();
  const data = listEvents().map((event) => {
    const channels = {};
    for (const channel of Object.keys(DEFAULT_CHANNELS)) {
      const stored = storedBySlot.get(`${event.key}:${channel}`);
      channels[channel] = channel === 'SMS' && !smsAvailable
        ? false
        : (stored === undefined ? (event.channels[channel] ?? DEFAULT_CHANNELS[channel]) : stored);
    }
    return {
      eventType: event.key,
      label: event.label,
      channels,
      defaults: { ...event.channels },
    };
  });

  // SMS is available only when the Twilio adapter has valid server credentials.
  // Even then, every event defaults to OFF and requires an explicit user opt-in.
  return { data, smsAvailable };
}

/**
 * Upsert a batch of (eventType, channel, enabled) rows for one user.
 * Validation is authoritative here (the route schema is a first filter):
 * unknown event keys / channels / non-boolean enabled are rejected with a
 * 400 so a typo can never silently create a dead preference row.
 *
 * @param {number} userId
 * @param {Array<{ eventType: string, channel: string, enabled: boolean }>} updates
 * @returns {Promise<Object>} the effective matrix after the update
 */
async function updatePreferences(userId, updates, actor = {}) {
  if (!Array.isArray(updates)) {
    throw { statusCode: 400, code: 'INVALID_PREFERENCES', message: 'preferences must be an array.' };
  }

  for (const update of updates) {
    const { eventType, channel, enabled } = update || {};
    if (!isKnownEvent(eventType)) {
      throw {
        statusCode: 400,
        code: 'UNKNOWN_NOTIFICATION_EVENT',
        message: `Unknown notification event "${eventType}".`,
      };
    }
    if (!Object.keys(DEFAULT_CHANNELS).includes(channel)) {
      throw {
        statusCode: 400,
        code: 'INVALID_NOTIFICATION_CHANNEL',
        message: `Invalid notification channel "${channel}".`,
      };
    }
    if (typeof enabled !== 'boolean') {
      throw {
        statusCode: 400,
        code: 'INVALID_PREFERENCE_ENABLED',
        message: 'enabled must be a boolean.',
      };
    }
    if (channel === 'SMS' && enabled && !smsProvider.hasRealProvider()) {
      throw {
        statusCode: 503,
        code: 'SMS_PROVIDER_NOT_CONFIGURED',
        message: 'درگاه پیامک روی سرور پیکربندی نشده است.',
      };
    }
  }

  const seenSlots = new Set();
  for (const { eventType, channel } of updates) {
    const slot = `${eventType}:${channel}`;
    if (seenSlots.has(slot)) {
      throw { statusCode: 400, code: 'DUPLICATE_NOTIFICATION_PREFERENCE', message: 'Each event/channel preference may appear only once per request.' };
    }
    seenSlots.add(slot);
  }

  await prisma.$transaction(async (tx) => {
    for (const { eventType, channel, enabled } of updates) {
      const where = { userId_eventType_channel: { userId, eventType, channel } };
      const existing = await tx.notificationPreference.findUnique({ where });
      if (existing?.enabled === enabled) continue;

      await tx.notificationPreference.upsert({
        where,
        update: { enabled },
        create: { userId, eventType, channel, enabled },
      });
      await recordAuditLogExplicit({
        tx,
        actorUserId: actor?.id || userId,
        actorAccessType: actor?.accessType || 'CUSTOMER',
        companyId: actor?.companyId || null,
        action: AUDIT_ACTIONS.NOTIFICATION_PREFERENCE_UPDATED,
        entityType: 'NotificationPreference',
        entityId: `${userId}:${eventType}:${channel}`,
        before: existing ? { eventType, channel, enabled: existing.enabled } : null,
        after: { eventType, channel, enabled },
        metadata: { eventType, channel, consentSensitive: channel === 'SMS' },
      });
    }
  });

  return getPreferences(userId);
}

module.exports = {
  getPreferences,
  updatePreferences,
};
