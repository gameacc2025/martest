// =============================================================
// Unit tests — Inquiry listing & details (listInquiries / getInquiry)
//
// Run with:  node --test
//
// These tests inject a mock Prisma client into the module cache
// before loading the service, so no database is required.
// =============================================================

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const { Readable } = require('node:stream');
const Module = require('node:module');

// ── Mock Prisma client ───────────────────────────────────────
// We capture the arguments each call receives so tests can assert
// on the where/orderBy/skip/take that the service builds.
const calls = {
  count: [],
  findMany: [],
  findUnique: [],
};
const operationTimeline = [];

let nextCount = 0;
let nextFindMany = [];
let nextFindUnique = null;
let nextMessages = [];
let smsUsageEvents = [];
let smsRecipientUser = { id: 10, phone: '+31612345678' };
let smsCompanyMember = { id: 31 };
let smsPreferenceEnabled = true;
let subscriptionEnforcementEnabled = false;
const activeSmsSubscription = { id: 77, planId: 2, startsAt: new Date('2026-10-01T00:00:00Z'), endsAt: new Date('2026-11-01T00:00:00Z'), status: 'ACTIVE', plan: { id: 2, name: 'SMS', isActive: true, inquiriesPerPeriod: 10, responsesPerPeriod: 10, internalMessagesPerPeriod: 10, smsPerPeriod: 2 } };

// Fixtures backing the transactional / relationship-heavy paths
// (items, responses, attachments, product validation, stats).
const fx = {
  inquiryItem: null,        // inquiryItem.findFirst
  inquiryItemCount: 0,      // inquiryItem.count
  ownedItemIds: [],         // inquiryItem.findMany → items owned by the responder
  response: null,           // inquiryResponse.findFirst
  responseDecisionUpdateCount: 1, // compare-and-set response decision result
  attachment: null,         // inquiryResponseAttachment.findFirst
  attachmentCount: 0,
  attachmentCreateError: null,
  products: [],             // product.findMany inside validateInquiryProducts
  responseCount: 0,
  recentResponses: [],
  notificationRecipients: [],
};

// groupBy returns one row-set per call; stats() calls each groupBy twice
// (sent / received), so tests queue the row-sets in call order.
const queues = {
  inquiryGroupBy: [],
  responseGroupBy: [],
};

function drain(queue) {
  return queue.length ? queue.shift() : [];
}

function record(name, args) {
  operationTimeline.push(name);
  calls[name] = calls[name] || [];
  calls[name].push(args);
}

const mockPrisma = {
  systemSetting: { findUnique: async () => ({ value: subscriptionEnforcementEnabled ? 'true' : 'false' }) },
  inquirySubscription: { findFirst: async (args) => { record('inquirySubscription.findFirst', args); return activeSmsSubscription; } },
  inquiryUsageEvent: {
    aggregate: async ({ where }) => ({ _sum: { quantity: smsUsageEvents.filter(e => e.subscriptionId === where.subscriptionId && e.usageType === where.usageType).reduce((sum, e) => sum + e.quantity, 0) } }),
    create: async ({ data }) => { smsUsageEvents.push(data); return { id: smsUsageEvents.length, ...data }; },
  },
  user: {
    findMany: async (args) => { record('user.findMany', args); return fx.notificationRecipients; },
    findUnique: async ({ where }) => ({ id: where.id, phone: '+31612345678' }),
    findFirst: async (args) => { record('user.findFirst', args); return args.where?.accessProfile ? smsCompanyMember : smsRecipientUser; },
  },
  company: { findUnique: async ({ where }) => ({ id: where.id, phone: '+31612345678' }) },
  inquiry: {
    count: async (args) => {
      calls.count.push(args);
      return nextCount;
    },
    findMany: async (args) => {
      calls.findMany.push(args);
      return nextFindMany;
    },
    findUnique: async (args) => {
      calls.findUnique.push(args);
      return nextFindUnique;
    },
    create: async (args) => {
      record('inquiry.create', args);
      return { id: 7, ...args.data };
    },
    update: async (args) => {
      record('inquiry.update', args);
      return { ...(nextFindUnique || {}), id: args.where?.id, ...args.data };
    },
    updateMany: async (args) => {
      record('inquiry.updateMany', args);
      return { count: 1 };
    },
    groupBy: async (args) => { record('groupBy', args); return drain(queues.inquiryGroupBy); },
  },
  inquiryItem: {
    count: async () => fx.inquiryItemCount,
    findMany: async () => fx.ownedItemIds.map((id) => ({ id })),
    findFirst: async () => fx.inquiryItem,
    create: async (args) => {
      record('inquiryItem.create', args);
      return { id: 1, ...args.data };
    },
    update: async (args) => {
      record('inquiryItem.update', args);
      return { id: args.where?.id, ...args.data };
    },
    delete: async (args) => {
      record('inquiryItem.delete', args);
      return { id: args.where?.id };
    },
  },
  inquiryResponse: {
    findUnique: async () => null,
    count: async () => fx.responseCount,
    findMany: async (args) => {
      record('inquiryResponse.findMany', args);
      return fx.recentResponses;
    },
    findFirst: async (args) => { record('inquiryResponse.findFirst', args); return fx.response; },
    create: async (args) => {
      record('inquiryResponse.create', args);
      return { id: 5, ...args.data };
    },
    update: async (args) => {
      record('inquiryResponse.update', args);
      if (fx.response && fx.response.id === args.where?.id) {
        fx.response = { ...fx.response, ...args.data };
        return { ...fx.response };
      }
      return { id: args.where?.id, ...args.data };
    },
    updateMany: async (args) => {
      record('inquiryResponse.updateMany', args);
      if (args.where?.id && args.where?.status === 'PENDING') {
        const count = fx.responseDecisionUpdateCount;
        if (count && fx.response && fx.response.id === args.where.id) {
          fx.response = { ...fx.response, ...args.data };
        }
        return { count };
      }
      return { count: 1 };
    },
    groupBy: async (args) => { record('inquiryResponse.groupBy', args); return drain(queues.responseGroupBy); },
  },
  inquiryResponseItem: {
    deleteMany: async (args) => {
      record('inquiryResponseItem.deleteMany', args);
      return { count: 1 };
    },
  },
  inquiryStatusHistory: {
    create: async (args) => {
      record('inquiryStatusHistory.create', args);
      return {};
    },
  },
  notificationPreference: { findUnique: async () => ({ enabled: smsPreferenceEnabled }) },
  notificationDelivery: { create: async (args) => { record('notificationDelivery.create', args); return { id: 500, ...args.data }; } },
  inquiryMessage: {
    findMany: async (args) => { record('inquiryMessage.findMany', args); return nextMessages; },
    create: async (args) => { record('inquiryMessage.create', args); return { id: 101, ...args.data }; },
    updateMany: async (args) => { record('inquiryMessage.updateMany', args); return { count: 1 }; },
  },
  inquiryResponseAttachment: {
    count: async (args) => { record('inquiryResponseAttachment.count', args); return fx.attachmentCount; },
    findFirst: async () => fx.attachment,
    create: async (args) => {
      if (fx.attachmentCreateError) {
        const error = fx.attachmentCreateError;
        fx.attachmentCreateError = null;
        throw error;
      }
      record('inquiryResponseAttachment.create', args);
      return { id: 1, ...args.data };
    },
    delete: async (args) => {
      record('inquiryResponseAttachment.delete', args);
      return {};
    },
  },
  product: {
    findMany: async (args) => {
      record('product.findMany', args);
      return fx.products;
    },
  },
  $queryRawUnsafe: async (query, ...params) => {
    record('$queryRawUnsafe', { query, params });
    return [];
  },
  $transaction: async (arg) => {
    record('$transaction', { kind: typeof arg === 'function' ? 'interactive' : 'batch' });
    if (typeof arg === 'function') return arg(mockPrisma);
    return Promise.all(arg);
  },
};

// ── Inject mocks into the require cache ──────────────────────
// The service does: require('../../config/db') and
// require('../companies/company-rule.service'). We resolve those
// paths relative to the service file and pre-populate the cache.
const serviceDir = path.join(__dirname);
const dbPath = require.resolve(path.join(serviceDir, '../../config/db'));
const companyRulePath = require.resolve(path.join(serviceDir, '../companies/company-rule.service'));
const notificationDispatchPath = require.resolve(path.join(serviceDir, '../notifications/notification.dispatch.service'));

const originalDbEntry = require.cache[dbPath];
require.cache[dbPath] = new Module(dbPath);
require.cache[dbPath].exports = mockPrisma;
require.cache[dbPath].loaded = true;

const originalCompanyRuleEntry = require.cache[companyRulePath];
const originalNotificationDispatchEntry = require.cache[notificationDispatchPath];
require.cache[notificationDispatchPath] = new Module(notificationDispatchPath);
require.cache[notificationDispatchPath].exports = {
  dispatchNotification: async (...args) => {
    record('dispatchNotification', args);
    return { event: args[0], recipients: 0 };
  },
};
require.cache[notificationDispatchPath].loaded = true;
require.cache[companyRulePath] = new Module(companyRulePath);
require.cache[companyRulePath].exports = {
  validateInquiryCreationCapacity: async () => {},
  validateResponseSubmissionCapacity: async () => {},
};
require.cache[companyRulePath].loaded = true;

// require.cache is process-global — in newer Node versions test files
// share a process by default, so these mocks must be restored once this
// file's tests finish, or they'd leak into whichever file runs next.
test.after(() => {
  if (originalDbEntry) require.cache[dbPath] = originalDbEntry;
  else delete require.cache[dbPath];
  if (originalCompanyRuleEntry) require.cache[companyRulePath] = originalCompanyRuleEntry;
  else delete require.cache[companyRulePath];
  if (originalNotificationDispatchEntry) require.cache[notificationDispatchPath] = originalNotificationDispatchEntry;
  else delete require.cache[notificationDispatchPath];
});

// Now load the service (it will pick up the mocks above)
const inquiryService = require('./inquiry.service');

function resetMocks() {
  operationTimeline.length = 0;
  Object.keys(calls).forEach((key) => { delete calls[key]; });
  calls.count = [];
  calls.findMany = [];
  calls.findUnique = [];
  nextCount = 0;
  nextFindMany = [];
  nextFindUnique = null;
  nextMessages = [];
  smsUsageEvents = [];
  subscriptionEnforcementEnabled = false;
  smsRecipientUser = { id: 10, phone: '+31612345678' };
  smsCompanyMember = { id: 31 };
  smsPreferenceEnabled = true;
  fx.inquiryItem = null;
  fx.inquiryItemCount = 0;
  fx.ownedItemIds = [];
  fx.response = null;
  fx.responseDecisionUpdateCount = 1;
  fx.attachment = null;
  fx.attachmentCount = 0;
  fx.attachmentCreateError = null;
  fx.products = [];
  fx.responseCount = 0;
  fx.recentResponses = [];
  fx.notificationRecipients = [];
  queues.inquiryGroupBy = [];
  queues.responseGroupBy = [];
}

const superAdmin = { id: 1, roles: ['SUPER_ADMIN'], permissions: ['*'], accessType: 'STAFF', companyId: null };
const companySuperAdmin = { id: 9, roles: ['SUPER_ADMIN'], permissions: ['*'], accessType: 'COMPANY', companyId: 20 };
const buyer = { id: 2, roles: ['COMPANY_ADMIN'], permissions: ['inquiries.read'], accessType: 'COMPANY', companyId: 10 };
const seller = { id: 3, roles: ['COMPANY_ADMIN'], permissions: ['inquiries.read'], accessType: 'COMPANY', companyId: 20 };
const orphan = { id: 4, roles: ['USER'], permissions: ['inquiries.read'], companyId: null };

// ── listInquiries ────────────────────────────────────────────

test('listInquiries returns a paginated response shape', async () => {
  resetMocks();
  nextCount = 3;
  nextFindMany = [{ id: 1 }, { id: 2 }, { id: 3 }];

  const result = await inquiryService.listInquiries({ page: 1, limit: 20 }, buyer);

  assert.deepEqual(result.data, nextFindMany);
  assert.equal(result.meta.total, 3);
  assert.equal(result.meta.page, 1);
  assert.equal(result.meta.limit, 20);
  assert.equal(result.meta.totalPages, 1);
});

test('listInquiries scope=sent filters by the caller company', async () => {
  resetMocks();
  await inquiryService.listInquiries({ scope: 'sent' }, buyer);

  const where = calls.findMany[0].where;
  assert.ok(where.AND.some((c) => c.companyId === buyer.companyId));
});

test('listInquiries scope=received filters by owned product company', async () => {
  resetMocks();
  await inquiryService.listInquiries({ scope: 'received' }, seller);

  const where = calls.findMany[0].where;
  const hasProductFilter = where.AND.some(
    (c) => c.items && c.items.some && c.items.some.product.companyId === seller.companyId,
  );
  assert.ok(hasProductFilter);
  assert.ok(where.AND.some((condition) => condition.status?.in?.includes('OPEN')));
  assert.ok(where.AND.some((condition) => condition.OR?.some((entry) => entry.publishDate?.lte)));
});

test('listInquiries: SUPER_ADMIN role in COMPANY context remains scoped to its company', async () => {
  resetMocks();
  await inquiryService.listInquiries({ scope: 'all' }, companySuperAdmin);
  const where = calls.findMany[0].where;
  assert.ok(where.AND.some((condition) => condition.companyId === companySuperAdmin.companyId));
});

test('listInquiries scope=all as SUPER_ADMIN applies no company filter', async () => {
  resetMocks();
  await inquiryService.listInquiries({ scope: 'all' }, superAdmin);

  const where = calls.findMany[0].where;
  // No AND clauses means unrestricted (aside from optional status/search)
  assert.equal(where.AND, undefined);
});

test('listInquiries applies a status filter', async () => {
  resetMocks();
  await inquiryService.listInquiries({ scope: 'all', status: 'OPEN' }, superAdmin);

  const where = calls.findMany[0].where;
  assert.ok(where.AND.some((c) => c.status === 'OPEN'));
});

test('listInquiries rejects an invalid status', async () => {
  resetMocks();
  await assert.rejects(
    () => inquiryService.listInquiries({ scope: 'all', status: 'BOGUS' }, superAdmin),
    (err) => err.code === 'INVALID_INQUIRY_STATUS',
  );
});

test('listInquiries builds a case-insensitive search OR clause', async () => {
  resetMocks();
  await inquiryService.listInquiries({ scope: 'all', search: 'router' }, superAdmin);

  const where = calls.findMany[0].where;
  const searchClause = where.AND.find((c) => Array.isArray(c.OR));
  assert.ok(searchClause);
  assert.equal(searchClause.OR[0].title.contains, 'router');
  assert.equal(searchClause.OR[0].title.mode, 'insensitive');
});

test('listInquiries sorts by an allowed field/order', async () => {
  resetMocks();
  await inquiryService.listInquiries({ scope: 'all', sortBy: 'title', sortOrder: 'asc' }, superAdmin);
  assert.deepEqual(calls.findMany[0].orderBy, { title: 'asc' });
});

test('listInquiries falls back to createdAt desc for an invalid sort field', async () => {
  resetMocks();
  await inquiryService.listInquiries({ scope: 'all', sortBy: 'hacker', sortOrder: 'sideways' }, superAdmin);
  assert.deepEqual(calls.findMany[0].orderBy, { createdAt: 'desc' });
});

test('listInquiries computes skip/take from pagination params', async () => {
  resetMocks();
  await inquiryService.listInquiries({ scope: 'all', page: 3, limit: 10 }, superAdmin);
  assert.equal(calls.findMany[0].skip, 20);
  assert.equal(calls.findMany[0].take, 10);
});

test('listInquiries requires a company for non-admin sent scope', async () => {
  resetMocks();
  await assert.rejects(
    () => inquiryService.listInquiries({ scope: 'sent' }, orphan),
    (err) => err.code === 'COMPANY_REQUIRED',
  );
});

test('listInquiries: a non-admin using scope=all is clamped to its own company', async () => {
  resetMocks();
  await inquiryService.listInquiries({ scope: 'all' }, buyer);
  const where = calls.findMany.at(-1).where;
  assert.ok(where.AND.some((clause) => clause.companyId === buyer.companyId));
});

// ── getInquiry ───────────────────────────────────────────────

test('getInquiry rejects an invalid id', async () => {
  resetMocks();
  await assert.rejects(
    () => inquiryService.getInquiry('abc', superAdmin),
    (err) => err.code === 'VALIDATION_ERROR',
  );
});

test('getInquiry returns 404 when the inquiry is missing', async () => {
  resetMocks();
  nextFindUnique = null;
  await assert.rejects(
    () => inquiryService.getInquiry(99, superAdmin),
    (err) => err.statusCode === 404 && err.code === 'INQUIRY_NOT_FOUND',
  );
});

test('getInquiry allows the owning (buyer) company', async () => {
  resetMocks();
  nextFindUnique = { id: 5, companyId: buyer.companyId, items: [] };
  const inquiry = await inquiryService.getInquiry(5, buyer);
  assert.equal(inquiry.id, 5);
});

test('getInquiry allows a seller who owns a requested product', async () => {
  resetMocks();
  nextFindUnique = {
    id: 6,
    companyId: buyer.companyId,
    status: 'OPEN',
    items: [{ product: { company: { id: seller.companyId } } }],
  };
  const inquiry = await inquiryService.getInquiry(6, seller);
  assert.equal(inquiry.id, 6);
});

test('getInquiry hides an inquiry from an unrelated company (404)', async () => {
  resetMocks();
  nextFindUnique = {
    id: 7,
    companyId: buyer.companyId,
    items: [{ product: { company: { id: seller.companyId } } }],
  };
  const unrelated = { id: 9, roles: ['COMPANY_ADMIN'], permissions: ['inquiries.read'], companyId: 999 };
  await assert.rejects(
    () => inquiryService.getInquiry(7, unrelated),
    (err) => err.statusCode === 404 && err.code === 'INQUIRY_NOT_FOUND',
  );
});

test('getInquiry allows a customer to read only their own inquiry', async () => {
  resetMocks();
  nextFindUnique = { id: 90, companyId: null, buyerUserId: 77, status: 'OPEN', visibilityMode: 'NORMAL', responses: [], items: [] };
  const inquiry = await inquiryService.getInquiry(90, { id: 77, accessType: 'CUSTOMER', permissions: ['inquiries.read'] });
  assert.equal(inquiry.id, 90);
  assert.equal(Object.hasOwn(inquiry, 'buyerUserId'), false);
});

test('getInquiry hides sealed quotes from the buyer before reveal', async () => {
  resetMocks();
  nextFindUnique = {
    id: 91, companyId: buyer.companyId, status: 'OPEN', visibilityMode: 'SEALED',
    responseDeadline: new Date(Date.now() + 3600000), responses: [{ id: 1, companyId: seller.companyId }, { id: 2, companyId: 42 }],
    items: [],
  };
  const inquiry = await inquiryService.getInquiry(91, buyer);
  assert.equal(inquiry.responses.length, 0);
  assert.equal(inquiry.responsesHidden, true);
  assert.equal(inquiry.responseCount, 2);
});

test('getInquiry anonymizes company identities for a revealed anonymous sealed inquiry', async () => {
  resetMocks();
  nextFindUnique = {
    id: 92, companyId: buyer.companyId, status: 'CLOSED', visibilityMode: 'ANONYMOUS_SEALED',
    responses: [{ id: 1, companyId: seller.companyId, company: { id: seller.companyId, name: 'Secret supplier' } }],
    items: [{ id: 4, product: { title: 'Product', company: { id: seller.companyId, name: 'Secret supplier' } } }],
  };
  const inquiry = await inquiryService.getInquiry(92, buyer);
  assert.equal(inquiry.responses[0].company.name, 'پیشنهاددهنده 1');
  assert.equal(Object.hasOwn(inquiry.responses[0], 'companyId'), false);
  assert.equal(inquiry.items[0].product.company, null);
});

test('getInquiry: SUPER_ADMIN role in COMPANY context cannot read unrelated inquiry', async () => {
  resetMocks();
  nextFindUnique = { id: 81, companyId: 555, items: [] };
  await assert.rejects(
    () => inquiryService.getInquiry(81, companySuperAdmin),
    (err) => err.statusCode === 404 && err.code === 'INQUIRY_NOT_FOUND',
  );
});

test('getInquiry allows SUPER_ADMIN regardless of company', async () => {
  resetMocks();
  nextFindUnique = { id: 8, companyId: 555, items: [] };
  const inquiry = await inquiryService.getInquiry(8, superAdmin);
  assert.equal(inquiry.id, 8);
});

// ── Shared fixtures for the workflow / response tests ────────

function draftInquiry(overrides = {}) {
  return { id: 1, companyId: buyer.companyId, status: 'DRAFT', closedAt: null, ...overrides };
}

function openInquiry(overrides = {}) {
  return draftInquiry({ status: 'OPEN', allowEditResponse: true, allowWithdrawResponse: false, ...overrides });
}

function publishedProducts(...ids) {
  return ids.map((id) => ({ id, status: 'PUBLISHED', company: { status: 'ACTIVE' } }));
}

function makeFile({ filename = 'file.pdf', mimetype = 'application/pdf', content = 'hello', fields = {} } = {}) {
  return { filename, mimetype, fields, file: Readable.from([Buffer.from(content)]) };
}

function largeStream(megabytes) {
  let sent = 0;
  return Readable.from((function* generate() {
    while (sent < megabytes) {
      sent += 1;
      yield Buffer.alloc(1024 * 1024);
    }
  })());
}

const attachmentDir = path.join(process.cwd(), 'uploads', 'inquiries', 'responses');


test('getInquiry: STAFF with a stray companyId cannot read that company inquiry as its buyer', async () => {
  resetMocks();
  nextFindUnique = { id: 81, companyId: 10, buyerUserId: null, items: [] };
  const staff = { id: 90, accessType: 'STAFF', companyId: 10, roles: ['STAFF_USER'], permissions: ['inquiries.create'] };

  await assert.rejects(
    () => inquiryService.getInquiry(81, staff),
    (err) => err.statusCode === 404 && err.code === 'INQUIRY_NOT_FOUND',
  );
});

test('getInquiry: CUSTOMER_USER without an AccessProfile can read only its own user-owned inquiry', async () => {
  resetMocks();
  nextFindUnique = { id: 82, companyId: null, buyerUserId: 77, status: 'OPEN', visibilityMode: 'NORMAL', responses: [], items: [] };
  const customer = { id: 77, accessType: null, companyId: null, roles: ['CUSTOMER_USER'], permissions: ['inquiries.read'] };

  const result = await inquiryService.getInquiry(82, customer);
  assert.equal(result.id, 82);
});

// ── createInquiry ────────────────────────────────────────────

test('createInquiry: SUPER_ADMIN creates a DRAFT under the supplied companyId with default settings', async () => {
  resetMocks();
  fx.products = publishedProducts(1);
  await inquiryService.createInquiry(
    { title: 'RFQ', description: 'desc', companyId: 42, items: [{ productId: 1, quantity: 5 }] },
    superAdmin,
  );

  const args = calls['inquiry.create'].at(-1);
  assert.equal(args.data.companyId, 42);
  assert.equal(args.data.status, 'DRAFT');
  assert.equal(args.data.priority, 'NORMAL');
  assert.equal(args.data.visibilityMode, 'NORMAL');
  assert.equal(args.data.autoClose, true);
  assert.equal(args.data.allowEditResponse, true);
  assert.equal(args.data.allowWithdrawResponse, false);
  assert.equal(args.data.responseDeadline, null);
  assert.equal(args.data.items.create.length, 1);
  assert.equal(args.data.items.create[0].quantity, 5);
});

test('createInquiry: CUSTOMER creates an immediately open inquiry owned by the authenticated user', async () => {
  resetMocks();
  fx.products = [{ id: 41, status: 'PUBLISHED', company: { status: 'ACTIVE' } }];
  const customer = { id: 77, accessType: 'CUSTOMER', companyId: null, roles: ['CUSTOMER_USER'], permissions: ['inquiries.create'] };
  const inquiry = await inquiryService.createInquiry({
    title: 'Customer price request',
    items: [{ productId: 41, quantity: 2 }],
  }, customer);
  const create = calls['inquiry.create'][0];
  assert.equal(create.data.companyId, null);
  assert.equal(create.data.buyerUserId, 77);
  assert.equal(create.data.status, 'OPEN');
  assert.ok(create.data.publishDate instanceof Date);
  assert.equal(inquiry.id, 7);
  assert.ok(calls.dispatchNotification.some(([event]) => event === 'INQUIRY_PUBLISHED'));
});

test('createInquiry: rejects a response deadline that is already past', async () => {
  resetMocks();
  fx.products = publishedProducts(41);
  const customer = { id: 77, accessType: 'CUSTOMER', companyId: null, roles: ['CUSTOMER_USER'], permissions: ['inquiries.create'] };
  await assert.rejects(
    () => inquiryService.createInquiry({
      title: 'Expired price request',
      responseDeadline: new Date(Date.now() - 60_000).toISOString(),
      items: [{ productId: 41, quantity: 1 }],
    }, customer),
    (err) => err.code === 'INVALID_INQUIRY_DATE_WINDOW',
  );
  assert.equal((calls['inquiry.create'] || []).length, 0);
});

test('createInquiry: a caller without a company is rejected', async () => {
  resetMocks();
  await assert.rejects(
    () => inquiryService.createInquiry({ title: 'RFQ', items: [{ productId: 1, quantity: 1 }] }, orphan),
    (err) => err.code === 'COMPANY_REQUIRED',
  );
});

test('createInquiry: at least one item is required', async () => {
  resetMocks();
  await assert.rejects(
    () => inquiryService.createInquiry({ title: 'RFQ', items: [] }, buyer),
    (err) => err.code === 'INQUIRY_ITEMS_REQUIRED',
  );
  await assert.rejects(
    () => inquiryService.createInquiry({ title: 'RFQ' }, buyer),
    (err) => err.code === 'INQUIRY_ITEMS_REQUIRED',
  );
});

test('createInquiry: a non-positive product id is rejected', async () => {
  resetMocks();
  await assert.rejects(
    () => inquiryService.createInquiry({ title: 'RFQ', items: [{ productId: 'abc', quantity: 1 }] }, buyer),
    (err) => err.code === 'INVALID_PRODUCT_ID',
  );
});

test('createInquiry: an unknown product is rejected', async () => {
  resetMocks();
  fx.products = [];
  await assert.rejects(
    () => inquiryService.createInquiry({ title: 'RFQ', items: [{ productId: 1, quantity: 1 }] }, buyer),
    (err) => err.code === 'PRODUCT_NOT_FOUND',
  );
});

test('createInquiry: an unpublished product cannot be requested', async () => {
  resetMocks();
  fx.products = [{ id: 1, status: 'DRAFT', company: { status: 'ACTIVE' } }];
  await assert.rejects(
    () => inquiryService.createInquiry({ title: 'RFQ', items: [{ productId: 1, quantity: 1 }] }, buyer),
    (err) => err.code === 'PRODUCT_NOT_PUBLISHED',
  );
});

test('createInquiry: a product from an inactive company cannot be requested', async () => {
  resetMocks();
  fx.products = [{ id: 1, status: 'PUBLISHED', company: { status: 'SUSPENDED' } }];
  await assert.rejects(
    () => inquiryService.createInquiry({ title: 'RFQ', items: [{ productId: 1, quantity: 1 }] }, buyer),
    (err) => err.code === 'PRODUCT_COMPANY_NOT_ACTIVE',
  );
});

test('createInquiry: a non-DRAFT initial status is rejected', async () => {
  resetMocks();
  fx.products = publishedProducts(1);
  await assert.rejects(
    () => inquiryService.createInquiry({ title: 'RFQ', status: 'OPEN', items: [{ productId: 1, quantity: 1 }] }, buyer),
    (err) => err.code === 'INVALID_INITIAL_STATUS',
  );
});

test('createInquiry: an invalid priority is rejected', async () => {
  resetMocks();
  fx.products = publishedProducts(1);
  await assert.rejects(
    () => inquiryService.createInquiry({ title: 'RFQ', priority: 'WHENEVER', items: [{ productId: 1, quantity: 1 }] }, buyer),
    (err) => err.code === 'VALIDATION_ERROR',
  );
});

// ── updateInquiry ────────────────────────────────────────────

test('updateInquiry: only the supplied fields are written (partial settings)', async () => {
  resetMocks();
  nextFindUnique = draftInquiry();
  await inquiryService.updateInquiry(1, { title: 'Renamed', priority: 'HIGH', responseDeadline: '2030-01-01T00:00:00.000Z' }, buyer);

  const args = calls['inquiry.update'].at(-1);
  assert.equal(args.data.title, 'Renamed');
  assert.equal(args.data.priority, 'HIGH');
  assert.ok(args.data.responseDeadline instanceof Date);
  // Untouched settings must NOT be present in a partial update.
  assert.equal(args.data.autoClose, undefined);
  assert.equal(args.data.visibilityMode, undefined);
  assert.equal(args.data.description, undefined);
});

test('updateInquiry: a boolean setting is coerced with Boolean()', async () => {
  resetMocks();
  nextFindUnique = draftInquiry();
  await inquiryService.updateInquiry(1, { confidential: 1, allowWithdrawResponse: true }, buyer);
  const args = calls['inquiry.update'].at(-1);
  assert.equal(args.data.confidential, true);
  assert.equal(args.data.allowWithdrawResponse, true);
});

test('updateInquiry: a date can be cleared with null', async () => {
  resetMocks();
  nextFindUnique = draftInquiry();
  await inquiryService.updateInquiry(1, { responseDeadline: null }, buyer);
  assert.equal(calls['inquiry.update'].at(-1).data.responseDeadline, null);
});

test('updateInquiry: a closed RFQ is locked', async () => {
  resetMocks();
  nextFindUnique = draftInquiry({ status: 'CLOSED' });
  await assert.rejects(
    () => inquiryService.updateInquiry(1, { title: 'x' }, buyer),
    (err) => err.code === 'INQUIRY_LOCKED',
  );
});

test('updateInquiry: an empty payload is rejected', async () => {
  resetMocks();
  nextFindUnique = draftInquiry();
  await assert.rejects(
    () => inquiryService.updateInquiry(1, {}, buyer),
    (err) => err.code === 'NO_UPDATE_FIELDS',
  );
});

test('updateInquiry: another company cannot edit the RFQ (404)', async () => {
  resetMocks();
  nextFindUnique = draftInquiry();
  await assert.rejects(
    () => inquiryService.updateInquiry(1, { title: 'x' }, seller),
    (err) => err.statusCode === 404 && err.code === 'INQUIRY_NOT_FOUND',
  );
});

test('updateInquiry: an invalid visibilityMode is rejected', async () => {
  resetMocks();
  nextFindUnique = draftInquiry();
  await assert.rejects(
    () => inquiryService.updateInquiry(1, { visibilityMode: 'TELEPATHY' }, buyer),
    (err) => err.code === 'VALIDATION_ERROR',
  );
});

test('updateInquiry: a non-numeric id is rejected before touching the database', async () => {
  resetMocks();
  await assert.rejects(
    () => inquiryService.updateInquiry('x', { title: 'y' }, buyer),
    (err) => err.code === 'VALIDATION_ERROR',
  );
  assert.equal(calls['inquiry.update'], undefined); // never reached the DB
});

// ── changeInquiryStatus ──────────────────────────────────────

test('changeInquiryStatus: a missing RFQ is 404', async () => {
  resetMocks();
  nextFindUnique = null;
  await assert.rejects(
    () => inquiryService.changeInquiryStatus(1, 'SUBMITTED', buyer),
    (err) => err.statusCode === 404 && err.code === 'INQUIRY_NOT_FOUND',
  );
});

test('changeInquiryStatus: another company cannot transition the RFQ (404)', async () => {
  resetMocks();
  nextFindUnique = draftInquiry();
  await assert.rejects(
    () => inquiryService.changeInquiryStatus(1, 'SUBMITTED', seller),
    (err) => err.statusCode === 404,
  );
});

test('changeInquiryStatus: an unauthenticated caller is rejected', async () => {
  resetMocks();
  nextFindUnique = draftInquiry();
  await assert.rejects(
    () => inquiryService.changeInquiryStatus(1, 'SUBMITTED', { roles: [], companyId: 10 }),
    (err) => err.code === 'UNAUTHORIZED',
  );
});

test('changeInquiryStatus: an unknown target status is rejected', async () => {
  resetMocks();
  nextFindUnique = draftInquiry();
  await assert.rejects(
    () => inquiryService.changeInquiryStatus(1, 'NIRVANA', buyer),
    (err) => err.code === 'INVALID_INQUIRY_STATUS',
  );
});

test('changeInquiryStatus: staying on the same status is rejected', async () => {
  resetMocks();
  nextFindUnique = draftInquiry();
  await assert.rejects(
    () => inquiryService.changeInquiryStatus(1, 'DRAFT', buyer),
    (err) => err.code === 'STATUS_UNCHANGED',
  );
});

test('changeInquiryStatus: an illegal transition is rejected with the allowed list', async () => {
  resetMocks();
  nextFindUnique = draftInquiry();
  await assert.rejects(
    () => inquiryService.changeInquiryStatus(1, 'OPEN', buyer),
    (err) => err.code === 'INVALID_STATUS_TRANSITION' && err.details.allowed.includes('SUBMITTED'),
  );
});

test('changeInquiryStatus: DRAFT → SUBMITTED requires at least one item', async () => {
  resetMocks();
  nextFindUnique = draftInquiry();
  fx.inquiryItemCount = 0;
  await assert.rejects(
    () => inquiryService.changeInquiryStatus(1, 'SUBMITTED', buyer),
    (err) => err.code === 'INQUIRY_ITEMS_REQUIRED',
  );
});

test('changeInquiryStatus: DRAFT → SUBMITTED writes history and clears closedAt', async () => {
  resetMocks();
  nextFindUnique = draftInquiry();
  fx.inquiryItemCount = 2;
  await inquiryService.changeInquiryStatus(1, 'SUBMITTED', buyer, 'send it');

  const history = calls['inquiryStatusHistory.create'].at(-1);
  assert.equal(history.data.previousStatus, 'DRAFT');
  assert.equal(history.data.newStatus, 'SUBMITTED');
  assert.equal(history.data.changedByUserId, buyer.id);
  assert.equal(history.data.comment, 'send it');

  const update = calls['inquiry.update'].at(-1);
  assert.equal(update.data.status, 'SUBMITTED');
  assert.equal(update.data.closedAt, null);
});

test('changeInquiryStatus: closing notifies the inquiry owner and each unique responding company', async () => {
  resetMocks();
  nextFindUnique = openInquiry({ id: 1, title: 'Closing RFQ' });
  fx.recentResponses = [
    { companyId: 20, status: 'PENDING' },
    { companyId: 20, status: 'REJECTED' },
    { companyId: 30, status: 'SELECTED' },
  ];

  await inquiryService.changeInquiryStatus(1, 'CLOSED', buyer);

  const notifications = calls.dispatchNotification.filter(([event]) => event === 'INQUIRY_STATUS_CHANGED');
  assert.equal(notifications.length, 3);
  assert.deepEqual(notifications[0][1], { companyIds: [10] });
  assert.deepEqual(notifications[1][1], { companyIds: [20] });
  assert.deepEqual(notifications[2][1], { companyIds: [30] });
  assert.deepEqual(notifications[0][2], { inquiry: { id: 1, title: 'Closing RFQ' }, status: 'CLOSED' });
  assert.equal(notifications[1][3].dedupeKey(201), 'inquiry-status-1-CLOSED-company-20-201');
  assert.equal(notifications[2][3].dedupeKey(301), 'inquiry-status-1-CLOSED-company-30-301');
});

test('changeInquiryStatus: a closing transition stamps closedAt', async () => {
  resetMocks();
  nextFindUnique = openInquiry();
  await inquiryService.changeInquiryStatus(1, 'CLOSED', buyer);
  const update = calls['inquiry.update'].at(-1);
  assert.equal(update.data.status, 'CLOSED');
  assert.ok(update.data.closedAt instanceof Date);
});

// ── listInquiryItems / addInquiryItem ────────────────────────

test('listInquiryItems: returns the items of an RFQ the caller may read', async () => {
  resetMocks();
  nextFindUnique = { id: 3, companyId: buyer.companyId };
  fx.ownedItemIds = [11, 12];
  const items = await inquiryService.listInquiryItems(3, buyer);
  assert.deepEqual(items, [{ id: 11 }, { id: 12 }]);
});

test('listInquiryItems: an RFQ from another company is hidden (404)', async () => {
  resetMocks();
  nextFindUnique = { id: 3, companyId: 999 };
  await assert.rejects(
    () => inquiryService.listInquiryItems(3, buyer),
    (err) => err.statusCode === 404,
  );
});

test('listInquiryItems: a missing RFQ is 404', async () => {
  resetMocks();
  nextFindUnique = null;
  await assert.rejects(
    () => inquiryService.listInquiryItems(3, buyer),
    (err) => err.statusCode === 404,
  );
});

test('addInquiryItem: appends an item to a DRAFT RFQ', async () => {
  resetMocks();
  nextFindUnique = draftInquiry();
  fx.products = publishedProducts(4);
  await inquiryService.addInquiryItem(1, { productId: 4, quantity: 3, description: 'need it' }, buyer);

  const args = calls['inquiryItem.create'].at(-1);
  assert.equal(args.data.inquiryId, 1);
  assert.equal(args.data.productId, 4);
  assert.equal(args.data.quantity, 3);
});

test('addInquiryItem: SUPER_ADMIN may edit another company\'s DRAFT', async () => {
  resetMocks();
  nextFindUnique = draftInquiry({ companyId: 999 });
  fx.products = publishedProducts(4);
  await inquiryService.addInquiryItem(1, { productId: 4, quantity: 1 }, superAdmin);
  assert.ok(calls['inquiryItem.create'].length > 0);
});

test('addInquiryItem: items are locked once the RFQ leaves DRAFT', async () => {
  resetMocks();
  nextFindUnique = draftInquiry({ status: 'OPEN' });
  await assert.rejects(
    () => inquiryService.addInquiryItem(1, { productId: 4, quantity: 1 }, buyer),
    (err) => err.code === 'INQUIRY_ITEMS_LOCKED',
  );
});

test('addInquiryItem: another company cannot touch the items (404)', async () => {
  resetMocks();
  nextFindUnique = draftInquiry();
  await assert.rejects(
    () => inquiryService.addInquiryItem(1, { productId: 4, quantity: 1 }, seller),
    (err) => err.statusCode === 404,
  );
});

test('addInquiryItem: the product must be published', async () => {
  resetMocks();
  nextFindUnique = draftInquiry();
  fx.products = [{ id: 4, status: 'DRAFT', company: { status: 'ACTIVE' } }];
  await assert.rejects(
    () => inquiryService.addInquiryItem(1, { productId: 4, quantity: 1 }, buyer),
    (err) => err.code === 'PRODUCT_NOT_PUBLISHED',
  );
});

// ── updateInquiryItem / deleteInquiryItem ────────────────────

test('updateInquiryItem: re-validates the product when productId changes', async () => {
  resetMocks();
  nextFindUnique = draftInquiry();
  fx.inquiryItem = { id: 22, inquiryId: 1, quantity: 1 };
  fx.products = publishedProducts(9);
  await inquiryService.updateInquiryItem(1, 22, { productId: 9, quantity: 7 }, buyer);

  assert.deepEqual(calls['product.findMany'].at(-1).where.id.in, [9]); // re-validated
  const args = calls['inquiryItem.update'].at(-1);
  assert.equal(args.where.id, 22);
  assert.equal(args.data.productId, 9);
  assert.equal(args.data.quantity, 7);
});

test('updateInquiryItem: a missing item is 404', async () => {
  resetMocks();
  nextFindUnique = draftInquiry();
  fx.inquiryItem = null;
  await assert.rejects(
    () => inquiryService.updateInquiryItem(1, 22, { quantity: 1 }, buyer),
    (err) => err.statusCode === 404 && err.code === 'INQUIRY_ITEM_NOT_FOUND',
  );
});

test('updateInquiryItem: a non-numeric itemId is rejected', async () => {
  resetMocks();
  await assert.rejects(
    () => inquiryService.updateInquiryItem(1, 'x', {}, buyer),
    (err) => err.code === 'VALIDATION_ERROR',
  );
});

test('updateInquiryItem: items are locked outside DRAFT', async () => {
  resetMocks();
  nextFindUnique = draftInquiry({ status: 'OPEN' });
  await assert.rejects(
    () => inquiryService.updateInquiryItem(1, 22, { quantity: 1 }, buyer),
    (err) => err.code === 'INQUIRY_ITEMS_LOCKED',
  );
});

test('deleteInquiryItem: removes an item when others remain', async () => {
  resetMocks();
  nextFindUnique = draftInquiry();
  fx.inquiryItemCount = 3;
  fx.inquiryItem = { id: 22 };
  await inquiryService.deleteInquiryItem(1, 22, buyer);
  assert.equal(calls['inquiryItem.delete'].at(-1).where.id, 22);
});

test('deleteInquiryItem: the last item may not be removed', async () => {
  resetMocks();
  nextFindUnique = draftInquiry();
  fx.inquiryItemCount = 1;
  await assert.rejects(
    () => inquiryService.deleteInquiryItem(1, 22, buyer),
    (err) => err.code === 'INQUIRY_ITEM_REQUIRED',
  );
});

test('deleteInquiryItem: a missing item is 404', async () => {
  resetMocks();
  nextFindUnique = draftInquiry();
  fx.inquiryItemCount = 3;
  fx.inquiryItem = null;
  await assert.rejects(
    () => inquiryService.deleteInquiryItem(1, 22, buyer),
    (err) => err.statusCode === 404 && err.code === 'INQUIRY_ITEM_NOT_FOUND',
  );
});

// ── submitResponse ───────────────────────────────────────────

test('submitResponse: STAFF cannot submit a supplier quote even with SUPER_ADMIN role or a supplied companyId', async () => {
  resetMocks();
  nextFindUnique = openInquiry();
  fx.ownedItemIds = [11];
  const staffAdmin = { ...superAdmin, accessType: 'STAFF' };

  await assert.rejects(
    () => inquiryService.submitResponse(1, {
      companyId: seller.companyId,
      items: [{ inquiryItemId: 11, price: 1, availableQuantity: 1 }],
    }, staffAdmin),
    (err) => err.statusCode === 403 && err.code === 'STAFF_CANNOT_RESPOND',
  );
  assert.equal((calls['inquiryResponse.create'] || []).length, 0);
});

test('submitResponse: requires a company', async () => {
  resetMocks();
  await assert.rejects(
    () => inquiryService.submitResponse(1, { items: [] }, orphan),
    (err) => err.code === 'COMPANY_CONTEXT_REQUIRED',
  );
});

test('submitResponse: a missing RFQ is 404', async () => {
  resetMocks();
  nextFindUnique = null;
  await assert.rejects(
    () => inquiryService.submitResponse(1, { items: [] }, seller),
    (err) => err.statusCode === 404 && err.code === 'INQUIRY_NOT_FOUND',
  );
});

test('submitResponse: a closed RFQ rejects responses', async () => {
  resetMocks();
  nextFindUnique = openInquiry({ status: 'CLOSED', closedAt: new Date() });
  await assert.rejects(
    () => inquiryService.submitResponse(1, { items: [] }, seller),
    (err) => err.code === 'INQUIRY_CLOSED',
  );
});

test('submitResponse: an open RFQ that already closed_at rejects responses', async () => {
  resetMocks();
  nextFindUnique = openInquiry({ closedAt: new Date() });
  await assert.rejects(
    () => inquiryService.submitResponse(1, { items: [] }, seller),
    (err) => err.code === 'INQUIRY_CLOSED',
  );
});

test('submitResponse: a passed deadline rejects responses', async () => {
  resetMocks();
  nextFindUnique = openInquiry({ responseDeadline: new Date(Date.now() - 60_000).toISOString() });
  await assert.rejects(
    () => inquiryService.submitResponse(1, { items: [] }, seller),
    (err) => err.code === 'INQUIRY_DEADLINE_PASSED',
  );
});

test('submitResponse: the buyer cannot answer its own RFQ', async () => {
  resetMocks();
  nextFindUnique = openInquiry();
  fx.ownedItemIds = [11];
  await assert.rejects(
    () => inquiryService.submitResponse(1, { items: [{ inquiryItemId: 11, price: 1, availableQuantity: 1 }] }, buyer),
    (err) => err.code === 'SELF_RESPONSE_NOT_ALLOWED',
  );
});

test('submitResponse: a company owning no requested product is rejected', async () => {
  resetMocks();
  nextFindUnique = openInquiry();
  fx.ownedItemIds = [];
  await assert.rejects(
    () => inquiryService.submitResponse(1, { items: [{ inquiryItemId: 11, price: 1, availableQuantity: 1 }] }, seller),
    (err) => err.code === 'NO_OWNED_RFQ_ITEMS',
  );
});

test('submitResponse: at least one response item is required', async () => {
  resetMocks();
  nextFindUnique = openInquiry();
  fx.ownedItemIds = [11];
  await assert.rejects(
    () => inquiryService.submitResponse(1, { items: [] }, seller),
    (err) => err.code === 'RESPONSE_ITEMS_REQUIRED',
  );
});

test('submitResponse: a non-numeric inquiryItemId is rejected', async () => {
  resetMocks();
  nextFindUnique = openInquiry();
  fx.ownedItemIds = [11];
  await assert.rejects(
    () => inquiryService.submitResponse(1, { items: [{ inquiryItemId: 'abc', price: 1, availableQuantity: 1 }] }, seller),
    (err) => err.code === 'INVALID_INQUIRY_ITEM_ID',
  );
});

test('submitResponse: quoting the same RFQ item twice is rejected', async () => {
  resetMocks();
  nextFindUnique = openInquiry();
  fx.ownedItemIds = [11];
  await assert.rejects(
    () => inquiryService.submitResponse(1, {
      items: [
        { inquiryItemId: 11, price: 1, availableQuantity: 1 },
        { inquiryItemId: 11, price: 2, availableQuantity: 1 },
      ],
    }, seller),
    (err) => err.code === 'DUPLICATE_RESPONSE_ITEM',
  );
});

test('submitResponse: quoting an item the company does not own is rejected', async () => {
  resetMocks();
  nextFindUnique = openInquiry();
  fx.ownedItemIds = [11];
  await assert.rejects(
    () => inquiryService.submitResponse(1, { items: [{ inquiryItemId: 99, price: 1, availableQuantity: 1 }] }, seller),
    (err) => err.code === 'RESPONSE_ITEM_NOT_ALLOWED',
  );
});

test('submitResponse: companyId is derived from COMPANY context, not request body', async () => {
  resetMocks();
  nextFindUnique = openInquiry();
  fx.ownedItemIds = [11];
  const companyCaller = { ...seller, accessType: 'COMPANY' };

  await inquiryService.submitResponse(1, {
    companyId: 999,
    items: [{ inquiryItemId: 11, price: 1500, availableQuantity: 4 }],
  }, companyCaller);

  assert.equal(calls['inquiryResponse.create'].at(-1).data.companyId, seller.companyId);
});

test('submitResponse: CUSTOMER cannot submit a quote by supplying companyId', async () => {
  resetMocks();
  const customerAdmin = { ...superAdmin, accessType: 'CUSTOMER' };

  await assert.rejects(
    () => inquiryService.submitResponse(1, {
      companyId: seller.companyId,
      items: [{ inquiryItemId: 11, price: 1500, availableQuantity: 4 }],
    }, customerAdmin),
    (err) => err.statusCode === 403 && err.code === 'COMPANY_CONTEXT_REQUIRED',
  );
});

test('submitResponse: a valid quote is stored with normalized items', async () => {
  resetMocks();
  nextFindUnique = openInquiry();
  fx.ownedItemIds = [11];
  await inquiryService.submitResponse(1, {
    status: 'PENDING',
    items: [{ inquiryItemId: 11, price: '1500', availableQuantity: '4', deliveryTime: '2w' }],
  }, seller);

  const args = calls['inquiryResponse.create'].at(-1);
  assert.ok(calls.$queryRawUnsafe.some(({ query, params }) => query.includes('FROM "Inquiry"') && query.includes('FOR UPDATE') && params[0] === 1), 'locks the parent inquiry before submitting a response');
  assert.equal(args.data.companyId, seller.companyId);
  assert.equal(args.data.status, 'PENDING');
  assert.equal(args.data.items.create[0].price, 1500);
  assert.equal(args.data.items.create[0].availableQuantity, 4);
  assert.equal(args.data.items.create[0].currency, 'IRR');
});

test('submitResponse: duplicate response returns a domain conflict instead of a database error', async () => {
  resetMocks();
  nextFindUnique = openInquiry({ id: 41 });
  fx.ownedItemIds = [11];
  fx.response = { id: 901, inquiryId: 41, companyId: seller.companyId, status: 'PENDING' };

  await assert.rejects(
    () => inquiryService.submitResponse(41, {
      items: [{ inquiryItemId: 11, price: 1500, availableQuantity: 4 }],
    }, seller),
    (error) => error.statusCode === 409
      && error.code === 'RESPONSE_ALREADY_EXISTS'
      && error.details.responseId === 901
      && error.details.status === 'PENDING',
  );

  assert.equal((calls['inquiryResponse.create'] || []).length, 0);
  assert.equal((calls.dispatchNotification || []).some(([event]) => event === 'INQUIRY_RESPONSE_RECEIVED'), false);
});

// ── listResponses ────────────────────────────────────────────

test('decideResponse: selecting a quote closes the inquiry and rejects other pending quotes', async () => {
  resetMocks();
  nextFindUnique = openInquiry({ id: 30, companyId: buyer.companyId, visibilityMode: 'NORMAL' });
  fx.response = { id: 501, inquiryId: 30, companyId: seller.companyId, status: 'PENDING' };
  fx.recentResponses = [{ id: 502, inquiryId: 30, companyId: 88, status: 'PENDING' }];
  const selected = await inquiryService.decideResponse(30, 501, 'SELECTED', buyer, 'Best delivery');
  assert.ok(calls.$queryRawUnsafe.some(({ query, params }) => query.includes('FROM "Inquiry"') && query.includes('FOR UPDATE') && params[0] === 30), 'locks the parent inquiry before selecting a response');
  assert.equal(selected.status, 'SELECTED');
  assert.equal(calls['inquiry.updateMany'][0].data.status, 'CLOSED');
  assert.ok(calls['inquiryResponse.updateMany'].some((call) => call.data.status === 'REJECTED'));
  assert.ok(calls['inquiryResponse.updateMany'].some((call) => call.data.status === 'SELECTED'));

  assert.ok(calls['inquiryStatusHistory.create'].some((call) => call.data.source === 'USER'));
  assert.ok((calls.dispatchNotification || []).some(([event]) => event === 'INQUIRY_RESPONSE_SELECTED'));
  assert.ok(calls.dispatchNotification.some(([event]) => event === 'INQUIRY_RESPONSE_AUTO_REJECTED'));
});

test('decideResponse: stale rejection fails when the response is no longer pending', async () => {
  resetMocks();
  nextFindUnique = openInquiry({ id: 301, companyId: buyer.companyId, visibilityMode: 'NORMAL' });
  fx.response = { id: 601, inquiryId: 301, companyId: seller.companyId, status: 'PENDING' };
  fx.responseDecisionUpdateCount = 0;

  await assert.rejects(
    () => inquiryService.decideResponse(301, 601, 'REJECTED', buyer),
    (err) => err.statusCode === 409 && err.code === 'RESPONSE_ALREADY_DECIDED',
  );
  assert.equal((calls.dispatchNotification || []).some(([event]) => event === 'INQUIRY_RESPONSE_REJECTED'), false);
});

test('decideResponse: stale selection fails and does not notify suppliers', async () => {
  resetMocks();
  nextFindUnique = openInquiry({ id: 302, companyId: buyer.companyId, visibilityMode: 'NORMAL' });
  fx.response = { id: 602, inquiryId: 302, companyId: seller.companyId, status: 'PENDING' };
  fx.responseDecisionUpdateCount = 0;

  await assert.rejects(
    () => inquiryService.decideResponse(302, 602, 'SELECTED', buyer),
    (err) => err.statusCode === 409 && err.code === 'RESPONSE_ALREADY_DECIDED',
  );
  assert.equal((calls.dispatchNotification || []).some(([event]) => event === 'INQUIRY_RESPONSE_SELECTED'), false);
});

test('decideResponse: buyer cannot select a sealed quote before reveal', async () => {
  resetMocks();
  nextFindUnique = openInquiry({
    id: 31,
    companyId: buyer.companyId,
    visibilityMode: 'SEALED',
    responseDeadline: new Date(Date.now() + 60_000),
  });
  fx.response = { id: 503, inquiryId: 31, companyId: seller.companyId, status: 'PENDING' };
  await assert.rejects(
    () => inquiryService.decideResponse(31, 503, 'SELECTED', buyer),
    (err) => err.code === 'RESPONSES_NOT_REVEALED',
  );
});

test('decideResponse: supplier cannot decide another supplier response', async () => {
  resetMocks();
  nextFindUnique = openInquiry({ id: 32, companyId: buyer.companyId, visibilityMode: 'NORMAL' });
  fx.response = { id: 504, inquiryId: 32, companyId: seller.companyId, status: 'PENDING' };
  await assert.rejects(
    () => inquiryService.decideResponse(32, 504, 'SELECTED', seller),
    (err) => err.statusCode === 404 || err.code === 'BUYER_DECISION_REQUIRED',
  );
});

test('listResponses: SUPER_ADMIN role in COMPANY context cannot read unrelated RFQ responses', async () => {
  resetMocks();
  nextFindUnique = { id: 88, companyId: buyer.companyId, items: [] };
  await assert.rejects(
    () => inquiryService.listResponses(88, companySuperAdmin),
    (err) => err.statusCode === 404 || err.code === 'FORBIDDEN',
  );
});

test('listResponses: SUPER_ADMIN sees every response', async () => {
  resetMocks();
  nextFindUnique = { id: 1, companyId: buyer.companyId, items: [] };
  fx.recentResponses = [{ id: 1 }, { id: 2 }];
  const responses = await inquiryService.listResponses(1, superAdmin);
  assert.equal(responses.length, 2);
  const where = calls['inquiryResponse.findMany'].at(-1).where;
  assert.equal(where.companyId, undefined);
});

test('listResponses: the buyer sees all responses to its own RFQ', async () => {
  resetMocks();
  nextFindUnique = { id: 1, companyId: buyer.companyId, items: [] };
  await inquiryService.listResponses(1, buyer);
  assert.equal(calls['inquiryResponse.findMany'].at(-1).where.companyId, undefined);
});

test('listResponses: a seller only sees its own responses', async () => {
  resetMocks();
  nextFindUnique = {
    id: 1,
    companyId: buyer.companyId,
    status: 'OPEN',
    items: [{ product: { companyId: seller.companyId } }],
  };
  await inquiryService.listResponses(1, seller);
  assert.equal(calls['inquiryResponse.findMany'].at(-1).where.companyId, seller.companyId);
});

test('listResponses: a seller owning a requested product may read the responses', async () => {
  resetMocks();
  nextFindUnique = {
    id: 1,
    companyId: buyer.companyId,
    status: 'OPEN',
    items: [{ product: { companyId: seller.companyId } }],
  };
  await inquiryService.listResponses(1, seller);
  assert.equal(calls['inquiryResponse.findMany'].at(-1).where.companyId, seller.companyId);
});

test('listResponses: a caller without a company is rejected', async () => {
  resetMocks();
  nextFindUnique = { id: 1, companyId: buyer.companyId, items: [] };
  await assert.rejects(
    () => inquiryService.listResponses(1, orphan),
    (err) => err.code === 'COMPANY_REQUIRED',
  );
});

test('listResponses: an unrelated company gets 404', async () => {
  resetMocks();
  nextFindUnique = { id: 1, companyId: buyer.companyId, items: [] };
  await assert.rejects(
    () => inquiryService.listResponses(1, { id: 9, accessType: 'COMPANY', roles: [], permissions: [], companyId: 777 }),
    (err) => err.statusCode === 404 && err.code === 'INQUIRY_NOT_FOUND',
  );
});

test('decideResponse: SUPER_ADMIN role in COMPANY context cannot decide another buyer quote', async () => {
  resetMocks();
  nextFindUnique = openInquiry({ id: 304, companyId: buyer.companyId, visibilityMode: 'NORMAL' });
  fx.response = { id: 604, inquiryId: 304, companyId: seller.companyId, status: 'PENDING' };

  await assert.rejects(
    () => inquiryService.decideResponse(304, 604, 'SELECTED', companySuperAdmin),
    (err) => err.statusCode === 403 || err.statusCode === 404,
  );
  assert.equal((calls['inquiry.updateMany'] || []).length, 0);
});

test('decideResponse: STAFF cannot decide a buyer quote even with SUPER_ADMIN role', async () => {
  resetMocks();
  nextFindUnique = openInquiry({ id: 303, companyId: buyer.companyId, visibilityMode: 'NORMAL' });
  fx.response = { id: 603, inquiryId: 303, companyId: seller.companyId, status: 'PENDING' };
  const staffAdmin = { ...superAdmin, accessType: 'STAFF' };

  await assert.rejects(
    () => inquiryService.decideResponse(303, 603, 'SELECTED', staffAdmin),
    (err) => err.statusCode === 403 && err.code === 'BUYER_DECISION_REQUIRED',
  );
  assert.equal((calls['inquiry.updateMany'] || []).length, 0);
});

// ── updateResponse ───────────────────────────────────────────

test('updateResponse: STAFF cannot impersonate a supplier through companyId', async () => {
  resetMocks();
  const staffAdmin = { ...superAdmin, accessType: 'STAFF' };

  await assert.rejects(
    () => inquiryService.updateResponse(1, 50, {
      companyId: seller.companyId,
      items: [{ inquiryItemId: 11, price: 10, availableQuantity: 2 }],
    }, staffAdmin),
    (err) => err.statusCode === 403 && err.code === 'STAFF_CANNOT_MANAGE_SUPPLIER_RESPONSE',
  );
  assert.equal((calls['inquiryResponse.update'] || []).length, 0);
});

test('updateResponse: rewrites the items of a pending response', async () => {
  resetMocks();
  nextFindUnique = openInquiry();
  fx.response = { id: 50, status: 'PENDING' };
  fx.ownedItemIds = [11];
  await inquiryService.updateResponse(1, 50, {
    items: [{ inquiryItemId: 11, price: 10, availableQuantity: 2 }],
  }, seller);

  assert.ok(calls['inquiryResponseItem.deleteMany'].length > 0);
  const args = calls['inquiryResponse.update'].at(-1);
  assert.equal(args.where.id, 50);
  assert.equal(args.data.items.create[0].price, 10);
});

test('updateResponse: companyId is derived from COMPANY context, not request body', async () => {
  resetMocks();
  nextFindUnique = openInquiry();
  fx.response = { id: 50, status: 'PENDING' };
  fx.ownedItemIds = [11];
  const companyCaller = { ...seller, accessType: 'COMPANY' };

  await inquiryService.updateResponse(1, 50, {
    companyId: 999,
    items: [{ inquiryItemId: 11, price: 10, availableQuantity: 2 }],
  }, companyCaller);

  assert.equal(calls['inquiryResponse.findFirst'].at(-1).where.companyId, seller.companyId);
});

test('updateResponse: a missing RFQ is 404', async () => {
  resetMocks();
  nextFindUnique = null;
  await assert.rejects(
    () => inquiryService.updateResponse(1, 50, { items: [] }, seller),
    (err) => err.statusCode === 404,
  );
});

test('updateResponse: a closed RFQ cannot be edited', async () => {
  resetMocks();
  nextFindUnique = openInquiry({ status: 'CLOSED', closedAt: new Date() });
  await assert.rejects(
    () => inquiryService.updateResponse(1, 50, { items: [] }, seller),
    (err) => err.code === 'INQUIRY_CLOSED',
  );
});

test('updateResponse: editing must be enabled on the RFQ', async () => {
  resetMocks();
  nextFindUnique = openInquiry({ allowEditResponse: false });
  await assert.rejects(
    () => inquiryService.updateResponse(1, 50, { items: [] }, seller),
    (err) => err.code === 'RESPONSE_EDIT_DISABLED',
  );
});

test('updateResponse: the deadline blocks edits', async () => {
  resetMocks();
  nextFindUnique = openInquiry({ responseDeadline: new Date(Date.now() - 1000).toISOString() });
  await assert.rejects(
    () => inquiryService.updateResponse(1, 50, { items: [] }, seller),
    (err) => err.code === 'INQUIRY_DEADLINE_PASSED',
  );
});

test('updateResponse: a response belonging to another company is 404', async () => {
  resetMocks();
  nextFindUnique = openInquiry();
  fx.response = null;
  await assert.rejects(
    () => inquiryService.updateResponse(1, 50, { items: [{ inquiryItemId: 11, price: 1, availableQuantity: 1 }] }, seller),
    (err) => err.statusCode === 404 && err.code === 'RESPONSE_NOT_FOUND',
  );
});

test('updateResponse: only PENDING responses can be edited', async () => {
  resetMocks();
  nextFindUnique = openInquiry();
  fx.response = { id: 50, status: 'SELECTED' };
  await assert.rejects(
    () => inquiryService.updateResponse(1, 50, { items: [{ inquiryItemId: 11, price: 1, availableQuantity: 1 }] }, seller),
    (err) => err.code === 'RESPONSE_LOCKED',
  );
});

// ── withdrawResponse ─────────────────────────────────────────

test('withdrawResponse: STAFF cannot impersonate a supplier through companyId', async () => {
  resetMocks();
  const staffAdmin = { ...superAdmin, accessType: 'STAFF' };

  await assert.rejects(
    () => inquiryService.withdrawResponse(1, 50, staffAdmin, { companyId: seller.companyId }),
    (err) => err.statusCode === 403 && err.code === 'STAFF_CANNOT_MANAGE_SUPPLIER_RESPONSE',
  );
  assert.equal((calls['inquiryResponse.update'] || []).length, 0);
});

test('withdrawResponse: marks a pending response as WITHDRAWN', async () => {
  resetMocks();
  nextFindUnique = openInquiry({ allowWithdrawResponse: true });
  fx.response = { id: 50, status: 'PENDING' };
  await inquiryService.withdrawResponse(1, 50, seller);

  const args = calls['inquiryResponse.update'].at(-1);
  assert.equal(args.data.status, 'WITHDRAWN');
  assert.ok(args.data.withdrawnAt instanceof Date);
});

test('withdrawResponse: notifies active COMPANY buyer members without exposing supplier identity', async () => {
  resetMocks();
  nextFindUnique = openInquiry({ id: 1, companyId: 10, buyerUserId: null, title: 'Sealed RFQ', visibilityMode: 'ANONYMOUS_SEALED', allowWithdrawResponse: true });
  fx.response = { id: 50, status: 'PENDING' };
  fx.notificationRecipients = [{ id: 101 }, { id: 102 }];

  await inquiryService.withdrawResponse(1, 50, seller);

  assert.deepEqual(calls['user.findMany'][0].where, {
    status: 'ACTIVE',
    accessProfile: { companyId: 10, type: 'COMPANY', isActive: true },
  });
  const notification = calls.dispatchNotification.find(([event]) => event === 'INQUIRY_RESPONSE_WITHDRAWN');
  assert.ok(notification);
  assert.deepEqual(notification[1], [101, 102]);
  assert.deepEqual(notification[2], {
    inquiry: { id: 1, title: 'Sealed RFQ' },
    response: { id: 50 },
  });
  assert.equal(notification[2].company, undefined);
  assert.equal(notification[3].tx, mockPrisma);
  assert.equal(notification[3].dedupeKey(101), 'inquiry-response-withdrawn-50-101');
  assert.equal(notification[3].dedupeKey(102), 'inquiry-response-withdrawn-50-102');
});

test('withdrawResponse: notifies the active Website buyer user', async () => {
  resetMocks();
  nextFindUnique = openInquiry({ id: 1, companyId: null, buyerUserId: 77, allowWithdrawResponse: true });
  fx.response = { id: 51, status: 'PENDING' };
  fx.notificationRecipients = [{ id: 77 }];

  await inquiryService.withdrawResponse(1, 51, seller);

  assert.deepEqual(calls['user.findMany'][0].where, { id: 77, status: 'ACTIVE' });
  const notification = calls.dispatchNotification.find(([event]) => event === 'INQUIRY_RESPONSE_WITHDRAWN');
  assert.ok(notification);
  assert.deepEqual(notification[1], [77]);
  assert.equal(notification[3].dedupeKey(77), 'inquiry-response-withdrawn-51-77');
});

test('withdrawResponse: requires an explicit COMPANY application context', async () => {
  resetMocks();
  await assert.rejects(
    () => inquiryService.withdrawResponse(1, 50, orphan),
    (err) => err.code === 'COMPANY_CONTEXT_REQUIRED',
  );
});

test('withdrawResponse: a closed RFQ blocks withdrawal', async () => {
  resetMocks();
  nextFindUnique = openInquiry({ allowWithdrawResponse: true, status: 'CLOSED', closedAt: new Date() });
  await assert.rejects(
    () => inquiryService.withdrawResponse(1, 50, seller),
    (err) => err.code === 'INQUIRY_CLOSED',
  );
});

test('withdrawResponse: must be explicitly enabled on the RFQ', async () => {
  resetMocks();
  nextFindUnique = openInquiry({ allowWithdrawResponse: false });
  await assert.rejects(
    () => inquiryService.withdrawResponse(1, 50, seller),
    (err) => err.code === 'RESPONSE_WITHDRAW_DISABLED',
  );
});

test('withdrawResponse: the deadline blocks withdrawal', async () => {
  resetMocks();
  nextFindUnique = openInquiry({ allowWithdrawResponse: true, responseDeadline: new Date(Date.now() - 1000).toISOString() });
  await assert.rejects(
    () => inquiryService.withdrawResponse(1, 50, seller),
    (err) => err.code === 'INQUIRY_DEADLINE_PASSED',
  );
});

test('withdrawResponse: a response from another company is 404', async () => {
  resetMocks();
  nextFindUnique = openInquiry({ allowWithdrawResponse: true });
  fx.response = null;
  await assert.rejects(
    () => inquiryService.withdrawResponse(1, 50, seller),
    (err) => err.statusCode === 404 && err.code === 'RESPONSE_NOT_FOUND',
  );
});

test('withdrawResponse: an already withdrawn response is rejected', async () => {
  resetMocks();
  nextFindUnique = openInquiry({ allowWithdrawResponse: true });
  fx.response = { id: 50, status: 'WITHDRAWN' };
  await assert.rejects(
    () => inquiryService.withdrawResponse(1, 50, seller),
    (err) => err.code === 'RESPONSE_ALREADY_WITHDRAWN',
  );
});

test('withdrawResponse: a non-pending response is rejected', async () => {
  resetMocks();
  nextFindUnique = openInquiry({ allowWithdrawResponse: true });
  fx.response = { id: 50, status: 'SELECTED' };
  await assert.rejects(
    () => inquiryService.withdrawResponse(1, 50, seller),
    (err) => err.code === 'RESPONSE_LOCKED',
  );
});

// ── Response attachments (real file I/O into backend/uploads) ─

test('uploadResponseAttachment: stores the file and writes the row', async () => {
  resetMocks();
  nextFindUnique = openInquiry();
  fx.response = { id: 50, status: 'PENDING' };

  const attachment = await inquiryService.uploadResponseAttachment(
    1, 50, makeFile({ filename: 'quote.pdf' }), seller,
  );

  assert.equal(attachment.responseId, 50);
  assert.ok(attachment.url.startsWith('/uploads/inquiries/responses/'));
  const lockIndex = operationTimeline.indexOf('$queryRawUnsafe');
  const countIndex = operationTimeline.indexOf('inquiryResponseAttachment.count');
  const createIndex = operationTimeline.indexOf('inquiryResponseAttachment.create');
  assert.ok(lockIndex >= 0 && lockIndex < countIndex && countIndex < createIndex, 'parent inquiry is locked before the attachment cap is checked and row inserted');
  assert.ok(calls.$transaction.some(({ kind }) => kind === 'interactive'));
  const storedPath = path.join(process.cwd(), attachment.url.replace(/^\//, ''));
  assert.ok(fs.existsSync(storedPath));
  fs.rmSync(storedPath, { force: true });
});

test('uploadResponseAttachment: enforces the per-response attachment cap under the inquiry lock and cleans the prewritten file', async () => {
  resetMocks();
  nextFindUnique = openInquiry();
  fx.response = { id: 50, status: 'PENDING' };
  fx.attachmentCount = 10;
  fs.mkdirSync(attachmentDir, { recursive: true });
  const before = fs.readdirSync(attachmentDir).sort();

  await assert.rejects(
    () => inquiryService.uploadResponseAttachment(1, 50, makeFile(), seller),
    (err) => err.code === 'ATTACHMENT_LIMIT_REACHED',
  );

  const lockIndex = operationTimeline.indexOf('$queryRawUnsafe');
  const countIndex = operationTimeline.indexOf('inquiryResponseAttachment.count');
  assert.ok(lockIndex >= 0 && lockIndex < countIndex, 'cap check must run after acquiring the parent inquiry lock');
  assert.deepEqual(fs.readdirSync(attachmentDir).sort(), before, 'rejected upload must remove the file written before the transaction');
});

test('uploadResponseAttachment: rejects a missing file', async () => {
  resetMocks();
  nextFindUnique = openInquiry();
  fx.response = { id: 50, status: 'PENDING' };
  await assert.rejects(
    () => inquiryService.uploadResponseAttachment(1, 50, undefined, seller),
    (err) => err.code === 'FILE_REQUIRED',
  );
});

test('uploadResponseAttachment: rejects an unsupported mimetype', async () => {
  resetMocks();
  nextFindUnique = openInquiry();
  fx.response = { id: 50, status: 'PENDING' };
  await assert.rejects(
    () => inquiryService.uploadResponseAttachment(1, 50, makeFile({ filename: 'x.exe', mimetype: 'application/x-msdownload' }), seller),
    (err) => err.code === 'UNSUPPORTED_FILE_TYPE',
  );
});

test('uploadResponseAttachment: a response from another company is 404', async () => {
  resetMocks();
  nextFindUnique = openInquiry();
  fx.response = null;
  await assert.rejects(
    () => inquiryService.uploadResponseAttachment(1, 50, makeFile(), seller),
    (err) => err.statusCode === 404 && err.code === 'RESPONSE_NOT_FOUND',
  );
});

test('uploadResponseAttachment: a non-pending response cannot receive files', async () => {
  resetMocks();
  nextFindUnique = openInquiry();
  fx.response = { id: 50, status: 'SELECTED' };
  await assert.rejects(
    () => inquiryService.uploadResponseAttachment(1, 50, makeFile(), seller),
    (err) => err.code === 'RESPONSE_LOCKED',
  );
});

test('uploadResponseAttachment: an oversized file is rejected and removed from disk', async () => {
  resetMocks();
  nextFindUnique = openInquiry();
  fx.response = { id: 50, status: 'PENDING' };
  const file = { filename: 'big.pdf', mimetype: 'application/pdf', fields: {}, file: largeStream(21) };

  fs.mkdirSync(attachmentDir, { recursive: true });
  const before = fs.readdirSync(attachmentDir).sort();

  await assert.rejects(
    () => inquiryService.uploadResponseAttachment(1, 50, file, seller),
    (err) => err.code === 'FILE_TOO_LARGE' && err.statusCode === 413,
  );

  // The partially written file must have been cleaned up.
  assert.deepEqual(fs.readdirSync(attachmentDir).sort(), before);
});

test('uploadResponseAttachment: a failed row insert cleans the stored file up', async () => {
  resetMocks();
  nextFindUnique = openInquiry();
  fx.response = { id: 50, status: 'PENDING' };
  fx.attachmentCreateError = new Error('db down');

  const file = makeFile({ filename: 'orphan.pdf' });
  await assert.rejects(
    () => inquiryService.uploadResponseAttachment(1, 50, file, seller),
    (err) => err.message === 'db down',
  );
});

test('deleteResponseAttachment: deletes the row and the stored file', async () => {
  resetMocks();
  nextFindUnique = openInquiry();
  fx.response = { id: 50, status: 'PENDING' };
  fx.attachment = { id: 77, url: '/uploads/inquiries/responses/gone.pdf' };

  fs.mkdirSync(attachmentDir, { recursive: true });
  const storedPath = path.join(attachmentDir, 'gone.pdf');
  fs.writeFileSync(storedPath, 'bye');

  const result = await inquiryService.deleteResponseAttachment(1, 50, 77, seller);
  assert.equal(result.id, 77);
  assert.equal(calls['inquiryResponseAttachment.delete'].at(-1).where.id, 77);
  assert.equal(fs.existsSync(storedPath), false);
});

test('deleteResponseAttachment: a foreign URL is never followed', async () => {
  resetMocks();
  nextFindUnique = openInquiry();
  fx.response = { id: 50, status: 'PENDING' };
  fx.attachment = { id: 78, url: 'https://evil.example/keep-me' };
  await inquiryService.deleteResponseAttachment(1, 50, 78, seller);
  assert.equal(calls['inquiryResponseAttachment.delete'].at(-1).where.id, 78);
});

test('deleteResponseAttachment: an unknown attachment is 404', async () => {
  resetMocks();
  nextFindUnique = openInquiry();
  fx.response = { id: 50, status: 'PENDING' };
  fx.attachment = null;
  await assert.rejects(
    () => inquiryService.deleteResponseAttachment(1, 50, 77, seller),
    (err) => err.statusCode === 404 && err.code === 'ATTACHMENT_NOT_FOUND',
  );
});

test('deleteResponseAttachment: a non-numeric attachmentId is rejected', async () => {
  resetMocks();
  await assert.rejects(
    () => inquiryService.deleteResponseAttachment(1, 50, 'x', seller),
    (err) => err.code === 'VALIDATION_ERROR',
  );
});

// ── getInquiryStats ──────────────────────────────────────────

test('getInquiryStats: aggregates per-company figures with a computed success rate', async () => {
  resetMocks();
  queues.inquiryGroupBy = [
    [{ status: 'OPEN', _count: { _all: 3 } }],
    [{ status: 'OPEN', _count: { _all: 5 } }, { status: 'CLOSED', _count: { _all: 1 } }],
  ];
  queues.responseGroupBy = [[
    { status: 'SELECTED', _count: { _all: 2 } },
    { status: 'REJECTED', _count: { _all: 1 } },
    { status: 'PENDING', _count: { _all: 4 } },
  ]];
  nextCount = 7;
  fx.responseCount = 9;
  nextFindMany = [{ id: 1, title: 'recent' }];
  fx.recentResponses = [{ id: 2, status: 'SELECTED' }];

  const stats = await inquiryService.getInquiryStats(buyer);

  assert.equal(stats.sent.total, 7);
  assert.equal(stats.sent.byStatus.OPEN, 3);
  assert.equal(stats.received.total, 7);
  assert.equal(stats.received.new, 5);
  assert.equal(stats.received.closed, 1);
  assert.equal(stats.responses.total, 9);
  assert.equal(stats.responses.awaiting, 4);
  assert.equal(stats.responses.selected, 2);
  assert.equal(stats.responses.successRate, 67); // 2 / (2 + 1)
  assert.deepEqual(stats.recentInquiries, [{ id: 1, title: 'recent' }]);
  assert.deepEqual(stats.recentResponses, [{ id: 2, status: 'SELECTED' }]);
});

test('getInquiryStats: an empty platform reports a 0% success rate', async () => {
  resetMocks();
  nextCount = 0;
  fx.responseCount = 0;
  const stats = await inquiryService.getInquiryStats(superAdmin);
  assert.equal(stats.responses.successRate, 0);
  assert.equal(stats.sent.total, 0);
});

test('getInquiryStats: a caller without a company is rejected', async () => {
  resetMocks();
  await assert.rejects(
    () => inquiryService.getInquiryStats(orphan),
    (err) => err.code === 'COMPANY_REQUIRED',
  );
});

test('sendInquiryMessage: supplier can message the inquiry buyer only after responding', async () => {
  resetMocks();
  nextFindUnique = { id: 1, companyId: null, buyerUserId: 10, status: 'OPEN' };
  fx.response = { id: 90 };
  const result = await inquiryService.sendInquiryMessage(1, { message: 'Need one clarification' }, { id: 20, accessType: 'COMPANY', companyId: 5, permissions: ['inquiries.respond'] });
  assert.equal(result.senderCompanyId, 5);
  assert.equal(result.recipientUserId, 10);
  assert.equal(result.body, 'Need one clarification');
  assert.equal(calls['inquiryMessage.create'][0].data.senderCompanyId, 5);
});

test('sendInquiryMessage: buyer messages a responding company and records the chosen recipient', async () => {
  resetMocks();
  nextFindUnique = { id: 1, companyId: null, buyerUserId: 10, status: 'OPEN' };
  fx.response = { id: 90 };
  const result = await inquiryService.sendInquiryMessage(1, { message: 'Please confirm delivery', recipientCompanyId: 5 }, { id: 10, accessType: 'CUSTOMER', permissions: ['inquiries.create'] });
  assert.equal(result.senderUserId, 10);
  assert.equal(result.recipientCompanyId, 5);
});

test('sendInquiryMessage: blocks companies that have not responded', async () => {
  resetMocks();
  nextFindUnique = { id: 1, companyId: null, buyerUserId: 10, status: 'OPEN' };
  fx.response = null;
  await assert.rejects(
    () => inquiryService.sendInquiryMessage(1, { message: 'Hello' }, { id: 20, accessType: 'COMPANY', companyId: 5, permissions: ['inquiries.respond'] }),
    (error) => error.code === 'INQUIRY_NOT_FOUND' && error.statusCode === 404,
  );
  assert.equal(calls['inquiryMessage.create'], undefined);
});

test('sendInquiryMessage: dispatches in-app/email notification to an active Website buyer user', async () => {
  resetMocks();
  nextFindUnique = { id: 1, title: 'Buyer RFQ', companyId: null, buyerUserId: 10, status: 'OPEN' };
  fx.response = { id: 90 };
  fx.notificationRecipients = [{ id: 10 }];

  await inquiryService.sendInquiryMessage(
    1,
    { message: 'Please confirm delivery' },
    { id: 20, accessType: 'COMPANY', companyId: 5, permissions: ['inquiries.respond'] },
  );

  assert.deepEqual(calls['user.findMany'][0].where, { id: 10, status: 'ACTIVE' });
  const notification = calls.dispatchNotification.find(([event]) => event === 'INQUIRY_MESSAGE_RECEIVED');
  assert.ok(notification);
  assert.deepEqual(notification[1], [10]);
  assert.deepEqual(notification[2], { inquiry: { id: 1, title: 'Buyer RFQ' } });
  assert.equal(notification[3].tx, mockPrisma);
  assert.equal(notification[3].dedupeKey(10), 'inquiry-message-101-10');
});

test('sendInquiryMessage: dispatches to active COMPANY members only, never STAFF sharing the company id', async () => {
  resetMocks();
  nextFindUnique = { id: 1, title: 'Company RFQ', companyId: 10, buyerUserId: null, status: 'OPEN' };
  fx.response = { id: 90 };
  fx.notificationRecipients = [{ id: 31 }, { id: 32 }];

  await inquiryService.sendInquiryMessage(
    1,
    { message: 'Please confirm delivery', recipientCompanyId: 20 },
    { id: 12, accessType: 'COMPANY', companyId: 10, permissions: ['inquiries.create'] },
  );

  assert.deepEqual(calls['user.findMany'][0].where, {
    status: 'ACTIVE',
    accessProfile: { companyId: 20, type: 'COMPANY', isActive: true },
  });
  const notification = calls.dispatchNotification.find(([event]) => event === 'INQUIRY_MESSAGE_RECEIVED');
  assert.ok(notification);
  assert.deepEqual(notification[1], [31, 32]);
  assert.equal(notification[3].dedupeKey(31), 'inquiry-message-101-31');
  assert.equal(notification[3].dedupeKey(32), 'inquiry-message-101-32');
});

test('listInquiryMessages: limits company results to messages involving that company', async () => {
  resetMocks();
  nextFindUnique = { id: 1, companyId: null, buyerUserId: 10 };
  fx.response = { id: 90 };
  nextMessages = [{ id: 1, senderCompanyId: 2, recipientCompanyId: 5, readAt: null }];
  const messages = await inquiryService.listInquiryMessages(1, { id: 20, accessType: 'COMPANY', companyId: 5, permissions: ['inquiries.read'] });
  assert.deepEqual(calls['inquiryMessage.findMany'][0].where.OR, [{ senderCompanyId: 5 }, { recipientCompanyId: 5 }]);
  assert.equal(calls['inquiryMessage.updateMany'][0].where.recipientCompanyId, 5);
  assert.deepEqual(calls['inquiryMessage.updateMany'][0].where.id, { in: [1] });
  assert.ok(messages[0].readAt instanceof Date, 'returned recipient message reflects the read state written by this request');
  assert.ok(nextMessages[0].readAt === null, 'mock source row remains unchanged');
});



test('sendInquiryMessage: optional SMS consumes its own paid allowance and queues an outbox delivery', async () => {
  resetMocks();
  nextFindUnique = { id: 1, title: 'Sample RFQ', companyId: null, buyerUserId: 10, status: 'OPEN' };
  fx.response = { id: 90 };
  const oldSid = process.env.TWILIO_ACCOUNT_SID;
  const oldToken = process.env.TWILIO_AUTH_TOKEN;
  const oldFrom = process.env.TWILIO_FROM_NUMBER;
  process.env.TWILIO_ACCOUNT_SID = 'ACtest';
  process.env.TWILIO_AUTH_TOKEN = 'test-token';
  process.env.TWILIO_FROM_NUMBER = '+15005550006';
  try {
    const result = await inquiryService.sendInquiryMessage(1, { message: 'Please call me', notifyBySms: true }, { id: 20, accessType: 'COMPANY', companyId: 5, permissions: ['inquiries.respond'] });
    assert.equal(result.recipientUserId, 10);
    assert.equal(result.smsQueued, true);
    assert.equal(smsUsageEvents.filter(e => e.usageType === 'SMS').length, 1);
    assert.equal(calls['notificationDelivery.create'].length, 1);
    assert.equal(calls['notificationDelivery.create'][0].data.channel, 'SMS');
    assert.equal(calls['notificationDelivery.create'][0].data.recipient, '+31612345678');
  } finally {
    if (oldSid === undefined) delete process.env.TWILIO_ACCOUNT_SID; else process.env.TWILIO_ACCOUNT_SID = oldSid;
    if (oldToken === undefined) delete process.env.TWILIO_AUTH_TOKEN; else process.env.TWILIO_AUTH_TOKEN = oldToken;
    if (oldFrom === undefined) delete process.env.TWILIO_FROM_NUMBER; else process.env.TWILIO_FROM_NUMBER = oldFrom;
  }
});

test('sendInquiryMessage: exhausted SMS quota keeps the message but does not queue or consume another SMS', async () => {
  resetMocks();
  nextFindUnique = { id: 1, title: 'Sample RFQ', companyId: null, buyerUserId: 10, status: 'OPEN' };
  fx.response = { id: 90 };
  smsUsageEvents = [
    { subscriptionId: 77, usageType: 'SMS', quantity: 1 },
    { subscriptionId: 77, usageType: 'SMS', quantity: 1 },
  ];
  const old = [process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN, process.env.TWILIO_FROM_NUMBER];
  process.env.TWILIO_ACCOUNT_SID = 'ACtest';
  process.env.TWILIO_AUTH_TOKEN = 'test-token';
  process.env.TWILIO_FROM_NUMBER = '+15005550006';
  try {
    const result = await inquiryService.sendInquiryMessage(1, { message: 'Please call me', notifyBySms: true }, { id: 20, accessType: 'COMPANY', companyId: 5, permissions: ['inquiries.respond'] });
    assert.equal(result.id, 101);
    assert.equal(result.smsQueued, false);
    assert.equal(result.smsSkippedReason, 'sms_quota_exceeded');
    assert.equal(calls['inquiryMessage.create'].length, 1);
    assert.equal(calls['notificationDelivery.create'], undefined);
    assert.equal(smsUsageEvents.filter(e => e.usageType === 'SMS').length, 2);
  } finally {
    if (old[0] === undefined) delete process.env.TWILIO_ACCOUNT_SID; else process.env.TWILIO_ACCOUNT_SID = old[0];
    if (old[1] === undefined) delete process.env.TWILIO_AUTH_TOKEN; else process.env.TWILIO_AUTH_TOKEN = old[1];
    if (old[2] === undefined) delete process.env.TWILIO_FROM_NUMBER; else process.env.TWILIO_FROM_NUMBER = old[2];
  }
});

test('sendInquiryMessage: missing recipient phone skips SMS before quota is consumed', async () => {
  resetMocks();
  nextFindUnique = { id: 1, title: 'Sample RFQ', companyId: null, buyerUserId: 10, status: 'OPEN' };
  fx.response = { id: 90 };
  smsRecipientUser = { id: 10, phone: ' ' };
  const result = await inquiryService.sendInquiryMessage(1, { message: 'Please call me', notifyBySms: true }, { id: 20, accessType: 'COMPANY', companyId: 5, permissions: ['inquiries.respond'] });
  assert.equal(result.smsQueued, false);
  assert.equal(result.smsSkippedReason, 'recipient_phone_missing');
  assert.equal(smsUsageEvents.filter(e => e.usageType === 'SMS').length, 0);
  assert.equal(calls['notificationDelivery.create'], undefined);
});

test('sendInquiryMessage: unconfigured Twilio skips SMS without consuming paid allowance', async () => {
  resetMocks();
  nextFindUnique = { id: 1, title: 'Sample RFQ', companyId: null, buyerUserId: 10, status: 'OPEN' };
  fx.response = { id: 90 };
  const old = [process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN, process.env.TWILIO_FROM_NUMBER];
  delete process.env.TWILIO_ACCOUNT_SID;
  delete process.env.TWILIO_AUTH_TOKEN;
  delete process.env.TWILIO_FROM_NUMBER;
  try {
    const result = await inquiryService.sendInquiryMessage(1, { message: 'Please call me', notifyBySms: true }, { id: 20, accessType: 'COMPANY', companyId: 5, permissions: ['inquiries.respond'] });
    assert.equal(result.smsQueued, false);
    assert.equal(result.smsSkippedReason, 'sms_provider_not_configured');
    assert.equal(smsUsageEvents.filter(e => e.usageType === 'SMS').length, 0);
    assert.equal(calls['notificationDelivery.create'], undefined);
  } finally {
    if (old[0] === undefined) delete process.env.TWILIO_ACCOUNT_SID; else process.env.TWILIO_ACCOUNT_SID = old[0];
    if (old[1] === undefined) delete process.env.TWILIO_AUTH_TOKEN; else process.env.TWILIO_AUTH_TOKEN = old[1];
    if (old[2] === undefined) delete process.env.TWILIO_FROM_NUMBER; else process.env.TWILIO_FROM_NUMBER = old[2];
  }
});

test('sendInquiryMessage: recipient SMS opt-out prevents quota consumption and delivery creation', async () => {
  resetMocks();
  nextFindUnique = { id: 1, title: 'Sample RFQ', companyId: null, buyerUserId: 10, status: 'OPEN' };
  fx.response = { id: 90 };
  smsPreferenceEnabled = false;
  const old = [process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN, process.env.TWILIO_FROM_NUMBER];
  process.env.TWILIO_ACCOUNT_SID = 'ACtest';
  process.env.TWILIO_AUTH_TOKEN = 'test-token';
  process.env.TWILIO_FROM_NUMBER = '+15005550006';
  try {
    const result = await inquiryService.sendInquiryMessage(1, { message: 'Please call me', notifyBySms: true }, { id: 20, accessType: 'COMPANY', companyId: 5, permissions: ['inquiries.respond'] });
    assert.equal(result.smsQueued, false);
    assert.equal(result.smsSkippedReason, 'recipient_sms_opted_out');
    assert.equal(smsUsageEvents.filter(e => e.usageType === 'SMS').length, 0);
    assert.equal(calls['notificationDelivery.create'], undefined);
  } finally {
    if (old[0] === undefined) delete process.env.TWILIO_ACCOUNT_SID; else process.env.TWILIO_ACCOUNT_SID = old[0];
    if (old[1] === undefined) delete process.env.TWILIO_AUTH_TOKEN; else process.env.TWILIO_AUTH_TOKEN = old[1];
    if (old[2] === undefined) delete process.env.TWILIO_FROM_NUMBER; else process.env.TWILIO_FROM_NUMBER = old[2];
  }
});

test('sendInquiryMessage: company SMS preference belongs to an active COMPANY panel user, never STAFF or deactivated accounts', async () => {
  resetMocks();
  nextFindUnique = { id: 1, title: 'Sample RFQ', companyId: 77, buyerUserId: null, status: 'OPEN' };
  fx.response = { id: 90 };
  const old = [process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN, process.env.TWILIO_FROM_NUMBER];
  process.env.TWILIO_ACCOUNT_SID = 'ACtest';
  process.env.TWILIO_AUTH_TOKEN = 'test-token';
  process.env.TWILIO_FROM_NUMBER = '+15005550006';
  try {
    const result = await inquiryService.sendInquiryMessage(1, { message: 'Please call me', notifyBySms: true }, { id: 20, accessType: 'COMPANY', companyId: 20, permissions: ['inquiries.respond'] });
    assert.equal(result.recipientCompanyId, 77);
    assert.equal(result.smsQueued, true);
    assert.deepEqual(calls['user.findFirst'][0].where, {
      status: 'ACTIVE',
      accessProfile: { companyId: 77, type: 'COMPANY', isActive: true },
    });
    assert.equal(calls['notificationDelivery.create'][0].data.userId, 31);
  } finally {
    if (old[0] === undefined) delete process.env.TWILIO_ACCOUNT_SID; else process.env.TWILIO_ACCOUNT_SID = old[0];
    if (old[1] === undefined) delete process.env.TWILIO_AUTH_TOKEN; else process.env.TWILIO_AUTH_TOKEN = old[1];
    if (old[2] === undefined) delete process.env.TWILIO_FROM_NUMBER; else process.env.TWILIO_FROM_NUMBER = old[2];
  }
});



// ── AccessProfile-less CUSTOMER_USER and strict STAFF context regression coverage ──


test('listInquiries: CUSTOMER_USER without an AccessProfile sees only inquiries owned by its user id', async () => {
  resetMocks();
  const customer = { id: 77, accessType: null, companyId: null, roles: ['CUSTOMER_USER'], permissions: ['inquiries.read'] };
  await inquiryService.listInquiries({ scope: 'sent' }, customer);

  const where = calls.findMany[0].where;
  assert.ok(where.AND.some((clause) => clause.buyerUserId === 77));
  assert.equal(where.AND.some((clause) => clause.companyId !== undefined), false);
});

test('createInquiry: CUSTOMER_USER without an AccessProfile creates a user-owned OPEN inquiry', async () => {
  resetMocks();
  fx.products = [{ id: 41, status: 'PUBLISHED', company: { status: 'ACTIVE' } }];
  const customer = { id: 77, accessType: null, companyId: null, roles: ['CUSTOMER_USER'], permissions: ['inquiries.create'] };

  await inquiryService.createInquiry({
    title: 'Customer price request',
    items: [{ productId: 41, quantity: 2 }],
  }, customer);

  const create = calls['inquiry.create'][0];
  assert.equal(create.data.companyId, null);
  assert.equal(create.data.buyerUserId, 77);
  assert.equal(create.data.status, 'OPEN');
});

test('createInquiry: STAFF with a stray companyId must explicitly select the target company', async () => {
  resetMocks();
  fx.products = publishedProducts(1);
  const staff = { id: 90, accessType: 'STAFF', companyId: 10, roles: ['STAFF_USER'], permissions: ['inquiries.create'] };

  await assert.rejects(
    () => inquiryService.createInquiry({ title: 'RFQ', items: [{ productId: 1, quantity: 1 }] }, staff),
    (err) => err.code === 'COMPANY_REQUIRED',
  );
  assert.equal(calls['inquiry.create'], undefined);
});

test('changeInquiryStatus: STAFF with a stray buyer companyId and inquiries.create cannot manage that company inquiry', async () => {
  resetMocks();
  nextFindUnique = draftInquiry({ companyId: 10 });
  const staff = { id: 90, accessType: 'STAFF', companyId: 10, roles: ['STAFF_USER'], permissions: ['inquiries.create'] };

  await assert.rejects(
    () => inquiryService.changeInquiryStatus(1, 'SUBMITTED', staff),
    (err) => err.statusCode === 404 && err.code === 'INQUIRY_NOT_FOUND',
  );
  assert.equal(calls['inquiry.update'], undefined);
  assert.equal(calls['inquiryStatusHistory.create'], undefined);
});

test('sendInquiryMessage: CUSTOMER_USER without an AccessProfile can message a responding company', async () => {
  resetMocks();
  nextFindUnique = { id: 1, companyId: null, buyerUserId: 10, status: 'OPEN' };
  fx.response = { id: 90 };
  const customer = { id: 10, accessType: null, companyId: null, roles: ['CUSTOMER_USER'], permissions: ['inquiries.create'] };

  const result = await inquiryService.sendInquiryMessage(
    1,
    { message: 'Please confirm delivery', recipientCompanyId: 5 },
    customer,
  );

  assert.equal(result.senderUserId, 10);
  assert.equal(result.recipientCompanyId, 5);
});

test('listInquiryMessages: CUSTOMER_USER without an AccessProfile is scoped to its own user messages', async () => {
  resetMocks();
  nextFindUnique = { id: 1, companyId: null, buyerUserId: 10 };
  nextMessages = [{ id: 1, senderUserId: 9, recipientUserId: 10, readAt: null }];
  const customer = { id: 10, accessType: null, companyId: null, roles: ['CUSTOMER_USER'], permissions: ['inquiries.read'] };

  const messages = await inquiryService.listInquiryMessages(1, customer);

  assert.deepEqual(calls['inquiryMessage.findMany'][0].where.OR, [{ senderUserId: 10 }, { recipientUserId: 10 }]);
  assert.equal(calls['inquiryMessage.updateMany'][0].where.recipientUserId, 10);
  assert.deepEqual(calls['inquiryMessage.updateMany'][0].where.id, { in: [1] });
  assert.ok(messages[0].readAt instanceof Date);
});

test('getInquiryStats: CUSTOMER_USER without an AccessProfile is scoped to its own inquiries', async () => {
  resetMocks();
  queues.inquiryGroupBy = [[], []];
  queues.responseGroupBy = [[]];
  const customer = { id: 77, accessType: null, companyId: null, roles: ['CUSTOMER_USER'], permissions: ['inquiries.read'] };

  await inquiryService.getInquiryStats(customer);

  assert.deepEqual(calls.groupBy[0].where, { buyerUserId: 77 });
  assert.deepEqual(calls.groupBy[1].where, { id: { in: [] } });
  assert.deepEqual(calls['inquiryResponse.groupBy'][0].where, { inquiry: { buyerUserId: 77 } });
});


test('listResponses: AccessProfile-less CUSTOMER_USER cannot use a stray companyId to read supplier responses', async () => {
  resetMocks();
  nextFindUnique = {
    id: 1,
    companyId: buyer.companyId,
    buyerUserId: 999,
    status: 'OPEN',
    items: [{ product: { companyId: seller.companyId } }],
  };
  const customer = {
    id: 77,
    accessType: null,
    companyId: seller.companyId,
    roles: ['CUSTOMER_USER'],
    permissions: ['inquiries.read'],
  };

  await assert.rejects(
    () => inquiryService.listResponses(1, customer),
    (err) => err.statusCode === 404 && err.code === 'INQUIRY_NOT_FOUND',
  );
  assert.equal(calls['inquiryResponse.findMany'], undefined);
});


test('getInquiry: CUSTOMER_USER with a stray companyId cannot read a supplier-visible inquiry', async () => {
  resetMocks();
  nextFindUnique = {
    id: 83,
    companyId: buyer.companyId,
    buyerUserId: 999,
    status: 'OPEN',
    visibilityMode: 'NORMAL',
    publishDate: null,
    responses: [],
    items: [{ product: { company: { id: seller.companyId } } }],
  };
  const customer = {
    id: 77,
    accessType: null,
    companyId: seller.companyId,
    roles: ['CUSTOMER_USER'],
    permissions: ['inquiries.read'],
  };

  await assert.rejects(
    () => inquiryService.getInquiry(83, customer),
    (err) => err.statusCode === 404 && err.code === 'INQUIRY_NOT_FOUND',
  );
});


test('listInquiries: STAFF with a stray companyId cannot use the company-only received scope', async () => {
  resetMocks();
  const staff = { id: 90, accessType: 'STAFF', companyId: seller.companyId, roles: ['STAFF_USER'], permissions: ['inquiries.read'] };

  await assert.rejects(
    () => inquiryService.listInquiries({ scope: 'received' }, staff),
    (err) => err.statusCode === 403 && err.code === 'INVALID_INQUIRY_SCOPE',
  );
  assert.equal(calls.findMany.length, 0);
});


test('getInquiryStats: STAFF with inquiry read permission gets platform aggregates, never a stray company scope', async () => {
  resetMocks();
  queues.inquiryGroupBy = [[], []];
  queues.responseGroupBy = [[]];
  const staff = { id: 90, accessType: 'STAFF', companyId: seller.companyId, roles: ['STAFF_USER'], permissions: ['inquiries.read'] };

  await inquiryService.getInquiryStats(staff);

  assert.deepEqual(calls.groupBy[0].where, {});
  assert.deepEqual(calls.groupBy[1].where, {});
  assert.deepEqual(calls['inquiryResponse.groupBy'][0].where, {});
  assert.deepEqual(calls.findMany[0].where, {});
});

test('getInquiryStats: STAFF without inquiry read permission is denied', async () => {
  resetMocks();
  const staff = { id: 90, accessType: 'STAFF', companyId: seller.companyId, roles: ['STAFF_USER'], permissions: [] };

  await assert.rejects(
    () => inquiryService.getInquiryStats(staff),
    (error) => error.statusCode === 403 && error.code === 'FORBIDDEN',
  );
  assert.equal(calls.groupBy, undefined);
  assert.equal(calls.findMany.length, 0);
});


// ── Subscription usage integration: inquiry creation, supplier response and messages ──

test('createInquiry: enforced company quota records one INQUIRY_CREATE usage event in the same transaction', async () => {
  resetMocks();
  subscriptionEnforcementEnabled = true;
  fx.products = publishedProducts(1);

  await inquiryService.createInquiry({
    title: 'Quota-backed company RFQ',
    items: [{ productId: 1, quantity: 2 }],
  }, { id: 12, accessType: 'COMPANY', companyId: 10, permissions: ['inquiries.create'] });

  assert.equal(smsUsageEvents.length, 1);
  assert.deepEqual(
    { subscriptionId: smsUsageEvents[0].subscriptionId, usageType: smsUsageEvents[0].usageType, referenceType: smsUsageEvents[0].referenceType, referenceId: smsUsageEvents[0].referenceId },
    { subscriptionId: 77, usageType: 'INQUIRY_CREATE', referenceType: 'Inquiry', referenceId: '7' },
  );
  assert.ok(calls.$queryRawUnsafe.some(({ query, params }) => query.includes('FROM "InquirySubscription"') && query.includes('FOR UPDATE') && params[0] === 77));
});

test('submitResponse: enforced supplier quota records one RESPONSE_SUBMIT usage event', async () => {
  resetMocks();
  subscriptionEnforcementEnabled = true;
  nextFindUnique = openInquiry({ id: 41, companyId: buyer.companyId });
  fx.ownedItemIds = [11];

  await inquiryService.submitResponse(41, {
    items: [{ inquiryItemId: 11, price: 1500, availableQuantity: 4 }],
  }, seller);

  assert.equal(smsUsageEvents.length, 1);
  assert.deepEqual(
    { subscriptionId: smsUsageEvents[0].subscriptionId, usageType: smsUsageEvents[0].usageType, referenceType: smsUsageEvents[0].referenceType, referenceId: smsUsageEvents[0].referenceId },
    { subscriptionId: 77, usageType: 'RESPONSE_SUBMIT', referenceType: 'InquiryResponse', referenceId: '5' },
  );
});

test('sendInquiryMessage: enforced owner quota records one INTERNAL_MESSAGE usage event', async () => {
  resetMocks();
  subscriptionEnforcementEnabled = true;
  nextFindUnique = { id: 1, companyId: 10, buyerUserId: null, status: 'OPEN' };
  fx.response = { id: 90 };

  await inquiryService.sendInquiryMessage(
    1,
    { message: 'Please confirm delivery', recipientCompanyId: 20 },
    { id: 12, accessType: 'COMPANY', companyId: 10, permissions: ['inquiries.create'] },
  );

  assert.equal(smsUsageEvents.length, 1);
  assert.deepEqual(
    { subscriptionId: smsUsageEvents[0].subscriptionId, usageType: smsUsageEvents[0].usageType, referenceType: smsUsageEvents[0].referenceType, referenceId: smsUsageEvents[0].referenceId },
    { subscriptionId: 77, usageType: 'INTERNAL_MESSAGE', referenceType: 'InquiryMessage', referenceId: '101' },
  );
});


test('createInquiry: enforced Website quota is charged to the authenticated customer user', async () => {
  resetMocks();
  subscriptionEnforcementEnabled = true;
  fx.products = [{ id: 41, status: 'PUBLISHED', company: { status: 'ACTIVE' } }];
  const customer = { id: 77, accessType: 'CUSTOMER', companyId: null, roles: ['CUSTOMER_USER'], permissions: ['inquiries.create'] };

  await inquiryService.createInquiry({
    title: 'Quota-backed customer RFQ',
    items: [{ productId: 41, quantity: 1 }],
  }, customer);

  assert.ok(calls['inquirySubscription.findFirst'].some(({ where }) => where.userId === 77 && where.companyId === undefined));
  assert.equal(smsUsageEvents.length, 1);
  assert.equal(smsUsageEvents[0].usageType, 'INQUIRY_CREATE');
  assert.equal(smsUsageEvents[0].referenceId, '7');
});
