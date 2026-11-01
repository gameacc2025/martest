// مسیر فایل: backend/src/modules/notifications/notification.dispatch.service.test.js
// =============================================================
// Unit tests — central notification dispatch
// (dispatchNotification / resolveRecipients / fillMissingEmails)
//
// Covers the mandatory cases from the notification task:
//   - correct recipient resolution (ids, {userId,email}[], descriptors)
//   - notification creation via the event templates
//   - disabled channel preferences (per user × event × channel)
//   - duplicate dispatch safety (dedupeKey + skipDuplicates)
//   - SMS architecture-only behavior (never queued)
//   - transactional persistence (rows written through the caller's tx)
//
// Run with:  node --test
// =============================================================

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const Module = require('node:module');

const serviceDir = __dirname;

function injectMock(relativePath, exportsObj) {
  const resolved = require.resolve(path.join(serviceDir, relativePath));
  const original = require.cache[resolved];
  require.cache[resolved] = new Module(resolved);
  require.cache[resolved].exports = exportsObj;
  require.cache[resolved].loaded = true;
  test.after(() => {
    if (original) require.cache[resolved] = original;
    else delete require.cache[resolved];
  });
  return resolved;
}

// ── Mock prisma layer ────────────────────────────────────────
const fx = {
  users: [],               // user.findMany result (filtered by id when args.where.id.in is set)
  preferences: [],         // notificationPreference.findMany result
  duplicateEmailRows: 0,   // simulated unique-index hits in delivery.createMany
  calls: {},               // recorded prisma calls, keyed by "model.method"
};

function record(key, args) {
  (fx.calls[key] = fx.calls[key] || []).push(args);
}
const calls = (key) => fx.calls[key] || [];
const deliveryRows = () => calls('notificationDelivery.createMany').flatMap((a) => a.data);

const mockPrisma = {
  user: {
    findMany: async (args) => {
      record('user.findMany', args);
      const ids = args?.where?.id?.in;
      return Array.isArray(ids) ? fx.users.filter((u) => ids.includes(u.id)) : fx.users;
    },
  },
  notification: {
    createMany: async (args) => {
      record('notification.createMany', args);
      return { count: args.data.length };
    },
  },
  notificationPreference: {
    findMany: async (args) => { record('notificationPreference.findMany', args); return fx.preferences; },
  },
  notificationDelivery: {
    createMany: async (args) => {
      record('notificationDelivery.createMany', args);
      // Simulate the unique index + skipDuplicates semantics: tests queue
      // "already existing" rows via fx.duplicateEmailRows.
      return { count: Math.max(0, args.data.length - fx.duplicateEmailRows) };
    },
  },
};

function resetMocks() {
  fx.users = [];
  fx.preferences = [];
  fx.duplicateEmailRows = 0;
  fx.calls = {};
}

resetMocks();
test.beforeEach(() => resetMocks());

injectMock('../../config/db', mockPrisma);

const { dispatchNotification, resolveRecipients } = require('./notification.dispatch.service');

// ── Event validation ─────────────────────────────────────────

test('dispatchNotification: throws 400 UNKNOWN_NOTIFICATION_EVENT for unknown keys', async () => {
  await assert.rejects(
    () => dispatchNotification('MADE_UP_EVENT', [1], {}),
    (err) => err.code === 'UNKNOWN_NOTIFICATION_EVENT' && err.statusCode === 400
  );
});

test('dispatchNotification: rejects unknown events even with no recipients', async () => {
  await assert.rejects(() => dispatchNotification('NOPE', [], {}));
});

test('dispatchNotification: empty recipients is a no-op (no rows, no preference query)', async () => {
  const summary = await dispatchNotification('PRODUCT_SUBMITTED_FOR_REVIEW', [], {});
  assert.equal(summary.recipients, 0);
  assert.equal(summary.inApp.created, 0);
  assert.equal(summary.email.queued, 0);
  assert.equal(calls('notification.createMany').length, 0);
  assert.equal(calls('notificationPreference.findMany').length, 0);
});

// ── In-app persistence + templates ───────────────────────────

test('dispatchNotification: creates one typed in-app row per recipient', async () => {
  await dispatchNotification('PRODUCT_STATUS_CHANGED', [10, 11], {
    product: { id: 5, title: 'Router X' },
    status: 'APPROVED',
  });

  const args = calls('notification.createMany')[0];
  assert.equal(args.data.length, 2);
  assert.deepEqual(args.data.map((n) => n.userId), [10, 11]);
  for (const row of args.data) {
    assert.equal(row.type, 'PRODUCT_STATUS_CHANGED');
    assert.equal(row.title, 'Product approved');
    assert.equal(row.message, 'Product "Router X" status changed to APPROVED.');
    assert.deepEqual(row.data, { productId: 5, status: 'APPROVED', comment: null });
  }
});

test('dispatchNotification: submit-review template reproduces the pre-dispatch strings exactly', async () => {
  await dispatchNotification('PRODUCT_SUBMITTED_FOR_REVIEW', [1, 2], {
    product: { id: 7, title: 'Switch S' },
  });

  const row = calls('notification.createMany')[0].data[0];
  assert.equal(row.title, 'Product pending review');
  assert.equal(row.message, 'Product "Switch S" status changed to PENDING_REVIEW.');
  assert.equal(row.data.productId, 7);
  assert.equal(row.data.status, 'PENDING_REVIEW');
});

test('dispatchNotification: REJECTED keeps the pre-dispatch rejection-reason wording', async () => {
  await dispatchNotification('PRODUCT_STATUS_CHANGED', [3], {
    product: { id: 9, title: 'Modem M' },
    status: 'REJECTED',
    comment: 'تصاویر نامناسب',
  });
  const row = calls('notification.createMany')[0].data[0];
  assert.equal(row.title, 'Product rejected');
  assert.equal(row.message, 'Product "Modem M" status changed to REJECTED. Reason: تصاویر نامناسب');
});

test('dispatchNotification: deduplicates recipient ids and ignores invalid entries', async () => {
  const summary = await dispatchNotification('PRODUCT_STATUS_CHANGED', [10, '10', 11, 0, -2, 'abc', null], {
    product: { id: 5, title: 'X' },
    status: 'APPROVED',
  });
  const rows = calls('notification.createMany')[0].data;
  assert.deepEqual(rows.map((n) => n.userId).sort((a, b) => a - b), [10, 11]);
  assert.equal(summary.recipients, 2);
});

// ── Preferences: disabled channels are respected ─────────────

test('dispatchNotification: IN_APP disabled for a user → no row for them, counted as disabled', async () => {
  fx.preferences = [
    { userId: 10, eventType: 'PRODUCT_STATUS_CHANGED', channel: 'IN_APP', enabled: false },
  ];

  const summary = await dispatchNotification('PRODUCT_STATUS_CHANGED', [10, 11], {
    product: { id: 5, title: 'X' }, status: 'APPROVED',
  });

  const rows = calls('notification.createMany')[0].data;
  assert.deepEqual(rows.map((n) => n.userId), [11]); // user 10 opted out
  assert.equal(summary.inApp.created, 1);
  assert.equal(summary.inApp.disabled, 1);
});

test('dispatchNotification: EMAIL preference disabled → no delivery row queued', async () => {
  fx.users = [{ id: 10, email: 'a@x.com' }, { id: 11, email: 'b@x.com' }];
  fx.preferences = [
    { userId: 10, eventType: 'PRODUCT_STATUS_CHANGED', channel: 'EMAIL', enabled: false },
  ];

  const summary = await dispatchNotification('PRODUCT_STATUS_CHANGED', [10, 11], {
    product: { id: 5, title: 'X' }, status: 'APPROVED',
  });

  const rows = deliveryRows();
  assert.equal(rows.length, 1); // only user 11
  assert.equal(rows[0].recipient, 'b@x.com');
  assert.equal(summary.email.preferenceDisabled, 1);
  assert.equal(summary.email.queued, 1);
});

test('dispatchNotification: missing preference row falls back to event defaults (IN_APP+EMAIL on, SMS off)', async () => {
  fx.users = [{ id: 7, email: 'x@y.z' }];
  const summary = await dispatchNotification('INQUIRY_PUBLISHED', [7], { inquiry: { id: 4, title: 'استعلام تست' } });

  assert.equal(calls('notification.createMany').length, 1);
  const rows = deliveryRows();
  assert.equal(rows.length, 1);
  assert.equal(rows[0].channel, 'EMAIL');
  assert.equal(rows[0].status, 'PENDING');
  assert.equal(summary.sms.notImplemented, 0); // SMS default = off
});

test('dispatchNotification: preferences are queried only for the dispatched event key', async () => {
  await dispatchNotification('INQUIRY_PUBLISHED', [7], { inquiry: { id: 1 } });
  assert.deepEqual(calls('notificationPreference.findMany')[0].where, {
    userId: { in: [7] },
    eventType: 'INQUIRY_PUBLISHED',
  });
});

// ── Email queueing ───────────────────────────────────────────

test('dispatchNotification: queues a PENDING email row with template subject/body and dedupeKey', async () => {
  fx.users = [{ id: 7, email: 'manager@corp.example' }];

  const summary = await dispatchNotification(
    'PRODUCT_SUBMITTED_FOR_REVIEW',
    [7],
    { product: { id: 12, title: 'Antenna A' } },
    { dedupeKey: 'product:5:submit' }
  );

  const rows = deliveryRows();
  assert.equal(rows.length, 1);
  assert.deepEqual(rows[0], {
    userId: 7,
    eventType: 'PRODUCT_SUBMITTED_FOR_REVIEW',
    channel: 'EMAIL',
    status: 'PENDING',
    recipient: 'manager@corp.example',
    subject: 'Product pending review',
    body: 'Product "Antenna A" status changed to PENDING_REVIEW.',
    maxAttempts: 3,
    dedupeKey: 'product:5:submit',
  });
  assert.equal(summary.email.queued, 1);
  assert.equal(summary.email.noEmailAddress, 0);
});

test('dispatchNotification: recipients without an email are counted, not queued (in-app still delivered)', async () => {
  fx.users = [{ id: 7, email: null }];

  const summary = await dispatchNotification('PRODUCT_STATUS_CHANGED', [7], {
    product: { id: 2, title: 'X' }, status: 'PUBLISHED',
  });

  assert.equal(deliveryRows().length, 0);
  assert.equal(summary.email.noEmailAddress, 1);
  assert.equal(summary.email.queued, 0);
  assert.equal(summary.inApp.created, 1);
});

test('dispatchNotification: callers may pass known emails as {userId, email} (no extra lookup)', async () => {
  const summary = await dispatchNotification('ORDER_PLACED', [{ userId: 3, email: 'c@x.com' }], { order: { id: 55 } });
  assert.equal(deliveryRows()[0].recipient, 'c@x.com');
  assert.equal(calls('user.findMany').length, 0);
  assert.equal(summary.email.queued, 1);
});

test('dispatchNotification: duplicate dispatch with the same dedupeKey queues nothing new', async () => {
  fx.users = [{ id: 7, email: 'a@x.com' }];

  const first = await dispatchNotification('ORDER_PLACED', [7], { order: { id: 1 } }, { dedupeKey: 'order:1:placed' });
  assert.equal(first.email.queued, 1);

  // Second dispatch of the same event+key: the unique index eats the row.
  fx.duplicateEmailRows = 1;
  const second = await dispatchNotification('ORDER_PLACED', [7], { order: { id: 1 } }, { dedupeKey: 'order:1' });
  assert.equal(second.email.queued, 0);
  assert.equal(second.email.duplicates, 1);

  // createMany always passes skipDuplicates so the DB enforces this too.
  assert.equal(calls('notificationDelivery.createMany')[0].skipDuplicates, true);
  assert.equal(calls('notificationDelivery.createMany')[1].data[0].dedupeKey, 'order:1');
});

// ── SMS is architecture-only ─────────────────────────────────

test('dispatchNotification: SMS-enabled user is counted as notImplemented, never queued', async () => {
  fx.preferences = [
    { userId: 7, eventType: 'PRODUCT_STATUS_CHANGED', channel: 'SMS', enabled: true },
  ];

  const summary = await dispatchNotification('PRODUCT_STATUS_CHANGED', [7], {
    product: { id: 1, title: 'X' }, status: 'APPROVED',
  });

  assert.equal(summary.sms.notImplemented, 1);
  assert.equal(summary.sms.queued, 0);
  // Only EMAIL rows are ever written to the delivery table.
  for (const row of deliveryRows()) {
    assert.equal(row.channel, 'EMAIL');
  }
});

// ── Recipient resolution ─────────────────────────────────────

test('resolveRecipients: dedupes a flat id list and drops invalid entries', async () => {
  const resolved = await resolveRecipients(mockPrisma, [1, '1', 2, 'x', -3, { userId: 3 }]);
  assert.deepEqual(resolved.map((r) => r.userId), [1, 2, 3]);
});

test('resolveRecipients: { companyIds } resolves ACTIVE members of those companies', async () => {
  fx.users = [{ id: 4, email: 'a@b.c' }, { id: 5, email: null }];
  const resolved = await resolveRecipients(mockPrisma, { companyIds: [2, 3] });

  const where = calls('user.findMany').at(-1).where;
  assert.deepEqual(where.accessProfile, {
    companyId: { in: [2, 3] },
    type: 'COMPANY',
    isActive: true,
  });
  assert.equal(where.status, 'ACTIVE');
  assert.deepEqual(resolved, [
    { userId: 4, email: 'a@b.c' },
    { userId: 5, email: null },
  ]);
});

test('resolveRecipients: { permission } includes SUPER_ADMIN and permission holders', async () => {
  fx.users = [{ id: 1, email: 's@x.com' }];
  const resolved = await resolveRecipients(mockPrisma, { permission: 'companies.activate' });

  const args = calls('user.findMany').at(-1);
  assert.deepEqual(args.select, { id: true, email: true });
  assert.deepEqual(args.where.OR, [
    { roles: { some: { role: { name: 'SUPER_ADMIN' } } } },
    { roles: { some: { role: { permissions: { some: { permission: { name: 'companies.activate' } } } } } } },
  ]);
  assert.deepEqual(resolved, [{ userId: 1, email: 's@x.com' }]);
});

test('resolveRecipients: { roles, companyId } scopes role lookup to one company', async () => {
  fx.users = [{ id: 8, email: 'm@x.com' }];
  const resolved = await resolveRecipients(mockPrisma, { roles: ['COMPANY_MANAGER'], companyId: 10 });

  const args = calls('user.findMany').at(-1);
  assert.deepEqual(args.where.roles, { some: { role: { name: { in: ['COMPANY_MANAGER'] } } } });
  assert.deepEqual(args.where.accessProfile, { companyId: 10 });
  assert.equal(resolved[0].userId, 8);
});

test('resolveRecipients: null/undefined recipients resolve to nobody', async () => {
  assert.deepEqual(await resolveRecipients(mockPrisma, null), []);
  assert.deepEqual(await resolveRecipients(mockPrisma, undefined), []);
});

test('dispatchNotification: flat ids get their emails filled from the user table', async () => {
  fx.users = [{ id: 10, email: 'u10@x.com' }, { id: 11, email: null }];

  const summary = await dispatchNotification('COMPANY_STATUS_CHANGED', [10, 11], { company: { id: 2, name: 'C' }, status: 'SUSPENDED' });

  const rows = deliveryRows();
  assert.equal(rows.length, 1); // user 11 has no email → skipped for email only
  assert.equal(rows[0].recipient, 'u10@x.com');
  assert.equal(summary.email.noEmailAddress, 1);
  assert.equal(summary.email.preferenceDisabled, 0);
});

// ── Transactional persistence ────────────────────────────────

test('dispatchNotification: writes through the caller transaction (tx), not the global prisma', async () => {
  const txCalls = [];
  const tx = {
    user: { findMany: async () => [{ id: 5, email: 't@x.com' }] },
    notificationPreference: { findMany: async () => [] },
    notification: { createMany: async (args) => { tx.calls.push(['notification.createMany', args]); return { count: 1 }; } },
    notificationDelivery: { createMany: async (args) => { tx.calls.push(['notificationDelivery.createMany', args]); return { count: 0 }; } },
  };
  tx.calls = [];

  await dispatchNotification('COMPANY_STATUS_CHANGED', [5], { company: { id: 9, name: 'شرکت الف' }, status: 'ACTIVE' }, { tx });

  assert.deepEqual(tx.calls.map(([key]) => key), ['notification.createMany', 'notificationDelivery.createMany']);
  // Nothing was written through the global prisma mock.
  assert.equal(calls('notification.createMany').length, 0);
});

// ── Summary accounting ───────────────────────────────────────

test('dispatchNotification: summary accounts for disabled prefs, missing emails and duplicates', async () => {
  fx.preferences = [
    { userId: 1, eventType: 'INQUIRY_PUBLISHED', channel: 'EMAIL', enabled: false },
  ];
  fx.users = [{ id: 1, email: 'a@x.com' }, { id: 2, email: 'b@x.com' }];

  const summary = await dispatchNotification('INQUIRY_PUBLISHED', [1, 2], { inquiry: { id: 1, title: 'T' } });

  // User 1: email pref disabled. User 2: queued. (No user 3 exists → not a recipient.)
  assert.equal(summary.recipients, 2);
  assert.equal(summary.inApp.created, 2);
  assert.equal(summary.email.queued, 1);
  assert.equal(summary.email.preferenceDisabled, 1);
  assert.equal(summary.email.noEmailAddress, 0);
});

test('dispatchNotification: fully-duplicated dispatch reports duplicates, queues nothing', async () => {
  fx.users = [{ id: 7, email: 'a@x.com' }];
  fx.duplicateEmailRows = 1; // the row "already exists" in the unique index

  const summary = await dispatchNotification('ORDER_PLACED', [7], { order: { id: 1 } }, { dedupeKey: 'order:1' });

  assert.equal(summary.email.queued, 0);
  assert.equal(summary.email.duplicates, 1);
});

test('resolveRecipients: companyIds never includes STAFF or inactive company access profiles', async () => {
  await resolveRecipients(mockPrisma, { companyIds: [10] });
  const args = calls('user.findMany').at(-1);
  assert.deepEqual(args.where, {
    accessProfile: {
      companyId: { in: [10] },
      type: 'COMPANY',
      isActive: true,
    },
    status: 'ACTIVE',
  });
});
