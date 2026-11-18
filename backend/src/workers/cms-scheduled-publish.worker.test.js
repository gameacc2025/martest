const test = require('node:test');
const assert = require('node:assert/strict');

function loadWorkerWith(prismaMock) {
  const dbPath = require.resolve('../config/db');
  const workerPath = require.resolve('./cms-scheduled-publish.worker');
  const previousDb = require.cache[dbPath];
  const previousWorker = require.cache[workerPath];

  require.cache[dbPath] = {
    id: dbPath,
    filename: dbPath,
    loaded: true,
    exports: prismaMock,
  };
  delete require.cache[workerPath];

  return {
    worker: require(workerPath),
    restore() {
      delete require.cache[workerPath];
      if (previousWorker) require.cache[workerPath] = previousWorker;
      if (previousDb) require.cache[dbPath] = previousDb;
      else delete require.cache[dbPath];
    },
  };
}

test('runOnce selects due scheduled articles using fields present in the Article model', async () => {
  let findArgs;
  const prisma = {
    article: {
      findMany: async (args) => {
        findArgs = args;
        return [];
      },
    },
  };
  const beforeSigint = process.listenerCount('SIGINT');
  const beforeSigterm = process.listenerCount('SIGTERM');
  const loaded = loadWorkerWith(prisma);

  try {
    const result = await loaded.worker.runOnce();

    assert.deepEqual(result, { processed: 0, published: 0 });
    assert.equal(findArgs.where.status, 'SCHEDULED');
    assert.ok(findArgs.where.scheduledAt.lte instanceof Date);
    assert.equal(Object.hasOwn(findArgs.where, 'isActive'), false);
    assert.equal(process.listenerCount('SIGINT'), beforeSigint);
    assert.equal(process.listenerCount('SIGTERM'), beforeSigterm);
  } finally {
    loaded.restore();
  }
});

test('runOnce publishes due articles and stores a JSON-safe revision snapshot', async () => {
  const scheduledAt = new Date('2026-11-18T04:00:00.000Z');
  const article = { id: 12, slug: 'scheduled-article', scheduledAt };
  let updateArgs;
  let revisionData;
  const updatedArticle = {
    id: 12,
    slug: article.slug,
    title: 'Scheduled article',
    content: { blocks: [{ type: 'paragraph', text: 'Published' }] },
    status: 'PUBLISHED',
    authorUserId: 7,
    scheduledAt,
    publishedAt: new Date('2026-11-18T05:00:00.000Z'),
    createdAt: new Date('2026-11-17T10:00:00.000Z'),
    updatedAt: new Date('2026-11-18T05:00:00.000Z'),
  };
  const tx = {
    article: {
      update: async (args) => {
        updateArgs = args;
        return updatedArticle;
      },
    },
    articleRevision: {
      count: async () => 2,
      create: async ({ data }) => {
        revisionData = data;
        return { id: 44, ...data };
      },
    },
  };
  const prisma = {
    article: { findMany: async () => [article] },
    $transaction: async (callback) => callback(tx),
  };
  const loaded = loadWorkerWith(prisma);

  try {
    const result = await loaded.worker.runOnce();

    assert.deepEqual(result, { processed: 1, published: 1 });
    assert.equal(updateArgs.where.id, 12);
    assert.equal(updateArgs.data.status, 'PUBLISHED');
    assert.equal(revisionData.articleId, 12);
    assert.equal(revisionData.editorUserId, 7);
    assert.equal(revisionData.revisionNo, 3);
    assert.equal(revisionData.snapshot.status, 'PUBLISHED');
    assert.equal(revisionData.snapshot.publishedAt, updatedArticle.publishedAt.toISOString());
    assert.doesNotThrow(() => JSON.stringify(revisionData.snapshot));
  } finally {
    loaded.restore();
  }
});
