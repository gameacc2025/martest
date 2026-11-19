const test = require('node:test');
const assert = require('node:assert/strict');

const dbPath = require.resolve('../../config/db');
const servicePath = require.resolve('./article.service');
const previousDb = require.cache[dbPath];
const previousService = require.cache[servicePath];
const calls = { findMany: [], count: [] };

const mockPrisma = {
  article: {
    findMany: async (args) => {
      calls.findMany.push(args);
      return [];
    },
    count: async (args) => {
      calls.count.push(args);
      return 0;
    },
  },
};

require.cache[dbPath] = {
  id: dbPath,
  filename: dbPath,
  loaded: true,
  exports: mockPrisma,
};
delete require.cache[servicePath];
const articleService = require('./article.service');

test.after(() => {
  delete require.cache[servicePath];
  if (previousService) require.cache[servicePath] = previousService;
  if (previousDb) require.cache[dbPath] = previousDb;
  else delete require.cache[dbPath];
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
  assert.deepEqual(query.categories, { some: { category: { slug: 'networking' } } });
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
