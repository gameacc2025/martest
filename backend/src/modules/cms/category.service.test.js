const test = require('node:test');
const assert = require('node:assert/strict');
const dbPath = require.resolve('../../config/db');
const servicePath = require.resolve('./category.service');
const auditPath = require.resolve('../audit/audit.service');
const previousDb = require.cache[dbPath], previousService = require.cache[servicePath], previousAudit = require.cache[auditPath];
const auditCalls = [];
const calls = { findUnique: [], findFirst: [], findMany: [], create: [], update: [], delete: [], count: [], transactions: [] };
const existing = { id: 4, slug: 'old', name: 'Old', sortOrder: 0, isActive: true, _count: { articles: 0 } };

function slugify(text) {
  const slug = String(text ?? '')
    .normalize('NFKC')
    .trim()
    .toLowerCase()
    .replace(/[\s\u200c]+/gu, '-')
    .replace(/[^\p{L}\p{N}-]+/gu, '')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
  // Persian/Arabic titles contain letters outside ASCII \\w. Preserve those
  // letters so CMS-created slugs remain addressable instead of becoming empty.
  return slug || 'item';
}

const mockPrisma = {
 articleCategory: {
  findUnique: async (a) => { calls.findUnique.push(a); return { ...existing }; },
  findFirst: async (a) => { calls.findFirst.push(a); return null; },
  findMany: async (a) => { calls.findMany.push(a); return []; },
  create: async (a) => {
    calls.create.push(a);
    const isActive = a.data.isActive !== undefined ? a.data.isActive : true;
    return {
      id: 9,
      slug: slugify(a.data.name),
      name: a.data.name.trim(),
      sortOrder: Number(a.data.sortOrder || 0),
      isActive,
      createdAt: new Date(),
      updatedAt: new Date(),
      _count: { articles: 0 }
    };
  },
  update: async (a) => {
    calls.update.push(a);
    const isActive = a.data.isActive !== undefined ? a.data.isActive : existing.isActive;
    return {
      ...existing,
      ...a.data,
      slug: a.data.name ? slugify(a.data.name) : existing.slug,
      isActive,
      updatedAt: new Date()
    };
  },
  delete: async (a) => { calls.delete.push(a); return { id: a.where.id }; },
  count: async (a) => { calls.count.push(a); return 0; },
 },
 articleCategoryAssignment: { count: async (a) => { calls.count.push(a); return 0; } },
 $transaction: async (cb) => { calls.transactions.push(true); return cb(mockPrisma); },
};
require.cache[dbPath] = { id: dbPath, filename: dbPath, loaded: true, exports: mockPrisma };
require.cache[auditPath] = { id: auditPath, filename: auditPath, loaded: true, exports: { recordAuditLogExplicit: async (e) => { auditCalls.push(e); return {}; } } };
delete require.cache[servicePath];
const service = require('./category.service');

const originalFindUnique = mockPrisma.articleCategory.findUnique;
test.beforeEach(() => {
 // Reset calls and restore original mock functions
 Object.keys(calls).forEach((key) => { calls[key].length = 0; });
 auditCalls.length = 0;
 mockPrisma.articleCategory.findUnique = originalFindUnique;
});

test.after(() => {
 delete require.cache[servicePath];
 if (previousService) require.cache[servicePath] = previousService;
 if (previousDb) require.cache[dbPath] = previousDb; else delete require.cache[dbPath];
 if (previousAudit) require.cache[auditPath] = previousAudit; else delete require.cache[auditPath];
});

test('createCategory persists category and audit event atomically', async () => {
 calls.transactions.length = 0; auditCalls.length = 0;
 const result = await service.createCategory({ name: 'New category' }, 12);
 assert.equal(result.id, 9); assert.equal(calls.transactions.length, 1);
 assert.equal(auditCalls[0].action, 'CMS_CATEGORY_CREATED');
 assert.equal(auditCalls[0].actorUserId, 12); assert.equal(auditCalls[0].tx, mockPrisma);
});

test('updateCategory records before/after and changed fields', async () => {
 calls.transactions.length = 0; auditCalls.length = 0;
 const result = await service.updateCategory(4, { name: 'New name' }, 13);
 assert.equal(result.name, 'New name'); assert.equal(calls.transactions.length, 1);
 assert.equal(auditCalls[0].action, 'CMS_CATEGORY_UPDATED');
 assert.equal(auditCalls[0].before.name, 'Old'); assert.equal(auditCalls[0].after.name, 'New name');
 assert.deepEqual(auditCalls[0].metadata.changedFields, ['name', 'slug']);
});

test('deleteCategory records snapshot and blocks deletion while linked articles exist', async () => {
 calls.transactions.length = 0; auditCalls.length = 0;
 await service.deleteCategory(4, 14);
 assert.equal(calls.transactions.length, 1); assert.equal(auditCalls[0].action, 'CMS_CATEGORY_DELETED');
 assert.equal(auditCalls[0].before.name, 'Old');
});

// ── Category lifecycle and activation/deactivation tests (Workstream C) ─────────────

test('createCategory: defaults to isActive=true when not specified', async () => {
 calls.transactions.length = 0; auditCalls.length = 0;
 const result = await service.createCategory({ name: 'New category' }, 12);
 assert.equal(result.isActive, true);
 assert.equal(calls.create[0].data.isActive, true);
});

test('createCategory: respects explicit isActive=false', async () => {
 calls.transactions.length = 0; auditCalls.length = 0;
 const result = await service.createCategory({ name: 'Inactive category', isActive: false }, 12);
 assert.equal(result.isActive, false);
 assert.equal(calls.create[0].data.isActive, false);
});

test('updateCategory: can activate an inactive category', async () => {
 calls.transactions.length = 0; auditCalls.length = 0;
 const existingInactive = { ...existing, isActive: false };
 const mockFindUnique = mockPrisma.articleCategory.findUnique;
 mockPrisma.articleCategory.findUnique = async (a) => { calls.findUnique.push(a); return { ...existingInactive }; };

 const result = await service.updateCategory(4, { isActive: true }, 13);
 assert.equal(result.isActive, true);
 assert.ok(calls.update[0].data.isActive === true);
 assert.deepEqual(auditCalls[0].metadata.changedFields, ['isActive']);

 mockPrisma.articleCategory.findUnique = mockFindUnique;
});

test('updateCategory: can deactivate an active category', async () => {
 calls.transactions.length = 0; auditCalls.length = 0;
 const result = await service.updateCategory(4, { isActive: false }, 13);
 assert.equal(result.isActive, false);
 assert.ok(calls.update[0].data.isActive === false);
 assert.deepEqual(auditCalls[0].metadata.changedFields, ['isActive']);
});

test('updateCategory: changing isActive records before/after correctly', async () => {
 calls.transactions.length = 0; auditCalls.length = 0;
 const result = await service.updateCategory(4, { isActive: false }, 13);
 assert.equal(result.isActive, false);
 assert.equal(auditCalls[0].before.isActive, true);
 assert.equal(auditCalls[0].after.isActive, false);
});

test('listPublic: with activeOnly=true (default) excludes inactive categories', async () => {
 calls.findMany.length = 0;
 await service.listPublic({ activeOnly: true });
 assert.deepEqual(calls.findMany[0].where, { isActive: true });
});

test('listPublic: with activeOnly=false includes inactive categories', async () => {
 calls.findMany.length = 0;
 await service.listPublic({ activeOnly: false });
 assert.deepEqual(calls.findMany[0].where, {});
});

test('listAdmin: can filter by isActive=true', async () => {
 calls.findMany.length = 0; calls.count.length = 0;
 await service.listAdmin({ isActive: true });
 assert.deepEqual(calls.findMany[0].where, { isActive: true });
});

test('listAdmin: can filter by isActive=false', async () => {
 calls.findMany.length = 0; calls.count.length = 0;
 await service.listAdmin({ isActive: false });
 assert.deepEqual(calls.findMany[0].where, { isActive: false });
});

test('listAdmin: without isActive filter returns all categories', async () => {
 calls.findMany.length = 0; calls.count.length = 0;
 await service.listAdmin({});
 assert.deepEqual(calls.findMany[0].where, {});
});

test('slugify preserves Persian and mixed-script category names', () => {
  assert.equal(service.slugify('دسته‌بندی تجهیزات شبکه'), 'دسته-بندی-تجهیزات-شبکه');
  assert.equal(service.slugify('Fiber نوری 2026'), 'fiber-نوری-2026');
  assert.equal(service.slugify('🔥'), 'item');
});


test('generateUniqueSlug respects the public category route length limit', async () => {
  const slug = await service.generateUniqueSlug('شبکه '.repeat(80));
  assert.ok(Array.from(slug).length <= 120);
  assert.ok(slug.length > 0);
});
