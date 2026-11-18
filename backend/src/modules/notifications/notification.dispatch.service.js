// مسیر فایل: backend/src/modules/notifications/notification.dispatch.service.js
// =============================================================
// Central multi-channel notification dispatch (flow/06 §4).
//
// THE integration contract: every module that wants to notify users calls
// dispatchNotification(eventKey, recipients, context, { tx, dedupeKey }) —
// never prisma.notification.create directly.
//
// Design (flow/06 §3 + the notification task requirements):
//   1. PERSISTENCE IS TRANSACTIONAL — in-app notification rows AND email
//      outbox rows are written through the caller's `tx` so they commit /
//      roll back atomically with the business operation that requested them.
//   2. EXTERNAL DELIVERY IS SEPARATE — dispatch only queues PENDING
//      NotificationDelivery rows; the email/SMS provider is contacted later by
//      the delivery worker (notification.delivery.service.js). An email/SMS
//      outage therefore can never corrupt or block the business transaction
//      that requested the notification.
//   3. PREFERENCES — every (user, event, channel) can be disabled by the
//      user (NotificationPreference). A missing row falls back to the
//      event's channel defaults (IN_APP + EMAIL on, SMS off). No channel is
//      mandatory (flow/06 §3).
//   4. DUPLICATE DISPATCH IS SAFE — with a dedupeKey, the unique index on
//      (eventType, dedupeKey, channel) + createMany({ skipDuplicates: true })
//      makes re-dispatching the same event a no-op instead of a double send.
//   5. SMS IS IMPLEMENTED — queues SMS delivery rows when:
//      - recipient has opted in (NotificationPreference SMS enabled for event)
//      - recipient has a valid phone number
//      - sender has available SMS quota (via inquiry-subscription service)
//      - Twilio provider is configured (checked by delivery worker)
// =============================================================

const prisma = require('../../config/db');
const { getEvent, DEFAULT_CHANNELS } = require('./notification.events');
const smsProvider = require('./notification.sms.provider');

// consumeUsage is required dynamically inside dispatchNotification to support
// test mocking via require.cache replacement (the function reference would
// otherwise be captured at module load time before test mocks are installed).
function getConsumeUsage() {
  return require('../inquiries/inquiry-subscription.service').consumeUsage;
}

const CHANNELS = ['IN_APP', 'EMAIL', 'SMS'];

// Max provider attempts stamped onto queued email/SMS rows (the delivery worker
// applies exponential backoff between attempts). Mirrored in config/env.js.
const DEFAULT_MAX_ATTEMPTS = 3;

// Validate phone number format for Iranian numbers
function validatePhoneNumber(phone) {
  if (!phone || typeof phone !== 'string') return false;
  const trimmed = phone.trim();
  // Accept Iranian mobile numbers: 09XXXXXXXXX or +989XXXXXXXXX or 989XXXXXXXXX
  const iranMobileRegex = /^(?:09|\+989|989)\d{9}$/;
  return iranMobileRegex.test(trimmed);
}

function normalizePhoneNumber(phone) {
  if (!phone || typeof phone !== 'string') return null;
  const trimmed = phone.trim();
  // Normalize to 09XXXXXXXXX format
  if (trimmed.startsWith('+989')) return '0' + trimmed.slice(3);
  if (trimmed.startsWith('989')) return '0' + trimmed.slice(2);
  if (trimmed.startsWith('09')) return trimmed;
  return null;
}

// Use the provider adapter's validated configuration check as the single source of truth.
function hasSmsProvider() {
  return smsProvider.hasRealProvider();
}

// ── Recipient resolution ─────────────────────────────────────
//
// `recipients` may be:
//   - a flat array of user ids (numbers/strings) — the common case;
//   - an array of { userId, email? } — caller already knows the emails;
//   - a descriptor object the dispatcher resolves itself:
//       { companyIds: [2, 3] }                → ACTIVE members of those companies
//       { permission: 'companies.activate' }  → ACTIVE users holding that
//                                               permission (or SUPER_ADMIN)
//       { roles: ['SUPER_ADMIN'] }            → active users with these roles
//   - null/undefined → no-op (no rows written, empty summary)

/**
 * Resolve whatever the caller passed into deduplicated [{ userId, email }].
 * @param {object} client - prisma client or transaction client
 * @param {number[]|Object[]|Object} recipients
 * @returns {Promise<Array<{ userId: number, email: string|null }>>}
 */
async function resolveRecipients(client, recipients) {
  if (recipients === null || recipients === undefined) return [];

  // Company-scoped descriptors must resolve only active COMPANY-panel members.
  // STAFF accounts can share the platform Main-company ID.
  if (!Array.isArray(recipients) && Array.isArray(recipients.companyIds)) {
    const users = await client.user.findMany({
      where: {
        accessProfile: {
          companyId: { in: recipients.companyIds.map(Number) },
          type: 'COMPANY',
          isActive: true,
        },
        status: 'ACTIVE',
      },
      select: { id: true, email: true },
    });
    return users.map((u) => ({ userId: u.id, email: u.email || null }));
  }

  // Descriptor: STAFF holding a permission (SUPER_ADMIN always included).
  if (!Array.isArray(recipients) && recipients && recipients.permission) {
    const users = await client.user.findMany({
      where: {
        status: 'ACTIVE',
        // Permission-based recipients are platform alerts. A COMPANY/CUSTOMER
        // account with a stale or misassigned STAFF role must never receive them.
        accessProfile: { type: 'STAFF', isActive: true },
        OR: [
          { roles: { some: { role: { name: 'SUPER_ADMIN' } } } },
          {
            roles: {
              some: { role: { permissions: { some: { permission: { name: String(recipients.permission) } } } } },
            },
          },
        ],
      },
      select: { id: true, email: true },
    });
    return users.map((u) => ({ userId: u.id, email: u.email || null }));
  }

  // Descriptor: by role names (optionally scoped to one company).
  if (!Array.isArray(recipients) && recipients && Array.isArray(recipients.roles)) {
    const users = await client.user.findMany({
      where: {
        status: 'ACTIVE',
        roles: { some: { role: { name: { in: recipients.roles.map(String) } } } },
        accessProfile: recipients.companyId !== undefined
          ? { companyId: Number(recipients.companyId), type: 'COMPANY', isActive: true }
          : { type: 'STAFF', isActive: true },
      },
      select: { id: true, email: true },
    });
    return users.map((u) => ({ userId: u.id, email: u.email || null }));
  }

  // Flat id list (optionally { userId, email } pairs).
  const seen = new Map();
  for (const r of Array.isArray(recipients) ? recipients : []) {
    const userId = typeof r === 'object' ? Number(r?.userId) : Number(r);
    if (!Number.isFinite(userId) || userId <= 0 || seen.has(userId)) continue;
    seen.set(userId, { userId, email: (r && typeof r === 'object' && r.email) || null });
  }
  return [...seen.values()];
}

/**
 * Fill in email addresses for recipients where the caller didn't provide one.
 * @private
 */
async function fillMissingEmails(client, resolved) {
  const missing = resolved.filter((r) => !r.email).map((r) => r.userId);
  if (!missing.length) return resolved;
  const users = await client.user.findMany({
    where: { id: { in: missing } },
    select: { id: true, email: true },
  });
  const emailById = new Map(users.map((u) => [u.id, u.email]));
  return resolved.map((r) => ({ ...r, email: r.email || emailById.get(r.userId) || null }));
}

/**
 * Fill in phone numbers for recipients where the caller didn't provide one.
 * @private
 */
async function fillMissingPhones(client, resolved) {
  const missing = resolved.filter((r) => !r.phone).map((r) => r.userId);
  if (!missing.length) return resolved;
  const users = await client.user.findMany({
    where: { id: { in: missing } },
    select: { id: true, phone: true },
  });
  const phoneById = new Map(users.map((u) => [u.id, u.phone]));
  return resolved.map((r) => ({ ...r, phone: r.phone || phoneById.get(r.userId) || null }));
}

/**
 * Central notification dispatch (in-app + email queueing, transactional).
 *
 * @param {string} eventKey - event key from notification.events.js
 * @param {number[]|Object[]|Object} recipients - ids, {userId,email}[], or a
 *        resolver descriptor ({ companyIds } | { permission } | { roles })
 * @param {Object} [context] - domain data handed to the event template
 * @param {{ tx?: object, dedupeKey?: string|Function, channels?: string[] }} [options]
 * @returns {Promise<Object>} delivery summary (what was created/queued/skipped)
 * @throws {{ statusCode: 400, code: 'UNKNOWN_NOTIFICATION_EVENT' }} unknown key
 */
async function dispatchNotification(eventKey, recipients, context = {}, { tx = null, dedupeKey = null, channels = null } = {}) {
  const client = tx || prisma;
  const event = getEvent(eventKey);
  if (!event) {
    throw {
      statusCode: 400,
      code: 'UNKNOWN_NOTIFICATION_EVENT',
      message: `Unknown notification event "${eventKey}". Use an event key from notification.events.js.`,
    };
  }

  // ── Resolve recipients ───────────────────────────────────────
  let resolved = await resolveRecipients(client, recipients);
  const userIds = resolved.map((r) => r.userId);

  const summary = {
    event: event.key,
    recipients: userIds.length,
    inApp: { enabled: 0, created: 0, disabled: 0 },
    email: { queued: 0, duplicates: 0, preferenceDisabled: 0, noEmailAddress: 0 },
    sms: { queued: 0, notImplemented: 0 },
  };
  if (!userIds.length) return summary;

  // Per-user preferences for THIS event (a missing row → event defaults).
  const prefs = await client.notificationPreference.findMany({
    where: { userId: { in: userIds }, eventType: event.key },
  });
  const prefMap = new Map(prefs.map((p) => [`${p.userId}:${p.channel}`, p.enabled]));
  const requestedChannels = Array.isArray(channels) && channels.length ? new Set(channels) : null;
  const channelEnabled = (userId, channel) => {
    if (requestedChannels && !requestedChannels.has(channel)) return false;
    const pref = prefMap.get(`${userId}:${channel}`);
    if (pref !== undefined) return pref;
    const eventDefault = event.channels[channel];
    return eventDefault === undefined ? DEFAULT_CHANNELS[channel] : eventDefault;
  };

  // ── Channel: IN_APP — persisted atomically with the business op ──
  const inAppRecipients = userIds.filter((id) => channelEnabled(id, 'IN_APP'));
  summary.inApp.enabled = inAppRecipients.length;
  summary.inApp.disabled = userIds.length - inAppRecipients.length;

  if (inAppRecipients.length) {
    const content = event.template(context) || {};
    await client.notification.createMany({
      data: inAppRecipients.map((userId) => ({
        userId,
        type: event.key,
        title: content.title,
        message: content.message,
        data: content.data === undefined ? null : content.data,
      })),
    });
    summary.inApp.created = inAppRecipients.length;
  }

  // ── Channel: EMAIL — queued PENDING; the delivery worker sends later ──
  const emailRecipients = userIds.filter((id) => channelEnabled(id, 'EMAIL'));
  summary.email.preferenceDisabled = userIds.length - emailRecipients.length;

  if (emailRecipients.length) {
    resolved = await fillMissingEmails(client, resolved);
    const content = event.template(context);

    const emailRows = [];
    for (const userId of emailRecipients) {
      const email = resolved.find((r) => r.userId === userId)?.email;
      if (!email) {
        summary.email.noEmailAddress += 1;
        continue;
      }
      emailRows.push({
        userId,
        eventType: event.key,
        channel: 'EMAIL',
        status: 'PENDING',
        recipient: email,
        subject: content.title,
        body: content.message,
        maxAttempts: DEFAULT_MAX_ATTEMPTS,
        dedupeKey: typeof dedupeKey === 'function' ? dedupeKey(userId) : dedupeKey,
      });
    }

    if (emailRows.length) {
      const result = await client.notificationDelivery.createMany({
        data: emailRows,
        // Duplicate dispatch with the same (eventType, dedupeKey, channel) is
        // dropped by the unique index + skipDuplicates — retries are safe.
        skipDuplicates: true,
      });
      const created = Number(result?.count ?? emailRows.length);
      summary.email.queued = created;
      summary.email.duplicates = emailRows.length - created;
    }
  }

  // ── Channel: SMS — queued PENDING; the delivery worker sends later ──
  const smsRecipients = userIds.filter((id) => channelEnabled(id, 'SMS'));
  summary.sms.preferenceDisabled = userIds.length - smsRecipients.length;
  summary.sms.notImplemented = 0; // Legacy field kept for backward compatibility
  summary.sms.providerNotConfigured = 0;
  summary.sms.noPhoneNumber = 0;
  summary.sms.quotaExceeded = 0;
  summary.sms.quotaCheckFailed = 0;
  summary.sms.duplicates = 0;

  if (smsRecipients.length && !hasSmsProvider()) {
    summary.sms.providerNotConfigured = smsRecipients.length;
    return summary;
  }

  if (smsRecipients.length) {
    // Fill in phone numbers for SMS recipients
    resolved = await fillMissingPhones(client, resolved);
    const content = event.template(context);

    const smsRows = [];
    for (const userId of smsRecipients) {
      const phone = resolved.find((r) => r.userId === userId)?.phone;
      const normalizedPhone = phone ? normalizePhoneNumber(phone) : null;

      if (!normalizedPhone || !validatePhoneNumber(normalizedPhone)) {
        summary.sms.noPhoneNumber += 1;
        continue;
      }

      // Determine the quota owner for SMS consumption
      // For support tickets, the quota owner is typically the company sending the notification
      // We'll track this via context.smsQuotaOwner if provided
      const quotaOwnerType = context?.smsQuotaOwner?.type || 'user';
      const quotaOwnerId = context?.smsQuotaOwner?.id || userId;

      // Check SMS quota before queuing (only if enforcement is enabled for the event)
      let quotaSkipped = false;
      try {
        // Use forceEnforcement: true for SMS since it's a paid service
        await getConsumeUsage()({
          ownerType: quotaOwnerType,
          ownerId: quotaOwnerId,
          usageType: 'SMS',
          referenceType: event.key,
          referenceId: context?.referenceId || null,
          forceEnforcement: true,
          tx: client,
        });
      } catch (error) {
        if (error?.code === 'INQUIRY_QUOTA_EXCEEDED' || error?.code === 'INQUIRY_SUBSCRIPTION_REQUIRED') {
          summary.sms.quotaExceeded += 1;
          quotaSkipped = true;
        } else {
          // Fail closed for SMS, but do not roll back the business transaction
          // that requested the notification. An unavailable quota service or
          // changed subscription state must never create an unmetered SMS row.
          summary.sms.quotaCheckFailed += 1;
          quotaSkipped = true;
        }
      }

      if (quotaSkipped) continue;

      smsRows.push({
        userId,
        eventType: event.key,
        channel: 'SMS',
        status: 'PENDING',
        recipient: normalizedPhone,
        subject: null,
        body: content.message,
        maxAttempts: DEFAULT_MAX_ATTEMPTS,
        dedupeKey: typeof dedupeKey === 'function' ? dedupeKey(userId) : dedupeKey,
      });
    }

    if (smsRows.length) {
      const result = await client.notificationDelivery.createMany({
        data: smsRows,
        // Duplicate dispatch with the same (eventType, dedupeKey, channel) is
        // dropped by the unique index + skipDuplicates — retries are safe.
        skipDuplicates: true,
      });
      const created = Number(result?.count ?? smsRows.length);
      summary.sms.queued = created;
      summary.sms.duplicates = smsRows.length - created;
    }
  }

  return summary;
}

module.exports = {
  CHANNELS,
  dispatchNotification,
  resolveRecipients,
  fillMissingEmails,
  fillMissingPhones,
  validatePhoneNumber,
  normalizePhoneNumber,
};
