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

test('admin inquiry subscriptions, notification deliveries, inquiry dashboard and managed product responses are modeled', () => {
  const subscriptionList = docs['GET /api/v1/admin/inquiry-subscriptions'].responses[200].properties.data;
  const subscriptions = subscriptionList.items;
  assert.ok(subscriptions.properties.plan.properties.durationDays);
  assert.ok(subscriptions.properties.company);
  assert.ok(subscriptions.properties.user);
  assert.equal(subscriptionList.maxItems, 100);

  const granted = docs['POST /api/v1/admin/inquiry-subscriptions/grant'].responses[201].properties.data.properties;
  assert.ok(granted.status);
  assert.ok(granted.plan);

  const stats = docs['GET /api/v1/admin/notifications/delivery-stats'].responses[200].properties.data.properties;
  assert.ok(stats.total);
  assert.ok(stats.byStatus.properties.FAILED);
  assert.ok(stats.byChannel.properties.EMAIL);
  assert.equal(stats.recentFailures.maxItems, 10);
  assert.ok(stats.recentFailures.items.properties.lastError);

  const deliveries = docs['GET /api/v1/admin/notifications/deliveries'].responses[200].properties;
  assert.ok(deliveries.data.items.properties.recipient);
  assert.ok(deliveries.data.items.properties.attempts);
  assert.ok(deliveries.meta.properties.totalPages);

  const inquiryStats = docs['GET /api/v1/inquiries/stats'].responses[200].properties.data.properties;
  assert.ok(inquiryStats.sent.properties.byStatus);
  assert.ok(inquiryStats.received.properties.new);
  assert.ok(inquiryStats.responses.properties.successRate);
  assert.equal(inquiryStats.recentInquiries.maxItems, 5);

  const inquiryList = docs['GET /api/v1/inquiries'].responses[200].properties;
  assert.ok(inquiryList.data.items.properties.company);
  assert.ok(inquiryList.data.items.properties._count.properties.items);
  assert.ok(inquiryList.meta.properties.total);

  const products = docs['GET /api/v1/products/my-products'].responses[200].properties;
  assert.ok(products.data.items.properties.status);
  assert.ok(products.data.items.properties.company);
  assert.ok(products.meta.properties.totalPages);

  const productDetail = docs['GET /api/v1/products/:id/manage'].responses[200].properties.data.properties;
  assert.ok(productDetail.images);
  assert.ok(productDetail.documents);
});

test('company and category response contracts match controller/service projections', () => {
  const companyList = docs['GET /api/v1/companies'].responses[200].properties;
  assert.ok(companyList.data.items.properties._count);
  assert.ok(companyList.data.items.properties.inquiryLimit);
  assert.ok(companyList.meta.properties.totalPages);

  const company = docs['GET /api/v1/companies/:id'].responses[200].properties.data.properties;
  assert.ok(company.nationalId);
  assert.ok(company.users.items.properties.firstName);
  assert.equal(company.users.maxItems, 10);

  const companySettings = docs['GET /api/v1/companies/:id/settings'].responses[200].properties.data.properties;
  assert.ok(companySettings.inquiryLimit);
  assert.ok(companySettings.limits.items.properties.key);

  const companyStats = docs['GET /api/v1/companies/:id/statistics'].responses[200].properties.data.properties;
  assert.ok(companyStats.counts.properties.activeUsers);
  assert.equal(companyStats.recentProducts.maxItems, 5);
  assert.equal(companyStats.recentOrders.maxItems, 5);

  const companyProducts = docs['GET /api/v1/companies/:id/products'].responses[200].properties;
  assert.ok(companyProducts.data.items.properties.category);
  assert.ok(companyProducts.data.items.properties.subcategory);
  assert.ok(companyProducts.meta.properties.total);

  const categoryList = docs['GET /api/v1/categories'].responses[200].properties.data;
  assert.ok(categoryList.items.properties.subcategories);
  const subcategories = docs['GET /api/v1/categories/:id/subcategories'].responses[200].properties.data.items.properties;
  assert.ok(subcategories.nameFa);
  const subcategoryDetail = docs['GET /api/v1/categories/:id/subcategories/:subId'].responses[200].properties.data.properties;
  assert.ok(subcategoryDetail.specificationTemplate);
  const categoryProducts = docs['GET /api/v1/categories/:id/products'].responses[200].properties;
  assert.ok(categoryProducts.data.items.properties.company);
  assert.ok(categoryProducts.meta.properties.totalPages);

  assert.equal(docs['DELETE /api/v1/companies/:id'].responses[204].content, undefined);
  assert.equal(docs['DELETE /api/v1/categories/:id'].responses[204].content, undefined);
  assert.equal(docs['DELETE /api/v1/categories/:id/subcategories/:subId'].responses[204].content, undefined);
});

test('user, RBAC, auth, settings and admin dashboard response contracts exclude secrets', () => {
  const userList = docs['GET /api/v1/users'].responses[200].properties;
  assert.ok(userList.data.items.properties.accessProfile);
  assert.ok(userList.data.items.properties.roles);
  assert.equal(userList.data.items.properties.passwordHash, undefined);

  const userDetail = docs['GET /api/v1/users/:id'].responses[200].properties.data.properties;
  assert.ok(userDetail.permissions);
  assert.ok(userDetail.profile);
  assert.equal(userDetail.passwordHash, undefined);

  const role = docs['GET /api/v1/roles/:id'].responses[200].properties.data.properties;
  assert.ok(role.scope);
  assert.ok(role.permissions.items.properties.permission);
  const assignable = docs['GET /api/v1/roles/assignable'].responses[200].properties.data.items.properties;
  assert.ok(assignable.scope);

  const permissionList = docs['GET /api/v1/permissions'].responses[200];
  assert.ok(permissionList.anyOf);
  const permission = docs['GET /api/v1/permissions/:id'].responses[200].properties.data.properties;
  assert.ok(permission.group);

  const login = docs['POST /api/v1/auth/login'].responses[200].properties.data.properties;
  assert.ok(login.tokens.properties.accessToken);
  assert.equal(login.tokens.properties.refreshToken, undefined);
  const refresh = docs['POST /api/v1/auth/refresh'].responses[200].properties.data.properties;
  assert.ok(refresh.tokens.properties.accessToken);
  assert.equal(refresh.tokens.properties.refreshToken, undefined);

  const handoff = docs['POST /api/v1/auth/handoff'].responses[201].properties.data.properties;
  assert.ok(handoff.code);
  assert.equal(handoff.expiresIn.enum[0], 60);
  const redeem = docs['POST /api/v1/auth/handoff/redeem'].responses[200].properties.data.properties;
  assert.ok(redeem.tokens.properties.accessToken);
  assert.ok(redeem.accessProfile);

  const profile = docs['GET /api/v1/settings/profile'].responses[200].properties.data.properties;
  assert.ok(profile.profile);
  assert.ok(profile.accessProfile);
  assert.ok(profile.roles);
  assert.equal(profile.permissions, undefined);
  assert.equal(profile.passwordHash, undefined);

  const adminStats = docs['GET /api/v1/admin/stats'].responses[200].properties.data.properties;
  assert.ok(adminStats.counts.properties.permissions);
  assert.equal(adminStats.recentUsers.maxItems, 5);
  assert.equal(adminStats.pendingProducts.maxItems, 20);
});

test('admin inquiry subscription, delivery monitoring and inquiry dashboard response contracts match service projections', () => {
  const subscriptions = docs['GET /api/v1/admin/inquiry-subscriptions'].responses[200].properties.data;
  assert.equal(subscriptions.type, 'array');
  const subscription = subscriptions.items.properties;
  assert.ok(subscription.paymentAuthority);
  assert.ok(subscription.paymentVerifiedAt);
  assert.ok(subscription.plan.properties.durationDays);
  assert.ok(subscription.company.anyOf[0].properties.name);
  assert.ok(subscription.user.anyOf[0].properties.phone);
  assert.equal(subscription.plan.properties.inquiriesPerPeriod, undefined);

  const deliveryStats = docs['GET /api/v1/admin/notifications/delivery-stats'].responses[200].properties.data.properties;
  assert.ok(deliveryStats.total);
  assert.ok(deliveryStats.byStatus.properties.SKIPPED);
  assert.ok(deliveryStats.byChannel.properties.SMS);
  assert.equal(deliveryStats.recentFailures.maxItems, 10);
  assert.ok(deliveryStats.recentFailures.items.properties.lastError);

  const deliveryList = docs['GET /api/v1/admin/notifications/deliveries'].responses[200].properties;
  assert.ok(deliveryList.data.items.properties.dedupeKey);
  assert.ok(deliveryList.data.items.properties.nextAttemptAt);
  assert.ok(deliveryList.data.items.properties.lastError);
  assert.ok(deliveryList.meta.properties.totalPages);

  const stats = docs['GET /api/v1/inquiries/stats'].responses[200].properties.data.properties;
  assert.ok(stats.sent.properties.byStatus);
  assert.ok(stats.received.properties.new);
  assert.ok(stats.responses.properties.successRate);
  assert.equal(stats.recentInquiries.maxItems, 5);
  assert.equal(stats.recentResponses.maxItems, 5);
  assert.equal(stats.recentInquiries.items.properties.buyerUserId, undefined);
});

test('core product, company, inquiry and notification resource responses match service projections', () => {
  const managedProducts = docs['GET /api/v1/products/my-products'].responses[200].properties;
  assert.ok(managedProducts.data.items.properties.prices.items.properties.price);
  assert.ok(managedProducts.data.items.properties.images.items.properties.thumbnailUrl);
  assert.ok(managedProducts.data.items.properties.documents.items.properties.type);
  assert.equal(managedProducts.data.items.properties.statusHistory.maxItems, 10);
  assert.ok(managedProducts.meta.properties.totalPages);

  const managedProduct = docs['GET /api/v1/products/:id/manage'].responses[200].properties.data.properties;
  assert.ok(managedProduct.editsSinceApproval);
  assert.ok(managedProduct.createdByUserId);
  assert.ok(managedProduct.statusHistory);
  const createdProduct = docs['POST /api/v1/products'].responses[201].properties.data.properties;
  assert.ok(createdProduct.prices);
  assert.ok(createdProduct.documents);
  const updatedProduct = docs['PATCH /api/v1/products/:id'].responses[200].properties.data.properties;
  assert.ok(updatedProduct.company);

  const companies = docs['GET /api/v1/companies'].responses[200].properties;
  assert.ok(companies.data.items.properties.inquiryLimit.anyOf[0].properties.maxOpenInquiries);
  assert.ok(companies.data.items.properties.limits.items.properties.key);
  assert.ok(companies.data.items.properties._count.properties.accessProfiles);
  const company = docs['GET /api/v1/companies/:id'].responses[200].properties.data.properties;
  assert.equal(company.users.maxItems, 10);
  assert.ok(company.users.items.properties.firstName);
  assert.ok(company.inquiryLimit);
  assert.ok(docs['POST /api/v1/companies'].responses[201].properties.data.properties.limits);

  const inquiryList = docs['GET /api/v1/inquiries'].responses[200].properties;
  assert.ok(inquiryList.data.items.properties.visibilityMode);
  assert.ok(inquiryList.data.items.properties._count.properties.items);
  assert.equal(inquiryList.data.items.properties.buyerUserId, undefined);
  const inquiryDetail = docs['GET /api/v1/inquiries/:id'].responses[200].properties.data.properties;
  assert.ok(inquiryDetail.items.items.properties.product);
  assert.ok(inquiryDetail.responsesHidden);
  assert.ok(inquiryDetail.statusHistory.items.properties.changedBy);
  assert.equal(inquiryDetail.buyerUserId, undefined);
  assert.ok(docs['POST /api/v1/inquiries'].responses[201].properties.data.properties.responses);
  assert.ok(docs['PATCH /api/v1/inquiries/:id/status'].responses[200].properties.data.properties.responses);
  const inquiryItems = docs['GET /api/v1/inquiries/:id/items'].responses[200].properties.data;
  assert.equal(inquiryItems.type, 'array');
  assert.ok(inquiryItems.items.properties.product.properties.company);

  const folders = docs['GET /api/v1/admin/notifications/folders'].responses[200].properties.data;
  assert.ok(folders.items.properties.isSystem);
  assert.ok(docs['POST /api/v1/admin/notifications/folders'].responses[201].properties.data.properties.key);
  assert.ok(docs['PATCH /api/v1/admin/notifications/folders/:id'].responses[200].properties.data.properties.isActive);
  const announcement = docs['POST /api/v1/admin/notifications/send'].responses[202].properties.data.properties;
  assert.ok(announcement.recipients);
  assert.ok(announcement.emailQueued);
  assert.ok(announcement.smsNotImplemented);
});

test('company dashboard, product auxiliary, category and specification-library responses match service projections', () => {
  const companySettings = docs['GET /api/v1/companies/:id/settings'].responses[200].properties.data.properties;
  assert.ok(companySettings.inquiryLimit.anyOf[0].properties.maxOpenInquiries);
  assert.ok(companySettings.limits.items.properties.key);
  const stats = docs['GET /api/v1/companies/:id/statistics'].responses[200].properties.data.properties;
  assert.ok(stats.counts.properties.activeUsers);
  assert.equal(stats.recentProducts.maxItems, 5);
  assert.equal(stats.recentOrders.maxItems, 5);
  const companyProducts = docs['GET /api/v1/companies/:id/products'].responses[200].properties;
  assert.ok(companyProducts.data.items.properties.company.properties.name);
  assert.ok(companyProducts.data.items.properties.category.properties.nameFa);
  assert.ok(companyProducts.meta.properties.totalPages);

  const categoryList = docs['GET /api/v1/categories'].responses[200].properties.data.items;
  assert.ok(categoryList.properties.subcategories.items.properties.slug);
  const categoryDetail = docs['GET /api/v1/categories/:id'].responses[200].properties.data.properties;
  assert.ok(categoryDetail.subcategories.items.properties.categoryId);
  const subcategory = docs['GET /api/v1/categories/:id/subcategories/:subId'].responses[200].properties.data.properties;
  assert.ok(subcategory.category.properties.slug);
  assert.ok(subcategory.specificationTemplate.anyOf[0].properties.fields.items.properties.key);
  const categoryProducts = docs['GET /api/v1/categories/:id/products'].responses[200].properties;
  assert.ok(categoryProducts.data.items.properties.company.properties.id);
  assert.ok(categoryProducts.meta.properties.totalPages);
  assert.ok(docs['POST /api/v1/categories'].responses[201].properties.data.properties.slug);
  assert.equal(docs['DELETE /api/v1/categories/:id'].responses[204].properties, undefined);

  const specificationSearch = docs['GET /api/v1/specification-library'].responses[200].properties.data;
  assert.equal(specificationSearch.maxItems, 50);
  assert.ok(specificationSearch.items.properties.defaultUnit);
  assert.ok(docs['GET /api/v1/specification-library/all'].responses[200].properties.data.items.properties.description);

  const tier = docs['POST /api/v1/products/:id/price-tiers'].responses[201].properties.data.properties;
  assert.ok(tier.price);
  assert.ok(docs['PATCH /api/v1/products/:id/price-tiers/:tierId'].responses[200].properties.data.properties.validFrom);
  const image = docs['POST /api/v1/products/:id/images'].responses[201].properties.data.properties;
  assert.ok(image.thumbnailUrl);
  assert.ok(docs['PATCH /api/v1/products/:id/images/:imageId/primary'].responses[200].properties.data.properties.isPrimary);
  assert.equal(docs['PATCH /api/v1/products/:id/images/sort'].responses[200].properties.data.type, 'array');
  assert.ok(docs['POST /api/v1/products/:id/documents'].responses[201].properties.data.properties.url);
  assert.equal(docs['DELETE /api/v1/products/:id/documents/:documentId'].responses[204].properties, undefined);
  assert.ok(docs['POST /api/v1/products/:id/approve'].responses[200].properties.data.properties.status);
});

test('user, RBAC, personal settings and remaining admin response contracts preserve safe projections', () => {
  const userList = docs['GET /api/v1/users'].responses[200].properties;
  assert.ok(userList.data.items.properties.roles.items.type === 'string');
  assert.ok(userList.data.items.properties.permissions.items.type === 'string');
  assert.ok(userList.data.items.properties.accessProfile.anyOf[0].properties.company);
  assert.equal(userList.data.items.properties.passwordHash, undefined);

  const userDetail = docs['GET /api/v1/users/:id'].responses[200].properties.data.properties;
  assert.ok(userDetail.roles.items.properties.scope);
  assert.ok(userDetail.permissions.items.properties.updatedAt);
  assert.equal(userDetail.passwordHash, undefined);
  assert.equal(userDetail.refreshTokens, undefined);
  assert.ok(docs['POST /api/v1/users'].responses[201].properties.data.properties.accessProfile);
  assert.ok(docs['PATCH /api/v1/users/:id/access'].responses[200].properties.data.properties.permissions);

  const roles = docs['GET /api/v1/roles'].responses[200].oneOf;
  assert.equal(roles.length, 2);
  assert.ok(roles[0].properties.data.items.properties.permissions.items.properties.permission);
  assert.ok(docs['GET /api/v1/roles/assignable'].responses[200].properties.data.items.properties.scope);
  assert.ok(docs['POST /api/v1/roles'].responses[201].properties.data.properties._count.properties.users);
  assert.ok(docs['DELETE /api/v1/roles/:id'].responses[200].properties.data.properties.message);

  const permissions = docs['GET /api/v1/permissions'].responses[200].anyOf;
  assert.equal(permissions.length, 3);
  assert.ok(docs['GET /api/v1/permissions/:id'].responses[200].properties.data.properties.group);
  assert.ok(docs['POST /api/v1/permissions'].responses[201].properties.data.properties.createdAt);
  assert.ok(docs['DELETE /api/v1/permissions/:id'].responses[200].properties.data.properties.message);

  const profile = docs['GET /api/v1/settings/profile'].responses[200].properties.data.properties;
  assert.ok(profile.roles.items.properties.role.properties.label);
  assert.equal(profile.passwordHash, undefined);
  assert.ok(docs['PATCH /api/v1/settings/change-password'].responses[200].properties.data.properties.message);
  assert.ok(docs['POST /api/v1/settings/profile/avatar'].responses[200].properties.data.properties.avatarUrl);
  assert.ok(docs['DELETE /api/v1/settings/profile/avatar'].responses[200].properties.data.properties.message);

  const adminStats = docs['GET /api/v1/admin/stats'].responses[200].properties.data.properties;
  assert.ok(adminStats.counts.properties.permissions);
  assert.equal(adminStats.recentUsers.maxItems, 5);
  assert.equal(adminStats.pendingProducts.maxItems, 20);
  assert.ok(adminStats.pendingProducts.items.properties.createdBy.properties.profile);
  assert.ok(docs['GET /api/v1/admin/settings'].responses[200].properties.data.properties.productReviewEditThreshold);
  assert.ok(docs['PATCH /api/v1/admin/inquiry-monetization/settings'].responses[200].properties.data.properties.subscriptionEnforcement);
  assert.ok(docs['GET /api/v1/admin/inquiry-plans'].responses[200].properties.data.items.properties.smsPerPeriod);
  assert.ok(docs['POST /api/v1/admin/inquiry-plans'].responses[201].properties.data.properties.currency);
  assert.ok(docs['PATCH /api/v1/admin/inquiry-plans/:id'].responses[200].properties.data.properties.inquiriesPerPeriod);
  assert.ok(docs['POST /api/v1/admin/inquiry-subscriptions/grant'].responses[201].properties.data.properties.plan.properties.durationDays);
  assert.ok(docs['POST /api/v1/admin/inquiry-subscriptions/:id/activate'].responses[200].properties.data.properties.paymentProvider);
  assert.ok(docs['POST /api/v1/admin/inquiry-subscriptions/:id/reject'].responses[200].properties.data.properties.user.anyOf[0].properties.phone);
});

test('auth, notification preferences, company lifecycle and product workflow response contracts match controller behavior', () => {
  const customerRegistration = docs['POST /api/v1/auth/register'].responses[201].properties.data.properties;
  assert.ok(customerRegistration.user.properties.phone);
  assert.ok(customerRegistration.profile.anyOf);
  assert.ok(customerRegistration.accessProfile.anyOf);
  assert.ok(customerRegistration.roles.items);
  assert.equal(customerRegistration.passwordHash, undefined);

  const companyRegistration = docs['POST /api/v1/auth/register-company'].responses[201].properties.data.properties;
  assert.ok(companyRegistration.company.properties.nationalId);
  assert.ok(companyRegistration.user.properties.status);
  assert.ok(companyRegistration.accessProfile.properties.isActive);
  assert.equal(companyRegistration.refreshToken, undefined);

  const handoffCreate = docs['POST /api/v1/auth/handoff'].responses[201].properties.data.properties;
  assert.equal(handoffCreate.expiresIn.enum[0], 60);
  assert.equal(handoffCreate.code.minLength, 43);
  assert.equal(handoffCreate.code.maxLength, 43);
  const handoffRedeem = docs['POST /api/v1/auth/handoff/redeem'].responses[200].properties.data.properties;
  assert.ok(handoffRedeem.tokens.properties.accessToken);
  assert.ok(handoffRedeem.user);
  assert.ok(handoffRedeem.roles);
  assert.equal(handoffRedeem.refreshToken, undefined);

  for (const route of ['POST /api/v1/auth/logout', 'POST /api/v1/auth/logout-all']) {
    const receipt = docs[route].responses[200].properties.data.properties;
    assert.ok(receipt.message);
  }

  for (const route of ['GET /api/v1/settings/notifications/preferences', 'PATCH /api/v1/settings/notifications/preferences']) {
    const preferences = docs[route].responses[200].properties;
    assert.ok(preferences.data.items.properties.channels.properties.SMS);
    assert.equal(preferences.smsAvailable.const, false);
  }
  const folders = docs['GET /api/v1/settings/notifications/folders'].responses[200].properties.data.items.properties;
  assert.ok(folders.isSystem);
  assert.ok(folders.sortOrder);

  for (const route of [
    'PATCH /api/v1/companies/:id/restore',
    'PATCH /api/v1/companies/:id/status',
    'PATCH /api/v1/companies/:id/verify',
    'PATCH /api/v1/companies/:id/logo',
  ]) {
    const company = docs[route].responses[200].properties.data.properties;
    assert.ok(company.id);
    assert.ok(company.status);
    assert.ok(company.isVerified);
  }
  assert.equal(docs['DELETE /api/v1/companies/:id'].responses[204].content, undefined);
  assert.equal(docs['DELETE /api/v1/companies/:id'].responses[200], undefined);

  for (const action of ['submit-review', 'approve', 'reject', 'publish', 'hide', 'archive', 'restore-draft']) {
    const product = docs['POST /api/v1/products/:id/' + action].responses[200].properties.data.properties;
    assert.ok(product.status);
    assert.ok(product.statusHistory.items.properties.changedBy);
  }
  assert.equal(docs['DELETE /api/v1/products/:id'].responses[204].content, undefined);
  assert.equal(docs['DELETE /api/v1/products/:id'].responses[200], undefined);
});

test('admin notification delivery query filters match controller inputs', () => {
  for (const route of [
    'GET /api/v1/admin/notifications/delivery-stats',
    'GET /api/v1/admin/notifications/deliveries',
  ]) {
    const query = docs[route].querystring;
    assert.ok(query);
    assert.equal(query.additionalProperties, false);
    assert.deepEqual(query.properties.status.enum, ['PENDING', 'SENT', 'FAILED', 'SKIPPED']);
    assert.deepEqual(query.properties.channel.enum, ['IN_APP', 'EMAIL', 'SMS']);
    assert.ok(query.properties.eventType);
    assert.equal(query.properties.userId.minimum, 1);
    assert.equal(query.properties.page.default, 1);
    assert.equal(query.properties.limit.default, 20);
    assert.equal(query.properties.from, undefined);
    assert.equal(query.properties.to, undefined);
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

test('auth sessions, notification preferences and lifecycle response envelopes match controller behavior', () => {
  const login = docs['POST /api/v1/auth/login'].responses[200].properties.data.properties;
  assert.ok(login.tokens.properties.accessToken);
  assert.ok(login.tokens.properties.expiresIn);
  assert.equal(login.tokens.properties.refreshToken, undefined);

  const refresh = docs['POST /api/v1/auth/refresh'].responses[200].properties.data.properties;
  assert.ok(refresh.tokens.properties.accessToken);
  assert.equal(refresh.tokens.properties.refreshToken, undefined);

  const me = docs['GET /api/v1/auth/me'].responses[200].properties.data.properties;
  assert.ok(me.user);
  assert.ok(me.roles);
  assert.ok(me.permissions);
  assert.equal(me.tokens, undefined);
  assert.equal(me.passwordHash, undefined);

  for (const route of ['GET /api/v1/settings/notifications/preferences', 'PATCH /api/v1/settings/notifications/preferences']) {
    const response = docs[route].responses[200];
    assert.deepEqual(response.required, ['data', 'smsAvailable']);
    assert.equal(response.properties.smsAvailable.const, false);
    assert.ok(response.properties.data.items.properties.channels.properties.IN_APP);
    assert.ok(response.properties.data.items.properties.channels.properties.EMAIL);
    assert.ok(response.properties.data.items.properties.channels.properties.SMS);
    assert.equal(response.properties.success, undefined);
  }

  const list = docs['GET /api/v1/settings/notifications'].responses[200];
  assert.deepEqual(list.required, ['data', 'meta']);
  assert.ok(list.properties.meta.properties.totalPages);
  const unread = docs['GET /api/v1/settings/notifications/unread-count'].responses[200];
  assert.deepEqual(unread.required, ['count']);
  const bulk = docs['POST /api/v1/settings/notifications/bulk-read-state'].responses[200];
  assert.ok(bulk.properties.count);
  assert.equal(bulk.properties.data, undefined);
  const move = docs['POST /api/v1/settings/notifications/:id/folders'].responses[200];
  assert.deepEqual(move.required, ['success', 'action', 'notificationId', 'folderId']);
  assert.deepEqual(move.properties.action.enum, ['copy', 'move']);

  for (const route of [
    'PATCH /api/v1/companies/:id/restore',
    'PATCH /api/v1/companies/:id/status',
    'PATCH /api/v1/companies/:id/verify',
    'PATCH /api/v1/companies/:id/logo',
  ]) {
    const company = docs[route].responses[200].properties.data.properties;
    assert.ok(company.id);
    assert.ok(company.status);
    assert.ok(company.logo);
    assert.ok(company.isVerified);
  }
  for (const route of ['DELETE /api/v1/companies/:id', 'DELETE /api/v1/products/:id']) {
    assert.ok(docs[route].responses[204]);
    assert.equal(docs[route].responses[204].properties, undefined);
    assert.equal(docs[route].responses[200], undefined);
  }
});


test('shared error response docs match central, auth/RBAC and native rate-limit envelopes', () => {
  const authFailure = docs['POST /api/v1/auth/refresh'].responses[401];
  assert.equal(authFailure.oneOf[0].$ref, '#/components/schemas/ErrorResponse');
  assert.equal(authFailure.oneOf[1].properties.error.const, true);
  assert.deepEqual(authFailure.oneOf[1].required, ['error', 'message']);

  const forbidden = docs['GET /api/v1/users'].responses[403];
  assert.equal(forbidden.oneOf[0].$ref, '#/components/schemas/ErrorResponse');
  assert.equal(forbidden.oneOf[1].properties.error.const, true);

  const rateLimit = docs['POST /api/v1/auth/login'].responses[429];
  assert.equal(rateLimit.properties.statusCode.const, 429);
  assert.equal(rateLimit.properties.error.const, 'Too Many Requests');
  assert.ok(rateLimit.properties.message);

  const internal = docs['POST /api/v1/auth/refresh'].responses[500];
  assert.equal(internal.oneOf[0].$ref, '#/components/schemas/ErrorResponse');
  assert.equal(internal.oneOf[1].properties.error.const, true);

  // Only the inquiry payment routes with controller-level allow-list handling
  // expose sanitized provider statuses; other routes retain generic 500.
  assert.equal(docs['POST /api/v1/inquiries/subscription'].responses[502].$ref, '#/components/schemas/ErrorResponse');
  assert.equal(docs['POST /api/v1/inquiries/subscription'].responses[503], undefined);
  assert.equal(docs['GET /api/v1/inquiries/subscription/me'].responses[502], undefined);
  assert.equal(docs['GET /api/v1/inquiries/subscription/me'].responses[503], undefined);
});


test('payment provider 502/503 statuses are documented only on explicitly handled inquiry payment routes', () => {
  const request = docs['POST /api/v1/inquiries/subscription'].responses[502];
  assert.equal(request.$ref, '#/components/schemas/ErrorResponse');
  assert.match(request.description, /Sanitized payment-provider failure/);

  const retry = docs['POST /api/v1/inquiries/subscription/:id/verify-payment'].responses[503];
  assert.equal(retry.$ref, '#/components/schemas/ErrorResponse');

  const callback = docs['GET /api/v1/inquiries/subscription/payment/callback'].responses[503];
  assert.equal(callback.$ref, '#/components/schemas/ErrorResponse');

  assert.equal(docs['GET /api/v1/inquiries/subscription/me'].responses[502], undefined);
  assert.equal(docs['GET /api/v1/inquiries/subscription/me'].responses[503], undefined);
});

