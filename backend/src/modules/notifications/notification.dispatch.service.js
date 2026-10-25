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
//      NotificationDelivery rows; the email provider is contacted later by
//      the delivery worker (notification.delivery.service.js). An email
//      outage therefore can never corrupt or block the business transaction
//      that requested the notification.
//   3. PREFERENCES — every (user, event, channel) can be disabled by the
//      user (NotificationPreference). A missing row falls back to the
//      event's channel defaults (IN_APP + EMAIL on, SMS off). No channel is
//      mandatory (flow/06 §3).
//   4. DUPLICATE DISPATCH IS SAFE — with a dedupeKey, the unique index on
//      (eventType, dedupeKey, channel) + createMany({ skipDuplicates: true })
//      makes re-dispatching the same event a no-op instead of a double send.
//   5. SMS IS NOT IMPLEMENTED — the channel exists in the enum and in
//      preferences (flow/06 §3.3: architecture must be ready), but dispatch
//      never queues SMS rows; users who enabled SMS for an event are counted
//      in the returned summary as sms.notImplemented (observable, not silent).
// =============================================================

const prisma = require('../../config/db');
const { getEvent, DEFAULT_CHANNELS } = require('./notification.events');

const CHANNELS = ['IN_APP', 'EMAIL', 'SMS'];

// Max provider attempts stamped onto queued email rows (the delivery worker
// applies exponential backoff between attempts). Mirrored in config/env.js.
const DEFAULT_MAX_ATTEMPTS = 3;

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

  // Descriptor: members of the given companies (ACTIVE only, matching the
  // pre-existing getCompanyUserIds helper in product.service.js).
  if (!Array.isArray(recipients) && Array.isArray(recipients.companyIds)) {
    const users = await client.user.findMany({
      where: {
        accessProfile: { companyId: { in: recipients.companyIds.map(Number) } },
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
        ...(recipients.companyId !== undefined ? { accessProfile: { companyId: Number(recipients.companyId) } } : {}),
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

  // ── Channel: SMS — preferences supported, delivery NOT implemented ──
  summary.sms.notImplemented = userIds.filter((id) => channelEnabled(id, 'SMS')).length;

  return summary;
}

module.exports = {
  CHANNELS,
  dispatchNotification,
  resolveRecipients,
  fillMissingEmails,
};
