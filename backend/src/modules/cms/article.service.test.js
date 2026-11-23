const test = require('node:test');
const assert = require('node:assert/strict');

const dbPath = require.resolve('../../config/db');
const servicePath = require.resolve('./article.service');
const auditPath = require.resolve('../audit/audit.service');
const previousDb = require.cache[dbPath];
const previousService = require.cache[servicePath];
const previousAudit = require.cache[auditPath];
const auditCalls = [];
const calls = { findMany: [], count: [], articleFindFirst: [], articleFindUnique: [], articleCreate: [], articleUpdate: [], categoryDelete: [], tagDelete: [], revisionCount: [], revisionCreate: [], revisionFindUnique: [], transactions: [] };
// Shared relationship/revision fixtures are declared before mockPrisma.

const fx = {
  articleById: { id: 5, slug: 'old-title', title: 'Old title', status: 'DRAFT', isIndexable: true },
  revision: null,
  revisionError: null,
  inactiveCategoryIds: [],
  missingCategoryIds: [],
  missingTagIds: [],
};
const mockPrisma = {
  articleCategory: {
    findMany: async (args) => (args.where.id.in || []).filter((id) =>
      !fx.missingCategoryIds.includes(Number(id))
      && (!args.where.isActive || !fx.inactiveCategoryIds.includes(Number(id)))
    ).map((id) => ({ id: Number(id) })),
  },
  articleTag: {
    findMany: async (args) => (args.where.id.in || []).filter((id) => !fx.missingTagIds.includes(Number(id))).map((id) => ({ id: Number(id) })),
  },
  article: {
    findMany: async (args) => {
      calls.findMany.push(args);
      return [];
    },
    count: async (args) => {
      calls.count.push(args);
      return 0;
    },
    findFirst: async (args) => { calls.articleFindFirst.push(args); return null; },
    findUnique: async (args) => { calls.articleFindUnique.push(args); return { ...fx.articleById }; },
    create: async (args) => {
      calls.articleCreate.push(args);
      return { id: 100, ...args.data, createdAt: new Date('2026-11-19T10:00:00.000Z'), updatedAt: new Date('2026-11-19T10:00:00.000Z') };
    },
    update: async (args) => {
      calls.articleUpdate.push(args);
      return { ...fx.articleById, ...args.data, createdAt: new Date('2026-11-19T10:00:00.000Z'), updatedAt: new Date('2026-11-19T11:00:00.000Z') };
    },
  },
  articleCategoryAssignment: {
    deleteMany: async (args) => { calls.categoryDelete.push(args); return { count: 1 }; },
  },
  articleTagAssignment: {
    deleteMany: async (args) => { calls.tagDelete.push(args); return { count: 1 }; },
  },
  articleRevision: {
    count: async (args) => { calls.revisionCount.push(args); return 2; },
    findUnique: async (args) => { calls.revisionFindUnique.push(args); return fx.revision; },
    create: async (args) => {
      calls.revisionCreate.push(args);
      if (fx.revisionError) throw fx.revisionError;
      return { id: calls.revisionCreate.length, ...args.data };
    },
  },
  $transaction: async (callback) => {
    calls.transactions.push(true);
    return callback(mockPrisma);
  },
};

require.cache[dbPath] = {
  id: dbPath,
  filename: dbPath,
  loaded: true,
  exports: mockPrisma,
};
require.cache[auditPath] = {
  id: auditPath,
  filename: auditPath,
  loaded: true,
  exports: {
    recordAuditLogExplicit: async (entry) => {
      auditCalls.push(entry);
      return { id: auditCalls.length };
    },
  },
};
delete require.cache[servicePath];
const articleService = require('./article.service');

test.after(() => {
  delete require.cache[servicePath];
  if (previousService) require.cache[servicePath] = previousService;
  if (previousDb) require.cache[dbPath] = previousDb;
  else delete require.cache[dbPath];
  if (previousAudit) require.cache[auditPath] = previousAudit;
  else delete require.cache[auditPath];
});

test('restoreRevision restores category and tag assignments from the selected revision atomically', async () => {
  calls.transactions.length = 0;
  calls.categoryDelete.length = 0;
  calls.tagDelete.length = 0;
  calls.articleUpdate.length = 0;
  calls.revisionCreate.length = 0;
  auditCalls.length = 0;
  fx.articleById = { id: 5, slug: 'old-title', title: 'Old title', status: 'DRAFT', isIndexable: true };
  fx.revision = {
    articleId: 5,
    revisionNo: 1,
    changeNote: 'original taxonomy',
    snapshot: {
      title: 'Old title',
      status: 'DRAFT',
      categories: [{ category: { id: 3 }, sortOrder: 4 }],
      tags: [{ tag: { id: 8 } }],
    },
  };

  const restored = await articleService.restoreRevision(5, 1, 42);

  assert.equal(restored.id, 5);
  assert.deepEqual(calls.categoryDelete.at(-1).where, { articleId: 5 });
  assert.deepEqual(calls.tagDelete.at(-1).where, { articleId: 5 });
  assert.deepEqual(calls.articleUpdate.at(-1).data.categories.create, [{ categoryId: 3, sortOrder: 4 }]);
  assert.deepEqual(calls.articleUpdate.at(-1).data.tags.create, [{ tagId: 8 }]);
  assert.equal(calls.revisionCreate.at(-1).data.revisionNo, 3);
  assert.equal(auditCalls.at(-1).action, 'CMS_ARTICLE_REVISION_RESTORED');
  assert.equal(auditCalls.at(-1).actorUserId, 42);
  assert.equal(auditCalls.at(-1).tx, mockPrisma);
});


test('public article selection excludes inactive category relationships without unpublishing the article', async () => {
  calls.findMany.length = 0;
  await articleService.listPublic();
  const categories = calls.findMany[0].select.categories;
  assert.deepEqual(categories.where, { category: { isActive: true } });
});

test('createArticle rejects inactive category assignments before creating an article', async () => {
  calls.articleCreate.length = 0;
  calls.transactions.length = 0;
  auditCalls.length = 0;
  fx.inactiveCategoryIds = [3];
  try {
    await assert.rejects(
      () => articleService.createArticle({ title: 'Inactive category article', content: 'x', categories: [{ categoryId: 3 }] }, 12),
      (error) => error.code === 'INVALID_ARTICLE_CATEGORY' && error.statusCode === 400,
    );
    assert.equal(calls.articleCreate.length, 0);
    assert.equal(auditCalls.length, 0);
  } finally {
    fx.inactiveCategoryIds = [];
  }
});

test('createArticle rejects duplicate category and tag assignments with a validation error', async () => {
  await assert.rejects(
    () => articleService.createArticle({ title: 'Duplicate category', content: 'x', categories: [{ categoryId: 3 }, { categoryId: 3 }] }, 12),
    (error) => error.code === 'DUPLICATE_ARTICLE_CATEGORY',
  );
  await assert.rejects(
    () => articleService.createArticle({ title: 'Duplicate tags', content: 'x', tags: [8, 8] }, 12),
    (error) => error.code === 'DUPLICATE_ARTICLE_TAG',
  );
});

test('restoreRevision preserves extant inactive categories but skips deleted category/tag relations', async () => {
  calls.articleUpdate.length = 0;
  fx.revision = {
    articleId: 5,
    revisionNo: 2,
    changeNote: 'older taxonomy',
    snapshot: {
      title: 'Old title',
      status: 'DRAFT',
      categories: [{ category: { id: 3 }, sortOrder: 4 }, { category: { id: 7 }, sortOrder: 8 }],
      tags: [{ tag: { id: 8 } }, { tag: { id: 9 } }],
    },
  };
  fx.missingCategoryIds = [7];
  fx.missingTagIds = [9];
  try {
    await articleService.restoreRevision(5, 2, 42);
    const data = calls.articleUpdate.at(-1).data;
    assert.deepEqual(data.categories.create, [{ categoryId: 3, sortOrder: 4 }]);
    assert.deepEqual(data.tags.create, [{ tagId: 8 }]);
  } finally {
    fx.revision = null;
    fx.missingCategoryIds = [];
    fx.missingTagIds = [];
  }
});

test('public article search preserves the publication window and combines it with search using AND', async () => {
  calls.findMany.length = 0;
  calls.count.length = 0;

  await articleService.listPublic({ search: 'fiber optic', category: 'networking', tag: 'fiber', type: 'ARTICLE' });

  const query = calls.findMany[0].where;
  assert.equal(query.status, 'PUBLISHED');
  assert.equal(query.OR, undefined);
  assert.equal(query.AND.length, 2);
  assert.deepEqual(query.AND[0].OR[1], { publishedAt: null });
  assert.ok(query.AND[0].OR[0].publishedAt.lte instanceof Date);
  assert.deepEqual(query.AND[1].OR, [
    { title: { contains: 'fiber optic', mode: 'insensitive' } },
    { excerpt: { contains: 'fiber optic', mode: 'insensitive' } },
    { content: { contains: 'fiber optic', mode: 'insensitive' } },
  ]);
  assert.deepEqual(query.categories, { some: { category: { slug: 'networking', isActive: true } } });
  assert.deepEqual(query.tags, { some: { tag: { slug: 'fiber' } } });
  assert.equal(query.type, 'ARTICLE');
  assert.deepEqual(calls.count[0].where, query);
});

test('public article listing without search still requires a published article within its publication window', async () => {
  calls.findMany.length = 0;
  calls.count.length = 0;

  await articleService.listPublic();

  const query = calls.findMany[0].where;
  assert.equal(query.status, 'PUBLISHED');
  assert.equal(query.AND.length, 1);
  assert.ok(query.AND[0].OR[0].publishedAt.lte instanceof Date);
  assert.deepEqual(query.AND[0].OR[1], { publishedAt: null });
  assert.deepEqual(calls.count[0].where, query);
});


test('createArticle persists the article and its JSON-safe revision in one transaction', async () => {
  calls.transactions.length = 0;
  calls.articleCreate.length = 0;
  calls.revisionCreate.length = 0;
  auditCalls.length = 0;

  const article = await articleService.createArticle({
    title: 'Fiber systems',
    content: { blocks: [{ type: 'paragraph', text: 'Content' }] },
    categories: [{ categoryId: 3, sortOrder: 4 }],
    tags: [8],
  }, 12);

  assert.equal(article.id, 100);
  assert.equal(calls.transactions.length, 1);
  assert.equal(calls.articleCreate.length, 1);
  assert.deepEqual(calls.articleCreate[0].data.categories.create, [{ categoryId: 3, sortOrder: 4 }]);
  assert.equal(calls.revisionCreate.length, 1);
  assert.equal(calls.revisionCreate[0].data.articleId, 100);
  assert.equal(calls.revisionCreate[0].data.revisionNo, 1);
  assert.equal(auditCalls.length, 1);
  assert.equal(auditCalls[0].action, 'CMS_ARTICLE_CREATED');
  assert.equal(auditCalls[0].entityType, 'Article');
  assert.equal(auditCalls[0].entityId, 100);
  assert.equal(auditCalls[0].actorUserId, 12);
  assert.equal(auditCalls[0].tx, mockPrisma);
  assert.deepEqual(auditCalls[0].metadata, { status: 'DRAFT', type: 'ARTICLE', revisionNo: 1 });
  assert.equal(calls.revisionCreate[0].data.snapshot.createdAt, '2026-11-19T10:00:00.000Z');
  assert.doesNotThrow(() => JSON.stringify(calls.revisionCreate[0].data.snapshot));
});

test('updateArticle replaces categories, tags, article fields and revision atomically', async () => {
  calls.transactions.length = 0;
  calls.articleFindFirst.length = 0;
  calls.articleFindUnique.length = 0;
  calls.articleUpdate.length = 0;
  calls.categoryDelete.length = 0;
  calls.tagDelete.length = 0;
  calls.revisionCount.length = 0;
  calls.revisionCreate.length = 0;
  auditCalls.length = 0;

  const article = await articleService.updateArticle(5, {
    title: 'Updated title',
    categories: [{ categoryId: 11, sortOrder: 2 }],
    tags: [22],
    changeNote: 'taxonomy refresh',
  }, 42);

  assert.equal(article.id, 5);
  assert.equal(calls.transactions.length, 1);
  assert.deepEqual(calls.categoryDelete[0].where, { articleId: 5 });
  assert.deepEqual(calls.tagDelete[0].where, { articleId: 5 });
  assert.equal(calls.articleUpdate[0].data.slug, 'updated-title');
  assert.deepEqual(calls.articleUpdate[0].data.categories.create, [{ categoryId: 11, sortOrder: 2 }]);
  assert.equal(calls.articleUpdate[0].data.tags.create[0].tagId, 22);
  assert.equal(calls.revisionCount[0].where.articleId, 5);
  assert.equal(calls.revisionCreate[0].data.revisionNo, 3);
  assert.equal(calls.revisionCreate[0].data.changeNote, 'taxonomy refresh');
  assert.equal(auditCalls.length, 1);
  assert.equal(auditCalls[0].action, 'CMS_ARTICLE_UPDATED');
  assert.equal(auditCalls[0].entityId, 5);
  assert.equal(auditCalls[0].actorUserId, 42);
  assert.equal(auditCalls[0].tx, mockPrisma);
  assert.deepEqual(auditCalls[0].metadata.changedFields.sort(), ['categories', 'slug', 'tags', 'title']);
  assert.equal(auditCalls[0].metadata.revisionNo, 3);
  assert.equal(calls.revisionCreate[0].data.snapshot.updatedAt, '2026-11-19T11:00:00.000Z');
});

test('updateArticle propagates revision failure so the surrounding transaction can roll back all changes', async () => {
  calls.transactions.length = 0;
  calls.articleUpdate.length = 0;
  calls.revisionCreate.length = 0;
  fx.revisionError = new Error('revision storage failed');

  try {
    await assert.rejects(
      () => articleService.updateArticle(5, { excerpt: 'changed' }, 42),
      /revision storage failed/,
    );
    assert.equal(calls.transactions.length, 1);
    assert.equal(calls.articleUpdate.length, 1);
    assert.equal(calls.revisionCreate.length, 1);
  } finally {
    fx.revisionError = null;
  }
});


test('slugify preserves Persian and mixed-script article titles', () => {
  assert.equal(articleService.slugify('راهنمای انتخاب کابل فیبر نوری'), 'راهنمای-انتخاب-کابل-فیبر-نوری');
  assert.equal(articleService.slugify('Fiber نوری 2026'), 'fiber-نوری-2026');
  assert.equal(articleService.slugify('🔥'), 'item');
});
