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

// Mock prisma layer
const fx = {
  prefRows: [],
  upsertArgs: [],
  calls: {},
};

function record(key, args) {
  (fx.calls[key] = fx.calls[key] || []).push(args);
}
function resetMocks() {
  fx.prefRows = [];
  fx.upsertArgs = [];
  fx.calls = {};
}

const mockPrisma = {
  notificationPreference: {
    findMany: async (args) => { record('notificationPreference.findMany', args); return fx.prefRows; },
    upsert: async (args) => { record('notificationPreference.upsert', args); fx.upsertArgs.push(args); return { id: 1, ...args.data }; },
  },
};

resetMocks();
injectMock('../../config/db', mockPrisma);

const { getPreferences, updatePreferences } = require('./notification.preference.service');
const { listEventKeys } = require('./notification.events');

// Test suite

test('getPreferences: empty preferences -> event defaults', async () => {
  resetMocks();
  const result = await getPreferences(5);
  assert.equal(result.data.length, listEventKeys().length); // Every event in EVENT_CATALOG has defaults
  assert.equal(result.smsAvailable, false);
});

test('getPreferences: stored overrides applied', async () => {
  resetMocks();
  fx.prefRows = [
    { userId: 5, eventType: 'COMPANY_REGISTERED', channel: 'IN_APP', enabled: false },
    { userId: 5, eventType: 'PRODUCT_SUBMITTED_FOR_REVIEW', channel: 'EMAIL', enabled: false },
  ];
  const result = await getPreferences(5);
  const companyPref = result.data.find((e) => e.eventType === 'COMPANY_REGISTERED');
  assert.equal(companyPref.channels.IN_APP, false);
  const productPref = result.data.find((e) => e.eventType === 'PRODUCT_SUBMITTED_FOR_REVIEW');
  assert.equal(productPref.channels.EMAIL, false);
});

test('updatePreferences: create new rows', async () => {
  resetMocks();
  const updates = [{ eventType: 'COMPANY_REGISTERED', channel: 'IN_APP', enabled: false }];
  const result = await updatePreferences(5, updates);
  const upsertCalls = fx.calls['notificationPreference.upsert'] || [];
  assert.equal(upsertCalls.length, 1, `Expected 1 upsert call, got ${upsertCalls.length}`);
  assert.equal(upsertCalls[0].where.userId_eventType_channel.userId, 5);
  assert.equal(upsertCalls[0].create.userId, 5);
  assert.equal(upsertCalls[0].update.enabled, false);
  assert.ok(Array.isArray(result.data));
  assert.equal(result.data.length, listEventKeys().length);
});

test('updatePreferences: updates existing rows', async () => {
  resetMocks();
  const updates = [{ eventType: 'COMPANY_REGISTERED', channel: 'IN_APP', enabled: false }];
  const result = await updatePreferences(5, updates);
  const upsertCalls = fx.calls['notificationPreference.upsert'] || [];
  assert.equal(upsertCalls.length, 1);
  assert.equal(upsertCalls[0].update.enabled, false);
  assert.ok(Array.isArray(result.data));
});

test('updatePreferences: rejects unknown event key', async () => {
  resetMocks();
  const updates = [{ eventType: 'UNKNOWN_EVENT', channel: 'IN_APP', enabled: false }];
  await assert.rejects(() => updatePreferences(5, updates), (err) => {
    assert.equal(err.statusCode, 400);
    assert.equal(err.code, 'UNKNOWN_NOTIFICATION_EVENT');
    return true;
  });
});

test('updatePreferences: rejects invalid channel', async () => {
  resetMocks();
  const updates = [{ eventType: 'COMPANY_REGISTERED', channel: 'INVALID', enabled: false }];
  await assert.rejects(() => updatePreferences(5, updates), (err) => {
    assert.equal(err.statusCode, 400);
    assert.equal(err.code, 'INVALID_NOTIFICATION_CHANNEL');
    return true;
  });
});

test('updatePreferences: rejects non-boolean enabled', async () => {
  resetMocks();
  const updates = [{ eventType: 'COMPANY_REGISTERED', channel: 'IN_APP', enabled: 'yes' }];
  await assert.rejects(() => updatePreferences(5, updates), (err) => {
    assert.equal(err.statusCode, 400);
    assert.equal(err.code, 'INVALID_PREFERENCE_ENABLED');
    return true;
  });
});

test('updatePreferences: rejects non-array input', async () => {
  resetMocks();
  await assert.rejects(() => updatePreferences(5, null), (err) => {
    assert.equal(err.statusCode, 400);
    assert.equal(err.code, 'INVALID_PREFERENCES');
    return true;
  });
});

test('preferences API contract: matches expected shape', async () => {
  resetMocks();
  const result = await getPreferences(99);
  assert.ok(Array.isArray(result.data));
  assert.ok(typeof result.smsAvailable === 'boolean');
  for (const event of result.data) {
    assert.equal(typeof event.eventType, 'string');
    assert.equal(typeof event.label, 'string');
    assert.ok(event.channels);
    assert.ok(event.defaults);
  }
});