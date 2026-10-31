// مسیر فایل: backend/src/utils/openapi-route-docs.test.js
// =============================================================
// Structural sanity tests — OpenAPI route-doc registry.
//
// This file is mostly static documentation data, not logic, so
// these tests don't assert business behavior. They exist to catch
// the two failure modes that matter for a big hand-maintained data
// object like this: (1) a malformed entry (missing summary/tags/
// responses) silently breaking Swagger generation for one route
// while every other route still renders fine, and (2) a duplicate
// "METHOD /path" key silently shadowing an earlier entry (the swagger
// plugin only ever sees the last one — see swagger.plugin.js).
//
// Run with:  node --test
// =============================================================

const test = require('node:test');
const assert = require('node:assert/strict');
const docs = require('./openapi-route-docs');

const ROUTE_KEY_RE = /^[A-Z]+ \/api\/v1\/[^\s]*$/;
const VALID_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];

test('exports a non-empty plain object', () => {
  assert.equal(typeof docs, 'object');
  assert.ok(docs !== null);
  assert.ok(Object.keys(docs).length > 0);
});

test('every key looks like "METHOD /api/v1/..." with a real HTTP method', () => {
  for (const key of Object.keys(docs)) {
    assert.match(key, ROUTE_KEY_RE, `malformed route key: "${key}"`);
    const method = key.split(' ')[0];
    assert.ok(VALID_METHODS.includes(method), `unknown HTTP method in key: "${key}"`);
  }
});

test('every registered API route has a dedicated OpenAPI route-doc entry', () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const inventory = fs.readFileSync(path.join(__dirname, '../../../docs/API_ROUTE_INVENTORY.md'), 'utf8');
  const registeredKeys = [...inventory.matchAll(/^\| ([A-Z]+) \| `(\/api\/v1[^`]+)` \|/gm)]
    .map((match) => `${match[1]} ${match[2]}`);
  const documentedKeys = new Set(Object.keys(docs));
  const missing = registeredKeys.filter((key) => !documentedKeys.has(key));

  assert.equal(registeredKeys.length, 149, 'update the expected route count when the inventory changes');
  assert.deepEqual(missing, [], 'every registered route must have dedicated OpenAPI metadata');
});

test('every explicitly public route is documented without authentication', () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const inventory = fs.readFileSync(path.join(__dirname, '../../../docs/API_ROUTE_INVENTORY.md'), 'utf8');
  const publicKeys = [...inventory.matchAll(/^\| ([A-Z]+) \| `(\/api\/v1[^`]+)` \| `Public` \|$/gm)]
    .map((match) => `${match[1]} ${match[2]}`);

  for (const key of publicKeys) {
    assert.ok(docs[key], `public route is missing OpenAPI metadata: ${key}`);
    assert.equal(docs[key].authRequired, false, `${key} must explicitly declare authRequired: false`);
  }
});

test('every OpenAPI route-doc key corresponds to a registered route in the API inventory', () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const inventory = fs.readFileSync(path.join(__dirname, '../../../docs/API_ROUTE_INVENTORY.md'), 'utf8');

  for (const key of Object.keys(docs)) {
    const [method, routePath] = key.split(' ');
    const inventoryRow = `| ${method} | \`${routePath}\` |`;
    assert.ok(inventory.includes(inventoryRow), `OpenAPI docs reference an unregistered route: ${key}`);
  }
});

test('source-backed response contracts describe address, notification and inquiry quota payloads', () => {
  const address = docs['GET /api/v1/addresses'].responses[200].properties.data.items;
  assert.ok(address.properties.userId);
  assert.ok(address.properties.recipientName);
  assert.ok(address.properties.isDefault);

  const notifications = docs['GET /api/v1/settings/notifications'].responses[200].properties;
  assert.ok(notifications.meta.properties.totalPages);
  assert.ok(notifications.data.items.properties.folderMemberships);

  const unread = docs['GET /api/v1/settings/notifications/unread-count'].responses[200].properties;
  assert.ok(unread.count);

  const bulk = docs['POST /api/v1/settings/notifications/bulk-delete'].responses[200].properties;
  assert.ok(bulk.success);
  assert.ok(bulk.count);

  const quota = docs['GET /api/v1/inquiries/quota'].responses[200].properties.data.properties;
  assert.ok(quota.enforced);
  assert.ok(quota.subscription);
  assert.ok(quota.quotas);
  assert.ok(quota.capabilities);
});

test('inquiry subscription response contracts include owner, plan, quota and payment fields', () => {
  const mine = docs['GET /api/v1/inquiries/subscription/me'].responses[200].properties.data.properties;
  assert.ok(mine.subscriptions.items.properties.companyId);
  assert.ok(mine.subscriptions.items.properties.userId);
  assert.ok(mine.subscriptions.items.properties.plan.properties.responsesPerPeriod);
  assert.ok(mine.quota.properties.quotas);

  const purchase = docs['POST /api/v1/inquiries/subscription'].responses[201].properties.data.properties;
  assert.ok(purchase.paymentMode);
  assert.ok(purchase.subscription);
  assert.ok(purchase.subscription.properties.plan.properties.name);
  assert.equal(purchase.subscription.properties.plan.properties.code, undefined);
  assert.ok(purchase.paymentUrl);

  const verification = docs['POST /api/v1/inquiries/subscription/:id/verify-payment'].responses[200].properties.data.properties;
  assert.ok(verification.payment);
  assert.ok(verification.subscriptionId);
  assert.ok(verification.refId);
});

test('admin notification response contracts match delivery and folder controller envelopes', () => {
  const stats = docs['GET /api/v1/admin/notifications/delivery-stats'].responses[200].properties.data.properties;
  assert.ok(stats.total);
  assert.ok(stats.byStatus.properties.FAILED);
  assert.ok(stats.byChannel.properties.SMS);
  assert.ok(stats.recentFailures.items.properties.lastError);

  const deliveries = docs['GET /api/v1/admin/notifications/deliveries'].responses[200].properties;
  assert.ok(deliveries.data.items);
  assert.ok(deliveries.meta.properties.totalPages);

  assert.ok(docs['POST /api/v1/admin/notifications/send'].responses[202]);
  assert.ok(docs['DELETE /api/v1/addresses/:id'].responses[204]);
});

test('product history and inquiry conversation response contracts match service projections', () => {
  const priceHistory = docs['GET /api/v1/products/:id/price-history'].responses[200].properties.data.items.properties;
  assert.ok(priceHistory.price);
  assert.ok(priceHistory.recordedAt);
  assert.ok(priceHistory.minQuantity);

  const productHistory = docs['GET /api/v1/products/:id/history'].responses[200].properties.data.items.properties;
  assert.ok(productHistory.previousStatus);
  assert.ok(productHistory.changedBy.properties.profile);

  const activity = docs['GET /api/v1/products/:id/activity'].responses[200].properties.data.items.properties;
  assert.ok(activity.action);
  assert.ok(activity.actor.properties.email);

  const messages = docs['GET /api/v1/inquiries/:id/messages'].responses[200].properties.data.items.properties;
  assert.ok(messages.body);
  assert.ok(messages.senderUser);
  assert.ok(messages.recipientCompany);

  const sentMessage = docs['POST /api/v1/inquiries/:id/messages'].responses[201].properties.data.properties;
  assert.ok(sentMessage.smsQueued);
  assert.ok(sentMessage.smsSkippedReason);

  const responses = docs['GET /api/v1/inquiries/:id/responses'].responses[200].properties.data.items.properties;
  assert.ok(responses.company);
  assert.ok(responses.items.items.properties.inquiryItem);
  assert.ok(responses.attachments.items.properties.filename);

  const decision = docs['PATCH /api/v1/inquiries/:id/responses/:responseId/decision'].responses[200].properties.data.properties;
  assert.ok(decision.id);
  assert.ok(decision.inquiryId);
  assert.ok(decision.status);
  assert.equal(decision.companyId, undefined);

  const attachment = docs['POST /api/v1/inquiries/:id/responses/:responseId/attachments'].responses[201].properties.data.properties;
  assert.ok(attachment.url);
  assert.ok(attachment.filename);
});

test('every entry has a non-empty summary, description, and tags array', () => {
  for (const [key, entry] of Object.entries(docs)) {
    assert.equal(typeof entry.summary, 'string', `${key}: summary must be a string`);
    assert.ok(entry.summary.length > 0, `${key}: summary must not be empty`);
    assert.equal(typeof entry.description, 'string', `${key}: description must be a string`);
    assert.ok(entry.description.length > 0, `${key}: description must not be empty`);
    assert.ok(Array.isArray(entry.tags), `${key}: tags must be an array`);
    assert.ok(entry.tags.length > 0, `${key}: tags must not be empty`);
  }
});

test('every entry declares a `responses` object with at least one status code', () => {
  for (const [key, entry] of Object.entries(docs)) {
    assert.equal(typeof entry.responses, 'object', `${key}: responses must be an object`);
    assert.ok(Object.keys(entry.responses).length > 0, `${key}: responses must not be empty`);
  }
});

test('every route with a `params` schema requires exactly the {id} / {id,subId} tokens present in its own key', () => {
  for (const [key, entry] of Object.entries(docs)) {
    if (!entry.params) continue;
    const pathPart = key.split(' ')[1];
    const pathTokens = [...pathPart.matchAll(/:([a-zA-Z]+)/g)].map((m) => m[1]);
    for (const required of entry.params.required) {
      assert.ok(
        pathTokens.includes(required),
        `${key}: params requires "${required}" but the route path has no :${required} token`
      );
    }
  }
});

test('no duplicate "METHOD /path" keys silently shadow each other (Object.assign into the same object would do this)', () => {
  // Re-require the raw source and count literal key occurrences as a
  // best-effort static check, since a JS object literal can't actually
  // hold two identical keys at runtime (the second silently wins) —
  // this test would only catch it if someone assigns the same key
  // twice via separate Object.assign(docs, {...}) blocks, which IS a
  // real risk given this file's structure (see the multiple
  // `Object.assign(docs, {...})` calls at the bottom of the file).
  const fs = require('node:fs');
  const path = require('node:path');
  const source = fs.readFileSync(path.join(__dirname, 'openapi-route-docs.js'), 'utf8');
  const keyMatches = [...source.matchAll(/^\s*'((?:GET|POST|PUT|PATCH|DELETE) \/api\/v1\/[^']*)':/gm)].map((m) => m[1]);

  const seen = new Set();
  const duplicates = [];
  for (const key of keyMatches) {
    if (seen.has(key)) duplicates.push(key);
    seen.add(key);
  }
  assert.deepEqual(duplicates, []);
});
