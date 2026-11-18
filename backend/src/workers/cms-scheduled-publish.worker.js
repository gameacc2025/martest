// CMS Scheduled Publish Worker
//
// Auto-publishes SCHEDULED articles when their scheduledAt <= now.
// Runs as a background worker (separate process or interval in server.js).

const prisma = require('../config/db');

const intervalMs = Math.max(1000, Number(process.env.CMS_SCHEDULED_WORKER_INTERVAL_MS) || 60000);
const batchSize = Math.min(100, Math.max(1, Number(process.env.CMS_SCHEDULED_WORKER_BATCH_SIZE) || 50));
let stopping = false;

async function runOnce() {
  const now = new Date();

  // Find SCHEDULED articles whose scheduledAt has passed
  const articles = await prisma.article.findMany({
    where: {
      status: 'SCHEDULED',
      scheduledAt: { lte: now },
    },
    select: { id: true, slug: true, scheduledAt: true },
    take: batchSize,
    orderBy: { scheduledAt: 'asc' },
  });

  if (articles.length === 0) {
    return { processed: 0, published: 0 };
  }

  let published = 0;
  for (const article of articles) {
    try {
      await prisma.$transaction(async (tx) => {
        // Update article status to PUBLISHED
        const updated = await tx.article.update({
          where: { id: article.id },
          data: {
            status: 'PUBLISHED',
            publishedAt: now,
            // publishedByUserId will be the system user or we can leave it null
            // since it's an automated publish
          },
        });

        // Create a revision for the auto-publish
        const nextRevisionNo = await tx.articleRevision.count({ where: { articleId: article.id } }) + 1;
        await tx.articleRevision.create({
          data: {
            articleId: article.id,
            editorUserId: updated.authorUserId, // Use original author as editor
            revisionNo: nextRevisionNo,
            snapshot: JSON.parse(JSON.stringify({
              ...updated,
              status: 'PUBLISHED',
              publishedAt: now,
            })),
            changeNote: 'انتشار خودکار بر اساس زمان‌بندی',
          },
        });
      });
      published++;
    } catch (error) {
      console.error(`[cms-scheduled-worker] Failed to publish article ${article.id} (${article.slug}):`, error?.message || error);
    }
  }

  return { processed: articles.length, published };
}

async function main() {
  console.log(`[cms-scheduled-worker] started; interval=${intervalMs}ms batch=${batchSize}`);
  while (!stopping) {
    const startedAt = Date.now();
    try {
      const result = await runOnce();
      if (result.published > 0) {
        console.log(`[cms-scheduled-worker] batch completed`, JSON.stringify(result));
      }
    } catch (error) {
      console.error('[cms-scheduled-worker] batch failed', error?.message || error);
    }
    if (!stopping) {
      const waitMs = Math.max(0, intervalMs - (Date.now() - startedAt));
      await new Promise((resolve) => setTimeout(resolve, waitMs));
    }
  }
  await prisma.$disconnect();
  console.log('[cms-scheduled-worker] stopped');
}

function stop(signal) {
  if (stopping) return;
  stopping = true;
  console.log(`[cms-scheduled-worker] received ${signal}; stopping after current batch`);
}

if (require.main === module) {
  process.on('SIGINT', () => stop('SIGINT'));
  process.on('SIGTERM', () => stop('SIGTERM'));

  main().catch(async (error) => {
    console.error('[cms-scheduled-worker] fatal error', error?.message || error);
    await prisma.$disconnect();
    process.exitCode = 1;
  });
}

module.exports = { runOnce, main };